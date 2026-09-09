-- Lightweight candidate outreach v1: lets an employer send a direct message
-- or an interview invitation to an applicant by email, alongside the
-- existing assessment-invite flow. Both are logged as candidate_notes so
-- the pipeline history shows what was sent and when — 'message' joins the
-- existing 'internal'/'interview' note types.

alter table public.candidate_notes drop constraint if exists candidate_notes_note_type_check;
alter table public.candidate_notes add constraint candidate_notes_note_type_check
  check (note_type in ('internal', 'interview', 'message'));

notify pgrst, 'reload schema';
