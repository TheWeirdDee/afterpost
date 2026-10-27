import { CreateCampaignRequestSchema, type CampaignDetailDto } from "@afterpost/contracts";
import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { NOT_FOUND, VALIDATION_FAILED } from "../errors.js";

function toDetailDto(campaign: {
  id: string;
  title: string;
  status: "DRAFT" | "ACTIVE" | "IN_REVIEW" | "COMPLETED" | "CANCELLED";
  goal: "DELIVERY_AND_AWARENESS" | "ACQUISITION" | "RETENTION" | "OTHER";
  startAt: Date;
  endAt: Date;
  costAmount: { toString(): string } | null;
  costCurrency: string | null;
  paymentStatus: "AGREED" | "INVOICE_RECEIVED" | "PAID_USER_REPORTED" | "DISPUTED" | "CANCELLED";
  partner: { displayName: string };
  project: { name: string };
  deliverables: Array<{
    id: string;
    kind: "POST" | "THREAD" | "REPLY" | "VIDEO" | "SPACE" | "COMMUNITY_MENTION" | "OTHER";
    channel: string;
    requiredQuantity: number;
    dueAt: Date | null;
    status:
      | "PENDING"
      | "VERIFIED_FULFILLED"
      | "USER_CONFIRMED_FULFILLED"
      | "UNRESOLVED"
      | "LATE"
      | "MISSED";
  }>;
}): CampaignDetailDto {
  return {
    id: campaign.id,
    title: campaign.title,
    status: campaign.status,
    goal: campaign.goal,
    partnerName: campaign.partner.displayName,
    projectName: campaign.project.name,
    startAt: campaign.startAt.toISOString(),
    endAt: campaign.endAt.toISOString(),
    cost: campaign.costAmount
      ? { amount: campaign.costAmount.toString(), currency: campaign.costCurrency ?? "USD" }
      : null,
    paymentStatus: campaign.paymentStatus,
    lastEvaluatedAt: null,
    suggestedAction: null,
    deliverables: campaign.deliverables.map((d) => ({
      id: d.id,
      kind: d.kind,
      channel: d.channel,
      requiredQuantity: d.requiredQuantity,
      dueAt: d.dueAt?.toISOString() ?? null,
      status: d.status,
    })),
  };
}

const CAMPAIGN_INCLUDE = { partner: true, project: true, deliverables: true } as const;

/**
 * FR-D01/FR-D02 (P0): campaign + deliverables created atomically. Amounts
 * come straight from the request as decimal strings (packages/contracts
 * rejects a JS number) — never implicitly confirmed as paid or verified.
 */
export async function campaignRoutes(app: FastifyInstance): Promise<void> {
  app.post("/v1/campaigns", async (request, reply) => {
    const bodyResult = CreateCampaignRequestSchema.safeParse(request.body);
    if (!bodyResult.success) {
      throw VALIDATION_FAILED({ issues: bodyResult.error.issues });
    }

    const workspaceId = (request.body as { workspaceId?: unknown }).workspaceId;
    if (typeof workspaceId !== "string" || workspaceId.length === 0) {
      throw VALIDATION_FAILED({
        issues: [
          { path: ["workspaceId"], message: "workspaceId is required (temporary pre-auth field)" },
        ],
      });
    }

    const data = bodyResult.data;

    const campaign = await prisma.$transaction(async (tx) => {
      const created = await tx.campaign.create({
        data: {
          workspaceId,
          projectId: data.projectId,
          partnerId: data.partnerId,
          title: data.title,
          goal: data.goal,
          startAt: data.startAt,
          endAt: data.endAt,
          costAmount: data.agreedFee?.amount ?? null,
          costCurrency: data.agreedFee?.currency ?? null,
          paymentStatus: "AGREED",
          status: "DRAFT",
        },
      });

      await tx.deliverable.createMany({
        data: data.deliverables.map((d) => ({
          campaignId: created.id,
          kind: d.kind,
          channel: d.channel,
          requiredQuantity: d.quantity,
          dueAt: d.dueAt ?? null,
        })),
      });

      return tx.campaign.findUniqueOrThrow({
        where: { id: created.id },
        include: CAMPAIGN_INCLUDE,
      });
    });

    reply.code(201);
    return toDetailDto(campaign);
  });

  app.get("/v1/campaigns/:id", async (request) => {
    const { id } = request.params as { id: string };
    const campaign = await prisma.campaign.findUnique({ where: { id }, include: CAMPAIGN_INCLUDE });
    if (!campaign) throw NOT_FOUND("Campaign");
    return toDetailDto(campaign);
  });
}
