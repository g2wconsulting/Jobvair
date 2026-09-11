import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Card, Button } from "../../../components/ui/index.js";

const EXAMPLE_PROMPT = "We need a senior nonprofit fundraising leader in Phoenix with major gift experience, strong executive presence, mission-driven experience, ideally someone who has worked with education, faith-based, or animal-welfare organizations. Hybrid 3 days per week. Relocation is acceptable.";

export default function DescribeIdealCandidateStep({ onSubmit, loading }) {
  const [value, setValue] = useState("");

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Sparkles size={18} color="var(--jv-color-primary)" />
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--jv-color-heading)" }}>Describe your ideal candidate</span>
      </div>
      <p style={{ fontSize: 13.5, color: "var(--jv-color-muted)", marginTop: 0, marginBottom: 14 }}>
        Write it the way you'd describe them to a colleague. Jobvair turns this into a structured profile you can review and edit before searching.
      </p>
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Describe the person you're looking for…"
        rows={5}
        style={{
          width: "100%", padding: "12px 14px", fontSize: 15, fontFamily: "inherit",
          border: "1px solid var(--jv-color-border)", borderRadius: "var(--jv-radius-md, 10px)",
          resize: "vertical", boxSizing: "border-box", marginBottom: 12,
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <button
          type="button"
          onClick={() => setValue(EXAMPLE_PROMPT)}
          style={{ fontSize: 12, padding: "5px 10px", borderRadius: 999, border: "1px solid var(--jv-color-border)", background: "var(--jv-color-slate-50)", color: "var(--jv-color-muted)", cursor: "pointer" }}
        >
          Use example prompt
        </button>
        <Button disabled={!value.trim() || loading} onClick={() => onSubmit(value.trim())}>
          {loading ? "Generating profile…" : "Generate Ideal Candidate Profile"}
        </Button>
      </div>
    </Card>
  );
}
