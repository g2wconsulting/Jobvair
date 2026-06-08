# Jobvair Database Schema Draft

This document records the backend assets currently expected by the Jobvair frontend.

It is based on source-code inspection, not a live Supabase export. Treat it as a stabilization scaffold to reconcile against the live project.

## Tables and Views Expected by the App

### `profiles`

Candidate profile row keyed by Supabase Auth user id.

Expected fields include:

- `id`
- `full_name`
- `email`
- `phone`
- `location`
- `city`
- `state`
- `zip_code`
- `country`
- `summary`
- `desired_titles`
- `industries`
- `availability`
- `employment_status`
- `salary_level`
- `salary_target`
- `employment_types`
- `work_locations`
- `background_check`
- `wotc_eligible`
- `sponsorship_required`
- `open_to_relocation`
- `linkedin_url`
- `github_url`
- `portfolio_url`
- `total_years_experience`
- `total_years_leadership`
- `total_years_industry`
- `highest_education_level`
- `security_clearance`
- `work_authorization`
- `updated_at`

### `candidate_skills`

One row per candidate skill.

Expected fields:

- `id`
- `user_id`
- `skill_name`
- `category`
- `years_experience`
- `proficiency_level`
- `last_used_date`
- `is_primary`
- `source`
- `updated_at`

The frontend upserts on `user_id,skill_name`.

### `candidate_work_experience`

Profile-level work history.

Expected fields:

- `id`
- `user_id`
- `job_title`
- `company`
- `location`
- `start_date`
- `end_date`
- `is_current`
- `description`
- `is_leadership`
- `industry`
- `source`
- `updated_at`

### `candidate_education`

Profile-level education.

Expected fields:

- `id`
- `user_id`
- `institution`
- `degree`
- `major`
- `graduation_year`
- `is_highest`
- `source`
- `updated_at`

### `candidate_certifications`

Profile-level certifications.

Expected fields:

- `id`
- `user_id`
- `name`
- `issuing_org`
- `issue_date`
- `expiry_date`
- `credential_id`
- `source`
- `updated_at`

### `resumes`

Resume version records.

Expected fields:

- `id`
- `user_id`
- `name`
- `template`
- `selected_template_id`
- `is_primary`
- `storage_path`
- `parsed_resume_id`
- `sections`
- `contact_fields`
- `created_at`
- `updated_at`

### `resume_sections`

Builder section rows for each resume.

Expected fields:

- `id`
- `user_id`
- `resume_id`
- `section_type`
- `label`
- `content`
- `display_order`
- `is_visible`
- `is_required`
- `layout_config_json`

### `work_experience_entries`

Resume-specific work experience blocks.

Expected fields:

- `id`
- `user_id`
- `resume_id`
- `job_title`
- `company`
- `location`
- `start_date`
- `end_date`
- `is_current`
- `description`
- `bullet_points`
- `skills_used`
- `achievements`
- `display_order`
- `is_visible`
- `source`

### `resume_templates`

Admin-managed resume templates.

Expected fields:

- `id`
- `name`
- `slug`
- `description`
- `tier`
- `category`
- `color`
- `accent_color`
- `sort_order`
- `is_active`
- `is_featured`
- `is_premium`
- `preview_image_url`
- `font_family`
- `base_font_size`
- `header_style`
- `heading_style`
- `layout_type`
- `page_margin`
- `section_spacing`
- `ats_friendly`
- `created_by`
- `created_at`
- `updated_at`

### `parsed_resumes`

Tracks uploaded resume parsing.

Expected fields:

- `id`
- `user_id`
- `storage_path`
- `original_filename`
- `parse_status`
- `parsed_json`
- `error_message`
- `created_at`
- `updated_at`

### `identity_verifications`

Stripe Identity status per user.

Expected fields:

- `id`
- `user_id`
- `status`
- `stripe_verification_session_id`
- `verified_at`
- `created_at`
- `updated_at`

### `subscriptions`

Stripe subscription status per user.

Expected fields:

- `id`
- `user_id`
- `plan`
- `status`
- `stripe_customer_id`
- `stripe_subscription_id`
- `current_period_end`
- `created_at`
- `updated_at`

### `admin_users`

Admin authorization registry.

Expected fields:

- `id`
- `email`
- `full_name`
- `role`
- `is_active`
- `created_at`
- `updated_at`

### `admin_candidate_view`

Admin list/detail view.

Expected fields:

- `id`
- `full_name`
- `email`
- `location`
- `subscription_plan`
- `subscription_status`
- `verification_status`
- `total_years_experience`
- `highest_education_level`
- `skill_count`
- `resume_count`
- `analysis_count`
- `account_created_at`

### `platform_analytics`

Admin dashboard analytics view.

Expected fields:

- `total_users`
- `new_users_7d`
- `new_users_30d`
- `paid_subscribers`
- `premium_count`
- `premium_plus_count`
- `verified_users`
- `ai_analyses_run`
- `resumes_parsed`
- `total_resumes`
- `total_skills_entered`

## Storage Buckets

### `resumes`

Private bucket used for uploaded resumes.

Object names are uploaded as:

```text
<user_id>/<timestamp>_<safe_filename>
```

The frontend also stores a display/reference path in database rows:

```text
resumes/<user_id>/<timestamp>_<safe_filename>
```

## Edge Functions

Expected Edge Functions:

- `parse-resume`
- `analyze-resume`
- `generate-cover-letter`
- `create-checkout-session`
- `create-billing-portal-session`
- `create-identity-session`

See `supabase/functions/README.md` and each function directory for request/response contracts.

## Manual Export Checklist

Export or verify the following from the live Supabase dashboard:

- Full database schema, including column types, defaults, constraints, indexes, triggers, and functions.
- RLS policies for every table and view.
- Storage buckets and storage policies.
- Edge Function source for all six expected functions.
- Edge Function secrets and environment variable names, without committing secret values.
- Stripe webhook handler source, if currently deployed separately.
- Auth settings: redirect URLs, email confirmation settings, password reset URLs, providers, and email templates.
- Seed data for `resume_templates`, if production templates are managed in the dashboard.
- Admin user bootstrap process for `admin_users`.

## Known Gaps

- The frontend currently renders AI history from seed data rather than a persisted table.
- The schema draft includes `ai_analyses` as a placeholder to support admin analytics and future history persistence, but the current frontend does not query it directly.
- Views in this draft are inferred and may differ from production.
