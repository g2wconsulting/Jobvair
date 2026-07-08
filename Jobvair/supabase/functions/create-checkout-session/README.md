# create-checkout-session

Frontend caller:

- Subscription tab

Request body observed in the app:

```json
{
  "price_id": "price_xxx",
  "user_id": "uuid",
  "user_email": "candidate@example.com"
}
```

Expected response:

```json
{
  "url": "https://checkout.stripe.com/..."
}
```

Expected behavior:

- Verify JWT and ensure authenticated user matches `user_id`.
- Create or reuse a Stripe customer for the user.
- Create a Stripe Checkout Session for the supplied price.
- Include metadata linking the Stripe session/customer/subscription to the Supabase user id.
- Subscription status should be synchronized through Stripe webhooks, not trusted from the client.

Secrets required:

- `STRIPE_SECRET_KEY`
- Stripe price ids, to confirm from live Stripe/Supabase
- `SITE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
