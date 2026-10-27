import { describe, expect, it } from "vitest";
import { compareEvmAddress, canonicalAddress, isSameAddress } from "./address.js";

describe("address ordering", () => {
  it("orders by numeric value, not string case", () => {
    // #given
    const low = "0x0000000000000000000000000000000000000001";
    const high = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";
    // #when / #then
    expect(compareEvmAddress(low, high)).toBeLessThan(0);
    expect(compareEvmAddress(high, low)).toBeGreaterThan(0);
  });

  it("treats same address with different casing as equal", () => {
    // #given
    const a = "0xAbCdEf0000000000000000000000000000000001";
    const b = "0xabcdef0000000000000000000000000000000001";
    // #when / #then
    expect(isSameAddress(a, b)).toBe(true);
    expect(canonicalAddress(a)).toBe(canonicalAddress(b));
  });

  it("rejects malformed addresses", () => {
    // #given
    const malformed = "not-an-address";
    // #when / #then
    expect(() => canonicalAddress(malformed)).toThrow();
  });
});
