import { supabase } from "../supabaseClient";

const clamp = value => Math.max(0, Math.min(100, Math.round(value)));
const hasValue = value => {
  if (Array.isArray(value)) return value.length > 0;
  if (value === 0) return true;
  return value !== undefined && value !== null && String(value).trim() !== "";
};

const scoreRatio = (passed, total) => total > 0 ? passed / total : 0;

function countCompletedChecks(checks) {
  return checks.reduce((count, check) => count + (check.complete ? 1 : 0), 0);
}

function average(values) {
  const nums = values.filter(v => Number.isFinite(v));
  if (!nums.length) return null;
  return nums.reduce((sum, value) => sum + value, 0) / nums.length;
}

function buildCompletenessBreakdown({ profile, skills, work, education, certifications, resumes, verification }) {
  const primarySkills = skills.filter(skill => skill.is_primary);
  const checks = [
    { key: "name", label: "Name", complete: hasValue(profile?.full_name), weight: 8 },
    { key: "email", label: "Email", complete: hasValue(profile?.email), weight: 8 },
    { key: "phone", label: "Phone", complete: hasValue(profile?.phone), weight: 6 },
    { key: "location", label: "Location", complete: hasValue(profile?.location), weight: 6 },
    { key: "summary", label: "Professional summary", complete: hasValue(profile?.summary), weight: 8 },
    { key: "desired_titles", label: "Desired titles", complete: hasValue(profile?.desired_titles), weight: 6 },
    { key: "industries", label: "Industries", complete: hasValue(profile?.industries), weight: 5 },
    { key: "skills", label: "Skills", complete: skills.length >= 3, weight: 12 },
    { key: "primary_skills", label: "Primary skills", complete: primarySkills.length >= 1, weight: 8 },
    { key: "work_history", label: "Work history", complete: work.length >= 1, weight: 10 },
    { key: "education", label: "Education", complete: education.length >= 1 || hasValue(profile?.highest_education_level), weight: 6 },
    { key: "certifications", label: "Certifications", complete: certifications.length >= 1, weight: 4 },
    { key: "resume_uploaded", label: "Resume uploaded", complete: resumes.length >= 1, weight: 8 },
    { key: "identity_verification", label: "Identity verification", complete: verification?.status === "verified", weight: 5 },
  ];

  const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
  const earnedWeight = checks.reduce((sum, check) => sum + (check.complete ? check.weight : 0), 0);

  return {
    score: clamp((earnedWeight / totalWeight) * 100),
    completed_checks: countCompletedChecks(checks),
    total_checks: checks.length,
    checks,
  };
}

function buildConfidenceBreakdown({ profile, skills, work, education, certifications, evidence, resumes }) {
  const skillsWithEvidence = new Set(evidence.map(item => item.candidate_skill_id).filter(Boolean));
  const skillsWithConfidence = skills.filter(skill => Number.isFinite(Number(skill.confidence_score)));
  const manualOrConfirmedSkills = skills.filter(skill =>
    skill.source === "manual" ||
    skill.confirmation_status === "candidate_confirmed" ||
    skill.confirmation_status === "system_verified"
  );
  const parsedSkills = skills.filter(skill => skill.source === "resume_parsed");
  const completeWorkRows = work.filter(row => hasValue(row.job_title) && hasValue(row.company) && hasValue(row.description));
  const educationConfidences = education.map(row => Number(row.confidence_score));
  const certificationConfidences = certifications.map(row => Number(row.confidence_score));
  const skillConfidences = skills.map(row => Number(row.confidence_score));

  const componentScores = [
    {
      key: "skills_with_evidence",
      label: "Skills with evidence",
      score: scoreRatio(skillsWithEvidence.size, Math.max(skills.length, 1)) * 100,
      weight: 24,
    },
    {
      key: "skills_with_confidence",
      label: "Skills with confidence scores",
      score: scoreRatio(skillsWithConfidence.length, Math.max(skills.length, 1)) * 100,
      weight: 14,
    },
    {
      key: "manual_or_confirmed_skills",
      label: "Manual or confirmed skills",
      score: scoreRatio(manualOrConfirmedSkills.length, Math.max(skills.length, 1)) * 100,
      weight: 14,
    },
    {
      key: "parsed_resume_evidence",
      label: "Parsed resume evidence",
      score: resumes.length > 0 && parsedSkills.length > 0 ? 100 : 0,
      weight: 14,
    },
    {
      key: "work_history_completeness",
      label: "Work history completeness",
      score: scoreRatio(completeWorkRows.length, Math.max(work.length, 1)) * 100,
      weight: 14,
    },
    {
      key: "education_certification_confidence",
      label: "Education and certification confidence",
      score: average([...educationConfidences, ...certificationConfidences]) ?? (education.length || certifications.length ? 50 : 0),
      weight: 10,
    },
    {
      key: "profile_consistency",
      label: "Basic profile consistency",
      score: hasValue(profile?.full_name) && hasValue(profile?.email) && hasValue(profile?.summary) ? 100 : 50,
      weight: 8,
    },
    {
      key: "average_skill_confidence",
      label: "Average skill confidence",
      score: average(skillConfidences) ?? (skills.length ? 50 : 0),
      weight: 8,
    },
  ];

  const totalWeight = componentScores.reduce((sum, component) => sum + component.weight, 0);
  const earnedWeight = componentScores.reduce((sum, component) => sum + (component.score / 100) * component.weight, 0);

  return {
    score: clamp((earnedWeight / totalWeight) * 100),
    components: componentScores.map(component => ({
      ...component,
      score: clamp(component.score),
    })),
    limitations: [
      "Scores are deterministic guidance, not absolute truth.",
      "Trust scoring is intentionally deferred to the Trust & Verification phase.",
      "AI-based contradiction detection is not used in this phase.",
    ],
  };
}

export async function calculateProfileScores(userId) {
  if (!userId) return null;

  const [
    profileRes,
    skillsRes,
    workRes,
    educationRes,
    certificationsRes,
    resumesRes,
    evidenceRes,
    verificationRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("candidate_skills").select("*").eq("user_id", userId),
    supabase.from("candidate_work_experience").select("*").eq("user_id", userId),
    supabase.from("candidate_education").select("*").eq("user_id", userId),
    supabase.from("candidate_certifications").select("*").eq("user_id", userId),
    supabase.from("resumes").select("id, parsed_resume_id, storage_path").eq("user_id", userId),
    supabase.from("candidate_skill_evidence").select("id, candidate_skill_id, confidence_score, source_parsed_resume_id").eq("user_id", userId),
    supabase.from("identity_verifications").select("status").eq("user_id", userId).maybeSingle(),
  ]);

  const errors = [profileRes, skillsRes, workRes, educationRes, certificationsRes, resumesRes, evidenceRes, verificationRes]
    .map(result => result.error)
    .filter(Boolean);
  if (errors.length) throw errors[0];

  const data = {
    profile: profileRes.data || {},
    skills: skillsRes.data || [],
    work: workRes.data || [],
    education: educationRes.data || [],
    certifications: certificationsRes.data || [],
    resumes: resumesRes.data || [],
    evidence: evidenceRes.data || [],
    verification: verificationRes.data || null,
  };

  const completeness = buildCompletenessBreakdown(data);
  const confidence = buildConfidenceBreakdown(data);
  const scoredAt = new Date().toISOString();

  return {
    profile_completeness_score: completeness.score,
    profile_confidence_score: confidence.score,
    trust_score: data.profile.trust_score ?? null,
    last_scored_at: scoredAt,
    score_breakdown_json: {
      scoring_version: "deterministic_v1",
      scored_at: scoredAt,
      completeness,
      confidence,
      trust_score: {
        status: "deferred",
        note: "Trust score is reserved for the Trust & Verification phase.",
      },
    },
  };
}

export async function updateProfileScores(userId) {
  const scores = await calculateProfileScores(userId);
  if (!scores) return null;

  const { error } = await supabase
    .from("profiles")
    .update({
      profile_completeness_score: scores.profile_completeness_score,
      profile_confidence_score: scores.profile_confidence_score,
      trust_score: scores.trust_score,
      last_scored_at: scores.last_scored_at,
      score_breakdown_json: scores.score_breakdown_json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw error;
  return scores;
}
