import { useEffect, useState } from "react";
import { CalendarPlus, Handshake } from "lucide-react";
import { Page, PageHeader, Tabs, Card, Button, Badge, Select, Input, EmptyState } from "../../components/ui/index.js";
import { ApplicantsBoard } from "./CandidatesPage.jsx";
import {
  listInterviewsForCompany, updateInterview, listApplicationsForCompany,
  createInterview, listOffersForCompany, createOffer, updateOfferStatus,
  markHiredAndCreateHcmTransfer,
} from "../lib/employerApi.js";

const TABS = [
  { id: "pipeline",   label: "Pipeline" },
  { id: "interviews", label: "Interviews" },
  { id: "offers",     label: "Offers" },
];

function InterviewsTab({ company, user }) {
  const [interviews, setInterviews] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [form, setForm] = useState({ application_id: "", scheduled_at: "", location: "" });

  const reload = () => {
    if (!company?.id) return;
    Promise.all([listInterviewsForCompany(company.id), listApplicationsForCompany(company.id)])
      .then(([i, a]) => { setInterviews(i); setApplications(a); })
      .finally(() => setLoading(false));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, [company?.id]);

  const schedule = async () => {
    if (!form.application_id || !form.scheduled_at) return;
    await createInterview(form.application_id, user.id, {
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      location: form.location,
      status: "scheduled",
    });
    setScheduling(false);
    setForm({ application_id: "", scheduled_at: "", location: "" });
    reload();
  };

  if (loading) return <Card>Loading interviews…</Card>;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        {!scheduling ? (
          <Button icon={CalendarPlus} onClick={() => setScheduling(true)}>Request Interview</Button>
        ) : (
          <Card>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
              <Select label="Candidate / application" value={form.application_id} onChange={e => setForm(f => ({ ...f, application_id: e.target.value }))}
                options={[{ value: "", label: "Select…" }, ...applications.map(a => ({ value: a.id, label: `${a.jobs?.title} — ${a.id.slice(0, 8)}` }))]} />
              <Input label="Date & time" type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />
              <Input label="Location / link" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              <Button onClick={schedule}>Schedule</Button>
            </div>
          </Card>
        )}
      </div>

      {interviews.length === 0 ? (
        <EmptyState title="No interviews scheduled" description="Request an interview from a candidate's pipeline card, or use the button above." />
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {interviews.map(iv => (
            <Card key={iv.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{iv.job_applications?.jobs?.title}</strong>
                  <div style={{ fontSize: 12, color: "var(--jv-color-muted)" }}>
                    {iv.scheduled_at ? new Date(iv.scheduled_at).toLocaleString() : "Not yet scheduled"} {iv.location ? `· ${iv.location}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Badge tone={iv.status === "completed" ? "success" : iv.status === "cancelled" ? "danger" : "info"}>{iv.status}</Badge>
                  {iv.status !== "completed" && <Button size="sm" variant="secondary" onClick={() => updateInterview(iv.id, { status: "completed" }).then(reload)}>Mark completed</Button>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function OffersTab({ company, user }) {
  const [offers, setOffers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ application_id: "", salary_offered: "", start_date: "" });

  const reload = () => {
    if (!company?.id) return;
    Promise.all([listOffersForCompany(company.id), listApplicationsForCompany(company.id)])
      .then(([o, a]) => { setOffers(o); setApplications(a.filter(x => ["interview", "final_interview", "offer"].includes(x.current_stage))); })
      .finally(() => setLoading(false));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, [company?.id]);

  const create = async () => {
    if (!form.application_id) return;
    await createOffer(form.application_id, user.id, {
      salary_offered: form.salary_offered ? Number(form.salary_offered) : null,
      start_date: form.start_date || null,
    });
    setCreating(false);
    setForm({ application_id: "", salary_offered: "", start_date: "" });
    reload();
  };

  const markHired = async (offer) => {
    const application = applications.find(a => a.id === offer.application_id) || offer.job_applications;
    await markHiredAndCreateHcmTransfer(application, company.id, offer);
    reload();
  };

  if (loading) return <Card>Loading offers…</Card>;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        {!creating ? (
          <Button icon={Handshake} onClick={() => setCreating(true)}>Create Offer</Button>
        ) : (
          <Card>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
              <Select label="Candidate / application" value={form.application_id} onChange={e => setForm(f => ({ ...f, application_id: e.target.value }))}
                options={[{ value: "", label: "Select…" }, ...applications.map(a => ({ value: a.id, label: `${a.jobs?.title} — ${a.id.slice(0, 8)}` }))]} />
              <Input label="Salary offered" type="number" value={form.salary_offered} onChange={e => setForm(f => ({ ...f, salary_offered: e.target.value }))} />
              <Input label="Start date" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              <Button onClick={create}>Save Offer</Button>
            </div>
          </Card>
        )}
      </div>

      {offers.length === 0 ? (
        <EmptyState title="No offers yet" description="Create an offer once a candidate reaches the interview stage." />
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {offers.map(o => (
            <Card key={o.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <strong>{o.job_applications?.jobs?.title}</strong>
                  <div style={{ fontSize: 12, color: "var(--jv-color-muted)" }}>
                    {o.salary_offered ? `$${Number(o.salary_offered).toLocaleString()}` : "Salary TBD"} {o.start_date ? `· Starts ${o.start_date}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Badge tone={o.status === "accepted" ? "success" : o.status === "declined" || o.status === "rescinded" ? "danger" : "info"}>{o.status}</Badge>
                  {o.status === "draft" && <Button size="sm" variant="secondary" onClick={() => updateOfferStatus(o.id, "sent").then(reload)}>Send</Button>}
                  {o.status === "sent" && <Button size="sm" variant="secondary" onClick={() => updateOfferStatus(o.id, "accepted").then(reload)}>Record acceptance</Button>}
                  {o.status === "accepted" && <Button size="sm" onClick={() => markHired(o)}>Mark hired</Button>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HiringPage({ company, user }) {
  const [tab, setTab] = useState("pipeline");
  return (
    <Page size="wide">
      <PageHeader eyebrow="Hiring" title="Hiring" description="Move candidates through interviews and offers — hires flow straight into your HCM handoff." />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div style={{ marginTop: 16 }}>
        {tab === "pipeline" && <ApplicantsBoard company={company} user={user} />}
        {tab === "interviews" && <InterviewsTab company={company} user={user} />}
        {tab === "offers" && <OffersTab company={company} user={user} />}
      </div>
    </Page>
  );
}
