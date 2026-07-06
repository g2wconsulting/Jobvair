import { C, SEED_ANALYSES } from "../constants/appConstants.js";
import { Badge, Btn, Card, ProgressBar, SectionTitle } from "../components/ui.jsx";

export default function DashboardPage({ user, onNav }) {
  const items = [
    { label:"Basic info", done:true }, { label:"Professional summary", done:true },
    { label:"Work experience", done:true }, { label:"Skills", done:true },
    { label:"Education", done:true }, { label:"ID Verification", done:user.idVerified },
    { label:"Profile photo", done:false }, { label:"Certifications", done:false },
  ];
  const pct = Math.round((items.filter(i=>i.done).length/items.length)*100);

  return (
    <div className="jobvair-page">
      <div style={{ background:`linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 100%)`, borderRadius:16, padding:"28px 32px", marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
        <div>
          <p style={{ margin:"0 0 4px", color:"rgba(255,255,255,0.6)", fontSize:14 }}>Good morning 👋</p>
          <h1 style={{ margin:0, color:"#fff", fontSize:26, fontWeight:800 }}>
            {user.name}
            {user.idVerified && <Badge color="teal" small> ✓ Verified</Badge>}
          </h1>
          <p style={{ margin:"6px 0 0", color:"rgba(255,255,255,0.6)", fontSize:14 }}>Your profile is {pct}% complete. Keep building to get better AI matches.</p>
        </div>
        <Btn onClick={()=>onNav("ai-optimize")} icon="✦">Run AI Analysis</Btn>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:16, marginBottom:24 }}>
        {[
          { label:"Saved Resumes", value:"2", icon:"📄", action:()=>onNav("resumes") },
          { label:"AI Analyses", value:"2", icon:"✦", action:()=>onNav("history") },
          { label:"Profile", value:`${pct}%`, icon:"👤", action:()=>onNav("profile") },
          { label:"ID Status", value:user.idVerified?"Verified":"Unverified", icon:"🛡", action:()=>onNav("profile") },
          { label:"Plan", value:"Free", icon:"⭐", action:()=>onNav("settings") },
        ].map(s=>(
          <Card key={s.label} hover onClick={s.action} style={{ padding:"16px 18px" }}>
            <div style={{ fontSize:20, marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontSize:20, fontWeight:800, color:C.navy, marginBottom:2 }}>{s.value}</div>
            <div style={{ fontSize:12, color:C.textMuted }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))", gap:20 }}>
        <Card>
          <SectionTitle action={<Btn variant="ghost" small onClick={()=>onNav("profile")}>Edit →</Btn>}>Profile Completion</SectionTitle>
          <ProgressBar value={pct} max={100} label="Overall completion" />
          <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:8 }}>
            {items.map(item=>(
              <div key={item.label} style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:18, height:18, borderRadius:"50%", background:item.done?C.teal:C.border, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {item.done && <span style={{ color:"#fff", fontSize:10 }}>✓</span>}
                </div>
                <span style={{ fontSize:13, color:item.done?C.text:C.textMuted }}>{item.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          <Card>
            <SectionTitle action={<Btn variant="ghost" small onClick={()=>onNav("history")}>All →</Btn>}>Recent AI Analyses</SectionTitle>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {SEED_ANALYSES.map(a=>(
                <div key={a.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:C.bg, borderRadius:8 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:C.navy }}>{a.jobTitle}</div>
                    <div style={{ fontSize:12, color:C.textMuted }}>{a.company} · {a.date}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:20, fontWeight:800, color:a.matchScore>=80?C.success:a.matchScore>=60?C.warning:C.danger }}>{a.matchScore}%</div>
                    <div style={{ fontSize:11, color:C.textMuted }}>match</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {!user.idVerified && (
            <Card style={{ background:`linear-gradient(135deg,#EEF2FF,#fff)`, border:`1px solid ${C.indigo}33` }}>
              <div style={{ display:"flex", gap:12 }}>
                <div style={{ fontSize:28 }}>🛡</div>
                <div>
                  <div style={{ fontSize:15, fontWeight:700, color:C.navy, marginBottom:4 }}>Verify Your Identity</div>
                  <div style={{ fontSize:13, color:C.slate, marginBottom:12 }}>Get 3× more profile views and priority in employer search.</div>
                  <Btn small variant="navy" onClick={()=>onNav("profile")}>Verify Now</Btn>
                </div>
              </div>
            </Card>
          )}

          <Card style={{ background:`linear-gradient(135deg,${C.tealLight},#fff)`, border:`1px solid ${C.teal}33` }}>
            <div style={{ display:"flex", gap:12 }}>
              <div style={{ fontSize:28 }}>⭐</div>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:C.navy, marginBottom:4 }}>Upgrade to Premium</div>
                <div style={{ fontSize:13, color:C.slate, marginBottom:12 }}>Unlimited AI analyses, premium templates, PDF export.</div>
                <Btn small onClick={()=>onNav("settings")}>View plans</Btn>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

