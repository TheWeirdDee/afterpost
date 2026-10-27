import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { JsonlAppendStore } from "./jsonl-append-store.js";

describe("JsonlAppendStore", () => {
  const paths: string[] = [];
  const makePath = () => {
    const p = join(tmpdir(), `afterpost-test-${randomUUID()}.jsonl`);
    paths.push(p);
    return p;
  };

  afterEach(async () => {
    await Promise.all(paths.splice(0).map((p) => rm(p, { force: true })));
  });

  it("returns an empty array when the file does not exist yet", async () => {
    // #given
    const store = new JsonlAppendStore<{ id: string }>(makePath());
    // #when
    const records = await store.readAll();
    // #then
    expect(records).toEqual([]);
  });

  it("persists appended records across store instances (real on-disk persistence)", async () => {
    // #given
    const path = makePath();
    const writer = new JsonlAppendStore<{ id: string; value: number }>(path);
    await writer.append({ id: "a", value: 1 });
    await writer.append({ id: "b", value: 2 });
    // #when — a fresh store instance reading the same file, simulating a new process
    const reader = new JsonlAppendStore<{ id: string; value: number }>(path);
    const records = await reader.readAll();
    // #then
    expect(records).toEqual([
      { id: "a", value: 1 },
      { id: "b", value: 2 },
    ]);
  });

  it("appendAll writes records in order in a single flush", async () => {
    // #given
    const store = new JsonlAppendStore<{ id: string }>(makePath());
    // #when
    await store.appendAll([{ id: "x" }, { id: "y" }, { id: "z" }]);
    const records = await store.readAll();
    // #then
    expect(records.map((r) => r.id)).toEqual(["x", "y", "z"]);
  });
});
