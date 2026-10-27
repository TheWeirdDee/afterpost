import { createPublicClient, http, decodeEventLog, type PublicClient } from "viem";
import { resolveSwapDirection } from "@afterpost/domain";
import {
  decodeTokenLaunchedTopics,
  ERC20_ABI,
  extractPoolCandidateFromTokenLaunchedData,
  UNISWAP_V3_POOL_ABI,
} from "./abis.js";
import { scanLogsInChunks } from "./chunked-log-scan.js";
import {
  DEFAULT_SAFE_BLOCK_LAG,
  PONS_ACTIVE_FACTORY,
  PONS_ACTIVE_FACTORY_START_BLOCK,
  PONS_LEGACY_FACTORY,
  PONS_LEGACY_FACTORY_START_BLOCK,
  ROBINHOOD_CHAIN_ID,
  ROBINHOOD_RPC_URL,
  TOKEN_LAUNCHED_TOPIC0,
  UNISWAP_V3_SWAP_TOPIC0,
  WETH_ADDRESS,
} from "./constants.js";
import type {
  BlockIdentity,
  ChainAdapter,
  PoolIdentity,
  RawTransactionEvidence,
  SwapObservation,
  TokenIdentity,
  TransferObservation,
} from "./types.js";

export interface PonsRobinhoodAdapterOptions {
  rpcUrl?: string;
  safeBlockLag?: bigint;
  factories?: readonly `0x${string}`[];
}

/**
 * Read-only ChainAdapter for pons on Robinhood Chain (PRD §7.2-§7.5).
 * No method signs or broadcasts a transaction.
 */
export class PonsRobinhoodAdapter implements ChainAdapter {
  readonly chainId = ROBINHOOD_CHAIN_ID;
  private readonly client: PublicClient;
  private readonly safeBlockLag: bigint;
  private readonly factories: readonly `0x${string}`[];

  constructor(options: PonsRobinhoodAdapterOptions = {}) {
    this.client = createPublicClient({
      transport: http(options.rpcUrl ?? ROBINHOOD_RPC_URL),
    });
    this.safeBlockLag = options.safeBlockLag ?? DEFAULT_SAFE_BLOCK_LAG;
    // Legacy first: observed live (2026-10-27) that the active factory has
    // an enormous launch volume (thousands of TokenLaunched events per
    // narrow block range) versus a comparatively small legacy history.
    // Scanning legacy first and returning as soon as a match is confirmed
    // avoids a multi-minute blind scan of the active factory's full history
    // for a token that already resolved. A project with a known
    // platform_version/factory_address (PRD §7.6) should skip this
    // ambiguity entirely in production by scanning only its own factory.
    this.factories = options.factories ?? [PONS_LEGACY_FACTORY, PONS_ACTIVE_FACTORY];
  }

  /** Verifies the RPC endpoint actually serves chain 4663 before trusting anything else. */
  async assertChainId(): Promise<void> {
    const actual = await this.client.getChainId();
    if (actual !== this.chainId) {
      throw new Error(`RPC reports chainId=${actual}, expected ${this.chainId}`);
    }
  }

  async validateToken(address: `0x${string}`): Promise<TokenIdentity> {
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      this.client.readContract({ address, abi: ERC20_ABI, functionName: "name" }),
      this.client.readContract({ address, abi: ERC20_ABI, functionName: "symbol" }),
      this.client.readContract({ address, abi: ERC20_ABI, functionName: "decimals" }),
      this.client.readContract({ address, abi: ERC20_ABI, functionName: "totalSupply" }),
    ]);

    return {
      address,
      name,
      symbol,
      decimals,
      totalSupplyRaw: totalSupply.toString(),
    };
  }

  /**
   * Finds TokenLaunched logs for this token, then independently verifies
   * each pool candidate by reading its own token0()/token1() state — never
   * trusting the factory event's data payload for pairing (PRD §7.2).
   */
  async discoverPools(token: `0x${string}`): Promise<PoolIdentity[]> {
    const pools: PoolIdentity[] = [];
    const latestBlock = await this.client.getBlockNumber();

    for (const factory of this.factories) {
      const factoryStartBlock =
        factory.toLowerCase() === PONS_ACTIVE_FACTORY.toLowerCase()
          ? PONS_ACTIVE_FACTORY_START_BLOCK
          : PONS_LEGACY_FACTORY_START_BLOCK;

      const logs = await scanLogsInChunks(
        this.client,
        { address: factory, topics: [TOKEN_LAUNCHED_TOPIC0] },
        factoryStartBlock,
        latestBlock,
      );

      for (const log of logs) {
        if (log.topics[0]?.toLowerCase() !== TOKEN_LAUNCHED_TOPIC0.toLowerCase()) continue;

        const decoded = decodeTokenLaunchedTopics(log.topics);
        if (!decoded || decoded.token.toLowerCase() !== token.toLowerCase()) continue;

        const poolCandidate = extractPoolCandidateFromTokenLaunchedData(log.data);
        if (!poolCandidate) continue;

        const [token0, token1] = await Promise.all([
          this.client.readContract({
            address: poolCandidate,
            abi: UNISWAP_V3_POOL_ABI,
            functionName: "token0",
          }),
          this.client.readContract({
            address: poolCandidate,
            abi: UNISWAP_V3_POOL_ABI,
            functionName: "token1",
          }),
        ]);

        const tokenIsInPool =
          token0.toLowerCase() === token.toLowerCase() ||
          token1.toLowerCase() === token.toLowerCase();
        if (!tokenIsInPool) continue; // candidate did not actually verify; reject, do not guess

        pools.push({
          address: poolCandidate,
          token0,
          token1,
          discoveredAtBlock: log.blockNumber ?? 0n,
        });
      }

      // Stop scanning further factories once a verified match is found —
      // a token is launched by exactly one factory; continuing to scan an
      // unrelated factory's full history (potentially a very large volume,
      // see constructor note) wastes RPC budget for no additional evidence.
      if (pools.length > 0) break;
    }

    return pools;
  }

  async scanSwaps(
    pool: `0x${string}`,
    fromBlock: bigint,
    toBlock: bigint,
  ): Promise<SwapObservation[]> {
    const [token0, token1] = await Promise.all([
      this.client.readContract({ address: pool, abi: UNISWAP_V3_POOL_ABI, functionName: "token0" }),
      this.client.readContract({ address: pool, abi: UNISWAP_V3_POOL_ABI, functionName: "token1" }),
    ]);

    // WETH is unambiguously the "pair" side for every pons token/WETH pool.
    const pairToken = token0.toLowerCase() === WETH_ADDRESS.toLowerCase() ? token0 : token1;
    const campaignToken = pairToken === token0 ? token1 : token0;

    const logs = await scanLogsInChunks(
      this.client,
      { address: pool, event: UNISWAP_V3_POOL_ABI[2] },
      fromBlock,
      toBlock,
    );

    const observations: SwapObservation[] = [];

    for (const log of logs) {
      if (log.topics[0]?.toLowerCase() !== UNISWAP_V3_SWAP_TOPIC0.toLowerCase()) continue;
      if (
        log.blockNumber === null ||
        log.logIndex === null ||
        !log.blockHash ||
        !log.transactionHash
      ) {
        continue;
      }

      const decoded = decodeEventLog({
        abi: UNISWAP_V3_POOL_ABI,
        data: log.data,
        topics: log.topics,
      });

      const direction = resolveSwapDirection(
        campaignToken,
        pairToken,
        { token0, token1 },
        { amount0: decoded.args.amount0, amount1: decoded.args.amount1 },
      );

      const block = await this.client.getBlock({ blockHash: log.blockHash });

      observations.push({
        rawEventId: `${this.chainId}:${log.transactionHash}:${log.logIndex}:${log.blockHash}`,
        poolAddress: pool,
        txHash: log.transactionHash,
        logIndex: log.logIndex,
        blockNumber: log.blockNumber,
        blockHash: log.blockHash,
        blockTime: new Date(Number(block.timestamp) * 1000),
        side: direction.side,
        amount0Raw: decoded.args.amount0,
        amount1Raw: decoded.args.amount1,
        wethAmountRaw: direction.wethAmountRaw,
        sqrtPriceX96: decoded.args.sqrtPriceX96,
      });
    }

    return observations;
  }

  async scanTransfers(
    token: `0x${string}`,
    fromBlock: bigint,
    toBlock: bigint,
  ): Promise<TransferObservation[]> {
    const logs = await scanLogsInChunks(
      this.client,
      { address: token, event: ERC20_ABI[4] },
      fromBlock,
      toBlock,
    );

    const observations: TransferObservation[] = [];

    for (const log of logs) {
      if (
        log.blockNumber === null ||
        log.logIndex === null ||
        !log.blockHash ||
        !log.transactionHash
      ) {
        continue;
      }

      const decoded = decodeEventLog({ abi: ERC20_ABI, data: log.data, topics: log.topics });
      const block = await this.client.getBlock({ blockHash: log.blockHash });

      observations.push({
        rawEventId: `${this.chainId}:${log.transactionHash}:${log.logIndex}:${log.blockHash}`,
        tokenAddress: token,
        txHash: log.transactionHash,
        logIndex: log.logIndex,
        blockNumber: log.blockNumber,
        blockHash: log.blockHash,
        blockTime: new Date(Number(block.timestamp) * 1000),
        from: decoded.args.from,
        to: decoded.args.to,
        amountRaw: decoded.args.value,
      });
    }

    return observations;
  }

  async resolveTransaction(txHash: `0x${string}`): Promise<RawTransactionEvidence> {
    const receipt = await this.client.getTransactionReceipt({ hash: txHash });
    return {
      txHash,
      blockNumber: receipt.blockNumber,
      blockHash: receipt.blockHash,
      status: receipt.status === "success" ? "success" : "reverted",
      from: receipt.from,
      to: receipt.to,
    };
  }

  async getCanonicalBlock(blockNumber: bigint): Promise<BlockIdentity> {
    const block = await this.client.getBlock({ blockNumber });
    return {
      number: block.number,
      hash: block.hash,
      parentHash: block.parentHash,
      timestamp: new Date(Number(block.timestamp) * 1000),
    };
  }

  async getLatestSafeBlock(): Promise<bigint> {
    const latest = await this.client.getBlockNumber();
    const safe = latest - this.safeBlockLag;
    return safe > 0n ? safe : 0n;
  }
}
