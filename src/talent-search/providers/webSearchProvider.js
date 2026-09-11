// Public Web Search provider — designed to eventually call a server-side
// search API (Bing, Tavily, SerpAPI, etc.) via a Supabase Edge Function.
// Never scrapes sites whose terms prohibit automated access; every result
// keeps its source URL for attribution. Phase 1: mock data only.

import { MOCK_RAW_HITS } from "../services/mockCandidateData.js";
import { isRelevant } from "../services/relevanceFilter.js";
import { normalizeCandidate } from "../normalization/normalizeCandidate.js";
import { getProvider } from "./providerRegistry.js";

const KEY = "web_search";

export const webSearchProvider = {
  key: KEY,
  getCapabilities() {
    return getProvider(KEY);
  },
  async searchCandidates(criteria) {
    await new Promise(r => setTimeout(r, 600));
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
