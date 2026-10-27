/**
 * World Model event (PRD §11.2, §13.5 `world_model_events`; Meterless
 * World Model engine doc §4.4, §6.1). Append-only — canonical state is
 * never mutated in place, only recomputed from this log (engine doc §3:
 * "One canonical store, many derived views").
 */
export interface WorldModelEvent {
  id: string;
  workspaceId: string;
  entityKey: string;
  entityType:
    | "project"
    | "token"
    | "partner"
    | "campaign"
    | "obligation"
    | "evidence"
    | "observation"
    | "decision_snapshot";
  eventType: "created" | "updated" | "relation";
  payload: Record<string, unknown>;
  sourceRef: string | null;
  supersedesEventId: string | null;
  createdAt: string;
  /** Agent attribution, matching the headless reframe in both engine docs. */
  agentId: string;
  runId: string;
}

export type NewWorldModelEvent = Omit<WorldModelEvent, "id" | "createdAt">;

export type RelationType =
  "supports" | "contradicts" | "belongs_to" | "supersedes" | "observed_during";

export interface RelationPayload {
  relation: RelationType;
  from: string;
  to: string;
}

export interface EntityState {
  entityKey: string;
  entityType: WorldModelEvent["entityType"];
  /** Fields merged from all non-superseded events for this entity, latest wins. */
  fields: Record<string, unknown>;
  eventCount: number;
  lastUpdatedAt: string;
  sourceRefs: readonly string[];
}
