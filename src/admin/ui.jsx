// Shared UI primitives for the Jobvair Admin Console (admin.jsx and its
// sub-pages, e.g. AssessmentsAdminPage.jsx). Split out from admin.jsx so
// sub-pages can import these without a circular import back into
// admin.jsx itself. Design tokens live in ./theme.js so this file can
// export components only.

import { A, font, sans } from "./theme.js";

// ── Tiny components ───────────────────────────────────────────────────────
export const Card = ({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{
    background: A.bgCard, border: `1px solid ${A.border}`, borderRadius: 12,
    padding: 24, transition: "border-color 0.15s",
    cursor: onClick ? "pointer" : "default",
    ...style,
  }}
    onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = A.borderHover)}
    onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = A.border)}
  >{children}</div>
);

export const Badge = ({ children, color = "blue" }) => {
  const colors = { blue: A.blue, teal: A.teal, green: A.green, red: A.red, gold: A.gold, purple: A.purple, gray: A.textMuted };
  const c = colors[color] || A.blue;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", padding:"2px 8px", borderRadius:99,
      background: `${c}22`, color: c, fontSize: 11, fontWeight: 700, letterSpacing:"0.05em",
      fontFamily: font, border: `1px solid ${c}44` }}>
      {children}
    </span>
  );
};

export const Btn = ({ children, onClick, variant = "primary", small, disabled, full, icon }) => {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6, padding: small ? "6px 14px" : "10px 20px",
    borderRadius: 8, fontSize: small ? 12 : 14, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1, border: "none", fontFamily: sans, transition: "all 0.15s",
    width: full ? "100%" : undefined, justifyContent: full ? "center" : undefined,
  };
  const variants = {
    primary:   { background: A.teal, color: "#000" },
    secondary: { background: "transparent", color: A.text, border: `1px solid ${A.border}` },
    danger:    { background: `${A.red}22`, color: A.red, border: `1px solid ${A.red}44` },
    ghost:     { background: "transparent", color: A.textMuted },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant] }}>
      {icon && <span>{icon}</span>}{children}
    </button>
  );
};

export const Input = ({ label, value, onChange, placeholder, type = "text", hint }) => (
  <div>
    {label && <div style={{ fontSize: 12, color: A.textMuted, marginBottom: 6, fontFamily: font, letterSpacing:"0.05em", textTransform:"uppercase" }}>{label}</div>}
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "10px 14px", background: A.bg, border: `1px solid ${A.border}`,
        borderRadius: 8, color: A.text, fontSize: 14, fontFamily: sans, outline: "none",
        boxSizing: "border-box",
      }}
    />
    {hint && <div style={{ fontSize: 11, color: A.textMuted, marginTop: 4 }}>{hint}</div>}
  </div>
);

export const TextArea = ({ label, value, onChange, placeholder, hint, rows = 4 }) => (
  <div>
    {label && <div style={{ fontSize: 12, color: A.textMuted, marginBottom: 6, fontFamily: font, letterSpacing:"0.05em", textTransform:"uppercase" }}>{label}</div>}
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: "100%", padding: "10px 14px", background: A.bg, border: `1px solid ${A.border}`,
        borderRadius: 8, color: A.text, fontSize: 14, fontFamily: sans, outline: "none",
        boxSizing: "border-box", resize: "vertical", lineHeight: 1.5,
      }}
    />
    {hint && <div style={{ fontSize: 11, color: A.textMuted, marginTop: 4 }}>{hint}</div>}
  </div>
);

export const Select = ({ label, value, onChange, options }) => (
  <div>
    {label && <div style={{ fontSize: 12, color: A.textMuted, marginBottom: 6, fontFamily: font, letterSpacing:"0.05em", textTransform:"uppercase" }}>{label}</div>}
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      width: "100%", padding: "10px 14px", background: A.bg, border: `1px solid ${A.border}`,
      borderRadius: 8, color: A.text, fontSize: 14, fontFamily: sans, outline: "none",
    }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

export const StatCard = ({ label, value, sub, color = A.teal, icon }) => (
  <Card>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontSize: 12, color: A.textMuted, fontFamily: font, textTransform: "uppercase", letterSpacing:"0.08em", marginBottom: 8 }}>{label}</div>
        <div style={{ fontSize: 32, fontWeight: 800, color, fontFamily: font }}>{value ?? "—"}</div>
        {sub && <div style={{ fontSize: 12, color: A.textMuted, marginTop: 4 }}>{sub}</div>}
      </div>
      {icon && <div style={{ fontSize: 28, opacity: 0.6 }}>{icon}</div>}
    </div>
  </Card>
);
