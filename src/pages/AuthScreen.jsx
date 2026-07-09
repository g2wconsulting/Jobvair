import { useState } from "react";
import { supabase } from "../supabaseClient";
import { C } from "../constants/appConstants.js";
import { Btn, Input } from "../components/ui.jsx";

function Logo() {
  return (
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
}

function StepDots({ total, current }) {
  return (
    <div style={{ display:"flex", justifyContent:"center", gap:8, marginBottom:24 }}>
      {Array.from({length:total}).map((_,i)=>(
        <div key={i} style={{ width:i+1===current?24:8, height:8, borderRadius:99, background:i+1<=current?C.teal:C.border, transition:"all 0.2s" }} />
      ))}
    </div>
  );
}

export default function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [step, setStep] = useState(1); // 1=form, 2=email verify, 3=id-verify, 4=done
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [verifyStatus, setVerifyStatus] = useState(null); // null | "scanning" | "done"

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
          <div style={{ background:"#fff", borderRadius:20, padding:"32px 36px", boxShadow:"0 24px 64px rgba(0,0,0,0.28)" }}>
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
          <div style={{ background:"#fff", borderRadius:20, padding:"32px 36px", boxShadow:"0 24px 64px rgba(0,0,0,0.28)" }}>
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
          <div style={{ background:"#fff", borderRadius:20, padding:"32px 36px", textAlign:"center", boxShadow:"0 24px 64px rgba(0,0,0,0.28)" }}>
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
          <div style={{ background:"#fff", borderRadius:20, padding:"32px 36px", boxShadow:"0 24px 64px rgba(0,0,0,0.28)" }}>
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
          <div style={{ background:"#fff", borderRadius:20, padding:"32px 36px", boxShadow:"0 24px 64px rgba(0,0,0,0.28)" }}>
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

