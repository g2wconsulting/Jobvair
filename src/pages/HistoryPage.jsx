import { SEED_ANALYSES } from "../constants/appConstants.js";
import { Page, PageHeader, Card } from "../components/ui/index.js";

const scoreColor = (score) => score >= 80 ? "var(--jv-color-success-600)" : score >= 60 ? "var(--jv-color-warning-600)" : "var(--jv-color-danger-600)";

export default function HistoryPage() {
  return (
    <Page size="wide" className="jobvair-page">
      <PageHeader title="AI Analysis History" description="All your past AI resume analyses." />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {SEED_ANALYSES.map(a => (
          <Card key={a.id} interactive>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--jv-color-heading)" }}>{a.jobTitle}</div>
                <div style={{ fontSize: 13, color: "var(--jv-color-muted)" }}>{a.company} · {a.date}</div>
                <div style={{ fontSize: 13, color: "var(--jv-color-text)", marginTop: 4 }}>Resume: {a.resumeName}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: scoreColor(a.matchScore) }}>{a.matchScore}%</div>
                <div style={{ fontSize: 12, color: "var(--jv-color-muted)" }}>match</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Page>
  );
}
