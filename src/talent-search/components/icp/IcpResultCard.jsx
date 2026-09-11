import { MapPin, CheckCircle2, AlertTriangle, HelpCircle, Eye, Star, Bookmark, X, Heart } from "lucide-react";
import { Card, Badge, Button } from "../../../components/ui/index.js";

const STRENGTH_TONE = { strong: "success", moderate: "warning", limited: "neutral", none: "neutral" };
const STRENGTH_LABEL = { strong: "Strong evidence", moderate: "Moderate evidence", limited: "Limited evidence", none: "No reliable evidence found" };

function matchColor(score) {
  if (score >= 80) return "var(--jv-color-success-600, #16a34a)";
  if (score >= 60) return "var(--jv-color-warning-600, #b45309)";
  return "var(--jv-color-danger-600, #dc2626)";
}

export default function IcpResultCard({ candidate, status, comparing, onView, onCompareToggle, onShortlist, onSave, onReject }) {
  const topMission = candidate.mission_evidence.filter(m => m.strength !== "none").sort((a, b) => (b.strength === "strong" ? 1 : 0) - (a.strength === "strong" ? 1 : 0))[0];

  return (
    <Card style={{ borderColor: status === "shortlisted" ? "var(--jv-color-primary)" : undefined }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 10 }}>
        <div>
          <strong style={{ fontSize: 16, color: "var(--jv-color-heading)" }}>{candidate.name}</strong>
          <div style={{ fontSize: 13.5, color: "var(--jv-color-text)", marginTop: 2 }}>{candidate.current_title} at {candidate.current_company}</div>
          <div style={{ fontSize: 12.5, color: "var(--jv-color-muted)", display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
            <MapPin size={12} /> {candidate.location_info.current_location.value}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: matchColor(candidate.fit_scores.overall) }}>{candidate.fit_scores.overall}%</div>
          <div style={{ fontSize: 11, color: "var(--jv-color-muted)" }}>Overall Job Fit</div>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 11.5, color: "var(--jv-color-muted)", marginBottom: 12 }}>
        <span>Required <strong style={{ color: "var(--jv-color-heading)" }}>{candidate.fit_scores.qualification}%</strong></span>
        <span>Skills <strong style={{ color: "var(--jv-color-heading)" }}>{candidate.fit_scores.skills}%</strong></span>
        <span>Location/Work <strong style={{ color: "var(--jv-color-heading)" }}>{Math.round((candidate.fit_scores.location + candidate.fit_scores.work_arrangement) / 2)}%</strong></span>
        <span>Compensation <strong style={{ color: "var(--jv-color-heading)" }}>{candidate.fit_scores.compensation}%</strong></span>
      </div>

      {topMission && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <Heart size={13} color="var(--jv-color-primary)" />
          <span style={{ fontSize: 12.5 }}>Mission alignment ({topMission.mission}):</span>
          <Badge tone={STRENGTH_TONE[topMission.strength]}>{STRENGTH_LABEL[topMission.strength]}</Badge>
        </div>
      )}

      {candidate.match_explanation.strengths.slice(0, 3).map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12.5, color: "var(--jv-color-text)", marginBottom: 3 }}>
          <CheckCircle2 size={13} color="var(--jv-color-success-600, #16a34a)" style={{ flexShrink: 0, marginTop: 1 }} /> {s}
        </div>
      ))}
      {candidate.match_explanation.gaps.slice(0, 2).map((g, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12.5, color: "var(--jv-color-muted)", marginBottom: 3 }}>
          <AlertTriangle size={13} color="var(--jv-color-warning-600, #b45309)" style={{ flexShrink: 0, marginTop: 1 }} /> {g}
        </div>
      ))}
      {candidate.match_explanation.unknowns.length > 0 && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12.5, color: "var(--jv-color-muted)", marginBottom: 12 }}>
          <HelpCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} /> Unknown: {candidate.match_explanation.unknowns.join(", ")}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
        <Button size="sm" variant="secondary" icon={Eye} onClick={onView}>View</Button>
        <Button size="sm" variant={comparing ? "primary" : "secondary"} onClick={onCompareToggle}>{comparing ? "Comparing" : "Compare"}</Button>
        <Button size="sm" variant={status === "shortlisted" ? "primary" : "secondary"} icon={Star} onClick={onShortlist}>Shortlist</Button>
        <Button size="sm" variant={status === "saved" ? "primary" : "secondary"} icon={Bookmark} onClick={onSave}>Save</Button>
        <Button size="sm" variant={status === "rejected" ? "danger" : "ghost"} icon={X} onClick={onReject}>Reject</Button>
      </div>
    </Card>
  );
}
