# Jobvair Data Architecture

## Entity Relationship Diagram

```text
profiles
  -> candidate_skills
      -> candidate_skill_evidence
  -> candidate_work_experience
  -> candidate_education
  -> candidate_certifications
  -> resumes
      -> resume_sections
      -> work_experience_entries
  -> job_targets
      -> candidate_match_scores
          -> candidate_match_score_details
      -> ai_recommendations
  -> identity_verifications
  -> candidate_verified_contacts
  -> candidate_trust_scores
  -> candidate_duplicate_signals

ats_integrations
  -> ats_candidate_links -> profiles
  -> ats_job_links -> job_targets
  -> ats_application_links
  -> ats_webhook_events
  -> ats_match_exports
```

## Current Schema vs Future Schema

Current known schema supports:

- `profiles`
- `candidate_skills`
- `candidate_work_experience`
- `candidate_education`
- `candidate_certifications`
- `resume_templates`
- `parsed_resumes`
- `resumes`
- `resume_sections`
- `work_experience_entries`
- `identity_verifications`
- `subscriptions`
- `admin_users`
- `ai_analyses`
- `admin_candidate_view`
- `platform_analytics`

Future schema requires:

- `candidate_skill_evidence`
- `candidate_trust_scores`
- `candidate_duplicate_signals`
- `candidate_duplicate_groups`
- `candidate_duplicate_reviews`
- `candidate_verified_contacts`
- `job_targets`
- `candidate_match_scores`
- `candidate_match_score_details`
- `ai_recommendations`
- `ats_integrations`
- `ats_candidate_links`
- `ats_job_links`
- `ats_application_links`
- `ats_webhook_events`
- `ats_match_exports`

## New Tables Required

Highest priority:

- `candidate_skill_evidence`
- `job_targets`
- `candidate_match_scores`
- `candidate_match_score_details`
- `ai_recommendations`

Medium priority:

- `candidate_trust_scores`
- `candidate_verified_contacts`
- `candidate_duplicate_signals`
- `candidate_duplicate_groups`

Later priority:

- `ats_integrations`
- `ats_candidate_links`
- `ats_job_links`
- `ats_application_links`
- `ats_webhook_events`
- `ats_match_exports`

## Existing Tables to Extend

- `profiles`
- `candidate_skills`
- `candidate_work_experience`
- `candidate_education`
- `candidate_certifications`
- `resumes`
- `resume_sections`
- `parsed_resumes`
- `identity_verifications`

## Recommended Indexes

- `candidate_skills(user_id, normalized_skill_name)`
- `candidate_skills(normalized_skill_name, is_primary, years_experience)`
- `candidate_skills(user_id, last_used_date)`
- `candidate_skill_evidence(user_id, normalized_skill_name)`
- `candidate_skill_evidence(candidate_skill_id)`
- `candidate_match_scores(user_id, job_target_id)`
- `resumes(user_id, is_primary)`
- `resumes(user_id, updated_at desc)`
- `job_targets(user_id, created_at desc)`
- `ats_candidate_links(integration_id, external_candidate_id)`
- `ats_job_links(integration_id, external_job_id)`
- `identity_verifications(user_id, status)`

## Recommended RLS / Security Considerations

- Candidates can read and write their own profile, resume, and candidate-owned rows.
- Verification provider metadata should be restricted.
- Trust and duplicate raw signals should not be fully visible to candidates or employers.
- Recruiter/employer access must be tenant-scoped.
- ATS service access must be integration-scoped.
- Edge Functions using service role must enforce authenticated user or trusted integration context.
- Admin analytics should be exposed through secure views or Edge Functions.

## ATS Integration Mapping Strategy

- Never replace Jobvair internal IDs with ATS IDs.
- Store ATS IDs in mapping tables.
- Include provider, tenant, external ID, sync status, and last sync time.
- Use idempotency keys for webhook imports.
- Keep ATS workflow data separate from Jobvair intelligence data.
- Treat ATS as source for jobs/applications, not as the owner of Candidate Intelligence Profile.
