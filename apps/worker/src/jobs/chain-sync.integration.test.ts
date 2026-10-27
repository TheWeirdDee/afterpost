import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { PonsRobinhoodAdapter, REFERENCE_PONS_TOKEN } from "@afterpost/chain-pons";
import { prisma } from "../lib/prisma.js";
import { syncTokenChainData } from "./chain-sync.js";

/**
 * Real integration test: live Robinhood Chain RPC + real local Postgres
 * (infra/docker-compose.yml). Creates real rows, not mocks, and proves
 * idempotency by running the sync twice.
 */
describe("syncTokenChainData (live RPC + live Postgres)", () => {
  const createdWorkspaceIds: string[] = [];
  const createdUserIds: string[] = [];
  let tokenId: string;

  afterAll(async () => {
    if (tokenId) {
      const pools = await prisma.pool.findMany({ where: { tokenId } });
      for (const pool of pools) {
        const swaps = await prisma.swapObservation.findMany({ where: { poolId: pool.id } });
        for (const swap of swaps) {
          await prisma.swapObservation.delete({ where: { id: swap.id } });
          await prisma.rawChainEvent.delete({ where: { id: swap.rawEventId } });
        }
      }
      const transfers = await prisma.transferObservation.findMany({ where: { tokenId } });
      for (const transfer of transfers) {
        await prisma.transferObservation.delete({ where: { id: transfer.id } });
        await prisma.rawChainEvent.delete({ where: { id: transfer.rawEventId } });
      }
      await prisma.chainSyncCursor.deleteMany({
        where: { chainId: 4663, contractAddress: REFERENCE_PONS_TOKEN.toLowerCase() },
      });
      await prisma.pool.deleteMany({ where: { tokenId } });
      await prisma.token.delete({ where: { id: tokenId } });
    }
    await prisma.workspace.deleteMany({ where: { id: { in: createdWorkspaceIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  });

  it("syncs real recent chain data into Postgres and is idempotent on re-run", async () => {
    // #given — a real workspace/token row pointing at the verified reference token
    const user = await prisma.user.create({ data: { email: `${randomUUID()}@afterpost.test` } });
    createdUserIds.push(user.id);
    const workspace = await prisma.workspace.create({
      data: { slug: `ws-${randomUUID().slice(0, 8)}`, displayName: "Sync Test", ownerId: user.id },
    });
    createdWorkspaceIds.push(workspace.id);

    const token = await prisma.token.create({
      data: {
        workspaceId: workspace.id,
        chainId: 4663,
        contractAddress: REFERENCE_PONS_TOKEN.toLowerCase(),
        checksumAddress: REFERENCE_PONS_TOKEN,
        symbol: "PONS",
        name: "Pons",
        decimals: 18,
        platform: "pons",
      },
    });
    tokenId = token.id;

    const adapter = new PonsRobinhoodAdapter();

    // #when — sync a small recent, PINNED window (an explicit toBlock,
    // not each call's own live safe head — on a fast chain those
    // genuinely differ a few seconds apart, which is correct indexer
    // behavior, not what this test is checking) twice.
    const pinnedToBlock = await adapter.getLatestSafeBlock();
    const first = await syncTokenChainData(prisma, adapter, token.id, {
      blockWindow: 500n,
      toBlock: pinnedToBlock,
    });
    const second = await syncTokenChainData(prisma, adapter, token.id, {
      blockWindow: 500n,
      toBlock: pinnedToBlock,
    });

    // #then — pool was discovered and persisted exactly once
    expect(first.poolsDiscovered).toBeGreaterThan(0);
    expect(second.poolsDiscovered).toBe(0); // already exists, not re-created

    const pools = await prisma.pool.findMany({ where: { tokenId: token.id } });
    expect(pools.length).toBe(first.poolsDiscovered);

    // Re-running over the same window finds the same real transfers
    // again (upsert returns the same count), and the DB still only holds
    // that many rows, not double — proves canonical-key idempotency
    // (PRD §7.3 step 10).
    expect(second.transfersUpserted).toBe(first.transfersUpserted);
    const storedTransfers = await prisma.transferObservation.count({
      where: { tokenId: token.id },
    });
    expect(storedTransfers).toBe(first.transfersUpserted);

    const cursor = await prisma.chainSyncCursor.findUnique({
      where: {
        chainId_contractAddress_eventType: {
          chainId: 4663,
          contractAddress: REFERENCE_PONS_TOKEN.toLowerCase(),
          eventType: "swap_transfer",
        },
      },
    });
    expect(cursor?.status).toBe("OK");
  }, 90_000);
});
