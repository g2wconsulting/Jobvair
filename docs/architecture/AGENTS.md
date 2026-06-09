# Jobvair Architecture Instructions for Codex Agents

Jobvair is a Candidate Intelligence Platform.

## Core Principles

- Candidate Intelligence Profile is the source of truth.
- Resumes are outputs of the Candidate Intelligence Profile.
- ATS platforms are workflow engines.
- Jobvair is the intelligence engine.
- Prefer backward-compatible, additive changes.
- Keep secrets out of GitHub.

## Candidate Data Rules

- Do not overwrite user-confirmed data with inferred data.
- Manual and candidate-confirmed data should win over parsed or AI-inferred data unless the user explicitly chooses otherwise.
- Parsed resume data should include source metadata whenever possible.
- Inferred data should remain explainable and reviewable.

## Skills Intelligence Rules

Skills should support:

- skill name
- normalized skill name
- years of experience
- confidence score
- evidence
- recency / last-used date
- primary vs secondary status
- source
- confirmation status

Skill evidence should explain why Jobvair believes the candidate has the skill.

## Resume Rules

- Resumes are generated, targeted, and versioned outputs.
- Resume-specific edits should not silently overwrite the Candidate Intelligence Profile.
- Resume Builder changes must preserve save/load behavior unless the task explicitly changes it.

## ATS Rules

- ATS owns jobs, applications, interviews, hiring stages, and recruiter workflow.
- Jobvair owns candidate enrichment, verification, skills intelligence, match scoring, and rediscovery.
- External ATS IDs should be mapped in integration tables, not used as primary Jobvair IDs.

## Security Rules

- Do not commit API keys, service-role keys, Stripe secrets, Supabase secrets, identity documents, or raw sensitive verification payloads.
- RLS and service-role Edge Functions must preserve tenant/user boundaries.
- Prefer non-secret metadata and explainable summaries over sensitive raw data.
