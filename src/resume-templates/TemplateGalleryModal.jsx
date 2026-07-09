import { useState } from "react";
import { IconButton } from "../components/ui/index.js";
import { X } from "lucide-react";
import { RESUME_TEMPLATE_CATEGORIES } from "./categories.js";
import TemplateThumbnail from "./TemplateThumbnail.jsx";

function pillStyle(active) {
  return {
    border: "none",
    borderRadius: 999,
    padding: "6px 14px",
    fontSize: 12.5,
    fontWeight: 700,
    background: active ? "var(--jv-color-primary)" : "transparent",
    color: active ? "#fff" : "var(--jv-color-slate-600)",
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
    flexShrink: 0,
  };
}

/**
 * Full-screen template gallery modal. Shows a real, live-rendered mini
 * preview for every template (not a static screenshot), grouped/filterable
 * by career-specific category. Selecting a card applies the template and
 * closes the gallery; further customization (font, color, spacing, header
 * layout) happens afterward in the Design & Style panel.
 */
export default function TemplateGalleryModal({ templates, selectedTmpl, onSelect, onClose }) {
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = activeCategory === "all" ? templates : templates.filter(t => t.category === activeCategory);

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "var(--jv-color-surface)", borderRadius: "var(--jv-radius-lg)", width: "100%", maxWidth: 1080, maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "var(--jv-shadow-lg)", fontFamily: "var(--jv-font-sans)" }}
      >
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--jv-color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--jv-color-heading)" }}>Choose a Template</h2>
            <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--jv-color-muted)" }}>Pick a starting point — you can customize fonts, colors, and layout after.</p>
          </div>
          <IconButton icon={X} label="Close" onClick={onClose} />
        </div>

        <div style={{ display: "flex", gap: 6, padding: "12px 24px", borderBottom: "1px solid var(--jv-color-border)", overflowX: "auto", flexShrink: 0 }}>
          <button onClick={() => setActiveCategory("all")} style={pillStyle(activeCategory === "all")}>All</button>
          {RESUME_TEMPLATE_CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={pillStyle(activeCategory === cat.id)}>{cat.label}</button>
          ))}
        </div>

        <div style={{ padding: 24, overflowY: "auto", flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
          {filtered.map(t => {
            const isActive = selectedTmpl?.id === t.id;
            const accent = t.accent_color || "var(--jv-color-primary)";
            return (
              <div
                key={t.id}
                onClick={() => onSelect(t)}
                style={{ cursor: "pointer", borderRadius: "var(--jv-radius-md)", border: isActive ? `3px solid ${accent}` : "1px solid var(--jv-color-border)", overflow: "hidden", transition: "all 0.15s", boxShadow: isActive ? `0 4px 16px ${accent}33` : "var(--jv-shadow-xs)" }}
              >
                <TemplateThumbnail template={t} width={220} />
                <div style={{ padding: "10px 12px", borderTop: "1px solid var(--jv-color-border)" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--jv-color-heading)" }}>{t.name}</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, color: "var(--jv-color-muted)" }}>{t.tier === "free" ? "Free" : "Pro"}</span>
                    {t.ats_friendly && <span style={{ fontSize: 9, color: "var(--jv-color-success-600)", fontWeight: 700 }}>ATS ✓</span>}
                    {isActive && <span style={{ fontSize: 10, color: accent, fontWeight: 700 }}>Active</span>}
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "var(--jv-color-muted)", fontSize: 13 }}>No templates in this category yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
