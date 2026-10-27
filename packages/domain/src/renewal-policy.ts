/**
 * Renewal policy engine (PRD §8.4). This is CODE, not the model: the backend
 * recomputes suggestedAction from this policy regardless of what the LLM
 * proposed, and records a disagreement if they differ (PRD §10.4).
 */

export type SuggestedAction =
  | "renew"
  | "conditional_trial"
  | "request_evidence"
  | "do_not_renew"
  | "insufficient_data";

export interface RenewalPolicyInput {
  policyVersion: string;
  campaignTermsConfirmed: boolean;
  requiredSourceBroken: boolean;
  dueObligationsHaveUnresolvedProof: boolean;
  confirmedSeriousNonDeliveryWithVerifiedSource: boolean;
  deliveryRequirementsMet: boolean;
  declaredCampaignGoalSupported: boolean | null; // null => goal unverifiable (e.g. no tracking configured)
}

export interface RenewalPolicyResult {
  suggestedAction: SuggestedAction;
  ruleId: string;
  reasons: string[];
}

/**
 * Default policy v1 (PRD §8.4). Guardrail: missing tracking evidence alone
 * must never trigger an adverse decision — it is reported as
 * declaredCampaignGoalSupported === null, which this function treats as
 * "goal unverifiable", not as a failure.
 */
export function evaluateRenewalPolicy(input: RenewalPolicyInput): RenewalPolicyResult {
  const base = { policyVersion: input.policyVersion };

  if (!input.campaignTermsConfirmed || input.requiredSourceBroken) {
    return {
      ...base,
      suggestedAction: "insufficient_data",
      ruleId: `${input.policyVersion}:insufficient_data`,
      reasons: !input.campaignTermsConfirmed
        ? ["campaign_terms_unconfirmed"]
        : ["required_source_broken"],
    };
  }

  if (input.dueObligationsHaveUnresolvedProof) {
    return {
      ...base,
      suggestedAction: "request_evidence",
      ruleId: `${input.policyVersion}:request_evidence`,
      reasons: ["due_obligations_unresolved_proof"],
    };
  }

  if (input.confirmedSeriousNonDeliveryWithVerifiedSource) {
    return {
      ...base,
      suggestedAction: "do_not_renew",
      ruleId: `${input.policyVersion}:do_not_renew`,
      reasons: ["confirmed_serious_non_delivery"],
    };
  }

  if (input.deliveryRequirementsMet && input.declaredCampaignGoalSupported === true) {
    return {
      ...base,
      suggestedAction: "renew",
      ruleId: `${input.policyVersion}:renew`,
      reasons: ["delivery_met_and_goal_supported"],
    };
  }

  if (input.declaredCampaignGoalSupported === null) {
    return {
      ...base,
      suggestedAction: "conditional_trial",
      ruleId: `${input.policyVersion}:conditional_trial_goal_unverifiable`,
      reasons: ["goal_unverifiable_no_tracking_configured"],
    };
  }

  return {
    ...base,
    suggestedAction: "conditional_trial",
    ruleId: `${input.policyVersion}:conditional_trial_default`,
    reasons: ["default_fallback"],
  };
}
