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

**In progress / not yet verified:**

- Zetaris federated query layer — platform is being provisioned; no live
  query has run yet. Tracked in `docs/INTEGRATIONS.md`.
- Meterless Nightshift as the LLM routing layer for NVIDIA Nemotron — not
  yet wired; runtime endpoint/token not yet available.
- A Meterless Engine (H-MEM) for investigation history — not yet
  implemented or conformance-tested.
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
packages/domain/      deterministic metric calculators and policy engine
packages/chain-pons/  read-only ChainAdapter for Robinhood Chain / pons
packages/contracts/   (planned) shared Zod DTOs between API and web
packages/ui/          (planned) shared UI components
prisma/schema.prisma  full relational data model
docs/                 integration status, architecture notes
infra/                environment variable reference, deployment config
```

## Running the verified parts from a clean checkout

```bash
pnpm install

# Deterministic domain logic — no network, no credentials
pnpm --filter @afterpost/domain test:unit

# Live chain adapter — hits the real public Robinhood Chain RPC, no credentials needed
pnpm --filter @afterpost/chain-pons test:unit
pnpm --filter @afterpost/chain-pons test:integration
```

Copy `.env.example` to `.env` and fill in credentials to work on the parts
that need them (see comments in that file for where each value comes from).

## Sponsor technology

- **Zetaris** — intended as the federated query layer joining campaign
  commitments, promotional evidence, and indexed chain events as genuinely
  separate registered sources. See `docs/INTEGRATIONS.md` for current status.
- **Meterless (Nightshift / H-MEM)** — Nightshift is the intended LLM
  routing layer for NVIDIA Nemotron inference; H-MEM is the intended
  persistent-memory engine for cross-campaign investigation history. Both
  pending credentials/implementation — status tracked honestly in
  `docs/INTEGRATIONS.md`, not claimed until a real call/conformance run
  succeeds.
- **Robinhood Chain / pons** — live and verified; see above.

## License

Proprietary — all rights reserved, pending the author's decision on an open
license. Do not redistribute without permission.
