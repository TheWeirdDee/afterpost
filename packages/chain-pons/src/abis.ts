/**
 * Only standard, publicly canonical interfaces are hardcoded here: ERC-20
 * (read methods + Transfer event) and the Uniswap V3 pool's token0/token1
 * accessors + Swap event. These are not pons-specific guesses — they are
 * the stable interfaces pons documents its pools as using (token/WETH V3
 * pools, per PRD §7.2's protocol-version guard).
 */

export const ERC20_ABI = [
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
  {
    type: "function",
    name: "totalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
] as const;

export const UNISWAP_V3_POOL_ABI = [
  {
    type: "function",
    name: "token0",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "token1",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "event",
    name: "Swap",
    inputs: [
      { name: "sender", type: "address", indexed: true },
      { name: "recipient", type: "address", indexed: true },
      { name: "amount0", type: "int256", indexed: false },
      { name: "amount1", type: "int256", indexed: false },
      { name: "sqrtPriceX96", type: "uint160", indexed: false },
      { name: "liquidity", type: "uint128", indexed: false },
      { name: "tick", type: "int24", indexed: false },
    ],
  },
] as const;

/**
 * The pons factory's TokenLaunched event topic0 is verified live (PRD §7.2)
 * by direct observation of REFERENCE_LAUNCH_TX's raw logs — NOT by hashing
 * an assumed event signature. Its full Solidity signature (and therefore
 * its true ABI) is unknown: a declared `event TokenLaunched(address,
 * address, address)` hashes to a DIFFERENT topic0 than the one actually
 * observed on-chain (confirmed live: viem's own toEventSelector() for that
 * guessed signature does not match TOKEN_LAUNCHED_TOPIC0). Any additional
 * non-indexed parameter types we don't know about change the hash.
 *
 * Consequence: this factory event is NEVER matched via an ABI-driven
 * `event` filter (which would make viem recompute topic0 from a guessed
 * signature and silently return zero results). It is matched by filtering
 * raw `topics[0]` against TOKEN_LAUNCHED_TOPIC0 directly, and decoded by
 * reading `topics[1]`/`topics[2]` positionally (confirmed against
 * REFERENCE_LAUNCH_TX: topics[1]=token, topics[2]=creator) plus the pool
 * address from data word[1] via `extractPoolCandidateFromTokenLaunchedData`.
 * Every pool candidate extracted this way is independently re-verified by
 * reading its own token0()/token1() state before being accepted — never
 * trusted from this event's data alone.
 */
export function decodeTokenLaunchedTopics(topics: readonly `0x${string}`[]): {
  token: `0x${string}`;
  creator: `0x${string}`;
} | null {
  const tokenTopic = topics[1];
  const creatorTopic = topics[2];
  if (!tokenTopic || !creatorTopic) return null;
  return {
    token: `0x${tokenTopic.slice(-40)}`,
    creator: `0x${creatorTopic.slice(-40)}`,
  };
}

/**
 * Reads the pool candidate address out of the TokenLaunched log's raw data,
 * per the layout observed in REFERENCE_LAUNCH_TX: word[0] = pair token
 * (WETH), word[1] = pool address. Returns null if the data is too short to
 * contain a second word.
 */
export function extractPoolCandidateFromTokenLaunchedData(dataHex: `0x${string}`): `0x${string}` | null {
  const hex = dataHex.slice(2);
  const wordLength = 64;
  if (hex.length < wordLength * 2) return null;
  const secondWord = hex.slice(wordLength, wordLength * 2);
  const addressHex = secondWord.slice(secondWord.length - 40);
  return `0x${addressHex}`;
}
