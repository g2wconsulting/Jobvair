// Mock candidate pool for the Ideal Candidate Profile flow (Phase 2).
// Fully-formed (already normalized + evidence-tagged) rather than raw
// per-provider hits like Phase 1's mockCandidateData.js, since Phase 2's
// job is to demonstrate the evidence/provenance model end-to-end, not
// provider fan-out again. Every fact carries how confident we are and
// where it came from — nothing here is presented as more certain than a
// real source would justify, and it's all fictional, scoped to this mock
// dataset only.

import { provenance, notFound } from "../types/idealCandidateProfile.js";

export const MOCK_ICP_CANDIDATES = [
  {
    candidate_key: "icp-elena-cortez",
    name: "Elena Cortez",
    headline: "Director of Major Gifts",
    current_title: "Director of Major Gifts",
    current_company: "Desert Horizon Foundation",
    years_experience: 10,
    skills: ["Major Gifts", "Planned Giving", "Donor Relations", "Capital Campaigns", "Staff Management"],
    industries: ["Nonprofit"],
    certifications: ["CFRE"],
    management_experience: true,
    budget_responsibility: "$1.3M major-gift portfolio",
    revenue_responsibility: "$1.3M annual major-gift revenue",
    education: [{ degree: "M.A.", field: "Nonprofit Management", institution: "Arizona State University" }],
    location_info: {
      current_location: provenance("Phoenix, Arizona", "candidate_provided", "resume", 0.98),
      relocation_willingness: notFound(),
      travel_willingness: provenance("Occasional regional travel", "publicly_supported", "conference bio", 0.6),
    },
    compensation_info: {
      candidate_expected_salary: notFound(),
      candidate_current_compensation: notFound(),
      market_estimated_compensation: { range: [125000, 145000], label: "Estimated market compensation for comparable role at this employer", source: "External compensation market data", confidence: "Medium" },
    },
    mission_evidence: [
      {
        mission: "Animal Welfare",
        strength: "strong",
        evidence: [
          { text: "Volunteer, Humane Society (2021–2024)", evidence_type: "volunteer_work", source_name: "Humane Society volunteer directory", source_url: "https://example-humane-society.org/volunteers/elena-cortez", date_found: "2026-08-01", confidence: 0.85 },
          { text: "Board Member, Local Animal Rescue", evidence_type: "board_membership", source_name: "Local Animal Rescue board page", source_url: "https://example-animal-rescue.org/board", date_found: "2026-08-01", confidence: 0.9 },
        ],
      },
      {
        mission: "Education",
        strength: "limited",
        evidence: [
          { text: "Guest lecturer on nonprofit fundraising at a local university continuing-education program", evidence_type: "publication", source_name: "University CE program page", source_url: "https://example-university.edu/ce/guest-speakers", date_found: "2026-08-01", confidence: 0.55 },
        ],
      },
      {
        mission: "Faith-Based Service",
        strength: "none",
        evidence: [],
      },
    ],
    source_records: [{ provider: "jobvair", url: null }],
  },
  {
    candidate_key: "icp-grace-liu",
    name: "Grace Liu",
    headline: "VP of Development",
    current_title: "VP of Development",
    current_company: "Sonoran Children's Alliance",
    years_experience: 13,
    skills: ["Major Gifts", "Capital Campaigns", "Board Relations", "Executive Presence"],
    industries: ["Nonprofit"],
    certifications: [],
    management_experience: true,
    budget_responsibility: "Development department, 6 staff",
    revenue_responsibility: "$2M+ average major-gift portfolios across team",
    education: [],
    location_info: {
      current_location: provenance("Phoenix, Arizona", "publicly_supported", "conference bio", 0.8),
      relocation_willingness: notFound(),
      travel_willingness: notFound(),
    },
    compensation_info: {
      candidate_expected_salary: notFound(),
      candidate_current_compensation: notFound(),
      market_estimated_compensation: { range: [140000, 165000], label: "Estimated market compensation for comparable role at this employer", source: "External compensation market data", confidence: "Medium" },
    },
    mission_evidence: [
      {
        mission: "Education",
        strength: "strong",
        evidence: [
          { text: "Board service with a youth education nonprofit", evidence_type: "board_membership", source_name: "Youth education nonprofit annual report", source_url: "https://example-youth-education.org/annual-report-2025", date_found: "2026-08-01", confidence: 0.85 },
        ],
      },
      {
        mission: "Animal Welfare",
        strength: "moderate",
        evidence: [
          { text: "Volunteer fundraising for an animal rescue event", evidence_type: "volunteer_work", source_name: "Local news coverage of charity fundraiser", source_url: "https://example-news.example.com/charity-gala-2025", date_found: "2026-08-01", confidence: 0.65 },
        ],
      },
      { mission: "Faith-Based Service", strength: "none", evidence: [] },
    ],
    source_records: [{ provider: "web_search", url: "https://example-fundraising-summit.org/speakers/grace-liu" }],
  },
  {
    candidate_key: "icp-marcus-bell",
    name: "Marcus Bell",
    headline: "Chief Development Officer",
    current_title: "Chief Development Officer",
    current_company: "Grace Community Services",
    years_experience: 15,
    skills: ["Major Gifts", "Capital Campaigns", "Donor Relations", "Strategic Planning"],
    industries: ["Nonprofit", "Faith-Based"],
    certifications: ["CFRE"],
    management_experience: true,
    budget_responsibility: "Full development operations budget",
    revenue_responsibility: "$3M+ annual fundraising",
    education: [{ degree: "M.Div.", field: "Divinity", institution: "example seminary" }],
    location_info: {
      current_location: provenance("Scottsdale, Arizona", "candidate_provided", "resume", 0.95),
      relocation_willingness: notFound(),
      travel_willingness: provenance("Regional and national travel for donor visits", "candidate_provided", "resume", 0.9),
    },
    compensation_info: {
      candidate_expected_salary: provenance(150000, "candidate_provided", "screening questionnaire", 0.9),
      candidate_current_compensation: notFound(),
      market_estimated_compensation: { range: [145000, 170000], label: "Estimated market compensation for comparable role at this employer", source: "External compensation market data", confidence: "Medium" },
    },
    mission_evidence: [
      {
        mission: "Faith-Based Service",
        strength: "strong",
        evidence: [
          { text: "Chief Development Officer at a faith-based social services organization for 6 years", evidence_type: "nonprofit_employment", source_name: "Grace Community Services staff page", source_url: "https://example-gcs.org/staff/marcus-bell", date_found: "2026-08-01", confidence: 0.92 },
        ],
      },
      { mission: "Animal Welfare", strength: "none", evidence: [] },
      { mission: "Education", strength: "none", evidence: [] },
    ],
    source_records: [{ provider: "social_web", url: "https://example-gcs.org/staff/marcus-bell" }],
  },
  {
    candidate_key: "icp-dana-frost",
    name: "Dana Frost",
    headline: "Director of Institutional Advancement",
    current_title: "Director of Institutional Advancement",
    current_company: "Cactus Valley Community College Foundation",
    years_experience: 8,
    skills: ["Major Gifts", "Alumni Relations", "Grant Writing"],
    industries: ["Nonprofit", "Education"],
    certifications: [],
    management_experience: false,
    budget_responsibility: null,
    revenue_responsibility: "$650K annual major-gift revenue",
    education: [],
    location_info: {
      current_location: provenance("Tempe, Arizona", "publicly_supported", "company bio", 0.75),
      relocation_willingness: notFound(),
      travel_willingness: notFound(),
    },
    compensation_info: {
      candidate_expected_salary: notFound(),
      candidate_current_compensation: notFound(),
      market_estimated_compensation: { range: [90000, 110000], label: "Estimated market compensation for comparable role at this employer", source: "External compensation market data", confidence: "Medium" },
    },
    mission_evidence: [
      { mission: "Education", strength: "strong", evidence: [{ text: "Current role is entirely within a community college advancement office", evidence_type: "nonprofit_employment", source_name: "Cactus Valley CC Foundation staff page", source_url: "https://example-cvccf.org/staff", date_found: "2026-08-01", confidence: 0.88 }] },
      { mission: "Animal Welfare", strength: "none", evidence: [] },
      { mission: "Faith-Based Service", strength: "none", evidence: [] },
    ],
    source_records: [{ provider: "web_search", url: "https://example-cvccf.org/staff" }],
  },
];
