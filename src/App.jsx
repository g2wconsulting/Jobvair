import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabaseClient";
import { useProfile } from "./useProfile";

// ── Design tokens ─────────────────────────────────────────────────────────
const C = {
  navy: "#0D1B2A", navyMid: "#1A2E45", navyLight: "#253D5B",
  teal: "#00BFA5", tealDark: "#009688", tealLight: "#E0F7F5",
  slate: "#4A5568", bg: "#F7F9FC", bgCard: "#FFFFFF",
  border: "#E2E8F0", text: "#1A202C", textMuted: "#718096", textLight: "#A0AEC0",
  danger: "#E53E3E", dangerBg: "#FFF5F5",
  success: "#38A169", successBg: "#F0FFF4",
  warning: "#D69E2E", warningBg: "#FFFBEB",
  purple: "#7C3AED", purpleBg: "#F5F3FF",
  indigo: "#4F46E5", indigoBg: "#EEF2FF",
};

// ── Primitive components ──────────────────────────────────────────────────
function Badge({ color = "teal", children, small }) {
  const m = {
    teal: [C.tealLight, C.tealDark], navy: ["#E8EDF3", C.navyMid],
    gold: ["#FFFBEB", "#92600A"], danger: [C.dangerBg, C.danger],
    success: [C.successBg, C.success], gray: ["#EDF2F7", C.slate],
    purple: [C.purpleBg, C.purple], indigo: [C.indigoBg, C.indigo],
  };
  const [bg, text] = m[color] || m.teal;
  return <span style={{ display:"inline-flex", alignItems:"center", background:bg, color:text, fontSize:small?11:12, fontWeight:600, padding:small?"2px 8px":"3px 10px", borderRadius:20 }}>{children}</span>;
}

function Btn({ variant="primary", onClick, children, full, small, disabled, icon, style: sx }) {
  const s = {
    primary: { background:C.teal, color:"#fff", border:"none" },
    secondary: { background:"transparent", color:C.navy, border:`1.5px solid ${C.border}` },
    ghost: { background:"transparent", color:C.slate, border:"none" },
    danger: { background:C.danger, color:"#fff", border:"none" },
    navy: { background:C.navy, color:"#fff", border:"none" },
    purple: { background:C.purple, color:"#fff", border:"none" },
  }[variant] || {};
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...s, display:"inline-flex", alignItems:"center", gap:6,
      padding:small?"6px 14px":"10px 20px", borderRadius:8,
      fontSize:small?13:14, fontWeight:600, cursor:disabled?"not-allowed":"pointer",
      width:full?"100%":undefined, justifyContent:"center", opacity:disabled?0.5:1,
      fontFamily:"inherit", transition:"all 0.15s", ...sx,
    }}>
      {icon && <span style={{ fontSize:16 }}>{icon}</span>}
      {children}
    </button>
  );
}

function Card({ children, style, onClick, hover }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      background:C.bgCard, borderRadius:12, border:`1px solid ${hov&&hover?C.teal:C.border}`,
      padding:"20px 24px", cursor:onClick?"pointer":undefined,
      transition:"border-color 0.15s, box-shadow 0.15s",
      boxShadow:hov&&hover?"0 4px 16px rgba(0,191,165,0.1)":"0 1px 4px rgba(0,0,0,0.04)",
      ...style,
    }}>{children}</div>
  );
}

function Input({ label, type="text", value, onChange, placeholder, required, hint, error, textarea, rows=3, disabled }) {
  const Tag = textarea ? "textarea" : "input";
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {label && <label style={{ fontSize:13, fontWeight:600, color:C.navy }}>{label}{required&&<span style={{ color:C.danger }}> *</span>}</label>}
      <Tag type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} disabled={disabled}
        style={{ border:`1.5px solid ${error?C.danger:C.border}`, borderRadius:8, padding:"9px 12px", fontSize:14, color:C.text, background:disabled?"#f9f9f9":"#fff", outline:"none", resize:textarea?"vertical":undefined, fontFamily:"inherit", width:"100%", boxSizing:"border-box" }} />
      {hint && <span style={{ fontSize:12, color:C.textMuted }}>{hint}</span>}
      {error && <span style={{ fontSize:12, color:C.danger }}>{error}</span>}
    </div>
  );
}

function Select({ label, value, onChange, options, required, hint }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {label && <label style={{ fontSize:13, fontWeight:600, color:C.navy }}>{label}{required&&<span style={{ color:C.danger }}> *</span>}</label>}
      <select value={value} onChange={e=>onChange(e.target.value)} style={{ border:`1.5px solid ${C.border}`, borderRadius:8, padding:"9px 12px", fontSize:14, color:C.text, background:"#fff", outline:"none", fontFamily:"inherit", width:"100%", boxSizing:"border-box" }}>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint && <span style={{ fontSize:12, color:C.textMuted }}>{hint}</span>}
    </div>
  );
}

function ProgressBar({ value, max=100, color=C.teal, label }) {
  const pct = Math.round((value/max)*100);
  return (
    <div>
      {label && <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <span style={{ fontSize:13, color:C.slate }}>{label}</span>
        <span style={{ fontSize:13, fontWeight:600, color:C.navy }}>{pct}%</span>
      </div>}
      <div style={{ height:8, background:C.border, borderRadius:99 }}>
        <div style={{ height:8, background:color, borderRadius:99, width:`${pct}%`, transition:"width 0.4s ease" }} />
      </div>
    </div>
  );
}

function SectionTitle({ children, sub, action }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
      <div>
        <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:C.navy }}>{children}</h2>
        {sub && <p style={{ margin:"4px 0 0", fontSize:14, color:C.textMuted }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function Avatar({ name, size=40 }) {
  const initials = name ? name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase() : "U";
  return <div style={{ width:size, height:size, borderRadius:"50%", background:`linear-gradient(135deg, ${C.teal}, ${C.navyMid})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:size*0.35, flexShrink:0 }}>{initials}</div>;
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, marginBottom:24, overflowX:"auto" }}>
      {tabs.map(t=>(
        <button key={t.id} onClick={()=>onChange(t.id)} style={{
          background:"none", border:"none", borderBottom:active===t.id?`2.5px solid ${C.teal}`:"2.5px solid transparent",
          color:active===t.id?C.teal:C.slate, fontSize:14, fontWeight:active===t.id?700:500,
          padding:"10px 16px", cursor:"pointer", marginBottom:-1, fontFamily:"inherit", whiteSpace:"nowrap",
        }}>{t.label}</button>
      ))}
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
      <div onClick={()=>onChange(!checked)} style={{
        width:42, height:24, borderRadius:12, background:checked?C.teal:C.border, position:"relative", transition:"background 0.2s", flexShrink:0,
      }}>
        <div style={{ position:"absolute", top:3, left:checked?20:3, width:18, height:18, borderRadius:"50%", background:"#fff", transition:"left 0.2s" }} />
      </div>
      {label && <span style={{ fontSize:14, color:C.text }}>{label}</span>}
    </label>
  );
}

function CheckGroup({ label, options, value, onChange }) {
  const toggle = (v) => {
    const next = value.includes(v) ? value.filter(x=>x!==v) : [...value, v];
    onChange(next);
  };
  return (
    <div>
      {label && <div style={{ fontSize:13, fontWeight:600, color:C.navy, marginBottom:8 }}>{label}</div>}
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {options.map(o=>(
          <label key={o.value} style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", padding:"6px 12px", borderRadius:8, border:`1.5px solid ${value.includes(o.value)?C.teal:C.border}`, background:value.includes(o.value)?C.tealLight:"#fff", fontSize:13 }}>
            <input type="checkbox" checked={value.includes(o.value)} onChange={()=>toggle(o.value)} style={{ accentColor:C.teal }} />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  );
}

// ── Fake seed data ────────────────────────────────────────────────────────
// ── Empty defaults (used before profile loads) ────────────────────────────
const EMPTY_USER = {
  id: null, name: "", email: "", phone: "", location: "", summary: "",
  desiredTitles: [], industries: [], availability: "immediately",
  subscription: "free", idVerified: false, employmentStatus: "open",
  salaryTarget: "", salaryLevel: "senior", backgroundCheck: false,
  wotcEligible: false, sponsorshipRequired: false,
  employmentTypes: ["full-time"], workLocations: ["remote"],
};

// Still used by HistoryPage and ResumesPage (will be replaced when those pages get real DB reads)
const SEED_RESUMES = [
  { id:"1", name:"My Resume", template:"modern", primary:true, updated:"–", matchScore:null },
];
const SEED_ANALYSES = [];

// ── Salary ranges by level ────────────────────────────────────────────────
const SALARY_MAP = {
  "entry":    { label:"Entry Level",    range:"$45,000 – $70,000" },
  "mid":      { label:"Mid-Level",      range:"$70,000 – $105,000" },
  "senior":   { label:"Senior",         range:"$110,000 – $155,000" },
  "manager":  { label:"Manager",        range:"$120,000 – $165,000" },
  "director": { label:"Director",       range:"$150,000 – $210,000" },
  "experienced":{ label:"Experienced",  range:"$95,000 – $135,000" },
  "custom":   { label:"Custom Target",  range:"" },
};

// ── Auth flow with ID Verification ───────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [step, setStep] = useState(1); // 1=form, 2=email verify, 3=id-verify, 4=done
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [verifyStatus, setVerifyStatus] = useState(null); // null | "scanning" | "done"

  const Logo = () => (
    <div style={{ textAlign:"center", marginBottom:32 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:6 }}>
        <div style={{ width:40, height:40, borderRadius:10, background:C.teal, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        </div>
        <span style={{ fontSize:26, fontWeight:800, color:"#fff", letterSpacing:"-0.5px" }}>Jobvair</span>
      </div>
      <p style={{ color:"rgba(255,255,255,0.55)", fontSize:13, margin:0 }}>AI-Powered Career Platform</p>
    </div>
  );

  const StepDots = ({ total, current }) => (
    <div style={{ display:"flex", justifyContent:"center", gap:8, marginBottom:24 }}>
      {Array.from({length:total}).map((_,i)=>(
        <div key={i} style={{ width:i+1===current?24:8, height:8, borderRadius:99, background:i+1<=current?C.teal:C.border, transition:"all 0.2s" }} />
      ))}
    </div>
  );

  const submitSignup = async () => {
    if (!email || !password || !name) { setMsg("Please fill in all fields."); return; }
    if (password.length < 8) { setMsg("Password must be at least 8 characters."); return; }
    setLoading(true); setMsg("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    setLoading(false);
    if (error) { setMsg(error.message); return; }
    setStep(2); // → email verification step
  };

  const submitLogin = async () => {
    if (!email || !password) { setMsg("Please fill in all fields."); return; }
    setLoading(true); setMsg("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setMsg(error.message); return; }
    // onLogin receives the Supabase user object
    onLogin(data.user);
  };

  const submitReset = async () => {
    if (!email) { setMsg("Enter your email address first."); return; }
    setLoading(true); setMsg("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { setMsg(error.message); return; }
    setMsg("Password reset email sent! Check your inbox.");
  };

  const startVerify = () => {
    setVerifyStatus("scanning");
    // Stripe Identity session is created server-side from ProfilePage.
    // Here we just advance the UI to show the "pending" state.
    setTimeout(() => setVerifyStatus("done"), 1200);
  };

  const finishAuth = () => {
    // After signup flow completes, re-read the session Supabase already set
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) onLogin(data.session.user);
    });
  };

  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 60%, #1B3A52 100%)`, display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      <div style={{ width:"100%", maxWidth: step === 3 ? 520 : 420 }}>
        <Logo />

        {/* ── LOGIN ── */}
        {mode === "login" && (
          <div style={{ background:"#fff", borderRadius:16, padding:"32px 36px" }}>
            <h2 style={{ margin:"0 0 6px", fontSize:22, fontWeight:700, color:C.navy }}>Welcome back</h2>
            <p style={{ margin:"0 0 24px", fontSize:14, color:C.textMuted }}>Sign in to your Jobvair account</p>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@email.com" required />
              <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" required />
              {msg && <div style={{ background:C.tealLight, color:C.tealDark, padding:"10px 14px", borderRadius:8, fontSize:13 }}>{msg}</div>}
              <Btn onClick={submitLogin} disabled={loading} full>{loading?"Please wait…":"Sign in"}</Btn>
            </div>
            <div style={{ marginTop:20, textAlign:"center", fontSize:13, color:C.textMuted }}>
              <button onClick={()=>{setMode("reset");setMsg("");}} style={{ background:"none",border:"none",color:C.teal,cursor:"pointer",fontSize:13,fontFamily:"inherit" }}>Forgot password?</button>
              <span style={{ margin:"0 8px" }}>·</span>
              <button onClick={()=>{setMode("signup");setMsg("");}} style={{ background:"none",border:"none",color:C.teal,cursor:"pointer",fontSize:13,fontFamily:"inherit" }}>Create account</button>
            </div>
          </div>
        )}

        {/* ── SIGNUP STEP 1 ── */}
        {mode === "signup" && step === 1 && (
          <div style={{ background:"#fff", borderRadius:16, padding:"32px 36px" }}>
            <StepDots total={4} current={1} />
            <h2 style={{ margin:"0 0 6px", fontSize:22, fontWeight:700, color:C.navy }}>Create your account</h2>
            <p style={{ margin:"0 0 24px", fontSize:14, color:C.textMuted }}>Start your career journey today</p>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <Input label="Full Name" value={name} onChange={setName} placeholder="Alex Rivera" required />
              <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@email.com" required />
              <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="Create a strong password" required />
              {msg && <div style={{ background:C.dangerBg, color:C.danger, padding:"10px 14px", borderRadius:8, fontSize:13 }}>{msg}</div>}
              <Btn onClick={submitSignup} disabled={loading} full>{loading?"Creating account…":"Create Account"}</Btn>
            </div>
            <div style={{ marginTop:20, textAlign:"center", fontSize:13, color:C.textMuted }}>
              <button onClick={()=>{setMode("login");setMsg("");}} style={{ background:"none",border:"none",color:C.teal,cursor:"pointer",fontSize:13,fontFamily:"inherit" }}>Already have an account? Sign in</button>
            </div>
          </div>
        )}

        {/* ── SIGNUP STEP 2: Email Verification ── */}
        {mode === "signup" && step === 2 && (
          <div style={{ background:"#fff", borderRadius:16, padding:"32px 36px", textAlign:"center" }}>
            <StepDots total={4} current={2} />
            <div style={{ width:64, height:64, borderRadius:"50%", background:C.tealLight, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:28 }}>📧</div>
            <h2 style={{ margin:"0 0 8px", fontSize:20, fontWeight:700, color:C.navy }}>Check your email</h2>
            <p style={{ margin:"0 0 6px", fontSize:14, color:C.textMuted }}>We sent a verification link to</p>
            <p style={{ margin:"0 0 24px", fontSize:14, fontWeight:600, color:C.navy }}>{email}</p>
            <Btn full onClick={()=>setStep(3)}>I've verified my email →</Btn>
            <button onClick={()=>setStep(3)} style={{ background:"none", border:"none", color:C.textMuted, cursor:"pointer", fontSize:13, marginTop:14, display:"block", width:"100%", fontFamily:"inherit" }}>Resend email</button>
            <button onClick={()=>setStep(1)} style={{ background:"none", border:"none", color:C.textMuted, cursor:"pointer", fontSize:12, marginTop:8, fontFamily:"inherit" }}>← Back</button>
          </div>
        )}

        {/* ── SIGNUP STEP 3: ID Verification ── */}
        {mode === "signup" && step === 3 && (
          <div style={{ background:"#fff", borderRadius:16, padding:"32px 36px" }}>
            <StepDots total={4} current={3} />
            <div style={{ textAlign:"center", marginBottom:24 }}>
              <div style={{ width:64, height:64, borderRadius:"50%", background:`linear-gradient(135deg, ${C.teal}, ${C.navyMid})`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:28 }}>🛡</div>
              <h2 style={{ margin:"0 0 8px", fontSize:20, fontWeight:700, color:C.navy }}>Verify your identity</h2>
              <p style={{ margin:0, fontSize:14, color:C.textMuted }}>Stand out to employers as a verified candidate</p>
            </div>

            {/* Benefits */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
              {[
                { icon:"👁", text:"3× more profile views" },
                { icon:"🔝", text:"Priority in search results" },
                { icon:"✓", text:"Stand out as verified" },
                { icon:"🤝", text:"Build employer trust" },
              ].map(b=>(
                <div key={b.text} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", background:C.tealLight, borderRadius:8, fontSize:13, color:C.tealDark, fontWeight:500 }}>
                  <span>{b.icon}</span>{b.text}
                </div>
              ))}
            </div>

            {/* Requirements */}
            <div style={{ background:C.bg, borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:8 }}>What you'll need</div>
              {["Government-issued photo ID (driver's license or passport)","A selfie for face matching","About 5 minutes to complete"].map(r=>(
                <div key={r} style={{ display:"flex", gap:8, fontSize:13, color:C.slate, marginBottom:4 }}>
                  <span style={{ color:C.teal, flexShrink:0 }}>→</span>{r}
                </div>
              ))}
            </div>

            {/* Security */}
            <div style={{ display:"flex", gap:12, padding:"12px 14px", background:"#F8FAFC", border:`1px solid ${C.border}`, borderRadius:10, marginBottom:20 }}>
              <span style={{ fontSize:20 }}>🔒</span>
              <div style={{ fontSize:12, color:C.textMuted, lineHeight:1.5 }}>
                <strong style={{ color:C.navy }}>Your data is protected.</strong> Documents are encrypted, never shared with employers, and processed using industry-standard verification technology.
              </div>
            </div>

            {verifyStatus === null && (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <Btn full onClick={startVerify} icon="🛡">Start Verification</Btn>
                <button onClick={()=>finishAuth()} style={{ background:"none", border:"none", color:C.textMuted, cursor:"pointer", fontSize:13, fontFamily:"inherit", padding:"8px" }}>Skip for now — I'll verify later from my profile</button>
              </div>
            )}

            {verifyStatus === "scanning" && (
              <div style={{ textAlign:"center", padding:"20px 0" }}>
                <div style={{ fontSize:32, marginBottom:12, animation:"spin 1s linear infinite" }}>🔄</div>
                <div style={{ fontSize:14, fontWeight:600, color:C.navy }}>Processing your documents…</div>
                <div style={{ fontSize:13, color:C.textMuted, marginTop:4 }}>This usually takes a moment</div>
                <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
              </div>
            )}

            {verifyStatus === "done" && (
              <div style={{ textAlign:"center" }}>
                <div style={{ width:56, height:56, borderRadius:"50%", background:C.successBg, border:`2px solid ${C.success}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", fontSize:26 }}>✓</div>
                <div style={{ fontSize:16, fontWeight:700, color:C.success, marginBottom:6 }}>Identity Verified!</div>
                <div style={{ fontSize:13, color:C.textMuted, marginBottom:20 }}>Your profile will now show a verified badge.</div>
                <Btn full onClick={()=>finishAuth()}>Continue to Dashboard →</Btn>
              </div>
            )}

            <button onClick={()=>setStep(2)} style={{ background:"none", border:"none", color:C.textMuted, cursor:"pointer", fontSize:12, marginTop:12, display:"block", fontFamily:"inherit" }}>← Back</button>
          </div>
        )}

        {/* ── RESET ── */}
        {mode === "reset" && (
          <div style={{ background:"#fff", borderRadius:16, padding:"32px 36px" }}>
            <h2 style={{ margin:"0 0 6px", fontSize:22, fontWeight:700, color:C.navy }}>Reset password</h2>
            <p style={{ margin:"0 0 24px", fontSize:14, color:C.textMuted }}>Enter your email and we'll send a reset link</p>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@email.com" required />
              {msg && <div style={{ background:C.tealLight, color:C.tealDark, padding:"10px 14px", borderRadius:8, fontSize:13 }}>{msg}</div>}
              <Btn onClick={submitReset} disabled={loading} full>{loading?"Sending…":"Send Reset Link"}</Btn>
            </div>
            <div style={{ marginTop:20, textAlign:"center" }}>
              <button onClick={()=>{setMode("login");setMsg("");}} style={{ background:"none",border:"none",color:C.teal,cursor:"pointer",fontSize:13,fontFamily:"inherit" }}>← Back to sign in</button>
            </div>
          </div>
        )}

        <p style={{ textAlign:"center", marginTop:20, fontSize:12, color:"rgba(255,255,255,0.35)" }}>© 2025 Jobvair · Employer Portal Coming Soon</p>
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────
const NAV = [
  { id:"dashboard",    label:"Dashboard",     icon:"⊞" },
  { id:"profile",      label:"My Profile",    icon:"👤" },
  { id:"resumes",      label:"Resumes",       icon:"📄" },
  { id:"builder",      label:"Resume Builder",icon:"✏️" },
  { id:"ai-optimize",  label:"AI Optimizer",  icon:"✦" },
  { id:"cover-letter", label:"Cover Letter",  icon:"✉️" },
  { id:"settings",     label:"Settings",      icon:"⚙️" },
];

function Sidebar({ active, onNav, user, collapsed, onCollapse }) {
  return (
    <div style={{ width:collapsed?64:240, minHeight:"100vh", background:C.navy, display:"flex", flexDirection:"column", transition:"width 0.2s ease", flexShrink:0, position:"relative" }}>
      <div style={{ padding:collapsed?"20px 12px":"20px 20px", borderBottom:`1px solid rgba(255,255,255,0.08)`, display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:34, height:34, borderRadius:8, background:C.teal, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        </div>
        {!collapsed && <span style={{ fontSize:20, fontWeight:800, color:"#fff", letterSpacing:"-0.4px" }}>Jobvair</span>}
      </div>
      <nav style={{ flex:1, padding:"12px 8px", overflowY:"auto" }}>
        {NAV.map(item=>(
          <button key={item.id} onClick={()=>onNav(item.id)} style={{
            display:"flex", alignItems:"center", gap:10, width:"100%", padding:"10px 14px",
            background:active===item.id?"rgba(0,191,165,0.15)":"transparent", border:"none", borderRadius:8, cursor:"pointer",
            color:active===item.id?C.teal:"rgba(255,255,255,0.6)", fontSize:14, fontWeight:active===item.id?600:400,
            textAlign:"left", fontFamily:"inherit", marginBottom:2, justifyContent:collapsed?"center":"flex-start",
          }}>
            <span style={{ fontSize:16, flexShrink:0 }}>{item.icon}</span>
            {!collapsed && item.label}
          </button>
        ))}
        <div style={{ margin:"8px 0", borderTop:`1px solid rgba(255,255,255,0.08)`, paddingTop:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", color:"rgba(255,255,255,0.25)", fontSize:13, justifyContent:collapsed?"center":"flex-start" }}>
            <span style={{ fontSize:16 }}>🏢</span>
            {!collapsed && <span>Employer Portal<br/><span style={{ fontSize:11, opacity:0.6 }}>Coming soon</span></span>}
          </div>
        </div>
      </nav>
      <div style={{ padding:collapsed?"12px 8px":"12px 16px", borderTop:`1px solid rgba(255,255,255,0.08)`, display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ position:"relative" }}>
          <Avatar name={user.name} size={32} />
          {user.idVerified && <div style={{ position:"absolute", bottom:-2, right:-2, width:12, height:12, borderRadius:"50%", background:C.teal, border:"2px solid "+C.navy, display:"flex", alignItems:"center", justifyContent:"center", fontSize:7, color:"#fff" }}>✓</div>}
        </div>
        {!collapsed && (
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.name}</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{user.idVerified?"✓ Verified · ":""}{user.subscription==="free"?"Free Plan":"Premium"}</div>
          </div>
        )}
      </div>
      <button onClick={onCollapse} style={{ position:"absolute", top:24, right:-12, width:24, height:24, borderRadius:"50%", background:C.teal, border:"none", cursor:"pointer", color:"#fff", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center" }}>{collapsed?"›":"‹"}</button>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────
function DashboardPage({ user, onNav }) {
  const items = [
    { label:"Basic info", done:true }, { label:"Professional summary", done:true },
    { label:"Work experience", done:true }, { label:"Skills", done:true },
    { label:"Education", done:true }, { label:"ID Verification", done:user.idVerified },
    { label:"Profile photo", done:false }, { label:"Certifications", done:false },
  ];
  const pct = Math.round((items.filter(i=>i.done).length/items.length)*100);

  return (
    <div>
      <div style={{ background:`linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 100%)`, borderRadius:16, padding:"28px 32px", marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
        <div>
          <p style={{ margin:"0 0 4px", color:"rgba(255,255,255,0.6)", fontSize:14 }}>Good morning 👋</p>
          <h1 style={{ margin:0, color:"#fff", fontSize:26, fontWeight:800 }}>
            {user.name}
            {user.idVerified && <Badge color="teal" small> ✓ Verified</Badge>}
          </h1>
          <p style={{ margin:"6px 0 0", color:"rgba(255,255,255,0.6)", fontSize:14 }}>Your profile is {pct}% complete. Keep building to get better AI matches.</p>
        </div>
        <Btn onClick={()=>onNav("ai-optimize")} icon="✦">Run AI Analysis</Btn>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:16, marginBottom:24 }}>
        {[
          { label:"Saved Resumes", value:"2", icon:"📄", action:()=>onNav("resumes") },
          { label:"AI Analyses", value:"2", icon:"✦", action:()=>onNav("history") },
          { label:"Profile", value:`${pct}%`, icon:"👤", action:()=>onNav("profile") },
          { label:"ID Status", value:user.idVerified?"Verified":"Unverified", icon:"🛡", action:()=>onNav("profile") },
          { label:"Plan", value:"Free", icon:"⭐", action:()=>onNav("settings") },
        ].map(s=>(
          <Card key={s.label} hover onClick={s.action} style={{ padding:"16px 18px" }}>
            <div style={{ fontSize:20, marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontSize:20, fontWeight:800, color:C.navy, marginBottom:2 }}>{s.value}</div>
            <div style={{ fontSize:12, color:C.textMuted }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <Card>
          <SectionTitle action={<Btn variant="ghost" small onClick={()=>onNav("profile")}>Edit →</Btn>}>Profile Completion</SectionTitle>
          <ProgressBar value={pct} max={100} label="Overall completion" />
          <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:8 }}>
            {items.map(item=>(
              <div key={item.label} style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:18, height:18, borderRadius:"50%", background:item.done?C.teal:C.border, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {item.done && <span style={{ color:"#fff", fontSize:10 }}>✓</span>}
                </div>
                <span style={{ fontSize:13, color:item.done?C.text:C.textMuted }}>{item.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          <Card>
            <SectionTitle action={<Btn variant="ghost" small onClick={()=>onNav("history")}>All →</Btn>}>Recent AI Analyses</SectionTitle>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {SEED_ANALYSES.map(a=>(
                <div key={a.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:C.bg, borderRadius:8 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:C.navy }}>{a.jobTitle}</div>
                    <div style={{ fontSize:12, color:C.textMuted }}>{a.company} · {a.date}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:20, fontWeight:800, color:a.matchScore>=80?C.success:a.matchScore>=60?C.warning:C.danger }}>{a.matchScore}%</div>
                    <div style={{ fontSize:11, color:C.textMuted }}>match</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {!user.idVerified && (
            <Card style={{ background:`linear-gradient(135deg,#EEF2FF,#fff)`, border:`1px solid ${C.indigo}33` }}>
              <div style={{ display:"flex", gap:12 }}>
                <div style={{ fontSize:28 }}>🛡</div>
                <div>
                  <div style={{ fontSize:15, fontWeight:700, color:C.navy, marginBottom:4 }}>Verify Your Identity</div>
                  <div style={{ fontSize:13, color:C.slate, marginBottom:12 }}>Get 3× more profile views and priority in employer search.</div>
                  <Btn small variant="navy" onClick={()=>onNav("profile")}>Verify Now</Btn>
                </div>
              </div>
            </Card>
          )}

          <Card style={{ background:`linear-gradient(135deg,${C.tealLight},#fff)`, border:`1px solid ${C.teal}33` }}>
            <div style={{ display:"flex", gap:12 }}>
              <div style={{ fontSize:28 }}>⭐</div>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:C.navy, marginBottom:4 }}>Upgrade to Premium</div>
                <div style={{ fontSize:13, color:C.slate, marginBottom:12 }}>Unlimited AI analyses, premium templates, PDF export.</div>
                <Btn small onClick={()=>onNav("settings")}>View plans</Btn>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Profile Page ──────────────────────────────────────────────────────────
function ProfilePage({ user, onUpdateUser, profileForm, setProfileForm, profileSkills, setProfileSkills, profileWork, setProfileWork, profileEdu, setProfileEdu, profileCerts, setProfileCerts, onSave, onParsedResume }) {
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

// ── Resumes List ──────────────────────────────────────────────────────────
function ResumesPage({ onNav, user }) {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("resumes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error("[ResumesPage]", error.message);
        else setResumes(data || []);
        setLoading(false);
      });
  }, [user?.id]);

  const del = async (id) => {
    await supabase.from("resumes").delete().eq("id", id);
    setResumes(r => r.filter(x => x.id !== id));
  };

  const dup = async (r) => {
    const { data } = await supabase.from("resumes").insert({
      user_id: user.id, name: r.name + " (Copy)", template: r.template,
      is_primary: false, sections: r.sections, contact_fields: r.contact_fields,
    }).select().single();
    if (data) setResumes(rs => [data, ...rs]);
  };

  const setPrimary = async (id) => {
    // Remove primary from all, set on selected
    await supabase.from("resumes").update({ is_primary: false }).eq("user_id", user.id);
    await supabase.from("resumes").update({ is_primary: true }).eq("id", id);
    setResumes(rs => rs.map(r => ({ ...r, is_primary: r.id === id })));
  };

  const [dbTemplates, setDbTemplates] = useState([]);
  useEffect(() => {
    supabase.from("resume_templates").select("*").eq("is_active", true).order("sort_order")
      .then(({ data }) => setDbTemplates(data || []));
  }, []);

  return (
    <div>
      <SectionTitle sub="Manage your resume versions. Mark one as primary for AI analysis." action={<Btn icon="＋" onClick={() => onNav("builder")}>New Resume</Btn>}>My Resumes</SectionTitle>

      {loading ? (
        <div style={{ textAlign:"center", padding:"40px", color:C.textMuted }}>Loading resumes…</div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:20, marginBottom:32 }}>
          {resumes.map(r => {
            const tmpl = dbTemplates.find(t => t.id === r.selected_template_id || t.slug === r.template);
            return (
              <Card key={r.id} hover style={{ position:"relative" }}>
                {r.is_primary && <div style={{ position:"absolute", top:14, right:14 }}><Badge color="teal">⭐ Primary</Badge></div>}
                {/* Mini template color strip */}
                {tmpl && <div style={{ height:4, background:tmpl.accent_color || C.teal, borderRadius:"6px 6px 0 0", margin:"-20px -20px 14px", width:"calc(100% + 40px)" }} />}
                <div style={{ fontSize:36, marginBottom:10 }}>{r.storage_path ? "📎" : "📄"}</div>
                <div style={{ fontSize:16, fontWeight:700, color:C.navy, marginBottom:4, paddingRight:60 }}>{r.name}</div>
                <div style={{ fontSize:13, color:C.textMuted, marginBottom:3 }}>
                  {tmpl ? tmpl.name : r.template || "Default Template"}
                </div>
                <div style={{ fontSize:12, color:C.textLight, marginBottom:16 }}>
                  {new Date(r.updated_at || r.created_at).toLocaleDateString()}
                </div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <Btn small onClick={() => onNav("builder")}>Edit</Btn>
                  <Btn small variant="secondary" onClick={() => dup(r)}>Duplicate</Btn>
                  {!r.is_primary && <Btn small variant="secondary" onClick={() => setPrimary(r.id)}>Set Primary</Btn>}
                  <div style={{ position:"relative" }}>
                    <Btn small variant="secondary" onClick={() => {
                      const menu = document.getElementById(`export-menu-${r.id}`);
                      if (menu) menu.style.display = menu.style.display === "none" ? "block" : "none";
                    }}>⬇ Export ▾</Btn>
                    <div id={`export-menu-${r.id}`} style={{ display:"none", position:"absolute", top:"110%", left:0, background:"#fff", border:`1px solid ${C.border}`, borderRadius:8, boxShadow:"0 4px 16px rgba(0,0,0,0.12)", zIndex:50, minWidth:160, padding:6 }}>
                      {[
                        ["PDF", () => { onNav("builder"); }],
                        ["Share Link", () => { navigator.clipboard?.writeText(`${window.location.origin}/?resume=${r.id}`); alert("Link copied to clipboard!"); }],
                        ["Email", () => { window.open(`mailto:?subject=My Resume&body=Please find my resume attached. View online: ${window.location.origin}/?resume=${r.id}`); }],
                      ].map(([label, fn]) => (
                        <button key={label} onClick={() => { fn(); document.getElementById(`export-menu-${r.id}`).style.display = "none"; }}
                          style={{ display:"block", width:"100%", padding:"8px 12px", background:"none", border:"none", fontSize:13, color:C.navy, cursor:"pointer", textAlign:"left", fontFamily:"inherit", borderRadius:5 }}
                          onMouseEnter={e=>e.target.style.background=C.bg}
                          onMouseLeave={e=>e.target.style.background="none"}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Btn small variant="ghost" onClick={() => del(r.id)}>🗑</Btn>
                </div>
              </Card>
            );
          })}
          <div onClick={() => onNav("builder")} style={{ border:`2px dashed ${C.border}`, borderRadius:12, padding:"40px 24px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", color:C.textMuted, minHeight:200 }}>
            <div style={{ fontSize:32, marginBottom:8 }}>＋</div>
            <div style={{ fontSize:14, fontWeight:600 }}>Create New Resume</div>
          </div>
        </div>
      )}

      <SectionTitle sub="Choose a starting template. Free templates available to all users. Premium templates unlock with a paid plan.">Resume Templates</SectionTitle>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16 }}>
        {dbTemplates.map(t => (
          <Card key={t.id} hover style={{ textAlign:"center", cursor:"pointer", padding:0, overflow:"hidden" }} onClick={() => onNav("builder")}>
            {/* Template mini-preview */}
            <div style={{ height:120, background:`${t.accent_color || C.teal}10`, position:"relative", overflow:"hidden", display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"10px 12px" }}>
              {/* Simulated resume header */}
              <div style={{ width:"100%", background:"#fff", borderRadius:4, padding:"8px 10px", boxShadow:"0 2px 8px rgba(0,0,0,0.1)" }}>
                {t.header_style === "bold_banner" ? (
                  <div style={{ background:t.accent_color || C.teal, margin:"-8px -10px 6px", padding:"6px 10px", borderRadius:"4px 4px 0 0" }}>
                    <div style={{ height:6, background:"rgba(255,255,255,0.9)", borderRadius:2, marginBottom:3, width:"60%" }} />
                    <div style={{ height:3, background:"rgba(255,255,255,0.6)", borderRadius:2, width:"40%" }} />
                  </div>
                ) : (
                  <div style={{ borderBottom:`2px solid ${t.accent_color || C.teal}`, paddingBottom:4, marginBottom:5 }}>
                    <div style={{ height:6, background:"#1E293B", borderRadius:2, marginBottom:3, width:"55%", ...(t.header_style === "centered" ? { margin:"0 auto 3px" } : {}) }} />
                    <div style={{ height:3, background:t.accent_color || C.teal, borderRadius:2, width:"35%", ...(t.header_style === "centered" ? { margin:"0 auto" } : {}) }} />
                  </div>
                )}
                {[70, 90, 80, 60, 85].map((w, i) => (
                  <div key={i} style={{ height:2, background:"#E2E8F0", borderRadius:1, marginBottom:2, width:`${w}%` }} />
                ))}
              </div>
            </div>
            <div style={{ padding:"12px 14px" }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:3 }}>{t.name}</div>
              <div style={{ fontSize:11, color:C.textMuted, marginBottom:8 }}>{t.description}</div>
              <div style={{ display:"flex", gap:6, justifyContent:"center", flexWrap:"wrap" }}>
                {t.tier === "free" ? <Badge color="teal">Free</Badge> : <Badge color="gold">⭐ {t.tier === "premium" ? "Pro" : "Career+"}</Badge>}
                {t.ats_friendly && <Badge color="green">ATS</Badge>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Resume Builder ─────────────────────────────────────────────────────────
const DEFAULT_SECTIONS = [
  { section_type:"name",           label:"Name & Contact",      icon:"👤", is_required:true,  is_visible:true, display_order:0, content:{} },
  { section_type:"summary",        label:"Professional Summary", icon:"📝", is_required:false, is_visible:true, display_order:1, content:{text:""} },
  { section_type:"skills",         label:"Skills",              icon:"⚡", is_required:false, is_visible:true, display_order:2, content:{text:""} },
  { section_type:"experience",     label:"Work Experience",     icon:"💼", is_required:false, is_visible:true, display_order:3, content:{text:""} },
  { section_type:"education",      label:"Education",           icon:"🎓", is_required:false, is_visible:true, display_order:4, content:{text:""} },
  { section_type:"certifications", label:"Certifications",      icon:"🏅", is_required:false, is_visible:true, display_order:5, content:{text:""} },
  { section_type:"projects",       label:"Projects",            icon:"🚀", is_required:false, is_visible:false, display_order:6, content:{text:""} },
  { section_type:"awards",         label:"Awards",              icon:"🏆", is_required:false, is_visible:false, display_order:7, content:{text:""} },
  { section_type:"volunteer",      label:"Volunteer",           icon:"🤝", is_required:false, is_visible:false, display_order:8, content:{text:""} },
];

// ── Resume Document Preview ───────────────────────────────────────────────
// Renders the resume as a real document page based on template settings
function ResumeDocument({ contactFields, sections, tmpl, style = {} }) {
  const visible = [...sections]
    .filter(s => s.is_visible && s.section_type !== "name")
    .sort((a, b) => a.display_order - b.display_order);

  const margins = { tight: "24px 28px", normal: "32px 40px", wide: "40px 56px" }[tmpl.page_margin] || "32px 40px";
  const sectionGap = { compact: 12, normal: 18, spacious: 26 }[tmpl.section_spacing] || 18;
  const fontSize = tmpl.base_font_size || 13;

  // Heading style renderer
  const SectionHeading = ({ label }) => {
    const base = { margin: `0 0 8px`, fontSize: fontSize - 1, fontWeight: 700, color: tmpl.accent_color, textTransform: "uppercase", letterSpacing: "0.08em" };
    if (tmpl.heading_style === "underlined") return <h2 style={{ ...base, textTransform:"none", fontSize: fontSize + 1, borderBottom: `2px solid ${tmpl.accent_color}`, paddingBottom: 4 }}>{label}</h2>;
    if (tmpl.heading_style === "accent_bar") return (
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <div style={{ width:4, height:16, background:tmpl.accent_color, borderRadius:2 }} />
        <h2 style={{ ...base, margin:0 }}>{label}</h2>
      </div>
    );
    if (tmpl.heading_style === "minimal") return <h2 style={{ ...base, color:"#374151", fontWeight:600, letterSpacing:"0.04em" }}>{label}</h2>;
    return <h2 style={base}>{label}</h2>; // uppercase default
  };

  // Header styles
  const renderHeader = () => {
    const name = contactFields.name || "Your Name";
    const headline = contactFields.headline || "";
    const contact = [contactFields.email, contactFields.phone, contactFields.location].filter(Boolean).join(" · ");
    const links = [contactFields.linkedin, contactFields.github, contactFields.website].filter(Boolean).join(" · ");

    if (tmpl.header_style === "bold_banner") return (
      <div style={{ background: tmpl.accent_color, color:"#fff", padding:"20px 24px", margin: `-${margins.split(" ")[0]} -${margins.split(" ")[1]} 20px`, borderRadius:"4px 4px 0 0" }}>
        <div style={{ fontSize: fontSize + 14, fontWeight:800, letterSpacing:"-0.02em" }}>{name}</div>
        {headline && <div style={{ fontSize: fontSize + 1, opacity:0.9, marginTop:4 }}>{headline}</div>}
        <div style={{ fontSize: fontSize - 1, opacity:0.8, marginTop:6 }}>{contact}</div>
        {links && <div style={{ fontSize: fontSize - 2, opacity:0.7, marginTop:3 }}>{links}</div>}
      </div>
    );

    if (tmpl.header_style === "centered") return (
      <div style={{ textAlign:"center", paddingBottom:16, marginBottom:16, borderBottom:`2px solid ${tmpl.accent_color}` }}>
        <div style={{ fontSize: fontSize + 14, fontWeight:800, color:"#0F172A", letterSpacing:"-0.02em" }}>{name}</div>
        {headline && <div style={{ fontSize: fontSize + 1, color:tmpl.accent_color, fontWeight:600, marginTop:4 }}>{headline}</div>}
        <div style={{ fontSize: fontSize - 1, color:"#64748B", marginTop:6 }}>{contact}</div>
        {links && <div style={{ fontSize: fontSize - 2, color:"#94A3B8", marginTop:3 }}>{links}</div>}
      </div>
    );

    // default left / simple
    return (
      <div style={{ paddingBottom:14, marginBottom:14, borderBottom:`3px solid ${tmpl.accent_color}` }}>
        <div style={{ fontSize: fontSize + 13, fontWeight:800, color:"#0F172A", letterSpacing:"-0.02em" }}>{name}</div>
        {headline && <div style={{ fontSize: fontSize + 1, color:tmpl.accent_color, fontWeight:600, marginTop:3 }}>{headline}</div>}
        <div style={{ fontSize: fontSize - 1, color:"#64748B", marginTop:5 }}>{contact}</div>
        {links && <div style={{ fontSize: fontSize - 2, color:"#94A3B8", marginTop:3 }}>{links}</div>}
      </div>
    );
  };

  return (
    <div style={{
      background:"#fff", fontFamily: tmpl.font_family || "DM Sans, sans-serif",
      fontSize: fontSize, color:"#1E293B", lineHeight:1.6,
      padding: margins, boxShadow:"0 4px 32px rgba(0,0,0,0.12)",
      width:"100%", minHeight:800, boxSizing:"border-box",
      ...style,
    }}>
      {renderHeader()}
      {visible.map(s => (
        <div key={s.section_type || s.id} style={{ marginBottom: sectionGap }}>
          <SectionHeading label={s.label} />
          <div style={{ fontSize, color:"#334155", lineHeight:1.65, whiteSpace:"pre-wrap" }}>
            {s.content?.text || ""}
          </div>
        </div>
      ))}
    </div>
  );
}


// ── Font presets ───────────────────────────────────────────────────────────
const FONT_PRESETS = [
  { label:"DM Sans",      value:"DM Sans, sans-serif",        category:"Modern" },
  { label:"Georgia",      value:"Georgia, serif",              category:"Classic" },
  { label:"Garamond",     value:"Garamond, serif",             category:"Classic" },
  { label:"Helvetica",    value:"Helvetica, Arial, sans-serif",category:"Clean" },
  { label:"Lato",         value:"Lato, sans-serif",            category:"Modern" },
  { label:"Merriweather", value:"Merriweather, serif",         category:"Classic" },
  { label:"Montserrat",   value:"Montserrat, sans-serif",      category:"Bold" },
  { label:"Nunito",       value:"Nunito, sans-serif",          category:"Friendly" },
  { label:"Open Sans",    value:"Open Sans, sans-serif",       category:"Clean" },
  { label:"Playfair",     value:"Playfair Display, serif",     category:"Elegant" },
  { label:"Raleway",      value:"Raleway, sans-serif",         category:"Modern" },
  { label:"Courier New",  value:"Courier New, monospace",      category:"Technical" },
];

const HEADER_LAYOUTS = [
  { id:"left",        label:"Left Aligned",  icon:"⬅", tier:"free" },
  { id:"centered",    label:"Centered",      icon:"↔", tier:"free" },
  { id:"bold_banner", label:"Bold Banner",   icon:"█", tier:"premium" },
  { id:"sidebar",     label:"Sidebar",       icon:"▊", tier:"premium" },
];

function BuilderPage({ profileForm, profileSkills, profileWork, profileEdu, user }) {
  const profile = profileForm || EMPTY_USER;
  const skills  = profileSkills || [];
  const work    = profileWork   || [];
  const edu     = profileEdu    || [];
  const isPaid  = user?.subscription !== "free";

  // ── State ─────────────────────────────────────────────────────────────
  const [resumeId,       setResumeId]       = useState(null);
  const [resumeName,     setResumeName]      = useState("My Resume");
  const [sections,       setSections]        = useState(null);
  const [headerConfig,   setHeaderConfig]   = useState(null);
  const [showHeaderPanel, setShowHeaderPanel] = useState(false);
  const [jobEntries,     setJobEntries]      = useState([]); // individual job blocks
  const [templates,      setTemplates]       = useState([]);
  const [selectedTmpl,   setSelectedTmpl]    = useState(null);
  const [customFont,     setCustomFont]      = useState(null); // overrides template font
  const [headerLayout,   setHeaderLayout]    = useState(null); // overrides template header_style
  const [activeSection,  setActiveSection]   = useState("summary");
  const [activeJobId,    setActiveJobId]     = useState(null);
  const [saveState,      setSaveState]       = useState("idle");
  const [importing,      setImporting]       = useState(false);
  const [importedFile,   setImportedFile]    = useState(null);
  const [parseError,     setParseError]      = useState(null);
  const [dropActive,     setDropActive]      = useState(false);
  const [showTemplates,  setShowTemplates]   = useState(false);
  const [showFonts,      setShowFonts]       = useState(false);
  const [showDesign,     setShowDesign]      = useState(false);
  const [dragId,         setDragId]          = useState(null);
  const [dragJobId,      setDragJobId]       = useState(null);
  const [previewMode,    setPreviewMode]     = useState(false);
  const [panelOpen,      setPanelOpen]       = useState(true);
  const fileRef    = useRef(null);
  const previewRef = useRef(null);

  // ── Derived template values ────────────────────────────────────────────
  const tmpl = selectedTmpl || { font_family:"DM Sans, sans-serif", accent_color:C.teal, header_style:"left", heading_style:"uppercase", page_margin:"normal", section_spacing:"normal", base_font_size:13 };
  const accent     = tmpl.accent_color || C.teal;
  const fontFamily = customFont || tmpl.font_family || "DM Sans, sans-serif";
  const hdrLayout  = headerLayout || tmpl.header_style || "left";
  const fontSize   = tmpl.base_font_size || 13;
  const sGap       = { compact:10, normal:18, spacious:28 }[tmpl.section_spacing] || 18;
  const margins    = tmpl.page_margin === "tight" ? "32px 40px" : tmpl.page_margin === "wide" ? "52px 72px" : "44px 56px";

  // ── Init ───────────────────────────────────────────────────────────────
  const defaultHeaderConfig = useCallback(() => ({
    // Content fields — pre-filled from profile but resume-specific
    name:               profile.name || "",
    headline:           "",          // intentionally blank — user should set per resume
    email:              profile.email || "",
    phone:              profile.phone || "",
    location:           profile.location || "",
    linkedin:           "",
    website:            "",
    github:             "",
    custom_contact_line: "",
    // Visibility flags — all on by default except custom and headline
    show_headline:      false,       // off by default — user opts in
    show_email:         true,
    show_phone:         true,
    show_location:      true,
    show_linkedin:      false,
    show_website:       false,
    show_github:        false,
    show_custom:        false,
    layout:             "left",
  }), [profile]);

  const buildDefaultSections = useCallback(() => DEFAULT_SECTIONS.map((s, i) => {
    let text = "";
    if (s.section_type === "summary")    text = profile.summary || "";
    if (s.section_type === "skills")     text = skills.map(sk => sk.skill_name).join(", ");
    if (s.section_type === "education")  text = edu.map(e => `${e.degree || ""} — ${e.institution || ""}, ${e.graduation_year || ""}`).join("\n");
    if (s.section_type === "certifications") text = "";
    return { ...s, id: `local_${i}`, resume_id: null, user_id: user?.id, content: { text }, display_order: i };
  }), [profile, skills, edu, user?.id]);

  const buildDefaultJobs = useCallback(() => work.map((w, i) => ({
    id: `local_job_${i}`, user_id: user?.id, resume_id: null,
    job_title: w.job_title || "", company: w.company || "",
    location: w.location || "", start_date: w.start_date || "",
    end_date: w.end_date || "", is_current: w.is_current || false,
    description: w.description || "", bullet_points: [], skills_used: [], achievements: [],
    display_order: i, is_visible: true, source: "profile",
  })), [work, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("resume_templates").select("*").eq("is_active", true).order("sort_order")
      .then(({ data }) => {
        const ts = data || [];
        setTemplates(ts);
        const modern = ts.find(t => t.slug === "modern") || ts[0];
        if (modern) setSelectedTmpl(modern);
      });

    supabase.from("resumes").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1)
      .then(async ({ data }) => {
        const existing = data?.[0];
        if (existing) {
          setResumeId(existing.id);
          setResumeName(existing.name || "My Resume");
          // Load sections
          const { data: secs } = await supabase.from("resume_sections").select("*").eq("resume_id", existing.id).order("display_order");
          if (secs?.length) {
            setSections(secs);
            const nameSection = secs.find(s => s.section_type === "name");
            setHeaderConfig(nameSection?.content || defaultHeaderConfig());
            // Restore custom font and header layout from layout_config
            const layoutCfg = secs.find(s => s.section_type === "name")?.layout_config_json || {};
            if (layoutCfg.custom_font)   setCustomFont(layoutCfg.custom_font);
            if (layoutCfg.header_layout) setHeaderLayout(layoutCfg.header_layout);
          } else {
            setSections(buildDefaultSections());
            setHeaderConfig(defaultHeaderConfig());
          }
          // Load job entries
          const { data: jobs } = await supabase.from("work_experience_entries").select("*").eq("resume_id", existing.id).order("display_order");
          setJobEntries(jobs?.length ? jobs : buildDefaultJobs());
          // Load template
          if (existing.selected_template_id) {
            const { data: tmplData } = await supabase.from("resume_templates").select("*").eq("id", existing.selected_template_id).single();
            if (tmplData) setSelectedTmpl(tmplData);
          }
        } else {
          setSections(buildDefaultSections());
          setHeaderConfig(defaultHeaderConfig());
          setJobEntries(buildDefaultJobs());
        }
      });
  }, [user?.id]); // eslint-disable-line

  // ── Section drag-and-drop ─────────────────────────────────────────────
  const onDragStart = (e, id) => { setDragId(id); e.dataTransfer.effectAllowed = "move"; };
  const onDragOver  = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const onDrop      = (e, targetId) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) { setDragId(null); return; }
    setSections(ss => {
      const arr = [...ss].sort((a, b) => a.display_order - b.display_order);
      const fi = arr.findIndex(s => (s.id || s.section_type) === dragId);
      const ti = arr.findIndex(s => (s.id || s.section_type) === targetId);
      const r  = [...arr]; const [m] = r.splice(fi, 1); r.splice(ti, 0, m);
      return r.map((s, i) => ({ ...s, display_order: i }));
    });
    setDragId(null);
  };

  // ── Job drag-and-drop (item level) ────────────────────────────────────
  const onJobDragStart = (e, id) => { setDragJobId(id); e.dataTransfer.effectAllowed = "move"; };
  const onJobDragOver  = (e) => { e.preventDefault(); };
  const onJobDrop      = (e, targetId) => {
    e.preventDefault();
    if (!dragJobId || dragJobId === targetId) { setDragJobId(null); return; }
    setJobEntries(jobs => {
      const arr = [...jobs].sort((a, b) => a.display_order - b.display_order);
      const fi  = arr.findIndex(j => j.id === dragJobId);
      const ti  = arr.findIndex(j => j.id === targetId);
      const r   = [...arr]; const [m] = r.splice(fi, 1); r.splice(ti, 0, m);
      return r.map((j, i) => ({ ...j, display_order: i }));
    });
    setDragJobId(null);
  };

  const toggleVisible = (id) => setSections(ss => ss.map(s => (s.id || s.section_type) === id ? { ...s, is_visible: !s.is_visible } : s));
  const setContent    = (id, text) => setSections(ss => ss.map(s => (s.id || s.section_type) === id ? { ...s, content: { ...s.content, text } } : s));

  const addJob = () => {
    const newJob = {
      id: `local_job_${Date.now()}`, user_id: user?.id, resume_id: resumeId,
      job_title:"", company:"", location:"", start_date:"", end_date:"",
      is_current:false, description:"", bullet_points:[], skills_used:[], achievements:[],
      display_order: jobEntries.length, is_visible:true, source:"manual",
    };
    setJobEntries(js => [...js, newJob]);
    setActiveJobId(newJob.id);
    setActiveSection("experience");
  };

  const updateJob = (id, field, value) => setJobEntries(js => js.map(j => j.id === id ? { ...j, [field]: value } : j));
  const deleteJob = (id) => setJobEntries(js => js.filter(j => j.id !== id).map((j, i) => ({ ...j, display_order: i })));
  const dupJob    = (job) => {
    const dup = { ...job, id:`local_job_${Date.now()}`, display_order: jobEntries.length };
    setJobEntries(js => [...js, dup]);
  };

  const addCustomSection = () => {
    const newSec = {
      id: `local_custom_${Date.now()}`, resume_id: resumeId, user_id: user?.id,
      section_type: `custom_${Date.now()}`, label:"Custom Section", icon:"📌",
      is_required:false, is_visible:true, content:{ text:"" }, display_order:(sections?.length || 0),
    };
    setSections(ss => [...(ss || []), newSec]);
    setActiveSection(newSec.id);
  };

  // ── Save ──────────────────────────────────────────────────────────────
  const saveResume = async () => {
    if (!user?.id) return;
    setSaveState("saving");
    try {
      let rid = resumeId;
      if (rid) {
        await supabase.from("resumes").update({ name:resumeName, updated_at:new Date().toISOString(), selected_template_id:selectedTmpl?.id||null }).eq("id", rid);
      } else {
        const { data } = await supabase.from("resumes").insert({ user_id:user.id, name:resumeName, template:selectedTmpl?.slug||"modern", selected_template_id:selectedTmpl?.id||null, is_primary:false, contact_fields:contactFields, sections:[] }).select().single();
        rid = data?.id; setResumeId(rid);
      }
      if (!rid) throw new Error("No resume ID");

      // Save sections (store custom font + header layout in name section layout_config)
      const allSections = (sections || []).map(s => ({
        resume_id:    rid, user_id:user.id, section_type:s.section_type, label:s.label,
        content:      s.section_type === "name" ? headerConfig : (s.content || {}),
        display_order:s.display_order, is_visible:s.is_visible, is_required:s.is_required||false,
        layout_config_json: s.section_type === "name" ? { custom_font:customFont, header_layout:headerLayout } : (s.layout_config_json||{}),
      }));
      await supabase.from("resume_sections").delete().eq("resume_id", rid);
      if (allSections.length) await supabase.from("resume_sections").insert(allSections);

      // Save job entries
      await supabase.from("work_experience_entries").delete().eq("resume_id", rid);
      const jobRows = jobEntries.filter(j => j.job_title || j.company).map(j => ({
        user_id:j.user_id||user.id, resume_id:rid, job_title:j.job_title||null,
        company:j.company||null, location:j.location||null,
        start_date:j.start_date||null, end_date:j.end_date||null,
        is_current:j.is_current||false, description:j.description||null,
        bullet_points:j.bullet_points||[], skills_used:j.skills_used||[], achievements:j.achievements||[],
        display_order:j.display_order, is_visible:j.is_visible!==false, source:j.source||"manual",
      }));
      if (jobRows.length) await supabase.from("work_experience_entries").insert(jobRows);

      setSaveState("saved"); setTimeout(() => setSaveState("idle"), 2500);
    } catch (err) {
      console.error("[BuilderPage] save error:", err.message);
      setSaveState("error"); setTimeout(() => setSaveState("idle"), 3000);
    }
  };

  // ── PDF Export ─────────────────────────────────────────────────────────
  const exportPDF = async () => {
    if (!previewRef.current) return;
    if (!window.html2pdf) {
      await new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
        s.onload = res; s.onerror = rej; document.head.appendChild(s);
      });
    }
    window.html2pdf().set({
      margin:[10,10,10,10], filename:`${resumeName.replace(/\s+/g,"_")}.pdf`,
      image:{ type:"jpeg", quality:0.98 },
      html2canvas:{ scale:2, useCORS:true, letterRendering:true },
      jsPDF:{ unit:"mm", format:"a4", orientation:"portrait" },
    }).from(previewRef.current).save();
  };

  // ── File import (parse resume) ─────────────────────────────────────────
  const processFile = async (file) => {
    if (!file || !file.name.match(/\.(pdf|docx|doc|txt)$/i)) { setParseError("Please upload a PDF, DOCX, or plain text file."); return; }
    setImportedFile(file); setImporting(true); setParseError(null);
    const userId = user?.id;
    const safeFile = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uploadPath = `${userId}/${Date.now()}_${safeFile}`;
    const storagePath = `resumes/${uploadPath}`;
    try {
      const { error: uploadError } = await supabase.storage.from("resumes").upload(uploadPath, file, { contentType:file.type||"application/octet-stream", upsert:false });
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
      const { data:rowData, error:rowError } = await supabase.from("parsed_resumes").insert({ user_id:userId, storage_path:storagePath, original_filename:file.name, parse_status:"processing" }).select().single();
      if (rowError) throw new Error(`DB row failed: ${rowError.message}`);
      const parsed = await edgeFetch("parse-resume", { user_id:userId, storage_path:storagePath, original_filename:file.name, parsed_resume_id:rowData.id });

      // Update header config from parsed data (only fill empty fields)
      setHeaderConfig(f => ({
        ...f,
        name:     parsed.full_name || f.name,
        email:    parsed.email     || f.email,
        phone:    parsed.phone     || f.phone,
        location: parsed.location  || f.location,
        show_phone:    !!(parsed.phone    || f.phone),
        show_location: !!(parsed.location || f.location),
      }));

      // Update text sections
      setSections(ss => ss.map(s => {
        if (s.section_type === "summary"        && parsed.summary)                  return { ...s, content:{ text:parsed.summary } };
        if (s.section_type === "skills"         && parsed.skills?.length)           return { ...s, content:{ text:parsed.skills.map(sk => sk.skill_name||sk.name).filter(Boolean).join(", ") } };
        if (s.section_type === "education"      && parsed.education?.length)        return { ...s, content:{ text:parsed.education.map(e => `${e.degree||""} — ${e.institution||""}, ${e.graduation_year||""}`).join("\n") } };
        if (s.section_type === "certifications" && parsed.certifications?.length)   return { ...s, content:{ text:Array.isArray(parsed.certifications) ? parsed.certifications.map(c => typeof c==="string"?c:c.name).join("\n") : "" } };
        return s;
      }));

      // Convert parsed work experience into individual job blocks
      if (parsed.work_experience?.length) {
        const parsedJobs = parsed.work_experience.map((w, i) => ({
          id:`parsed_job_${Date.now()}_${i}`, user_id:userId, resume_id:resumeId,
          job_title:w.job_title||"", company:w.company||"", location:w.location||"",
          start_date:w.start_date||"", end_date:w.end_date||"", is_current:w.is_current||false,
          description:w.description||"", bullet_points:[], skills_used:[], achievements:[],
          display_order:i, is_visible:true, source:"resume_parsed",
        }));
        setJobEntries(parsedJobs);
      }
    } catch (err) { setParseError(err.message||"Parse failed."); }
    setImporting(false);
  };

  const sorted = sections ? [...sections].sort((a, b) => a.display_order - b.display_order) : [];
  const sortedJobs = [...jobEntries].sort((a, b) => a.display_order - b.display_order);
  const hc = headerConfig || {}; // shorthand for header config

  // ── Section heading (respects template) ───────────────────────────────
  const SectionHeading = ({ label }) => {
    if (tmpl.heading_style === "accent_bar") return (
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <div style={{ width:4, height:16, background:accent, borderRadius:2, flexShrink:0 }} />
        <div style={{ fontSize:fontSize-1, fontWeight:700, color:accent, textTransform:"uppercase", letterSpacing:"0.08em" }}>{label}</div>
      </div>
    );
    if (tmpl.heading_style === "underlined") return (
      <div style={{ fontSize:fontSize+1, fontWeight:700, color:"#0F172A", borderBottom:`2px solid ${accent}`, paddingBottom:4, marginBottom:8 }}>{label}</div>
    );
    if (tmpl.heading_style === "minimal") return (
      <div style={{ fontSize:fontSize-1, fontWeight:600, color:"#64748B", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>{label}</div>
    );
    return <div style={{ fontSize:fontSize-1, fontWeight:700, color:accent, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>{label}</div>;
  };

  // ── Resume header renderer ─────────────────────────────────────────────
  // Reads headerConfig visibility flags; editing=true shows inline inputs
  const setHC = (field, val) => setHeaderConfig(h => ({ ...h, [field]: val }));
  const isBanner = hdrLayout === "bold_banner";
  const textColor = isBanner ? "#fff" : "#0F172A";
  const subColor  = isBanner ? "rgba(255,255,255,0.85)" : accent;
  const contactColor = isBanner ? "rgba(255,255,255,0.75)" : "#64748B";
  const linkColor    = isBanner ? "rgba(255,255,255,0.6)"  : "#94A3B8";
  const inputStyle = (extra={}) => ({ background:"transparent", border:"none", outline:"none", fontFamily, ...extra });

  const ResumeHeader = ({ editing }) => {
    const nameEl = editing
      ? <input value={hc.name||""} onChange={e=>setHC("name",e.target.value)} placeholder="Your Name" style={inputStyle({ fontSize:fontSize+14, fontWeight:800, letterSpacing:"-0.02em", color:textColor, width:"100%", display:"block" })} />
      : <div style={{ fontSize:fontSize+14, fontWeight:800, letterSpacing:"-0.02em", color:textColor }}>{hc.name||"Your Name"}</div>;

    const headlineEl = (hc.show_headline && (editing || hc.headline)) && (
      editing
        ? <input value={hc.headline||""} onChange={e=>setHC("headline",e.target.value)} placeholder="Professional Headline (optional)" style={inputStyle({ fontSize:fontSize+1, fontWeight:600, color:subColor, width:"100%", display:"block", marginTop:4 })} />
        : hc.headline ? <div style={{ fontSize:fontSize+1, fontWeight:600, color:subColor, marginTop:4 }}>{hc.headline}</div> : null
    );

    // Build contact line — only visible fields
    const contactItems = [
      hc.show_email    && hc.email,
      hc.show_phone    && hc.phone,
      hc.show_location && hc.location,
    ].filter(Boolean);
    const linkItems = [
      hc.show_linkedin && hc.linkedin,
      hc.show_website  && hc.website,
      hc.show_github   && hc.github,
      hc.show_custom   && hc.custom_contact_line,
    ].filter(Boolean);

    const contactLineEl = editing ? (
      <div style={{ display:"flex", gap:10, marginTop:5, flexWrap:"wrap" }}>
        {hc.show_email    && <input value={hc.email||""}    onChange={e=>setHC("email",e.target.value)}    placeholder="email@example.com" style={inputStyle({ fontSize:fontSize-1, color:contactColor, minWidth:140 })} />}
        {hc.show_phone    && <input value={hc.phone||""}    onChange={e=>setHC("phone",e.target.value)}    placeholder="Phone"            style={inputStyle({ fontSize:fontSize-1, color:contactColor, minWidth:110 })} />}
        {hc.show_location && <input value={hc.location||""} onChange={e=>setHC("location",e.target.value)} placeholder="City, State"      style={inputStyle({ fontSize:fontSize-1, color:contactColor, minWidth:110 })} />}
        {hc.show_linkedin && <input value={hc.linkedin||""} onChange={e=>setHC("linkedin",e.target.value)} placeholder="linkedin.com/in/…" style={inputStyle({ fontSize:fontSize-2, color:linkColor, minWidth:140 })} />}
        {hc.show_website  && <input value={hc.website||""}  onChange={e=>setHC("website",e.target.value)}  placeholder="yoursite.com"     style={inputStyle({ fontSize:fontSize-2, color:linkColor, minWidth:120 })} />}
        {hc.show_github   && <input value={hc.github||""}   onChange={e=>setHC("github",e.target.value)}   placeholder="github.com/…"     style={inputStyle({ fontSize:fontSize-2, color:linkColor, minWidth:120 })} />}
        {hc.show_custom   && <input value={hc.custom_contact_line||""} onChange={e=>setHC("custom_contact_line",e.target.value)} placeholder="Custom contact info" style={inputStyle({ fontSize:fontSize-2, color:linkColor, minWidth:140 })} />}
      </div>
    ) : (
      <>
        {contactItems.length > 0 && <div style={{ fontSize:fontSize-1, color:contactColor, marginTop:5 }}>{contactItems.join(" · ")}</div>}
        {linkItems.length   > 0 && <div style={{ fontSize:fontSize-2, color:linkColor, marginTop:2 }}>{linkItems.join(" · ")}</div>}
      </>
    );

    const align = hdrLayout === "centered" ? "center" : "left";
    const inner = <>{nameEl}{headlineEl}{contactLineEl}</>;
    const [mTop, mSide] = margins.split(" ");
    const bannerMargin = `-${mTop} -${mSide} 20px`;

    if (hdrLayout === "bold_banner") return (
      <div style={{ background:accent, padding:"20px 24px", margin:bannerMargin, borderRadius:"4px 4px 0 0", cursor:editing?"default":"pointer" }}
        onClick={!editing ? ()=>setShowHeaderPanel(true) : undefined}>
        {inner}
      </div>
    );

    return (
      <div style={{ textAlign:align, paddingBottom:14, marginBottom:14, borderBottom:`3px solid ${accent}`, cursor:editing?"default":"pointer" }}
        onClick={!editing ? ()=>setShowHeaderPanel(true) : undefined}>
        {inner}
      </div>
    );
  };

  // ── Job block renderer ─────────────────────────────────────────────────
  const JobBlock = ({ job, editing }) => {
    const isActiveJob = activeJobId === job.id && activeSection === "experience";
    const isDraggingJob = dragJobId === job.id;
    const isDropTarget = dragJobId && dragJobId !== job.id;
    const dateStr = job.start_date ? `${job.start_date} – ${job.is_current ? "Present" : (job.end_date||"")}` : "";
    if (!editing) return (
      <div style={{ marginBottom:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
          <div style={{ fontWeight:700, fontSize:fontSize, color:"#0F172A" }}>{job.job_title || "Job Title"}</div>
          <div style={{ fontSize:fontSize-2, color:"#64748B" }}>{dateStr}</div>
        </div>
        <div style={{ fontSize:fontSize-1, color:accent, fontWeight:600 }}>{job.company}{job.location ? ` · ${job.location}` : ""}</div>
        {job.description && <div style={{ fontSize:fontSize-1, color:"#334155", marginTop:4, whiteSpace:"pre-wrap", lineHeight:1.6 }}>{job.description}</div>}
      </div>
    );
    return (
      <div
        draggable
        onDragStart={e => onJobDragStart(e, job.id)}
        onDragOver={onJobDragOver}
        onDrop={e => onJobDrop(e, job.id)}
        onDragEnd={() => setDragJobId(null)}
        style={{
          marginBottom:10, padding:"10px 10px 10px 32px", borderRadius:8, position:"relative",
          border:`1px solid ${isActiveJob ? accent : isDraggingJob ? accent+"88" : C.border}`,
          background: isActiveJob ? `${accent}06` : isDraggingJob ? `${accent}11` : "#FAFAFA",
          opacity: isDraggingJob ? 0.4 : 1, cursor:"text", transition:"border-color 0.15s",
        }}
        onMouseEnter={e => { if(!isActiveJob) e.currentTarget.style.borderColor = accent+"66"; }}
        onMouseLeave={e => { if(!isActiveJob) e.currentTarget.style.borderColor = C.border; }}
        onClick={() => { setActiveJobId(job.id); setActiveSection("experience"); }}
      >
        {/* Drop indicator */}
        {isDropTarget && (
          <div style={{ position:"absolute", top:-1, left:0, right:0, height:2, background:accent, borderRadius:1 }} />
        )}

        {/* Dot-grid drag handle */}
        <div
          style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", cursor:"grab", padding:"4px 2px", userSelect:"none" }}
          title="Drag to reorder jobs"
        >
          {[0,1,2].map(row => (
            <div key={row} style={{ display:"flex", gap:2, marginBottom:row<2?2:0 }}>
              <div style={{ width:3, height:3, borderRadius:"50%", background:"#CBD5E1" }} />
              <div style={{ width:3, height:3, borderRadius:"50%", background:"#CBD5E1" }} />
            </div>
          ))}
        </div>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:isActiveJob?10:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, minWidth:0 }}>
            {isActiveJob
              ? <input value={job.job_title||""} onChange={e=>updateJob(job.id,"job_title",e.target.value)} placeholder="Job Title" style={{ fontWeight:700, fontSize:fontSize, border:"none", outline:"none", fontFamily, background:"transparent", color:"#0F172A", flex:1, minWidth:0 }} />
              : <div style={{ fontWeight:700, fontSize:fontSize, color:"#0F172A", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{job.job_title||"(no title)"}</div>
            }
            {isActiveJob
              ? <input value={job.company||""} onChange={e=>updateJob(job.id,"company",e.target.value)} placeholder="Company" style={{ fontSize:fontSize-1, color:accent, fontWeight:600, border:"none", outline:"none", fontFamily, background:"transparent", width:130 }} />
              : <div style={{ fontSize:fontSize-1, color:accent, fontWeight:600, flexShrink:0 }}>{job.company}</div>
            }
          </div>
          <div style={{ display:"flex", gap:4, flexShrink:0, marginLeft:8 }}>
            <button onClick={e=>{e.stopPropagation();dupJob(job);}} title="Duplicate job" style={{ background:"#F1F5F9",border:`1px solid ${C.border}`,cursor:"pointer",fontSize:11,color:C.slate,padding:"2px 6px",borderRadius:4 }}>⎘ Dup</button>
            <button onClick={e=>{e.stopPropagation();deleteJob(job.id);}} title="Delete job" style={{ background:"#FEF2F2",border:`1px solid #FECACA`,cursor:"pointer",fontSize:11,color:C.danger,padding:"2px 6px",borderRadius:4 }}>✕ Del</button>
          </div>
        </div>
        {isActiveJob && (
          <div style={{ display:"grid", gap:8 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr auto", gap:8, alignItems:"center" }}>
              <input value={job.location||""} onChange={e=>updateJob(job.id,"location",e.target.value)} placeholder="Location" style={{ fontSize:12, padding:"4px 8px", border:`1px solid ${C.border}`, borderRadius:6, fontFamily, outline:"none" }} />
              <input type="date" value={job.start_date||""} onChange={e=>updateJob(job.id,"start_date",e.target.value)} style={{ fontSize:12, padding:"4px 8px", border:`1px solid ${C.border}`, borderRadius:6, fontFamily, outline:"none" }} />
              {job.is_current ? <div style={{ fontSize:12, color:C.success, padding:"4px 8px" }}>Present</div> : <input type="date" value={job.end_date||""} onChange={e=>updateJob(job.id,"end_date",e.target.value)} style={{ fontSize:12, padding:"4px 8px", border:`1px solid ${C.border}`, borderRadius:6, fontFamily, outline:"none" }} />}
              <label style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, cursor:"pointer" }}>
                <input type="checkbox" checked={job.is_current||false} onChange={e=>updateJob(job.id,"is_current",e.target.checked)} style={{ accentColor:accent }} />Current
              </label>
            </div>
            <textarea value={job.description||""} onChange={e=>updateJob(job.id,"description",e.target.value)} placeholder="Describe your role, responsibilities, and achievements…" rows={4} style={{ width:"100%", padding:"6px 8px", border:`1px solid ${C.border}`, borderRadius:6, fontSize:fontSize-1, fontFamily, outline:"none", resize:"vertical", lineHeight:1.6, boxSizing:"border-box" }} />
          </div>
        )}
        {!isActiveJob && job.description && (
          <div style={{ fontSize:fontSize-1, color:"#334155", marginTop:4, lineHeight:1.6, whiteSpace:"pre-wrap" }}>{job.description.slice(0,120)}{job.description.length>120?"…":""}</div>
        )}
      </div>
    );
  };

  // ── PREVIEW MODE ─────────────────────────────────────────────────────
  if (previewMode) return (
    <div>
      <div style={{ position:"sticky", top:0, zIndex:10, background:"#1E293B", padding:"10px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, borderRadius:10 }}>
        <div style={{ fontSize:13, fontWeight:600, color:"#94A3B8" }}>Preview — {resumeName}</div>
        <div style={{ display:"flex", gap:8 }}>
          <Btn small onClick={exportPDF} variant="secondary">⬇ Export PDF</Btn>
          <Btn small onClick={() => setPreviewMode(false)}>← Back to Editor</Btn>
        </div>
      </div>
      <div style={{ display:"flex", justifyContent:"center", background:"#E2E8F0", padding:"32px 24px", borderRadius:12, minHeight:800 }}>
        <div ref={previewRef} style={{ width:816, background:"#fff", boxShadow:"0 8px 48px rgba(0,0,0,0.18)", fontFamily, fontSize, color:"#1E293B", padding:margins, boxSizing:"border-box", lineHeight:1.6 }}>
          <ResumeHeader editing={false} />
          {sorted.filter(s => s.is_visible && s.section_type !== "name").map(s => (
            <div key={s.section_type||s.id} style={{ marginBottom:sGap }}>
              <SectionHeading label={s.label} />
              {s.section_type === "experience"
                ? <div>{sortedJobs.filter(j=>j.is_visible!==false).map(j => <JobBlock key={j.id} job={j} editing={false} />)}</div>
                : <div style={{ fontSize, color:"#334155", lineHeight:1.65, whiteSpace:"pre-wrap" }}>{s.content?.text||""}</div>
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── EDIT MODE — 3-panel Canva-style layout ───────────────────────────
  const activeSec = sorted.find(s => (s.id||s.section_type) === activeSection);

  // Right panel — context-aware
  const RightPanel = () => {
    if (showHeaderPanel) return (
      <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
        <div style={{ padding:"16px 16px 12px", borderBottom:`1px solid ${C.border}` }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.navy }}>Header</div>
          <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>Edit contact info and visibility</div>
        </div>
        <div style={{ overflowY:"auto", flex:1, padding:16, display:"flex", flexDirection:"column", gap:10 }}>
          {[
            ["name","Full Name","text"],["headline","Headline / Title","text"],["email","Email","email"],
            ["phone","Phone","tel"],["location","Location","text"],["linkedin","LinkedIn URL","text"],
            ["website","Website","text"],["github","GitHub","text"],["custom_contact_line","Custom Line","text"],
          ].map(([field,label,type]) => (
            <div key={field}>
              <div style={{ fontSize:11, color:C.textMuted, marginBottom:3, fontWeight:600 }}>{label}</div>
              <input type={type} value={hc[field]||""} onChange={e=>setHC(field,e.target.value)} placeholder={label}
                style={{ width:"100%", padding:"7px 9px", border:`1px solid ${C.border}`, borderRadius:6, fontSize:12, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
            </div>
          ))}
          <div style={{ paddingTop:12, borderTop:`1px solid ${C.border}` }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.navy, marginBottom:8 }}>Show / Hide</div>
            {[
              ["show_headline","Headline"],["show_email","Email"],["show_phone","Phone"],
              ["show_location","Location"],["show_linkedin","LinkedIn"],["show_website","Website"],
              ["show_github","GitHub"],["show_custom","Custom Line"],
            ].map(([field,label]) => (
              <label key={field} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 0", cursor:"pointer" }}>
                <input type="checkbox" checked={hc[field]||false} onChange={e=>setHC(field,e.target.checked)} style={{ accentColor:C.teal, width:14, height:14 }} />
                <span style={{ fontSize:12, color:hc[field]?C.tealDark:C.slate }}>{label}</span>
              </label>
            ))}
          </div>
          <div style={{ paddingTop:12, borderTop:`1px solid ${C.border}` }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.navy, marginBottom:8 }}>Header Layout</div>
            {HEADER_LAYOUTS.map(h => {
              const locked = h.tier==="premium" && !isPaid;
              const isActive = hdrLayout===h.id;
              return (
                <div key={h.id} onClick={()=>{ if(!locked) setHeaderLayout(h.id); }}
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", borderRadius:7, marginBottom:4, cursor:locked?"not-allowed":"pointer", border:`1px solid ${isActive?C.teal:C.border}`, background:isActive?C.tealLight:"transparent", opacity:locked?0.55:1 }}>
                  <span style={{ fontSize:16 }}>{h.icon}</span>
                  <span style={{ fontSize:12, flex:1, color:C.navy }}>{h.label}</span>
                  {locked && <span style={{ fontSize:10, color:C.gold }}>Pro</span>}
                  {isActive && <span style={{ fontSize:11, color:C.teal, fontWeight:700 }}>check</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );

    if (activeSection === "experience") return (
      <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
        <div style={{ padding:"16px 16px 12px", borderBottom:`1px solid ${C.border}` }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.navy }}>Work Experience</div>
          <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>Drag jobs to reorder</div>
        </div>
        <div style={{ padding:16 }}>
          <button onClick={addJob} style={{ width:"100%", padding:"9px", background:C.teal, border:"none", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:700, color:"#fff", fontFamily:"inherit", marginBottom:12 }}>Add Job</button>
          {sortedJobs.map(j => (
            <div key={j.id} onClick={()=>setActiveJobId(j.id)}
              style={{ padding:"8px 10px", borderRadius:7, border:`1px solid ${activeJobId===j.id?C.teal:C.border}`, background:activeJobId===j.id?C.tealLight:"transparent", cursor:"pointer", marginBottom:6 }}>
              <div style={{ fontSize:12, fontWeight:600, color:C.navy }}>{j.job_title||"(no title)"}</div>
              <div style={{ fontSize:11, color:C.textMuted }}>{j.company||""}</div>
            </div>
          ))}
        </div>
      </div>
    );

    // Default sections list
    return (
      <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
        <div style={{ padding:"16px 16px 12px", borderBottom:`1px solid ${C.border}` }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.navy }}>Sections</div>
          <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>Click to edit</div>
        </div>
        <div style={{ overflowY:"auto", flex:1, padding:12 }}>
          {sorted.map(s => {
            const sid = s.id||s.section_type;
            return (
              <div key={sid} onClick={()=>{ setActiveSection(sid); if(s.section_type==="name") setShowHeaderPanel(true); else setShowHeaderPanel(false); }}
                style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:7, marginBottom:3, cursor:"pointer", border:`1px solid ${activeSection===sid?C.teal:"transparent"}`, background:activeSection===sid?C.tealLight:"transparent", opacity:s.is_visible?1:0.4 }}>
                <span style={{ fontSize:12 }}>{s.icon||"doc"}</span>
                <span style={{ flex:1, fontSize:12, fontWeight:activeSection===sid?700:400, color:activeSection===sid?C.tealDark:C.navy, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.label}</span>
                {!s.is_required && <button onClick={e=>{e.stopPropagation();toggleVisible(sid);}} style={{ background:"none",border:"none",cursor:"pointer",fontSize:10,color:C.textLight,padding:2 }}>{s.is_visible?"hide":"show"}</button>}
              </div>
            );
          })}
          <button onClick={addCustomSection} style={{ width:"100%", background:"none", border:`1.5px dashed ${C.border}`, borderRadius:7, padding:"7px", cursor:"pointer", fontSize:11, color:C.textMuted, fontFamily:"inherit", marginTop:6 }}>+ Add Section</button>
        </div>
        <div style={{ padding:"12px 14px", borderTop:`1px solid ${C.border}` }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.navy, marginBottom:6 }}>Import Resume</div>
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display:"none" }} onChange={e=>processFile(e.target.files[0])} />
          <div onClick={()=>fileRef.current?.click()}
            onDragEnter={e=>{e.preventDefault();setDropActive(true);}}
            onDragOver={e=>{e.preventDefault();setDropActive(true);}}
            onDragLeave={()=>setDropActive(false)}
            onDrop={e=>{e.preventDefault();setDropActive(false);processFile(e.dataTransfer.files[0]);}}
            style={{ border:`2px dashed ${dropActive?C.teal:C.border}`, borderRadius:7, padding:"10px 8px", textAlign:"center", cursor:"pointer", background:dropActive?C.tealLight:C.bg, fontSize:11, color:C.textMuted }}>
            {importing?"Parsing...":importedFile?"Done: "+importedFile.name:"Drop PDF/DOCX"}
          </div>
          {parseError && <div style={{ fontSize:11, color:C.danger, marginTop:4 }}>Error: {parseError}</div>}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 80px)", overflow:"hidden", margin:"-20px -32px", fontFamily:"inherit" }}>

      {/* Top bar */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 20px", background:"#fff", borderBottom:`1px solid ${C.border}`, flexShrink:0, gap:8, flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <input value={resumeName} onChange={e=>setResumeName(e.target.value)} style={{ fontSize:15, fontWeight:700, color:C.navy, border:"none", background:"transparent", outline:"none", fontFamily:"inherit", borderBottom:`2px solid ${C.border}`, padding:"2px 0", minWidth:160 }} />
          {saveState==="saved" && <span style={{ fontSize:11, color:C.success, fontWeight:600 }}>Saved</span>}
          {saveState==="error" && <span style={{ fontSize:11, color:C.danger }}>Save failed</span>}
        </div>
        <div style={{ display:"flex", gap:4, alignItems:"center" }}>
          {[
            ["Template", ()=>{ setShowTemplates(!showTemplates); setShowFonts(false); setShowDesign(false); }, showTemplates],
            ["Header",   ()=>{ setShowHeaderPanel(!showHeaderPanel); setShowTemplates(false); setShowFonts(false); setShowDesign(false); }, showHeaderPanel],
            ["Font",     ()=>{ setShowFonts(!showFonts); setShowTemplates(false); setShowDesign(false); setShowHeaderPanel(false); }, showFonts],
            ["Design",   ()=>{ setShowDesign(!showDesign); setShowTemplates(false); setShowFonts(false); setShowHeaderPanel(false); }, showDesign],
          ].map(([label, handler, active]) => (
            <button key={label} onClick={handler} style={{ padding:"6px 12px", borderRadius:7, border:`1px solid ${active?C.teal:C.border}`, background:active?C.tealLight:"transparent", fontSize:12, fontWeight:600, color:active?C.tealDark:C.slate, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}>{label}</button>
          ))}
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <Btn small variant="secondary" onClick={()=>setPreviewMode(true)}>Preview</Btn>
          <Btn small variant="secondary" onClick={exportPDF}>PDF</Btn>
          <Btn small disabled={saveState==="saving"} onClick={saveResume}>{saveState==="saving"?"Saving...":"Save"}</Btn>
        </div>
      </div>

      {/* Design panels */}
      {(showTemplates || showFonts || showDesign) && (
        <div style={{ background:C.bgCard, borderBottom:`1px solid ${C.border}`, padding:"14px 20px", flexShrink:0 }}>
          {showTemplates && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.navy }}>Choose Template</div>
                <Btn small variant="ghost" onClick={()=>setShowTemplates(false)}>Done</Btn>
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {templates.map(t => (
                  <div key={t.id} onClick={()=>setSelectedTmpl(t)} style={{ padding:"8px 12px", borderRadius:8, cursor:"pointer", transition:"all 0.15s", border:`2px solid ${selectedTmpl?.id===t.id?t.accent_color||C.teal:C.border}`, borderLeft:`4px solid ${t.accent_color||C.teal}`, background:selectedTmpl?.id===t.id?`${t.accent_color||C.teal}11`:C.bg }}>
                    <div style={{ fontSize:12, fontWeight:700, color:C.navy }}>{t.name}</div>
                    <div style={{ fontSize:10, color:C.textMuted, marginTop:1 }}>{t.tier==="free"?"Free":"Pro"}</div>
                    {selectedTmpl?.id===t.id && <div style={{ fontSize:10, color:t.accent_color||C.teal, fontWeight:700, marginTop:2 }}>Active</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {showFonts && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.navy }}>Font</div>
                <Btn small variant="ghost" onClick={()=>setShowFonts(false)}>Done</Btn>
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {FONT_PRESETS.map(f => (
                  <div key={f.value} onClick={()=>setCustomFont(f.value)} style={{ padding:"6px 12px", borderRadius:7, cursor:"pointer", transition:"all 0.15s", border:`2px solid ${(customFont||tmpl.font_family)===f.value?C.teal:C.border}`, background:(customFont||tmpl.font_family)===f.value?C.tealLight:C.bg }}>
                    <div style={{ fontSize:13, fontFamily:f.value, fontWeight:600, color:C.navy }}>{f.label}</div>
                    <div style={{ fontSize:10, color:C.textMuted }}>{f.category}</div>
                  </div>
                ))}
                {customFont && <button onClick={()=>setCustomFont(null)} style={{ padding:"6px 12px", borderRadius:7, border:`1px solid ${C.border}`, background:"transparent", fontSize:11, color:C.textMuted, cursor:"pointer", fontFamily:"inherit" }}>Reset</button>}
              </div>
            </div>
          )}
          {showDesign && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.navy }}>Header Layout</div>
                <Btn small variant="ghost" onClick={()=>setShowDesign(false)}>Done</Btn>
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {HEADER_LAYOUTS.map(h => {
                  const locked = h.tier==="premium" && !isPaid;
                  const isActive = hdrLayout===h.id;
                  return (
                    <div key={h.id} onClick={()=>{ if(!locked) setHeaderLayout(h.id); }} style={{ padding:"8px 14px", borderRadius:8, cursor:locked?"not-allowed":"pointer", transition:"all 0.15s", border:`2px solid ${isActive?C.teal:C.border}`, background:isActive?C.tealLight:locked?"#F8FAFC":C.bg, opacity:locked?0.6:1 }}>
                      <div style={{ fontSize:18, marginBottom:3 }}>{h.icon}</div>
                      <div style={{ fontSize:12, fontWeight:600, color:C.navy }}>{h.label}</div>
                      {locked && <div style={{ fontSize:10, color:C.gold, marginTop:2 }}>Pro</div>}
                      {isActive && <div style={{ fontSize:10, color:C.teal, fontWeight:700, marginTop:2 }}>Active</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3-panel area */}
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* Left sidebar */}
        <div style={{ width:220, flexShrink:0, background:"#fff", borderRight:`1px solid ${C.border}`, overflowY:"auto", display:"flex", flexDirection:"column" }}>
          <div style={{ padding:"14px 14px 10px", borderBottom:`1px solid ${C.border}` }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.navy }}>Sections</div>
            <div style={{ fontSize:10, color:C.textMuted, marginTop:2 }}>Drag on canvas to reorder</div>
          </div>
          <div style={{ flex:1, padding:10, overflowY:"auto" }}>
            <div onClick={()=>{ setActiveSection("name"); setShowHeaderPanel(true); }}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:7, marginBottom:3, cursor:"pointer", border:`1px solid ${showHeaderPanel?C.teal:"transparent"}`, background:showHeaderPanel?C.tealLight:"transparent" }}>
              <span style={{ fontSize:12 }}>👤</span>
              <span style={{ flex:1, fontSize:12, fontWeight:showHeaderPanel?700:400, color:showHeaderPanel?C.tealDark:C.navy }}>Header / Contact</span>
            </div>
            {sorted.filter(s=>s.section_type!=="name").map(s => {
              const sid = s.id||s.section_type;
              return (
                <div key={sid} onClick={()=>{ setActiveSection(sid); setShowHeaderPanel(false); }}
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:7, marginBottom:3, cursor:"pointer", border:`1px solid ${activeSection===sid&&!showHeaderPanel?C.teal:"transparent"}`, background:activeSection===sid&&!showHeaderPanel?C.tealLight:"transparent", opacity:s.is_visible?1:0.45 }}>
                  <span style={{ fontSize:12 }}>{s.icon||"📄"}</span>
                  <span style={{ flex:1, fontSize:12, fontWeight:activeSection===sid?700:400, color:activeSection===sid&&!showHeaderPanel?C.tealDark:C.navy, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.label}</span>
                  {!s.is_required && <button onClick={e=>{e.stopPropagation();toggleVisible(sid);}} style={{ background:"none",border:"none",cursor:"pointer",fontSize:10,color:C.textLight,padding:2 }}>{s.is_visible?"👁":"+"}</button>}
                </div>
              );
            })}
            <button onClick={addCustomSection} style={{ width:"100%", background:"none", border:`1.5px dashed ${C.border}`, borderRadius:7, padding:"7px", cursor:"pointer", fontSize:11, color:C.textMuted, fontFamily:"inherit", marginTop:6 }}>+ Add Section</button>
          </div>
          <div style={{ padding:"12px 14px", borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.navy, marginBottom:6 }}>Import Resume</div>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display:"none" }} onChange={e=>processFile(e.target.files[0])} />
            <div onClick={()=>fileRef.current?.click()}
              onDragEnter={e=>{e.preventDefault();setDropActive(true);}}
              onDragOver={e=>{e.preventDefault();setDropActive(true);}}
              onDragLeave={()=>setDropActive(false)}
              onDrop={e=>{e.preventDefault();setDropActive(false);processFile(e.dataTransfer.files[0]);}}
              style={{ border:`2px dashed ${dropActive?C.teal:C.border}`, borderRadius:7, padding:"9px 8px", textAlign:"center", cursor:"pointer", background:dropActive?C.tealLight:C.bg, fontSize:11, color:C.textMuted }}>
              {importing?"Parsing...":importedFile?"Done":"Drop PDF"}
            </div>
            {parseError && <div style={{ fontSize:11, color:C.danger, marginTop:4 }}>Error: {parseError}</div>}
          </div>
        </div>

        {/* Canvas */}
        <div style={{ flex:1, overflowY:"auto", background:"#E8EEF4", display:"flex", flexDirection:"column", alignItems:"center", padding:"32px 24px" }}>
          <div style={{ fontSize:11, color:"#94A3B8", marginBottom:16, letterSpacing:"0.04em", textAlign:"center" }}>
            Drag sections to reorder - Click to edit
          </div>
          <div style={{ width:"100%", maxWidth:794, background:"#fff", boxShadow:"0 8px 48px rgba(0,0,0,0.15)", fontFamily, fontSize, color:"#1E293B", padding:margins, boxSizing:"border-box", lineHeight:1.6, minHeight:1024 }}>

            {/* Header */}
            <div style={{ position:"relative", cursor:"pointer", marginBottom:sGap }} onClick={()=>{ setShowHeaderPanel(true); setActiveSection("name"); }}>
              <ResumeHeader editing={true} />
            </div>

            {/* Sections */}
            {sorted.filter(s=>s.is_visible).map(s => {
              if(s.section_type==="name") return null;
              const sid = s.id||s.section_type;
              const isActive = activeSection===sid && !showHeaderPanel;
              const isDragging = dragId===sid;
              return (
                <div key={sid}
                  draggable
                  onDragStart={e=>onDragStart(e,sid)}
                  onDragOver={onDragOver}
                  onDrop={e=>onDrop(e,sid)}
                  onDragEnd={()=>setDragId(null)}
                  style={{ marginBottom:sGap, position:"relative", borderRadius:8, border:isActive?`2px solid ${accent}`:isDragging?`2px dashed ${accent}`:`2px solid transparent`, padding:"8px 10px 8px 28px", background:isActive?`${accent}06`:"transparent", opacity:isDragging?0.4:1, transition:"border-color 0.15s" }}
                  onMouseEnter={e=>{ if(!isActive&&!isDragging) e.currentTarget.style.borderColor=C.border; }}
                  onMouseLeave={e=>{ if(!isActive&&!isDragging) e.currentTarget.style.borderColor="transparent"; }}
                >
                  {dragId && dragId!==sid && <div style={{ position:"absolute", top:-2, left:0, right:0, height:3, background:accent, borderRadius:2, opacity:0.6 }} />}
                  <div style={{ position:"absolute", left:6, top:"50%", transform:"translateY(-50%)", cursor:"grab", userSelect:"none" }}>
                    {[0,1,2].map(r=>(<div key={r} style={{ display:"flex", gap:2, marginBottom:r<2?2:0 }}><div style={{ width:3,height:3,borderRadius:"50%",background:"#CBD5E1" }}/><div style={{ width:3,height:3,borderRadius:"50%",background:"#CBD5E1" }}/></div>))}
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                    <div onClick={()=>{ setActiveSection(sid); setShowHeaderPanel(false); }} style={{ cursor:"pointer", flex:1 }}>
                      <SectionHeading label={s.label} />
                    </div>
                    <button onClick={()=>{ setActiveSection(isActive?"":sid); setShowHeaderPanel(false); }} style={{ background:"none", border:`1px solid ${C.border}`, cursor:"pointer", fontSize:11, color:C.textMuted, padding:"2px 7px", borderRadius:5, fontFamily:"inherit" }}>
                      {isActive?"Done":"Edit"}
                    </button>
                  </div>
                  {s.section_type==="experience" ? (
                    <div>
                      {sortedJobs.filter(j=>j.is_visible!==false).map(j=><JobBlock key={j.id} job={j} editing={true} />)}
                      <button onClick={addJob} style={{ background:"none", border:`1.5px dashed ${C.border}`, borderRadius:7, padding:"5px 12px", cursor:"pointer", fontSize:11, color:C.textMuted, fontFamily:"inherit", marginTop:4, width:"100%" }}>+ Add Job</button>
                    </div>
                  ) : isActive ? (
                    <textarea autoFocus value={s.content?.text||""} onChange={e=>setContent(sid,e.target.value)} style={{ width:"100%", border:"none", outline:"none", resize:"none", fontFamily, fontSize, color:"#334155", lineHeight:1.65, background:"transparent", padding:0, minHeight:60, boxSizing:"border-box" }} rows={5} placeholder={`Enter your ${s.label.toLowerCase()}...`} />
                  ) : (
                    <div onClick={()=>{ setActiveSection(sid); setShowHeaderPanel(false); }} style={{ fontSize, color:s.content?.text?"#334155":"#CBD5E1", lineHeight:1.65, whiteSpace:"pre-wrap", minHeight:22, cursor:"text" }}>
                      {s.content?.text||`Click to add ${s.label.toLowerCase()}...`}
                    </div>
                  )}
                </div>
              );
            })}
            {sorted.filter(s=>!s.is_visible&&s.section_type!=="name").length>0 && (
              <div style={{ marginTop:12, padding:"6px 12px", background:"#F1F5F9", borderRadius:7, fontSize:11, color:C.textMuted }}>
                Hidden: {sorted.filter(s=>!s.is_visible&&s.section_type!=="name").map(s=>s.label).join(", ")}
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ width:260, flexShrink:0, background:"#fff", borderLeft:`1px solid ${C.border}`, overflowY:"auto", display:"flex", flexDirection:"column" }}>
          <RightPanel />
          {!isPaid && (
            <div style={{ margin:12, padding:"10px 12px", background:"#FFFBEB", border:`1px solid #F6E05E`, borderRadius:8 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#92600A", marginBottom:4 }}>Pro Features</div>
              <div style={{ fontSize:11, color:"#92600A", lineHeight:1.5 }}>Banner headers, sidebar layouts, premium templates.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// ── AI Optimizer ──────────────────────────────────────────────────────────
function AIOptimizerPage({ profileForm, profileSkills, profileWork, profileEdu, user }) {
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

// ── AI History ────────────────────────────────────────────────────────────
// ── Cover Letter Page ─────────────────────────────────────────────────────
function CoverLetterPage({ profileForm, profileSkills, profileWork, user }) {
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
    <div>
      <SectionTitle sub="Generate a tailored AI cover letter in seconds. Customized to the job and your background.">
        AI Cover Letter Generator
      </SectionTitle>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
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

function HistoryPage({ onNav }) {
  return (
    <div>
      <SectionTitle sub="All your past AI resume analyses.">AI Analysis History</SectionTitle>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {SEED_ANALYSES.map(a=>(
          <Card key={a.id} hover>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:16, fontWeight:700, color:C.navy }}>{a.jobTitle}</div>
                <div style={{ fontSize:13, color:C.textMuted }}>{a.company} · {a.date}</div>
                <div style={{ fontSize:13, color:C.slate, marginTop:4 }}>Resume: {a.resumeName}</div>
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:30, fontWeight:800, color:a.matchScore>=80?C.success:a.matchScore>=60?C.warning:C.danger }}>{a.matchScore}%</div>
                <div style={{ fontSize:12, color:C.textMuted }}>match</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Edge Function base URL ─────────────────────────────────────────────────
// Set this to your Supabase project URL in production.
const EDGE_URL = (typeof window !== "undefined" && window.__SUPABASE_EDGE_URL__)
  || `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

// ── Authenticated Edge Function fetch ──────────────────────────────────────
async function edgeFetch(path, body) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not logged in. Please refresh and try again.");
  const res = await fetch(`${EDGE_URL}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || `Server error ${res.status}`);
  return data;
}

// ── Stripe price IDs — read from env so they work in test + live mode ────────
const STRIPE_PRICES = {
  premium:        import.meta.env.VITE_STRIPE_PRICE_PREMIUM        || "price_1TeQPBJxspsNVfjVzD3WsCCd",
  premium_plus:   import.meta.env.VITE_STRIPE_PRICE_PREMIUM_PLUS   || "price_1TeQPNJxspsNVfjVdvwY3eOR",
  recruiter_look: import.meta.env.VITE_STRIPE_PRICE_RECRUITER_LOOK || "price_1TeQPqJxspsNVfjVLm6QbpoM",
};

// ── Feature 1 UI: Subscription Tab ────────────────────────────────────────
function SubscriptionTab({ user, plans }) {
  const [checkoutLoading, setCheckoutLoading] = useState(null); // which plan is loading
  const [checkoutError, setCheckoutError]     = useState(null);

  const startCheckout = async (priceId, planId) => {
    setCheckoutLoading(planId);
    setCheckoutError(null);
    try {
      const data = await edgeFetch("create-checkout-session", {
        price_id:   priceId,
        user_id:    user.id,
        user_email: user.email,
      });
      window.location.href = data.url;
    } catch (err) {
      setCheckoutError(err.message || "Could not start checkout. Please try again.");
      setCheckoutLoading(null);
    }
  };

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20, marginBottom:24 }}>
        {plans.map(p => (
          <Card key={p.id} style={{ border:p.highlight?`2px solid ${C.teal}`:`1px solid ${C.border}`, position:"relative", display:"flex", flexDirection:"column" }}>
            {p.highlight && (
              <div style={{ position:"absolute", top:-13, left:"50%", transform:"translateX(-50%)" }}>
                <Badge color="teal">Most Popular</Badge>
              </div>
            )}
            <div style={{ fontSize:12, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>{p.name}</div>
            <div style={{ display:"flex", alignItems:"baseline", gap:2, marginBottom:16 }}>
              <span style={{ fontSize:32, fontWeight:800, color:p.highlight?C.teal:C.navy }}>{p.price}</span>
              <span style={{ fontSize:13, color:C.textMuted }}>{p.period}</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:9, marginBottom:24, flex:1 }}>
              {p.features.map(f => (
                <div key={f} style={{ display:"flex", gap:8, fontSize:13, color:C.slate, alignItems:"flex-start" }}>
                  <span style={{ color:C.success, flexShrink:0, marginTop:1 }}>✓</span>{f}
                </div>
              ))}
            </div>
            {p.current
              ? <div style={{ padding:"8px 16px", borderRadius:8, background:C.tealLight, color:C.tealDark, fontSize:13, fontWeight:600, textAlign:"center" }}>Current Plan</div>
              : (
                <Btn
                  full
                  variant={p.highlight ? "primary" : "secondary"}
                  disabled={checkoutLoading === p.id}
                  onClick={() => startCheckout(STRIPE_PRICES[p.id] || "", p.id)}
                >
                  {checkoutLoading === p.id ? "Redirecting…" : p.cta}
                </Btn>
              )
            }
          </Card>
        ))}
      </div>

      {/* 2nd Look recruiter add-on */}
      <Card style={{ border:`2px solid ${C.purple}33`, background:`linear-gradient(135deg,${C.purpleBg},#fff)`, marginBottom:16 }}>
        <div style={{ display:"flex", gap:20, alignItems:"flex-start", flexWrap:"wrap" }}>
          <div style={{ width:52, height:52, borderRadius:14, background:C.purple, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>👤</div>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap", marginBottom:6 }}>
              <div style={{ fontSize:17, fontWeight:800, color:C.navy }}>2nd Look — Recruiter Review</div>
              <div style={{ display:"flex", alignItems:"baseline", gap:2 }}>
                <span style={{ fontSize:22, fontWeight:800, color:C.purple }}>$25</span>
                <span style={{ fontSize:12, color:C.textMuted }}> one-time</span>
              </div>
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"6px 28px", marginBottom:16 }}>
              {["Real recruiter reviews your resume","Written feedback within 48 hours","Tailored to your target role & industry","One round of follow-up questions"].map(f => (
                <div key={f} style={{ display:"flex", gap:6, fontSize:13, color:C.slate, alignItems:"center" }}>
                  <span style={{ color:C.purple }}>→</span>{f}
                </div>
              ))}
            </div>
            <Btn
              variant="purple"
              disabled={checkoutLoading === "recruiter"}
              onClick={() => startCheckout(STRIPE_PRICES.recruiter_look, "recruiter")}
            >
              {checkoutLoading === "recruiter" ? "Redirecting…" : "Request a 2nd Look"}
            </Btn>
          </div>
        </div>
      </Card>

      {checkoutError && (
        <div style={{ padding:"10px 14px", background:C.dangerBg, borderRadius:8, fontSize:13, color:C.danger }}>
          ⚠ {checkoutError}
        </div>
      )}
    </div>
  );
}

// ── Feature 1 UI: Billing Tab ──────────────────────────────────────────────
function BillingTab({ user }) {
  const [loading, setLoading] = useState(false);

  const openPortal = async () => {
    setLoading(true);
    try {
      const data = await edgeFetch("create-billing-portal-session", {
        user_id: user.id, user_email: user.email,
      });
      window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  };

  const sub = user.subscription || "free";
  const isPaid = sub !== "free";

  return (
    <div style={{ maxWidth:560 }}>
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:C.navy }}>Current Plan</div>
            <div style={{ fontSize:13, color:C.textMuted, marginTop:2 }}>
              {sub === "free" ? "Free" : sub === "premium" ? "Pro — $6/mo" : "Career+ — $12/mo"}
            </div>
          </div>
          <Badge color={isPaid ? "teal" : "gray"}>{isPaid ? "Active" : "Free"}</Badge>
        </div>
        {isPaid ? (
          <>
            <div style={{ fontSize:13, color:C.textMuted, marginBottom:16 }}>
              Manage your subscription, update your payment method, or view invoices in the Stripe billing portal.
            </div>
            <Btn onClick={openPortal} disabled={loading} variant="secondary">
              {loading ? "Opening…" : "Open Billing Portal →"}
            </Btn>
          </>
        ) : (
          <div style={{ fontSize:13, color:C.textMuted }}>
            You are on the free plan. Upgrade from the Subscription tab to access billing management.
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Feature 2 UI: Resume Upload Zone (calls parse-resume Edge Function) ────
function ResumeUploadZone({ user, onParsed }) {
  const [active, setActive]     = useState(false);
  const [file, setFile]         = useState(null);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing]   = useState(false);
  const [error, setError]       = useState(null);
  const [done, setDone]         = useState(false);
  const fileRef                 = useRef(null);

  const SUPABASE_URL_CLIENT = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY   = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const accept = ".pdf,.doc,.docx,text/plain,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  const processFile = async (f) => {
    if (!f) return;
    if (!f.name.match(/\.(pdf|docx|doc|txt)$/i)) {
      setError("Please upload a PDF, DOCX, or plain text file.");
      return;
    }
    setFile(f);
    setError(null);
    setDone(false);

    const userId     = user?.id;
    const safeFile   = f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uploadName = `${userId}/${Date.now()}_${safeFile}`;
    const storagePath = `resumes/${uploadName}`;

    try {
      // Step 1 — Upload to Supabase Storage using the authenticated client
      setUploading(true);
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(uploadName, f, {
          contentType: f.type || "application/octet-stream",
          upsert: false,
        });
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
      setUploading(false);

      // Step 2 — Create a pending parsed_resumes row using the authenticated client
      const { data: rowData, error: rowError } = await supabase
        .from("parsed_resumes")
        .insert({
          user_id: userId,
          storage_path: storagePath,
          original_filename: f.name,
          parse_status: "processing",
        })
        .select()
        .single();
      if (rowError) throw new Error(`DB row creation failed: ${rowError.message}`);
      const row = rowData;

      // Step 3 — Trigger parse-resume Edge Function
      setParsing(true);
      const parsed = await edgeFetch("parse-resume", {
        user_id:           userId,
        storage_path:      storagePath,
        original_filename: f.name,
        parsed_resume_id:  row.id,
      });
      setParsing(false);

      // Step 4 — Create a resume record so it appears on the Resumes page
      const resumeName = f.name.replace(/\.(pdf|docx|doc|txt)$/i, "").replace(/_/g, " ");
      const hasResumes = await supabase.from("resumes").select("id").eq("user_id", userId).limit(1);
      const isPrimary  = !hasResumes.data?.length; // first resume becomes primary
      await supabase.from("resumes").insert({
        user_id:        userId,
        name:           resumeName,
        template:       "modern",
        is_primary:     isPrimary,
        storage_path:   storagePath,
        parsed_resume_id: row.id,
        sections:       [],
        contact_fields: {
          name:     parsed.full_name  || "",
          email:    parsed.email      || "",
          phone:    parsed.phone      || "",
          location: parsed.location   || "",
        },
      });

      setDone(true);

      // Pass results up to parent to fill in profile sections
      if (onParsed) onParsed(parsed);
    } catch (err) {
      setUploading(false);
      setParsing(false);
      setError(err.message || "Upload failed. Please try again.");
    }
  };

  const busy = uploading || parsing;

  return (
    <div>
      <input ref={fileRef} type="file" accept={accept} style={{ display:"none" }} onChange={e => processFile(e.target.files[0])} />
      <div
        onClick={() => !busy && fileRef.current?.click()}
        onDragEnter={e => { e.preventDefault(); setActive(true); }}
        onDragOver={e => { e.preventDefault(); setActive(true); }}
        onDragLeave={e => { e.preventDefault(); setActive(false); }}
        onDrop={e => { e.preventDefault(); setActive(false); processFile(e.dataTransfer.files[0]); }}
        style={{
          border: `2px dashed ${active ? C.teal : done ? C.success : error ? C.danger : C.border}`,
          borderRadius:10, padding:"28px 20px", textAlign:"center",
          background: active ? C.tealLight : done ? C.successBg : C.bg,
          cursor: busy ? "not-allowed" : "pointer", transition:"all 0.15s",
        }}
      >
        {uploading && <>
          <div style={{ fontSize:28, marginBottom:8 }}>⬆️</div>
          <div style={{ fontSize:14, fontWeight:600, color:C.navy }}>Uploading to secure storage…</div>
        </>}
        {parsing && <>
          <div style={{ fontSize:28, marginBottom:8 }}>🔍</div>
          <div style={{ fontSize:14, fontWeight:600, color:C.navy }}>Parsing resume with AI…</div>
          <div style={{ fontSize:12, color:C.textMuted, marginTop:4 }}>Extracting your skills, experience, and education</div>
        </>}
        {done && !busy && <>
          <div style={{ fontSize:28, marginBottom:8 }}>✅</div>
          <div style={{ fontSize:14, fontWeight:600, color:C.success }}>{file?.name}</div>
          <div style={{ fontSize:12, color:C.textMuted, marginTop:4 }}>Parsed successfully — sections updated below. Click to replace.</div>
        </>}
        {!busy && !done && <>
          <div style={{ fontSize:32, marginBottom:8 }}>📎</div>
          <div style={{ fontSize:14, color:active ? C.tealDark : C.textMuted, marginBottom:10, fontWeight:active?600:400 }}>
            {active ? "Drop to upload" : "Drag & drop PDF or DOCX"}
          </div>
          <Btn variant="secondary" small>Browse Files</Btn>
          <div style={{ fontSize:12, color:C.textLight, marginTop:10 }}>PDF, DOCX, DOC, TXT · max 10 MB</div>
        </>}
      </div>
      {error && (
        <div style={{ marginTop:8, padding:"8px 12px", background:C.dangerBg, borderRadius:8, fontSize:13, color:C.danger }}>
          ⚠ {error}
        </div>
      )}
    </div>
  );
}

// ── Feature 3 UI: Verification Tab (calls create-identity-session) ─────────
function VerificationTab({ user, onUpdateUser }) {
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  // Read status from user object (set by App from Supabase)
  const status = user.verificationStatus || (user.idVerified ? "verified" : "not_started");

  const startVerification = async () => {
    setLoading(true);
    setError(null);
    try {
      // Pass the current origin so Stripe redirects back here, not to SITE_URL
      // This works both in development (localhost) and production
      const returnUrl = `${window.location.origin}/?tab=verification`;
      const data = await edgeFetch("create-identity-session", {
        user_id:    user.id,
        user_email: user.email,
        return_url: returnUrl,
      });
      window.location.href = data.url;
    } catch (err) {
      setError(err.message || "Could not start verification. Please try again.");
      setLoading(false);
    }
  };

  const statusConfig = {
    not_started:    { color: C.slate,   bg: C.bg,         icon: "🛡", label: "Not started" },
    pending:        { color: C.warning, bg: C.warningBg,  icon: "⏳", label: "Verification in progress" },
    verified:       { color: C.success, bg: C.successBg,  icon: "✓",  label: "Identity Verified" },
    failed:         { color: C.danger,  bg: C.dangerBg,   icon: "✕",  label: "Verification failed" },
    requires_review:{ color: C.warning, bg: C.warningBg,  icon: "👁", label: "Under review" },
  };
  const cfg = statusConfig[status] || statusConfig.not_started;

  return (
    <div style={{ maxWidth:520 }}>
      {status === "verified" ? (
        <Card style={{ textAlign:"center", padding:"40px 32px" }}>
          <div style={{ width:72, height:72, borderRadius:"50%", background:C.successBg, border:`3px solid ${C.success}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:32 }}>✓</div>
          <h3 style={{ margin:"0 0 8px", fontSize:20, fontWeight:700, color:C.success }}>Identity Verified</h3>
          <p style={{ margin:"0 0 20px", fontSize:14, color:C.textMuted }}>Your profile displays a verified badge. Employers see you as a trusted candidate.</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[["👁","3× more profile views"],["🔝","Priority in search"],["🤝","Trusted by employers"],["🛡","Badge on profile"]].map(([i,t]) => (
              <div key={t} style={{ padding:"10px 12px", background:C.successBg, borderRadius:8, fontSize:13, color:C.success, display:"flex", gap:8 }}>
                <span>{i}</span>{t}
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card>
          {/* Current status banner */}
          {status !== "not_started" && (
            <div style={{ padding:"10px 14px", background:cfg.bg, borderRadius:8, marginBottom:20, display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:20 }}>{cfg.icon}</span>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:cfg.color }}>{cfg.label}</div>
                {status === "pending" && <div style={{ fontSize:12, color:C.textMuted }}>We'll update your profile automatically once Stripe completes the check.</div>}
                {status === "failed"  && <div style={{ fontSize:12, color:C.textMuted }}>Verification was unsuccessful. You can try again below.</div>}
                {status === "requires_review" && <div style={{ fontSize:12, color:C.textMuted }}>Our team is reviewing your submission. This usually takes 1-2 business days.</div>}
              </div>
            </div>
          )}

          <div style={{ textAlign:"center", marginBottom:24 }}>
            <div style={{ width:64, height:64, borderRadius:"50%", background:`linear-gradient(135deg,${C.teal},${C.navyMid})`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", fontSize:28 }}>🛡</div>
            <h3 style={{ margin:"0 0 8px", fontSize:18, fontWeight:700, color:C.navy }}>Verify Your Identity</h3>
            <p style={{ margin:0, fontSize:14, color:C.textMuted }}>Boost your visibility and build trust with employers.</p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
            {[["👁","3× more profile views"],["🔝","Priority search results"],["✓","Stand out as verified"],["🤝","Build employer trust"]].map(([i,t]) => (
              <div key={t} style={{ display:"flex", gap:8, padding:"10px 12px", background:C.tealLight, borderRadius:8, fontSize:13, color:C.tealDark, fontWeight:500 }}>
                <span>{i}</span>{t}
              </div>
            ))}
          </div>

          <div style={{ background:C.bg, borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:8 }}>What you'll need</div>
            {["Government-issued photo ID (driver's license or passport)", "A selfie for face matching", "About 5 minutes to complete"].map(r => (
              <div key={r} style={{ display:"flex", gap:8, fontSize:13, color:C.slate, marginBottom:4 }}>
                <span style={{ color:C.teal, flexShrink:0 }}>→</span>{r}
              </div>
            ))}
          </div>

          <div style={{ display:"flex", gap:10, padding:"12px 14px", background:"#F8FAFC", border:`1px solid ${C.border}`, borderRadius:10, marginBottom:20 }}>
            <span style={{ fontSize:18 }}>🔒</span>
            <div style={{ fontSize:12, color:C.textMuted, lineHeight:1.5 }}>
              <strong style={{ color:C.navy }}>Powered by Stripe Identity.</strong> Your documents are encrypted, processed by Stripe, and never shared with employers or stored by Jobvair.
            </div>
          </div>

          {error && (
            <div style={{ marginBottom:14, padding:"10px 14px", background:C.dangerBg, borderRadius:8, fontSize:13, color:C.danger }}>
              ⚠ {error}
            </div>
          )}

          <Btn full onClick={startVerification} disabled={loading} icon="🛡">
            {loading ? "Starting verification…" : status === "failed" ? "Try Again" : "Start Verification with Stripe"}
          </Btn>
        </Card>
      )}
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────
function SettingsPage({ user, onLogout }) {
  const [tab, setTab] = useState("account");
  const [saved, setSaved] = useState(false);

  // Local editable copies of account fields
  const [accountForm, setAccountForm] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
  });
  const setAF = k => v => setAccountForm(f => ({...f, [k]: v}));

  // Security fields
  const [secForm, setSecForm] = useState({ current:"", next:"", confirm:"" });
  const setSF = k => v => setSecForm(f => ({...f, [k]: v}));
  const [secMsg, setSecMsg] = useState(null);

  const saveAccount = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const savePassword = () => {
    if (!secForm.current) { setSecMsg({ type:"error", text:"Enter your current password." }); return; }
    if (secForm.next.length < 8) { setSecMsg({ type:"error", text:"New password must be at least 8 characters." }); return; }
    if (secForm.next !== secForm.confirm) { setSecMsg({ type:"error", text:"Passwords don't match." }); return; }
    setSecMsg({ type:"success", text:"Password updated successfully." });
    setSecForm({ current:"", next:"", confirm:"" });
  };

  const plans = [
    {
      id:"free", name:"Free", price:"$0", period:"/mo", current:true,
      features:[
        "1 resume",
        "Basic template",
        "3 AI analyses per month",
        "Profile builder",
        "ID verification",
      ],
      cta: "Current Plan",
    },
    {
      id:"pro", name:"Pro", price:"$6", period:"/mo", current:false, highlight:true,
      features:[
        "Unlimited resumes",
        "Unlimited pre-set templates",
        "Extended AI analyses (monthly limit applies)",
        "PDF export",
        "Profile visibility boost",
      ],
      cta: "Upgrade to Pro",
    },
    {
      id:"career", name:"Career+", price:"$12", period:"/mo", current:false,
      features:[
        "Everything in Pro",
        "Unlimited customizable templates",
        "Template database access",
        "Career coaching session",
        "LinkedIn optimization tips",
        "Interview prep AI",
      ],
      cta: "Upgrade to Career+",
    },
  ];

  const addon = {
    name:"2nd Look — Recruiter Review",
    price:"$25",
    period:"one-time",
    icon:"👤",
    color: C.purple,
    colorBg: C.purpleBg,
    features:[
      "Real recruiter reviews your resume",
      "Written feedback within 48 hours",
      "Tailored to your target role & industry",
      "One round of follow-up questions",
    ],
    cta:"Request a 2nd Look",
  };

  return (
    <div>
      <SectionTitle>Settings</SectionTitle>
      <Tabs tabs={[
        { id:"account", label:"Account" },{ id:"security", label:"Security" },
        { id:"subscription", label:"Subscription" },{ id:"billing", label:"Billing" },
        { id:"notifications", label:"Notifications" },
      ]} active={tab} onChange={setTab} />

      {tab==="account" && (
        <div style={{ maxWidth:560 }}>
          <Card>
            <div style={{ display:"flex", gap:20, alignItems:"center", marginBottom:24 }}>
              <div style={{ position:"relative" }}>
                <Avatar name={accountForm.name} size={56} />
                {user.idVerified && <div style={{ position:"absolute", bottom:0, right:0, width:18, height:18, borderRadius:"50%", background:C.teal, border:"2px solid #fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#fff" }}>✓</div>}
              </div>
              <div>
                <div style={{ fontSize:18, fontWeight:700, color:C.navy }}>{accountForm.name || "Your Name"}</div>
                <div style={{ fontSize:14, color:C.textMuted }}>{accountForm.email}</div>
                {user.idVerified && <Badge color="teal" small>🛡 Identity Verified</Badge>}
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <Input label="Full Name" value={accountForm.name} onChange={setAF("name")} placeholder="Your full name" />
              <Input label="Email Address" type="email" value={accountForm.email} onChange={setAF("email")} placeholder="you@email.com" />
              <Input label="Phone Number" value={accountForm.phone} onChange={setAF("phone")} placeholder="(555) 000-0000" />
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <Btn onClick={saveAccount}>Save Changes</Btn>
                {saved && <span style={{ fontSize:13, color:C.success }}>✓ Saved successfully</span>}
              </div>
            </div>
            <div style={{ marginTop:24, paddingTop:20, borderTop:`1px solid ${C.border}` }}>
              <div style={{ fontSize:14, fontWeight:700, color:C.danger, marginBottom:6 }}>Danger Zone</div>
              <div style={{ fontSize:13, color:C.textMuted, marginBottom:12 }}>Permanently delete your account and all data. This cannot be undone.</div>
              <Btn variant="danger" small>Delete My Account</Btn>
            </div>
          </Card>
        </div>
      )}

      {tab==="security" && (
        <div style={{ maxWidth:560 }}>
          <Card>
            <h3 style={{ margin:"0 0 20px", fontSize:16, fontWeight:700, color:C.navy }}>Change Password</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <Input label="Current Password" type="password" value={secForm.current} onChange={setSF("current")} placeholder="••••••••" />
              <Input label="New Password" type="password" value={secForm.next} onChange={setSF("next")} placeholder="At least 8 characters" hint="Use a mix of letters, numbers, and symbols." />
              <Input label="Confirm New Password" type="password" value={secForm.confirm} onChange={setSF("confirm")} placeholder="Repeat new password" />
              {secMsg && (
                <div style={{ padding:"10px 14px", borderRadius:8, fontSize:13, background:secMsg.type==="success"?C.successBg:C.dangerBg, color:secMsg.type==="success"?C.success:C.danger }}>
                  {secMsg.type==="success"?"✓ ":"⚠ "}{secMsg.text}
                </div>
              )}
              <Btn onClick={savePassword} style={{ alignSelf:"flex-start" }}>Update Password</Btn>
            </div>
          </Card>
        </div>
      )}

      {tab==="subscription" && (
        <SubscriptionTab user={user} plans={plans} />
      )}

      {tab==="billing" && (
        <BillingTab user={user} />
      )}

      {tab==="notifications" && (
        <div style={{ maxWidth:560 }}>
          <Card>
            <h3 style={{ margin:"0 0 20px", fontSize:16, fontWeight:700, color:C.navy }}>Notification Preferences</h3>
            {[
              ["AI analysis complete","Notify when your AI analysis is ready"],
              ["New job match alerts","Jobs matching your profile and preferences"],
              ["Profile completion tips","Tips to reach 100% profile completion"],
              ["ID verification reminders","Reminders to complete identity verification"],
              ["Recruiter 2nd Look updates","Status on your recruiter review request"],
              ["Product updates","News about new Jobvair features"],
            ].map(([lbl,sub])=>(
              <div key={lbl} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:`1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:C.navy }}>{lbl}</div>
                  <div style={{ fontSize:13, color:C.textMuted }}>{sub}</div>
                </div>
                <input type="checkbox" defaultChecked style={{ width:18, height:18, accentColor:C.teal, cursor:"pointer" }} />
              </div>
            ))}
          </Card>
        </div>
      )}

      <div style={{ marginTop:24 }}>
        <Btn variant="secondary" onClick={onLogout}>Sign Out</Btn>
      </div>
    </div>
  );
}

// ── App Shell ─────────────────────────────────────────────────────────────
export default function App() {
  const [authUser, setAuthUser]   = useState(undefined); // undefined = loading, null = logged out
  const [page, setPage]           = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  // All profile state lives in the useProfile hook — persisted to Supabase
  const {
    profileForm,   setProfileForm,
    profileSkills, setProfileSkills,
    profileWork,   setProfileWork,
    profileEdu,    setProfileEdu,
    profileCerts,  setProfileCerts,
    profileLoading,
    saveProfile,
    initProfile,
    applyParsedResume,
  } = useProfile();

  // ── Listen for auth state changes (login, logout, token refresh, page reload)
  const [verificationStatus, setVerificationStatus] = useState("not_started");
  const [subscriptionPlan,   setSubscriptionPlan]   = useState("free");

  // Load verification and subscription status from Supabase
  const loadUserStatus = async (userId) => {
    try {
      const [verRes, subRes] = await Promise.all([
        supabase.from("identity_verifications").select("status").eq("user_id", userId).maybeSingle(),
        supabase.from("subscriptions").select("plan").eq("user_id", userId).maybeSingle(),
      ]);
      if (verRes.data?.status) setVerificationStatus(verRes.data.status);
      if (subRes.data?.plan)   setSubscriptionPlan(subRes.data.plan);
    } catch (err) {
      console.error("[App] loadUserStatus error:", err.message);
    }
  };

  useEffect(() => {
    // Get the current session immediately on mount
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      setAuthUser(u);
      if (u) {
        initProfile(u.id, u.email, u.user_metadata?.full_name ?? "");
        loadUserStatus(u.id);
      }
    });

    // Subscribe to future changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const u = session?.user ?? null;
        setAuthUser(u);
        if (event === "SIGNED_IN" && u) {
          await initProfile(u.id, u.email, u.user_metadata?.full_name ?? "");
          await loadUserStatus(u.id);
        }
        if (event === "SIGNED_OUT") {
          setProfileForm(null);
          setProfileSkills([]);
          setProfileWork([]);
          setProfileEdu([]);
          setBuilderSections(null);
          setBuilderContactFields(null);
          setPage("dashboard");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When user returns from Stripe Identity, refresh their verification status
  useEffect(() => {
    if (!authUser) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "verification") {
      setPage("profile");
      // Delay to allow Stripe webhook to process, then reload status
      setTimeout(() => loadUserStatus(authUser.id), 3000);
      // Clean the URL without reloading the page
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [authUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derive a flat user object the rest of the UI expects ──────────────────
  const user = authUser ? {
    id:           authUser.id,
    email:        authUser.email,
    name:         profileForm?.name || authUser.user_metadata?.full_name || authUser.email,
    phone:        profileForm?.phone        ?? "",
    location:     profileForm?.location     ?? "",
    summary:      profileForm?.summary      ?? "",
    desiredTitles:profileForm?.desiredTitles ?? [],
    industries:   profileForm?.industries    ?? [],
    availability: profileForm?.availability  ?? "immediately",
    subscription:        subscriptionPlan,
    idVerified:          verificationStatus === "verified",
    verificationStatus:  verificationStatus,
    employmentStatus:    profileForm?.employmentStatus    ?? "open",
    salaryLevel:         profileForm?.salaryLevel          ?? "senior",
    salaryTarget:        profileForm?.salaryTarget         ?? "",
    backgroundCheck:     profileForm?.backgroundCheck      ?? false,
    wotcEligible:        profileForm?.wotcEligible          ?? false,
    sponsorshipRequired: profileForm?.sponsorshipRequired   ?? false,
    employmentTypes:     profileForm?.employmentTypes       ?? ["full-time"],
    workLocations:       profileForm?.workLocations          ?? ["remote"],
  } : null;

  // Called from AuthScreen after a successful signInWithPassword
  const handleLogin = (supabaseUser) => {
    setAuthUser(supabaseUser);
    initProfile(
      supabaseUser.id,
      supabaseUser.email,
      supabaseUser.user_metadata?.full_name ?? ""
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange SIGNED_OUT handler clears the rest
  };

  const updateUser = u => {
    // Only update the derived display fields; real persistence goes through saveProfile
    setProfileForm(prev => ({ ...(prev ?? {}), ...u }));
  };

  // ── Loading screen while we check for an existing session ─────────────────
  if (authUser === undefined) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:C.bg, fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:44, height:44, borderRadius:10, background:C.teal, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <div style={{ fontSize:14, color:C.textMuted }}>Loading Jobvair…</div>
        </div>
      </div>
    );
  }

  if (!authUser) return <AuthScreen onLogin={handleLogin} />;

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg, fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <Sidebar active={page} onNav={setPage} user={user} collapsed={collapsed} onCollapse={()=>setCollapsed(c=>!c)} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        <div style={{ height:60, background:C.bgCard, borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", flexShrink:0 }}>
          <div style={{ fontSize:14, color:C.textMuted }}>
            {NAV.find(n=>n.id===page)?.icon}{" "}
            <span style={{ color:C.navy, fontWeight:600 }}>{NAV.find(n=>n.id===page)?.label || "Dashboard"}</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            {user?.idVerified && <Badge color="teal" small>🛡 Verified</Badge>}
            <Badge color="gray" small>{user?.subscription==="free"?"Free Plan":"Premium"}</Badge>
            <Avatar name={user?.name} size={32} />
          </div>
        </div>

        {/* Profile loading overlay */}
        {profileLoading && (
          <div style={{ padding:"12px 28px", background:C.tealLight, borderBottom:`1px solid ${C.teal}44`, fontSize:13, color:C.tealDark }}>
            Loading your profile…
          </div>
        )}

        <div style={{ flex:1, padding:"28px 32px", overflowY:"auto" }}>
          {page === "dashboard"   && <DashboardPage user={user} onNav={setPage} />}
          {page === "profile"     && (
            <ProfilePage
              user={user}
              onUpdateUser={updateUser}
              profileForm={profileForm || { ...EMPTY_USER }}
              setProfileForm={setProfileForm}
              profileSkills={profileSkills}
              setProfileSkills={setProfileSkills}
              profileWork={profileWork}
              setProfileWork={setProfileWork}
              profileEdu={profileEdu}
              setProfileEdu={setProfileEdu}
              profileCerts={profileCerts}
              setProfileCerts={setProfileCerts}
              onSave={() => saveProfile(authUser.id)}
              onParsedResume={applyParsedResume}
            />
          )}
          {page === "resumes"     && <ResumesPage onNav={setPage} user={user} />}
          {page === "builder"     && (
            <BuilderPage
              profileForm={profileForm || EMPTY_USER}
              profileSkills={profileSkills}
              profileWork={profileWork}
              profileEdu={profileEdu}
              user={user}
            />
          )}
          {page === "ai-optimize" && (
            <AIOptimizerPage
              profileForm={profileForm || EMPTY_USER}
              profileSkills={profileSkills}
              profileWork={profileWork}
              profileEdu={profileEdu}
              user={user}
            />
          )}
          {page === "cover-letter" && (
            <CoverLetterPage
              profileForm={profileForm || EMPTY_USER}
              profileSkills={profileSkills}
              profileWork={profileWork}
              user={user}
            />
          )}
          {page === "settings"    && <SettingsPage user={user} onLogout={handleLogout} />}
        </div>
      </div>
    </div>
  );
}
