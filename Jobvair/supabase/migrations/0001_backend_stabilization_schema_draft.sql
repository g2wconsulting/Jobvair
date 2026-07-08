-- Jobvair backend stabilization schema draft.
--
-- Purpose:
--   Capture the database shape currently expected by the frontend so the
--   backend can be brought under version control.
--
-- Important:
--   This file is inferred from client code. Export the live Supabase schema
--   and reconcile differences before applying this migration to any project.
--   Do not treat this as an authoritative production dump.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  location text,
  city text,
  state text,
  zip_code text,
  country text default 'US',
  summary text,
  desired_titles text[] default '{}',
  industries text[] default '{}',
  availability text,
  employment_status text,
  salary_level text,
  salary_target text,
  employment_types text[] default '{}',
  work_locations text[] default '{}',
  background_check boolean default false,
  wotc_eligible boolean default false,
  sponsorship_required boolean default false,
  open_to_relocation boolean default false,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  total_years_experience numeric,
  total_years_leadership numeric,
  total_years_industry numeric,
  highest_education_level text,
  security_clearance text,
  work_authorization text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.candidate_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_name text not null,
  category text,
  years_experience numeric,
  proficiency_level text,
  last_used_date date,
  is_primary boolean default false,
  source text default 'manual',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, skill_name)
);

create table if not exists public.candidate_work_experience (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_title text,
  company text,
  location text,
  start_date date,
  end_date date,
  is_current boolean default false,
  description text,
  is_leadership boolean default false,
  industry text,
  source text default 'manual',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.candidate_education (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  institution text,
  degree text,
  major text,
  graduation_year integer,
  is_highest boolean default false,
  source text default 'manual',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.candidate_certifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  issuing_org text,
  issue_date date,
  expiry_date date,
  credential_id text,
  source text default 'manual',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.resume_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  tier text default 'free',
  category text,
  color text,
  accent_color text,
  sort_order integer default 0,
  is_active boolean default true,
  is_featured boolean default false,
  is_premium boolean default false,
  preview_image_url text,
  font_family text,
  base_font_size integer default 13,
  header_style text,
  heading_style text,
  layout_type text,
  page_margin text,
  section_spacing text,
  ats_friendly boolean default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.parsed_resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  original_filename text,
  parse_status text default 'processing',
  parsed_json jsonb,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  template text,
  selected_template_id uuid references public.resume_templates(id) on delete set null,
  is_primary boolean default false,
  storage_path text,
  parsed_resume_id uuid references public.parsed_resumes(id) on delete set null,
  sections jsonb default '[]'::jsonb,
  contact_fields jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.resume_sections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_id uuid not null references public.resumes(id) on delete cascade,
  section_type text not null,
  label text,
  content jsonb default '{}'::jsonb,
  display_order integer default 0,
  is_visible boolean default true,
  is_required boolean default false,
  layout_config_json jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.work_experience_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_id uuid not null references public.resumes(id) on delete cascade,
  job_title text,
  company text,
  location text,
  start_date date,
  end_date date,
  is_current boolean default false,
  description text,
  bullet_points text[] default '{}',
  skills_used text[] default '{}',
  achievements text[] default '{}',
  display_order integer default 0,
  is_visible boolean default true,
  source text default 'manual',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.identity_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text default 'not_started',
  stripe_verification_session_id text,
  verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text default 'free',
  status text default 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id)
);

create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text default 'admin',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Placeholder for future durable AI history. The current frontend renders
-- AI history from seed data and does not query this table yet.
create table if not exists public.ai_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete set null,
  job_title text,
  company text,
  job_description text,
  match_score numeric,
  result_json jsonb,
  created_at timestamptz default now()
);

create index if not exists candidate_skills_user_idx on public.candidate_skills(user_id);
create index if not exists candidate_work_user_idx on public.candidate_work_experience(user_id);
create index if not exists candidate_education_user_idx on public.candidate_education(user_id);
create index if not exists candidate_certifications_user_idx on public.candidate_certifications(user_id);
create index if not exists resumes_user_updated_idx on public.resumes(user_id, updated_at desc);
create index if not exists resume_sections_resume_order_idx on public.resume_sections(resume_id, display_order);
create index if not exists work_entries_resume_order_idx on public.work_experience_entries(resume_id, display_order);
create index if not exists parsed_resumes_user_idx on public.parsed_resumes(user_id);

create or replace view public.admin_candidate_view as
select
  u.id,
  p.full_name,
  coalesce(p.email, u.email) as email,
  p.location,
  p.total_years_experience,
  p.highest_education_level,
  coalesce(s.plan, 'free') as subscription_plan,
  coalesce(s.status, 'active') as subscription_status,
  coalesce(v.status, 'not_started') as verification_status,
  coalesce(skill_counts.skill_count, 0) as skill_count,
  coalesce(resume_counts.resume_count, 0) as resume_count,
  coalesce(analysis_counts.analysis_count, 0) as analysis_count,
  u.created_at as account_created_at
from auth.users u
left join public.profiles p on p.id = u.id
left join public.subscriptions s on s.user_id = u.id
left join public.identity_verifications v on v.user_id = u.id
left join (
  select user_id, count(*)::integer as skill_count
  from public.candidate_skills
  group by user_id
) skill_counts on skill_counts.user_id = u.id
left join (
  select user_id, count(*)::integer as resume_count
  from public.resumes
  group by user_id
) resume_counts on resume_counts.user_id = u.id
left join (
  select user_id, count(*)::integer as analysis_count
  from public.ai_analyses
  group by user_id
) analysis_counts on analysis_counts.user_id = u.id;

create or replace view public.platform_analytics as
select
  (select count(*)::integer from auth.users) as total_users,
  (select count(*)::integer from auth.users where created_at >= now() - interval '7 days') as new_users_7d,
  (select count(*)::integer from auth.users where created_at >= now() - interval '30 days') as new_users_30d,
  (select count(*)::integer from public.subscriptions where plan <> 'free') as paid_subscribers,
  (select count(*)::integer from public.subscriptions where plan = 'premium') as premium_count,
  (select count(*)::integer from public.subscriptions where plan = 'premium_plus') as premium_plus_count,
  (select count(*)::integer from public.identity_verifications where status = 'verified') as verified_users,
  (select count(*)::integer from public.ai_analyses) as ai_analyses_run,
  (select count(*)::integer from public.parsed_resumes) as resumes_parsed,
  (select count(*)::integer from public.resumes) as total_resumes,
  (select count(*)::integer from public.candidate_skills) as total_skills_entered;

-- Keep updated_at current for tables that the app updates.
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_candidate_skills_updated_at on public.candidate_skills;
create trigger set_candidate_skills_updated_at before update on public.candidate_skills
for each row execute function public.set_updated_at();

drop trigger if exists set_resume_templates_updated_at on public.resume_templates;
create trigger set_resume_templates_updated_at before update on public.resume_templates
for each row execute function public.set_updated_at();

drop trigger if exists set_resumes_updated_at on public.resumes;
create trigger set_resumes_updated_at before update on public.resumes
for each row execute function public.set_updated_at();
