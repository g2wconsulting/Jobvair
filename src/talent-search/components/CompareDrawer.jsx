import { X } from "lucide-react";
import { Button, Badge } from "../../components/ui/index.js";

const ROWS = [
  { key: "current_title", label: "Title" },
  { key: "current_company", label: "Company" },
  { key: "location", label: "Location" },
  { key: "match_score", label: "Match %", format: v => `${v}%` },
  { key: "required_score", label: "Required fit", format: v => `${v}%` },
  { key: "preferred_score", label: "Preferred fit", format: v => `${v}%` },
  { key: "years_experience", label: "Years experience", format: v => v ?? "Unknown" },
];

export default function CompareDrawer({ candidates, onClose }) {
  return (
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, background: "#fff", boxShadow: "var(--jv-shadow-lg)", padding: 24, zIndex: 200, maxHeight: "60vh", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <strong style={{ fontSize: 15 }}>Comparing {candidates.length} candidates</strong>
        <Button variant="ghost" size="sm" icon={X} onClick={onClose}>Close</Button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "6px 12px", color: "var(--jv-color-muted)" }}></th>
              {candidates.map(c => (
                <th key={c.candidate_key} style={{ textAlign: "left", padding: "6px 12px", fontSize: 14, fontWeight: 700 }}>{c.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(row => (
              <tr key={row.key} style={{ borderTop: "1px solid var(--jv-color-border)" }}>
                <td style={{ padding: "8px 12px", color: "var(--jv-color-muted)", fontWeight: 600 }}>{row.label}</td>
                {candidates.map(c => (
                  <td key={c.candidate_key} style={{ padding: "8px 12px" }}>{row.format ? row.format(c[row.key]) : (c[row.key] || "—")}</td>
                ))}
              </tr>
            ))}
            <tr style={{ borderTop: "1px solid var(--jv-color-border)" }}>
              <td style={{ padding: "8px 12px", color: "var(--jv-color-muted)", fontWeight: 600 }}>Skills</td>
              {candidates.map(c => (
                <td key={c.candidate_key} style={{ padding: "8px 12px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{c.skills.slice(0, 5).map(s => <Badge key={s} tone="info">{s}</Badge>)}</div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
