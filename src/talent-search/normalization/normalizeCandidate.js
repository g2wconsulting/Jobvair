// Converts one provider's raw hit into the common Candidate shape (see
// types/candidateShape.js). This is the one place that knows about
// per-provider field quirks — everything downstream (dedup, scoring, UI)
// only ever sees the normalized shape, never a raw provider record.

import { createEmptyCandidate } from "../types/candidateShape.js";

const PROVIDER_BASE_CONFIDENCE = {
  jobvair: 0.95,
  web_search: 0.7,
  github: 0.85,
  social_web: 0.75,
  linkedin: 0.9,
  external_resume: 0.8,
};

export function normalizeCandidate(raw) {
  const candidate = createEmptyCandidate();
  const confidence = PROVIDER_BASE_CONFIDENCE[raw.provider] ?? 0.6;
  const retrievedAt = new Date().toISOString();

  candidate.candidate_key = `${raw.provider}:${slugify(raw.name)}:${slugify(raw.location)}`;
  candidate.name = raw.name;
  candidate.headline = raw.headline || raw.current_title || "";
  candidate.location = raw.location || "";
  candidate.current_title = raw.current_title || "";
  candidate.current_company = raw.current_company || "";
  candidate.skills = raw.skills || [];
  candidate.experience = raw.experience || [];
  candidate.education = raw.education || [];
  candidate.certifications = raw.certifications || [];
  candidate.public_profiles = raw.public_profiles || [];
  candidate.years_experience = raw.years_experience ?? null;
  candidate.industries = raw.industries || [];
  candidate.security_clearance = raw.security_clearance || null;

  candidate.source_records = [{
    provider: raw.provider,
    record_id: candidate.candidate_key,
    url: raw.source_url || null,
    retrieved_at: retrievedAt,
  }];

  candidate.evidence = [
    ...(raw.skills || []).map(skill => ({ value: skill, source: raw.provider, source_url: raw.source_url || null, confidence })),
    ...(raw.current_title ? [{ value: raw.current_title, source: raw.provider, source_url: raw.source_url || null, confidence }] : []),
    ...(raw.industries || []).map(ind => ({ value: ind, source: raw.provider, source_url: raw.source_url || null, confidence })),
  ];

  candidate.confidence = confidence;
  return candidate;
}

function slugify(text) {
  return (text || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
}
