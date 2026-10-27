import { z } from "zod";
import {
  CampaignGoalSchema,
  CampaignStatusSchema,
  ClaimTypeSchema,
  CoverageStatusSchema,
  DeliverableKindSchema,
  DeliverableStatusSchema,
  EvidenceKindSchema,
  EvidenceStatusSchema,
  FindingStatusSchema,
  PartnerStatusSchema,
  PaymentStatusSchema,
  ProjectStatusSchema,
  ReportStatusSchema,
  RunStatusSchema,
  SuggestedActionSchema,
  VerificationBasisSchema,
} from "./enums.js";
import { EvmAddressSchema, IsoDateTimeSchema, MoneySchema } from "./common.js";

export const WorkspaceDtoSchema = z.object({
  id: z.string(),
  slug: z.string(),
  displayName: z.string(),
  timezone: z.string(),
  createdAt: IsoDateTimeSchema,
});
export type WorkspaceDto = z.infer<typeof WorkspaceDtoSchema>;

export const TokenDtoSchema = z.object({
  id: z.string(),
  chainId: z.number().int(),
  contractAddress: EvmAddressSchema,
  checksumAddress: z.string(),
  symbol: z.string().nullable(),
  name: z.string().nullable(),
  decimals: z.number().int().nullable(),
  platform: z.string().nullable(),
  metadataVerifiedAt: IsoDateTimeSchema.nullable(),
});
export type TokenDto = z.infer<typeof TokenDtoSchema>;

export const ProjectDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: ProjectStatusSchema,
  primaryToken: TokenDtoSchema.nullable(),
  createdAt: IsoDateTimeSchema,
});
export type ProjectDto = z.infer<typeof ProjectDtoSchema>;

export const PartnerDtoSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  handle: z.string().nullable(),
  profileUrl: z.string().url().nullable(),
  status: PartnerStatusSchema,
});
export type PartnerDto = z.infer<typeof PartnerDtoSchema>;

export const DeliverableDtoSchema = z.object({
  id: z.string(),
  kind: DeliverableKindSchema,
  channel: z.string(),
  requiredQuantity: z.number().int().min(1),
  dueAt: IsoDateTimeSchema.nullable(),
  status: DeliverableStatusSchema,
});
export type DeliverableDto = z.infer<typeof DeliverableDtoSchema>;

export const CampaignCardDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: CampaignStatusSchema,
  goal: CampaignGoalSchema,
  partnerName: z.string(),
  projectName: z.string(),
  startAt: IsoDateTimeSchema,
  endAt: IsoDateTimeSchema,
  cost: MoneySchema.nullable(),
  paymentStatus: PaymentStatusSchema,
  lastEvaluatedAt: IsoDateTimeSchema.nullable(),
  suggestedAction: SuggestedActionSchema.nullable(),
});
export type CampaignCardDto = z.infer<typeof CampaignCardDtoSchema>;

export const CampaignDetailDtoSchema = CampaignCardDtoSchema.extend({
  deliverables: z.array(DeliverableDtoSchema),
});
export type CampaignDetailDto = z.infer<typeof CampaignDetailDtoSchema>;

export const EvidenceDtoSchema = z.object({
  id: z.string(),
  kind: EvidenceKindSchema,
  sourceRef: z.string(),
  verificationBasis: VerificationBasisSchema,
  status: EvidenceStatusSchema,
  observedAt: IsoDateTimeSchema.nullable(),
  ingestedAt: IsoDateTimeSchema,
});
export type EvidenceDto = z.infer<typeof EvidenceDtoSchema>;

export const FindingDtoSchema = z.object({
  id: z.string(),
  claimType: ClaimTypeSchema,
  text: z.string().max(500),
  status: FindingStatusSchema,
  evidenceIds: z.array(z.string()),
});
export type FindingDto = z.infer<typeof FindingDtoSchema>;

export const InvestigationRunDtoSchema = z.object({
  id: z.string(),
  status: RunStatusSchema,
  startedAt: IsoDateTimeSchema.nullable(),
  finishedAt: IsoDateTimeSchema.nullable(),
});
export type InvestigationRunDto = z.infer<typeof InvestigationRunDtoSchema>;

export const ReportDtoSchema = z.object({
  id: z.string(),
  version: z.number().int(),
  status: ReportStatusSchema,
  suggestedAction: SuggestedActionSchema,
  dataAsOf: IsoDateTimeSchema,
  limitations: z.array(z.string()),
});
export type ReportDto = z.infer<typeof ReportDtoSchema>;

export { CoverageStatusSchema };
