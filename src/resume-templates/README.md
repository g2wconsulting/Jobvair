# Resume Template System

This folder contains the foundation for JSON-driven resume templates.

Phase 1 is intentionally behavior-preserving:

- Existing Supabase `resume_templates` rows still work.
- Existing BuilderPage render fields are preserved through legacy aliases.
- No database schema change is required.
- No template rendering behavior changes are intended.

## Current Runtime Flow

1. Supabase returns rows from `resume_templates`.
2. `normalizeResumeTemplate(templateRow)` converts each row into a full `resume_template_v1` config.
3. The normalized template keeps legacy fields such as `font_family`, `accent_color`, `header_style`, `heading_style`, `page_margin`, and `section_spacing`.
4. Future renderers can use the richer nested config under `template_config`.

## Template Config Shape

The canonical config starts from `DEFAULT_RESUME_TEMPLATE_CONFIG` in `templateDefaults.js`.

Top-level areas:

- metadata: `version`, `id`, `slug`, `name`, `tier`, `category`, `collections`
- colors: text, muted, accent, background, border
- typography: font family, base size, line height, heading style
- layout: page, header, and body rules
- sections: per-section heading and visibility defaults
- preview: preview generation instructions
- customization: what users can safely override

## Design Principles

- Candidate profile data is content; templates are presentation.
- Resume-specific design overrides should be separate from template definitions.
- Templates should support categories and collections.
- Admin-created and user-customized templates should build on the same schema.
- Template rendering should eventually move out of `BuilderPage.jsx`.

## Future Phases

1. Extract template renderers from `BuilderPage.jsx`.
2. Add local JSON template presets.
3. Render real template previews from sample resume data.
4. Store resume-level design overrides in one normalized config.
5. Add `template_config_json` to `resume_templates`.
6. Upgrade admin template management.
