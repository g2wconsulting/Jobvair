import { useState } from "react";
import { C, EMPTY_USER } from "../constants/appConstants.js";
import { Btn, Card, Input, SectionTitle } from "../components/ui.jsx";
import { edgeFetch } from "../lib/edgeFetch.js";

export default function CoverLetterPage({ profileForm, profileSkills, profileWork }) {
  const profile = profileForm || EMPTY_USER;
  const skills  = profileSkills || [];
  const work    = profileWork   || [];

  const [jobTitle,   setJobTitle]   = useState("");
  const [company,    setCompany]    = useState("");
  const [jobDesc,    setJobDesc]    = useState("");
  const [jobUrl,     setJobUrl]     = useState("");
  const [tone,       setTone]       = useState("professional");
  const [inputMode,  setInputMode]  = useState("paste");
  const [loading,       setLoading]      = useState(false);
  const [letter,        setLetter]       = useState("");
  const [error,         setError]        = useState(null);
  const [copied,        setCopied]       = useState(false);

  // Formatting state
  const [letterFont,       setLetterFont]       = useState("Georgia, serif");
  const [letterSize,       setLetterSize]       = useState(13);
  const [letterAlign,      setLetterAlign]      = useState("left");
  const [letterLineHeight, setLetterLineHeight] = useState(1.8);

  // Export functions
  const copy = () => {
    navigator.clipboard?.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTxt = () => {
    const blob = new Blob([letter], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Cover_Letter_${(company || jobTitle || "Job").replace(/\s+/g, "_")}.txt`;
    a.click();
  };

  const downloadPdf = async () => {
    if (!window.html2pdf) {
      await new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
        s.onload = res; s.onerror = rej; document.head.appendChild(s);
      });
    }
    const el = document.getElementById("cover-letter-content");
    if (!el) return;
    window.html2pdf().set({
      margin: [20, 25, 20, 25],
      filename: `Cover_Letter_${(company || jobTitle || "Job").replace(/\s+/g, "_")}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    }).from(el).save();
  };

  const downloadDoc = () => {
    // Create a simple HTML document that Word can open
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body { font-family: ${letterFont}; font-size: ${letterSize}pt; line-height: ${letterLineHeight}; text-align: ${letterAlign}; margin: 1in; color: #1E293B; }
      pre { white-space: pre-wrap; font-family: inherit; font-size: inherit; }
    </style></head><body><pre>${letter.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre></body></html>`;
    const blob = new Blob([html], { type: "application/msword" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Cover_Letter_${(company || jobTitle || "Job").replace(/\s+/g, "_")}.doc`;
    a.click();
  };

  const shareEmail = () => {
    const subject = encodeURIComponent(`Cover Letter — ${jobTitle || "Position"}${company ? ` at ${company}` : ""}`);
    const body = encodeURIComponent(letter);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const generate = async () => {
    if (!jobTitle.trim() && !jobDesc.trim() && !jobUrl.trim()) {
      setError("Please enter a job title, paste a job description, or provide a job URL."); return;
    }
    setError(null); setLoading(true); setLetter("");

    const resumeContent = [
      profile.name,
      profile.summary,
      skills.length ? "Skills: " + skills.map(s => s.skill_name).join(", ") : null,
      ...work.slice(0, 4).map(w => `${w.job_title || ""} at ${w.company || ""}`),
    ].filter(Boolean).join("\n");

    const jobInfo = inputMode === "url"
      ? `Job URL: ${jobUrl}\nJob Title: ${jobTitle}`
      : `Job Title: ${jobTitle || "Not specified"}\nCompany: ${company || "Not specified"}\nJob Description:\n${jobDesc}`;

    const prompt = `You are an expert career coach and professional writer. Write a compelling cover letter.

Candidate:
Name: ${profile.name || "The candidate"}
Location: ${profile.location || ""}
Summary: ${profile.summary || ""}
Background: ${resumeContent}

Role they are applying for:
${jobInfo}

Tone: ${tone}

Write a complete, professional cover letter (3-4 paragraphs):
- Opening: Express specific enthusiasm for this role and company
- Body: Connect their real experience to the job requirements  
- Closing: Strong call to action
- Sign off with their name

Be specific. Do not use generic filler. Return only the cover letter text.`;

    try {
      const data = await edgeFetch("generate-cover-letter", { prompt, tone, job_title: jobTitle, company });
      if (data.error) throw new Error(data.error);
      setLetter(data.letter || "");
    } catch (err) {
      setError(err.message || "Failed to generate cover letter. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="jobvair-page">
      <SectionTitle sub="Generate a tailored AI cover letter in seconds. Customized to the job and your background.">
        AI Cover Letter Generator
      </SectionTitle>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))", gap:20, marginBottom:20 }}>
        <Card>
          <h3 style={{ margin:"0 0 14px", fontSize:16, fontWeight:700, color:C.navy }}>Job Information</h3>

          {/* Input mode tabs */}
          <div style={{ display:"flex", gap:0, marginBottom:16, border:`1px solid ${C.border}`, borderRadius:8, overflow:"hidden" }}>
            {[["paste","Paste JD"],["manual","Manual"],["url","Job URL"]].map(([id, lbl]) => (
              <button key={id} onClick={()=>setInputMode(id)} style={{ flex:1, padding:"8px 4px", border:"none", fontSize:12, fontFamily:"inherit", background:inputMode===id?C.teal:"transparent", color:inputMode===id?"#fff":C.slate, fontWeight:inputMode===id?600:400, cursor:"pointer" }}>{lbl}</button>
            ))}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {inputMode === "paste" && (<>
              <Input label="Job Title (optional)" value={jobTitle} onChange={setJobTitle} placeholder="e.g. Operations Director" />
              <Input label="Company (optional)" value={company} onChange={setCompany} placeholder="e.g. Amazon" />
              <Input label="Paste Job Description" textarea rows={8} value={jobDesc} onChange={setJobDesc} placeholder="Paste the full job description here…" />
            </>)}
            {inputMode === "manual" && (<>
              <Input label="Job Title" value={jobTitle} onChange={setJobTitle} placeholder="e.g. Operations Director" />
              <Input label="Company" value={company} onChange={setCompany} placeholder="e.g. Amazon" />
              <Input label="Key Requirements" textarea rows={6} value={jobDesc} onChange={setJobDesc} placeholder="List the key requirements, responsibilities, or qualifications…" />
            </>)}
            {inputMode === "url" && (<>
              <Input label="Job Posting URL" value={jobUrl} onChange={setJobUrl} placeholder="https://jobs.company.com/..." />
              <Input label="Job Title" value={jobTitle} onChange={setJobTitle} placeholder="e.g. Operations Director" />
              <Input label="Company" value={company} onChange={setCompany} placeholder="e.g. Amazon" />
              <div style={{ padding:"10px 14px", background:C.warningBg, borderRadius:8, fontSize:12, color:C.warning }}>
                The URL will be noted in generation. For best results, also paste the job description above.
              </div>
              <Input label="Job Description (optional)" textarea rows={4} value={jobDesc} onChange={setJobDesc} placeholder="Paste key details for better results…" />
            </>)}
          </div>
        </Card>

        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <Card>
            <h3 style={{ margin:"0 0 14px", fontSize:16, fontWeight:700, color:C.navy }}>Tone</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[
                ["professional",  "Professional",  "Formal and business-focused"],
                ["confident",     "Confident",     "Bold and assertive"],
                ["conversational","Conversational","Warm and personable"],
                ["executive",     "Executive",     "Senior leadership tone"],
              ].map(([val, label, desc]) => (
                <label key={val} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:8, border:`1.5px solid ${tone===val?C.teal:C.border}`, background:tone===val?C.tealLight:"transparent", cursor:"pointer" }}>
                  <input type="radio" name="tone" value={val} checked={tone===val} onChange={()=>setTone(val)} style={{ accentColor:C.teal }} />
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:C.navy }}>{label}</div>
                    <div style={{ fontSize:11, color:C.textMuted }}>{desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </Card>

          <Card style={{ background:C.bg }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.navy, marginBottom:8 }}>Your Profile</div>
            <div style={{ fontSize:12, color:C.slate, marginBottom:4 }}>{profile.name || "No name set"}</div>
            {profile.summary && <div style={{ fontSize:11, color:C.textMuted, lineHeight:1.5 }}>{profile.summary.slice(0, 120)}…</div>}
            <div style={{ fontSize:11, color:C.textMuted, marginTop:6 }}>{skills.length} skills · {work.length} jobs on record</div>
          </Card>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom:16, padding:"12px 16px", background:C.dangerBg, border:`1px solid ${C.danger}33`, borderRadius:10, fontSize:13, color:C.danger }}>{error}</div>
      )}

      <Btn onClick={generate} disabled={loading} full icon="✉️">
        {loading ? "Generating your cover letter…" : "Generate Cover Letter"}
      </Btn>

      {loading && (
        <Card style={{ textAlign:"center", padding:"40px 24px", marginTop:20 }}>
          <div style={{ fontSize:32, marginBottom:12 }}>✉️</div>
          <div style={{ fontSize:16, fontWeight:700, color:C.navy, marginBottom:6 }}>Writing your cover letter…</div>
          <div style={{ fontSize:13, color:C.textMuted }}>Tailoring to {jobTitle || "this role"}{company ? ` at ${company}` : ""}. Takes about 10 seconds.</div>
        </Card>
      )}

      {letter && (
        <Card style={{ marginTop:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
            <div style={{ fontSize:15, fontWeight:700, color:C.navy }}>Your Cover Letter</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              <Btn small variant="secondary" onClick={copy}>{copied ? "✓ Copied!" : "📋 Copy"}</Btn>
              <Btn small variant="secondary" onClick={downloadTxt}>⬇ .txt</Btn>
              <Btn small variant="secondary" onClick={downloadPdf}>⬇ PDF</Btn>
              <Btn small variant="secondary" onClick={downloadDoc}>⬇ .doc</Btn>
              <Btn small variant="secondary" onClick={shareEmail}>✉ Email</Btn>
              <Btn small variant="secondary" onClick={()=>setLetter("")}>Clear</Btn>
              <Btn small onClick={generate}>↻ Regenerate</Btn>
            </div>
          </div>

          {/* Formatting controls */}
          <div style={{ display:"flex", gap:12, alignItems:"center", padding:"10px 14px", background:C.bg, borderRadius:8, marginBottom:14, flexWrap:"wrap" }}>
            <span style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.05em" }}>Format:</span>
            <select value={letterFont} onChange={e=>setLetterFont(e.target.value)} style={{ fontSize:12, padding:"4px 8px", border:`1px solid ${C.border}`, borderRadius:6, background:"#fff", fontFamily:"inherit" }}>
              <option value="Georgia, serif">Georgia (Serif)</option>
              <option value="'Times New Roman', serif">Times New Roman</option>
              <option value="'DM Sans', sans-serif">DM Sans (Modern)</option>
              <option value="'Arial', sans-serif">Arial</option>
              <option value="'Garamond', serif">Garamond</option>
              <option value="'Helvetica', sans-serif">Helvetica</option>
            </select>
            <select value={letterSize} onChange={e=>setLetterSize(Number(e.target.value))} style={{ fontSize:12, padding:"4px 8px", border:`1px solid ${C.border}`, borderRadius:6, background:"#fff", fontFamily:"inherit" }}>
              {[11,12,13,14,15].map(s => <option key={s} value={s}>{s}px</option>)}
            </select>
            <select value={letterAlign} onChange={e=>setLetterAlign(e.target.value)} style={{ fontSize:12, padding:"4px 8px", border:`1px solid ${C.border}`, borderRadius:6, background:"#fff", fontFamily:"inherit" }}>
              <option value="left">Left Aligned</option>
              <option value="justify">Justified</option>
              <option value="center">Centered</option>
            </select>
            <select value={letterLineHeight} onChange={e=>setLetterLineHeight(Number(e.target.value))} style={{ fontSize:12, padding:"4px 8px", border:`1px solid ${C.border}`, borderRadius:6, background:"#fff", fontFamily:"inherit" }}>
              <option value={1.5}>Compact (1.5)</option>
              <option value={1.8}>Normal (1.8)</option>
              <option value={2.0}>Spacious (2.0)</option>
            </select>
          </div>

          {/* Editable letter content */}
          <div id="cover-letter-content" style={{ background:"#fff", borderRadius:10, padding:"28px 36px", border:`1px solid ${C.border}`, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
            <textarea
              value={letter}
              onChange={e=>setLetter(e.target.value)}
              style={{ width:"100%", border:"none", outline:"none", fontSize:letterSize, lineHeight:letterLineHeight, color:"#1E293B", whiteSpace:"pre-wrap", fontFamily:letterFont, textAlign:letterAlign, resize:"none", background:"transparent", boxSizing:"border-box", minHeight:400 }}
              rows={20}
            />
          </div>
          <div style={{ marginTop:10, fontSize:12, color:C.textMuted }}>
            You can edit the letter directly above. Use formatting controls to adjust font, size, alignment, and spacing before exporting.
          </div>
        </Card>
      )}
    </div>
  );
}


