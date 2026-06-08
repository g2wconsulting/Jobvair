# Backend Backup Checklist

Use this checklist before refactoring `App.jsx` or changing backend-dependent app behavior.

Do not commit production data, service-role keys, Stripe secrets, webhook secrets, user PII, or real API keys.

## Preflight

1. Install or use the Supabase CLI locally.
2. Get the Supabase project ref from the Dashboard URL:
   `https://supabase.com/dashboard/project/<PROJECT_REF>`.
3. Create a private local backup folder, for example:
   `backups/supabase-live-YYYY-MM-DD/`.
4. Keep raw production data exports private and encrypted.
5. Commit only reviewed schema, migrations, sanitized configuration docs, and function source.

## Suggested Backup Commands

```bash
supabase link --project-ref <PROJECT_REF>

supabase db dump --linked -f backups/supabase-live-YYYY-MM-DD/schema.sql
supabase db dump --linked --role-only -f backups/supabase-live-YYYY-MM-DD/roles.sql
supabase db dump --linked --data-only -f backups/supabase-live-YYYY-MM-DD/data.sql
```

Commit reviewed schema/migrations/docs only. Do not commit `data.sql` unless it is sanitized seed/reference data.

## Export Checklist

| Item | Where to find it | How to export | Commit to GitHub? | Risk if not backed up |
| --- | --- | --- | --- | --- |
| Database schema | Supabase Dashboard -> Database -> Tables, Schema Visualizer, SQL Editor | Use `supabase db dump --linked -f backups/.../schema.sql`. Also export roles with `supabase db dump --linked --role-only -f backups/.../roles.sql`. | Yes, after review as migrations/schema docs. Do not commit raw dumps if they contain sensitive comments/data. | You cannot recreate production structure reliably. Refactors may break hidden constraints, indexes, defaults, or extensions. |
| Tables | Dashboard -> Table Editor -> each table | Schema is included in `schema.sql`. Data can be exported through Table Editor CSV export or `supabase db dump --data-only`. | Table definitions yes. Production data no. Sanitized seed/reference data maybe. | Loss of column definitions, defaults, indexes, constraints, and seed records such as resume templates. |
| Views | Dashboard -> Database -> Views or SQL Editor | Included in schema dump. Also inspect with `select schemaname, viewname, definition from pg_views where schemaname in ('public');`. | Yes. | Admin pages may fail because views such as `admin_candidate_view` and `platform_analytics` are frontend dependencies. |
| Triggers | Dashboard -> Database -> table details, or SQL Editor | Included in schema dump. Also inspect `information_schema.triggers` and `pg_trigger`. | Yes. | Timestamp automation, profile creation, audit behavior, or webhook side effects may disappear. |
| Postgres functions | Dashboard -> Database -> Functions or SQL Editor | Included in schema dump. Also inspect with `pg_get_functiondef` for functions in `public` and any private app schema. | Yes, unless a function contains hardcoded secrets. | RLS helpers, admin checks, computed behavior, or triggers can break. |
| RLS policies | Dashboard -> Table Editor -> table -> RLS/policies, or SQL Editor | Included in schema dump if captured. Also run `select * from pg_policies where schemaname in ('public','storage') order by schemaname, tablename, policyname;`. | Yes. RLS is security source code. | Candidate/admin data may be exposed or blocked incorrectly by the browser Supabase client. |
| Storage policies | Dashboard -> Storage -> bucket -> Policies | Export bucket settings manually. Export policies from `pg_policies` where `schemaname = 'storage'`, especially `storage.objects`. | Yes for bucket config and policies. No for stored resume files or PII. | Resume uploads/parsing may fail, or private resumes may become accessible incorrectly. |
| Edge Functions | Dashboard -> Edge Functions -> each function; Dashboard -> Edge Functions -> Secrets | If source is not local, use Supabase Management API to list functions and retrieve function bodies. Export secret names only from Dashboard or `supabase secrets list`. | Function source yes. Secret names yes. Secret values no. | Stripe checkout, billing portal, identity verification, resume parsing, AI analysis, and cover letters cannot be restored or audited. |
| Auth settings | Dashboard -> Authentication -> URL Configuration, Providers, Email Templates, Rate Limits/Security | Manually document or screenshot settings. Email templates can also be fetched with the Supabase Management API config endpoint. Record Site URL, redirect URLs, providers, SMTP setting names, and email templates. | Sanitized config/docs yes. Provider secrets no. | Login, signup confirmation, reset password, OAuth, and redirects can break after deployment or migration. |
| Stripe webhook configuration | Stripe Dashboard -> Developers / Workbench -> Webhooks / Event destinations -> endpoint | Record endpoint URL, enabled events, API version, mode, description, and status. Store the signing secret only in a secure secret manager. | Endpoint metadata yes. Signing secret no. | Subscriptions and Stripe Identity status may stop syncing; users may pay but remain on free plans, or verification may never update. |

## Manual Supabase Exports To Capture

- Project ref and region.
- Public schema tables, views, functions, triggers, constraints, indexes, and extensions.
- Custom `auth` configuration, redirect URLs, providers, and email templates.
- `storage` buckets and policies.
- Edge Function source for all deployed functions.
- Edge Function `verify_jwt` settings.
- Edge Function secret names only.
- Stripe webhook handler source if deployed as an Edge Function.
- Existing `resume_templates` seed/reference data, sanitized if committed.
- Admin bootstrap process for `admin_users`.

## Manual Stripe Exports To Capture

- Webhook endpoint URL.
- Enabled event list.
- API version used by the webhook endpoint.
- Test vs live mode.
- Endpoint description/status.
- Signing secret stored privately outside GitHub.
- Product and price IDs used by Jobvair, without secret keys.

## Recommended Backup Order

1. Export schema and roles.
2. Export RLS and storage policies.
3. Export Edge Function source and secret names.
4. Export Auth settings.
5. Export Stripe webhook configuration.
6. Reconcile exports against `supabase/` and `docs/`.
7. Begin the `App.jsx` refactor only after backend exports are reviewed.

