/**
 * Assessment group 2: observed market activity — holder cohort definitions
 * (PRD §8.2, §8.5 adversarial cases).
 */

export type HorizonCoverage = "measured" | "pending" | "unavailable";

export interface RetentionResult {
  coverage: HorizonCoverage;
  /** null unless coverage === "measured". */
  retainedAddressCount: number | null;
  /** null unless coverage === "measured" and denominator > 0. */
  addressRetentionRatio: number | null;
}

export interface CohortAddressBalance {
  address: string;
  entryBalanceRaw: bigint;
  balanceAtHorizonRaw: bigint | null;
}

/**
 * address_retention_ratio = eligible cohort addresses with positive balance at
 * target / eligible cohort addresses, only if denominator > 0 and data complete.
 * If the target horizon has not elapsed yet, the result is PENDING, never 0%
 * (PRD §8.5: "+72h is in the future" => PENDING, not 0%).
 */
export function computeAddressRetention(
  cohort: readonly CohortAddressBalance[],
  horizonHasElapsed: boolean,
  dataComplete: boolean,
): RetentionResult {
  if (!horizonHasElapsed) {
    return { coverage: "pending", retainedAddressCount: null, addressRetentionRatio: null };
  }
  if (!dataComplete || cohort.length === 0) {
    return { coverage: "unavailable", retainedAddressCount: null, addressRetentionRatio: null };
  }

  const retainedAddressCount = cohort.filter(
    (c) => c.balanceAtHorizonRaw !== null && c.balanceAtHorizonRaw > 0n,
  ).length;

  return {
    coverage: "measured",
    retainedAddressCount,
    addressRetentionRatio: retainedAddressCount / cohort.length,
  };
}

/**
 * holder_balance_retention = balance of cohort at end / cohort balance at
 * entrance. Can exceed 100% — it is a value ratio, not a count retention metric.
 */
export function computeHolderBalanceRetention(
  cohort: readonly CohortAddressBalance[],
): number | null {
  const entryTotal = cohort.reduce((sum, c) => sum + c.entryBalanceRaw, 0n);
  if (entryTotal === 0n) return null;

  const endTotal = cohort.reduce(
    (sum, c) => sum + (c.balanceAtHorizonRaw ?? 0n),
    0n,
  );

  // Convert via Number only for the final ratio; raw sums stay bigint throughout.
  return Number(endTotal) / Number(entryTotal);
}

export type KnownAddressLabel =
  | "POOL"
  | "ROUTER"
  | "LOCKER"
  | "BURN"
  | "TOKEN_CONTRACT"
  | "CREATOR_KNOWN"
  | "TREASURY_KNOWN"
  | "EXCHANGE_KNOWN"
  | "UNCLASSIFIED";

const SYSTEM_LABELS: ReadonlySet<KnownAddressLabel> = new Set([
  "POOL",
  "ROUTER",
  "LOCKER",
  "BURN",
  "TOKEN_CONTRACT",
]);

/** Addresses excluded from *holder* counts (PRD §7.5), not from raw transfer accounting. */
export function isExcludedFromHolderCount(label: KnownAddressLabel): boolean {
  return SYSTEM_LABELS.has(label);
}
