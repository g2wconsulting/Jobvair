import { useEffect, useState } from "react";
import { ShieldCheck, X, UserSearch, Bookmark } from "lucide-react";
import {
  Page, PageHeader, Tabs, Card, Button, Badge, Select, TextArea, EmptyState, Input,
} from "../../components/ui/index.js";
import {
  listApplicationsForCompany, getApplicationDetail, updateApplicationStage,
  addCandidateNote, listSavedCandidates, unsaveCandidate,
} from "../lib/employerApi.js";
import { PIPELINE_STAGES, PIPELINE_SIDE_STAGES, ALL_STAGES } from "../constants.js";

const TABS = [
  { id: "applicants", label: "Applicants" },
  { id: "search",     label: "Talent Search" },
  { id: "saved",      label: "Saved Candidates" },
];

function CandidateDrawer({ applicationId, onClose, user, onChanged }) {
  const [detail, setDetail] = useState(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => getApplicationDetail(applicationId).then(setDetail);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [applicationId]);

  if (!detail) {
    return (
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 480, background: "#fff", boxShadow: "var(--jv-shadow-lg)", padding: 32, zIndex: 100 }}>
        Loading candidate…
      </div>
    );
  }

  const { application, profile, skills, work, education, certifications, verified, notes, events } = detail;

  const move = async (toStage) => {
    await updateApplicationStage(application.id, toStage, user.id);
    onChanged?.();
    load();
  };

  const saveNote = async () => {
    if (!note.trim()) return;
    setSaving(true);
    try { await addCandidateNote(application.id, user.id, note.trim()); setNote(""); load(); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 480, background: "#fff", boxShadow: "var(--jv-shadow-lg)", padding: 28, overflowY: "auto", zIndex: 100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{profile?.full_name || "Candidate"}</h2>
        <Button variant="ghost" size="sm" icon={X} onClick={onClose}>Close</Button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {verified && <Badge tone="success" icon={ShieldCheck}>Verified</Badge>}
        <Badge tone="info">{application.jobs?.title}</Badge>
        {application.match_score != null && <Badge tone="neutral">{application.match_score}% match</Badge>}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div className="jv-field__label" style={{ marginBottom: 6 }}>Pipeline stage</div>
        <Select value={application.current_stage} onChange={e => move(e.target.value)}
          options={ALL_STAGES.map(s => ({ value: s.id, label: s.label }))} />
      </div>

      {profile?.summary && (
        <div style={{ marginBottom: 16 }}>
          <div className="jv-field__label" style={{ marginBottom: 4 }}>Summary</div>
          <p style={{ fontSize: 13, color: "var(--jv-color-text)", margin: 0 }}>{profile.summary}</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <div><div className="jv-field__label">Location</div><div style={{ fontSize: 13 }}>{profile?.location || "—"}</div></div>
        <div><div className="jv-field__label">Experience</div><div style={{ fontSize: 13 }}>{profile?.total_years_experience ? `${profile.total_years_experience} yrs` : "—"}</div></div>
      </div>

      {skills?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div className="jv-field__label" style={{ marginBottom: 6 }}>Skills</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {skills.map(s => <Badge key={s.id} tone="neutral">{s.skill_name}</Badge>)}
          </div>
        </div>
      )}

      {work?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div className="jv-field__label" style={{ marginBottom: 6 }}>Work experience</div>
          {work.map(w => (
            <div key={w.id} style={{ fontSize: 13, marginBottom: 6 }}>
              <strong>{w.job_title}</strong> — {w.company} <span style={{ color: "var(--jv-color-muted)" }}>({w.start_date || "—"} to {w.is_current ? "present" : w.end_date || "—"})</span>
            </div>
          ))}
        </div>
      )}

      {education?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div className="jv-field__label" style={{ marginBottom: 6 }}>Education</div>
          {education.map(e => <div key={e.id} style={{ fontSize: 13, marginBottom: 4 }}>{e.degree} {e.major ? `in ${e.major}` : ""} — {e.institution}</div>)}
        </div>
      )}

      {certifications?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div className="jv-field__label" style={{ marginBottom: 6 }}>Certifications</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {certifications.map(c => <Badge key={c.id} tone="neutral">{c.name}</Badge>)}
          </div>
        </div>
      )}

      {application.screening_answers && Object.keys(application.screening_answers || {}).length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div className="jv-field__label" style={{ marginBottom: 6 }}>Screening answers</div>
          {Object.entries(application.screening_answers).map(([q, a]) => (
            <div key={q} style={{ fontSize: 13, marginBottom: 6 }}><strong>{q}:</strong> {String(a)}</div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <div className="jv-field__label" style={{ marginBottom: 6 }}>Internal notes</div>
        {notes.map(n => (
          <div key={n.id} style={{ fontSize: 12, padding: "8px 10px", background: "var(--jv-color-slate-50)", borderRadius: "var(--jv-radius-sm)", marginBottom: 6 }}>{n.body}</div>
        ))}
        <TextArea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Add a private note about this candidate…" />
        <Button size="sm" style={{ marginTop: 8 }} disabled={saving || !note.trim()} onClick={saveNote}>Add note</Button>
      </div>

      {events?.length > 0 && (
        <div>
          <div className="jv-field__label" style={{ marginBottom: 6 }}>Pipeline history</div>
          {events.map(ev => (
            <div key={ev.id} style={{ fontSize: 12, color: "var(--jv-color-muted)", marginBottom: 4 }}>
              {ev.from_stage || "—"} → {ev.to_stage} · {new Date(ev.created_at).toLocaleDateString()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ApplicantsBoard({ company, user }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  const reload = () => {
    if (!company?.id) return;
    listApplicationsForCompany(company.id).then(setApplications).finally(() => setLoading(false));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, [company?.id]);

  if (loading) return <Card>Loading applicants…</Card>;
  if (applications.length === 0) return <EmptyState title="No applicants yet" description="Applicants to your published jobs will automatically enter this pipeline." />;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${PIPELINE_STAGES.length}, minmax(200px, 1fr))`, gap: 12, overflowX: "auto" }}>
        {PIPELINE_STAGES.map(stage => {
          const items = applications.filter(a => a.current_stage === stage.id);
          return (
            <div key={stage.id}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--jv-color-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
                {stage.label} <span style={{ opacity: 0.6 }}>({items.length})</span>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {items.map(a => (
                  <Card key={a.id} interactive onClick={() => setOpenId(a.id)} padding="12px">
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--jv-color-heading)" }}>{a.jobs?.title}</div>
                    <div style={{ fontSize: 11, color: "var(--jv-color-muted)", marginTop: 2 }}>Applied {new Date(a.applied_at).toLocaleDateString()}</div>
                    {a.match_score != null && <Badge tone="neutral">{a.match_score}% match</Badge>}
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 20, display: "flex", gap: 16, flexWrap: "wrap" }}>
        {PIPELINE_SIDE_STAGES.map(stage => {
          const items = applications.filter(a => a.current_stage === stage.id);
          if (!items.length) return null;
          return (
            <div key={stage.id} style={{ fontSize: 12, color: "var(--jv-color-muted)" }}>
              {stage.label}: {items.length}
            </div>
          );
        })}
      </div>

      {openId && <CandidateDrawer applicationId={openId} onClose={() => setOpenId(null)} user={user} onChanged={reload} />}
    </>
  );
}

function TalentSearchTab() {
  return (
    <Card>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <Input placeholder="Job title, skill, or keyword…" />
        </div>
        <Select value="" onChange={() => {}} options={[{ value: "", label: "Any experience" }]} />
        <Select value="" onChange={() => {}} options={[{ value: "", label: "Any location" }]} />
        <Button icon={UserSearch}>Search</Button>
      </div>
      <EmptyState
        icon={UserSearch}
        title="Proactive candidate search is coming online"
        description="The database and privacy controls for talent search are already in place (candidates control whether they're searchable). Full search across the Jobvair candidate pool activates in Phase 2."
      />
    </Card>
  );
}

function SavedCandidatesTab({ company }) {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const reload = () => {
    if (!company?.id) return;
    listSavedCandidates(company.id).then(setSaved).finally(() => setLoading(false));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, [company?.id]);

  if (loading) return <Card>Loading…</Card>;
  if (saved.length === 0) return <EmptyState icon={Bookmark} title="No saved candidates yet" description="Bookmark candidates from Talent Search to keep them here for later outreach." />;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {saved.map(s => (
        <Card key={s.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong>{s.profiles?.full_name || "Candidate"}</strong>
              <div style={{ fontSize: 12, color: "var(--jv-color-muted)" }}>{s.profiles?.location}</div>
              {s.note && <div style={{ fontSize: 12, marginTop: 4 }}>{s.note}</div>}
            </div>
            <Button size="sm" variant="ghost" onClick={() => unsaveCandidate(s.id).then(reload)}>Remove</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function CandidatesPage({ company, user }) {
  const [tab, setTab] = useState("applicants");
  return (
    <Page size="wide">
      <PageHeader eyebrow="Candidates" title="Candidates" description="Every applicant automatically enters your pipeline, built directly on the candidate's structured Jobvair profile." />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div style={{ marginTop: 16 }}>
        {tab === "applicants" && <ApplicantsBoard company={company} user={user} />}
        {tab === "search" && <TalentSearchTab />}
        {tab === "saved" && <SavedCandidatesTab company={company} />}
      </div>
    </Page>
  );
}
