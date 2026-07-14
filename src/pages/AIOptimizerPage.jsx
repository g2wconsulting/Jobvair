import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { EMPTY_USER } from "../constants/appConstants.js";
import { Page, PageHeader, Card, Badge, Button, TextArea, Input, Banner } from "../components/ui/index.js";
import {
  Sparkles, ArrowLeft, Check, X, ArrowUpRight, KeyRound, TrendingUp, Rocket,
  Copy, AlertTriangle, Construction, PenTool,
} from "lucide-react";
import { edgeFetch } from "../lib/edgeFetch.js";

const scoreColorVar = (score) => score >= 80 ? "var(--jv-color-success-600)" : score >= 60 ? "var(--jv-color-warning-600)" : "var(--jv-color-danger-600)";

export default function AIOptimizerPage({ profileForm, profileSkills, profileWork, profileEdu, user, onNav }) {
  const profile = profileForm || EMPTY_USER;
  const skills = profileSkills || [];
  const work = profileWork || [];
  const edu = profileEdu || [];

  const [resumes, setResumes] = useState([]);
  const [resumesLoading, setResumesLoading] = useState(true);
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [selectedResume, setSelectedResume] = useState("");
  const [inputMode, setInputMode] = useState("paste");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [buildingTailored, setBuildingTailored] = useState(false);
  const [buildError, setBuildError] = useState(null);
  const [applyingSummary, setApplyingSummary] = useState(false);
  const [summaryApplied, setSummaryApplied] = useState(false);
  const [applyingBullets, setApplyingBullets] = useState(false);
  const [bulletsApplied, setBulletsApplied] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("resumes").select("id, name, is_primary, template, selected_template_id, contact_fields, updated_at")
      .eq("user_id", user.id).order("updated_at", { ascending: false })
      .then(({ data }) => {
        const rs = data || [];
        setResumes(rs);
        const primary = rs.find(r => r.is_primary) || rs[0];
        if (primary) setSelectedResume(primary.id);
        setResumesLoading(false);
      });
  }, [user?.id]);

  const buildResumeContent = () => {
    const lines = [
      profile.name,
      profile.desiredTitles?.join(", "),
      profile.summary,
      skills.length ? "Skills: " + skills.map(s => `${s.skill_name}${s.years_experience ? ` (${s.years_experience}y)` : ""}${s.proficiency_level ? ` - ${s.proficiency_level}` : ""}`).join(", ") : null,
      ...work.map(w => `${w.job_title || ""} at ${w.company || ""} (${w.start_date || ""}${w.is_current ? " - Present" : w.end_date ? " - " + w.end_date : ""}): ${w.description || ""}`),
      ...edu.map(e => `${e.degree || ""} - ${e.institution || ""}, ${e.graduation_year || ""}`),
    ].filter(Boolean);
    return lines.join("\n");
  };

  const buildRequestBody = () => ({
    user_id: user?.id,
    resume_id: selectedResume,
    resume_content: buildResumeContent(),
    profile: {
      name: profile.name, location: profile.location, summary: profile.summary,
      desiredTitles: profile.desiredTitles, industries: profile.industries,
      availability: profile.availability, employmentStatus: profile.employmentStatus,
      totalYearsExperience: profile.totalYearsExperience, highestEducationLevel: profile.highestEducationLevel,
    },
    skills: skills.map(s => ({ name: s.skill_name, level: s.proficiency_level, years: s.years_experience })),
    job_description: inputMode === "url" ? undefined : (jobDesc.trim() || `Role: ${jobTitle.trim()}`),
    job_url: inputMode === "url" ? jobUrl.trim() : undefined,
    job_title: jobTitle || undefined,
    company: company || undefined,
  });

  const validate = () => {
    const errs = [];
    if (inputMode === "url") {
      if (!jobUrl.trim()) errs.push("Enter a job posting URL before running the analysis.");
    } else {
      if (!jobDesc.trim() && !jobTitle.trim()) errs.push("Paste a job description or enter a job title before running the analysis.");
      if (jobDesc.trim().length > 0 && jobDesc.trim().length < 10) errs.push("Job description is too short — paste the full job posting.");
    }
    if (!selectedResume) errs.push("Please select a resume to analyze.");
    return errs;
  };

  const analyze = async () => {
    const errs = validate();
    if (errs.length > 0) { setValidationErrors(errs); return; }
    setValidationErrors([]); setServerError(null); setLoading(true); setResult(null);
    try {
      const data = await edgeFetch("analyze-resume", buildRequestBody());
      setResult(data);
    } catch (err) {
      setServerError(err.message || "Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResult(null); setServerError(null); setValidationErrors([]); };

  const buildTailoredResume = async () => {
    const base = resumes.find(r => r.id === selectedResume);
    if (!base) { setBuildError("Select a resume first."); return; }
    if (!result) { setBuildError("Run an analysis first."); return; }

    setBuildingTailored(true);
    setBuildError(null);
    try {
      const [{ data: baseSections, error: secErr }, { data: baseJobs, error: jobErr }] = await Promise.all([
        supabase.from("resume_sections").select("*").eq("resume_id", base.id).order("display_order"),
        supabase.from("work_experience_entries").select("*").eq("resume_id", base.id).order("display_order"),
      ]);
      if (secErr) throw secErr;
      if (jobErr) throw jobErr;

      const tailoredName = `${base.name} — Tailored${jobTitle ? ` for ${jobTitle}` : ""}`;

      const { data: newResume, error: resumeError } = await supabase.from("resumes").insert({
        user_id: user.id,
        name: tailoredName,
        template: base.template,
        selected_template_id: base.selected_template_id,
        is_primary: false,
        contact_fields: base.contact_fields || {},
        sections: [],
      }).select().single();
      if (resumeError) throw resumeError;

      const newSections = (baseSections || []).map(s => {
        const isSummary = s.section_type === "summary";
        return {
          resume_id: newResume.id,
          user_id: user.id,
          section_type: s.section_type,
          label: s.label,
          content: (isSummary && result.rewritten_professional_summary) ? { text: result.rewritten_professional_summary } : s.content,
          display_order: s.display_order,
          is_visible: s.is_visible,
          is_required: s.is_required,
          layout_config_json: s.layout_config_json,
        };
      });
      if (newSections.length) {
        const { error } = await supabase.from("resume_sections").insert(newSections);
        if (error) throw error;
      }

      const newJobs = (baseJobs || []).map((j, i) => ({
        user_id: user.id,
        resume_id: newResume.id,
        job_title: j.job_title,
        company: j.company,
        location: j.location,
        start_date: j.start_date,
        end_date: j.end_date,
        is_current: j.is_current,
        description: j.description,
        bullet_points: (i === 0 && result.rewritten_experience_bullets?.length) ? result.rewritten_experience_bullets : j.bullet_points,
        skills_used: j.skills_used,
        achievements: j.achievements,
        display_order: j.display_order,
        is_visible: j.is_visible,
        source: j.source,
      }));
      if (newJobs.length) {
        const { error } = await supabase.from("work_experience_entries").insert(newJobs);
        if (error) throw error;
      }

      if (typeof onNav !== "function") {
        throw new Error("Navigation isn't wired up — the tailored resume was created, but couldn't open the Builder automatically.");
      }
      onNav("builder");
    } catch (err) {
      setBuildError(err.message || "Couldn't create the tailored resume. Please try again.");
    } finally {
      setBuildingTailored(false);
    }
  };

  // ── Apply an individual recommendation directly to the currently selected
  // resume, in place, rather than creating a whole new copy. ──────────────────
  const applySummary = async () => {
    if (!result?.rewritten_professional_summary || !selectedResume) return;
    setApplyingSummary(true);
    setBuildError(null);
    try {
      const { data: existing, error: findErr } = await supabase
        .from("resume_sections").select("id").eq("resume_id", selectedResume).eq("section_type", "summary").maybeSingle();
      if (findErr) throw findErr;

      if (existing) {
        const { error } = await supabase.from("resume_sections")
          .update({ content: { text: result.rewritten_professional_summary }, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("resume_sections").insert({
          resume_id: selectedResume, user_id: user.id, section_type: "summary", label: "Professional Summary",
          content: { text: result.rewritten_professional_summary }, display_order: 1, is_visible: true, is_required: false,
        });
        if (error) throw error;
      }
      setSummaryApplied(true);
    } catch (err) {
      setBuildError(err.message || "Couldn't apply the summary. Please try again.");
    } finally {
      setApplyingSummary(false);
    }
  };

  const applyBullets = async () => {
    if (!result?.rewritten_experience_bullets?.length || !selectedResume) return;
    setApplyingBullets(true);
    setBuildError(null);
    try {
      const { data: jobs, error: findErr } = await supabase
        .from("work_experience_entries").select("id").eq("resume_id", selectedResume).order("display_order").limit(1);
      if (findErr) throw findErr;
      if (!jobs?.length) {
        setBuildError("This resume doesn't have any work experience entries yet to apply bullet points to.");
        return;
      }
      const { error } = await supabase.from("work_experience_entries")
        .update({ bullet_points: result.rewritten_experience_bullets, updated_at: new Date().toISOString() })
        .eq("id", jobs[0].id);
      if (error) throw error;
      setBulletsApplied(true);
    } catch (err) {
      setBuildError(err.message || "Couldn't apply the bullet points. Please try again.");
    } finally {
      setApplyingBullets(false);
    }
  };

  if (loading) {
    return (
      <Page size="wide" className="jobvair-page">
        <PageHeader title="Resume Match" description="Select a resume and a job description to get AI-powered optimization." />
        <Card style={{ textAlign: "center", padding: "60px 24px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <Sparkles size={40} color="var(--jv-color-primary)" style={{ animation: "jv-pulse 1.5s ease-in-out infinite" }} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--jv-color-heading)", marginBottom: 8 }}>Analyzing your resume…</div>
          <div style={{ fontSize: 14, color: "var(--jv-color-muted)", marginBottom: 24, maxWidth: 360, margin: "8px auto 24px" }}>
            Comparing your profile and resume against the job requirements. This usually takes 10–20 seconds.
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
            {["Matching skills", "Identifying gaps", "Rewriting content", "Scoring fit"].map(step => (
              <div key={step} style={{ fontSize: 12, color: "var(--jv-color-muted)", padding: "4px 10px", background: "var(--jv-color-slate-50)", borderRadius: 20, border: "1px solid var(--jv-color-border)" }}>
                {step}
              </div>
            ))}
          </div>
          <style>{"@keyframes jv-pulse { 0%,100%{opacity:0.4;transform:scale(0.95)} 50%{opacity:1;transform:scale(1.1)} }"}</style>
        </Card>
      </Page>
    );
  }

  if (result) {
    const score = result.match_score ?? 0;
    const color = scoreColorVar(score);
    const scoreLabel = score >= 80 ? "Strong match" : score >= 60 ? "Moderate match" : "Stretch role";

    return (
      <Page size="wide" className="jobvair-page">
        <PageHeader
          title="Analysis Results"
          description={<>{jobTitle || "Job"}{company ? ` at ${company}` : ""}{result.is_mock && <span style={{ marginLeft: 8 }}><Badge tone="warning">Demo data — connect API key for real results</Badge></span>}</>}
          actions={
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={reset}>New Analysis</Button>
              {(summaryApplied || bulletsApplied) && (
                <Button variant="secondary" size="sm" icon={PenTool} onClick={() => onNav?.("builder")}>Open in Builder</Button>
              )}
              <Button size="sm" icon={PenTool} disabled={buildingTailored} onClick={buildTailoredResume}>
                {buildingTailored ? "Building…" : "Build Tailored Resume"}
              </Button>
            </div>
          }
        />

        {buildError && (
          <div style={{ marginBottom: 20 }}>
            <Banner tone="danger" icon={AlertTriangle}>{buildError}</Banner>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 20, marginBottom: 20 }}>
          <Card style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "relative", width: 120, height: 120, marginBottom: 10 }}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--jv-color-border)" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="10"
                  strokeDasharray={`${(score / 100) * 314} 314`} strokeLinecap="round"
                  strokeDashoffset="78.5" transform="rotate(-90 60 60)"
                  style={{ transition: "stroke-dasharray 0.8s ease" }} />
              </svg>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{score}</div>
                <div style={{ fontSize: 10, color: "var(--jv-color-muted)" }}>/ 100</div>
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color }}>{scoreLabel}</div>
            <div style={{ fontSize: 11, color: "var(--jv-color-muted)", marginTop: 2 }}>match score</div>
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
              <Card style={{ background: "#dcfce7", border: "1px solid rgba(5,150,105,0.2)", padding: "14px 16px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--jv-color-success-600)", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}><Check size={14} /> Matching Skills</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>{(result.matching_skills || []).map(s => <Badge key={s} tone="success">{s}</Badge>)}</div>
              </Card>
              <Card style={{ background: "#fef2f2", border: "1px solid rgba(220,38,38,0.2)", padding: "14px 16px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--jv-color-danger-600)", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}><X size={14} /> Missing Skills</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>{(result.missing_skills || []).map(s => <Badge key={s} tone="danger">{s}</Badge>)}</div>
              </Card>
              <Card style={{ background: "#eef2ff", border: "1px solid rgba(79,70,229,0.2)", padding: "14px 16px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#4F46E5", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}><ArrowUpRight size={14} /> Transferable</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>{(result.transferable_skills || []).map(s => <Badge key={s} tone="info">{s}</Badge>)}</div>
              </Card>
            </div>
            <Card style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--jv-color-heading)", marginBottom: 6 }}>Job Fit Explanation</div>
              <p style={{ margin: 0, fontSize: 13, color: "var(--jv-color-text)", lineHeight: 1.65 }}>{result.job_fit_explanation}</p>
            </Card>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--jv-color-heading)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><Sparkles size={14} color="var(--jv-color-primary)" /> Rewritten Professional Summary</div>
            <p style={{ margin: "0 0 12px", fontSize: 14, color: "var(--jv-color-text)", lineHeight: 1.7, background: "var(--jv-color-teal-50)", padding: "12px 14px", borderRadius: "var(--jv-radius-sm)" }}>
              {result.rewritten_professional_summary}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <Button size="sm" variant="secondary" icon={Copy} onClick={() => navigator.clipboard?.writeText(result.rewritten_professional_summary)}>Copy</Button>
              <Button size="sm" icon={summaryApplied ? Check : PenTool} disabled={applyingSummary} onClick={applySummary}>
                {applyingSummary ? "Applying…" : summaryApplied ? "Applied ✓" : "Apply to My Resume"}
              </Button>
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--jv-color-heading)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><KeyRound size={14} /> Recommended Resume Keywords</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {(result.recommended_resume_keywords || []).map(k => (
                <span key={k} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: "var(--jv-color-slate-100)", color: "var(--jv-color-heading)", border: "1px solid var(--jv-color-border)", fontWeight: 500 }}>{k}</span>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "var(--jv-color-muted)" }}>Add these naturally to your skills and experience sections.</div>
          </Card>

          <Card>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--jv-color-heading)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><Sparkles size={14} color="var(--jv-color-primary)" /> Rewritten Experience Bullets</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {(result.rewritten_experience_bullets || []).map((b, i) => (
                <div key={i} style={{ fontSize: 13, color: "var(--jv-color-text)", padding: "8px 12px", background: "var(--jv-color-slate-50)", borderRadius: "var(--jv-radius-xs)", borderLeft: "3px solid var(--jv-color-primary)", lineHeight: 1.55 }}>{b}</div>
              ))}
            </div>
            <Button size="sm" icon={bulletsApplied ? Check : PenTool} disabled={applyingBullets} onClick={applyBullets}>
              {applyingBullets ? "Applying…" : bulletsApplied ? "Applied ✓" : "Apply to Most Recent Job"}
            </Button>
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--jv-color-heading)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><TrendingUp size={14} /> Career Recommendations</div>
              {(result.career_recommendations || []).map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--jv-color-text)", marginBottom: 8, lineHeight: 1.5 }}>
                  <span style={{ color: "var(--jv-color-primary)", flexShrink: 0, fontWeight: 700 }}>{i + 1}.</span>{r}
                </div>
              ))}
            </Card>
            <Card style={{ background: "linear-gradient(135deg,var(--jv-color-teal-50),#fff)", border: "1px solid rgba(0,191,165,0.2)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--jv-color-heading)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><Rocket size={14} /> Next Steps</div>
              {(result.next_steps || []).map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--jv-color-text)", marginBottom: 8, lineHeight: 1.5, alignItems: "center" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--jv-color-primary)", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                  {s}
                </div>
              ))}
            </Card>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page size="wide" className="jobvair-page">
      <PageHeader title="Resume Match" description="Select a resume and paste a job description to get AI-powered analysis." />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 20 }}>
        <Card>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "var(--jv-color-heading)" }}>1. Select Resume</h3>
          {resumesLoading ? (
            <div style={{ fontSize: 13, color: "var(--jv-color-muted)" }}>Loading your resumes…</div>
          ) : resumes.length === 0 ? (
            <Banner tone="warning" icon={Construction}>No resumes yet. Build one in the <strong>Resume Builder</strong> first.</Banner>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {resumes.map(r => {
                const isActive = selectedResume === r.id;
                return (
                  <label key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: "var(--jv-radius-sm)", border: `1.5px solid ${isActive ? "var(--jv-color-primary)" : "var(--jv-color-border)"}`, background: isActive ? "var(--jv-color-teal-50)" : "transparent", cursor: "pointer" }}>
                    <input type="radio" name="resume" value={r.id} checked={isActive} onChange={() => setSelectedResume(r.id)} style={{ accentColor: "var(--jv-color-primary)" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--jv-color-heading)" }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: "var(--jv-color-muted)", marginTop: 2 }}>Updated {new Date(r.updated_at).toLocaleDateString()}</div>
                    </div>
                    {r.is_primary && <Badge tone="info">Primary</Badge>}
                  </label>
                );
              })}
            </div>
          )}
          <div style={{ marginTop: 12, fontSize: 12, color: "var(--jv-color-muted)" }}>
            Your profile, skills, work history, and education are included automatically.
          </div>
        </Card>

        <Card>
          <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: "var(--jv-color-heading)" }}>2. Job Information</h3>
          <div style={{ display: "flex", gap: 0, marginBottom: 14, border: "1px solid var(--jv-color-border)", borderRadius: "var(--jv-radius-sm)", overflow: "hidden" }}>
            {[["paste", "Paste JD"], ["manual", "Manual Entry"], ["url", "Job URL"], ["ats", "ATS (soon)"]].map(([id, lbl]) => (
              <button key={id} onClick={() => { if (id !== "ats") setInputMode(id); }} style={{
                flex: 1, padding: "8px 4px", border: "none", fontSize: 12, fontFamily: "inherit",
                background: inputMode === id ? "var(--jv-color-primary)" : "transparent",
                color: inputMode === id ? "#fff" : id === "ats" ? "var(--jv-color-slate-300)" : "var(--jv-color-slate-600)",
                fontWeight: inputMode === id ? 600 : 400,
                cursor: id === "ats" ? "not-allowed" : "pointer",
              }}>{lbl}</button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {inputMode === "paste" && (
              <TextArea label="Paste Job Description" rows={7} value={jobDesc} onChange={e => setJobDesc(e.target.value)}
                placeholder="Paste the full job description here — include responsibilities, requirements, and qualifications…" />
            )}
            {inputMode === "manual" && (<>
              <Input label="Job Title" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Senior Software Engineer" />
              <Input label="Company" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Stripe" />
              <TextArea label="Requirements / Description" rows={5} value={jobDesc} onChange={e => setJobDesc(e.target.value)}
                placeholder="Paste or type the key requirements and responsibilities…" />
            </>)}
            {inputMode === "url" && (<>
              <Input label="Job Posting URL" value={jobUrl} onChange={e => setJobUrl(e.target.value)} placeholder="https://jobs.company.com/..." />
              <Input label="Job Title (optional)" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Senior Software Engineer" />
              <Input label="Company (optional)" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Stripe" />
              <Banner tone="info" icon={Construction}>We'll fetch and read this page automatically. Some sites (ones that require login or heavy JavaScript to load) can't be read this way — if that happens, switch to Paste JD instead.</Banner>
            </>)}
            {inputMode === "ats" && <Banner tone="info" icon={Construction}>ATS integration coming soon.</Banner>}
          </div>
        </Card>
      </div>

      {(jobTitle.startsWith("http") || jobDesc.startsWith("http")) && (
        <div style={{ marginTop: 16 }}>
          <Banner tone="warning" icon={AlertTriangle}>It looks like you pasted a URL. The AI cannot access URLs — please paste the actual job description text from the posting instead.</Banner>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Banner tone="danger" icon={AlertTriangle}>
            {validationErrors.map((e, i) => <div key={i}>{e}</div>)}
          </Banner>
        </div>
      )}

      {serverError && (
        <div style={{ marginTop: 16 }}>
          <Banner tone="danger" title="Analysis failed" icon={AlertTriangle}>
            {serverError}
            <div style={{ fontSize: 12, color: "var(--jv-color-muted)", marginTop: 6 }}>
              If this persists, check that the server function is deployed and the API key is configured.
            </div>
          </Banner>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
        <Button onClick={analyze} disabled={loading} icon={Sparkles}>Run AI Analysis</Button>
      </div>
    </Page>
  );
}
