import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildServer } from "./server.js";
import { prisma } from "./lib/prisma.js";
import { createTestWorkspace, signupTestAccount } from "./test-support/auth-helpers.js";

/**
 * Real integration tests against the live local Postgres/Redis
 * (infra/docker-compose.yml). No mocks — `app.inject()` runs the actual
 * Fastify request pipeline, and route handlers hit the real database.
 */
describe("API server (live Postgres + Redis)", () => {
  const app = buildServer();
  const createdWorkspaceIds: string[] = [];
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await prisma.session.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.workspaceMember.deleteMany({
      where: { workspaceId: { in: createdWorkspaceIds } },
    });
    await prisma.workspace.deleteMany({ where: { id: { in: createdWorkspaceIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await app.close();
  });

  it("GET /health/live returns alive without touching any dependency", async () => {
    // #given / #when
    const response = await app.inject({ method: "GET", url: "/health/live" });
    // #then
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "alive" });
  });

  it("GET /health/ready reports real Postgres and Redis connectivity as ok", async () => {
    // #given / #when
    const response = await app.inject({ method: "GET", url: "/health/ready" });
    // #then
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.checks.postgres).toBe("ok");
    expect(body.checks.redis).toBe("ok");
  });

  it("rejects workspace creation with no auth token", async () => {
    // #given / #when
    const response = await app.inject({
      method: "POST",
      url: "/v1/workspaces",
      payload: { name: "No auth", slug: `ws-${randomUUID().slice(0, 8)}` },
    });
    // #then
    expect(response.statusCode).toBe(401);
    expect(response.json().code).toBe("AUTH_REQUIRED");
  });

  it("creates a real workspace owned by the authenticated user and reads it back", async () => {
    // #given
    const account = await signupTestAccount(app);
    createdUserIds.push(account.userId);
    const slug = `ws-${randomUUID().slice(0, 8)}`;

    // #when
    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/workspaces",
      headers: { authorization: `Bearer ${account.token}` },
      payload: { name: "Integration Test Workspace", slug },
    });

    // #then
    expect(createResponse.statusCode).toBe(201);
    const created = createResponse.json();
    createdWorkspaceIds.push(created.id);
    expect(created.slug).toBe(slug);

    const getResponse = await app.inject({
      method: "GET",
      url: `/v1/workspaces/${created.id}`,
      headers: { authorization: `Bearer ${account.token}` },
    });
    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json().displayName).toBe("Integration Test Workspace");

    // The workspace membership row was really created too, not just the workspace.
    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: created.id, userId: account.userId } },
    });
    expect(membership?.role).toBe("OWNER");
  });

  it("forbids a non-member from reading a workspace they don't belong to", async () => {
    // #given
    const owner = await signupTestAccount(app);
    createdUserIds.push(owner.userId);
    const workspaceId = await createTestWorkspace(app, owner.token);
    createdWorkspaceIds.push(workspaceId);

    const outsider = await signupTestAccount(app);
    createdUserIds.push(outsider.userId);

    // #when
    const response = await app.inject({
      method: "GET",
      url: `/v1/workspaces/${workspaceId}`,
      headers: { authorization: `Bearer ${outsider.token}` },
    });

    // #then
    expect(response.statusCode).toBe(403);
    expect(response.json().code).toBe("ROLE_FORBIDDEN");
  });

  it("rejects a duplicate slug with a structured 409, not a raw DB error", async () => {
    // #given
    const account = await signupTestAccount(app);
    createdUserIds.push(account.userId);
    const slug = `ws-${randomUUID().slice(0, 8)}`;
    const first = await app.inject({
      method: "POST",
      url: "/v1/workspaces",
      headers: { authorization: `Bearer ${account.token}` },
      payload: { name: "First", slug },
    });
    createdWorkspaceIds.push(first.json().id);

    // #when
    const second = await app.inject({
      method: "POST",
      url: "/v1/workspaces",
      headers: { authorization: `Bearer ${account.token}` },
      payload: { name: "Second", slug },
    });

    // #then
    expect(second.statusCode).toBe(409);
    const body = second.json();
    expect(body.code).toBe("SLUG_TAKEN");
    expect(body.requestId).toBeTruthy();
  });

  it("returns the PRD §14.5 error envelope shape on validation failure", async () => {
    // #given
    const account = await signupTestAccount(app);
    createdUserIds.push(account.userId);
    // #when
    const response = await app.inject({
      method: "POST",
      url: "/v1/workspaces",
      headers: { authorization: `Bearer ${account.token}` },
      payload: { name: "", slug: "BAD SLUG WITH SPACES" },
    });
    // #then
    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body).toMatchObject({ code: "VALIDATION_FAILED" });
    expect(body.requestId).toBeTruthy();
  });

  it("returns a structured 403 for a well-formed but unknown workspace id (no membership exists)", async () => {
    // #given
    const account = await signupTestAccount(app);
    createdUserIds.push(account.userId);
    // #when
    const response = await app.inject({
      method: "GET",
      url: `/v1/workspaces/${randomUUID()}`,
      headers: { authorization: `Bearer ${account.token}` },
    });
    // #then
    expect(response.statusCode).toBe(403);
  });
});
