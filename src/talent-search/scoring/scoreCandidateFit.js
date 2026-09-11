// Multi-category fit scoring for the Ideal Candidate Profile flow.
// Deliberately separate from Phase 1's scoreCandidate.js — this scores
// job-related fit only; mission alignment is computed and displayed
// entirely separately (see scoreMissionAlignment.js / MissionAlignmentPanel)
// and never folds into these numbers, per the compliance requirement that
// mission-fit must never become a hidden hiring score.

function overlap(listA, listB) {
  const a = (listA || []).map(s => s.toLowerCase());
  const b = (listB || []).map(s => s.toLowerCase());
  return a.filter(x => b.some(y => y.includes(x) || x.includes(y)));
}

function pct(matched, total) {
  return total > 0 ? Math.round((matched / total) * 100) : 100;
}

/**
 * @param {Object} candidate - from mockIcpCandidates.js
 * @param {import("../types/idealCandidateProfile.js").IdealCandidateProfile} profile
 */
export function scoreCandidateFit(candidate, profile) {
  const requiredMatched = overlap(profile.required_skills, candidate.skills);
  const preferredMatched = overlap(profile.preferred_skills, candidate.skills);
  const requiredScore = pct(requiredMatched.length, (profile.required_skills || []).length);
  const preferredScore = pct(preferredMatched.length, (profile.preferred_skills || []).length);
  const skillsScore = pct(requiredMatched.length + preferredMatched.length, (profile.required_skills || []).length + (profile.preferred_skills || []).length);

  const meetsYears = !profile.minimum_years_experience || candidate.years_experience >= profile.minimum_years_experience;
  const experienceScore = meetsYears ? 100 : Math.max(30, Math.round((candidate.years_experience / Math.max(1, profile.minimum_years_experience)) * 100));

  const industryMatched = overlap(profile.industries, candidate.industries);
  const industryScore = pct(industryMatched.length, (profile.industries || []).length);

  const candidateCity = (candidate.location_info.current_location.value || "").split(",")[0].trim().toLowerCase();
  const locationMatch = (profile.preferred_locations || []).length === 0
    || profile.preferred_locations.some(loc => candidateCity.includes(loc.toLowerCase()) || loc.toLowerCase().includes(candidateCity));
  const locationScore = locationMatch ? 100 : (profile.relocation_acceptable ? 60 : 30);

  // Work-arrangement fit is inferred from location proximity only when we
  // have no explicit candidate-stated preference — never invented as a
  // hard fact, always paired with an "unknowns" note below.
  const workArrangementScore = locationMatch ? 100 : (profile.relocation_acceptable ? 55 : 35);

  let compensationScore = 100;
  const empRange = profile.employer_salary_range;
  const candRange = candidate.compensation_info.candidate_expected_salary.value != null
    ? [candidate.compensation_info.candidate_expected_salary.value, candidate.compensation_info.candidate_expected_salary.value]
    : candidate.compensation_info.market_estimated_compensation.range;
  if (empRange?.min != null && empRange?.max != null && candRange) {
    const overlapAmount = Math.min(empRange.max, candRange[1]) - Math.max(empRange.min, candRange[0]);
    const span = Math.max(empRange.max - empRange.min, candRange[1] - candRange[0], 1);
    compensationScore = overlapAmount > 0 ? Math.round(60 + Math.min(40, (overlapAmount / span) * 40)) : 40;
  }

  const overall = Math.round(
    requiredScore * 0.3 + preferredScore * 0.1 + experienceScore * 0.15
    + industryScore * 0.1 + locationScore * 0.15 + workArrangementScore * 0.1 + compensationScore * 0.1,
  );

  const strengths = [];
  if (candidate.years_experience) strengths.push(`${candidate.years_experience}+ years nonprofit fundraising experience`);
  if (candidate.revenue_responsibility) strengths.push(`Manages ${candidate.revenue_responsibility}`);
  if (candidate.management_experience) strengths.push("Leads development staff");
  if (locationMatch) strengths.push(`${candidate.location_info.current_location.value}-based`);
  industryMatched.forEach(() => strengths.push(`Experience with ${profile.industries.find(i => candidate.industries.some(ci => ci.toLowerCase() === i.toLowerCase()))} organizations`));
  requiredMatched.forEach(s => strengths.push(`${s} experience confirmed`));

  const gaps = [];
  (profile.required_skills || []).filter(s => !requiredMatched.includes(s.toLowerCase())).forEach(s => gaps.push(`${s} experience not confirmed`));
  (profile.preferred_certifications || []).filter(c => !candidate.certifications.some(cc => cc.toLowerCase() === c.toLowerCase())).forEach(c => gaps.push(`${c} certification not verified`));
  if (!locationMatch && !profile.relocation_acceptable) gaps.push("Not currently located in a preferred area");

  const unknowns = [];
  if (candidate.location_info.relocation_willingness.status === "not_found") unknowns.push("Relocation willingness");
  if (candidate.compensation_info.candidate_expected_salary.status === "not_found") unknowns.push("Desired salary");
  if (candidate.location_info.travel_willingness.status === "not_found") unknowns.push("Travel availability");
  unknowns.push("Work arrangement preference not directly confirmed");

  return {
    fit_scores: {
      overall: Math.max(0, Math.min(100, overall)),
      qualification: Math.round(requiredScore * 0.7 + preferredScore * 0.3),
      skills: skillsScore,
      experience: experienceScore,
      industry: industryScore,
      location: locationScore,
      work_arrangement: workArrangementScore,
      compensation: compensationScore,
    },
    match_explanation: { strengths, gaps, unknowns },
  };
}
