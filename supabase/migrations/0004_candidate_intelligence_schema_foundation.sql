-- Jobvair Candidate Intelligence Foundation - Sprint 1 / Phase 1A.
--
-- Purpose:
--   Add non-breaking Candidate Intelligence metadata to existing profile,
--   skill, work, education, and certification tables.
--
-- Compatibility:
--   This migration only adds nullable/defaulted columns and supporting indexes.
--   It does not rename tables, remove columns, change existing constraints, or
--   alter current frontend save/load behavior.

-- Profiles become the top-level Candidate Intelligence Profile.
alter table public.profiles
  add column if not exists profile_completeness_score numeric(5,2),
  add column if not exists profile_confidence_score numeric(5,2),
  add column if not exists trust_score numeric(5,2),
  add column if not exists last_enriched_at timestamptz,
  add column if not exists last_profile_reviewed_at timestamptz,
  add column if not exists primary_resume_id uuid references public.resumes(id) on delete set null,
  add column if not exists profile_source text default 'manual',
  add column if not exists enrichment_status text default 'not_started',
  add column if not exists enrichment_metadata jsonb default '{}'::jsonb;

comment on column public.profiles.profile_completeness_score is
  'Deterministic score representing how complete the Candidate Intelligence Profile is.';
comment on column public.profiles.profile_confidence_score is
  'Confidence score based on evidence, confirmed fields, and enrichment quality.';
comment on column public.profiles.trust_score is
  'Future trust score composed from identity verification, profile quality, and duplicate-risk signals.';
comment on column public.profiles.primary_resume_id is
  'Optional pointer to the candidate primary resume version.';
comment on column public.profiles.enrichment_metadata is
  'Non-secret metadata about profile enrichment runs, sources, or summaries.';

-- Skills gain intelligence metadata without changing the existing unique key.
alter table public.candidate_skills
  add column if not exists normalized_skill_name text,
  add column if not exists first_used_date date,
  add column if not exists confidence_score numeric(5,2),
  add column if not exists is_secondary boolean default false,
  add column if not exists confirmation_status text default 'unconfirmed',
  add column if not exists confirmed_at timestamptz,
  add column if not exists last_inferred_at timestamptz,
  add column if not exists evidence_count integer default 0,
  add column if not exists inference_metadata jsonb default '{}'::jsonb;

update public.candidate_skills
set normalized_skill_name = lower(trim(skill_name))
where normalized_skill_name is null
  and skill_name is not null;

comment on column public.candidate_skills.normalized_skill_name is
  'Normalized skill label used for search, matching, and future skill ontology mapping.';
comment on column public.candidate_skills.confidence_score is
  'Confidence that this skill is accurately represented for the candidate.';
comment on column public.candidate_skills.confirmation_status is
  'Whether the skill is unconfirmed, candidate_confirmed, system_verified, or rejected.';
comment on column public.candidate_skills.evidence_count is
  'Cached count of evidence records once candidate_skill_evidence is introduced.';

-- Profile-level work records gain source and confidence metadata.
alter table public.candidate_work_experience
  add column if not exists confidence_score numeric(5,2),
  add column if not exists source_resume_id uuid references public.resumes(id) on delete set null,
  add column if not exists source_parsed_resume_id uuid references public.parsed_resumes(id) on delete set null,
  add column if not exists confirmation_status text default 'unconfirmed',
  add column if not exists inference_metadata jsonb default '{}'::jsonb;

comment on column public.candidate_work_experience.confidence_score is
  'Confidence that this work history record was accurately captured.';
comment on column public.candidate_work_experience.source_parsed_resume_id is
  'Parsed resume that produced or last enriched this work history record.';

-- Education gains hierarchy/source/confidence fields.
alter table public.candidate_education
  add column if not exists education_level text,
  add column if not exists confidence_score numeric(5,2),
  add column if not exists source_resume_id uuid references public.resumes(id) on delete set null,
  add column if not exists source_parsed_resume_id uuid references public.parsed_resumes(id) on delete set null,
  add column if not exists confirmation_status text default 'unconfirmed',
  add column if not exists inference_metadata jsonb default '{}'::jsonb;

comment on column public.candidate_education.education_level is
  'Normalized education hierarchy value such as High School, Bachelor, Master, MBA, or Doctorate.';
comment on column public.candidate_education.confidence_score is
  'Confidence that this education record was accurately captured.';

-- Certifications gain source/confidence/verification fields.
alter table public.candidate_certifications
  add column if not exists verification_status text default 'unverified',
  add column if not exists confidence_score numeric(5,2),
  add column if not exists source_resume_id uuid references public.resumes(id) on delete set null,
  add column if not exists source_parsed_resume_id uuid references public.parsed_resumes(id) on delete set null,
  add column if not exists confirmation_status text default 'unconfirmed',
  add column if not exists inference_metadata jsonb default '{}'::jsonb;

comment on column public.candidate_certifications.verification_status is
  'Certification verification status, independent of identity verification.';
comment on column public.candidate_certifications.confidence_score is
  'Confidence that this certification record was accurately captured.';

-- Supporting indexes for future Candidate Intelligence queries.
create index if not exists profiles_primary_resume_idx
  on public.profiles(primary_resume_id);

create index if not exists profiles_enrichment_status_idx
  on public.profiles(enrichment_status);

create index if not exists candidate_skills_user_normalized_idx
  on public.candidate_skills(user_id, normalized_skill_name);

create index if not exists candidate_skills_normalized_primary_years_idx
  on public.candidate_skills(normalized_skill_name, is_primary, years_experience);

create index if not exists candidate_skills_user_last_used_idx
  on public.candidate_skills(user_id, last_used_date);

create index if not exists candidate_skills_confirmation_status_idx
  on public.candidate_skills(user_id, confirmation_status);

create index if not exists candidate_work_source_parsed_resume_idx
  on public.candidate_work_experience(source_parsed_resume_id);

create index if not exists candidate_education_source_parsed_resume_idx
  on public.candidate_education(source_parsed_resume_id);

create index if not exists candidate_certifications_source_parsed_resume_idx
  on public.candidate_certifications(source_parsed_resume_id);
