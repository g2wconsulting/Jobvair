import { supabase } from "../supabaseClient";
import { updateProfileScores } from "./profileScoring.js";

const SOURCE = "resume_parsed";
const UNCONFIRMED = "unconfirmed";

const clean = value => (typeof value === "string" ? value.trim() : value);
const nonEmpty = value => {
  if (Array.isArray(value)) return value.length > 0;
  if (value === 0) return true;
  return value !== undefined && value !== null && clean(value) !== "";
};
const normalizeSkillName = value => clean(value || "")?.toLowerCase() || "";
const toNumberOrNull = value => {
  if (value === "" || value === undefined || value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};
const confidence = value => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};
const isConfirmedOrManual = row =>
  row?.source === "manual" ||
  row?.confirmation_status === "candidate_confirmed" ||
  row?.confirmation_status === "system_verified";

const preferIncoming = (existing, incomingConfidence) => {
  if (!existing) return true;
  if (isConfirmedOrManual(existing)) return false;
  const existingConfidence = confidence(existing.confidence_score);
  if (incomingConfidence === null) return existingConfidence === null;
  if (existingConfidence === null) return true;
  return incomingConfidence >= existingConfidence;
};

const mergeField = (existing, field, incoming, allowOverwrite) => {
  if (!nonEmpty(incoming)) return existing?.[field] ?? null;
  if (!nonEmpty(existing?.[field])) return incoming;
  return allowOverwrite ? incoming : existing[field];
};

const sameLower = (a, b) => normalizeSkillName(a) === normalizeSkillName(b);

async function insertSkillEvidenceRows(rows) {
  if (!rows.length) return;

  const { error } = await supabase
    .from("candidate_skill_evidence")
    .insert(rows);
  if (!error) return;

  console.error("[profileEnrichment] candidate_skill_evidence full insert failed:", error.message);

  const minimalRows = rows.map(row => ({
    user_id: row.user_id,
    candidate_skill_id: row.candidate_skill_id,
    source_type: row.source_type,
    source_table: row.source_table,
    source_id: row.source_id,
    source_parsed_resume_id: row.source_parsed_resume_id,
    source_resume_id: row.source_resume_id,
    skill_name: row.skill_name,
    normalized_skill_name: row.normalized_skill_name,
    evidence_text: row.evidence_text,
    last_used_date: row.last_used_date,
    years_inferred: row.years_inferred,
    confidence_score: row.confidence_score,
  }));

  const { error: minimalError } = await supabase
    .from("candidate_skill_evidence")
    .insert(minimalRows);
  if (minimalError) {
    throw new Error(`Skill evidence insert failed: ${minimalError.message}`);
  }
}

function buildProfilePatch(userId, parsed) {
  return {
    id: userId,
    full_name: parsed.full_name || undefined,
    email: parsed.email || undefined,
    phone: parsed.phone || undefined,
    location: parsed.location || undefined,
    summary: parsed.summary || undefined,
    total_years_experience: toNumberOrNull(parsed.profile_update?.total_years_experience),
    total_years_leadership: toNumberOrNull(parsed.total_years_leadership ?? parsed.profile_update?.total_years_leadership),
    desired_titles: parsed.desired_titles?.length ? parsed.desired_titles : undefined,
    industries: parsed.industries?.length ? parsed.industries : undefined,
    profile_source: SOURCE,
    enrichment_status: "completed",
    last_enriched_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

async function persistProfile(userId, parsed) {
  const { data: existing, error: loadError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (loadError) throw loadError;

  const patch = buildProfilePatch(userId, parsed);
  const merged = {
    id: userId,
    full_name: mergeField(existing, "full_name", patch.full_name, false),
    email: mergeField(existing, "email", patch.email, false),
    phone: mergeField(existing, "phone", patch.phone, false),
    location: mergeField(existing, "location", patch.location, false),
    summary: mergeField(existing, "summary", patch.summary, false),
    total_years_experience: mergeField(existing, "total_years_experience", patch.total_years_experience, false),
    total_years_leadership: mergeField(existing, "total_years_leadership", patch.total_years_leadership, false),
    desired_titles: existing?.desired_titles?.length ? existing.desired_titles : (patch.desired_titles || []),
    industries: existing?.industries?.length ? existing.industries : (patch.industries || []),
    profile_source: existing?.profile_source || SOURCE,
    enrichment_status: "completed",
    last_enriched_at: patch.last_enriched_at,
    updated_at: patch.updated_at,
  };

  const { error } = await supabase
    .from("profiles")
    .upsert(merged, { onConflict: "id" });
  if (error) throw error;
}

async function persistSkills({ userId, parsed, parsedResumeId, sourceResumeId }) {
  const parsedSkills = [];
  const seenSkillNames = new Set();
  for (const skill of parsed.skills || []) {
    const normalized = normalizeSkillName(skill.skill_name || skill.name);
    if (!normalized || seenSkillNames.has(normalized)) continue;
    seenSkillNames.add(normalized);
    parsedSkills.push(skill);
  }
  if (!parsedSkills.length) return [];

  const { data: existingSkills, error: loadError } = await supabase
    .from("candidate_skills")
    .select("*")
    .eq("user_id", userId);
  if (loadError) throw loadError;

  const savedSkills = [];

  for (const raw of parsedSkills) {
    const skillName = clean(raw.skill_name || raw.name);
    if (!skillName) continue;

    const normalized = normalizeSkillName(skillName);
    const incomingConfidence = confidence(raw.confidence_score);
    const existing = (existingSkills || []).find(s => sameLower(s.normalized_skill_name || s.skill_name, normalized));
    const allowOverwrite = preferIncoming(existing, incomingConfidence);

    const row = {
      user_id: userId,
      skill_name: existing?.skill_name || skillName,
      normalized_skill_name: normalized,
      category: mergeField(existing, "category", raw.category, allowOverwrite),
      years_experience: mergeField(existing, "years_experience", toNumberOrNull(raw.years_experience), allowOverwrite),
      proficiency_level: mergeField(existing, "proficiency_level", raw.proficiency_level, allowOverwrite),
      last_used_date: mergeField(existing, "last_used_date", raw.last_used_date, allowOverwrite),
      first_used_date: mergeField(existing, "first_used_date", raw.first_used_date, allowOverwrite),
      is_primary: existing?.is_primary ?? raw.is_primary ?? false,
      is_secondary: existing?.is_secondary ?? raw.is_secondary ?? false,
      confidence_score: mergeField(existing, "confidence_score", incomingConfidence, allowOverwrite),
      source: existing?.source || SOURCE,
      confirmation_status: existing?.confirmation_status || UNCONFIRMED,
      last_inferred_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const query = existing?.id
      ? supabase.from("candidate_skills").update(row).eq("id", existing.id).select().single()
      : supabase.from("candidate_skills").insert(row).select().single();
    const { data, error } = await query;
    if (error) throw error;
    savedSkills.push({ skill: data, raw });
  }

  if (!savedSkills.length) return savedSkills;

  const evidenceRows = savedSkills.map(({ skill, raw }) => ({
    user_id: userId,
    candidate_skill_id: skill.id,
    source_type: "resume",
    source_table: "parsed_resumes",
    source_id: parsedResumeId,
    source_parsed_resume_id: parsedResumeId,
    source_resume_id: sourceResumeId || null,
    skill_name: skill.skill_name,
    normalized_skill_name: skill.normalized_skill_name || normalizeSkillName(skill.skill_name),
    evidence_text: raw.evidence_text || raw.context || `Skill parsed from uploaded resume: ${skill.skill_name}`,
    job_title: raw.job_title || null,
    company: raw.company || null,
    industry: raw.industry || null,
    first_used_date: raw.first_used_date || null,
    last_used_date: raw.last_used_date || null,
    years_inferred: toNumberOrNull(raw.years_experience),
    confidence_score: confidence(raw.confidence_score),
    evidence_strength: raw.evidence_strength || null,
    extraction_method: SOURCE,
    metadata: {
      source: SOURCE,
      confirmation_status: UNCONFIRMED,
    },
  }));

  await insertSkillEvidenceRows(evidenceRows);

  for (const { skill } of savedSkills) {
    await supabase
      .from("candidate_skills")
      .update({ evidence_count: (skill.evidence_count || 0) + 1 })
      .eq("id", skill.id);
  }

  return savedSkills;
}

const workKey = row => [
  normalizeSkillName(row.job_title),
  normalizeSkillName(row.company),
  row.start_date || "",
].join("|");

async function persistWork({ userId, parsed, parsedResumeId, sourceResumeId }) {
  const incoming = parsed.work_experience || [];
  if (!incoming.length) return;

  const { data: existingRows, error: loadError } = await supabase
    .from("candidate_work_experience")
    .select("*")
    .eq("user_id", userId);
  if (loadError) throw loadError;

  for (const raw of incoming) {
    const key = workKey(raw);
    const existing = (existingRows || []).find(row => workKey(row) === key);
    const incomingConfidence = confidence(raw.confidence_score);
    const allowOverwrite = preferIncoming(existing, incomingConfidence);
    const row = {
      user_id: userId,
      job_title: mergeField(existing, "job_title", raw.job_title, allowOverwrite),
      company: mergeField(existing, "company", raw.company, allowOverwrite),
      location: mergeField(existing, "location", raw.location, allowOverwrite),
      start_date: mergeField(existing, "start_date", raw.start_date, allowOverwrite),
      end_date: mergeField(existing, "end_date", raw.end_date, allowOverwrite),
      is_current: existing?.is_current ?? raw.is_current ?? false,
      description: mergeField(existing, "description", raw.description, allowOverwrite),
      is_leadership: existing?.is_leadership ?? raw.is_leadership ?? false,
      industry: mergeField(existing, "industry", raw.industry, allowOverwrite),
      source: existing?.source || SOURCE,
      confidence_score: mergeField(existing, "confidence_score", incomingConfidence, allowOverwrite),
      source_resume_id: existing?.source_resume_id || sourceResumeId || null,
      source_parsed_resume_id: existing?.source_parsed_resume_id || parsedResumeId,
      confirmation_status: existing?.confirmation_status || UNCONFIRMED,
      updated_at: new Date().toISOString(),
    };

    const { error } = existing?.id
      ? await supabase.from("candidate_work_experience").update(row).eq("id", existing.id)
      : await supabase.from("candidate_work_experience").insert(row);
    if (error) throw error;
  }
}

const educationKey = row => [
  normalizeSkillName(row.institution),
  normalizeSkillName(row.degree),
  normalizeSkillName(row.major),
].join("|");

async function persistEducation({ userId, parsed, parsedResumeId, sourceResumeId }) {
  const incoming = parsed.education || [];
  if (!incoming.length) return;

  const { data: existingRows, error: loadError } = await supabase
    .from("candidate_education")
    .select("*")
    .eq("user_id", userId);
  if (loadError) throw loadError;

  for (const raw of incoming) {
    const key = educationKey(raw);
    const existing = (existingRows || []).find(row => educationKey(row) === key);
    const incomingConfidence = confidence(raw.confidence_score);
    const allowOverwrite = preferIncoming(existing, incomingConfidence);
    const row = {
      user_id: userId,
      institution: mergeField(existing, "institution", raw.institution, allowOverwrite),
      degree: mergeField(existing, "degree", raw.degree, allowOverwrite),
      major: mergeField(existing, "major", raw.major, allowOverwrite),
      graduation_year: mergeField(existing, "graduation_year", raw.graduation_year, allowOverwrite),
      is_highest: existing?.is_highest ?? raw.is_highest ?? false,
      education_level: mergeField(existing, "education_level", raw.education_level, allowOverwrite),
      source: existing?.source || SOURCE,
      confidence_score: mergeField(existing, "confidence_score", incomingConfidence, allowOverwrite),
      source_resume_id: existing?.source_resume_id || sourceResumeId || null,
      source_parsed_resume_id: existing?.source_parsed_resume_id || parsedResumeId,
      confirmation_status: existing?.confirmation_status || UNCONFIRMED,
      updated_at: new Date().toISOString(),
    };

    const { error } = existing?.id
      ? await supabase.from("candidate_education").update(row).eq("id", existing.id)
      : await supabase.from("candidate_education").insert(row);
    if (error) throw error;
  }
}

const certName = cert => typeof cert === "string" ? cert : cert?.name;
const certKey = cert => [
  normalizeSkillName(certName(cert)),
  normalizeSkillName(cert?.issuing_org || cert?.issuer),
].join("|");

async function persistCertifications({ userId, parsed, parsedResumeId, sourceResumeId }) {
  const incoming = parsed.certifications || [];
  if (!incoming.length) return;

  const { data: existingRows, error: loadError } = await supabase
    .from("candidate_certifications")
    .select("*")
    .eq("user_id", userId);
  if (loadError) throw loadError;

  for (const rawValue of incoming) {
    const raw = typeof rawValue === "string" ? { name: rawValue } : rawValue;
    const key = certKey(raw);
    const existing = (existingRows || []).find(row => certKey(row) === key);
    const incomingConfidence = confidence(raw.confidence_score);
    const allowOverwrite = preferIncoming(existing, incomingConfidence);
    const row = {
      user_id: userId,
      name: mergeField(existing, "name", raw.name, allowOverwrite),
      issuing_org: mergeField(existing, "issuing_org", raw.issuing_org || raw.issuer, allowOverwrite),
      issue_date: mergeField(existing, "issue_date", raw.issue_date, allowOverwrite),
      expiry_date: mergeField(existing, "expiry_date", raw.expiry_date, allowOverwrite),
      credential_id: mergeField(existing, "credential_id", raw.credential_id, allowOverwrite),
      verification_status: existing?.verification_status || raw.verification_status || "unverified",
      source: existing?.source || SOURCE,
      confidence_score: mergeField(existing, "confidence_score", incomingConfidence, allowOverwrite),
      source_resume_id: existing?.source_resume_id || sourceResumeId || null,
      source_parsed_resume_id: existing?.source_parsed_resume_id || parsedResumeId,
      confirmation_status: existing?.confirmation_status || UNCONFIRMED,
      updated_at: new Date().toISOString(),
    };

    const { error } = existing?.id
      ? await supabase.from("candidate_certifications").update(row).eq("id", existing.id)
      : await supabase.from("candidate_certifications").insert(row);
    if (error) throw error;
  }
}

export async function persistResumeEnrichment({ userId, parsed, parsedResumeId, sourceResumeId }) {
  if (!userId || !parsed) return;

  let enrichmentError = null;

  await persistProfile(userId, parsed);
  try {
    await persistSkills({ userId, parsed, parsedResumeId, sourceResumeId });
    await persistWork({ userId, parsed, parsedResumeId, sourceResumeId });
    await persistEducation({ userId, parsed, parsedResumeId, sourceResumeId });
    await persistCertifications({ userId, parsed, parsedResumeId, sourceResumeId });
  } catch (err) {
    enrichmentError = err;
    console.error("[profileEnrichment] enrichment persistence failed:", err.message);
  }

  await supabase
    .from("parsed_resumes")
    .update({
      parse_status: "completed",
      parsed_json: parsed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsedResumeId)
    .eq("user_id", userId);

  await updateProfileScores(userId);

  if (enrichmentError) throw enrichmentError;
}
