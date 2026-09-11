// Jobvair Internal provider — searches Jobvair's own candidate database.
// Phase 1: mock data standing in for a real query against resumes/profiles.
// This is meant to become the lowest-cost, most-controllable source once
// wired to the real candidate tables (profiles, resumes, candidate_skills,
// etc.) — the interface below is what that real implementation will keep.

import { MOCK_RAW_HITS } from "../services/mockCandidateData.js";
import { isRelevant } from "../services/relevanceFilter.js";
import { normalizeCandidate } from "../normalization/normalizeCandidate.js";
import { getProvider } from "./providerRegistry.js";

const KEY = "jobvair";

export const jobvairProvider = {
  key: KEY,
  getCapabilities() {
    return getProvider(KEY);
  },
  async searchCandidates(criteria) {
    await new Promise(r => setTimeout(r, 350));
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
