-- Jobvair Employer Portal: candidate assessments.
--
-- Adds the ability for a company to send skills assessments (typing, Office,
-- communication, etc. — the catalog lives in client code, not the DB) to
-- candidates and track invitation status. Optionally tied to a job posting.
--
-- Follows the company-membership RLS pattern established in
-- 0011_employer_portal_foundation.sql (is_company_member()/is_company_admin()).
-- Candidate-side (token-based) access for actually taking an assessment is
-- intentionally not covered here — this migration only backs the employer
-- side: creating invitations and viewing their status/results.

create table if not exists public.assessment_invitations (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references public.companies(id) on delete cascade,
  job_id            uuid references public.jobs(id) on delete set null,
  candidate_name    text not null,
  candidate_email   text not null,
  assessment_ids    text[] not null default '{}',
  due_date          date,
  status            text not null default 'sent' check (status in ('sent', 'in_progress', 'completed', 'expired')),
  invite_token      uuid not null default gen_random_uuid(),
  created_by        uuid not null references auth.users(id) on delete cascade,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (invite_token)
);

create index if not exists assessment_invitations_company_idx on public.assessment_invitations(company_id);
create index if not exists assessment_invitations_job_idx on public.assessment_invitations(job_id);

create table if not exists public.assessment_results (
  id                uuid primary key default gen_random_uuid(),
  invitation_id     uuid not null references public.assessment_invitations(id) on delete cascade,
  assessment_id     text not null,
  score             numeric,
  passed            boolean,
  metrics           jsonb default '{}'::jsonb,
  completed_at      timestamptz not null default now(),
  unique (invitation_id, assessment_id)
);

create index if not exists assessment_results_invitation_idx on public.assessment_results(invitation_id);

drop trigger if exists set_assessment_invitations_updated_at on public.assessment_invitations;
create trigger set_assessment_invitations_updated_at before update on public.assessment_invitations
for each row execute function public.set_updated_at();

alter table public.assessment_invitations enable row level security;
alter table public.assessment_results enable row level security;

drop policy if exists "assessment_invitations_company_member_all" on public.assessment_invitations;
create policy "assessment_invitations_company_member_all"
on public.assessment_invitations for all
to authenticated
using (public.is_company_member(company_id) or public.is_active_admin())
with check (public.is_company_member(company_id) or public.is_active_admin());

drop policy if exists "assessment_results_company_member_all" on public.assessment_results;
create policy "assessment_results_company_member_all"
on public.assessment_results for all
to authenticated
using (
  public.is_active_admin()
  or exists (
    select 1 from public.assessment_invitations i
    where i.id = assessment_results.invitation_id
      and public.is_company_member(i.company_id)
  )
)
with check (
  public.is_active_admin()
  or exists (
    select 1 from public.assessment_invitations i
    where i.id = assessment_results.invitation_id
      and public.is_company_member(i.company_id)
  )
);
