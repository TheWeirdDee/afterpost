import { randomUUID } from "node:crypto";
import { JsonlAppendStore, stableId } from "@afterpost/shared-store";
import type { EntityState, NewWorldModelEvent, RelationPayload, WorldModelEvent } from "./types.js";

/**
 * WorldStoreService + IngestPipelineService + ContextBuilderService
 * (Meterless World Model engine doc §13/readme §3, the documented
 * minimum): idempotent append-only ingest, and a read surface that
 * rebuilds canonical entity state from the log rather than trusting a
 * mutated row. Ingesting the exact same observation twice — the crash/
 * retry case the engine doc calls out explicitly (§3: "idempotent
 * pipelines... safe to resume") — produces exactly one event, not two.
 */
export class WorldModelService {
  private readonly store: JsonlAppendStore<WorldModelEvent>;

  constructor(filePath: string) {
    this.store = new JsonlAppendStore<WorldModelEvent>(filePath);
  }

  /**
   * Idempotency key is content-derived (engine doc §3: "stable IDs derived
   * from content, not autoincrement"): same workspace + entity + event type
   * + payload + source produces the same key, so re-ingesting the same
   * observation after a crash/retry is a no-op, not a duplicate.
   */
  private dedupeKey(event: NewWorldModelEvent): string {
    return stableId(
      "wme",
      event.workspaceId,
      event.entityKey,
      event.eventType,
      JSON.stringify(event.payload),
      event.sourceRef ?? "",
    );
  }

  async ingest(event: NewWorldModelEvent): Promise<{ event: WorldModelEvent; wasNew: boolean }> {
    const key = this.dedupeKey(event);
    const existing = await this.store.readAll();
    const already = existing.find((e) => e.id === key);
    if (already) {
      return { event: already, wasNew: false };
    }

    const record: WorldModelEvent = {
      ...event,
      id: key,
      createdAt: new Date().toISOString(),
    };
    await this.store.append(record);
    return { event: record, wasNew: true };
  }

  async ingestRelation(
    workspaceId: string,
    relation: RelationPayload,
    sourceRef: string | null,
    agentId: string,
    runId: string,
  ): Promise<{ event: WorldModelEvent; wasNew: boolean }> {
    return this.ingest({
      workspaceId,
      entityKey: relation.from,
      entityType: "observation",
      eventType: "relation",
      payload: { ...relation },
      sourceRef,
      supersedesEventId: null,
      agentId,
      runId,
    });
  }

  async allEvents(workspaceId?: string): Promise<WorldModelEvent[]> {
    const all = await this.store.readAll();
    return workspaceId ? all.filter((e) => e.workspaceId === workspaceId) : all;
  }

  /**
   * ContextBuilderService: rebuilds one entity's current state by replaying
   * its non-superseded events in order — the "many derived views, one
   * canonical store" read path (engine doc §3), never a mutated row.
   */
  async getEntityState(entityKey: string): Promise<EntityState | null> {
    const all = await this.store.readAll();
    const superseded = new Set(
      all.map((e) => e.supersedesEventId).filter((id): id is string => id !== null),
    );
    const relevant = all
      .filter(
        (e) => e.entityKey === entityKey && e.eventType !== "relation" && !superseded.has(e.id),
      )
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    if (relevant.length === 0) return null;

    const fields: Record<string, unknown> = {};
    const sourceRefs = new Set<string>();
    for (const event of relevant) {
      Object.assign(fields, event.payload);
      if (event.sourceRef) sourceRefs.add(event.sourceRef);
    }

    return {
      entityKey,
      entityType: relevant[0]!.entityType,
      fields,
      eventCount: relevant.length,
      lastUpdatedAt: relevant.at(-1)!.createdAt,
      sourceRefs: [...sourceRefs],
    };
  }

  async getRelations(entityKey: string): Promise<RelationPayload[]> {
    const all = await this.store.readAll();
    return all
      .filter((e) => e.eventType === "relation")
      .map((e) => e.payload as unknown as RelationPayload)
      .filter((r) => r.from === entityKey || r.to === entityKey);
  }

  /** A fresh, random run-scoped correlation id — not content-derived, since runs are not content. */
  static newRunId(): string {
    return `run_${randomUUID()}`;
  }
}
