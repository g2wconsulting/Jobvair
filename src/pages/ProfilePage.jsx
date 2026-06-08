import { useState } from "react";
import { C, SALARY_MAP } from "../constants/appConstants.js";
import { Badge, Btn, Card, CheckGroup, Input, SectionTitle, Select, Tabs, Toggle } from "../components/ui.jsx";
import ResumeUploadZone from "../components/ResumeUploadZone.jsx";

export default function ProfilePage({ user, onUpdateUser, profileForm, setProfileForm, profileSkills, setProfileSkills, profileWork, setProfileWork, profileEdu, setProfileEdu, profileCerts, setProfileCerts, onSave, onParsedResume }) {
  const [tab, setTab] = useState("basic");
  // Use lifted form state; fall back to EMPTY_USER only if not yet set
  const form = profileForm || { ...EMPTY_USER };
  const setForm = setProfileForm;
  const skills = profileSkills;
  const setSkills = setProfileSkills;
  const work = profileWork;
  const setWork = setProfileWork;
  const education = profileEdu;
  const setEducation = setProfileEdu;

  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const [saveError, setSaveError] = useState(null);
  const [newSkill, setNewSkill] = useState({ skill_name:"", years_experience:"", proficiency_level:"Intermediate", category:"" });
  const [addingSkill, setAddingSkill] = useState(false);

  const set = k => v => setForm(f=>({...f,[k]:v}));

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
    <div>
      <SectionTitle sub="Complete your profile for better AI resume matches and employer visibility." action={
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          {saveState === "saved"  && <span style={{ fontSize:13, color:C.success }}>✓ Saved</span>}
          {saveState === "error"  && <span style={{ fontSize:13, color:C.danger }}>⚠ {saveError}</span>}
          <Btn onClick={save} disabled={saveState === "saving"}>
            {saveState === "saving" ? "Saving…" : "Save Changes"}
          </Btn>
        </div>
      }>My Profile</SectionTitle>

      {/* Status strip */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:24 }}>
        {user.idVerified
          ? <Badge color="teal">🛡 Identity Verified</Badge>
          : <Badge color="gray">🛡 Not Verified</Badge>
        }
        <Badge color={form.backgroundCheck?"success":"gray"}>{form.backgroundCheck?"✓ Background Check Clear":"No Background Check"}</Badge>
        {form.wotcEligible && <Badge color="gold">WOTC Eligible</Badge>}
        {!form.sponsorshipRequired && <Badge color="navy">No Sponsorship Required</Badge>}
      </div>

      <Tabs tabs={[
        { id:"basic", label:"Basic Info" },
        { id:"status", label:"Employment Status" },
        { id:"skills", label:"Skills" },
        { id:"experience", label:"Work History" },
        { id:"education", label:"Education" },
        { id:"certifications", label:"Certifications" },
        { id:"verification", label:"ID Verification" },
      ]} active={tab} onChange={setTab} />

      {/* ── Basic Info ── */}
      {tab === "basic" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <Card style={{ gridColumn:"1/-1" }}>
            <h3 style={{ margin:"0 0 16px", fontSize:16, fontWeight:700, color:C.navy }}>Contact Information</h3>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <Input label="Full Name" value={form.name} onChange={set("name")} required />
              <Input label="Email" type="email" value={form.email} onChange={set("email")} required />
              <Input label="Phone" value={form.phone} onChange={set("phone")} />
              <Input label="Location (City, State)" value={form.location} onChange={set("location")} placeholder="Charlotte, NC" />
            </div>
          </Card>

          <Card style={{ gridColumn:"1/-1" }}>
            <h3 style={{ margin:"0 0 16px", fontSize:16, fontWeight:700, color:C.navy }}>Professional Summary</h3>
            <Input textarea rows={4} value={form.summary} onChange={set("summary")} placeholder="Describe your background and what you're looking for…" />
          </Card>

          <Card>
            <h3 style={{ margin:"0 0 16px", fontSize:16, fontWeight:700, color:C.navy }}>Career Goals</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <Input label="Desired Job Titles" value={form.desiredTitles.join(", ")} onChange={v=>set("desiredTitles")(v.split(",").map(s=>s.trim()))} placeholder="Senior Engineer, Tech Lead" />
              <Input label="Industries of Interest" value={form.industries.join(", ")} onChange={v=>set("industries")(v.split(",").map(s=>s.trim()))} />
              <Select label="Availability" value={form.availability} onChange={set("availability")} options={[
                { value:"immediately", label:"Available immediately" },
                { value:"2weeks", label:"2 weeks notice" },
                { value:"1month", label:"1 month notice" },
                { value:"3months", label:"3+ months notice" },
                { value:"passive", label:"Passively looking" },
              ]} />
            </div>
          </Card>

          <Card>
            <h3 style={{ margin:"0 0 16px", fontSize:16, fontWeight:700, color:C.navy }}>Upload Resume</h3>
            <ResumeUploadZone user={user} onParsed={(parsed) => {
              if (onParsedResume) onParsedResume(parsed);
            }} />
          </Card>
        </div>
      )}

      {/* ── Employment Status ── */}
      {tab === "status" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <Card>
            <h3 style={{ margin:"0 0 16px", fontSize:16, fontWeight:700, color:C.navy }}>Employment Status</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[
                { value:"employed", label:"Currently Employed", icon:"💼" },
                { value:"unemployed", label:"Unemployed — Actively Seeking", icon:"🔍" },
                { value:"open", label:"Employed but Open to Opportunities", icon:"🌟" },
                { value:"browsing", label:"Just Browsing", icon:"👀" },
              ].map(o=>(
                <label key={o.value} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:10, border:`1.5px solid ${form.employmentStatus===o.value?C.teal:C.border}`, background:form.employmentStatus===o.value?C.tealLight:"#fff", cursor:"pointer" }}>
                  <input type="radio" name="empStatus" checked={form.employmentStatus===o.value} onChange={()=>set("employmentStatus")(o.value)} style={{ accentColor:C.teal }} />
                  <span style={{ fontSize:18 }}>{o.icon}</span>
                  <span style={{ fontSize:14, fontWeight:form.employmentStatus===o.value?600:400 }}>{o.label}</span>
                </label>
              ))}
            </div>
          </Card>

          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            <Card>
              <h3 style={{ margin:"0 0 16px", fontSize:16, fontWeight:700, color:C.navy }}>Salary Expectations</h3>
              <Select label="Experience Level" value={form.salaryLevel} onChange={set("salaryLevel")} options={Object.entries(SALARY_MAP).map(([v,d])=>({ value:v, label:d.label }))} />
              {form.salaryLevel === "custom" ? (
                <div style={{ marginTop:14 }}>
                  <Input label="Target Salary (e.g. $120,000)" value={form.salaryTarget} onChange={set("salaryTarget")} placeholder="$120,000" />
                </div>
              ) : (
                <div style={{ marginTop:12, padding:"12px 14px", background:C.tealLight, borderRadius:8 }}>
                  <div style={{ fontSize:12, color:C.tealDark, fontWeight:600, marginBottom:2 }}>AI Salary Recommendation</div>
                  <div style={{ fontSize:16, fontWeight:800, color:C.navy }}>{(SALARY_MAP[form.salaryLevel] || SALARY_MAP.senior).range}</div>
                  <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>Based on {form.salaryLevel} level in {form.location || "your region"}</div>
                </div>
              )}
            </Card>

            <Card>
              <h3 style={{ margin:"0 0 16px", fontSize:16, fontWeight:700, color:C.navy }}>Employment Type</h3>
              <CheckGroup options={[
                { value:"full-time", label:"Full-Time" },
                { value:"contract", label:"Contract" },
                { value:"temporary", label:"Temporary" },
                { value:"part-time", label:"Part-Time" },
              ]} value={form.employmentTypes} onChange={set("employmentTypes")} />
            </Card>

            <Card>
              <h3 style={{ margin:"0 0 16px", fontSize:16, fontWeight:700, color:C.navy }}>Work Location</h3>
              <CheckGroup options={[
                { value:"onsite", label:"On-Site" },
                { value:"remote", label:"Remote" },
                { value:"hybrid", label:"Hybrid" },
              ]} value={form.workLocations} onChange={set("workLocations")} />
            </Card>
          </div>

          <Card style={{ gridColumn:"1/-1" }}>
              <h3 style={{ margin:"0 0 16px", fontSize:16, fontWeight:700, color:C.navy }}>Overall Experience</h3>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
                <Input label="Total Years of Professional Experience" value={form.totalYearsExperience || ""} onChange={set("totalYearsExperience")} placeholder="e.g. 12" hint="Total across all roles" />
                <Input label="Total Years of Leadership Experience" value={form.totalYearsLeadership || ""} onChange={set("totalYearsLeadership")} placeholder="e.g. 5" hint="Managing teams or projects" />
                <Input label="Total Years of Industry Experience" value={form.totalYearsIndustry || ""} onChange={set("totalYearsIndustry")} placeholder="e.g. 8" hint="In your primary industry" />
              </div>
            </Card>
          <Card style={{ gridColumn:"1/-1" }}>
            <h3 style={{ margin:"0 0 16px", fontSize:16, fontWeight:700, color:C.navy }}>Background & Eligibility</h3>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
              <div style={{ padding:"14px 16px", borderRadius:10, border:`1.5px solid ${C.border}`, display:"flex", flexDirection:"column", gap:10 }}>
                <Toggle checked={form.backgroundCheck} onChange={v=>set("backgroundCheck")(v)} label="Can pass background check" />
                {form.backgroundCheck && <div style={{ fontSize:12, color:C.success, padding:"6px 10px", background:C.successBg, borderRadius:6 }}>✓ Background clear</div>}
              </div>
              <div style={{ padding:"14px 16px", borderRadius:10, border:`1.5px solid ${C.border}`, display:"flex", flexDirection:"column", gap:10 }}>
                <Toggle checked={form.wotcEligible} onChange={v=>set("wotcEligible")(v)} label="WOTC eligible" />
                {form.wotcEligible && <div style={{ fontSize:12, color:"#92600A", padding:"6px 10px", background:"#FFFBEB", borderRadius:6 }}>💰 May qualify for employer tax credits</div>}
              </div>
              <div style={{ padding:"14px 16px", borderRadius:10, border:`1.5px solid ${C.border}`, display:"flex", flexDirection:"column", gap:10 }}>
                <Toggle checked={form.sponsorshipRequired} onChange={v=>set("sponsorshipRequired")(v)} label="Requires work sponsorship" />
                {form.sponsorshipRequired
                  ? <div style={{ fontSize:12, color:C.textMuted, padding:"6px 10px", background:C.bg, borderRadius:6 }}>Requires H1-B or similar visa</div>
                  : <div style={{ fontSize:12, color:C.success, padding:"6px 10px", background:C.successBg, borderRadius:6 }}>✓ No sponsorship needed</div>
                }
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── Skills ── */}
      {tab === "skills" && (
        <Card>
          <SectionTitle sub="Skills are stored individually and used for employer search and AI matching." action={<Btn small onClick={() => setAddingSkill(!addingSkill)} icon="＋">Add Skill</Btn>}>Skills</SectionTitle>
          {addingSkill && (
            <div style={{ background:C.bg, borderRadius:10, padding:16, marginBottom:16, display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr auto", gap:12, alignItems:"end" }}>
              <Input label="Skill Name" value={newSkill.skill_name || ""} onChange={v => setNewSkill(s => ({...s, skill_name: v}))} placeholder="e.g. Salesforce" />
              <Input label="Years" value={newSkill.years_experience || ""} onChange={v => setNewSkill(s => ({...s, years_experience: v}))} placeholder="3" />
              <Select label="Level" value={newSkill.proficiency_level || "Intermediate"} onChange={v => setNewSkill(s => ({...s, proficiency_level: v}))} options={["Beginner","Intermediate","Advanced","Expert"].map(x => ({value:x, label:x}))} />
              <Input label="Category" value={newSkill.category || ""} onChange={v => setNewSkill(s => ({...s, category: v}))} placeholder="e.g. Technology" />
              <div style={{ display:"flex", gap:8 }}>
                <Btn small onClick={() => {
                  if (newSkill.skill_name?.trim()) {
                    setSkills(s => [...s, { id: `new_${Date.now()}`, ...newSkill, source: "manual" }]);
                    setNewSkill({ skill_name:"", years_experience:"", proficiency_level:"Intermediate", category:"" });
                    setAddingSkill(false);
                  }
                }}>Add</Btn>
                <Btn small variant="secondary" onClick={() => setAddingSkill(false)}>×</Btn>
              </div>
            </div>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {skills.length === 0 && (
              <div style={{ textAlign:"center", padding:"24px", color:C.textMuted, fontSize:14 }}>
                No skills yet. Add skills manually or upload your resume to auto-populate.
              </div>
            )}
            {skills.map((sk, i) => {
              const lvlMap = { Beginner:25, Intermediate:50, Advanced:75, Expert:100 };
              return (
                <div key={sk.id || i} style={{ display:"flex", alignItems:"center", gap:16, padding:"12px 16px", background:C.bg, borderRadius:10 }}>
                  <div style={{ flex:2, minWidth:100 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:C.navy }}>{sk.skill_name}</div>
                    {sk.category && <div style={{ fontSize:12, color:C.textMuted }}>{sk.category}</div>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, color:C.textMuted, marginBottom:4 }}>
                      {sk.years_experience ? `${sk.years_experience} yr${sk.years_experience !== 1 ? "s" : ""}` : "Years unknown"}
                    </div>
                    <ProgressBar value={lvlMap[sk.proficiency_level] || 50} max={100} />
                  </div>
                  <Badge color={sk.proficiency_level === "Expert" ? "teal" : "navy"}>{sk.proficiency_level || "Unknown"}</Badge>
                  <button onClick={() => setSkills(s => s.filter((_, j) => j !== i))} style={{ background:"none", border:"none", cursor:"pointer", color:C.danger, fontSize:16, padding:4 }}>✕</button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Work History ── */}
      {tab === "experience" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {work.length === 0 && (
            <div style={{ textAlign:"center", padding:"24px", color:C.textMuted, fontSize:14 }}>
              No work history yet. Add jobs manually or upload your resume.
            </div>
          )}
          {work.map((w, i) => (
            <Card key={w.id || i}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
                <Input label="Job Title" value={w.job_title || ""} onChange={v => setWork(ws => ws.map((x, j) => j === i ? {...x, job_title: v} : x))} />
                <Input label="Company" value={w.company || ""} onChange={v => setWork(ws => ws.map((x, j) => j === i ? {...x, company: v} : x))} />
                <Input label="Start Date" type="date" value={w.start_date || ""} onChange={v => setWork(ws => ws.map((x, j) => j === i ? {...x, start_date: v} : x))} />
                <div>
                  {w.is_current ? (
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:24 }}>
                      <input type="checkbox" checked onChange={() => setWork(ws => ws.map((x, j) => j === i ? {...x, is_current: false} : x))} style={{ accentColor: C.teal }} />
                      <label style={{ fontSize:13, color:C.slate }}>Currently working here</label>
                    </div>
                  ) : (
                    <Input label="End Date" type="date" value={w.end_date || ""} onChange={v => setWork(ws => ws.map((x, j) => j === i ? {...x, end_date: v} : x))} />
                  )}
                </div>
                <Input label="Industry" value={w.industry || ""} onChange={v => setWork(ws => ws.map((x, j) => j === i ? {...x, industry: v} : x))} placeholder="e.g. Technology, Healthcare" />
                <Input label="Location" value={w.location || ""} onChange={v => setWork(ws => ws.map((x, j) => j === i ? {...x, location: v} : x))} placeholder="City, State" />
              </div>
              <Input label="Description & Achievements" textarea rows={3} value={w.description || ""} onChange={v => setWork(ws => ws.map((x, j) => j === i ? {...x, description: v} : x))} />
              <div style={{ display:"flex", alignItems:"center", gap:16, marginTop:12 }}>
                <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, cursor:"pointer" }}>
                  <input type="checkbox" checked={w.is_leadership || false} onChange={e => setWork(ws => ws.map((x, j) => j === i ? {...x, is_leadership: e.target.checked} : x))} style={{ accentColor: C.teal }} />
                  Leadership role
                </label>
                <button onClick={() => setWork(ws => ws.filter((_, j) => j !== i))} style={{ background:"none", border:"none", cursor:"pointer", color:C.danger, fontSize:13 }}>Remove</button>
              </div>
            </Card>
          ))}
          <Btn variant="secondary" onClick={() => setWork(ws => [...ws, { id:`new_${Date.now()}`, job_title:"", company:"", start_date:"", end_date:"", is_current:false, description:"", industry:"", location:"", is_leadership:false, source:"manual" }])} icon="＋">
            Add Work Experience
          </Btn>
        </div>
      )}

      {/* ── Education ── */}
      {tab === "education" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <Card style={{ background:C.bg }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <Select label="Highest Education Level" value={form.highestEducationLevel || ""} onChange={set("highestEducationLevel")} options={[
                { value:"", label:"Select..." },
                { value:"High School", label:"High School / GED" },
                { value:"Trade School", label:"Trade School / Vocational" },
                { value:"Associate Degree", label:"Associate Degree" },
                { value:"Bachelor's Degree", label:"Bachelor's Degree" },
                { value:"Master's Degree", label:"Master's Degree" },
                { value:"MBA", label:"MBA" },
                { value:"Doctorate", label:"Doctorate / Ph.D" },
                { value:"Professional Certification", label:"Professional Certification" },
                { value:"Other", label:"Other" },
              ]} hint="Used for employer search and ATS matching" />
            </div>
          </Card>
          {education.length === 0 && (
            <div style={{ textAlign:"center", padding:"24px", color:C.textMuted, fontSize:14 }}>
              No education entries yet. Add manually or upload your resume.
            </div>
          )}
          {education.map((e, i) => (
            <Card key={e.id || i}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr auto", gap:16, alignItems:"end" }}>
                <Input label="Degree / Program" value={e.degree || ""} onChange={v => setEducation(eds => eds.map((x, j) => j === i ? {...x, degree: v} : x))} />
                <Input label="Major / Field of Study" value={e.major || ""} onChange={v => setEducation(eds => eds.map((x, j) => j === i ? {...x, major: v} : x))} />
                <Input label="Institution" value={e.institution || ""} onChange={v => setEducation(eds => eds.map((x, j) => j === i ? {...x, institution: v} : x))} />
                <Input label="Grad Year" value={e.graduation_year || ""} onChange={v => setEducation(eds => eds.map((x, j) => j === i ? {...x, graduation_year: v} : x))} placeholder="2018" />
                <button onClick={() => setEducation(eds => eds.filter((_, j) => j !== i))} style={{ background:"none", border:"none", cursor:"pointer", color:C.danger, fontSize:20 }}>✕</button>
              </div>
            </Card>
          ))}
          <Btn variant="secondary" onClick={() => setEducation(eds => [...eds, { id:`new_${Date.now()}`, degree:"", major:"", institution:"", graduation_year:"", source:"manual" }])} icon="＋">
            Add Education
          </Btn>
        </div>
      )}

      {/* ── ID Verification ── */}
      {tab === "certifications" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {(profileCerts || []).length === 0 && (
            <div style={{ textAlign:"center", padding:"24px", color:C.textMuted, fontSize:14 }}>
              No certifications yet. Add manually or upload your resume.
            </div>
          )}
          {(profileCerts || []).map((c, i) => (
            <Card key={c.id || i}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr auto", gap:16, alignItems:"end" }}>
                <Input label="Certification Name" value={c.name || ""} onChange={v => setProfileCerts(cs => cs.map((x, j) => j === i ? {...x, name: v} : x))} placeholder="e.g. AWS Cloud Practitioner" />
                <Input label="Issuing Organization" value={c.issuing_org || ""} onChange={v => setProfileCerts(cs => cs.map((x, j) => j === i ? {...x, issuing_org: v} : x))} placeholder="e.g. Amazon" />
                <Input label="Issue Date" type="date" value={c.issue_date || ""} onChange={v => setProfileCerts(cs => cs.map((x, j) => j === i ? {...x, issue_date: v} : x))} />
                <Input label="Expiry Date" type="date" value={c.expiry_date || ""} onChange={v => setProfileCerts(cs => cs.map((x, j) => j === i ? {...x, expiry_date: v} : x))} />
                <button onClick={() => setProfileCerts(cs => cs.filter((_, j) => j !== i))} style={{ background:"none", border:"none", cursor:"pointer", color:C.danger, fontSize:20 }}>✕</button>
              </div>
            </Card>
          ))}
          <Btn variant="secondary" onClick={() => setProfileCerts(cs => [...(cs || []), { id:`new_${Date.now()}`, name:"", issuing_org:"", issue_date:"", expiry_date:"", source:"manual" }])} icon="＋">
            Add Certification
          </Btn>
        </div>
      )}

      {tab === "verification" && (
        <VerificationTab user={user} onUpdateUser={onUpdateUser} />
      )}
    </div>
  );
}

