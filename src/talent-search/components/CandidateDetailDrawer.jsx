import { useState } from "react";
import { X, ExternalLink } from "lucide-react";
import { Badge, Button, TextArea, Tabs } from "../../components/ui/index.js";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "resume", label: "Resume" },
  { id: "evidence", label: "Evidence" },
  { id: "sources", label: "Sources" },
  { id: "notes", label: "Notes" },
  { id: "activity", label: "Activity" },
];

export default function CandidateDetailDrawer({ candidate, notes, onAddNote, onClose }) {
  const [tab, setTab] = useState("overview");
  const [draftNote, setDraftNote] = useState("");
  const candidateNotes = notes[candidate.candidate_key] || [];

  return (
    <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 520, background: "#fff", boxShadow: "var(--jv-shadow-lg)", padding: 28, overflowY: "auto", zIndex: 200 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{candidate.name}</h2>
          <div style={{ fontSize: 13, color: "var(--jv-color-muted)" }}>{candidate.current_title}{candidate.current_company ? ` at ${candidate.current_company}` : ""}</div>
        </div>
        <Button variant="ghost" size="sm" icon={X} onClick={onClose}>Close</Button>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--jv-color-muted)", marginBottom: 16 }}>{candidate.location}</div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <div style={{ marginTop: 16 }}>
        {tab === "overview" && (
          <div>
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <div><div className="jv-field__label">Match</div><div style={{ fontSize: 20, fontWeight: 800 }}>{candidate.match_score}%</div></div>
              <div><div className="jv-field__label">Required fit</div><div style={{ fontSize: 20, fontWeight: 800 }}>{candidate.required_score}%</div></div>
              <div><div className="jv-field__label">Preferred fit</div><div style={{ fontSize: 20, fontWeight: 800 }}>{candidate.preferred_score}%</div></div>
              <div><div className="jv-field__label">Evidence confidence</div><div style={{ fontSize: 20, fontWeight: 800 }}>{Math.round(candidate.confidence * 100)}%</div></div>
            </div>
            <div className="jv-field__label" style={{ marginBottom: 6 }}>Strong matches</div>
            <ul style={{ margin: "0 0 16px", paddingLeft: 18, fontSize: 13.5 }}>{candidate.strong_matches.map((m, i) => <li key={i}>{m}</li>)}</ul>
            <div className="jv-field__label" style={{ marginBottom: 6 }}>Potential gaps</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: "var(--jv-color-muted)" }}>{candidate.potential_gaps.map((g, i) => <li key={i}>{g}</li>)}</ul>
          </div>
        )}

        {tab === "experience" && (
          candidate.experience.length === 0 ? <EmptyNote text="No experience history available from the sources this candidate was found through." /> :
          candidate.experience.map((e, i) => (
            <div key={i} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid var(--jv-color-border)" }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{e.title}</div>
              <div style={{ fontSize: 13, color: "var(--jv-color-muted)" }}>{e.company} · {e.start} – {e.end}</div>
              {e.description && <p style={{ fontSize: 13, margin: "6px 0 0" }}>{e.description}</p>}
            </div>
          ))
        )}

        {tab === "skills" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {candidate.skills.map(s => <Badge key={s} tone="info">{s}</Badge>)}
            {candidate.certifications.map(c => <Badge key={c} tone="success">{c}</Badge>)}
          </div>
        )}

        {tab === "resume" && (
          <EmptyNote text="No resume on file for this candidate yet. Once this candidate is added to Jobvair, any resume they submit will appear here." />
        )}

        {tab === "evidence" && (
          candidate.evidence.length === 0 ? <EmptyNote text="No evidence recorded." /> :
          candidate.evidence.map((e, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--jv-color-border)", fontSize: 13 }}>
              <div>
                <div>{e.value}</div>
                <div style={{ fontSize: 11.5, color: "var(--jv-color-muted)" }}>via {e.source}</div>
              </div>
              <Badge tone={e.confidence >= 0.85 ? "success" : e.confidence >= 0.7 ? "warning" : "neutral"}>{Math.round(e.confidence * 100)}% confidence</Badge>
            </div>
          ))
        )}

        {tab === "sources" && (
          candidate.source_records.map((s, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--jv-color-border)", fontSize: 13 }}>
              <span style={{ textTransform: "capitalize" }}>{s.provider.replace("_", " ")}</span>
              {s.url ? (
                <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, color: "var(--jv-color-primary)" }}>
                  View source <ExternalLink size={12} />
                </a>
              ) : <span style={{ fontSize: 12, color: "var(--jv-color-muted)" }}>Internal record</span>}
            </div>
          ))
        )}

        {tab === "notes" && (
          <div>
            {candidateNotes.length === 0 && <EmptyNote text="No notes yet." />}
            {candidateNotes.map((n, i) => (
              <div key={i} style={{ fontSize: 13, padding: "8px 10px", background: "var(--jv-color-slate-50)", borderRadius: 8, marginBottom: 8 }}>{n}</div>
            ))}
            <TextArea rows={2} value={draftNote} onChange={e => setDraftNote(e.target.value)} placeholder="Add a note about this candidate…" />
            <Button size="sm" style={{ marginTop: 8 }} onClick={() => { onAddNote(candidate.candidate_key, draftNote); setDraftNote(""); }} disabled={!draftNote.trim()}>Add note</Button>
          </div>
        )}

        {tab === "activity" && (
          <EmptyNote text="Activity history (views, shortlist changes, outreach) will appear here once this feature is connected to persistent storage." />
        )}
      </div>
    </div>
  );
}

function EmptyNote({ text }) {
  return <div style={{ fontSize: 13, color: "var(--jv-color-muted)", fontStyle: "italic" }}>{text}</div>;
}
