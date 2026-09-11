// LinkedIn provider — intentionally inert. Per the compliance requirement,
// Jobvair never scrapes LinkedIn or automates a Recruiter browser session,
// and never stores a recruiter's LinkedIn credentials. This adapter exists
// only so the orchestrator has a stable shape to call once (and if) valid
// LinkedIn Talent Solutions partner credentials are configured — until
// then it always reports disabled and returns nothing.

import { getProvider } from "./providerRegistry.js";

const KEY = "linkedin";

export const linkedinProvider = {
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
