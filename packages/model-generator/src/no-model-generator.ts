import type { Generator } from "./types.js";

/**
 * No-model fallback (H-MEM engine doc §6, §16): "store concise direct
 * summaries as short-term memories so capture continuity is preserved even
 * when the extraction model is rate-limited or unavailable." This is the
 * engine's own documented degradation path, not a substitute claimed as a
 * real inference call — every result is tagged `isFallback: true` and
 * callers must never report it as a Nightshift/Nemotron response.
 *
 * It does real, deterministic, inspectable work: it truncates and tags the
 * prompt rather than returning a canned string, so sample mode still
 * produces distinguishable, traceable output per input.
 */
export const noModelGenerator: Generator = async (prompt) => {
  const trimmed = prompt.trim();
  const summary = trimmed.length > 240 ? `${trimmed.slice(0, 237)}...` : trimmed;
  return {
    text: `[no-model fallback] ${summary}`,
    isFallback: true,
  };
};
