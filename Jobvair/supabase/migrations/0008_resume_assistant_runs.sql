-- Resume Assistant Phase 4: run persistence.
--
-- Purpose:
--   Give the builder-assistant Edge Function a place to record each
--   assistant invocation for auditability, debugging, and a future history
--   UI. This is intentionally a separate table from ai_analyses so we don't
--   widen that table's meaning.
--
-- Compatibility:
--   Additive only. Nothing reads or writes this table yet outside the
--   builder-assistant Edge Function (server-side, service role) and the
--   owner-scoped select policy below.

create table if not exists public.resume_assistant_runs (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  resume_id         uuid references public.resumes(id) on delete set null,
  instruction       text,
  job_description   text,
  input_snapshot    jsonb not null default '{}'::jsonb,
  response_json     jsonb not null default '{}'::jsonb,
  status            text not null default 'completed' check (status in ('completed', 'error', 'mock')),
  error_message     text,
  created_at        timestamptz not null default now()
);

comment on table public.resume_assistant_runs is
  'Audit log of Resume Assistant invocations. Written server-side only by the builder-assistant Edge Function.';
comment on column public.resume_assistant_runs.input_snapshot is
  'The BuilderAssistantPayload sent to the assistant for this run.';
comment on column public.resume_assistant_runs.response_json is
  'The AssistantResponse returned for this run (including mock/error fallbacks).';
comment on column public.resume_assistant_runs.status is
  'completed = real AI provider response, mock = local/dev fallback, error = provider failure fallback.';

create index if not exists resume_assistant_runs_user_idx
  on public.resume_assistant_runs(user_id, created_at desc);
create index if not exists resume_assistant_runs_resume_idx
  on public.resume_assistant_runs(resume_id, created_at desc);

alter table public.resume_assistant_runs enable row level security;

-- Owners and admins can read their own run history.
drop policy if exists "resume_assistant_runs_select_own_or_admin" on public.resume_assistant_runs;
create policy "resume_assistant_runs_select_own_or_admin"
on public.resume_assistant_runs for select
to authenticated
using (user_id = auth.uid() or public.is_active_admin());

-- Writes are intended for the Edge Function using the service role key only.
-- No insert/update/delete policy is granted to the authenticated role, so
-- browser clients cannot write rows directly even if they try.
