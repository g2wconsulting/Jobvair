// Shapes for Talent Search Phase 2 — Ideal Candidate Profile + evidence-
// based matching. Builds on (doesn't replace) the Phase 1 shapes in
// candidateShape.js: an Ideal Candidate Profile is what the EMPLOYER states
// they want; a ProvenanceField is how much confidence we have in a fact
// ABOUT A CANDIDATE. Never conflate the two — the profile has no
// provenance (it's the employer's own input), candidate attributes always
// do.

/**
 * @typedef {Object} ProvenanceField
 * @property {*} value
 * @property {"verified"|"candidate_provided"|"publicly_supported"|"estimated"|"inferred"|"not_found"} status
 * @property {string|null} source
 * @property {number|null} confidence   - 0-1, null when status is "not_found"
 */

export function provenance(value, status, source = null, confidence = null) {
  return { value, status, source, confidence };
}

export function notFound() {
  return { value: null, status: "not_found", source: null, confidence: null };
}

/**
 * @typedef {Object} IdealCandidateProfile
 * Employer-stated requirements — no provenance, this IS the source.
 */
export function createEmptyIdealProfile() {
  return {
    target_titles: [],
    alternate_titles: [],
    minimum_years_experience: 0,
    required_skills: [],
    preferred_skills: [],
    industries: [],
    required_certifications: [],
    preferred_certifications: [],
    education_requirement: null,
    management_experience_required: false,
    budget_responsibility: null,
    revenue_responsibility: null,
    technologies: [],
    clearance_requirement: null,
    preferred_locations: [],
    remote_preference: "no_preference", // "required" | "acceptable" | "not_acceptable" | "no_preference"
    hybrid_preference: "no_preference",
    onsite_preference: "no_preference",
    work_arrangement_note: "", // free-text detail the planner couldn't fit into the enums, e.g. "3 days/week onsite"
    commute_radius_miles: 25,
    relocation_acceptable: false, // employer willing to relocate a candidate in
    relocation_locations: [],
    travel_expectation: "",
    employer_salary_range: { min: null, max: null },
    mission_values: [], // employer-selected organizational values, e.g. ["Animal Welfare", "Education"]
  };
}

/**
 * @typedef {Object} MissionEvidenceItem
 * @property {string} text
 * @property {string} evidence_type   - "board_membership" | "volunteer_work" | "nonprofit_employment" | "publication" | "conference_bio" | "stated_interest"
 * @property {string} source_name
 * @property {string|null} source_url
 * @property {string} date_found      - ISO date
 * @property {number} confidence      - 0-1
 */

/**
 * @typedef {Object} MissionAlignment
 * @property {string} mission
 * @property {"strong"|"moderate"|"limited"|"none"} strength
 * @property {MissionEvidenceItem[]} evidence
 */

export function createEmptyMissionAlignment(mission) {
  return { mission, strength: "none", evidence: [] };
}

/**
 * @typedef {Object} FitScores
 * @property {number} overall
 * @property {number} qualification
 * @property {number} skills
 * @property {number} experience
 * @property {number} industry
 * @property {number} location
 * @property {number} work_arrangement
 * @property {number} compensation
 */

/**
 * @typedef {Object} MatchExplanation
 * @property {string[]} strengths
 * @property {string[]} gaps
 * @property {string[]} mission_notes
 * @property {string[]} unknowns
 */
