import { describe, expect, it } from "vitest";
import { evaluateQualifyingConversion, selectEligibleAssociation } from "./attribution.js";
import type { AttributionPolicy, CandidateChainAcquisition, WalletAssociation } from "./attribution.js";

const POLICY: AttributionPolicy = {
  version: "v1",
  attributionWindowMs: 7 * 24 * 60 * 60 * 1000,
  touchModel: "last_touch",
};

function makeAssociation(overrides: Partial<WalletAssociation> = {}): WalletAssociation {
  return {
    walletAddress: "0xabc",
    campaignId: "cmp_1",
    trackingLinkId: "trk_1",
    signedAt: new Date("2026-10-01T00:00:00Z"),
    expiresAt: new Date("2026-12-01T00:00:00Z"),
    revokedAt: null,
    ...overrides,
  };
}

function makeAcquisition(overrides: Partial<CandidateChainAcquisition> = {}): CandidateChainAcquisition {
  return {
    walletAddress: "0xabc",
    campaignId: "cmp_1",
    tokenId: "tok_1",
    txTimestamp: new Date("2026-10-02T00:00:00Z"),
    buyerRecipientResolved: true,
    isSystemWallet: false,
    isNonPurchaseTransfer: false,
    ...overrides,
  };
}

describe("evaluateQualifyingConversion", () => {
  it("verifies a genuine consented wallet with a qualifying transaction", () => {
    // #given — PRD §4.3 acceptance: genuine consented wallet + qualifying tx
    const association = makeAssociation();
    const acquisition = makeAcquisition();
    // #when
    const result = evaluateQualifyingConversion(association, acquisition, POLICY);
    // #then
    expect(result.resolution).toBe("verified_buy");
  });

  it("does not attribute a random transaction with no association", () => {
    // #given — PRD §4.3 acceptance: random tx after a post is not attributed
    const association = makeAssociation({ walletAddress: "0xdifferent" });
    const acquisition = makeAcquisition();
    // #when
    const result = evaluateQualifyingConversion(association, acquisition, POLICY);
    // #then
    expect(result.resolution).toBe("unresolved");
    expect(result.reasons).toContain("wallet_mismatch");
  });

  it("rejects a treasury transfer as a purchase (PRD §8.5 causation trap)", () => {
    // #given
    const association = makeAssociation();
    const acquisition = makeAcquisition({ isNonPurchaseTransfer: true });
    // #when
    const result = evaluateQualifyingConversion(association, acquisition, POLICY);
    // #then
    expect(result.resolution).toBe("rejected");
  });

  it("does not label a router the unique buyer when recipient is unresolved", () => {
    // #given — PRD §8.5: "Pool swap emitted by router"
    const association = makeAssociation();
    const acquisition = makeAcquisition({ buyerRecipientResolved: false });
    // #when
    const result = evaluateQualifyingConversion(association, acquisition, POLICY);
    // #then
    expect(result.resolution).toBe("unresolved");
    expect(result.reasons).toContain("buyer_recipient_unresolved");
  });

  it("rejects a conversion outside the attribution window", () => {
    // #given
    const association = makeAssociation({ signedAt: new Date("2026-01-01T00:00:00Z") });
    const acquisition = makeAcquisition({ txTimestamp: new Date("2026-02-01T00:00:00Z") });
    // #when
    const result = evaluateQualifyingConversion(association, acquisition, POLICY);
    // #then
    expect(result.resolution).toBe("unresolved");
    expect(result.reasons).toContain("outside_attribution_window");
  });

  it("rejects signature replay after expiry", () => {
    // #given — PRD §18.4 "Token expiry" / "Signature replay"
    const association = makeAssociation({ expiresAt: new Date("2026-10-01T12:00:00Z") });
    const acquisition = makeAcquisition({ txTimestamp: new Date("2026-10-02T00:00:00Z") });
    // #when
    const result = evaluateQualifyingConversion(association, acquisition, POLICY);
    // #then
    expect(result.resolution).toBe("unresolved");
    expect(result.reasons).toContain("association_expired_before_conversion");
  });
});

describe("selectEligibleAssociation", () => {
  it("credits only one association under last-touch when two links were clicked", () => {
    // #given — PRD §8.5: two tracking links clicked by same opted-in wallet
    const earlier = makeAssociation({ trackingLinkId: "trk_early", signedAt: new Date("2026-10-01T00:00:00Z") });
    const later = makeAssociation({ trackingLinkId: "trk_late", signedAt: new Date("2026-10-02T00:00:00Z") });
    // #when
    const selected = selectEligibleAssociation(
      [earlier, later],
      new Date("2026-10-03T00:00:00Z"),
      "last_touch",
    );
    // #then
    expect(selected?.trackingLinkId).toBe("trk_late");
  });

  it("returns null when no association precedes the conversion", () => {
    // #given
    const future = makeAssociation({ signedAt: new Date("2026-11-01T00:00:00Z") });
    // #when
    const selected = selectEligibleAssociation([future], new Date("2026-10-03T00:00:00Z"), "last_touch");
    // #then
    expect(selected).toBeNull();
  });
});
