import type { Generator } from "./types.js";

export interface NightshiftConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

/**
 * UNVERIFIED connector. Meterless Nightshift is meant to route NVIDIA
 * Nemotron inference for this build, but no live runtime endpoint has been
 * confirmed yet — the web chat interface is not the application API, and
 * no API base URL/token has been supplied. This client assumes an
 * OpenAI-compatible chat completions shape, matching the "injected
 * generator" wiring pattern the Meterless docs themselves use as the
 * canonical example (meterless-readme.md §2) — but that shape is an
 * assumption, not a confirmed contract, until a real request succeeds.
 *
 * Do not call this in a code path that reports sponsor integration as
 * complete. Callers must check `isFallback`/catch errors and fall back to
 * `noModelGenerator`, recording the failure, never fabricating a result.
 */
export function createNightshiftGenerator(config: NightshiftConfig): Generator {
  return async (prompt, _attachments, systemPrompt) => {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Nightshift request failed: ${response.status} ${response.statusText} — ${await response.text()}`,
      );
    }

    const body = (await response.json()) as {
      id?: string;
      choices: Array<{ message: { content: string } }>;
    };

    const text = body.choices[0]?.message.content;
    if (!text) {
      throw new Error("Nightshift response had no choices[0].message.content");
    }

    return body.id !== undefined
      ? { text, isFallback: false, providerRequestId: body.id }
      : { text, isFallback: false };
  };
}
