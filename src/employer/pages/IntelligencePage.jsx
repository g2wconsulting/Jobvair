import { useState } from "react";
import { Lightbulb } from "lucide-react";
import { Page, PageHeader, Tabs, Card, Button, Input, Select, Badge, StatCard, ResponsiveGrid, EmptyState } from "../../components/ui/index.js";
import { getSalaryInsight, getMarketInsight } from "../lib/employerApi.js";

const TABS = [
  { id: "salary",          label: "Salary Insights" },
  { id: "market",          label: "Talent Market" },
  { id: "recommendations", label: "Hiring Recommendations" },
];

function SalaryTab({ company, user }) {
  const [form, setForm] = useState({ jobTitle: "", location: "", experienceLevel: "mid", industry: "", companySize: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const run = async () => {
    if (!form.jobTitle) return;
    setLoading(true);
    try {
      const r = await getSalaryInsight({ companyId: company?.id, requestedBy: user?.id, ...form });
      setResult(r);
    } finally { setLoading(false); }
  };

  return (
    <div>
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
          <Input label="Job title" value={form.jobTitle} onChange={e => set("jobTitle", e.target.value)} placeholder="Senior Accountant" />
          <Input label="Location" value={form.location} onChange={e => set("location", e.target.value)} placeholder="Charlotte, NC" />
          <Select label="Experience level" value={form.experienceLevel} onChange={e => set("experienceLevel", e.target.value)}
            options={["entry", "mid", "senior", "manager", "director"].map(v => ({ value: v, label: v }))} />
          <Button disabled={!form.jobTitle || loading} onClick={run}>{loading ? "Analyzing…" : "Get Insight"}</Button>
        </div>
      </Card>

      {result && (
        <Card style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Market Compensation</h3>
            <Badge tone="neutral">Preview estimate</Badge>
          </div>
          <ResponsiveGrid min="160px" gap="12px">
            <StatCard label="Lower Range" value={`$${result.low.toLocaleString()}`} tone="neutral" />
            <StatCard label="Median" value={`$${result.median.toLocaleString()}`} tone="primary" />
            <StatCard label="Upper Range" value={`$${result.high.toLocaleString()}`} tone="neutral" />
          </ResponsiveGrid>
          <div style={{ marginTop: 16, padding: 14, background: "var(--jv-color-teal-50)", borderRadius: "var(--jv-radius-md)", fontSize: 13, color: "var(--jv-color-teal-700)" }}>
            <strong>Hiring Recommendation:</strong> {result.recommendation}
          </div>
        </Card>
      )}
    </div>
  );
}

function MarketTab({ company }) {
  const [form, setForm] = useState({ location: "", skillProfile: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const run = async () => {
    if (!form.location) return;
    setLoading(true);
    try {
      const r = await getMarketInsight({ companyId: company?.id, location: form.location, skillProfile: form.skillProfile.split(",").map(s => s.trim()).filter(Boolean) });
      setResult(r);
    } finally { setLoading(false); }
  };

  return (
    <div>
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr auto", gap: 12, alignItems: "end" }}>
          <Input label="Metro / location" value={form.location} onChange={e => set("location", e.target.value)} placeholder="Charlotte, NC" />
          <Input label="Skill profile (comma separated)" value={form.skillProfile} onChange={e => set("skillProfile", e.target.value)} placeholder="Accounting, Excel, GAAP" />
          <Button disabled={!form.location || loading} onClick={run}>{loading ? "Analyzing…" : "Get Insight"}</Button>
        </div>
      </Card>

      {result && (
        <ResponsiveGrid min="220px" gap="16px" style={{ marginTop: 16 }}>
          <Card>
            <div style={{ fontSize: 12, color: "var(--jv-color-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>Talent Availability</div>
            <div style={{ fontSize: 14 }}>Approximately <strong>{result.talent_availability_estimate.toLocaleString()}</strong> potential candidates match this skill profile within {result.location}.</div>
          </Card>
          <Card>
            <div style={{ fontSize: 12, color: "var(--jv-color-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>Work Arrangement</div>
            <div style={{ fontSize: 14 }}>Approximately <strong>{result.remote_hybrid_preference_pct}%</strong> of similar professionals prefer hybrid or remote work.</div>
          </Card>
          <Card>
            <div style={{ fontSize: 12, color: "var(--jv-color-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>Hiring Difficulty</div>
            <Badge tone={result.hiring_difficulty === "Low" ? "success" : result.hiring_difficulty === "Moderate" ? "warning" : "danger"}>{result.hiring_difficulty}</Badge>
          </Card>
          <Card>
            <div style={{ fontSize: 12, color: "var(--jv-color-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>Compensation Competitiveness</div>
            <div style={{ fontSize: 14 }}>Your range is approximately <strong>{Math.abs(result.compensation_competitiveness_pct)}% {result.compensation_competitiveness_pct < 0 ? "below" : "above"}</strong> the estimated local market median.</div>
          </Card>
          <Card>
            <div style={{ fontSize: 12, color: "var(--jv-color-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>Candidate Supply</div>
            <div style={{ fontSize: 14 }}>Candidate availability within {result.candidate_supply_radius_miles} miles is <strong>{result.candidate_supply_level.toLowerCase()}</strong>.</div>
          </Card>
        </ResponsiveGrid>
      )}
    </div>
  );
}

function RecommendationsTab() {
  return (
    <Card>
      <EmptyState
        icon={Lightbulb}
        title="Recruiting recommendations are on the roadmap"
        description="Once salary and talent market data are attached to your live job postings, Jobvair will combine them with candidate supply and work-preference data to suggest concrete moves — e.g. widening a search radius or adjusting a salary range."
      />
    </Card>
  );
}

export default function IntelligencePage({ company, user }) {
  const [tab, setTab] = useState("salary");
  return (
    <Page size="wide">
      <PageHeader eyebrow="Intelligence" title="Hiring Intelligence" description="Understand whether a role is realistic before you struggle to recruit for it." />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div style={{ marginTop: 16 }}>
        {tab === "salary" && <SalaryTab company={company} user={user} />}
        {tab === "market" && <MarketTab company={company} />}
        {tab === "recommendations" && <RecommendationsTab />}
      </div>
    </Page>
  );
}
