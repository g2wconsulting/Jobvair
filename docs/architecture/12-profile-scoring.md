# Profile Completeness and Confidence Scoring

## Purpose

Profile scoring gives Jobvair a deterministic way to measure Candidate Intelligence Profile readiness. Scores are guidance, not absolute truth.

This phase calculates:

- `profile_completeness_score`
- `profile_confidence_score`
- `last_scored_at`
- `score_breakdown_json`

`trust_score` remains reserved for the later Trust & Verification phase.

## Completeness Score

Completeness measures whether the profile has the key data needed for resume generation, job targeting, ATS matching, and candidate rediscovery.

Inputs:

- name
- email
- phone
- location
- professional summary
- desired titles
- industries
- skills count
- primary skills count
- work history count
- education present
- certifications present
- resume uploaded
- identity verification status, when present

The score is weighted and deterministic.

## Confidence Score

Confidence measures how much supporting structure exists behind the profile.

Inputs:

- skills with evidence
- skills with `confidence_score`
- manual or candidate-confirmed skills
- parsed resume evidence
- work history completeness
- education confidence
- certification confidence
- basic profile consistency
- average skill confidence

The score is deterministic and does not use AI in this phase.

## Update Triggers

Scores update after:

- profile save
- resume upload enrichment persistence

Future phases may update scores after verification events, ATS imports, skill confirmation, and duplicate-review changes.

## Explainability

The scoring helper stores `score_breakdown_json` with score components, labels, weights, and limitations.

Scores should be shown as profile readiness signals, not as definitive statements about candidate quality.

## Limitations

- Trust scoring is deferred.
- Duplicate/fraud signals are not included yet.
- AI contradiction detection is not included yet.
- Skill ontology and alias handling are not included yet.
- Confidence depends on available structured evidence and parser output quality.

## Future Trust Score Phase

Trust score should later include:

- verified email
- verified phone
- verified government ID
- duplicate risk
- profile consistency
- resume consistency
- manual review outcomes
- suspicious activity signals, where legally and appropriately collected
