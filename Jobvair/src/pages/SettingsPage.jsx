import { useState } from "react";
import { C, STRIPE_PRICES } from "../constants/appConstants.js";
import { Avatar, Badge, Btn, Card, Input, SectionTitle, Tabs } from "../components/ui.jsx";
import { edgeFetch } from "../lib/edgeFetch.js";

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
      window.location.assign(data.url);
    } catch (err) {
      setCheckoutError(err.message || "Could not start checkout. Please try again.");
      setCheckoutLoading(null);
    }
  };

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:20, marginBottom:24 }}>
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
      window.location.assign(data.url);
    } catch {
      setLoading(false);
    }
  };

  const sub = user.subscription || "free";
  const isPaid = sub !== "free";

  return (
    <div style={{ width:"100%", maxWidth:720 }}>
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

export function VerificationTab({ user }) {
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
      window.location.assign(data.url);
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
    <div style={{ width:"100%", maxWidth:720 }}>
      {status === "verified" ? (
        <Card style={{ textAlign:"center", padding:"40px 32px" }}>
          <div style={{ width:72, height:72, borderRadius:"50%", background:C.successBg, border:`3px solid ${C.success}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:32 }}>✓</div>
          <h3 style={{ margin:"0 0 8px", fontSize:20, fontWeight:700, color:C.success }}>Identity Verified</h3>
          <p style={{ margin:"0 0 20px", fontSize:14, color:C.textMuted }}>Your profile displays a verified badge. Employers see you as a trusted candidate.</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:10 }}>
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

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:10, marginBottom:20 }}>
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
export default function SettingsPage({ user, onLogout }) {
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

  return (
    <div className="jobvair-page">
      <SectionTitle>Settings</SectionTitle>
      <Tabs tabs={[
        { id:"account", label:"Account" },{ id:"security", label:"Security" },
        { id:"subscription", label:"Subscription" },{ id:"billing", label:"Billing" },
        { id:"notifications", label:"Notifications" },
      ]} active={tab} onChange={setTab} />

      {tab==="account" && (
        <div style={{ width:"100%", maxWidth:720 }}>
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
        <div style={{ width:"100%", maxWidth:720 }}>
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
        <div style={{ width:"100%", maxWidth:720 }}>
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


