import { z } from "zod";

/** Mirrors prisma/schema.prisma enums exactly. Keep in sync by hand — no
 * codegen wired up yet. If this drifts from the schema, the schema wins. */

export const WorkspaceRoleSchema = z.enum([
  "OWNER",
  "ADMIN",
  "ANALYST",
  "VIEWER",
  "PROMOTER_PORTAL",
]);
export const ProjectStatusSchema = z.enum(["ACTIVE", "ARCHIVED"]);
export const PartnerStatusSchema = z.enum([
  "CANDIDATE",
  "TRIAL",
  "ACTIVE",
  "PAUSED",
  "DO_NOT_RENEW",
  "ARCHIVED",
]);
export const CampaignGoalSchema = z.enum([
  "DELIVERY_AND_AWARENESS",
  "ACQUISITION",
  "RETENTION",
  "OTHER",
]);
export const CampaignStatusSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "IN_REVIEW",
  "COMPLETED",
  "CANCELLED",
]);
export const PaymentStatusSchema = z.enum([
  "AGREED",
  "INVOICE_RECEIVED",
  "PAID_USER_REPORTED",
  "DISPUTED",
  "CANCELLED",
]);
export const DeliverableKindSchema = z.enum([
  "POST",
  "THREAD",
  "REPLY",
  "VIDEO",
  "SPACE",
  "COMMUNITY_MENTION",
  "OTHER",
]);
export const DeliverableStatusSchema = z.enum([
  "PENDING",
  "VERIFIED_FULFILLED",
  "USER_CONFIRMED_FULFILLED",
  "UNRESOLVED",
  "LATE",
  "MISSED",
]);
export const EvidenceKindSchema = z.enum([
  "ONCHAIN_SWAP",
  "TOKEN_TRANSFER",
  "POST_URL",
  "API_POST",
  "IMAGE",
  "PDF",
  "TERMS",
  "MANUAL_NOTE",
  "TRACKED_CLICK",
  "SIGNED_WALLET",
]);
export const VerificationBasisSchema = z.enum([
  "ONCHAIN_CANONICAL",
  "PLATFORM_AUTHENTICATED",
  "HUMAN_CONFIRMED",
  "PARTNER_REPORTED",
  "MODEL_EXTRACTED",
  "UNVERIFIABLE",
]);
export const EvidenceStatusSchema = z.enum([
  "SUBMITTED",
  "RETRIEVED_FROM_SOURCE",
  "HUMAN_CONFIRMED",
  "UNVERIFIABLE",
  "CONTRADICTED",
  "WITHDRAWN",
]);
export const RunStatusSchema = z.enum([
  "CREATED",
  "VALIDATE_INPUTS",
  "LOAD_PRIOR_CONTEXT",
  "PLAN_INVESTIGATION",
  "FETCH_AGREEMENTS_AND_POST_EVIDENCE",
  "ENSURE_CHAIN_SYNC",
  "QUERY_ZETARIS",
  "ASSESS_GAPS",
  "FETCH_ADDITIONAL_SOURCE",
  "COMPUTE_METRICS",
  "DRAFT_FINDINGS_WITH_NEMOTRON",
  "APPLY_EVIDENCE_AND_LANGUAGE_VALIDATORS",
  "PERSIST_WORLD_MODEL_AND_HMEM",
  "BUILD_SCORECARD",
  "COMPLETE",
  "PARTIAL_COMPLETE",
  "FAILED",
  "CANCELLED",
]);
export const ClaimTypeSchema = z.enum([
  "DELIVERY",
  "MARKET_OBSERVATION",
  "ATTRIBUTED_ACQUISITION",
  "LIMITATION",
]);
export const FindingStatusSchema = z.enum([
  "SUPPORTED",
  "PARTIALLY_SUPPORTED",
  "UNRESOLVED",
  "CONTRADICTED",
]);
export const AttributionLanguageSchema = z.enum(["none", "observed_only", "tracked_verified"]);
export const CoverageStatusSchema = z.enum([
  "COMPLETE",
  "PARTIAL",
  "STALE",
  "UNAVAILABLE",
  "NOT_APPLICABLE",
]);
export const ReportStatusSchema = z.enum([
  "DRAFT",
  "NEEDS_REVIEW",
  "APPROVED",
  "DISPUTED",
  "SUPERSEDED",
]);
export const SuggestedActionSchema = z.enum([
  "renew",
  "conditional_trial",
  "request_evidence",
  "do_not_renew",
  "insufficient_data",
]);

export type WorkspaceRole = z.infer<typeof WorkspaceRoleSchema>;
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;
export type PartnerStatus = z.infer<typeof PartnerStatusSchema>;
export type CampaignGoal = z.infer<typeof CampaignGoalSchema>;
export type CampaignStatus = z.infer<typeof CampaignStatusSchema>;
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;
export type DeliverableKind = z.infer<typeof DeliverableKindSchema>;
export type DeliverableStatus = z.infer<typeof DeliverableStatusSchema>;
export type EvidenceKind = z.infer<typeof EvidenceKindSchema>;
export type VerificationBasis = z.infer<typeof VerificationBasisSchema>;
export type EvidenceStatus = z.infer<typeof EvidenceStatusSchema>;
export type RunStatus = z.infer<typeof RunStatusSchema>;
export type ClaimType = z.infer<typeof ClaimTypeSchema>;
export type FindingStatus = z.infer<typeof FindingStatusSchema>;
export type AttributionLanguage = z.infer<typeof AttributionLanguageSchema>;
export type CoverageStatus = z.infer<typeof CoverageStatusSchema>;
export type ReportStatus = z.infer<typeof ReportStatusSchema>;
export type SuggestedAction = z.infer<typeof SuggestedActionSchema>;
