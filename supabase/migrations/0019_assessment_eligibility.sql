-- Jobvair Assess: eligibility requirements.
--
-- Configurable eligibility requirements text, surfaced to candidates on
-- the assessment landing screen before they certify and start — per the
-- SOW's "configurable... eligibility requirements" control.

alter table public.assessments add column if not exists eligibility_requirements text;

-- Server-side time-limit enforcement. Set once, at attempt creation, from
-- the sum of the included assessments' time_limit_minutes (only when
-- every included assessment has one — otherwise the attempt has no
-- overall limit). Edge Functions reject further responses past this
-- timestamp regardless of what a client-side countdown shows.
alter table public.assessment_attempts add column if not exists time_limit_expires_at timestamptz;

