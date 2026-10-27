import { createHash } from "node:crypto";

/**
 * Content-derived stable ID (PRD §11.2, Meterless World Model engine doc
 * §3: "Stable IDs derived from content, not autoincrement"). Independent
 * callers hashing the same logical key converge on the same ID without
 * coordination — the property that makes idempotent re-ingestion safe.
 */
export function stableId(prefix: string, ...keyParts: readonly string[]): string {
  const hash = createHash("sha256").update(keyParts.join("\u0000")).digest("hex").slice(0, 24);
  return `${prefix}_${hash}`;
}
