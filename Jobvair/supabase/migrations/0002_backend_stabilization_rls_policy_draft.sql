-- Jobvair backend stabilization RLS policy draft.
--
-- Important:
--   This is inferred from frontend behavior. Compare with live Supabase
--   policies before applying. These policies assume authenticated users own
--   rows by id or user_id, and admins are listed in public.admin_users.

alter table public.profiles enable row level security;
alter table public.candidate_skills enable row level security;
alter table public.candidate_work_experience enable row level security;
alter table public.candidate_education enable row level security;
alter table public.candidate_certifications enable row level security;
alter table public.resumes enable row level security;
alter table public.resume_sections enable row level security;
alter table public.work_experience_entries enable row level security;
alter table public.resume_templates enable row level security;
alter table public.parsed_resumes enable row level security;
alter table public.identity_verifications enable row level security;
alter table public.subscriptions enable row level security;
alter table public.admin_users enable row level security;
alter table public.ai_analyses enable row level security;

create or replace function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users a
    where a.id = auth.uid()
      and a.is_active = true
  );
$$;

-- Profiles: users manage their own profile. Admins can read.
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_active_admin());

drop policy if exists "profiles_upsert_own" on public.profiles;
create policy "profiles_upsert_own"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Generic candidate-owned tables.
drop policy if exists "candidate_skills_owner_all" on public.candidate_skills;
create policy "candidate_skills_owner_all"
on public.candidate_skills for all
to authenticated
using (user_id = auth.uid() or public.is_active_admin())
with check (user_id = auth.uid() or public.is_active_admin());

drop policy if exists "candidate_work_owner_all" on public.candidate_work_experience;
create policy "candidate_work_owner_all"
on public.candidate_work_experience for all
to authenticated
using (user_id = auth.uid() or public.is_active_admin())
with check (user_id = auth.uid() or public.is_active_admin());

drop policy if exists "candidate_education_owner_all" on public.candidate_education;
create policy "candidate_education_owner_all"
on public.candidate_education for all
to authenticated
using (user_id = auth.uid() or public.is_active_admin())
with check (user_id = auth.uid() or public.is_active_admin());

drop policy if exists "candidate_certifications_owner_all" on public.candidate_certifications;
create policy "candidate_certifications_owner_all"
on public.candidate_certifications for all
to authenticated
using (user_id = auth.uid() or public.is_active_admin())
with check (user_id = auth.uid() or public.is_active_admin());

drop policy if exists "resumes_owner_all" on public.resumes;
create policy "resumes_owner_all"
on public.resumes for all
to authenticated
using (user_id = auth.uid() or public.is_active_admin())
with check (user_id = auth.uid() or public.is_active_admin());

drop policy if exists "resume_sections_owner_all" on public.resume_sections;
create policy "resume_sections_owner_all"
on public.resume_sections for all
to authenticated
using (user_id = auth.uid() or public.is_active_admin())
with check (user_id = auth.uid() or public.is_active_admin());

drop policy if exists "work_entries_owner_all" on public.work_experience_entries;
create policy "work_entries_owner_all"
on public.work_experience_entries for all
to authenticated
using (user_id = auth.uid() or public.is_active_admin())
with check (user_id = auth.uid() or public.is_active_admin());

drop policy if exists "parsed_resumes_owner_all" on public.parsed_resumes;
create policy "parsed_resumes_owner_all"
on public.parsed_resumes for all
to authenticated
using (user_id = auth.uid() or public.is_active_admin())
with check (user_id = auth.uid() or public.is_active_admin());

drop policy if exists "identity_verifications_owner_read" on public.identity_verifications;
create policy "identity_verifications_owner_read"
on public.identity_verifications for select
to authenticated
using (user_id = auth.uid() or public.is_active_admin());

drop policy if exists "identity_verifications_admin_write" on public.identity_verifications;
create policy "identity_verifications_admin_write"
on public.identity_verifications for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

drop policy if exists "subscriptions_owner_read" on public.subscriptions;
create policy "subscriptions_owner_read"
on public.subscriptions for select
to authenticated
using (user_id = auth.uid() or public.is_active_admin());

drop policy if exists "subscriptions_admin_write" on public.subscriptions;
create policy "subscriptions_admin_write"
on public.subscriptions for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

-- Resume templates: candidates read active templates; admins manage all.
drop policy if exists "resume_templates_read_active_or_admin" on public.resume_templates;
create policy "resume_templates_read_active_or_admin"
on public.resume_templates for select
to authenticated
using (is_active = true or public.is_active_admin());

drop policy if exists "resume_templates_admin_write" on public.resume_templates;
create policy "resume_templates_admin_write"
on public.resume_templates for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

-- Admin registry: admins can read active admin rows. Adding/removing admins
-- should be done manually by service role or a trusted admin function.
drop policy if exists "admin_users_read_admins" on public.admin_users;
create policy "admin_users_read_admins"
on public.admin_users for select
to authenticated
using (id = auth.uid() or public.is_active_admin());

drop policy if exists "ai_analyses_owner_read" on public.ai_analyses;
create policy "ai_analyses_owner_read"
on public.ai_analyses for select
to authenticated
using (user_id = auth.uid() or public.is_active_admin());

drop policy if exists "ai_analyses_owner_insert" on public.ai_analyses;
create policy "ai_analyses_owner_insert"
on public.ai_analyses for insert
to authenticated
with check (user_id = auth.uid() or public.is_active_admin());

-- Views:
--   platform_analytics and admin_candidate_view should be exposed only to
--   admins. In Supabase, prefer security_invoker views plus underlying RLS,
--   or wrap admin analytics in Edge Functions/service-role RPCs.
