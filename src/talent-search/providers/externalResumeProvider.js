// External Resume / Talent Database provider — placeholder adapter for a
// future commercial candidate-database integration (resume databases,
// staffing sourcing platforms, talent intelligence platforms). Each such
// vendor gets its own independent provider module — never vendor-specific
// logic in the search UI. Disabled until a real vendor is configured.

import { getProvider } from "./providerRegistry.js";

const KEY = "external_resume";

export const externalResumeProvider = {
  key: KEY,
  getCapabilities() {
    return getProvider(KEY);
  },
  async searchCandidates() {
    return [];
  },
  async getCandidate() {
    return null;
  },
  normalizeCandidate(raw) {
    return raw;
  },
};
