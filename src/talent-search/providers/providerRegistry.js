// Capability-detection registry for Talent Search providers. This is the
// only place that knows which providers exist and whether each is actually
// usable — the UI and search orchestrator only ever read `enabled`, never
// hardcode a provider name into search logic.
//
// Phase 1: every entry here is a static description of what the provider
// WOULD be, mocked to look and behave like it will once wired up. No real
// credentials, no network calls. The "jobvair", "web_search", and "github"
// providers are marked enabled for the mock demo so recruiters can see the
// full multi-source experience; LinkedIn and the external resume database
// stay disabled until real partner credentials exist, per the compliance
// requirement that they must never silently enable themselves.

export const PROVIDERS = [
  {
    provider: "jobvair",
    label: "Jobvair Internal",
    enabled: true,
    mock: true,
    capabilities: ["candidate_search", "profile_lookup", "resume_search"],
    reason: null,
    cost_per_search: 0,
  },
  {
    provider: "web_search",
    label: "Public Web Search",
    enabled: true,
    mock: true,
    capabilities: ["candidate_search"],
    reason: null,
    cost_per_search: 0,
  },
  {
    provider: "github",
    label: "GitHub / Technical",
    enabled: true,
    mock: true,
    capabilities: ["candidate_search", "profile_lookup"],
    reason: null,
    cost_per_search: 0,
  },
  {
    provider: "social_web",
    label: "Public Professional / Social Web",
    enabled: true,
    mock: true,
    capabilities: ["candidate_search"],
    reason: null,
    cost_per_search: 0,
  },
  {
    provider: "linkedin",
    label: "LinkedIn Recruiter",
    enabled: false,
    mock: false,
    capabilities: ["candidate_search", "profile_lookup", "ats_matching"],
    reason: "LinkedIn Talent Solutions integration not configured",
    cost_per_search: null,
  },
  {
    provider: "external_resume",
    label: "External Resume Database",
    enabled: false,
    mock: false,
    capabilities: ["candidate_search", "resume_search"],
    reason: "No external resume database provider configured",
    cost_per_search: null,
  },
];

export function getEnabledProviders() {
  return PROVIDERS.filter(p => p.enabled);
}

export function getProvider(key) {
  return PROVIDERS.find(p => p.provider === key) || null;
}
