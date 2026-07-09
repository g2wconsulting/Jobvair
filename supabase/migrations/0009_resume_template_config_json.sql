-- Resume template system: full JSON-driven config support.
--
-- Purpose:
--   The frontend template schema (see src/resume-templates/templateDefaults.js)
--   supports typography.line_height, layout.body.two_column_sections,
--   visual_style.*, collections, audience, and a customization block. Local
--   presets already carry this richness in src/resume-templates/presets, but
--   the resume_templates table only had flat legacy columns, so any
--   Supabase-stored template (admin-created, user-customized, or a future
--   AI-recommended template) could not carry the same visual identity.
--
-- Compatibility:
--   Additive only. Existing flat columns (color, accent_color, font_family,
--   header_style, etc.) are untouched and remain the source of truth for
--   older code paths; normalizeResumeTemplate() already prefers flat columns
--   over config_json values where both exist, and falls back to config_json
--   otherwise, so existing rows keep working unchanged.

alter table public.resume_templates
  add column if not exists template_config_json jsonb default '{}'::jsonb,
  add column if not exists collections text[] default '{}',
  add column if not exists audience text[] default '{}';

comment on column public.resume_templates.template_config_json is
  'Full JSON-driven template config: typography, layout, visual_style, sections, preview, customization. See src/resume-templates/templateDefaults.js for the canonical shape (resume_template_v1).';
comment on column public.resume_templates.collections is
  'Collection tags used for browsing/filtering, e.g. {executive, corporate}. Distinct from the single category column.';
comment on column public.resume_templates.audience is
  'Free-text audience hints for AI-recommended template matching, e.g. {"software engineer", "data"}.';

create index if not exists resume_templates_collections_idx
  on public.resume_templates using gin (collections);
