import { randomUUID } from "node:crypto";
import { computeFulfilmentRatio, evaluateRenewalPolicy } from "@afterpost/domain";
import type { DeliverableOutcome } from "@afterpost/domain";
import type { ReportDto } from "@afterpost/contracts";
import type { FastifyInstance } from "fastify";
import { requireAuth, requireWorkspaceRole } from "../middleware/auth.js";
import { prisma } from "../../lib/prisma.js";
import { NOT_FOUND } from "../errors.js";

const POLICY_VERSION = "v1-deterministic-preview";

function toDto(report: {
  id: string;
  version: number;
  status: "DRAFT" | "NEEDS_REVIEW" | "APPROVED" | "DISPUTED" | "SUPERSEDED";
  suggestedAction: ReportDto["suggestedAction"];
  dataAsOf: Date;
  limitationsJson: unknown;
}): ReportDto {
  return {
    id: report.id,
    version: report.version,
    status: report.status,
    suggestedAction: report.suggestedAction,
    dataAsOf: report.dataAsOf.toISOString(),
    limitations: Array.isArray(report.limitationsJson) ? (report.limitationsJson as string[]) : [],
  };
}

/**
 * FR-J01/J02 (P0 slice): a deterministic-only renewal report. This is NOT
 * the full investigation run (no agent, no Zetaris query, no Nemotron
 * extraction yet — see docs/INTEGRATIONS.md) — it runs the real
 * domain/renewal-policy engine against whatever deliverables/evidence
 * already exist in Postgres and persists an honestly-labelled immutable
 * report version. `policyVersion` is tagged "v1-deterministic-preview"
 * specifically so no downstream consumer mistakes this for a completed
 * agent investigation.
 */
export async function reportRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/v1/campaigns/:campaignId/reports/generate",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { campaignId } = request.params as { campaignId: string };

      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: { deliverables: true },
      });
      if (!campaign) throw NOT_FOUND("Campaign");
      await requireWorkspaceRole(request, campaign.workspaceId, "ANALYST");

      // No deliverable-evidence linking endpoint exists yet (FR-E03), so
      // every deliverable is honestly treated as unresolved rather than
      // guessed as fulfilled — never silently count toward "verified".
      const outcomes: DeliverableOutcome[] = campaign.deliverables.map((d) => ({
        deliverableId: d.id,
        requiredQuantity: d.requiredQuantity,
        state: "unresolved",
        dueAt: d.dueAt,
        verifiedAt: null,
      }));

      const fulfilment = computeFulfilmentRatio(outcomes);

      const policyResult = evaluateRenewalPolicy({
        policyVersion: POLICY_VERSION,
        campaignTermsConfirmed: true,
        requiredSourceBroken: false,
        dueObligationsHaveUnresolvedProof: fulfilment.unresolvedUnits > 0,
        confirmedSeriousNonDeliveryWithVerifiedSource: false,
        deliveryRequirementsMet: fulfilment.verifiedFulfilmentRatio === 1,
        declaredCampaignGoalSupported: null, // no tracking configured — goal unverifiable, never penalized
      });

      const limitations = [
        "Deterministic preview only: no agent run, no Zetaris query, no Nemotron extraction yet.",
        "Deliverable-evidence linking is not implemented yet, so all deliverables are treated as unresolved.",
        "Attribution is not assessed; this report never claims a conversion count.",
      ];

      const result = await prisma.$transaction(async (tx) => {
        const run = await tx.investigationRun.create({
          data: {
            workspaceId: campaign.workspaceId,
            campaignId: campaign.id,
            status: "PARTIAL_COMPLETE",
            policyVersion: POLICY_VERSION,
            startedAt: new Date(),
            finishedAt: new Date(),
            idempotencyKey: `${campaign.workspaceId}:${campaign.id}:${POLICY_VERSION}:${randomUUID()}`,
          },
        });

        const priorCount = await tx.report.count({ where: { campaignId: campaign.id } });

        const report = await tx.report.create({
          data: {
            workspaceId: campaign.workspaceId,
            campaignId: campaign.id,
            runId: run.id,
            version: priorCount + 1,
            status: "DRAFT",
            suggestedAction: policyResult.suggestedAction,
            policyVersion: POLICY_VERSION,
            dataAsOf: new Date(),
            limitationsJson: limitations,
            // Prisma's JSON input type wants plain JSON values, not a typed
            // domain object; round-tripping through JSON matches what's
            // actually stored and keeps the domain type strict everywhere else.
            snapshotJson: JSON.parse(
              JSON.stringify({
                fulfilment,
                policyRuleId: policyResult.ruleId,
                policyReasons: policyResult.reasons,
              }),
            ) as object,
            sha256: randomUUID(), // placeholder until real snapshot hashing lands
          },
        });

        return report;
      });

      reply.code(201);
      return toDto(result);
    },
  );

  app.get("/v1/reports/:id", { preHandler: requireAuth }, async (request) => {
    const { id } = request.params as { id: string };
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) throw NOT_FOUND("Report");
    await requireWorkspaceRole(request, report.workspaceId, "VIEWER");
    return toDto(report);
  });
}
