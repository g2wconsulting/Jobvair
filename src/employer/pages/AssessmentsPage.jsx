import { useEffect, useState } from "react";
import { Send, RotateCw } from "lucide-react";
import {
  Page, PageHeader, Tabs, Card, Button, Badge, Input, Select, EmptyState,
} from "../../components/ui/index.js";
import {
  listAssessmentInvitations, createAssessmentInvitations, resendAssessmentInvitation, listJobs,
} from "../lib/employerApi.js";

const ASSESSMENT_LIBRARY = [
  { id:"typing",          name:"Typing",                  icon:"⌨️", category:"Core Skills",      minutes:10, questions:1,  description:"Measures words per minute, accuracy, and consistency." },
  { id:"data-entry",      name:"Data Entry",              icon:"📋", category:"Core Skills",      minutes:15, questions:20, description:"Tests speed and accuracy entering structured records." },
  { id:"excel",           name:"Microsoft Excel",         icon:"📊", category:"Microsoft Office", minutes:25, questions:25, description:"Covers formulas, functions, pivot tables, charts, and data analysis." },
  { id:"word",            name:"Microsoft Word",          icon:"📝", category:"Microsoft Office", minutes:20, questions:20, description:"Tests document formatting, styles, mail merge, and tables." },
  { id:"powerpoint",      name:"Microsoft PowerPoint",    icon:"📑", category:"Microsoft Office", minutes:20, questions:20, description:"Assesses slide design, animation, transitions, and communication." },
  { id:"reading",         name:"Reading Comprehension",   icon:"📖", category:"Communication",    minutes:20, questions:15, description:"Evaluates ability to understand and analyze written content." },
  { id:"grammar",         name:"Grammar and Spelling",    icon:"✍️", category:"Communication",    minutes:15, questions:20, description:"Tests grammar, punctuation, spelling, and sentence structure." },
  { id:"writing",         name:"Written Communication",   icon:"✉️", category:"Communication",    minutes:20, questions:3,  description:"AI-scored workplace writing scenarios." },
  { id:"data-analysis",   name:"Data Analysis",           icon:"📈", category:"Analytical",       minutes:25, questions:20, description:"Tables, charts, and business scenarios requiring interpretation." },
  { id:"admin",           name:"Administrative Skills",   icon:"🗂️", category:"Professional",     minutes:20, questions:20, description:"Covers scheduling, correspondence, and office procedures." },
  { id:"workplace",       name:"Workplace Competencies",  icon:"🤝", category:"Professional",     minutes:20, questions:20, description:"Situational judgment scenarios covering teamwork and conduct." },
  { id:"ai-literacy",     name:"AI Literacy",             icon:"🤖", category:"Technology",       minutes:15, questions:15, description:"Understanding of AI tools, appropriate use, and limitations." },
  { id:"legal-knowledge", name:"Legal / Job Knowledge",   icon:"⚖️", category:"Specialized",      minutes:25, questions:25, description:"Position-specific legal and regulatory knowledge." },
  { id:"it-support",      name:"IT Support Fundamentals", icon:"💻", category:"Technology",       minutes:20, questions:20, description:"Troubleshooting, hardware/software knowledge, and support." },
];

const BUNDLES = [
  { id:"admin-package",   name:"Administrative Skills Package", assessments:["typing","data-entry","word","excel","grammar","writing"] },
  { id:"office-suite",    name:"Microsoft Office Suite",        assessments:["excel","word","powerpoint"] },
  { id:"communication",   name:"Professional Communication",    assessments:["writing","grammar","reading","workplace"] },
  { id:"tech-essentials", name:"Technology Essentials",         assessments:["ai-literacy","it-support","excel"] },
  { id:"full-package",    name:"Full Assessment Package",       assessments:["typing","data-entry","excel","word","grammar","writing","workplace","ai-literacy"] },
];

const CATEGORY_TONE = { "Core Skills":"info", "Microsoft Office":"success", "Communication":"neutral", "Analytical":"warning", "Professional":"info", "Technology":"neutral", "Specialized":"danger" };

const TABS = [
  { id: "library", label: "Assessment Library" },
  { id: "sent",    label: "Sent" },
];

const STATUS_TONE = { sent: "neutral", in_progress: "warning", completed: "success", expired: "danger" };
const STATUS_LABEL = { sent: "Invited", in_progress: "In Progress", completed: "Completed", expired: "Expired" };

function LibraryTab({ selected, onToggle, onSelectBundle }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const categories = ["all", ...new Set(ASSESSMENT_LIBRARY.map(a => a.category))];

  const filtered = ASSESSMENT_LIBRARY.filter(a => {
    const matchCat = category === "all" || a.category === category;
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <Input placeholder="Search assessments…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={category} onChange={e => setCategory(e.target.value)}
          options={categories.map(c => ({ value: c, label: c === "all" ? "All categories" : c }))} />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {BUNDLES.map(b => (
          <Button key={b.id} size="sm" variant="secondary" onClick={() => onSelectBundle(b.assessments)}>{b.name}</Button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, paddingBottom: 70 }}>
        {filtered.map(a => {
          const isSelected = selected.includes(a.id);
          return (
            <Card key={a.id} interactive onClick={() => onToggle(a.id)}
              style={{ border: isSelected ? "2px solid var(--jv-color-primary)" : undefined, background: isSelected ? "var(--jv-color-teal-50)" : undefined }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{a.icon}</span>
                  <strong style={{ fontSize: 14, color: "var(--jv-color-heading)" }}>{a.name}</strong>
                </div>
                <Badge tone={CATEGORY_TONE[a.category] || "neutral"}>{a.category}</Badge>
              </div>
              <p style={{ fontSize: 12, color: "var(--jv-color-muted)", margin: "0 0 8px" }}>{a.description}</p>
              <div style={{ fontSize: 12, color: "var(--jv-color-muted)" }}>⏱ {a.minutes} min · {a.questions} {a.questions === 1 ? "task" : "questions"}</div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function SendForm({ selected, company, user, onCancel, onSent }) {
  const assessments = ASSESSMENT_LIBRARY.filter(a => selected.includes(a.id));
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([{ first: "", last: "", email: "", jobId: "" }]);
  const [dueDate, setDueDate] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { listJobs(company.id).then(setJobs).catch(() => setJobs([])); }, [company.id]);

  const setCandidate = (i, key, val) => setCandidates(c => c.map((row, idx) => idx === i ? { ...row, [key]: val } : row));
  const addCandidate = () => setCandidates(c => [...c, { first: "", last: "", email: "", jobId: "" }]);
  const removeCandidate = (i) => setCandidates(c => c.filter((_, idx) => idx !== i));

  const submit = async () => {
    const valid = candidates.filter(c => c.email.trim() && c.first.trim());
    if (!valid.length) { setError("Add at least one candidate with a first name and email."); return; }
    setSending(true); setError("");
    try {
      await createAssessmentInvitations(company.id, user.id, { assessmentIds: selected, dueDate, candidates: valid });
      onSent();
    } catch (err) {
      setError(err.message || "Failed to send invitations.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--jv-color-heading)", marginBottom: 10 }}>
        Sending {assessments.length} assessment{assessments.length !== 1 ? "s" : ""}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
        {assessments.map(a => <Badge key={a.id} tone="neutral">{a.icon} {a.name}</Badge>)}
      </div>

      <Input label="Due date (optional)" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ maxWidth: 220, marginBottom: 20 }} />

      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--jv-color-heading)", marginBottom: 10 }}>Candidates</div>
      <div style={{ display: "grid", gap: 12, marginBottom: 12 }}>
        {candidates.map((c, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.4fr 1fr auto", gap: 8, alignItems: "start" }}>
            <Input placeholder="First name *" value={c.first} onChange={e => setCandidate(i, "first", e.target.value)} />
            <Input placeholder="Last name" value={c.last} onChange={e => setCandidate(i, "last", e.target.value)} />
            <Input placeholder="Email *" type="email" value={c.email} onChange={e => setCandidate(i, "email", e.target.value)} />
            <Select value={c.jobId} onChange={e => setCandidate(i, "jobId", e.target.value)}
              options={[{ value: "", label: "No job (general)" }, ...jobs.map(j => ({ value: j.id, label: j.title }))]} />
            {candidates.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeCandidate(i)}>✕</Button>}
          </div>
        ))}
      </div>
      <Button size="sm" variant="secondary" onClick={addCandidate} style={{ marginBottom: 20 }}>Add Another Candidate</Button>

      {error && <div style={{ marginBottom: 14, fontSize: 13, color: "var(--jv-color-danger-600)" }}>{error}</div>}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button icon={Send} disabled={sending} onClick={submit}>{sending ? "Sending…" : "Send Invitations"}</Button>
      </div>
    </Card>
  );
}

function SentTab({ company }) {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    if (!company?.id) return;
    listAssessmentInvitations(company.id).then(setInvitations).finally(() => setLoading(false));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, [company?.id]);

  if (loading) return <Card>Loading invitations…</Card>;
  if (invitations.length === 0) {
    return <EmptyState title="No assessments sent yet" description="Select assessments from the library and send them to candidates to see status here." />;
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {invitations.map(inv => (
        <Card key={inv.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <strong style={{ fontSize: 14, color: "var(--jv-color-heading)" }}>{inv.candidate_name}</strong>
                <Badge tone={STATUS_TONE[inv.status] || "neutral"}>{STATUS_LABEL[inv.status] || inv.status}</Badge>
              </div>
              <div style={{ fontSize: 12, color: "var(--jv-color-muted)" }}>{inv.candidate_email}</div>
              <div style={{ fontSize: 12, color: "var(--jv-color-muted)", marginTop: 4 }}>
                {(inv.assessment_ids || []).length} assessment{(inv.assessment_ids || []).length !== 1 ? "s" : ""}
                {inv.jobs?.title ? ` · ${inv.jobs.title}` : ""}
                {inv.due_date ? ` · Due ${new Date(inv.due_date).toLocaleDateString()}` : ""}
              </div>
            </div>
            {inv.status !== "completed" && (
              <Button size="sm" variant="secondary" icon={RotateCw} onClick={() => resendAssessmentInvitation(inv.id).then(reload)}>Resend</Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function AssessmentsPage({ company, user }) {
  const [tab, setTab] = useState("library");
  const [selected, setSelected] = useState([]);
  const [sendingOpen, setSendingOpen] = useState(false);

  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const selectBundle = (ids) => setSelected(ids);

  const handleSent = () => {
    setSendingOpen(false);
    setSelected([]);
    setTab("sent");
  };

  if (sendingOpen) {
    return (
      <Page size="wide">
        <PageHeader eyebrow="Assessments" title="Send Assessment" description="Review the selected assessments and add candidates below." />
        <SendForm selected={selected} company={company} user={user} onCancel={() => setSendingOpen(false)} onSent={handleSent} />
      </Page>
    );
  }

  return (
    <Page size="wide">
      <PageHeader
        eyebrow="Assessments"
        title="Candidate Assessments"
        description="Send skills assessments to candidates and track completion and results."
      />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div style={{ marginTop: 16 }}>
        {tab === "library" && <LibraryTab selected={selected} onToggle={toggle} onSelectBundle={selectBundle} />}
        {tab === "sent" && <SentTab company={company} />}
      </div>

      {tab === "library" && selected.length > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid var(--jv-color-border)", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "var(--jv-shadow-lg)", zIndex: 50 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--jv-color-heading)" }}>{selected.length} assessment{selected.length !== 1 ? "s" : ""} selected</span>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" onClick={() => setSelected([])}>Clear</Button>
            <Button icon={Send} onClick={() => setSendingOpen(true)}>Send to Candidates</Button>
          </div>
        </div>
      )}
    </Page>
  );
}
