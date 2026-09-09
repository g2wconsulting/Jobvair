# Supabase Edge Functions

This directory documents the Edge Functions currently expected by the Jobvair frontend.

Most historical function implementations are not present in this repository yet. Export them from the live Supabase project or recreate them from these contracts before treating the backend as version-controlled.

Expected functions:

- `parse-resume`
- `analyze-resume`
- `generate-cover-letter`
- `create-checkout-session`
- `create-billing-portal-session`
- `create-identity-session`
- `builder-assistant` mock skeleton for Resume Assistant contract testing
- `invite-employer-member` — see its own `README.md`
- `get-assessment-attempt`, `submit-assessment-response`, `submit-assessment-attempt` — Jobvair Assess candidate flow, see below
- `_shared/` — not a deployable function; `aiScoring.ts` and `scoring.ts` are imported by the assessment functions above

Common requirements:

- Most calls are authenticated by the frontend with `Authorization: Bearer <supabase access token>`. The three `*-assessment-*` functions are the exception — candidates never log in, so they're called with the anon key as the bearer token (satisfies the Functions gateway's JWT check) and do their own authorization by validating a per-invitation secure token against `assessment_invitations.invite_token`. See `src/lib/assessmentFetch.js`.
- Functions should verify the JWT (or, for the candidate-facing three, the invite token) and derive identity from that, not trust client-supplied ids blindly.
- Functions that access private storage or write privileged billing/verification rows should use server-side service role credentials.
- The `*-assessment-*` functions use the service-role key for every operation (not just privileged ones) because their RLS policies lock question content/answer keys down to admins — the Edge Function is the only path that can read them, and it strips correct answers before returning anything to the browser.
- No API keys or secrets should be committed to this repository.

Server-side environment variables to confirm from live Supabase:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY` or equivalent AI provider key
- `OPENAI_API_KEY` if OpenAI is used
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PREMIUM`
- `STRIPE_PRICE_PREMIUM_PLUS`
- `STRIPE_PRICE_RECRUITER_LOOK`
- `SITE_URL`
