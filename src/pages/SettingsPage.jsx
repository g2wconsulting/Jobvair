import { useState } from "react";
import { STRIPE_PRICES } from "../constants/appConstants.js";
import { Page, PageHeader, Card, Badge, Button, Input, Avatar, Tabs } from "../components/ui/index.js";
import {
  ShieldCheck, Check, Eye, TrendingUp, Handshake, Lock, Users,
} from "lucide-react";
import { edgeFetch } from "../lib/edgeFetch.js";

function SubscriptionTab({ user, plans }) {
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [checkoutError, setCheckoutError] = useState(null);

  const startCheckout = async (priceId, planId) => {
    setCheckoutLoading(planId);
    setCheckoutError(null);
    try {
      const data = await edgeFetch("create-checkout-session", {
        price_id: priceId, user_id: user.id, user_email: user.email,
      });
      window.location.assign(data.url);
    } catch (err) {
      setCheckoutError(err.message || "Could not start checkout. Please try again.");
      setCheckoutLoading(null);
    }
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20, marginBottom: 24 }}>
        {plans.map(p => (
          <Card key={p.id} style={{ border: p.highlight ? "2px solid var(--jv-color-primary)" : "1px solid var(--jv-color-border)", position: "relative", display: "flex", flexDirection: "column" }}>
            {p.highlight && (
              <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)" }}>
                <Badge tone="info">Most Popular</Badge>
              </div>
            )}
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--jv-color-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{p.name}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 16 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: p.highlight ? "var(--jv-color-primary)" : "var(--jv-color-heading)" }}>{p.price}</span>
              <span style={{ fontSize: 13, color: "var(--jv-color-muted)" }}>{p.period}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 24, flex: 1 }}>
              {p.features.map(f => (
                <div key={f} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--jv-color-text)", alignItems: "flex-start" }}>
                  <Check size={15} color="var(--jv-color-success-600)" style={{ flexShrink: 0, marginTop: 1 }} />{f}
                </div>
              ))}
            </div>
            {p.current
              ? <div style={{ padding: "8px 16px", borderRadius: "var(--jv-radius-sm)", background: "var(--jv-color-teal-50)", color: "var(--jv-color-teal-700)", fontSize: 13, fontWeight: 650, textAlign: "center" }}>Current Plan</div>
              : (
                <Button
                  full
                  variant={p.highlight ? "primary" : "secondary"}
                  disabled={checkoutLoading === p.id}
                  onClick={() => startCheckout(STRIPE_PRICES[p.id] || "", p.id)}
                >
                  {checkoutLoading === p.id ? "Redirecting…" : p.cta}
                </Button>
              )}
          </Card>
        ))}
      </div>

      <Card style={{ border: "2px solid rgba(124,58,237,0.2)", background: "linear-gradient(135deg,#f5f3ff,#fff)", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--jv-color-purple-500)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Users size={24} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "var(--jv-color-heading)" }}>2nd Look — Recruiter Review</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: "var(--jv-color-purple-500)" }}>$25</span>
                <span style={{ fontSize: 12, color: "var(--jv-color-muted)" }}> one-time</span>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 28px", marginBottom: 16 }}>
              {["Real recruiter reviews your resume", "Written feedback within 48 hours", "Tailored to your target role & industry", "One round of follow-up questions"].map(f => (
                <div key={f} style={{ display: "flex", gap: 6, fontSize: 13, color: "var(--jv-color-text)", alignItems: "center" }}>
                  <span style={{ color: "var(--jv-color-purple-500)" }}>→</span>{f}
                </div>
              ))}
            </div>
            <Button
              style={{ background: "var(--jv-color-purple-500)", color: "#fff" }}
              disabled={checkoutLoading === "recruiter"}
              onClick={() => startCheckout(STRIPE_PRICES.recruiter_look, "recruiter")}
            >
              {checkoutLoading === "recruiter" ? "Redirecting…" : "Request a 2nd Look"}
            </Button>
          </div>
        </div>
      </Card>

      {checkoutError && (
        <div style={{ padding: "10px 14px", background: "#fef2f2", borderRadius: "var(--jv-radius-sm)", fontSize: 13, color: "var(--jv-color-danger-600)" }}>
          ⚠ {checkoutError}
        </div>
      )}
    </div>
  );
}

function BillingTab({ user }) {
  const [loading, setLoading] = useState(false);

  const openPortal = async () => {
    setLoading(true);
    try {
      const data = await edgeFetch("create-billing-portal-session", { user_id: user.id, user_email: user.email });
      window.location.assign(data.url);
    } catch {
      setLoading(false);
    }
  };

  const sub = user.subscription || "free";
  const isPaid = sub !== "free";

  return (
    <div style={{ width: "100%", maxWidth: 720 }}>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--jv-color-heading)" }}>Current Plan</div>
            <div style={{ fontSize: 13, color: "var(--jv-color-muted)", marginTop: 2 }}>
              {sub === "free" ? "Free" : sub === "premium" ? "Pro — $6/mo" : "Career+ — $12/mo"}
            </div>
          </div>
          <Badge tone={isPaid ? "success" : "neutral"}>{isPaid ? "Active" : "Free"}</Badge>
        </div>
        {isPaid ? (
          <>
            <div style={{ fontSize: 13, color: "var(--jv-color-muted)", marginBottom: 16 }}>
              Manage your subscription, update your payment method, or view invoices in the Stripe billing portal.
            </div>
            <Button onClick={openPortal} disabled={loading} variant="secondary">
              {loading ? "Opening…" : "Open Billing Portal →"}
            </Button>
          </>
        ) : (
          <div style={{ fontSize: 13, color: "var(--jv-color-muted)" }}>
            You are on the free plan. Upgrade from the Subscription tab to access billing management.
          </div>
        )}
      </Card>
    </div>
  );
}

const VERIFY_BENEFITS_VERIFIED = [
  { icon: Eye, text: "3× more profile views" },
  { icon: TrendingUp, text: "Priority in search" },
  { icon: Handshake, text: "Trusted by employers" },
  { icon: ShieldCheck, text: "Badge on profile" },
];
const VERIFY_BENEFITS_PITCH = [
  { icon: Eye, text: "3× more profile views" },
  { icon: TrendingUp, text: "Priority search results" },
  { icon: Check, text: "Stand out as verified" },
  { icon: Handshake, text: "Build employer trust" },
];

export function VerificationTab({ user }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const status = user.verificationStatus || (user.idVerified ? "verified" : "not_started");

  const startVerification = async () => {
    setLoading(true);
    setError(null);
    try {
      const returnUrl = `${window.location.origin}/?tab=verification`;
      const data = await edgeFetch("create-identity-session", {
        user_id: user.id, user_email: user.email, return_url: returnUrl,
      });
      window.location.assign(data.url);
    } catch (err) {
      setError(err.message || "Could not start verification. Please try again.");
      setLoading(false);
    }
  };

  const statusConfig = {
    not_started: { tone: "neutral", label: "Not started" },
    pending: { tone: "warning", label: "Verification in progress" },
    verified: { tone: "success", label: "Identity Verified" },
    failed: { tone: "danger", label: "Verification failed" },
    requires_review: { tone: "warning", label: "Under review" },
  };
  const cfg = statusConfig[status] || statusConfig.not_started;

  return (
    <div style={{ width: "100%", maxWidth: 720 }}>
      {status === "verified" ? (
        <Card style={{ textAlign: "center", padding: "40px 32px" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#dcfce7", border: "3px solid var(--jv-color-success-600)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Check size={32} color="var(--jv-color-success-600)" />
          </div>
          <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "var(--jv-color-success-600)" }}>Identity Verified</h3>
          <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--jv-color-muted)" }}>Your profile displays a verified badge. Employers see you as a trusted candidate.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
            {VERIFY_BENEFITS_VERIFIED.map(b => (
              <div key={b.text} style={{ padding: "10px 12px", background: "#dcfce7", borderRadius: "var(--jv-radius-sm)", fontSize: 13, color: "var(--jv-color-success-600)", display: "flex", gap: 8, alignItems: "center" }}>
                <b.icon size={15} />{b.text}
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card>
          {status !== "not_started" && (
            <div style={{ padding: "10px 14px", background: cfg.tone === "warning" ? "#fffbeb" : cfg.tone === "danger" ? "#fef2f2" : "var(--jv-color-slate-50)", borderRadius: "var(--jv-radius-sm)", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
              <Badge tone={cfg.tone}>{cfg.label}</Badge>
              <div>
                {status === "pending" && <div style={{ fontSize: 12, color: "var(--jv-color-muted)" }}>We'll update your profile automatically once Stripe completes the check.</div>}
                {status === "failed" && <div style={{ fontSize: 12, color: "var(--jv-color-muted)" }}>Verification was unsuccessful. You can try again below.</div>}
                {status === "requires_review" && <div style={{ fontSize: 12, color: "var(--jv-color-muted)" }}>Our team is reviewing your submission. This usually takes 1-2 business days.</div>}
              </div>
            </div>
          )}

          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--jv-gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <ShieldCheck size={28} color="#fff" />
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "var(--jv-color-heading)" }}>Verify Your Identity</h3>
            <p style={{ margin: 0, fontSize: 14, color: "var(--jv-color-muted)" }}>Boost your visibility and build trust with employers.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginBottom: 20 }}>
            {VERIFY_BENEFITS_PITCH.map(b => (
              <div key={b.text} style={{ display: "flex", gap: 8, padding: "10px 12px", background: "var(--jv-color-teal-50)", borderRadius: "var(--jv-radius-sm)", fontSize: 13, color: "var(--jv-color-teal-700)", fontWeight: 500, alignItems: "center" }}>
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

          <div style={{ display: "flex", gap: 10, padding: "12px 14px", background: "var(--jv-color-slate-50)", border: "1px solid var(--jv-color-border)", borderRadius: "var(--jv-radius-md)", marginBottom: 20 }}>
            <Lock size={18} color="var(--jv-color-muted)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: 12, color: "var(--jv-color-muted)", lineHeight: 1.5 }}>
              <strong style={{ color: "var(--jv-color-heading)" }}>Powered by Stripe Identity.</strong> Your documents are encrypted, processed by Stripe, and never shared with employers or stored by Jobvair.
            </div>
          </div>

          {error && (
            <div style={{ marginBottom: 14, padding: "10px 14px", background: "#fef2f2", borderRadius: "var(--jv-radius-sm)", fontSize: 13, color: "var(--jv-color-danger-600)" }}>
              ⚠ {error}
            </div>
          )}

          <Button full onClick={startVerification} disabled={loading} icon={ShieldCheck}>
            {loading ? "Starting verification…" : status === "failed" ? "Try Again" : "Start Verification with Stripe"}
          </Button>
        </Card>
      )}
    </div>
  );
}

export default function SettingsPage({ user, onLogout }) {
  const [tab, setTab] = useState("account");
  const [saved, setSaved] = useState(false);

  const [accountForm, setAccountForm] = useState({ name: user.name || "", email: user.email || "", phone: user.phone || "" });
  const setAF = k => e => setAccountForm(f => ({ ...f, [k]: e.target.value }));

  const [secForm, setSecForm] = useState({ current: "", next: "", confirm: "" });
  const setSF = k => e => setSecForm(f => ({ ...f, [k]: e.target.value }));
  const [secMsg, setSecMsg] = useState(null);

  const saveAccount = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const savePassword = () => {
    if (!secForm.current) { setSecMsg({ type: "error", text: "Enter your current password." }); return; }
    if (secForm.next.length < 8) { setSecMsg({ type: "error", text: "New password must be at least 8 characters." }); return; }
    if (secForm.next !== secForm.confirm) { setSecMsg({ type: "error", text: "Passwords don't match." }); return; }
    setSecMsg({ type: "success", text: "Password updated successfully." });
    setSecForm({ current: "", next: "", confirm: "" });
  };

  const plans = [
    { id: "free", name: "Free", price: "$0", period: "/mo", current: true, features: ["1 resume", "Basic template", "3 AI analyses per month", "Profile builder", "ID verification"], cta: "Current Plan" },
    { id: "pro", name: "Pro", price: "$6", period: "/mo", current: false, highlight: true, features: ["Unlimited resumes", "Unlimited pre-set templates", "Extended AI analyses (monthly limit applies)", "PDF export", "Profile visibility boost"], cta: "Upgrade to Pro" },
    { id: "career", name: "Career+", price: "$12", period: "/mo", current: false, features: ["Everything in Pro", "Unlimited customizable templates", "Template database access", "Career coaching session", "LinkedIn optimization tips", "Interview prep AI"], cta: "Upgrade to Career+" },
  ];

  return (
    <Page size="wide" className="jobvair-page">
      <PageHeader title="Settings" />
      <Tabs tabs={[
        { id: "account", label: "Account" }, { id: "security", label: "Security" },
        { id: "subscription", label: "Subscription" }, { id: "billing", label: "Billing" },
        { id: "notifications", label: "Notifications" },
      ]} active={tab} onChange={setTab} />

      {tab === "account" && (
        <div style={{ width: "100%", maxWidth: 720 }}>
          <Card>
            <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 24 }}>
              <div style={{ position: "relative" }}>
                <Avatar name={accountForm.name} size={56} />
                {user.idVerified && (
                  <div style={{ position: "absolute", bottom: 0, right: 0, width: 18, height: 18, borderRadius: "50%", background: "var(--jv-color-primary)", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Check size={10} color="#fff" />
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--jv-color-heading)" }}>{accountForm.name || "Your Name"}</div>
                <div style={{ fontSize: 14, color: "var(--jv-color-muted)" }}>{accountForm.email}</div>
                {user.idVerified && <Badge tone="success" icon={ShieldCheck}>Identity Verified</Badge>}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Input label="Full Name" value={accountForm.name} onChange={setAF("name")} placeholder="Your full name" />
              <Input label="Email Address" type="email" value={accountForm.email} onChange={setAF("email")} placeholder="you@email.com" />
              <Input label="Phone Number" value={accountForm.phone} onChange={setAF("phone")} placeholder="(555) 000-0000" />
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Button onClick={saveAccount}>Save Changes</Button>
                {saved && <span style={{ fontSize: 13, color: "var(--jv-color-success-600)" }}>✓ Saved successfully</span>}
              </div>
            </div>
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--jv-color-border)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--jv-color-danger-600)", marginBottom: 6 }}>Danger Zone</div>
              <div style={{ fontSize: 13, color: "var(--jv-color-muted)", marginBottom: 12 }}>Permanently delete your account and all data. This cannot be undone.</div>
              <Button variant="danger" size="sm">Delete My Account</Button>
            </div>
          </Card>
        </div>
      )}

      {tab === "security" && (
        <div style={{ width: "100%", maxWidth: 720 }}>
          <Card>
            <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "var(--jv-color-heading)" }}>Change Password</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Input label="Current Password" type="password" value={secForm.current} onChange={setSF("current")} placeholder="••••••••" />
              <Input label="New Password" type="password" value={secForm.next} onChange={setSF("next")} placeholder="At least 8 characters" hint="Use a mix of letters, numbers, and symbols." />
              <Input label="Confirm New Password" type="password" value={secForm.confirm} onChange={setSF("confirm")} placeholder="Repeat new password" />
              {secMsg && (
                <div style={{ padding: "10px 14px", borderRadius: "var(--jv-radius-sm)", fontSize: 13, background: secMsg.type === "success" ? "#dcfce7" : "#fef2f2", color: secMsg.type === "success" ? "var(--jv-color-success-600)" : "var(--jv-color-danger-600)" }}>
                  {secMsg.type === "success" ? "✓ " : "⚠ "}{secMsg.text}
                </div>
              )}
              <Button onClick={savePassword} style={{ alignSelf: "flex-start" }}>Update Password</Button>
            </div>
          </Card>
        </div>
      )}

      {tab === "subscription" && <SubscriptionTab user={user} plans={plans} />}
      {tab === "billing" && <BillingTab user={user} />}

      {tab === "notifications" && (
        <div style={{ width: "100%", maxWidth: 720 }}>
          <Card>
            <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "var(--jv-color-heading)" }}>Notification Preferences</h3>
            {[
              ["AI analysis complete", "Notify when your AI analysis is ready"],
              ["New job match alerts", "Jobs matching your profile and preferences"],
              ["Profile completion tips", "Tips to reach 100% profile completion"],
              ["ID verification reminders", "Reminders to complete identity verification"],
              ["Recruiter 2nd Look updates", "Status on your recruiter review request"],
              ["Product updates", "News about new Jobvair features"],
            ].map(([lbl, sub]) => (
              <div key={lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--jv-color-border)" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--jv-color-heading)" }}>{lbl}</div>
                  <div style={{ fontSize: 13, color: "var(--jv-color-muted)" }}>{sub}</div>
                </div>
                <input type="checkbox" defaultChecked style={{ width: 18, height: 18, accentColor: "var(--jv-color-primary)", cursor: "pointer" }} />
              </div>
            ))}
          </Card>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <Button variant="secondary" onClick={onLogout}>Sign Out</Button>
      </div>
    </Page>
  );
}
