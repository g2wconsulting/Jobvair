export function SectionHeadingRenderer({ label, tmpl, accent, fontSize, mode = "builder" }) {
  const effectiveAccent = accent || tmpl?.accent_color || "#00BFA5";
  const effectiveFontSize = fontSize || tmpl?.base_font_size || 13;
  const headingStyle = tmpl?.heading_style || "uppercase";

  if (mode === "document") {
    const base = { margin: "0 0 8px", fontSize: effectiveFontSize - 1, fontWeight: 700, color: effectiveAccent, textTransform: "uppercase", letterSpacing: "0.08em" };
    if (headingStyle === "underlined") return <h2 style={{ ...base, textTransform:"none", fontSize: effectiveFontSize + 1, borderBottom: `2px solid ${effectiveAccent}`, paddingBottom: 4 }}>{label}</h2>;
    if (headingStyle === "accent_bar") return (
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <div style={{ width:4, height:16, background:effectiveAccent, borderRadius:2 }} />
        <h2 style={{ ...base, margin:0 }}>{label}</h2>
      </div>
    );
    if (headingStyle === "minimal") return <h2 style={{ ...base, color:"#374151", fontWeight:600, letterSpacing:"0.04em" }}>{label}</h2>;
    return <h2 style={base}>{label}</h2>;
  }

  if (headingStyle === "accent_bar") return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
      <div style={{ width:4, height:16, background:effectiveAccent, borderRadius:2, flexShrink:0 }} />
      <div style={{ fontSize:effectiveFontSize-1, fontWeight:700, color:effectiveAccent, textTransform:"uppercase", letterSpacing:"0.08em" }}>{label}</div>
    </div>
  );
  if (headingStyle === "underlined") return (
    <div style={{ fontSize:effectiveFontSize+1, fontWeight:700, color:"#0F172A", borderBottom:`2px solid ${effectiveAccent}`, paddingBottom:4, marginBottom:8 }}>{label}</div>
  );
  if (headingStyle === "minimal") return (
    <div style={{ fontSize:effectiveFontSize-1, fontWeight:600, color:"#64748B", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>{label}</div>
  );
  return <div style={{ fontSize:effectiveFontSize-1, fontWeight:700, color:effectiveAccent, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>{label}</div>;
}
