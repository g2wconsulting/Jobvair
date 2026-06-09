# Trust & Verification Specification

## Purpose

The Trust & Verification layer helps recruiters identify authentic candidates and filter by verification status. It supports verified identity, verified contact methods, duplicate detection, and trust scoring.

## User Stories

- As a candidate, I can verify my identity and improve trust with employers.
- As a recruiter, I can filter for verified candidates.
- As a platform operator, I can identify duplicate or suspicious profiles.
- As an ATS partner, I can consume verification and trust status as candidate enrichment.

## Core Entities

- `identity_verifications`
- `candidate_verified_contacts`
- `candidate_trust_scores`
- `candidate_duplicate_signals`
- `candidate_duplicate_groups`
- `candidate_duplicate_reviews`

## Required Fields

Identity verification fields:

- `id`
- `user_id`
- `provider`
- `verification_type`
- `status`
- `provider_reference_id`
- `verified_at`
- `expires_at`
- `metadata`
- `created_at`
- `updated_at`

Trust score fields:

- `user_id`
- `trust_score`
- `identity_score`
- `profile_quality_score`
- `duplicate_risk_score`
- `resume_consistency_score`
- `score_breakdown`
- `last_calculated_at`

Duplicate signal fields:

- `id`
- `user_id`
- `matched_user_id`
- `signal_type`
- `match_strength`
- `confidence_score`
- `status`
- `created_at`

## Relationships

- One candidate has many verification records.
- One candidate has one current trust score.
- Duplicate signals may link two candidate profiles.
- Duplicate groups may contain multiple candidate profiles.

## AI Requirements

AI may assist with inconsistency detection, resume similarity, work history similarity, and suspicious profile patterns. Deterministic checks should be preferred for high-stakes verification decisions.

## ATS Requirements

ATS integrations should receive verification status, trust score, and duplicate-risk indicators without exposing sensitive raw identity data.

## Future Roadmap Considerations

Future work should include verified phone, verified email, manual review workflows, consent controls, and privacy-safe recruiter visibility.
