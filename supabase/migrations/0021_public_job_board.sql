-- Public, search-indexable job board. Adds a URL-friendly slug to jobs and
-- opens read access to *published* jobs (and their owning company's public
-- profile fields) to the anon role — today jobs are only readable by
-- authenticated users, so a web crawler with no Jobvair session gets
-- nothing back. Visibility still respects the same 'public_job_board'
-- feature flag used elsewhere (see src/employer/featureFlags.js) via
-- company_has_public_job_board(), so a company can be opted out even
-- though the column-level access is broad.

alter table public.jobs add column if not exists slug text;

-- Backfill slugs for existing rows: title, kebab-cased, with a short id
-- suffix to guarantee uniqueness without a human ever seeing a collision.
update public.jobs
set slug = lower(regexp_replace(regexp_replace(coalesce(title, 'job'), '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')) || '-' || substr(id::text, 1, 8)
where slug is null;

alter table public.jobs alter column slug set not null;
create unique index if not exists jobs_slug_key on public.jobs(slug);

-- Auto-generate a slug for new jobs that don't set one explicitly.
create or replace function public.set_job_slug()
returns trigger
language plpgsql
as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := lower(regexp_replace(regexp_replace(coalesce(new.title, 'job'), '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')) || '-' || substr(new.id::text, 1, 8);
  end if;
  return new;
end;
$$;

drop trigger if exists set_job_slug on public.jobs;
create trigger set_job_slug before insert on public.jobs
  for each row execute function public.set_job_slug();

-- Whether a company's published jobs should appear on the public board.
-- Mirrors the client-side default in src/employer/featureFlags.js
-- (public_job_board defaults on; an explicit entitlement row can turn it
-- off for a specific client).
create or replace function public.company_has_public_job_board(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select enabled from public.feature_entitlements
     where company_id = target_company_id and feature_key = 'public_job_board'),
    true
  );
$$;

drop policy if exists "jobs_select_public_anon" on public.jobs;
create policy "jobs_select_public_anon"
on public.jobs for select
to anon
using (status = 'published' and public.company_has_public_job_board(company_id));

drop policy if exists "companies_select_public_anon" on public.companies;
create policy "companies_select_public_anon"
on public.companies for select
to anon
using (
  exists (
    select 1 from public.jobs j
    where j.company_id = companies.id
      and j.status = 'published'
      and public.company_has_public_job_board(companies.id)
  )
);

notify pgrst, 'reload schema';
