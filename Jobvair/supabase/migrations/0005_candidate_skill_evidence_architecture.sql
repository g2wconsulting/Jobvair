-- Jobvair Candidate Intelligence Foundation - Sprint 2 / Phase 1B.
--
-- Purpose:
--   Add evidence-backed skill intelligence without changing frontend behavior.
--
-- Compatibility:
--   This migration creates a new table, indexes, comments, and RLS policies.
--   It does not modify resume upload, parse-resume, Resume Builder, Stripe,
--   Identity Verification, or any existing Edge Function names.

create table if not exists public.candidate_skill_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  candidate_skill_id uuid references public.candidate_skills(id) on delete cascade,

  -- Source/provenance.
  source_type text not null default 'unknown',
  source_table text,
  source_id uuid,
  source_parsed_resume_id uuid references public.parsed_resumes(id) on delete set null,
  source_resume_id uuid references public.resumes(id) on delete set null,

  -- Skill labels are copied here for durable evidence snapshots and search.
  skill_name text not null,
  normalized_skill_name text,

  -- Explainability context.
  evidence_text text,
  job_title text,
  company text,
  industry text,

  -- Time and experience inference.
  start_date date,
  end_date date,
  is_current boolean default false,
  first_used_date date,
  last_used_date date,
  years_inferred numeric(5,2),

  -- Confidence and quality metadata.
  confidence_score numeric(5,2),
  evidence_strength text,
  extraction_method text default 'unknown',
  metadata jsonb default '{}'::jsonb,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.candidate_skill_evidence is
  'Evidence records explaining why Jobvair believes a candidate has a given skill.';
comment on column public.candidate_skill_evidence.source_type is
  'Origin of evidence, such as resume, profile, work_experience, certification, ai_inference, ats, or manual.';
comment on column public.candidate_skill_evidence.evidence_text is
  'Text snippet or concise explanation supporting the inferred skill.';
comment on column public.candidate_skill_evidence.normalized_skill_name is
  'Normalized skill label used for search, matching, and future ontology mapping.';
comment on column public.candidate_skill_evidence.years_inferred is
  'Years of experience inferred from this evidence record alone.';
comment on column public.candidate_skill_evidence.confidence_score is
  'Confidence that this evidence supports the linked candidate skill.';
comment on column public.candidate_skill_evidence.metadata is
  'Non-secret auxiliary extraction metadata. Do not store API keys, secrets, or raw identity documents.';

-- Keep updated_at current for evidence edits.
drop trigger if exists set_candidate_skill_evidence_updated_at on public.candidate_skill_evidence;
create trigger set_candidate_skill_evidence_updated_at
before update on public.candidate_skill_evidence
for each row execute function public.set_updated_at();

-- Normalize snapshot skill labels for evidence inserted before normalization
-- is handled by application/Edge Function code.
update public.candidate_skill_evidence
set normalized_skill_name = lower(trim(skill_name))
where normalized_skill_name is null
  and skill_name is not null;

-- Search and lookup indexes.
create index if not exists candidate_skill_evidence_user_skill_idx
  on public.candidate_skill_evidence(user_id, normalized_skill_name);

create index if not exists candidate_skill_evidence_skill_id_idx
  on public.candidate_skill_evidence(candidate_skill_id);

create index if not exists candidate_skill_evidence_user_confidence_idx
  on public.candidate_skill_evidence(user_id, confidence_score);

create index if not exists candidate_skill_evidence_source_parsed_resume_idx
  on public.candidate_skill_evidence(source_parsed_resume_id);

create index if not exists candidate_skill_evidence_source_resume_idx
  on public.candidate_skill_evidence(source_resume_id);

create index if not exists candidate_skill_evidence_user_last_used_idx
  on public.candidate_skill_evidence(user_id, last_used_date);

create index if not exists candidate_skill_evidence_user_source_type_idx
  on public.candidate_skill_evidence(user_id, source_type);

create index if not exists candidate_skill_evidence_user_created_idx
  on public.candidate_skill_evidence(user_id, created_at desc);

-- RLS:
--   Candidates can access only their own evidence.
--   Admins can read/manage through the existing public.is_active_admin()
--   helper created in the backend stabilization RLS draft.
--   Supabase service-role requests bypass RLS and must be limited to trusted
--   Edge Functions that verify authenticated user or integration context.
alter table public.candidate_skill_evidence enable row level security;

drop policy if exists "candidate_skill_evidence_owner_select" on public.candidate_skill_evidence;
create policy "candidate_skill_evidence_owner_select"
on public.candidate_skill_evidence for select
to authenticated
using (user_id = auth.uid() or public.is_active_admin());

drop policy if exists "candidate_skill_evidence_owner_insert" on public.candidate_skill_evidence;
create policy "candidate_skill_evidence_owner_insert"
on public.candidate_skill_evidence for insert
to authenticated
with check (user_id = auth.uid() or public.is_active_admin());

drop policy if exists "candidate_skill_evidence_owner_update" on public.candidate_skill_evidence;
create policy "candidate_skill_evidence_owner_update"
on public.candidate_skill_evidence for update
to authenticated
using (user_id = auth.uid() or public.is_active_admin())
with check (user_id = auth.uid() or public.is_active_admin());

drop policy if exists "candidate_skill_evidence_owner_delete" on public.candidate_skill_evidence;
create policy "candidate_skill_evidence_owner_delete"
on public.candidate_skill_evidence for delete
to authenticated
using (user_id = auth.uid() or public.is_active_admin());
