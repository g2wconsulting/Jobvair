import { useEffect, useRef, useState } from "react";
import { UserPlus, Camera } from "lucide-react";
import { Page, PageHeader, Tabs, Card, Button, Input, Select, TextArea, Badge, EmptyState, Avatar } from "../../components/ui/index.js";
import {
  updateCompany, listHiringTeam, inviteEmployerMemberByEmail, updateMembership,
  uploadCompanyLogo, listPendingInvitations, revokeInvitation,
} from "../lib/employerApi.js";
import { EMPLOYER_ROLES } from "../constants.js";

const TABS = [
  { id: "profile", label: "Company Profile" },
  { id: "team",    label: "Hiring Team" },
];

function CompanyLogoUploader({ company, onUploaded }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const pick = () => fileInputRef.current?.click();

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image file."); return; }
    if (file.size > 3 * 1024 * 1024) { setError("Logo must be under 3MB."); return; }
    setError(""); setUploading(true);
    try {
      const url = await uploadCompanyLogo(company.id, file);
      onUploaded(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
      <button
        onClick={pick}
        disabled={uploading}
        title="Change company logo"
        style={{ position: "relative", width: 64, height: 64, borderRadius: "50%", border: "none", padding: 0, cursor: "pointer", background: "none" }}
      >
        {company?.logo_url ? (
          <img src={company.logo_url} alt={company.name} width={64} height={64} style={{ borderRadius: "50%", objectFit: "cover", display: "block" }} />
        ) : (
          <Avatar name={company?.name} size={64} />
        )}
        <span style={{ position: "absolute", bottom: -2, right: -2, width: 24, height: 24, borderRadius: "50%", background: "var(--jv-color-primary)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>
          <Camera size={12} color="#fff" />
        </span>
      </button>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--jv-color-heading)" }}>Company logo</div>
        <div style={{ fontSize: 12, color: "var(--jv-color-muted)" }}>{uploading ? "Uploading…" : "PNG or JPG, up to 3MB"}</div>
        {error && <div style={{ fontSize: 12, color: "var(--jv-color-danger-600)", marginTop: 2 }}>{error}</div>}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: "none" }} />
    </div>
  );
}

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
      <CompanyLogoUploader company={form} onUploaded={(url) => { const updated = { ...form, logo_url: url }; setForm(updated); onSaved(updated); }} />
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
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("recruiter");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const canManage = membership?.role === "company_admin";

  const reload = () => {
    Promise.all([listHiringTeam(company.id), listPendingInvitations(company.id)])
      .then(([t, p]) => { setTeam(t); setPending(p); })
      .finally(() => setLoading(false));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, [company?.id]);

  const invite = async () => {
    if (!email.trim()) return;
    setError(""); setNotice(""); setSending(true);
    try {
      const result = await inviteEmployerMemberByEmail(company.id, email.trim(), role);
      setEmail("");
      setInviting(false);
      setNotice(result.status === "invited"
        ? `Invite email sent to ${result.email}.`
        : `${result.email} already has a Jobvair account — added to your team directly.`);
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      {canManage && (
        <Card style={{ marginBottom: 16 }}>
          {!inviting ? (
            <Button icon={UserPlus} onClick={() => { setInviting(true); setNotice(""); }}>Invite hiring team member</Button>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 12, alignItems: "end" }}>
              <Input label="Email" value={email} onChange={e => setEmail(e.target.value)} placeholder="teammate@company.com" />
              <Select label="Role" value={role} onChange={e => setRole(e.target.value)} options={EMPLOYER_ROLES} />
              <Button onClick={invite} disabled={sending}>{sending ? "Sending…" : "Send invite"}</Button>
            </div>
          )}
          {error && <div style={{ marginTop: 10, fontSize: 13, color: "var(--jv-color-danger-600)" }}>{error}</div>}
          {notice && <div style={{ marginTop: 10, fontSize: 13, color: "var(--jv-color-teal-700)" }}>{notice}</div>}
        </Card>
      )}

      {loading ? <Card>Loading team…</Card> : (
        <>
          {pending.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--jv-color-muted)", textTransform: "uppercase", marginBottom: 8 }}>Pending invitations</div>
              <div style={{ display: "grid", gap: 8 }}>
                {pending.map(inv => (
                  <Card key={inv.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong>{inv.email}</strong>
                        <div style={{ fontSize: 12, color: "var(--jv-color-muted)" }}>Invited {new Date(inv.created_at).toLocaleDateString()}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <Badge tone="warning">{inv.role.replace("_", " ")} · pending</Badge>
                        {canManage && <Button size="sm" variant="ghost" onClick={() => revokeInvitation(inv.id).then(reload)}>Revoke</Button>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {team.length === 0 ? (
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
        </>
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
