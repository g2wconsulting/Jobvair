-- Jobvair Assess: question-bank assessment engine.
--
-- Replaces the placeholder assessment_results table from
-- 0014_employer_assessments.sql with a real engine: assessments are built
-- from reusable sections and a question bank (not hard-coded), candidates
-- take them through a secure token link (no candidate login), and scoring
-- is computed server-side (Edge Functions using the service-role key —
-- never trust a client-submitted score).
--
-- Security model:
--   * questions/question_options/assessment_questions/question_banks hold
--     answer keys and are LOCKED DOWN at the RLS level (admin-only SELECT).
--     Both the employer preview and the candidate delivery path go through
--     Edge Functions using the service-role key, which strip
--     correct_answer/rubric/explanation before returning anything to a
--     browser. No client role can read answer keys directly, even via a
--     raw REST call.
--   * assessment_attempts/assessment_responses/assessment_scores/
--     assessment_section_scores are written only by Edge Functions
--     (service role bypasses RLS). Employers get read-only access scoped
--     to their own company via is_company_member(), reusing the helpers
--     from 0011_employer_portal_foundation.sql.
--   * assessments/assessment_sections carry no secrets, so read access is
--     a bit more open (published rows readable by any authenticated user)
--     to support a future admin/library browsing UI.

drop table if exists public.assessment_results;

-- ── Question bank ──────────────────────────────────────────────────────
create table if not exists public.question_banks (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text,
  skill       text,
  description text,
  created_at  timestamptz not null default now()
);

create table if not exists public.questions (
  id                uuid primary key default gen_random_uuid(),
  question_bank_id  uuid references public.question_banks(id) on delete set null,
  type              text not null check (type in (
                      'multiple_choice_single', 'multiple_choice_multiple', 'true_false',
                      'short_answer', 'numeric', 'long_form_written',
                      'typing_exercise', 'data_entry_exercise', 'file_upload',
                      'scenario_judgment', 'table_interpretation'
                    )),
  prompt            text not null,
  media_url         text,
  difficulty        text default 'intermediate',
  points            numeric not null default 1,
  correct_answer    jsonb,   -- shape depends on type; null for ai_rubric-scored types
  rubric            jsonb,   -- scoring rubric for long_form_written (ai_rubric scoring)
  explanation       text,
  tags              text[] default '{}',
  is_active         boolean not null default true,
  version           integer not null default 1,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.question_options (
  id             uuid primary key default gen_random_uuid(),
  question_id    uuid not null references public.questions(id) on delete cascade,
  label          text not null,
  value          text not null,
  is_correct     boolean not null default false,
  display_order  integer not null default 0
);

create index if not exists question_options_question_idx on public.question_options(question_id);

-- ── Assessments (built from sections, sections built from pooled questions) ──
create table if not exists public.assessments (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique, -- stable id referenced by assessment_invitations.assessment_ids
  name                  text not null,
  category              text not null,
  description           text,
  status                text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  estimated_minutes     integer,
  passing_score         numeric default 70,
  time_limit_minutes    integer,
  randomize_questions   boolean not null default true,
  randomize_options     boolean not null default true,
  scoring_method        text not null default 'deterministic' check (scoring_method in ('deterministic', 'ai_rubric', 'mixed')),
  instructions          text,
  version               integer not null default 1,
  created_by            uuid references auth.users(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table if not exists public.assessment_sections (
  id                  uuid primary key default gen_random_uuid(),
  assessment_id       uuid not null references public.assessments(id) on delete cascade,
  name                text not null,
  description         text,
  display_order       integer not null default 0,
  time_limit_minutes  integer,
  weight              numeric not null default 1,
  questions_to_draw   integer, -- null = use every assigned question; N = randomly draw N from the pool
  created_at          timestamptz not null default now()
);

create index if not exists assessment_sections_assessment_idx on public.assessment_sections(assessment_id, display_order);

create table if not exists public.assessment_questions (
  id             uuid primary key default gen_random_uuid(),
  section_id     uuid not null references public.assessment_sections(id) on delete cascade,
  question_id    uuid not null references public.questions(id) on delete cascade,
  display_order  integer not null default 0,
  unique (section_id, question_id)
);

create index if not exists assessment_questions_section_idx on public.assessment_questions(section_id);

-- ── Attempts, responses, scoring ─────────────────────────────────────────
create table if not exists public.assessment_attempts (
  id                          uuid primary key default gen_random_uuid(),
  invitation_id               uuid not null references public.assessment_invitations(id) on delete cascade,
  candidate_user_id           uuid references auth.users(id) on delete set null,
  status                      text not null default 'in_progress' check (status in ('in_progress', 'submitted', 'scored', 'expired')),
  question_selection          jsonb not null default '{}'::jsonb, -- { [section_id]: [question_id, ...] } drawn once at first load, reused after
  certification_accepted_at   timestamptz,
  certification_ip            text,
  user_agent                  text,
  started_at                  timestamptz not null default now(),
  submitted_at                timestamptz,
  created_at                  timestamptz not null default now(),
  unique (invitation_id)
);

create table if not exists public.assessment_responses (
  id             uuid primary key default gen_random_uuid(),
  attempt_id     uuid not null references public.assessment_attempts(id) on delete cascade,
  assessment_slug text not null,
  section_id     uuid references public.assessment_sections(id) on delete set null,
  question_id    uuid references public.questions(id) on delete set null,
  question_type  text not null,
  response       jsonb not null default '{}'::jsonb,
  is_correct     boolean,
  points_awarded numeric,
  points_possible numeric,
  ai_result      jsonb,
  answered_at    timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create index if not exists assessment_responses_attempt_idx on public.assessment_responses(attempt_id);

create table if not exists public.assessment_scores (
  id               uuid primary key default gen_random_uuid(),
  attempt_id       uuid not null references public.assessment_attempts(id) on delete cascade,
  assessment_id    uuid not null references public.assessments(id) on delete cascade,
  assessment_slug  text not null,
  points_earned    numeric not null default 0,
  points_possible  numeric not null default 0,
  overall_score    numeric not null default 0, -- percentage, 0-100
  passed           boolean,
  metrics          jsonb default '{}'::jsonb,  -- e.g. { wpm, net_wpm, accuracy } for typing
  scored_at        timestamptz not null default now(),
  unique (attempt_id, assessment_id)
);

create index if not exists assessment_scores_attempt_idx on public.assessment_scores(attempt_id);

create table if not exists public.assessment_section_scores (
  id              uuid primary key default gen_random_uuid(),
  score_id        uuid not null references public.assessment_scores(id) on delete cascade,
  section_id      uuid references public.assessment_sections(id) on delete set null,
  section_name    text not null,
  points_earned   numeric not null default 0,
  points_possible numeric not null default 0,
  percentage      numeric not null default 0
);

create index if not exists assessment_section_scores_score_idx on public.assessment_section_scores(score_id);

-- ── AI usage / cost tracking ─────────────────────────────────────────────
create table if not exists public.ai_usage (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid references public.companies(id) on delete set null,
  candidate_email  text,
  assessment_slug  text,
  action           text not null,
  model            text,
  input_tokens     integer,
  output_tokens    integer,
  estimated_cost   numeric,
  created_at       timestamptz not null default now()
);

create index if not exists ai_usage_company_idx on public.ai_usage(company_id);

-- ── Triggers ──────────────────────────────────────────────────────────────
drop trigger if exists set_assessments_updated_at on public.assessments;
create trigger set_assessments_updated_at before update on public.assessments
for each row execute function public.set_updated_at();

drop trigger if exists set_questions_updated_at on public.questions;
create trigger set_questions_updated_at before update on public.questions
for each row execute function public.set_updated_at();

-- ── Row level security ────────────────────────────────────────────────────
alter table public.question_banks enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_sections enable row level security;
alter table public.assessment_questions enable row level security;
alter table public.assessment_attempts enable row level security;
alter table public.assessment_responses enable row level security;
alter table public.assessment_scores enable row level security;
alter table public.assessment_section_scores enable row level security;
alter table public.ai_usage enable row level security;

-- Question bank content holds answer keys — admin-only. All employer/
-- candidate access goes through Edge Functions using the service role.
drop policy if exists "question_banks_admin_all" on public.question_banks;
create policy "question_banks_admin_all"
on public.question_banks for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

drop policy if exists "questions_admin_all" on public.questions;
create policy "questions_admin_all"
on public.questions for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

drop policy if exists "question_options_admin_all" on public.question_options;
create policy "question_options_admin_all"
on public.question_options for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

drop policy if exists "assessment_questions_admin_all" on public.assessment_questions;
create policy "assessment_questions_admin_all"
on public.assessment_questions for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

-- Assessments/sections carry no secrets — readable once published.
drop policy if exists "assessments_read_published_or_admin" on public.assessments;
create policy "assessments_read_published_or_admin"
on public.assessments for select
to authenticated
using (status = 'published' or public.is_active_admin());

drop policy if exists "assessments_admin_write" on public.assessments;
create policy "assessments_admin_write"
on public.assessments for insert
to authenticated
with check (public.is_active_admin());

drop policy if exists "assessments_admin_update" on public.assessments;
create policy "assessments_admin_update"
on public.assessments for update
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

drop policy if exists "assessment_sections_read_admin_or_published" on public.assessment_sections;
create policy "assessment_sections_read_admin_or_published"
on public.assessment_sections for select
to authenticated
using (
  public.is_active_admin()
  or exists (select 1 from public.assessments a where a.id = assessment_sections.assessment_id and a.status = 'published')
);

-- Attempts/responses/scores: written only by service-role Edge Functions
-- (which bypass RLS). Employers get read-only access to their own
-- company's data; no INSERT/UPDATE/DELETE policy exists for authenticated
-- users, so the client can never write or tamper with a score.
drop policy if exists "assessment_attempts_company_read" on public.assessment_attempts;
create policy "assessment_attempts_company_read"
on public.assessment_attempts for select
to authenticated
using (
  public.is_active_admin()
  or exists (
    select 1 from public.assessment_invitations i
    where i.id = assessment_attempts.invitation_id
      and public.is_company_member(i.company_id)
  )
);

drop policy if exists "assessment_responses_company_read" on public.assessment_responses;
create policy "assessment_responses_company_read"
on public.assessment_responses for select
to authenticated
using (
  public.is_active_admin()
  or exists (
    select 1 from public.assessment_attempts att
    join public.assessment_invitations i on i.id = att.invitation_id
    where att.id = assessment_responses.attempt_id
      and public.is_company_member(i.company_id)
  )
);

drop policy if exists "assessment_scores_company_read" on public.assessment_scores;
create policy "assessment_scores_company_read"
on public.assessment_scores for select
to authenticated
using (
  public.is_active_admin()
  or exists (
    select 1 from public.assessment_attempts att
    join public.assessment_invitations i on i.id = att.invitation_id
    where att.id = assessment_scores.attempt_id
      and public.is_company_member(i.company_id)
  )
);

drop policy if exists "assessment_section_scores_company_read" on public.assessment_section_scores;
create policy "assessment_section_scores_company_read"
on public.assessment_section_scores for select
to authenticated
using (
  public.is_active_admin()
  or exists (
    select 1 from public.assessment_scores sc
    join public.assessment_attempts att on att.id = sc.attempt_id
    join public.assessment_invitations i on i.id = att.invitation_id
    where sc.id = assessment_section_scores.score_id
      and public.is_company_member(i.company_id)
  )
);

drop policy if exists "ai_usage_company_read" on public.ai_usage;
create policy "ai_usage_company_read"
on public.ai_usage for select
to authenticated
using (public.is_active_admin() or public.is_company_member(company_id));
