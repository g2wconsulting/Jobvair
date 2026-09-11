import { useState } from "react";
import { Badge } from "../../components/ui/index.js";

// Small reusable "type and press Enter to add" tag editor, shared by every
// array-valued criteria field (skills, locations, industries, etc.) so
// StructuredCriteriaPanel doesn't repeat this five separate times.
export default function TagListInput({ label, values, onChange, placeholder }) {
  const [input, setInput] = useState("");

  const add = () => {
    if (!input.trim()) return;
    onChange([...values, input.trim()]);
    setInput("");
  };

  const remove = (idx) => onChange(values.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="jv-field__label" style={{ marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="jv-input"
        />
        <button type="button" onClick={add} className="jv-button jv-button--secondary jv-button--sm">Add</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, minHeight: values.length ? undefined : 0 }}>
        {values.map((v, i) => (
          <Badge key={`${v}-${i}`} tone="neutral">
            {v} <span style={{ cursor: "pointer", marginLeft: 4 }} onClick={() => remove(i)}>×</span>
          </Badge>
        ))}
      </div>
    </div>
  );
}
