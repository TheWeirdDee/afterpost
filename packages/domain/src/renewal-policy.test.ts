import { describe, expect, it } from "vitest";
import { evaluateRenewalPolicy } from "./renewal-policy.js";
import type { RenewalPolicyInput } from "./renewal-policy.js";

function baseInput(overrides: Partial<RenewalPolicyInput> = {}): RenewalPolicyInput {
  return {
    policyVersion: "v1",
    campaignTermsConfirmed: true,
    requiredSourceBroken: false,
    dueObligationsHaveUnresolvedProof: false,
    confirmedSeriousNonDeliveryWithVerifiedSource: false,
    deliveryRequirementsMet: true,
    declaredCampaignGoalSupported: true,
    ...overrides,
  };
}

describe("evaluateRenewalPolicy", () => {
  it("never lets absent attribution alone trigger an adverse decision", () => {
    // #given — PRD §8.4 guardrail: missing tracking must not force a bad outcome
    const input = baseInput({ declaredCampaignGoalSupported: null });
    // #when
    const result = evaluateRenewalPolicy(input);
    // #then
    expect(result.suggestedAction).toBe("conditional_trial");
    expect(result.suggestedAction).not.toBe("do_not_renew");
  });

  it("returns insufficient_data when campaign terms are unconfirmed", () => {
    // #given
    const input = baseInput({ campaignTermsConfirmed: false });
    // #when
    const result = evaluateRenewalPolicy(input);
    // #then
    expect(result.suggestedAction).toBe("insufficient_data");
  });

  it("returns request_evidence when due obligations have unresolved proof", () => {
    // #given
    const input = baseInput({ dueObligationsHaveUnresolvedProof: true });
    // #when
    const result = evaluateRenewalPolicy(input);
    // #then
    expect(result.suggestedAction).toBe("request_evidence");
  });

  it("returns do_not_renew only with confirmed, verified-source non-delivery", () => {
    // #given
    const input = baseInput({ confirmedSeriousNonDeliveryWithVerifiedSource: true });
    // #when
    const result = evaluateRenewalPolicy(input);
    // #then
    expect(result.suggestedAction).toBe("do_not_renew");
  });

  it("returns renew when delivery is met and the declared goal is supported", () => {
    // #given — delivery fully met, goal measurably supported
    const input = baseInput();
    // #when
    const result = evaluateRenewalPolicy(input);
    // #then
    expect(result.suggestedAction).toBe("renew");
  });

  it("falls back to conditional_trial when delivery is unmet but nothing is a confirmed failure", () => {
    // #given
    const input = baseInput({ deliveryRequirementsMet: false });
    // #when
    const result = evaluateRenewalPolicy(input);
    // #then
    expect(result.suggestedAction).toBe("conditional_trial");
  });
});
