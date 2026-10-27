import { z } from "zod";
import { CampaignGoalSchema, DeliverableKindSchema } from "./enums.js";
import { EvmAddressSchema, IsoDateTimeSchema, MoneySchema } from "./common.js";

// Mirrors the local Zetaris platform's own password policy (verified in
// ~/zetaris-platform/README.md): >=8 chars, lower+upper+digit+one of
// $ @ ! % * ? & — a reasonable standard, not arbitrary.
const PASSWORD_SCHEMA = z
  .string()
  .min(8, "at least 8 characters")
  .regex(/[a-z]/, "needs a lowercase letter")
  .regex(/[A-Z]/, "needs an uppercase letter")
  .regex(/[0-9]/, "needs a digit")
  .regex(/[$@!%*?&]/, "needs one of $ @ ! % * ? &");

export const SignupRequestSchema = z.object({
  email: z.string().email(),
  password: PASSWORD_SCHEMA,
  name: z.string().min(1).max(200).optional(),
});
export type SignupRequest = z.infer<typeof SignupRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RequestPasswordResetRequestSchema = z.object({
  email: z.string().email(),
});
export type RequestPasswordResetRequest = z.infer<typeof RequestPasswordResetRequestSchema>;

export const ConfirmPasswordResetRequestSchema = z.object({
  token: z.string().min(1),
  newPassword: PASSWORD_SCHEMA,
});
export type ConfirmPasswordResetRequest = z.infer<typeof ConfirmPasswordResetRequestSchema>;

export const CreateWorkspaceRequestSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, hyphens only"),
});
export type CreateWorkspaceRequest = z.infer<typeof CreateWorkspaceRequestSchema>;

export const CreateProjectRequestSchema = z.object({
  name: z.string().min(1).max(200),
  chainId: z.number().int().positive(),
  tokenAddress: EvmAddressSchema,
  platform: z.string().min(1).max(60),
});
export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>;

export const CreatePartnerRequestSchema = z.object({
  displayName: z.string().min(1).max(200),
  handle: z.string().max(100).optional(),
  profileUrl: z.string().url().optional(),
});
export type CreatePartnerRequest = z.infer<typeof CreatePartnerRequestSchema>;

export const CreateDeliverableRequestSchema = z.object({
  kind: DeliverableKindSchema,
  channel: z.string().min(1).max(60),
  quantity: z.number().int().min(1).default(1),
  dueAt: IsoDateTimeSchema.optional(),
});
export type CreateDeliverableRequest = z.infer<typeof CreateDeliverableRequestSchema>;

/** PRD §14.3 example request shape. */
export const CreateCampaignRequestSchema = z.object({
  projectId: z.string(),
  partnerId: z.string(),
  title: z.string().min(1).max(200),
  startAt: IsoDateTimeSchema,
  endAt: IsoDateTimeSchema,
  goal: CampaignGoalSchema,
  agreedFee: MoneySchema.optional(),
  deliverables: z.array(CreateDeliverableRequestSchema).min(1),
});
export type CreateCampaignRequest = z.infer<typeof CreateCampaignRequestSchema>;

export const StartInvestigationRequestSchema = z.object({
  refreshSources: z.boolean().default(false),
});
export type StartInvestigationRequest = z.infer<typeof StartInvestigationRequestSchema>;

export const ReviewReportRequestSchema = z.object({
  reviewedAction: z.enum([
    "renew",
    "conditional_trial",
    "request_evidence",
    "do_not_renew",
    "insufficient_data",
  ]),
  reason: z.string().min(1).max(1000),
  expectedVersion: z.number().int(),
});
export type ReviewReportRequest = z.infer<typeof ReviewReportRequestSchema>;
