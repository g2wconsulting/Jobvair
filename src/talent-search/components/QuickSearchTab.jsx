import { useState } from "react";
import { EmptyState, Spinner, Input, Button } from "../../components/ui/index.js";
import { useTalentSearch } from "../hooks/useTalentSearch.js";
import AISearchBar from "./AISearchBar.jsx";
import StructuredCriteriaPanel from "./StructuredCriteriaPanel.jsx";
import ProviderStatusBar from "./ProviderStatusBar.jsx";
import CandidateResultCard from "./CandidateResultCard.jsx";
import CandidateDetailDrawer from "./CandidateDetailDrawer.jsx";
import SearchExpansionSuggestions from "./SearchExpansionSuggestions.jsx";
import CompareDrawer from "./CompareDrawer.jsx";
import { UserSearch, FolderPlus } from "lucide-react";

// Phase 1 flow — free-text search with instant results. Every result comes
// from src/talent-search/services/mockCandidateData.js, not a live search.
export default function QuickSearchTab() {
  const {
    criteria, results, providerStatus, loading, hasSearched,
    selectedCandidateKey, compareKeys, candidateStatus, notes, projects,
    search, updateCriteria, rerunSearch, applyExpansion, findSimilar,
    setSelectedCandidateKey, setCandidateAction, addNote, toggleCompare, saveProject,
  } = useTalentSearch();

  const [showCompare, setShowCompare] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [showSaveProject, setShowSaveProject] = useState(false);

  const selectedCandidate = results.find(r => r.candidate_key === selectedCandidateKey);
  const strongCount = results.filter(r => r.match_score >= 80).length;
  const compareCandidates = results.filter(r => compareKeys.has(r.candidate_key));

  return (
    <div>
      <AISearchBar onSearch={search} searching={loading} />

      {hasSearched && (
        <StructuredCriteriaPanel criteria={criteria} onChange={updateCriteria} onSearch={rerunSearch} searching={loading} />
      )}

      {hasSearched && <ProviderStatusBar providerStatus={providerStatus} />}

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 60, gap: 12 }}>
          <Spinner />
          <div style={{ fontSize: 13, color: "var(--jv-color-muted)" }}>Searching across connected sources…</div>
        </div>
      )}

      {!loading && hasSearched && results.length === 0 && (
        <EmptyState icon={UserSearch} title="No candidates matched" description="Try broadening your criteria, or rephrase your search — Jobvair will re-interpret it." />
      )}

      {!loading && hasSearched && results.length > 0 && (
        <>
          <SearchExpansionSuggestions criteria={criteria} strongCount={strongCount} onApply={applyExpansion} />

          {compareKeys.size > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <Button size="sm" variant="secondary" onClick={() => setShowCompare(true)}>Compare {compareKeys.size} selected</Button>
            </div>
          )}

          <div style={{ display: "grid", gap: 12 }}>
            {results.map(candidate => (
              <CandidateResultCard
                key={candidate.candidate_key}
                candidate={candidate}
                status={candidateStatus[candidate.candidate_key]}
                comparing={compareKeys.has(candidate.candidate_key)}
                onView={() => setSelectedCandidateKey(candidate.candidate_key)}
                onFindSimilar={() => findSimilar(candidate)}
                onCompareToggle={() => toggleCompare(candidate.candidate_key)}
                onShortlist={() => setCandidateAction(candidate.candidate_key, "shortlisted")}
                onReject={() => setCandidateAction(candidate.candidate_key, "rejected")}
                onSave={() => { setCandidateAction(candidate.candidate_key, "saved"); setShowSaveProject(true); }}
              />
            ))}
          </div>
        </>
      )}

      {!hasSearched && !loading && (
        <EmptyState icon={UserSearch} title="Describe who you're looking for" description="Use the search bar above, or try one of the example prompts to see how Jobvair interprets a request." />
      )}

      {showSaveProject && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 150, background: "#fff", boxShadow: "var(--jv-shadow-lg)", borderRadius: 12, padding: 16, width: 300 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: 13, fontWeight: 700 }}>
            <FolderPlus size={15} /> Save this search as a project
          </div>
          <Input placeholder="e.g. Oracle HCM Lead — Atlanta" value={projectName} onChange={e => setProjectName(e.target.value)} style={{ marginBottom: 10 }} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button size="sm" variant="ghost" onClick={() => setShowSaveProject(false)}>Dismiss</Button>
            <Button size="sm" disabled={!projectName.trim()} onClick={() => { saveProject(projectName.trim()); setProjectName(""); setShowSaveProject(false); }}>Save</Button>
          </div>
        </div>
      )}

      {projects.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--jv-color-heading)", marginBottom: 8 }}>Saved projects (this session)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {projects.map(p => (
              <div key={p.id} style={{ fontSize: 12.5, padding: "6px 12px", borderRadius: 999, border: "1px solid var(--jv-color-border)", background: "var(--jv-color-slate-50)" }}>
                {p.name} · {p.saved_candidates.length} saved
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--jv-color-muted)", marginTop: 6 }}>
            Projects aren't saved permanently yet — that arrives once this feature moves past the mock-data phase.
          </div>
        </div>
      )}

      {selectedCandidate && (
        <CandidateDetailDrawer candidate={selectedCandidate} notes={notes} onAddNote={addNote} onClose={() => setSelectedCandidateKey(null)} />
      )}

      {showCompare && compareCandidates.length > 0 && (
        <CompareDrawer candidates={compareCandidates} onClose={() => setShowCompare(false)} />
      )}
    </div>
  );
}
