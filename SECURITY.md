# Security

## Reporting a vulnerability

This is an active hackathon/early-stage build, not yet handling real user
data in production. If you find a security issue, open a private report to
the repo owner (GitHub's "Report a vulnerability" under the Security tab,
or contact directly) rather than a public issue, until it's fixed.

## What's in scope right now

- `packages/zetaris-client`, `packages/model-generator` — outbound HTTP
  clients to sponsor services. No secrets are hardcoded; all credentials
  come from environment variables (see `.env.example`).
- `apps/api` — the Fastify API. No authentication is wired up yet (see
  `README.md` "in progress" section) — do not deploy this publicly as-is.
- Nothing in this repo currently touches real user funds, signs blockchain
  transactions, or stores production user data. `packages/chain-pons` is
  strictly read-only — no method in it can sign or broadcast a transaction.

## Known gaps (tracked, not hidden)

- No authentication/authorization layer yet.
- No rate limiting yet.
- No secrets manager integration yet — local dev uses a plain `.env` file
  (gitignored; never commit it).
- See `docs/INTEGRATIONS.md` for the full honest status of every
  integration, including what's unverified.

## Design commitments (from the product spec, enforced going forward)

- Read-only blockchain access only — never seed phrases, never trades,
  never signs transactions.
- SSRF protections on any URL fetch: `https:` only, no private/reserved IP
  ranges, no internal redirects.
- CSV/XLSX export sanitizes any cell starting with `=`, `+`, `-`, `@` to
  prevent spreadsheet formula injection.
- Fixed, parameterized query templates only — no LLM-generated SQL
  execution against any data source.
