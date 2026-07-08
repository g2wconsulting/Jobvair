# Employer Search & Candidate Rediscovery Specification

## Purpose

Employer Search and Candidate Rediscovery allow recruiters and ATS partners to find relevant, verified candidates beyond keyword search.

## User Stories

- As a recruiter, I can search candidates by primary skill, years of experience, recency, and verification status.
- As a recruiter, I can rediscover past candidates who fit a new role.
- As an ATS partner, I can request ranked candidates for a job.
- As a candidate, I can be discovered based on verified intelligence rather than resume keyword density.

## Core Entities

- `profiles`
- `candidate_skills`
- `candidate_skill_evidence`
- `candidate_education`
- `candidate_certifications`
- `candidate_trust_scores`
- `job_targets`
- `candidate_match_scores`
- `ats_candidate_links`
- `ats_job_links`

## Required Fields

Search should support:

- normalized skill name
- primary skill flag
- years of experience
- last-used date
- industry
- education level
- certifications
- verification status
- trust score
- location
- work mode
- job match score

## Relationships

Employer search consumes Candidate Intelligence Profile data and may use ATS mappings to limit candidates by tenant, source system, or rediscovery pool.

## AI Requirements

AI should support semantic search, transferable skill identification, match rationale, and candidate ranking explanations.

## ATS Requirements

ATS integrations should be able to request candidate rediscovery results for an ATS job while respecting tenant boundaries and candidate consent.

## Future Roadmap Considerations

Future search must include consent, visibility controls, employer access policies, audit logs, fairness review, and ranking explainability.
