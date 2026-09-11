import { useState } from "react";
import { UserSearch } from "lucide-react";
import { EmptyState, Spinner, Button } from "../../../components/ui/index.js";
import { useIdealCandidateProfile } from "../../hooks/useIdealCandidateProfile.js";
import StepIndicator from "./StepIndicator.jsx";
import DescribeIdealCandidateStep from "./DescribeIdealCandidateStep.jsx";
import ProfileReviewStep from "./ProfileReviewStep.jsx";
import IcpResultCard from "./IcpResultCard.jsx";
import IcpCandidateDetailDrawer from "./IcpCandidateDetailDrawer.jsx";
import IcpCompareDrawer from "./IcpCompareDrawer.jsx";

// Phase 2 — Ideal Candidate Profile guided flow. Every candidate on this
// screen comes from src/talent-search/services/mockIcpCandidates.js, not a
// live search. Mission alignment is displayed but never folds into the
// job-fit score — see scoring/scoreCandidateFit.js.
export default function IdealCandidateProfilePage() {
  const {
    step, prompt, profile, loading, results,
    selectedCandidateKey, compareKeys, candidateStatus, notes,
    describeCandidate, updateProfile, runSearch, startOver,
    setSelectedCandidateKey, setCandidateAction, addNote, toggleCompare,
  } = useIdealCandidateProfile();

  const [showCompare, setShowCompare] = useState(false);
  const selectedCandidate = results.find(r => r.candidate_key === selectedCandidateKey);
  const compareCandidates = results.filter(r => compareKeys.has(r.candidate_key));

  return (
    <div>
      <StepIndicator step={step} />

      {step === 1 && <DescribeIdealCandidateStep onSubmit={describeCandidate} loading={loading} />}

      {step === 3 && !loading && (
        <ProfileReviewStep profile={profile} onChange={updateProfile} onSearch={runSearch} searching={loading} />
      )}

      {(step === 4 || (step === 3 && loading)) && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 60, gap: 12 }}>
          <Spinner />
          <div style={{ fontSize: 13, color: "var(--jv-color-muted)" }}>{step === 3 ? "Generating profile…" : "Searching across connected sources…"}</div>
        </div>
      )}

      {step === 5 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontSize: 13, color: "var(--jv-color-muted)" }}>"{prompt}"</div>
            <div style={{ display: "flex", gap: 8 }}>
              {compareKeys.size > 0 && <Button size="sm" variant="secondary" onClick={() => setShowCompare(true)}>Compare {compareKeys.size} selected</Button>}
              <Button size="sm" variant="ghost" onClick={startOver}>Start a new search</Button>
            </div>
          </div>

          {results.length === 0 ? (
            <EmptyState icon={UserSearch} title="No candidates matched" description="Try broadening the profile's requirements and search again." />
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {results.map(candidate => (
                <IcpResultCard
                  key={candidate.candidate_key}
                  candidate={candidate}
                  status={candidateStatus[candidate.candidate_key]}
                  comparing={compareKeys.has(candidate.candidate_key)}
                  onView={() => setSelectedCandidateKey(candidate.candidate_key)}
                  onCompareToggle={() => toggleCompare(candidate.candidate_key)}
                  onShortlist={() => setCandidateAction(candidate.candidate_key, "shortlisted")}
                  onSave={() => setCandidateAction(candidate.candidate_key, "saved")}
                  onReject={() => setCandidateAction(candidate.candidate_key, "rejected")}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {selectedCandidate && (
        <IcpCandidateDetailDrawer candidate={selectedCandidate} notes={notes} onAddNote={addNote} onClose={() => setSelectedCandidateKey(null)} />
      )}
      {showCompare && compareCandidates.length > 0 && (
        <IcpCompareDrawer candidates={compareCandidates} onClose={() => setShowCompare(false)} />
      )}
    </div>
  );
}
