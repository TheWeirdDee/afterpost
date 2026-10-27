# Afterpost

[![CI](https://github.com/winsznx/afterpost/actions/workflows/ci.yml/badge.svg)](https://github.com/winsznx/afterpost/actions/workflows/ci.yml)

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
- **A real Fastify API (`apps/api`) against a real local Postgres/Redis**
  (`infra/docker-compose.yml`), not just route handlers that compile:
  - `GET /health/ready` performs actual Postgres + Redis connectivity
    checks, not a hardcoded 200.
  - `POST /v1/projects` calls the live chain adapter's `validateToken()`
    over the real RPC before writing any row — a malformed address or a
    real RPC failure surfaces as a genuine `422 TOKEN_NOT_VERIFIED`.
  - The full PRD §4.1 first-session journey works end to end against real
    services: workspace → onchain-verified project → partner → campaign
    with deliverables → attach evidence → **generate a renewal report
    through the actual `packages/domain` renewal-policy engine**, which
    with zero evidence linked correctly returns `request_evidence`, never
    a guessed outcome.
  - Tenant isolation is enforced and tested: a cross-workspace write
    attempt returns a structured 404, not a data leak.
  - 16/16 integration tests, run with `app.inject()` against the real
    Fastify pipeline and the real database — see "Running the verified
    parts" below.
- **A real chain indexer job** (`apps/worker/src/jobs/chain-sync.ts`)
  persisting Swap/Transfer observations from the live chain adapter into
  Postgres, upserted by the canonical composite key so re-ingestion never
  duplicates a row. Finding a real bug along the way is in
  `docs/INTEGRATIONS.md`.
- **GitHub Actions CI** (`.github/workflows/ci.yml`) running on every push:
  credential-free typecheck + unit tests, the live chain integration
  tests, and a full Postgres migration + API integration test suite
  against real service containers — not just locally, in the cloud.

- **Zetaris, including the sponsor-removal test.** The local platform
  (Docker Compose) is up, verified, and queried for real through
  `packages/zetaris-client`. A single query joined two independently
  registered, physically distinct sources (a CSV dataset and a Parquet
  dataset, different S3 locations) through real Spark in ~41 seconds —
  not a disguised local join. The REST contract (`records`, not `rows`;
  real pagination fields) was discovered from the platform's own response,
  not assumed from generic docs. Full evidence, including a real
  diagnosed-and-fixed performance issue, in `docs/INTEGRATIONS.md`.

**In progress / not yet verified:**

- Registering genuine Afterpost-specific sources (the campaign/evidence/
  chain-event tables) into Zetaris and querying those, rather than the
  platform's own bootstrapped sample data — the proof above establishes
  the federated-query mechanism works; wiring in Afterpost's actual
  business data is the remaining step.
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
- Auth.js (no real authentication wired up yet — API routes accept a
  temporary, honestly-labelled `ownerId`/`workspaceId` field in the request
  body in place of a verified session), the agent state machine, and the
  Next.js UI (`apps/web`, being built by an invited collaborator — see
  `docs/FRONTEND_HANDOFF.md`) are not yet built.

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
apps/api/                      Fastify API — real Postgres/Redis, real route handlers
apps/worker/                   chain indexer job + the live demo investigation script
apps/web/                      (not started — see docs/FRONTEND_HANDOFF.md)
packages/domain/               deterministic metric calculators and policy engine
packages/chain-pons/           read-only ChainAdapter for Robinhood Chain / pons
packages/zetaris-client/       client for the local Zetaris platform's real REST contract
packages/meterless-world-model/  Meterless World Model Agent Engine (real, tested)
packages/meterless-hmem/       Meterless H-MEM Agent Engine (real, tested)
packages/model-generator/      provider-agnostic generator seam + Nightshift connector
packages/shared-store/         append-only JSONL store + stable content-hash IDs
packages/contracts/            shared Zod DTOs between API and web
packages/ui/                   (planned) shared UI components
prisma/schema.prisma           full relational data model, migrated and verified
infra/docker-compose.yml       local Postgres + Redis for development
docs/                          integration status, architecture, frontend handoff
logs/                          committed JSONL evidence from the real demo run
.github/workflows/ci.yml       real CI: typecheck, unit tests, live-service integration tests
```

## Running the verified parts from a clean checkout

```bash
pnpm install
cp .env.example .env   # DB/Redis defaults already point at the compose services below

# Deterministic domain + Meterless engines — no network, no credentials
pnpm --filter @afterpost/domain test:unit
pnpm --filter @afterpost/meterless-world-model test:unit
pnpm --filter @afterpost/meterless-hmem test:unit

# Live chain adapter — hits the real public Robinhood Chain RPC, no credentials needed
pnpm --filter @afterpost/chain-pons test:unit
pnpm --filter @afterpost/chain-pons test:integration

# Real end-to-end demo: live chain data -> World Model -> H-MEM -> JSONL trace
pnpm --filter @afterpost/worker demo:investigation

# Local Postgres + Redis, then the real API against them
docker compose -f infra/docker-compose.yml up -d
pnpm exec prisma migrate deploy --schema prisma/schema.prisma
pnpm exec prisma generate --schema prisma/schema.prisma
pnpm --filter @afterpost/api test:integration   # full first-session journey, real DB
pnpm --filter @afterpost/worker test:integration # real chain indexer sync
pnpm --filter @afterpost/api dev                 # serves on :8787
```

Fill in the rest of `.env` with real credentials to work on the parts that
need them (see comments in that file for exactly where each value comes
from — Zetaris, Nightshift, object storage, OAuth, etc).

## Sponsor technology

- **Zetaris** — the federated query layer intended to join campaign
  commitments, promotional evidence, and indexed chain events as genuinely
  separate registered sources. Verified live: the local platform is up,
  `packages/zetaris-client` is built against its real (reverse-engineered,
  not publicly documented) REST contract, and a genuine federated query
  joining two independently registered, physically distinct sources
  executed through real Spark — the PRD's own "sponsor-removal test." Full
  evidence in `docs/INTEGRATIONS.md`. Wiring in Afterpost's own business
  data (vs. the platform's bootstrapped samples) is the remaining step.
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
