import { useEffect, useState } from "react";
import { Plus, Sparkles, Copy, Pause, Play, Archive, XCircle, Pencil, Share2 } from "lucide-react";
import {
  Page, PageHeader, Tabs, Card, Button, Badge, Input, Select, TextArea,
  CheckGroup, EmptyState, Toggle,
} from "../../components/ui/index.js";
import {
  listJobs, createJob, updateJob, setJobStatus, duplicateJob, deleteJob,
} from "../lib/employerApi.js";
import { EMPTY_JOB } from "../constants.js";

const TABS = [
  { id: "published", label: "Active Jobs" },
  { id: "draft",      label: "Drafts" },
  { id: "archived",   label: "Archived" },
];

const STATUS_TONE = { draft: "neutral", published: "success", paused: "warning", closed: "danger", archived: "neutral" };

function AiAssistBar({ onGenerate }) {
  const [prompt, setPrompt] = useState("");
  return (
    <div style={{ display: "flex", gap: 8, padding: 12, background: "var(--jv-color-teal-50)", borderRadius: "var(--jv-radius-md)", marginBottom: 16 }}>
      <Sparkles size={18} color="var(--jv-color-primary)" style={{ flexShrink: 0, marginTop: 6 }} />
      <input
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder='Describe the role, e.g. "Senior Accountant, Charlotte NC, 5 years experience"'
        style={{ flex: 1, border: "1px solid var(--jv-color-border)", borderRadius: "var(--jv-radius-sm)", padding: "8px 12px", fontSize: 13, fontFamily: "inherit" }}
      />
      <Button size="sm" onClick={() => onGenerate(prompt)} disabled={!prompt.trim()}>Generate draft</Button>
    </div>
  );
}

function aiDraftFromPrompt(prompt) {
  // Placeholder generator — produces a structured starting draft the employer
  // edits before publishing. Swappable later for a real AI edge function
  // without changing the editor UI or the job schema it writes to.
  const parts = prompt.split(",").map(s => s.trim()).filter(Boolean);
  const title = parts[0] || "New Position";
  const location = parts[1] || "";
  const experienceMatch = prompt.match(/(\d+)\+?\s*years?/i);
  const years = experienceMatch ? experienceMatch[1] : "3";

  return {
    title,
    location,
    experience_requirements: `${years}+ years of relevant experience.`,
    description: `We are looking for a ${title} to join our team${location ? ` in ${location}` : ""}. This is a great opportunity for an experienced professional to make an impact.`,
    responsibilities: "- Own day-to-day execution in this function\n- Collaborate cross-functionally with stakeholders\n- Report on progress and outcomes",
    min_qualifications: `${years}+ years of relevant experience; strong communication and organizational skills.`,
    preferred_qualifications: "Prior experience in a similar industry or company size preferred.",
    required_skills: [],
    preferred_skills: [],
  };
}

function JobEditor({ job, onSave, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY_JOB, ...job });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [skillInput, setSkillInput] = useState("");
  const [prefSkillInput, setPrefSkillInput] = useState("");
  const [saving, setSaving] = useState(false);

  const generate = (prompt) => setForm(f => ({ ...f, ...aiDraftFromPrompt(prompt) }));

  const addSkill = (key, input, setInput) => {
    if (!input.trim()) return;
    set(key, [...(form[key] || []), input.trim()]);
    setInput("");
  };

  const save = async (status) => {
    setSaving(true);
    try {
      await onSave({ ...form, status: status || form.status });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--jv-color-heading)" }}>{job?.id ? "Edit Job" : "New Job"}</h2>
        <Badge tone={STATUS_TONE[form.status]}>{form.status}</Badge>
      </div>

      {!job?.id && <AiAssistBar onGenerate={generate} />}

      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
          <Input label="Job title" value={form.title} onChange={e => set("title", e.target.value)} required />
          <Input label="Department" value={form.department || ""} onChange={e => set("department", e.target.value)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <Input label="Location" value={form.location || ""} onChange={e => set("location", e.target.value)} placeholder="Charlotte, NC" />
          <Select label="Work arrangement" value={form.work_arrangement} onChange={e => set("work_arrangement", e.target.value)}
            options={[{ value: "onsite", label: "Onsite" }, { value: "hybrid", label: "Hybrid" }, { value: "remote", label: "Remote" }]} />
          <Select label="Employment type" value={form.employment_type} onChange={e => set("employment_type", e.target.value)}
            options={["full-time", "part-time", "contract", "temporary", "internship"].map(v => ({ value: v, label: v.replace("-", " ") }))} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Input label="Salary min" type="number" value={form.salary_min || ""} onChange={e => set("salary_min", e.target.value)} />
          <Input label="Salary max" type="number" value={form.salary_max || ""} onChange={e => set("salary_max", e.target.value)} />
        </div>

        <TextArea label="Job description" rows={4} value={form.description || ""} onChange={e => set("description", e.target.value)} />
        <TextArea label="Responsibilities" rows={3} value={form.responsibilities || ""} onChange={e => set("responsibilities", e.target.value)} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <TextArea label="Minimum qualifications" rows={3} value={form.min_qualifications || ""} onChange={e => set("min_qualifications", e.target.value)} />
          <TextArea label="Preferred qualifications" rows={3} value={form.preferred_qualifications || ""} onChange={e => set("preferred_qualifications", e.target.value)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Input label="Experience requirements" value={form.experience_requirements || ""} onChange={e => set("experience_requirements", e.target.value)} />
          <Input label="Education requirements" value={form.education_requirements || ""} onChange={e => set("education_requirements", e.target.value)} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <div className="jv-field__label" style={{ marginBottom: 6 }}>Required skills</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill("required_skills", skillInput, setSkillInput))}
                placeholder="Add a skill and press Enter" className="jv-input" />
              <Button type="button" size="sm" onClick={() => addSkill("required_skills", skillInput, setSkillInput)}>Add</Button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(form.required_skills || []).map((s, i) => (
                <Badge key={`${s}-${i}`} tone="info">{s} <span style={{ cursor: "pointer", marginLeft: 4 }} onClick={() => set("required_skills", form.required_skills.filter((_, idx) => idx !== i))}>×</span></Badge>
              ))}
            </div>
          </div>
          <div>
            <div className="jv-field__label" style={{ marginBottom: 6 }}>Preferred skills</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input value={prefSkillInput} onChange={e => setPrefSkillInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill("preferred_skills", prefSkillInput, setPrefSkillInput))}
                placeholder="Add a skill and press Enter" className="jv-input" />
              <Button type="button" size="sm" onClick={() => addSkill("preferred_skills", prefSkillInput, setPrefSkillInput)}>Add</Button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(form.preferred_skills || []).map((s, i) => (
                <Badge key={`${s}-${i}`} tone="neutral">{s} <span style={{ cursor: "pointer", marginLeft: 4 }} onClick={() => set("preferred_skills", form.preferred_skills.filter((_, idx) => idx !== i))}>×</span></Badge>
              ))}
            </div>
          </div>
        </div>

        <TextArea label="Benefits" rows={2} value={form.benefits || ""} onChange={e => set("benefits", e.target.value)} />
        <CheckGroup
          label="Travel requirements"
          value={form.travel_requirements ? [form.travel_requirements] : []}
          onChange={v => set("travel_requirements", v[v.length - 1] || "")}
          options={[{ value: "none", label: "None" }, { value: "occasional", label: "Occasional" }, { value: "frequent", label: "Frequent" }]}
        />

        <div style={{ padding: 16, background: "var(--jv-color-slate-50)", borderRadius: "var(--jv-radius-md)" }}>
          <div className="jv-field__label" style={{ marginBottom: 10 }}>New applicant notifications</div>
          <Toggle
            checked={form.notify_on_application}
            onChange={v => set("notify_on_application", v)}
            label={form.notify_on_application ? "Email me the moment someone applies to this job" : "Notifications off — applicants only appear in the pipeline"}
          />
          {form.notify_on_application && (
            <div style={{ marginTop: 12 }}>
              <Input
                label="Send to (optional)"
                type="email"
                placeholder="Defaults to your account email"
                value={form.notification_email || ""}
                onChange={e => set("notification_email", e.target.value)}
                hint="Use this to route applicants for this job to a different inbox, e.g. a hiring-team distribution list."
              />
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="secondary" disabled={saving} onClick={() => save("draft")}>{saving ? "Saving…" : "Save as Draft"}</Button>
        <Button disabled={saving || !form.title} onClick={() => save("published")}>{saving ? "Saving…" : "Publish Job"}</Button>
      </div>
    </Card>
  );
}

export default function JobsPage({ company, user }) {
  const [tab, setTab] = useState("published");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | "new" | job
  const [copiedJobId, setCopiedJobId] = useState(null);

  const copyPublicLink = (job) => {
    navigator.clipboard.writeText(`${window.location.origin}/jobs/${job.slug}`);
    setCopiedJobId(job.id);
    setTimeout(() => setCopiedJobId(null), 1500);
  };

  const reload = () => {
    if (!company?.id) return;
    listJobs(company.id).then(setJobs).finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, [company?.id]);

  const filtered = jobs.filter(j => tab === "published" ? ["published", "paused", "closed"].includes(j.status) : j.status === tab);

  const handleSave = async (payload) => {
    if (editing?.id) await updateJob(editing.id, payload);
    else await createJob(company.id, user.id, payload);
    setEditing(null);
    reload();
  };

  if (editing) {
    return (
      <Page size="wide">
        <PageHeader eyebrow="Jobs" title={editing === "new" ? "Create a job" : `Edit: ${editing.title}`} />
        <JobEditor job={editing === "new" ? null : editing} onSave={handleSave} onCancel={() => setEditing(null)} />
      </Page>
    );
  }

  return (
    <Page size="wide">
      <PageHeader
        eyebrow="Jobs"
        title="Job Postings"
        description="Create, publish, and manage every role connected directly to the Jobvair candidate database."
        actions={<Button icon={Plus} onClick={() => setEditing("new")}>New Job</Button>}
      />

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        {loading ? (
          <Card>Loading jobs…</Card>
        ) : filtered.length === 0 ? (
          <EmptyState title="No jobs here yet" description="Create your first job posting to start receiving applicants." actionLabel="New Job" onAction={() => setEditing("new")} />
        ) : filtered.map(job => (
          <Card key={job.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <strong style={{ fontSize: 16, color: "var(--jv-color-heading)" }}>{job.title}</strong>
                  <Badge tone={STATUS_TONE[job.status]}>{job.status}</Badge>
                </div>
                <div style={{ fontSize: 13, color: "var(--jv-color-muted)" }}>
                  {[job.department, job.location, job.work_arrangement, job.employment_type].filter(Boolean).join(" · ") || "No details yet"}
                </div>
                {(job.salary_min || job.salary_max) && (
                  <div style={{ fontSize: 12, color: "var(--jv-color-muted)", marginTop: 2 }}>
                    ${Number(job.salary_min || 0).toLocaleString()} – ${Number(job.salary_max || 0).toLocaleString()}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setEditing(job)}>Edit</Button>
                {job.status === "published" && (
                  <Button size="sm" variant="secondary" icon={Share2} onClick={() => copyPublicLink(job)}>
                    {copiedJobId === job.id ? "Copied!" : "Copy Public Link"}
                  </Button>
                )}
                {job.status === "published" && <Button size="sm" variant="secondary" icon={Pause} onClick={() => setJobStatus(job.id, "paused").then(reload)}>Pause</Button>}
                {job.status === "paused" && <Button size="sm" variant="secondary" icon={Play} onClick={() => setJobStatus(job.id, "published").then(reload)}>Resume</Button>}
                {job.status === "draft" && <Button size="sm" icon={Play} onClick={() => setJobStatus(job.id, "published").then(reload)}>Publish</Button>}
                {["published", "paused"].includes(job.status) && <Button size="sm" variant="secondary" icon={XCircle} onClick={() => setJobStatus(job.id, "closed").then(reload)}>Close</Button>}
                <Button size="sm" variant="secondary" icon={Copy} onClick={() => duplicateJob(job, user.id).then(reload)}>Duplicate</Button>
                {job.status !== "archived" ? (
                  <Button size="sm" variant="ghost" icon={Archive} onClick={() => setJobStatus(job.id, "archived").then(reload)}>Archive</Button>
                ) : (
                  <Button size="sm" variant="danger" onClick={() => { if (confirm("Delete this job permanently?")) deleteJob(job.id).then(reload); }}>Delete</Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Page>
  );
}
