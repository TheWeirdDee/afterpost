import { describe, expect, it } from "vitest";
import { resolveSwapDirection } from "./swap-direction.js";

const WETH = "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73";
const CAMPAIGN_TOKEN = "0x39dBED3a2bd333467115dE45665cC57F813C4571";

describe("resolveSwapDirection", () => {
  it("classifies a buy when campaign token is token0 and pair side amount is positive", () => {
    // #given — campaign token numerically lower than WETH => token0
    const pool = { token0: CAMPAIGN_TOKEN, token1: WETH };
    // #when
    const result = resolveSwapDirection(CAMPAIGN_TOKEN, WETH, pool, {
      amount0: -1_000_000n,
      amount1: 2_000_000n,
    });
    // #then
    expect(result.side).toBe("buy");
    expect(result.wethAmountRaw).toBe(2_000_000n);
  });

  it("classifies a sell when the pair side amount is negative", () => {
    // #given
    const pool = { token0: CAMPAIGN_TOKEN, token1: WETH };
    // #when
    const result = resolveSwapDirection(CAMPAIGN_TOKEN, WETH, pool, {
      amount0: 1_000_000n,
      amount1: -2_000_000n,
    });
    // #then
    expect(result.side).toBe("sell");
    expect(result.wethAmountRaw).toBe(2_000_000n);
  });

  it("works identically when campaign token is token1 instead of token0", () => {
    // #given — ordering flipped relative to the first test
    const pool = { token0: WETH, token1: CAMPAIGN_TOKEN };
    // #when
    const result = resolveSwapDirection(CAMPAIGN_TOKEN, WETH, pool, {
      amount0: 2_000_000n,
      amount1: -1_000_000n,
    });
    // #then
    expect(result.side).toBe("buy");
    expect(result.wethAmountRaw).toBe(2_000_000n);
  });

  it("returns unknown rather than guessing when pair amount is zero", () => {
    // #given
    const pool = { token0: CAMPAIGN_TOKEN, token1: WETH };
    // #when
    const result = resolveSwapDirection(CAMPAIGN_TOKEN, WETH, pool, {
      amount0: 0n,
      amount1: 0n,
    });
    // #then
    expect(result.side).toBe("unknown");
  });

  it("returns unknown when the token is not actually part of the pool", () => {
    // #given
    const unrelatedToken = "0x1111111111111111111111111111111111111111";
    const pool = { token0: CAMPAIGN_TOKEN, token1: WETH };
    // #when
    const result = resolveSwapDirection(unrelatedToken, WETH, pool, {
      amount0: 1n,
      amount1: -1n,
    });
    // #then
    expect(result.side).toBe("unknown");
  });
});
