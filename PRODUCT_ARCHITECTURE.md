# Jobvair Product Architecture

## Product Vision

Jobvair is an AI Career Operating System for candidates, employers, recruiters, and workforce partners. Its long-term purpose is to move beyond resume storage and keyword matching into an intelligence layer that understands a candidate's skills, evidence, career readiness, trust signals, job targeting, and future growth path.

Jobvair should become the system of record for candidate intelligence:

- Candidate Intelligence Profile as the source of truth.
- Resumes, cover letters, job targets, and recommendations as outputs of the profile.
- AI assistance embedded inside career workflows instead of isolated as a separate tool.
- Employer and recruiter experiences powered by verified, explainable candidate intelligence.
- ATS integrations positioned as workflow connections, while Jobvair remains the intelligence engine.

## User Personas

### Career Builder

Individuals actively improving their resume, profile, skills, and job search strategy. They need clarity, guidance, and confidence.

Primary needs:

- Upload or build a resume quickly.
- Understand strengths and gaps.
- Create targeted resume versions.
- Receive AI recommendations that are explainable.
- Track readiness for specific job targets.

### Career Switcher

Candidates moving into a new role, industry, or skill area. They need translation of existing experience into a new target language.

Primary needs:

- Skill transferability analysis.
- Resume repositioning.
- Learning and certification recommendations.
- Job target prioritization.

### Verified Candidate

Candidates who want to prove authenticity, identity, skills, and readiness to employers.

Primary needs:

- Verified email, phone, and identity status.
- Confirmed skills and years of experience.
- Trust score and evidence-backed profile.
- Resume versions generated from verified profile data.

### Recruiter

Recruiters searching for real skill fit rather than keyword mentions.

Primary needs:

- Candidate match scoring.
- Primary vs secondary skill understanding.
- Years of experience by skill.
- Recency and evidence.
- Verification and duplicate/fraud signals.

### Employer

Hiring teams that need better candidate discovery and rediscovery without replacing their ATS.

Primary needs:

- Candidate intelligence enrichment.
- Job-to-profile matching.
- Talent rediscovery.
- Verified candidate filtering.
- Integration with ATS workflow.

### Workforce Partner

Training, consulting, and education partners such as TwiddleU and G2W that can support upskilling, certification, and career mobility.

Primary needs:

- Skill gap insights.
- Learning path recommendations.
- Candidate readiness dashboards.
- Program-to-career outcome mapping.

## Navigation Philosophy

Navigation should reflect the candidate journey, not the underlying implementation.

Recommended primary navigation:

- Dashboard: AI Career Command Center.
- Profile: Candidate Intelligence Profile.
- Resumes: resume library and versions.
- Resume Builder: visual resume workspace.
- Job Targeting: AI Optimizer evolved into target-role matching.
- Cover Letters: generated and managed cover letters.
- Activity/History: analyses, recommendations, and actions over time.
- Settings: account, plan, billing, verification, preferences.

Principles:

- Dashboard is the home base, not a static summary page.
- Candidate Profile is the source of truth.
- Resume Builder is an output workspace.
- AI assistance should appear contextually inside workflows.
- Recruiter and Employer portals should be separate surfaces, not mixed into candidate navigation.

## Core Workflows

### Resume Upload to Candidate Intelligence

1. Candidate uploads a resume.
2. Resume is parsed.
3. Profile enrichment extracts identity, summary, work history, skills, education, and certifications.
4. Skill evidence is stored with confidence, source, and recency.
5. Candidate confirms or corrects inferred data.
6. Profile scores update.

### Candidate Profile to Resume Versions

1. Candidate maintains Candidate Intelligence Profile.
2. Resume Builder pulls structured profile data.
3. Candidate creates multiple resume versions.
4. Each version can target a job, industry, role, or employer.
5. AI suggests improvements without overwriting confirmed profile data.

### Job Targeting

1. Candidate enters or imports a job description.
2. Jobvair compares the job against the Candidate Intelligence Profile and selected resume.
3. AI identifies fit, gaps, missing keywords, and evidence strength.
4. Candidate receives recommendations and optional resume patch suggestions.

### Career Readiness

1. Jobvair evaluates profile completeness, resume quality, ATS compatibility, interview readiness, and trust status.
2. Dashboard presents a readiness snapshot.
3. Recommendations guide the candidate to the highest-value next actions.

### Recruiter Search and Rediscovery

1. Recruiter searches for candidates by skills, years, recency, industry, trust, and match score.
2. Jobvair ranks candidates using structured intelligence, not raw resume keyword density.
3. Recruiter reviews explainable evidence.
4. ATS receives enriched candidate data or match insights.

## Feature Map

### Candidate Platform

- AI Career Command Center.
- Candidate Intelligence Profile.
- Resume upload and parsing.
- Resume Builder.
- Resume versions.
- AI resume optimization.
- Job targeting.
- Cover letter generation.
- Skills intelligence.
- Education and certification intelligence.
- Identity and trust signals.
- Activity and recommendation history.
- Subscription and billing.

### Intelligence Layer

- Skill extraction.
- Skill evidence.
- Years-of-experience inference.
- Confidence scoring.
- Profile completeness scoring.
- Resume quality scoring.
- ATS compatibility scoring.
- Job match scoring.
- Recommendation generation.
- Duplicate/fraud detection.

### Employer/Recruiter Layer

- Candidate search.
- Candidate rediscovery.
- Candidate enrichment API.
- Match scoring API.
- Verification filters.
- ATS integration.
- Reporting and analytics.

### Partner Layer

- TwiddleU learning recommendations.
- G2W consulting/workforce workflows.
- Training-to-role mapping.
- Certification recommendations.
- Skill gap programs.

## Information Architecture

### Candidate Data

- Profile.
- Identity.
- Contact.
- Work experience.
- Education.
- Certifications.
- Skills.
- Skill evidence.
- Trust and verification.
- Preferences.

### Resume Data

- Resume versions.
- Resume sections.
- Header/contact overrides.
- Template/design settings.
- Target job metadata.
- Export history.

### AI Data

- Parsed resume JSON.
- Profile enrichment results.
- Recommendations.
- Assistant responses.
- Patch previews.
- Analysis history.
- Score breakdowns.

### Job Data

- Job targets.
- Job descriptions.
- Match results.
- Gap analysis.
- Application tracker entries.

### Employer Data

- Employer accounts.
- Recruiter accounts.
- Searches.
- Saved candidates.
- ATS mappings.
- Enrichment requests.

## AI Strategy

AI should be explainable, structured, and workflow-native.

Principles:

- Do not overwrite user-confirmed data with inferred data.
- Prefer structured outputs over free-form text.
- Store confidence and evidence wherever AI infers facts.
- Separate profile truth from resume wording.
- Keep AI recommendations auditable through history and metadata.
- Use deterministic scoring where possible before adding AI interpretation.

AI capabilities:

- Resume parsing.
- Profile enrichment.
- Skill evidence extraction.
- Years-of-experience inference.
- Resume rewrite suggestions.
- Job targeting analysis.
- Cover letter generation.
- Interview readiness guidance.
- Learning recommendations.
- Candidate matching and ranking.

## Component Hierarchy

### App Shell

- Authenticated shell.
- Sidebar navigation.
- Topbar/status area.
- Page container.
- Responsive content region.

### Page Primitives

- Page.
- PageHeader.
- Section.
- ResponsiveGrid.
- Stack.
- Cluster.

### UI Primitives

- Button.
- IconButton.
- Card.
- StatCard.
- Badge.
- Banner.
- EmptyState.
- LoadingSkeleton.
- Spinner.

### Form Primitives

- Input.
- TextArea.
- Select.
- Checkbox.
- Toggle.
- FormGroup.

### Domain Components

- CareerReadinessCard.
- ResumeVersionCard.
- JobTargetCard.
- AIRecommendationCard.
- SkillEvidenceCard.
- ProfileCompletenessPanel.
- ApplicationTimeline.
- TrustSignalBadge.

## Future Recruiter Portal

The Recruiter Portal should focus on search, match quality, and candidate verification.

Core capabilities:

- Search by primary skill, secondary skill, years of experience, recency, industry, education, certification, and verification.
- View candidate match explanations.
- Inspect skill evidence.
- Save candidate lists.
- Rediscover existing candidates.
- Export or sync candidate enrichment to ATS.

Recruiter Portal should not replace ATS workflow. It should improve candidate discovery and intelligence.

## Future Employer Portal

The Employer Portal should serve hiring teams and workforce leaders.

Core capabilities:

- Employer profile.
- Job target setup.
- Candidate matching.
- Talent pool analytics.
- Candidate verification filters.
- Saved searches.
- Rediscovery.
- ATS integration status.
- Subscription and usage management.

## TwiddleU Integration

TwiddleU should be positioned as the learning and upskilling layer connected to candidate intelligence.

Potential integration points:

- Recommended courses based on skill gaps.
- Certification paths based on target roles.
- Learning progress synced into Candidate Intelligence Profile.
- Program outcomes linked to employer demand.
- Career readiness improvements after course completion.

## G2W Integration

G2W should be positioned as a workforce consulting, employer, and implementation partner layer.

Potential integration points:

- Employer workforce intelligence dashboards.
- Candidate readiness consulting.
- Hiring funnel analysis.
- Training-to-placement programs.
- ATS and workflow implementation support.

## Database Growth Plan

### Near-Term Additive Tables

- candidate_skill_evidence.
- candidate_profile_recommendations.
- job_targets.
- job_match_results.
- resume_version_targets.
- application_tracker_entries.
- candidate_activity_events.

### Mid-Term Tables

- trust_verifications.
- identity_verification_events.
- candidate_duplicate_signals.
- employer_accounts.
- recruiter_accounts.
- employer_saved_candidates.
- employer_searches.
- ats_integrations.
- ats_sync_events.

### Long-Term Tables

- learning_recommendations.
- twiddleu_learning_records.
- g2w_program_enrollments.
- candidate_market_signals.
- talent_pool_segments.
- workforce_analytics_snapshots.

### Data Principles

- Additive migrations first.
- Preserve current resume builder and profile behavior.
- Keep candidate-owned data protected by RLS.
- Keep admin/employer/recruiter access explicitly scoped.
- Store AI outputs with source, confidence, and evidence.
- Avoid secrets in database records and Git.
