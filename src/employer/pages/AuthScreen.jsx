import { useState } from "react";
import { supabase } from "../../supabaseClient";
import { createCompanyAndAdmin } from "../lib/employerApi.js";
import { Button, Input, Select } from "../../components/ui/index.js";
import { Building2, ArrowRight, ArrowLeft } from "lucide-react";

const authCardStyle = { background: "#fff", borderRadius: "var(--jv-radius-xl)", padding: "32px 36px", boxShadow: "var(--jv-shadow-lg)" };

const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];
const HIRING_VOLUMES = ["1-5 hires/year", "6-20 hires/year", "21-50 hires/year", "51-200 hires/year", "200+ hires/year"];

function Logo() {
  return (
    <div style={{ textAlign: "center", marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 6 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--jv-gradient-primary)", boxShadow: "var(--jv-shadow-glow)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Building2 size={20} color="#fff" />
        </div>
        <span style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>Jobvair</span>
      </div>
      <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, margin: 0 }}>Employer Hiring Platform</p>
    </div>
  );
}

export default function EmployerAuthScreen({ onAuthed }) {
  const [mode, setMode] = useState("login"); // login | register
  const [step, setStep] = useState(1); // register: 1=account, 2=company
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [company, setCompany] = useState({
    name: "", website: "", industry: "", company_size: "", employee_count: "",
    headquarters_location: "", hiring_locations: "", annual_hiring_volume: "", contact_phone: "",
  });
  const setC = (k, v) => setCompany(c => ({ ...c, [k]: v }));

  const submitLogin = async () => {
    if (!email || !password) { setMsg("Please fill in all fields."); return; }
    setLoading(true); setMsg("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setMsg(error.message); return; }
    onAuthed(data.user);
  };

  const submitAccount = async (e) => {
    e.preventDefault();
    if (!email || !password || !name) { setMsg("Please fill in all fields."); return; }
    if (password.length < 8) { setMsg("Password must be at least 8 characters."); return; }
    setLoading(true); setMsg("");
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/employer` },
    });
    setLoading(false);
    if (error) { setMsg(error.message); return; }
    if (!data.session) {
      setMsg("Account created — check your email to verify, then sign in to finish setting up your company.");
      setMode("login");
      return;
    }
    setStep(2);
  };

  const submitCompany = async (e) => {
    e.preventDefault();
    if (!company.name) { setMsg("Company name is required."); return; }
    setLoading(true); setMsg("");
    try {
      await createCompanyAndAdmin({
        ...company,
        hiring_locations: company.hiring_locations ? company.hiring_locations.split(",").map(s => s.trim()).filter(Boolean) : [],
        contact_full_name: name,
      });
      const { data } = await supabase.auth.getSession();
      onAuthed(data.session.user);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--jv-gradient-brand)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "var(--jv-font-sans)" }}>
      <a href="https://jobvair.com" style={{ position: "fixed", top: 24, left: 24, display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.75)", fontSize: 13, textDecoration: "none" }}>
        <ArrowLeft size={14} /> Back to website
      </a>
      <div style={{ width: "100%", maxWidth: step === 2 && mode === "register" ? 620 : 420 }}>
        <Logo />

        {mode === "login" && (
          <div style={authCardStyle}>
            <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 750, color: "var(--jv-color-heading)" }}>Sign in to hire</h2>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--jv-color-muted)" }}>Access your employer dashboard</p>
            <form onSubmit={e => { e.preventDefault(); submitLogin(); }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Input label="Work email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required />
              <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
              {msg && <div style={{ background: "var(--jv-color-teal-50)", color: "var(--jv-color-teal-700)", padding: "10px 14px", borderRadius: "var(--jv-radius-sm)", fontSize: 13 }}>{msg}</div>}
              <Button type="submit" disabled={loading} full>{loading ? "Please wait…" : "Sign in"}</Button>
            </form>
            <div style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "var(--jv-color-muted)" }}>
              <button onClick={() => { setMode("register"); setStep(1); setMsg(""); }} style={{ background: "none", border: "none", color: "var(--jv-color-primary)", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>Set up your company on Jobvair</button>
            </div>
          </div>
        )}

        {mode === "register" && step === 1 && (
          <div style={authCardStyle}>
            <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 750, color: "var(--jv-color-heading)" }}>Create your employer account</h2>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--jv-color-muted)" }}>Step 1 of 2 — your account</p>
            <form onSubmit={submitAccount} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Input label="Your full name" value={name} onChange={e => setName(e.target.value)} placeholder="Jordan Blake" required />
              <Input label="Work email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required />
              <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a strong password" required />
              {msg && <div style={{ background: "#fef2f2", color: "var(--jv-color-danger-600)", padding: "10px 14px", borderRadius: "var(--jv-radius-sm)", fontSize: 13 }}>{msg}</div>}
              <Button type="submit" disabled={loading} full icon={ArrowRight} iconPosition="right">{loading ? "Creating account…" : "Continue"}</Button>
            </form>
            <div style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "var(--jv-color-muted)" }}>
              <button onClick={() => { setMode("login"); setMsg(""); }} style={{ background: "none", border: "none", color: "var(--jv-color-primary)", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>Already have an account? Sign in</button>
            </div>
          </div>
        )}

        {mode === "register" && step === 2 && (
          <div style={authCardStyle}>
            <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 750, color: "var(--jv-color-heading)" }}>Tell us about your company</h2>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--jv-color-muted)" }}>Step 2 of 2 — company profile</p>
            <form onSubmit={submitCompany} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Input label="Company name" value={company.name} onChange={e => setC("name", e.target.value)} required />
                <Input label="Website" value={company.website} onChange={e => setC("website", e.target.value)} placeholder="https://" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Input label="Industry" value={company.industry} onChange={e => setC("industry", e.target.value)} placeholder="e.g. Construction" />
                <Select label="Company size" value={company.company_size} onChange={e => setC("company_size", e.target.value)} options={[{ value: "", label: "Select…" }, ...COMPANY_SIZES.map(s => ({ value: s, label: `${s} employees` }))]} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Input label="Number of employees" type="number" value={company.employee_count} onChange={e => setC("employee_count", e.target.value)} />
                <Input label="Headquarters location" value={company.headquarters_location} onChange={e => setC("headquarters_location", e.target.value)} placeholder="Charlotte, NC" />
              </div>
              <Input label="Hiring locations" value={company.hiring_locations} onChange={e => setC("hiring_locations", e.target.value)} placeholder="Charlotte, NC; Atlanta, GA (comma separated)" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Select label="Approximate annual hiring volume" value={company.annual_hiring_volume} onChange={e => setC("annual_hiring_volume", e.target.value)} options={[{ value: "", label: "Select…" }, ...HIRING_VOLUMES.map(v => ({ value: v, label: v }))]} />
                <Input label="Your phone (primary contact)" value={company.contact_phone} onChange={e => setC("contact_phone", e.target.value)} />
              </div>
              {msg && <div style={{ background: "#fef2f2", color: "var(--jv-color-danger-600)", padding: "10px 14px", borderRadius: "var(--jv-radius-sm)", fontSize: 13 }}>{msg}</div>}
              <div style={{ display: "flex", gap: 12 }}>
                <Button type="button" variant="secondary" onClick={() => setStep(1)} icon={ArrowLeft}>Back</Button>
                <Button type="submit" disabled={loading} full>{loading ? "Setting up…" : "Create company & continue"}</Button>
              </div>
            </form>
          </div>
        )}

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
          Looking for a job instead? <a href="/" style={{ color: "rgba(255,255,255,0.7)" }}>Go to the candidate site →</a>
        </p>
      </div>
    </div>
  );
}
