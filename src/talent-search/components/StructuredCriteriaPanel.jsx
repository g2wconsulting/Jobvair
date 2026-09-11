import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, Input, Select, Button, TextArea } from "../../components/ui/index.js";
import TagListInput from "./TagListInput.jsx";

const WORK_ARRANGEMENTS = [
  { value: "any", label: "Any" },
  { value: "onsite", label: "Onsite" },
  { value: "hybrid", label: "Hybrid" },
  { value: "remote", label: "Remote" },
];

// Everything the AI Search Planner produced, laid out for the recruiter to
// review and hand-edit before (or after) running the search. Every field
// here maps 1:1 to a SearchCriteria property — see types/candidateShape.js.
export default function StructuredCriteriaPanel({ criteria, onChange, onSearch, searching }) {
  const [expanded, setExpanded] = useState(true);
  const set = (key, value) => onChange({ [key]: value });

  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setExpanded(e => !e)}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--jv-color-heading)" }}>Structured Search Criteria</div>
        <button type="button" className="jv-button jv-button--ghost jv-button--sm" onClick={e => { e.stopPropagation(); setExpanded(x => !x); }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Input label="Current title" value={criteria.current_title} onChange={e => set("current_title", e.target.value)} />
            <Select label="Seniority" value={criteria.seniority} onChange={e => set("seniority", e.target.value)}
              options={["", "Junior", "Mid", "Senior", "Lead", "Manager", "Director"].map(v => ({ value: v, label: v || "Any" }))} />
          </div>

          <TagListInput label="Previous titles" values={criteria.previous_titles} onChange={v => set("previous_titles", v)} placeholder="Add a previous title…" />
          <TagListInput label="Required skills" values={criteria.required_skills} onChange={v => set("required_skills", v)} placeholder="Add a required skill…" />
          <TagListInput label="Preferred skills" values={criteria.preferred_skills} onChange={v => set("preferred_skills", v)} placeholder="Add a preferred skill…" />
          <TagListInput label="Locations" values={criteria.locations} onChange={v => set("locations", v)} placeholder="City, state, or region…" />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <Input label="Radius (miles)" type="number" value={criteria.radius_miles} onChange={e => set("radius_miles", Number(e.target.value) || 0)} />
            <Select label="Work arrangement" value={criteria.work_arrangement} onChange={e => set("work_arrangement", e.target.value)} options={WORK_ARRANGEMENTS} />
            <Input label="Minimum years of experience" type="number" value={criteria.minimum_years_experience} onChange={e => set("minimum_years_experience", Number(e.target.value) || 0)} />
          </div>

          <TagListInput label="Industries" values={criteria.industries} onChange={v => set("industries", v)} placeholder="e.g. Higher Education…" />
          <TagListInput label="Education" values={criteria.education} onChange={v => set("education", v)} placeholder="Degree or field…" />
          <TagListInput label="Certifications" values={criteria.certifications} onChange={v => set("certifications", v)} placeholder="e.g. Security+…" />
          <TagListInput label="Current/past employers" values={criteria.employers} onChange={v => set("employers", v)} placeholder="Add an employer…" />
          <TagListInput label="Target companies" values={criteria.target_companies} onChange={v => set("target_companies", v)} placeholder="Companies to prioritize…" />
          <TagListInput label="Excluded companies" values={criteria.excluded_companies} onChange={v => set("excluded_companies", v)} placeholder="Companies to exclude…" />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Input label="Compensation min ($)" type="number" value={criteria.compensation_range.min ?? ""} onChange={e => set("compensation_range", { ...criteria.compensation_range, min: e.target.value ? Number(e.target.value) : null })} />
            <Input label="Compensation max ($)" type="number" value={criteria.compensation_range.max ?? ""} onChange={e => set("compensation_range", { ...criteria.compensation_range, max: e.target.value ? Number(e.target.value) : null })} />
          </div>

          <Input label="Security clearance (if relevant)" value={criteria.security_clearance} onChange={e => set("security_clearance", e.target.value)} placeholder="e.g. Active Secret" />

          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={criteria.require_open_to_work} onChange={e => set("require_open_to_work", e.target.checked)} />
            Only show candidates flagged open-to-work (where a source legally supplies this)
          </label>

          <TextArea label="Keywords" rows={2} value={criteria.keywords} onChange={e => set("keywords", e.target.value)} />
          <TextArea label="Boolean query" rows={2} value={criteria.boolean_query} onChange={e => set("boolean_query", e.target.value)}
            hint="Editable — this is what would be sent to a real search provider's query syntax." />

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button disabled={searching} onClick={onSearch}>{searching ? "Searching…" : "Search with these criteria"}</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
