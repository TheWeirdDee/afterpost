/** Canonical memory record (H-MEM engine doc §4). */
export interface MemoryRecord {
  id: string;
  content: string;
  type: "personal" | "factual" | "preference" | "general" | "procedural";
  layer: "short_term" | "working" | "long_term";
  timestamp: string;
  lastAccessed: string;
  accessCount: number;
  tags: readonly string[];
  confidence: number;
  source: string;
  domain: string | null;
  entities: readonly string[];
  relatedTo: readonly string[];
  supersedes: string | null;
  derivedFrom: readonly string[];
  /** Agent-attribution fields (§4, headless addition). */
  agentId: string;
  runId: string;
  taskId: string | null;
}

export type MemoryInput = Pick<
  MemoryRecord,
  "content" | "type" | "layer" | "tags" | "source" | "agentId" | "runId"
> &
  Partial<Pick<MemoryRecord, "confidence" | "domain" | "entities" | "taskId" | "supersedes" | "derivedFrom">>;

/** Audit ledger entry (H-MEM engine doc §11.1). JSONL-shippable to logs/. */
export interface TrustLedgerEntry {
  memoryId: string;
  action:
    | "create"
    | "read"
    | "update"
    | "feedback"
    | "promote"
    | "conflict_detected"
    | "conflict_resolved";
  actor: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export type FeedbackVerdict = "helpful" | "not_helpful" | "wrong";

export interface RetrievalResult {
  memory: MemoryRecord;
  score: number;
  retrievalReason: string;
}

export interface RetrievalTrace {
  query: string;
  strategy: "minimal" | "task_focused" | "comprehensive";
  results: readonly RetrievalResult[];
  timestamp: string;
}
