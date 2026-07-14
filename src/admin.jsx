/**
 * admin.jsx — Jobvair Admin Panel
 *
 * Loaded dynamically from src/main.jsx when the URL path or query string
 * contains "admin" (see vercel.json's /admin rewrite to /index.html, which
 * makes that check see a matching path). Not a separate Vite build entry.
 *
 * Access: /admin — only visible to users in the admin_users table.
 *
 * The admin's own account gets Resume Builder, Resume Match, and Cover
 * Letter as general-purpose tools (same components the candidate app uses),
 * without a Profile page — this is a master account, not a candidate
 * profile, so there's nothing to build a "profile" out of. Resumes created
 * here are scoped to the admin's own auth user id via the same RLS policies
 * candidates use; nothing here can read or edit another user's data.
 */

import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { EMPTY_USER } from "./constants/appConstants.js";
import BuilderPage from "./pages/BuilderPage.jsx";
import AIOptimizerPage from "./pages/AIOptimizerPage.jsx";
import CoverLetterPage from "./pages/CoverLetterPage.jsx";

// A blank stand-in profile — the admin account has no candidate profile,
// so the builder/match/cover-letter tools just start from nothing instead
// of pre-filling from profile data the way the candidate app does.
const ADMIN_EMPTY_PROFILE = EMPTY_USER;
const ADMIN_EMPTY_LIST = [];

// ── Design tokens ─────────────────────────────────────────────────────────
const A = {
  bg:         "#F0F4F8",
  bgCard:     "#FFFFFF",
  bgHover:    "#F8FAFC",
  border:     "#E2E8F0",
  borderHover:"#CBD5E1",
  navy:       "#1E3A5F",
  teal:       "#0D9488",
  tealDim:    "#0D948822",
  blue:       "#3B82F6",
  purple:     "#7C3AED",
  gold:       "#D97706",
  red:        "#EF4444",
  green:      "#059669",
  text:       "#0F172A",
  textMuted:  "#64748B",
  textLight:  "#94A3B8",
  white:      "#FFFFFF",
};

const font = "'DM Mono', 'Fira Code', 'Courier New', monospace";
const sans = "'DM Sans', 'Inter', sans-serif";

// ── Tiny components ───────────────────────────────────────────────────────
const Card = ({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{
    background: A.bgCard, border: `1px solid ${A.border}`, borderRadius: 12,
    padding: 24, transition: "border-color 0.15s",
    cursor: onClick ? "pointer" : "default",
    ...style,
  }}
    onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = A.borderHover)}
    onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = A.border)}
  >{children}</div>
);

const Badge = ({ children, color = "blue" }) => {
  const colors = { blue: A.blue, teal: A.teal, green: A.green, red: A.red, gold: A.gold, purple: A.purple, gray: A.textMuted };
  const c = colors[color] || A.blue;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", padding:"2px 8px", borderRadius:99,
      background: `${c}22`, color: c, fontSize: 11, fontWeight: 700, letterSpacing:"0.05em",
      fontFamily: font, border: `1px solid ${c}44` }}>
      {children}
    </span>
  );
};

const Btn = ({ children, onClick, variant = "primary", small, disabled, full, icon }) => {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6, padding: small ? "6px 14px" : "10px 20px",
    borderRadius: 8, fontSize: small ? 12 : 14, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1, border: "none", fontFamily: sans, transition: "all 0.15s",
    width: full ? "100%" : undefined, justifyContent: full ? "center" : undefined,
  };
  const variants = {
    primary:   { background: A.teal, color: "#000" },
    secondary: { background: "transparent", color: A.text, border: `1px solid ${A.border}` },
    danger:    { background: `${A.red}22`, color: A.red, border: `1px solid ${A.red}44` },
    ghost:     { background: "transparent", color: A.textMuted },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant] }}>
      {icon && <span>{icon}</span>}{children}
    </button>
  );
};

const Input = ({ label, value, onChange, placeholder, type = "text", hint }) => (
  <div>
    {label && <div style={{ fontSize: 12, color: A.textMuted, marginBottom: 6, fontFamily: font, letterSpacing:"0.05em", textTransform:"uppercase" }}>{label}</div>}
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "10px 14px", background: A.bg, border: `1px solid ${A.border}`,
        borderRadius: 8, color: A.text, fontSize: 14, fontFamily: sans, outline: "none",
        boxSizing: "border-box",
      }}
    />
    {hint && <div style={{ fontSize: 11, color: A.textMuted, marginTop: 4 }}>{hint}</div>}
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div>
    {label && <div style={{ fontSize: 12, color: A.textMuted, marginBottom: 6, fontFamily: font, letterSpacing:"0.05em", textTransform:"uppercase" }}>{label}</div>}
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      width: "100%", padding: "10px 14px", background: A.bg, border: `1px solid ${A.border}`,
      borderRadius: 8, color: A.text, fontSize: 14, fontFamily: sans, outline: "none",
    }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const StatCard = ({ label, value, sub, color = A.teal, icon }) => (
  <Card>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontSize: 12, color: A.textMuted, fontFamily: font, textTransform: "uppercase", letterSpacing:"0.08em", marginBottom: 8 }}>{label}</div>
        <div style={{ fontSize: 32, fontWeight: 800, color, fontFamily: font }}>{value ?? "—"}</div>
        {sub && <div style={{ fontSize: 12, color: A.textMuted, marginTop: 4 }}>{sub}</div>}
      </div>
      {icon && <div style={{ fontSize: 28, opacity: 0.6 }}>{icon}</div>}
    </div>
  </Card>
);

// ── Admin Login ───────────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!email || !password) { setError("Email and password required."); return; }
    setLoading(true); setError("");
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError(authError.message); setLoading(false); return; }

    // Check if user is in admin_users table
    const { data: adminRow } = await supabase
      .from("admin_users")
      .select("*")
      .eq("id", data.user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!adminRow) {
      await supabase.auth.signOut();
      setError("Access denied. This account does not have admin privileges.");
      setLoading(false);
      return;
    }
    onLogin(data.user, adminRow);
  };

  return (
    <div style={{ minHeight: "100vh", background: A.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans }}>
      <div style={{ width: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: A.teal, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, color: A.white, letterSpacing: "-0.02em" }}>Jobvair</span>
          </div>
          <div style={{ fontSize: 12, color: A.textMuted, fontFamily: font, letterSpacing: "0.15em", textTransform: "uppercase" }}>Admin Console</div>
        </div>

        <Card>
          <div style={{ fontSize: 18, fontWeight: 700, color: A.text, marginBottom: 4 }}>Sign in</div>
          <div style={{ fontSize: 13, color: A.textMuted, marginBottom: 24 }}>Admin access only</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Input label="Email" value={email} onChange={setEmail} placeholder="admin@jobvair.com" type="email" />
            <Input label="Password" value={password} onChange={setPassword} placeholder="••••••••" type="password" />
            {error && <div style={{ padding: "10px 14px", background: `${A.red}22`, border: `1px solid ${A.red}44`, borderRadius: 8, fontSize: 13, color: A.red }}>{error}</div>}
            <Btn full onClick={submit} disabled={loading}>{loading ? "Signing in…" : "Sign in to Admin"}</Btn>
          </div>
        </Card>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: A.textMuted }}>
          Jobvair Platform · Admin Console · Restricted Access
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────
function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.rpc("get_admin_platform_analytics").single(),
      supabase.rpc("get_admin_candidates"),
    ]).then(([statsRes, usersRes]) => {
      setStats(statsRes.data);
      setRecentUsers((usersRes.data || []).slice(0, 10));
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ color: A.textMuted, padding: 40, textAlign: "center" }}>Loading analytics…</div>;

  const mrr = ((stats?.premium_count || 0) * 6) + ((stats?.premium_plus_count || 0) * 12);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: A.white, marginBottom: 4 }}>Dashboard</div>
        <div style={{ fontSize: 14, color: A.textMuted }}>Platform overview and key metrics</div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Users" value={stats?.total_users} sub={`+${stats?.new_users_7d} this week`} icon="👥" color={A.teal} />
        <StatCard label="Paid Subscribers" value={stats?.paid_subscribers} sub={`$${mrr}/mo MRR`} icon="💳" color={A.green} />
        <StatCard label="ID Verified" value={stats?.verified_users} icon="🛡" color={A.blue} />
        <StatCard label="AI Analyses" value={stats?.ai_analyses_run} icon="🤖" color={A.purple} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <StatCard label="Resumes Uploaded" value={stats?.resumes_parsed} icon="📎" color={A.gold} />
        <StatCard label="Resumes Built" value={stats?.total_resumes} icon="📄" color={A.teal} />
        <StatCard label="Skills Entered" value={stats?.total_skills_entered} icon="⚡" color={A.blue} />
        <StatCard label="New Users (30d)" value={stats?.new_users_30d} icon="🚀" color={A.green} />
      </div>

      {/* Plan breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: A.text, marginBottom: 16 }}>Plan Breakdown</div>
          {[
            { label: "Free", count: (stats?.total_users || 0) - (stats?.paid_subscribers || 0), color: A.textMuted },
            { label: "Pro ($6/mo)", count: stats?.premium_count || 0, color: A.teal },
            { label: "Career+ ($12/mo)", count: stats?.premium_plus_count || 0, color: A.purple },
          ].map(p => (
            <div key={p.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${A.border}` }}>
              <span style={{ fontSize: 14, color: A.textLight }}>{p.label}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: p.color, fontFamily: font }}>{p.count}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: A.text }}>Est. MRR</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: A.green, fontFamily: font }}>${mrr}</span>
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: A.text, marginBottom: 16 }}>Verification Status</div>
          {[
            { label: "Verified", count: stats?.verified_users || 0, color: A.green },
            { label: "Not Started", count: (stats?.total_users || 0) - (stats?.verified_users || 0), color: A.textMuted },
          ].map(v => (
            <div key={v.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${A.border}` }}>
              <span style={{ fontSize: 14, color: A.textLight }}>{v.label}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: v.color, fontFamily: font }}>{v.count}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* Recent signups */}
      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, color: A.text, marginBottom: 16 }}>Recent Signups</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${A.border}` }}>
              {["Name", "Email", "Plan", "Verified", "Resumes", "Joined"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: A.textMuted, fontWeight: 600, fontFamily: font, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentUsers.map(u => (
              <tr key={u.id} style={{ borderBottom: `1px solid ${A.border}11` }}>
                <td style={{ padding: "12px", color: A.text, fontWeight: 600 }}>{u.full_name || "—"}</td>
                <td style={{ padding: "12px", color: A.textLight }}>{u.email}</td>
                <td style={{ padding: "12px" }}><Badge color={u.subscription_plan === "free" ? "gray" : u.subscription_plan === "premium" ? "teal" : "purple"}>{u.subscription_plan || "free"}</Badge></td>
                <td style={{ padding: "12px" }}>{u.verification_status === "verified" ? <Badge color="green">✓ Verified</Badge> : <span style={{ color: A.textMuted, fontSize: 12 }}>—</span>}</td>
                <td style={{ padding: "12px", color: A.textLight, fontFamily: font }}>{u.resume_count || 0}</td>
                <td style={{ padding: "12px", color: A.textMuted, fontSize: 12 }}>{u.account_created_at ? new Date(u.account_created_at).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── Users CRM ─────────────────────────────────────────────────────────────
function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterVerified, setFilterVerified] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    supabase.rpc("get_admin_candidates")
      .then(({ data }) => { setUsers(data || []); setLoading(false); });
  }, []);

  const filtered = users.filter(u => {
    const matchSearch = !search || [u.full_name, u.email, u.location].some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const matchPlan = filterPlan === "all" || u.subscription_plan === filterPlan;
    const matchVerified = filterVerified === "all" || u.verification_status === filterVerified;
    return matchSearch && matchPlan && matchVerified;
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: A.white, marginBottom: 4 }}>Users</div>
        <div style={{ fontSize: 14, color: A.textMuted }}>{users.length} total candidates</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        <Input placeholder="Search by name, email, location…" value={search} onChange={setSearch} />
        <Select value={filterPlan} onChange={setFilterPlan} options={[
          { value: "all", label: "All Plans" },
          { value: "free", label: "Free" },
          { value: "premium", label: "Pro" },
          { value: "premium_plus", label: "Career+" },
        ]} />
        <Select value={filterVerified} onChange={setFilterVerified} options={[
          { value: "all", label: "All Verification" },
          { value: "verified", label: "Verified" },
          { value: "not_started", label: "Not Started" },
          { value: "pending", label: "Pending" },
        ]} />
      </div>

      {loading ? (
        <div style={{ color: A.textMuted, padding: 40, textAlign: "center" }}>Loading users…</div>
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: A.bg }}>
                {["Candidate", "Location", "Plan", "Verified", "Experience", "Skills", "Resumes", "Joined"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: A.textMuted, fontWeight: 600, fontFamily: font, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} onClick={() => setSelected(u)}
                  style={{ borderBottom: `1px solid ${A.border}`, cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = A.bgHover}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 600, color: A.text }}>{u.full_name || "—"}</div>
                    <div style={{ fontSize: 12, color: A.textMuted }}>{u.email}</div>
                  </td>
                  <td style={{ padding: "14px 16px", color: A.textLight, fontSize: 12 }}>{u.location || "—"}</td>
                  <td style={{ padding: "14px 16px" }}><Badge color={u.subscription_plan === "free" ? "gray" : u.subscription_plan === "premium" ? "teal" : "purple"}>{u.subscription_plan || "free"}</Badge></td>
                  <td style={{ padding: "14px 16px" }}>{u.verification_status === "verified" ? <Badge color="green">✓</Badge> : <span style={{ color: A.textMuted }}>—</span>}</td>
                  <td style={{ padding: "14px 16px", color: A.textLight, fontFamily: font }}>{u.total_years_experience ? `${u.total_years_experience}y` : "—"}</td>
                  <td style={{ padding: "14px 16px", color: A.textLight, fontFamily: font }}>{u.skill_count || 0}</td>
                  <td style={{ padding: "14px 16px", color: A.textLight, fontFamily: font }}>{u.resume_count || 0}</td>
                  <td style={{ padding: "14px 16px", color: A.textMuted, fontSize: 12 }}>{u.account_created_at ? new Date(u.account_created_at).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* User detail drawer */}
      {selected && (
        <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 480, background: A.bgCard, borderLeft: `1px solid ${A.border}`, padding: 32, overflowY: "auto", zIndex: 100 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: A.white }}>Candidate Profile</div>
            <Btn variant="ghost" onClick={() => setSelected(null)}>✕ Close</Btn>
          </div>

          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 24, padding: 16, background: A.bg, borderRadius: 10 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: A.tealDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: A.teal }}>
              {(selected.full_name || selected.email || "?")[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: A.white }}>{selected.full_name || "No name"}</div>
              <div style={{ fontSize: 13, color: A.textMuted }}>{selected.email}</div>
              <div style={{ fontSize: 12, color: A.textMuted }}>{selected.location || "Location unknown"}</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            {[
              ["Plan", selected.subscription_plan || "free", selected.subscription_plan !== "free" ? "teal" : "gray"],
              ["Verified", selected.verification_status || "not_started", selected.verification_status === "verified" ? "green" : "gray"],
              ["Experience", selected.total_years_experience ? `${selected.total_years_experience} yrs` : "—", "blue"],
              ["Education", selected.highest_education_level || "—", "purple"],
              ["Resumes", selected.resume_count || 0, "gold"],
              ["AI Analyses", selected.analysis_count || 0, "teal"],
            ].map(([label, value, color]) => (
              <div key={label} style={{ padding: "12px 14px", background: A.bg, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: A.textMuted, fontFamily: font, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: A[color] || A.text }}>{value}</div>
              </div>
            ))}
          </div>

          {selected.industries?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: A.textMuted, fontFamily: font, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Industries</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {selected.industries.map(i => <Badge key={i} color="blue">{i}</Badge>)}
              </div>
            </div>
          )}

          {selected.desired_titles?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: A.textMuted, fontFamily: font, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Desired Titles</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {selected.desired_titles.map(t => <Badge key={t} color="teal">{t}</Badge>)}
              </div>
            </div>
          )}

          <div style={{ fontSize: 12, color: A.textMuted, marginTop: 24 }}>
            <div>Account created: {selected.account_created_at ? new Date(selected.account_created_at).toLocaleString() : "—"}</div>
            <div>Last sign in: {selected.last_sign_in_at ? new Date(selected.last_sign_in_at).toLocaleString() : "—"}</div>
            <div style={{ marginTop: 8, fontFamily: font, fontSize: 11, color: A.border }}>ID: {selected.id}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sample data for template preview ─────────────────────────────────────
const SAMPLE_RESUME = {
  contactFields: { name:"Alexandra Rivera", headline:"Senior Product Manager", email:"alex@email.com", phone:"(555) 234-5678", location:"Charlotte, NC" },
  sections: [
    { section_type:"summary",    label:"Summary",        display_order:0, content:{ text:"Results-driven Product Manager with 8+ years leading cross-functional teams. Proven track record of 40% revenue growth through data-driven product strategy." } },
    { section_type:"skills",     label:"Skills",         display_order:1, content:{ text:"Product Strategy · Roadmap Planning · Agile/Scrum · SQL · Tableau · Salesforce · A/B Testing · Stakeholder Management" } },
    { section_type:"experience", label:"Experience",     display_order:2, content:{ text:"Senior Product Manager — Acme Corp (2020 – Present)\n• Led 3 product launches generating $2.4M first-year revenue\n• Managed team of 12 engineers, designers, analysts\n\nProduct Manager — TechStart Inc (2016 – 2020)\n• Grew user base from 10K to 120K through feature initiatives" } },
    { section_type:"education",  label:"Education",      display_order:3, content:{ text:"MBA — Duke University, Fuqua School of Business, 2016\nB.S. Computer Science — UNC Charlotte, 2014" } },
    { section_type:"certifications", label:"Certifications", display_order:4, content:{ text:"Certified Scrum Product Owner (CSPO)\nGoogle Analytics Certified\nAWS Cloud Practitioner" } },
  ],
};

function TemplatePreview({ tmpl }) {
  const accent = tmpl.accent_color || tmpl.color || "#0D9488";
  const fontFamily = tmpl.font_family || "DM Sans, sans-serif";
  const fontSize = tmpl.base_font_size || 13;
  const sGap = { compact:10, normal:16, spacious:22 }[tmpl.section_spacing] || 16;
  const pad = tmpl.page_margin === "tight" ? "18px 22px" : tmpl.page_margin === "wide" ? "36px 48px" : "26px 34px";
  const cf = SAMPLE_RESUME.contactFields;

  const Heading = ({ label }) => {
    if (tmpl.heading_style === "accent_bar") return (
      <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:5 }}>
        <div style={{ width:3, height:12, background:accent, borderRadius:2 }} />
        <span style={{ fontSize:10, fontWeight:700, color:accent, textTransform:"uppercase", letterSpacing:"0.08em" }}>{label}</span>
      </div>
    );
    if (tmpl.heading_style === "underlined") return <div style={{ fontSize:12, fontWeight:700, color:"#0F172A", borderBottom:`2px solid ${accent}`, paddingBottom:2, marginBottom:5 }}>{label}</div>;
    if (tmpl.heading_style === "minimal")    return <div style={{ fontSize:10, fontWeight:600, color:"#64748B", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4 }}>{label}</div>;
    return <div style={{ fontSize:10, fontWeight:700, color:accent, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:5 }}>{label}</div>;
  };

  return (
    <div style={{ background:"#fff", fontFamily, fontSize, color:"#1E293B", padding:pad, lineHeight:1.5, width:"100%", minHeight:700, boxSizing:"border-box" }}>
      {tmpl.header_style === "bold_banner" ? (
        <div style={{ background:accent, color:"#fff", padding:"14px 18px", margin:`-26px -34px 14px`, borderRadius:"4px 4px 0 0" }}>
          <div style={{ fontSize:18, fontWeight:800 }}>{cf.name}</div>
          <div style={{ fontSize:11, opacity:0.9, marginTop:2 }}>{cf.headline}</div>
          <div style={{ fontSize:10, opacity:0.8, marginTop:3 }}>{cf.email} · {cf.phone} · {cf.location}</div>
        </div>
      ) : tmpl.header_style === "centered" ? (
        <div style={{ textAlign:"center", paddingBottom:10, marginBottom:10, borderBottom:`2px solid ${accent}` }}>
          <div style={{ fontSize:18, fontWeight:800 }}>{cf.name}</div>
          <div style={{ fontSize:11, color:accent, fontWeight:600, marginTop:2 }}>{cf.headline}</div>
          <div style={{ fontSize:10, color:"#64748B", marginTop:3 }}>{cf.email} · {cf.phone} · {cf.location}</div>
        </div>
      ) : (
        <div style={{ paddingBottom:9, marginBottom:9, borderBottom:`2px solid ${accent}` }}>
          <div style={{ fontSize:18, fontWeight:800 }}>{cf.name}</div>
          <div style={{ fontSize:11, color:accent, fontWeight:600, marginTop:2 }}>{cf.headline}</div>
          <div style={{ fontSize:10, color:"#64748B", marginTop:3 }}>{cf.email} · {cf.phone} · {cf.location}</div>
        </div>
      )}
      {SAMPLE_RESUME.sections.map(s => (
        <div key={s.section_type} style={{ marginBottom:sGap }}>
          <Heading label={s.label} />
          <div style={{ fontSize:fontSize - 1, color:"#334155", lineHeight:1.5, whiteSpace:"pre-wrap" }}>{s.content.text}</div>
        </div>
      ))}
    </div>
  );
}

// ── Templates Manager ─────────────────────────────────────────────────────
function TemplatesPage({ adminUser }) {
  const [templates,   setTemplates]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [editing,     setEditing]     = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [previewTmpl, setPreviewTmpl] = useState(null);

  const EMPTY = {
    name:"", slug:"", description:"", tier:"free", category:"Modern",
    color:"#0D9488", accent_color:"#0D9488", sort_order:0,
    is_active:true, is_featured:false, preview_image_url:"",
    font_family:"DM Sans, sans-serif", base_font_size:13,
    header_style:"left", heading_style:"uppercase",
    layout_type:"single", page_margin:"normal",
    section_spacing:"normal", ats_friendly:false,
  };

  useEffect(() => {
    supabase.from("resume_templates").select("*").order("sort_order")
      .then(({ data }) => { setTemplates(data || []); setLoading(false); });
  }, []);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const { id, ...rest } = editing;
    const payload = { ...rest, accent_color: rest.accent_color || rest.color, updated_at: new Date().toISOString() };
    if (id) {
      const { data } = await supabase.from("resume_templates").update(payload).eq("id", id).select().single();
      setTemplates(ts => ts.map(t => t.id === id ? data : t));
    } else {
      const { data } = await supabase.from("resume_templates").insert({ ...payload, created_by: adminUser?.id }).select().single();
      setTemplates(ts => [...ts, data]);
    }
    setSaving(false); setEditing(null);
  };

  const toggleActive = async (t) => {
    await supabase.from("resume_templates").update({ is_active:!t.is_active, updated_at:new Date().toISOString() }).eq("id", t.id);
    setTemplates(ts => ts.map(x => x.id === t.id ? { ...x, is_active:!x.is_active } : x));
  };

  const del = async (id) => {
    if (!confirm("Delete this template?")) return;
    await supabase.from("resume_templates").delete().eq("id", id);
    setTemplates(ts => ts.filter(t => t.id !== id));
  };

  const setForm = (key, val) => setEditing(e => ({ ...e, [key]:val, ...(key === "accent_color" ? { color:val } : {}) }));

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <div style={{ fontSize:24, fontWeight:800, color:A.text, marginBottom:4 }}>Resume Templates</div>
          <div style={{ fontSize:14, color:A.textMuted }}>{templates.filter(t => t.is_active).length} active · {templates.length} total</div>
        </div>
        <Btn icon="＋" onClick={() => setEditing({ ...EMPTY })}>New Template</Btn>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:16 }}>
        {loading ? <div style={{ color:A.textMuted, gridColumn:"1/-1", textAlign:"center", padding:40 }}>Loading…</div> : templates.map(t => (
          <Card key={t.id} style={{ opacity:t.is_active ? 1 : 0.5 }}>
            <div style={{ height:5, background:t.accent_color || t.color || A.teal, borderRadius:3, marginBottom:14, marginTop:-8, marginLeft:-24, marginRight:-24, width:"calc(100% + 48px)" }} />
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
              <div style={{ fontSize:14, fontWeight:700, color:A.text }}>{t.name}</div>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                {t.ats_friendly && <Badge color="green">ATS</Badge>}
                {t.is_featured  && <Badge color="gold">⭐</Badge>}
                <Badge color={t.tier === "free" ? "green" : t.tier === "premium" ? "teal" : "purple"}>{t.tier}</Badge>
                {!t.is_active   && <Badge color="gray">Off</Badge>}
              </div>
            </div>
            <div style={{ fontSize:11, color:A.textMuted, marginBottom:2, fontFamily:font }}>/{t.slug} · {t.category || "—"}</div>
            <div style={{ fontSize:11, color:A.textLight, marginBottom:3 }}>{t.font_family}</div>
            <div style={{ fontSize:11, color:A.textMuted, marginBottom:12 }}>{t.header_style} · {t.layout_type} · {t.heading_style}</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              <Btn small variant="secondary" onClick={() => setPreviewTmpl(t)}>Preview</Btn>
              <Btn small variant="secondary" onClick={() => setEditing({ ...t })}>Edit</Btn>
              <Btn small variant="secondary" onClick={() => toggleActive(t)}>{t.is_active ? "Off" : "On"}</Btn>
              <Btn small variant="danger" onClick={() => del(t.id)}>Del</Btn>
            </div>
          </Card>
        ))}
      </div>

      {/* Preview modal */}
      {previewTmpl && (
        <div style={{ position:"fixed", inset:0, background:"#00000099", display:"flex", alignItems:"center", justifyContent:"center", zIndex:300 }} onClick={() => setPreviewTmpl(null)}>
          <div style={{ background:A.bgCard, border:`1px solid ${A.border}`, borderRadius:16, padding:24, width:460 }} onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontSize:15, fontWeight:700, color:A.text }}>{previewTmpl.name}</div>
              <Btn variant="ghost" small onClick={() => setPreviewTmpl(null)}>✕</Btn>
            </div>
            <div style={{ overflow:"hidden", borderRadius:8, border:`1px solid ${A.border}`, height:460, transform:"scale(1)", transformOrigin:"top left" }}>
              <div style={{ transform:"scale(0.63)", transformOrigin:"top left", width:730, marginBottom:-270 }}>
                <TemplatePreview tmpl={previewTmpl} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create modal */}
      {editing && (
        <div style={{ position:"fixed", inset:0, background:"#00000088", display:"flex", alignItems:"flex-start", justifyContent:"center", zIndex:200, overflowY:"auto", padding:"30px 16px" }}>
          <div style={{ width:760, background:A.bgCard, border:`1px solid ${A.border}`, borderRadius:16, padding:28 }}>
            <div style={{ fontSize:17, fontWeight:700, color:A.text, marginBottom:20 }}>{editing.id ? "Edit Template" : "New Template"}</div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <Input label="Name" value={editing.name} onChange={v => setForm("name", v)} placeholder="Executive Premium" />
              <Input label="Slug" value={editing.slug} onChange={v => setForm("slug", v.toLowerCase().replace(/\s+/g, "-"))} placeholder="executive" hint="Lowercase, no spaces" />
              <div style={{ gridColumn:"1/-1" }}><Input label="Description" value={editing.description} onChange={v => setForm("description", v)} placeholder="Brief description" /></div>
              <Select label="Plan Tier" value={editing.tier} onChange={v => setForm("tier", v)} options={[ { value:"free", label:"Free" }, { value:"premium", label:"Pro ($6)" }, { value:"premium_plus", label:"Career+ ($12)" } ]} />
              <Select label="Category" value={editing.category || "Modern"} onChange={v => setForm("category", v)} options={["Basic","Modern","Executive","Creative","Technical","Healthcare","Entry Level","Federal"].map(x => ({ value:x, label:x }))} />
              <Input label="Font Family" value={editing.font_family || ""} onChange={v => setForm("font_family", v)} placeholder="DM Sans, sans-serif" />
              <div>
                <div style={{ fontSize:11, color:A.textMuted, marginBottom:5, textTransform:"uppercase", letterSpacing:"0.05em" }}>Accent Color</div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <input type="color" value={editing.accent_color || editing.color || "#0D9488"} onChange={e => setForm("accent_color", e.target.value)} style={{ width:44, height:36, border:`1px solid ${A.border}`, borderRadius:6, cursor:"pointer", padding:2 }} />
                  <input type="text" value={editing.accent_color || editing.color || "#0D9488"} onChange={e => setForm("accent_color", e.target.value)} style={{ flex:1, padding:"8px 10px", background:A.bg, border:`1px solid ${A.border}`, borderRadius:6, color:A.text, fontSize:13 }} />
                </div>
              </div>
              <Select label="Header Style" value={editing.header_style || "left"} onChange={v => setForm("header_style", v)} options={[ { value:"simple", label:"Simple" }, { value:"centered", label:"Centered" }, { value:"left", label:"Left Aligned" }, { value:"sidebar", label:"Sidebar" }, { value:"bold_banner", label:"Bold Banner" } ]} />
              <Select label="Heading Style" value={editing.heading_style || "uppercase"} onChange={v => setForm("heading_style", v)} options={[ { value:"underlined", label:"Underlined" }, { value:"uppercase", label:"Uppercase" }, { value:"accent_bar", label:"Accent Bar" }, { value:"minimal", label:"Minimal" } ]} />
              <Select label="Layout" value={editing.layout_type || "single"} onChange={v => setForm("layout_type", v)} options={[ { value:"single", label:"Single Column" }, { value:"two_column", label:"Two Column" }, { value:"sidebar", label:"Sidebar" } ]} />
              <Select label="Page Margins" value={editing.page_margin || "normal"} onChange={v => setForm("page_margin", v)} options={[ { value:"tight", label:"Tight" }, { value:"normal", label:"Normal" }, { value:"wide", label:"Wide" } ]} />
              <Select label="Section Spacing" value={editing.section_spacing || "normal"} onChange={v => setForm("section_spacing", v)} options={[ { value:"compact", label:"Compact" }, { value:"normal", label:"Normal" }, { value:"spacious", label:"Spacious" } ]} />
              <Input label="Base Font Size" value={editing.base_font_size || 13} onChange={v => setForm("base_font_size", Number(v))} type="number" placeholder="13" />
              <Input label="Sort Order" value={editing.sort_order || 0} onChange={v => setForm("sort_order", Number(v))} type="number" />
              <div style={{ gridColumn:"1/-1" }}><Input label="Thumbnail URL" value={editing.preview_image_url || ""} onChange={v => setForm("preview_image_url", v)} placeholder="https://…" /></div>
              <div style={{ gridColumn:"1/-1", display:"flex", gap:16, flexWrap:"wrap" }}>
                {[["is_active","Active"],["is_featured","Featured"],["ats_friendly","ATS Friendly"],["is_premium","Premium"]].map(([key, label]) => (
                  <label key={key} style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:A.textLight, cursor:"pointer" }}>
                    <input type="checkbox" checked={editing[key] || false} onChange={e => setForm(key, e.target.checked)} style={{ accentColor:A.teal }} />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* Live preview while editing */}
            <div style={{ marginTop:18, paddingTop:14, borderTop:`1px solid ${A.border}` }}>
              <div style={{ fontSize:12, fontWeight:600, color:A.textMuted, marginBottom:10 }}>Live Preview</div>
              <div style={{ overflow:"hidden", borderRadius:8, border:`1px solid ${A.border}`, height:280 }}>
                <div style={{ transform:"scale(0.55)", transformOrigin:"top left", width:730, marginBottom:-320 }}>
                  <TemplatePreview tmpl={editing} />
                </div>
              </div>
            </div>

            <div style={{ display:"flex", gap:10, marginTop:18, justifyContent:"flex-end" }}>
              <Btn variant="secondary" onClick={() => setEditing(null)}>Cancel</Btn>
              <Btn onClick={save} disabled={saving || !editing.name || !editing.slug}>{saving ? "Saving…" : editing.id ? "Save Changes" : "Create Template"}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Subscriptions page ────────────────────────────────────────────────────
function SubscriptionsPage() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.rpc("get_admin_candidates")
      .then(({ data }) => {
        setSubs((data || []).filter(u => u.subscription_plan !== "free"));
        setLoading(false);
      });
  }, []);

  const mrr = subs.reduce((acc, u) => acc + (u.subscription_plan === "premium" ? 6 : u.subscription_plan === "premium_plus" ? 12 : 0), 0);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: A.white, marginBottom: 4 }}>Subscriptions</div>
        <div style={{ fontSize: 14, color: A.textMuted }}>{subs.length} paid subscribers · ${mrr}/mo MRR</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Paid" value={subs.length} color={A.green} icon="💳" />
        <StatCard label="Monthly MRR" value={`$${mrr}`} color={A.gold} icon="💰" />
        <StatCard label="Career+ Users" value={subs.filter(s => s.subscription_plan === "premium_plus").length} color={A.purple} icon="⭐" />
      </div>

      {loading ? <div style={{ color: A.textMuted, textAlign: "center", padding: 40 }}>Loading…</div> : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: A.bg }}>
                {["Subscriber", "Plan", "Status", "Verified", "Joined"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: A.textMuted, fontWeight: 600, fontFamily: font, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subs.map(u => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${A.border}11` }}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 600, color: A.text }}>{u.full_name || "—"}</div>
                    <div style={{ fontSize: 12, color: A.textMuted }}>{u.email}</div>
                  </td>
                  <td style={{ padding: "14px 16px" }}><Badge color={u.subscription_plan === "premium" ? "teal" : "purple"}>{u.subscription_plan}</Badge></td>
                  <td style={{ padding: "14px 16px" }}><Badge color={u.subscription_status === "active" ? "green" : "red"}>{u.subscription_status || "active"}</Badge></td>
                  <td style={{ padding: "14px 16px" }}>{u.verification_status === "verified" ? <Badge color="green">✓</Badge> : "—"}</td>
                  <td style={{ padding: "14px 16px", color: A.textMuted, fontSize: 12 }}>{u.account_created_at ? new Date(u.account_created_at).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard",     icon: "◈", label: "Dashboard" },
  { id: "users",         icon: "◉", label: "Users" },
  { id: "subscriptions", icon: "◎", label: "Subscriptions" },
  { id: "templates",     icon: "◫", label: "Templates" },
  { id: "builder",       icon: "✎", label: "Resume Builder" },
  { id: "ai-optimize",   icon: "✦", label: "Resume Match" },
  { id: "cover-letter",  icon: "✉", label: "Cover Letter" },
];

function Sidebar({ active, onNav, adminUser, onLogout }) {
  return (
    <div style={{ width: 220, background: A.bgCard, borderRight: `1px solid ${A.border}`, display: "flex", flexDirection: "column", minHeight: "100vh", flexShrink: 0 }}>
      {/* Brand */}
      <div style={{ padding: "24px 20px", borderBottom: `1px solid ${A.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: A.teal, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, color: A.white }}>Jobvair</span>
        </div>
        <div style={{ fontSize: 10, color: A.teal, fontFamily: font, letterSpacing: "0.15em", textTransform: "uppercase" }}>Admin Console</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px 12px" }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => onNav(n.id)} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
            borderRadius: 8, background: active === n.id ? A.tealDim : "transparent",
            border: "none", color: active === n.id ? A.teal : A.textLight,
            cursor: "pointer", fontSize: 14, fontWeight: active === n.id ? 700 : 400,
            fontFamily: sans, marginBottom: 2, transition: "all 0.1s", textAlign: "left",
          }}>
            <span style={{ fontSize: 16, fontFamily: font }}>{n.icon}</span>
            {n.label}
          </button>
        ))}
      </nav>

      {/* Admin user */}
      <div style={{ padding: "16px 20px", borderTop: `1px solid ${A.border}` }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: A.text, marginBottom: 2 }}>{adminUser?.full_name || adminUser?.email}</div>
        <div style={{ fontSize: 11, color: A.teal, fontFamily: font, marginBottom: 12, textTransform: "uppercase" }}>{adminUser?.role}</div>
        <Btn small variant="ghost" onClick={onLogout}>Sign out</Btn>
      </div>
    </div>
  );
}

// ── App Shell ─────────────────────────────────────────────────────────────
export default function AdminApp() {
  const [authUser,  setAuthUser]  = useState(undefined);
  const [adminUser, setAdminUser] = useState(null);
  const [page, setPage] = useState("dashboard");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user ?? null;
      if (u) {
        const { data: adminRow } = await supabase.from("admin_users").select("*").eq("id", u.id).eq("is_active", true).maybeSingle();
        if (adminRow) { setAuthUser(u); setAdminUser(adminRow); }
        else setAuthUser(null);
      } else {
        setAuthUser(null);
      }
    });
  }, []);

  const handleLogin = (user, adminRow) => { setAuthUser(user); setAdminUser(adminRow); };
  const handleLogout = async () => { await supabase.auth.signOut(); setAuthUser(null); setAdminUser(null); };

  if (authUser === undefined) {
    return <div style={{ minHeight: "100vh", background: A.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, color: A.textMuted }}>Loading…</div>;
  }

  if (!authUser) return <AdminLogin onLogin={handleLogin} />;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: A.bg, fontFamily: sans }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      <Sidebar active={page} onNav={setPage} adminUser={adminUser} onLogout={handleLogout} />
      <div style={{ flex: 1, padding: 40, overflowY: "auto" }}>
        {page === "dashboard"     && <Dashboard />}
        {page === "users"         && <UsersPage />}
        {page === "subscriptions" && <SubscriptionsPage />}
        {page === "templates"     && <TemplatesPage adminUser={adminUser} />}
        {page === "builder" && (
          <BuilderPage
            user={authUser}
            profileForm={ADMIN_EMPTY_PROFILE}
            profileSkills={ADMIN_EMPTY_LIST}
            profileWork={ADMIN_EMPTY_LIST}
            profileEdu={ADMIN_EMPTY_LIST}
          />
        )}
        {page === "ai-optimize" && (
          <AIOptimizerPage
            user={authUser}
            profileForm={ADMIN_EMPTY_PROFILE}
            profileSkills={ADMIN_EMPTY_LIST}
            profileWork={ADMIN_EMPTY_LIST}
            profileEdu={ADMIN_EMPTY_LIST}
            onNav={setPage}
          />
        )}
        {page === "cover-letter" && (
          <CoverLetterPage
            profileForm={ADMIN_EMPTY_PROFILE}
            profileSkills={ADMIN_EMPTY_LIST}
            profileWork={ADMIN_EMPTY_LIST}
          />
        )}
      </div>
    </div>
  );
}
