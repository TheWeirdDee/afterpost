import { randomUUID } from "node:crypto";
import { REFERENCE_PONS_TOKEN, ROBINHOOD_CHAIN_ID } from "@afterpost/chain-pons";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildServer } from "../../server.js";
import { prisma } from "../../lib/prisma.js";

/**
 * Real integration test exercising the full first-session journey (PRD
 * §4.1 steps 1-5): workspace -> project (real onchain token verification)
 * -> partner -> campaign with deliverables, all against the real local
 * Postgres and, for the project step, the real public RPC.
 */
describe("Campaign creation flow (live RPC + live Postgres)", () => {
  const app = buildServer();
  const cleanup = {
    workspaceIds: [] as string[],
    userIds: [] as string[],
    campaignIds: [] as string[],
  };

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await prisma.deliverable.deleteMany({ where: { campaignId: { in: cleanup.campaignIds } } });
    await prisma.campaign.deleteMany({ where: { id: { in: cleanup.campaignIds } } });
    await prisma.partner.deleteMany({ where: { workspaceId: { in: cleanup.workspaceIds } } });
    await prisma.token.deleteMany({ where: { workspaceId: { in: cleanup.workspaceIds } } });
    await prisma.project.deleteMany({ where: { workspaceId: { in: cleanup.workspaceIds } } });
    await prisma.workspaceMember.deleteMany({
      where: { workspaceId: { in: cleanup.workspaceIds } },
    });
    await prisma.workspace.deleteMany({ where: { id: { in: cleanup.workspaceIds } } });
    await prisma.user.deleteMany({ where: { id: { in: cleanup.userIds } } });
    await app.close();
  });

  it("creates a full campaign with deliverables through workspace -> project -> partner -> campaign", async () => {
    // #given — a real user and workspace
    const user = await prisma.user.create({ data: { email: `${randomUUID()}@afterpost.test` } });
    cleanup.userIds.push(user.id);

    const workspaceResponse = await app.inject({
      method: "POST",
      url: "/v1/workspaces",
      payload: { name: "Flow Test", slug: `ws-${randomUUID().slice(0, 8)}`, ownerId: user.id },
    });
    const workspaceId = workspaceResponse.json().id;
    cleanup.workspaceIds.push(workspaceId);

    // #when — project with real onchain-verified token
    const projectResponse = await app.inject({
      method: "POST",
      url: "/v1/projects",
      payload: {
        workspaceId,
        name: "Flow Test Project",
        chainId: ROBINHOOD_CHAIN_ID,
        tokenAddress: REFERENCE_PONS_TOKEN,
        platform: "pons",
      },
    });
    expect(projectResponse.statusCode).toBe(201);
    const projectId = projectResponse.json().id;

    // partner
    const partnerResponse = await app.inject({
      method: "POST",
      url: "/v1/partners",
      payload: { workspaceId, displayName: "Test Partner", handle: "@testpartner" },
    });
    expect(partnerResponse.statusCode).toBe(201);
    const partnerId = partnerResponse.json().id;

    // campaign with two deliverables, matching the PRD §14.3 example shape
    const campaignResponse = await app.inject({
      method: "POST",
      url: "/v1/campaigns",
      payload: {
        workspaceId,
        projectId,
        partnerId,
        title: "October launch awareness campaign",
        startAt: "2026-10-23T00:00:00Z",
        endAt: "2026-10-27T23:59:00Z",
        goal: "DELIVERY_AND_AWARENESS",
        agreedFee: { amount: "500.00", currency: "USD" },
        deliverables: [
          { kind: "POST", channel: "x", quantity: 2, dueAt: "2026-10-25T18:00:00Z" },
          {
            kind: "COMMUNITY_MENTION",
            channel: "telegram",
            quantity: 1,
            dueAt: "2026-10-26T18:00:00Z",
          },
        ],
      },
    });

    // #then
    expect(campaignResponse.statusCode).toBe(201);
    const campaign = campaignResponse.json();
    cleanup.campaignIds.push(campaign.id);

    expect(campaign.projectName).toBe("Flow Test Project");
    expect(campaign.partnerName).toBe("Test Partner");
    expect(campaign.cost).toEqual({ amount: "500", currency: "USD" });
    expect(campaign.deliverables).toHaveLength(2);
    expect(campaign.deliverables[0].kind).toBe("POST");

    // Fetching it back returns the same real persisted data.
    const getResponse = await app.inject({ method: "GET", url: `/v1/campaigns/${campaign.id}` });
    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json().deliverables).toHaveLength(2);
  }, 30_000);
});
