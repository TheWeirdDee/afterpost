import { CreateProjectRequestSchema, type ProjectDto } from "@afterpost/contracts";
import { PonsRobinhoodAdapter, ROBINHOOD_CHAIN_ID } from "@afterpost/chain-pons";
import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { ApiError, NOT_FOUND, VALIDATION_FAILED } from "../errors.js";

const adapter = new PonsRobinhoodAdapter();

function toDto(project: {
  id: string;
  name: string;
  status: "ACTIVE" | "ARCHIVED";
  createdAt: Date;
  primaryToken: {
    id: string;
    chainId: number;
    contractAddress: string;
    checksumAddress: string;
    symbol: string | null;
    name: string | null;
    decimals: number | null;
    platform: string | null;
    metadataVerifiedAt: Date | null;
  } | null;
}): ProjectDto {
  return {
    id: project.id,
    name: project.name,
    status: project.status,
    createdAt: project.createdAt.toISOString(),
    primaryToken: project.primaryToken
      ? {
          id: project.primaryToken.id,
          chainId: project.primaryToken.chainId,
          contractAddress: project.primaryToken.contractAddress as `0x${string}`,
          checksumAddress: project.primaryToken.checksumAddress,
          symbol: project.primaryToken.symbol,
          name: project.primaryToken.name,
          decimals: project.primaryToken.decimals,
          platform: project.primaryToken.platform,
          metadataVerifiedAt: project.primaryToken.metadataVerifiedAt?.toISOString() ?? null,
        }
      : null,
  };
}

/**
 * FR-B01/FR-B02 (P0): verify token metadata onchain before creating a
 * project. `chain_id + lowercase token address` is the canonical
 * uniqueness key (PRD §13.1) — a duplicate returns the existing project
 * instead of creating a second one, per FR-B01's acceptance criterion.
 */
export async function projectRoutes(app: FastifyInstance): Promise<void> {
  app.post("/v1/projects", async (request, reply) => {
    const bodyResult = CreateProjectRequestSchema.safeParse(request.body);
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

    const { name, chainId, tokenAddress, platform } = bodyResult.data;

    if (chainId !== ROBINHOOD_CHAIN_ID) {
      throw new ApiError(
        "INVALID_CHAIN",
        `chainId ${chainId} is not supported; only Robinhood Chain (${ROBINHOOD_CHAIN_ID}) is implemented`,
        400,
      );
    }

    const lowerAddress = tokenAddress.toLowerCase();

    const existingToken = await prisma.token.findUnique({
      where: {
        workspaceId_chainId_contractAddress: {
          workspaceId,
          chainId,
          contractAddress: lowerAddress,
        },
      },
      include: { primaryForProject: { include: { primaryToken: true } } },
    });
    if (existingToken?.primaryForProject) {
      reply.code(200);
      return toDto(existingToken.primaryForProject);
    }

    // Real onchain verification — not a format check. A malformed address
    // or an RPC failure both surface here rather than silently creating an
    // unverified project (FR-B02 acceptance: "source chain, fetched
    // block/time and error mode are visible").
    let identity;
    try {
      identity = await adapter.validateToken(tokenAddress as `0x${string}`);
    } catch (error) {
      throw new ApiError(
        "TOKEN_NOT_VERIFIED",
        `Could not verify token ${tokenAddress} on chain ${chainId}: ${(error as Error).message}`,
        422,
      );
    }

    const project = await prisma.$transaction(async (tx) => {
      const token = await tx.token.create({
        data: {
          workspaceId,
          chainId,
          contractAddress: lowerAddress,
          checksumAddress: identity.address,
          symbol: identity.symbol,
          name: identity.name,
          decimals: identity.decimals,
          totalSupplyRaw: identity.totalSupplyRaw,
          platform,
          metadataVerifiedAt: new Date(),
        },
      });

      const proj = await tx.project.create({
        data: { workspaceId, name, primaryTokenId: token.id },
      });

      await tx.token.update({ where: { id: token.id }, data: { projectId: proj.id } });

      return tx.project.findUniqueOrThrow({
        where: { id: proj.id },
        include: { primaryToken: true },
      });
    });

    reply.code(201);
    return toDto(project);
  });

  app.get("/v1/projects/:id", async (request) => {
    const { id } = request.params as { id: string };
    const project = await prisma.project.findUnique({
      where: { id },
      include: { primaryToken: true },
    });
    if (!project) throw NOT_FOUND("Project");
    return toDto(project);
  });
}
