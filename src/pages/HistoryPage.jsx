import { C, SEED_ANALYSES } from "../constants/appConstants.js";
import { Card, SectionTitle } from "../components/ui.jsx";

export default function HistoryPage() {
  return (
    <div className="jobvair-page">
      <SectionTitle sub="All your past AI resume analyses.">AI Analysis History</SectionTitle>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {SEED_ANALYSES.map(a=>(
          <Card key={a.id} hover>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:16, fontWeight:700, color:C.navy }}>{a.jobTitle}</div>
                <div style={{ fontSize:13, color:C.textMuted }}>{a.company} · {a.date}</div>
                <div style={{ fontSize:13, color:C.slate, marginTop:4 }}>Resume: {a.resumeName}</div>
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:30, fontWeight:800, color:a.matchScore>=80?C.success:a.matchScore>=60?C.warning:C.danger }}>{a.matchScore}%</div>
                <div style={{ fontSize:12, color:C.textMuted }}>match</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}


