# Jobvair Authoritative Principle

Jobvair is a Candidate Intelligence Platform.

The Candidate Intelligence Profile is the source of truth. Resumes, AI recommendations, job targeting, employer search, and ATS integrations are outputs or consumers of that profile.

## Core Rule

Candidate Intelligence Profile owns durable candidate truth:

- identity
- verification
- skills intelligence
- years of experience
- skill recency
- education
- certifications
- work history
- resume versions
- AI recommendations
- job relevance
- trust signals

Resumes are generated, targeted, and versioned outputs of the Candidate Intelligence Profile.

ATS platforms remain workflow systems. Jobvair becomes the intelligence system that enriches, verifies, scores, and rediscovers candidates.

## Product Boundary

The ATS manages:

- jobs
- applications
- interviews
- hiring workflow
- recruiter activity

Jobvair manages:

- candidate identity
- candidate verification
- skills intelligence
- education intelligence
- certification intelligence
- resume versions
- AI recommendations
- job relevance and match scoring
- candidate enrichment
- candidate rediscovery

## Architectural Implication

Before adding new Resume Builder, AI Assistant, ATS, employer search, or matching functionality, new work should be evaluated against this principle:

Does this strengthen the Candidate Intelligence Profile as the source of truth?
