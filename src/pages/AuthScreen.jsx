import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Button, Input } from "../components/ui/index.js";
import { Mail, ShieldCheck, Eye, TrendingUp, Check, Handshake, Lock, RefreshCw, ArrowRight } from "lucide-react";

function Logo() {
  return (
    <div style={{ textAlign: "center", marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 6 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--jv-gradient-primary)", boxShadow: "var(--jv-shadow-glow)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        </div>
        <span style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>Jobvair</span>
      </div>
      <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, margin: 0 }}>AI-Powered Career Platform</p>
    </div>
  );
}

function StepDots({ total, current }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ width: i + 1 === current ? 24 : 8, height: 8, borderRadius: 99, background: i + 1 <= current ? "var(--jv-color-primary)" : "var(--jv-color-border-strong)", transition: "all 0.2s" }} />
      ))}
    </div>
  );
}

const authCardStyle = { background: "#fff", borderRadius: "var(--jv-radius-xl)", padding: "32px 36px", boxShadow: "var(--jv-shadow-lg)" };

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
      email, password, options: { data: { full_name: name } },
    });
    setLoading(false);
    if (error) { setMsg(error.message); return; }
    setStep(2);
  };

  const submitLogin = async () => {
    if (!email || !password) { setMsg("Please fill in all fields."); return; }
    setLoading(true); setMsg("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setMsg(error.message); return; }
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
    setTimeout(() => setVerifyStatus("done"), 1200);
  };

  const finishAuth = () => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) onLogin(data.session.user);
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--jv-gradient-brand)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "var(--jv-font-sans)" }}>
      <div style={{ width: "100%", maxWidth: step === 3 ? 520 : 420 }}>
        <Logo />

        {mode === "login" && (
          <div style={authCardStyle}>
            <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 750, color: "var(--jv-color-heading)" }}>Welcome back</h2>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--jv-color-muted)" }}>Sign in to your Jobvair account</p>
            <form onSubmit={e => { e.preventDefault(); submitLogin(); }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" required />
              <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
              {msg && <div style={{ background: "var(--jv-color-teal-50)", color: "var(--jv-color-teal-700)", padding: "10px 14px", borderRadius: "var(--jv-radius-sm)", fontSize: 13 }}>{msg}</div>}
              <Button type="submit" disabled={loading} full>{loading ? "Please wait…" : "Sign in"}</Button>
            </form>
            <div style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "var(--jv-color-muted)" }}>
              <button onClick={() => { setMode("reset"); setMsg(""); }} style={{ background: "none", border: "none", color: "var(--jv-color-primary)", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>Forgot password?</button>
              <span style={{ margin: "0 8px" }}>·</span>
              <button onClick={() => { setMode("signup"); setMsg(""); }} style={{ background: "none", border: "none", color: "var(--jv-color-primary)", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>Create account</button>
            </div>
          </div>
        )}

        {mode === "signup" && step === 1 && (
          <div style={authCardStyle}>
            <StepDots total={4} current={1} />
            <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 750, color: "var(--jv-color-heading)" }}>Create your account</h2>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--jv-color-muted)" }}>Start your career journey today</p>
            <form onSubmit={e => { e.preventDefault(); submitSignup(); }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} placeholder="Alex Rivera" required />
              <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" required />
              <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a strong password" required />
              {msg && <div style={{ background: "#fef2f2", color: "var(--jv-color-danger-600)", padding: "10px 14px", borderRadius: "var(--jv-radius-sm)", fontSize: 13 }}>{msg}</div>}
              <Button type="submit" disabled={loading} full>{loading ? "Creating account…" : "Create Account"}</Button>
            </form>
            <div style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "var(--jv-color-muted)" }}>
              <button onClick={() => { setMode("login"); setMsg(""); }} style={{ background: "none", border: "none", color: "var(--jv-color-primary)", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>Already have an account? Sign in</button>
            </div>
          </div>
        )}

        {mode === "signup" && step === 2 && (
          <div style={{ ...authCardStyle, textAlign: "center" }}>
            <StepDots total={4} current={2} />
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--jv-color-teal-50)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Mail size={28} color="var(--jv-color-primary)" />
            </div>
            <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 750, color: "var(--jv-color-heading)" }}>Check your email</h2>
            <p style={{ margin: "0 0 6px", fontSize: 14, color: "var(--jv-color-muted)" }}>We sent a verification link to</p>
            <p style={{ margin: "0 0 24px", fontSize: 14, fontWeight: 650, color: "var(--jv-color-heading)" }}>{email}</p>
            <Button full onClick={() => setStep(3)} icon={ArrowRight} iconPosition="right">I've verified my email</Button>
            <button onClick={() => setStep(3)} style={{ background: "none", border: "none", color: "var(--jv-color-muted)", cursor: "pointer", fontSize: 13, marginTop: 14, display: "block", width: "100%", fontFamily: "inherit" }}>Resend email</button>
            <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "var(--jv-color-muted)", cursor: "pointer", fontSize: 12, marginTop: 8, fontFamily: "inherit" }}>← Back</button>
          </div>
        )}

        {mode === "signup" && step === 3 && (
          <div style={authCardStyle}>
            <StepDots total={4} current={3} />
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--jv-gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <ShieldCheck size={28} color="#fff" />
              </div>
              <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 750, color: "var(--jv-color-heading)" }}>Verify your identity</h2>
              <p style={{ margin: 0, fontSize: 14, color: "var(--jv-color-muted)" }}>Stand out to employers as a verified candidate</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[
                { icon: Eye, text: "3× more profile views" },
                { icon: TrendingUp, text: "Priority in search results" },
                { icon: Check, text: "Stand out as verified" },
                { icon: Handshake, text: "Build employer trust" },
              ].map(b => (
                <div key={b.text} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "var(--jv-color-teal-50)", borderRadius: "var(--jv-radius-sm)", fontSize: 13, color: "var(--jv-color-teal-700)", fontWeight: 500 }}>
                  <b.icon size={15} />{b.text}
                </div>
              ))}
            </div>

            <div style={{ background: "var(--jv-color-slate-50)", borderRadius: "var(--jv-radius-md)", padding: "14px 16px", marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--jv-color-heading)", marginBottom: 8 }}>What you'll need</div>
              {["Government-issued photo ID (driver's license or passport)", "A selfie for face matching", "About 5 minutes to complete"].map(r => (
                <div key={r} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--jv-color-text)", marginBottom: 4 }}>
                  <span style={{ color: "var(--jv-color-primary)", flexShrink: 0 }}>→</span>{r}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12, padding: "12px 14px", background: "var(--jv-color-slate-50)", border: "1px solid var(--jv-color-border)", borderRadius: "var(--jv-radius-md)", marginBottom: 20 }}>
              <Lock size={20} color="var(--jv-color-muted)" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: "var(--jv-color-muted)", lineHeight: 1.5 }}>
                <strong style={{ color: "var(--jv-color-heading)" }}>Your data is protected.</strong> Documents are encrypted, never shared with employers, and processed using industry-standard verification technology.
              </div>
            </div>

            {verifyStatus === null && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Button full onClick={startVerify} icon={ShieldCheck}>Start Verification</Button>
                <button onClick={finishAuth} style={{ background: "none", border: "none", color: "var(--jv-color-muted)", cursor: "pointer", fontSize: 13, fontFamily: "inherit", padding: 8 }}>Skip for now — I'll verify later from my profile</button>
              </div>
            )}

            {verifyStatus === "scanning" && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                  <RefreshCw size={32} color="var(--jv-color-primary)" style={{ animation: "jv-spin 1s linear infinite" }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--jv-color-heading)" }}>Processing your documents…</div>
                <div style={{ fontSize: 13, color: "var(--jv-color-muted)", marginTop: 4 }}>This usually takes a moment</div>
                <style>{"@keyframes jv-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }"}</style>
              </div>
            )}

            {verifyStatus === "done" && (
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#dcfce7", border: "2px solid var(--jv-color-success-600)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <Check size={26} color="var(--jv-color-success-600)" />
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--jv-color-success-600)", marginBottom: 6 }}>Identity Verified!</div>
                <div style={{ fontSize: 13, color: "var(--jv-color-muted)", marginBottom: 20 }}>Your profile will now show a verified badge.</div>
                <Button full onClick={finishAuth} icon={ArrowRight} iconPosition="right">Continue to Dashboard</Button>
              </div>
            )}

            <button onClick={() => setStep(2)} style={{ background: "none", border: "none", color: "var(--jv-color-muted)", cursor: "pointer", fontSize: 12, marginTop: 12, display: "block", fontFamily: "inherit" }}>← Back</button>
          </div>
        )}

        {mode === "reset" && (
          <div style={authCardStyle}>
            <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 750, color: "var(--jv-color-heading)" }}>Reset password</h2>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--jv-color-muted)" }}>Enter your email and we'll send a reset link</p>
            <form onSubmit={e => { e.preventDefault(); submitReset(); }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" required />
              {msg && <div style={{ background: "var(--jv-color-teal-50)", color: "var(--jv-color-teal-700)", padding: "10px 14px", borderRadius: "var(--jv-radius-sm)", fontSize: 13 }}>{msg}</div>}
              <Button type="submit" disabled={loading} full>{loading ? "Sending…" : "Send Reset Link"}</Button>
            </form>
            <div style={{ marginTop: 20, textAlign: "center" }}>
              <button onClick={() => { setMode("login"); setMsg(""); }} style={{ background: "none", border: "none", color: "var(--jv-color-primary)", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>← Back to sign in</button>
            </div>
          </div>
        )}

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>© 2025 Jobvair · Employer Portal Coming Soon</p>
      </div>
    </div>
  );
}
