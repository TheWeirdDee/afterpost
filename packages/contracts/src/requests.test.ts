import { describe, expect, it } from "vitest";
import { CreateCampaignRequestSchema, CreateProjectRequestSchema } from "./requests.js";

describe("CreateCampaignRequestSchema", () => {
  it("accepts the PRD §14.3 example request shape", () => {
    // #given — taken directly from the PRD's own illustrative example
    const input = {
      projectId: "prj_1",
      partnerId: "ptr_1",
      title: "October launch awareness campaign",
      startAt: "2026-10-23T00:00:00Z",
      endAt: "2026-10-27T23:59:00Z",
      goal: "DELIVERY_AND_AWARENESS",
      agreedFee: { amount: "500.00", currency: "USD" },
      deliverables: [
        { kind: "POST", channel: "x", quantity: 2, dueAt: "2026-10-25T18:00:00Z" },
        {
          kind: "COMMUNITY_MENTION",
          channel: "telegram",
          quantity: 1,
          dueAt: "2026-10-26T18:00:00Z",
        },
      ],
    };
    // #when
    const result = CreateCampaignRequestSchema.safeParse(input);
    // #then
    expect(result.success).toBe(true);
  });

  it("rejects a campaign with zero deliverables", () => {
    // #given
    const input = {
      projectId: "prj_1",
      partnerId: "ptr_1",
      title: "No deliverables",
      startAt: "2026-10-23T00:00:00Z",
      endAt: "2026-10-27T23:59:00Z",
      goal: "OTHER",
      deliverables: [],
    };
    // #when
    const result = CreateCampaignRequestSchema.safeParse(input);
    // #then
    expect(result.success).toBe(false);
  });

  it("rejects a non-decimal-string money amount (never a JS number)", () => {
    // #given
    const input = {
      projectId: "prj_1",
      partnerId: "ptr_1",
      title: "Bad money shape",
      startAt: "2026-10-23T00:00:00Z",
      endAt: "2026-10-27T23:59:00Z",
      goal: "OTHER",
      agreedFee: { amount: 500, currency: "USD" }, // number, not string — must fail
      deliverables: [{ kind: "POST", channel: "x", quantity: 1 }],
    };
    // #when
    const result = CreateCampaignRequestSchema.safeParse(input);
    // #then
    expect(result.success).toBe(false);
  });
});

describe("CreateProjectRequestSchema", () => {
  it("accepts a real verified-format token address", () => {
    // #given — the actual reference pons token address from docs/INTEGRATIONS.md
    const input = {
      name: "Reference project",
      chainId: 4663,
      tokenAddress: "0x39dBED3a2bd333467115dE45665cC57F813C4571",
      platform: "pons",
    };
    // #when
    const result = CreateProjectRequestSchema.safeParse(input);
    // #then
    expect(result.success).toBe(true);
  });

  it("rejects a malformed token address", () => {
    // #given
    const input = { name: "Bad", chainId: 4663, tokenAddress: "not-an-address", platform: "pons" };
    // #when
    const result = CreateProjectRequestSchema.safeParse(input);
    // #then
    expect(result.success).toBe(false);
  });
});
