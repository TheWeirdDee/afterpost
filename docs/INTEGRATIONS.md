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

## Zetaris — UNVERIFIED, blocked

No tenant credentials (`ZETARIS_API_BASE_URL`, `ZETARIS_API_KEY`,
`ZETARIS_ORG_ID`) are available in this environment. No registration, query,
or connectivity test has been attempted. Per PRD §11.1 this blocks any claim
of sponsor integration; `ZETARIS_UNAVAILABLE` is the correct status until a
real tenant query succeeds.

**Needed to unblock:** Zetaris tenant base URL, API key/bearer token, org ID,
and the tenant's actual REST route paths (the public kbase docs describe
`DBQuery/OpenSqlQuery`, `PageSqlQuery`, `CloseSqlQuery` conceptually but not
the deployed tenant's exact paths).

## NVIDIA NIM / Nemotron — UNVERIFIED, blocked

No `NVIDIA_API_KEY` / `NVIDIA_NIM_BASE_URL` available. No inference call has
been attempted. Per PRD §11.3, the Nemotron sponsor claim is only earned by a
live, validated inference request — not by wiring the client code.

**Needed to unblock:** NVIDIA NIM API key and confirmation of the exact
deployed model identifier for `nvidia/nemotron-3.5-super-vl-120b-a12b` (or
documented alternative) and its quota.

## Meterless (H-MEM / World Model) — NOT YET ATTEMPTED

No upstream commit has been pinned yet, and no conformance harness has been
run. This requires cloning `https://github.com/Meterless/Meterless`,
`https://github.com/Meterless/H-MEM`, and `https://github.com/Meterless/World-Model`,
picking a pinned commit, and running their reference conformance suite
against our adapter — none of which has happened yet in this session. Not
blocked by credentials, blocked by implementation time.

## Object storage (S3/R2/MinIO), email provider, Google OAuth — UNVERIFIED, blocked

No credentials configured for any of these in this environment.

## VPS (Coden) and Vercel deployment — BLOCKED

No SSH access to a VPS has been provided. The Vercel CLI session in this
tool environment is not linked to your Vercel account/project — `vercel
link`/`vercel deploy` must be run interactively by you, or you provide a
project link + token.

## GitHub remote — BLOCKED

The `github` MCP server in this environment failed to connect
(`Authorization header is badly formatted`). No remote repository has been
created. The local repo is initialized (`git init`) with no commits yet.
