# invite-employer-member

Invites a person onto an employer's hiring team by email.

## Request

```
POST /functions/v1/invite-employer-member
Authorization: Bearer <caller's Supabase access token>
Content-Type: application/json

{ "companyId": "uuid", "email": "person@example.com", "role": "recruiter" }
```

`role` is one of `company_admin`, `recruiter`, `hiring_manager`.

## Behavior

- Verifies the caller is an active `company_admin` of `companyId` (via the
  `is_company_admin` RPC, under RLS).
- If `email` has no existing Jobvair account: sends a real Supabase Auth
  invite email via `auth.admin.inviteUserByEmail` and records a `pending`
  row in `employer_invitations`. Response: `{ "status": "invited", "email" }`.
- If `email` already has an account: attaches it to the company directly via
  the `invite_employer_member` RPC — no invite email needed. Response:
  `{ "status": "added_existing", "email" }`.

## Required environment variables

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — required to call the Auth admin API; never
  sent to the client.
- `SITE_URL` — used as the invite email's redirect target (`${SITE_URL}/employer`).

## Client-side reconciliation

After a fresh invite-link signup, the employer app calls the
`accept_pending_invitation()` RPC (security definer) on first load. It
matches the signed-in user's verified email against a pending
`employer_invitations` row, creates the `employer_memberships` row, and
marks the invitation `accepted`.
