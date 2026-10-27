# Sponsor technology — how Afterpost uses each one

Track: **Solving Fragmented Intelligence**. Every integration below is
either marked verified (with the evidence) or unverified (with the exact
blocker) — see [`docs/INTEGRATIONS.md`](INTEGRATIONS.md) for the full detail
behind each line.

## Zetaris — federated query layer (in progress, not yet verified)

**The problem it solves for Afterpost:** a campaign's truth is scattered
across genuinely different data — the agreed terms (relational), the
promotional evidence (documents/metadata), and the indexed chain events
(time-series). A founder deciding whether to renew a promoter needs these
reconciled into one answer without anyone manually joining spreadsheets.

**How it's wired in:** the Prisma schema already separates these into
distinct logical sources (`campaigns`/`deliverables`, `evidence`,
`raw_chain_events`/`swap_observations`/`transfer_observations`) exactly so
they can be registered with Zetaris as independently-sourced tables and
joined with a real federated query, per PRD §11.1 — not a disguised local
join.

**Status:** the local Zetaris platform (Docker Compose, downloaded from the
Zetaris Cloud Gateway) is being provisioned as of this submission. Registry
login and preflight checks passed; the image pull is slow in this
environment and may not finish before the deadline. No live query has run.
This is the honest state — Afterpost does not claim Zetaris sponsor credit
it hasn't earned.

## Meterless — the cognition layer

Two Agent Engines implemented as real services, built from the six official
Meterless hackathon documents (read in full before implementation, not
copied from them):

### World Model (`packages/meterless-world-model`)

**Why Afterpost needs it:** a campaign's state — delivery status, observed
market activity, attribution — must be the same grounded picture no matter
which part of the system (or which later investigation) reads it. Two
investigations of the same campaign must not quietly disagree about what's
true.

**What's real:** `WorldModelService` ingests observations as append-only
events keyed by content-derived stable IDs, so re-ingesting the same
observation after a crash or retry — the exact failure mode a chain indexer
hits constantly — produces zero duplicates. Entity state is always rebuilt
from the non-superseded event log, never mutated in place, so a correction
adds a new event and keeps the old one for audit rather than erasing
history. 6/6 tests passing.

### H-MEM (`packages/meterless-hmem`)

**Why Afterpost needs it:** a renewal recommendation made last month
shouldn't be silently forgotten when the same partner's campaign is
re-investigated next month. The system needs to recall what it found
before, with the evidence that supported it, and update its confidence
when a human agent says a memory was wrong.

**What's real:** `MemoryStoreService` persists tiered memories
(short/working/long-term) with full provenance (`source`, `derivedFrom`,
`supersedes`, agent/run attribution); `MemoryRetrievalService` ranks by
hybrid relevance — topical keyword/tag overlap gates the layer/recency/
run-scope boosts, so nothing surfaces purely because it's recent or
long-term with zero actual relevance to the query (a bug caught and fixed
by the test suite during this build, see `docs/INTEGRATIONS.md`);
`TrustLedgerService` writes an append-only JSONL audit trail of every
mutation, including feedback events that move a memory's confidence up or
down. 10/10 tests passing.

### Markovian — not implemented

The engines' own documentation says to implement "the smallest set that
helps" and to add Markovian only when a long-running task genuinely needs
bounded-context carryover. Nothing in this build runs long enough to
justify it, and the updated build instructions explicitly say to keep it
optional.

### The real proof: both engines running together on live data

`apps/worker/src/demo-investigation.ts` is not a mock. It:

1. Calls the live Robinhood Chain RPC and fetches the real reference pons
   token and its real pool (the same ones verified in
   `docs/INTEGRATIONS.md`).
2. Ingests that observation into World Model, then **ingests the exact same
   observation again** and asserts the second ingest is a no-op — proving
   idempotency against a live run, not just a unit test mock.
3. Mines an H-MEM memory from the observation via the documented no-model
   fallback (Nightshift's runtime endpoint isn't verified yet, so this is
   honestly labelled `isFallback: true`, never claimed as a real inference
   call).
4. Opens a **second**, independent `MemoryStoreService` instance pointed at
   the same file — simulating a later investigation in a new process — and
   retrieves the memory the first run stored.
5. Records feedback from a simulated "verifier agent," moving the memory's
   confidence.

Run it yourself: `pnpm --filter @afterpost/worker demo:investigation`. Its
JSONL output is committed under `logs/` — the Meterless engines' own
standard for what counts as evidence a judge can inspect.

## NVIDIA Nemotron, via Meterless Nightshift — unverified, blocked

Per the updated build instructions, Nemotron inference must route through
Meterless Nightshift as the primary provider rather than NVIDIA's API
directly. The connector (`packages/model-generator/src/nightshift-generator.ts`)
is implemented against the provider-agnostic "injected generator" contract
the Meterless engines themselves specify, but Nightshift's actual runtime
endpoint has not been confirmed — the web chat interface is not the same
thing as an application API, and no base URL/token has been supplied. No
inference call through Nightshift has been attempted; none is claimed.

## Robinhood Chain / pons — verified, live

See `docs/INTEGRATIONS.md` for the full evidence: real chain ID
confirmation, real token/pool verification (independently re-checked via
onchain `token0()`/`token1()` reads, never trusted from event data alone),
and resolution of the documented reference transaction — plus two genuine
integration bugs found and fixed while building this (the RPC's 10M-block
`eth_getLogs` cap, and the pons `TokenLaunched` event's true topic0 not
matching any guessable ABI signature).
