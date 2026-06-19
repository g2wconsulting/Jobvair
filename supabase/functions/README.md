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

Common requirements:

- All calls are authenticated by the frontend with `Authorization: Bearer <supabase access token>`.
- Functions should verify the JWT and derive the user from the token, not trust `user_id` blindly.
- Functions that access private storage or write privileged billing/verification rows should use server-side service role credentials.
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
