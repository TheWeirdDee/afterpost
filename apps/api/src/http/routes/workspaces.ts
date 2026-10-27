import { CreateWorkspaceRequestSchema, type WorkspaceDto } from "@afterpost/contracts";
import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { ApiError, NOT_FOUND, VALIDATION_FAILED } from "../errors.js";

function toDto(workspace: { id: string; slug: string; displayName: string; timezone: string; createdAt: Date }): WorkspaceDto {
  return {
    id: workspace.id,
    slug: workspace.slug,
    displayName: workspace.displayName,
    timezone: workspace.timezone,
    createdAt: workspace.createdAt.toISOString(),
  };
}

/**
 * FR-A02 (P0): workspace creation. No auth wired up yet — see
 * docs/INTEGRATIONS.md and README "in progress" section. `ownerId` is
 * accepted directly in the request body as an explicit, temporary stand-in
 * until Auth.js issues a verified session; this is NOT how it will work
 * once auth lands; it is a real, working, honestly-labelled placeholder so
 * the rest of the stack (DB, contracts, error handling) can be exercised
 * end to end right now.
 */
export async function workspaceRoutes(app: FastifyInstance): Promise<void> {
  app.post("/v1/workspaces", async (request, reply) => {
    const bodyResult = CreateWorkspaceRequestSchema.safeParse(request.body);
    if (!bodyResult.success) {
      throw VALIDATION_FAILED({ issues: bodyResult.error.issues });
    }

    const ownerIdResult = (request.body as { ownerId?: unknown }).ownerId;
    if (typeof ownerIdResult !== "string" || ownerIdResult.length === 0) {
      throw VALIDATION_FAILED({ issues: [{ path: ["ownerId"], message: "ownerId is required (temporary pre-auth field)" }] });
    }

    const existing = await prisma.workspace.findUnique({ where: { slug: bodyResult.data.slug } });
    if (existing) {
      throw new ApiError("SLUG_TAKEN", `Workspace slug '${bodyResult.data.slug}' is already in use`, 409);
    }

    const workspace = await prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: {
          slug: bodyResult.data.slug,
          displayName: bodyResult.data.name,
          ownerId: ownerIdResult,
        },
      });
      await tx.workspaceMember.create({
        data: { workspaceId: ws.id, userId: ownerIdResult, role: "OWNER" },
      });
      return ws;
    });

    reply.code(201);
    return toDto(workspace);
  });

  app.get("/v1/workspaces/:id", async (request) => {
    const { id } = request.params as { id: string };
    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (!workspace) throw NOT_FOUND("Workspace");
    return toDto(workspace);
  });
}
