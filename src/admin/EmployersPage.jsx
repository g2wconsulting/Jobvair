// Super-admin: per-employer plan assignment and feature-flag overrides.
// Lets Jobvair staff turn individual product surfaces on or off for a
// specific company, independent of (or on top of) their subscription plan —
// e.g. enabling Interview Scheduling early for one client as a pilot.

import { useEffect, useState } from "react";
import { A, font, sans } from "./theme.js";
import { Card, Badge, Btn, Select } from "./ui.jsx";
import { GATABLE_FEATURES, computeEffectiveFeatures } from "../employer/featureFlags.js";
import {
  listCompaniesForAdmin, listSubscriptionPlans, getFeatureEntitlements,
  upsertFeatureEntitlement, clearFeatureEntitlement, setCompanySubscriptionPlan,
} from "../employer/lib/employerApi.js";

function FeatureToggleRow({ feature, planGrantsIt, entitlement, onChange }) {
  const state = entitlement ? (entitlement.enabled ? "on" : "off") : "plan";
  const effective = entitlement ? entitlement.enabled : planGrantsIt;

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${A.border}` }}>
      <div style={{ maxWidth: 420 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: A.text, display: "flex", alignItems: "center", gap: 8 }}>
          {feature.label}
          <Badge color={effective ? "green" : "gray"}>{effective ? "Enabled" : "Disabled"}</Badge>
          {!entitlement && <span style={{ fontSize: 10.5, color: A.textMuted, fontFamily: font, textTransform: "uppercase" }}>from plan</span>}
        </div>
        <div style={{ fontSize: 12.5, color: A.textMuted, marginTop: 2 }}>{feature.description}</div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <Btn small variant={state === "on" ? "primary" : "secondary"} onClick={() => onChange(feature.key, true)}>On</Btn>
        <Btn small variant={state === "off" ? "danger" : "secondary"} onClick={() => onChange(feature.key, false)}>Off</Btn>
        {entitlement && <Btn small variant="ghost" onClick={() => onChange(feature.key, null)}>Reset to plan</Btn>}
      </div>
    </div>
  );
}

function CompanyDetail({ company, plans, onUpdated }) {
  const [entitlements, setEntitlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState(false);
  const subscription = company.company_subscriptions?.[0] || company.company_subscriptions;
  const currentPlanId = subscription?.plan_id || "";

  useEffect(() => {
    getFeatureEntitlements(company.id).then(setEntitlements).finally(() => setLoading(false));
  }, [company.id]);

  const entitlementFor = (key) => entitlements.find(e => e.feature_key === key);
  const planFeatures = subscription?.subscription_plans?.features || [];
  const effective = computeEffectiveFeatures(planFeatures, entitlements);

  const handleChange = async (featureKey, value) => {
    if (value === null) {
      await clearFeatureEntitlement(company.id, featureKey);
    } else {
      await upsertFeatureEntitlement(company.id, featureKey, value);
    }
    const fresh = await getFeatureEntitlements(company.id);
    setEntitlements(fresh);
  };

  const handlePlanChange = async (planId) => {
    setSavingPlan(true);
    try {
      await setCompanySubscriptionPlan(company.id, planId || null);
      onUpdated();
    } finally {
      setSavingPlan(false);
    }
  };

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: A.text }}>{company.name}</div>
          <div style={{ fontSize: 12.5, color: A.textMuted }}>{company.industry || "No industry set"}</div>
        </div>
        <div style={{ width: 220 }}>
          <Select
            label="Subscription plan"
            value={currentPlanId}
            onChange={handlePlanChange}
            options={[{ value: "", label: "No plan" }, ...plans.map(p => ({ value: p.id, label: p.name }))]}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ color: A.textMuted, fontSize: 13 }}>Loading feature overrides…</div>
      ) : (
        <div>
          {GATABLE_FEATURES.map(f => (
            <FeatureToggleRow
              key={f.key}
              feature={f}
              planGrantsIt={Boolean(effective[f.key]) && !entitlementFor(f.key)}
              entitlement={entitlementFor(f.key)}
              onChange={handleChange}
            />
          ))}
        </div>
      )}
      {savingPlan && <div style={{ fontSize: 12, color: A.textMuted, marginTop: 8 }}>Saving plan…</div>}
    </Card>
  );
}

export default function EmployersPage() {
  const [companies, setCompanies] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = () => {
    Promise.all([listCompaniesForAdmin(), listSubscriptionPlans()])
      .then(([c, p]) => { setCompanies(c); setPlans(p); setError(""); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  const selected = companies.find(c => c.id === selectedId) || null;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: font, fontSize: 24, fontWeight: 800, color: A.white, margin: 0 }}>Employers</h1>
        <p style={{ color: A.textMuted, fontSize: 13.5, margin: "4px 0 0" }}>Assign plans and turn portal features on or off for each client.</p>
      </div>

      {error && <div style={{ color: A.red, fontSize: 13, marginBottom: 16 }}>{error}</div>}
      {loading ? (
        <div style={{ color: A.textMuted }}>Loading employers…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, alignItems: "start" }}>
          <Card style={{ padding: 8 }}>
            {companies.length === 0 && <div style={{ padding: 16, fontSize: 13, color: A.textMuted }}>No employer companies yet.</div>}
            {companies.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                style={{
                  width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 8, marginBottom: 2,
                  background: selectedId === c.id ? A.tealDim : "transparent", border: "none",
                  color: selectedId === c.id ? A.teal : A.text, cursor: "pointer", fontFamily: sans, fontSize: 13.5, fontWeight: 600,
                }}
              >
                {c.name}
              </button>
            ))}
          </Card>
          <div>
            {selected ? (
              <CompanyDetail key={selected.id} company={selected} plans={plans} onUpdated={reload} />
            ) : (
              <Card><div style={{ color: A.textMuted, fontSize: 13.5 }}>Select an employer to manage its plan and features.</div></Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
