# Resume Versioning Specification

## Purpose

Resumes are generated, edited, targeted, and exported outputs of the Candidate Intelligence Profile. They should not become the primary source of truth.

## User Stories

- As a candidate, I can create multiple resume versions from one profile.
- As a candidate, I can target a resume to a specific job.
- As a candidate, I can preserve resume-specific edits without overwriting my profile.
- As an ATS partner, I can retrieve or score a selected resume version.

## Core Entities

- `resumes`
- `resume_sections`
- `work_experience_entries`
- `resume_templates`
- `job_targets`
- `ai_recommendations`

## Required Fields

Recommended resume fields:

- `id`
- `user_id`
- `name`
- `template`
- `selected_template_id`
- `is_primary`
- `target_job_id`
- `source_profile_snapshot`
- `created_from_resume_id`
- `version_label`
- `storage_path`
- `parsed_resume_id`
- `created_at`
- `updated_at`

Recommended section fields:

- `id`
- `resume_id`
- `user_id`
- `section_type`
- `label`
- `content`
- `display_order`
- `is_visible`
- `is_required`
- `source_profile_entity_id`
- `source_type`
- `layout_config_json`

## Relationships

- One candidate profile has many resume versions.
- One resume has many sections.
- One resume has many resume-specific work experience entries.
- One resume may be linked to one job target.
- One resume may have many AI recommendations.

## AI Requirements

AI should generate resume drafts from profile data, suggest targeted changes, and preserve accepted/rejected recommendation history.

## ATS Requirements

ATS integrations should be able to identify which resume version was used for a score or export.

## Future Roadmap Considerations

Future work should include resume version lineage, profile snapshots, targeted variants, AI edit history, export history, and share links.
