import { randomUUID } from "node:crypto";
import Fastify from "fastify";
import { healthRoutes } from "./http/routes/health.js";
import { workspaceRoutes } from "./http/routes/workspaces.js";
import { ApiError } from "./http/errors.js";
import { prisma } from "./lib/prisma.js";
import { redis } from "./lib/redis.js";

export function buildServer() {
  const app = Fastify({
    logger: { level: process.env.LOG_LEVEL ?? "info" },
    genReqId: () => randomUUID(),
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ApiError) {
      reply.code(error.statusCode).send({
        code: error.code,
        message: error.message,
        details: error.details,
        requestId: request.id,
      });
      return;
    }

    request.log.error(error);
    reply.code(500).send({
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
      requestId: request.id,
    });
  });

  app.register(healthRoutes);
  app.register(workspaceRoutes);

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
    redis.disconnect();
  });

  return app;
}

async function main(): Promise<void> {
  const app = buildServer();
  const port = Number(process.env.API_PORT ?? 8787);
  await app.listen({ port, host: "0.0.0.0" });
}

// Only auto-start when run directly, not when imported by tests.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
