import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { C } from "../constants/appConstants.js";
import { Badge, Btn, Card, SectionTitle } from "../components/ui.jsx";

export default function ResumesPage({ onNav, user }) {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);

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
    // Remove primary from all, set on selected
    await supabase.from("resumes").update({ is_primary: false }).eq("user_id", user.id);
    await supabase.from("resumes").update({ is_primary: true }).eq("id", id);
    setResumes(rs => rs.map(r => ({ ...r, is_primary: r.id === id })));
  };

  const [dbTemplates, setDbTemplates] = useState([]);
  useEffect(() => {
    supabase.from("resume_templates").select("*").eq("is_active", true).order("sort_order")
      .then(({ data }) => setDbTemplates(data || []));
  }, []);

  return (
    <div>
      <SectionTitle sub="Manage your resume versions. Mark one as primary for AI analysis." action={<Btn icon="＋" onClick={() => onNav("builder")}>New Resume</Btn>}>My Resumes</SectionTitle>

      {loading ? (
        <div style={{ textAlign:"center", padding:"40px", color:C.textMuted }}>Loading resumes…</div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:20, marginBottom:32 }}>
          {resumes.map(r => {
            const tmpl = dbTemplates.find(t => t.id === r.selected_template_id || t.slug === r.template);
            return (
              <Card key={r.id} hover style={{ position:"relative" }}>
                {r.is_primary && <div style={{ position:"absolute", top:14, right:14 }}><Badge color="teal">⭐ Primary</Badge></div>}
                {/* Mini template color strip */}
                {tmpl && <div style={{ height:4, background:tmpl.accent_color || C.teal, borderRadius:"6px 6px 0 0", margin:"-20px -20px 14px", width:"calc(100% + 40px)" }} />}
                <div style={{ fontSize:36, marginBottom:10 }}>{r.storage_path ? "📎" : "📄"}</div>
                <div style={{ fontSize:16, fontWeight:700, color:C.navy, marginBottom:4, paddingRight:60 }}>{r.name}</div>
                <div style={{ fontSize:13, color:C.textMuted, marginBottom:3 }}>
                  {tmpl ? tmpl.name : r.template || "Default Template"}
                </div>
                <div style={{ fontSize:12, color:C.textLight, marginBottom:16 }}>
                  {new Date(r.updated_at || r.created_at).toLocaleDateString()}
                </div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <Btn small onClick={() => onNav("builder")}>Edit</Btn>
                  <Btn small variant="secondary" onClick={() => dup(r)}>Duplicate</Btn>
                  {!r.is_primary && <Btn small variant="secondary" onClick={() => setPrimary(r.id)}>Set Primary</Btn>}
                  <div style={{ position:"relative" }}>
                    <Btn small variant="secondary" onClick={() => {
                      const menu = document.getElementById(`export-menu-${r.id}`);
                      if (menu) menu.style.display = menu.style.display === "none" ? "block" : "none";
                    }}>⬇ Export ▾</Btn>
                    <div id={`export-menu-${r.id}`} style={{ display:"none", position:"absolute", top:"110%", left:0, background:"#fff", border:`1px solid ${C.border}`, borderRadius:8, boxShadow:"0 4px 16px rgba(0,0,0,0.12)", zIndex:50, minWidth:160, padding:6 }}>
                      {[
                        ["PDF", () => { onNav("builder"); }],
                        ["Share Link", () => { navigator.clipboard?.writeText(`${window.location.origin}/?resume=${r.id}`); alert("Link copied to clipboard!"); }],
                        ["Email", () => { window.open(`mailto:?subject=My Resume&body=Please find my resume attached. View online: ${window.location.origin}/?resume=${r.id}`); }],
                      ].map(([label, fn]) => (
                        <button key={label} onClick={() => { fn(); document.getElementById(`export-menu-${r.id}`).style.display = "none"; }}
                          style={{ display:"block", width:"100%", padding:"8px 12px", background:"none", border:"none", fontSize:13, color:C.navy, cursor:"pointer", textAlign:"left", fontFamily:"inherit", borderRadius:5 }}
                          onMouseEnter={e=>e.target.style.background=C.bg}
                          onMouseLeave={e=>e.target.style.background="none"}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Btn small variant="ghost" onClick={() => del(r.id)}>🗑</Btn>
                </div>
              </Card>
            );
          })}
          <div onClick={() => onNav("builder")} style={{ border:`2px dashed ${C.border}`, borderRadius:12, padding:"40px 24px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", color:C.textMuted, minHeight:200 }}>
            <div style={{ fontSize:32, marginBottom:8 }}>＋</div>
            <div style={{ fontSize:14, fontWeight:600 }}>Create New Resume</div>
          </div>
        </div>
      )}

      <SectionTitle sub="Choose a starting template. Free templates available to all users. Premium templates unlock with a paid plan.">Resume Templates</SectionTitle>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16 }}>
        {dbTemplates.map(t => (
          <Card key={t.id} hover style={{ textAlign:"center", cursor:"pointer", padding:0, overflow:"hidden" }} onClick={() => onNav("builder")}>
            {/* Template mini-preview */}
            <div style={{ height:120, background:`${t.accent_color || C.teal}10`, position:"relative", overflow:"hidden", display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"10px 12px" }}>
              {/* Simulated resume header */}
              <div style={{ width:"100%", background:"#fff", borderRadius:4, padding:"8px 10px", boxShadow:"0 2px 8px rgba(0,0,0,0.1)" }}>
                {t.header_style === "bold_banner" ? (
                  <div style={{ background:t.accent_color || C.teal, margin:"-8px -10px 6px", padding:"6px 10px", borderRadius:"4px 4px 0 0" }}>
                    <div style={{ height:6, background:"rgba(255,255,255,0.9)", borderRadius:2, marginBottom:3, width:"60%" }} />
                    <div style={{ height:3, background:"rgba(255,255,255,0.6)", borderRadius:2, width:"40%" }} />
                  </div>
                ) : (
                  <div style={{ borderBottom:`2px solid ${t.accent_color || C.teal}`, paddingBottom:4, marginBottom:5 }}>
                    <div style={{ height:6, background:"#1E293B", borderRadius:2, marginBottom:3, width:"55%", ...(t.header_style === "centered" ? { margin:"0 auto 3px" } : {}) }} />
                    <div style={{ height:3, background:t.accent_color || C.teal, borderRadius:2, width:"35%", ...(t.header_style === "centered" ? { margin:"0 auto" } : {}) }} />
                  </div>
                )}
                {[70, 90, 80, 60, 85].map((w, i) => (
                  <div key={i} style={{ height:2, background:"#E2E8F0", borderRadius:1, marginBottom:2, width:`${w}%` }} />
                ))}
              </div>
            </div>
            <div style={{ padding:"12px 14px" }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:3 }}>{t.name}</div>
              <div style={{ fontSize:11, color:C.textMuted, marginBottom:8 }}>{t.description}</div>
              <div style={{ display:"flex", gap:6, justifyContent:"center", flexWrap:"wrap" }}>
                {t.tier === "free" ? <Badge color="teal">Free</Badge> : <Badge color="gold">⭐ {t.tier === "premium" ? "Pro" : "Career+"}</Badge>}
                {t.ats_friendly && <Badge color="green">ATS</Badge>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

