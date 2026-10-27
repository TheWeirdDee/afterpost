import { randomUUID } from "node:crypto";
import { JsonlAppendStore } from "@afterpost/shared-store";
import type { TrustLedgerService } from "./trust-ledger.js";
import type { FeedbackVerdict, MemoryInput, MemoryRecord } from "./types.js";

/**
 * MemoryStoreService (H-MEM engine doc §13): tiered persistence, CRUD,
 * promotion, feedback-driven confidence adjustment. Durable storage is an
 * append-only JSONL log — "current state" for an id is its latest appended
 * version, so history is never destroyed (§3: "Keep provenance on every
 * inferred memory"). Every mutation is also written to the TrustLedger.
 */
export class MemoryStoreService {
  private readonly store: JsonlAppendStore<MemoryRecord>;

  constructor(
    filePath: string,
    private readonly ledger: TrustLedgerService,
  ) {
    this.store = new JsonlAppendStore<MemoryRecord>(filePath);
  }

  async add(input: MemoryInput): Promise<MemoryRecord> {
    const now = new Date().toISOString();
    const record: MemoryRecord = {
      id: randomUUID(),
      content: input.content,
      type: input.type,
      layer: input.layer,
      timestamp: now,
      lastAccessed: now,
      accessCount: 0,
      tags: input.tags,
      confidence: input.confidence ?? 0.6,
      source: input.source,
      domain: input.domain ?? null,
      entities: input.entities ?? [],
      relatedTo: [],
      supersedes: input.supersedes ?? null,
      derivedFrom: input.derivedFrom ?? [],
      agentId: input.agentId,
      runId: input.runId,
      taskId: input.taskId ?? null,
    };
    await this.store.append(record);
    await this.ledger.record({
      memoryId: record.id,
      action: "create",
      actor: input.agentId,
      timestamp: now,
      details: { layer: record.layer, source: record.source },
    });
    return record;
  }

  /** Returns the latest version of every memory (append log collapsed by id). */
  async allCurrent(): Promise<MemoryRecord[]> {
    const all = await this.store.readAll();
    const byId = new Map<string, MemoryRecord>();
    for (const record of all) byId.set(record.id, record);
    return [...byId.values()];
  }

  async getById(id: string): Promise<MemoryRecord | null> {
    const current = await this.allCurrent();
    return current.find((m) => m.id === id) ?? null;
  }

  private async writeVersion(
    updated: MemoryRecord,
    action: "update" | "feedback" | "promote",
    actor: string,
    details: Record<string, unknown>,
  ): Promise<MemoryRecord> {
    await this.store.append(updated);
    await this.ledger.record({
      memoryId: updated.id,
      action,
      actor,
      timestamp: updated.lastAccessed,
      details,
    });
    return updated;
  }

  async promote(id: string, newLayer: MemoryRecord["layer"], actor: string): Promise<MemoryRecord> {
    const current = await this.getById(id);
    if (!current) throw new Error(`Memory ${id} not found`);
    const updated: MemoryRecord = {
      ...current,
      layer: newLayer,
      lastAccessed: new Date().toISOString(),
    };
    return this.writeVersion(updated, "promote", actor, { from: current.layer, to: newLayer });
  }

  /**
   * Feedback adaptation (H-MEM engine doc §11.2): closes the loop between
   * retrieval quality and future ranking without a human thumbs-up button.
   */
  async recordFeedback(id: string, verdict: FeedbackVerdict, actor: string): Promise<MemoryRecord> {
    const current = await this.getById(id);
    if (!current) throw new Error(`Memory ${id} not found`);

    const delta = verdict === "helpful" ? 0.05 : verdict === "not_helpful" ? -0.05 : -0.2;
    const confidence = Math.max(0, Math.min(1, current.confidence + delta));
    const tags =
      verdict === "wrong" && !current.tags.includes("review")
        ? [...current.tags, "review"]
        : current.tags;

    const updated: MemoryRecord = {
      ...current,
      confidence,
      tags,
      accessCount: verdict === "helpful" ? current.accessCount + 1 : current.accessCount,
      lastAccessed: new Date().toISOString(),
    };
    return this.writeVersion(updated, "feedback", actor, {
      verdict,
      previousConfidence: current.confidence,
      newConfidence: confidence,
    });
  }

  async touch(id: string): Promise<MemoryRecord> {
    const current = await this.getById(id);
    if (!current) throw new Error(`Memory ${id} not found`);
    const updated: MemoryRecord = {
      ...current,
      accessCount: current.accessCount + 1,
      lastAccessed: new Date().toISOString(),
    };
    await this.store.append(updated);
    return updated;
  }
}
