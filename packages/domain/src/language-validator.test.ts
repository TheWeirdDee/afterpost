import { describe, expect, it } from "vitest";
import { validateFindingLanguage } from "./language-validator.js";

describe("validateFindingLanguage", () => {
  it("rejects unsupported causal language for untracked campaigns", () => {
    // #given — PRD §8.5: 50 swaps after a post, no tracking
    const text = "This post generated 50 buyers for the token.";
    // #when
    const result = validateFindingLanguage(text, "observed_only");
    // #then
    expect(result.ok).toBe(false);
  });

  it("accepts precise observed-only language with no causal claim", () => {
    // #given
    const text = "The token saw 50 observed pool swaps after this post, between 18:00 and 20:00 UTC.";
    // #when
    const result = validateFindingLanguage(text, "observed_only");
    // #then
    expect(result.ok).toBe(true);
  });

  it("rejects a tracked-conversion claim without tracked_verified basis", () => {
    // #given
    const text = "This represents a tracked conversion from the campaign link.";
    // #when
    const result = validateFindingLanguage(text, "observed_only");
    // #then
    expect(result.ok).toBe(false);
    expect(result.violations).toContain("tracked_conversion_claim_without_tracked_verified_basis");
  });
});
