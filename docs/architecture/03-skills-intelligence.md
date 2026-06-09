# Skills Intelligence Specification

## Purpose

Skills Intelligence is the core differentiator for Jobvair. It must distinguish a candidate who merely mentioned Java from one whose primary professional expertise is Java.

## User Stories

- As a candidate, I can see skills inferred from my resume and confirm or correct them.
- As a recruiter, I can filter candidates by primary skills, years of experience, last-used date, and confidence.
- As an ATS partner, I can use Jobvair to enrich candidate skill data beyond keyword search.

## Core Entities

- `candidate_skills`
- `candidate_skill_evidence`
- `candidate_work_experience`
- `parsed_resumes`
- `resumes`

## Required Fields

Recommended `candidate_skills` fields:

- `id`
- `user_id`
- `skill_name`
- `normalized_skill_name`
- `category`
- `years_experience`
- `first_used_date`
- `last_used_date`
- `proficiency_level`
- `is_primary`
- `is_secondary`
- `confidence_score`
- `source`
- `confirmation_status`
- `confirmed_at`
- `evidence_count`
- `created_at`
- `updated_at`

Recommended `candidate_skill_evidence` fields:

- `id`
- `user_id`
- `candidate_skill_id`
- `source_type`
- `source_id`
- `source_table`
- `source_parsed_resume_id`
- `source_resume_id`
- `skill_name`
- `normalized_skill_name`
- `evidence_text`
- `job_title`
- `company`
- `industry`
- `start_date`
- `end_date`
- `is_current`
- `first_used_date`
- `last_used_date`
- `years_inferred`
- `confidence_score`
- `evidence_strength`
- `created_at`
- `updated_at`

## Relationships

- One candidate skill has many evidence records.
- Evidence may come from resumes, parsed resumes, profile work history, certifications, or AI inference.
- Skills should relate back to candidate profile and match scoring.

## AI Requirements

AI must:

- identify skills from resume sections and work experience
- normalize skill names
- infer primary versus secondary skills
- estimate years of experience per skill
- estimate last-used date
- assign confidence scores
- preserve evidence text for explainability

## ATS Requirements

ATS integrations should be able to query candidates by:

- normalized skill name
- primary skill status
- years of experience
- last-used date
- confidence score
- confirmation status

## Future Roadmap Considerations

Future versions should support skill ontology, aliases, related skills, transferable skills, employer-required skill mapping, and recruiter-facing skill confidence explanations.
