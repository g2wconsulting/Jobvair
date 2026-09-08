-- Jobvair Assess: employers table.
--
-- Purpose:
--   Backs the employer record that src/assess.jsx (EmployerShell) reads and
--   auto-creates on first login to the Assess employer portal. Inferred from
--   client code — reconcile with the live schema before applying.

create table if not exists public.employers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_email text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists employers_created_by_idx on public.employers(created_by);

drop trigger if exists set_employers_updated_at on public.employers;
create trigger set_employers_updated_at before update on public.employers
for each row execute function public.set_updated_at();

alter table public.employers enable row level security;

drop policy if exists "employers_owner_all" on public.employers;
create policy "employers_owner_all"
on public.employers for all
to authenticated
using (created_by = auth.uid() or public.is_active_admin())
with check (created_by = auth.uid() or public.is_active_admin());
