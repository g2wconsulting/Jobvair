import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { useProfile } from "./useProfile";
import { C, EMPTY_USER, NAV } from "./constants/appConstants.js";
import { Avatar, Badge } from "./components/ui.jsx";
import Sidebar from "./components/Sidebar.jsx";
import AuthScreen from "./pages/AuthScreen.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import ResumesPage from "./pages/ResumesPage.jsx";
import BuilderPage from "./pages/BuilderPage.jsx";
import AIOptimizerPage from "./pages/AIOptimizerPage.jsx";
import CoverLetterPage from "./pages/CoverLetterPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
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
          setPage("dashboard");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const root = document.getElementById("root");
    const isAuthenticated = Boolean(authUser);
    root?.classList.toggle("jobvair-auth-root", isAuthenticated);
    document.body.classList.toggle("jobvair-authenticated", isAuthenticated);

    return () => {
      root?.classList.remove("jobvair-auth-root");
      document.body.classList.remove("jobvair-authenticated");
    };
  }, [authUser]);

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

  const handleParsedResume = async (parsed) => {
    applyParsedResume(parsed);
    if (authUser?.id) {
      await initProfile(
        authUser.id,
        authUser.email,
        authUser.user_metadata?.full_name ?? ""
      );
    }
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
    <div className="jobvair-app-shell" style={{ display:"flex", minHeight:"100vh", background:C.bg, fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
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
              onParsedResume={handleParsedResume}
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
          {page === "history"    && <HistoryPage onNav={setPage} />}
          {page === "settings"    && <SettingsPage user={user} onLogout={handleLogout} />}
        </div>
      </div>
    </div>
  );
}

