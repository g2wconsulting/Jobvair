// Per-employer feature flags. A company's effective features are the union
// of its subscription plan's `features` array and any explicit overrides in
// `feature_entitlements` (an override always wins, in either direction —
// it can grant a feature the plan doesn't include, or withhold one it does).
//
// DEFAULT_ON features are already-shipped, load-bearing product surfaces —
// keeping them on by default means introducing this system never silently
// hides something a company is already relying on. Everything else starts
// off until a plan or an explicit override turns it on.

export const GATABLE_FEATURES = [
  { key: "assessments", label: "Assessments", description: "Skills assessment library, sending invitations, and viewing results." },
  { key: "assessment_builder", label: "Custom Assessment Builder", description: "Author custom questions and assessments for this company only." },
  { key: "market_intelligence", label: "Market Intelligence", description: "Salary insights and local talent market data." },
  { key: "candidate_messaging", label: "Candidate Messaging", description: "Message applicants directly from their pipeline card." },
  { key: "interview_scheduling", label: "Interview Scheduling", description: "Invite candidates to interviews with a date, time, and location or link." },
  { key: "public_job_board", label: "Public Job Listings", description: "Publish this company's jobs to Jobvair's public, search-indexed job board." },
  { key: "talent_search", label: "Talent Search", description: "AI-assisted candidate sourcing across Jobvair and (as they're configured) external providers. Early access — mock results only until real providers are connected." },
];

const DEFAULT_ON = new Set(["assessments", "assessment_builder", "market_intelligence", "public_job_board"]);

export function computeEffectiveFeatures(planFeatures, entitlements) {
  const planSet = new Set(planFeatures || []);
  const effective = {};
  for (const { key } of GATABLE_FEATURES) {
    effective[key] = DEFAULT_ON.has(key) || planSet.has(key);
  }
  for (const row of entitlements || []) {
    if (row.feature_key in effective || GATABLE_FEATURES.some(f => f.key === row.feature_key)) {
      effective[row.feature_key] = row.enabled;
    }
  }
  return effective;
}

export function hasFeature(features, key) {
  if (!features) return DEFAULT_ON.has(key);
  return Boolean(features[key]);
}
