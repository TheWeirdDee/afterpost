import { REFERENCE_PONS_TOKEN, ROBINHOOD_CHAIN_ID } from "@afterpost/chain-pons";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildServer } from "../../server.js";
import { prisma } from "../../lib/prisma.js";
import { signupWithWorkspace } from "../../test-support/auth-helpers.js";

describe("Report generation (live Postgres)", () => {
  const app = buildServer();
  const cleanup = {
    workspaceIds: [] as string[],
    userIds: [] as string[],
    campaignIds: [] as string[],
  };
  let token: string;
  let campaignId: string;

  beforeAll(async () => {
    await app.ready();

    const account = await signupWithWorkspace(app, "Report Test");
    cleanup.userIds.push(account.userId);
    cleanup.workspaceIds.push(account.workspaceId);
    const { workspaceId } = account;
    token = account.token;
    const authHeaders = { authorization: `Bearer ${token}` };

    const project = await app.inject({
      method: "POST",
      url: "/v1/projects",
      headers: authHeaders,
      payload: {
        workspaceId,
        name: "Report Test Project",
        chainId: ROBINHOOD_CHAIN_ID,
        tokenAddress: REFERENCE_PONS_TOKEN,
        platform: "pons",
      },
    });

    const partner = await app.inject({
      method: "POST",
      url: "/v1/partners",
      headers: authHeaders,
      payload: { workspaceId, displayName: "Report Test Partner" },
    });

    const campaign = await app.inject({
      method: "POST",
      url: "/v1/campaigns",
      headers: authHeaders,
      payload: {
        workspaceId,
        projectId: project.json().id,
        partnerId: partner.json().id,
        title: "Report test campaign",
        startAt: "2026-10-23T00:00:00Z",
        endAt: "2026-10-27T23:59:00Z",
        goal: "OTHER",
        deliverables: [
          { kind: "POST", channel: "x", quantity: 1 },
          { kind: "THREAD", channel: "x", quantity: 1 },
        ],
      },
    });
    campaignId = campaign.json().id;
    cleanup.campaignIds.push(campaignId);
  }, 30_000);

  afterAll(async () => {
    await prisma.report.deleteMany({ where: { campaignId: { in: cleanup.campaignIds } } });
    await prisma.investigationRun.deleteMany({
      where: { campaignId: { in: cleanup.campaignIds } },
    });
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

  it("generates a deterministic-preview report via the real domain renewal-policy engine", async () => {
    // #given / #when
    const response = await app.inject({
      method: "POST",
      url: `/v1/campaigns/${campaignId}/reports/generate`,
      headers: { authorization: `Bearer ${token}` },
    });

    // #then — with zero evidence linked, every deliverable is honestly
    // unresolved, which correctly routes to request_evidence, never a
    // guessed renew/do_not_renew (PRD §8.4 policy).
    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.version).toBe(1);
    expect(body.status).toBe("DRAFT");
    expect(body.suggestedAction).toBe("request_evidence");
    expect(body.limitations.length).toBeGreaterThan(0);

    const getResponse = await app.inject({
      method: "GET",
      url: `/v1/reports/${body.id}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json().suggestedAction).toBe("request_evidence");
  });

  it("increments the version on a second generation, preserving the first", async () => {
    // #given
    const authHeaders = { authorization: `Bearer ${token}` };
    const first = await app.inject({
      method: "POST",
      url: `/v1/campaigns/${campaignId}/reports/generate`,
      headers: authHeaders,
    });

    // #when
    const second = await app.inject({
      method: "POST",
      url: `/v1/campaigns/${campaignId}/reports/generate`,
      headers: authHeaders,
    });

    // #then — PRD §13.6: "A report has exactly one saved snapshot... newer
    // investigations generate newer reports", never overwrite
    expect(second.json().version).toBe(first.json().version + 1);
    const stillThere = await app.inject({
      method: "GET",
      url: `/v1/reports/${first.json().id}`,
      headers: authHeaders,
    });
    expect(stillThere.statusCode).toBe(200);
  });
});
