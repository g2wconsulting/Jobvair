# analyze-resume

Frontend caller:

- AI Resume Optimizer

Request body observed in the app:

```json
{
  "user_id": "uuid",
  "resume_id": "uuid",
  "resume_content": "plain text built from profile data",
  "profile": {
    "name": "Candidate Name",
    "location": "City, ST",
    "summary": "Profile summary",
    "desiredTitles": [],
    "industries": [],
    "availability": "immediately",
    "employmentStatus": "open",
    "totalYearsExperience": 5,
    "highestEducationLevel": "Bachelor"
  },
  "skills": [
    { "name": "React", "level": "advanced", "years": 4 }
  ],
  "job_description": "Full job description or role fallback",
  "job_title": "Optional title",
  "company": "Optional company"
}
```

Response fields consumed by the frontend:

- `match_score`
- `matching_skills[]`
- `missing_skills[]`
- `recommended_resume_keywords[]`
- `improved_summary`
- `experience_suggestions[]`
- `career_recommendations[]`
- Other JSON fields may be displayed as the UI evolves.

Expected behavior:

- Verify JWT and user ownership of `resume_id`.
- Run AI matching against the supplied job description.
- Return a structured JSON response.
- Consider persisting the result to `ai_analyses` once the frontend is updated to load history from the database.

Secrets required:

- AI provider key, to confirm from live Supabase
- `SUPABASE_SERVICE_ROLE_KEY` if persisting results server-side

## Deployment notes

Implemented. Requires the `ANTHROPIC_API_KEY` function secret (same one used by
`builder-assistant` and `parse-resume` — no new secret needed if already set).

Deploy with `supabase functions deploy analyze-resume`.

Verifies the caller's JWT and, when a `resume_id` is provided, confirms the resume
belongs to the authenticated user before analyzing it. Persists every run to
`public.ai_analyses` (this is what should eventually back the History page instead
of its current seed/mock data).

Also accepts an optional `job_url` field: if present (and `job_description` isn't),
the function fetches that URL server-side, strips it down to plain text, and uses
that as the job description. This has to happen server-side since arbitrary
third-party fetches from the browser would be blocked by CORS almost everywhere.
Sites that require login or heavy client-side JavaScript to render their content
won't work this way — the function returns a clear error telling the user to paste
the description text directly instead.
