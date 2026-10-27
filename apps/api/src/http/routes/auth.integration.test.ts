import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildServer } from "../../server.js";
import { prisma } from "../../lib/prisma.js";
import { TEST_PASSWORD, signupTestAccount } from "../../test-support/auth-helpers.js";

describe("Auth routes (live Postgres)", () => {
  const app = buildServer();
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await prisma.passwordResetToken.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.session.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await app.close();
  });

  it("signs up, logs in with the real password, and rejects the wrong one", async () => {
    // #given
    const email = `${randomUUID()}@afterpost.test`;

    // #when
    const signup = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: { email, password: TEST_PASSWORD },
    });
    createdUserIds.push(signup.json().user.id);

    const loginOk = await app.inject({
      method: "POST",
      url: "/v1/auth/login",
      payload: { email, password: TEST_PASSWORD },
    });

    const loginWrong = await app.inject({
      method: "POST",
      url: "/v1/auth/login",
      payload: { email, password: "WrongPassword1!" },
    });

    // #then
    expect(signup.statusCode).toBe(201);
    expect(loginOk.statusCode).toBe(200);
    expect(loginOk.json().token).toBeTruthy();
    expect(loginWrong.statusCode).toBe(401);
    expect(loginWrong.json().code).toBe("INVALID_CREDENTIALS");
  });

  it("rejects signup with a weak password (PRD-adjacent standard password policy)", async () => {
    // #given / #when
    const response = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: { email: `${randomUUID()}@afterpost.test`, password: "weak" },
    });
    // #then
    expect(response.statusCode).toBe(400);
  });

  it("rejects a duplicate signup email", async () => {
    // #given
    const email = `${randomUUID()}@afterpost.test`;
    const first = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: { email, password: TEST_PASSWORD },
    });
    createdUserIds.push(first.json().user.id);

    // #when
    const second = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: { email, password: TEST_PASSWORD },
    });

    // #then
    expect(second.statusCode).toBe(409);
    expect(second.json().code).toBe("EMAIL_TAKEN");
  });

  it("revokes the session on logout — the old token no longer authenticates", async () => {
    // #given
    const account = await signupTestAccount(app);
    createdUserIds.push(account.userId);

    // #when
    const logout = await app.inject({
      method: "POST",
      url: "/v1/auth/logout",
      headers: { authorization: `Bearer ${account.token}` },
    });
    const afterLogout = await app.inject({
      method: "POST",
      url: "/v1/workspaces",
      headers: { authorization: `Bearer ${account.token}` },
      payload: { name: "Should fail", slug: `ws-${randomUUID().slice(0, 8)}` },
    });

    // #then
    expect(logout.statusCode).toBe(204);
    expect(afterLogout.statusCode).toBe(401);
  });

  it("completes a full password-reset round trip through the real HTTP confirm endpoint", async () => {
    // #given
    const account = await signupTestAccount(app);
    createdUserIds.push(account.userId);
    const oldSessionToken = account.token;

    // No email provider is configured (see docs/INTEGRATIONS.md), so the
    // reset token can't be intercepted from an inbox in this test — it's
    // generated directly via the same lib function the request route
    // calls, simulating "the token the user received by email".
    const { createPasswordResetToken } = await import("../../lib/auth.js");
    const { token: rawResetToken } = await createPasswordResetToken(prisma, account.userId);

    // #when — the real HTTP confirm endpoint, not a direct DB write
    const newPassword = "NewPass1234!";
    const confirmResponse = await app.inject({
      method: "POST",
      url: "/v1/auth/password-reset/confirm",
      payload: { token: rawResetToken, newPassword },
    });

    // #then
    expect(confirmResponse.statusCode).toBe(200);

    // The new password actually works through the real login endpoint.
    const loginWithNew = await app.inject({
      method: "POST",
      url: "/v1/auth/login",
      payload: { email: account.email, password: newPassword },
    });
    expect(loginWithNew.statusCode).toBe(200);

    // The reset token can't be reused.
    const reuseAttempt = await app.inject({
      method: "POST",
      url: "/v1/auth/password-reset/confirm",
      payload: { token: rawResetToken, newPassword: "AnotherPass1!" },
    });
    expect(reuseAttempt.statusCode).toBe(400);

    // The session that existed before the reset was invalidated.
    const oldSessionAttempt = await app.inject({
      method: "POST",
      url: "/v1/workspaces",
      headers: { authorization: `Bearer ${oldSessionToken}` },
      payload: { name: "Should fail", slug: `ws-${randomUUID().slice(0, 8)}` },
    });
    expect(oldSessionAttempt.statusCode).toBe(401);
  });

  it("never reveals whether an email has an account via the reset-request endpoint", async () => {
    // #given
    const account = await signupTestAccount(app);
    createdUserIds.push(account.userId);

    // #when
    const forRealEmail = await app.inject({
      method: "POST",
      url: "/v1/auth/password-reset/request",
      payload: { email: account.email },
    });
    const forUnknownEmail = await app.inject({
      method: "POST",
      url: "/v1/auth/password-reset/request",
      payload: { email: `${randomUUID()}@afterpost.test` },
    });

    // #then — identical response either way
    expect(forRealEmail.statusCode).toBe(200);
    expect(forUnknownEmail.statusCode).toBe(200);
    expect(forRealEmail.json()).toEqual(forUnknownEmail.json());
  });

  it("rejects password-reset confirm with an invalid token", async () => {
    // #given / #when
    const response = await app.inject({
      method: "POST",
      url: "/v1/auth/password-reset/confirm",
      payload: { token: "not-a-real-token", newPassword: TEST_PASSWORD },
    });
    // #then
    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe("RESET_TOKEN_INVALID");
  });
});
