import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryStoreService } from "./memory-store.js";
import { TrustLedgerService } from "./trust-ledger.js";

describe("MemoryStoreService", () => {
  const paths: string[] = [];
  function makeStore() {
    const base = join(tmpdir(), `afterpost-hmem-${randomUUID()}`);
    paths.push(`${base}-memories.jsonl`, `${base}-ledger.jsonl`);
    const ledger = new TrustLedgerService(`${base}-ledger.jsonl`);
    const store = new MemoryStoreService(`${base}-memories.jsonl`, ledger);
    return { store, ledger };
  }

  afterEach(async () => {
    await Promise.all(paths.splice(0).map((p) => rm(p, { force: true })));
  });

  it("persists a memory and reloads it from a fresh store instance over the same file", async () => {
    // #given
    const base = join(tmpdir(), `afterpost-hmem-${randomUUID()}`);
    const filePath = `${base}-memories.jsonl`;
    const ledgerPath = `${base}-ledger.jsonl`;
    paths.push(filePath, ledgerPath);
    const writer = new MemoryStoreService(filePath, new TrustLedgerService(ledgerPath));
    const created = await writer.add({
      content: "Campaign cmp_1 partner posted the required thread on schedule.",
      type: "factual",
      layer: "long_term",
      tags: ["campaign:cmp_1", "delivery"],
      source: "investigation_run:run_1",
      agentId: "verifier-agent",
      runId: "run_1",
    });
    // #when — a new process, new store instance over the same file
    const reader = new MemoryStoreService(filePath, new TrustLedgerService(ledgerPath));
    const reloaded = await reader.getById(created.id);
    // #then
    expect(reloaded?.content).toBe(created.content);
    expect(reloaded?.layer).toBe("long_term");
  });

  it("records provenance (derivedFrom, supersedes, source, agent/run attribution)", async () => {
    // #given
    const { store } = makeStore();
    // #when
    const original = await store.add({
      content: "Observed 50 pool swaps after the post.",
      type: "factual",
      layer: "working",
      tags: ["market_observation"],
      source: "chain_indexer",
      agentId: "market-agent",
      runId: "run_1",
    });
    const correction = await store.add({
      content: "Observed 52 pool swaps after the post (corrected recount).",
      type: "factual",
      layer: "working",
      tags: ["market_observation"],
      source: "chain_indexer",
      agentId: "market-agent",
      runId: "run_1",
      supersedes: original.id,
      derivedFrom: [original.id],
    });
    // #then
    expect(correction.supersedes).toBe(original.id);
    expect(correction.derivedFrom).toContain(original.id);
    expect(correction.agentId).toBe("market-agent");
    expect(correction.runId).toBe("run_1");
  });

  it("writes an audit ledger entry for every mutation, including feedback", async () => {
    // #given
    const { store, ledger } = makeStore();
    const memory = await store.add({
      content: "Partner delivered on time.",
      type: "factual",
      layer: "long_term",
      tags: [],
      source: "verifier",
      agentId: "verifier-agent",
      runId: "run_1",
    });
    // #when — a Critic/Verifier agent emits a feedback event (§11.2)
    await store.recordFeedback(memory.id, "helpful", "critic-agent");
    const entries = await ledger.forMemory(memory.id);
    // #then
    expect(entries.map((e) => e.action)).toEqual(["create", "feedback"]);
    expect(entries[1]?.actor).toBe("critic-agent");
  });

  it("increases confidence on helpful feedback and decreases sharply on wrong, tagging review", async () => {
    // #given
    const { store } = makeStore();
    const memory = await store.add({
      content: "Wallet 0xabc is a tracked purchaser.",
      type: "factual",
      layer: "working",
      tags: [],
      source: "attribution-engine",
      agentId: "attribution-agent",
      runId: "run_1",
      confidence: 0.6,
    });
    // #when
    const afterHelpful = await store.recordFeedback(memory.id, "helpful", "critic-agent");
    const afterWrong = await store.recordFeedback(memory.id, "wrong", "critic-agent");
    // #then
    expect(afterHelpful.confidence).toBeGreaterThan(0.6);
    expect(afterWrong.confidence).toBeLessThan(afterHelpful.confidence);
    expect(afterWrong.tags).toContain("review");
  });

  it("promotes a memory to a higher tier and the promotion survives reload", async () => {
    // #given
    const { store } = makeStore();
    const memory = await store.add({
      content: "Recurring pattern: this partner is consistently late.",
      type: "procedural",
      layer: "short_term",
      tags: [],
      source: "pattern-detector",
      agentId: "analyst-agent",
      runId: "run_1",
    });
    // #when
    await store.promote(memory.id, "long_term", "analyst-agent");
    const reloaded = await store.getById(memory.id);
    // #then
    expect(reloaded?.layer).toBe("long_term");
  });
});
