# Frontend handoff

Written for: a frontend developer joining this repo to build the Next.js
application, working on their own branch against the backend contracts
described here.

You own `apps/web/`. The backend (API, agent runner, sponsor integrations,
database) is being built in parallel by someone else. This doc is the
contract between the two sides so neither blocks the other.

## Workflow

1. Accept the collaborator invite, clone the repo, create a branch
   (`git checkout -b frontend/<your-name>` or similar).
2. Build against the shapes in this doc. The real API isn't live yet in most
   places — mock against these shapes, or use MSW/a local fixture server.
3. Open a PR against `master` when ready. It'll be reviewed and merged by
   the repo owner — don't merge your own PR.
4. If a shape here turns out to be wrong or incomplete once the real API
   exists, that's expected — flag it, we'll reconcile.

## What already exists you can rely on

- **`prisma/schema.prisma`** — the full relational data model. Every entity
  you'll render (campaigns, deliverables, evidence, reports, findings) is
  defined there with its real field names and enums. Read this before
  guessing a shape.
- **`packages/domain`** — pure TypeScript functions for the metrics you'll
  display (fulfilment ratios, holder retention, attribution, renewal
  policy). The types exported there (`SuggestedAction`, `RetentionResult`,
  etc.) are the real enums/shapes the backend will return — import them
  directly in the web app rather than redefining.
- Nothing in `apps/web` exists yet. You're building it from scratch.

## Product shape (read this first)

Afterpost investigates one paid promotional campaign against real evidence
and separates the findings into **three categories that must never be
merged into one score**:

1. **Delivery** — were the contracted posts/threads/etc actually published,
   verified independently vs. just partner-reported?
2. **Observed market activity** — real onchain swaps/transfers/holder
   behavior. Descriptive, not attributed to the campaign.
3. **Attribution** — only for campaigns with tracking links + signed wallet
   opt-in. Everything else is honestly `Unknown`, never `0`.

The whole UI exists to keep these three visually and semantically separate.
Never build a single blended "score" or "ROI%" widget — the backend will
not produce one, and the product's whole value proposition is refusing to
fabricate that number. See `internal/meterless/` is NOT your reference for
this — the actual product rules are in the PRD your project owner has; ask
if you need the full document.

## Design direction

Calm investigative workstation, not a trading dashboard.

```css
--bg: #0C1215;           /* primary background */
--surface: #141D21;      /* cards, sidebar */
--surface-raised: #1B272B; /* popovers, dialogs */
--border: #2A393E;
--text: #EFF5F2;
--text-muted: #9CB0A9;
--accent: #B5F36C;       /* ONE dominant primary action color */
--accent-dark: #213B17;
--info: #8CCBEE;         /* informational / observed data */
--warning: #F5BE70;      /* insufficient evidence, partial state */
--danger: #F58C8C;       /* failed sync, errors */
--success: #8BDCAB;      /* independently confirmed evidence */
```

- Type: Inter or Geist for UI, IBM Plex Mono for hashes/amounts/evidence IDs.
  16px default body, 12px minimum for dense labels only.
- Layout: 256px expandable sidebar, 12-column grid, 1480px max content
  width, 24px card gaps desktop / 14px mobile. 12px card radius, 8px
  control radius. Motion 150-220ms, respect `prefers-reduced-motion`.
- WCAG 2.2 AA. Never communicate confidence/status by color alone — pair
  every status pill with text.

## Mandatory UI states on every data screen

Every screen that loads data needs all of these, not just the happy path:

- **first-use empty** — explain what to add, one clear CTA, no fake numbers.
- **loading** — skeleton, not a spinner over blank space.
- **partial data** — visible warning naming the specific missing source.
- **error** — human-readable cause, retry action, a diagnostic ID.
- **success** — show `As of <UTC time>` and where the data came from.
- **permissions denied** — the actual reason, not a generic 404.
- **no attribution** — a dedicated, calm empty state. Never a `0` badge.

## Core screens to build (priority order)

1. `/sign-in` — auth screen (shape depends on Auth.js config, TBD with
   backend; build the UI first, wire later).
2. `/app` — workspace overview: campaigns needing review, source health.
3. `/app/campaigns` — list with status, dates, paid amount, evidence
   coverage, last-evaluated timestamp.
4. `/app/campaigns/[id]` — the command page. Top band (breadcrumb, partner,
   dates, fee, status, `Investigate` button). First viewport: three
   side-by-side cards for Commitments / Onchain observation / Attribution,
   each independently showing its own coverage status. Middle: evidence
   reconciliation timeline. Bottom: assessment + renewal action + export.
5. `/app/campaigns/[id]/investigate` — live run view. Always-visible
   sentence like `Checking 4 promised posts -> verified 2 -> checking
   transaction window...`. Step list with timestamp/state/duration/origin.
   Split panel: left = sources & evidence, right = findings & decision.
   A replayed run is explicitly labelled `Recorded run`; only an active run
   says `Live`.
6. `/app/campaigns/[id]/evidence` — evidence cabinet: list, type, trust
   level, which claims it supports.
7. `/app/campaigns/[id]/reports/[reportId]` — versioned scorecard, export
   button (CSV/XLSX).
8. `/app/partners`, `/app/partners/[id]` — directory and profile.
9. `/app/projects`, `/app/projects/[id]` — project/token detail.
10. `/app/tracking` — tracking links list, click/opt-in counts.
11. `/go/[slug]` — public landing/redirect page for tracking links. Needs
    a privacy notice and optional wallet-connect flow.

## Data shapes to build against now

These come straight from `prisma/schema.prisma` — the real field names and
enums the API will eventually serialize (camelCased over HTTP, per
standard REST convention; the Prisma `@map` keys are the DB column names,
not the API field names).

```ts
type CampaignStatus = "DRAFT" | "ACTIVE" | "IN_REVIEW" | "COMPLETED" | "CANCELLED";
type SuggestedAction = "renew" | "conditional_trial" | "request_evidence" | "do_not_renew" | "insufficient_data";
type EvidenceStatus = "SUBMITTED" | "RETRIEVED_FROM_SOURCE" | "HUMAN_CONFIRMED" | "UNVERIFIABLE" | "CONTRADICTED" | "WITHDRAWN";
type VerificationBasis = "ONCHAIN_CANONICAL" | "PLATFORM_AUTHENTICATED" | "HUMAN_CONFIRMED" | "PARTNER_REPORTED" | "MODEL_EXTRACTED" | "UNVERIFIABLE";
type ClaimType = "DELIVERY" | "MARKET_OBSERVATION" | "ATTRIBUTED_ACQUISITION" | "LIMITATION";
type CoverageStatus = "COMPLETE" | "PARTIAL" | "STALE" | "UNAVAILABLE" | "NOT_APPLICABLE";

interface CampaignCard {
  id: string;
  title: string;
  status: CampaignStatus;
  partnerName: string;
  projectName: string;
  startAt: string; // ISO
  endAt: string;
  costAmount: string | null; // decimal as string, never a JS number
  costCurrency: string | null;
  lastEvaluatedAt: string | null;
  suggestedAction: SuggestedAction | null;
}
```

For the exact full entity shapes (Deliverable, Evidence, Finding, Report,
Metric, etc.) read `prisma/schema.prisma` directly — it's the single
source of truth and will stay more current than any copy pasted here.

## What's NOT ready yet (don't block on these)

- No live API server exists. Build against mocked/fixture data matching the
  shapes above.
- No `packages/contracts` (shared Zod DTOs) yet — when it lands, swap your
  local types for imports from there.
- Auth flow (Auth.js, Google OAuth / email magic link) isn't wired up.
- The live investigation SSE/event-stream protocol isn't implemented
  server-side yet; build the UI assuming an event stream with shape
  `{ event: "run_state" | "source" | "finding" | "report_ready", data: {...} }`
  and it'll be close to what ships.

## Environment setup

```bash
pnpm install
cp .env.example .env   # fill in only what apps/web needs once it exists
pnpm --filter @afterpost/domain test:unit   # confirm the monorepo installs cleanly
```

`apps/web` doesn't exist yet — bootstrap it with `pnpm create next-app` (App
Router, TypeScript, Tailwind) inside `apps/web/`, matching the repo's
existing conventions (strict TS, no `any`, Zod at boundaries).

## Questions / blockers

Open an issue on the repo or ask the project owner directly — don't guess
on anything that affects shared contracts (route paths, data shapes, auth).
Guessing on visual design, component structure, and page layout is fine and
expected.
