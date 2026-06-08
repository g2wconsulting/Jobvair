# Jobvair Environment Variables

This document lists environment variables expected by the current frontend and backend scaffold.

Do not commit real secrets or API keys.

## Frontend Vite Variables

These are read by browser code and must use the `VITE_` prefix.

| Variable | Required | Secret | Purpose |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | Yes | No | Supabase project URL used by the browser client and Edge Function base URL. |
| `VITE_SUPABASE_ANON_KEY` | Yes | No | Supabase anon/public key used by the browser client. RLS must protect data. |
| `VITE_STRIPE_PRICE_PREMIUM` | Yes | No | Stripe price id for the Pro plan. |
| `VITE_STRIPE_PRICE_PREMIUM_PLUS` | Yes | No | Stripe price id for the Career+ plan. |
| `VITE_STRIPE_PRICE_RECRUITER_LOOK` | Yes | No | Stripe price id for the recruiter review add-on. |

## Optional Runtime Override

| Variable | Required | Secret | Purpose |
| --- | --- | --- | --- |
| `window.__SUPABASE_EDGE_URL__` | No | No | Optional browser runtime override for the Edge Function base URL. |

## Supabase Edge Function Secrets

Confirm exact names from the live Supabase dashboard before implementing functions.

| Variable | Required | Secret | Purpose |
| --- | --- | --- | --- |
| `SUPABASE_URL` | Yes | No | Supabase project URL for server-side clients. |
| `SUPABASE_ANON_KEY` | Sometimes | No | Public key if a function needs an anon client. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Yes | Server-side privileged database/storage access. Never expose to the browser. |
| `STRIPE_SECRET_KEY` | Yes | Yes | Creates Checkout, Billing Portal, and Identity sessions. |
| `STRIPE_WEBHOOK_SECRET` | Yes | Yes | Verifies Stripe webhook signatures. |
| `STRIPE_PRICE_PREMIUM` | Yes | No | Server-side price id for Pro plan, if not using client-supplied ids. |
| `STRIPE_PRICE_PREMIUM_PLUS` | Yes | No | Server-side price id for Career+ plan. |
| `STRIPE_PRICE_RECRUITER_LOOK` | Yes | No | Server-side price id for recruiter review add-on. |
| `SITE_URL` | Yes | No | Default redirect/return URL for Stripe flows. |
| `ANTHROPIC_API_KEY` | To confirm | Yes | AI provider key if Anthropic powers resume parsing/analysis. |
| `OPENAI_API_KEY` | To confirm | Yes | AI provider key if OpenAI powers resume parsing/analysis. |

## Manual Follow-up

- Remove hardcoded Stripe price fallbacks from frontend code in a later stabilization step after environment handling is verified.
- Confirm whether Anthropic, OpenAI, or another model provider is used in the live Edge Functions.
- Confirm Supabase Auth redirect URLs for local and production environments.
