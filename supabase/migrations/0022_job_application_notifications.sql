-- Per-job control over how an employer learns about new applicants. Every
-- application still lands in the pipeline (job_applications) regardless —
-- this only controls whether an email also goes out the moment someone
-- applies. Defaults to on so existing jobs keep the (previously unstated)
-- assumption that applicants show up somewhere visible; employers can turn
-- it off per job, or redirect it to a different inbox than their account
-- email (e.g. a hiring-team distribution list).

alter table public.jobs add column if not exists notify_on_application boolean not null default true;
alter table public.jobs add column if not exists notification_email text;

notify pgrst, 'reload schema';
