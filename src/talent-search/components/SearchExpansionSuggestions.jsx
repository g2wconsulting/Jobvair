import { Lightbulb } from "lucide-react";
import { Card, Button } from "../../components/ui/index.js";

// Shown when a search comes back thin. Suggestions are canned per the
// product spec's examples, mapped to concrete criteria patches — the
// recruiter decides whether to apply each one, nothing runs automatically.
export default function SearchExpansionSuggestions({ criteria, strongCount, onApply }) {
  const suggestions = [];

  if (criteria.radius_miles < 75) {
    suggestions.push({
      label: `Expand radius from ${criteria.radius_miles} to 75 miles`,
      patch: { radius_miles: 75 },
    });
  }
  if (criteria.work_arrangement !== "remote" && criteria.work_arrangement !== "any") {
    suggestions.push({
      label: "Include remote candidates",
      patch: { work_arrangement: "any" },
    });
  }
  if (criteria.seniority === "Lead" || criteria.seniority === "Senior") {
    suggestions.push({
      label: "Include Senior Consultants in addition to Leads",
      patch: { seniority: "" },
    });
  }
  if (criteria.minimum_years_experience > 3) {
    suggestions.push({
      label: `Lower minimum experience from ${criteria.minimum_years_experience} to ${Math.max(0, criteria.minimum_years_experience - 3)} years`,
      patch: { minimum_years_experience: Math.max(0, criteria.minimum_years_experience - 3) },
    });
  }

  if (suggestions.length === 0) return null;

  return (
    <Card style={{ marginBottom: 20, borderColor: "var(--jv-color-warning-600, #b45309)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Lightbulb size={16} color="var(--jv-color-warning-600, #b45309)" />
        <strong style={{ fontSize: 13.5 }}>Only {strongCount} strong candidate{strongCount === 1 ? "" : "s"} found — want to broaden the search?</strong>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {suggestions.map((s, i) => (
          <Button key={i} size="sm" variant="secondary" onClick={() => onApply(s.patch)}>{s.label}</Button>
        ))}
      </div>
    </Card>
  );
}
