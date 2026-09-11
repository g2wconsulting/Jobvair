-- Jobvair Assess: employer-owned (Judiciary-authored) assessments.
--
-- Per the Maryland Judiciary SOW, authorized personnel must be able to
-- create and manage their own assessments/questions "without routine
-- assistance from the Successful Offeror" — not just send Jobvair's
-- master library. This adds a nullable company_id to assessments and
-- question_banks: null means Jobvair-global master content (unchanged,
-- admin-only authoring); non-null means that company's own private
-- content, which its own members can fully author.
--
-- Security model: a company's custom content is isolated from every
-- other company via is_company_member(company_id), the same helper used
-- everywhere else in the employer portal. Global (company_id is null)
-- content keeps the existing admin-only-authoring / published-read rule.
-- Unlike the master bank, a company IS allowed to read/write its own
-- questions' answer keys directly — there's no secrecy concern between a
-- company and its own content, only isolation between companies.

alter table public.assessments add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.assessments add column if not exists icon text;
alter table public.question_banks add column if not exists company_id uuid references public.companies(id) on delete cascade;

create index if not exists assessments_company_idx on public.assessments(company_id);
create index if not exists question_banks_company_idx on public.question_banks(company_id);

-- ── assessments ────────────────────────────────────────────────────────────
drop policy if exists "assessments_read_published_or_admin" on public.assessments;
create policy "assessments_read_published_or_admin"
on public.assessments for select
to authenticated
using (
  public.is_active_admin()
  or (company_id is null and status = 'published')
  or (company_id is not null and public.is_company_member(company_id))
);

drop policy if exists "assessments_admin_write" on public.assessments;
create policy "assessments_insert_admin_or_company_owner"
on public.assessments for insert
to authenticated
with check (
  public.is_active_admin()
  or (company_id is not null and public.is_company_member(company_id))
);

drop policy if exists "assessments_admin_update" on public.assessments;
create policy "assessments_update_admin_or_company_owner"
on public.assessments for update
to authenticated
using (
  public.is_active_admin()
  or (company_id is not null and public.is_company_member(company_id))
)
with check (
  public.is_active_admin()
  or (company_id is not null and public.is_company_member(company_id))
);

drop policy if exists "assessments_delete_admin_or_company_owner" on public.assessments;
create policy "assessments_delete_admin_or_company_owner"
on public.assessments for delete
to authenticated
using (
  public.is_active_admin()
  or (company_id is not null and public.is_company_member(company_id))
);

-- ── assessment_sections ────────────────────────────────────────────────────
drop policy if exists "assessment_sections_read_admin_or_published" on public.assessment_sections;
create policy "assessment_sections_read_admin_or_published"
on public.assessment_sections for select
to authenticated
using (
  public.is_active_admin()
  or exists (
    select 1 from public.assessments a where a.id = assessment_sections.assessment_id
      and ((a.company_id is null and a.status = 'published') or (a.company_id is not null and public.is_company_member(a.company_id)))
  )
);

drop policy if exists "assessment_sections_write_admin_or_company_owner" on public.assessment_sections;
create policy "assessment_sections_write_admin_or_company_owner"
on public.assessment_sections for all
to authenticated
using (
  public.is_active_admin()
  or exists (select 1 from public.assessments a where a.id = assessment_sections.assessment_id and a.company_id is not null and public.is_company_member(a.company_id))
)
with check (
  public.is_active_admin()
  or exists (select 1 from public.assessments a where a.id = assessment_sections.assessment_id and a.company_id is not null and public.is_company_member(a.company_id))
);

-- ── question_banks ─────────────────────────────────────────────────────────
drop policy if exists "question_banks_admin_all" on public.question_banks;
create policy "question_banks_admin_or_company_owner_all"
on public.question_banks for all
to authenticated
using (public.is_active_admin() or (company_id is not null and public.is_company_member(company_id)))
with check (public.is_active_admin() or (company_id is not null and public.is_company_member(company_id)));

-- ── questions / question_options / assessment_questions ───────────────────
-- A company may read/write a question only when it lives in one of that
-- company's own question banks — never the shared master bank, and never
-- another company's bank.
drop policy if exists "questions_admin_all" on public.questions;
create policy "questions_admin_or_company_owner_all"
on public.questions for all
to authenticated
using (
  public.is_active_admin()
  or exists (select 1 from public.question_banks qb where qb.id = questions.question_bank_id and qb.company_id is not null and public.is_company_member(qb.company_id))
)
with check (
  public.is_active_admin()
  or exists (select 1 from public.question_banks qb where qb.id = questions.question_bank_id and qb.company_id is not null and public.is_company_member(qb.company_id))
);

drop policy if exists "question_options_admin_all" on public.question_options;
create policy "question_options_admin_or_company_owner_all"
on public.question_options for all
to authenticated
using (
  public.is_active_admin()
  or exists (
    select 1 from public.questions q
    join public.question_banks qb on qb.id = q.question_bank_id
    where q.id = question_options.question_id and qb.company_id is not null and public.is_company_member(qb.company_id)
  )
)
with check (
  public.is_active_admin()
  or exists (
    select 1 from public.questions q
    join public.question_banks qb on qb.id = q.question_bank_id
    where q.id = question_options.question_id and qb.company_id is not null and public.is_company_member(qb.company_id)
  )
);

drop policy if exists "assessment_questions_admin_all" on public.assessment_questions;
create policy "assessment_questions_admin_or_company_owner_all"
on public.assessment_questions for all
to authenticated
using (
  public.is_active_admin()
  or exists (
    select 1 from public.assessment_sections s join public.assessments a on a.id = s.assessment_id
    where s.id = assessment_questions.section_id and a.company_id is not null and public.is_company_member(a.company_id)
  )
)
with check (
  public.is_active_admin()
  or exists (
    select 1 from public.assessment_sections s join public.assessments a on a.id = s.assessment_id
    where s.id = assessment_questions.section_id and a.company_id is not null and public.is_company_member(a.company_id)
  )
);

-- ── assessment_versions ─────────────────────────────────────────────────────
-- A company may publish/read versions of its own assessments (needed so
-- their custom assessments get the same immutable-snapshot guarantee).
drop policy if exists "assessment_versions_admin_all" on public.assessment_versions;
create policy "assessment_versions_admin_or_company_owner_all"
on public.assessment_versions for all
to authenticated
using (
  public.is_active_admin()
  or exists (select 1 from public.assessments a where a.id = assessment_versions.assessment_id and a.company_id is not null and public.is_company_member(a.company_id))
)
with check (
  public.is_active_admin()
  or exists (select 1 from public.assessments a where a.id = assessment_versions.assessment_id and a.company_id is not null and public.is_company_member(a.company_id))
);
