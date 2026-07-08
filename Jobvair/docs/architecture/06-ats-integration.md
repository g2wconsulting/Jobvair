# ATS Integration Specification

## Purpose

Jobvair should integrate with external ATS platforms as the intelligence engine while the ATS remains the workflow engine.

## User Stories

- As an ATS partner, I can send candidate data to Jobvair for enrichment.
- As an ATS partner, I can send job data and receive candidate match scores.
- As a recruiter, I can see Jobvair intelligence inside the ATS workflow.
- As Jobvair, we can map external ATS IDs to internal intelligence records safely.

## Core Entities

- `ats_integrations`
- `ats_candidate_links`
- `ats_job_links`
- `ats_application_links`
- `ats_webhook_events`
- `ats_match_exports`
- `profiles`
- `job_targets`
- `candidate_match_scores`

## Required Fields

ATS integration fields:

- `id`
- `provider`
- `tenant_id`
- `status`
- `configuration_json`
- `created_at`
- `updated_at`

Candidate link fields:

- `id`
- `integration_id`
- `user_id`
- `external_candidate_id`
- `sync_status`
- `last_synced_at`

Job link fields:

- `id`
- `integration_id`
- `job_target_id`
- `external_job_id`
- `sync_status`
- `last_synced_at`

Webhook event fields:

- `id`
- `integration_id`
- `event_type`
- `external_event_id`
- `idempotency_key`
- `payload_json`
- `processing_status`
- `created_at`

## Relationships

- One ATS integration has many candidate links.
- One ATS integration has many job links.
- One ATS job link maps to one Jobvair job target.
- One ATS candidate link maps to one Jobvair candidate profile.

## AI Requirements

AI should support ATS-triggered candidate enrichment, resume parsing, job match scoring, and rediscovery ranking.

## ATS Requirements

Jobvair should eventually expose:

- candidate enrichment API
- resume parsing API
- match scoring API
- verification lookup API
- candidate rediscovery API
- webhook receiver

## Future Roadmap Considerations

For isolved or custom ATS integration, Jobvair should support external IDs, tenant scoping, idempotent webhooks, sync status, integration-specific configuration, and service-role APIs with strict authorization.
