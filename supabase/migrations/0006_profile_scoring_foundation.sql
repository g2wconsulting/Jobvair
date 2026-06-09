-- Jobvair Candidate Intelligence Foundation - Sprint 4 / Phase 1D.
--
-- Purpose:
--   Add timestamp and explainability metadata for deterministic profile
--   completeness/confidence scoring.
--
-- Compatibility:
--   This migration is additive only. Existing profile score columns were added
--   in Sprint 1; this migration adds supporting score metadata without changing
--   current frontend behavior.

alter table public.profiles
  add column if not exists last_scored_at timestamptz,
  add column if not exists score_breakdown_json jsonb default '{}'::jsonb;

comment on column public.profiles.last_scored_at is
  'Timestamp of the last deterministic Candidate Intelligence Profile score calculation.';
comment on column public.profiles.score_breakdown_json is
  'Explainable, non-secret score component breakdown. Scores are guidance, not absolute truth.';

create index if not exists profiles_last_scored_idx
  on public.profiles(last_scored_at);
