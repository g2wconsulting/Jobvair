// Mock AI Search Planner — Phase 1 has no real AI call. This simulates what
// the eventual planner (a Claude API call) will produce: structured search
// criteria from a natural-language recruiter prompt. The four domains here
// match the example prompts in the product spec; anything else falls back
// to a generic keyword-based guess so the UI never breaks on an unexpected
// prompt, it just produces a rougher structured result — same as a real
// planner would need a "review before running" step regardless.

import { createEmptyCriteria } from "../types/candidateShape.js";

const SOUTHEAST_STATES = ["Georgia", "North Carolina", "South Carolina", "Virginia", "Florida", "Tennessee", "Alabama"];
const KNOWN_LOCATIONS = ["Atlanta", "Charlotte", "Savannah", "Richmond", "Phoenix", "Fairfax", "Arlington", "Georgia", "North Carolina", "Virginia", "Arizona"];

const DOMAINS = [
  {
    match: /oracle|fusion|hcm|payroll/i,
    build: (prompt) => ({
      target_titles: ["Oracle Fusion HCM Functional Lead", "Oracle HCM Payroll Lead"],
      required_skills: ["Oracle Fusion HCM", "Payroll"],
      preferred_skills: ["Benefits", "OTL"],
      boolean_query: "(Oracle Fusion OR Oracle Cloud HCM) AND Payroll AND (Lead OR Consultant)",
      industries: extractIndustries(prompt, ["Higher Education", "Public Sector"]),
    }),
  },
  {
    match: /accela/i,
    build: () => ({
      target_titles: ["Accela Developer"],
      required_skills: ["Accela", "SQL", "JavaScript"],
      preferred_skills: [],
      boolean_query: "Accela AND SQL AND JavaScript",
      industries: ["Public Sector"],
    }),
  },
  {
    match: /nonprofit|fundraising|major.?gift|development director/i,
    build: () => ({
      target_titles: ["Director of Major Gifts", "VP of Development"],
      required_skills: ["Major Gifts"],
      preferred_skills: ["Capital Campaigns", "Planned Giving"],
      boolean_query: "(\"Major Gifts\" OR \"Development Director\") AND Nonprofit",
      industries: ["Nonprofit"],
    }),
  },
  {
    match: /cybersecurity|security engineer|federal contracting|security\+/i,
    build: () => ({
      target_titles: ["Cybersecurity Engineer", "Security Engineer"],
      required_skills: ["Security+", "Federal Contracting"],
      preferred_skills: ["CISSP"],
      boolean_query: "(Cybersecurity OR \"Security Engineer\") AND \"Federal Contracting\"",
      industries: ["Federal Government"],
    }),
  },
];

function extractIndustries(prompt, candidates) {
  return candidates.filter(c => prompt.toLowerCase().includes(c.toLowerCase()));
}

function extractLocations(prompt) {
  const found = new Set();
  if (/southeast/i.test(prompt)) SOUTHEAST_STATES.forEach(s => found.add(s));
  for (const loc of KNOWN_LOCATIONS) {
    if (prompt.toLowerCase().includes(loc.toLowerCase())) found.add(loc);
  }
  return Array.from(found);
}

function extractYears(prompt) {
  const match = prompt.match(/(\d+)\+?\s*years?/i);
  return match ? Number(match[1]) : 0;
}

function extractSeniority(prompt) {
  if (/senior/i.test(prompt)) return "Senior";
  if (/\blead\b/i.test(prompt)) return "Lead";
  if (/director/i.test(prompt)) return "Director";
  if (/manager/i.test(prompt)) return "Manager";
  return "";
}

function extractCertifications(prompt) {
  const certs = [];
  if (/security\+/i.test(prompt)) certs.push("Security+");
  if (/cissp/i.test(prompt)) certs.push("CISSP");
  if (/cfre/i.test(prompt)) certs.push("CFRE");
  return certs;
}

/**
 * @param {string} prompt
 * @returns {import("../types/candidateShape.js").SearchCriteria}
 */
export function planSearch(prompt) {
  const criteria = createEmptyCriteria();
  const domain = DOMAINS.find(d => d.match.test(prompt));
  const built = domain ? domain.build(prompt) : genericFallback(prompt);

  criteria.target_titles = built.target_titles || [];
  criteria.current_title = built.target_titles?.[0] || "";
  criteria.required_skills = built.required_skills || [];
  criteria.preferred_skills = built.preferred_skills || [];
  criteria.boolean_query = built.boolean_query || "";
  criteria.industries = built.industries || [];
  criteria.locations = extractLocations(prompt);
  criteria.minimum_years_experience = extractYears(prompt);
  criteria.seniority = extractSeniority(prompt);
  criteria.certifications = extractCertifications(prompt);
  criteria.require_open_to_work = /open to (new opportunities|work)/i.test(prompt);
  criteria.keywords = prompt;
  criteria.source_filters = [];

  return criteria;
}

function genericFallback(prompt) {
  // No known domain matched — extract capitalized phrases as a best-effort
  // guess. This is intentionally rough: a prompt this far outside the mock
  // dataset's domains won't return strong mock results either, and that's
  // an honest reflection of a real planner needing recruiter review too.
  const capitalizedPhrases = prompt.match(/[A-Z][a-zA-Z0-9+.]*(?:\s+[A-Z][a-zA-Z0-9+.]*)*/g) || [];
  return {
    target_titles: capitalizedPhrases.slice(0, 2),
    required_skills: capitalizedPhrases.slice(0, 4),
    preferred_skills: [],
    boolean_query: capitalizedPhrases.slice(0, 3).join(" AND ") || prompt,
    industries: [],
  };
}
