# parse-resume

Frontend callers:

- Resume Builder import
- Profile resume upload zone

Request body observed in the app:

```json
{
  "user_id": "uuid",
  "storage_path": "resumes/<user_id>/<timestamp>_<filename>",
  "original_filename": "resume.pdf",
  "parsed_resume_id": "uuid"
}
```

Expected behavior:

- Verify the Supabase JWT and ensure the authenticated user matches `user_id`.
- Read the uploaded object from the private `resumes` storage bucket.
- Extract resume text from PDF, DOC, DOCX, or TXT.
- Use the AI provider to return structured candidate/resume data.
- Update `parsed_resumes.parse_status`, `parsed_resumes.parsed_json`, and `parsed_resumes.error_message`.

Response fields consumed by the frontend:

- `full_name`
- `email`
- `phone`
- `location`
- `summary`
- `skills[]` with `skill_name`, `category`, `years_experience`, `proficiency_level`, `last_used_date`
- `work_experience[]` with `job_title`, `company`, `location`, `start_date`, `end_date`, `is_current`, `description`
- `education[]` with `institution`, `degree`, `major`, `graduation_year`
- `certifications[]`
- `profile_update.total_years_experience`
- `profile_update.total_years_leadership`
- `industries[]`
- `desired_titles[]`

Secrets required:

- AI provider key, to confirm from live Supabase
- `SUPABASE_SERVICE_ROLE_KEY`
