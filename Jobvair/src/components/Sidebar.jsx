import { C, NAV } from "../constants/appConstants.js";
import { Avatar } from "./ui.jsx";

export default function Sidebar({ active, onNav, user, collapsed, onCollapse }) {
  return (
    <div style={{ width:collapsed?64:240, minHeight:"100vh", background:C.navy, display:"flex", flexDirection:"column", transition:"width 0.2s ease", flexShrink:0, position:"relative" }}>
      <div style={{ padding:collapsed?"20px 12px":"20px 20px", borderBottom:`1px solid rgba(255,255,255,0.08)`, display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:34, height:34, borderRadius:8, background:C.teal, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        </div>
        {!collapsed && <span style={{ fontSize:20, fontWeight:800, color:"#fff", letterSpacing:"-0.4px" }}>Jobvair</span>}
      </div>
      <nav style={{ flex:1, padding:"12px 8px", overflowY:"auto" }}>
        {NAV.map(item=>(
          <button key={item.id} onClick={()=>onNav(item.id)} style={{
            display:"flex", alignItems:"center", gap:10, width:"100%", padding:"10px 14px",
            background:active===item.id?"rgba(0,191,165,0.15)":"transparent", border:"none", borderRadius:8, cursor:"pointer",
            color:active===item.id?C.teal:"rgba(255,255,255,0.6)", fontSize:14, fontWeight:active===item.id?600:400,
            textAlign:"left", fontFamily:"inherit", marginBottom:2, justifyContent:collapsed?"center":"flex-start",
          }}>
            <span style={{ fontSize:16, flexShrink:0 }}>{item.icon}</span>
            {!collapsed && item.label}
          </button>
        ))}
        <div style={{ margin:"8px 0", borderTop:`1px solid rgba(255,255,255,0.08)`, paddingTop:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", color:"rgba(255,255,255,0.25)", fontSize:13, justifyContent:collapsed?"center":"flex-start" }}>
            <span style={{ fontSize:16 }}>🏢</span>
            {!collapsed && <span>Employer Portal<br/><span style={{ fontSize:11, opacity:0.6 }}>Coming soon</span></span>}
          </div>
        </div>
      </nav>
      <div style={{ padding:collapsed?"12px 8px":"12px 16px", borderTop:`1px solid rgba(255,255,255,0.08)`, display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ position:"relative" }}>
          <Avatar name={user.name} size={32} />
          {user.idVerified && <div style={{ position:"absolute", bottom:-2, right:-2, width:12, height:12, borderRadius:"50%", background:C.teal, border:"2px solid "+C.navy, display:"flex", alignItems:"center", justifyContent:"center", fontSize:7, color:"#fff" }}>✓</div>}
        </div>
        {!collapsed && (
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.name}</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{user.idVerified?"✓ Verified · ":""}{user.subscription==="free"?"Free Plan":"Premium"}</div>
          </div>
        )}
      </div>
      <button onClick={onCollapse} style={{ position:"absolute", top:24, right:-12, width:24, height:24, borderRadius:"50%", background:C.teal, border:"none", cursor:"pointer", color:"#fff", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center" }}>{collapsed?"›":"‹"}</button>
    </div>
  );
}

