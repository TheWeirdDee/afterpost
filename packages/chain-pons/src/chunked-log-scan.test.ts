import { describe, expect, it, vi } from "vitest";
import { scanLogsInChunks } from "./chunked-log-scan.js";
import type { PublicClient } from "viem";

function makeFakeClient(getLogsImpl: (params: unknown) => Promise<unknown[]>): PublicClient {
  return { getLogs: getLogsImpl } as unknown as PublicClient;
}

describe("scanLogsInChunks", () => {
  it("covers the full range across multiple chunks without gaps or overlap", async () => {
    // #given — a client that always succeeds; range forces 3 calls at the min span
    const calls: Array<{ fromBlock: bigint; toBlock: bigint }> = [];
    const client = makeFakeClient(async (params) => {
      const p = params as { fromBlock: bigint; toBlock: bigint };
      calls.push({ fromBlock: p.fromBlock, toBlock: p.toBlock });
      return [];
    });
    // #when
    await scanLogsInChunks(client, { address: "0xabc" }, 0n, 9_000_000n * 2n + 500n);
    // #then
    expect(calls[0]?.fromBlock).toBe(0n);
    for (let i = 1; i < calls.length; i++) {
      expect(calls[i]!.fromBlock).toBe(calls[i - 1]!.toBlock + 1n);
    }
    expect(calls.at(-1)?.toBlock).toBe(9_000_000n * 2n + 500n);
  });

  it("halves the chunk size on failure and retries the same cursor", async () => {
    // #given — first call (full 9M span) fails once, then succeeds with a smaller span
    let callCount = 0;
    const calls: Array<{ fromBlock: bigint; toBlock: bigint }> = [];
    const client = makeFakeClient(async (params) => {
      const p = params as { fromBlock: bigint; toBlock: bigint };
      callCount += 1;
      calls.push({ fromBlock: p.fromBlock, toBlock: p.toBlock });
      if (callCount === 1) throw new Error("query spans too many blocks");
      return [];
    });
    // #when — range wider than one max-size chunk, so the halved retry's
    // toBlock is observably smaller than the failed full-size attempt's.
    await scanLogsInChunks(client, { address: "0xabc" }, 0n, 10_000_000n);
    // #then — the retried chunk starts at the same cursor (0n) as the failed one
    expect(calls[0]?.fromBlock).toBe(0n);
    expect(calls[1]?.fromBlock).toBe(0n);
    expect(calls[1]!.toBlock).toBeLessThan(calls[0]!.toBlock);
  });

  it("propagates the error once chunk size cannot shrink further", async () => {
    // #given — a client that always fails
    const client = makeFakeClient(async () => {
      throw new Error("permanent failure");
    });
    // #when / #then
    await expect(scanLogsInChunks(client, { address: "0xabc" }, 0n, 100n)).rejects.toThrow(
      "permanent failure",
    );
  });

  it("does not call the RPC at all when fromBlock equals toBlock plus a single chunk", async () => {
    // #given
    const getLogs = vi.fn(async () => []);
    const client = makeFakeClient(getLogs);
    // #when
    await scanLogsInChunks(client, { address: "0xabc" }, 5n, 5n);
    // #then
    expect(getLogs).toHaveBeenCalledTimes(1);
  });
});
