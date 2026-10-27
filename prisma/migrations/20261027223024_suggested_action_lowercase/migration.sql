-- SuggestedAction enum values were initially created SCREAMING_SNAKE_CASE,
-- inconsistent with the PRD's own documented values (§8.4, §10.4
-- AgentDraftSchema) which packages/domain and packages/contracts already
-- use lowercase for. Renaming in place (safe: no existing rows depend on
-- these values in any deployed environment yet).
ALTER TYPE "SuggestedAction" RENAME VALUE 'RENEW' TO 'renew';
ALTER TYPE "SuggestedAction" RENAME VALUE 'CONDITIONAL_TRIAL' TO 'conditional_trial';
ALTER TYPE "SuggestedAction" RENAME VALUE 'REQUEST_EVIDENCE' TO 'request_evidence';
ALTER TYPE "SuggestedAction" RENAME VALUE 'DO_NOT_RENEW' TO 'do_not_renew';
ALTER TYPE "SuggestedAction" RENAME VALUE 'INSUFFICIENT_DATA' TO 'insufficient_data';
