-- Free Build (freeform canvas) persistence.
--
-- Purpose:
--   The Visual Designer's "Free Build" mode (FreeFormBuilder) lets a user
--   place elements anywhere on a blank canvas. Previously this was entirely
--   local/in-memory and lost on refresh. This column lets a resume record
--   carry a saved Free Build design so users don't lose their work.
--
-- Compatibility:
--   Additive only. Existing resumes get a null value here and are
--   unaffected; the Structured Resume Builder continues to use
--   sections/contact_fields exactly as before.

alter table public.resumes
  add column if not exists freeform_design_json jsonb default null;

comment on column public.resumes.freeform_design_json is
  'Free Build (freeform canvas) design for this resume: { version, elements: [...] }. Null if the user has never used Free Build for this resume. See src/resume-designer/freeformDefaults.js for the element shape.';
