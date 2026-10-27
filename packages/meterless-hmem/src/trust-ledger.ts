import { JsonlAppendStore } from "@afterpost/shared-store";
import type { TrustLedgerEntry } from "./types.js";

/**
 * TrustLedgerService (H-MEM engine doc §11, §13): append-only audit of
 * every memory mutation, JSONL-shippable to a run's logs/ directory as the
 * evidence trail a judge (or this product's own review workflow) reads.
 */
export class TrustLedgerService {
  private readonly store: JsonlAppendStore<TrustLedgerEntry>;

  constructor(filePath: string) {
    this.store = new JsonlAppendStore<TrustLedgerEntry>(filePath);
  }

  async record(entry: TrustLedgerEntry): Promise<void> {
    await this.store.append(entry);
  }

  async all(): Promise<TrustLedgerEntry[]> {
    return this.store.readAll();
  }

  async forMemory(memoryId: string): Promise<TrustLedgerEntry[]> {
    const entries = await this.all();
    return entries.filter((e) => e.memoryId === memoryId);
  }
}
