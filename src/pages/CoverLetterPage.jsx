import { useState } from "react";
import { EMPTY_USER } from "../constants/appConstants.js";
import { Page, PageHeader, Card, Button, Input, TextArea, Banner } from "../components/ui/index.js";
import { Mail, Copy, Check, Download, FileText, RotateCcw, Trash2, AlertTriangle } from "lucide-react";
import { edgeFetch } from "../lib/edgeFetch.js";

const cardTitleStyle = { margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: "var(--jv-color-heading)" };

export default function CoverLetterPage({ profileForm, profileSkills, profileWork }) {
  const profile = profileForm || EMPTY_USER;
  const skills = profileSkills || [];
  const work = profileWork || [];

  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [tone, setTone] = useState("professional");
  const [inputMode, setInputMode] = useState("paste");
  const [loading, setLoading] = useState(false);
  const [letter, setLetter] = useState("");
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const [letterFont, setLetterFont] = useState("Georgia, serif");
  const [letterSize, setLetterSize] = useState(13);
  const [letterAlign, setLetterAlign] = useState("left");
  const [letterLineHeight, setLetterLineHeight] = useState(1.8);

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
    <Page size="wide" className="jobvair-page">
      <PageHeader title="AI Cover Letter Generator" description="Generate a tailored AI cover letter in seconds. Customized to the job and your background." />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 20, marginBottom: 20 }}>
        <Card>
          <h3 style={cardTitleStyle}>Job Information</h3>

          <div style={{ display: "flex", gap: 0, marginBottom: 16, border: "1px solid var(--jv-color-border)", borderRadius: "var(--jv-radius-sm)", overflow: "hidden" }}>
            {[["paste", "Paste JD"], ["manual", "Manual"], ["url", "Job URL"]].map(([id, lbl]) => (
              <button key={id} onClick={() => setInputMode(id)} style={{ flex: 1, padding: "8px 4px", border: "none", fontSize: 12, fontFamily: "inherit", background: inputMode === id ? "var(--jv-color-primary)" : "transparent", color: inputMode === id ? "#fff" : "var(--jv-color-slate-600)", fontWeight: inputMode === id ? 600 : 400, cursor: "pointer" }}>{lbl}</button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {inputMode === "paste" && (<>
              <Input label="Job Title (optional)" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Operations Director" />
              <Input label="Company (optional)" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Amazon" />
              <TextArea label="Paste Job Description" rows={8} value={jobDesc} onChange={e => setJobDesc(e.target.value)} placeholder="Paste the full job description here…" />
            </>)}
            {inputMode === "manual" && (<>
              <Input label="Job Title" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Operations Director" />
              <Input label="Company" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Amazon" />
              <TextArea label="Key Requirements" rows={6} value={jobDesc} onChange={e => setJobDesc(e.target.value)} placeholder="List the key requirements, responsibilities, or qualifications…" />
            </>)}
            {inputMode === "url" && (<>
              <Input label="Job Posting URL" value={jobUrl} onChange={e => setJobUrl(e.target.value)} placeholder="https://jobs.company.com/..." />
              <Input label="Job Title" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Operations Director" />
              <Input label="Company" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Amazon" />
              <Banner tone="warning" icon={AlertTriangle}>The URL will be noted in generation. For best results, also paste the job description above.</Banner>
              <TextArea label="Job Description (optional)" rows={4} value={jobDesc} onChange={e => setJobDesc(e.target.value)} placeholder="Paste key details for better results…" />
            </>)}
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <h3 style={cardTitleStyle}>Tone</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                ["professional", "Professional", "Formal and business-focused"],
                ["confident", "Confident", "Bold and assertive"],
                ["conversational", "Conversational", "Warm and personable"],
                ["executive", "Executive", "Senior leadership tone"],
              ].map(([val, label, desc]) => {
                const isActive = tone === val;
                return (
                  <label key={val} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: "var(--jv-radius-sm)", border: `1.5px solid ${isActive ? "var(--jv-color-primary)" : "var(--jv-color-border)"}`, background: isActive ? "var(--jv-color-teal-50)" : "transparent", cursor: "pointer" }}>
                    <input type="radio" name="tone" value={val} checked={isActive} onChange={() => setTone(val)} style={{ accentColor: "var(--jv-color-primary)" }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--jv-color-heading)" }}>{label}</div>
                      <div style={{ fontSize: 11, color: "var(--jv-color-muted)" }}>{desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </Card>

          <Card style={{ background: "var(--jv-color-slate-50)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--jv-color-heading)", marginBottom: 8 }}>Your Profile</div>
            <div style={{ fontSize: 12, color: "var(--jv-color-text)", marginBottom: 4 }}>{profile.name || "No name set"}</div>
            {profile.summary && <div style={{ fontSize: 11, color: "var(--jv-color-muted)", lineHeight: 1.5 }}>{profile.summary.slice(0, 120)}…</div>}
            <div style={{ fontSize: 11, color: "var(--jv-color-muted)", marginTop: 6 }}>{skills.length} skills · {work.length} jobs on record</div>
          </Card>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 16 }}>
          <Banner tone="danger" icon={AlertTriangle}>{error}</Banner>
        </div>
      )}

      <Button onClick={generate} disabled={loading} full icon={Mail}>
        {loading ? "Generating your cover letter…" : "Generate Cover Letter"}
      </Button>

      {loading && (
        <Card style={{ textAlign: "center", padding: "40px 24px", marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Mail size={32} color="var(--jv-color-primary)" /></div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--jv-color-heading)", marginBottom: 6 }}>Writing your cover letter…</div>
          <div style={{ fontSize: 13, color: "var(--jv-color-muted)" }}>Tailoring to {jobTitle || "this role"}{company ? ` at ${company}` : ""}. Takes about 10 seconds.</div>
        </Card>
      )}

      {letter && (
        <Card style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--jv-color-heading)" }}>Your Cover Letter</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <Button size="sm" variant="secondary" icon={copied ? Check : Copy} onClick={copy}>{copied ? "Copied!" : "Copy"}</Button>
              <Button size="sm" variant="secondary" icon={Download} onClick={downloadTxt}>.txt</Button>
              <Button size="sm" variant="secondary" icon={Download} onClick={downloadPdf}>PDF</Button>
              <Button size="sm" variant="secondary" icon={FileText} onClick={downloadDoc}>.doc</Button>
              <Button size="sm" variant="secondary" icon={Mail} onClick={shareEmail}>Email</Button>
              <Button size="sm" variant="secondary" icon={Trash2} onClick={() => setLetter("")}>Clear</Button>
              <Button size="sm" icon={RotateCcw} onClick={generate}>Regenerate</Button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 14px", background: "var(--jv-color-slate-50)", borderRadius: "var(--jv-radius-sm)", marginBottom: 14, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--jv-color-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Format:</span>
            <select value={letterFont} onChange={e => setLetterFont(e.target.value)} className="jv-select" style={{ fontSize: 12, padding: "4px 8px", width: "auto" }}>
              <option value="Georgia, serif">Georgia (Serif)</option>
              <option value="'Times New Roman', serif">Times New Roman</option>
              <option value="'DM Sans', sans-serif">DM Sans (Modern)</option>
              <option value="'Arial', sans-serif">Arial</option>
              <option value="'Garamond', serif">Garamond</option>
              <option value="'Helvetica', sans-serif">Helvetica</option>
            </select>
            <select value={letterSize} onChange={e => setLetterSize(Number(e.target.value))} className="jv-select" style={{ fontSize: 12, padding: "4px 8px", width: "auto" }}>
              {[11, 12, 13, 14, 15].map(s => <option key={s} value={s}>{s}px</option>)}
            </select>
            <select value={letterAlign} onChange={e => setLetterAlign(e.target.value)} className="jv-select" style={{ fontSize: 12, padding: "4px 8px", width: "auto" }}>
              <option value="left">Left Aligned</option>
              <option value="justify">Justified</option>
              <option value="center">Centered</option>
            </select>
            <select value={letterLineHeight} onChange={e => setLetterLineHeight(Number(e.target.value))} className="jv-select" style={{ fontSize: 12, padding: "4px 8px", width: "auto" }}>
              <option value={1.5}>Compact (1.5)</option>
              <option value={1.8}>Normal (1.8)</option>
              <option value={2.0}>Spacious (2.0)</option>
            </select>
          </div>

          <div id="cover-letter-content" style={{ background: "#fff", borderRadius: "var(--jv-radius-md)", padding: "28px 36px", border: "1px solid var(--jv-color-border)", boxShadow: "var(--jv-shadow-sm)" }}>
            <textarea
              value={letter}
              onChange={e => setLetter(e.target.value)}
              style={{ width: "100%", border: "none", outline: "none", fontSize: letterSize, lineHeight: letterLineHeight, color: "#1E293B", whiteSpace: "pre-wrap", fontFamily: letterFont, textAlign: letterAlign, resize: "none", background: "transparent", boxSizing: "border-box", minHeight: 400 }}
              rows={20}
            />
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--jv-color-muted)" }}>
            You can edit the letter directly above. Use formatting controls to adjust font, size, alignment, and spacing before exporting.
          </div>
        </Card>
      )}
    </Page>
  );
}
