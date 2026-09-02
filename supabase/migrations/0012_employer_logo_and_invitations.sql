-- Jobvair employer portal: company logo storage + real email invitations.
--
-- Additive to 0011_employer_portal_foundation.sql. Adds:
--   1. A public "company-logos" storage bucket, writable only by members of
--      the owning company (folder-scoped, same pattern as the "resumes"
--      bucket in 0003).
--   2. employer_invitations — tracks a pending/accepted/revoked invite by
--      email, independent of whether the invitee already has a Jobvair
--      account. The actual invite email is sent by the invite-employer-member
--      Edge Function (which needs the service-role key to call
--      auth.admin.inviteUserByEmail); this table is what the UI reads/writes
--      and what a freshly-invited user's session gets reconciled against.
--   3. accept_pending_invitation() — called once a user is authenticated, to
--      turn a matching pending invitation into a real employer_membership.

-- ── Company logo storage ───────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('company-logos', 'company-logos', true)
on conflict (id) do nothing;

drop policy if exists "company_logos_public_read" on storage.objects;
create policy "company_logos_public_read"
on storage.objects for select
to public
using (bucket_id = 'company-logos');

drop policy if exists "company_logos_member_write" on storage.objects;
create policy "company_logos_member_write"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'company-logos'
  and public.is_company_member((storage.foldername(name))[1]::uuid)
);

drop policy if exists "company_logos_member_update" on storage.objects;
create policy "company_logos_member_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'company-logos'
  and public.is_company_member((storage.foldername(name))[1]::uuid)
)
with check (
  bucket_id = 'company-logos'
  and public.is_company_member((storage.foldername(name))[1]::uuid)
);

drop policy if exists "company_logos_member_delete" on storage.objects;
create policy "company_logos_member_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'company-logos'
  and public.is_company_member((storage.foldername(name))[1]::uuid)
);

-- ── Invitations ─────────────────────────────────────────────────────────
create table if not exists public.employer_invitations (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  email          text not null,
  role           text not null default 'recruiter' check (role in ('company_admin', 'recruiter', 'hiring_manager')),
  invited_by     uuid references auth.users(id),
  status         text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  invited_user_id uuid references auth.users(id),
  created_at     timestamptz not null default now(),
  accepted_at    timestamptz,
  expires_at     timestamptz not null default (now() + interval '14 days')
);

create index if not exists employer_invitations_company_idx on public.employer_invitations(company_id);
create index if not exists employer_invitations_email_idx on public.employer_invitations(lower(email));

alter table public.employer_invitations enable row level security;

drop policy if exists "employer_invitations_company_manage" on public.employer_invitations;
create policy "employer_invitations_company_manage"
on public.employer_invitations for all
to authenticated
using (public.is_company_admin(company_id) or public.is_active_admin())
with check (public.is_company_admin(company_id) or public.is_active_admin());

-- A signed-in user may see invitations addressed to their own verified email
-- (used to reconcile a fresh invite-link signup into the right company).
drop policy if exists "employer_invitations_select_own_email" on public.employer_invitations;
create policy "employer_invitations_select_own_email"
on public.employer_invitations for select
to authenticated
using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

create or replace function public.accept_pending_invitation()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
  my_email text;
begin
  if auth.uid() is null then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  my_email := auth.jwt() ->> 'email';
  if my_email is null then
    return null;
  end if;

  select * into inv
  from public.employer_invitations
  where lower(email) = lower(my_email)
    and status = 'pending'
    and expires_at > now()
  order by created_at desc
  limit 1;

  if inv.id is null then
    return null;
  end if;

  insert into public.employer_profiles (id, email)
  values (auth.uid(), my_email)
  on conflict (id) do nothing;

  insert into public.employer_memberships (company_id, user_id, role, is_active, invited_by)
  values (inv.company_id, auth.uid(), inv.role, true, inv.invited_by)
  on conflict (company_id, user_id) do update set
    role = excluded.role,
    is_active = true,
    updated_at = now();

  update public.employer_invitations
  set status = 'accepted', invited_user_id = auth.uid(), accepted_at = now()
  where id = inv.id;

  return inv.company_id;
end;
$$;

revoke all on function public.accept_pending_invitation() from public;
grant execute on function public.accept_pending_invitation() to authenticated;

notify pgrst, 'reload schema';
