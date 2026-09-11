import { MapPin, CheckCircle2, AlertTriangle, Eye, Bookmark, Copy, Star, X, MessageSquare } from "lucide-react";
import { Card, Badge, Button } from "../../components/ui/index.js";

const PROVIDER_LABELS = {
  jobvair: "Jobvair", web_search: "Web Search", github: "GitHub",
  social_web: "Social/Professional Web", linkedin: "LinkedIn", external_resume: "External DB",
};

function matchTone(score) {
  if (score >= 80) return "success";
  if (score >= 60) return "warning";
  return "danger";
}

export default function CandidateResultCard({ candidate, status, onView, onFindSimilar, onCompareToggle, comparing, onShortlist, onReject, onSave }) {
  const providers = Array.from(new Set(candidate.source_records.map(s => s.provider)));

  return (
    <Card style={{ borderColor: status === "shortlisted" ? "var(--jv-color-primary)" : undefined }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <strong style={{ fontSize: 16, color: "var(--jv-color-heading)" }}>{candidate.name}</strong>
            {candidate.dedup_status === "probable_match" && candidate.merged_from?.length > 1 && (
              <Badge tone="neutral">Merged from {candidate.merged_from.length} sources</Badge>
            )}
            {candidate.dedup_status === "possible_match" && <Badge tone="warning">Possible duplicate — not merged</Badge>}
          </div>
          <div style={{ fontSize: 13.5, color: "var(--jv-color-text)", marginTop: 2 }}>{candidate.current_title}{candidate.current_company ? ` at ${candidate.current_company}` : ""}</div>
          <div style={{ fontSize: 12.5, color: "var(--jv-color-muted)", display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
            <MapPin size={12} /> {candidate.location || "Location unknown"}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: `var(--jv-color-${matchTone(candidate.match_score) === "success" ? "success-600" : matchTone(candidate.match_score) === "warning" ? "warning-600" : "danger-600"})` }}>
            {candidate.match_score}%
          </div>
          <div style={{ fontSize: 11, color: "var(--jv-color-muted)" }}>Match</div>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {candidate.skills.slice(0, 6).map(s => <Badge key={s} tone="info">{s}</Badge>)}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {providers.map(p => <Badge key={p} tone="neutral">{PROVIDER_LABELS[p] || p}</Badge>)}
      </div>

      {candidate.strong_matches.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {candidate.strong_matches.slice(0, 3).map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12.5, color: "var(--jv-color-text)", marginBottom: 3 }}>
              <CheckCircle2 size={13} color="var(--jv-color-success-600, #16a34a)" style={{ flexShrink: 0, marginTop: 1 }} /> {m}
            </div>
          ))}
        </div>
      )}
      {candidate.potential_gaps.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          {candidate.potential_gaps.slice(0, 2).map((g, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12.5, color: "var(--jv-color-muted)", marginBottom: 3 }}>
              <AlertTriangle size={13} color="var(--jv-color-warning-600, #b45309)" style={{ flexShrink: 0, marginTop: 1 }} /> {g}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Button size="sm" variant="secondary" icon={Eye} onClick={onView}>View</Button>
        <Button size="sm" variant="secondary" icon={Copy} onClick={onFindSimilar}>Find Similar</Button>
        <Button size="sm" variant={comparing ? "primary" : "secondary"} onClick={onCompareToggle}>{comparing ? "Comparing" : "Compare"}</Button>
        <Button size="sm" variant={status === "shortlisted" ? "primary" : "secondary"} icon={Star} onClick={onShortlist}>Shortlist</Button>
        <Button size="sm" variant={status === "saved" ? "primary" : "secondary"} icon={Bookmark} onClick={onSave}>Save to Project</Button>
        <Button size="sm" variant={status === "rejected" ? "danger" : "ghost"} icon={X} onClick={onReject}>Reject</Button>
        <Button size="sm" variant="ghost" icon={MessageSquare} onClick={onView}>Add Note</Button>
      </div>
    </Card>
  );
}
