export function HeaderRenderer({
  contactFields,
  editing = false,
  tmpl,
  effectiveHdrLayout,
  margins,
  accent,
  fontFamily,
  fontSize,
  onFieldChange,
  onOpenHeaderPanel,
}) {
  const hc = contactFields || {};
  const layout = effectiveHdrLayout || tmpl?.header_style || "left";
  const effectiveAccent = accent || tmpl?.accent_color || "#00BFA5";
  const effectiveFontFamily = fontFamily || tmpl?.font_family || "DM Sans, sans-serif";
  const effectiveFontSize = fontSize || tmpl?.base_font_size || 13;
  const isBanner = layout === "bold_banner";
  const textColor = isBanner ? "#fff" : "#0F172A";
  const subColor  = isBanner ? "rgba(255,255,255,0.85)" : effectiveAccent;
  const contactColor = isBanner ? "rgba(255,255,255,0.75)" : "#64748B";
  const linkColor    = isBanner ? "rgba(255,255,255,0.6)"  : "#94A3B8";
  const inputStyle = (extra={}) => ({ background:"transparent", border:"none", outline:"none", fontFamily:effectiveFontFamily, ...extra });
  const stopInputClick = e => e.stopPropagation();
  const setField = (field, value) => onFieldChange?.(field, value);

  const nameEl = editing
    ? <input value={hc.name||""} onClick={stopInputClick} onChange={e=>setField("name",e.target.value)} placeholder="Your Name" style={inputStyle({ fontSize:effectiveFontSize+14, fontWeight:800, letterSpacing:"-0.02em", color:textColor, width:"100%", display:"block" })} />
    : <div style={{ fontSize:effectiveFontSize+14, fontWeight:800, letterSpacing:"-0.02em", color:textColor }}>{hc.name||"Your Name"}</div>;

  const headlineEl = (hc.show_headline && (editing || hc.headline)) && (
    editing
      ? <input value={hc.headline||""} onClick={stopInputClick} onChange={e=>setField("headline",e.target.value)} placeholder="Professional Headline (optional)" style={inputStyle({ fontSize:effectiveFontSize+1, fontWeight:600, color:subColor, width:"100%", display:"block", marginTop:4 })} />
      : hc.headline ? <div style={{ fontSize:effectiveFontSize+1, fontWeight:600, color:subColor, marginTop:4 }}>{hc.headline}</div> : null
  );

  const contactItems = [
    hc.show_email    && hc.email,
    hc.show_phone    && hc.phone,
    hc.show_location && hc.location,
  ].filter(Boolean);
  const linkItems = [
    hc.show_linkedin && hc.linkedin,
    hc.show_website  && hc.website,
    hc.show_github   && hc.github,
    hc.show_custom   && hc.custom_contact_line,
  ].filter(Boolean);

  const contactLineEl = editing ? (
    <div style={{ display:"flex", gap:10, marginTop:5, flexWrap:"wrap" }}>
      {hc.show_email    && <input value={hc.email||""}    onClick={stopInputClick} onChange={e=>setField("email",e.target.value)}    placeholder="email@example.com" style={inputStyle({ fontSize:effectiveFontSize-1, color:contactColor, minWidth:140 })} />}
      {hc.show_phone    && <input value={hc.phone||""}    onClick={stopInputClick} onChange={e=>setField("phone",e.target.value)}    placeholder="Phone"            style={inputStyle({ fontSize:effectiveFontSize-1, color:contactColor, minWidth:110 })} />}
      {hc.show_location && <input value={hc.location||""} onClick={stopInputClick} onChange={e=>setField("location",e.target.value)} placeholder="City, State"      style={inputStyle({ fontSize:effectiveFontSize-1, color:contactColor, minWidth:110 })} />}
      {hc.show_linkedin && <input value={hc.linkedin||""} onClick={stopInputClick} onChange={e=>setField("linkedin",e.target.value)} placeholder="linkedin.com/in/…" style={inputStyle({ fontSize:effectiveFontSize-2, color:linkColor, minWidth:140 })} />}
      {hc.show_website  && <input value={hc.website||""}  onClick={stopInputClick} onChange={e=>setField("website",e.target.value)}  placeholder="yoursite.com"     style={inputStyle({ fontSize:effectiveFontSize-2, color:linkColor, minWidth:120 })} />}
      {hc.show_github   && <input value={hc.github||""}   onClick={stopInputClick} onChange={e=>setField("github",e.target.value)}   placeholder="github.com/…"     style={inputStyle({ fontSize:effectiveFontSize-2, color:linkColor, minWidth:120 })} />}
      {hc.show_custom   && <input value={hc.custom_contact_line||""} onClick={stopInputClick} onChange={e=>setField("custom_contact_line",e.target.value)} placeholder="Custom contact info" style={inputStyle({ fontSize:effectiveFontSize-2, color:linkColor, minWidth:140 })} />}
    </div>
  ) : (
    <>
      {contactItems.length > 0 && <div style={{ fontSize:effectiveFontSize-1, color:contactColor, marginTop:5 }}>{contactItems.join(" · ")}</div>}
      {linkItems.length   > 0 && <div style={{ fontSize:effectiveFontSize-2, color:linkColor, marginTop:2 }}>{linkItems.join(" · ")}</div>}
    </>
  );

  const align = layout === "centered" ? "center" : "left";
  const inner = <>{nameEl}{headlineEl}{contactLineEl}</>;
  const [mTop, mSide] = (margins || "44px 56px").split(" ");
  const bannerMargin = `-${mTop} -${mSide} 20px`;

  if (layout === "bold_banner") return (
    <div style={{ background:effectiveAccent, padding:"20px 24px", margin:bannerMargin, borderRadius:"4px 4px 0 0", cursor:editing?"default":"pointer" }}
      onClick={!editing ? onOpenHeaderPanel : undefined}>
      {inner}
    </div>
  );

  return (
    <div style={{ textAlign:align, paddingBottom:14, marginBottom:14, borderBottom:`3px solid ${effectiveAccent}`, cursor:editing?"default":"pointer" }}
      onClick={!editing ? onOpenHeaderPanel : undefined}>
      {inner}
    </div>
  );
}
