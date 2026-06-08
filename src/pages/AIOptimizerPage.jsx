import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { C, EMPTY_USER } from "../constants/appConstants.js";
import { Badge, Btn, Card, Input, ProgressBar, SectionTitle } from "../components/ui.jsx";
import { edgeFetch } from "../lib/edgeFetch.js";

export default function AIOptimizerPage({ profileForm, profileSkills, profileWork, profileEdu, user }) {
  const profile = profileForm || EMPTY_USER;
  const skills  = profileSkills || [];
  const work    = profileWork   || [];
  const edu     = profileEdu    || [];

  const [resumes,        setResumes]        = useState([]);
  const [resumesLoading, setResumesLoading] = useState(true);
  const [jobTitle,       setJobTitle]       = useState("");
  const [company,        setCompany]        = useState("");
  const [jobDesc,        setJobDesc]        = useState("");
  const [selectedResume, setSelectedResume] = useState("");
  const [inputMode,      setInputMode]      = useState("paste");
  const [loading,        setLoading]        = useState(false);
  const [result,         setResult]         = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [serverError,    setServerError]    = useState(null);

  // Load real resumes from Supabase
  useEffect(() => {
    if (!user?.id) return;
    supabase.from("resumes").select("id, name, is_primary, template, updated_at")
      .eq("user_id", user.id).order("updated_at", { ascending: false })
      .then(({ data }) => {
        const rs = data || [];
        setResumes(rs);
        // Auto-select primary resume
        const primary = rs.find(r => r.is_primary) || rs[0];
        if (primary) setSelectedResume(primary.id);
        setResumesLoading(false);
      });
  }, [user?.id]);

  // Build resume content string from structured profile data
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
    user_id:        user?.id,
    resume_id:      selectedResume,
    resume_content: buildResumeContent(),
    profile: {
      name:             profile.name,
      location:         profile.location,
      summary:          profile.summary,
      desiredTitles:    profile.desiredTitles,
      industries:       profile.industries,
      availability:     profile.availability,
      employmentStatus: profile.employmentStatus,
      totalYearsExperience: profile.totalYearsExperience,
      highestEducationLevel: profile.highestEducationLevel,
    },
    skills:          skills.map(s => ({ name: s.skill_name, level: s.proficiency_level, years: s.years_experience })),
    // Edge Function requires job_description — use jobDesc or fall back to jobTitle
    job_description: jobDesc.trim() || `Role: ${jobTitle.trim()}`,
    job_title:       jobTitle || undefined,
    company:         company  || undefined,
  });

  const validate = () => {
    const errs = [];
    if (!jobDesc.trim() && !jobTitle.trim()) errs.push("Paste a job description or enter a job title before running the analysis.");
    if (jobDesc.trim().length > 0 && jobDesc.trim().length < 10) errs.push("Job description is too short — paste the full job posting.");
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

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <SectionTitle sub="Select a resume and a job description to get AI-powered optimization.">AI Resume Optimizer</SectionTitle>
        <Card style={{ textAlign:"center", padding:"60px 24px" }}>
          <div style={{ fontSize:40, marginBottom:20, animation:"pulse 1.5s ease-in-out infinite" }}>✦</div>
          <div style={{ fontSize:18, fontWeight:700, color:C.navy, marginBottom:8 }}>Analyzing your resume…</div>
          <div style={{ fontSize:14, color:C.textMuted, marginBottom:24, maxWidth:360, margin:"8px auto 24px" }}>
            Comparing your profile and resume against the job requirements. This usually takes 10–20 seconds.
          </div>
          <div style={{ display:"flex", justifyContent:"center", gap:8 }}>
            {["Matching skills","Identifying gaps","Rewriting content","Scoring fit"].map((step, i) => (
              <div key={step} style={{ fontSize:12, color:C.textMuted, padding:"4px 10px", background:C.bg, borderRadius:20, border:`1px solid ${C.border}` }}>
                {step}
              </div>
            ))}
          </div>
          <style>{`@keyframes pulse { 0%,100%{opacity:0.4;transform:scale(0.95)} 50%{opacity:1;transform:scale(1.1)} }`}</style>
        </Card>
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────
  if (result) {
    const score = result.match_score ?? 0;
    const scoreColor = score >= 80 ? C.success : score >= 60 ? C.warning : C.danger;
    const scoreLabel = score >= 80 ? "Strong match" : score >= 60 ? "Moderate match" : "Stretch role";

    return (
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div>
            <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:C.navy }}>Analysis Results</h2>
            <p style={{ margin:"4px 0 0", fontSize:14, color:C.textMuted }}>
              {jobTitle || "Job"}{company ? ` at ${company}` : ""}
              {result.is_mock && <span style={{ marginLeft:8 }}><Badge color="gold" small>Demo data — connect API key for real results</Badge></span>}
            </p>
          </div>
          <Btn variant="secondary" small onClick={reset}>← New Analysis</Btn>
        </div>

        {/* Score + skill grids */}
        <div style={{ display:"grid", gridTemplateColumns:"180px 1fr", gap:20, marginBottom:20 }}>
          <Card style={{ textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <div style={{ position:"relative", width:120, height:120, marginBottom:10 }}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke={C.border} strokeWidth="10"/>
                <circle cx="60" cy="60" r="50" fill="none" stroke={scoreColor} strokeWidth="10"
                  strokeDasharray={`${(score/100)*314} 314`} strokeLinecap="round"
                  strokeDashoffset="78.5" transform="rotate(-90 60 60)"
                  style={{ transition:"stroke-dasharray 0.8s ease" }}/>
              </svg>
              <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", textAlign:"center" }}>
                <div style={{ fontSize:28, fontWeight:800, color:scoreColor, lineHeight:1 }}>{score}</div>
                <div style={{ fontSize:10, color:C.textMuted }}>/ 100</div>
              </div>
            </div>
            <div style={{ fontSize:13, fontWeight:700, color:scoreColor }}>{scoreLabel}</div>
            <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>match score</div>
          </Card>

          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
              <Card style={{ background:C.successBg, border:`1px solid ${C.success}33`, padding:"14px 16px" }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.success, marginBottom:8 }}>✓ Matching Skills</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                  {(result.matching_skills || []).map(s => <Badge key={s} color="success" small>{s}</Badge>)}
                </div>
              </Card>
              <Card style={{ background:C.dangerBg, border:`1px solid ${C.danger}33`, padding:"14px 16px" }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.danger, marginBottom:8 }}>✕ Missing Skills</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                  {(result.missing_skills || []).map(s => <Badge key={s} color="danger" small>{s}</Badge>)}
                </div>
              </Card>
              <Card style={{ background:C.indigoBg, border:`1px solid ${C.indigo}33`, padding:"14px 16px" }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.indigo, marginBottom:8 }}>↗ Transferable</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                  {(result.transferable_skills || []).map(s => <Badge key={s} color="indigo" small>{s}</Badge>)}
                </div>
              </Card>
            </div>
            <Card style={{ padding:"14px 16px" }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.navy, marginBottom:6 }}>Job Fit Explanation</div>
              <p style={{ margin:0, fontSize:13, color:C.slate, lineHeight:1.65 }}>{result.job_fit_explanation}</p>
            </Card>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          {/* Rewritten summary */}
          <Card>
            <div style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:10 }}>✦ Rewritten Professional Summary</div>
            <p style={{ margin:"0 0 12px", fontSize:14, color:C.text, lineHeight:1.7, background:C.tealLight, padding:"12px 14px", borderRadius:8 }}>
              {result.rewritten_professional_summary}
            </p>
            <Btn small variant="secondary" onClick={() => navigator.clipboard?.writeText(result.rewritten_professional_summary)}>Copy</Btn>
          </Card>

          {/* Keywords */}
          <Card>
            <div style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:10 }}>🔑 Recommended Resume Keywords</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
              {(result.recommended_resume_keywords || []).map(k => (
                <span key={k} style={{ fontSize:12, padding:"3px 10px", borderRadius:20, background:C.navyLight+"22", color:C.navy, border:`1px solid ${C.navy}22`, fontWeight:500 }}>{k}</span>
              ))}
            </div>
            <div style={{ fontSize:12, color:C.textMuted }}>Add these naturally to your skills and experience sections.</div>
          </Card>

          {/* Rewritten bullets */}
          <Card>
            <div style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:10 }}>✦ Rewritten Experience Bullets</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {(result.rewritten_experience_bullets || []).map((b, i) => (
                <div key={i} style={{ fontSize:13, color:C.text, padding:"8px 12px", background:C.bg, borderRadius:6, borderLeft:`3px solid ${C.teal}`, lineHeight:1.55 }}>{b}</div>
              ))}
            </div>
          </Card>

          {/* Career recs + next steps */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <Card>
              <div style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:10 }}>Career Recommendations</div>
              {(result.career_recommendations || []).map((r, i) => (
                <div key={i} style={{ display:"flex", gap:8, fontSize:13, color:C.slate, marginBottom:8, lineHeight:1.5 }}>
                  <span style={{ color:C.teal, flexShrink:0, fontWeight:700 }}>{i+1}.</span>{r}
                </div>
              ))}
            </Card>
            <Card style={{ background:`linear-gradient(135deg,${C.tealLight},#fff)`, border:`1px solid ${C.teal}33` }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:10 }}>Next Steps</div>
              {(result.next_steps || []).map((s, i) => (
                <div key={i} style={{ display:"flex", gap:8, fontSize:13, color:C.slate, marginBottom:8, lineHeight:1.5 }}>
                  <div style={{ width:20, height:20, borderRadius:"50%", background:C.teal, color:"#fff", fontSize:11, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{i+1}</div>
                  {s}
                </div>
              ))}
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ── Input form ────────────────────────────────────────────────────────────
  return (
    <div>
      <SectionTitle sub="Select a resume and paste a job description to get AI-powered analysis.">AI Resume Optimizer</SectionTitle>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <Card>
          <h3 style={{ margin:"0 0 16px", fontSize:16, fontWeight:700, color:C.navy }}>1. Select Resume</h3>
          {resumesLoading ? (
            <div style={{ fontSize:13, color:C.textMuted }}>Loading your resumes…</div>
          ) : resumes.length === 0 ? (
            <div style={{ padding:"12px 14px", background:C.warningBg, borderRadius:8, fontSize:13, color:C.warning }}>
              No resumes yet. Build one in the <strong>Resume Builder</strong> first.
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {resumes.map(r => (
                <label key={r.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:8, border:`1.5px solid ${selectedResume===r.id?C.teal:C.border}`, background:selectedResume===r.id?C.tealLight:"transparent", cursor:"pointer" }}>
                  <input type="radio" name="resume" value={r.id} checked={selectedResume===r.id} onChange={()=>setSelectedResume(r.id)} style={{ accentColor:C.teal }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:C.navy }}>{r.name}</div>
                    <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>Updated {new Date(r.updated_at).toLocaleDateString()}</div>
                  </div>
                  {r.is_primary && <Badge color="teal" small>Primary</Badge>}
                </label>
              ))}
            </div>
          )}
          <div style={{ marginTop:12, fontSize:12, color:C.textMuted }}>
            Your profile, skills, work history, and education are included automatically.
          </div>
        </Card>

        <Card>
          <h3 style={{ margin:"0 0 14px", fontSize:16, fontWeight:700, color:C.navy }}>2. Job Information</h3>
          <div style={{ display:"flex", gap:0, marginBottom:14, border:`1px solid ${C.border}`, borderRadius:8, overflow:"hidden" }}>
            {[["paste","Paste JD"],["manual","Manual Entry"],["url","Job URL"],["ats","ATS (soon)"]].map(([id, lbl]) => (
              <button key={id} onClick={() => { if (id !== "ats") setInputMode(id); }} style={{
                flex:1, padding:"8px 4px", border:"none", fontSize:12, fontFamily:"inherit",
                background: inputMode===id ? C.teal : "transparent",
                color: inputMode===id ? "#fff" : id==="ats" ? C.textLight : C.slate,
                fontWeight: inputMode===id ? 600 : 400,
                cursor: id==="ats" ? "not-allowed" : "pointer",
              }}>{lbl}</button>
            ))}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {inputMode === "paste" && (
              <Input label="Paste Job Description" textarea rows={7} value={jobDesc} onChange={setJobDesc}
                placeholder="Paste the full job description here — include responsibilities, requirements, and qualifications…" />
            )}
            {inputMode === "manual" && (<>
              <Input label="Job Title" value={jobTitle} onChange={setJobTitle} placeholder="e.g. Senior Software Engineer" />
              <Input label="Company" value={company} onChange={setCompany} placeholder="e.g. Stripe" />
              <Input label="Requirements / Description" textarea rows={5} value={jobDesc} onChange={setJobDesc}
                placeholder="Paste or type the key requirements and responsibilities…" />
            </>)}
            {inputMode === "url" && (<>
              <Input label="Job Posting URL" value={jobTitle} onChange={setJobTitle} placeholder="https://jobs.company.com/..." />
              <div style={{ padding:"10px 14px", background:C.warningBg, borderRadius:8, fontSize:13, color:C.warning }}>
                🚧 URL scraping coming soon. Use Paste JD for now.
              </div>
            </>)}
            {inputMode === "ats" && (
              <div style={{ padding:"12px 14px", background:C.bg, borderRadius:8, fontSize:13, color:C.textMuted }}>
                ATS integration coming soon.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* URL warning */}
      {(jobTitle.startsWith("http") || jobDesc.startsWith("http")) && (
        <div style={{ marginTop:16, padding:"12px 16px", background:C.warningBg, border:`1px solid ${C.warning}44`, borderRadius:10, fontSize:13, color:C.warning }}>
          ⚠ It looks like you pasted a URL. The AI cannot access URLs — please paste the actual job description text from the posting instead.
        </div>
      )}

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div style={{ marginTop:16, padding:"12px 16px", background:C.dangerBg, border:`1px solid ${C.danger}33`, borderRadius:10 }}>
          {validationErrors.map((e, i) => (
            <div key={i} style={{ fontSize:13, color:C.danger, display:"flex", gap:8 }}>
              <span>⚠</span>{e}
            </div>
          ))}
        </div>
      )}

      {/* Server/network error */}
      {serverError && (
        <div style={{ marginTop:16, padding:"12px 16px", background:C.dangerBg, border:`1px solid ${C.danger}33`, borderRadius:10 }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.danger, marginBottom:4 }}>Analysis failed</div>
          <div style={{ fontSize:13, color:C.danger }}>{serverError}</div>
          <div style={{ fontSize:12, color:C.textMuted, marginTop:6 }}>
            If this persists, check that the server function is deployed and the API key is configured.
          </div>
        </div>
      )}

      <div style={{ display:"flex", justifyContent:"center", marginTop:24 }}>
        <Btn onClick={analyze} disabled={loading} icon="✦">
          Run AI Analysis
        </Btn>
      </div>
    </div>
  );
}


