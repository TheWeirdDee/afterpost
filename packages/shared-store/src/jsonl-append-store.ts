import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";

/**
 * An append-only JSONL file store. This is the durable substrate behind
 * both the World Model append log and the H-MEM trust ledger: every write
 * is one JSON object per line, appended, never rewritten in place — the
 * same "append-friendly, mutate-cautiously" property the Meterless engine
 * docs require, and directly the "shippable to logs/ as JSONL" artifact
 * judges are meant to read.
 */
export class JsonlAppendStore<T> {
  constructor(private readonly filePath: string) {}

  async append(record: T): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await appendFile(this.filePath, `${JSON.stringify(record)}\n`, "utf8");
  }

  async appendAll(records: readonly T[]): Promise<void> {
    if (records.length === 0) return;
    await mkdir(dirname(this.filePath), { recursive: true });
    const lines = records.map((r) => JSON.stringify(r)).join("\n");
    await appendFile(this.filePath, `${lines}\n`, "utf8");
  }

  async readAll(): Promise<T[]> {
    let raw: string;
    try {
      raw = await readFile(this.filePath, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
    return raw
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as T);
  }
}
