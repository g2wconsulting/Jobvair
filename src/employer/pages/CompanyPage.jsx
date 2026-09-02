import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { Page, PageHeader, Tabs, Card, Button, Input, Select, TextArea, Badge, EmptyState } from "../../components/ui/index.js";
import { updateCompany, listHiringTeam, inviteEmployerMember, updateMembership } from "../lib/employerApi.js";
import { EMPLOYER_ROLES } from "../constants.js";

const TABS = [
  { id: "profile", label: "Company Profile" },
  { id: "team",    label: "Hiring Team" },
];

function CompanyProfileTab({ company, onSaved }) {
  const [form, setForm] = useState(company || {});
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const updated = await updateCompany(company.id, {
        name: form.name, website: form.website, industry: form.industry,
        company_size: form.company_size, headquarters_location: form.headquarters_location,
        description: form.description, culture: form.culture, work_environment: form.work_environment,
      });
      onSaved(updated);
    } finally { setSaving(false); }
  };

  return (
    <Card>
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Input label="Company name" value={form.name || ""} onChange={e => set("name", e.target.value)} />
          <Input label="Website" value={form.website || ""} onChange={e => set("website", e.target.value)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Input label="Industry" value={form.industry || ""} onChange={e => set("industry", e.target.value)} />
          <Select label="Company size" value={form.company_size || ""} onChange={e => set("company_size", e.target.value)}
            options={["", "1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"].map(s => ({ value: s, label: s || "Select…" }))} />
        </div>
        <Input label="Headquarters location" value={form.headquarters_location || ""} onChange={e => set("headquarters_location", e.target.value)} />
        <TextArea label="Company description" rows={4} value={form.description || ""} onChange={e => set("description", e.target.value)} />
        <TextArea label="Culture" rows={3} value={form.culture || ""} onChange={e => set("culture", e.target.value)} />
        <TextArea label="Work environment" rows={3} value={form.work_environment || ""} onChange={e => set("work_environment", e.target.value)} />
      </div>
      <Button style={{ marginTop: 20 }} disabled={saving} onClick={save}>{saving ? "Saving…" : "Save changes"}</Button>
    </Card>
  );
}

function HiringTeamTab({ company, membership }) {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("recruiter");
  const [error, setError] = useState("");
  const canManage = membership?.role === "company_admin";

  const reload = () => {
    listHiringTeam(company.id).then(setTeam).finally(() => setLoading(false));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, [company?.id]);

  const invite = async () => {
    if (!email.trim()) return;
    setError("");
    try {
      await inviteEmployerMember(company.id, email.trim(), role);
      setEmail("");
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      {canManage && (
        <Card style={{ marginBottom: 16 }}>
          {!inviting ? (
            <Button icon={UserPlus} onClick={() => setInviting(true)}>Add hiring team member</Button>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 12, alignItems: "end" }}>
              <Input label="Email (existing Jobvair account)" value={email} onChange={e => setEmail(e.target.value)} placeholder="teammate@company.com" />
              <Select label="Role" value={role} onChange={e => setRole(e.target.value)} options={EMPLOYER_ROLES} />
              <Button onClick={invite}>Add</Button>
            </div>
          )}
          {error && <div style={{ marginTop: 10, fontSize: 13, color: "var(--jv-color-danger-600)" }}>{error}</div>}
        </Card>
      )}

      {loading ? <Card>Loading team…</Card> : team.length === 0 ? (
        <EmptyState title="No teammates yet" description="Invite recruiters and hiring managers to collaborate on this company's jobs and candidates." />
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {team.map(m => (
            <Card key={m.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{m.employer_profiles?.full_name || m.employer_profiles?.email || "Team member"}</strong>
                  <div style={{ fontSize: 12, color: "var(--jv-color-muted)" }}>{m.employer_profiles?.email}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Badge tone={m.role === "company_admin" ? "success" : "neutral"}>{m.role.replace("_", " ")}</Badge>
                  {canManage && m.is_active && (
                    <Button size="sm" variant="ghost" onClick={() => updateMembership(m.id, { is_active: false }).then(reload)}>Remove</Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CompanyPage({ company, membership, onCompanyUpdated }) {
  const [tab, setTab] = useState("profile");
  return (
    <Page size="wide">
      <PageHeader eyebrow="Company" title="Company" description="How your company appears to candidates and your hiring team." />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div style={{ marginTop: 16 }}>
        {tab === "profile" && <CompanyProfileTab key={company?.id} company={company} onSaved={onCompanyUpdated} />}
        {tab === "team" && <HiringTeamTab company={company} membership={membership} />}
      </div>
    </Page>
  );
}
