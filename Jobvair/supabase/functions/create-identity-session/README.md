# create-identity-session

Frontend caller:

- Profile verification tab

Request body observed in the app:

```json
{
  "user_id": "uuid",
  "user_email": "candidate@example.com",
  "return_url": "https://app.example.com/?tab=verification"
}
```

Expected response:

```json
{
  "url": "https://verify.stripe.com/..."
}
```

Expected behavior:

- Verify JWT and ensure authenticated user matches `user_id`.
- Create a Stripe Identity Verification Session.
- Store or update `identity_verifications` with status such as `pending`.
- Return Stripe's verification URL.
- Final status should be updated through a Stripe webhook.

Secrets required:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` for status updates handled by webhook code
- `SUPABASE_SERVICE_ROLE_KEY`
