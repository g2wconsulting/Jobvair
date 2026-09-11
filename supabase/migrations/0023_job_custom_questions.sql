-- Lets a manager attach custom questions directly to a job posting, for
-- clients who use Jobvair Assess without necessarily posting jobs through
-- a separate standalone assessment. Rather than inventing a parallel
-- question-storage model, a job's custom questions live in an ordinary
-- company-owned assessment (reusing the full existing authoring, scoring,
-- and candidate-delivery pipeline) — this column just remembers which one
-- belongs to which job. The assessment itself is created lazily (on the
-- employer's first added question), not by this migration.

alter table public.jobs add column if not exists linked_assessment_id uuid references public.assessments(id) on delete set null;

notify pgrst, 'reload schema';
