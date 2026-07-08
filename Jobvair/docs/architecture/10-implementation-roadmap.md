# Jobvair Implementation Roadmap

## Phase 1 - Candidate Intelligence Foundation

Schema changes:

- Extend `profiles` with completeness, confidence, enrichment, and trust-related fields.
- Extend `candidate_skills` with normalized skill, confidence, recency, confirmation, and evidence count.
- Add `candidate_skill_evidence`.

UI changes:

- Keep current Profile UI mostly intact.
- Later add review/confirm imported profile data.

Edge Functions:

- Improve `parse-resume` contract.
- Prefer server-side persistence of enrichment.

AI functions:

- Parse structured profile data.
- Infer skills, confidence, and evidence.

Dependencies:

- Live Supabase export.
- Schema reconciliation.
- RLS policy updates.

Risks:

- Overwriting user-confirmed data.
- Incorrect AI inference.
- Live schema drift.

## Phase 2 - Resume Workspace

Schema changes:

- Add resume version lineage and profile snapshot metadata.
- Add resume/job target relationships.

UI changes:

- Builder remains the main workspace.
- Resumes clearly become outputs of Candidate Intelligence Profile.

Edge Functions:

- Optional resume generation function.

AI functions:

- Generate and revise resume sections from profile data.

Dependencies:

- Candidate Intelligence Foundation.

Risks:

- Confusing profile data with resume-specific edits.

## Phase 3 - Job Targeting

Schema changes:

- Add `job_targets`.
- Add `candidate_match_scores`.
- Add `candidate_match_score_details`.
- Add `ai_recommendations`.

UI changes:

- Replace standalone AI Optimizer with Job Targeting inside Builder.

Edge Functions:

- Update `analyze-resume` to evaluate profile plus selected resume plus job description.

AI functions:

- Match scoring.
- Missing skill detection.
- Section-level recommendations.

Dependencies:

- Resume Workspace.
- Skills Intelligence fields.

Risks:

- Opaque scoring.
- Recommendations that cannot be applied cleanly.

## Phase 4 - Skills Intelligence Engine

Schema changes:

- Strengthen skill evidence.
- Add normalization and dedupe support.

UI changes:

- Skill confirmation and evidence review.

Edge Functions:

- Skill inference engine.

AI functions:

- Estimate years by skill.
- Estimate skill recency.
- Detect primary versus secondary skills.

Dependencies:

- Candidate Skill Evidence.

Risks:

- False inference.
- Duplicate evidence records.

## Phase 5 - Trust & Verification

Schema changes:

- Add trust scores.
- Add verified contacts.
- Add duplicate signals.

UI changes:

- Verification dashboard.
- Candidate trust status.

Edge Functions:

- Verification webhook handling.
- Trust score calculation.

AI functions:

- Profile inconsistency detection.

Dependencies:

- Stripe Identity.
- Privacy/security review.

Risks:

- False duplicate flags.
- Sensitive identity data exposure.

## Phase 6 - ATS Integration

Schema changes:

- Add ATS integration and mapping tables.
- Add webhook event logs.

UI changes:

- Admin integration setup.

Edge Functions:

- ATS webhook receiver.
- Candidate enrichment API.
- Match scoring API.

AI functions:

- ATS job and candidate scoring.

Dependencies:

- Candidate Intelligence Foundation.
- Job Targeting.
- Secure service auth.

Risks:

- ATS data variability.
- Integration-specific permissions.

## Phase 7 - Employer Search & Rediscovery

Schema changes:

- Search indexes.
- Employer access controls.

UI changes:

- Employer candidate search.
- Rediscovery views.

Edge Functions:

- Search and ranking APIs.

AI functions:

- Semantic search.
- Transferable skill detection.
- Match rationale.

Dependencies:

- Skills Intelligence.
- Trust & Verification.
- ATS Integration.

Risks:

- Access control.
- Candidate consent.
- Ranking fairness.
