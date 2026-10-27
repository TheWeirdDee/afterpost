/**
 * Base URL of the Fastify API (apps/api). Server-side only — route
 * handlers under app/api/* proxy to this; the browser never calls it
 * directly (PRD §12.1: "Prefer browser -> Next.js BFF -> Fastify").
 */
export const API_BASE_URL = process.env.AFTERPOST_API_URL ?? "http://localhost:8787";

export const SESSION_COOKIE_NAME = "afterpost_session";
