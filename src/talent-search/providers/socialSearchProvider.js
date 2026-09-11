// Public Professional / Social Web provider — surfaces publicly available
// professional evidence (conference bios, faculty pages, association
// directories, company team pages). Never automates an authenticated
// social-media account. Phase 1: mock data only.

import { MOCK_RAW_HITS } from "../services/mockCandidateData.js";
import { isRelevant } from "../services/relevanceFilter.js";
import { normalizeCandidate } from "../normalization/normalizeCandidate.js";
import { getProvider } from "./providerRegistry.js";

const KEY = "social_web";

export const socialSearchProvider = {
  key: KEY,
  getCapabilities() {
    return getProvider(KEY);
  },
  async searchCandidates(criteria) {
    await new Promise(r => setTimeout(r, 550));
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
