import { useState } from "react";
import { C } from "../constants/appConstants.js";

export function Badge({ color = "teal", children, small }) {
  const m = {
    teal: [C.tealLight, C.tealDark], navy: ["#E8EDF3", C.navyMid],
    gold: ["#FFFBEB", "#92600A"], danger: [C.dangerBg, C.danger],
    success: [C.successBg, C.success], gray: ["#EDF2F7", C.slate],
    purple: [C.purpleBg, C.purple], indigo: [C.indigoBg, C.indigo],
  };
  const [bg, text] = m[color] || m.teal;
  return <span style={{ display:"inline-flex", alignItems:"center", background:bg, color:text, fontSize:small?11:12, fontWeight:600, padding:small?"2px 8px":"3px 10px", borderRadius:20 }}>{children}</span>;
}

export function Btn({ variant="primary", onClick, children, full, small, disabled, icon, style: sx }) {
  const [hov, setHov] = useState(false);
  const s = {
    primary: { background:C.teal, color:"#fff", border:"none", shadow:hov&&!disabled?"0 6px 18px rgba(0,191,165,0.32)":"0 2px 8px rgba(0,191,165,0.22)" },
    secondary: { background:hov&&!disabled?C.bg:"transparent", color:C.navy, border:`1.5px solid ${hov&&!disabled?C.teal:C.border}`, shadow:"none" },
    ghost: { background:hov&&!disabled?C.bg:"transparent", color:C.slate, border:"none", shadow:"none" },
    danger: { background:C.danger, color:"#fff", border:"none", shadow:hov&&!disabled?"0 6px 18px rgba(229,62,62,0.28)":"0 2px 8px rgba(229,62,62,0.18)" },
    navy: { background:C.navy, color:"#fff", border:"none", shadow:hov&&!disabled?"0 6px 18px rgba(13,27,42,0.32)":"0 2px 8px rgba(13,27,42,0.2)" },
    purple: { background:C.purple, color:"#fff", border:"none", shadow:hov&&!disabled?"0 6px 18px rgba(124,58,237,0.3)":"0 2px 8px rgba(124,58,237,0.2)" },
  }[variant] || {};
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      style={{
        background:s.background, color:s.color, border:s.border,
        display:"inline-flex", alignItems:"center", gap:6,
        padding:small?"7px 15px":"10px 20px", borderRadius:small?8:10,
        fontSize:small?13:14, fontWeight:600, cursor:disabled?"not-allowed":"pointer",
        width:full?"100%":undefined, justifyContent:"center", opacity:disabled?0.5:1,
        fontFamily:"inherit", transition:"all 0.15s ease",
        boxShadow:disabled?"none":s.shadow,
        transform:hov&&!disabled?"translateY(-1px)":"translateY(0)",
        ...sx,
      }}>
      {icon && <span style={{ fontSize:16 }}>{icon}</span>}
      {children}
    </button>
  );
}

export function Card({ children, style, onClick, hover }) {
  const [hov, setHov] = useState(false);
  const active = hov && (hover || onClick);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      background:C.bgCard, borderRadius:16, border:`1px solid ${active?C.teal+"55":C.border}`,
      padding:"20px 24px", cursor:onClick?"pointer":undefined,
      transition:"border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease",
      boxShadow:active?"0 12px 28px rgba(13,27,42,0.1)":"0 1px 3px rgba(13,27,42,0.05), 0 1px 2px rgba(13,27,42,0.03)",
      transform:active?"translateY(-2px)":"translateY(0)",
      ...style,
    }}>{children}</div>
  );
}

export function Input({ label, type="text", value, onChange, placeholder, required, hint, error, textarea, rows=3, disabled }) {
  const Tag = textarea ? "textarea" : "input";
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {label && <label style={{ fontSize:13, fontWeight:600, color:C.navy }}>{label}{required&&<span style={{ color:C.danger }}> *</span>}</label>}
      <Tag type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} disabled={disabled}
        className="jv-input"
        style={{ border:`1.5px solid ${error?C.danger:C.border}`, borderRadius:10, padding:"10px 13px", fontSize:14, color:C.text, background:disabled?"#f9f9f9":"#fff", outline:"none", resize:textarea?"vertical":undefined, fontFamily:"inherit", width:"100%", boxSizing:"border-box" }} />
      {hint && <span style={{ fontSize:12, color:C.textMuted }}>{hint}</span>}
      {error && <span style={{ fontSize:12, color:C.danger }}>{error}</span>}
    </div>
  );
}

export function Select({ label, value, onChange, options, required, hint }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {label && <label style={{ fontSize:13, fontWeight:600, color:C.navy }}>{label}{required&&<span style={{ color:C.danger }}> *</span>}</label>}
      <select value={value} onChange={e=>onChange(e.target.value)} className="jv-input" style={{ border:`1.5px solid ${C.border}`, borderRadius:10, padding:"10px 13px", fontSize:14, color:C.text, background:"#fff", outline:"none", fontFamily:"inherit", width:"100%", boxSizing:"border-box" }}>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint && <span style={{ fontSize:12, color:C.textMuted }}>{hint}</span>}
    </div>
  );
}

export function ProgressBar({ value, max=100, color=C.teal, label }) {
  const pct = Math.round((value/max)*100);
  return (
    <div>
      {label && <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <span style={{ fontSize:13, color:C.slate }}>{label}</span>
        <span style={{ fontSize:13, fontWeight:600, color:C.navy }}>{pct}%</span>
      </div>}
      <div style={{ height:8, background:C.bg, borderRadius:99, overflow:"hidden" }}>
        <div style={{ height:8, background:`linear-gradient(90deg, ${color}, ${color}cc)`, borderRadius:99, width:`${pct}%`, transition:"width 0.5s ease" }} />
      </div>
    </div>
  );
}

export function SectionTitle({ children, sub, action }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, gap:16, flexWrap:"wrap" }}>
      <div>
        <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:C.navy, letterSpacing:"-0.01em" }}>{children}</h2>
        {sub && <p style={{ margin:"5px 0 0", fontSize:14, color:C.textMuted, lineHeight:1.5 }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Avatar({ name, size=40 }) {
  const initials = name ? name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase() : "U";
  return <div style={{ width:size, height:size, borderRadius:"50%", background:`linear-gradient(135deg, ${C.teal}, ${C.navyMid})`, boxShadow:"0 3px 10px rgba(0,191,165,0.28)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:size*0.35, flexShrink:0 }}>{initials}</div>;
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display:"flex", gap:4, marginBottom:24, overflowX:"auto", padding:4, background:C.bg, borderRadius:12, width:"fit-content" }}>
      {tabs.map(t=>(
        <button key={t.id} onClick={()=>onChange(t.id)} style={{
          background:active===t.id?"#fff":"transparent", border:"none", borderRadius:9,
          color:active===t.id?C.navy:C.slate, fontSize:13.5, fontWeight:active===t.id?700:500,
          padding:"8px 16px", cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap",
          boxShadow:active===t.id?"0 1px 4px rgba(13,27,42,0.1)":"none", transition:"all 0.15s ease",
        }}>{t.label}</button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
      <div onClick={()=>onChange(!checked)} style={{
        width:42, height:24, borderRadius:12, background:checked?C.teal:C.border, position:"relative", transition:"background 0.2s", flexShrink:0,
      }}>
        <div style={{ position:"absolute", top:3, left:checked?20:3, width:18, height:18, borderRadius:"50%", background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,0.2)", transition:"left 0.2s" }} />
      </div>
      {label && <span style={{ fontSize:14, color:C.text }}>{label}</span>}
    </label>
  );
}

export function CheckGroup({ label, options, value, onChange }) {
  const toggle = (v) => {
    const next = value.includes(v) ? value.filter(x=>x!==v) : [...value, v];
    onChange(next);
  };
  return (
    <div>
      {label && <div style={{ fontSize:13, fontWeight:600, color:C.navy, marginBottom:8 }}>{label}</div>}
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {options.map(o=>(
          <label key={o.value} style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", padding:"6px 12px", borderRadius:8, border:`1.5px solid ${value.includes(o.value)?C.teal:C.border}`, background:value.includes(o.value)?C.tealLight:"#fff", fontSize:13 }}>
            <input type="checkbox" checked={value.includes(o.value)} onChange={()=>toggle(o.value)} style={{ accentColor:C.teal }} />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  );
}


