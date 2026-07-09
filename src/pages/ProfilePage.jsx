import { useState } from "react";
import { EMPTY_USER, SALARY_MAP } from "../constants/appConstants.js";
import {
  Page, PageHeader, Section, Card, Badge, Button, Input, TextArea, Select,
  Tabs, Toggle, CheckGroup, ProgressBar,
} from "../components/ui/index.js";
import {
  Plus, X, ShieldCheck, ShieldOff, CheckCircle2, DollarSign, Briefcase,
  Search, Star, Eye, Trash2, Award,
} from "lucide-react";
import ResumeUploadZone from "../components/ResumeUploadZone.jsx";
import { VerificationTab } from "./SettingsPage.jsx";

const PROFICIENCY_TONE = { Beginner: "warning", Intermediate: "info", Advanced: "success", Expert: "primary" };
const PROFICIENCY_PCT = { Beginner: 25, Intermediate: 50, Advanced: 75, Expert: 100 };

const cardTitleStyle = { margin: "0 0 16px", fontSize: 16, fontWeight: 750, color: "var(--jv-color-heading)" };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 };
const emptyRowStyle = { textAlign: "center", padding: "24px", color: "var(--jv-color-muted)", fontSize: 14 };

export default function ProfilePage({ user, onUpdateUser, profileForm, setProfileForm, profileSkills, setProfileSkills, profileWork, setProfileWork, profileEdu, setProfileEdu, profileCerts, setProfileCerts, onSave, onParsedResume }) {
  const [tab, setTab] = useState("basic");
  const form = profileForm || { ...EMPTY_USER };
  const setForm = setProfileForm;
  const skills = profileSkills;
  const setSkills = setProfileSkills;
  const work = profileWork;
  const setWork = setProfileWork;
  const education = profileEdu;
  const setEducation = setProfileEdu;

  const [saveState, setSaveState] = useState("idle");
  const [saveError, setSaveError] = useState(null);
  const [newSkill, setNewSkill] = useState({ skill_name: "", years_experience: "", proficiency_level: "Intermediate", category: "" });
  const [addingSkill, setAddingSkill] = useState(false);

  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaveState("saving");
    setSaveError(null);
    const { error } = await onSave();
    if (error) {
      setSaveError(error);
      setSaveState("error");
    } else {
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    }
  };

  return (
    <Page size="wide" className="jobvair-page">
      <PageHeader
        title="My Profile"
        description="Complete your profile for better AI resume matches and employer visibility."
        actions={
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {saveState === "saved" && <span style={{ fontSize: 13, color: "var(--jv-color-success-600)", display: "flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={15} /> Saved</span>}
            {saveState === "error" && <span style={{ fontSize: 13, color: "var(--jv-color-danger-600)" }}>⚠ {saveError}</span>}
            <Button onClick={save} disabled={saveState === "saving"}>{saveState === "saving" ? "Saving…" : "Save Changes"}</Button>
          </div>
        }
      />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
        {user.idVerified
          ? <Badge tone="success" icon={ShieldCheck}>Identity Verified</Badge>
          : <Badge tone="neutral" icon={ShieldOff}>Not Verified</Badge>}
        <Badge tone={form.backgroundCheck ? "success" : "neutral"} icon={CheckCircle2}>{form.backgroundCheck ? "Background Check Clear" : "No Background Check"}</Badge>
        {form.wotcEligible && <Badge tone="warning" icon={Award}>WOTC Eligible</Badge>}
        {!form.sponsorshipRequired && <Badge tone="info">No Sponsorship Required</Badge>}
      </div>

      <Tabs
        tabs={[
          { id: "basic", label: "Basic Info" },
          { id: "status", label: "Employment Status" },
          { id: "skills", label: "Skills" },
          { id: "experience", label: "Work History" },
          { id: "education", label: "Education" },
          { id: "certifications", label: "Certifications" },
          { id: "verification", label: "ID Verification" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* Basic Info */}
      {tab === "basic" && (
        <div style={gridStyle}>
          <Card style={{ gridColumn: "1/-1" }}>
            <h3 style={cardTitleStyle}>Contact Information</h3>
            <div style={gridStyle}>
              <Input label="Full Name" value={form.name} onChange={e => set("name")(e.target.value)} required />
              <Input label="Email" type="email" value={form.email} onChange={e => set("email")(e.target.value)} required />
              <Input label="Phone" value={form.phone} onChange={e => set("phone")(e.target.value)} />
              <Input label="Location (City, State)" value={form.location} onChange={e => set("location")(e.target.value)} placeholder="Charlotte, NC" />
            </div>
          </Card>

          <Card style={{ gridColumn: "1/-1" }}>
            <h3 style={cardTitleStyle}>Professional Summary</h3>
            <TextArea rows={4} value={form.summary} onChange={e => set("summary")(e.target.value)} placeholder="Describe your background and what you're looking for…" />
          </Card>

          <Card>
            <h3 style={cardTitleStyle}>Career Goals</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Input label="Desired Job Titles" value={form.desiredTitles.join(", ")} onChange={e => set("desiredTitles")(e.target.value.split(",").map(s => s.trim()))} placeholder="Senior Engineer, Tech Lead" />
              <Input label="Industries of Interest" value={form.industries.join(", ")} onChange={e => set("industries")(e.target.value.split(",").map(s => s.trim()))} />
              <Select label="Availability" value={form.availability} onChange={e => set("availability")(e.target.value)} options={[
                { value: "immediately", label: "Available immediately" },
                { value: "2weeks", label: "2 weeks notice" },
                { value: "1month", label: "1 month notice" },
                { value: "3months", label: "3+ months notice" },
                { value: "passive", label: "Passively looking" },
              ]} />
            </div>
          </Card>

          <Card>
            <h3 style={cardTitleStyle}>Upload Resume</h3>
            <ResumeUploadZone user={user} onParsed={(parsed) => { if (onParsedResume) onParsedResume(parsed); }} />
          </Card>
        </div>
      )}

      {/* Employment Status */}
      {tab === "status" && (
        <div style={gridStyle}>
          <Card>
            <h3 style={cardTitleStyle}>Employment Status</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { value: "employed", label: "Currently Employed", icon: Briefcase },
                { value: "unemployed", label: "Unemployed — Actively Seeking", icon: Search },
                { value: "open", label: "Employed but Open to Opportunities", icon: Star },
                { value: "browsing", label: "Just Browsing", icon: Eye },
              ].map(o => {
                const isActive = form.employmentStatus === o.value;
                return (
                  <label key={o.value} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: "var(--jv-radius-md)", border: `1.5px solid ${isActive ? "var(--jv-color-primary)" : "var(--jv-color-border)"}`, background: isActive ? "var(--jv-color-teal-50)" : "var(--jv-color-surface)", cursor: "pointer" }}>
                    <input type="radio" name="empStatus" checked={isActive} onChange={() => set("employmentStatus")(o.value)} style={{ accentColor: "var(--jv-color-primary)" }} />
                    <o.icon size={17} color="var(--jv-color-slate-600)" />
                    <span style={{ fontSize: 14, fontWeight: isActive ? 650 : 400 }}>{o.label}</span>
                  </label>
                );
              })}
            </div>
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Card>
              <h3 style={cardTitleStyle}>Salary Expectations</h3>
              <Select label="Experience Level" value={form.salaryLevel} onChange={e => set("salaryLevel")(e.target.value)} options={Object.entries(SALARY_MAP).map(([v, d]) => ({ value: v, label: d.label }))} />
              {form.salaryLevel === "custom" ? (
                <div style={{ marginTop: 14 }}>
                  <Input label="Target Salary (e.g. $120,000)" value={form.salaryTarget} onChange={e => set("salaryTarget")(e.target.value)} placeholder="$120,000" />
                </div>
              ) : (
                <div style={{ marginTop: 12, padding: "12px 14px", background: "var(--jv-color-teal-50)", borderRadius: "var(--jv-radius-sm)" }}>
                  <div style={{ fontSize: 12, color: "var(--jv-color-teal-700)", fontWeight: 650, marginBottom: 2, display: "flex", alignItems: "center", gap: 4 }}><DollarSign size={13} /> AI Salary Recommendation</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--jv-color-heading)" }}>{(SALARY_MAP[form.salaryLevel] || SALARY_MAP.senior).range}</div>
                  <div style={{ fontSize: 12, color: "var(--jv-color-muted)", marginTop: 2 }}>Based on {form.salaryLevel} level in {form.location || "your region"}</div>
                </div>
              )}
            </Card>

            <Card>
              <h3 style={cardTitleStyle}>Employment Type</h3>
              <CheckGroup options={[
                { value: "full-time", label: "Full-Time" },
                { value: "contract", label: "Contract" },
                { value: "temporary", label: "Temporary" },
                { value: "part-time", label: "Part-Time" },
              ]} value={form.employmentTypes} onChange={set("employmentTypes")} />
            </Card>

            <Card>
              <h3 style={cardTitleStyle}>Work Location</h3>
              <CheckGroup options={[
                { value: "onsite", label: "On-Site" },
                { value: "remote", label: "Remote" },
                { value: "hybrid", label: "Hybrid" },
              ]} value={form.workLocations} onChange={set("workLocations")} />
            </Card>
          </div>

          <Card style={{ gridColumn: "1/-1" }}>
            <h3 style={cardTitleStyle}>Overall Experience</h3>
            <div style={gridStyle}>
              <Input label="Total Years of Professional Experience" value={form.totalYearsExperience || ""} onChange={e => set("totalYearsExperience")(e.target.value)} placeholder="e.g. 12" hint="Total across all roles" />
              <Input label="Total Years of Leadership Experience" value={form.totalYearsLeadership || ""} onChange={e => set("totalYearsLeadership")(e.target.value)} placeholder="e.g. 5" hint="Managing teams or projects" />
              <Input label="Total Years of Industry Experience" value={form.totalYearsIndustry || ""} onChange={e => set("totalYearsIndustry")(e.target.value)} placeholder="e.g. 8" hint="In your primary industry" />
            </div>
          </Card>

          <Card style={{ gridColumn: "1/-1" }}>
            <h3 style={cardTitleStyle}>Background &amp; Eligibility</h3>
            <div style={gridStyle}>
              <div style={{ padding: "14px 16px", borderRadius: "var(--jv-radius-md)", border: "1.5px solid var(--jv-color-border)", display: "flex", flexDirection: "column", gap: 10 }}>
                <Toggle checked={form.backgroundCheck} onChange={v => set("backgroundCheck")(v)} label="Can pass background check" />
                {form.backgroundCheck && <div style={{ fontSize: 12, color: "var(--jv-color-success-600)", padding: "6px 10px", background: "#dcfce7", borderRadius: "var(--jv-radius-xs)" }}>✓ Background clear</div>}
              </div>
              <div style={{ padding: "14px 16px", borderRadius: "var(--jv-radius-md)", border: "1.5px solid var(--jv-color-border)", display: "flex", flexDirection: "column", gap: 10 }}>
                <Toggle checked={form.wotcEligible} onChange={v => set("wotcEligible")(v)} label="WOTC eligible" />
                {form.wotcEligible && <div style={{ fontSize: 12, color: "#92600A", padding: "6px 10px", background: "#FFFBEB", borderRadius: "var(--jv-radius-xs)" }}>May qualify for employer tax credits</div>}
              </div>
              <div style={{ padding: "14px 16px", borderRadius: "var(--jv-radius-md)", border: "1.5px solid var(--jv-color-border)", display: "flex", flexDirection: "column", gap: 10 }}>
                <Toggle checked={form.sponsorshipRequired} onChange={v => set("sponsorshipRequired")(v)} label="Requires work sponsorship" />
                {form.sponsorshipRequired
                  ? <div style={{ fontSize: 12, color: "var(--jv-color-muted)", padding: "6px 10px", background: "var(--jv-color-slate-50)", borderRadius: "var(--jv-radius-xs)" }}>Requires H1-B or similar visa</div>
                  : <div style={{ fontSize: 12, color: "var(--jv-color-success-600)", padding: "6px 10px", background: "#dcfce7", borderRadius: "var(--jv-radius-xs)" }}>✓ No sponsorship needed</div>}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Skills */}
      {tab === "skills" && (
        <Card>
          <Section
            title="Skills"
            description="Skills are stored individually and used for employer search and AI matching."
            actions={<Button size="sm" icon={Plus} onClick={() => setAddingSkill(!addingSkill)}>Add Skill</Button>}
          />
          {addingSkill && (
            <div style={{ background: "var(--jv-color-slate-50)", borderRadius: "var(--jv-radius-md)", padding: 16, marginBottom: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, alignItems: "end" }}>
              <Input label="Skill Name" value={newSkill.skill_name || ""} onChange={e => setNewSkill(s => ({ ...s, skill_name: e.target.value }))} placeholder="e.g. Salesforce" />
              <Input label="Years" value={newSkill.years_experience || ""} onChange={e => setNewSkill(s => ({ ...s, years_experience: e.target.value }))} placeholder="3" />
              <Select label="Level" value={newSkill.proficiency_level || "Intermediate"} onChange={e => setNewSkill(s => ({ ...s, proficiency_level: e.target.value }))} options={["Beginner", "Intermediate", "Advanced", "Expert"].map(x => ({ value: x, label: x }))} />
              <Input label="Category" value={newSkill.category || ""} onChange={e => setNewSkill(s => ({ ...s, category: e.target.value }))} placeholder="e.g. Technology" />
              <div style={{ display: "flex", gap: 8 }}>
                <Button size="sm" onClick={() => {
                  if (newSkill.skill_name?.trim()) {
                    setSkills(s => [...s, { id: `new_${Date.now()}`, ...newSkill, source: "manual" }]);
                    setNewSkill({ skill_name: "", years_experience: "", proficiency_level: "Intermediate", category: "" });
                    setAddingSkill(false);
                  }
                }}>Add</Button>
                <Button size="sm" variant="secondary" icon={X} onClick={() => setAddingSkill(false)} />
              </div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {skills.length === 0 && <div style={emptyRowStyle}>No skills yet. Add skills manually or upload your resume to auto-populate.</div>}
            {skills.map((sk, i) => (
              <div key={sk.id || i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", background: "var(--jv-color-slate-50)", borderRadius: "var(--jv-radius-md)" }}>
                <div style={{ flex: 2, minWidth: 100 }}>
                  <div style={{ fontSize: 14, fontWeight: 650, color: "var(--jv-color-heading)" }}>{sk.skill_name}</div>
                  {sk.category && <div style={{ fontSize: 12, color: "var(--jv-color-muted)" }}>{sk.category}</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "var(--jv-color-muted)", marginBottom: 4 }}>
                    {sk.years_experience ? `${sk.years_experience} yr${sk.years_experience !== 1 ? "s" : ""}` : "Years unknown"}
                  </div>
                  <ProgressBar value={PROFICIENCY_PCT[sk.proficiency_level] || 50} max={100} />
                </div>
                <Badge tone={PROFICIENCY_TONE[sk.proficiency_level] || "neutral"}>{sk.proficiency_level || "Unknown"}</Badge>
                <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setSkills(s => s.filter((_, j) => j !== i))} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Work History */}
      {tab === "experience" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {work.length === 0 && <div style={emptyRowStyle}>No work history yet. Add jobs manually or upload your resume.</div>}
          {work.map((w, i) => (
            <Card key={w.id || i}>
              <div style={{ ...gridStyle, marginBottom: 16 }}>
                <Input label="Job Title" value={w.job_title || ""} onChange={e => setWork(ws => ws.map((x, j) => j === i ? { ...x, job_title: e.target.value } : x))} />
                <Input label="Company" value={w.company || ""} onChange={e => setWork(ws => ws.map((x, j) => j === i ? { ...x, company: e.target.value } : x))} />
                <Input label="Start Date" type="date" value={w.start_date || ""} onChange={e => setWork(ws => ws.map((x, j) => j === i ? { ...x, start_date: e.target.value } : x))} />
                <div>
                  {w.is_current ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 24 }}>
                      <input type="checkbox" checked onChange={() => setWork(ws => ws.map((x, j) => j === i ? { ...x, is_current: false } : x))} style={{ accentColor: "var(--jv-color-primary)" }} />
                      <label style={{ fontSize: 13, color: "var(--jv-color-slate-600)" }}>Currently working here</label>
                    </div>
                  ) : (
                    <Input label="End Date" type="date" value={w.end_date || ""} onChange={e => setWork(ws => ws.map((x, j) => j === i ? { ...x, end_date: e.target.value } : x))} />
                  )}
                </div>
                <Input label="Industry" value={w.industry || ""} onChange={e => setWork(ws => ws.map((x, j) => j === i ? { ...x, industry: e.target.value } : x))} placeholder="e.g. Technology, Healthcare" />
                <Input label="Location" value={w.location || ""} onChange={e => setWork(ws => ws.map((x, j) => j === i ? { ...x, location: e.target.value } : x))} placeholder="City, State" />
              </div>
              <TextArea label="Description & Achievements" rows={3} value={w.description || ""} onChange={e => setWork(ws => ws.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} />
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                  <input type="checkbox" checked={w.is_leadership || false} onChange={e => setWork(ws => ws.map((x, j) => j === i ? { ...x, is_leadership: e.target.checked } : x))} style={{ accentColor: "var(--jv-color-primary)" }} />
                  Leadership role
                </label>
                <button onClick={() => setWork(ws => ws.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--jv-color-danger-600)", fontSize: 13, fontFamily: "inherit" }}>Remove</button>
              </div>
            </Card>
          ))}
          <Button variant="secondary" icon={Plus} onClick={() => setWork(ws => [...ws, { id: `new_${Date.now()}`, job_title: "", company: "", start_date: "", end_date: "", is_current: false, description: "", industry: "", location: "", is_leadership: false, source: "manual" }])}>
            Add Work Experience
          </Button>
        </div>
      )}

      {/* Education */}
      {tab === "education" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <div style={gridStyle}>
              <Select label="Highest Education Level" value={form.highestEducationLevel || ""} onChange={e => set("highestEducationLevel")(e.target.value)} options={[
                { value: "", label: "Select..." },
                { value: "High School", label: "High School / GED" },
                { value: "Trade School", label: "Trade School / Vocational" },
                { value: "Associate Degree", label: "Associate Degree" },
                { value: "Bachelor's Degree", label: "Bachelor's Degree" },
                { value: "Master's Degree", label: "Master's Degree" },
                { value: "MBA", label: "MBA" },
                { value: "Doctorate", label: "Doctorate / Ph.D" },
                { value: "Professional Certification", label: "Professional Certification" },
                { value: "Other", label: "Other" },
              ]} hint="Used for employer search and ATS matching" />
            </div>
          </Card>
          {education.length === 0 && <div style={emptyRowStyle}>No education entries yet. Add manually or upload your resume.</div>}
          {education.map((e, i) => (
            <Card key={e.id || i}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, alignItems: "end" }}>
                <Input label="Degree / Program" value={e.degree || ""} onChange={ev => setEducation(eds => eds.map((x, j) => j === i ? { ...x, degree: ev.target.value } : x))} />
                <Input label="Major / Field of Study" value={e.major || ""} onChange={ev => setEducation(eds => eds.map((x, j) => j === i ? { ...x, major: ev.target.value } : x))} />
                <Input label="Institution" value={e.institution || ""} onChange={ev => setEducation(eds => eds.map((x, j) => j === i ? { ...x, institution: ev.target.value } : x))} />
                <Input label="Grad Year" value={e.graduation_year || ""} onChange={ev => setEducation(eds => eds.map((x, j) => j === i ? { ...x, graduation_year: ev.target.value } : x))} placeholder="2018" />
                <Button variant="ghost" icon={Trash2} onClick={() => setEducation(eds => eds.filter((_, j) => j !== i))} />
              </div>
            </Card>
          ))}
          <Button variant="secondary" icon={Plus} onClick={() => setEducation(eds => [...eds, { id: `new_${Date.now()}`, degree: "", major: "", institution: "", graduation_year: "", source: "manual" }])}>
            Add Education
          </Button>
        </div>
      )}

      {/* Certifications */}
      {tab === "certifications" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {(profileCerts || []).length === 0 && <div style={emptyRowStyle}>No certifications yet. Add manually or upload your resume.</div>}
          {(profileCerts || []).map((c, i) => (
            <Card key={c.id || i}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, alignItems: "end" }}>
                <Input label="Certification Name" value={c.name || ""} onChange={e => setProfileCerts(cs => cs.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="e.g. AWS Cloud Practitioner" />
                <Input label="Issuing Organization" value={c.issuing_org || ""} onChange={e => setProfileCerts(cs => cs.map((x, j) => j === i ? { ...x, issuing_org: e.target.value } : x))} placeholder="e.g. Amazon" />
                <Input label="Issue Date" type="date" value={c.issue_date || ""} onChange={e => setProfileCerts(cs => cs.map((x, j) => j === i ? { ...x, issue_date: e.target.value } : x))} />
                <Input label="Expiry Date" type="date" value={c.expiry_date || ""} onChange={e => setProfileCerts(cs => cs.map((x, j) => j === i ? { ...x, expiry_date: e.target.value } : x))} />
                <Button variant="ghost" icon={Trash2} onClick={() => setProfileCerts(cs => cs.filter((_, j) => j !== i))} />
              </div>
            </Card>
          ))}
          <Button variant="secondary" icon={Plus} onClick={() => setProfileCerts(cs => [...(cs || []), { id: `new_${Date.now()}`, name: "", issuing_org: "", issue_date: "", expiry_date: "", source: "manual" }])}>
            Add Certification
          </Button>
        </div>
      )}

      {tab === "verification" && <VerificationTab user={user} onUpdateUser={onUpdateUser} />}
    </Page>
  );
}
