// Mock AI planner for Phase 2 — turns a natural-language "describe your
// ideal candidate" prompt into a structured Ideal Candidate Profile. No
// real AI call yet (Phase 2 is still mock-data-only, same constraint as
// Phase 1's planner). The nonprofit/Phoenix domain below mirrors the
// product spec's own example prompt closely; anything else falls back to
// a generic best-effort guess.

import { createEmptyIdealProfile } from "../types/idealCandidateProfile.js";

const MISSION_KEYWORDS = {
  "animal welfare": "Animal Welfare",
  "animal-welfare": "Animal Welfare",
  education: "Education",
  "faith-based": "Faith-Based Service",
  "faith based": "Faith-Based Service",
  "civil society": "Civil Society",
  veterans: "Veterans",
  environment: "Environment",
  "healthcare access": "Healthcare Access",
  "community development": "Community Development",
};

function extractMissions(prompt) {
  const lower = prompt.toLowerCase();
  return Object.entries(MISSION_KEYWORDS).filter(([kw]) => lower.includes(kw)).map(([, label]) => label)
    .filter((v, i, arr) => arr.indexOf(v) === i);
}

function extractLocation(prompt) {
  const KNOWN = ["Phoenix", "Scottsdale", "Tempe", "Mesa", "Atlanta", "Charlotte", "Richmond"];
  return KNOWN.filter(city => prompt.toLowerCase().includes(city.toLowerCase()));
}

function extractHybridDetail(prompt) {
  const match = prompt.match(/hybrid\s*(\d+)\s*days?/i);
  return match ? `Hybrid, ${match[1]} days/week onsite` : "";
}

export function planIdealProfile(prompt) {
  const profile = createEmptyIdealProfile();

  const isNonprofitFundraising = /nonprofit|fundrais|major gift|development (director|leader)/i.test(prompt);

  if (isNonprofitFundraising) {
    profile.target_titles = ["Director of Development", "VP of Development", "Chief Development Officer"];
    profile.alternate_titles = ["Director of Major Gifts"];
    profile.required_skills = ["Major Gifts", "Donor Relations"];
    profile.preferred_skills = ["Capital Campaigns", "Executive Presence"];
    profile.industries = ["Nonprofit"];
    profile.preferred_certifications = ["CFRE"];
  } else {
    // Generic fallback — best-effort keyword capture, needs recruiter review either way.
    const phrases = prompt.match(/[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*/g) || [];
    profile.target_titles = phrases.slice(0, 2);
    profile.required_skills = phrases.slice(0, 3);
  }

  if (/senior/i.test(prompt)) profile.minimum_years_experience = 8;

  profile.preferred_locations = extractLocation(prompt);

  if (/hybrid/i.test(prompt)) {
    profile.hybrid_preference = "required";
    profile.work_arrangement_note = extractHybridDetail(prompt);
  } else if (/remote/i.test(prompt)) {
    profile.remote_preference = "required";
  } else if (/on ?site/i.test(prompt)) {
    profile.onsite_preference = "required";
  }

  profile.relocation_acceptable = /relocation is acceptable|open to relocation|will relocate|relocation assistance/i.test(prompt);
  profile.mission_values = extractMissions(prompt);

  return profile;
}
