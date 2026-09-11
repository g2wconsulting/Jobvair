// Scores one normalized candidate against search criteria. Mirrors what a
// real AI ranking step should output: separate required/preferred scores,
// an evidence-confidence figure, and an explicit list of gaps — never just
// a single opaque number. Uncertainty is surfaced, not hidden.

function includesCI(list, term) {
  return list.some(item => item.toLowerCase().includes(term.toLowerCase()) || term.toLowerCase().includes(item.toLowerCase()));
}

/**
 * @param {import("../types/candidateShape.js").Candidate} candidate
 * @param {import("../types/candidateShape.js").SearchCriteria} criteria
 */
export function scoreCandidate(candidate, criteria) {
  const requiredSkills = criteria.required_skills || [];
  const preferredSkills = criteria.preferred_skills || [];

  const matchedRequired = requiredSkills.filter(s => includesCI(candidate.skills, s));
  const matchedPreferred = preferredSkills.filter(s => includesCI(candidate.skills, s));
  const missingRequired = requiredSkills.filter(s => !matchedRequired.includes(s));
  const missingPreferred = preferredSkills.filter(s => !matchedPreferred.includes(s));

  const requiredScore = requiredSkills.length > 0 ? Math.round((matchedRequired.length / requiredSkills.length) * 100) : 100;
  const preferredScore = preferredSkills.length > 0 ? Math.round((matchedPreferred.length / preferredSkills.length) * 100) : 100;

  const locationMatch = (criteria.locations || []).length === 0
    || (criteria.locations || []).some(loc => candidate.location?.toLowerCase().includes(loc.toLowerCase()));

  const industryMatch = (criteria.industries || []).length === 0
    || (criteria.industries || []).some(ind => (candidate.industries || []).some(ci => ci.toLowerCase() === ind.toLowerCase()));

  const meetsYears = !criteria.minimum_years_experience || (candidate.years_experience != null && candidate.years_experience >= criteria.minimum_years_experience);

  const overall = Math.round(
    requiredScore * 0.5
    + preferredScore * 0.2
    + (locationMatch ? 100 : 40) * 0.15
    + (meetsYears ? 100 : 50) * 0.15,
  );

  const strongMatches = [];
  if (candidate.years_experience != null) strongMatches.push(`${candidate.years_experience} years of relevant experience`);
  if (candidate.current_title) strongMatches.push(`Current ${candidate.current_title}`);
  matchedRequired.forEach(s => strongMatches.push(`${s} experience confirmed`));
  matchedPreferred.forEach(s => strongMatches.push(`${s} experience confirmed (preferred)`));
  if (industryMatch && (criteria.industries || []).length > 0) strongMatches.push(`${criteria.industries.find(ind => (candidate.industries || []).some(ci => ci.toLowerCase() === ind.toLowerCase()))} experience`);
  if (locationMatch && (criteria.locations || []).length > 0) strongMatches.push(`Located in ${candidate.location}`);

  const potentialGaps = [];
  missingRequired.forEach(s => potentialGaps.push(`${s} experience not confirmed`));
  missingPreferred.forEach(s => potentialGaps.push(`${s} not confirmed`));
  if (!meetsYears) potentialGaps.push(candidate.years_experience == null ? "Years of experience unconfirmed" : `Below the ${criteria.minimum_years_experience}-year minimum`);
  if (!locationMatch) potentialGaps.push("Location outside requested area");
  if (criteria.require_open_to_work) potentialGaps.push("Open-to-work status unconfirmed (not supplied by any connected source)");
  potentialGaps.push("Compensation unknown");

  const evidenceConfidence = candidate.evidence.length > 0
    ? candidate.evidence.reduce((s, e) => s + e.confidence, 0) / candidate.evidence.length
    : candidate.confidence;

  return {
    ...candidate,
    required_score: requiredScore,
    preferred_score: preferredScore,
    match_score: Math.max(0, Math.min(100, overall)),
    confidence: Math.round(evidenceConfidence * 100) / 100,
    strong_matches: strongMatches,
    potential_gaps: potentialGaps,
  };
}
