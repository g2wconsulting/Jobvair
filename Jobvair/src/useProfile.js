/**
 * src/useProfile.js
 * 
 * Loads and saves candidate profile data from Supabase structured tables.
 * 
 * Tables used:
 *   profiles                  — basic info, experience totals, education level
 *   candidate_skills          — one row per skill
 *   candidate_work_experience — one row per job
 *   candidate_education       — one row per degree
 *   candidate_certifications  — one row per cert
 */

import { useState, useCallback } from "react";
import { supabase } from "./supabaseClient";
import { updateProfileScores } from "./lib/profileScoring.js";

const EMPTY_FORM = {
  name: "", email: "", phone: "", location: "",
  city: "", state: "", zip_code: "", country: "US",
  summary: "",
  desiredTitles: [], industries: [],
  availability: "immediately", employmentStatus: "open",
  salaryLevel: "senior", salaryTarget: "",
  employmentTypes: ["full-time"], workLocations: ["remote"],
  backgroundCheck: false, wotcEligible: false, sponsorshipRequired: false,
  openToRelocation: false,
  linkedinUrl: "", githubUrl: "", portfolioUrl: "",
  // Experience totals
  totalYearsExperience: "", totalYearsLeadership: "", totalYearsIndustry: "",
  // Education
  highestEducationLevel: "",
  // Security / work auth
  securityClearance: "", workAuthorization: "",
};

function rowToForm(row) {
  return {
    name:                  row.full_name             ?? "",
    email:                 row.email                 ?? "",
    phone:                 row.phone                 ?? "",
    location:              row.location              ?? "",
    city:                  row.city                  ?? "",
    state:                 row.state                 ?? "",
    zip_code:              row.zip_code              ?? "",
    country:               row.country               ?? "US",
    summary:               row.summary               ?? "",
    desiredTitles:         row.desired_titles         ?? [],
    industries:            row.industries             ?? [],
    availability:          row.availability           ?? "immediately",
    employmentStatus:      row.employment_status      ?? "open",
    salaryLevel:           row.salary_level           ?? "senior",
    salaryTarget:          row.salary_target          ?? "",
    employmentTypes:       row.employment_types       ?? ["full-time"],
    workLocations:         row.work_locations         ?? ["remote"],
    backgroundCheck:       row.background_check       ?? false,
    wotcEligible:          row.wotc_eligible          ?? false,
    sponsorshipRequired:   row.sponsorship_required   ?? false,
    openToRelocation:      row.open_to_relocation     ?? false,
    linkedinUrl:           row.linkedin_url           ?? "",
    githubUrl:             row.github_url             ?? "",
    portfolioUrl:          row.portfolio_url          ?? "",
    totalYearsExperience:  row.total_years_experience ?? "",
    totalYearsLeadership:  row.total_years_leadership ?? "",
    totalYearsIndustry:    row.total_years_industry   ?? "",
    highestEducationLevel: row.highest_education_level ?? "",
    securityClearance:     row.security_clearance     ?? "",
    workAuthorization:     row.work_authorization     ?? "",
  };
}

function formToProfileRow(userId, form) {
  return {
    id:                     userId,
    full_name:              form.name              || null,
    email:                  form.email             || null,
    phone:                  form.phone             || null,
    location:               form.location          || null,
    city:                   form.city              || null,
    state:                  form.state             || null,
    zip_code:               form.zip_code          || null,
    country:                form.country           || "US",
    summary:                form.summary           || null,
    desired_titles:         form.desiredTitles,
    industries:             form.industries,
    availability:           form.availability      || null,
    employment_status:      form.employmentStatus  || null,
    salary_level:           form.salaryLevel       || null,
    salary_target:          form.salaryTarget      || null,
    employment_types:       form.employmentTypes,
    work_locations:         form.workLocations,
    background_check:       form.backgroundCheck,
    wotc_eligible:          form.wotcEligible,
    sponsorship_required:   form.sponsorshipRequired,
    open_to_relocation:     form.openToRelocation,
    linkedin_url:           form.linkedinUrl       || null,
    github_url:             form.githubUrl         || null,
    portfolio_url:          form.portfolioUrl      || null,
    total_years_experience: form.totalYearsExperience !== "" ? Number(form.totalYearsExperience) : null,
    total_years_leadership: form.totalYearsLeadership !== "" ? Number(form.totalYearsLeadership) : null,
    total_years_industry:   form.totalYearsIndustry   !== "" ? Number(form.totalYearsIndustry)   : null,
    highest_education_level: form.highestEducationLevel || null,
    security_clearance:     form.securityClearance || null,
    work_authorization:     form.workAuthorization || null,
    updated_at:             new Date().toISOString(),
  };
}

export function useProfile() {
  const [profileForm,    setProfileForm]    = useState(null);
  const [profileSkills,  setProfileSkills]  = useState([]);
  const [profileWork,    setProfileWork]    = useState([]);
  const [profileEdu,     setProfileEdu]     = useState([]);
  const [profileCerts,   setProfileCerts]   = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError,   setProfileError]   = useState(null);

  const initProfile = useCallback(async (userId, email, fullName) => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      // Load all tables in parallel
      const [profileRes, skillsRes, workRes, eduRes, certsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("candidate_skills").select("*").eq("user_id", userId).order("skill_name"),
        supabase.from("candidate_work_experience").select("*").eq("user_id", userId).order("start_date", { ascending: false }),
        supabase.from("candidate_education").select("*").eq("user_id", userId).order("graduation_year", { ascending: false }),
        supabase.from("candidate_certifications").select("*").eq("user_id", userId).order("created_at"),
      ]);

      if (profileRes.error) throw profileRes.error;

      setProfileForm(profileRes.data ? rowToForm(profileRes.data) : { ...EMPTY_FORM, name: fullName ?? "", email: email ?? "" });
      setProfileSkills(skillsRes.data ?? []);
      setProfileWork(workRes.data ?? []);
      setProfileEdu(eduRes.data ?? []);
      setProfileCerts(certsRes.data ?? []);
    } catch (err) {
      console.error("[useProfile] initProfile error:", err.message);
      setProfileError(err.message);
      setProfileForm({ ...EMPTY_FORM, email: email ?? "" });
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const saveProfile = useCallback(async (userId) => {
    if (!userId || !profileForm) return { error: "Not initialised" };
    try {
      // 1. Upsert the profiles row
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(formToProfileRow(userId, profileForm), { onConflict: "id" });
      if (profileError) throw profileError;

      // 2. Upsert skills — delete removed ones, upsert current ones
      if (profileSkills.length > 0) {
        const skillsToUpsert = profileSkills.map(s => ({
          id:                s.id?.startsWith?.("new_") ? undefined : s.id,
          user_id:           userId,
          skill_name:        s.skill_name,
          category:          s.category          || null,
          years_experience:  s.years_experience  != null ? Number(s.years_experience) : null,
          proficiency_level: s.proficiency_level || null,
          last_used_date:    s.last_used_date    || null,
          is_primary:        s.is_primary        ?? false,
          source:            s.source            || "manual",
          updated_at:        new Date().toISOString(),
        }));
        const { error: skillsError } = await supabase
          .from("candidate_skills")
          .upsert(skillsToUpsert, { onConflict: "user_id,skill_name" });
        if (skillsError) console.error("[useProfile] skills upsert error:", skillsError.message);
      }

      // 3. Work experience — upsert rows that have IDs, insert new ones
      for (const w of profileWork) {
        const row = {
          user_id:     userId,
          job_title:   w.job_title   || null,
          company:     w.company     || null,
          location:    w.location    || null,
          start_date:  w.start_date  || null,
          end_date:    w.end_date    || null,
          is_current:  w.is_current  ?? false,
          description: w.description || null,
          is_leadership: w.is_leadership ?? false,
          industry:    w.industry    || null,
          source:      w.source      || "manual",
          updated_at:  new Date().toISOString(),
        };
        if (w.id && !String(w.id).startsWith("new_")) {
          await supabase.from("candidate_work_experience").update(row).eq("id", w.id);
        } else {
          await supabase.from("candidate_work_experience").insert(row);
        }
      }

      // 4. Education — same pattern
      for (const e of profileEdu) {
        const row = {
          user_id:         userId,
          institution:     e.institution     || null,
          degree:          e.degree          || null,
          major:           e.major           || null,
          graduation_year: e.graduation_year || null,
          is_highest:      e.is_highest      ?? false,
          source:          e.source          || "manual",
          updated_at:      new Date().toISOString(),
        };
        if (e.id && !String(e.id).startsWith("new_")) {
          await supabase.from("candidate_education").update(row).eq("id", e.id);
        } else {
          await supabase.from("candidate_education").insert(row);
        }
      }

      // 5. Certifications
      for (const c of profileCerts) {
        const row = {
          user_id:      userId,
          name:         c.name         || null,
          issuing_org:  c.issuing_org  || null,
          issue_date:   c.issue_date   || null,
          expiry_date:  c.expiry_date  || null,
          credential_id: c.credential_id || null,
          source:       c.source       || "manual",
          updated_at:   new Date().toISOString(),
        };
        if (c.id && !String(c.id).startsWith("new_")) {
          await supabase.from("candidate_certifications").update(row).eq("id", c.id);
        } else {
          await supabase.from("candidate_certifications").insert(row);
        }
      }

      await updateProfileScores(userId);

      return { error: null };
    } catch (err) {
      console.error("[useProfile] saveProfile error:", err.message);
      return { error: err.message };
    }
  }, [profileForm, profileSkills, profileWork, profileEdu, profileCerts]);

  // Called after a resume is parsed — merges parsed data into existing profile state
  const applyParsedResume = useCallback((parsed) => {
    if (!parsed) return;

    // Update basic profile fields — always update from parsed data (fresh parse should win)
    setProfileForm(f => ({
      ...(f ?? EMPTY_FORM),
      name:     parsed.full_name || f?.name     || "",
      email:    parsed.email     || f?.email    || "",
      phone:    parsed.phone     || f?.phone    || "",
      location: parsed.location  || f?.location || "",
      summary:  parsed.summary   || f?.summary  || "",
      // Experience totals from parse
      totalYearsExperience: parsed.profile_update?.total_years_experience ?? f?.totalYearsExperience ?? "",
      totalYearsLeadership: parsed.total_years_leadership ?? parsed.profile_update?.total_years_leadership ?? f?.totalYearsLeadership ?? "",
      // Claude-enriched fields — only set if returned and not already set
      industries:    (parsed.industries?.length    && !f?.industries?.length)    ? parsed.industries    : (f?.industries    ?? []),
      desiredTitles: (parsed.desired_titles?.length && !f?.desiredTitles?.length) ? parsed.desired_titles : (f?.desiredTitles ?? []),
    }));

    // Skills — replace all resume_parsed skills with new ones, keep manual ones
    if (parsed.skills?.length) {
      setProfileSkills(existing => {
        const manualSkills = existing.filter(s => s.source !== "resume_parsed");
        const existingManualNames = new Set(manualSkills.map(s => s.skill_name?.toLowerCase()));
        const newSkills = parsed.skills
          .filter((s) => s.skill_name && !existingManualNames.has(s.skill_name.toLowerCase()))
          .map((s) => ({
            id:                `new_${Date.now()}_${Math.random()}`,
            skill_name:        s.skill_name,
            category:          s.category          ?? null,
            years_experience:  s.years_experience  ?? null,
            proficiency_level: s.proficiency_level ?? null,
            last_used_date:    s.last_used_date    ?? null,
            is_primary:        false,
            source:            "resume_parsed",
          }));
        return [...manualSkills, ...newSkills];
      });
    }

    // Work — replace resume_parsed entries, keep manual
    if (parsed.work_experience?.length) {
      setProfileWork(existing => {
        const manualWork = existing.filter(w => w.source !== "resume_parsed");
        const newWork = parsed.work_experience.map(w => ({ id: `new_${Date.now()}_${Math.random()}`, ...w, source: "resume_parsed" }));
        return [...manualWork, ...newWork];
      });
    }

    // Education — replace resume_parsed entries, keep manual
    if (parsed.education?.length) {
      setProfileEdu(existing => {
        const manualEdu = existing.filter(e => e.source !== "resume_parsed");
        const newEdu = parsed.education.map(e => ({ id: `new_${Date.now()}_${Math.random()}`, ...e, source: "resume_parsed" }));
        return [...manualEdu, ...newEdu];
      });
    }

    // Certifications — replace resume_parsed entries, keep manual
    if (parsed.certifications?.length) {
      setProfileCerts(existing => {
        const manualCerts = existing.filter(c => c.source !== "resume_parsed");
        const newCerts = parsed.certifications.map(c => ({ id: `new_${Date.now()}_${Math.random()}`, name: typeof c === "string" ? c : c.name, source: "resume_parsed" }));
        return [...manualCerts, ...newCerts];
      });
    }
  }, []);

  return {
    profileForm,   setProfileForm,
    profileSkills, setProfileSkills,
    profileWork,   setProfileWork,
    profileEdu,    setProfileEdu,
    profileCerts,  setProfileCerts,
    profileLoading, profileError,
    saveProfile,
    initProfile,
    applyParsedResume,
  };
}
