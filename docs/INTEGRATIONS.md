# Integrations — verified status

This file is the Phase 0 gate artifact required by the PRD (§19 Phase 0, §25).
It records what was actually tested against a live endpoint, with real
request/response evidence, versus what remains blocked on credentials. Do not
treat anything marked `UNVERIFIED` as working.

Last updated: 2026-10-27 (session start).

## Robinhood Chain RPC — VERIFIED

No credentials required (public RPC).

- `eth_chainId` on `https://rpc.mainnet.chain.robinhood.com` returned `0x1237`
  (4663), matching PRD §7.2.
- `eth_getTransactionReceipt` for the documented reference launch tx
  `0x1f54f25fec2d963dcb338ecb8b46a6eb123198a5c7a746d34cb2dbe78d074af8`
  returned a real receipt, `status: 0x1`, with a `TokenLaunched`-topic0 log
  emitted by the documented legacy factory
  `0x0c37a24F5D23A486FA692d1500881d698B1F77a4`.
- The documented Uniswap V3 `Swap` topic0
  (`0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67`)
  independently recomputes correctly from the canonical
  `Swap(address,address,int256,int256,uint160,uint128,int24)` signature via
  `viem.toEventSelector` — confirmed this is a real, standard Uniswap V3 pool
  event, not a pons-specific guess.
- Current chain head is ~block 99,515,621 (`0x5ee7be5`) — the public RPC caps
  `eth_getLogs` at a 10,000,000 block span per call; wider ranges are
  rejected with a documented error. `packages/chain-pons` implements
  adaptive chunked scanning (`scanLogsInChunks`) that halves on failure and
  grows back up on sustained success, per PRD §7.3 step 5.
- **Reverse-engineered finding, not from official docs:** the pons factory's
  `TokenLaunched` event's true Solidity signature is unknown. A guessed
  3-indexed-address signature hashes to a *different* topic0 than the one
  actually observed on-chain. The adapter therefore filters by the
  **observed raw topic0** directly and decodes `token`/`creator` positionally
  from `topics[1]`/`topics[2]`, with the pool address read from the **second
  word of non-indexed data** — not from a typed ABI decode. Every pool
  candidate extracted this way is independently re-verified by calling its
  own `token0()`/`token1()` before being trusted. See
  `packages/chain-pons/src/abis.ts` for the full reasoning.
- **Operational finding:** the active pons factory
  (`0xA5aAb3F0c6EeadF30Ef1D3Eb997108E976351feB`) has a very high launch
  volume (thousands of `TokenLaunched` events in narrow block ranges)
  compared to the legacy factory. `discoverPools` scans the legacy factory
  first and returns as soon as a token resolves, to avoid a multi-minute
  blind scan of the active factory's full history. A production indexer
  should know a project's `platform_version`/`factory_address` ahead of time
  (PRD §7.6) rather than searching both factories per request.
- Live test suite: `packages/chain-pons/src/pons-robinhood-adapter.integration.test.ts`,
  4/4 passing against the real network as of this session (chain ID check,
  real token metadata fetch, real pool discovery + independent verification,
  real transaction resolution).

## Zetaris — IN PROGRESS, not yet verified

The local Zetaris Docker Compose platform (downloaded via the official
`zetaris-platform.zip` from the Zetaris Cloud Gateway dashboard) is being
provisioned: registry login to `zetarishackathon.azurecr.io` succeeded,
`./preflight.sh` passed all required checks, and `docker compose pull` is
running. The pull is large and slow in this environment (observed roughly
10MB/min aggregate across three layers) and may not finish before the
submission deadline. Once it does: `docker compose up -d`, `./verify.sh`,
sign in at `http://localhost:3000` with the bundled default admin account
(see `~/zetaris-platform/.env`, changed after first sign-in per that file's
own instructions), register at least two independently-sourced tables (e.g.
campaign/evidence metadata and indexed chain events) as separate logical
sources, and run one real cross-source query before claiming sponsor
integration. **No query has run yet — do not treat this as complete.**

**Needed to unblock further:** nothing further blocks the local platform
coming up; it only needs the pull to finish. Registering real Afterpost
sources requires the API/DB layer (not yet built) or a manual registration
against the Prisma schema's tables directly as a stopgap.

## NVIDIA NIM / Nemotron, routed through Meterless Nightshift — UNVERIFIED, blocked

Per updated instructions, Nemotron must be routed through Meterless
Nightshift as the primary provider, not called directly. The connector is
implemented (`packages/model-generator/src/nightshift-generator.ts`) as an
OpenAI-chat-completions-compatible client — this shape is an *assumption*
matching the Meterless engines' own documented "injected generator" pattern
(`meterless-readme.md` §2), not a confirmed Nightshift API contract. No
`NIGHTSHIFT_BASE_URL`/`NIGHTSHIFT_API_KEY` is available, and the user has
stated the Nightshift web chat interface is not the same thing as its
runtime API and that the endpoint is not yet verified on their machine.
Every model call in this build currently runs through the documented
no-model fallback (`packages/model-generator/src/no-model-generator.ts`),
and every such result is tagged `isFallback: true`.

**Needed to unblock:** a real Nightshift runtime base URL + API key, and
confirmation of its actual request/response shape (chat-completions-style is
assumed, not confirmed).

## Meterless World Model and H-MEM — IMPLEMENTED AND TESTED

Six official Meterless hackathon documents were provided
(`internal/meterless/*.md`: the agent-engines index, the H-MEM and World
Model agent-engine specs, the Markovian spec, the readme, and the sponsor
overview) and read in full before implementation. Per those docs' own
framing, these are "reference architectures, not a library you `pip
install`" — implemented here as real services, not copied documentation:

- **World Model** (`packages/meterless-world-model`): `WorldModelService`
  with content-hash-derived idempotent event IDs (`stableId`), append-only
  JSONL persistence, entity-state rebuild from the non-superseded event log,
  and relationship edges. 6/6 tests passing, including an idempotency test
  that ingests the literal same observation twice and asserts exactly one
  stored event.
- **H-MEM** (`packages/meterless-hmem`): `MemoryStoreService` (tiered
  short/working/long-term, append-only JSONL, feedback-driven confidence
  adjustment), `MemoryRetrievalService` (hybrid ranking — topical
  keyword/tag overlap gates layer/recency/run-scope boosts, so nothing
  surfaces on recency alone), and `TrustLedgerService` (append-only JSONL
  audit of every mutation). 10/10 tests passing.
- **Markovian**: deliberately not implemented. The engines' own readme says
  to use "the smallest set that helps" and that Markovian is for bounding
  token cost on long tasks — nothing in this build runs long enough to need
  it, and the updated instructions explicitly say to keep it optional.
- **Real end-to-end proof**, not just unit tests in isolation:
  `apps/worker/src/demo-investigation.ts` runs live against the real
  Robinhood Chain RPC (fetches the real reference token/pool), ingests the
  observation into World Model (demonstrating idempotency against a live
  run, not just a mock), mines an H-MEM memory via the no-model fallback
  (correctly tagged `isFallback: true`, since Nightshift is unverified),
  and simulates a second investigation retrieving that memory from a fresh
  store instance over the same file — genuine cross-"process" persistence.
  Run with `pnpm --filter @afterpost/worker demo:investigation`. Output
  (`world-model-events.jsonl`, `hmem-memories.jsonl`,
  `hmem-trust-ledger.jsonl`, `investigation-trace-<runId>.jsonl`) is
  committed under `logs/` as evidence.
- Not implemented: H-MEM dreaming/sleep, World Model enrichment jobs,
  conflict auto-resolution — the docs themselves say to add these "only
  once the basics work," and the basics (store + retrieval + idempotent
  ingest) are what's demonstrated here.
- No upstream Meterless commit has been pinned and no official conformance
  harness (from `github.com/Meterless/H-MEM` / `World-Model`) has been run
  against this implementation — these are original implementations of the
  documented contracts, not a pinned reference build. If a conformance
  suite is required rather than a contract-following implementation, that
  is still outstanding.

## Object storage (S3/R2/MinIO), email provider, Google OAuth — UNVERIFIED, blocked

No credentials configured for any of these in this environment.

## VPS (Coden) and Vercel deployment — BLOCKED

No SSH access to a VPS has been provided. The Vercel CLI session in this
tool environment is not linked to your Vercel account/project — `vercel
link`/`vercel deploy` must be run interactively by you, or you provide a
project link + token.

## GitHub remote — LIVE

The `github` MCP server in this environment failed to connect
(`Authorization header is badly formatted`), but the `gh` CLI was
independently authenticated and used instead. Public repository:
https://github.com/winsznx/afterpost.
