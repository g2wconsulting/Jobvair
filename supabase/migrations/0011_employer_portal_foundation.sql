-- Jobvair Employer Portal foundation.
--
-- Adds the employer/company side of the platform alongside the existing
-- job seeker schema. Nothing here modifies or removes existing candidate
-- tables (profiles, resumes, candidate_* tables, subscriptions, etc.) —
-- this migration is purely additive.
--
-- Design notes:
--   * An employer account is organized around a Company. A user's employer
--     access lives in employer_memberships (many-to-many company <-> user),
--     mirroring the EmployerUser/EmployerMembership split from the product
--     spec while keeping a single lightweight employer_profiles row per
--     auth user for shared display info (name/phone) across memberships.
--   * Row-level security follows the existing owner-or-admin pattern
--     (see 0002_backend_stabilization_rls_policy_draft.sql) extended with
--     company-scoped helper functions, the same way is_active_admin() is
--     used today.
--   * Candidate identity/profile/resume data is never duplicated. Jobs,
--     applications, pipeline, notes, interviews, offers, matches, and HCM
--     transfers all reference auth.users(id)/public.profiles(id) directly.
--   * Subscription plans/entitlements are data, not code — new plans or
--     limits can be added via the subscription_plans / feature_entitlements
--     tables without a code change.

-- ── Companies ────────────────────────────────────────────────────────────
create table if not exists public.companies (
  id                      uuid primary key default gen_random_uuid(),
  name                    text not null,
  website                 text,
  industry                text,
  company_size            text,
  employee_count          integer,
  headquarters_location   text,
  hiring_locations        text[] default '{}',
  annual_hiring_volume    text,
  logo_url                text,
  description             text,
  culture                 text,
  work_environment        text,
  benefits                text[] default '{}',
  photos                  text[] default '{}',
  social_links            jsonb default '{}'::jsonb,
  created_by              uuid references auth.users(id),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- ── Employer profiles (one row per auth user with employer access) ────────
create table if not exists public.employer_profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text,
  email        text,
  phone        text,
  title        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── Employer memberships (company <-> user, with role) ─────────────────────
create table if not exists public.employer_memberships (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  role           text not null default 'recruiter' check (role in ('company_admin', 'recruiter', 'hiring_manager')),
  is_active      boolean not null default true,
  is_primary_contact boolean not null default false,
  invited_by     uuid references auth.users(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (company_id, user_id)
);

create index if not exists employer_memberships_user_idx on public.employer_memberships(user_id);
create index if not exists employer_memberships_company_idx on public.employer_memberships(company_id);

-- ── Jobs ────────────────────────────────────────────────────────────────
create table if not exists public.jobs (
  id                        uuid primary key default gen_random_uuid(),
  company_id                uuid not null references public.companies(id) on delete cascade,
  created_by                uuid references auth.users(id),
  title                     text not null,
  department                text,
  location                  text,
  work_arrangement          text check (work_arrangement in ('remote', 'hybrid', 'onsite')),
  employment_type           text,
  salary_min                numeric,
  salary_max                numeric,
  salary_currency           text default 'USD',
  min_qualifications        text,
  preferred_qualifications  text,
  experience_requirements   text,
  education_requirements    text,
  required_skills           text[] default '{}',
  preferred_skills          text[] default '{}',
  description               text,
  responsibilities          text,
  benefits                  text,
  travel_requirements       text,
  screening_questions       jsonb default '[]'::jsonb,
  status                    text not null default 'draft' check (status in ('draft', 'published', 'paused', 'closed', 'archived')),
  published_at              timestamptz,
  closed_at                 timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists jobs_company_idx on public.jobs(company_id);
create index if not exists jobs_status_idx on public.jobs(status);

-- ── Job applications (references the candidate's Jobvair profile, never copies it) ──
create table if not exists public.job_applications (
  id                  uuid primary key default gen_random_uuid(),
  job_id              uuid not null references public.jobs(id) on delete cascade,
  candidate_id        uuid not null references auth.users(id) on delete cascade,
  resume_id           uuid references public.resumes(id),
  current_stage       text not null default 'applied' check (current_stage in
                        ('applied', 'screening', 'qualified', 'interview', 'final_interview',
                         'offer', 'hired', 'rejected', 'withdrawn', 'on_hold')),
  screening_answers   jsonb default '{}'::jsonb,
  match_score         numeric,
  source              text default 'jobvair',
  applied_at          timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (job_id, candidate_id)
);

create index if not exists job_applications_job_idx on public.job_applications(job_id);
create index if not exists job_applications_candidate_idx on public.job_applications(candidate_id);
create index if not exists job_applications_stage_idx on public.job_applications(current_stage);

-- ── Pipeline stage history (audit trail of stage moves) ─────────────────────
create table if not exists public.candidate_pipeline_events (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references public.job_applications(id) on delete cascade,
  from_stage      text,
  to_stage        text not null,
  changed_by      uuid references auth.users(id),
  note            text,
  created_at      timestamptz not null default now()
);

create index if not exists candidate_pipeline_events_app_idx on public.candidate_pipeline_events(application_id);

-- ── Internal employer notes on a candidate application ──────────────────────
create table if not exists public.candidate_notes (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references public.job_applications(id) on delete cascade,
  author_id       uuid not null references auth.users(id),
  note_type       text not null default 'internal' check (note_type in ('internal', 'interview')),
  body            text not null,
  created_at      timestamptz not null default now()
);

create index if not exists candidate_notes_app_idx on public.candidate_notes(application_id);

-- ── Candidate assignment to a hiring team member ────────────────────────────
create table if not exists public.candidate_assignments (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references public.job_applications(id) on delete cascade,
  assigned_to     uuid not null references auth.users(id),
  assigned_by     uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  unique (application_id, assigned_to)
);

-- ── Saved candidates (talent search bookmarking) ───────────────────────────
create table if not exists public.saved_candidates (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  candidate_id  uuid not null references auth.users(id) on delete cascade,
  saved_by      uuid references auth.users(id),
  note          text,
  created_at    timestamptz not null default now(),
  unique (company_id, candidate_id)
);

-- ── Candidate search privacy preference (extends the existing candidate side) ─
create table if not exists public.candidate_search_preferences (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  searchability  text not null default 'application_only' check (searchability in
                   ('searchable', 'searchable_anonymous', 'application_only', 'private')),
  updated_at     timestamptz not null default now()
);

-- ── Candidate matching framework (populated by a future matching engine) ────
create table if not exists public.candidate_matches (
  id                uuid primary key default gen_random_uuid(),
  job_id            uuid not null references public.jobs(id) on delete cascade,
  candidate_id      uuid not null references auth.users(id) on delete cascade,
  match_score       numeric,
  match_breakdown   jsonb default '{}'::jsonb,
  computed_at       timestamptz not null default now(),
  unique (job_id, candidate_id)
);

-- ── Interviews ──────────────────────────────────────────────────────────
create table if not exists public.interviews (
  id                uuid primary key default gen_random_uuid(),
  application_id    uuid not null references public.job_applications(id) on delete cascade,
  scheduled_at      timestamptz,
  duration_minutes  integer,
  location          text,
  meeting_link      text,
  status            text not null default 'requested' check (status in ('requested', 'scheduled', 'completed', 'cancelled')),
  created_by        uuid references auth.users(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists interviews_app_idx on public.interviews(application_id);

create table if not exists public.interview_interviewers (
  interview_id  uuid not null references public.interviews(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  primary key (interview_id, user_id)
);

create table if not exists public.interview_feedback (
  id             uuid primary key default gen_random_uuid(),
  interview_id   uuid not null references public.interviews(id) on delete cascade,
  interviewer_id uuid not null references auth.users(id),
  rating         integer check (rating between 1 and 5),
  recommendation text check (recommendation in ('strong_yes', 'yes', 'no', 'strong_no')),
  notes          text,
  created_at     timestamptz not null default now(),
  unique (interview_id, interviewer_id)
);

-- ── Offers ──────────────────────────────────────────────────────────────
create table if not exists public.offers (
  id               uuid primary key default gen_random_uuid(),
  application_id   uuid not null references public.job_applications(id) on delete cascade,
  salary_offered   numeric,
  salary_currency  text default 'USD',
  start_date       date,
  status           text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'declined', 'rescinded')),
  created_by       uuid references auth.users(id),
  sent_at          timestamptz,
  responded_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists offers_app_idx on public.offers(application_id);

-- ── HCM handoff (Job Seeker -> Candidate -> Employee, no duplicate identity) ─
create table if not exists public.hcm_transfers (
  id                 uuid primary key default gen_random_uuid(),
  application_id     uuid references public.job_applications(id) on delete set null,
  company_id         uuid not null references public.companies(id) on delete cascade,
  candidate_user_id  uuid not null references auth.users(id),
  employee_name      text,
  contact_email      text,
  contact_phone      text,
  job_title          text,
  department          text,
  salary_rate         numeric,
  start_date          date,
  supervisor          text,
  location             text,
  status               text not null default 'pending' check (status in ('pending', 'transferred', 'failed')),
  external_employee_id text,
  payload               jsonb default '{}'::jsonb,
  transferred_at        timestamptz,
  created_at            timestamptz not null default now()
);

create index if not exists hcm_transfers_company_idx on public.hcm_transfers(company_id);

-- ── Salary intelligence (modular — source is swappable data, UI stable) ─────
create table if not exists public.salary_insights (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid references public.companies(id) on delete cascade,
  requested_by      uuid references auth.users(id),
  job_title         text not null,
  location          text,
  experience_level  text,
  industry          text,
  company_size      text,
  low               numeric,
  median            numeric,
  high              numeric,
  recommendation    text,
  source            text not null default 'placeholder',
  created_at        timestamptz not null default now()
);

-- ── Local talent market intelligence (modular — placeholder data for now) ───
create table if not exists public.market_insights (
  id                                  uuid primary key default gen_random_uuid(),
  company_id                          uuid references public.companies(id) on delete cascade,
  job_id                              uuid references public.jobs(id) on delete cascade,
  location                            text,
  skill_profile                       text[] default '{}',
  talent_availability_estimate        integer,
  remote_hybrid_preference_pct        numeric,
  hiring_difficulty                   text,
  compensation_competitiveness_pct    numeric,
  candidate_supply_radius_miles       integer,
  candidate_supply_level              text,
  source                              text not null default 'placeholder',
  created_at                          timestamptz not null default now()
);

-- ── Subscription plans (admin-configurable, not hard-coded) ─────────────────
create table if not exists public.subscription_plans (
  id                       uuid primary key default gen_random_uuid(),
  code                     text not null unique,
  name                     text not null,
  description              text,
  price_monthly            numeric,
  price_annual             numeric,
  max_active_jobs          integer,
  max_candidate_searches_per_month integer,
  max_hiring_team_users    integer,
  features                 jsonb default '[]'::jsonb,
  is_active                boolean not null default true,
  sort_order               integer not null default 0,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- ── Company subscriptions ───────────────────────────────────────────────
create table if not exists public.company_subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  company_id               uuid not null unique references public.companies(id) on delete cascade,
  plan_id                  uuid references public.subscription_plans(id),
  status                   text not null default 'trialing' check (status in ('trialing', 'active', 'past_due', 'canceled')),
  stripe_customer_id       text,
  stripe_subscription_id   text,
  current_period_end       timestamptz,
  seats                    integer,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- ── Per-company feature entitlement overrides (beyond plan defaults) ───────
create table if not exists public.feature_entitlements (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  feature_key   text not null,
  limit_value   integer,
  enabled       boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (company_id, feature_key)
);

-- ── Seed default plans (idempotent) ─────────────────────────────────────
insert into public.subscription_plans (code, name, description, price_monthly, price_annual, max_active_jobs, max_candidate_searches_per_month, max_hiring_team_users, features, sort_order)
values
  ('starter', 'Starter', 'For small employers with occasional hiring.', 99, 990, 2, 10, 1,
    '["basic_ats", "limited_candidate_search", "basic_salary_insights"]'::jsonb, 1),
  ('growth', 'Growth', 'For organizations that hire regularly.', 299, 2990, 10, 100, 5,
    '["full_ats", "candidate_sourcing", "candidate_matching", "salary_intelligence", "hiring_market_insights", "multi_user"]'::jsonb, 2),
  ('professional', 'Professional', 'For larger organizations.', 799, 7990, null, null, null,
    '["full_ats", "advanced_sourcing", "advanced_market_intelligence", "recruiting_analytics", "multi_location", "team_permissions", "priority_support"]'::jsonb, 3)
on conflict (code) do nothing;

-- ── updated_at maintenance ──────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'companies', 'employer_profiles', 'employer_memberships', 'jobs', 'job_applications',
    'interviews', 'offers', 'subscription_plans', 'company_subscriptions', 'feature_entitlements',
    'candidate_search_preferences'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ── Row level security ───────────────────────────────────────────────────
alter table public.companies enable row level security;
alter table public.employer_profiles enable row level security;
alter table public.employer_memberships enable row level security;
alter table public.jobs enable row level security;
alter table public.job_applications enable row level security;
alter table public.candidate_pipeline_events enable row level security;
alter table public.candidate_notes enable row level security;
alter table public.candidate_assignments enable row level security;
alter table public.saved_candidates enable row level security;
alter table public.candidate_search_preferences enable row level security;
alter table public.candidate_matches enable row level security;
alter table public.interviews enable row level security;
alter table public.interview_interviewers enable row level security;
alter table public.interview_feedback enable row level security;
alter table public.offers enable row level security;
alter table public.hcm_transfers enable row level security;
alter table public.salary_insights enable row level security;
alter table public.market_insights enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.company_subscriptions enable row level security;
alter table public.feature_entitlements enable row level security;

-- ── Helper functions ────────────────────────────────────────────────────
create or replace function public.is_active_employer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.employer_memberships m
    where m.user_id = auth.uid() and m.is_active = true
  );
$$;

create or replace function public.is_company_member(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.employer_memberships m
    where m.company_id = target_company_id
      and m.user_id = auth.uid()
      and m.is_active = true
  );
$$;

create or replace function public.is_company_admin(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.employer_memberships m
    where m.company_id = target_company_id
      and m.user_id = auth.uid()
      and m.is_active = true
      and m.role = 'company_admin'
  );
$$;

create or replace function public.job_company_id(target_job_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from public.jobs where id = target_job_id;
$$;

create or replace function public.application_company_id(target_application_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select j.company_id
  from public.job_applications a
  join public.jobs j on j.id = a.job_id
  where a.id = target_application_id;
$$;

-- Atomically create a company plus its first company_admin membership,
-- avoiding the chicken-and-egg RLS problem of inserting into companies
-- before a membership row exists.
create or replace function public.create_company_and_admin(
  company_name text,
  website text default null,
  industry text default null,
  company_size text default null,
  employee_count integer default null,
  headquarters_location text default null,
  hiring_locations text[] default '{}',
  annual_hiring_volume text default null,
  contact_full_name text default null,
  contact_phone text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_company_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  insert into public.companies (
    name, website, industry, company_size, employee_count,
    headquarters_location, hiring_locations, annual_hiring_volume, created_by
  ) values (
    company_name, website, industry, company_size, employee_count,
    headquarters_location, coalesce(hiring_locations, '{}'), annual_hiring_volume, auth.uid()
  ) returning id into new_company_id;

  insert into public.employer_profiles (id, full_name, email, phone)
  values (auth.uid(), contact_full_name, (select email from auth.users where id = auth.uid()), contact_phone)
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, public.employer_profiles.full_name),
    phone = coalesce(excluded.phone, public.employer_profiles.phone),
    updated_at = now();

  insert into public.employer_memberships (company_id, user_id, role, is_active, is_primary_contact)
  values (new_company_id, auth.uid(), 'company_admin', true, true);

  insert into public.company_subscriptions (company_id, plan_id, status)
  select new_company_id, id, 'trialing' from public.subscription_plans where code = 'starter';

  return new_company_id;
end;
$$;

revoke all on function public.create_company_and_admin(text, text, text, text, integer, text, text[], text, text, text) from public;
grant execute on function public.create_company_and_admin(text, text, text, text, integer, text, text[], text, text, text) to authenticated;

-- Invite an existing Jobvair user (by email) onto the hiring team. Only a
-- company_admin may call this. The invited user must already have a Jobvair
-- account (no new-account creation happens here).
create or replace function public.invite_employer_member(
  target_company_id uuid,
  member_email text,
  member_role text default 'recruiter'
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_user_id uuid;
begin
  if not public.is_company_admin(target_company_id) and not public.is_active_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if member_role not in ('company_admin', 'recruiter', 'hiring_manager') then
    raise exception 'invalid role';
  end if;

  select id into target_user_id from auth.users where lower(email) = lower(member_email);
  if target_user_id is null then
    raise exception 'no Jobvair account found for that email';
  end if;

  insert into public.employer_profiles (id, full_name, email)
  values (target_user_id, null, member_email)
  on conflict (id) do nothing;

  insert into public.employer_memberships (company_id, user_id, role, is_active, invited_by)
  values (target_company_id, target_user_id, member_role, true, auth.uid())
  on conflict (company_id, user_id) do update set
    role = excluded.role,
    is_active = true,
    updated_at = now();

  return target_user_id;
end;
$$;

revoke all on function public.invite_employer_member(uuid, text, text) from public;
grant execute on function public.invite_employer_member(uuid, text, text) to authenticated;

-- ── Policies ────────────────────────────────────────────────────────────

drop policy if exists "companies_select_member_or_admin" on public.companies;
create policy "companies_select_member_or_admin"
on public.companies for select
to authenticated
using (public.is_company_member(id) or public.is_active_admin());

drop policy if exists "companies_update_admin" on public.companies;
create policy "companies_update_admin"
on public.companies for update
to authenticated
using (public.is_company_admin(id) or public.is_active_admin())
with check (public.is_company_admin(id) or public.is_active_admin());

-- Company creation happens through create_company_and_admin(); block direct inserts
-- from ordinary clients so a company always gets a valid admin membership.
drop policy if exists "companies_insert_admin_only" on public.companies;
create policy "companies_insert_admin_only"
on public.companies for insert
to authenticated
with check (public.is_active_admin());

drop policy if exists "employer_profiles_owner_or_admin" on public.employer_profiles;
create policy "employer_profiles_owner_or_admin"
on public.employer_profiles for all
to authenticated
using (id = auth.uid() or public.is_active_admin())
with check (id = auth.uid() or public.is_active_admin());

drop policy if exists "employer_memberships_select_own_company_or_admin" on public.employer_memberships;
create policy "employer_memberships_select_own_company_or_admin"
on public.employer_memberships for select
to authenticated
using (public.is_company_member(company_id) or public.is_active_admin());

drop policy if exists "employer_memberships_manage_company_admin" on public.employer_memberships;
create policy "employer_memberships_manage_company_admin"
on public.employer_memberships for all
to authenticated
using (public.is_company_admin(company_id) or public.is_active_admin())
with check (public.is_company_admin(company_id) or public.is_active_admin());

-- Jobs: published jobs are readable by any authenticated job seeker; the
-- owning company's members can read/manage everything including drafts.
drop policy if exists "jobs_select_published_or_member" on public.jobs;
create policy "jobs_select_published_or_member"
on public.jobs for select
to authenticated
using (status = 'published' or public.is_company_member(company_id) or public.is_active_admin());

drop policy if exists "jobs_insert_member" on public.jobs;
create policy "jobs_insert_member"
on public.jobs for insert
to authenticated
with check (public.is_company_member(company_id) or public.is_active_admin());

drop policy if exists "jobs_update_member" on public.jobs;
create policy "jobs_update_member"
on public.jobs for update
to authenticated
using (public.is_company_member(company_id) or public.is_active_admin())
with check (public.is_company_member(company_id) or public.is_active_admin());

drop policy if exists "jobs_delete_admin" on public.jobs;
create policy "jobs_delete_admin"
on public.jobs for delete
to authenticated
using (public.is_company_admin(company_id) or public.is_active_admin());

-- Job applications: candidate owns their own application; employer company
-- members can read/manage applications to their own jobs.
drop policy if exists "job_applications_select_owner_or_company" on public.job_applications;
create policy "job_applications_select_owner_or_company"
on public.job_applications for select
to authenticated
using (candidate_id = auth.uid() or public.is_company_member(public.job_company_id(job_id)) or public.is_active_admin());

drop policy if exists "job_applications_insert_candidate" on public.job_applications;
create policy "job_applications_insert_candidate"
on public.job_applications for insert
to authenticated
with check (candidate_id = auth.uid());

drop policy if exists "job_applications_update_owner_or_company" on public.job_applications;
create policy "job_applications_update_owner_or_company"
on public.job_applications for update
to authenticated
using (candidate_id = auth.uid() or public.is_company_member(public.job_company_id(job_id)) or public.is_active_admin())
with check (candidate_id = auth.uid() or public.is_company_member(public.job_company_id(job_id)) or public.is_active_admin());

drop policy if exists "candidate_pipeline_events_company" on public.candidate_pipeline_events;
create policy "candidate_pipeline_events_company"
on public.candidate_pipeline_events for all
to authenticated
using (public.is_company_member(public.application_company_id(application_id)) or public.is_active_admin())
with check (public.is_company_member(public.application_company_id(application_id)) or public.is_active_admin());

drop policy if exists "candidate_notes_company" on public.candidate_notes;
create policy "candidate_notes_company"
on public.candidate_notes for all
to authenticated
using (public.is_company_member(public.application_company_id(application_id)) or public.is_active_admin())
with check (public.is_company_member(public.application_company_id(application_id)) or public.is_active_admin());

drop policy if exists "candidate_assignments_company" on public.candidate_assignments;
create policy "candidate_assignments_company"
on public.candidate_assignments for all
to authenticated
using (public.is_company_member(public.application_company_id(application_id)) or public.is_active_admin())
with check (public.is_company_member(public.application_company_id(application_id)) or public.is_active_admin());

drop policy if exists "saved_candidates_company" on public.saved_candidates;
create policy "saved_candidates_company"
on public.saved_candidates for all
to authenticated
using (public.is_company_member(company_id) or public.is_active_admin())
with check (public.is_company_member(company_id) or public.is_active_admin());

-- Candidates manage their own privacy preference; employers/admins may read it
-- (used to gate whether a candidate shows up in talent search).
drop policy if exists "candidate_search_preferences_owner_write" on public.candidate_search_preferences;
create policy "candidate_search_preferences_owner_write"
on public.candidate_search_preferences for all
to authenticated
using (user_id = auth.uid() or public.is_active_admin())
with check (user_id = auth.uid());

drop policy if exists "candidate_search_preferences_employer_read" on public.candidate_search_preferences;
create policy "candidate_search_preferences_employer_read"
on public.candidate_search_preferences for select
to authenticated
using (user_id = auth.uid() or public.is_active_employer() or public.is_active_admin());

drop policy if exists "candidate_matches_company" on public.candidate_matches;
create policy "candidate_matches_company"
on public.candidate_matches for select
to authenticated
using (candidate_id = auth.uid() or public.is_company_member(public.job_company_id(job_id)) or public.is_active_admin());

drop policy if exists "interviews_company" on public.interviews;
create policy "interviews_company"
on public.interviews for all
to authenticated
using (public.is_company_member(public.application_company_id(application_id)) or public.is_active_admin())
with check (public.is_company_member(public.application_company_id(application_id)) or public.is_active_admin());

drop policy if exists "interview_interviewers_company" on public.interview_interviewers;
create policy "interview_interviewers_company"
on public.interview_interviewers for all
to authenticated
using (
  exists (select 1 from public.interviews i where i.id = interview_id
    and (public.is_company_member(public.application_company_id(i.application_id)) or public.is_active_admin()))
)
with check (
  exists (select 1 from public.interviews i where i.id = interview_id
    and (public.is_company_member(public.application_company_id(i.application_id)) or public.is_active_admin()))
);

drop policy if exists "interview_feedback_company" on public.interview_feedback;
create policy "interview_feedback_company"
on public.interview_feedback for all
to authenticated
using (
  exists (select 1 from public.interviews i where i.id = interview_id
    and (public.is_company_member(public.application_company_id(i.application_id)) or public.is_active_admin()))
)
with check (
  exists (select 1 from public.interviews i where i.id = interview_id
    and (public.is_company_member(public.application_company_id(i.application_id)) or public.is_active_admin()))
);

drop policy if exists "offers_company" on public.offers;
create policy "offers_company"
on public.offers for all
to authenticated
using (public.is_company_member(public.application_company_id(application_id)) or public.is_active_admin())
with check (public.is_company_member(public.application_company_id(application_id)) or public.is_active_admin());

drop policy if exists "hcm_transfers_company" on public.hcm_transfers;
create policy "hcm_transfers_company"
on public.hcm_transfers for all
to authenticated
using (public.is_company_member(company_id) or public.is_active_admin())
with check (public.is_company_member(company_id) or public.is_active_admin());

drop policy if exists "salary_insights_company" on public.salary_insights;
create policy "salary_insights_company"
on public.salary_insights for all
to authenticated
using (company_id is null or public.is_company_member(company_id) or public.is_active_admin())
with check (public.is_company_member(company_id) or public.is_active_admin());

drop policy if exists "market_insights_company" on public.market_insights;
create policy "market_insights_company"
on public.market_insights for all
to authenticated
using (company_id is null or public.is_company_member(company_id) or public.is_active_admin())
with check (public.is_company_member(company_id) or public.is_active_admin());

drop policy if exists "subscription_plans_read_active_or_admin" on public.subscription_plans;
create policy "subscription_plans_read_active_or_admin"
on public.subscription_plans for select
to authenticated
using (is_active = true or public.is_active_admin());

drop policy if exists "subscription_plans_admin_write" on public.subscription_plans;
create policy "subscription_plans_admin_write"
on public.subscription_plans for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

drop policy if exists "company_subscriptions_company" on public.company_subscriptions;
create policy "company_subscriptions_company"
on public.company_subscriptions for select
to authenticated
using (public.is_company_member(company_id) or public.is_active_admin());

drop policy if exists "company_subscriptions_admin_write" on public.company_subscriptions;
create policy "company_subscriptions_admin_write"
on public.company_subscriptions for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

drop policy if exists "feature_entitlements_company_read" on public.feature_entitlements;
create policy "feature_entitlements_company_read"
on public.feature_entitlements for select
to authenticated
using (public.is_company_member(company_id) or public.is_active_admin());

drop policy if exists "feature_entitlements_admin_write" on public.feature_entitlements;
create policy "feature_entitlements_admin_write"
on public.feature_entitlements for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

-- ── Employer read access to a candidate's Jobvair profile ─────────────────
-- An employer company member may read (never write) the structured profile
-- of a candidate who has applied to one of their jobs. This is additive to
-- the existing owner-or-admin policies from 0002 (RLS policies for the same
-- command are OR'd together), so candidate-owned write access is unchanged.
create or replace function public.is_employer_of_applicant(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.job_applications a
    join public.jobs j on j.id = a.job_id
    where a.candidate_id = target_user_id
      and public.is_company_member(j.company_id)
  );
$$;

drop policy if exists "profiles_select_employer_of_applicant" on public.profiles;
create policy "profiles_select_employer_of_applicant"
on public.profiles for select
to authenticated
using (public.is_employer_of_applicant(id));

drop policy if exists "candidate_skills_select_employer_of_applicant" on public.candidate_skills;
create policy "candidate_skills_select_employer_of_applicant"
on public.candidate_skills for select
to authenticated
using (public.is_employer_of_applicant(user_id));

drop policy if exists "candidate_work_select_employer_of_applicant" on public.candidate_work_experience;
create policy "candidate_work_select_employer_of_applicant"
on public.candidate_work_experience for select
to authenticated
using (public.is_employer_of_applicant(user_id));

drop policy if exists "candidate_education_select_employer_of_applicant" on public.candidate_education;
create policy "candidate_education_select_employer_of_applicant"
on public.candidate_education for select
to authenticated
using (public.is_employer_of_applicant(user_id));

drop policy if exists "candidate_certifications_select_employer_of_applicant" on public.candidate_certifications;
create policy "candidate_certifications_select_employer_of_applicant"
on public.candidate_certifications for select
to authenticated
using (public.is_employer_of_applicant(user_id));

drop policy if exists "resumes_select_employer_of_applicant" on public.resumes;
create policy "resumes_select_employer_of_applicant"
on public.resumes for select
to authenticated
using (public.is_employer_of_applicant(user_id));

drop policy if exists "identity_verifications_select_employer_of_applicant" on public.identity_verifications;
create policy "identity_verifications_select_employer_of_applicant"
on public.identity_verifications for select
to authenticated
using (public.is_employer_of_applicant(user_id));

-- ── Employer dashboard metrics RPC ─────────────────────────────────────
create or replace function public.get_employer_dashboard_metrics(target_company_id uuid)
returns table (
  active_jobs integer,
  total_applicants integer,
  new_applicants_7d integer,
  candidates_under_review integer,
  interviews_scheduled integer,
  offers_extended integer,
  hires integer,
  jobs_nearing_expiration integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_company_member(target_company_id) and not public.is_active_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return query
  select
    (select count(*)::integer from public.jobs where company_id = target_company_id and status = 'published') as active_jobs,
    (select count(*)::integer from public.job_applications a join public.jobs j on j.id = a.job_id where j.company_id = target_company_id) as total_applicants,
    (select count(*)::integer from public.job_applications a join public.jobs j on j.id = a.job_id where j.company_id = target_company_id and a.applied_at >= now() - interval '7 days') as new_applicants_7d,
    (select count(*)::integer from public.job_applications a join public.jobs j on j.id = a.job_id where j.company_id = target_company_id and a.current_stage in ('screening', 'qualified')) as candidates_under_review,
    (select count(*)::integer from public.interviews i join public.job_applications a on a.id = i.application_id join public.jobs j on j.id = a.job_id where j.company_id = target_company_id and i.status in ('requested', 'scheduled')) as interviews_scheduled,
    (select count(*)::integer from public.offers o join public.job_applications a on a.id = o.application_id join public.jobs j on j.id = a.job_id where j.company_id = target_company_id and o.status in ('sent', 'accepted')) as offers_extended,
    (select count(*)::integer from public.job_applications a join public.jobs j on j.id = a.job_id where j.company_id = target_company_id and a.current_stage = 'hired') as hires,
    (select count(*)::integer from public.jobs where company_id = target_company_id and status = 'published' and published_at is not null and published_at <= now() - interval '23 days') as jobs_nearing_expiration;
end;
$$;

revoke all on function public.get_employer_dashboard_metrics(uuid) from public;
grant execute on function public.get_employer_dashboard_metrics(uuid) to authenticated;

notify pgrst, 'reload schema';
