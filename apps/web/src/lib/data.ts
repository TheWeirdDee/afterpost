import type {
  CampaignCardDto,
  CampaignStatus,
  CoverageStatus,
  DeliverableDto,
  EvidenceDto,
  FindingDto,
  PartnerDto,
  ReportDto,
  SuggestedAction,
} from "@afterpost/contracts";

/**
 * Fixture data matching @afterpost/contracts. The API is not live yet, so the
 * UI renders these shapes. Swap `getX` for fetchers when it ships.
 */
export const AS_OF = "2026-10-27T09:42:00Z";
export const FIXTURE_SOURCE = "Fixture data · API not connected";

export type Lane = {
  coverage: CoverageStatus;
  headline: string;
  detail: string;
  metrics: { label: string; value: string }[];
  gap?: string;
};

export type CampaignDetail = CampaignCardDto & {
  deliverables: (DeliverableDto & { label: string; verified: number })[];
  lanes: { delivery: Lane; market: Lane; attribution: Lane };
  evidence: (EvidenceDto & { title: string; supports: string[] })[];
  findings: FindingDto[];
  timeline: { at: string; lane: "delivery" | "market" | "attribution" | "system"; text: string }[];
  reports: (ReportDto & { id: string })[];
  partnerId: string;
  projectId: string;
  feeLabel: string;
};

export const projects = [
  { id: "prj_lumen", name: "Lumen Protocol", symbol: "LMN", address: "0x7a3f19c2b8e04d5a6f1c9e2d3b4a5c6d7e8f9012", chain: "Robinhood Chain · 4663", platform: "pons", status: "ACTIVE" as const, campaigns: 2, spend: "16,500" },
  { id: "prj_harbor", name: "Harbor Finance", symbol: "HBR", address: "0x2b9c4e7d1a8f3065c4d2e1f09a8b7c6d5e4f3a21", chain: "Robinhood Chain · 4663", platform: "pons", status: "ACTIVE" as const, campaigns: 3, spend: "14,500" },
];

export const partners: (PartnerDto & { campaigns: number; delivered: string; note: string })[] = [
  { id: "ptn_northwind", displayName: "Northwind Signals", handle: "@northwindsignals", profileUrl: "https://x.com/northwindsignals", status: "TRIAL", campaigns: 2, delivered: "5 of 8 verified", note: "Two engagements. Delivery partially verified; one thread has no retrievable source." },
  { id: "ptn_ada", displayName: "Ada Okafor Media", handle: "@adaokafor", profileUrl: "https://x.com/adaokafor", status: "ACTIVE", campaigns: 1, delivered: "4 of 4 verified", note: "Tracking links used on every post. Only partner with consented wallet attribution." },
  { id: "ptn_kite", displayName: "Kite Collective", handle: "@kitecollective", profileUrl: "https://x.com/kitecollective", status: "CANDIDATE", campaigns: 1, delivered: "Not yet evaluated", note: "First engagement currently running. No evidence collected." },
];

const E = (d: Omit<EvidenceDto, "ingestedAt"> & { title: string; supports: string[]; ingestedAt?: string }) => ({
  ingestedAt: "2026-10-24T10:05:00Z",
  ...d,
});

const c1Evidence = [
  E({ id: "evd_001", kind: "POST_URL", title: "Launch announcement post", sourceRef: "x.com/northwindsignals/status/18412…", verificationBasis: "PLATFORM_AUTHENTICATED", status: "RETRIEVED_FROM_SOURCE", observedAt: "2026-10-06T14:02:00Z", supports: ["Deliverable 1"] }),
  E({ id: "evd_002", kind: "POST_URL", title: "Token mechanics thread (7 posts)", sourceRef: "x.com/northwindsignals/status/18419…", verificationBasis: "PLATFORM_AUTHENTICATED", status: "RETRIEVED_FROM_SOURCE", observedAt: "2026-10-08T09:30:00Z", supports: ["Deliverable 2"] }),
  E({ id: "evd_003", kind: "IMAGE", title: "Screenshot of pinned post", sourceRef: "upload/pinned-post.png", verificationBasis: "PARTNER_REPORTED", status: "SUBMITTED", observedAt: null, supports: ["Deliverable 3"] }),
  E({ id: "evd_004", kind: "POST_URL", title: "Community recap post", sourceRef: "x.com/northwindsignals/status/18433…", verificationBasis: "HUMAN_CONFIRMED", status: "HUMAN_CONFIRMED", observedAt: "2026-10-15T17:41:00Z", supports: ["Deliverable 4"] }),
  E({ id: "evd_005", kind: "ONCHAIN_SWAP", title: "Swap activity, campaign window", sourceRef: "pons pool 0x91c…e4 · blocks 8.21M–8.34M", verificationBasis: "ONCHAIN_CANONICAL", status: "RETRIEVED_FROM_SOURCE", observedAt: "2026-10-20T00:00:00Z", supports: ["Observed activity"] }),
  E({ id: "evd_006", kind: "TOKEN_TRANSFER", title: "Holder transfers, campaign window", sourceRef: "LMN transfers · 8.21M–8.34M", verificationBasis: "ONCHAIN_CANONICAL", status: "RETRIEVED_FROM_SOURCE", observedAt: "2026-10-20T00:00:00Z", supports: ["Observed activity"] }),
  E({ id: "evd_007", kind: "TERMS", title: "Signed agreement (PDF)", sourceRef: "upload/agreement-v2.pdf", verificationBasis: "MODEL_EXTRACTED", status: "SUBMITTED", observedAt: null, supports: ["All deliverables"] }),
];

const c1: CampaignDetail = {
  id: "cmp_launch",
  title: "Launch week amplification",
  status: "IN_REVIEW",
  goal: "DELIVERY_AND_AWARENESS",
  partnerName: "Northwind Signals",
  projectName: "Lumen Protocol",
  startAt: "2026-10-06T00:00:00Z",
  endAt: "2026-10-20T00:00:00Z",
  cost: { amount: "12000.00", currency: "USD" },
  paymentStatus: "PAID_USER_REPORTED",
  lastEvaluatedAt: "2026-10-27T08:15:00Z",
  suggestedAction: "conditional_trial",
  partnerId: "ptn_northwind",
  projectId: "prj_lumen",
  feeLabel: "$12,000 · paid (user reported)",
  deliverables: [
    { id: "dlv_1", label: "Launch announcement post", kind: "POST", channel: "X", requiredQuantity: 1, dueAt: "2026-10-06T00:00:00Z", status: "VERIFIED_FULFILLED", verified: 1 },
    { id: "dlv_2", label: "Token mechanics thread", kind: "THREAD", channel: "X", requiredQuantity: 1, dueAt: "2026-10-08T00:00:00Z", status: "VERIFIED_FULFILLED", verified: 1 },
    { id: "dlv_3", label: "Pinned post for 7 days", kind: "POST", channel: "X", requiredQuantity: 1, dueAt: "2026-10-10T00:00:00Z", status: "UNRESOLVED", verified: 0 },
    { id: "dlv_4", label: "Community recap", kind: "COMMUNITY_MENTION", channel: "Telegram", requiredQuantity: 1, dueAt: "2026-10-15T00:00:00Z", status: "USER_CONFIRMED_FULFILLED", verified: 0 },
  ],
  lanes: {
    delivery: {
      coverage: "PARTIAL",
      headline: "3 of 4 commitments fulfilled",
      detail: "Two confirmed from the platform itself, one confirmed by a person on your team. The pinned post rests on a partner screenshot only.",
      metrics: [
        { label: "Independently verified", value: "2 / 4" },
        { label: "Human confirmed", value: "1 / 4" },
        { label: "Unresolved", value: "1 / 4" },
      ],
      gap: "Pinned-post duration can't be checked: the platform API returned no pin history.",
    },
    market: {
      coverage: "COMPLETE",
      headline: "214 swaps in the window",
      detail: "Observed on Robinhood Chain via the pons pool. Routers are excluded from buyer counts. Descriptive only, not attributed to this campaign.",
      metrics: [
        { label: "Swaps observed", value: "214" },
        { label: "Net-new wallets", value: "61" },
        { label: "Holders after 7d", value: "PENDING" },
      ],
    },
    attribution: {
      coverage: "NOT_APPLICABLE",
      headline: "Unknown",
      detail: "No tracking links or signed wallet opt-ins were used, so nothing can honestly be attributed. This is not a zero.",
      metrics: [{ label: "Tracked clicks", value: "Unknown" }, { label: "Opted-in wallets", value: "Unknown" }],
    },
  },
  evidence: c1Evidence,
  findings: [
    { id: "fnd_1", claimType: "DELIVERY", text: "Two of four contracted posts were retrieved directly from the platform and match the agreed terms.", status: "SUPPORTED", evidenceIds: ["evd_001", "evd_002"] },
    { id: "fnd_2", claimType: "DELIVERY", text: "The 7-day pinned post is supported only by a partner-supplied screenshot; it cannot be confirmed independently.", status: "UNRESOLVED", evidenceIds: ["evd_003"] },
    { id: "fnd_3", claimType: "MARKET_OBSERVATION", text: "214 swaps and 61 first-time buyer wallets were observed on the pool during the window. These are not attributed to the campaign.", status: "SUPPORTED", evidenceIds: ["evd_005", "evd_006"] },
    { id: "fnd_4", claimType: "LIMITATION", text: "No tracking data exists for this campaign, so acquisition cannot be assessed.", status: "UNRESOLVED", evidenceIds: [] },
  ],
  timeline: [
    { at: "2026-10-06T14:02:00Z", lane: "delivery", text: "Launch announcement published and retrieved from source" },
    { at: "2026-10-08T09:30:00Z", lane: "delivery", text: "Mechanics thread (7 posts) published and retrieved from source" },
    { at: "2026-10-10T00:00:00Z", lane: "delivery", text: "Pinned post due. Only a partner screenshot received" },
    { at: "2026-10-11T08:00:00Z", lane: "market", text: "Swap volume peaks: 38 swaps in a single hour" },
    { at: "2026-10-15T17:41:00Z", lane: "delivery", text: "Community recap confirmed by a workspace analyst" },
    { at: "2026-10-20T00:00:00Z", lane: "system", text: "Campaign window closed. Chain data synced through block 8.34M" },
    { at: "2026-10-27T08:15:00Z", lane: "system", text: "Investigation run completed with partial coverage" },
  ],
  reports: [
    { id: "rpt_launch_v2", version: 2, status: "NEEDS_REVIEW", suggestedAction: "conditional_trial", dataAsOf: "2026-10-27T08:15:00Z", limitations: ["Pinned-post duration unverifiable", "No attribution instrumentation", "7-day holder retention still PENDING"] },
    { id: "rpt_launch_v1", version: 1, status: "SUPERSEDED", suggestedAction: "request_evidence", dataAsOf: "2026-10-21T12:00:00Z", limitations: ["Chain sync incomplete"] },
  ],
};

const c2: CampaignDetail = {
  ...c1,
  id: "cmp_staking",
  title: "Thread series: staking explainer",
  status: "COMPLETED",
  goal: "ACQUISITION",
  partnerName: "Ada Okafor Media",
  startAt: "2026-09-01T00:00:00Z",
  endAt: "2026-09-21T00:00:00Z",
  cost: { amount: "4500.00", currency: "USD" },
  paymentStatus: "PAID_USER_REPORTED",
  lastEvaluatedAt: "2026-10-02T11:30:00Z",
  suggestedAction: "renew",
  partnerId: "ptn_ada",
  feeLabel: "$4,500 · paid (user reported)",
  deliverables: [
    { id: "dlv_a", label: "Staking explainer thread ×4", kind: "THREAD", channel: "X", requiredQuantity: 4, dueAt: "2026-09-21T00:00:00Z", status: "VERIFIED_FULFILLED", verified: 4 },
  ],
  lanes: {
    delivery: { coverage: "COMPLETE", headline: "4 of 4 threads verified", detail: "Every thread was retrieved from the platform and published inside the agreed window.", metrics: [{ label: "Independently verified", value: "4 / 4" }, { label: "Late", value: "0" }] },
    market: { coverage: "COMPLETE", headline: "96 swaps in the window", detail: "Observed onchain. Descriptive; attribution is reported separately below.", metrics: [{ label: "Swaps observed", value: "96" }, { label: "Holders after 7d", value: "38 of 52" }] },
    attribution: { coverage: "COMPLETE", headline: "17 wallets, tracked and signed", detail: "Wallets that clicked a tracking link and signed an opt-in message before swapping. Only these are attributed.", metrics: [{ label: "Tracked clicks", value: "412" }, { label: "Opted-in wallets", value: "29" }, { label: "Swapped after opt-in", value: "17" }] },
  },
  evidence: [
    E({ id: "evd_a01", kind: "TRACKED_CLICK", title: "Tracking link clicks", sourceRef: "go/staking-s1 … s4", verificationBasis: "PLATFORM_AUTHENTICATED", status: "RETRIEVED_FROM_SOURCE", observedAt: "2026-09-21T00:00:00Z", supports: ["Attribution"] }),
    E({ id: "evd_a02", kind: "SIGNED_WALLET", title: "Signed wallet opt-ins (29)", sourceRef: "EIP-191 signatures", verificationBasis: "ONCHAIN_CANONICAL", status: "RETRIEVED_FROM_SOURCE", observedAt: "2026-09-21T00:00:00Z", supports: ["Attribution"] }),
  ],
  findings: [
    { id: "fnd_a1", claimType: "DELIVERY", text: "All four contracted threads were published in the window and retrieved from source.", status: "SUPPORTED", evidenceIds: [] },
    { id: "fnd_a2", claimType: "ATTRIBUTED_ACQUISITION", text: "17 wallets that opted in via tracking links went on to swap. This covers opted-in wallets only, not the whole market.", status: "SUPPORTED", evidenceIds: ["evd_a01", "evd_a02"] },
  ],
  timeline: [
    { at: "2026-09-04T10:00:00Z", lane: "delivery", text: "Thread 1 published, retrieved from source" },
    { at: "2026-09-12T10:00:00Z", lane: "attribution", text: "First opted-in wallet swaps after link click" },
    { at: "2026-09-21T00:00:00Z", lane: "system", text: "Window closed. All lanes complete" },
  ],
  reports: [{ id: "rpt_staking_v1", version: 1, status: "APPROVED", suggestedAction: "renew", dataAsOf: "2026-10-02T11:30:00Z", limitations: ["Attribution covers opted-in wallets only"] }],
};

const c3: CampaignDetail = {
  ...c1,
  id: "cmp_ama",
  title: "Community AMA + spaces",
  status: "ACTIVE",
  goal: "RETENTION",
  partnerName: "Kite Collective",
  projectName: "Harbor Finance",
  startAt: "2026-10-22T00:00:00Z",
  endAt: "2026-11-12T00:00:00Z",
  cost: { amount: "8000.00", currency: "USD" },
  paymentStatus: "INVOICE_RECEIVED",
  lastEvaluatedAt: null,
  suggestedAction: null,
  partnerId: "ptn_kite",
  projectId: "prj_harbor",
  feeLabel: "$8,000 · invoice received",
  deliverables: [
    { id: "dlv_k1", label: "Hosted AMA space", kind: "SPACE", channel: "X", requiredQuantity: 1, dueAt: "2026-10-30T00:00:00Z", status: "PENDING", verified: 0 },
    { id: "dlv_k2", label: "Recap posts", kind: "POST", channel: "X", requiredQuantity: 3, dueAt: "2026-11-05T00:00:00Z", status: "PENDING", verified: 0 },
  ],
  lanes: {
    delivery: { coverage: "UNAVAILABLE", headline: "Not evaluated yet", detail: "No evidence has been added. Add the first post link or run an investigation once the AMA has happened.", metrics: [] },
    market: { coverage: "UNAVAILABLE", headline: "Window still open", detail: "The campaign window closes on 12 Nov. Observed activity will appear after chain sync.", metrics: [] },
    attribution: { coverage: "NOT_APPLICABLE", headline: "Unknown", detail: "No tracking links created for this campaign yet.", metrics: [] },
  },
  evidence: [],
  findings: [],
  timeline: [],
  reports: [],
};

const c4: CampaignDetail = {
  ...c1,
  id: "cmp_prelist",
  title: "Pre-listing awareness window",
  status: "COMPLETED",
  goal: "DELIVERY_AND_AWARENESS",
  projectName: "Harbor Finance",
  projectId: "prj_harbor",
  startAt: "2026-08-10T00:00:00Z",
  endAt: "2026-08-24T00:00:00Z",
  cost: { amount: "6500.00", currency: "USD" },
  paymentStatus: "DISPUTED",
  lastEvaluatedAt: "2026-09-01T09:00:00Z",
  suggestedAction: "do_not_renew",
  feeLabel: "$6,500 · disputed",
  deliverables: [
    { id: "dlv_p1", label: "Three promotional posts", kind: "POST", channel: "X", requiredQuantity: 3, dueAt: "2026-08-24T00:00:00Z", status: "MISSED", verified: 1 },
  ],
  lanes: {
    delivery: { coverage: "COMPLETE", headline: "1 of 3 posts delivered", detail: "Two posts were never published. One was published after the window closed.", metrics: [{ label: "Verified", value: "1 / 3" }, { label: "Late", value: "1" }, { label: "Missed", value: "1" }] },
    market: { coverage: "COMPLETE", headline: "41 swaps in the window", detail: "Descriptive only. Activity stayed near its pre-window baseline.", metrics: [{ label: "Swaps observed", value: "41" }] },
    attribution: { coverage: "NOT_APPLICABLE", headline: "Unknown", detail: "No tracking instrumentation. Not reported as zero.", metrics: [] },
  },
  evidence: c1Evidence.slice(0, 2),
  findings: [{ id: "fnd_p1", claimType: "DELIVERY", text: "One of three contracted posts was published inside the window.", status: "CONTRADICTED", evidenceIds: ["evd_001"] }],
  timeline: [{ at: "2026-08-24T00:00:00Z", lane: "system", text: "Window closed. Two deliverables missed" }],
  reports: [{ id: "rpt_prelist_v1", version: 1, status: "DISPUTED", suggestedAction: "do_not_renew", dataAsOf: "2026-09-01T09:00:00Z", limitations: ["Payment is under dispute"] }],
};

const c5: CampaignDetail = {
  ...c3,
  id: "cmp_video",
  title: "Explainer video pack",
  status: "DRAFT",
  goal: "OTHER",
  partnerName: "Ada Okafor Media",
  partnerId: "ptn_ada",
  startAt: "2026-11-15T00:00:00Z",
  endAt: "2026-12-06T00:00:00Z",
  cost: null,
  paymentStatus: "AGREED",
  feeLabel: "Fee not set",
  deliverables: [],
};

export const campaigns: CampaignDetail[] = [c1, c2, c3, c4, c5];

export const getCampaign = (id: string) => campaigns.find((c) => c.id === id);
export const getPartner = (id: string) => partners.find((p) => p.id === id);
export const getProject = (id: string) => projects.find((p) => p.id === id);

export const trackingLinks = [
  { slug: "staking-s1", campaignId: "cmp_staking", campaign: "Thread series: staking explainer", label: "Thread 1", clicks: 148, optIns: 11, created: "2026-09-01" },
  { slug: "staking-s2", campaignId: "cmp_staking", campaign: "Thread series: staking explainer", label: "Thread 2", clicks: 121, optIns: 8, created: "2026-09-01" },
  { slug: "staking-s3", campaignId: "cmp_staking", campaign: "Thread series: staking explainer", label: "Thread 3", clicks: 97, optIns: 6, created: "2026-09-01" },
  { slug: "staking-s4", campaignId: "cmp_staking", campaign: "Thread series: staking explainer", label: "Thread 4", clicks: 46, optIns: 4, created: "2026-09-01" },
];

export const runSteps = [
  { id: "VALIDATE_INPUTS", label: "Validate inputs", origin: "System", duration: "0.2s", sentence: "Validating campaign inputs…" },
  { id: "LOAD_PRIOR_CONTEXT", label: "Load prior context", origin: "H-MEM", duration: "0.4s", sentence: "Loading what earlier runs learned about this partner…" },
  { id: "FETCH_AGREEMENTS_AND_POST_EVIDENCE", label: "Fetch agreement & post evidence", origin: "Platform API", duration: "3.1s", sentence: "Checking 4 promised posts → retrieving from the platform…" },
  { id: "ENSURE_CHAIN_SYNC", label: "Ensure chain sync", origin: "Robinhood Chain RPC", duration: "5.8s", sentence: "Verified 2 posts → syncing the transaction window…" },
  { id: "QUERY_ZETARIS", label: "Federated query", origin: "Zetaris", duration: "1.9s", sentence: "Joining commitments, evidence and chain events…" },
  { id: "ASSESS_GAPS", label: "Assess gaps", origin: "System", duration: "0.3s", sentence: "1 deliverable still unresolved → looking for more sources…" },
  { id: "COMPUTE_METRICS", label: "Compute metrics", origin: "Domain engine", duration: "0.5s", sentence: "Computing fulfilment, swaps and retention separately…" },
  { id: "DRAFT_FINDINGS", label: "Draft findings", origin: "Fallback generator", duration: "0.2s", sentence: "Drafting findings from the evidence only…" },
  { id: "VALIDATE_LANGUAGE", label: "Validate evidence & language", origin: "Domain engine", duration: "0.1s", sentence: "Rejecting any claim the evidence cannot support…" },
  { id: "PERSIST", label: "Persist to World Model & H-MEM", origin: "Meterless", duration: "0.6s", sentence: "Saving provenance-linked state…" },
  { id: "BUILD_SCORECARD", label: "Build scorecard", origin: "System", duration: "0.2s", sentence: "Scorecard ready. Three lanes, kept separate." },
];

export const actionLabel: Record<SuggestedAction, { label: string; tone: "good" | "info" | "warn" | "bad" | "muted"; why: string }> = {
  renew: { label: "Renew", tone: "good", why: "Delivery verified and attribution supports continuing." },
  conditional_trial: { label: "Conditional trial", tone: "info", why: "Mostly delivered, with gaps. Continue on a smaller, tracked engagement." },
  request_evidence: { label: "Request evidence", tone: "warn", why: "A decision needs sources the partner can still supply." },
  do_not_renew: { label: "Do not renew", tone: "bad", why: "Contracted delivery was not met." },
  insufficient_data: { label: "Insufficient data", tone: "muted", why: "Not enough evidence to recommend either way." },
};

export const statusTone: Record<CampaignStatus, "good" | "info" | "warn" | "bad" | "muted"> = {
  DRAFT: "muted",
  ACTIVE: "info",
  IN_REVIEW: "warn",
  COMPLETED: "good",
  CANCELLED: "bad",
};

export function fmtMoney(m: CampaignCardDto["cost"]) {
  if (!m) return "Not set";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: m.currency, maximumFractionDigits: 0 }).format(Number(m.amount));
}

export function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

export function fmtUtc(iso: string | null) {
  if (!iso) return "Never";
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" })}, ${d.toISOString().slice(11, 16)} UTC`;
}
