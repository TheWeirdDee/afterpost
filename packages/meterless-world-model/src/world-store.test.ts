import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { WorldModelService } from "./world-store.js";
import type { NewWorldModelEvent } from "./types.js";

describe("WorldModelService", () => {
  const paths: string[] = [];
  function makeService() {
    const path = join(tmpdir(), `afterpost-wm-${randomUUID()}.jsonl`);
    paths.push(path);
    return new WorldModelService(path);
  }

  afterEach(async () => {
    await Promise.all(paths.splice(0).map((p) => rm(p, { force: true })));
  });

  function campaignCreated(overrides: Partial<NewWorldModelEvent> = {}): NewWorldModelEvent {
    return {
      workspaceId: "ws_1",
      entityKey: "campaign:cmp_1",
      entityType: "campaign",
      eventType: "created",
      payload: { title: "October launch", status: "active" },
      sourceRef: "campaign_terms_versions:1",
      supersedesEventId: null,
      agentId: "planner-agent",
      runId: "run_1",
      ...overrides,
    };
  }

  it("is idempotent: re-ingesting the exact same observation produces no duplicate event", async () => {
    // #given — the crash/retry case the engine doc requires (§3)
    const service = makeService();
    const event = campaignCreated();
    // #when
    const first = await service.ingest(event);
    const second = await service.ingest(event);
    // #then
    expect(first.wasNew).toBe(true);
    expect(second.wasNew).toBe(false);
    expect(second.event.id).toBe(first.event.id);
    const all = await service.allEvents("ws_1");
    expect(all).toHaveLength(1);
  });

  it("ingests a genuinely different observation as a separate event", async () => {
    // #given
    const service = makeService();
    await service.ingest(campaignCreated());
    // #when — same entity, different payload
    const result = await service.ingest(
      campaignCreated({ eventType: "updated", payload: { status: "completed" } }),
    );
    // #then
    expect(result.wasNew).toBe(true);
    const all = await service.allEvents("ws_1");
    expect(all).toHaveLength(2);
  });

  it("rebuilds shared entity state from multiple events, queryable by any caller", async () => {
    // #given — one "agent" writes the campaign, a different "agent" reads it
    const service = makeService();
    await service.ingest(campaignCreated({ agentId: "planner-agent" }));
    await service.ingest(
      campaignCreated({
        eventType: "updated",
        payload: { status: "under_review" },
        agentId: "verifier-agent",
        sourceRef: "investigation_runs:run_2",
      }),
    );
    // #when — a third, unrelated caller queries current state
    const state = await service.getEntityState("campaign:cmp_1");
    // #then — latest field wins, but earlier fields not touched again persist
    expect(state?.fields.title).toBe("October launch");
    expect(state?.fields.status).toBe("under_review");
    expect(state?.eventCount).toBe(2);
    expect(state?.sourceRefs).toContain("campaign_terms_versions:1");
    expect(state?.sourceRefs).toContain("investigation_runs:run_2");
  });

  it("excludes a superseded event from the rebuilt state (provenance preserved, not deleted)", async () => {
    // #given
    const service = makeService();
    const original = await service.ingest(
      campaignCreated({ payload: { status: "active", costAmount: 500 } }),
    );
    await service.ingest(
      campaignCreated({
        eventType: "updated",
        payload: { costAmount: 750 },
        supersedesEventId: original.event.id,
      }),
    );
    // #when
    const state = await service.getEntityState("campaign:cmp_1");
    const allEvents = await service.allEvents("ws_1");
    // #then — superseded event is excluded from derived state...
    expect(state?.eventCount).toBe(1);
    // ...but never deleted from the append log (provenance preserved)
    expect(allEvents).toHaveLength(2);
    expect(allEvents.some((e) => e.id === original.event.id)).toBe(true);
  });

  it("returns null rather than an empty guessed state for an unknown entity", async () => {
    // #given
    const service = makeService();
    // #when
    const state = await service.getEntityState("campaign:does_not_exist");
    // #then
    expect(state).toBeNull();
  });

  it("stores and retrieves relationships between entities (supports/contradicts/etc)", async () => {
    // #given
    const service = makeService();
    await service.ingestRelation(
      "ws_1",
      { relation: "supports", from: "evidence:ev_1", to: "obligation:ob_1" },
      "deliverable_evidence_links:ev_1",
      "verifier-agent",
      "run_1",
    );
    // #when
    const relations = await service.getRelations("obligation:ob_1");
    // #then
    expect(relations).toHaveLength(1);
    expect(relations[0]).toMatchObject({ relation: "supports", from: "evidence:ev_1", to: "obligation:ob_1" });
  });
});
