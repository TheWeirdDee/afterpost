-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'ANALYST', 'VIEWER', 'PROMOTER_PORTAL');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('CANDIDATE', 'TRIAL', 'ACTIVE', 'PAUSED', 'DO_NOT_RENEW', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContactVisibility" AS ENUM ('PRIVATE', 'WORKSPACE');

-- CreateEnum
CREATE TYPE "CampaignGoal" AS ENUM ('DELIVERY_AND_AWARENESS', 'ACQUISITION', 'RETENTION', 'OTHER');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'IN_REVIEW', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('AGREED', 'INVOICE_RECEIVED', 'PAID_USER_REPORTED', 'DISPUTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeliverableKind" AS ENUM ('POST', 'THREAD', 'REPLY', 'VIDEO', 'SPACE', 'COMMUNITY_MENTION', 'OTHER');

-- CreateEnum
CREATE TYPE "DeliverableStatus" AS ENUM ('PENDING', 'VERIFIED_FULFILLED', 'USER_CONFIRMED_FULFILLED', 'UNRESOLVED', 'LATE', 'MISSED');

-- CreateEnum
CREATE TYPE "EvidenceRelation" AS ENUM ('SUPPORTS', 'CONTRADICTS', 'CONTEXT_ONLY');

-- CreateEnum
CREATE TYPE "VerificationBasis" AS ENUM ('ONCHAIN_CANONICAL', 'PLATFORM_AUTHENTICATED', 'HUMAN_CONFIRMED', 'PARTNER_REPORTED', 'MODEL_EXTRACTED', 'UNVERIFIABLE');

-- CreateEnum
CREATE TYPE "EvidenceKind" AS ENUM ('ONCHAIN_SWAP', 'TOKEN_TRANSFER', 'POST_URL', 'API_POST', 'IMAGE', 'PDF', 'TERMS', 'MANUAL_NOTE', 'TRACKED_CLICK', 'SIGNED_WALLET');

-- CreateEnum
CREATE TYPE "SourceMethod" AS ENUM ('RPC', 'PLATFORM_API', 'UPLOAD', 'MANUAL', 'SIGNED_OPT_IN');

-- CreateEnum
CREATE TYPE "CollectionStatus" AS ENUM ('RAW', 'PARSED', 'FAILED', 'STALE');

-- CreateEnum
CREATE TYPE "EvidenceStatus" AS ENUM ('SUBMITTED', 'RETRIEVED_FROM_SOURCE', 'HUMAN_CONFIRMED', 'UNVERIFIABLE', 'CONTRADICTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ValidatorStatus" AS ENUM ('PENDING', 'VALID', 'INVALID', 'CORRECTED');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('OK', 'LAGGING', 'FAILED');

-- CreateEnum
CREATE TYPE "SwapSide" AS ENUM ('BUY', 'SELL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "WalletLabelType" AS ENUM ('POOL', 'ROUTER', 'LOCKER', 'BURN', 'TOKEN_CONTRACT', 'CREATOR_KNOWN', 'TREASURY_KNOWN', 'EXCHANGE_KNOWN', 'UNCLASSIFIED');

-- CreateEnum
CREATE TYPE "SourceHealthStatus" AS ENUM ('COMPLETE', 'PARTIAL', 'STALE', 'UNAVAILABLE', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "TrackingLinkStatus" AS ENUM ('ACTIVE', 'PAUSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ConversionStatus" AS ENUM ('VERIFIED_BUY', 'UNRESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('CREATED', 'VALIDATE_INPUTS', 'LOAD_PRIOR_CONTEXT', 'PLAN_INVESTIGATION', 'FETCH_AGREEMENTS_AND_POST_EVIDENCE', 'ENSURE_CHAIN_SYNC', 'QUERY_ZETARIS', 'ASSESS_GAPS', 'FETCH_ADDITIONAL_SOURCE', 'COMPUTE_METRICS', 'DRAFT_FINDINGS_WITH_NEMOTRON', 'APPLY_EVIDENCE_AND_LANGUAGE_VALIDATORS', 'PERSIST_WORLD_MODEL_AND_HMEM', 'BUILD_SCORECARD', 'COMPLETE', 'PARTIAL_COMPLETE', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StepState" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CoverageStatus" AS ENUM ('COMPLETE', 'PARTIAL', 'STALE', 'UNAVAILABLE', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "ClaimType" AS ENUM ('DELIVERY', 'MARKET_OBSERVATION', 'ATTRIBUTED_ACQUISITION', 'LIMITATION');

-- CreateEnum
CREATE TYPE "FindingStatus" AS ENUM ('SUPPORTED', 'PARTIALLY_SUPPORTED', 'UNRESOLVED', 'CONTRADICTED');

-- CreateEnum
CREATE TYPE "FindingOrigin" AS ENUM ('AGENT', 'HUMAN', 'RULE');

-- CreateEnum
CREATE TYPE "AttributionLanguage" AS ENUM ('NONE', 'OBSERVED_ONLY', 'TRACKED_VERIFIED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'NEEDS_REVIEW', 'APPROVED', 'DISPUTED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "SuggestedAction" AS ENUM ('RENEW', 'CONDITIONAL_TRIAL', 'REQUEST_EVIDENCE', 'DO_NOT_RENEW', 'INSUFFICIENT_DATA');

-- CreateEnum
CREATE TYPE "MemoryTier" AS ENUM ('SHORT_TERM', 'WORKING', 'LONG_TERM');

-- CreateEnum
CREATE TYPE "TrustLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'VERIFIED');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "IntegrationHealthStatus" AS ENUM ('UNCONFIGURED', 'HEALTHY', 'DEGRADED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar_url" TEXT,
    "email_verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "token_metadata_json" JSONB,

    CONSTRAINT "auth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "retention_policy_days" INTEGER NOT NULL DEFAULT 365,
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_members" (
    "workspace_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("workspace_id","user_id")
);

-- CreateTable
CREATE TABLE "workspace_invites" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "redeemed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "primary_token_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "project_id" TEXT,
    "chain_id" INTEGER NOT NULL,
    "contract_address" TEXT NOT NULL,
    "checksum_address" TEXT NOT NULL,
    "symbol" TEXT,
    "name" TEXT,
    "decimals" INTEGER,
    "total_supply_raw" TEXT,
    "platform" TEXT,
    "factory_address" TEXT,
    "platform_version" TEXT,
    "launch_block" TEXT,
    "metadata_verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pools" (
    "id" TEXT NOT NULL,
    "token_id" TEXT NOT NULL,
    "chain_id" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "token0" TEXT NOT NULL,
    "token1" TEXT NOT NULL,
    "fee_tier" INTEGER,
    "discovered_block" TEXT,
    "verified_at" TIMESTAMPTZ,

    CONSTRAINT "pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partners" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "handle" TEXT,
    "profile_url" TEXT,
    "aliases_json" JSONB NOT NULL DEFAULT '[]',
    "status" "PartnerStatus" NOT NULL DEFAULT 'CANDIDATE',
    "notes_encrypted" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_contacts" (
    "id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value_encrypted" TEXT NOT NULL,
    "visibility" "ContactVisibility" NOT NULL DEFAULT 'PRIVATE',

    CONSTRAINT "partner_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "token_id" TEXT,
    "title" TEXT NOT NULL,
    "goal" "CampaignGoal" NOT NULL DEFAULT 'OTHER',
    "start_at" TIMESTAMPTZ NOT NULL,
    "end_at" TIMESTAMPTZ NOT NULL,
    "review_at" TIMESTAMPTZ,
    "reporting_timezone" TEXT NOT NULL DEFAULT 'UTC',
    "cost_amount" DECIMAL(18,2),
    "cost_currency" TEXT,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'AGREED',
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "terms_version" INTEGER NOT NULL DEFAULT 0,
    "current_policy_version" TEXT NOT NULL DEFAULT 'v1',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_terms_versions" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "confirmed_by" TEXT,
    "confirmed_at" TIMESTAMPTZ,
    "raw_evidence_id" TEXT,
    "structured_terms_json" JSONB NOT NULL,
    "sha256" TEXT NOT NULL,

    CONSTRAINT "campaign_terms_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverables" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "kind" "DeliverableKind" NOT NULL,
    "channel" TEXT NOT NULL,
    "required_quantity" INTEGER NOT NULL DEFAULT 1,
    "due_at" TIMESTAMPTZ,
    "requirements_json" JSONB NOT NULL DEFAULT '{}',
    "status" "DeliverableStatus" NOT NULL DEFAULT 'PENDING',
    "terms_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deliverables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverable_evidence_links" (
    "id" TEXT NOT NULL,
    "deliverable_id" TEXT NOT NULL,
    "evidence_id" TEXT NOT NULL,
    "relation" "EvidenceRelation" NOT NULL,
    "verification_basis" "VerificationBasis" NOT NULL,
    "actor_id" TEXT,
    "verified_at" TIMESTAMPTZ,

    CONSTRAINT "deliverable_evidence_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "kind" "EvidenceKind" NOT NULL,
    "source_method" "SourceMethod" NOT NULL,
    "source_ref" TEXT NOT NULL,
    "object_key" TEXT,
    "sha256" TEXT,
    "submitted_by" TEXT,
    "observed_at" TIMESTAMPTZ,
    "ingested_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_at" TIMESTAMPTZ,
    "verification_basis" "VerificationBasis" NOT NULL,
    "collection_status" "CollectionStatus" NOT NULL DEFAULT 'RAW',
    "status" "EvidenceStatus" NOT NULL DEFAULT 'SUBMITTED',
    "is_authenticity_established" BOOLEAN NOT NULL DEFAULT false,
    "source_metadata_json" JSONB NOT NULL DEFAULT '{}',
    "derived_from_evidence_ids_json" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_extractions" (
    "id" TEXT NOT NULL,
    "evidence_id" TEXT NOT NULL,
    "model_provider" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "prompt_version" TEXT NOT NULL,
    "extraction_json" JSONB NOT NULL,
    "validator_status" "ValidatorStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_extractions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_observations" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "verification_basis" "VerificationBasis" NOT NULL,
    "evidence_id" TEXT,

    CONSTRAINT "payment_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chain_blocks" (
    "chainId" INTEGER NOT NULL,
    "block_number" TEXT NOT NULL,
    "block_hash" TEXT NOT NULL,
    "parent_hash" TEXT NOT NULL,
    "block_time" TIMESTAMPTZ NOT NULL,
    "canonical" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "chain_sync_cursors" (
    "chainId" INTEGER NOT NULL,
    "contract_address" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "last_scanned_block" TEXT NOT NULL,
    "latest_safe_block" TEXT,
    "last_success_at" TIMESTAMPTZ,
    "status" "SyncStatus" NOT NULL DEFAULT 'OK',
    "failure_count" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "raw_chain_events" (
    "id" TEXT NOT NULL,
    "chain_id" INTEGER NOT NULL,
    "contract_address" TEXT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "log_index" INTEGER NOT NULL,
    "block_number" TEXT NOT NULL,
    "block_hash" TEXT NOT NULL,
    "topic0" TEXT NOT NULL,
    "topics_json" JSONB NOT NULL,
    "data_hex" TEXT NOT NULL,
    "canonical" BOOLEAN NOT NULL DEFAULT true,
    "first_seen_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_chain_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "swap_observations" (
    "id" TEXT NOT NULL,
    "raw_event_id" TEXT NOT NULL,
    "pool_id" TEXT NOT NULL,
    "project_id" TEXT,
    "block_time" TIMESTAMPTZ NOT NULL,
    "side" "SwapSide" NOT NULL,
    "amount0_raw" TEXT NOT NULL,
    "amount1_raw" TEXT NOT NULL,
    "weth_amount_raw" TEXT NOT NULL,
    "sqrt_price_x96" TEXT,
    "normalizer_version" TEXT NOT NULL,

    CONSTRAINT "swap_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_observations" (
    "id" TEXT NOT NULL,
    "raw_event_id" TEXT NOT NULL,
    "token_id" TEXT NOT NULL,
    "from_address" TEXT NOT NULL,
    "to_address" TEXT NOT NULL,
    "amount_raw" TEXT NOT NULL,
    "block_time" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "transfer_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_labels" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "chain_id" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "label" "WalletLabelType" NOT NULL,
    "reason" TEXT,
    "source_evidence_id" TEXT,
    "added_by" TEXT,
    "active_from" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "balance_snapshots" (
    "id" TEXT NOT NULL,
    "token_id" TEXT NOT NULL,
    "block_number" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "balance_raw" TEXT NOT NULL,
    "method_version" TEXT NOT NULL,

    CONSTRAINT "balance_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_health" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "scope_id" TEXT NOT NULL,
    "last_success_at" TIMESTAMPTZ,
    "data_as_of" TIMESTAMPTZ,
    "status" "SourceHealthStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
    "coverage_json" JSONB NOT NULL DEFAULT '{}',
    "last_error_code" TEXT,

    CONSTRAINT "source_health_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_quotes" (
    "id" TEXT NOT NULL,
    "asset_pair" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "quote_time" TIMESTAMPTZ NOT NULL,
    "price_numeric" DECIMAL(30,10) NOT NULL,
    "retrieved_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_links" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "partner_id" TEXT,
    "slug" TEXT NOT NULL,
    "destination_url" TEXT NOT NULL,
    "status" "TrackingLinkStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ,

    CONSTRAINT "tracking_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_clicks" (
    "id" TEXT NOT NULL,
    "tracking_link_id" TEXT NOT NULL,
    "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anonymous_session_id_hash" TEXT NOT NULL,
    "referrer_class" TEXT,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "is_suspected_bot" BOOLEAN NOT NULL DEFAULT false,
    "consent_basis" TEXT,

    CONSTRAINT "tracking_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_association_challenges" (
    "id" TEXT NOT NULL,
    "tracking_link_id" TEXT NOT NULL,
    "nonce_hash" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "message_text_hash" TEXT NOT NULL,
    "chain_id" INTEGER NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ,

    CONSTRAINT "wallet_association_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_campaign_associations" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "tracking_link_id" TEXT NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "signature_hash" TEXT NOT NULL,
    "signed_at" TIMESTAMPTZ NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "consent_version" TEXT NOT NULL,

    CONSTRAINT "wallet_campaign_associations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qualifying_conversions" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "chain_id" INTEGER NOT NULL,
    "token_id" TEXT NOT NULL,
    "weth_amount_raw" TEXT NOT NULL,
    "qualification_version" TEXT NOT NULL,
    "evidence_event_ids_json" JSONB NOT NULL DEFAULT '[]',
    "status" "ConversionStatus" NOT NULL DEFAULT 'UNRESOLVED',
    "attribution_policy_version" TEXT NOT NULL,

    CONSTRAINT "qualifying_conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investigation_runs" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "status" "RunStatus" NOT NULL DEFAULT 'CREATED',
    "requested_by" TEXT,
    "started_at" TIMESTAMPTZ,
    "finished_at" TIMESTAMPTZ,
    "data_snapshot_hash" TEXT,
    "policy_version" TEXT NOT NULL,
    "model_id" TEXT,
    "zetaris_query_refs_json" JSONB NOT NULL DEFAULT '[]',
    "error_code" TEXT,
    "attempt_no" INTEGER NOT NULL DEFAULT 1,
    "idempotency_key" TEXT NOT NULL,

    CONSTRAINT "investigation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investigation_steps" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "step_type" TEXT NOT NULL,
    "tool_name" TEXT,
    "state" "StepState" NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMPTZ,
    "finished_at" TIMESTAMPTZ,
    "provider_request_id" TEXT,
    "redacted_input_json" JSONB NOT NULL DEFAULT '{}',
    "output_ref_json" JSONB NOT NULL DEFAULT '{}',
    "error_code" TEXT,

    CONSTRAINT "investigation_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metrics" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value_numeric" DECIMAL(38,10),
    "value_text" TEXT,
    "unit" TEXT,
    "numerator" DECIMAL(38,10),
    "denominator" DECIMAL(38,10),
    "window_start" TIMESTAMPTZ,
    "window_end" TIMESTAMPTZ,
    "data_as_of" TIMESTAMPTZ NOT NULL,
    "coverage_status" "CoverageStatus" NOT NULL,
    "method_version" TEXT NOT NULL,
    "source_refs_json" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "findings" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "claim_type" "ClaimType" NOT NULL,
    "text" TEXT NOT NULL,
    "status" "FindingStatus" NOT NULL,
    "origin" "FindingOrigin" NOT NULL,
    "attribution_language" "AttributionLanguage" NOT NULL,
    "current_revision_id" TEXT,

    CONSTRAINT "findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finding_revisions" (
    "id" TEXT NOT NULL,
    "finding_id" TEXT NOT NULL,
    "supersedes_revision_id" TEXT,
    "text" TEXT NOT NULL,
    "reason" TEXT,
    "author_type" TEXT NOT NULL,
    "author_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finding_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finding_evidence" (
    "finding_id" TEXT NOT NULL,
    "evidence_id" TEXT NOT NULL,
    "relation" "EvidenceRelation" NOT NULL,

    CONSTRAINT "finding_evidence_pkey" PRIMARY KEY ("finding_id","evidence_id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "suggested_action" "SuggestedAction" NOT NULL,
    "reviewed_action" "SuggestedAction",
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMPTZ,
    "policy_version" TEXT NOT NULL,
    "data_as_of" TIMESTAMPTZ NOT NULL,
    "limitations_json" JSONB NOT NULL DEFAULT '[]',
    "snapshot_json" JSONB NOT NULL,
    "supersedes_report_id" TEXT,
    "sha256" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_exports" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "world_model_events" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "entity_key" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL,
    "source_ref" TEXT,
    "supersedes_event_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "world_model_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_records" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "subject_key" TEXT NOT NULL,
    "tier" "MemoryTier" NOT NULL,
    "summary" TEXT NOT NULL,
    "source_refs_json" JSONB NOT NULL DEFAULT '[]',
    "derived_from_ids_json" JSONB NOT NULL DEFAULT '[]',
    "trust_level" "TrustLevel" NOT NULL,
    "supersedes_id" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memory_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "actor_type" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "before_hash" TEXT,
    "after_hash" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL DEFAULT '{}',
    "delivery_status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMPTZ,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_connections" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "config_ref" TEXT,
    "health_status" "IntegrationHealthStatus" NOT NULL DEFAULT 'UNCONFIGURED',
    "last_verified_at" TIMESTAMPTZ,
    "last_failure_at" TIMESTAMPTZ,

    CONSTRAINT "integration_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "auth_accounts_provider_provider_account_id_key" ON "auth_accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_slug_key" ON "workspaces"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_invites_token_hash_key" ON "workspace_invites"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "projects_primary_token_id_key" ON "projects"("primary_token_id");

-- CreateIndex
CREATE INDEX "projects_workspace_id_status_idx" ON "projects"("workspace_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_workspace_id_chain_id_contract_address_key" ON "tokens"("workspace_id", "chain_id", "contract_address");

-- CreateIndex
CREATE UNIQUE INDEX "pools_chain_id_address_key" ON "pools"("chain_id", "address");

-- CreateIndex
CREATE INDEX "partners_workspace_id_handle_idx" ON "partners"("workspace_id", "handle");

-- CreateIndex
CREATE INDEX "partner_contacts_partner_id_idx" ON "partner_contacts"("partner_id");

-- CreateIndex
CREATE INDEX "campaigns_workspace_id_project_id_idx" ON "campaigns"("workspace_id", "project_id");

-- CreateIndex
CREATE INDEX "campaigns_workspace_id_partner_id_start_at_idx" ON "campaigns"("workspace_id", "partner_id", "start_at");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_terms_versions_campaign_id_version_key" ON "campaign_terms_versions"("campaign_id", "version");

-- CreateIndex
CREATE INDEX "deliverables_campaign_id_due_at_idx" ON "deliverables"("campaign_id", "due_at");

-- CreateIndex
CREATE INDEX "deliverable_evidence_links_deliverable_id_idx" ON "deliverable_evidence_links"("deliverable_id");

-- CreateIndex
CREATE INDEX "deliverable_evidence_links_evidence_id_idx" ON "deliverable_evidence_links"("evidence_id");

-- CreateIndex
CREATE INDEX "evidence_workspace_id_campaign_id_idx" ON "evidence"("workspace_id", "campaign_id");

-- CreateIndex
CREATE INDEX "evidence_sha256_idx" ON "evidence"("sha256");

-- CreateIndex
CREATE INDEX "evidence_source_ref_idx" ON "evidence"("source_ref");

-- CreateIndex
CREATE INDEX "evidence_extractions_evidence_id_created_at_idx" ON "evidence_extractions"("evidence_id", "created_at");

-- CreateIndex
CREATE INDEX "payment_observations_campaign_id_idx" ON "payment_observations"("campaign_id");

-- CreateIndex
CREATE INDEX "chain_blocks_chainId_block_number_idx" ON "chain_blocks"("chainId", "block_number");

-- CreateIndex
CREATE UNIQUE INDEX "chain_blocks_chainId_block_hash_key" ON "chain_blocks"("chainId", "block_hash");

-- CreateIndex
CREATE UNIQUE INDEX "chain_sync_cursors_chainId_contract_address_event_type_key" ON "chain_sync_cursors"("chainId", "contract_address", "event_type");

-- CreateIndex
CREATE INDEX "raw_chain_events_contract_address_block_number_idx" ON "raw_chain_events"("contract_address", "block_number");

-- CreateIndex
CREATE UNIQUE INDEX "raw_chain_events_chain_id_tx_hash_log_index_block_hash_key" ON "raw_chain_events"("chain_id", "tx_hash", "log_index", "block_hash");

-- CreateIndex
CREATE UNIQUE INDEX "swap_observations_raw_event_id_key" ON "swap_observations"("raw_event_id");

-- CreateIndex
CREATE INDEX "swap_observations_project_id_block_time_idx" ON "swap_observations"("project_id", "block_time");

-- CreateIndex
CREATE UNIQUE INDEX "transfer_observations_raw_event_id_key" ON "transfer_observations"("raw_event_id");

-- CreateIndex
CREATE INDEX "transfer_observations_token_id_from_address_idx" ON "transfer_observations"("token_id", "from_address");

-- CreateIndex
CREATE INDEX "transfer_observations_token_id_to_address_idx" ON "transfer_observations"("token_id", "to_address");

-- CreateIndex
CREATE INDEX "wallet_labels_workspace_id_chain_id_address_idx" ON "wallet_labels"("workspace_id", "chain_id", "address");

-- CreateIndex
CREATE UNIQUE INDEX "balance_snapshots_token_id_block_number_address_method_vers_key" ON "balance_snapshots"("token_id", "block_number", "address", "method_version");

-- CreateIndex
CREATE INDEX "source_health_workspace_id_scope_id_source_type_idx" ON "source_health"("workspace_id", "scope_id", "source_type");

-- CreateIndex
CREATE INDEX "price_quotes_asset_pair_source_quote_time_idx" ON "price_quotes"("asset_pair", "source", "quote_time");

-- CreateIndex
CREATE UNIQUE INDEX "tracking_links_slug_key" ON "tracking_links"("slug");

-- CreateIndex
CREATE INDEX "tracking_links_campaign_id_idx" ON "tracking_links"("campaign_id");

-- CreateIndex
CREATE INDEX "tracking_clicks_tracking_link_id_occurred_at_idx" ON "tracking_clicks"("tracking_link_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_association_challenges_nonce_hash_key" ON "wallet_association_challenges"("nonce_hash");

-- CreateIndex
CREATE INDEX "wallet_campaign_associations_campaign_id_wallet_address_sig_idx" ON "wallet_campaign_associations"("campaign_id", "wallet_address", "signed_at");

-- CreateIndex
CREATE INDEX "qualifying_conversions_wallet_address_idx" ON "qualifying_conversions"("wallet_address");

-- CreateIndex
CREATE UNIQUE INDEX "qualifying_conversions_campaign_id_tx_hash_wallet_address_a_key" ON "qualifying_conversions"("campaign_id", "tx_hash", "wallet_address", "attribution_policy_version");

-- CreateIndex
CREATE UNIQUE INDEX "investigation_runs_idempotency_key_key" ON "investigation_runs"("idempotency_key");

-- CreateIndex
CREATE INDEX "investigation_runs_workspace_id_campaign_id_started_at_idx" ON "investigation_runs"("workspace_id", "campaign_id", "started_at");

-- CreateIndex
CREATE UNIQUE INDEX "investigation_steps_run_id_sequence_key" ON "investigation_steps"("run_id", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "metrics_run_id_key_window_start_window_end_key" ON "metrics"("run_id", "key", "window_start", "window_end");

-- CreateIndex
CREATE INDEX "findings_run_id_claim_type_status_idx" ON "findings"("run_id", "claim_type", "status");

-- CreateIndex
CREATE INDEX "finding_revisions_finding_id_created_at_idx" ON "finding_revisions"("finding_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "reports_campaign_id_version_key" ON "reports"("campaign_id", "version");

-- CreateIndex
CREATE INDEX "report_exports_report_id_format_idx" ON "report_exports"("report_id", "format");

-- CreateIndex
CREATE INDEX "world_model_events_workspace_id_entity_key_created_at_idx" ON "world_model_events"("workspace_id", "entity_key", "created_at");

-- CreateIndex
CREATE INDEX "memory_records_workspace_id_subject_key_tier_idx" ON "memory_records"("workspace_id", "subject_key", "tier");

-- CreateIndex
CREATE INDEX "audit_events_workspace_id_created_at_idx" ON "audit_events"("workspace_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE UNIQUE INDEX "integration_connections_workspace_id_provider_key" ON "integration_connections"("workspace_id", "provider");

-- AddForeignKey
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_invites" ADD CONSTRAINT "workspace_invites_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_primary_token_id_fkey" FOREIGN KEY ("primary_token_id") REFERENCES "tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pools" ADD CONSTRAINT "pools_token_id_fkey" FOREIGN KEY ("token_id") REFERENCES "tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partners" ADD CONSTRAINT "partners_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_contacts" ADD CONSTRAINT "partner_contacts_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_token_id_fkey" FOREIGN KEY ("token_id") REFERENCES "tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_terms_versions" ADD CONSTRAINT "campaign_terms_versions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_evidence_links" ADD CONSTRAINT "deliverable_evidence_links_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "deliverables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_evidence_links" ADD CONSTRAINT "deliverable_evidence_links_evidence_id_fkey" FOREIGN KEY ("evidence_id") REFERENCES "evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_extractions" ADD CONSTRAINT "evidence_extractions_evidence_id_fkey" FOREIGN KEY ("evidence_id") REFERENCES "evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_observations" ADD CONSTRAINT "payment_observations_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_observations" ADD CONSTRAINT "payment_observations_evidence_id_fkey" FOREIGN KEY ("evidence_id") REFERENCES "evidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swap_observations" ADD CONSTRAINT "swap_observations_raw_event_id_fkey" FOREIGN KEY ("raw_event_id") REFERENCES "raw_chain_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swap_observations" ADD CONSTRAINT "swap_observations_pool_id_fkey" FOREIGN KEY ("pool_id") REFERENCES "pools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_observations" ADD CONSTRAINT "transfer_observations_raw_event_id_fkey" FOREIGN KEY ("raw_event_id") REFERENCES "raw_chain_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_observations" ADD CONSTRAINT "transfer_observations_token_id_fkey" FOREIGN KEY ("token_id") REFERENCES "tokens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_labels" ADD CONSTRAINT "wallet_labels_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balance_snapshots" ADD CONSTRAINT "balance_snapshots_token_id_fkey" FOREIGN KEY ("token_id") REFERENCES "tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_health" ADD CONSTRAINT "source_health_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_links" ADD CONSTRAINT "tracking_links_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_links" ADD CONSTRAINT "tracking_links_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_links" ADD CONSTRAINT "tracking_links_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_clicks" ADD CONSTRAINT "tracking_clicks_tracking_link_id_fkey" FOREIGN KEY ("tracking_link_id") REFERENCES "tracking_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_association_challenges" ADD CONSTRAINT "wallet_association_challenges_tracking_link_id_fkey" FOREIGN KEY ("tracking_link_id") REFERENCES "tracking_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_campaign_associations" ADD CONSTRAINT "wallet_campaign_associations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_campaign_associations" ADD CONSTRAINT "wallet_campaign_associations_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_campaign_associations" ADD CONSTRAINT "wallet_campaign_associations_tracking_link_id_fkey" FOREIGN KEY ("tracking_link_id") REFERENCES "tracking_links"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qualifying_conversions" ADD CONSTRAINT "qualifying_conversions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qualifying_conversions" ADD CONSTRAINT "qualifying_conversions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigation_runs" ADD CONSTRAINT "investigation_runs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigation_runs" ADD CONSTRAINT "investigation_runs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigation_steps" ADD CONSTRAINT "investigation_steps_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "investigation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "investigation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "investigation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finding_revisions" ADD CONSTRAINT "finding_revisions_finding_id_fkey" FOREIGN KEY ("finding_id") REFERENCES "findings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finding_evidence" ADD CONSTRAINT "finding_evidence_finding_id_fkey" FOREIGN KEY ("finding_id") REFERENCES "findings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finding_evidence" ADD CONSTRAINT "finding_evidence_evidence_id_fkey" FOREIGN KEY ("evidence_id") REFERENCES "evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "investigation_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "world_model_events" ADD CONSTRAINT "world_model_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_records" ADD CONSTRAINT "memory_records_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_connections" ADD CONSTRAINT "integration_connections_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
