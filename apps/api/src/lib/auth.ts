import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";

const BCRYPT_ROUNDS = 12;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Opaque bearer tokens: high-entropy random value shown to the client
 * once; only its SHA-256 hash is ever persisted (PRD §16.1 — never store
 * recoverable credential material). A plain hash is fine here (unlike
 * passwords) because the input is already high-entropy, not a human-chosen
 * secret vulnerable to dictionary attack.
 */
export function generateOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface CreatedSession {
  token: string;
  expiresAt: Date;
}

export async function createSession(
  prisma: PrismaClient,
  userId: string,
  userAgent: string | null,
): Promise<CreatedSession> {
  const token = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.session.create({
    data: { userId, tokenHash: hashToken(token), expiresAt, userAgent },
  });
  return { token, expiresAt };
}

export interface AuthenticatedUser {
  id: string;
  email: string;
}

/**
 * Resolves a bearer token to its user, checking expiry and revocation.
 * Returns null rather than throwing — callers decide whether auth is
 * required for a given route.
 */
export async function resolveSession(
  prisma: PrismaClient,
  bearerToken: string,
): Promise<AuthenticatedUser | null> {
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(bearerToken) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt.getTime() < Date.now()) return null;
  return { id: session.user.id, email: session.user.email };
}

export async function createPasswordResetToken(
  prisma: PrismaClient,
  userId: string,
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await prisma.passwordResetToken.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });
  return { token, expiresAt };
}

export type ResetTokenResolution =
  | { ok: true; userId: string; resetTokenId: string }
  | { ok: false; reason: "not_found" | "expired" | "already_used" };

export async function resolvePasswordResetToken(
  prisma: PrismaClient,
  token: string,
): Promise<ResetTokenResolution> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!record) return { ok: false, reason: "not_found" };
  if (record.usedAt) return { ok: false, reason: "already_used" };
  if (record.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };
  return { ok: true, userId: record.userId, resetTokenId: record.id };
}
