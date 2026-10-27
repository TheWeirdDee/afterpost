import { describe, expect, it } from "vitest";
import { retrieveMemories } from "./memory-retrieval.js";
import type { MemoryRecord } from "./types.js";

function makeMemory(overrides: Partial<MemoryRecord>): MemoryRecord {
  const now = new Date().toISOString();
  return {
    id: "mem_1",
    content: "",
    type: "factual",
    layer: "working",
    timestamp: now,
    lastAccessed: now,
    accessCount: 0,
    tags: [],
    confidence: 0.6,
    source: "test",
    domain: null,
    entities: [],
    relatedTo: [],
    supersedes: null,
    derivedFrom: [],
    agentId: "agent",
    runId: "run_1",
    taskId: null,
    ...overrides,
  };
}

describe("retrieveMemories", () => {
  it("ranks a memory relevant to the query above an irrelevant one", () => {
    // #given — PRD/H-MEM §4.3: second investigation retrieves relevant previous evidence
    const relevant = makeMemory({
      id: "mem_relevant",
      content: "Partner cmp_1 posted the required thread about the launch on schedule.",
      tags: ["campaign:cmp_1", "delivery"],
    });
    const irrelevant = makeMemory({
      id: "mem_irrelevant",
      content: "Unrelated observation about a different token entirely.",
      tags: ["other"],
    });
    // #when
    const trace = retrieveMemories([relevant, irrelevant], {
      query: "campaign cmp_1 thread delivery",
    });
    // #then
    expect(trace.results[0]?.memory.id).toBe("mem_relevant");
  });

  it("boosts memories from the same run (agent-scope boost)", () => {
    // #given
    const sameRun = makeMemory({ id: "mem_same_run", content: "campaign note", runId: "run_42" });
    const otherRun = makeMemory({ id: "mem_other_run", content: "campaign note", runId: "run_99" });
    // #when
    const trace = retrieveMemories([sameRun, otherRun], {
      query: "campaign note",
      runId: "run_42",
    });
    // #then
    const sameRunResult = trace.results.find((r) => r.memory.id === "mem_same_run");
    const otherRunResult = trace.results.find((r) => r.memory.id === "mem_other_run");
    expect(sameRunResult!.score).toBeGreaterThan(otherRunResult!.score);
  });

  it("weights long-term memories above short-term ones for an otherwise equal match", () => {
    // #given
    const longTerm = makeMemory({
      id: "mem_long",
      content: "shared content phrase",
      layer: "long_term",
    });
    const shortTerm = makeMemory({
      id: "mem_short",
      content: "shared content phrase",
      layer: "short_term",
    });
    // #when
    const trace = retrieveMemories([longTerm, shortTerm], { query: "shared content phrase" });
    // #then
    const longResult = trace.results.find((r) => r.memory.id === "mem_long");
    const shortResult = trace.results.find((r) => r.memory.id === "mem_short");
    expect(longResult!.score).toBeGreaterThan(shortResult!.score);
  });

  it("returns an empty, explicitly minimal trace rather than guessing when nothing matches", () => {
    // #given
    const unrelated = makeMemory({ content: "zzz completely unrelated qqq" });
    // #when
    const trace = retrieveMemories([unrelated], { query: "campaign delivery evidence" });
    // #then
    expect(trace.results).toEqual([]);
    expect(trace.strategy).toBe("minimal");
  });

  it("includes a human-readable retrievalReason for every result", () => {
    // #given
    const memory = makeMemory({ content: "campaign evidence review", tags: ["review"] });
    // #when
    const trace = retrieveMemories([memory], { query: "campaign evidence review" });
    // #then
    expect(trace.results[0]?.retrievalReason.length).toBeGreaterThan(0);
  });
});
