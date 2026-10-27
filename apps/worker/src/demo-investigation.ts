/**
 * Real, runnable demonstration tying together the pieces that are actually
 * working end to end right now: live Robinhood Chain data, the Meterless
 * World Model (idempotent shared state), and H-MEM (persistent memory with
 * retrieval across separate "runs").
 *
 * This is deliberately NOT a fabricated campaign investigation — the PRD
 * forbids inventing campaign/evidence facts, so this demo only ingests
 * genuinely observed onchain facts about the documented reference token,
 * verified live against the public RPC. A full campaign investigation
 * (Zetaris query + Nemotron extraction + renewal recommendation) requires
 * the API/DB layer and sponsor credentials that are not wired up yet — see
 * docs/INTEGRATIONS.md for exact status.
 *
 * Every step is appended to a JSONL trace file under logs/, per the
 * Meterless engines' own evidence requirement ("if it isn't in logs/ as
 * JSONL, a judge can't see it happened").
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PonsRobinhoodAdapter, REFERENCE_PONS_TOKEN } from "@afterpost/chain-pons";
import { noModelGenerator } from "@afterpost/model-generator";
import {
  MemoryStoreService,
  TrustLedgerService,
  retrieveMemories,
} from "@afterpost/meterless-hmem";
import { WorldModelService } from "@afterpost/meterless-world-model";

const LOG_DIR = join(process.cwd(), "..", "..", "logs");
const RUN_ID = WorldModelService.newRunId();
const WORKSPACE_ID = "ws_demo";
const AGENT_ID = "chain-indexer-agent";

interface TraceStep {
  seq: number;
  runId: string;
  step: string;
  startedAt: string;
  finishedAt: string;
  detail: Record<string, unknown>;
}

const trace: TraceStep[] = [];
let seq = 0;

async function traced<T>(
  step: string,
  detail: Record<string, unknown>,
  fn: () => Promise<T>,
): Promise<T> {
  const startedAt = new Date().toISOString();
  const result = await fn();
  trace.push({
    seq: seq++,
    runId: RUN_ID,
    step,
    startedAt,
    finishedAt: new Date().toISOString(),
    detail,
  });
  return result;
}

async function main(): Promise<void> {
  await mkdir(LOG_DIR, { recursive: true });

  const worldModel = new WorldModelService(join(LOG_DIR, "world-model-events.jsonl"));
  const trustLedger = new TrustLedgerService(join(LOG_DIR, "hmem-trust-ledger.jsonl"));
  const memoryStore = new MemoryStoreService(join(LOG_DIR, "hmem-memories.jsonl"), trustLedger);

  const adapter = new PonsRobinhoodAdapter();

  console.log(`[run ${RUN_ID}] verifying chain ID against the live public RPC...`);
  await traced("verify_chain_id", { chainId: 4663 }, () => adapter.assertChainId());

  console.log("[run] fetching real onchain metadata for the reference token...");
  const token = await traced("fetch_token_identity", { token: REFERENCE_PONS_TOKEN }, () =>
    adapter.validateToken(REFERENCE_PONS_TOKEN),
  );
  console.log(`  -> ${token.symbol} (${token.name}), decimals=${token.decimals}`);

  console.log("[run] discovering and independently re-verifying the pool...");
  const pools = await traced("discover_pools", { token: REFERENCE_PONS_TOKEN }, () =>
    adapter.discoverPools(REFERENCE_PONS_TOKEN),
  );
  const pool = pools[0];
  console.log(`  -> found ${pools.length} pool(s), using ${pool?.address ?? "none"}`);

  const tokenEntityKey = `token:${token.address.toLowerCase()}`;

  console.log("[run] ingesting the observation into World Model (idempotent)...");
  const ingestResult = await traced("world_model_ingest_token", { entityKey: tokenEntityKey }, () =>
    worldModel.ingest({
      workspaceId: WORKSPACE_ID,
      entityKey: tokenEntityKey,
      entityType: "token",
      eventType: "created",
      payload: {
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        totalSupplyRaw: token.totalSupplyRaw,
      },
      sourceRef: `chain:4663/token/${token.address.toLowerCase()}`,
      supersedesEventId: null,
      agentId: AGENT_ID,
      runId: RUN_ID,
    }),
  );
  console.log(`  -> event ${ingestResult.event.id}, wasNew=${ingestResult.wasNew}`);

  // Demonstrate idempotency for real: ingest the exact same observation again.
  const repeatIngest = await traced(
    "world_model_ingest_token_repeat",
    { entityKey: tokenEntityKey, purpose: "idempotency demonstration" },
    () =>
      worldModel.ingest({
        workspaceId: WORKSPACE_ID,
        entityKey: tokenEntityKey,
        entityType: "token",
        eventType: "created",
        payload: {
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          totalSupplyRaw: token.totalSupplyRaw,
        },
        sourceRef: `chain:4663/token/${token.address.toLowerCase()}`,
        supersedesEventId: null,
        agentId: AGENT_ID,
        runId: RUN_ID,
      }),
  );
  console.log(`  -> repeat ingest wasNew=${repeatIngest.wasNew} (must be false)`);

  if (pool) {
    const poolEntityKey = `pool:${pool.address.toLowerCase()}`;
    await traced("world_model_ingest_pool", { entityKey: poolEntityKey }, () =>
      worldModel.ingest({
        workspaceId: WORKSPACE_ID,
        entityKey: poolEntityKey,
        entityType: "observation",
        eventType: "created",
        payload: {
          token0: pool.token0,
          token1: pool.token1,
          discoveredAtBlock: pool.discoveredAtBlock.toString(),
        },
        sourceRef: `chain:4663/pool/${pool.address.toLowerCase()}`,
        supersedesEventId: null,
        agentId: AGENT_ID,
        runId: RUN_ID,
      }),
    );
    await traced("world_model_ingest_relation", { from: poolEntityKey, to: tokenEntityKey }, () =>
      worldModel.ingestRelation(
        WORKSPACE_ID,
        { relation: "belongs_to", from: poolEntityKey, to: tokenEntityKey },
        `chain:4663/pool/${pool.address.toLowerCase()}`,
        AGENT_ID,
        RUN_ID,
      ),
    );
  }

  console.log(
    "[run] mining an H-MEM memory from this run's observations (no-model fallback, sample mode)...",
  );
  const summaryPrompt = `Reference token verified: ${token.symbol} at ${token.address}, pool ${pool?.address ?? "unresolved"}, chain 4663.`;
  const generated = await traced("mine_memory_no_model_fallback", { prompt: summaryPrompt }, () =>
    noModelGenerator(summaryPrompt, undefined, undefined),
  );

  const memory = await traced("hmem_store_memory", {}, () =>
    memoryStore.add({
      content: generated.text,
      type: "factual",
      layer: "long_term",
      tags: [`chain:4663`, `token:${token.address.toLowerCase()}`, "onchain_verification"],
      source: "chain_indexer",
      agentId: AGENT_ID,
      runId: RUN_ID,
      entities: [tokenEntityKey, ...(pool ? [`pool:${pool.address.toLowerCase()}`] : [])],
    }),
  );
  console.log(`  -> memory ${memory.id} stored (isFallback=${generated.isFallback})`);

  // Second "run": a fresh store instance over the same file, simulating a
  // new process retrieving what a previous run learned.
  console.log("[run] simulating a second, later investigation retrieving this run's memory...");
  const laterMemoryStore = new MemoryStoreService(
    join(LOG_DIR, "hmem-memories.jsonl"),
    trustLedger,
  );
  const allMemories = await laterMemoryStore.allCurrent();
  const retrieval = await traced(
    "hmem_retrieve_in_second_run",
    { query: `verification status of token ${token.symbol}` },
    async () =>
      retrieveMemories(allMemories, {
        query: `token ${token.symbol} onchain verification`,
        runId: RUN_ID,
      }),
  );
  console.log(
    `  -> retrieved ${retrieval.results.length} relevant memor${retrieval.results.length === 1 ? "y" : "ies"}`,
  );

  if (retrieval.results[0]) {
    await traced("hmem_feedback_helpful", { memoryId: retrieval.results[0].memory.id }, () =>
      laterMemoryStore.recordFeedback(retrieval.results[0]!.memory.id, "helpful", "verifier-agent"),
    );
  }

  const entityState = await traced(
    "world_model_read_entity_state",
    { entityKey: tokenEntityKey },
    () => worldModel.getEntityState(tokenEntityKey),
  );
  console.log(`[run] final World Model state for ${tokenEntityKey}:`, entityState?.fields);

  const traceFilePath = join(LOG_DIR, `investigation-trace-${RUN_ID}.jsonl`);
  await writeFile(traceFilePath, trace.map((t) => JSON.stringify(t)).join("\n") + "\n", "utf8");
  console.log(`\n[run ${RUN_ID}] complete. Trace written to ${traceFilePath}`);
}

main().catch((error) => {
  console.error("[run] FAILED:", error);
  process.exitCode = 1;
});
