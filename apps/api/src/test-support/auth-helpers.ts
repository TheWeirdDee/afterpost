import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";

export interface TestAccount {
  token: string;
  userId: string;
  email: string;
}

/** A password satisfying SignupRequestSchema's policy. */
export const TEST_PASSWORD = "Test1234!";

export async function signupTestAccount(app: FastifyInstance): Promise<TestAccount> {
  const email = `${randomUUID()}@afterpost.test`;
  const response = await app.inject({
    method: "POST",
    url: "/v1/auth/signup",
    payload: { email, password: TEST_PASSWORD, name: "Test User" },
  });
  if (response.statusCode !== 201) {
    throw new Error(`signupTestAccount failed: ${response.statusCode} ${response.body}`);
  }
  const body = response.json();
  return { token: body.token, userId: body.user.id, email };
}

export async function createTestWorkspace(
  app: FastifyInstance,
  token: string,
  name = "Test Workspace",
): Promise<string> {
  const response = await app.inject({
    method: "POST",
    url: "/v1/workspaces",
    headers: { authorization: `Bearer ${token}` },
    payload: { name, slug: `ws-${randomUUID().slice(0, 8)}` },
  });
  if (response.statusCode !== 201) {
    throw new Error(`createTestWorkspace failed: ${response.statusCode} ${response.body}`);
  }
  return response.json().id;
}

/** Signs up a fresh account and creates a workspace it owns, in one call. */
export async function signupWithWorkspace(
  app: FastifyInstance,
  workspaceName = "Test Workspace",
): Promise<TestAccount & { workspaceId: string }> {
  const account = await signupTestAccount(app);
  const workspaceId = await createTestWorkspace(app, account.token, workspaceName);
  return { ...account, workspaceId };
}
