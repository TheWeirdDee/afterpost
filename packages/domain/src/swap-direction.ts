import { compareEvmAddress } from "./address.js";

export type SwapSide = "buy" | "sell" | "unknown";

export interface PoolOrdering {
  token0: string;
  token1: string;
}

export interface RawSwapAmounts {
  /** Signed delta for token0, as emitted by the pool (int256 as bigint). */
  amount0: bigint;
  /** Signed delta for token1, as emitted by the pool (int256 as bigint). */
  amount1: bigint;
}

export interface SwapDirectionResult {
  side: SwapSide;
  /** Absolute WETH-side amount for this single pool Swap log. */
  wethAmountRaw: bigint;
}

/**
 * Derives buy/sell side and WETH-side notional for one canonical pool Swap
 * log (PRD §7.4). The pair token is whichever of token0/token1 is not the
 * campaign token; direction is read from signed amounts, never guessed from
 * string address case. If the pool does not actually contain the pair token,
 * the caller has a data integrity bug upstream — this function assumes the
 * pool/token pairing was already validated against onchain token0/token1.
 */
export function resolveSwapDirection(
  token: string,
  pairToken: string,
  pool: PoolOrdering,
  amounts: RawSwapAmounts,
): SwapDirectionResult {
  const tokenIsToken0 = compareEvmAddress(token, pool.token0) === 0;
  const tokenIsToken1 = compareEvmAddress(token, pool.token1) === 0;

  if (!tokenIsToken0 && !tokenIsToken1) {
    return { side: "unknown", wethAmountRaw: 0n };
  }

  const pairSigned = tokenIsToken0 ? amounts.amount1 : amounts.amount0;

  if (pairSigned === 0n) {
    return { side: "unknown", wethAmountRaw: 0n };
  }

  const side: SwapSide = pairSigned > 0n ? "buy" : "sell";
  const wethAmountRaw = pairSigned > 0n ? pairSigned : -pairSigned;

  return { side, wethAmountRaw };
}
