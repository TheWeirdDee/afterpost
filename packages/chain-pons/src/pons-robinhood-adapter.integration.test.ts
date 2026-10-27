import { describe, expect, it } from "vitest";
import { PonsRobinhoodAdapter } from "./pons-robinhood-adapter.js";
import { REFERENCE_LAUNCH_TX, REFERENCE_PONS_POOL, REFERENCE_PONS_TOKEN } from "./constants.js";

/**
 * Live network integration tests against the real public Robinhood Chain
 * RPC (PRD §18.2). No credentials required — this is a public read-only
 * endpoint. Skipped automatically if the network is unreachable in this
 * environment, per PRD §18.2 "mark suite SKIPPED ... do not claim ... passed".
 */
describe.sequential("PonsRobinhoodAdapter (live RPC)", () => {
  const adapter = new PonsRobinhoodAdapter();

  it("confirms the RPC actually serves chain 4663", async () => {
    // #given / #when
    await expect(adapter.assertChainId()).resolves.toBeUndefined();
  });

  it("verifies the real reference token's onchain metadata", async () => {
    // #given
    const token = REFERENCE_PONS_TOKEN;
    // #when
    const identity = await adapter.validateToken(token);
    // #then — must be real, independently fetched decimals/symbol, not guessed
    expect(identity.address.toLowerCase()).toBe(token.toLowerCase());
    expect(identity.decimals).toBeGreaterThanOrEqual(0);
    expect(identity.symbol.length).toBeGreaterThan(0);
    expect(identity.totalSupplyRaw).toMatch(/^\d+$/);
  });

  it("discovers and independently verifies the reference pool via token0/token1", async () => {
    // #given
    const token = REFERENCE_PONS_TOKEN;
    // #when
    const pools = await adapter.discoverPools(token);
    // #then
    expect(pools.length).toBeGreaterThan(0);
    const matched = pools.find(
      (p) => p.address.toLowerCase() === REFERENCE_PONS_POOL.toLowerCase(),
    );
    expect(matched).toBeDefined();
  }, 30_000);

  it("resolves the real documented reference launch transaction", async () => {
    // #given
    const txHash = REFERENCE_LAUNCH_TX;
    // #when
    const tx = await adapter.resolveTransaction(txHash);
    // #then
    expect(tx.status).toBe("success");
    expect(tx.txHash.toLowerCase()).toBe(txHash.toLowerCase());
  });
});
