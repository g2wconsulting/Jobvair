export function SectionHeadingRenderer({ label, tmpl, accent, fontSize, mode = "builder" }) {
  const effectiveAccent = accent || tmpl?.accent_color || "#00BFA5";
  const effectiveFontSize = fontSize || tmpl?.base_font_size || 13;
  const headingStyle = tmpl?.heading_style || "uppercase";
  const visualStyle = tmpl?.visual_style || tmpl?.template_config?.visual_style || {};
  const treatment = visualStyle.section_heading_treatment;
  const dividerColor = visualStyle.divider_color || effectiveAccent;

  if (treatment === "executive_rule") {
    return (
      <div style={{ marginBottom:10, paddingBottom:5, borderBottom:`1px solid ${dividerColor}` }}>
        <div style={{ fontSize:effectiveFontSize, fontWeight:800, color:"#111827", textTransform:"uppercase", letterSpacing:"0.14em" }}>{label}</div>
      </div>
    );
  }

  if (treatment === "tech_pill") {
    return (
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <div style={{ width:6, height:22, background:effectiveAccent, borderRadius:999 }} />
        <div style={{ fontSize:effectiveFontSize, fontWeight:800, color:"#0F172A", letterSpacing:"0.02em" }}>{label}</div>
        <div style={{ flex:1, height:1, background:visualStyle.divider_color || "#BFDBFE" }} />
      </div>
    );
  }

  if (treatment === "healthcare_subtle") {
    return (
      <div style={{ marginBottom:8 }}>
        <div style={{ fontSize:effectiveFontSize, fontWeight:700, color:effectiveAccent, textTransform:"none", letterSpacing:"0.01em" }}>{label}</div>
        <div style={{ width:42, height:2, background:visualStyle.divider_color || "#99F6E4", borderRadius:999, marginTop:5 }} />
      </div>
    );
  }

  if (treatment === "government_block") {
    return (
      <div style={{ marginBottom:7, padding:"4px 0", borderTop:"1px solid #111827", borderBottom:"1px solid #111827" }}>
        <div style={{ fontSize:effectiveFontSize-1, fontWeight:800, color:"#111827", textTransform:"uppercase", letterSpacing:"0.1em" }}>{label}</div>
      </div>
    );
  }

  if (treatment === "student_bar") {
    return (
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <div style={{ width:18, height:3, background:effectiveAccent, borderRadius:999 }} />
        <div style={{ fontSize:effectiveFontSize, fontWeight:800, color:"#312E81", textTransform:"uppercase", letterSpacing:"0.08em" }}>{label}</div>
      </div>
    );
  }

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