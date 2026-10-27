import type { SwapSide } from "@afterpost/domain";

export interface TokenIdentity {
  address: `0x${string}`;
  name: string;
  symbol: string;
  decimals: number;
  totalSupplyRaw: string;
}

export interface PoolIdentity {
  address: `0x${string}`;
  token0: `0x${string}`;
  token1: `0x${string}`;
  discoveredAtBlock: bigint;
}

export interface SwapObservation {
  rawEventId: string;
  poolAddress: `0x${string}`;
  txHash: `0x${string}`;
  logIndex: number;
  blockNumber: bigint;
  blockHash: `0x${string}`;
  blockTime: Date;
  side: SwapSide;
  amount0Raw: bigint;
  amount1Raw: bigint;
  wethAmountRaw: bigint;
  sqrtPriceX96: bigint;
}

export interface TransferObservation {
  rawEventId: string;
  tokenAddress: `0x${string}`;
  txHash: `0x${string}`;
  logIndex: number;
  blockNumber: bigint;
  blockHash: `0x${string}`;
  blockTime: Date;
  from: `0x${string}`;
  to: `0x${string}`;
  amountRaw: bigint;
}

export interface RawTransactionEvidence {
  txHash: `0x${string}`;
  blockNumber: bigint;
  blockHash: `0x${string}`;
  status: "success" | "reverted";
  from: `0x${string}`;
  to: `0x${string}` | null;
}

export interface BlockIdentity {
  number: bigint;
  hash: `0x${string}`;
  parentHash: `0x${string}`;
  timestamp: Date;
}

/**
 * Chain adapter contract (PRD §7.2). Every implementation is read-only —
 * no method here may sign, broadcast, or submit a transaction.
 */
export interface ChainAdapter {
  chainId: number;
  validateToken(address: `0x${string}`): Promise<TokenIdentity>;
  discoverPools(token: `0x${string}`): Promise<PoolIdentity[]>;
  scanSwaps(pool: `0x${string}`, fromBlock: bigint, toBlock: bigint): Promise<SwapObservation[]>;
  scanTransfers(
    token: `0x${string}`,
    fromBlock: bigint,
    toBlock: bigint,
  ): Promise<TransferObservation[]>;
  resolveTransaction(txHash: `0x${string}`): Promise<RawTransactionEvidence>;
  getCanonicalBlock(blockNumber: bigint): Promise<BlockIdentity>;
  getLatestSafeBlock(): Promise<bigint>;
  getTokenBalanceAt?(address: `0x${string}`, block: bigint): Promise<bigint | null>;
}
