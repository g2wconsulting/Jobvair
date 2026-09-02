import { useEffect, useState } from "react";
import {
  Briefcase, Users, UserPlus, Eye, CalendarCheck2, Handshake, Trophy, AlertTriangle,
} from "lucide-react";
import { Page, PageHeader, ResponsiveGrid, StatCard, Card, Section, Button, EmptyState } from "../../components/ui/index.js";
import { getDashboardMetrics } from "../lib/employerApi.js";

export default function EmployerDashboardPage({ company, onNav }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company?.id) return;
    getDashboardMetrics(company.id)
      .then(setMetrics)
      .catch(() => setMetrics(null))
      .finally(() => setLoading(false));
  }, [company?.id]);

  const stats = [
    { label: "Active Jobs", value: metrics?.active_jobs, icon: Briefcase, tone: "primary" },
    { label: "Total Applicants", value: metrics?.total_applicants, icon: Users, tone: "info" },
    { label: "New Applicants (7d)", value: metrics?.new_applicants_7d, icon: UserPlus, tone: "success" },
    { label: "Candidates Under Review", value: metrics?.candidates_under_review, icon: Eye, tone: "warning" },
    { label: "Interviews Scheduled", value: metrics?.interviews_scheduled, icon: CalendarCheck2, tone: "info" },
    { label: "Offers Extended", value: metrics?.offers_extended, icon: Handshake, tone: "primary" },
    { label: "Hires", value: metrics?.hires, icon: Trophy, tone: "success" },
    { label: "Jobs Nearing Expiration", value: metrics?.jobs_nearing_expiration, icon: AlertTriangle, tone: "danger" },
  ];

  return (
    <Page size="wide">
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back${company?.name ? `, ${company.name}` : ""}`}
        description="A live snapshot of your hiring activity across Jobvair."
        actions={<Button onClick={() => onNav("jobs")}>Post a Job</Button>}
      />

      <ResponsiveGrid min="220px" gap="16px">
        {stats.map(s => (
          <StatCard key={s.label} label={s.label} value={loading ? "—" : (s.value ?? 0)} icon={s.icon} tone={s.tone} />
        ))}
      </ResponsiveGrid>

      <Card style={{ marginTop: 24 }}>
        <Section title="Candidate Recommendations" description="Jobvair will surface strong-fit candidates here as your job postings and the matching engine come online.">
          <EmptyState
            title="No recommendations yet"
            description="Publish a job to start receiving candidate recommendations from your structured Jobvair candidate pool."
            actionLabel="Go to Jobs"
            onAction={() => onNav("jobs")}
          />
        </Section>
      </Card>
    </Page>
  );
}
