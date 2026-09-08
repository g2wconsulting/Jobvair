/**
 * assess.jsx — Jobvair Assess
 * Employer portal + Candidate assessment player
 * Entry: assess-main.jsx → assess.html
 */

import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";

// ── Design tokens ──────────────────────────────────────────────────────────
const A = {
  bg:         "#F7F8FA",
  bgCard:     "#FFFFFF",
  bgDark:     "#0D1117",
  border:     "#E4E7EC",
  navy:       "#1A2B4A",
  blue:       "#1D4ED8",
  blueLight:  "#EFF6FF",
  teal:       "#0D9488",
  tealLight:  "#F0FDFA",
  green:      "#059669",
  greenLight: "#ECFDF5",
  amber:      "#D97706",
  amberLight: "#FFFBEB",
  red:        "#DC2626",
  redLight:   "#FEF2F2",
  purple:     "#7C3AED",
  purpleLight:"#F5F3FF",
  text:       "#111827",
  textMuted:  "#6B7280",
  textLight:  "#9CA3AF",
  white:      "#FFFFFF",
};

const sans = "'Inter', 'DM Sans', system-ui, sans-serif";
const mono = "'JetBrains Mono', 'Fira Code', monospace";

// ── Tiny shared components ─────────────────────────────────────────────────
const Card = ({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{ background:A.bgCard, border:`1px solid ${A.border}`, borderRadius:12, padding:24, ...style, cursor:onClick?"pointer":"default" }}>{children}</div>
);

const Btn = ({ children, onClick, variant="primary", small, disabled, full, icon }) => {
  const base = { display:"inline-flex", alignItems:"center", gap:6, padding:small?"7px 14px":"10px 20px", borderRadius:8, fontSize:small?12:14, fontWeight:600, cursor:disabled?"not-allowed":"pointer", opacity:disabled?0.5:1, border:"none", fontFamily:sans, transition:"all 0.15s", width:full?"100%":undefined, justifyContent:full?"center":undefined };
  const v = { primary:{background:A.blue,color:"#fff"}, secondary:{background:"transparent",color:A.text,border:`1px solid ${A.border}`}, success:{background:A.green,color:"#fff"}, danger:{background:A.redLight,color:A.red,border:`1px solid ${A.red}44`}, ghost:{background:"transparent",color:A.textMuted} };
  return <button onClick={disabled?undefined:onClick} style={{...base,...(v[variant]||v.primary)}}>{icon&&<span>{icon}</span>}{children}</button>;
};

const Badge = ({ children, color="blue" }) => {
  const colors = { blue:[A.blue,"#EFF6FF"], green:[A.green,A.greenLight], amber:[A.amber,A.amberLight], red:[A.red,A.redLight], purple:[A.purple,A.purpleLight], gray:[A.textMuted,"#F3F4F6"], teal:[A.teal,A.tealLight] };
  const [fg,bg] = colors[color]||colors.blue;
  return <span style={{ display:"inline-flex",alignItems:"center",padding:"2px 8px",borderRadius:99,background:bg,color:fg,fontSize:11,fontWeight:600,border:`1px solid ${fg}33` }}>{children}</span>;
};

const Input = ({ label, value, onChange, placeholder, type="text", hint, textarea, rows=3 }) => (
  <div>
    {label && <div style={{ fontSize:12,color:A.textMuted,marginBottom:5,fontWeight:500 }}>{label}</div>}
    {textarea
      ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ width:"100%",padding:"9px 12px",border:`1px solid ${A.border}`,borderRadius:8,fontSize:13,fontFamily:sans,outline:"none",resize:"vertical",boxSizing:"border-box",lineHeight:1.6 }} />
      : <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{ width:"100%",padding:"9px 12px",border:`1px solid ${A.border}`,borderRadius:8,fontSize:13,fontFamily:sans,outline:"none",boxSizing:"border-box" }} />
    }
    {hint && <div style={{ fontSize:11,color:A.textLight,marginTop:3 }}>{hint}</div>}
  </div>
);

const Stat = ({ label, value, color=A.blue, icon }) => (
  <Card style={{ padding:20 }}>
    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
      <div>
        <div style={{ fontSize:12,color:A.textMuted,marginBottom:6,fontWeight:500 }}>{label}</div>
        <div style={{ fontSize:28,fontWeight:800,color,fontFamily:mono }}>{value??0}</div>
      </div>
      {icon && <div style={{ fontSize:24,opacity:0.7 }}>{icon}</div>}
    </div>
  </Card>
);

// ── Assessment library data ────────────────────────────────────────────────
const ASSESSMENT_LIBRARY = [
  { id:"typing",          name:"Typing",                    icon:"⌨️",  category:"Core Skills",      minutes:10, questions:1,  description:"Measures words per minute, accuracy, and consistency. Industry-standard WPM tracking with error analysis.", competencies:["Speed","Accuracy","Consistency"], color:"blue" },
  { id:"data-entry",      name:"Data Entry",                icon:"📋",  category:"Core Skills",      minutes:15, questions:20, description:"Tests speed and accuracy entering structured records including names, dates, addresses, and numeric data.", competencies:["Accuracy","Speed","Attention to Detail"], color:"blue" },
  { id:"excel",           name:"Microsoft Excel",           icon:"📊",  category:"Microsoft Office", minutes:25, questions:25, description:"Covers formulas, functions, pivot tables, charts, and data analysis. From SUM to XLOOKUP.", competencies:["Formulas","Data Analysis","Formatting"], color:"green" },
  { id:"word",            name:"Microsoft Word",            icon:"📝",  category:"Microsoft Office", minutes:20, questions:20, description:"Tests document formatting, styles, mail merge, tables, and professional document production.", competencies:["Formatting","Document Structure","Collaboration"], color:"green" },
  { id:"powerpoint",      name:"Microsoft PowerPoint",      icon:"📑",  category:"Microsoft Office", minutes:20, questions:20, description:"Assesses slide design, animation, transitions, and effective visual communication.", competencies:["Design","Presentation","Visual Communication"], color:"green" },
  { id:"reading",         name:"Reading Comprehension",     icon:"📖",  category:"Communication",    minutes:20, questions:15, description:"Evaluates ability to understand, analyze, and draw conclusions from written professional content.", competencies:["Comprehension","Analysis","Critical Thinking"], color:"purple" },
  { id:"grammar",         name:"Grammar and Spelling",      icon:"✍️",  category:"Communication",    minutes:15, questions:20, description:"Tests grammar, punctuation, spelling, and sentence structure in professional written context.", competencies:["Grammar","Spelling","Punctuation"], color:"purple" },
  { id:"writing",         name:"Written Communication",     icon:"✉️",  category:"Communication",    minutes:20, questions:3,  description:"AI-scored workplace writing scenarios. Candidates draft professional emails and responses.", competencies:["Clarity","Professionalism","Organization"], color:"purple" },
  { id:"data-analysis",   name:"Data Analysis",             icon:"📈",  category:"Analytical",       minutes:25, questions:20, description:"Presents tables, charts, and business scenarios requiring interpretation and numerical reasoning.", competencies:["Analysis","Interpretation","Decision Making"], color:"amber" },
  { id:"admin",           name:"Administrative Skills",     icon:"🗂️",  category:"Professional",     minutes:20, questions:20, description:"Covers scheduling, correspondence, records management, and office procedures.", competencies:["Organization","Procedures","Communication"], color:"teal" },
  { id:"workplace",       name:"Workplace Competencies",    icon:"🤝",  category:"Professional",     minutes:20, questions:20, description:"Situational judgment scenarios covering teamwork, problem-solving, and professional conduct.", competencies:["Judgment","Teamwork","Professionalism"], color:"teal" },
  { id:"ai-literacy",     name:"AI Literacy",               icon:"🤖",  category:"Technology",       minutes:15, questions:15, description:"Assesses understanding of AI tools, appropriate use, limitations, privacy, and verification.", competencies:["AI Concepts","Responsible Use","Critical Evaluation"], color:"blue" },
  { id:"legal-knowledge", name:"Legal / Job Knowledge",     icon:"⚖️",  category:"Specialized",      minutes:25, questions:25, description:"Position-specific legal and regulatory knowledge relevant to the role.", competencies:["Compliance","Regulations","Procedures"], color:"red" },
  { id:"it-support",      name:"IT Support Fundamentals",   icon:"💻",  category:"Technology",       minutes:20, questions:20, description:"Tests troubleshooting, hardware/software knowledge, and customer service in technical contexts.", competencies:["Troubleshooting","Technical Knowledge","Support"], color:"blue" },
];

const BUNDLES = [
  { id:"admin-package",    name:"Administrative Skills Package", icon:"📦", description:"Complete assessment for administrative and clerical roles.", assessments:["typing","data-entry","word","excel","grammar","writing"], color:"teal" },
  { id:"office-suite",     name:"Microsoft Office Suite",        icon:"💼", description:"Full Microsoft Office competency assessment.", assessments:["excel","word","powerpoint"], color:"green" },
  { id:"communication",    name:"Professional Communication",    icon:"💬", description:"Writing, grammar, reading, and workplace scenarios.", assessments:["writing","grammar","reading","workplace"], color:"purple" },
  { id:"tech-essentials",  name:"Technology Essentials",         icon:"⚡", description:"AI literacy, IT support, and digital competencies.", assessments:["ai-literacy","it-support","excel"], color:"blue" },
  { id:"full-package",     name:"Full Assessment Package",       icon:"🎯", description:"Comprehensive assessment covering all core competency areas.", assessments:["typing","data-entry","excel","word","grammar","writing","workplace","ai-literacy"], color:"blue" },
];

const categoryColors = { "Core Skills":"blue","Microsoft Office":"green","Communication":"purple","Analytical":"amber","Professional":"teal","Technology":"blue","Specialized":"red" };

// ── Employer Login ─────────────────────────────────────────────────────────
function EmployerLogin({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [mode, setMode]         = useState("login"); // login | register

  const submit = async () => {
    if (!email || !password) { setError("Email and password required."); return; }
    setLoading(true); setError("");
    if (mode === "login") {
      const { data, error: e } = await supabase.auth.signInWithPassword({ email, password });
      if (e) { setError(e.message); setLoading(false); return; }
      onLogin(data.user);
    } else {
      const { data, error: e } = await supabase.auth.signUp({ email, password });
      if (e) { setError(e.message); setLoading(false); return; }
      onLogin(data.user);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:A.bgDark, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:sans }}>
      <div style={{ width:400 }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:10, marginBottom:8 }}>
            <div style={{ width:36, height:36, borderRadius:8, background:A.blue, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>📋</div>
            <span style={{ fontSize:22, fontWeight:800, color:"#fff", letterSpacing:"-0.02em" }}>Jobvair Assess</span>
          </div>
          <div style={{ fontSize:13, color:"#6B7280" }}>Employer Assessment Portal</div>
        </div>
        <Card>
          <div style={{ fontSize:17, fontWeight:700, color:A.text, marginBottom:4 }}>{mode==="login"?"Sign in":"Create account"}</div>
          <div style={{ fontSize:13, color:A.textMuted, marginBottom:20 }}>Employer access only</div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <Input label="Work Email" value={email} onChange={setEmail} placeholder="you@company.com" type="email" />
            <Input label="Password" value={password} onChange={setPassword} placeholder="••••••••" type="password" />
            {error && <div style={{ padding:"9px 12px", background:A.redLight, borderRadius:7, fontSize:13, color:A.red }}>{error}</div>}
            <Btn full onClick={submit} disabled={loading}>{loading ? "Please wait…" : mode==="login" ? "Sign in" : "Create account"}</Btn>
          </div>
          <div style={{ textAlign:"center", marginTop:16, fontSize:13, color:A.textMuted }}>
            {mode==="login" ? "New employer? " : "Already have an account? "}
            <button onClick={()=>setMode(mode==="login"?"register":"login")} style={{ background:"none", border:"none", color:A.blue, cursor:"pointer", fontSize:13, fontFamily:sans, fontWeight:600 }}>
              {mode==="login" ? "Create account" : "Sign in"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Assessment Library ─────────────────────────────────────────────────────
function LibraryPage({ onSend }) {
  const [selected, setSelected]     = useState(new Set());
  const [viewMode, setViewMode]     = useState("assessments"); // assessments | bundles
  const [filterCat, setFilterCat]   = useState("all");
  const [search, setSearch]         = useState("");

  const categories = ["all", ...new Set(ASSESSMENT_LIBRARY.map(a => a.category))];

  const filtered = ASSESSMENT_LIBRARY.filter(a => {
    const matchCat = filterCat === "all" || a.category === filterCat;
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const toggleSelect = (id) => {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const selectBundle = (bundle) => {
    setSelected(new Set(bundle.assessments));
    setViewMode("assessments");
  };

  const selectAll = () => setSelected(new Set(ASSESSMENT_LIBRARY.map(a => a.id)));
  const clearAll  = () => setSelected(new Set());

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:24, fontWeight:800, color:A.navy, marginBottom:4 }}>Assessment Library</h1>
        <p style={{ fontSize:14, color:A.textMuted, margin:0 }}>Select assessments to send to candidates. Choose individual tests or use a pre-built bundle.</p>
      </div>

      {/* Controls */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, gap:12, flexWrap:"wrap" }}>
        <div style={{ display:"flex", gap:0, border:`1px solid ${A.border}`, borderRadius:8, overflow:"hidden" }}>
          {["assessments","bundles"].map(m => (
            <button key={m} onClick={()=>setViewMode(m)} style={{ padding:"8px 20px", border:"none", fontSize:13, fontFamily:sans, background:viewMode===m?A.blue:"transparent", color:viewMode===m?"#fff":A.text, fontWeight:viewMode===m?700:400, cursor:"pointer" }}>
              {m === "assessments" ? `Individual (${ASSESSMENT_LIBRARY.length})` : `Bundles (${BUNDLES.length})`}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", gap:8, flex:1, maxWidth:400 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search assessments…" style={{ flex:1, padding:"8px 12px", border:`1px solid ${A.border}`, borderRadius:8, fontSize:13, fontFamily:sans, outline:"none" }} />
        </div>
      </div>

      {/* Category filter */}
      {viewMode === "assessments" && (
        <div style={{ display:"flex", gap:6, marginBottom:20, flexWrap:"wrap" }}>
          {categories.map(cat => (
            <button key={cat} onClick={()=>setFilterCat(cat)} style={{ padding:"5px 12px", borderRadius:99, border:`1px solid ${filterCat===cat?A.blue:A.border}`, background:filterCat===cat?A.blueLight:"transparent", fontSize:12, fontFamily:sans, color:filterCat===cat?A.blue:A.textMuted, fontWeight:filterCat===cat?600:400, cursor:"pointer" }}>
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>
      )}

      {/* Select all / clear */}
      {viewMode === "assessments" && (
        <div style={{ display:"flex", gap:8, marginBottom:16, alignItems:"center" }}>
          <button onClick={selectAll} style={{ background:"none", border:`1px solid ${A.border}`, borderRadius:6, padding:"5px 12px", fontSize:12, cursor:"pointer", fontFamily:sans, color:A.text }}>Select All</button>
          {selected.size > 0 && <button onClick={clearAll} style={{ background:"none", border:`1px solid ${A.border}`, borderRadius:6, padding:"5px 12px", fontSize:12, cursor:"pointer", fontFamily:sans, color:A.textMuted }}>Clear</button>}
          {selected.size > 0 && <span style={{ fontSize:13, color:A.textMuted }}>{selected.size} selected</span>}
        </div>
      )}

      {/* Assessment cards */}
      {viewMode === "assessments" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:14, marginBottom:24 }}>
          {filtered.map(a => {
            const isSelected = selected.has(a.id);
            return (
              <div key={a.id} onClick={()=>toggleSelect(a.id)}
                style={{ border:`2px solid ${isSelected?A.blue:A.border}`, borderRadius:12, padding:18, cursor:"pointer", transition:"all 0.15s", background:isSelected?A.blueLight:A.bgCard }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:24 }}>{a.icon}</span>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:A.navy }}>{a.name}</div>
                      <div style={{ fontSize:11, color:A.textMuted, marginTop:1 }}>{a.category}</div>
                    </div>
                  </div>
                  <div style={{ width:20, height:20, borderRadius:4, border:`2px solid ${isSelected?A.blue:A.border}`, background:isSelected?A.blue:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    {isSelected && <span style={{ color:"#fff", fontSize:12, fontWeight:700 }}>✓</span>}
                  </div>
                </div>
                <p style={{ fontSize:12, color:A.textMuted, margin:"0 0 10px", lineHeight:1.5 }}>{a.description}</p>
                <div style={{ display:"flex", gap:12, fontSize:12, color:A.textLight }}>
                  <span>⏱ {a.minutes} min</span>
                  <span>❓ {a.questions} {a.questions===1?"task":"questions"}</span>
                </div>
                <div style={{ display:"flex", gap:4, marginTop:8, flexWrap:"wrap" }}>
                  {a.competencies.map(c => <Badge key={c} color={categoryColors[a.category]||"blue"}>{c}</Badge>)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bundle cards */}
      {viewMode === "bundles" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(340px, 1fr))", gap:14, marginBottom:24 }}>
          {BUNDLES.map(b => (
            <Card key={b.id} style={{ cursor:"pointer" }} onClick={()=>selectBundle(b)}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <span style={{ fontSize:28 }}>{b.icon}</span>
                <div>
                  <div style={{ fontSize:15, fontWeight:700, color:A.navy }}>{b.name}</div>
                  <div style={{ fontSize:11, color:A.textMuted }}>{b.assessments.length} assessments</div>
                </div>
              </div>
              <p style={{ fontSize:13, color:A.textMuted, margin:"0 0 12px", lineHeight:1.5 }}>{b.description}</p>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:14 }}>
                {b.assessments.map(id => {
                  const a = ASSESSMENT_LIBRARY.find(x=>x.id===id);
                  return a ? <Badge key={id} color="gray">{a.icon} {a.name}</Badge> : null;
                })}
              </div>
              <Btn small onClick={e=>{e.stopPropagation();selectBundle(b);}}>Select Bundle</Btn>
            </Card>
          ))}
        </div>
      )}

      {/* Send bar */}
      {selected.size > 0 && (
        <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"#fff", borderTop:`1px solid ${A.border}`, padding:"14px 32px", display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:"0 -4px 20px rgba(0,0,0,0.08)", zIndex:100 }}>
          <div>
            <span style={{ fontSize:14, fontWeight:700, color:A.navy }}>{selected.size} assessment{selected.size!==1?"s":""} selected</span>
            <span style={{ fontSize:13, color:A.textMuted, marginLeft:8 }}>
              {ASSESSMENT_LIBRARY.filter(a=>selected.has(a.id)).map(a=>a.name).join(", ").slice(0,80)}{selected.size>3?"…":""}
            </span>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <Btn variant="secondary" onClick={clearAll}>Clear</Btn>
            <Btn onClick={()=>onSend([...selected])}>Send to Candidates →</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Send Assessment Flow ───────────────────────────────────────────────────
function SendAssessmentPage({ selectedIds, onBack, onSent }) {
  const assessments = ASSESSMENT_LIBRARY.filter(a => selectedIds.includes(a.id));
  const [candidates, setCandidates] = useState([{ first:"", last:"", email:"", job:"" }]);
  const [dueDate, setDueDate]       = useState("");
  const [sending, setSending]       = useState(false);
  const [sent, setSent]             = useState(false);
  const [error, setError]           = useState(null);

  const addCandidate = () => setCandidates(c => [...c, { first:"", last:"", email:"", job:"" }]);
  const removeCandidate = (i) => setCandidates(c => c.filter((_,j)=>j!==i));
  const updateCandidate = (i, field, val) => setCandidates(c => c.map((x,j) => j===i ? {...x,[field]:val} : x));

  const totalMinutes = assessments.reduce((sum,a) => sum+a.minutes, 0);

  const send = async () => {
    const valid = candidates.filter(c => c.email.trim() && c.first.trim());
    if (!valid.length) { setError("Add at least one candidate with first name and email."); return; }
    setSending(true); setError(null);
    // In production: call Edge Function to create invitations + send emails
    // For now: simulate success
    await new Promise(r => setTimeout(r, 1500));
    setSent(true);
    setSending(false);
  };

  if (sent) return (
    <div style={{ maxWidth:540, margin:"60px auto", textAlign:"center" }}>
      <div style={{ fontSize:56, marginBottom:20 }}>✅</div>
      <h2 style={{ fontSize:24, fontWeight:800, color:A.navy, marginBottom:8 }}>Invitations Sent</h2>
      <p style={{ fontSize:15, color:A.textMuted, marginBottom:28 }}>
        {candidates.filter(c=>c.email).length} candidate{candidates.filter(c=>c.email).length!==1?"s have":"has"} been invited to complete {assessments.length} assessment{assessments.length!==1?"s":""}.
      </p>
      <p style={{ fontSize:13, color:A.textMuted, marginBottom:28 }}>They will receive an email with a secure link. You can track progress in the Results tab.</p>
      <Btn onClick={onSent}>View Sent Assessments</Btn>
    </div>
  );

  return (
    <div style={{ maxWidth:760 }}>
      <button onClick={onBack} style={{ background:"none",border:"none",cursor:"pointer",fontSize:13,color:A.textMuted,fontFamily:sans,marginBottom:20,padding:0,display:"flex",alignItems:"center",gap:6 }}>← Back to Library</button>
      <h1 style={{ fontSize:22, fontWeight:800, color:A.navy, marginBottom:4 }}>Send Assessment</h1>
      <p style={{ fontSize:13, color:A.textMuted, marginBottom:24 }}>Review selected assessments and add candidates below.</p>

      {/* Selected assessments summary */}
      <Card style={{ marginBottom:20 }}>
        <div style={{ fontSize:13, fontWeight:700, color:A.navy, marginBottom:12 }}>Selected Assessments ({assessments.length})</div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {assessments.map(a => (
            <div key={a.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:A.bg, borderRadius:8 }}>
              <span style={{ fontSize:18 }}>{a.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:A.navy }}>{a.name}</div>
                <div style={{ fontSize:11, color:A.textMuted }}>{a.minutes} min · {a.questions} {a.questions===1?"task":"questions"}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:12, padding:"8px 12px", background:A.blueLight, borderRadius:8, fontSize:13, color:A.blue, fontWeight:600 }}>
          Total estimated time: ~{totalMinutes} minutes
        </div>
      </Card>

      {/* Due date */}
      <Card style={{ marginBottom:20 }}>
        <div style={{ fontSize:13, fontWeight:700, color:A.navy, marginBottom:12 }}>Due Date (optional)</div>
        <Input type="date" value={dueDate} onChange={setDueDate} hint="Candidates will see this deadline. Invitations expire at midnight on the due date." />
      </Card>

      {/* Candidates */}
      <Card style={{ marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ fontSize:13, fontWeight:700, color:A.navy }}>Candidates</div>
          <Btn small variant="secondary" onClick={addCandidate} icon="＋">Add Another</Btn>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {candidates.map((c, i) => (
            <div key={i} style={{ padding:14, background:A.bg, borderRadius:10, position:"relative" }}>
              {candidates.length > 1 && (
                <button onClick={()=>removeCandidate(i)} style={{ position:"absolute",top:10,right:10,background:"none",border:"none",cursor:"pointer",fontSize:14,color:A.textMuted,padding:4 }}>✕</button>
              )}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <Input label="First Name *" value={c.first} onChange={v=>updateCandidate(i,"first",v)} placeholder="Jane" />
                <Input label="Last Name" value={c.last} onChange={v=>updateCandidate(i,"last",v)} placeholder="Smith" />
                <Input label="Email Address *" value={c.email} onChange={v=>updateCandidate(i,"email",v)} placeholder="jane@email.com" type="email" />
                <Input label="Job / Requisition" value={c.job} onChange={v=>updateCandidate(i,"job",v)} placeholder="Administrative Specialist" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {error && <div style={{ marginBottom:14, padding:"10px 14px", background:A.redLight, borderRadius:8, fontSize:13, color:A.red }}>{error}</div>}

      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        <Btn variant="secondary" onClick={onBack}>Cancel</Btn>
        <Btn onClick={send} disabled={sending}>{sending ? "Sending…" : `Send to ${candidates.filter(c=>c.email).length || 1} Candidate${candidates.filter(c=>c.email).length!==1?"s":""}`}</Btn>
      </div>
    </div>
  );
}

// ── Results Dashboard ──────────────────────────────────────────────────────
function ResultsPage() {
  // Mock data — in production loads from assessment_invitations + assessment_scores
  const mockResults = [
    { id:1, candidate:"Sarah Johnson", email:"sarah@example.com", assessment:"Administrative Skills Package", score:87, passed:true, status:"completed", date:"2025-06-03", time:82 },
    { id:2, candidate:"Marcus Williams", email:"marcus@example.com", assessment:"Typing", score:92, passed:true, status:"completed", date:"2025-06-04", time:12 },
    { id:3, candidate:"Aisha Patel", email:"aisha@example.com", assessment:"Microsoft Excel", score:64, passed:false, status:"completed", date:"2025-06-04", time:28 },
    { id:4, candidate:"Jordan Lee", email:"jordan@example.com", assessment:"Administrative Skills Package", score:null, passed:null, status:"in_progress", date:"2025-06-05", time:null },
    { id:5, candidate:"Taylor Brooks", email:"taylor@example.com", assessment:"Written Communication", score:null, passed:null, status:"sent", date:"2025-06-05", time:null },
  ];

  const [selected, setSelected] = useState(null);

  const statusColor = { completed:"green", in_progress:"amber", sent:"gray", started:"blue", expired:"red" };
  const statusLabel = { completed:"Completed", in_progress:"In Progress", sent:"Invited", started:"Started", expired:"Expired" };

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:24, fontWeight:800, color:A.navy, marginBottom:4 }}>Results</h1>
        <p style={{ fontSize:14, color:A.textMuted, margin:0 }}>Track assessment progress and view candidate scores.</p>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        <Stat label="Total Sent" value={mockResults.length} icon="📨" color={A.blue} />
        <Stat label="Completed" value={mockResults.filter(r=>r.status==="completed").length} icon="✅" color={A.green} />
        <Stat label="In Progress" value={mockResults.filter(r=>r.status==="in_progress").length} icon="⏳" color={A.amber} />
        <Stat label="Avg Score" value={Math.round(mockResults.filter(r=>r.score).reduce((s,r)=>s+r.score,0)/mockResults.filter(r=>r.score).length)+"%"} icon="📊" color={A.purple} />
      </div>

      {/* Table */}
      <Card style={{ padding:0, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead>
            <tr style={{ background:A.bg }}>
              {["Candidate","Assessment","Score","Status","Date","Actions"].map(h => (
                <th key={h} style={{ padding:"12px 16px", textAlign:"left", color:A.textMuted, fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:"0.04em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockResults.map(r => (
              <tr key={r.id} style={{ borderTop:`1px solid ${A.border}` }}>
                <td style={{ padding:"14px 16px" }}>
                  <div style={{ fontWeight:600, color:A.navy }}>{r.candidate}</div>
                  <div style={{ fontSize:11, color:A.textMuted }}>{r.email}</div>
                </td>
                <td style={{ padding:"14px 16px", color:A.text }}>{r.assessment}</td>
                <td style={{ padding:"14px 16px" }}>
                  {r.score != null
                    ? <span style={{ fontWeight:700, color:r.passed?A.green:A.red, fontFamily:mono }}>{r.score}%</span>
                    : <span style={{ color:A.textLight }}>—</span>
                  }
                  {r.passed != null && <span style={{ marginLeft:6 }}>{r.passed ? <Badge color="green">Pass</Badge> : <Badge color="red">Below Threshold</Badge>}</span>}
                </td>
                <td style={{ padding:"14px 16px" }}><Badge color={statusColor[r.status]||"gray"}>{statusLabel[r.status]||r.status}</Badge></td>
                <td style={{ padding:"14px 16px", color:A.textMuted, fontSize:12 }}>{r.date}</td>
                <td style={{ padding:"14px 16px" }}>
                  <div style={{ display:"flex", gap:6 }}>
                    {r.status === "completed" && <Btn small variant="secondary" onClick={()=>setSelected(r)}>View</Btn>}
                    {r.status !== "completed" && <Btn small variant="secondary">Resend</Btn>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Result detail modal */}
      {selected && (
        <div style={{ position:"fixed", inset:0, background:"#00000088", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
          <div style={{ width:560, background:"#fff", borderRadius:16, padding:28, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div>
                <div style={{ fontSize:17, fontWeight:800, color:A.navy }}>{selected.candidate}</div>
                <div style={{ fontSize:13, color:A.textMuted }}>{selected.assessment}</div>
              </div>
              <button onClick={()=>setSelected(null)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:20,color:A.textMuted }}>✕</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:20 }}>
              <div style={{ padding:14, background:A.bg, borderRadius:10, textAlign:"center" }}>
                <div style={{ fontSize:28, fontWeight:800, color:selected.passed?A.green:A.red, fontFamily:mono }}>{selected.score}%</div>
                <div style={{ fontSize:11, color:A.textMuted, marginTop:2 }}>Overall Score</div>
              </div>
              <div style={{ padding:14, background:A.bg, borderRadius:10, textAlign:"center" }}>
                <div style={{ fontSize:22, fontWeight:800, color:A.navy }}>{selected.time}m</div>
                <div style={{ fontSize:11, color:A.textMuted, marginTop:2 }}>Time Spent</div>
              </div>
              <div style={{ padding:14, background:selected.passed?A.greenLight:A.redLight, borderRadius:10, textAlign:"center" }}>
                <div style={{ fontSize:20, fontWeight:800, color:selected.passed?A.green:A.red }}>{selected.passed?"PASS":"FAIL"}</div>
                <div style={{ fontSize:11, color:A.textMuted, marginTop:2 }}>Result</div>
              </div>
            </div>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <Btn small variant="secondary">⬇ Download PDF</Btn>
              <Btn small variant="secondary">✉ Email Report</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────
function DashboardPage({ onNav, employer }) {
  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:24, fontWeight:800, color:A.navy, marginBottom:4 }}>Dashboard</h1>
        <p style={{ fontSize:14, color:A.textMuted, margin:0 }}>Welcome back{employer?.name ? `, ${employer.name}` : ""}. Here's your assessment activity.</p>
      </div>

      {/* Usage gauge */}
      <Card style={{ marginBottom:20, background:"linear-gradient(135deg, #1D4ED8 0%, #1E3A5F 100%)", border:"none" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", color:"#fff" }}>
          <div>
            <div style={{ fontSize:13, opacity:0.8, marginBottom:4 }}>Annual Assessment Usage</div>
            <div style={{ fontSize:32, fontWeight:800, fontFamily:mono }}>0 <span style={{ fontSize:18, opacity:0.7 }}>/ 2,000</span></div>
            <div style={{ fontSize:12, opacity:0.7, marginTop:4 }}>Enterprise Plan · Renews annually</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:13, opacity:0.8, marginBottom:6 }}>0% used</div>
            <div style={{ width:160, height:8, background:"rgba(255,255,255,0.2)", borderRadius:4, overflow:"hidden" }}>
              <div style={{ width:"0%", height:"100%", background:"#fff", borderRadius:4 }} />
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        <Stat label="Assessments Sent" value={0} icon="📨" />
        <Stat label="Completed" value={0} icon="✅" color={A.green} />
        <Stat label="In Progress" value={0} icon="⏳" color={A.amber} />
        <Stat label="Completion Rate" value="—" icon="📈" color={A.purple} />
      </div>

      {/* Quick actions */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:24 }}>
        <Card onClick={()=>onNav("library")} style={{ cursor:"pointer", borderStyle:"dashed", textAlign:"center", padding:32 }}>
          <div style={{ fontSize:36, marginBottom:10 }}>📋</div>
          <div style={{ fontSize:15, fontWeight:700, color:A.navy, marginBottom:4 }}>Send Assessment</div>
          <div style={{ fontSize:13, color:A.textMuted }}>Choose from 14 prebuilt assessments and send to candidates</div>
        </Card>
        <Card onClick={()=>onNav("results")} style={{ cursor:"pointer", textAlign:"center", padding:32 }}>
          <div style={{ fontSize:36, marginBottom:10 }}>📊</div>
          <div style={{ fontSize:15, fontWeight:700, color:A.navy, marginBottom:4 }}>View Results</div>
          <div style={{ fontSize:13, color:A.textMuted }}>Track invitations, completions, and candidate scores</div>
        </Card>
      </div>

      {/* Available assessments */}
      <Card>
        <div style={{ fontSize:14, fontWeight:700, color:A.navy, marginBottom:14 }}>Available Assessments</div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {ASSESSMENT_LIBRARY.map(a => (
            <div key={a.id} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 10px", background:A.bg, borderRadius:7, fontSize:12, color:A.text }}>
              <span>{a.icon}</span>{a.name}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Candidate Assessment Portal ────────────────────────────────────────────
function CandidatePortal() {
  const [step, setStep]         = useState("landing"); // landing | certified | typing | mcq | complete
  const [certified, setCertified] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [startTime, setStartTime]  = useState(null);
  const [wpm, setWpm]           = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [elapsed, setElapsed]   = useState(0);
  const intervalRef             = useRef(null);

  const PASSAGE = "The ability to communicate effectively in a professional environment is essential for career success. Clear written communication helps teams collaborate, reduces misunderstandings, and demonstrates competence. Whether drafting emails, preparing reports, or responding to customers, strong writing skills create lasting positive impressions and drive organizational results.";

  const startTyping = () => {
    setStep("typing");
    setStartTime(Date.now());
    setElapsed(0);
    intervalRef.current = setInterval(() => {
      setElapsed(e => e + 1);
    }, 1000);
  };

  const handleTyping = (val) => {
    setTypingText(val);
    if (!startTime) return;
    const mins = (Date.now() - startTime) / 60000;
    const words = val.trim().split(/\s+/).filter(Boolean).length;
    setWpm(mins > 0 ? Math.round(words / mins) : 0);
    // Accuracy
    let correct = 0;
    for (let i = 0; i < val.length; i++) {
      if (val[i] === PASSAGE[i]) correct++;
    }
    setAccuracy(val.length > 0 ? Math.round((correct / val.length) * 100) : 100);
    if (val.length >= PASSAGE.length) {
      clearInterval(intervalRef.current);
      setTimeout(() => setStep("complete"), 500);
    }
  };

  const netWpm = Math.round(wpm * (accuracy / 100));

  if (step === "landing") return (
    <div style={{ minHeight:"100vh", background:A.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:sans, padding:24 }}>
      <div style={{ width:"100%", maxWidth:560 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
          <div style={{ fontSize:11, fontWeight:600, color:A.textMuted, letterSpacing:"0.08em", marginBottom:8 }}>CANDIDATE ASSESSMENT</div>
          <h1 style={{ fontSize:26, fontWeight:800, color:A.navy, margin:"0 0 8px" }}>Acme Corporation</h1>
          <p style={{ fontSize:15, color:A.textMuted, margin:0 }}>Administrative Skills Package</p>
        </div>
        <Card style={{ marginBottom:16 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:20, textAlign:"center" }}>
            {[["~60 min","Estimated Time"],["6","Assessments"],["Pass: 70%","Threshold"]].map(([val,lbl])=>(
              <div key={lbl}>
                <div style={{ fontSize:18, fontWeight:800, color:A.navy, fontFamily:mono }}>{val}</div>
                <div style={{ fontSize:11, color:A.textMuted, marginTop:2 }}>{lbl}</div>
              </div>
            ))}
          </div>
          <div style={{ padding:"12px 14px", background:A.blueLight, borderRadius:8, fontSize:13, color:A.blue, marginBottom:20 }}>
            <strong>Instructions:</strong> Complete all sections in order. You may not go back once a section is submitted. Ensure you have a stable internet connection before starting.
          </div>
          <label style={{ display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer", marginBottom:20 }}>
            <input type="checkbox" checked={certified} onChange={e=>setCertified(e.target.checked)} style={{ accentColor:A.blue, width:16, height:16, marginTop:2, flexShrink:0 }} />
            <span style={{ fontSize:13, color:A.text, lineHeight:1.5 }}>
              I certify that I am the person completing this assessment and will complete it independently, without unauthorized assistance from any person or resource.
            </span>
          </label>
          <Btn full disabled={!certified} onClick={()=>setStep("overview")}>Start Assessment</Btn>
        </Card>
        <p style={{ textAlign:"center", fontSize:11, color:A.textLight }}>Powered by Jobvair Assess · Secure · Confidential</p>
      </div>
    </div>
  );

  if (step === "overview") return (
    <div style={{ minHeight:"100vh", background:A.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:sans, padding:24 }}>
      <div style={{ width:"100%", maxWidth:560 }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <h2 style={{ fontSize:22, fontWeight:800, color:A.navy, marginBottom:4 }}>Assessment Overview</h2>
          <p style={{ fontSize:14, color:A.textMuted }}>You will complete these sections in order:</p>
        </div>
        <Card style={{ marginBottom:16 }}>
          {["Typing","Data Entry","Microsoft Word","Microsoft Excel","Grammar","Written Communication"].map((name, i) => (
            <div key={name} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:i<5?`1px solid ${A.border}`:"none" }}>
              <div style={{ width:28, height:28, borderRadius:"50%", background:A.blueLight, color:A.blue, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, flexShrink:0 }}>{i+1}</div>
              <div style={{ flex:1, fontSize:14, color:A.navy, fontWeight:500 }}>{name}</div>
              <div style={{ fontSize:12, color:A.textMuted }}>{[10,15,20,25,15,20][i]} min</div>
            </div>
          ))}
        </Card>
        <Btn full onClick={startTyping}>Begin — Section 1: Typing</Btn>
      </div>
    </div>
  );

  if (step === "typing") return (
    <div style={{ minHeight:"100vh", background:A.bg, fontFamily:sans, padding:24 }}>
      <div style={{ maxWidth:720, margin:"0 auto" }}>
        {/* Header bar */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div>
            <div style={{ fontSize:12, color:A.textMuted, fontWeight:600 }}>Section 1 of 6</div>
            <div style={{ fontSize:18, fontWeight:800, color:A.navy }}>Typing Assessment</div>
          </div>
          <div style={{ display:"flex", gap:16, fontFamily:mono }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:22, fontWeight:800, color:A.blue }}>{wpm}</div>
              <div style={{ fontSize:10, color:A.textMuted }}>WPM</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:22, fontWeight:800, color:accuracy>=90?A.green:accuracy>=75?A.amber:A.red }}>{accuracy}%</div>
              <div style={{ fontSize:10, color:A.textMuted }}>Accuracy</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:22, fontWeight:800, color:A.navy }}>{Math.floor(elapsed/60)}:{String(elapsed%60).padStart(2,"0")}</div>
              <div style={{ fontSize:10, color:A.textMuted }}>Time</div>
            </div>
          </div>
        </div>

        <Card style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, color:A.textMuted, marginBottom:10, fontWeight:600 }}>TYPE THE FOLLOWING PASSAGE:</div>
          <div style={{ fontSize:15, lineHeight:1.8, color:A.text, padding:"16px 20px", background:A.bg, borderRadius:10, fontFamily:"Georgia, serif", marginBottom:16, userSelect:"none" }}>
            {PASSAGE.split("").map((char, i) => {
              let color = A.textLight;
              if (i < typingText.length) {
                color = typingText[i] === char ? A.green : A.red;
              }
              return <span key={i} style={{ color, background: i === typingText.length ? A.blueLight : "transparent" }}>{char}</span>;
            })}
          </div>
          <textarea
            autoFocus
            value={typingText}
            onChange={e => handleTyping(e.target.value)}
            placeholder="Begin typing here…"
            style={{ width:"100%", minHeight:120, padding:"12px 16px", border:`2px solid ${A.border}`, borderRadius:10, fontSize:15, fontFamily:"Georgia, serif", lineHeight:1.8, outline:"none", resize:"none", boxSizing:"border-box" }}
          />
        </Card>
        <div style={{ fontSize:12, color:A.textMuted, textAlign:"center" }}>
          {typingText.length} / {PASSAGE.length} characters · The assessment ends automatically when the passage is complete.
        </div>
      </div>
    </div>
  );

  if (step === "complete") return (
    <div style={{ minHeight:"100vh", background:A.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:sans, padding:24 }}>
      <div style={{ maxWidth:480, width:"100%", textAlign:"center" }}>
        <div style={{ fontSize:56, marginBottom:20 }}>🎉</div>
        <h2 style={{ fontSize:24, fontWeight:800, color:A.navy, marginBottom:8 }}>Section Complete!</h2>
        <p style={{ fontSize:15, color:A.textMuted, marginBottom:28 }}>Your typing assessment results have been recorded.</p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:28 }}>
          <Card style={{ textAlign:"center", padding:16 }}>
            <div style={{ fontSize:26, fontWeight:800, color:A.blue, fontFamily:mono }}>{wpm}</div>
            <div style={{ fontSize:11, color:A.textMuted }}>Gross WPM</div>
          </Card>
          <Card style={{ textAlign:"center", padding:16 }}>
            <div style={{ fontSize:26, fontWeight:800, color:A.green, fontFamily:mono }}>{netWpm}</div>
            <div style={{ fontSize:11, color:A.textMuted }}>Net WPM</div>
          </Card>
          <Card style={{ textAlign:"center", padding:16 }}>
            <div style={{ fontSize:26, fontWeight:800, color:accuracy>=90?A.green:A.amber, fontFamily:mono }}>{accuracy}%</div>
            <div style={{ fontSize:11, color:A.textMuted }}>Accuracy</div>
          </Card>
        </div>
        <Btn full onClick={()=>setStep("landing")}>Continue to Next Section →</Btn>
      </div>
    </div>
  );

  return null;
}

// ── Employer App Shell ─────────────────────────────────────────────────────
const NAV = [
  { id:"dashboard",  label:"Dashboard",  icon:"⊞" },
  { id:"library",    label:"Assessments",icon:"📋" },
  { id:"results",    label:"Results",    icon:"📊" },
  { id:"candidates", label:"Candidates", icon:"👥" },
  { id:"settings",   label:"Settings",  icon:"⚙️" },
];

function EmployerShell({ user, onLogout }) {
  const [page, setPage]             = useState("dashboard");
  const [sendingFor, setSendingFor] = useState(null); // selected assessment IDs
  const [employer, setEmployer]     = useState(null);

  useEffect(() => {
    // Load or create employer record for this user
    if (!user?.id) return;
    supabase.from("employers").select("*").eq("created_by", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) setEmployer(data);
        else {
          // Auto-create employer from email domain
          const domain = user.email?.split("@")[1] || "company.com";
          const name = domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1);
          supabase.from("employers").insert({ name, contact_email: user.email, created_by: user.id }).select().single()
            .then(({ data: newEmp }) => { if (newEmp) setEmployer(newEmp); });
        }
      });
  }, [user?.id]);

  const handleSend = (ids) => { setSendingFor(ids); setPage("send"); };
  const handleSentDone = () => { setSendingFor(null); setPage("results"); };

  return (
    <div style={{ display:"flex", minHeight:"100vh", fontFamily:sans, background:A.bg }}>
      {/* Sidebar */}
      <div style={{ width:220, background:"#fff", borderRight:`1px solid ${A.border}`, display:"flex", flexDirection:"column", flexShrink:0 }}>
        {/* Brand */}
        <div style={{ padding:"22px 20px 18px", borderBottom:`1px solid ${A.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
            <div style={{ width:28, height:28, borderRadius:7, background:A.blue, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>📋</div>
            <span style={{ fontSize:15, fontWeight:800, color:A.navy, letterSpacing:"-0.01em" }}>Jobvair Assess</span>
          </div>
          <div style={{ fontSize:11, color:A.textMuted, marginLeft:36 }}>Employer Portal</div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"14px 10px" }}>
          {NAV.map(n => (
            <button key={n.id} onClick={()=>{ setPage(n.id); setSendingFor(null); }}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:8, background:page===n.id?"#EFF6FF":"transparent", border:"none", color:page===n.id?A.blue:A.textMuted, cursor:"pointer", fontSize:13, fontWeight:page===n.id?700:400, fontFamily:sans, marginBottom:2, textAlign:"left", transition:"all 0.1s" }}>
              <span style={{ fontSize:16 }}>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>

        {/* User info */}
        <div style={{ padding:"14px 16px", borderTop:`1px solid ${A.border}` }}>
          <div style={{ fontSize:12, fontWeight:600, color:A.navy, marginBottom:2 }}>{employer?.name || user?.email}</div>
          <div style={{ fontSize:11, color:A.textMuted, marginBottom:10 }}>Enterprise Plan</div>
          <button onClick={onLogout} style={{ background:"none",border:"none",cursor:"pointer",fontSize:12,color:A.textMuted,fontFamily:sans,padding:0 }}>Sign out</button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1, overflowY:"auto", padding:36 }}>
        {page === "dashboard"  && <DashboardPage onNav={setPage} employer={employer} />}
        {page === "library"    && <LibraryPage onSend={handleSend} />}
        {page === "send"       && sendingFor && <SendAssessmentPage selectedIds={sendingFor} onBack={()=>setPage("library")} onSent={handleSentDone} />}
        {page === "results"    && <ResultsPage />}
        {page === "candidates" && (
          <div>
            <h1 style={{ fontSize:24, fontWeight:800, color:A.navy, marginBottom:4 }}>Candidates</h1>
            <p style={{ color:A.textMuted, fontSize:14 }}>Candidate management coming in Sprint 2.</p>
          </div>
        )}
        {page === "settings"   && (
          <div>
            <h1 style={{ fontSize:24, fontWeight:800, color:A.navy, marginBottom:4 }}>Settings</h1>
            <p style={{ color:A.textMuted, fontSize:14 }}>Employer settings coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Root — routes between employer portal and candidate portal ─────────────
export default function AssessApp() {
  const [authUser, setAuthUser]     = useState(undefined);
  const isCandidatePortal = window.location.search.includes("token=") || window.location.hash.includes("candidate");

  useEffect(() => {
    if (isCandidatePortal) return;
    supabase.auth.getSession().then(({ data }) => setAuthUser(data.session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setAuthUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  // Candidate portal (via secure token link)
  if (isCandidatePortal) return <CandidatePortal />;

  // Loading
  if (authUser === undefined) return (
    <div style={{ minHeight:"100vh", background:A.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:sans, color:A.textMuted }}>
      Loading…
    </div>
  );

  // Not logged in
  if (!authUser) return <EmployerLogin onLogin={setAuthUser} />;

  // Employer portal
  return <EmployerShell user={authUser} onLogout={async()=>{ await supabase.auth.signOut(); setAuthUser(null); }} />;
}
