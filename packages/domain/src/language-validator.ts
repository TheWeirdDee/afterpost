/**
 * Language validator (PRD §10.5). Rejects unsupported causal/attribution
 * phrasing that the evidence on hand does not support. Keyed off the
 * finding's typed attribution level, not a fragile keyword blocklist alone —
 * the keyword list below is a defense-in-depth layer, not the sole check.
 */

export type AttributionLanguage = "none" | "observed_only" | "tracked_verified";

const UNSUPPORTED_PHRASES = [
  /\bgenerated\s+\d+\s+buyers?\b/i,
  /\bcaused\s+\$?\d/i,
  /\broi\s*\d/i,
  /\bfraudulent\s+wallets?\b/i,
  /\borganic\s+volume\b/i,
  /\b(real|unique)\s+(buyers?|users?|people|customers?)\b/i,
];

export interface LanguageValidationResult {
  ok: boolean;
  violations: string[];
}

export function validateFindingLanguage(
  text: string,
  attributionLanguage: AttributionLanguage,
): LanguageValidationResult {
  const violations: string[] = [];

  for (const pattern of UNSUPPORTED_PHRASES) {
    if (pattern.test(text)) {
      violations.push(`matched_unsupported_phrase:${pattern.source}`);
    }
  }

  if (attributionLanguage === "none" && /\bacqui(red|sition)\b/i.test(text)) {
    violations.push("acquisition_language_without_attribution_basis");
  }

  if (attributionLanguage !== "tracked_verified" && /\btracked\s+conversion/i.test(text)) {
    violations.push("tracked_conversion_claim_without_tracked_verified_basis");
  }

  return { ok: violations.length === 0, violations };
}
