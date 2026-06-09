# Jobvair Architecture Blueprint

This folder contains the authoritative product and data architecture blueprint for Jobvair.

Jobvair is a Candidate Intelligence Platform. The Candidate Intelligence Profile is the source of truth. Resumes, AI recommendations, job targeting, employer search, and ATS integrations are outputs or consumers of that profile.

## Documents

- `00-authoritative-principle.md` - Core architectural principle and product boundary.
- `01-product-vision.md` - Product vision, user stories, and platform purpose.
- `02-candidate-intelligence-profile.md` - Candidate Intelligence Profile specification.
- `03-skills-intelligence.md` - Skills intelligence and evidence architecture.
- `04-trust-verification.md` - Trust, verification, and duplicate-risk architecture.
- `05-job-targeting.md` - Job Targeting and match scoring specification.
- `06-ats-integration.md` - ATS integration architecture and mapping strategy.
- `07-resume-versioning.md` - Resume versioning as output of Candidate Intelligence.
- `08-employer-search-rediscovery.md` - Employer search and candidate rediscovery specification.
- `09-data-architecture.md` - ERD, schema comparison, indexes, RLS, and ATS mapping strategy.
- `10-implementation-roadmap.md` - Phased implementation roadmap.
- `11-gap-analysis.md` - Current codebase gap analysis against the approved blueprint.
- `12-profile-scoring.md` - Deterministic profile completeness/confidence scoring.
- `AGENTS.md` - Architecture instructions for future Codex work.

## Usage

Before adding major Resume Builder, AI Assistant, ATS integration, employer search, or candidate matching functionality, compare the proposed work against these documents.

New implementation should strengthen the Candidate Intelligence Profile as the source of truth.
