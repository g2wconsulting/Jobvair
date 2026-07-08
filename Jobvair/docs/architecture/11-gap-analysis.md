# Jobvair Blueprint Gap Analysis

## Scope

This analysis compares the current codebase and inferred Supabase schema against the approved Jobvair architecture blueprint.

Important note: the repository contains an inferred Supabase schema scaffold, not a confirmed live Supabase export. Live schema reconciliation remains a required dependency.

## Current Database Schema

### Current State

The repo currently documents or expects:

- `profiles`
- `candidate_skills`
- `candidate_work_experience`
- `candidate_education`
- `candidate_certifications`
- `resume_templates`
- `parsed_resumes`
- `resumes`
- `resume_sections`
- `work_experience_entries`
- `identity_verifications`
- `subscriptions`
- `admin_users`
- `ai_analyses`

### Target State

The blueprint requires Candidate Intelligence tables, skill evidence, job targeting, match scores, AI recommendations, trust scoring, duplicate detection, and ATS mappings.

### Gap

Missing high-priority tables:

- `candidate_skill_evidence`
- `job_targets`
- `candidate_match_scores`
- `candidate_match_score_details`
- `ai_recommendations`
- `candidate_trust_scores`

### Priority

High.

### Effort

Medium to Large.

### Dependencies

Live Supabase export, migrations, RLS updates, Edge Function changes.

## Current Resume Builder

### Current State

Builder loads the latest resume, resume sections, work experience entries, templates, and allows editing, saving, importing, previewing, and exporting.

### Target State

Resume Builder should be the workspace where resumes are generated outputs of the Candidate Intelligence Profile and where Job Targeting AI assistance lives.

### Gap

- Resume versions lack lineage and profile snapshot metadata.
- Builder AI is not integrated.
- Resume-specific content is not clearly linked to profile source data.

### Priority

High after Candidate Intelligence Foundation.

### Effort

Medium to Large.

### Dependencies

Candidate Profile schema, resume version metadata, job targeting schema.

## Current Profile Architecture

### Current State

`useProfile.js` loads and saves profile, skills, work, education, and certifications. Resume parsing updates local profile state through `applyParsedResume`.

### Target State

Profile is the authoritative Candidate Intelligence Profile with source, confidence, confirmation, and evidence metadata.

### Gap

- Parsed resume enrichment is not guaranteed to persist unless saved.
- Skills lack evidence records.
- Profile lacks completeness and confidence scoring.
- Manual versus inferred data is not fully governed.

### Priority

High.

### Effort

Medium to Large.

### Dependencies

Schema changes, parse-resume contract, profile enrichment persistence.

## Current AI Optimizer Implementation

### Current State

AI Optimizer is a separate page. It selects a resume and job description, but builds analysis content mostly from profile state.

### Target State

Job Targeting should analyze Candidate Intelligence Profile plus selected resume plus job description, store match scores, and generate recommendations inside Builder.

### Gap

- No `job_targets` persistence.
- No match score history.
- No durable recommendation history.
- Selected resume content is not fully analyzed.

### Priority

High.

### Effort

Medium to Large.

### Dependencies

Job targeting schema, Edge Function updates, Builder integration.

## Current Identity Verification Implementation

### Current State

Stripe Identity status exists through `identity_verifications` and UI to start verification.

### Target State

Trust layer with verified email, verified phone, government ID, duplicate risk, and trust score.

### Gap

- No trust score.
- No verified contacts model.
- No duplicate detection.
- No fraud review architecture.

### Priority

Medium-High.

### Effort

Large.

### Dependencies

Stripe webhook reliability, trust score schema, privacy/security review.

## Recommended Next 90 Days

### 1. Candidate Intelligence Foundation

Business value: Highest. Establishes the source of truth.

Technical complexity: Medium to Large.

Dependencies: Live schema export, schema reconciliation, profile enrichment contract.

Recommended timing: Weeks 1-4.

### 2. Skills Intelligence

Business value: Very high. Directly solves ATS keyword weakness.

Technical complexity: Large.

Dependencies: Candidate skill evidence, parse-resume improvements, skill normalization.

Recommended timing: Weeks 3-8.

### 3. Resume Workspace

Business value: High. Aligns resumes as outputs of profile intelligence.

Technical complexity: Medium.

Dependencies: Candidate Intelligence Foundation, resume version metadata.

Recommended timing: Weeks 5-9.

### 4. Job Targeting

Business value: High. Converts AI Optimizer into a differentiated workflow.

Technical complexity: Medium to Large.

Dependencies: Job target schema, match scores, recommendations, Builder integration.

Recommended timing: Weeks 8-12.

### 5. Trust & Verification

Business value: Medium-High. Enables recruiter trust and filtering.

Technical complexity: Large.

Dependencies: Stripe Identity, trust score schema, privacy review.

Recommended timing: Design during first 90 days; implement after core intelligence foundation unless urgent.

### 6. ATS Integration

Business value: High long-term.

Technical complexity: Large.

Dependencies: Candidate Intelligence Foundation, Job Targeting, external API auth.

Recommended timing: Design in days 60-90; implement after foundational model stabilizes.

### 7. Employer Search & Rediscovery

Business value: Very high long-term.

Technical complexity: Large.

Dependencies: Skills Intelligence, Trust & Verification, ATS Integration, tenant security.

Recommended timing: After first 90 days.
