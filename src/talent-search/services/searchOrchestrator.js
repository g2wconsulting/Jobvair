// Search Orchestrator — the one place that ties planning, provider
// fan-out, normalization, dedup, and scoring together. The UI never talks
// to a provider directly; it only calls runSearch().
//
// Provider searches run concurrently (Promise.allSettled) so one provider
// being slow or failing never blocks or breaks the others — a provider
// error surfaces in providerStatus, but the search still returns whatever
// the healthy providers found.

import { planSearch } from "./mockSearchPlanner.js";
import { dedupeCandidates } from "../normalization/dedupeCandidates.js";
import { scoreCandidate } from "../scoring/scoreCandidate.js";
import { jobvairProvider } from "../providers/jobvairProvider.js";
import { webSearchProvider } from "../providers/webSearchProvider.js";
import { githubProvider } from "../providers/githubProvider.js";
import { socialSearchProvider } from "../providers/socialSearchProvider.js";
import { linkedinProvider } from "../providers/linkedinProvider.js";
import { externalResumeProvider } from "../providers/externalResumeProvider.js";
import { getEnabledProviders } from "../providers/providerRegistry.js";

const ALL_PROVIDERS = [jobvairProvider, webSearchProvider, githubProvider, socialSearchProvider, linkedinProvider, externalResumeProvider];

export function planFromPrompt(prompt) {
  return planSearch(prompt);
}

/**
 * @param {import("../types/candidateShape.js").SearchCriteria} criteria
 */
export async function runSearch(criteria) {
  const enabledKeys = new Set(getEnabledProviders().map(p => p.provider));
  const activeProviders = ALL_PROVIDERS.filter(p => enabledKeys.has(p.key)
    && (criteria.source_filters.length === 0 || criteria.source_filters.includes(p.key)));

  const settled = await Promise.allSettled(activeProviders.map(p => p.searchCandidates(criteria)));

  const providerStatus = settled.map((outcome, i) => ({
    provider: activeProviders[i].key,
    ok: outcome.status === "fulfilled",
    count: outcome.status === "fulfilled" ? outcome.value.length : 0,
    error: outcome.status === "rejected" ? String(outcome.reason?.message || outcome.reason) : null,
  }));

  const rawResults = settled.filter(o => o.status === "fulfilled").flatMap(o => o.value);
  const deduped = dedupeCandidates(rawResults);
  const scored = deduped.map(c => scoreCandidate(c, criteria)).sort((a, b) => b.match_score - a.match_score);

  return { results: scored, providerStatus };
}
