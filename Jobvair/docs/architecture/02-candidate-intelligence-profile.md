# Candidate Intelligence Profile Specification

## Purpose

The Candidate Intelligence Profile is the durable source of truth for a candidate. It represents who the candidate is, what they know, what they have done, what they are seeking, and how reliable the profile data is.

## User Stories

- As a candidate, I can upload a resume and automatically create or enrich my profile.
- As a candidate, I can review and confirm inferred profile data.
- As a candidate, I can use one profile to generate multiple resumes.
- As a recruiter, I can evaluate a candidate beyond resume keywords.
- As an ATS partner, I can retrieve structured candidate intelligence.

## Core Entities

- `profiles`
- `candidate_skills`
- `candidate_skill_evidence`
- `candidate_work_experience`
- `candidate_education`
- `candidate_certifications`
- `candidate_trust_scores`
- `resumes`
- `job_targets`

## Required Fields

Recommended profile fields:

- `id`
- `user_id` or auth-linked primary key
- `full_name`
- `email`
- `phone`
- `location`
- `summary`
- `desired_titles`
- `industries`
- `employment_status`
- `availability`
- `work_authorization`
- `sponsorship_required`
- `highest_education_level`
- `total_years_experience`
- `total_years_leadership`
- `profile_completeness_score`
- `profile_confidence_score`
- `trust_score`
- `last_enriched_at`
- `last_profile_reviewed_at`
- `created_at`
- `updated_at`

## Relationships

- Profile has many skills.
- Profile has many work experience records.
- Profile has many education records.
- Profile has many certifications.
- Profile has many resume versions.
- Profile has many job targets and match scores.
- Profile has verification and trust records.

## AI Requirements

AI should enrich the profile from resumes, infer skill evidence, identify missing fields, classify industries, estimate seniority, and generate profile confidence signals.

## ATS Requirements

The Candidate Intelligence Profile should be retrievable by ATS integrations as a normalized enrichment layer independent of resume formatting.

## Future Roadmap Considerations

Candidate Profile should eventually include review workflows, candidate-confirmed fields, employer-visible fields, consent settings, and profile visibility controls.
