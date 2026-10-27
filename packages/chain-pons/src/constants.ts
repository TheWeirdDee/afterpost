/**
 * Verified pons/Robinhood Chain reference data (PRD §7.2), confirmed live
 * against the public RPC on 2026-10-27:
 *   eth_chainId                 -> 0x1237 (4663)
 *   eth_getTransactionReceipt   -> reference launch tx present, status 0x1,
 *                                  TokenLaunched emitted on the legacy
 *                                  factory, Swap topic0 matches Uniswap V3.
 *
 * These are integration starting points, not a guarantee every launchpad or
 * protocol version matches. Always confirm factory/pool pairing by reading
 * onchain state (token0/token1), never by address string/name inference.
 */

export const ROBINHOOD_CHAIN_ID = 4663;
export const ROBINHOOD_RPC_URL = "https://rpc.mainnet.chain.robinhood.com";

export const PONS_ACTIVE_FACTORY = "0xA5aAb3F0c6EeadF30Ef1D3Eb997108E976351feB" as const;
export const PONS_ACTIVE_FACTORY_START_BLOCK = 8_991_118n;

export const PONS_LEGACY_FACTORY = "0x0c37a24F5D23A486FA692d1500881d698B1F77a4" as const;
export const PONS_LEGACY_FACTORY_START_BLOCK = 8_600_612n;

export const WETH_ADDRESS = "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73" as const;

/** topic0 for the pons factory's TokenLaunched event. */
export const TOKEN_LAUNCHED_TOPIC0 =
  "0xdb51ea9ad51ab453a65a4cb7e60c3cb378c9501bb002609f8f97778fb6c4235a" as const;

/** topic0 for Uniswap V3 Swap(address,address,int256,int256,uint160,uint128,int24). */
export const UNISWAP_V3_SWAP_TOPIC0 =
  "0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67" as const;

export const REFERENCE_PONS_TOKEN = "0x39dBED3a2bd333467115dE45665cC57F813C4571" as const;
export const REFERENCE_PONS_POOL = "0x10CC6BD38112cAc182db90B6a71d8Bb5939526bA" as const;
export const REFERENCE_LAUNCH_TX =
  "0x1f54f25fec2d963dcb338ecb8b46a6eb123198a5c7a746d34cb2dbe78d074af8" as const;

/** Blocks held back from "safe head" to absorb shallow reorgs (PRD §20.1 starting param). */
export const DEFAULT_SAFE_BLOCK_LAG = 30n;

/**
 * The public RPC rejects eth_getLogs spans over 10,000,000 blocks (observed
 * live 2026-10-27). Start conservatively below that cap and let callers halve
 * on timeout, per PRD §7.3 step 5.
 */
export const MAX_GET_LOGS_BLOCK_SPAN = 9_000_000n;
export const MIN_GET_LOGS_BLOCK_SPAN = 1_000n;
