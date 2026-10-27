import type { MemoryRecord, RetrievalResult, RetrievalTrace } from "./types.js";

const LAYER_WEIGHT: Record<MemoryRecord["layer"], number> = {
  long_term: 1.0,
  working: 0.7,
  short_term: 0.4,
};

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2),
  );
}

function jaccardOverlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export interface RetrievalOptions {
  query: string;
  runId?: string;
  topN?: number;
  minScore?: number;
}

/**
 * MemoryRetrievalService (H-MEM engine doc §8): hybrid ranking without a
 * real embedding provider configured yet — keyword/tag Jaccard overlap
 * substitutes for semantic similarity, honestly labelled as such rather
 * than claiming vector search that isn't wired up. Layer weighting,
 * recency boost, superseded penalty, and agent/run-scope boost are all
 * applied as documented.
 */
export function retrieveMemories(
  memories: readonly MemoryRecord[],
  options: RetrievalOptions,
): RetrievalTrace {
  const topN = options.topN ?? 5;
  const minScore = options.minScore ?? 0.1;
  const queryTokens = tokenize(options.query);

  const scored = memories
    .filter((m) => !m.supersedes || m.id !== m.supersedes) // superseded-by-others filtered below
    .map((memory) => {
      const contentTokens = tokenize(memory.content);
      const tagTokens = new Set(memory.tags.map((t) => t.toLowerCase()));

      const keywordScore = jaccardOverlap(queryTokens, contentTokens);
      const tagScore = jaccardOverlap(queryTokens, tagTokens);
      const layerScore = LAYER_WEIGHT[memory.layer];

      const ageMs = Date.now() - new Date(memory.timestamp).getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      const recencyBoost = Math.max(0, 1 - ageDays / 30) * 0.1;

      const runScopeBoost = options.runId && memory.runId === options.runId ? 0.15 : 0;

      const topicalRelevance = keywordScore * 0.5 + tagScore * 0.2;
      const score = topicalRelevance + layerScore * 0.2 + recencyBoost + runScopeBoost;

      const reasons: string[] = [];
      if (keywordScore > 0) reasons.push(`keyword overlap ${keywordScore.toFixed(2)}`);
      if (tagScore > 0) reasons.push(`tag overlap ${tagScore.toFixed(2)}`);
      if (runScopeBoost > 0) reasons.push("same run");
      reasons.push(`${memory.layer} layer`);

      return {
        memory,
        score,
        topicalRelevance,
        retrievalReason: reasons.join(", "),
      };
    })
    // Layer/recency/run-scope are tiebreakers among topically relevant
    // memories, never enough on their own to surface something with zero
    // keyword/tag overlap with the query.
    .filter((r) => r.topicalRelevance > 0 && r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(({ memory, score, retrievalReason }) => ({ memory, score, retrievalReason }));

  return {
    query: options.query,
    strategy: scored.length === 0 ? "minimal" : options.runId ? "task_focused" : "comprehensive",
    results: scored,
    timestamp: new Date().toISOString(),
  };
}
