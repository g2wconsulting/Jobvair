-- The admin Dashboard's "Total Users" stat counted every auth.users row,
-- which silently mixes candidates with employer-portal users (company
-- admins, recruiters, hiring managers). That made the number look like a
-- candidate count when it wasn't. This splits it into an accurate
-- candidate count and a separate employer-account count.

drop function if exists public.get_admin_platform_analytics();

create function public.get_admin_platform_analytics()
returns table (
  total_candidate_users integer,
  new_candidate_users_7d integer,
  new_candidate_users_30d integer,
  total_employer_users integer,
  total_employer_companies integer,
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
    (select count(*)::integer from auth.users u
       where not exists (select 1 from public.employer_memberships m where m.user_id = u.id)) as total_candidate_users,
    (select count(*)::integer from auth.users u
       where u.created_at >= now() - interval '7 days'
         and not exists (select 1 from public.employer_memberships m where m.user_id = u.id)) as new_candidate_users_7d,
    (select count(*)::integer from auth.users u
       where u.created_at >= now() - interval '30 days'
         and not exists (select 1 from public.employer_memberships m where m.user_id = u.id)) as new_candidate_users_30d,
    (select count(distinct user_id)::integer from public.employer_memberships where is_active = true) as total_employer_users,
    (select count(*)::integer from public.companies) as total_employer_companies,
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

comment on function public.get_admin_platform_analytics() is
  'Admin-only RPC for platform-wide stats. Candidate counts explicitly exclude employer_memberships rows so they are not double-counted as candidates.';

revoke all on function public.get_admin_platform_analytics() from public;
grant execute on function public.get_admin_platform_analytics() to authenticated;

notify pgrst, 'reload schema';
