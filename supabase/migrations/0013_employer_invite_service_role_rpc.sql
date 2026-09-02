-- Fixes invite-employer-member always reporting "not a company admin".
--
-- The Edge Function was authorizing the caller by forwarding their JWT to
-- is_company_admin() / invite_employer_member() through PostgREST, both of
-- which derive identity from auth.uid(). In practice that identity did not
-- reliably carry through on RPC calls made from inside the Edge Function
-- (unlike auth.getUser(jwt), which takes the JWT directly and worked fine),
-- so the admin check always evaluated false even for real company admins.
--
-- Fix: the Edge Function now verifies the caller's identity once via
-- auth.getUser(jwt) (reliable), then does everything else — the admin
-- check and attaching an existing user to the company — through the
-- service-role connection, passing the already-verified user id explicitly
-- instead of re-deriving it via auth.uid(). This function is intentionally
-- restricted to service_role only; it must never be callable by an
-- ordinary authenticated user, since it does not re-check authorization
-- itself (the Edge Function does that with a direct, service-role-scoped
-- read of employer_memberships before calling this).

create or replace function public.attach_existing_employer_member(
  target_company_id uuid,
  member_email text,
  member_role text,
  inviter_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_user_id uuid;
begin
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
  values (target_company_id, target_user_id, member_role, true, inviter_id)
  on conflict (company_id, user_id) do update set
    role = excluded.role,
    is_active = true,
    updated_at = now();

  return target_user_id;
end;
$$;

revoke all on function public.attach_existing_employer_member(uuid, text, text, uuid) from public;
revoke all on function public.attach_existing_employer_member(uuid, text, text, uuid) from authenticated;
grant execute on function public.attach_existing_employer_member(uuid, text, text, uuid) to service_role;

notify pgrst, 'reload schema';
