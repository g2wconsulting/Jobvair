# Jobvair Development Notes

This document describes the current codebase as inspected from the repository. It is intended for implementation planning and onboarding. It does not describe a finished production backend; the Supabase directory currently contains draft migrations and Edge Function contracts, not complete deployed function source.

## 1. Architecture

Jobvair is a React + Vite browser application backed by Supabase.

Core stack:

- React 19
- Vite 8
- JavaScript modules
- Supabase JS client
- Supabase Auth, Postgres, Storage, Row Level Security, and Edge Functions
- Stripe for subscriptions, billing portal, and identity verification
- AI provider integration through Supabase Edge Functions

Important entry points:

- `index.html` loads `src/main.jsx`, which serves both the candidate app and the admin console from a single entry point.
- `src/main.jsx` dynamically routes to `src/admin.jsx` when the URL path or query contains `admin` (see `vercel.json`'s `/admin` rewrite to `/index.html`); otherwise it loads `src/App.jsx`.
- `src/App.jsx` contains the candidate-facing app shell and most page implementations.
- `src/admin.jsx` contains the admin console. It reuses the candidate app's Resume Builder, Resume Match, and Cover Letter pages directly (passing the admin's own auth user, with no Profile page since it's a master account, not a candidate profile).
- `src/supabaseClient.js` creates the browser Supabase client.
- `src/useProfile.js` loads, maps, saves, and merges profile data.

Current application structure is mostly single-file. The candidate app, resume builder, AI optimizer, billing flows, and upload flows are all implemented inside `src/App.jsx`. This makes the system easy to inspect but increases risk when adding larger features.

Startup commands:

```powershell
npm.cmd run dev
npm.cmd run build
npm.cmd run lint
npm.cmd run preview
```

On this Windows environment, `npm.cmd` is preferable because plain `npm` may be blocked by PowerShell execution policy.

Frontend environment variables currently used:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_STRIPE_PRICE_PREMIUM
VITE_STRIPE_PRICE_PREMIUM_PLUS
VITE_STRIPE_PRICE_RECRUITER_LOOK
```

Server-side secrets documented for Edge Functions:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_PREMIUM
STRIPE_PRICE_PREMIUM_PLUS
STRIPE_PRICE_RECRUITER_LOOK
SITE_URL
ANTHROPIC_API_KEY
OPENAI_API_KEY
```

Do not expose AI, Stripe secret, service role, or Codex credentials through `VITE_` variables. Browser code should call authenticated backend routes only.

## 2. Resume Builder Data Flow

The resume builder lives in `BuilderPage` inside `src/App.jsx`.

Primary in-memory builder state:

- `resumeId`: current persisted resume id.
- `resumeName`: editable resume display name.
- `sections`: array of builder sections such as summary, skills, experience, education, certifications, projects, awards, and custom sections.
- `headerConfig`: resume-specific name, headline, contact fields, visibility flags, and header layout settings.
- `jobEntries`: resume-specific work experience entries.
- `templates`: active templates loaded from Supabase.
- `selectedTmpl`: selected resume template row.
- `customFont`: per-resume font override.
- `headerLayout`: per-resume header layout override.

Initialization flow:

1. `BuilderPage` receives profile data from `App`:
   - `profileForm`
   - `profileSkills`
   - `profileWork`
   - `profileEdu`
   - `user`
2. It loads active rows from `resume_templates`.
3. It loads the most recently updated row from `resumes` for the user.
4. If a resume exists, it loads:
   - `resume_sections` ordered by `display_order`
   - `work_experience_entries` ordered by `display_order`
   - selected template by `selected_template_id`
5. If no resume exists, it builds local defaults from profile data.

Save flow:

1. `saveResume()` updates or inserts a row in `resumes`.
2. It deletes existing `resume_sections` for the resume and inserts the current section array.
3. It stores the resume header as the `content` of the `name` section.
4. It stores `custom_font` and `header_layout` in the `layout_config_json` of the `name` section.
5. It deletes existing `work_experience_entries` for the resume and inserts current job entries.

Import flow:

1. User uploads a PDF, DOC, DOCX, or TXT resume.
2. The browser uploads the file to the private Supabase Storage bucket `resumes`.
3. The browser creates a `parsed_resumes` row with `parse_status = processing`.
4. The browser calls `edgeFetch("parse-resume", ...)`.
5. The returned parsed data updates:
   - `headerConfig`
   - summary, skills, education, and certifications sections
   - `jobEntries`

Export flow:

- The builder uses `html2pdf.js` loaded from a CDN at runtime to export the current preview DOM to PDF.

Important current caveat:

- The builder insert path references `contactFields`, but the current builder state uses `headerConfig`. This looks like a stale variable and should be fixed before adding a larger assistant feature.

## 3. Supabase Schema Currently In Use

The frontend expects these profile tables:

- `profiles`
- `candidate_skills`
- `candidate_work_experience`
- `candidate_education`
- `candidate_certifications`

The resume builder and resume upload flows expect:

- `resumes`
- `resume_sections`
- `work_experience_entries`
- `resume_templates`
- `parsed_resumes`

Billing and verification expect:

- `subscriptions`
- `identity_verifications`

Admin expects:

- `admin_users`
- `admin_candidate_view`
- `platform_analytics`

AI/history scaffolding:

- `ai_analyses`

Storage:

- Private bucket: `resumes`
- Object names use this shape:

```text
<user_id>/<timestamp>_<safe_filename>
```

The database row stores a display/reference path shaped like:

```text
resumes/<user_id>/<timestamp>_<safe_filename>
```

RLS model:

- Owner access is generally keyed by `auth.uid()` matching either `id` or `user_id`.
- Admin access is based on `public.is_active_admin()`, which checks `admin_users`.
- Resume templates are readable when active or when the caller is an active admin.
- Subscriptions and identity verification records are readable by owners and admins, but writes are intended for privileged backend code.

The `supabase/migrations` directory is a stabilization draft, not necessarily a verified export from the live Supabase project. Before production changes, reconcile migrations against the live database, storage policies, functions, triggers, and auth settings.

## 4. AI Integration Points

All current AI-facing browser calls go through `edgeFetch()` in `src/App.jsx`.

Expected Edge Functions:

- `parse-resume`
- `analyze-resume`
- `generate-cover-letter`
- `create-checkout-session`
- `create-billing-portal-session`
- `create-identity-session`

AI-specific functions:

### `parse-resume`

Callers:

- Resume Builder import flow
- Profile resume upload zone

Expected behavior:

- Verify Supabase JWT.
- Ensure the authenticated user matches the requested user.
- Read the uploaded file from private Storage.
- Extract resume text.
- Use an AI provider to return structured resume/profile data.
- Update `parsed_resumes`.

Frontend consumes:

- candidate identity fields
- summary
- skills
- work experience
- education
- certifications
- profile update metadata
- industries
- desired titles

### `analyze-resume`

Caller:

- AI Resume Optimizer page

Expected behavior:

- Verify Supabase JWT.
- Verify resume ownership.
- Compare resume/profile content against a job description.
- Return structured optimization feedback.

Frontend consumes:

- match score
- matching skills
- missing skills
- recommended keywords
- improved summary
- experience suggestions
- career recommendations

### `generate-cover-letter`

Caller:

- Cover Letter Generator page

Expected behavior:

- Verify Supabase JWT.
- Generate a cover letter from the assembled prompt, tone, job title, and company.
- Return generated text in `letter`.

Current AI provider status:

- Docs mention Anthropic or OpenAI, but the actual Edge Function implementations are not in this repository.
- Provider choice and secret names should be confirmed from the live Supabase project before implementation.

## 5. Existing Technical Debt

Known issues from inspection and local verification:

- `src/App.jsx` is very large and contains many unrelated domains in one file.
- `supabase/migrations` are draft stabilization files and may not match production.
- Some values are unused or stale, including `ResumeDocument`, `SEED_RESUMES`, some admin imports, and unused Supabase env reads in the upload zone.
- Some React lint rules flag components declared inside render functions and direct state updates in effects.
- Stripe price ids have frontend fallbacks. These should eventually be removed after environment handling is stable.
- AI analysis history is scaffolded through `ai_analyses`, but the frontend still uses seed or transient data in places.
- Runtime-loaded CDN dependency `html2pdf.js` is convenient but should be reviewed for CSP, availability, and production reliability.
- Vite config uses `__dirname` in an ES module project. The build currently works, but ESLint flags it.

Recommended cleanup before a major assistant feature:

1. Fix the builder's stale `contactFields` reference.
2. Remove or replace undefined builder logout setters.
3. Extract builder helpers and data mappers out of `src/App.jsx`.
4. Commit or intentionally discard the current `docs/` and `supabase/` scaffolding.
5. Export or recreate real Supabase Edge Function source.
6. Bring lint to a known baseline or document accepted rule exceptions.

## 6. Recommended Implementation Plan For A ChatGPT-Powered Resume Assistant

The assistant should be added at the resume builder boundary because the builder already owns the structured resume state and save flow.

Recommended frontend location:

- Add a new assistant panel or command button inside `BuilderPage` in `src/App.jsx`.
- For maintainability, extract the assistant UI into a new module before expanding it beyond a small prototype.

Recommended backend location:

```text
supabase/functions/builder-assistant/
```

or, if the bridge will orchestrate Codex or other repo-writing work:

```text
server/worker or external service + Supabase queue table
```

Use a Supabase Edge Function for resume content suggestions. Use a separate secured worker for Codex-style code changes, repo operations, GitHub changes, or long-running background work.

Do not call OpenAI, ChatGPT, Codex, or GitHub directly from the browser with secret credentials.

### Phase 1: Stabilize Builder Data Contracts

Define a canonical builder payload:

```json
{
  "resume_id": "uuid",
  "user_id": "uuid",
  "resume_name": "My Resume",
  "header": {},
  "sections": [],
  "jobs": [],
  "template": {},
  "profile_context": {}
}
```

Define a canonical assistant response:

```json
{
  "message": "Short human-readable explanation",
  "patch": {
    "header": {},
    "sections": [],
    "jobs": []
  },
  "suggestions": [],
  "warnings": []
}
```

The frontend should preview assistant changes before saving. The user should explicitly apply the patch.

### Phase 2: Add `builder-assistant` Edge Function

Responsibilities:

- Verify the Supabase JWT.
- Derive the user from the JWT instead of trusting `user_id`.
- Verify ownership of `resume_id`.
- Accept builder state and a user instruction.
- Call the AI provider server-side.
- Return structured JSON only.
- Avoid writing changes directly unless a later explicit "apply" endpoint is added.

Initial assistant actions:

- Rewrite summary for a target role.
- Improve bullet points.
- Add measurable impact language.
- Tailor skills to a pasted job description.
- Suggest missing sections.
- Identify weak or empty sections.
- Generate role-specific headline options.

### Phase 3: Add Builder UI

Add a small assistant panel in the builder with:

- instruction text area
- optional job description input
- action presets
- loading and error states
- diff/preview of proposed changes
- "Apply" and "Discard" controls

Apply changes by updating local state:

- `setHeaderConfig`
- `setSections`
- `setJobEntries`

Persist only through the existing `saveResume()` flow.

### Phase 4: Persist Assistant Runs

Add a table such as:

```text
resume_assistant_runs
```

Suggested fields:

- `id`
- `user_id`
- `resume_id`
- `instruction`
- `input_snapshot`
- `response_json`
- `status`
- `created_at`

This gives auditability, debugging data, and a future history UI without mixing assistant runs into `ai_analyses` unless that table is intentionally broadened.

### Phase 5: Optional ChatGPT-to-Codex Bridge

If "Codex bridge" means codebase changes, keep it separate from resume content generation.

Recommended pattern:

1. ChatGPT-style assistant gathers the user's intent in the app.
2. App creates a secure server-side task record.
3. Worker validates authorization and task type.
4. Worker invokes Codex or repository automation outside the browser.
5. Results are written back as task status, logs, branch, PR link, or generated artifact.

Do not let a candidate-facing resume assistant directly trigger arbitrary repository edits. Keep resume content assistance and developer automation as separate permission domains.

### Phase 6: Production Hardening

Before launch:

- Add request size limits.
- Add rate limits per user.
- Add plan-based feature limits.
- Validate all AI JSON responses with a schema.
- Log provider errors without logging secrets.
- Strip or minimize sensitive resume data in logs.
- Add tests for builder payload mapping and assistant patch application.
- Add RLS policies for any new assistant tables.
- Confirm provider terms and data retention behavior.

