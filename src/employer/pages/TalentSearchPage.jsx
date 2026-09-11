import TalentSearchRoot from "../../talent-search/components/TalentSearchPage.jsx";

// Thin wrapper matching the pattern used by AssessmentBuilderPage.jsx —
// keeps the employer/pages/ routing convention while the actual feature
// lives in its own top-level module (src/talent-search/) per the product
// spec's provider-based architecture.
export default function TalentSearchPage() {
  return <TalentSearchRoot />;
}
