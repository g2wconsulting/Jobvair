# create-billing-portal-session

Frontend caller:

- Billing tab

Request body observed in the app:

```json
{
  "user_id": "uuid",
  "user_email": "candidate@example.com"
}
```

Expected response:

```json
{
  "url": "https://billing.stripe.com/..."
}
```

Expected behavior:

- Verify JWT and ensure authenticated user matches `user_id`.
- Look up the user's Stripe customer id from `subscriptions`.
- Create a Stripe Billing Portal Session.
- Return the portal URL.

Secrets required:

- `STRIPE_SECRET_KEY`
- `SITE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
