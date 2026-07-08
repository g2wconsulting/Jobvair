-- Jobvair security hardening: remove auth.users exposure through public views.
--
-- Problem:
--   Supabase Security Advisor flagged public views that reference auth.users.
--   Public views are exposed through PostgREST and can leak raw auth metadata
--   unless every path is carefully protected.
--
-- Approach:
--   1. Drop public views whose definitions reference auth.users.
--   2. Recreate admin access as SECURITY DEFINER RPC functions with an
--      explicit public.is_active_admin() guard.
--   3. Do not expose raw auth.users through public views.
--
-- Rollback notes:
--   If rollback is required, drop the RPC functions created below and recreate
--   the previous views from migration 0001. That rollback will reintroduce the
--   Security Advisor finding unless the views are moved to a non-exposed schema
--   or protected with a different admin-only mechanism.

-- Drop any public view that references auth.users, including known historical
-- names such as admin_candidate_view, platform_analytics, and any signup
-- analytics view created manually in Supabase.
do $$
declare
  view_record record;
begin
  for view_record in
    select schemaname, viewname
    from pg_views
    where schemaname = 'public'
      and definition ilike '%auth.users%'
  loop
    execute format('drop view if exists %I.%I cascade', view_record.schemaname, view_record.viewname);
    raise notice 'Dropped public view %.% because it referenced auth.users', view_record.schemaname, view_record.viewname;
  end loop;
end $$;

-- Be explicit for known views even if definitions changed or pg_views text did
-- not match due formatting.
drop view if exists public.admin_candidate_view cascade;
drop view if exists public.platform_analytics cascade;
drop view if exists public.signup_analytics cascade;
drop view if exists public.signup_analytics_view cascade;
drop view if exists public.user_signup_analytics cascade;

create or replace function public.get_admin_platform_analytics()
returns table (
  total_users integer,
  new_users_7d integer,
  new_users_30d integer,
  paid_subscribers integer,
  premium_count integer,
  premium_plus_count integer,
  verified_users integer,
  ai_analyses_run integer,
  resumes_parsed integer,
  total_resumes integer,
  total_skills_entered integer
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_active_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return query
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
end;
$$;

create or replace function public.get_admin_candidates()
returns table (
  id uuid,
  full_name text,
  email text,
  location text,
  total_years_experience numeric,
  highest_education_level text,
  subscription_plan text,
  subscription_status text,
  verification_status text,
  skill_count integer,
  resume_count integer,
  analysis_count integer,
  account_created_at timestamptz,
  last_sign_in_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_active_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return query
  select
    u.id,
    p.full_name,
    coalesce(p.email, u.email)::text as email,
    p.location,
    p.total_years_experience,
    p.highest_education_level,
    coalesce(s.plan, 'free')::text as subscription_plan,
    coalesce(s.status, 'active')::text as subscription_status,
    coalesce(v.status, 'not_started')::text as verification_status,
    coalesce(skill_counts.skill_count, 0)::integer as skill_count,
    coalesce(resume_counts.resume_count, 0)::integer as resume_count,
    coalesce(analysis_counts.analysis_count, 0)::integer as analysis_count,
    u.created_at as account_created_at,
    u.last_sign_in_at as last_sign_in_at
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
  ) analysis_counts on analysis_counts.user_id = u.id
  order by u.created_at desc;
end;
$$;

create or replace function public.get_admin_signup_analytics(days_back integer default 30)
returns table (
  signup_date date,
  signup_count integer
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_active_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return query
  select
    u.created_at::date as signup_date,
    count(*)::integer as signup_count
  from auth.users u
  where u.created_at >= current_date - make_interval(days => greatest(coalesce(days_back, 30), 0))
  group by u.created_at::date
  order by signup_date desc;
end;
$$;

comment on function public.get_admin_platform_analytics() is
  'Admin-only RPC replacement for platform_analytics. Reads auth.users only inside a guarded security definer function.';
comment on function public.get_admin_candidates() is
  'Admin-only RPC replacement for admin_candidate_view. Includes account_created_at and last_sign_in_at without exposing auth.users through a public view.';
comment on function public.get_admin_signup_analytics(integer) is
  'Admin-only RPC for signup counts derived from auth.users.created_at.';

revoke all on function public.get_admin_platform_analytics() from public;
revoke all on function public.get_admin_candidates() from public;
revoke all on function public.get_admin_signup_analytics(integer) from public;

grant execute on function public.get_admin_platform_analytics() to authenticated;
grant execute on function public.get_admin_candidates() to authenticated;
grant execute on function public.get_admin_signup_analytics(integer) to authenticated;

-- Force PostgREST/Supabase schema cache reload after replacing views/functions.
notify pgrst, 'reload schema';
