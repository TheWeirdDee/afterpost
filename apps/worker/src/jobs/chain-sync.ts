import type { PrismaClient } from "@prisma/client";
import type { ChainAdapter } from "@afterpost/chain-pons";

export interface ChainSyncResult {
  tokenId: string;
  poolsDiscovered: number;
  swapsUpserted: number;
  transfersUpserted: number;
  fromBlock: string;
  toBlock: string;
}

/**
 * Real indexer sync (PRD §7.3): discovers/persists pools, scans a bounded
 * recent block window for Swap/Transfer events via the live chain adapter,
 * and upserts them into Postgres keyed by the canonical composite index
 * (chainId, txHash, logIndex, blockHash) so a re-run or retry never
 * duplicates an event (PRD §7.3 step 10).
 */
export async function syncTokenChainData(
  prisma: PrismaClient,
  adapter: ChainAdapter,
  tokenId: string,
  options: { blockWindow?: bigint; toBlock?: bigint } = {},
): Promise<ChainSyncResult> {
  const token = await prisma.token.findUniqueOrThrow({ where: { id: tokenId } });
  const tokenAddress = token.contractAddress as `0x${string}`;

  // An explicit toBlock (PRD §14.2 POST /v1/projects/:id/sync {fromBlock?,
  // toBlock?}) pins an exact, reproducible window. Without one, each call
  // reads the live safe head — which genuinely moves between calls on a
  // fast chain, so two "re-syncs" a few seconds apart are NOT the same
  // window. That's correct indexer behavior, not a bug; callers who need
  // byte-identical re-ingestion for an idempotency check must pin toBlock.
  const latestSafeBlock = options.toBlock ?? (await adapter.getLatestSafeBlock());
  const blockWindow = options.blockWindow ?? 2_000n;
  const fromBlock = latestSafeBlock > blockWindow ? latestSafeBlock - blockWindow : 0n;

  const discoveredPools = await adapter.discoverPools(tokenAddress);
  let poolsDiscovered = 0;

  for (const pool of discoveredPools) {
    const existing = await prisma.pool.findUnique({
      where: { chainId_address: { chainId: adapter.chainId, address: pool.address.toLowerCase() } },
    });
    if (!existing) {
      await prisma.pool.create({
        data: {
          tokenId: token.id,
          chainId: adapter.chainId,
          address: pool.address.toLowerCase(),
          token0: pool.token0,
          token1: pool.token1,
          discoveredBlock: pool.discoveredAtBlock.toString(),
          verifiedAt: new Date(),
        },
      });
      poolsDiscovered += 1;
    }
  }

  const pools = await prisma.pool.findMany({ where: { tokenId: token.id } });

  let swapsUpserted = 0;
  for (const pool of pools) {
    const swaps = await adapter.scanSwaps(
      pool.address as `0x${string}`,
      fromBlock,
      latestSafeBlock,
    );
    for (const swap of swaps) {
      const rawEvent = await prisma.rawChainEvent.upsert({
        where: {
          chainId_txHash_logIndex_blockHash: {
            chainId: adapter.chainId,
            txHash: swap.txHash,
            logIndex: swap.logIndex,
            blockHash: swap.blockHash,
          },
        },
        create: {
          chainId: adapter.chainId,
          contractAddress: pool.address,
          txHash: swap.txHash,
          logIndex: swap.logIndex,
          blockNumber: swap.blockNumber.toString(),
          blockHash: swap.blockHash,
          topic0: "swap",
          topicsJson: [],
          dataHex: "0x",
        },
        update: {},
      });

      await prisma.swapObservation.upsert({
        where: { rawEventId: rawEvent.id },
        create: {
          rawEventId: rawEvent.id,
          poolId: pool.id,
          projectId: token.projectId,
          blockTime: swap.blockTime,
          side: swap.side.toUpperCase() as "BUY" | "SELL" | "UNKNOWN",
          amount0Raw: swap.amount0Raw.toString(),
          amount1Raw: swap.amount1Raw.toString(),
          wethAmountRaw: swap.wethAmountRaw.toString(),
          sqrtPriceX96: swap.sqrtPriceX96.toString(),
          normalizerVersion: "v1",
        },
        update: {},
      });
      swapsUpserted += 1;
    }
  }

  let transfersUpserted = 0;
  const transfers = await adapter.scanTransfers(tokenAddress, fromBlock, latestSafeBlock);
  for (const transfer of transfers) {
    const rawEvent = await prisma.rawChainEvent.upsert({
      where: {
        chainId_txHash_logIndex_blockHash: {
          chainId: adapter.chainId,
          txHash: transfer.txHash,
          logIndex: transfer.logIndex,
          blockHash: transfer.blockHash,
        },
      },
      create: {
        chainId: adapter.chainId,
        contractAddress: tokenAddress,
        txHash: transfer.txHash,
        logIndex: transfer.logIndex,
        blockNumber: transfer.blockNumber.toString(),
        blockHash: transfer.blockHash,
        topic0: "transfer",
        topicsJson: [],
        dataHex: "0x",
      },
      update: {},
    });

    await prisma.transferObservation.upsert({
      where: { rawEventId: rawEvent.id },
      create: {
        rawEventId: rawEvent.id,
        tokenId: token.id,
        fromAddress: transfer.from,
        toAddress: transfer.to,
        amountRaw: transfer.amountRaw.toString(),
        blockTime: transfer.blockTime,
      },
      update: {},
    });
    transfersUpserted += 1;
  }

  await prisma.chainSyncCursor.upsert({
    where: {
      chainId_contractAddress_eventType: {
        chainId: adapter.chainId,
        contractAddress: tokenAddress,
        eventType: "swap_transfer",
      },
    },
    create: {
      chainId: adapter.chainId,
      contractAddress: tokenAddress,
      eventType: "swap_transfer",
      lastScannedBlock: latestSafeBlock.toString(),
      latestSafeBlock: latestSafeBlock.toString(),
      lastSuccessAt: new Date(),
      status: "OK",
    },
    update: {
      lastScannedBlock: latestSafeBlock.toString(),
      latestSafeBlock: latestSafeBlock.toString(),
      lastSuccessAt: new Date(),
      status: "OK",
      failureCount: 0,
    },
  });

  return {
    tokenId: token.id,
    poolsDiscovered,
    swapsUpserted,
    transfersUpserted,
    fromBlock: fromBlock.toString(),
    toBlock: latestSafeBlock.toString(),
  };
}
