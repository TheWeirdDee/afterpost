/**
 * Assessment group 3: attributed acquisition (PRD §8.3).
 * Qualifying attribution requires ALL conditions in §8.3(1-5); partial
 * evidence must resolve to "unresolved" or "unattributed", never a guess.
 */

export type ConversionResolution = "verified_buy" | "unresolved" | "rejected";

export interface WalletAssociation {
  walletAddress: string;
  campaignId: string;
  trackingLinkId: string;
  signedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface CandidateChainAcquisition {
  walletAddress: string;
  campaignId: string;
  tokenId: string;
  txTimestamp: Date;
  /** True only when the Swap-side buyer and token recipient are the same
   * address in the same transaction. Router/aggregator flows that cannot
   * reliably resolve a buyer must be false. */
  buyerRecipientResolved: boolean;
  isSystemWallet: boolean;
  isNonPurchaseTransfer: boolean;
}

export interface AttributionPolicy {
  version: string;
  attributionWindowMs: number;
  /** "last_touch" or "first_touch"; PRD §8.3 default is last eligible touch within 7 days. */
  touchModel: "last_touch" | "first_touch";
}

export interface QualifyingConversionResult {
  resolution: ConversionResolution;
  reasons: string[];
}

/**
 * Evaluates one candidate chain acquisition against one wallet association
 * under a versioned attribution policy. Does not dedupe across multiple
 * associations for the same wallet — callers apply the touch model to pick
 * the single eligible association first (PRD §8.3.5, §8.5 "same opted-in wallet").
 */
export function evaluateQualifyingConversion(
  association: WalletAssociation,
  acquisition: CandidateChainAcquisition,
  policy: AttributionPolicy,
): QualifyingConversionResult {
  const reasons: string[] = [];

  if (association.campaignId !== acquisition.campaignId) {
    reasons.push("campaign_mismatch");
  }
  if (association.walletAddress.toLowerCase() !== acquisition.walletAddress.toLowerCase()) {
    reasons.push("wallet_mismatch");
  }
  if (association.revokedAt && association.revokedAt.getTime() <= acquisition.txTimestamp.getTime()) {
    reasons.push("association_revoked_before_conversion");
  }
  if (association.signedAt.getTime() > acquisition.txTimestamp.getTime()) {
    reasons.push("association_created_after_conversion");
  }
  if (association.expiresAt.getTime() < acquisition.txTimestamp.getTime()) {
    reasons.push("association_expired_before_conversion");
  }

  const windowEnd = association.signedAt.getTime() + policy.attributionWindowMs;
  if (acquisition.txTimestamp.getTime() > windowEnd) {
    reasons.push("outside_attribution_window");
  }

  if (acquisition.isSystemWallet) {
    reasons.push("system_wallet_excluded");
  }
  if (acquisition.isNonPurchaseTransfer) {
    reasons.push("non_purchase_transfer_excluded");
  }
  if (!acquisition.buyerRecipientResolved) {
    reasons.push("buyer_recipient_unresolved");
  }

  if (reasons.includes("system_wallet_excluded") || reasons.includes("non_purchase_transfer_excluded")) {
    return { resolution: "rejected", reasons };
  }

  if (reasons.length > 0) {
    return { resolution: "unresolved", reasons };
  }

  return { resolution: "verified_buy", reasons: [] };
}

/**
 * Picks the single eligible association per the configured touch model when
 * a wallet has clicked/signed multiple campaign links (PRD §8.3.5, §8.5).
 * Returns null when no association qualifies before the conversion.
 */
export function selectEligibleAssociation(
  associations: readonly WalletAssociation[],
  beforeOrAt: Date,
  touchModel: AttributionPolicy["touchModel"],
): WalletAssociation | null {
  const eligible = associations.filter(
    (a) => a.signedAt.getTime() <= beforeOrAt.getTime() && !a.revokedAt,
  );
  if (eligible.length === 0) return null;

  const sorted = [...eligible].sort((a, b) => a.signedAt.getTime() - b.signedAt.getTime());
  return touchModel === "first_touch" ? sorted[0]! : sorted[sorted.length - 1]!;
}
