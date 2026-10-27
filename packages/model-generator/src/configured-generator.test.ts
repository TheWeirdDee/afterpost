import { describe, expect, it } from "vitest";
import { buildConfiguredGenerator } from "./configured-generator.js";

describe("buildConfiguredGenerator", () => {
  it("falls back to no-model sample mode when Nightshift is not configured", async () => {
    // #given — zero credentials, exactly the judge's environment
    const generator = buildConfiguredGenerator({});
    // #when
    const result = await generator("investigate campaign X", undefined, undefined);
    // #then
    expect(result.isFallback).toBe(true);
    expect(result.text).toContain("investigate campaign X");
  });

  it("falls back when only some Nightshift config is present", async () => {
    // #given
    const generator = buildConfiguredGenerator({ NIGHTSHIFT_BASE_URL: "https://example.com" });
    // #when
    const result = await generator("x", undefined, undefined);
    // #then
    expect(result.isFallback).toBe(true);
  });
});
