import { describe, expect, it } from "vitest";
import { computeAddressRetention, computeHolderBalanceRetention } from "./holder-cohorts.js";
import type { CohortAddressBalance } from "./holder-cohorts.js";

describe("computeAddressRetention", () => {
  it("returns PENDING, never 0%, when the horizon is in the future", () => {
    // #given — PRD §8.5: "+72h is in the future" => PENDING, not 0%
    const cohort: CohortAddressBalance[] = [
      { address: "0xabc", entryBalanceRaw: 100n, balanceAtHorizonRaw: null },
    ];
    // #when
    const result = computeAddressRetention(cohort, false, true);
    // #then
    expect(result.coverage).toBe("pending");
    expect(result.addressRetentionRatio).toBeNull();
  });

  it("retains an address holding at +24h but drops it by +72h", () => {
    // #given — PRD §8.5: held at +24h, not at +72h
    const at24h: CohortAddressBalance[] = [
      { address: "0xabc", entryBalanceRaw: 100n, balanceAtHorizonRaw: 50n },
    ];
    const at72h: CohortAddressBalance[] = [
      { address: "0xabc", entryBalanceRaw: 100n, balanceAtHorizonRaw: 0n },
    ];
    // #when
    const result24h = computeAddressRetention(at24h, true, true);
    const result72h = computeAddressRetention(at72h, true, true);
    // #then
    expect(result24h.addressRetentionRatio).toBe(1);
    expect(result72h.addressRetentionRatio).toBe(0);
  });

  it("reports unavailable rather than guessing when data is incomplete", () => {
    // #given
    const cohort: CohortAddressBalance[] = [
      { address: "0xabc", entryBalanceRaw: 100n, balanceAtHorizonRaw: 50n },
    ];
    // #when
    const result = computeAddressRetention(cohort, true, false);
    // #then
    expect(result.coverage).toBe("unavailable");
    expect(result.addressRetentionRatio).toBeNull();
  });
});

describe("computeHolderBalanceRetention", () => {
  it("can exceed 100% because it is a value ratio, not a count", () => {
    // #given — cohort grew its position
    const cohort: CohortAddressBalance[] = [
      { address: "0xabc", entryBalanceRaw: 100n, balanceAtHorizonRaw: 150n },
    ];
    // #when
    const ratio = computeHolderBalanceRetention(cohort);
    // #then
    expect(ratio).toBe(1.5);
  });

  it("returns null instead of dividing by zero when cohort entry balance is zero", () => {
    // #given
    const cohort: CohortAddressBalance[] = [];
    // #when
    const ratio = computeHolderBalanceRetention(cohort);
    // #then
    expect(ratio).toBeNull();
  });
});
