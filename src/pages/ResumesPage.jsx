import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Plus, FileText, Paperclip, Star, Copy, Download, Trash2, Mail, Link as LinkIcon, ChevronDown } from "lucide-react";
import { Page, PageHeader, Card, Badge, Button, EmptyState, LoadingSkeleton } from "../components/ui/index.js";

function ResumeCard({ resume: r, template: tmpl, onEdit, onDuplicate, onSetPrimary, onDelete }) {
  const [exportOpen, setExportOpen] = useState(false);
  const accent = tmpl?.accent_color || "#00BFA5";

  const exportActions = [
    { label: "PDF", icon: Download, action: onEdit },
    {
      label: "Share Link", icon: LinkIcon,
      action: () => { navigator.clipboard?.writeText(`${window.location.origin}/?resume=${r.id}`); alert("Link copied to clipboard!"); },
    },
    {
      label: "Email", icon: Mail,
      action: () => window.open(`mailto:?subject=My Resume&body=Please find my resume attached. View online: ${window.location.origin}/?resume=${r.id}`),
    },
  ];

  return (
    <Card style={{ position: "relative" }}>
      {r.is_primary && (
        <div style={{ position: "absolute", top: 14, right: 14 }}>
          <Badge tone="success" icon={Star}>Primary</Badge>
        </div>
      )}
      {tmpl && <div style={{ height: 4, background: accent, borderRadius: "16px 16px 0 0", margin: "calc(var(--jv-card-padding, 20px) * -1) calc(var(--jv-card-padding, 20px) * -1) 14px", width: "calc(100% + var(--jv-card-padding, 20px) * 2)" }} />}
      <span style={{ display: "inline-flex", color: "#00BFA5", marginBottom: 10 }}>
        {r.storage_path ? <Paperclip size={30} /> : <FileText size={30} />}
      </span>
      <div style={{ fontSize: 16, fontWeight: 750, color: "var(--jv-color-heading)", marginBottom: 4, paddingRight: 60 }}>{r.name}</div>
      <div style={{ fontSize: 13, color: "var(--jv-color-text)", marginBottom: 3 }}>{tmpl ? tmpl.name : r.template || "Default Template"}</div>
      <div style={{ fontSize: 12, color: "var(--jv-color-muted)", marginBottom: 16 }}>{new Date(r.updated_at || r.created_at).toLocaleDateString()}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <Button size="sm" onClick={onEdit}>Edit</Button>
        <Button size="sm" variant="secondary" icon={Copy} onClick={onDuplicate}>Duplicate</Button>
        {!r.is_primary && <Button size="sm" variant="secondary" onClick={onSetPrimary}>Set Primary</Button>}
        <div style={{ position: "relative" }}>
          <Button size="sm" variant="secondary" icon={ChevronDown} iconPosition="right" onClick={() => setExportOpen(o => !o)}>Export</Button>
          {exportOpen && (
            <div style={{ position: "absolute", top: "110%", left: 0, background: "var(--jv-color-surface)", border: "1px solid var(--jv-color-border)", borderRadius: "var(--jv-radius-md)", boxShadow: "var(--jv-shadow-md)", zIndex: 50, minWidth: 170, padding: 6 }}>
              {exportActions.map(item => (
                <button
                  key={item.label}
                  onClick={() => { item.action(); setExportOpen(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px", background: "none", border: "none", fontSize: 13, color: "var(--jv-color-heading)", cursor: "pointer", textAlign: "left", fontFamily: "inherit", borderRadius: "var(--jv-radius-xs)" }}
                >
                  <item.icon size={14} color="var(--jv-color-muted)" />{item.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button size="sm" variant="ghost" icon={Trash2} onClick={onDelete} />
      </div>
    </Card>
  );
}

export default function ResumesPage({ onNav, user }) {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbTemplates, setDbTemplates] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("resumes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error("[ResumesPage]", error.message);
        else setResumes(data || []);
        setLoading(false);
      });
  }, [user?.id]);

  useEffect(() => {
    supabase.from("resume_templates").select("*").eq("is_active", true).order("sort_order")
      .then(({ data }) => setDbTemplates(data || []));
  }, []);

  const del = async (id) => {
    await supabase.from("resumes").delete().eq("id", id);
    setResumes(r => r.filter(x => x.id !== id));
  };

  const dup = async (r) => {
    const { data } = await supabase.from("resumes").insert({
      user_id: user.id, name: r.name + " (Copy)", template: r.template,
      is_primary: false, sections: r.sections, contact_fields: r.contact_fields,
    }).select().single();
    if (data) setResumes(rs => [data, ...rs]);
  };

  const setPrimary = async (id) => {
    await supabase.from("resumes").update({ is_primary: false }).eq("user_id", user.id);
    await supabase.from("resumes").update({ is_primary: true }).eq("id", id);
    setResumes(rs => rs.map(r => ({ ...r, is_primary: r.id === id })));
  };

  return (
    <Page size="wide" className="jobvair-page">
      <PageHeader
        title="My Resumes"
        description="Manage your resume versions. Mark one as primary for AI analysis."
        actions={<Button icon={Plus} onClick={() => onNav("builder")}>New Resume</Button>}
      />

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="jv-card"><div className="jv-card__body"><LoadingSkeleton lines={4} /></div></div>
          ))}
        </div>
      ) : resumes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No resumes yet"
          description="Create your first resume to get started with AI-powered tailoring and optimization."
          actionLabel="Create Resume"
          onAction={() => onNav("builder")}
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
          {resumes.map(r => {
            const tmpl = dbTemplates.find(t => t.id === r.selected_template_id || t.slug === r.template);
            return (
              <ResumeCard
                key={r.id}
                resume={r}
                template={tmpl}
                onEdit={() => onNav("builder")}
                onDuplicate={() => dup(r)}
                onSetPrimary={() => setPrimary(r.id)}
                onDelete={() => del(r.id)}
              />
            );
          })}
          <div
            onClick={() => onNav("builder")}
            style={{ border: "2px dashed var(--jv-color-border-strong)", borderRadius: "var(--jv-radius-lg)", padding: "40px 24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--jv-color-muted)", minHeight: 200, gap: 8 }}
          >
            <Plus size={28} />
            <div style={{ fontSize: 14, fontWeight: 650 }}>Create New Resume</div>
          </div>
        </div>
      )}
    </Page>
  );
}
