import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Page, PageHeader, Tabs, Card, Button, Badge, ResponsiveGrid, StatCard } from "../../components/ui/index.js";
import { listSubscriptionPlans, getCompanySubscription, listJobs } from "../lib/employerApi.js";

const TABS = [
  { id: "subscription", label: "Subscription" },
  { id: "usage",         label: "Usage" },
];

function SubscriptionTab({ company }) {
  const [plans, setPlans] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company?.id) return;
    Promise.all([listSubscriptionPlans(), getCompanySubscription(company.id)])
      .then(([p, c]) => { setPlans(p); setCurrent(c); })
      .finally(() => setLoading(false));
  }, [company?.id]);

  if (loading) return <Card>Loading plans…</Card>;

  return (
    <div>
      {current && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--jv-color-muted)", textTransform: "uppercase", fontWeight: 700 }}>Current plan</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{current.subscription_plans?.name || "—"}</div>
            </div>
            <Badge tone={current.status === "active" ? "success" : "warning"}>{current.status}</Badge>
          </div>
        </Card>
      )}

      <ResponsiveGrid min="260px" gap="16px">
        {plans.map(p => {
          const isCurrent = current?.plan_id === p.id;
          return (
            <Card key={p.id} style={isCurrent ? { border: "2px solid var(--jv-color-primary)" } : undefined}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h3 style={{ margin: 0 }}>{p.name}</h3>
                {isCurrent && <Badge tone="success">Current</Badge>}
              </div>
              <p style={{ fontSize: 13, color: "var(--jv-color-muted)", minHeight: 36 }}>{p.description}</p>
              <div style={{ fontSize: 28, fontWeight: 800, margin: "8px 0" }}>${p.price_monthly}<span style={{ fontSize: 13, fontWeight: 400, color: "var(--jv-color-muted)" }}>/mo</span></div>
              <div style={{ fontSize: 13, color: "var(--jv-color-text)", marginBottom: 12 }}>
                {p.max_active_jobs == null ? "Unlimited active jobs" : `${p.max_active_jobs} active jobs`} · {p.max_hiring_team_users == null ? "Unlimited team seats" : `${p.max_hiring_team_users} team seats`}
              </div>
              <div style={{ display: "grid", gap: 6, marginBottom: 16 }}>
                {(p.features || []).map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
                    <Check size={13} color="var(--jv-color-primary)" /> {f.replace(/_/g, " ")}
                  </div>
                ))}
              </div>
              <Button full variant={isCurrent ? "secondary" : "primary"} disabled={isCurrent}>{isCurrent ? "Current plan" : "Select plan"}</Button>
            </Card>
          );
        })}
      </ResponsiveGrid>
    </div>
  );
}

function UsageTab({ company }) {
  const [jobs, setJobs] = useState([]);
  useEffect(() => { if (company?.id) listJobs(company.id).then(setJobs); }, [company?.id]);
  const activeJobs = jobs.filter(j => j.status === "published").length;

  return (
    <ResponsiveGrid min="200px" gap="16px">
      <StatCard label="Active Jobs" value={activeJobs} tone="primary" />
      <StatCard label="Total Jobs Ever Posted" value={jobs.length} tone="info" />
    </ResponsiveGrid>
  );
}

export default function BillingPage({ company }) {
  const [tab, setTab] = useState("subscription");
  return (
    <Page size="wide">
      <PageHeader eyebrow="Billing" title="Billing" description="Manage your Jobvair employer subscription and usage." />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div style={{ marginTop: 16 }}>
        {tab === "subscription" && <SubscriptionTab company={company} />}
        {tab === "usage" && <UsageTab company={company} />}
      </div>
    </Page>
  );
}
