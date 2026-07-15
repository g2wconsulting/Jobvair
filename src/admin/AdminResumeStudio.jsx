import { useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import { edgeFetch } from "../lib/edgeFetch.js";
import { DEFAULT_SECTIONS } from "../constants/appConstants.js";
import { LOCAL_RESUME_TEMPLATES } from "../resume-templates/templateRegistry.js";
import BuilderPage from "../pages/BuilderPage.jsx";

const ACCEPTED_TYPES = ".pdf,.doc,.docx,.txt";
const MAX_FILE_MB = 10;

function buildResumeContentFromParsed(parsed) {
  const lines = [
    parsed.full_name,
    (parsed.desired_titles || []).join(", "),
    parsed.summary,
    parsed.skills?.length ? "Skills: " + parsed.skills.map(s => s.skill_name).filter(Boolean).join(", ") : null,
    ...(parsed.work_experience || []).map(w => `${w.job_title || ""} at ${w.company || ""} (${w.start_date || ""}${w.is_current ? " - Present" : w.end_date ? " - " + w.end_date : ""}): ${w.description || ""}`),
    ...(parsed.education || []).map(e => `${e.degree || ""} - ${e.institution || ""}, ${e.graduation_year || ""}`),
  ].filter(Boolean);
  return lines.join("\n");
}

function skillsToText(skills) {
  return (skills || []).map(s => s.skill_name).filter(Boolean).join(", ");
}

function educationToText(education) {
  return (education || []).map(e => {
    const parts = [e.degree, e.major ? `in ${e.major}` : null].filter(Boolean).join(" ");
    return [parts, e.institution, e.graduation_year].filter(Boolean).join(" — ");
  }).join("\n");
}

function certificationsToText(certs) {
  return (certs || []).map(c => [c.name, c.issuing_org].filter(Boolean).join(" — ")).join("\n");
}

/**
 * Admin-only Resume Builder entry point.
 *
 * Always starts blank (no auto-loading a previous resume) since the admin
 * account is used to build resumes for different people back-to-back.
 * Upload a resume + a job description (pasted text or a URL) together, pick
 * a template, and it generates a brand new, tailored resume in one step,
 * then hands off to the normal Builder for further editing.
 */
export default function AdminResumeStudio({ user }) {
  const [resumeId, setResumeId] = useState(null);
  const [file, setFile] = useState(null);
  const [jobInputMode, setJobInputMode] = useState("paste"); // paste | url
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [templateSlug, setTemplateSlug] = useState(LOCAL_RESUME_TEMPLATES[0]?.slug || "modern");
  const [status, setStatus] = useState("idle"); // idle | uploading | parsing | tailoring | building | error
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const busy = status !== "idle" && status !== "error";

  const statusLabel = {
    uploading: "Uploading resume…",
    parsing: "Reading resume with AI…",
    tailoring: "Tailoring to the job…",
    building: "Building the resume…",
  }[status];

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`File is too large — please keep it under ${MAX_FILE_MB} MB.`);
      return;
    }
    setError(null);
    setFile(f);
  };

  const generate = async () => {
    if (!file) { setError("Upload a resume file first."); return; }
    if (!user?.id) { setError("Not signed in."); return; }

    setError(null);
    try {
      // ── 1. Upload the file ────────────────────────────────────────────
      setStatus("uploading");
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const uploadName = `${user.id}/${Date.now()}_${safeName}`;
      const { error: uploadError } = await supabase.storage.from("resumes").upload(uploadName, file, { upsert: false });
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
      const storagePath = `resumes/${uploadName}`;

      const { data: parsedRow, error: parsedRowError } = await supabase
        .from("parsed_resumes")
        .insert({ user_id: user.id, storage_path: storagePath, original_filename: file.name, parse_status: "processing" })
        .select().single();
      if (parsedRowError) throw new Error(`Couldn't start parsing: ${parsedRowError.message}`);

      // ── 2. Parse the resume ───────────────────────────────────────────
      setStatus("parsing");
      const parsed = await edgeFetch("parse-resume", {
        user_id: user.id,
        storage_path: storagePath,
        original_filename: file.name,
        parsed_resume_id: parsedRow.id,
      });

      // ── 3. Tailor to the job, if one was provided ─────────────────────
      let tailored = null;
      const hasJobInput = jobInputMode === "url" ? jobUrl.trim() : jobDescription.trim();
      if (hasJobInput) {
        setStatus("tailoring");
        try {
          tailored = await edgeFetch("analyze-resume", {
            user_id: user.id,
            resume_content: buildResumeContentFromParsed(parsed),
            profile: {
              name: parsed.full_name, location: parsed.location, summary: parsed.summary,
              desiredTitles: parsed.desired_titles, industries: parsed.industries,
              totalYearsExperience: parsed.profile_update?.total_years_experience,
            },
            skills: (parsed.skills || []).map(s => ({ name: s.skill_name, level: s.proficiency_level, years: s.years_experience })),
            job_description: jobInputMode === "paste" ? jobDescription.trim() : undefined,
            job_url: jobInputMode === "url" ? jobUrl.trim() : undefined,
            job_title: jobTitle || undefined,
            company: company || undefined,
          });
        } catch (err) {
          // Tailoring is a bonus, not a hard requirement — if it fails, still
          // build the resume from the parsed content alone rather than
          // blocking the whole flow.
          console.warn("[AdminResumeStudio] tailoring failed, continuing without it:", err.message);
        }
      }

      // ── 4. Build the new resume ────────────────────────────────────────
      setStatus("building");
      const template = LOCAL_RESUME_TEMPLATES.find(t => t.slug === templateSlug) || LOCAL_RESUME_TEMPLATES[0];
      const resumeName = [parsed.full_name, jobTitle].filter(Boolean).join(" — ") || file.name.replace(/\.[^.]+$/, "");

      const contactFields = {
        name: parsed.full_name || "", headline: "", email: parsed.email || "", phone: parsed.phone || "",
        location: parsed.location || "", linkedin: "", website: "", github: "", custom_contact_line: "",
        show_headline: false, show_email: true, show_phone: true, show_location: true,
        show_linkedin: false, show_website: false, show_github: false, show_custom: false, layout: "left",
      };

      const { data: newResume, error: resumeError } = await supabase.from("resumes").insert({
        user_id: user.id, name: resumeName, template: template?.slug || "modern",
        selected_template_id: template?.id?.startsWith?.("local-") ? null : template?.id,
        is_primary: false, contact_fields: contactFields, sections: [], parsed_resume_id: parsedRow.id,
      }).select().single();
      if (resumeError) throw new Error(`Couldn't create the resume: ${resumeError.message}`);

      // BuilderPage reads header/contact info from the "name" section's own
      // content field, not from resumes.contact_fields (that column is only
      // a legacy mirror) — so the actual header data has to live here, or
      // the name/email/phone/location won't show up when the Builder loads.
      const sectionTextByType = {
        summary: tailored?.rewritten_professional_summary || parsed.summary || "",
        skills: skillsToText(parsed.skills),
        experience: "",
        education: educationToText(parsed.education),
        certifications: certificationsToText(parsed.certifications),
      };
      const sections = DEFAULT_SECTIONS.map(s => ({
        resume_id: newResume.id,
        user_id: user.id,
        section_type: s.section_type,
        label: s.label,
        content: s.section_type === "name" ? contactFields : { text: sectionTextByType[s.section_type] ?? "" },
        display_order: s.display_order,
        is_visible: s.section_type === "certifications" ? (parsed.certifications || []).length > 0 : s.is_visible,
        is_required: s.is_required,
      }));
      const { error: sectionsError } = await supabase.from("resume_sections").insert(sections);
      if (sectionsError) throw new Error(`Couldn't save resume sections: ${sectionsError.message}`);

      const jobs = (parsed.work_experience || []).map((w, i) => ({
        user_id: user.id, resume_id: newResume.id,
        job_title: w.job_title || "", company: w.company || "", location: w.location || "",
        start_date: w.start_date || null, end_date: w.is_current ? null : (w.end_date || null),
        is_current: !!w.is_current, description: w.description || "",
        bullet_points: (i === 0 && tailored?.rewritten_experience_bullets?.length) ? tailored.rewritten_experience_bullets : [],
        skills_used: [], achievements: [], display_order: i, is_visible: true, source: "parsed",
      }));
      if (jobs.length) {
        const { error: jobsError } = await supabase.from("work_experience_entries").insert(jobs);
        if (jobsError) throw new Error(`Couldn't save work experience: ${jobsError.message}`);
      }

      setResumeId(newResume.id);
    } catch (err) {
      setError(err.message || "Something went wrong generating this resume. Please try again.");
      setStatus("error");
    }
  };

  // Once generated, hand off to the normal Builder. It loads the most
  // recently updated resume for this account by default, which is exactly
  // the one just created here.
  if (resumeId) {
    return (
      <BuilderPage
        user={user}
        profileForm={{ name: "", email: "", phone: "", location: "", summary: "", desiredTitles: [], industries: [] }}
        profileSkills={[]}
        profileWork={[]}
        profileEdu={[]}
      />
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "#0F172A" }}>New Resume</h2>
      <p style={{ margin: "0 0 24px", fontSize: 14, color: "#64748B" }}>
        Upload a resume and a job description together — this builds a tailored resume from scratch in your chosen template.
        Starts blank every time, so nothing carries over between people.
      </p>

      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>1. Resume</div>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{ border: `2px dashed ${file ? "#00BFA5" : "#CBD5E1"}`, borderRadius: 10, padding: "20px 16px", textAlign: "center", cursor: busy ? "not-allowed" : "pointer", background: file ? "#E6FFFB" : "#F8FAFC" }}
          >
            <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES} onChange={handleFileChange} disabled={busy} style={{ display: "none" }} />
            {file ? (
              <div style={{ fontSize: 14, fontWeight: 650, color: "#009688" }}>{file.name}</div>
            ) : (
              <div style={{ fontSize: 14, color: "#64748B" }}>Click to upload a resume (PDF, DOCX, or TXT)</div>
            )}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>2. Job Description</div>
          <div style={{ display: "flex", gap: 0, marginBottom: 10, border: "1px solid #E2E8F0", borderRadius: 8, overflow: "hidden", width: "fit-content" }}>
            {[["paste", "Paste Text"], ["url", "Job URL"]].map(([id, lbl]) => (
              <button key={id} onClick={() => setJobInputMode(id)} disabled={busy} style={{
                padding: "7px 16px", border: "none", fontSize: 12.5, fontFamily: "inherit",
                background: jobInputMode === id ? "#00BFA5" : "transparent",
                color: jobInputMode === id ? "#fff" : "#64748B", fontWeight: jobInputMode === id ? 650 : 400, cursor: "pointer",
              }}>{lbl}</button>
            ))}
          </div>
          {jobInputMode === "paste" ? (
            <textarea
              value={jobDescription} onChange={e => setJobDescription(e.target.value)} disabled={busy}
              rows={6} placeholder="Paste the job description here…"
              style={{ width: "100%", boxSizing: "border-box", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 12px", fontSize: 13, fontFamily: "inherit", resize: "vertical" }}
            />
          ) : (
            <input
              value={jobUrl} onChange={e => setJobUrl(e.target.value)} disabled={busy}
              placeholder="https://jobs.company.com/..."
              style={{ width: "100%", boxSizing: "border-box", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 12px", fontSize: 13, fontFamily: "inherit" }}
            />
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
            <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} disabled={busy} placeholder="Job title (optional)"
              style={{ boxSizing: "border-box", border: "1px solid #E2E8F0", borderRadius: 8, padding: "9px 12px", fontSize: 13, fontFamily: "inherit" }} />
            <input value={company} onChange={e => setCompany(e.target.value)} disabled={busy} placeholder="Company (optional)"
              style={{ boxSizing: "border-box", border: "1px solid #E2E8F0", borderRadius: 8, padding: "9px 12px", fontSize: 13, fontFamily: "inherit" }} />
          </div>
          <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 6 }}>Optional — leave blank to just build the resume from the upload without tailoring it to a specific job.</div>
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>3. Template</div>
          <select value={templateSlug} onChange={e => setTemplateSlug(e.target.value)} disabled={busy}
            style={{ width: "100%", boxSizing: "border-box", border: "1px solid #E2E8F0", borderRadius: 8, padding: "9px 12px", fontSize: 13, fontFamily: "inherit", background: "#fff" }}>
            {LOCAL_RESUME_TEMPLATES.map(t => <option key={t.slug} value={t.slug}>{t.name}</option>)}
          </select>
        </div>

        {error && (
          <div style={{ padding: "10px 14px", background: "#FEF2F2", borderRadius: 8, fontSize: 13, color: "#DC2626" }}>{error}</div>
        )}

        <button
          onClick={generate} disabled={busy || !file}
          style={{
            width: "100%", padding: "12px 0", border: "none", borderRadius: 10, cursor: (busy || !file) ? "not-allowed" : "pointer",
            background: (busy || !file) ? "#94A3B8" : "linear-gradient(135deg,#00BFA5,#009688)", color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "inherit",
          }}
        >
          {busy ? statusLabel : "Generate Resume"}
        </button>
      </div>
    </div>
  );
}
