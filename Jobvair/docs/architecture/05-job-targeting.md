# Job Targeting Specification

## Purpose

Job Targeting replaces the standalone AI Optimizer concept. It evaluates a candidate for a specific role using the Candidate Intelligence Profile, selected resume version, and job description.

## User Stories

- As a candidate, I can paste a job description and see how well my selected resume matches it.
- As a candidate, I can receive AI recommendations inside the Resume Builder.
- As a recruiter or ATS partner, I can score candidates against a job with explainable rationale.

## Core Entities

- `job_targets`
- `candidate_match_scores`
- `candidate_match_score_details`
- `ai_recommendations`
- `resumes`
- `resume_sections`
- `work_experience_entries`
- `candidate_skills`

## Required Fields

Recommended `job_targets` fields:

- `id`
- `user_id`
- `resume_id`
- `job_title`
- `company`
- `job_description`
- `required_skills`
- `preferred_skills`
- `industry`
- `location`
- `work_mode`
- `source`
- `ats_job_id`
- `created_at`
- `updated_at`

Recommended `candidate_match_scores` fields:

- `id`
- `user_id`
- `resume_id`
- `job_target_id`
- `overall_score`
- `skills_score`
- `experience_score`
- `recency_score`
- `industry_score`
- `education_score`
- `certification_score`
- `trust_score`
- `missing_required_skills`
- `matching_primary_skills`
- `matching_secondary_skills`
- `recommendation_summary`
- `created_at`

## Relationships

- Job target belongs to a candidate and may reference a selected resume.
- Job target has many match scores over time.
- Match score has many detailed score components.
- Match score can generate many AI recommendations.

## AI Requirements

AI must compare:

- Candidate Intelligence Profile
- selected resume sections
- selected resume work experience blocks
- job description
- job requirements

AI should return match score, explainable rationale, missing requirements, keywords, and section-level recommendations.

## ATS Requirements

ATS integrations should be able to submit job data and receive candidate fit scores, missing skills, matching skills, and explanation.

## Future Roadmap Considerations

Future job targeting should support saved job targets, multiple resume variants per target, accepted/rejected AI suggestions, and historical match tracking.
