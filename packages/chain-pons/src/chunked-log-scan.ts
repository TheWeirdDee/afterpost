import type { Log, PublicClient } from "viem";
import { MAX_GET_LOGS_BLOCK_SPAN, MIN_GET_LOGS_BLOCK_SPAN } from "./constants.js";

type GetLogsBaseParams = Omit<Parameters<PublicClient["getLogs"]>[0], "fromBlock" | "toBlock">;

/**
 * Scans eth_getLogs across [fromBlock, toBlock] in bounded chunks, halving
 * the chunk size on an RPC error/timeout and growing it back up to the cap
 * after sustained success (PRD §7.3 step 5: "adjust down on RPC timeout and
 * up only on measured success").
 */
export async function scanLogsInChunks(
  client: PublicClient,
  params: GetLogsBaseParams,
  fromBlock: bigint,
  toBlock: bigint,
): Promise<Log[]> {
  const results: Log[] = [];
  let chunkSize = MAX_GET_LOGS_BLOCK_SPAN;
  let cursor = fromBlock;
  let consecutiveSuccesses = 0;

  while (cursor <= toBlock) {
    const chunkEnd = cursor + chunkSize - 1n > toBlock ? toBlock : cursor + chunkSize - 1n;

    try {
      // Cast needed: viem's GetLogsParameters is a closed discriminated union
      // keyed on event/events/args that TS can't re-derive through the
      // generic Omit above; the runtime shape is still exactly what getLogs expects.
      const logs = await client.getLogs({
        ...params,
        fromBlock: cursor,
        toBlock: chunkEnd,
      } as Parameters<PublicClient["getLogs"]>[0]);
      results.push(...logs);
      cursor = chunkEnd + 1n;
      consecutiveSuccesses += 1;

      if (consecutiveSuccesses >= 3 && chunkSize < MAX_GET_LOGS_BLOCK_SPAN) {
        chunkSize = chunkSize * 2n > MAX_GET_LOGS_BLOCK_SPAN ? MAX_GET_LOGS_BLOCK_SPAN : chunkSize * 2n;
        consecutiveSuccesses = 0;
      }
    } catch (error) {
      consecutiveSuccesses = 0;
      if (chunkSize <= MIN_GET_LOGS_BLOCK_SPAN) {
        throw error;
      }
      chunkSize = chunkSize / 2n > MIN_GET_LOGS_BLOCK_SPAN ? chunkSize / 2n : MIN_GET_LOGS_BLOCK_SPAN;
      // retry same cursor with the smaller chunk size
    }
  }

  return results;
}
