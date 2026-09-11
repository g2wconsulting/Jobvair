import { X } from "lucide-react";
import { Button, Badge } from "../../../components/ui/index.js";

export default function IcpCompareDrawer({ candidates, onClose }) {
  const rows = [
    { label: "Required Qualifications", render: c => `${c.fit_scores.qualification}%` },
    { label: "Preferred Qualifications", render: c => `${c.fit_scores.skills}%` },
    { label: "Skills", render: c => <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{c.skills.slice(0, 4).map(s => <Badge key={s} tone="info">{s}</Badge>)}</div> },
    { label: "Industry", render: c => c.industries.join(", ") || "—" },
    { label: "Experience", render: c => `${c.years_experience} years` },
    { label: "Location", render: c => c.location_info.current_location.value },
    { label: "Remote/Hybrid", render: c => c.location_info.travel_willingness.value || "Not confirmed" },
    { label: "Relocation", render: c => c.location_info.relocation_willingness.status === "not_found" ? "Unknown" : c.location_info.relocation_willingness.value },
    { label: "Compensation", render: c => `$${c.compensation_info.market_estimated_compensation.range[0].toLocaleString()}–$${c.compensation_info.market_estimated_compensation.range[1].toLocaleString()} (est.)` },
    { label: "Mission Evidence", render: c => <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{c.mission_evidence.filter(m => m.strength !== "none").map(m => <Badge key={m.mission} tone={m.strength === "strong" ? "success" : "warning"}>{m.mission}</Badge>)}</div> },
    { label: "Unknowns", render: c => c.match_explanation.unknowns.join(", ") },
  ];

  return (
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, background: "#fff", boxShadow: "var(--jv-shadow-lg)", padding: 24, zIndex: 200, maxHeight: "65vh", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <strong style={{ fontSize: 15 }}>Comparing {candidates.length} candidates</strong>
        <Button variant="ghost" size="sm" icon={X} onClick={onClose}>Close</Button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "6px 12px" }}></th>
              {candidates.map(c => <th key={c.candidate_key} style={{ textAlign: "left", padding: "6px 12px", fontSize: 14, fontWeight: 700 }}>{c.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.label} style={{ borderTop: "1px solid var(--jv-color-border)" }}>
                <td style={{ padding: "8px 12px", color: "var(--jv-color-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>{row.label}</td>
                {candidates.map(c => <td key={c.candidate_key} style={{ padding: "8px 12px" }}>{row.render(c)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
