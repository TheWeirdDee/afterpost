/**
 * The one seam every Meterless agent engine calls through instead of
 * hard-coding a provider (meterless-readme.md §2). Afterpost wires
 * NVIDIA Nemotron through Meterless Nightshift as the primary provider —
 * this interface is what both H-MEM extraction and World Model enrichment
 * call, so swapping the provider is a one-line change at the call site,
 * never inside the engines themselves.
 */
export interface GeneratorResult {
  text: string;
  /** True when this result came from the no-model fallback, not a real call. */
  isFallback: boolean;
  providerRequestId?: string;
}

export type Generator = (
  prompt: string,
  attachments: readonly string[] | undefined,
  systemPrompt: string | undefined,
) => Promise<GeneratorResult>;
