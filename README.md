# Afterpost

Know what your promoters delivered. Compare what you paid for with the posts
that went live, the transactions you can verify, and what remains unknown.

Built for the GenAI Works Open Agent Hackathon 2026, Track 01 — Solving
Fragmented Intelligence.

## Honest status (as of this submission)

This is **not** a finished production application. It is a working core —
real onchain data, real metric logic, real tests — with the full product
surface (auth, API, agent runner, UI) still in progress. Specific claims
below are either verified live or explicitly marked unverified; nothing here
is asserted that hasn't actually run.

**Verified, live, right now:**

- A real, read-only chain adapter for Robinhood Chain (chain ID `4663`) and
  the pons launchpad, built on viem. Confirmed live against the public RPC:
  correct chain ID, real token metadata, real pool discovery (independently
  re-verified via onchain `token0()`/`token1()` reads, not trusted from event
  data), and resolution of a real documented reference transaction. See
  [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md) for the exact evidence,
  including two genuine integration bugs found and fixed along the way.
- A deterministic metrics/decision engine (`packages/domain`) implementing
  swap-direction classification, delivery fulfilment ratios, holder-cohort
  retention, attribution qualification, and the renewal-recommendation
  policy — all with unit tests covering the adversarial cases this product
  exists to get right (a router is never labelled a buyer; a future horizon
  is `PENDING`, never `0%`; missing tracking data never forces an adverse
  renewal decision).
- A complete relational schema (`prisma/schema.prisma`) for the full product
  surface: workspaces, campaigns, evidence provenance, chain observations,
  tracking/attribution, investigation runs, findings, and reports.
- **Two Meterless Agent Engines, implemented as real services with real
  tests — not just read from the reference docs:**
  - **World Model** (`packages/meterless-world-model`) — append-only,
    content-hash-idempotent event ingestion, entity state rebuilt from the
    log (never mutated in place), relationship edges
    (`supports`/`contradicts`/`belongs_to`/...), full provenance. 6/6 tests
    passing, including a literal "ingest the same observation twice, assert
    exactly one event" idempotency test.
  - **H-MEM** (`packages/meterless-hmem`) — tiered memory
    (short-term/working/long-term), hybrid retrieval ranking (topical
    overlap gates layer/recency/run-scope boosts — a memory with zero
    relevance to the query cannot surface just because it's recent), an
    append-only JSONL trust ledger, and agent feedback loops that move
    confidence up/down and tag corrections for review. 10/10 tests passing.
  - A real, live-chain-data run of both together lives at
    `apps/worker/src/demo-investigation.ts` — fetches the real reference
    pons token/pool from the live RPC, ingests it into World Model
    (demonstrating idempotency live, not just in a unit test), mines an
    H-MEM memory, then simulates a *second* investigation retrieving that
    memory from a fresh store instance over the same file. Run it yourself
    with `pnpm --filter @afterpost/worker demo:investigation`. Its JSONL
    output (events, memories, trust ledger, and the full step trace) is
    committed under `logs/` as evidence, per the Meterless engines' own
    "if it isn't in logs/ as JSONL, a judge can't see it happened" rule.
  - **Markovian** (long-task bounded-context reasoning) was deliberately
    **not** implemented — the engines' own guidance is to keep it optional
    unless a long-running investigation genuinely needs it, and nothing in
    the current build runs long enough to justify it.

**In progress / not yet verified:**

- Zetaris federated query layer — the local Docker Compose platform is
  being provisioned (image pull in progress as of this submission; it is a
  large, slow pull and may not finish before the deadline). No live query
  has run yet. Tracked honestly in `docs/INTEGRATIONS.md`.
- Meterless Nightshift as the primary LLM provider, routing NVIDIA Nemotron
  inference — the connector is implemented
  (`packages/model-generator/src/nightshift-generator.ts`, an injected
  `Generator` matching the Meterless engines' own provider-agnostic seam)
  but its runtime endpoint has not been confirmed, so every model call in
  this build currently runs through the documented no-model fallback
  (`packages/model-generator/src/no-model-generator.ts`), which the
  Meterless engine docs themselves specify as the sample-mode degradation
  path — every such result is tagged `isFallback: true` and never reported
  as a real inference call.
- The Fastify API, Auth.js, the agent state machine, and the Next.js UI are
  not yet built.

## Why this matters

A founder pays a promoter to post about a launch. Afterwards they have
screenshots, a vague sense the price moved, and no reliable way to tell
whether the partner actually delivered what was promised versus what simply
happened to the market around the same time. Afterpost investigates a
campaign against real sources — the agreed terms, the published evidence,
onchain activity, and (for future instrumented campaigns) consented wallet
attribution — and keeps those three categories of evidence separate instead
of collapsing them into a misleading single score.

## Repository layout

```text
packages/domain/               deterministic metric calculators and policy engine
packages/chain-pons/           read-only ChainAdapter for Robinhood Chain / pons
packages/meterless-world-model/  Meterless World Model Agent Engine (real, tested)
packages/meterless-hmem/       Meterless H-MEM Agent Engine (real, tested)
packages/model-generator/      provider-agnostic generator seam + Nightshift connector
packages/shared-store/         append-only JSONL store + stable content-hash IDs
packages/contracts/            (planned) shared Zod DTOs between API and web
packages/ui/                   (planned) shared UI components
apps/worker/                   real end-to-end demo tying chain data + both engines together
prisma/schema.prisma           full relational data model
docs/                          integration status, architecture notes
infra/                         environment variable reference, deployment config
logs/                          committed JSONL evidence from the real demo run
```

## Running the verified parts from a clean checkout

```bash
pnpm install

# Deterministic domain logic — no network, no credentials
pnpm --filter @afterpost/domain test:unit

# Live chain adapter — hits the real public Robinhood Chain RPC, no credentials needed
pnpm --filter @afterpost/chain-pons test:unit
pnpm --filter @afterpost/chain-pons test:integration

# Meterless World Model and H-MEM engines — no network, no credentials
pnpm --filter @afterpost/meterless-world-model test:unit
pnpm --filter @afterpost/meterless-hmem test:unit

# Real end-to-end demo: live chain data -> World Model -> H-MEM -> JSONL trace
pnpm --filter @afterpost/worker demo:investigation
```

Copy `.env.example` to `.env` and fill in credentials to work on the parts
that need them (see comments in that file for where each value comes from).

## Sponsor technology

- **Zetaris** — intended as the federated query layer joining campaign
  commitments, promotional evidence, and indexed chain events as genuinely
  separate registered sources. The local platform (Docker Compose) is being
  provisioned; no live query has run yet. See `docs/INTEGRATIONS.md`.
- **Meterless** — two Agent Engines implemented as real, tested services:
  - **World Model** at `packages/meterless-world-model` — idempotent
    append-only ingest, provenance-backed entity state, relationships.
  - **H-MEM** at `packages/meterless-hmem` — tiered memory, hybrid
    retrieval, trust-ledger audit trail, feedback-adjusted confidence.
  - Both run live together in `apps/worker/src/demo-investigation.ts`
    against real Robinhood Chain data; its JSONL output is committed under
    `logs/`.
  - **Nightshift** (primary LLM provider, routing NVIDIA Nemotron) — the
    connector is built (`packages/model-generator`) as the provider-agnostic
    "injected generator" the Meterless docs specify, but its runtime
    endpoint is unverified, so this build currently runs on the documented
    no-model fallback. Nothing here claims a Nightshift/Nemotron call that
    didn't happen.
  - **Markovian** — deliberately not implemented; not needed at this scale,
    per the engines' own guidance.
- **Robinhood Chain / pons** — live and verified; see above.

## License

Proprietary — all rights reserved, pending the author's decision on an open
license. Do not redistribute without permission.
