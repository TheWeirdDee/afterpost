# Contributing

This repo is currently developed by the owner plus explicitly invited
collaborators (currently: a frontend contributor building `apps/web` — see
[`docs/FRONTEND_HANDOFF.md`](docs/FRONTEND_HANDOFF.md) if that's you).

## Workflow

1. Branch off `master`: `git checkout -b <area>/<short-description>`.
2. Make your change. Keep it scoped — one PR, one concern.
3. Run the relevant tests before opening a PR:
   ```bash
   cd packages/<package> && pnpm exec tsc --noEmit && pnpm exec vitest run
   ```
4. Open a PR against `master` using the PR template. Fill in "How this was
   verified" honestly — "it compiles" is not verification.
5. The repo owner reviews and merges. Don't merge your own PR.

## Engineering standards

- Strict TypeScript. No `any` without an explicit comment justifying it.
- No `@ts-ignore`/`@ts-expect-error` without an explanation.
- Money and large on-chain integers are always strings, never JS numbers —
  see `packages/contracts/src/common.ts`.
- Every exported function gets a unit test for its happy path and at least
  one edge case. Look at `packages/domain/src/*.test.ts` for the house
  style (given/when/then comments, one behavior per test).
- Never fabricate data presented as real (chain data, campaign evidence,
  sponsor API responses). Synthetic fixtures must be clearly labelled as
  such everywhere they appear, including in the UI.
- Don't claim an integration works unless you've made a real call and seen
  it succeed. Update `docs/INTEGRATIONS.md` honestly either way.

## Where things live

See the "Repository layout" section in [`README.md`](README.md).

## Questions

Open an issue, or ask the repo owner directly for anything that affects a
shared contract (API routes, data shapes, auth). Everything else — go for
it.
