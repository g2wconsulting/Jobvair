import { useState } from "react";
import { X, ExternalLink, HelpCircle } from "lucide-react";
import { Badge, Button, TextArea, Tabs } from "../../../components/ui/index.js";

const TABS = [
  { id: "qualifications", label: "Qualifications" },
  { id: "resume", label: "Resume" },
  { id: "mission", label: "Mission Evidence" },
  { id: "location", label: "Location & Work" },
  { id: "compensation", label: "Compensation" },
  { id: "sources", label: "Sources" },
  { id: "unknown", label: "Unknown" },
  { id: "notes", label: "Notes" },
];

const STRENGTH_TONE = { strong: "success", moderate: "warning", limited: "neutral", none: "neutral" };
const STRENGTH_LABEL = { strong: "Strong evidence", moderate: "Moderate evidence", limited: "Limited evidence", none: "No reliable evidence found" };

const STATUS_LABEL = {
  verified: "Verified", candidate_provided: "Candidate-provided", publicly_supported: "Publicly supported",
  estimated: "Estimated", inferred: "Inferred", not_found: "Not found",
};

function ProvenanceRow({ label, field }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--jv-color-border)", fontSize: 13 }}>
      <div>
        <div style={{ fontWeight: 600 }}>{label}</div>
        <div>{field.value ?? "—"}</div>
        {field.source && <div style={{ fontSize: 11.5, color: "var(--jv-color-muted)" }}>via {field.source}</div>}
      </div>
      <Badge tone={field.status === "not_found" ? "neutral" : field.status === "verified" || field.status === "candidate_provided" ? "success" : field.status === "inferred" ? "warning" : "info"}>
        {STATUS_LABEL[field.status]}
      </Badge>
    </div>
  );
}

export default function IcpCandidateDetailDrawer({ candidate, notes, onAddNote, onClose }) {
  const [tab, setTab] = useState("qualifications");
  const [draftNote, setDraftNote] = useState("");
  const candidateNotes = notes[candidate.candidate_key] || [];

  return (
    <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 560, background: "#fff", boxShadow: "var(--jv-shadow-lg)", padding: 28, overflowY: "auto", zIndex: 200 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{candidate.name}</h2>
          <div style={{ fontSize: 13, color: "var(--jv-color-muted)" }}>{candidate.current_title} at {candidate.current_company}</div>
        </div>
        <Button variant="ghost" size="sm" icon={X} onClick={onClose}>Close</Button>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>{candidate.fit_scores.overall}% <span style={{ fontSize: 12, fontWeight: 400, color: "var(--jv-color-muted)" }}>overall job fit</span></div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <div style={{ marginTop: 16 }}>
        {tab === "qualifications" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {Object.entries({ Qualification: candidate.fit_scores.qualification, Skills: candidate.fit_scores.skills, Experience: candidate.fit_scores.experience, Industry: candidate.fit_scores.industry, Location: candidate.fit_scores.location, "Work arrangement": candidate.fit_scores.work_arrangement, Compensation: candidate.fit_scores.compensation }).map(([label, val]) => (
                <div key={label}><div className="jv-field__label">{label}</div><div style={{ fontSize: 16, fontWeight: 700 }}>{val}%</div></div>
              ))}
            </div>
            <div className="jv-field__label" style={{ marginBottom: 6 }}>Why this candidate matches</div>
            <ul style={{ margin: "0 0 16px", paddingLeft: 18, fontSize: 13.5 }}>{candidate.match_explanation.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
            <div className="jv-field__label" style={{ marginBottom: 6 }}>Possible gaps</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: "var(--jv-color-muted)" }}>{candidate.match_explanation.gaps.length ? candidate.match_explanation.gaps.map((g, i) => <li key={i}>{g}</li>) : <li>None identified against the stated requirements.</li>}</ul>
          </div>
        )}

        {tab === "resume" && (
          <div style={{ fontSize: 13.5, color: "var(--jv-color-muted)", fontStyle: "italic" }}>
            No resume on file for this mock candidate. Once added to Jobvair, any resume they submit will appear here.
          </div>
        )}

        {tab === "mission" && (
          candidate.mission_evidence.map(m => (
            <div key={m.mission} style={{ marginBottom: 18, paddingBottom: 16, borderBottom: "1px solid var(--jv-color-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <strong style={{ fontSize: 14 }}>{m.mission}</strong>
                <Badge tone={STRENGTH_TONE[m.strength]}>{STRENGTH_LABEL[m.strength]}</Badge>
              </div>
              {m.evidence.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--jv-color-muted)", fontStyle: "italic" }}>No reliable public evidence found.</div>
              ) : m.evidence.map((e, i) => (
                <div key={i} style={{ fontSize: 13, marginBottom: 8 }}>
                  <div>{e.text}</div>
                  <div style={{ fontSize: 11.5, color: "var(--jv-color-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                    {e.source_url ? (
                      <a href={e.source_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--jv-color-primary)", display: "flex", alignItems: "center", gap: 3 }}>{e.source_name} <ExternalLink size={10} /></a>
                    ) : e.source_name}
                    · {Math.round(e.confidence * 100)}% confidence
                  </div>
                </div>
              ))}
            </div>
          ))
        )}

        {tab === "location" && (
          <div>
            <ProvenanceRow label="Current location" field={candidate.location_info.current_location} />
            <ProvenanceRow label="Relocation willingness" field={candidate.location_info.relocation_willingness} />
            <ProvenanceRow label="Travel willingness" field={candidate.location_info.travel_willingness} />
          </div>
        )}

        {tab === "compensation" && (
          <div>
            <ProvenanceRow label="Candidate expected salary" field={candidate.compensation_info.candidate_expected_salary} />
            <ProvenanceRow label="Candidate current compensation" field={candidate.compensation_info.candidate_current_compensation} />
            <div style={{ padding: "12px 0", fontSize: 13 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{candidate.compensation_info.market_estimated_compensation.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>
                ${candidate.compensation_info.market_estimated_compensation.range[0].toLocaleString()} – ${candidate.compensation_info.market_estimated_compensation.range[1].toLocaleString()}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--jv-color-muted)", marginTop: 4 }}>
                Source: {candidate.compensation_info.market_estimated_compensation.source} · Confidence: {candidate.compensation_info.market_estimated_compensation.confidence}
              </div>
            </div>
          </div>
        )}

        {tab === "sources" && (
          candidate.source_records.map((s, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--jv-color-border)", fontSize: 13 }}>
              <span style={{ textTransform: "capitalize" }}>{s.provider.replace("_", " ")}</span>
              {s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, color: "var(--jv-color-primary)" }}>View source <ExternalLink size={12} /></a> : <span style={{ fontSize: 12, color: "var(--jv-color-muted)" }}>Internal record</span>}
            </div>
          ))
        )}

        {tab === "unknown" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <HelpCircle size={15} color="var(--jv-color-muted)" />
              <span style={{ fontSize: 13, fontWeight: 700 }}>What we could not verify</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: "var(--jv-color-muted)" }}>
              {candidate.match_explanation.unknowns.map((u, i) => <li key={i}>{u}</li>)}
            </ul>
          </div>
        )}

        {tab === "notes" && (
          <div>
            {candidateNotes.length === 0 && <div style={{ fontSize: 13, color: "var(--jv-color-muted)", fontStyle: "italic" }}>No notes yet.</div>}
            {candidateNotes.map((n, i) => <div key={i} style={{ fontSize: 13, padding: "8px 10px", background: "var(--jv-color-slate-50)", borderRadius: 8, marginBottom: 8 }}>{n}</div>)}
            <TextArea rows={2} value={draftNote} onChange={e => setDraftNote(e.target.value)} placeholder="Add a note about this candidate…" />
            <Button size="sm" style={{ marginTop: 8 }} onClick={() => { onAddNote(candidate.candidate_key, draftNote); setDraftNote(""); }} disabled={!draftNote.trim()}>Add note</Button>
          </div>
        )}
      </div>
    </div>
  );
}
