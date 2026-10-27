import { REFERENCE_PONS_TOKEN, ROBINHOOD_CHAIN_ID } from "@afterpost/chain-pons";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildServer } from "../../server.js";
import { prisma } from "../../lib/prisma.js";
import { signupWithWorkspace } from "../../test-support/auth-helpers.js";

describe("Evidence routes (live Postgres)", () => {
  const app = buildServer();
  const cleanup = {
    workspaceIds: [] as string[],
    userIds: [] as string[],
    campaignIds: [] as string[],
  };
  let workspaceId: string;
  let token: string;
  let campaignId: string;

  beforeAll(async () => {
    await app.ready();

    const account = await signupWithWorkspace(app, "Evidence Test");
    cleanup.userIds.push(account.userId);
    cleanup.workspaceIds.push(account.workspaceId);
    workspaceId = account.workspaceId;
    token = account.token;
    const authHeaders = { authorization: `Bearer ${token}` };

    const project = await app.inject({
      method: "POST",
      url: "/v1/projects",
      headers: authHeaders,
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
      headers: authHeaders,
      payload: { workspaceId, displayName: "Evidence Test Partner" },
    });

    const campaign = await app.inject({
      method: "POST",
      url: "/v1/campaigns",
      headers: authHeaders,
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
    await prisma.session.deleteMany({ where: { userId: { in: cleanup.userIds } } });
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
      headers: { authorization: `Bearer ${token}` },
      payload: { kind: "POST_URL", sourceRef: "https://x.com/example/status/123" },
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
      headers: { authorization: `Bearer ${token}` },
      payload: { kind: "POST_URL", sourceRef: "https://x.com/example/status/456" },
    });

    // #when
    const response = await app.inject({
      method: "GET",
      url: `/v1/campaigns/${campaignId}/evidence`,
      headers: { authorization: `Bearer ${token}` },
    });

    // #then
    expect(response.statusCode).toBe(200);
    expect(response.json().items.length).toBeGreaterThanOrEqual(2);
  });

  it("rejects attaching evidence from a user who isn't a member of the campaign's workspace", async () => {
    // #given — a genuinely separate account with its own, unrelated workspace
    const outsider = await signupWithWorkspace(app, "Outsider's own workspace");
    cleanup.userIds.push(outsider.userId);
    cleanup.workspaceIds.push(outsider.workspaceId);

    // #when — attempting a cross-tenant write against the first workspace's campaign
    const response = await app.inject({
      method: "POST",
      url: `/v1/campaigns/${campaignId}/evidence/urls`,
      headers: { authorization: `Bearer ${outsider.token}` },
      payload: { kind: "POST_URL", sourceRef: "https://x.com/example/status/789" },
    });

    // #then
    expect(response.statusCode).toBe(403);
  });
});
