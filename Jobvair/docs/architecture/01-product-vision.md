# Jobvair Product Vision

## Purpose

Jobvair exists to solve the limitations of traditional ATS keyword matching. Recruiters searching for Java Developer, Spring Boot Developer, or Healthcare Software Engineer should not receive undifferentiated candidates who merely mentioned those terms somewhere on a resume.

Jobvair should identify authentic, relevant candidates by understanding primary skills, secondary skills, years of experience, recency, industry relevance, education, certifications, verification, and trust.

## User Stories

- As a candidate, I can upload a resume and receive a structured Candidate Intelligence Profile.
- As a candidate, I can confirm, correct, and improve my profile over time.
- As a candidate, I can generate multiple targeted resumes from one profile.
- As a candidate, I can use AI help inside the resume workspace to target a specific job.
- As a recruiter, I can find candidates by verified skills, years of experience, recency, education, certifications, and trust level.
- As an ATS partner, I can send Jobvair candidate and job data and receive enrichment, scoring, and verification intelligence.

## Core Entities

- Candidate Intelligence Profile
- Candidate Skill
- Skill Evidence
- Work Experience
- Education
- Certification
- Resume Version
- Job Target
- Match Score
- AI Recommendation
- Identity Verification
- Trust Score
- ATS Integration Mapping

## Required Fields

At the platform level, Jobvair must support:

- candidate identity
- verified contact fields
- structured work history
- structured education
- structured certifications
- normalized skills
- years of experience per skill
- last-used dates per skill
- source and confidence metadata
- resume versions
- job targets
- match scores
- AI recommendation history
- ATS external identifiers

## Relationships

- One candidate profile has many skills.
- One skill has many evidence records.
- One candidate profile has many resume versions.
- One resume version may be linked to one job target.
- One job target has many match scores and recommendations.
- One candidate profile may have many ATS candidate links.

## AI Requirements

AI must:

- parse resumes into structured profile data
- infer skills from evidence
- estimate skill years and recency
- distinguish primary from secondary skills
- identify missing or weak profile data
- score job relevance using profile plus selected resume plus job description
- produce explainable recommendations

## ATS Requirements

Jobvair must eventually support:

- candidate enrichment APIs
- resume parsing APIs
- job match scoring APIs
- candidate verification lookup
- candidate rediscovery
- external ATS ID mapping
- webhook event processing

## Future Roadmap Considerations

The long-term platform should support employer search, candidate rediscovery, verified candidate filtering, ATS integrations, and explainable workforce intelligence.
