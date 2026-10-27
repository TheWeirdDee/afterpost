import { randomUUID } from "node:crypto";
import { REFERENCE_PONS_TOKEN, ROBINHOOD_CHAIN_ID } from "@afterpost/chain-pons";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildServer } from "../../server.js";
import { prisma } from "../../lib/prisma.js";

describe("Evidence routes (live Postgres)", () => {
  const app = buildServer();
  const cleanup = {
    workspaceIds: [] as string[],
    userIds: [] as string[],
    campaignIds: [] as string[],
  };
  let workspaceId: string;
  let campaignId: string;

  beforeAll(async () => {
    await app.ready();

    const user = await prisma.user.create({ data: { email: `${randomUUID()}@afterpost.test` } });
    cleanup.userIds.push(user.id);

    const ws = await app.inject({
      method: "POST",
      url: "/v1/workspaces",
      payload: { name: "Evidence Test", slug: `ws-${randomUUID().slice(0, 8)}`, ownerId: user.id },
    });
    workspaceId = ws.json().id;
    cleanup.workspaceIds.push(workspaceId);

    const project = await app.inject({
      method: "POST",
      url: "/v1/projects",
      payload: {
        workspaceId,
        name: "Evidence Test Project",
        chainId: ROBINHOOD_CHAIN_ID,
        tokenAddress: REFERENCE_PONS_TOKEN,
        platform: "pons",
      },
    });

    const partner = await app.inject({
      method: "POST",
      url: "/v1/partners",
      payload: { workspaceId, displayName: "Evidence Test Partner" },
    });

    const campaign = await app.inject({
      method: "POST",
      url: "/v1/campaigns",
      payload: {
        workspaceId,
        projectId: project.json().id,
        partnerId: partner.json().id,
        title: "Evidence test campaign",
        startAt: "2026-10-23T00:00:00Z",
        endAt: "2026-10-27T23:59:00Z",
        goal: "OTHER",
        deliverables: [{ kind: "POST", channel: "x", quantity: 1 }],
      },
    });
    campaignId = campaign.json().id;
    cleanup.campaignIds.push(campaignId);
  }, 30_000);

  afterAll(async () => {
    await prisma.evidence.deleteMany({ where: { campaignId: { in: cleanup.campaignIds } } });
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

  it("attaches a URL as unverified evidence, never auto-promoted to confirmed", async () => {
    // #given / #when
    const response = await app.inject({
      method: "POST",
      url: `/v1/campaigns/${campaignId}/evidence/urls`,
      payload: { workspaceId, kind: "POST_URL", sourceRef: "https://x.com/example/status/123" },
    });

    // #then — PRD §9.2: accepting a URL does not establish authenticity
    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.verificationBasis).toBe("UNVERIFIABLE");
    expect(body.status).toBe("SUBMITTED");
  });

  it("lists evidence attached to the campaign", async () => {
    // #given
    await app.inject({
      method: "POST",
      url: `/v1/campaigns/${campaignId}/evidence/urls`,
      payload: { workspaceId, kind: "POST_URL", sourceRef: "https://x.com/example/status/456" },
    });

    // #when
    const response = await app.inject({
      method: "GET",
      url: `/v1/campaigns/${campaignId}/evidence`,
    });

    // #then
    expect(response.statusCode).toBe(200);
    expect(response.json().items.length).toBeGreaterThanOrEqual(2);
  });

  it("rejects attaching evidence to a campaign in a different workspace", async () => {
    // #given
    const otherUser = await prisma.user.create({
      data: { email: `${randomUUID()}@afterpost.test` },
    });
    cleanup.userIds.push(otherUser.id);
    const otherWs = await prisma.workspace.create({
      data: { slug: `ws-${randomUUID().slice(0, 8)}`, displayName: "Other", ownerId: otherUser.id },
    });
    cleanup.workspaceIds.push(otherWs.id);

    // #when — attempting cross-tenant write with a mismatched workspaceId
    const response = await app.inject({
      method: "POST",
      url: `/v1/campaigns/${campaignId}/evidence/urls`,
      payload: {
        workspaceId: otherWs.id,
        kind: "POST_URL",
        sourceRef: "https://x.com/example/status/789",
      },
    });

    // #then
    expect(response.statusCode).toBe(404);
  });
});
