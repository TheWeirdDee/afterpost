import { CreatePartnerRequestSchema, type PartnerDto } from "@afterpost/contracts";
import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { NOT_FOUND, VALIDATION_FAILED } from "../errors.js";

function toDto(partner: {
  id: string;
  displayName: string;
  handle: string | null;
  profileUrl: string | null;
  status: "CANDIDATE" | "TRIAL" | "ACTIVE" | "PAUSED" | "DO_NOT_RENEW" | "ARCHIVED";
}): PartnerDto {
  return {
    id: partner.id,
    displayName: partner.displayName,
    handle: partner.handle,
    profileUrl: partner.profileUrl,
    status: partner.status,
  };
}

/**
 * FR-C01 (P0): add a partner. Duplicate verified-handle detection (the
 * PRD's "duplicate warning on identical verified social handle") is left
 * for a later pass — this does not merge by display name alone, which is
 * the one hard requirement FR-C01 states explicitly.
 */
export async function partnerRoutes(app: FastifyInstance): Promise<void> {
  app.post("/v1/partners", async (request, reply) => {
    const bodyResult = CreatePartnerRequestSchema.safeParse(request.body);
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

    const partner = await prisma.partner.create({
      data: {
        workspaceId,
        displayName: bodyResult.data.displayName,
        handle: bodyResult.data.handle ?? null,
        profileUrl: bodyResult.data.profileUrl ?? null,
      },
    });

    reply.code(201);
    return toDto(partner);
  });

  app.get("/v1/partners/:id", async (request) => {
    const { id } = request.params as { id: string };
    const partner = await prisma.partner.findUnique({ where: { id } });
    if (!partner) throw NOT_FOUND("Partner");
    return toDto(partner);
  });
}
