-- Replaces TOTP-based admin 2FA with an emailed one-time code. The code is
-- generated and emailed by the send-admin-otp Edge Function (it needs the
-- Resend secret, so it can't live in a plain SQL function); this migration
-- only adds the storage for it and the verification check, which needs no
-- external call and can safely run as a SECURITY DEFINER RPC.

create table if not exists public.admin_email_otp (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  code_hash   text not null,
  attempts    integer not null default 0,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists admin_email_otp_user_id_idx on public.admin_email_otp (user_id, created_at desc);

alter table public.admin_email_otp enable row level security;
-- No policies granted to any role — every read/write goes through the
-- SECURITY DEFINER functions below (or the service-role Edge Function).

-- Called by the send-admin-otp Edge Function (service role) after it
-- generates and emails the code. Invalidates any prior unused codes for
-- the same user so only the most recent code is ever valid.
create or replace function public.store_admin_email_otp(p_user_id uuid, p_code_hash text, p_ttl_minutes integer default 10)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.admin_email_otp
  set used_at = now()
  where user_id = p_user_id and used_at is null;

  insert into public.admin_email_otp (user_id, code_hash, expires_at)
  values (p_user_id, p_code_hash, now() + make_interval(mins => greatest(coalesce(p_ttl_minutes, 10), 1)));
end;
$$;

-- Called by the client (authenticated as the user attempting to log in)
-- with the plaintext code they received by email.
create or replace function public.verify_admin_email_otp(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_row public.admin_email_otp;
  v_hash text;
begin
  if auth.uid() is null then
    return false;
  end if;

  select * into v_row
  from public.admin_email_otp
  where user_id = auth.uid() and used_at is null
  order by created_at desc
  limit 1;

  if v_row.id is null then
    return false;
  end if;

  if v_row.expires_at < now() then
    return false;
  end if;

  if v_row.attempts >= 5 then
    return false;
  end if;

  v_hash := encode(digest(p_code, 'sha256'), 'hex');

  if v_hash <> v_row.code_hash then
    update public.admin_email_otp set attempts = attempts + 1 where id = v_row.id;
    return false;
  end if;

  update public.admin_email_otp set used_at = now() where id = v_row.id;
  return true;
end;
$$;

comment on table public.admin_email_otp is
  'One-time email verification codes for admin console login. Codes are hashed (sha256); the plaintext only ever exists in the email sent to the user.';
comment on function public.store_admin_email_otp(uuid, text, integer) is
  'Service-role only: records a freshly generated, already-hashed OTP code and invalidates any earlier unused code for the same user.';
comment on function public.verify_admin_email_otp(text) is
  'Verifies a plaintext OTP code against the caller''s (auth.uid()) most recent unused code. Max 5 attempts per code.';

revoke all on function public.store_admin_email_otp(uuid, text, integer) from public;
revoke all on function public.verify_admin_email_otp(text) from public;

-- store_admin_email_otp must only ever be reachable via the Edge Function's
-- service-role connection — granting it to authenticated/anon would let a
-- client fabricate their own "valid" code.
grant execute on function public.store_admin_email_otp(uuid, text, integer) to service_role;
grant execute on function public.verify_admin_email_otp(text) to authenticated;

notify pgrst, 'reload schema';
