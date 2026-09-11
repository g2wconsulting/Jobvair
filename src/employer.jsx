import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { Badge, Avatar, Button, Input, Select } from "./components/ui/index.js";
import EmployerSidebar from "./employer/components/EmployerSidebar.jsx";
import EmployerAuthScreen from "./employer/pages/AuthScreen.jsx";
import EmployerDashboardPage from "./employer/pages/DashboardPage.jsx";
import JobsPage from "./employer/pages/JobsPage.jsx";
import CandidatesPage from "./employer/pages/CandidatesPage.jsx";
import AssessmentsPage from "./employer/pages/AssessmentsPage.jsx";
import AssessmentBuilderPage from "./employer/pages/AssessmentBuilderPage.jsx";
import AssessmentDashboardPage from "./employer/pages/AssessmentDashboardPage.jsx";
import HiringPage from "./employer/pages/HiringPage.jsx";
import IntelligencePage from "./employer/pages/IntelligencePage.jsx";
import CompanyPage from "./employer/pages/CompanyPage.jsx";
import BillingPage from "./employer/pages/BillingPage.jsx";
import EmployerSettingsPage from "./employer/pages/SettingsPage.jsx";
import { EMPLOYER_NAV } from "./employer/constants.js";
import { getMyMemberships, createCompanyAndAdmin, acceptPendingInvitation, getEffectiveFeatures } from "./employer/lib/employerApi.js";
import { hasFeature } from "./employer/featureFlags.js";

function CreateCompanyScreen({ onCreated }) {
  const [form, setForm] = useState({ name: "", website: "", industry: "", company_size: "", headquarters_location: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    setLoading(true); setError("");
    try {
      await createCompanyAndAdmin(form);
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--jv-gradient-brand)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "var(--jv-font-sans)" }}>
      <div style={{ width: "100%", maxWidth: 480, background: "#fff", borderRadius: "var(--jv-radius-xl)", padding: "32px 36px", boxShadow: "var(--jv-shadow-lg)" }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 750 }}>Set up your company</h2>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--jv-color-muted)" }}>Your Jobvair account doesn't have an employer profile yet.</p>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Company name" value={form.name} onChange={e => set("name", e.target.value)} required />
          <Input label="Website" value={form.website} onChange={e => set("website", e.target.value)} />
          <Input label="Industry" value={form.industry} onChange={e => set("industry", e.target.value)} />
          <Select label="Company size" value={form.company_size} onChange={e => set("company_size", e.target.value)}
            options={["", "1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"].map(s => ({ value: s, label: s || "Select…" }))} />
          <Input label="Headquarters location" value={form.headquarters_location} onChange={e => set("headquarters_location", e.target.value)} />
          {error && <div style={{ fontSize: 13, color: "var(--jv-color-danger-600)" }}>{error}</div>}
          <Button type="submit" disabled={loading} full>{loading ? "Creating…" : "Create company"}</Button>
        </form>
      </div>
    </div>
  );
}

export default function EmployerApp() {
  const [authUser, setAuthUser] = useState(undefined);
  const [activeMembership, setActiveMembership] = useState(null);
  const [membershipsLoaded, setMembershipsLoaded] = useState(false);
  const [membershipsError, setMembershipsError] = useState("");
  const [page, setPage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [features, setFeatures] = useState(null);
  const [assessmentPrefill, setAssessmentPrefill] = useState(null);

  const loadMemberships = async () => {
    setMembershipsError("");
    try {
      let rows = await getMyMemberships();
      if (rows.length === 0) {
        // No membership yet — maybe they just followed a hiring-team invite
        // link. Try to redeem a pending invitation matching their email
        // before falling back to "set up a new company".
        try {
          const acceptedCompanyId = await acceptPendingInvitation();
          if (acceptedCompanyId) rows = await getMyMemberships();
        } catch (inviteErr) {
          console.error("[EmployerApp] acceptPendingInvitation error:", inviteErr);
        }
      }
      setActiveMembership(rows[0] || null);
      setMembershipsLoaded(true);
    } catch (err) {
      console.error("[EmployerApp] loadMemberships error:", err);
      setMembershipsError(err.message || "Failed to load your employer account.");
      setMembershipsLoaded(true);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      setAuthUser(u);
      if (u) loadMemberships();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null;
      setAuthUser(u);
      if (event === "SIGNED_IN" && u) loadMemberships();
      if (event === "SIGNED_OUT") { setActiveMembership(null); setMembershipsLoaded(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const companyId = activeMembership?.companies?.id;
    if (!companyId) return;
    getEffectiveFeatures(companyId).then(setFeatures).catch(err => {
      console.error("[EmployerApp] getEffectiveFeatures error:", err);
      setFeatures({});
    });
  }, [activeMembership?.companies?.id]);

  const handleLogout = async () => { await supabase.auth.signOut(); };

  if (authUser === undefined) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--jv-color-muted)", fontFamily: "var(--jv-font-sans)" }}>Loading…</div>;
  }

  if (!authUser) return <EmployerAuthScreen onAuthed={(u) => { setAuthUser(u); loadMemberships(); }} />;

  if (!membershipsLoaded) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--jv-color-muted)", fontFamily: "var(--jv-font-sans)" }}>Loading your company…</div>;
  }

  if (membershipsError) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "var(--jv-font-sans)" }}>
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <h2 style={{ color: "var(--jv-color-danger-600)", marginBottom: 8 }}>Couldn't load your employer account</h2>
          <p style={{ color: "var(--jv-color-muted)", fontSize: 13, marginBottom: 16 }}>{membershipsError}</p>
          <p style={{ color: "var(--jv-color-muted)", fontSize: 12, marginBottom: 16 }}>
            This usually means the employer portal database migration hasn't been applied to this Supabase project yet.
          </p>
          <Button onClick={loadMemberships}>Try again</Button>
          <Button variant="ghost" onClick={handleLogout} style={{ marginLeft: 8 }}>Sign out</Button>
        </div>
      </div>
    );
  }

  if (!activeMembership) return <CreateCompanyScreen onCreated={loadMemberships} />;

  const company = activeMembership.companies;
  const user = authUser;

  const navigate = (nextPage) => {
    const navItem = EMPLOYER_NAV.find(n => n.id === nextPage);
    if (features && navItem?.featureKey && !hasFeature(features, navItem.featureKey)) return;
    setPage(nextPage);
  };

  const sendAssessmentTo = ({ profile, application }) => {
    const [first, ...rest] = (profile?.full_name || "").trim().split(/\s+/);
    setAssessmentPrefill({ first: first || "", last: rest.join(" "), email: profile?.email || "", jobId: application?.job_id || "" });
    navigate("assessments");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--jv-color-page)", fontFamily: "var(--jv-font-sans)" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <EmployerSidebar active={page} onNav={navigate} company={company} membership={activeMembership} collapsed={collapsed} onCollapse={() => setCollapsed(c => !c)} onLogout={handleLogout} features={features} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div className="jv-topbar">
          <div>
            <h1 className="jv-topbar__title">{company?.name}</h1>
            <p className="jv-topbar__subtitle">Employer Portal</p>
          </div>
          <div className="jv-topbar__actions">
            <Badge tone="neutral">{activeMembership.role?.replace("_", " ")}</Badge>
            <button
              onClick={() => setPage("company")}
              title="Manage company profile"
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", borderRadius: "50%", lineHeight: 0 }}
            >
              {company?.logo_url ? (
                <img src={company.logo_url} alt={company.name} width={32} height={32} style={{ borderRadius: "50%", objectFit: "cover", display: "block" }} />
              ) : (
                <Avatar name={company?.name} size={32} />
              )}
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {page === "dashboard"    && <EmployerDashboardPage company={company} onNav={navigate} />}
          {page === "jobs"         && <JobsPage company={company} user={user} />}
          {page === "candidates"   && <CandidatesPage company={company} user={user} features={features} onSendAssessment={sendAssessmentTo} />}
          {page === "assessments"  && hasFeature(features, "assessments") && (
            <AssessmentsPage company={company} user={user} prefillCandidate={assessmentPrefill} onPrefillConsumed={() => setAssessmentPrefill(null)} />
          )}
          {page === "assessment-dashboard" && hasFeature(features, "assessments") && (
            <AssessmentDashboardPage company={company} />
          )}
          {page === "assessment-builder" && hasFeature(features, "assessment_builder") && <AssessmentBuilderPage company={company} user={user} />}
          {page === "hiring"       && <HiringPage company={company} user={user} />}
          {page === "intelligence" && hasFeature(features, "market_intelligence") && <IntelligencePage company={company} user={user} />}
          {page === "company"      && <CompanyPage company={company} membership={activeMembership} onCompanyUpdated={loadMemberships} />}
          {page === "billing"      && <BillingPage company={company} />}
          {page === "settings"     && <EmployerSettingsPage user={user} membership={activeMembership} onLogout={handleLogout} />}
        </div>
      </div>
    </div>
  );
}
