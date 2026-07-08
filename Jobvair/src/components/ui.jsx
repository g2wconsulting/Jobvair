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
  const s = {
    primary: { background:C.teal, color:"#fff", border:"none" },
    secondary: { background:"transparent", color:C.navy, border:`1.5px solid ${C.border}` },
    ghost: { background:"transparent", color:C.slate, border:"none" },
    danger: { background:C.danger, color:"#fff", border:"none" },
    navy: { background:C.navy, color:"#fff", border:"none" },
    purple: { background:C.purple, color:"#fff", border:"none" },
  }[variant] || {};
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...s, display:"inline-flex", alignItems:"center", gap:6,
      padding:small?"6px 14px":"10px 20px", borderRadius:8,
      fontSize:small?13:14, fontWeight:600, cursor:disabled?"not-allowed":"pointer",
      width:full?"100%":undefined, justifyContent:"center", opacity:disabled?0.5:1,
      fontFamily:"inherit", transition:"all 0.15s", ...sx,
    }}>
      {icon && <span style={{ fontSize:16 }}>{icon}</span>}
      {children}
    </button>
  );
}

export function Card({ children, style, onClick, hover }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      background:C.bgCard, borderRadius:12, border:`1px solid ${hov&&hover?C.teal:C.border}`,
      padding:"20px 24px", cursor:onClick?"pointer":undefined,
      transition:"border-color 0.15s, box-shadow 0.15s",
      boxShadow:hov&&hover?"0 4px 16px rgba(0,191,165,0.1)":"0 1px 4px rgba(0,0,0,0.04)",
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
        style={{ border:`1.5px solid ${error?C.danger:C.border}`, borderRadius:8, padding:"9px 12px", fontSize:14, color:C.text, background:disabled?"#f9f9f9":"#fff", outline:"none", resize:textarea?"vertical":undefined, fontFamily:"inherit", width:"100%", boxSizing:"border-box" }} />
      {hint && <span style={{ fontSize:12, color:C.textMuted }}>{hint}</span>}
      {error && <span style={{ fontSize:12, color:C.danger }}>{error}</span>}
    </div>
  );
}

export function Select({ label, value, onChange, options, required, hint }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {label && <label style={{ fontSize:13, fontWeight:600, color:C.navy }}>{label}{required&&<span style={{ color:C.danger }}> *</span>}</label>}
      <select value={value} onChange={e=>onChange(e.target.value)} style={{ border:`1.5px solid ${C.border}`, borderRadius:8, padding:"9px 12px", fontSize:14, color:C.text, background:"#fff", outline:"none", fontFamily:"inherit", width:"100%", boxSizing:"border-box" }}>
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
      <div style={{ height:8, background:C.border, borderRadius:99 }}>
        <div style={{ height:8, background:color, borderRadius:99, width:`${pct}%`, transition:"width 0.4s ease" }} />
      </div>
    </div>
  );
}

export function SectionTitle({ children, sub, action }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
      <div>
        <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:C.navy }}>{children}</h2>
        {sub && <p style={{ margin:"4px 0 0", fontSize:14, color:C.textMuted }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Avatar({ name, size=40 }) {
  const initials = name ? name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase() : "U";
  return <div style={{ width:size, height:size, borderRadius:"50%", background:`linear-gradient(135deg, ${C.teal}, ${C.navyMid})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:size*0.35, flexShrink:0 }}>{initials}</div>;
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, marginBottom:24, overflowX:"auto" }}>
      {tabs.map(t=>(
        <button key={t.id} onClick={()=>onChange(t.id)} style={{
          background:"none", border:"none", borderBottom:active===t.id?`2.5px solid ${C.teal}`:"2.5px solid transparent",
          color:active===t.id?C.teal:C.slate, fontSize:14, fontWeight:active===t.id?700:500,
          padding:"10px 16px", cursor:"pointer", marginBottom:-1, fontFamily:"inherit", whiteSpace:"nowrap",
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
        <div style={{ position:"absolute", top:3, left:checked?20:3, width:18, height:18, borderRadius:"50%", background:"#fff", transition:"left 0.2s" }} />
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


