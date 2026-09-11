-- Hardens the admin console login beyond "password + admin_users row":
--   1. An audit trail of every admin sign-in attempt (success or failure).
--   2. A lockout derived from that trail — 5 failed attempts for the same
--      email within 15 minutes blocks further tries for 15 minutes.
-- TOTP MFA itself needs no schema here — Supabase Auth already stores
-- enrolled factors in auth.mfa_factors; the app enforces AAL2 at login.

create table if not exists public.admin_login_audit (
  id              uuid primary key default gen_random_uuid(),
  email           text not null,
  user_id         uuid references auth.users(id) on delete set null,
  success         boolean not null,
  failure_reason  text,
  user_agent      text,
  created_at      timestamptz not null default now()
);

create index if not exists admin_login_audit_email_created_idx
  on public.admin_login_audit (email, created_at desc);

alter table public.admin_login_audit enable row level security;

drop policy if exists "admin_login_audit_admin_read" on public.admin_login_audit;
create policy "admin_login_audit_admin_read"
on public.admin_login_audit for select
to authenticated
using (public.is_active_admin());

-- No insert/update/delete policy is granted to any role — every write goes
-- through record_admin_login_attempt() below (security definer), including
-- from an unauthenticated caller failing a password check.

-- Records one login attempt. Callable pre-auth (anon) because a failed
-- password check leaves the caller unauthenticated — this is an audit
-- sink, not an authorization check, so it intentionally trusts the email
-- string it's given rather than deriving it from a session.
create or replace function public.record_admin_login_attempt(
  p_email text,
  p_success boolean,
  p_failure_reason text default null,
  p_user_agent text default null,
  p_user_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.admin_login_audit (email, user_id, success, failure_reason, user_agent)
  values (lower(trim(p_email)), p_user_id, p_success, p_failure_reason, p_user_agent);
end;
$$;

-- Reports whether an email is currently locked out, based on failed
-- attempts recorded above. Also callable pre-auth so the login form can
-- check before even attempting a password sign-in.
create or replace function public.is_admin_login_locked(p_email text)
returns table (
  locked boolean,
  locked_until timestamptz,
  failed_attempts integer
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_window interval := interval '15 minutes';
  v_threshold integer := 5;
  v_count integer;
  v_last_failed timestamptz;
begin
  select count(*), max(created_at)
    into v_count, v_last_failed
  from public.admin_login_audit
  where email = lower(trim(p_email))
    and success = false
    and created_at > now() - v_window;

  return query select
    (v_count >= v_threshold) as locked,
    case when v_count >= v_threshold then v_last_failed + v_window else null end as locked_until,
    coalesce(v_count, 0) as failed_attempts;
end;
$$;

-- Admin-facing read of the audit trail for a "Security" page in the console.
create or replace function public.get_admin_login_audit(p_limit integer default 200)
returns setof public.admin_login_audit
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_active_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return query
  select * from public.admin_login_audit
  order by created_at desc
  limit greatest(coalesce(p_limit, 200), 1);
end;
$$;

comment on table public.admin_login_audit is
  'Every admin console login attempt, success or failure. Written only via record_admin_login_attempt(); readable only by active admins.';
comment on function public.record_admin_login_attempt(text, boolean, text, text, uuid) is
  'Audit sink for admin login attempts. Intentionally callable pre-auth (anon) so failed password checks are recorded too.';
comment on function public.is_admin_login_locked(text) is
  'Lockout check: true if 5+ failed admin login attempts for this email in the last 15 minutes.';
comment on function public.get_admin_login_audit(integer) is
  'Admin-only read of the admin login audit trail.';

revoke all on function public.record_admin_login_attempt(text, boolean, text, text, uuid) from public;
revoke all on function public.is_admin_login_locked(text) from public;
revoke all on function public.get_admin_login_audit(integer) from public;

grant execute on function public.record_admin_login_attempt(text, boolean, text, text, uuid) to anon, authenticated;
grant execute on function public.is_admin_login_locked(text) to anon, authenticated;
grant execute on function public.get_admin_login_audit(integer) to authenticated;

notify pgrst, 'reload schema';
