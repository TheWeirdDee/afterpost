import { createNightshiftGenerator } from "./nightshift-generator.js";
import { noModelGenerator } from "./no-model-generator.js";
import type { Generator } from "./types.js";

export interface ConfiguredGeneratorEnv {
  NIGHTSHIFT_BASE_URL?: string;
  NIGHTSHIFT_API_KEY?: string;
  NIGHTSHIFT_MODEL?: string;
}

/**
 * Picks Nightshift when fully configured, otherwise the documented
 * no-model fallback (sample mode) — so the system runs for a judge with
 * zero credentials, per the Meterless engines' own requirement.
 */
export function buildConfiguredGenerator(env: ConfiguredGeneratorEnv): Generator {
  if (env.NIGHTSHIFT_BASE_URL && env.NIGHTSHIFT_API_KEY && env.NIGHTSHIFT_MODEL) {
    return createNightshiftGenerator({
      baseUrl: env.NIGHTSHIFT_BASE_URL,
      apiKey: env.NIGHTSHIFT_API_KEY,
      model: env.NIGHTSHIFT_MODEL,
    });
  }
  return noModelGenerator;
}
