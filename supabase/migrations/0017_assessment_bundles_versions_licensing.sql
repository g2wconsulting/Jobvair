-- Jobvair Assess: DB-backed bundles, versioning, and usage-allowance
-- licensing.
--
-- Bundles: assessment_bundles/assessment_bundle_items replace the
-- hard-coded BUNDLES array in AssessmentsPage.jsx with admin-manageable
-- content — Jobvair staff can add/retire bundles without a deploy.
--
-- Versioning: an assessment's live sections/questions can keep evolving
-- via the admin CMS, but "Publish" snapshots the full structure
-- (including answer keys/rubric) into assessment_versions. Attempts and
-- scores pin to the exact version_id snapshot in effect when the
-- candidate started, so editing a question bank never silently changes
-- an in-progress or already-scored attempt.
--
-- Licensing: assessment_licenses tracks each company's annual completed-
-- assessment allowance. Enforcement is at the database level via
-- triggers — this holds regardless of which code path creates
-- invitations or marks them completed, not just the app's own checks.

-- ── Bundles ────────────────────────────────────────────────────────────────
create table if not exists public.assessment_bundles (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  description  text,
  icon         text,
  status       text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.assessment_bundle_items (
  id             uuid primary key default gen_random_uuid(),
  bundle_id      uuid not null references public.assessment_bundles(id) on delete cascade,
  assessment_id  uuid not null references public.assessments(id) on delete cascade,
  display_order  integer not null default 0,
  unique (bundle_id, assessment_id)
);

create index if not exists assessment_bundle_items_bundle_idx on public.assessment_bundle_items(bundle_id);

drop trigger if exists set_assessment_bundles_updated_at on public.assessment_bundles;
create trigger set_assessment_bundles_updated_at before update on public.assessment_bundles
for each row execute function public.set_updated_at();

alter table public.assessment_bundles enable row level security;
alter table public.assessment_bundle_items enable row level security;

drop policy if exists "assessment_bundles_read_published_or_admin" on public.assessment_bundles;
create policy "assessment_bundles_read_published_or_admin"
on public.assessment_bundles for select
to authenticated
using (status = 'published' or public.is_active_admin());

drop policy if exists "assessment_bundles_admin_write" on public.assessment_bundles;
create policy "assessment_bundles_admin_write"
on public.assessment_bundles for insert
to authenticated
with check (public.is_active_admin());

drop policy if exists "assessment_bundles_admin_update" on public.assessment_bundles;
create policy "assessment_bundles_admin_update"
on public.assessment_bundles for update
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

drop policy if exists "assessment_bundles_admin_delete" on public.assessment_bundles;
create policy "assessment_bundles_admin_delete"
on public.assessment_bundles for delete
to authenticated
using (public.is_active_admin());

drop policy if exists "assessment_bundle_items_read_admin_or_published" on public.assessment_bundle_items;
create policy "assessment_bundle_items_read_admin_or_published"
on public.assessment_bundle_items for select
to authenticated
using (
  public.is_active_admin()
  or exists (select 1 from public.assessment_bundles b where b.id = assessment_bundle_items.bundle_id and b.status = 'published')
);

drop policy if exists "assessment_bundle_items_admin_write" on public.assessment_bundle_items;
create policy "assessment_bundle_items_admin_write"
on public.assessment_bundle_items for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

-- ── Versioning ──────────────────────────────────────────────────────────────
create table if not exists public.assessment_versions (
  id              uuid primary key default gen_random_uuid(),
  assessment_id   uuid not null references public.assessments(id) on delete cascade,
  version_number  integer not null,
  snapshot        jsonb not null, -- full sections+questions+options, including answer keys/rubric
  published_by    uuid references auth.users(id),
  published_at    timestamptz not null default now(),
  unique (assessment_id, version_number)
);

create index if not exists assessment_versions_assessment_idx on public.assessment_versions(assessment_id);

alter table public.assessments add column if not exists current_version_id uuid references public.assessment_versions(id);

alter table public.assessment_attempts add column if not exists assessment_version_ids jsonb not null default '{}'::jsonb; -- { [assessment_slug]: version_id }
alter table public.assessment_scores add column if not exists assessment_version_id uuid references public.assessment_versions(id);

-- Snapshots contain answer keys — admin-only, same lockdown as questions.
alter table public.assessment_versions enable row level security;

drop policy if exists "assessment_versions_admin_all" on public.assessment_versions;
create policy "assessment_versions_admin_all"
on public.assessment_versions for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

-- ── Usage-allowance licensing ────────────────────────────────────────────────
create table if not exists public.assessment_licenses (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references public.companies(id) on delete cascade unique,
  plan_name         text not null default 'enterprise',
  annual_limit      integer not null default 2000,
  completed_count   integer not null default 0,
  renewal_date      date,
  overage_price     numeric,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists set_assessment_licenses_updated_at on public.assessment_licenses;
create trigger set_assessment_licenses_updated_at before update on public.assessment_licenses
for each row execute function public.set_updated_at();

alter table public.assessment_licenses enable row level security;

drop policy if exists "assessment_licenses_company_read" on public.assessment_licenses;
create policy "assessment_licenses_company_read"
on public.assessment_licenses for select
to authenticated
using (public.is_company_member(company_id) or public.is_active_admin());

drop policy if exists "assessment_licenses_admin_write" on public.assessment_licenses;
create policy "assessment_licenses_admin_write"
on public.assessment_licenses for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

-- Enforce the allowance at insert time. Auto-provisions a default
-- enterprise plan on first send so a company isn't blocked before billing
-- is explicitly configured — the limit still applies from that default.
create or replace function public.check_assessment_license()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  lic public.assessment_licenses;
begin
  select * into lic from public.assessment_licenses where company_id = new.company_id;
  if not found then
    insert into public.assessment_licenses (company_id) values (new.company_id)
    on conflict (company_id) do nothing;
    select * into lic from public.assessment_licenses where company_id = new.company_id;
  end if;
  if lic.completed_count >= lic.annual_limit then
    raise exception 'This company has reached its annual assessment allowance (% / % completed). Contact Jobvair to increase the plan or wait for renewal.', lic.completed_count, lic.annual_limit;
  end if;
  return new;
end;
$$;

drop trigger if exists check_assessment_license_before_invite on public.assessment_invitations;
create trigger check_assessment_license_before_invite
before insert on public.assessment_invitations
for each row execute function public.check_assessment_license();

-- Billing counts completed assessments, not invitations sent — increments
-- only on the sent/in_progress -> completed transition, exactly once.
create or replace function public.increment_assessment_license_usage()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    update public.assessment_licenses
    set completed_count = completed_count + 1
    where company_id = new.company_id;
  end if;
  return new;
end;
$$;

drop trigger if exists increment_assessment_license_usage_after_update on public.assessment_invitations;
create trigger increment_assessment_license_usage_after_update
after update on public.assessment_invitations
for each row execute function public.increment_assessment_license_usage();
