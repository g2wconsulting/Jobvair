// Single "Assessments" hub — everything assessment-related (overview stats,
// sending/tracking invitations, comparison, and the question/assessment
// builder) lives under one nav item and switches via tabs here, rather than
// being scattered across separate top-level pages.

import { useEffect, useState } from "react";
import { Users, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { Page, PageHeader, Tabs, Card, Badge, Button, Select, Input, StatCard, ResponsiveGrid, EmptyState } from "../../components/ui/index.js";
import { listAssessmentInvitations, listCompanyAssessmentScores } from "../lib/employerApi.js";
import { ASSESSMENT_STATUS_TONE, ASSESSMENT_STATUS_LABEL } from "../constants.js";
import { hasFeature } from "../featureFlags.js";
import AssessmentsPage, { ResultDrawer } from "./AssessmentsPage.jsx";
import AssessmentBuilderPage from "./AssessmentBuilderPage.jsx";

const HUB_TABS = [
  { id: "overview",  label: "Overview" },
  { id: "manage",    label: "Send & Track" },
  { id: "builder",   label: "Builder" },
];

function OverviewTab({ company }) {
  const [invitations, setInvitations] = useState(null);
  const [scoresByInvitation, setScoresByInvitation] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewingId, setViewingId] = useState(null);

  useEffect(() => {
    if (!company?.id) return;
    Promise.all([listAssessmentInvitations(company.id), listCompanyAssessmentScores(company.id)]).then(([invs, scores]) => {
      setInvitations(invs);
      const byInvitation = {};
      for (const s of scores) {
        const key = s.assessment_attempts?.invitation_id;
        if (!key) continue;
        (byInvitation[key] = byInvitation[key] || []).push(s);
      }
      setScoresByInvitation(byInvitation);
    });
  }, [company?.id]);

  if (invitations === null) return <Card>Loading assessment dashboard…</Card>;

  const total = invitations.length;
  const completed = invitations.filter(i => i.status === "completed").length;
  const inProgress = invitations.filter(i => i.status === "in_progress").length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const allScores = Object.values(scoresByInvitation).flat();
  const avgScore = allScores.length > 0 ? Math.round(allScores.reduce((s, r) => s + (r.overall_score || 0), 0) / allScores.length) : null;

  const filtered = invitations.filter(inv => {
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    const matchSearch = !search
      || inv.candidate_name?.toLowerCase().includes(search.toLowerCase())
      || inv.candidate_email?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const viewing = invitations.find(i => i.id === viewingId);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <ResponsiveGrid min="180px" gap="16px">
          <StatCard label="Total Sent" value={total} tone="navy" icon={Users} />
          <StatCard label="Completed" value={completed} tone="success" icon={CheckCircle2} />
          <StatCard label="In Progress" value={inProgress} tone="warning" icon={Clock} />
          <StatCard label="Completion Rate" value={`${completionRate}%`} tone="navy" icon={TrendingUp} />
          {avgScore != null && <StatCard label="Average Score" value={`${avgScore}%`} tone="navy" />}
        </ResponsiveGrid>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <Input placeholder="Search by candidate name or email…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          options={[
            { value: "all", label: "All statuses" },
            { value: "sent", label: "Invited" },
            { value: "in_progress", label: "In Progress" },
            { value: "completed", label: "Completed" },
            { value: "expired", label: "Expired" },
          ]} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No candidates match" description="Try a different search or status filter, or send your first assessment from the Send & Track tab." />
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--jv-color-slate-50)" }}>
                  {["Candidate", "Job", "Assessments", "Status", "Score", "Sent", "Due"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, textTransform: "uppercase", color: "var(--jv-color-muted)" }}>{h}</th>
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => {
                  const scores = scoresByInvitation[inv.id] || [];
                  const avg = scores.length > 0 ? Math.round(scores.reduce((s, r) => s + (r.overall_score || 0), 0) / scores.length) : null;
                  return (
                    <tr key={inv.id} style={{ borderTop: "1px solid var(--jv-color-border)" }}>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ fontWeight: 600 }}>{inv.candidate_name}</div>
                        <div style={{ fontSize: 11, color: "var(--jv-color-muted)" }}>{inv.candidate_email}</div>
                      </td>
                      <td style={{ padding: "10px 14px" }}>{inv.jobs?.title || "—"}</td>
                      <td style={{ padding: "10px 14px" }}>{(inv.assessment_ids || []).length}</td>
                      <td style={{ padding: "10px 14px" }}><Badge tone={ASSESSMENT_STATUS_TONE[inv.status] || "neutral"}>{ASSESSMENT_STATUS_LABEL[inv.status] || inv.status}</Badge></td>
                      <td style={{ padding: "10px 14px", fontWeight: avg != null ? 700 : 400, color: avg != null ? "var(--jv-color-heading)" : "var(--jv-color-muted)" }}>
                        {avg != null ? `${avg}%` : "—"}
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--jv-color-muted)" }}>{inv.created_at ? new Date(inv.created_at).toLocaleDateString() : "—"}</td>
                      <td style={{ padding: "10px 14px", color: "var(--jv-color-muted)" }}>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "—"}</td>
                      <td style={{ padding: "10px 14px" }}>
                        {inv.status === "completed" && <Button size="sm" variant="secondary" onClick={() => setViewingId(inv.id)}>View</Button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {viewing && <ResultDrawer invitation={viewing} company={company} onClose={() => setViewingId(null)} />}
    </div>
  );
}

export default function AssessmentDashboardPage({ company, user, features, prefillCandidate, onPrefillConsumed }) {
  const [tab, setTab] = useState(prefillCandidate ? "manage" : "overview");
  const canBuild = hasFeature(features, "assessment_builder");
  const tabs = canBuild ? HUB_TABS : HUB_TABS.filter(t => t.id !== "builder");

  return (
    <Page size="wide">
      <PageHeader
        eyebrow="Assessments"
        title="Assessments"
        description="Everything assessment-related — send invitations, track candidates, compare results, and author custom questions."
      />
      <Tabs tabs={tabs} active={tab} onChange={setTab} />
      <div style={{ marginTop: 16 }}>
        {tab === "overview" && <OverviewTab company={company} />}
        {tab === "manage" && (
          <AssessmentsPage company={company} user={user} prefillCandidate={prefillCandidate} onPrefillConsumed={onPrefillConsumed} />
        )}
        {tab === "builder" && canBuild && <AssessmentBuilderPage company={company} user={user} />}
      </div>
    </Page>
  );
}
