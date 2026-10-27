import {
  ConfirmPasswordResetRequestSchema,
  LoginRequestSchema,
  RequestPasswordResetRequestSchema,
  SignupRequestSchema,
} from "@afterpost/contracts";
import type { FastifyInstance } from "fastify";
import {
  createPasswordResetToken,
  createSession,
  hashPassword,
  hashToken,
  resolvePasswordResetToken,
  verifyPassword,
} from "../../lib/auth.js";
import { prisma } from "../../lib/prisma.js";
import { ApiError, VALIDATION_FAILED } from "../errors.js";

/**
 * FR-A01 (P0), email/password slice. No OAuth/magic-link yet — see
 * docs/INTEGRATIONS.md. Sessions are opaque bearer tokens (PRD §12.1),
 * returned once and never recoverable server-side; only their SHA-256
 * hash is stored.
 *
 * Password reset emails are NOT actually sent yet — no transactional
 * email provider is configured (see docs/INTEGRATIONS.md). The reset
 * token is logged server-side instead of emailed, so the flow is fully
 * built and testable, and swapping in real delivery is a one-line change
 * once an EMAIL_PROVIDER_API_KEY exists. This is never presented to a
 * user as "email sent" when it wasn't.
 */
export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/v1/auth/signup", async (request, reply) => {
    const bodyResult = SignupRequestSchema.safeParse(request.body);
    if (!bodyResult.success) {
      throw VALIDATION_FAILED({ issues: bodyResult.error.issues });
    }
    const { email, password, name } = bodyResult.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ApiError("EMAIL_TAKEN", "An account with this email already exists", 409);
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({ data: { email, passwordHash, name: name ?? null } });
    const session = await createSession(prisma, user.id, request.headers["user-agent"] ?? null);

    reply.code(201);
    return {
      user: { id: user.id, email: user.email, name: user.name },
      token: session.token,
      expiresAt: session.expiresAt.toISOString(),
    };
  });

  app.post("/v1/auth/login", async (request) => {
    const bodyResult = LoginRequestSchema.safeParse(request.body);
    if (!bodyResult.success) {
      throw VALIDATION_FAILED({ issues: bodyResult.error.issues });
    }
    const { email, password } = bodyResult.data;

    const user = await prisma.user.findUnique({ where: { email } });
    // Constant-shape response whether the email exists or the password is
    // wrong — never reveal which one failed (standard practice, PRD §16.1
    // threat-model spirit: don't leak account existence).
    const INVALID = () => new ApiError("INVALID_CREDENTIALS", "Invalid email or password", 401);

    if (!user || !user.passwordHash) throw INVALID();
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) throw INVALID();

    const session = await createSession(prisma, user.id, request.headers["user-agent"] ?? null);
    return {
      user: { id: user.id, email: user.email, name: user.name },
      token: session.token,
      expiresAt: session.expiresAt.toISOString(),
    };
  });

  app.post("/v1/auth/logout", async (request, reply) => {
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (token) {
      await prisma.session.updateMany({
        where: { tokenHash: hashToken(token), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    reply.code(204);
    return null;
  });

  app.post("/v1/auth/password-reset/request", async (request) => {
    const bodyResult = RequestPasswordResetRequestSchema.safeParse(request.body);
    if (!bodyResult.success) {
      throw VALIDATION_FAILED({ issues: bodyResult.error.issues });
    }

    const user = await prisma.user.findUnique({ where: { email: bodyResult.data.email } });
    // Always return the same response whether or not the account exists —
    // otherwise this endpoint becomes an account-enumeration oracle.
    if (user) {
      const { token, expiresAt } = await createPasswordResetToken(prisma, user.id);
      request.log.info(
        { userId: user.id, expiresAt },
        `Password reset token (would be emailed once a provider is configured): ${token}`,
      );
    }
    return { message: "If an account exists for this email, a reset link has been sent." };
  });

  app.post("/v1/auth/password-reset/confirm", async (request) => {
    const bodyResult = ConfirmPasswordResetRequestSchema.safeParse(request.body);
    if (!bodyResult.success) {
      throw VALIDATION_FAILED({ issues: bodyResult.error.issues });
    }

    const resolution = await resolvePasswordResetToken(prisma, bodyResult.data.token);
    if (!resolution.ok) {
      throw new ApiError("RESET_TOKEN_INVALID", `Reset token ${resolution.reason}`, 400);
    }

    const newPasswordHash = await hashPassword(bodyResult.data.newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resolution.userId },
        data: { passwordHash: newPasswordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resolution.resetTokenId },
        data: { usedAt: new Date() },
      }),
      // Invalidate every existing session on password change — standard
      // practice: a stolen session token shouldn't survive a reset meant
      // to shut it out.
      prisma.session.updateMany({
        where: { userId: resolution.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: "Password updated. Please sign in again." };
  });
}
