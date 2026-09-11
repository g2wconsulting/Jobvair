import { useState } from "react";
import { Sparkles, Search } from "lucide-react";
import { Card, Button } from "../../components/ui/index.js";

const EXAMPLE_PROMPTS = [
  "Find senior Accela developers in Georgia with SQL and JavaScript experience.",
  "Find nonprofit fundraising leaders in Phoenix with major-gift portfolios over $1M.",
  "Find Oracle Fusion HCM Payroll leads with recent configuration experience.",
  "Find cybersecurity engineers with federal contracting experience and Security+.",
];

export default function AISearchBar({ onSearch, searching }) {
  const [value, setValue] = useState("");

  const submit = () => {
    if (!value.trim() || searching) return;
    onSearch(value.trim());
  };

  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Sparkles size={18} color="var(--jv-color-primary)" />
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--jv-color-heading)" }}>AI Search Bar</span>
      </div>
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); }}
        placeholder="Describe the person you are looking for…"
        rows={3}
        style={{
          width: "100%", padding: "12px 14px", fontSize: 15, fontFamily: "inherit",
          border: "1px solid var(--jv-color-border)", borderRadius: "var(--jv-radius-md, 10px)",
          resize: "vertical", boxSizing: "border-box", marginBottom: 10,
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxWidth: 640 }}>
          {EXAMPLE_PROMPTS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setValue(p)}
              style={{
                fontSize: 12, padding: "5px 10px", borderRadius: 999, border: "1px solid var(--jv-color-border)",
                background: "var(--jv-color-slate-50)", color: "var(--jv-color-muted)", cursor: "pointer",
              }}
            >
              {p}
            </button>
          ))}
        </div>
        <Button icon={Search} onClick={submit} disabled={searching || !value.trim()}>{searching ? "Searching…" : "Search"}</Button>
      </div>
    </Card>
  );
}
