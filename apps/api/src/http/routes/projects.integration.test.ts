import { randomUUID } from "node:crypto";
import { REFERENCE_PONS_TOKEN, ROBINHOOD_CHAIN_ID } from "@afterpost/chain-pons";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildServer } from "../../server.js";
import { prisma } from "../../lib/prisma.js";

/**
 * Real integration test: live Robinhood Chain RPC token verification +
 * real local Postgres. Not a mock — POST /v1/projects actually calls
 * adapter.validateToken() over the network before writing any row.
 */
describe("POST /v1/projects (live RPC + live Postgres)", () => {
  const app = buildServer();
  const createdWorkspaceIds: string[] = [];
  const createdUserIds: string[] = [];
  const createdProjectIds: string[] = [];

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await prisma.project.deleteMany({ where: { id: { in: createdProjectIds } } });
    await prisma.token.deleteMany({ where: { workspaceId: { in: createdWorkspaceIds } } });
    await prisma.workspaceMember.deleteMany({
      where: { workspaceId: { in: createdWorkspaceIds } },
    });
    await prisma.workspace.deleteMany({ where: { id: { in: createdWorkspaceIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await app.close();
  });

  async function makeWorkspace(): Promise<string> {
    const user = await prisma.user.create({ data: { email: `${randomUUID()}@afterpost.test` } });
    createdUserIds.push(user.id);
    const workspace = await prisma.workspace.create({
      data: {
        slug: `ws-${randomUUID().slice(0, 8)}`,
        displayName: "Project Test",
        ownerId: user.id,
      },
    });
    createdWorkspaceIds.push(workspace.id);
    return workspace.id;
  }

  it("creates a project backed by a genuinely onchain-verified token", async () => {
    // #given
    const workspaceId = await makeWorkspace();

    // #when — this actually calls the live RPC's validateToken
    const response = await app.inject({
      method: "POST",
      url: "/v1/projects",
      payload: {
        workspaceId,
        name: "Reference pons project",
        chainId: ROBINHOOD_CHAIN_ID,
        tokenAddress: REFERENCE_PONS_TOKEN,
        platform: "pons",
      },
    });

    // #then
    expect(response.statusCode).toBe(201);
    const body = response.json();
    createdProjectIds.push(body.id);
    expect(body.primaryToken.symbol).toBe("PONS");
    expect(body.primaryToken.metadataVerifiedAt).toBeTruthy();
  }, 30_000);

  it("returns the existing project instead of creating a duplicate for the same token", async () => {
    // #given
    const workspaceId = await makeWorkspace();
    const payload = {
      workspaceId,
      name: "First creation",
      chainId: ROBINHOOD_CHAIN_ID,
      tokenAddress: REFERENCE_PONS_TOKEN,
      platform: "pons",
    };
    const first = await app.inject({ method: "POST", url: "/v1/projects", payload });
    createdProjectIds.push(first.json().id);

    // #when
    const second = await app.inject({
      method: "POST",
      url: "/v1/projects",
      payload: { ...payload, name: "Attempted duplicate" },
    });

    // #then — FR-B01: "duplicate token shows existing project"
    expect(second.statusCode).toBe(200);
    expect(second.json().id).toBe(first.json().id);
    expect(second.json().name).toBe("First creation");
  }, 30_000);

  it("rejects an unsupported chain before attempting any RPC call", async () => {
    // #given
    const workspaceId = await makeWorkspace();

    // #when
    const response = await app.inject({
      method: "POST",
      url: "/v1/projects",
      payload: {
        workspaceId,
        name: "Wrong chain",
        chainId: 1,
        tokenAddress: REFERENCE_PONS_TOKEN,
        platform: "pons",
      },
    });

    // #then
    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe("INVALID_CHAIN");
  });

  it("returns TOKEN_NOT_VERIFIED for an address with no deployed contract, not a fabricated project", async () => {
    // #given — a syntactically valid but almost certainly unused address
    const workspaceId = await makeWorkspace();

    // #when
    const response = await app.inject({
      method: "POST",
      url: "/v1/projects",
      payload: {
        workspaceId,
        name: "Nonexistent token",
        chainId: ROBINHOOD_CHAIN_ID,
        tokenAddress: "0x0000000000000000000000000000000000000001",
        platform: "pons",
      },
    });

    // #then
    expect(response.statusCode).toBe(422);
    expect(response.json().code).toBe("TOKEN_NOT_VERIFIED");
  }, 30_000);
});
