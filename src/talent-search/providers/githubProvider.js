// GitHub / Technical Talent provider — surfaces public GitHub signal
// (repos, languages, contributions) as supporting evidence, never as a
// sole hiring signal. Phase 1: mock data only; a real implementation would
// call GitHub's public REST/GraphQL API server-side.

import { MOCK_RAW_HITS } from "../services/mockCandidateData.js";
import { isRelevant } from "../services/relevanceFilter.js";
import { normalizeCandidate } from "../normalization/normalizeCandidate.js";
import { getProvider } from "./providerRegistry.js";

const KEY = "github";

export const githubProvider = {
  key: KEY,
  getCapabilities() {
    return getProvider(KEY);
  },
  async searchCandidates(criteria) {
    await new Promise(r => setTimeout(r, 500));
    return MOCK_RAW_HITS
      .filter(hit => hit.provider === KEY && isRelevant(hit, criteria))
      .map(normalizeCandidate);
  },
  async getCandidate(candidateKey) {
    const hit = MOCK_RAW_HITS.find(h => h.provider === KEY && candidateKey.includes(h.name.toLowerCase().replace(/\s+/g, "-")));
    return hit ? normalizeCandidate(hit) : null;
  },
  normalizeCandidate,
};
