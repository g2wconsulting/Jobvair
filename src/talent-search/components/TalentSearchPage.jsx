import { useState } from "react";
import { Page, PageHeader, Tabs } from "../../components/ui/index.js";
import QuickSearchTab from "./QuickSearchTab.jsx";
import IdealCandidateProfilePage from "./icp/IdealCandidateProfilePage.jsx";

const TABS = [
  { id: "quick", label: "Quick Search" },
  { id: "profile", label: "Ideal Candidate Profile" },
];

// Root Talent Search experience. "Quick Search" is Phase 1 (free-text →
// instant ranked results); "Ideal Candidate Profile" is Phase 2 (a guided
// describe → review → search flow with mission-alignment evidence and
// provenance-tagged candidate attributes). Every result on both tabs comes
// from mock data — see services/mockCandidateData.js and
// services/mockIcpCandidates.js — not a live search.
export default function TalentSearchPage() {
  const [tab, setTab] = useState("quick");

  return (
    <Page size="wide">
      <PageHeader
        eyebrow="Recruiting"
        title="Talent Search"
        description="Describe the candidate you're looking for in plain language — Jobvair turns it into a structured search across every connected source."
      />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div style={{ marginTop: 16 }}>
        {tab === "quick" && <QuickSearchTab />}
        {tab === "profile" && <IdealCandidateProfilePage />}
      </div>
    </Page>
  );
}
