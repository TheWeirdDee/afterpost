import { PrismaClient } from "@prisma/client";

/**
 * Single shared PrismaClient per process (PRD §12: one monorepo, one
 * source of truth for the schema). Fastify's plugin lifecycle closes this
 * on server shutdown via src/server.ts.
 */
export const prisma = new PrismaClient();
