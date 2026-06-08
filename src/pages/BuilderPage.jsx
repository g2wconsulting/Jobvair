import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import { C, DEFAULT_SECTIONS, EMPTY_USER, FONT_PRESETS, HEADER_LAYOUTS } from "../constants/appConstants.js";
import { Badge, Btn, Card, CheckGroup, Input, SectionTitle, Select, Toggle } from "../components/ui.jsx";
import { edgeFetch } from "../lib/edgeFetch.js";

function ResumeDocument({ contactFields, sections, tmpl, style = {} }) {
  const visible = [...sections]
    .filter(s => s.is_visible && s.section_type !== "name")
    .sort((a, b) => a.display_order - b.display_order);

  const margins = { tight: "24px 28px", normal: "32px 40px", wide: "40px 56px" }[tmpl.page_margin] || "32px 40px";
  const sectionGap = { compact: 12, normal: 18, spacious: 26 }[tmpl.section_spacing] || 18;
  const fontSize = tmpl.base_font_size || 13;

  // Heading style renderer
  const SectionHeading = ({ label }) => {
    const base = { margin: `0 0 8px`, fontSize: fontSize - 1, fontWeight: 700, color: tmpl.accent_color, textTransform: "uppercase", letterSpacing: "0.08em" };
    if (tmpl.heading_style === "underlined") return <h2 style={{ ...base, textTransform:"none", fontSize: fontSize + 1, borderBottom: `2px solid ${tmpl.accent_color}`, paddingBottom: 4 }}>{label}</h2>;
    if (tmpl.heading_style === "accent_bar") return (
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <div style={{ width:4, height:16, background:tmpl.accent_color, borderRadius:2 }} />
        <h2 style={{ ...base, margin:0 }}>{label}</h2>
      </div>
    );
    if (tmpl.heading_style === "minimal") return <h2 style={{ ...base, color:"#374151", fontWeight:600, letterSpacing:"0.04em" }}>{label}</h2>;
    return <h2 style={base}>{label}</h2>; // uppercase default
  };

  // Header styles
  const renderHeader = () => {
    const name = contactFields.name || "Your Name";
    const headline = contactFields.headline || "";
    const contact = [contactFields.email, contactFields.phone, contactFields.location].filter(Boolean).join(" · ");
    const links = [contactFields.linkedin, contactFields.github, contactFields.website].filter(Boolean).join(" · ");

    if (tmpl.header_style === "bold_banner") return (
      <div style={{ background: tmpl.accent_color, color:"#fff", padding:"20px 24px", margin: `-${margins.split(" ")[0]} -${margins.split(" ")[1]} 20px`, borderRadius:"4px 4px 0 0" }}>
        <div style={{ fontSize: fontSize + 14, fontWeight:800, letterSpacing:"-0.02em" }}>{name}</div>
        {headline && <div style={{ fontSize: fontSize + 1, opacity:0.9, marginTop:4 }}>{headline}</div>}
        <div style={{ fontSize: fontSize - 1, opacity:0.8, marginTop:6 }}>{contact}</div>
        {links && <div style={{ fontSize: fontSize - 2, opacity:0.7, marginTop:3 }}>{links}</div>}
      </div>
    );

    if (tmpl.header_style === "centered") return (
      <div style={{ textAlign:"center", paddingBottom:16, marginBottom:16, borderBottom:`2px solid ${tmpl.accent_color}` }}>
        <div style={{ fontSize: fontSize + 14, fontWeight:800, color:"#0F172A", letterSpacing:"-0.02em" }}>{name}</div>
        {headline && <div style={{ fontSize: fontSize + 1, color:tmpl.accent_color, fontWeight:600, marginTop:4 }}>{headline}</div>}
        <div style={{ fontSize: fontSize - 1, color:"#64748B", marginTop:6 }}>{contact}</div>
        {links && <div style={{ fontSize: fontSize - 2, color:"#94A3B8", marginTop:3 }}>{links}</div>}
      </div>
    );

    // default left / simple
    return (
      <div style={{ paddingBottom:14, marginBottom:14, borderBottom:`3px solid ${tmpl.accent_color}` }}>
        <div style={{ fontSize: fontSize + 13, fontWeight:800, color:"#0F172A", letterSpacing:"-0.02em" }}>{name}</div>
        {headline && <div style={{ fontSize: fontSize + 1, color:tmpl.accent_color, fontWeight:600, marginTop:3 }}>{headline}</div>}
        <div style={{ fontSize: fontSize - 1, color:"#64748B", marginTop:5 }}>{contact}</div>
        {links && <div style={{ fontSize: fontSize - 2, color:"#94A3B8", marginTop:3 }}>{links}</div>}
      </div>
    );
  };

  return (
    <div style={{
      background:"#fff", fontFamily: tmpl.font_family || "DM Sans, sans-serif",
      fontSize: fontSize, color:"#1E293B", lineHeight:1.6,
      padding: margins, boxShadow:"0 4px 32px rgba(0,0,0,0.12)",
      width:"100%", minHeight:800, boxSizing:"border-box",
      ...style,
    }}>
      {renderHeader()}
      {visible.map(s => (
        <div key={s.section_type || s.id} style={{ marginBottom: sectionGap }}>
          <SectionHeading label={s.label} />
          <div style={{ fontSize, color:"#334155", lineHeight:1.65, whiteSpace:"pre-wrap" }}>
            {s.content?.text || ""}
          </div>
        </div>
      ))}
    </div>
  );
}



export default function BuilderPage({ profileForm, profileSkills, profileWork, profileEdu, user }) {
  const profile = profileForm || EMPTY_USER;
  const skills  = profileSkills || [];
  const work    = profileWork   || [];
  const edu     = profileEdu    || [];
  const isPaid  = user?.subscription !== "free";

  // ── State ─────────────────────────────────────────────────────────────
  const [resumeId,       setResumeId]       = useState(null);
  const [resumeName,     setResumeName]      = useState("My Resume");
  const [sections,       setSections]        = useState(null);
  const [headerConfig,   setHeaderConfig]   = useState(null);
  const [activeToolbarPanel, setActiveToolbarPanel] = useState(null);
  const [jobEntries,     setJobEntries]      = useState([]); // individual job blocks
  const [templates,      setTemplates]       = useState([]);
  const [selectedTmpl,   setSelectedTmpl]    = useState(null);
  const [customFont,     setCustomFont]      = useState(null); // overrides template font
  const [headerLayout,   setHeaderLayout]    = useState(null); // overrides template header_style
  const [activeSection,  setActiveSection]   = useState(null);
  const [activeJobId,    setActiveJobId]     = useState(null);
  const [hoveredBlockId, setHoveredBlockId]  = useState(null);
  const [saveState,      setSaveState]       = useState("idle");
  const [importing,      setImporting]       = useState(false);
  const [importedFile,   setImportedFile]    = useState(null);
  const [parseError,     setParseError]      = useState(null);
  const [dropActive,     setDropActive]      = useState(false);
  const [dragId,         setDragId]          = useState(null);
  const [dragJobId,      setDragJobId]       = useState(null);
  const [sectionDropTargetId, setSectionDropTargetId] = useState(null);
  const [jobDropTargetId, setJobDropTargetId] = useState(null);
  const [previewMode,    setPreviewMode]     = useState(false);
  const [panelOpen,      setPanelOpen]       = useState(true);
  const fileRef    = useRef(null);
  const previewRef = useRef(null);

  // ── Derived template values ────────────────────────────────────────────
  const tmpl = selectedTmpl || { font_family:"DM Sans, sans-serif", accent_color:C.teal, header_style:"left", heading_style:"uppercase", page_margin:"normal", section_spacing:"normal", base_font_size:13 };
  const accent     = tmpl.accent_color || C.teal;
  const fontFamily = customFont || tmpl.font_family || "DM Sans, sans-serif";
  const hdrLayout  = headerLayout || tmpl.header_style || "left";
  const effectiveHdrLayout = hdrLayout === "sidebar" ? "left" : hdrLayout;
  const isHeaderLayoutImplemented = id => id !== "sidebar";
  const fontSize   = tmpl.base_font_size || 13;
  const sGap       = { compact:10, normal:18, spacious:28 }[tmpl.section_spacing] || 18;
  const margins    = tmpl.page_margin === "tight" ? "32px 40px" : tmpl.page_margin === "wide" ? "52px 72px" : "44px 56px";
  const showHeaderPanel = activeToolbarPanel === "header";
  const showTemplates = activeToolbarPanel === "templates";
  const showFonts = activeToolbarPanel === "fonts";
  const showDesign = activeToolbarPanel === "design";
  const openToolbarPanel = panel => setActiveToolbarPanel(panel);
  const closeToolbarPanel = () => setActiveToolbarPanel(null);
  const enterPreviewMode = () => {
    closeToolbarPanel();
    setPreviewMode(true);
  };

  // ── Init ───────────────────────────────────────────────────────────────
  const emptyHeaderConfig = useCallback(() => ({
    name:               "",
    headline:           "",
    email:              "",
    phone:              "",
    location:           "",
    linkedin:           "",
    website:            "",
    github:             "",
    custom_contact_line: "",
    show_headline:      false,
    show_email:         true,
    show_phone:         true,
    show_location:      true,
    show_linkedin:      false,
    show_website:       false,
    show_github:        false,
    show_custom:        false,
    layout:             "left",
  }), []);

  const defaultHeaderConfig = useCallback(() => ({
    ...emptyHeaderConfig(),
    // Content fields are pre-filled from profile for new resumes only.
    name:               profile.name || "",
    email:              profile.email || "",
    phone:              profile.phone || "",
    location:           profile.location || "",
  }), [emptyHeaderConfig, profile]);

  const normalizeHeaderConfig = useCallback((saved = {}) => {
    const base = emptyHeaderConfig();
    const cfg = saved || {};
    return {
      ...base,
      ...cfg,
      headline: cfg.headline ?? base.headline,
      custom_contact_line: cfg.custom_contact_line ?? base.custom_contact_line,
      show_headline: cfg.show_headline ?? base.show_headline,
      show_email: cfg.show_email ?? base.show_email,
      show_phone: cfg.show_phone ?? base.show_phone,
      show_location: cfg.show_location ?? base.show_location,
      show_linkedin: cfg.show_linkedin ?? base.show_linkedin,
      show_website: cfg.show_website ?? base.show_website,
      show_github: cfg.show_github ?? base.show_github,
      show_custom: cfg.show_custom ?? base.show_custom,
    };
  }, [emptyHeaderConfig]);

  const contactFields = normalizeHeaderConfig(headerConfig);

  const buildDefaultSections = useCallback(() => DEFAULT_SECTIONS.map((s, i) => {
    let text = "";
    if (s.section_type === "summary")    text = profile.summary || "";
    if (s.section_type === "skills")     text = skills.map(sk => sk.skill_name).join(", ");
    if (s.section_type === "education")  text = edu.map(e => `${e.degree || ""} — ${e.institution || ""}, ${e.graduation_year || ""}`).join("\n");
    if (s.section_type === "certifications") text = "";
    return { ...s, id: `local_${i}`, resume_id: null, user_id: user?.id, content: { text }, display_order: i };
  }), [profile, skills, edu, user?.id]);

  const buildDefaultJobs = useCallback(() => work.map((w, i) => ({
    id: `local_job_${i}`, user_id: user?.id, resume_id: null,
    job_title: w.job_title || "", company: w.company || "",
    location: w.location || "", start_date: w.start_date || "",
    end_date: w.end_date || "", is_current: w.is_current || false,
    description: w.description || "", bullet_points: [], skills_used: [], achievements: [],
    display_order: i, is_visible: true, source: "profile",
  })), [work, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("resume_templates").select("*").eq("is_active", true).order("sort_order")
      .then(({ data }) => {
        const ts = data || [];
        setTemplates(ts);
        const modern = ts.find(t => t.slug === "modern") || ts[0];
        if (modern) setSelectedTmpl(modern);
      });

    supabase.from("resumes").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1)
      .then(async ({ data }) => {
        const existing = data?.[0];
        if (existing) {
          setResumeId(existing.id);
          setResumeName(existing.name || "My Resume");
          // Load sections
          const { data: secs } = await supabase.from("resume_sections").select("*").eq("resume_id", existing.id).order("display_order");
          if (secs?.length) {
            setSections(secs);
            const nameSection = secs.find(s => s.section_type === "name");
            setHeaderConfig(normalizeHeaderConfig(nameSection?.content));
            // Restore custom font and header layout from layout_config
            const layoutCfg = secs.find(s => s.section_type === "name")?.layout_config_json || {};
            if (layoutCfg.custom_font)   setCustomFont(layoutCfg.custom_font);
            if (layoutCfg.header_layout) setHeaderLayout(layoutCfg.header_layout);
          } else {
            setSections(buildDefaultSections());
            setHeaderConfig(defaultHeaderConfig());
          }
          // Load job entries
          const { data: jobs } = await supabase.from("work_experience_entries").select("*").eq("resume_id", existing.id).order("display_order");
          setJobEntries(jobs?.length ? jobs : buildDefaultJobs());
          // Load template
          if (existing.selected_template_id) {
            const { data: tmplData } = await supabase.from("resume_templates").select("*").eq("id", existing.selected_template_id).single();
            if (tmplData) setSelectedTmpl(tmplData);
          }
        } else {
          setSections(buildDefaultSections());
          setHeaderConfig(defaultHeaderConfig());
          setJobEntries(buildDefaultJobs());
        }
      });
  }, [user?.id]); // eslint-disable-line

  // ── Section drag-and-drop ─────────────────────────────────────────────
  const onDragStart = (e, id) => { setDragId(id); setSectionDropTargetId(null); e.dataTransfer.effectAllowed = "move"; };
  const onDragOver  = (e, targetId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (targetId && targetId !== dragId) setSectionDropTargetId(targetId);
  };
  const onDrop      = (e, targetId) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) { setDragId(null); setSectionDropTargetId(null); return; }
    setSections(ss => {
      const arr = [...ss].sort((a, b) => a.display_order - b.display_order);
      const fi = arr.findIndex(s => (s.id || s.section_type) === dragId);
      const ti = arr.findIndex(s => (s.id || s.section_type) === targetId);
      if (fi < 0 || ti < 0) return arr;
      const r  = [...arr]; const [m] = r.splice(fi, 1); r.splice(ti, 0, m);
      return r.map((s, i) => ({ ...s, display_order: i }));
    });
    setDragId(null);
    setSectionDropTargetId(null);
  };

  // ── Job drag-and-drop (item level) ────────────────────────────────────
  const onJobDragStart = (e, id) => { setDragJobId(id); setJobDropTargetId(null); e.dataTransfer.effectAllowed = "move"; };
  const onJobDragOver  = (e, targetId) => {
    e.preventDefault();
    if (targetId && targetId !== dragJobId) setJobDropTargetId(targetId);
  };
  const onJobDrop      = (e, targetId) => {
    e.preventDefault();
    if (!dragJobId || dragJobId === targetId) { setDragJobId(null); setJobDropTargetId(null); return; }
    setJobEntries(jobs => {
      const arr = [...jobs].sort((a, b) => a.display_order - b.display_order);
      const fi  = arr.findIndex(j => j.id === dragJobId);
      const ti  = arr.findIndex(j => j.id === targetId);
      if (fi < 0 || ti < 0) return arr;
      const r   = [...arr]; const [m] = r.splice(fi, 1); r.splice(ti, 0, m);
      return r.map((j, i) => ({ ...j, display_order: i }));
    });
    setDragJobId(null);
    setJobDropTargetId(null);
  };

  const toggleVisible = (id) => setSections(ss => ss.map(s => (s.id || s.section_type) === id ? { ...s, is_visible: !s.is_visible } : s));
  const setContent    = (id, text) => setSections(ss => ss.map(s => (s.id || s.section_type) === id ? { ...s, content: { ...s.content, text } } : s));

  const addJob = () => {
    const newJob = {
      id: `local_job_${Date.now()}`, user_id: user?.id, resume_id: resumeId,
      job_title:"", company:"", location:"", start_date:"", end_date:"",
      is_current:false, description:"", bullet_points:[], skills_used:[], achievements:[],
      display_order: jobEntries.length, is_visible:true, source:"manual",
    };
    setJobEntries(js => [...js, newJob]);
    setActiveJobId(newJob.id);
    setActiveSection("experience");
  };

  const updateJob = (id, field, value) => setJobEntries(js => js.map(j => j.id === id ? { ...j, [field]: value } : j));
  const deleteJob = (id) => setJobEntries(js => js.filter(j => j.id !== id).map((j, i) => ({ ...j, display_order: i })));
  const dupJob    = (job) => {
    const dup = { ...job, id:`local_job_${Date.now()}`, display_order: jobEntries.length };
    setJobEntries(js => [...js, dup]);
  };

  const addCustomSection = () => {
    const newSec = {
      id: `local_custom_${Date.now()}`, resume_id: resumeId, user_id: user?.id,
      section_type: `custom_${Date.now()}`, label:"Custom Section", icon:"📌",
      is_required:false, is_visible:true, content:{ text:"" }, display_order:(sections?.length || 0),
    };
    setSections(ss => [...(ss || []), newSec]);
    setActiveSection(newSec.id);
  };

  // ── Save ──────────────────────────────────────────────────────────────
  const saveResume = async () => {
    if (!user?.id) return;
    setSaveState("saving");
    try {
      let rid = resumeId;
      const savedHeaderConfig = normalizeHeaderConfig(headerConfig || (!rid ? defaultHeaderConfig() : {}));
      if (rid) {
        await supabase.from("resumes").update({ name:resumeName, updated_at:new Date().toISOString(), selected_template_id:selectedTmpl?.id||null }).eq("id", rid);
      } else {
        const { data } = await supabase.from("resumes").insert({ user_id:user.id, name:resumeName, template:selectedTmpl?.slug||"modern", selected_template_id:selectedTmpl?.id||null, is_primary:false, contact_fields:savedHeaderConfig, sections:[] }).select().single();
        rid = data?.id; setResumeId(rid);
      }
      if (!rid) throw new Error("No resume ID");

      // Save sections (store custom font + header layout in name section layout_config)
      const sourceSections = sections?.length ? sections : buildDefaultSections();
      const sectionsWithHeader = sourceSections.some(s => s.section_type === "name")
        ? sourceSections
        : [
            { ...DEFAULT_SECTIONS[0], id:"local_name", resume_id:rid, user_id:user.id, content:{}, display_order:0 },
            ...sourceSections.map((s, i) => ({ ...s, display_order:i + 1 })),
          ];
      const allSections = sectionsWithHeader.map(s => ({
        resume_id:    rid, user_id:user.id, section_type:s.section_type, label:s.label,
        content:      s.section_type === "name" ? savedHeaderConfig : (s.content || {}),
        display_order:s.display_order, is_visible:s.is_visible, is_required:s.is_required||false,
        layout_config_json: s.section_type === "name" ? { custom_font:customFont, header_layout:headerLayout } : (s.layout_config_json||{}),
      }));
      await supabase.from("resume_sections").delete().eq("resume_id", rid);
      if (allSections.length) await supabase.from("resume_sections").insert(allSections);

      // Save job entries
      await supabase.from("work_experience_entries").delete().eq("resume_id", rid);
      const jobRows = jobEntries.filter(j => j.job_title || j.company).map(j => ({
        user_id:j.user_id||user.id, resume_id:rid, job_title:j.job_title||null,
        company:j.company||null, location:j.location||null,
        start_date:j.start_date||null, end_date:j.end_date||null,
        is_current:j.is_current||false, description:j.description||null,
        bullet_points:j.bullet_points||[], skills_used:j.skills_used||[], achievements:j.achievements||[],
        display_order:j.display_order, is_visible:j.is_visible!==false, source:j.source||"manual",
      }));
      if (jobRows.length) await supabase.from("work_experience_entries").insert(jobRows);

      setSaveState("saved"); setTimeout(() => setSaveState("idle"), 2500);
    } catch (err) {
      console.error("[BuilderPage] save error:", err.message);
      setSaveState("error"); setTimeout(() => setSaveState("idle"), 3000);
    }
  };

  // ── PDF Export ─────────────────────────────────────────────────────────
  const exportPDF = async () => {
    if (!previewRef.current) return;
    if (!window.html2pdf) {
      await new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
        s.onload = res; s.onerror = rej; document.head.appendChild(s);
      });
    }
    window.html2pdf().set({
      margin:[10,10,10,10], filename:`${resumeName.replace(/\s+/g,"_")}.pdf`,
      image:{ type:"jpeg", quality:0.98 },
      html2canvas:{ scale:2, useCORS:true, letterRendering:true },
      jsPDF:{ unit:"mm", format:"a4", orientation:"portrait" },
    }).from(previewRef.current).save();
  };

  // ── File import (parse resume) ─────────────────────────────────────────
  const processFile = async (file) => {
    if (!file || !file.name.match(/\.(pdf|docx|doc|txt)$/i)) { setParseError("Please upload a PDF, DOCX, or plain text file."); return; }
    setImportedFile(file); setImporting(true); setParseError(null);
    const userId = user?.id;
    const safeFile = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uploadPath = `${userId}/${Date.now()}_${safeFile}`;
    const storagePath = `resumes/${uploadPath}`;
    try {
      const { error: uploadError } = await supabase.storage.from("resumes").upload(uploadPath, file, { contentType:file.type||"application/octet-stream", upsert:false });
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
      const { data:rowData, error:rowError } = await supabase.from("parsed_resumes").insert({ user_id:userId, storage_path:storagePath, original_filename:file.name, parse_status:"processing" }).select().single();
      if (rowError) throw new Error(`DB row failed: ${rowError.message}`);
      const parsed = await edgeFetch("parse-resume", { user_id:userId, storage_path:storagePath, original_filename:file.name, parsed_resume_id:rowData.id });

      // Update header config from parsed data (only fill empty fields)
      setHeaderConfig(f => {
        const current = normalizeHeaderConfig(f);
        return {
          ...current,
          name:     current.name     || parsed.full_name || "",
          email:    current.email    || parsed.email     || "",
          phone:    current.phone    || parsed.phone     || "",
          location: current.location || parsed.location  || "",
          show_phone:    !!(current.phone    || parsed.phone),
          show_location: !!(current.location || parsed.location),
        };
      });

      // Update text sections
      setSections(ss => ss.map(s => {
        if (s.section_type === "summary"        && parsed.summary)                  return { ...s, content:{ text:parsed.summary } };
        if (s.section_type === "skills"         && parsed.skills?.length)           return { ...s, content:{ text:parsed.skills.map(sk => sk.skill_name||sk.name).filter(Boolean).join(", ") } };
        if (s.section_type === "education"      && parsed.education?.length)        return { ...s, content:{ text:parsed.education.map(e => `${e.degree||""} — ${e.institution||""}, ${e.graduation_year||""}`).join("\n") } };
        if (s.section_type === "certifications" && parsed.certifications?.length)   return { ...s, content:{ text:Array.isArray(parsed.certifications) ? parsed.certifications.map(c => typeof c==="string"?c:c.name).join("\n") : "" } };
        return s;
      }));

      // Convert parsed work experience into individual job blocks
      if (parsed.work_experience?.length) {
        const parsedJobs = parsed.work_experience.map((w, i) => ({
          id:`parsed_job_${Date.now()}_${i}`, user_id:userId, resume_id:resumeId,
          job_title:w.job_title||"", company:w.company||"", location:w.location||"",
          start_date:w.start_date||"", end_date:w.end_date||"", is_current:w.is_current||false,
          description:w.description||"", bullet_points:[], skills_used:[], achievements:[],
          display_order:i, is_visible:true, source:"resume_parsed",
        }));
        setJobEntries(parsedJobs);
      }
    } catch (err) { setParseError(err.message||"Parse failed."); }
    setImporting(false);
  };

  const sorted = sections ? [...sections].sort((a, b) => a.display_order - b.display_order) : [];
  const sortedJobs = [...jobEntries].sort((a, b) => a.display_order - b.display_order);
  const hc = normalizeHeaderConfig(headerConfig); // shorthand for header config

  // ── Section heading (respects template) ───────────────────────────────
  const SectionHeading = ({ label }) => {
    if (tmpl.heading_style === "accent_bar") return (
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <div style={{ width:4, height:16, background:accent, borderRadius:2, flexShrink:0 }} />
        <div style={{ fontSize:fontSize-1, fontWeight:700, color:accent, textTransform:"uppercase", letterSpacing:"0.08em" }}>{label}</div>
      </div>
    );
    if (tmpl.heading_style === "underlined") return (
      <div style={{ fontSize:fontSize+1, fontWeight:700, color:"#0F172A", borderBottom:`2px solid ${accent}`, paddingBottom:4, marginBottom:8 }}>{label}</div>
    );
    if (tmpl.heading_style === "minimal") return (
      <div style={{ fontSize:fontSize-1, fontWeight:600, color:"#64748B", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>{label}</div>
    );
    return <div style={{ fontSize:fontSize-1, fontWeight:700, color:accent, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>{label}</div>;
  };

  // ── Resume header renderer ─────────────────────────────────────────────
  // Reads headerConfig visibility flags; editing=true shows inline inputs
  const setHC = (field, val) => setHeaderConfig(h => ({ ...normalizeHeaderConfig(h), [field]: val }));
  const isBanner = effectiveHdrLayout === "bold_banner";
  const textColor = isBanner ? "#fff" : "#0F172A";
  const subColor  = isBanner ? "rgba(255,255,255,0.85)" : accent;
  const contactColor = isBanner ? "rgba(255,255,255,0.75)" : "#64748B";
  const linkColor    = isBanner ? "rgba(255,255,255,0.6)"  : "#94A3B8";
  const inputStyle = (extra={}) => ({ background:"transparent", border:"none", outline:"none", fontFamily, ...extra });

  const renderResumeHeader = (editing) => {
    const nameEl = editing
      ? <input value={hc.name||""} onChange={e=>setHC("name",e.target.value)} placeholder="Your Name" style={inputStyle({ fontSize:fontSize+14, fontWeight:800, letterSpacing:"-0.02em", color:textColor, width:"100%", display:"block" })} />
      : <div style={{ fontSize:fontSize+14, fontWeight:800, letterSpacing:"-0.02em", color:textColor }}>{hc.name||"Your Name"}</div>;

    const headlineEl = (hc.show_headline && (editing || hc.headline)) && (
      editing
        ? <input value={hc.headline||""} onChange={e=>setHC("headline",e.target.value)} placeholder="Professional Headline (optional)" style={inputStyle({ fontSize:fontSize+1, fontWeight:600, color:subColor, width:"100%", display:"block", marginTop:4 })} />
        : hc.headline ? <div style={{ fontSize:fontSize+1, fontWeight:600, color:subColor, marginTop:4 }}>{hc.headline}</div> : null
    );

    // Build contact line — only visible fields
    const contactItems = [
      hc.show_email    && hc.email,
      hc.show_phone    && hc.phone,
      hc.show_location && hc.location,
    ].filter(Boolean);
    const linkItems = [
      hc.show_linkedin && hc.linkedin,
      hc.show_website  && hc.website,
      hc.show_github   && hc.github,
      hc.show_custom   && hc.custom_contact_line,
    ].filter(Boolean);

    const contactLineEl = editing ? (
      <div style={{ display:"flex", gap:10, marginTop:5, flexWrap:"wrap" }}>
        {hc.show_email    && <input value={hc.email||""}    onChange={e=>setHC("email",e.target.value)}    placeholder="email@example.com" style={inputStyle({ fontSize:fontSize-1, color:contactColor, minWidth:140 })} />}
        {hc.show_phone    && <input value={hc.phone||""}    onChange={e=>setHC("phone",e.target.value)}    placeholder="Phone"            style={inputStyle({ fontSize:fontSize-1, color:contactColor, minWidth:110 })} />}
        {hc.show_location && <input value={hc.location||""} onChange={e=>setHC("location",e.target.value)} placeholder="City, State"      style={inputStyle({ fontSize:fontSize-1, color:contactColor, minWidth:110 })} />}
        {hc.show_linkedin && <input value={hc.linkedin||""} onChange={e=>setHC("linkedin",e.target.value)} placeholder="linkedin.com/in/…" style={inputStyle({ fontSize:fontSize-2, color:linkColor, minWidth:140 })} />}
        {hc.show_website  && <input value={hc.website||""}  onChange={e=>setHC("website",e.target.value)}  placeholder="yoursite.com"     style={inputStyle({ fontSize:fontSize-2, color:linkColor, minWidth:120 })} />}
        {hc.show_github   && <input value={hc.github||""}   onChange={e=>setHC("github",e.target.value)}   placeholder="github.com/…"     style={inputStyle({ fontSize:fontSize-2, color:linkColor, minWidth:120 })} />}
        {hc.show_custom   && <input value={hc.custom_contact_line||""} onChange={e=>setHC("custom_contact_line",e.target.value)} placeholder="Custom contact info" style={inputStyle({ fontSize:fontSize-2, color:linkColor, minWidth:140 })} />}
      </div>
    ) : (
      <>
        {contactItems.length > 0 && <div style={{ fontSize:fontSize-1, color:contactColor, marginTop:5 }}>{contactItems.join(" · ")}</div>}
        {linkItems.length   > 0 && <div style={{ fontSize:fontSize-2, color:linkColor, marginTop:2 }}>{linkItems.join(" · ")}</div>}
      </>
    );

    const align = effectiveHdrLayout === "centered" ? "center" : "left";
    const inner = <>{nameEl}{headlineEl}{contactLineEl}</>;
    const [mTop, mSide] = margins.split(" ");
    const bannerMargin = `-${mTop} -${mSide} 20px`;

    if (effectiveHdrLayout === "bold_banner") return (
      <div style={{ background:accent, padding:"20px 24px", margin:bannerMargin, borderRadius:"4px 4px 0 0", cursor:editing?"default":"pointer" }}
        onClick={!editing ? ()=>openToolbarPanel("header") : undefined}>
        {inner}
      </div>
    );

    return (
      <div style={{ textAlign:align, paddingBottom:14, marginBottom:14, borderBottom:`3px solid ${accent}`, cursor:editing?"default":"pointer" }}
        onClick={!editing ? ()=>openToolbarPanel("header") : undefined}>
        {inner}
      </div>
    );
  };

  // ── Job block renderer ─────────────────────────────────────────────────
  const JobBlock = ({ job, editing }) => {
    const isActiveJob = activeJobId === job.id && activeSection === "experience";
    const isDraggingJob = dragJobId === job.id;
    const isDropTarget = dragJobId && dragJobId !== job.id && jobDropTargetId === job.id;
    const dateStr = job.start_date ? `${job.start_date} – ${job.is_current ? "Present" : (job.end_date||"")}` : "";
    if (!editing) return (
      <div style={{ marginBottom:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
          <div style={{ fontWeight:700, fontSize:fontSize, color:"#0F172A" }}>{job.job_title || "Job Title"}</div>
          <div style={{ fontSize:fontSize-2, color:"#64748B" }}>{dateStr}</div>
        </div>
        <div style={{ fontSize:fontSize-1, color:accent, fontWeight:600 }}>{job.company}{job.location ? ` · ${job.location}` : ""}</div>
        {job.description && <div style={{ fontSize:fontSize-1, color:"#334155", marginTop:4, whiteSpace:"pre-wrap", lineHeight:1.6 }}>{job.description}</div>}
      </div>
    );
    return (
      <div
        onDragOver={e => onJobDragOver(e, job.id)}
        onDrop={e => onJobDrop(e, job.id)}
        style={{
          marginBottom:10, padding:"10px 10px 10px 38px", borderRadius:8, position:"relative",
          border:`1px solid ${isActiveJob ? accent : isDropTarget ? accent : isDraggingJob ? accent+"88" : C.border}`,
          background: isActiveJob ? `${accent}06` : isDropTarget ? `${accent}08` : isDraggingJob ? `${accent}11` : "#FAFAFA",
          opacity: isDraggingJob ? 0.4 : 1, cursor:"text", transition:"border-color 0.15s, background 0.15s",
        }}
        onMouseEnter={e => { if(!isActiveJob) e.currentTarget.style.borderColor = accent+"66"; }}
        onMouseLeave={e => { if(!isActiveJob) e.currentTarget.style.borderColor = C.border; }}
        onClick={() => { setActiveJobId(job.id); setActiveSection("experience"); }}
      >
        {/* Drop indicator */}
        {isDropTarget && (
          <div style={{ position:"absolute", top:-4, left:6, right:6, height:4, background:accent, borderRadius:999, boxShadow:`0 0 0 3px ${accent}22` }} />
        )}

        {/* Dot-grid drag handle */}
        <div
          draggable
          onDragStart={e => onJobDragStart(e, job.id)}
          onDragEnd={() => { setDragJobId(null); setJobDropTargetId(null); }}
          onClick={e => e.stopPropagation()}
          style={{ position:"absolute", left:7, top:"50%", transform:"translateY(-50%)", cursor:isDraggingJob?"grabbing":"grab", width:22, minHeight:44, border:`1px solid ${isDraggingJob||isDropTarget?accent:C.border}`, borderRadius:7, background:isDraggingJob||isDropTarget?`${accent}10`:"#fff", userSelect:"none", display:"flex", alignItems:"center", justifyContent:"center" }}
          title="Drag to reorder jobs"
        >
          <div style={{ color:isDraggingJob||isDropTarget?accent:"#64748B", fontSize:16, lineHeight:1, fontWeight:800 }}>⋮⋮</div>
        </div>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:isActiveJob?10:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, minWidth:0 }}>
            {isActiveJob
              ? <input value={job.job_title||""} onChange={e=>updateJob(job.id,"job_title",e.target.value)} placeholder="Job Title" style={{ fontWeight:700, fontSize:fontSize, border:"none", outline:"none", fontFamily, background:"transparent", color:"#0F172A", flex:1, minWidth:0 }} />
              : <div style={{ fontWeight:700, fontSize:fontSize, color:"#0F172A", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{job.job_title||"(no title)"}</div>
            }
            {isActiveJob
              ? <input value={job.company||""} onChange={e=>updateJob(job.id,"company",e.target.value)} placeholder="Company" style={{ fontSize:fontSize-1, color:accent, fontWeight:600, border:"none", outline:"none", fontFamily, background:"transparent", width:130 }} />
              : <div style={{ fontSize:fontSize-1, color:accent, fontWeight:600, flexShrink:0 }}>{job.company}</div>
            }
          </div>
          <div style={{ display:"flex", gap:4, flexShrink:0, marginLeft:8 }}>
            <button onClick={e=>{e.stopPropagation();dupJob(job);}} title="Duplicate job" style={{ background:"#F1F5F9",border:`1px solid ${C.border}`,cursor:"pointer",fontSize:11,color:C.slate,padding:"2px 6px",borderRadius:4 }}>⎘ Dup</button>
            <button onClick={e=>{e.stopPropagation();deleteJob(job.id);}} title="Delete job" style={{ background:"#FEF2F2",border:`1px solid #FECACA`,cursor:"pointer",fontSize:11,color:C.danger,padding:"2px 6px",borderRadius:4 }}>✕ Del</button>
          </div>
        </div>
        {isActiveJob && (
          <div style={{ display:"grid", gap:8 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr auto", gap:8, alignItems:"center" }}>
              <input value={job.location||""} onChange={e=>updateJob(job.id,"location",e.target.value)} placeholder="Location" style={{ fontSize:12, padding:"4px 8px", border:`1px solid ${C.border}`, borderRadius:6, fontFamily, outline:"none" }} />
              <input type="date" value={job.start_date||""} onChange={e=>updateJob(job.id,"start_date",e.target.value)} style={{ fontSize:12, padding:"4px 8px", border:`1px solid ${C.border}`, borderRadius:6, fontFamily, outline:"none" }} />
              {job.is_current ? <div style={{ fontSize:12, color:C.success, padding:"4px 8px" }}>Present</div> : <input type="date" value={job.end_date||""} onChange={e=>updateJob(job.id,"end_date",e.target.value)} style={{ fontSize:12, padding:"4px 8px", border:`1px solid ${C.border}`, borderRadius:6, fontFamily, outline:"none" }} />}
              <label style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, cursor:"pointer" }}>
                <input type="checkbox" checked={job.is_current||false} onChange={e=>updateJob(job.id,"is_current",e.target.checked)} style={{ accentColor:accent }} />Current
              </label>
            </div>
            <textarea value={job.description||""} onChange={e=>updateJob(job.id,"description",e.target.value)} placeholder="Describe your role, responsibilities, and achievements…" rows={4} style={{ width:"100%", padding:"6px 8px", border:`1px solid ${C.border}`, borderRadius:6, fontSize:fontSize-1, fontFamily, outline:"none", resize:"vertical", lineHeight:1.6, boxSizing:"border-box" }} />
          </div>
        )}
        {!isActiveJob && job.description && (
          <div style={{ fontSize:fontSize-1, color:"#334155", marginTop:4, lineHeight:1.6, whiteSpace:"pre-wrap" }}>{job.description.slice(0,120)}{job.description.length>120?"…":""}</div>
        )}
      </div>
    );
  };

  // ── PREVIEW MODE ─────────────────────────────────────────────────────
  if (previewMode) return (
    <div>
      <div style={{ position:"sticky", top:0, zIndex:10, background:"#1E293B", padding:"10px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, borderRadius:10 }}>
        <div style={{ fontSize:13, fontWeight:600, color:"#94A3B8" }}>Preview — {resumeName}</div>
        <div style={{ display:"flex", gap:8 }}>
          <Btn small onClick={exportPDF} variant="secondary">⬇ Export PDF</Btn>
          <Btn small onClick={() => setPreviewMode(false)}>← Back to Editor</Btn>
        </div>
      </div>
      <div style={{ display:"flex", justifyContent:"center", background:"#E2E8F0", padding:"32px 24px", borderRadius:12, minHeight:800 }}>
        <div ref={previewRef} style={{ width:900, maxWidth:"calc(100vw - 80px)", background:"#fff", boxShadow:"0 8px 48px rgba(0,0,0,0.18)", fontFamily, fontSize, color:"#1E293B", padding:margins, boxSizing:"border-box", lineHeight:1.6 }}>
          {renderResumeHeader(false)}
          {sorted.filter(s => s.is_visible && s.section_type !== "name").map(s => (
            <div key={s.section_type||s.id} style={{ marginBottom:sGap }}>
              <SectionHeading label={s.label} />
              {s.section_type === "experience"
                ? <div>{sortedJobs.filter(j=>j.is_visible!==false).map(j => <JobBlock key={j.id} job={j} editing={false} />)}</div>
                : <div style={{ fontSize, color:"#334155", lineHeight:1.65, whiteSpace:"pre-wrap" }}>{s.content?.text||""}</div>
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── EDIT MODE — 3-panel Canva-style layout ───────────────────────────
  const activeSec = sorted.find(s => (s.id||s.section_type) === activeSection);

  // Right panel — context-aware
  const renderRightPanel = () => {
    if (showHeaderPanel || activeSection === "name") return (
      <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
        <div style={{ padding:"16px 16px 12px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:C.navy }}>Header</div>
            <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>Edit resume-specific name, title, and contact info</div>
          </div>
          <Btn small variant="ghost" onClick={closeToolbarPanel}>Done</Btn>
        </div>
        <div style={{ overflowY:"auto", flex:1, padding:16, display:"flex", flexDirection:"column", gap:10 }}>
          {[
            ["name","Full Name","text"],["headline","Optional Headline / Title","text"],["email","Email","email"],
            ["phone","Phone","tel"],["location","Location","text"],["linkedin","LinkedIn URL","text"],
            ["website","Website","text"],["github","GitHub","text"],["custom_contact_line","Custom Line","text"],
          ].map(([field,label,type]) => (
            <div key={field}>
              <div style={{ fontSize:11, color:C.textMuted, marginBottom:3, fontWeight:600 }}>{label}</div>
              <input type={type} value={hc[field]||""} onChange={e=>setHC(field,e.target.value)} placeholder={label}
                style={{ width:"100%", padding:"7px 9px", border:`1px solid ${C.border}`, borderRadius:6, fontSize:12, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
            </div>
          ))}
          <div style={{ paddingTop:12, borderTop:`1px solid ${C.border}` }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.navy, marginBottom:8 }}>Show / Hide</div>
            {[
              ["show_headline","Optional Headline / Title"],["show_email","Email"],["show_phone","Phone"],
              ["show_location","Location"],["show_linkedin","LinkedIn"],["show_website","Website"],
              ["show_github","GitHub"],["show_custom","Custom Line"],
            ].map(([field,label]) => (
              <label key={field} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 0", cursor:"pointer" }}>
                <input type="checkbox" checked={hc[field]||false} onChange={e=>setHC(field,e.target.checked)} style={{ accentColor:C.teal, width:14, height:14 }} />
                <span style={{ fontSize:12, color:hc[field]?C.tealDark:C.slate }}>{label}</span>
              </label>
            ))}
          </div>
          <div style={{ paddingTop:12, borderTop:`1px solid ${C.border}` }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.navy, marginBottom:8 }}>Header Layout</div>
            {HEADER_LAYOUTS.map(h => {
              const locked = h.tier==="premium" && !isPaid;
              const implemented = isHeaderLayoutImplemented(h.id);
              const disabled = locked || !implemented;
              const isActive = hdrLayout===h.id;
              return (
                <div key={h.id} onClick={()=>{ if(!disabled) setHeaderLayout(h.id); }}
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", borderRadius:7, marginBottom:4, cursor:disabled?"not-allowed":"pointer", border:`1px solid ${isActive?C.teal:C.border}`, background:isActive?C.tealLight:"transparent", opacity:disabled?0.55:1 }}>
                  <span style={{ fontSize:16 }}>{h.icon}</span>
                  <span style={{ fontSize:12, flex:1, color:C.navy }}>{h.label}</span>
                  {!implemented && <span style={{ fontSize:10, color:C.textMuted }}>Coming soon</span>}
                  {locked && <span style={{ fontSize:10, color:C.gold }}>Pro</span>}
                  {isActive && <span style={{ fontSize:11, color:C.teal, fontWeight:700 }}>check</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );

    if (activeSection === "experience") return (
      <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
        <div style={{ padding:"16px 16px 12px", borderBottom:`1px solid ${C.border}` }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.navy }}>Work Experience</div>
          <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>Drag jobs to reorder</div>
        </div>
        <div style={{ padding:16 }}>
          <button onClick={addJob} style={{ width:"100%", padding:"9px", background:C.teal, border:"none", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:700, color:"#fff", fontFamily:"inherit", marginBottom:12 }}>Add Job</button>
          {sortedJobs.map(j => (
            <div key={j.id} onClick={()=>setActiveJobId(j.id)}
              style={{ padding:"8px 10px", borderRadius:7, border:`1px solid ${activeJobId===j.id?C.teal:C.border}`, background:activeJobId===j.id?C.tealLight:"transparent", cursor:"pointer", marginBottom:6 }}>
              <div style={{ fontSize:12, fontWeight:600, color:C.navy }}>{j.job_title||"(no title)"}</div>
              <div style={{ fontSize:11, color:C.textMuted }}>{j.company||""}</div>
            </div>
          ))}
        </div>
      </div>
    );

    if (activeSec) return (
      <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
        <div style={{ padding:"16px 16px 12px", borderBottom:`1px solid ${C.border}` }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.navy }}>{activeSec.label}</div>
          <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>Edit this resume block</div>
        </div>
        <div style={{ overflowY:"auto", flex:1, padding:16, display:"flex", flexDirection:"column", gap:12 }}>
          <div>
            <div style={{ fontSize:11, color:C.textMuted, marginBottom:5, fontWeight:700 }}>Content</div>
            <textarea
              value={activeSec.content?.text || ""}
              onChange={e=>setContent(activeSec.id || activeSec.section_type, e.target.value)}
              rows={10}
              placeholder={`Enter your ${activeSec.label.toLowerCase()}...`}
              style={{ width:"100%", resize:"vertical", minHeight:160, padding:"9px 10px", border:`1px solid ${C.border}`, borderRadius:8, fontSize:12, lineHeight:1.55, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}
            />
          </div>
          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:activeSec.is_required?"not-allowed":"pointer", opacity:activeSec.is_required?0.5:1 }}>
            <input type="checkbox" checked={activeSec.is_visible!==false} disabled={activeSec.is_required} onChange={()=>toggleVisible(activeSec.id || activeSec.section_type)} style={{ accentColor:C.teal, width:14, height:14 }} />
            <span style={{ fontSize:12, color:C.slate }}>Show section on resume</span>
          </label>
          <div style={{ padding:"10px 11px", background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, fontSize:11, color:C.textMuted, lineHeight:1.5 }}>
            Reorder this block from the canvas or the Layers panel on the left.
          </div>
        </div>
      </div>
    );

    // Default document inspector
    return (
      <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
        <div style={{ padding:"16px 16px 12px", borderBottom:`1px solid ${C.border}` }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.navy }}>Document Settings</div>
          <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>Select a resume block to edit its properties.</div>
        </div>
        <div style={{ overflowY:"auto", flex:1, padding:16, display:"flex", flexDirection:"column", gap:12 }}>
          {[
            ["Template", selectedTmpl?.name || tmpl.name || "Modern", () => openToolbarPanel("templates")],
            ["Font", FONT_PRESETS.find(f => f.value === fontFamily)?.label || fontFamily.split(",")[0], () => openToolbarPanel("fonts")],
            ["Header Layout", HEADER_LAYOUTS.find(h => h.id === hdrLayout)?.label || "Left Aligned", () => openToolbarPanel("design")],
            ["Section Spacing", tmpl.section_spacing || "normal", null],
            ["Page Margins", tmpl.page_margin || "normal", null],
          ].map(([label, value, action]) => (
            <div key={label} style={{ border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 11px", background:C.bg }}>
              <div style={{ fontSize:10, color:C.textMuted, fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>{label}</div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ flex:1, fontSize:12, color:C.navy, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{value}</div>
                {action && <button onClick={action} style={{ border:`1px solid ${C.border}`, background:"#fff", borderRadius:6, padding:"3px 7px", fontSize:11, color:C.slate, cursor:"pointer", fontFamily:"inherit" }}>Edit</button>}
              </div>
            </div>
          ))}
          <div style={{ padding:"10px 11px", background:C.tealLight, border:`1px solid ${C.teal}33`, borderRadius:8, fontSize:11, color:C.tealDark, lineHeight:1.5 }}>
            Use the Layers panel on the left to add, hide, and reorder sections. Click a block on the resume to edit it here.
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="jobvair-builder-shell" style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 60px)", overflow:"hidden", margin:"-28px -32px", fontFamily:"inherit", width:"calc(100% + 64px)", maxWidth:"none", textAlign:"left" }}>

      {/* Top bar */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 20px", background:"#fff", borderBottom:`1px solid ${C.border}`, flexShrink:0, gap:8, flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <input value={resumeName} onChange={e=>setResumeName(e.target.value)} style={{ fontSize:15, fontWeight:700, color:C.navy, border:"none", background:"transparent", outline:"none", fontFamily:"inherit", borderBottom:`2px solid ${C.border}`, padding:"2px 0", minWidth:160 }} />
          {saveState==="saved" && <span style={{ fontSize:11, color:C.success, fontWeight:600 }}>Saved</span>}
          {saveState==="error" && <span style={{ fontSize:11, color:C.danger }}>Save failed</span>}
        </div>
        <div style={{ display:"flex", gap:4, alignItems:"center" }}>
          {[
            ["Template", () => openToolbarPanel("templates"), showTemplates],
            ["Header",   () => { setActiveSection("name"); openToolbarPanel("header"); }, showHeaderPanel],
            ["Font",     () => openToolbarPanel("fonts"), showFonts],
            ["Design",   () => openToolbarPanel("design"), showDesign],
          ].map(([label, handler, active]) => (
            <button key={label} onClick={handler} style={{ padding:"6px 12px", borderRadius:7, border:`1px solid ${active?C.teal:C.border}`, background:active?C.tealLight:"transparent", fontSize:12, fontWeight:600, color:active?C.tealDark:C.slate, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}>{label}</button>
          ))}
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <Btn small variant="secondary" onClick={enterPreviewMode}>Preview</Btn>
          <Btn small variant="secondary" onClick={exportPDF}>PDF</Btn>
          <Btn small disabled={saveState==="saving"} onClick={saveResume}>{saveState==="saving"?"Saving...":"Save"}</Btn>
        </div>
      </div>

      {/* Design panels */}
      {(showTemplates || showFonts || showDesign) && (
        <div style={{ background:C.bgCard, borderBottom:`1px solid ${C.border}`, padding:"14px 20px", flexShrink:0 }}>
          {showTemplates && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.navy }}>Choose Template</div>
                <Btn small variant="ghost" onClick={closeToolbarPanel}>Done</Btn>
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {templates.map(t => (
                  <div key={t.id} onClick={()=>setSelectedTmpl(t)} style={{ padding:"8px 12px", borderRadius:8, cursor:"pointer", transition:"all 0.15s", border:`2px solid ${selectedTmpl?.id===t.id?t.accent_color||C.teal:C.border}`, borderLeft:`4px solid ${t.accent_color||C.teal}`, background:selectedTmpl?.id===t.id?`${t.accent_color||C.teal}11`:C.bg }}>
                    <div style={{ fontSize:12, fontWeight:700, color:C.navy }}>{t.name}</div>
                    <div style={{ fontSize:10, color:C.textMuted, marginTop:1 }}>{t.tier==="free"?"Free":"Pro"}</div>
                    {selectedTmpl?.id===t.id && <div style={{ fontSize:10, color:t.accent_color||C.teal, fontWeight:700, marginTop:2 }}>Active</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {showFonts && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.navy }}>Font</div>
                <Btn small variant="ghost" onClick={closeToolbarPanel}>Done</Btn>
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {FONT_PRESETS.map(f => (
                  <div key={f.value} onClick={()=>setCustomFont(f.value)} style={{ padding:"6px 12px", borderRadius:7, cursor:"pointer", transition:"all 0.15s", border:`2px solid ${(customFont||tmpl.font_family)===f.value?C.teal:C.border}`, background:(customFont||tmpl.font_family)===f.value?C.tealLight:C.bg }}>
                    <div style={{ fontSize:13, fontFamily:f.value, fontWeight:600, color:C.navy }}>{f.label}</div>
                    <div style={{ fontSize:10, color:C.textMuted }}>{f.category}</div>
                  </div>
                ))}
                {customFont && <button onClick={()=>setCustomFont(null)} style={{ padding:"6px 12px", borderRadius:7, border:`1px solid ${C.border}`, background:"transparent", fontSize:11, color:C.textMuted, cursor:"pointer", fontFamily:"inherit" }}>Reset</button>}
              </div>
            </div>
          )}
          {showDesign && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.navy }}>Header Layout</div>
                <Btn small variant="ghost" onClick={closeToolbarPanel}>Done</Btn>
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {HEADER_LAYOUTS.map(h => {
                  const locked = h.tier==="premium" && !isPaid;
                  const implemented = isHeaderLayoutImplemented(h.id);
                  const disabled = locked || !implemented;
                  const isActive = hdrLayout===h.id;
                  return (
                    <div key={h.id} onClick={()=>{ if(!disabled) setHeaderLayout(h.id); }} style={{ padding:"8px 14px", borderRadius:8, cursor:disabled?"not-allowed":"pointer", transition:"all 0.15s", border:`2px solid ${isActive?C.teal:C.border}`, background:isActive?C.tealLight:disabled?"#F8FAFC":C.bg, opacity:disabled?0.6:1 }}>
                      <div style={{ fontSize:18, marginBottom:3 }}>{h.icon}</div>
                      <div style={{ fontSize:12, fontWeight:600, color:C.navy }}>{h.label}</div>
                      {!implemented && <div style={{ fontSize:10, color:C.textMuted, marginTop:2 }}>Coming soon</div>}
                      {locked && <div style={{ fontSize:10, color:C.gold, marginTop:2 }}>Pro</div>}
                      {isActive && <div style={{ fontSize:10, color:C.teal, fontWeight:700, marginTop:2 }}>Active</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3-panel area */}
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* Left sidebar */}
        <div style={{ width:184, flexShrink:0, background:"#fff", borderRight:`1px solid ${C.border}`, overflowY:"auto", display:"flex", flexDirection:"column" }}>
          <div style={{ padding:"12px 10px 8px", borderBottom:`1px solid ${C.border}` }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.navy }}>Sections</div>
            <div style={{ fontSize:10, color:C.textMuted, marginTop:2 }}>Drag sections to reorder</div>
          </div>
          <div style={{ flex:1, padding:8, overflowY:"auto" }}>
            <div onClick={()=>{ setActiveSection("name"); openToolbarPanel("header"); }}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 8px", borderRadius:7, marginBottom:3, cursor:"pointer", border:`1px solid ${showHeaderPanel?C.teal:"transparent"}`, background:showHeaderPanel?C.tealLight:"transparent" }}>
              <span style={{ fontSize:12 }}>👤</span>
              <span style={{ flex:1, fontSize:11, fontWeight:showHeaderPanel?700:400, color:showHeaderPanel?C.tealDark:C.navy, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>Header / Contact</span>
            </div>
            {sorted.filter(s=>s.section_type!=="name").map(s => {
              const sid = s.id||s.section_type;
              const isActiveSideSection = activeSection===sid && !showHeaderPanel;
              const isDraggingSideSection = dragId===sid;
              const isSidebarDropTarget = dragId && dragId!==sid && sectionDropTargetId===sid;
              return (
                <div key={sid} onDragOver={e=>onDragOver(e,sid)} onDrop={e=>onDrop(e,sid)} onClick={()=>{ setActiveSection(sid); closeToolbarPanel(); }}
                  style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 8px", borderRadius:7, marginBottom:3, cursor:"pointer", border:`1px solid ${isActiveSideSection||isSidebarDropTarget?C.teal:isDraggingSideSection?accent:C.border}`, background:isActiveSideSection||isSidebarDropTarget?C.tealLight:"transparent", opacity:isDraggingSideSection?0.45:s.is_visible?1:0.45 }}>
                  <span draggable onDragStart={e=>onDragStart(e,sid)} onDragEnd={()=>{ setDragId(null); setSectionDropTargetId(null); }} onClick={e=>e.stopPropagation()} title="Drag to reorder section" style={{ fontSize:14, color:isSidebarDropTarget||isDraggingSideSection?C.teal:C.textLight, lineHeight:1, width:14, textAlign:"center", cursor:isDraggingSideSection?"grabbing":"grab", fontWeight:800 }}>⋮⋮</span>
                  <span style={{ fontSize:12 }}>{s.icon||"📄"}</span>
                  <span style={{ flex:1, fontSize:11, fontWeight:activeSection===sid?700:400, color:activeSection===sid&&!showHeaderPanel?C.tealDark:C.navy, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.label}</span>
                  {!s.is_required && <button onClick={e=>{e.stopPropagation();toggleVisible(sid);}} style={{ background:"none",border:"none",cursor:"pointer",fontSize:10,color:C.textLight,padding:2 }}>{s.is_visible?"👁":"+"}</button>}
                </div>
              );
            })}
            <button onClick={addCustomSection} style={{ width:"100%", background:"none", border:`1.5px dashed ${C.border}`, borderRadius:7, padding:"6px", cursor:"pointer", fontSize:11, color:C.textMuted, fontFamily:"inherit", marginTop:6 }}>+ Add Section</button>
          </div>
          <div style={{ padding:"10px", borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.navy, marginBottom:6 }}>Import Resume</div>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display:"none" }} onChange={e=>processFile(e.target.files[0])} />
            <div onClick={()=>fileRef.current?.click()}
              onDragEnter={e=>{e.preventDefault();setDropActive(true);}}
              onDragOver={e=>{e.preventDefault();setDropActive(true);}}
              onDragLeave={()=>setDropActive(false)}
              onDrop={e=>{e.preventDefault();setDropActive(false);processFile(e.dataTransfer.files[0]);}}
              style={{ border:`2px dashed ${dropActive?C.teal:C.border}`, borderRadius:7, padding:"9px 8px", textAlign:"center", cursor:"pointer", background:dropActive?C.tealLight:C.bg, fontSize:11, color:C.textMuted }}>
              {importing?"Parsing...":importedFile?"Done":"Drop PDF"}
            </div>
            {parseError && <div style={{ fontSize:11, color:C.danger, marginTop:4 }}>Error: {parseError}</div>}
          </div>
        </div>

        {/* Canvas */}
        <div
          onClick={e=>{ if(e.target===e.currentTarget){ setActiveSection(null); setActiveJobId(null); closeToolbarPanel(); } }}
          style={{ flex:1, minWidth:0, overflow:"auto", background:"#E8EEF4", display:"flex", flexDirection:"column", alignItems:"center", padding:"36px 48px" }}
        >
          <div style={{ fontSize:11, color:"#94A3B8", marginBottom:16, letterSpacing:"0.04em", textAlign:"center" }}>
            Drag sections to reorder - Click to edit
          </div>
          <div style={{ width:920, maxWidth:"none", flexShrink:0, background:"#fff", boxShadow:"0 8px 48px rgba(0,0,0,0.15)", fontFamily, fontSize, color:"#1E293B", padding:margins, boxSizing:"border-box", lineHeight:1.6, minHeight:1100 }}>

            {/* Header */}
            <div
              style={{ position:"relative", cursor:"pointer", marginBottom:sGap, borderRadius:8, border:`2px solid ${activeSection==="name"||showHeaderPanel?accent:hoveredBlockId==="name"?accent+"66":"transparent"}`, padding:activeSection==="name"||showHeaderPanel||hoveredBlockId==="name"?8:8, marginLeft:-8, marginRight:-8, background:activeSection==="name"||showHeaderPanel?`${accent}06`:"transparent", transition:"border-color 0.15s, background 0.15s" }}
              onMouseEnter={()=>setHoveredBlockId("name")}
              onMouseLeave={()=>setHoveredBlockId(null)}
              onClick={()=>{ openToolbarPanel("header"); setActiveSection("name"); }}
            >
              {(activeSection==="name"||showHeaderPanel||hoveredBlockId==="name") && (
                <div style={{ position:"absolute", top:-10, right:8, background:accent, color:"#fff", borderRadius:999, padding:"2px 7px", fontSize:10, fontWeight:700, pointerEvents:"none" }}>Edit Header</div>
              )}
              {renderResumeHeader(true)}
            </div>

            {/* Sections */}
            {sorted.filter(s=>s.is_visible).map(s => {
              if(s.section_type==="name") return null;
              const sid = s.id||s.section_type;
              const isActive = activeSection===sid && !showHeaderPanel;
              const isDragging = dragId===sid;
              const isDropTarget = dragId && dragId!==sid && sectionDropTargetId===sid;
              const isHovered = hoveredBlockId===sid;
              return (
                <div key={sid}
                  onDragOver={e=>onDragOver(e,sid)}
                  onDrop={e=>onDrop(e,sid)}
                  onClick={()=>{ setActiveSection(sid); closeToolbarPanel(); }}
                  style={{ marginBottom:sGap, position:"relative", borderRadius:8, border:isActive?`2px solid ${accent}`:isDropTarget?`2px solid ${accent}`:isDragging?`2px dashed ${accent}`:isHovered?`2px solid ${accent}66`:`2px solid transparent`, padding:"8px 10px 8px 42px", background:isActive?`${accent}06`:isDropTarget?`${accent}08`:isHovered?`${accent}04`:"transparent", opacity:isDragging?0.4:1, transition:"border-color 0.15s, background 0.15s", boxShadow:isDropTarget?`0 0 0 3px ${accent}18`:"none" }}
                  onMouseEnter={()=>setHoveredBlockId(sid)}
                  onMouseLeave={()=>setHoveredBlockId(null)}
                >
                  {(isActive||isHovered) && <div style={{ position:"absolute", top:-10, right:8, background:isActive?accent:"#fff", color:isActive?"#fff":C.slate, border:`1px solid ${isActive?accent:C.border}`, borderRadius:999, padding:"2px 7px", fontSize:10, fontWeight:700, pointerEvents:"none", boxShadow:"0 2px 8px rgba(15,23,42,0.08)" }}>Edit</div>}
                  {isDropTarget && <div style={{ position:"absolute", top:-5, left:10, right:10, height:5, background:accent, borderRadius:999, boxShadow:`0 0 0 4px ${accent}22` }} />}
                  <div draggable onDragStart={e=>onDragStart(e,sid)} onDragEnd={()=>{ setDragId(null); setSectionDropTargetId(null); }} onClick={e=>e.stopPropagation()} title="Drag to reorder section" aria-label="Drag to reorder section" style={{ position:"absolute", left:6, top:8, bottom:8, width:28, border:`1px solid ${isDragging||isDropTarget?accent:C.border}`, borderRadius:7, background:isDragging||isDropTarget?`${accent}10`:"#fff", cursor:isDragging?"grabbing":"grab", userSelect:"none", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:isActive||isHovered?"0 2px 8px rgba(15,23,42,0.08)":"none" }}>
                    <div style={{ color:isDragging||isDropTarget?accent:"#64748B", fontSize:17, lineHeight:1, fontWeight:800 }}>⋮⋮</div>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                    <div onClick={()=>{ setActiveSection(sid); closeToolbarPanel(); }} style={{ cursor:"pointer", flex:1 }}>
                      <SectionHeading label={s.label} />
                    </div>
                    <button onClick={()=>{ setActiveSection(isActive?"":sid); closeToolbarPanel(); }} style={{ background:"none", border:`1px solid ${C.border}`, cursor:"pointer", fontSize:11, color:C.textMuted, padding:"2px 7px", borderRadius:5, fontFamily:"inherit" }}>
                      {isActive?"Done":"Edit"}
                    </button>
                  </div>
                  {s.section_type==="experience" ? (
                    <div>
                      {sortedJobs.filter(j=>j.is_visible!==false).map(j=><JobBlock key={j.id} job={j} editing={true} />)}
                      <button onClick={addJob} style={{ background:"none", border:`1.5px dashed ${C.border}`, borderRadius:7, padding:"5px 12px", cursor:"pointer", fontSize:11, color:C.textMuted, fontFamily:"inherit", marginTop:4, width:"100%" }}>+ Add Job</button>
                    </div>
                  ) : isActive ? (
                    <textarea autoFocus value={s.content?.text||""} onChange={e=>setContent(sid,e.target.value)} style={{ width:"100%", border:"none", outline:"none", resize:"none", fontFamily, fontSize, color:"#334155", lineHeight:1.65, background:"transparent", padding:0, minHeight:60, boxSizing:"border-box" }} rows={5} placeholder={`Enter your ${s.label.toLowerCase()}...`} />
                  ) : (
                    <div onClick={()=>{ setActiveSection(sid); closeToolbarPanel(); }} style={{ fontSize, color:s.content?.text?"#334155":"#CBD5E1", lineHeight:1.65, whiteSpace:"pre-wrap", minHeight:22, cursor:"text" }}>
                      {s.content?.text||`Click to add ${s.label.toLowerCase()}...`}
                    </div>
                  )}
                </div>
              );
            })}
            {sorted.filter(s=>!s.is_visible&&s.section_type!=="name").length>0 && (
              <div style={{ marginTop:12, padding:"6px 12px", background:"#F1F5F9", borderRadius:7, fontSize:11, color:C.textMuted }}>
                Hidden: {sorted.filter(s=>!s.is_visible&&s.section_type!=="name").map(s=>s.label).join(", ")}
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ width:260, flexShrink:0, background:"#fff", borderLeft:`1px solid ${C.border}`, overflowY:"auto", display:"flex", flexDirection:"column" }}>
          {renderRightPanel()}
          {!isPaid && (
            <div style={{ margin:12, padding:"10px 12px", background:"#FFFBEB", border:`1px solid #F6E05E`, borderRadius:8 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#92600A", marginBottom:4 }}>Pro Features</div>
              <div style={{ fontSize:11, color:"#92600A", lineHeight:1.5 }}>Banner headers, sidebar layouts, premium templates.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// ── AI Optimizer ──────────────────────────────────────────────────────────

