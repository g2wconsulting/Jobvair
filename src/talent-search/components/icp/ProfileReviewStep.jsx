import { Card, Input, Select, Button } from "../../../components/ui/index.js";
import TagListInput from "../TagListInput.jsx";

const PREFERENCE_OPTIONS = [
  { value: "no_preference", label: "No preference" },
  { value: "acceptable", label: "Acceptable" },
  { value: "required", label: "Required" },
  { value: "not_acceptable", label: "Not acceptable" },
];

const MISSION_OPTIONS = ["Animal Welfare", "Education", "Faith-Based Service", "Civil Society", "Veterans", "Environment", "Healthcare Access", "Community Development"];

export default function ProfileReviewStep({ profile, onChange, onSearch, searching }) {
  const set = (key, value) => onChange({ [key]: value });
  const toggleMission = (m) => {
    const has = profile.mission_values.includes(m);
    set("mission_values", has ? profile.mission_values.filter(x => x !== m) : [...profile.mission_values, m]);
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--jv-color-heading)", marginBottom: 14 }}>Core Requirements</div>
        <div style={{ display: "grid", gap: 16 }}>
          <TagListInput label="Target titles" values={profile.target_titles} onChange={v => set("target_titles", v)} placeholder="Add a target title…" />
          <TagListInput label="Alternate titles" values={profile.alternate_titles} onChange={v => set("alternate_titles", v)} placeholder="Add an alternate title…" />
          <Input label="Minimum years experience" type="number" value={profile.minimum_years_experience} onChange={e => set("minimum_years_experience", Number(e.target.value) || 0)} />
          <TagListInput label="Required skills" values={profile.required_skills} onChange={v => set("required_skills", v)} placeholder="Add a required skill…" />
          <TagListInput label="Preferred skills" values={profile.preferred_skills} onChange={v => set("preferred_skills", v)} placeholder="Add a preferred skill…" />
          <TagListInput label="Industries" values={profile.industries} onChange={v => set("industries", v)} placeholder="Add an industry…" />
          <TagListInput label="Required certifications" values={profile.required_certifications} onChange={v => set("required_certifications", v)} placeholder="Add a required certification…" />
          <TagListInput label="Preferred certifications" values={profile.preferred_certifications} onChange={v => set("preferred_certifications", v)} placeholder="Add a preferred certification…" />
          <Input label="Education requirement (leave blank unless legitimately required)" value={profile.education_requirement || ""} onChange={e => set("education_requirement", e.target.value || null)} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={profile.management_experience_required} onChange={e => set("management_experience_required", e.target.checked)} />
            Requires management experience
          </label>
          <Input label="Budget responsibility" value={profile.budget_responsibility || ""} onChange={e => set("budget_responsibility", e.target.value || null)} />
          <Input label="Revenue / fundraising responsibility" value={profile.revenue_responsibility || ""} onChange={e => set("revenue_responsibility", e.target.value || null)} />
          <TagListInput label="Technologies / platforms" values={profile.technologies} onChange={v => set("technologies", v)} placeholder="Add a technology…" />
          <Input label="Clearance requirement (if legally relevant)" value={profile.clearance_requirement || ""} onChange={e => set("clearance_requirement", e.target.value || null)} />
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--jv-color-heading)", marginBottom: 14 }}>Location &amp; Work Preferences</div>
        <div style={{ display: "grid", gap: 16 }}>
          <TagListInput label="Preferred locations" values={profile.preferred_locations} onChange={v => set("preferred_locations", v)} placeholder="City, state, or region…" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <Select label="Remote" value={profile.remote_preference} onChange={e => set("remote_preference", e.target.value)} options={PREFERENCE_OPTIONS} />
            <Select label="Hybrid" value={profile.hybrid_preference} onChange={e => set("hybrid_preference", e.target.value)} options={PREFERENCE_OPTIONS} />
            <Select label="Onsite" value={profile.onsite_preference} onChange={e => set("onsite_preference", e.target.value)} options={PREFERENCE_OPTIONS} />
          </div>
          <Input label="Work arrangement detail" value={profile.work_arrangement_note} onChange={e => set("work_arrangement_note", e.target.value)} placeholder="e.g. Hybrid, 3 days/week onsite" />
          <Input label="Commute radius (miles)" type="number" value={profile.commute_radius_miles} onChange={e => set("commute_radius_miles", Number(e.target.value) || 0)} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={profile.relocation_acceptable} onChange={e => set("relocation_acceptable", e.target.checked)} />
            Relocation is acceptable (employer will relocate a candidate in)
          </label>
          <TagListInput label="Relocation locations" values={profile.relocation_locations} onChange={v => set("relocation_locations", v)} placeholder="Add a location…" />
          <Input label="Travel expectation" value={profile.travel_expectation} onChange={e => set("travel_expectation", e.target.value)} placeholder="e.g. Occasional regional travel" />
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--jv-color-heading)", marginBottom: 14 }}>Compensation</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Input label="Employer salary range — min ($)" type="number" value={profile.employer_salary_range.min ?? ""} onChange={e => set("employer_salary_range", { ...profile.employer_salary_range, min: e.target.value ? Number(e.target.value) : null })} />
          <Input label="Employer salary range — max ($)" type="number" value={profile.employer_salary_range.max ?? ""} onChange={e => set("employer_salary_range", { ...profile.employer_salary_range, max: e.target.value ? Number(e.target.value) : null })} />
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--jv-color-heading)", marginBottom: 4 }}>Mission Values</div>
        <p style={{ fontSize: 12.5, color: "var(--jv-color-muted)", marginTop: 0, marginBottom: 12 }}>
          Shown separately from qualification scoring on results — never part of the automated match score.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {MISSION_OPTIONS.map(m => (
            <button
              key={m}
              type="button"
              onClick={() => toggleMission(m)}
              style={{
                fontSize: 12.5, padding: "6px 12px", borderRadius: 999, cursor: "pointer",
                border: profile.mission_values.includes(m) ? "1px solid var(--jv-color-primary)" : "1px solid var(--jv-color-border)",
                background: profile.mission_values.includes(m) ? "var(--jv-color-teal-50)" : "#fff",
                color: profile.mission_values.includes(m) ? "var(--jv-color-primary)" : "var(--jv-color-text)",
                fontWeight: profile.mission_values.includes(m) ? 700 : 400,
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </Card>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button disabled={searching} onClick={onSearch}>{searching ? "Searching…" : "Search Candidates"}</Button>
      </div>
    </div>
  );
}
