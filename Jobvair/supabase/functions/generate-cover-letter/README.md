# generate-cover-letter

Frontend caller:

- Cover Letter Generator

Request body observed in the app:

```json
{
  "prompt": "Prompt assembled by the frontend",
  "tone": "professional",
  "job_title": "Optional title",
  "company": "Optional company"
}
```

Expected response:

```json
{
  "letter": "Generated cover letter text"
}
```

Expected behavior:

- Verify the Supabase JWT.
- Generate a cover letter from the supplied prompt and tone.
- Return plain generated text in a stable field such as `letter`.
- Avoid storing generated text unless a future persistence feature is explicitly added.

Secrets required:

- AI provider key, to confirm from live Supabase
