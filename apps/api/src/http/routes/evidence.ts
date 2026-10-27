import { EvidenceKindSchema, type EvidenceDto } from "@afterpost/contracts";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth, requireWorkspaceRole } from "../middleware/auth.js";
import { prisma } from "../../lib/prisma.js";
import { NOT_FOUND, VALIDATION_FAILED } from "../errors.js";

const AddEvidenceUrlRequestSchema = z.object({
  kind: EvidenceKindSchema,
  sourceRef: z.string().url(),
});

function toDto(evidence: {
  id: string;
  kind: EvidenceDto["kind"];
  sourceRef: string;
  verificationBasis: EvidenceDto["verificationBasis"];
  status: EvidenceDto["status"];
  observedAt: Date | null;
  ingestedAt: Date;
}): EvidenceDto {
  return {
    id: evidence.id,
    kind: evidence.kind,
    sourceRef: evidence.sourceRef,
    verificationBasis: evidence.verificationBasis,
    status: evidence.status,
    observedAt: evidence.observedAt?.toISOString() ?? null,
    ingestedAt: evidence.ingestedAt.toISOString(),
  };
}

/**
 * FR-E01 (P0), URL-only slice: attach a public URL as evidence for a
 * campaign. `verificationBasis` starts at UNVERIFIABLE — nothing here
 * auto-promotes to platform-authenticated just because the URL was
 * accepted syntactically (PRD §9.2: "Do not set isAuthenticityEstablished
 * = true... unless the source has been independently confirmed"). File
 * upload (FR-E01's presigned-URL path) is not implemented yet — see
 * docs/INTEGRATIONS.md.
 */
export async function evidenceRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/v1/campaigns/:campaignId/evidence/urls",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { campaignId } = request.params as { campaignId: string };

      const bodyResult = AddEvidenceUrlRequestSchema.safeParse(request.body);
      if (!bodyResult.success) {
        throw VALIDATION_FAILED({ issues: bodyResult.error.issues });
      }

      const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
      if (!campaign) throw NOT_FOUND("Campaign");
      await requireWorkspaceRole(request, campaign.workspaceId, "ANALYST");

      const evidence = await prisma.evidence.create({
        data: {
          workspaceId: campaign.workspaceId,
          campaignId,
          kind: bodyResult.data.kind,
          sourceMethod: "MANUAL",
          sourceRef: bodyResult.data.sourceRef,
          verificationBasis: "UNVERIFIABLE",
          collectionStatus: "RAW",
          status: "SUBMITTED",
          isAuthenticityEstablished: false,
        },
      });

      reply.code(201);
      return toDto(evidence);
    },
  );

  app.get("/v1/campaigns/:campaignId/evidence", { preHandler: requireAuth }, async (request) => {
    const { campaignId } = request.params as { campaignId: string };
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw NOT_FOUND("Campaign");
    await requireWorkspaceRole(request, campaign.workspaceId, "VIEWER");

    const items = await prisma.evidence.findMany({
      where: { campaignId },
      orderBy: { ingestedAt: "desc" },
    });
    return { items: items.map(toDto), nextCursor: null };
  });
}
