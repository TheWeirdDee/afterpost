/**
 * Assessment group 1: verified delivery (PRD §8.1).
 */

export type DeliverableVerificationState =
  | "verified_fulfilled"
  | "user_confirmed_fulfilled"
  | "unresolved"
  | "late"
  | "missed";

export interface DeliverableOutcome {
  deliverableId: string;
  requiredQuantity: number;
  state: DeliverableVerificationState;
  dueAt: Date | null;
  verifiedAt: Date | null;
}

export interface FulfilmentRatioResult {
  /** null when the denominator is not confirmed/positive — never silently 0. */
  verifiedFulfilmentRatio: number | null;
  userConfirmedFulfilmentRatio: number | null;
  totalRequiredUnits: number;
  verifiedFulfilledUnits: number;
  userConfirmedFulfilledUnits: number;
  unresolvedUnits: number;
  lateUnits: number;
  missedUnits: number;
}

/**
 * verified_fulfilment_ratio = independently verified fulfilled units / total
 * required units, only if denominator is confirmed and > 0. Pending/unresolved
 * units are reported separately, never folded into "failed" or "0".
 */
export function computeFulfilmentRatio(
  outcomes: readonly DeliverableOutcome[],
): FulfilmentRatioResult {
  const totalRequiredUnits = outcomes.reduce((sum, o) => sum + o.requiredQuantity, 0);

  const sumWhere = (predicate: (o: DeliverableOutcome) => boolean): number =>
    outcomes.filter(predicate).reduce((sum, o) => sum + o.requiredQuantity, 0);

  const verifiedFulfilledUnits = sumWhere((o) => o.state === "verified_fulfilled");
  const userConfirmedFulfilledUnits = sumWhere(
    (o) => o.state === "verified_fulfilled" || o.state === "user_confirmed_fulfilled",
  );
  const unresolvedUnits = sumWhere((o) => o.state === "unresolved");
  const lateUnits = sumWhere((o) => o.state === "late");
  const missedUnits = sumWhere((o) => o.state === "missed");

  const hasConfirmedDenominator = totalRequiredUnits > 0;

  return {
    verifiedFulfilmentRatio: hasConfirmedDenominator
      ? verifiedFulfilledUnits / totalRequiredUnits
      : null,
    userConfirmedFulfilmentRatio: hasConfirmedDenominator
      ? userConfirmedFulfilledUnits / totalRequiredUnits
      : null,
    totalRequiredUnits,
    verifiedFulfilledUnits,
    userConfirmedFulfilledUnits,
    unresolvedUnits,
    lateUnits,
    missedUnits,
  };
}

/** A verified post date after the promised due time (PRD §8.1 "Late deliverables"). */
export function isLateDeliverable(dueAt: Date | null, verifiedAt: Date | null): boolean {
  if (!dueAt || !verifiedAt) return false;
  return verifiedAt.getTime() > dueAt.getTime();
}
