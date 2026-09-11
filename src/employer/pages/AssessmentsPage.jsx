import { useEffect, useState } from "react";
import { Send, RotateCw, Link2, X, Download, FileSpreadsheet, FileText, Trash2 } from "lucide-react";
import {
  Tabs, Card, Button, Badge, Input, Select, EmptyState, ProgressBar,
} from "../../components/ui/index.js";
import {
  listAssessmentInvitations, createAssessmentInvitations, resendAssessmentInvitation, listJobs,
  getAssessmentLink, getAssessmentResult, listPublishedBundles, getAssessmentLicense, listCompanyAssessmentScores,
  listCompanyCustomAssessments, listApplicantsForCompany, deleteAssessmentInvitation,
} from "../lib/employerApi.js";
import { exportResultsCSV, exportResultsExcel, exportCandidatePdf } from "../lib/assessmentExports.js";
import { ASSESSMENT_STATUS_TONE, ASSESSMENT_STATUS_LABEL } from "../constants.js";

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

const CATEGORY_TONE = { "Core Skills":"info", "Microsoft Office":"success", "Communication":"neutral", "Analytical":"warning", "Professional":"info", "Technology":"neutral", "Specialized":"danger" };

const TABS = [
  { id: "library",    label: "Assessment Library" },
  { id: "sent",       label: "Sent" },
  { id: "comparison", label: "Comparison" },
];

const STATUS_TONE = ASSESSMENT_STATUS_TONE;
const STATUS_LABEL = ASSESSMENT_STATUS_LABEL;

function LibraryTab({ selected, onToggle, onSelectBundle, bundles, library }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const categories = ["all", ...new Set(library.map(a => a.category))];

  const filtered = library.filter(a => {
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

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <Button size="sm" variant="secondary" onClick={() => onSelectBundle(library.map(a => a.id))}>Select All</Button>
        {selected.length > 0 && <Button size="sm" variant="ghost" onClick={() => onSelectBundle([])}>Clear Selection</Button>}
      </div>

      {bundles.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {bundles.map(b => (
            <Button key={b.id} size="sm" variant="secondary" onClick={() => onSelectBundle(b.assessments)}>{b.name}</Button>
          ))}
        </div>
      )}

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
              <div style={{ fontSize: 12, color: "var(--jv-color-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                <span>⏱ {a.minutes} min{a.questions != null ? ` · ${a.questions} ${a.questions === 1 ? "task" : "questions"}` : ""}</span>
                {a.custom && <Badge tone="neutral">Custom</Badge>}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function ApplicantPicker({ company, existingEmails, onAdd, onClose }) {
  const [applicants, setApplicants] = useState(null); // null = loading
  const [checked, setChecked] = useState(new Set());
  const [error, setError] = useState("");

  useEffect(() => {
    listApplicantsForCompany(company.id).then(setApplicants).catch(err => { setError(err.message); setApplicants([]); });
  }, [company.id]);

  const toggle = (applicationId) => setChecked(s => {
    const next = new Set(s);
    if (next.has(applicationId)) next.delete(applicationId); else next.add(applicationId);
    return next;
  });

  const available = (applicants || []).filter(a => !existingEmails.has(a.email.toLowerCase()));

  return (
    <Card style={{ marginBottom: 16, background: "var(--jv-color-surface-muted, #f8fafc)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--jv-color-heading)" }}>Add from applicants</div>
        <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
      </div>
      {error && <div style={{ fontSize: 12.5, color: "var(--jv-color-danger-600)", marginBottom: 8 }}>{error}</div>}
      {applicants === null ? (
        <div style={{ fontSize: 13, color: "var(--jv-color-muted)" }}>Loading applicants…</div>
      ) : available.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--jv-color-muted)" }}>No applicants available to add — they may already be in the list above, or no one has applied to your jobs yet.</div>
      ) : (
        <>
          <div style={{ display: "grid", gap: 6, maxHeight: 260, overflowY: "auto", marginBottom: 12 }}>
            {available.map(a => (
              <label key={a.applicationId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: "#fff", border: "1px solid var(--jv-color-border)", cursor: "pointer" }}>
                <input type="checkbox" checked={checked.has(a.applicationId)} onChange={() => toggle(a.applicationId)} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--jv-color-heading)" }}>{a.first} {a.last}</div>
                  <div style={{ fontSize: 12, color: "var(--jv-color-muted)" }}>{a.email} · applied to {a.jobTitle}</div>
                </div>
                <Badge tone="neutral">{a.stage?.replace("_", " ")}</Badge>
              </label>
            ))}
          </div>
          <Button
            size="sm"
            disabled={checked.size === 0}
            onClick={() => {
              onAdd(available.filter(a => checked.has(a.applicationId)));
              onClose();
            }}
          >
            Add {checked.size || ""} Selected
          </Button>
        </>
      )}
    </Card>
  );
}

function SendForm({ selected, library, company, user, onCancel, onSent, initialCandidate }) {
  const assessments = library.filter(a => selected.includes(a.id));
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState(initialCandidate ? [initialCandidate] : [{ first: "", last: "", email: "", jobId: "" }]);
  const [dueDate, setDueDate] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => { listJobs(company.id).then(setJobs).catch(() => setJobs([])); }, [company.id]);

  const setCandidate = (i, key, val) => setCandidates(c => c.map((row, idx) => idx === i ? { ...row, [key]: val } : row));
  const addCandidate = () => setCandidates(c => [...c, { first: "", last: "", email: "", jobId: "" }]);
  const removeCandidate = (i) => setCandidates(c => c.filter((_, idx) => idx !== i));

  const addFromApplicants = (picked) => {
    setCandidates(c => {
      const isBlankStarter = c.length === 1 && !c[0].first && !c[0].last && !c[0].email;
      const base = isBlankStarter ? [] : c;
      return [...base, ...picked.map(a => ({ first: a.first, last: a.last, email: a.email, jobId: a.jobId || "" }))];
    });
  };

  const submit = async () => {
    const valid = candidates.filter(c => c.email.trim() && c.first.trim());
    if (!valid.length) { setError("Add at least one candidate with a first name and email."); return; }
    setSending(true); setError("");
    try {
      const { emailResults } = await createAssessmentInvitations(company.id, user.id, { assessmentIds: selected, dueDate, candidates: valid });
      const failed = emailResults.filter(r => !r.sent);
      if (failed.length > 0) {
        alert(`Invitations were created, but the email didn't send for: ${failed.map(f => `${f.email} (${f.error})`).join(", ")}. Use "Copy Link" in the Sent tab to share manually.`);
      }
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

      {showPicker && (
        <ApplicantPicker
          company={company}
          existingEmails={new Set(candidates.map(c => c.email.trim().toLowerCase()).filter(Boolean))}
          onAdd={addFromApplicants}
          onClose={() => setShowPicker(false)}
        />
      )}

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
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <Button size="sm" variant="secondary" onClick={addCandidate}>Add Another Candidate</Button>
        {!showPicker && <Button size="sm" variant="secondary" onClick={() => setShowPicker(true)}>Add from Applicants</Button>}
      </div>

      {error && <div style={{ marginBottom: 14, fontSize: 13, color: "var(--jv-color-danger-600)" }}>{error}</div>}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button icon={Send} disabled={sending} onClick={submit}>{sending ? "Sending…" : "Send Invitations"}</Button>
      </div>
    </Card>
  );
}

export function ResultDrawer({ invitation, company, onClose }) {
  const [result, setResult] = useState(undefined); // undefined = loading, null = not started

  useEffect(() => { getAssessmentResult(invitation.id).then(setResult); }, [invitation.id]);

  return (
    <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 520, background: "#fff", boxShadow: "var(--jv-shadow-lg)", padding: 28, overflowY: "auto", zIndex: 100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{invitation.candidate_name}</h2>
          <div style={{ fontSize: 12, color: "var(--jv-color-muted)" }}>{invitation.candidate_email}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {result && (
            <Button variant="secondary" size="sm" icon={Download} onClick={() => exportCandidatePdf({ invitation, company, result })}>Download PDF</Button>
          )}
          <Button variant="ghost" size="sm" icon={X} onClick={onClose}>Close</Button>
        </div>
      </div>

      {result === undefined && <div>Loading results…</div>}
      {result === null && <EmptyState title="Not started yet" description="This candidate hasn't opened the assessment link yet." />}

      {result && result.scores.map(score => {
        const responsesForAssessment = result.responses.filter(r => r.assessment_slug === score.assessment_slug);
        const writtenResponses = responsesForAssessment.filter(r => r.question_type === "long_form_written");
        return (
          <div key={score.id} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <strong style={{ fontSize: 14, textTransform: "capitalize" }}>{score.assessment_slug.replace("-", " ")}</strong>
              <Badge tone={score.passed ? "success" : "danger"}>{Math.round(score.overall_score)}% · {score.passed ? "Pass" : "Below Threshold"}</Badge>
            </div>

            {Object.keys(score.metrics || {}).length > 0 && (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 10, fontSize: 12, color: "var(--jv-color-muted)" }}>
                {Object.entries(score.metrics).map(([k, v]) => <span key={k}>{k.replace(/_/g, " ")}: <strong style={{ color: "var(--jv-color-heading)" }}>{v}</strong></span>)}
              </div>
            )}

            {(score.assessment_section_scores || []).map(s => (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid var(--jv-color-border)" }}>
                <span>{s.section_name}</span>
                <span style={{ color: "var(--jv-color-muted)" }}>{s.points_earned}/{s.points_possible} ({Math.round(s.percentage)}%)</span>
              </div>
            ))}

            {writtenResponses.map(r => (
              <div key={r.id} style={{ marginTop: 12, padding: 12, background: "var(--jv-color-slate-50)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--jv-color-muted)", marginBottom: 6 }}>CANDIDATE RESPONSE</div>
                <div style={{ fontSize: 13, whiteSpace: "pre-wrap", marginBottom: 10 }}>{r.response?.text}</div>
                {r.ai_result && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--jv-color-muted)", marginBottom: 4 }}>AI RUBRIC SCORE</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                      {Object.entries(r.ai_result.criteria || {}).map(([k, v]) => <Badge key={k} tone="neutral">{k}: {v}</Badge>)}
                    </div>
                    <p style={{ fontSize: 12, color: "var(--jv-color-muted)", margin: 0 }}>{r.ai_result.summary}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function SentTab({ company }) {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [viewingId, setViewingId] = useState(null);

  const reload = () => {
    if (!company?.id) return;
    listAssessmentInvitations(company.id).then(setInvitations).finally(() => setLoading(false));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, [company?.id]);

  const copyLink = (inv) => {
    navigator.clipboard.writeText(getAssessmentLink(inv));
    setCopiedId(inv.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const removeInvitation = (inv) => {
    if (!confirm(`Delete the invitation sent to ${inv.candidate_name} (${inv.candidate_email})? This removes their invitation, attempt, and any results — it can't be undone.`)) return;
    deleteAssessmentInvitation(inv.id).then(reload);
  };

  const header = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
      <span style={{ fontSize: 13, color: "var(--jv-color-muted)" }}>
        {invitations.length} assessment{invitations.length !== 1 ? "s" : ""} sent
      </span>
      <Button size="sm" variant="secondary" icon={RotateCw} onClick={reload}>Refresh</Button>
    </div>
  );

  if (loading) return <Card>Loading invitations…</Card>;
  if (invitations.length === 0) {
    return (
      <>
        {header}
        <EmptyState title="No assessments sent yet" description="Select assessments from the library and send them to candidates to see status here." />
      </>
    );
  }

  const viewing = invitations.find(i => i.id === viewingId);
  const completedCount = invitations.filter(i => i.status === "completed").length;

  const exportAll = async (format) => {
    const scores = await listCompanyAssessmentScores(company.id);
    if (format === "csv") exportResultsCSV(scores);
    else await exportResultsExcel(scores);
  };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {header}
      {completedCount > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 4 }}>
          <Button size="sm" variant="secondary" icon={FileText} onClick={() => exportAll("csv")}>Export CSV</Button>
          <Button size="sm" variant="secondary" icon={FileSpreadsheet} onClick={() => exportAll("xlsx")}>Export Excel</Button>
        </div>
      )}
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
            <div style={{ display: "flex", gap: 6 }}>
              {inv.status === "completed" ? (
                <Button size="sm" variant="secondary" onClick={() => setViewingId(inv.id)}>View Results</Button>
              ) : (
                <>
                  <Button size="sm" variant="secondary" icon={Link2} onClick={() => copyLink(inv)}>{copiedId === inv.id ? "Copied!" : "Copy Link"}</Button>
                  <Button size="sm" variant="secondary" icon={RotateCw} onClick={() => resendAssessmentInvitation(inv.id).then(reload)}>Resend</Button>
                </>
              )}
              <Button size="sm" variant="ghost" icon={Trash2} onClick={() => removeInvitation(inv)}>Delete</Button>
            </div>
          </div>
        </Card>
      ))}
      {viewing && <ResultDrawer invitation={viewing} company={company} onClose={() => setViewingId(null)} />}
    </div>
  );
}

// ── Comparison tab ───────────────────────────────────────────────────────────
function ComparisonTab({ company }) {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assessmentFilter, setAssessmentFilter] = useState("all");
  const [sortKey, setSortKey] = useState("overall_score");

  useEffect(() => { listCompanyAssessmentScores(company.id).then(setScores).finally(() => setLoading(false)); }, [company.id]);

  if (loading) return <Card>Loading comparison…</Card>;
  if (scores.length === 0) return <EmptyState title="No completed assessments yet" description="Once candidates complete assessments, compare their results here." />;

  const assessmentSlugs = ["all", ...new Set(scores.map(s => s.assessment_slug))];
  const filtered = assessmentFilter === "all" ? scores : scores.filter(s => s.assessment_slug === assessmentFilter);
  const sorted = [...filtered].sort((a, b) => (b[sortKey] ?? 0) - (a[sortKey] ?? 0));

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <Select value={assessmentFilter} onChange={e => setAssessmentFilter(e.target.value)}
          options={assessmentSlugs.map(s => ({ value: s, label: s === "all" ? "All assessments" : s.replace(/-/g, " ") }))} />
        <Select value={sortKey} onChange={e => setSortKey(e.target.value)}
          options={[{ value: "overall_score", label: "Sort by overall score" }, { value: "points_earned", label: "Sort by points earned" }]} />
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--jv-color-slate-50)" }}>
                {["Candidate", "Assessment", "Score", "Status", "Completed"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, textTransform: "uppercase", color: "var(--jv-color-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(s => (
                <tr key={s.id} style={{ borderTop: "1px solid var(--jv-color-border)" }}>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ fontWeight: 600 }}>{s.candidate_name}</div>
                    <div style={{ fontSize: 11, color: "var(--jv-color-muted)" }}>{s.candidate_email}</div>
                  </td>
                  <td style={{ padding: "10px 14px", textTransform: "capitalize" }}>{s.assessment_slug.replace(/-/g, " ")}</td>
                  <td style={{ padding: "10px 14px", fontWeight: 700 }}>{Math.round(s.overall_score)}%</td>
                  <td style={{ padding: "10px 14px" }}><Badge tone={s.passed ? "success" : "danger"}>{s.passed ? "Pass" : "Below Threshold"}</Badge></td>
                  <td style={{ padding: "10px 14px", color: "var(--jv-color-muted)" }}>{s.scored_at ? new Date(s.scored_at).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── Usage gauge ──────────────────────────────────────────────────────────────
function UsageGauge({ company }) {
  const [license, setLicense] = useState(undefined);
  useEffect(() => { getAssessmentLicense(company.id).then(setLicense); }, [company.id]);

  if (!license) return null; // no assessments sent yet — nothing to show

  return (
    <Card style={{ marginBottom: 20 }}>
      <ProgressBar
        value={license.completed_count}
        max={license.annual_limit}
        tone={license.completed_count / license.annual_limit > 0.9 ? "danger" : "primary"}
        label={`Annual Assessment Usage — ${license.plan_name} plan`}
      />
      <div style={{ fontSize: 12, color: "var(--jv-color-muted)", marginTop: 8 }}>
        {license.completed_count.toLocaleString()} / {license.annual_limit.toLocaleString()} completed assessments used
        {license.renewal_date ? ` · Renews ${new Date(license.renewal_date).toLocaleDateString()}` : ""}
      </div>
    </Card>
  );
}

export default function AssessmentsPage({ company, user, prefillCandidate, onPrefillConsumed }) {
  const [tab, setTab] = useState("library");
  const [selected, setSelected] = useState([]);
  const [sendingOpen, setSendingOpen] = useState(false);
  const [bundles, setBundles] = useState([]);
  const [customAssessments, setCustomAssessments] = useState([]);
  const library = [...ASSESSMENT_LIBRARY, ...customAssessments];
  // Captured once on mount — the parent clears its own copy of this right
  // away, but this component keeps using it until the user actually sends.
  const [pendingCandidate] = useState(prefillCandidate || null);

  useEffect(() => { listPublishedBundles().then(setBundles).catch(() => setBundles([])); }, []);
  useEffect(() => { listCompanyCustomAssessments(company.id).then(setCustomAssessments).catch(() => setCustomAssessments([])); }, [company.id]);
  useEffect(() => {
    if (prefillCandidate) onPrefillConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const selectBundle = (ids) => setSelected(ids);

  const handleSent = () => {
    setSendingOpen(false);
    setSelected([]);
    setTab("sent");
  };

  if (sendingOpen) {
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--jv-color-heading)" }}>Send Assessments</div>
          <div style={{ fontSize: 13, color: "var(--jv-color-muted)" }}>Review the selected assessments and add candidates below.</div>
        </div>
        <SendForm selected={selected} library={library} company={company} user={user} onCancel={() => setSendingOpen(false)} onSent={handleSent} initialCandidate={pendingCandidate} />
      </div>
    );
  }

  return (
    <div>
      <UsageGauge company={company} />
      {pendingCandidate && tab === "library" && (
        <Card style={{ marginBottom: 16, borderColor: "var(--jv-color-primary)" }}>
          <div style={{ fontSize: 13 }}>
            Choose one or more assessments below, then <strong>Send Assessments</strong> to send them to{" "}
            <strong>{pendingCandidate.first} {pendingCandidate.last}</strong> ({pendingCandidate.email}).
          </div>
        </Card>
      )}
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div style={{ marginTop: 16 }}>
        {tab === "library" && <LibraryTab selected={selected} onToggle={toggle} onSelectBundle={selectBundle} bundles={bundles} library={library} />}
        {tab === "sent" && <SentTab company={company} />}
        {tab === "comparison" && <ComparisonTab company={company} />}
      </div>

      {tab === "library" && selected.length > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid var(--jv-color-border)", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "var(--jv-shadow-lg)", zIndex: 50 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--jv-color-heading)" }}>{selected.length} assessment{selected.length !== 1 ? "s" : ""} selected</span>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" onClick={() => setSelected([])}>Clear</Button>
            <Button icon={Send} onClick={() => setSendingOpen(true)}>Send Assessments</Button>
          </div>
        </div>
      )}
    </div>
  );
}
