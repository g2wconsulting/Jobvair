// Shared shape reference for the Talent Search feature. Plain JS (this
// project doesn't use TypeScript) — these are JSDoc typedefs plus a factory
// for the empty state, so every provider/component agrees on one shape
// without needing a compiler to enforce it.

/**
 * @typedef {Object} EvidenceItem
 * @property {string} value        - the fact itself, e.g. "Oracle Fusion HCM"
 * @property {string} source       - where it came from, e.g. "resume", "linkedin", "github"
 * @property {string|null} source_url
 * @property {number} confidence   - 0-1, never invented: absence of evidence means omit, not guess
 */

/**
 * @typedef {Object} SourceRecord
 * @property {string} provider     - provider key, e.g. "jobvair", "web_search", "github"
 * @property {string} record_id
 * @property {string|null} url
 * @property {string} retrieved_at - ISO timestamp
 */

/**
 * @typedef {Object} Candidate
 * @property {string} candidate_key      - stable identity for dedup, independent of any one provider's id
 * @property {string} name
 * @property {string} headline
 * @property {string} location
 * @property {string} current_title
 * @property {string} current_company
 * @property {string[]} skills
 * @property {Object[]} experience        - [{ title, company, start, end, description }]
 * @property {Object[]} education         - [{ degree, field, institution, year }]
 * @property {string[]} certifications
 * @property {Object[]} public_profiles   - [{ type, url }]
 * @property {SourceRecord[]} source_records
 * @property {EvidenceItem[]} evidence
 * @property {number} match_score         - 0-100, computed at search time, not stored
 * @property {number} required_score
 * @property {number} preferred_score
 * @property {number} confidence          - overall evidence confidence, 0-1
 * @property {string[]} strong_matches
 * @property {string[]} potential_gaps
 * @property {"probable_match"|"possible_match"|"distinct"|null} dedup_status
 */

export function createEmptyCandidate() {
  return {
    candidate_key: "",
    name: "",
    headline: "",
    location: "",
    current_title: "",
    current_company: "",
    skills: [],
    experience: [],
    education: [],
    certifications: [],
    public_profiles: [],
    source_records: [],
    evidence: [],
    match_score: 0,
    required_score: 0,
    preferred_score: 0,
    confidence: 0,
    strong_matches: [],
    potential_gaps: [],
    dedup_status: null,
  };
}

/**
 * @typedef {Object} SearchCriteria
 * @property {string} current_title
 * @property {string[]} previous_titles
 * @property {string[]} required_skills
 * @property {string[]} preferred_skills
 * @property {string[]} locations
 * @property {number} radius_miles
 * @property {"onsite"|"hybrid"|"remote"|"any"} work_arrangement
 * @property {number} minimum_years_experience
 * @property {string[]} industries
 * @property {string[]} education
 * @property {string[]} certifications
 * @property {string[]} employers
 * @property {string[]} target_companies
 * @property {string[]} excluded_companies
 * @property {string} keywords
 * @property {string} boolean_query
 * @property {string} seniority
 * @property {{ min: number|null, max: number|null }} compensation_range
 * @property {string} security_clearance
 * @property {boolean} require_open_to_work
 * @property {string[]} source_filters   - provider keys to search
 */

export function createEmptyCriteria() {
  return {
    current_title: "",
    previous_titles: [],
    required_skills: [],
    preferred_skills: [],
    locations: [],
    radius_miles: 25,
    work_arrangement: "any",
    minimum_years_experience: 0,
    industries: [],
    education: [],
    certifications: [],
    employers: [],
    target_companies: [],
    excluded_companies: [],
    keywords: "",
    boolean_query: "",
    seniority: "",
    compensation_range: { min: null, max: null },
    security_clearance: "",
    require_open_to_work: false,
    source_filters: [],
  };
}
