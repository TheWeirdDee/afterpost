## What changed

<!-- One or two sentences. What does this PR actually do? -->

## Why

<!-- What problem does this solve? Link an issue if there is one. -->

## FR IDs satisfied

<!-- e.g. FR-A02, FR-B01 — see internal PRD §6. Leave blank if this is infra/docs-only. -->

## How this was verified

<!-- Required. "It builds" is not verification. -->
- [ ] Ran the relevant unit tests: `pnpm --filter <package> test:unit`
- [ ] Ran the relevant integration tests (if applicable): `pnpm --filter <package> test:integration`
- [ ] Exercised the change through the actual API/UI, not just a type check
- [ ] Checked persistence after restart (if this touches stored state)

## Checklist

- [ ] No `any` without an explicit justification comment
- [ ] No secrets committed (check `git diff` for anything that looks like a key/token)
- [ ] Updated `docs/INTEGRATIONS.md` if this changes integration status
- [ ] Updated `README.md` if this changes what's verified vs. in-progress
