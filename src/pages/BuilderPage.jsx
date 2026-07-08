import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import { C, DEFAULT_SECTIONS, EMPTY_USER, FONT_PRESETS, HEADER_LAYOUTS } from "../constants/appConstants.js";
import { Badge, Btn, Card, CheckGroup, Input, SectionTitle, Select, Toggle } from "../components/ui.jsx";
import { edgeFetch } from "../lib/edgeFetch.js";
import { normalizeResumeTemplate } from "../resume-templates/normalizeResumeTemplate.js";
import { HeaderRenderer } from "../resume-templates/renderers/HeaderRenderer.jsx";
import { SectionHeadingRenderer } from "../resume-templates/renderers/SectionHeadingRenderer.jsx";
import { findResumeTemplateBySlug, getPersistableTemplateId, mergeResumeTemplates } from "../resume-templates/templateRegistry.js";
import { VisualDesigner } from "../resume-designer/components/VisualDesigner.jsx";

export default function BuilderPage({ profileForm, profileSkills, profileWork, profileEdu, user }) {
  const profile = profileForm || EMPTY_USER;
  const skills  = profileSkills || [];
  const work    = profileWork   || [];
  const edu     = profileEdu    || [];
  const isPaid  = user?.subscription !== "free";

  // State
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
  const [inspectorOpen,  setInspectorOpen]   = useState(false);
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
  const [builderMode,    setBuilderMode]     = useState("structured");
  const [panelOpen,      setPanelOpen]       = useState(true);
  const fileRef    = useRef(null);
  const previewRef = useRef(null);
  const structuredHeaderRef = useRef(null);
  const structuredSectionRefs = useRef({});

  // Derived template values
  const tmpl = selectedTmpl || normalizeResumeTemplate({ slug:"modern", name:"Modern", accent_color:C.teal });
  const accent     = tmpl.accent_color || C.teal;
  const fontFamily = customFont || tmpl.font_family || "DM Sans, sans-serif";
  const hdrLayout  = headerLayout || tmpl.header_style || "left";
  const effectiveHdrLayout = hdrLayout === "sidebar" ? "left" : hdrLayout;
  const isHeaderLayoutImplemented = id => id !== "sidebar";
  const fontSize   = tmpl.base_font_size || 13;
  const sGap       = { compact:10, normal:18, spacious:28 }[tmpl.section_spacing] || 18;
  const margins    = tmpl.page_margin === "tight" ? "32px 40px" : tmpl.page_margin === "wide" ? "52px 72px" : "44px 56px";
  const structuredPageWidth = 980;
  const structuredPageHeight = Math.round(structuredPageWidth * 11 / 8.5);
  const structuredMarginY = Number.parseInt(margins, 10) || 44;
  const structuredContentHeight = structuredPageHeight - structuredMarginY * 2;
  const showHeaderPanel = activeToolbarPanel === "header";
  const showTemplates = activeToolbarPanel === "templates";
  const showFonts = activeToolbarPanel === "fonts";
  const showDesign = activeToolbarPanel === "design";
  const openToolbarPanel = panel => setActiveToolbarPanel(panel);
  const closeToolbarPanel = () => setActiveToolbarPanel(null);
  const showDocumentSettings = () => {
    setActiveSection(null);
    setActiveJobId(null);
    setInspectorOpen(false);
    closeToolbarPanel();
  };
  const selectSection = (sectionId, panel = null) => {
    setActiveSection(sectionId);
    setInspectorOpen(true);
    if (panel) openToolbarPanel(panel);
    else closeToolbarPanel();
  };
  const clearCanvasSelection = () => {
    setActiveSection(null);
    setActiveJobId(null);
    setInspectorOpen(false);
    closeToolbarPanel();
  };
  const enterPreviewMode = () => {
    closeToolbarPanel();
    setPreviewMode(true);
  };

  // Init
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
    if (s.section_type === "education")  text = edu.map(e => `${e.degree || ""} - ${e.institution || ""}, ${e.graduation_year || ""}`).join("\n");
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
        const ts = mergeResumeTemplates(data || []);
        setTemplates(ts);
        const modern = ts.find(t => t.slug === "modern");
        const defaultTemplate = modern || ((data || []).length ? ts[0] : null);
        if (defaultTemplate) setSelectedTmpl(defaultTemplate);
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
            if (tmplData) setSelectedTmpl(normalizeResumeTemplate(tmplData));
          } else if (existing.template) {
            const localTemplate = findResumeTemplateBySlug(mergeResumeTemplates([]), existing.template);
            if (localTemplate) setSelectedTmpl(localTemplate);
          }
        } else {
          setSections(buildDefaultSections());
          setHeaderConfig(defaultHeaderConfig());
          setJobEntries(buildDefaultJobs());
        }
      });
  }, [user?.id]); // eslint-disable-line

  // Section drag-and-drop
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

  // Job drag-and-drop
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
    selectSection("experience");
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
      section_type: `custom_${Date.now()}`, label:"Custom Section", icon:"Custom",
      is_required:false, is_visible:true, content:{ text:"" }, display_order:(sections?.length || 0),
    };
    setSections(ss => [...(ss || []), newSec]);
    selectSection(newSec.id);
  };

  // Save
  const saveResume = async () => {
    if (!user?.id) return;
    setSaveState("saving");
    try {
      let rid = resumeId;
      const savedHeaderConfig = normalizeHeaderConfig(headerConfig || (!rid ? defaultHeaderConfig() : {}));
      const persistableTemplateId = getPersistableTemplateId(selectedTmpl);
      if (rid) {
        await supabase.from("resumes").update({ name:resumeName, updated_at:new Date().toISOString(), template:selectedTmpl?.slug||"modern", selected_template_id:persistableTemplateId }).eq("id", rid);
      } else {
        const { data } = await supabase.from("resumes").insert({ user_id:user.id, name:resumeName, template:selectedTmpl?.slug||"modern", selected_template_id:persistableTemplateId, is_primary:false, contact_fields:savedHeaderConfig, sections:[] }).select().single();
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

  // PDF Export
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

  // File import
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
        if (s.section_type === "education"      && parsed.education?.length)        return { ...s, content:{ text:parsed.education.map(e => `${e.degree||""} - ${e.institution||""}, ${e.graduation_year||""}`).join("\n") } };
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
  const getSectionId = section => section.id || section.section_type;
  const visibleStructuredSections = sorted.filter(section => section.is_visible && section.section_type !== "name");
  const visibleJobs = sortedJobs.filter(job => job.is_visible !== false);
  const experienceSection = visibleStructuredSections.find(section => section.section_type === "experience");
  const experienceSectionId = experienceSection ? getSectionId(experienceSection) : null;
  const structuredItems = visibleStructuredSections.flatMap(section => {
    const sectionId = getSectionId(section);
    if (section.section_type !== "experience" || !visibleJobs.length) {
      return [{ key: `section:${sectionId}`, type:"section", sectionId }];
    }

    return [
      { key: `experience:${sectionId}:header`, type:"experienceHeader", sectionId },
      ...visibleJobs.map(job => ({ key: `job:${job.id}`, type:"job", sectionId, jobId:job.id })),
      { key: `experience:${sectionId}:add`, type:"experienceAdd", sectionId },
    ];
  });

  const DragHandleDots = ({ color = "#64748B", dotSize = 3 }) => (
    <span
      aria-hidden="true"
      style={{
        display:"flex",
        flexDirection:"column",
        gap:3,
        alignItems:"center",
        justifyContent:"center",
      }}
    >
      {Array.from({ length:3 }).map((_, index) => (
        <span key={index} style={{ width:dotSize, height:dotSize, borderRadius:999, background:color, display:"block" }} />
      ))}
    </span>
  );
  const structuredItemKeys = structuredItems.map(item => item.key);
  const structuredItemMap = Object.fromEntries(structuredItems.map(item => [item.key, item]));
  const estimateTextHeight = (text, widthChars = 90, size = fontSize) => {
    const lineCount = String(text || "").split("\n").reduce((total, line) => {
      return total + Math.max(1, Math.ceil(line.length / widthChars));
    }, 0);
    return Math.ceil(lineCount * size * 1.65);
  };
  const estimateStructuredItemHeight = item => {
    if (item.type === "experienceHeader") return 50;
    if (item.type === "experienceAdd") return 48;
    if (item.type === "job") {
      const job = visibleJobs.find(candidate => candidate.id === item.jobId);
      const descriptionHeight = estimateTextHeight(job?.description || "", 86, fontSize - 1);
      return Math.max(92, 74 + descriptionHeight);
    }

    const section = visibleStructuredSections.find(candidate => getSectionId(candidate) === item.sectionId);
    const textHeight = estimateTextHeight(section?.content?.text || "", 92, fontSize);
    return Math.max(84, 54 + textHeight + sGap);
  };
  const paginateStructuredItems = () => {
    if (!structuredItemKeys.length) return [[]];
    const pages = [[]];
    let currentHeight = 150;

    structuredItems.forEach(item => {
      const itemHeight = estimateStructuredItemHeight(item);
      const currentPage = pages[pages.length - 1];
      const shouldStartNextPage = currentPage.length > 0 && currentHeight + itemHeight > structuredContentHeight;

      if (shouldStartNextPage) {
        pages.push([item.key]);
        currentHeight = itemHeight;
      } else {
        currentPage.push(item.key);
        currentHeight += itemHeight;
      }
    });

    return pages;
  };
  const structuredPageGroups = paginateStructuredItems();
  const hc = normalizeHeaderConfig(headerConfig); // shorthand for header config

  // Section heading
  const SectionHeading = ({ label }) => (
    <SectionHeadingRenderer label={label} tmpl={tmpl} accent={accent} fontSize={fontSize} />
  );
  // Resume header renderer
  // Reads headerConfig visibility flags; editing=true shows inline inputs
  const setHC = (field, val) => setHeaderConfig(h => ({ ...normalizeHeaderConfig(h), [field]: val }));
  const renderResumeHeader = (editing) => (
    <HeaderRenderer
      contactFields={hc}
      editing={editing}
      tmpl={tmpl}
      effectiveHdrLayout={effectiveHdrLayout}
      margins={margins}
      accent={accent}
      fontFamily={fontFamily}
      fontSize={fontSize}
      onFieldChange={setHC}
      onOpenHeaderPanel={() => openToolbarPanel("header")}
    />
  );
  // Job block renderer
  const JobBlock = ({ job, editing }) => {
    const isActiveJob = activeJobId === job.id && activeSection === "experience";
    const isDraggingJob = dragJobId === job.id;
    const isDropTarget = dragJobId && dragJobId !== job.id && jobDropTargetId === job.id;
    const dateStr = job.start_date ? `${job.start_date} - ${job.is_current ? "Present" : (job.end_date||"")}` : "";
    if (!editing) return (
      <div style={{ marginBottom:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:12, flexWrap:"wrap" }}>
          <div style={{ fontWeight:700, fontSize:fontSize, color:"#0F172A", minWidth:0, overflowWrap:"break-word" }}>{job.job_title || "Job Title"}</div>
          <div style={{ fontSize:fontSize-2, color:"#64748B", flexShrink:0 }}>{dateStr}</div>
        </div>
        <div style={{ fontSize:fontSize-1, color:accent, fontWeight:600, overflowWrap:"break-word" }}>{job.company}{job.location ? ` | ${job.location}` : ""}</div>
        {job.description && <div style={{ fontSize:fontSize-1, color:"#334155", marginTop:4, whiteSpace:"pre-wrap", lineHeight:1.6, overflowWrap:"break-word" }}>{job.description}</div>}
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
        onClick={() => { setActiveJobId(job.id); selectSection("experience"); }}
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
          <DragHandleDots color={isDraggingJob||isDropTarget?accent:"#64748B"} />
        </div>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:isActiveJob?10:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, minWidth:0 }}>
            {isActiveJob
              ? <input value={job.job_title||""} onChange={e=>updateJob(job.id,"job_title",e.target.value)} placeholder="Job Title" style={{ fontWeight:700, fontSize:fontSize, border:"none", outline:"none", fontFamily, background:"transparent", color:"#0F172A", flex:1, minWidth:0 }} />
              : <div style={{ fontWeight:700, fontSize:fontSize, color:"#0F172A", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{job.job_title||"(no title)"}</div>
            }
            {isActiveJob
              ? <input value={job.company||""} onChange={e=>updateJob(job.id,"company",e.target.value)} placeholder="Company" style={{ fontSize:fontSize-1, color:accent, fontWeight:600, border:"none", outline:"none", fontFamily, background:"transparent", minWidth:120, flex:"1 1 140px" }} />
              : <div style={{ fontSize:fontSize-1, color:accent, fontWeight:600, flexShrink:0 }}>{job.company}</div>
            }
          </div>
          <div style={{ display:"flex", gap:4, flexShrink:0, marginLeft:"auto" }}>
            <button onClick={e=>{e.stopPropagation();dupJob(job);}} title="Duplicate job" style={{ background:"#F1F5F9",border:`1px solid ${C.border}`,cursor:"pointer",fontSize:11,color:C.slate,padding:"2px 6px",borderRadius:4 }}>Duplicate</button>
            <button onClick={e=>{e.stopPropagation();deleteJob(job.id);}} title="Delete job" style={{ background:"#FEF2F2",border:`1px solid #FECACA`,cursor:"pointer",fontSize:11,color:C.danger,padding:"2px 6px",borderRadius:4 }}>Delete</button>
          </div>
        </div>
        {isActiveJob && (
          <div style={{ display:"grid", gap:8 }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(120px, 1fr))", gap:8, alignItems:"center" }}>
              <input value={job.location||""} onChange={e=>updateJob(job.id,"location",e.target.value)} placeholder="Location" style={{ fontSize:12, padding:"4px 8px", border:`1px solid ${C.border}`, borderRadius:6, fontFamily, outline:"none" }} />
              <input type="date" value={job.start_date||""} onChange={e=>updateJob(job.id,"start_date",e.target.value)} style={{ fontSize:12, padding:"4px 8px", border:`1px solid ${C.border}`, borderRadius:6, fontFamily, outline:"none" }} />
              {job.is_current ? <div style={{ fontSize:12, color:C.success, padding:"4px 8px" }}>Present</div> : <input type="date" value={job.end_date||""} onChange={e=>updateJob(job.id,"end_date",e.target.value)} style={{ fontSize:12, padding:"4px 8px", border:`1px solid ${C.border}`, borderRadius:6, fontFamily, outline:"none" }} />}
              <label style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, cursor:"pointer" }}>
                <input type="checkbox" checked={job.is_current||false} onChange={e=>updateJob(job.id,"is_current",e.target.checked)} style={{ accentColor:accent }} />Current
              </label>
            </div>
            <textarea value={job.description||""} onChange={e=>updateJob(job.id,"description",e.target.value)} placeholder="Describe your role, responsibilities, and achievements..." rows={4} style={{ width:"100%", padding:"6px 8px", border:`1px solid ${C.border}`, borderRadius:6, fontSize:fontSize-1, fontFamily, outline:"none", resize:"vertical", lineHeight:1.6, boxSizing:"border-box" }} />
          </div>
        )}
        {!isActiveJob && job.description && (
          <div style={{ fontSize:fontSize-1, color:"#334155", marginTop:4, lineHeight:1.6, whiteSpace:"pre-wrap" }}>{job.description.slice(0,120)}{job.description.length>120?"...":""}</div>
        )}
      </div>
    );
  };

  const renderStructuredSectionBlock = (section, {
    itemKey,
    jobsForPage = null,
    showAddJob = true,
    forceExperience = false,
  } = {}) => {
    const sid = section.id || section.section_type;
    const isActive = activeSection === sid && !showHeaderPanel;
    const isDragging = dragId === sid;
    const isDropTarget = dragId && dragId !== sid && sectionDropTargetId === sid;
    const isHovered = hoveredBlockId === sid;
    const sectionRefKey = itemKey || `section:${sid}`;
    const isExperience = forceExperience || section.section_type === "experience";

    return (
      <div key={sectionRefKey}
        ref={node => { if(node) structuredSectionRefs.current[sectionRefKey] = node; }}
        onDragOver={e=>onDragOver(e,sid)}
        onDrop={e=>onDrop(e,sid)}
        onClick={()=>selectSection(sid)}
        style={{ marginBottom:sGap, position:"relative", borderRadius:8, border:isActive?`2px solid ${accent}`:isDropTarget?`2px solid ${accent}`:isDragging?`2px dashed ${accent}`:isHovered?`2px solid ${accent}66`:`2px solid transparent`, padding:"8px 10px 8px 42px", background:isActive?`${accent}06`:isDropTarget?`${accent}08`:isHovered?`${accent}04`:"transparent", opacity:isDragging?0.4:1, transition:"border-color 0.15s, background 0.15s", boxShadow:isDropTarget?`0 0 0 3px ${accent}18`:"none" }}
        onMouseEnter={()=>setHoveredBlockId(sid)}
        onMouseLeave={()=>setHoveredBlockId(null)}
      >
        {(isActive||isHovered) && <div style={{ position:"absolute", top:-10, right:8, background:isActive?accent:"#fff", color:isActive?"#fff":C.slate, border:`1px solid ${isActive?accent:C.border}`, borderRadius:999, padding:"2px 7px", fontSize:10, fontWeight:700, pointerEvents:"none", boxShadow:"0 2px 8px rgba(15,23,42,0.08)" }}>Edit</div>}
        {isDropTarget && <div style={{ position:"absolute", top:-5, left:10, right:10, height:5, background:accent, borderRadius:999, boxShadow:`0 0 0 4px ${accent}22` }} />}
        <div draggable onDragStart={e=>onDragStart(e,sid)} onDragEnd={()=>{ setDragId(null); setSectionDropTargetId(null); }} onClick={e=>e.stopPropagation()} title="Drag to reorder section" aria-label="Drag to reorder section" style={{ position:"absolute", left:6, top:8, bottom:8, width:28, border:`1px solid ${isDragging||isDropTarget?accent:C.border}`, borderRadius:7, background:isDragging||isDropTarget?`${accent}10`:"#fff", cursor:isDragging?"grabbing":"grab", userSelect:"none", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:isActive||isHovered?"0 2px 8px rgba(15,23,42,0.08)":"none" }}>
          <DragHandleDots color={isDragging||isDropTarget?accent:"#64748B"} />
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
          <div onClick={()=>selectSection(sid)} style={{ cursor:"pointer", flex:1, minWidth:0 }}>
            <SectionHeading label={section.label} />
          </div>
          <button onClick={()=>{ if(isActive) clearCanvasSelection(); else selectSection(sid); }} style={{ background:"none", border:`1px solid ${C.border}`, cursor:"pointer", fontSize:11, color:C.textMuted, padding:"2px 7px", borderRadius:5, fontFamily:"inherit" }}>
            {isActive?"Done":"Edit"}
          </button>
        </div>
        {isExperience ? (
          <div>
            {(jobsForPage || visibleJobs).map(job => (
              <div key={job.id} ref={node => { if(node) structuredSectionRefs.current[`job:${job.id}`] = node; }}>
                <JobBlock job={job} editing={true} />
              </div>
            ))}
            {showAddJob && <div ref={node => { if(node) structuredSectionRefs.current[`experience:${sid}:add`] = node; }}>
              <button onClick={addJob} style={{ background:"none", border:`1.5px dashed ${C.border}`, borderRadius:7, padding:"5px 12px", cursor:"pointer", fontSize:11, color:C.textMuted, fontFamily:"inherit", marginTop:4, width:"100%" }}>+ Add Job</button>
            </div>}
          </div>
        ) : isActive ? (
          <textarea autoFocus value={section.content?.text||""} onChange={e=>setContent(sid,e.target.value)} style={{ width:"100%", border:"none", outline:"none", resize:"none", fontFamily, fontSize, color:"#334155", lineHeight:1.65, background:"transparent", padding:0, minHeight:60, boxSizing:"border-box" }} rows={5} placeholder={`Enter your ${section.label.toLowerCase()}...`} />
        ) : (
          <div onClick={()=>selectSection(sid)} style={{ fontSize, color:section.content?.text?"#334155":"#CBD5E1", lineHeight:1.65, whiteSpace:"pre-wrap", minHeight:22, cursor:"text", overflowWrap:"break-word" }}>
            {section.content?.text||`Click to add ${section.label.toLowerCase()}...`}
          </div>
        )}
      </div>
    );
  };

  // Preview mode
  if (previewMode) return (
    <div>
      <div style={{ position:"sticky", top:0, zIndex:10, background:"#1E293B", padding:"10px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, borderRadius:10 }}>
        <div style={{ fontSize:13, fontWeight:600, color:"#94A3B8" }}>Preview - {resumeName}</div>
        <div style={{ display:"flex", gap:8 }}>
          <Btn small onClick={exportPDF} variant="secondary">Export PDF</Btn>
          <Btn small onClick={() => setPreviewMode(false)}>Back to Editor</Btn>
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

  // Edit mode
  const activeSec = sorted.find(s => (s.id||s.section_type) === activeSection);

  // Right panel - context-aware
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
            <div key={j.id} onClick={()=>{ setActiveJobId(j.id); setInspectorOpen(true); }}
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
    <div className="jobvair-builder-shell" style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 60px)", overflow:"hidden", margin:"-28px -32px", fontFamily:"inherit", width:"auto", maxWidth:"none", textAlign:"left" }}>

      {/* Top bar */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 20px", background:"#fff", borderBottom:`1px solid ${C.border}`, flexShrink:0, gap:8, flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <input value={resumeName} onChange={e=>setResumeName(e.target.value)} style={{ fontSize:15, fontWeight:700, color:C.navy, border:"none", background:"transparent", outline:"none", fontFamily:"inherit", borderBottom:`2px solid ${C.border}`, padding:"2px 0", minWidth:160 }} />
          {saveState==="saved" && <span style={{ fontSize:11, color:C.success, fontWeight:600 }}>Saved</span>}
          {saveState==="error" && <span style={{ fontSize:11, color:C.danger }}>Save failed</span>}
          <div style={{ display:"flex", gap:4, padding:"3px", background:C.bg, borderRadius:999, border:`1px solid ${C.border}` }}>
            <button onClick={()=>setBuilderMode("structured")} style={{ border:"none", borderRadius:999, padding:"5px 10px", background:builderMode==="structured"?C.teal:"transparent", color:builderMode==="structured"?"#fff":C.slate, fontSize:11, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>Structured</button>
            <button onClick={()=>{ setBuilderMode("visual"); closeToolbarPanel(); setInspectorOpen(false); }} style={{ border:"none", borderRadius:999, padding:"5px 10px", background:builderMode==="visual"?C.teal:"transparent", color:builderMode==="visual"?"#fff":C.slate, fontSize:11, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>Visual Designer</button>
          </div>
        </div>
        {builderMode === "structured" ? (
          <div style={{ display:"flex", gap:4, alignItems:"center" }}>
            {[
              ["Document", showDocumentSettings, !activeSection && !activeToolbarPanel],
              ["Template", () => openToolbarPanel("templates"), showTemplates],
              ["Header",   () => selectSection("name", "header"), showHeaderPanel],
              ["Font",     () => openToolbarPanel("fonts"), showFonts],
              ["Design",   () => openToolbarPanel("design"), showDesign],
            ].map(([label, handler, active]) => (
              <button key={label} onClick={handler} style={{ padding:"6px 12px", borderRadius:7, border:`1px solid ${active?C.teal:C.border}`, background:active?C.tealLight:"transparent", fontSize:12, fontWeight:600, color:active?C.tealDark:C.slate, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}>{label}</button>
            ))}
          </div>
        ) : (
          <div style={{ fontSize:12, color:C.textMuted, fontWeight:700 }}>
            Visual Designer prototype - changes are local only
          </div>
        )}
        {builderMode === "structured" ? (
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            <Btn small variant="secondary" onClick={enterPreviewMode}>Preview</Btn>
            <Btn small variant="secondary" onClick={exportPDF}>PDF</Btn>
            <Btn small disabled={saveState==="saving"} onClick={saveResume}>{saveState==="saving"?"Saving...":"Save"}</Btn>
          </div>
        ) : (
          <div style={{ display:"flex", gap:6, alignItems:"center", fontSize:11, color:C.textMuted }}>
            Save/export comes in a later phase
          </div>
        )}
      </div>

      {builderMode === "visual" ? (
        <VisualDesigner headerConfig={hc} sections={sorted} jobEntries={sortedJobs} />
      ) : (
        <>
          <div style={{ flexShrink:0, padding:"8px 20px", background:"#F8FAFC", borderBottom:`1px solid ${C.border}`, color:C.textMuted, fontSize:12, fontWeight:600 }}>
            Structured Resume Builder is recommended. Best for editing resume content and exporting.
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
      <div style={{ display:"flex", flex:1, minWidth:0, overflow:"hidden" }}>

        {/* Left sidebar */}
        <div style={{ width:184, flexShrink:0, background:"#fff", borderRight:`1px solid ${C.border}`, overflowY:"auto", display:"flex", flexDirection:"column" }}>
          <div style={{ padding:"12px 10px 8px", borderBottom:`1px solid ${C.border}` }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.navy }}>Sections</div>
            <div style={{ fontSize:10, color:C.textMuted, marginTop:2 }}>Drag sections to reorder</div>
          </div>
          <div style={{ flex:1, padding:8, overflowY:"auto" }}>
            <div onClick={()=>selectSection("name", "header")}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 8px", borderRadius:7, marginBottom:3, cursor:"pointer", border:`1px solid ${showHeaderPanel?C.teal:"transparent"}`, background:showHeaderPanel?C.tealLight:"transparent" }}>
              <span style={{ fontSize:12 }}>Header</span>
              <span style={{ flex:1, fontSize:11, fontWeight:showHeaderPanel?700:400, color:showHeaderPanel?C.tealDark:C.navy, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>Header / Contact</span>
            </div>
            {sorted.filter(s=>s.section_type!=="name").map(s => {
              const sid = s.id||s.section_type;
              const isActiveSideSection = activeSection===sid && !showHeaderPanel;
              const isDraggingSideSection = dragId===sid;
              const isSidebarDropTarget = dragId && dragId!==sid && sectionDropTargetId===sid;
              return (
                <div key={sid} onDragOver={e=>onDragOver(e,sid)} onDrop={e=>onDrop(e,sid)} onClick={()=>selectSection(sid)}
                  style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 8px", borderRadius:7, marginBottom:3, cursor:"pointer", border:`1px solid ${isActiveSideSection||isSidebarDropTarget?C.teal:isDraggingSideSection?accent:C.border}`, background:isActiveSideSection||isSidebarDropTarget?C.tealLight:"transparent", opacity:isDraggingSideSection?0.45:s.is_visible?1:0.45 }}>
                  <span draggable onDragStart={e=>onDragStart(e,sid)} onDragEnd={()=>{ setDragId(null); setSectionDropTargetId(null); }} onClick={e=>e.stopPropagation()} title="Drag to reorder section" style={{ width:14, minWidth:14, display:"flex", alignItems:"center", justifyContent:"center", cursor:isDraggingSideSection?"grabbing":"grab" }}><DragHandleDots color={isSidebarDropTarget||isDraggingSideSection?C.teal:C.textLight} dotSize={2.5} /></span>
                  <span style={{ fontSize:12 }}>{s.icon||"Section"}</span>
                  <span style={{ flex:1, fontSize:11, fontWeight:activeSection===sid?700:400, color:activeSection===sid&&!showHeaderPanel?C.tealDark:C.navy, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.label}</span>
                  {!s.is_required && <button onClick={e=>{e.stopPropagation();toggleVisible(sid);}} style={{ background:"none",border:"none",cursor:"pointer",fontSize:10,color:C.textLight,padding:2 }}>{s.is_visible?"Hide":"+"}</button>}
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
          onClick={e=>{ if(e.target===e.currentTarget) clearCanvasSelection(); }}
          style={{ flex:1, minWidth:0, overflowY:"auto", overflowX:"hidden", background:"#E8EEF4", display:"flex", flexDirection:"column", alignItems:"center", padding:"clamp(20px, 3vw, 40px) clamp(16px, 4vw, 64px)", boxSizing:"border-box" }}
        >
          <div style={{ fontSize:11, color:"#94A3B8", marginBottom:16, letterSpacing:"0.04em", textAlign:"center" }}>
            Drag sections to reorder - Click to edit
          </div>
          <div ref={previewRef} style={{ width:structuredPageWidth, maxWidth:"100%", flexShrink:1, display:"flex", flexDirection:"column", gap:28, fontFamily, fontSize, color:"#1E293B", lineHeight:1.6, overflowWrap:"break-word", wordBreak:"break-word" }}>
            {structuredPageGroups.map((pageSectionIds, pageIndex) => (
              <div key={pageIndex} style={{ position:"relative", width:"100%", minHeight:structuredPageHeight, overflow:"visible", background:"#fff", boxShadow:"0 8px 48px rgba(0,0,0,0.15)", padding:margins, boxSizing:"border-box" }}>
                <div style={{ position:"absolute", bottom:14, right:18, fontSize:10, color:"#CBD5E1", fontWeight:700, letterSpacing:"0.08em" }}>Page {pageIndex + 1}</div>
                {pageIndex === 0 && (
                  <div
                    ref={structuredHeaderRef}
                    style={{ position:"relative", cursor:"pointer", marginBottom:sGap, borderRadius:8, border:`2px solid ${activeSection==="name"||showHeaderPanel?accent:hoveredBlockId==="name"?accent+"66":"transparent"}`, padding:8, marginLeft:-8, marginRight:-8, background:activeSection==="name"||showHeaderPanel?`${accent}06`:"transparent", transition:"border-color 0.15s, background 0.15s" }}
                    onMouseEnter={()=>setHoveredBlockId("name")}
                    onMouseLeave={()=>setHoveredBlockId(null)}
                    onClick={()=>selectSection("name", "header")}
                  >
                    <div style={{ position:"absolute", top:-10, right:8, background:accent, color:"#fff", borderRadius:999, padding:"2px 7px", fontSize:10, fontWeight:700, pointerEvents:"none", opacity:activeSection==="name"||showHeaderPanel||hoveredBlockId==="name"?1:0, transition:"opacity 0.12s" }}>Edit Header</div>
                    <div key="stable-resume-header-editor">
                      {renderResumeHeader(true)}
                    </div>
                  </div>
                )}

                {(() => {
                  const pageItems = pageSectionIds.map(key => structuredItemMap[key]).filter(Boolean);
                  const normalItems = pageItems.filter(item => item.type === "section");
                  const experienceItems = pageItems.filter(item => item.type === "experienceHeader" || item.type === "job" || item.type === "experienceAdd");
                  const experienceJobsForPage = experienceItems
                    .filter(item => item.type === "job")
                    .map(item => visibleJobs.find(job => job.id === item.jobId))
                    .filter(Boolean);
                  const showExperienceAdd = experienceItems.some(item => item.type === "experienceAdd");
                  const experienceItemKey = experienceItems.find(item => item.type === "experienceHeader")?.key || `experience:${experienceSectionId}:page:${pageIndex}`;

                  return (
                    <>
                      {normalItems.map(item => {
                        const section = visibleStructuredSections.find(candidate => getSectionId(candidate) === item.sectionId);
                        return section ? renderStructuredSectionBlock(section, { itemKey:item.key }) : null;
                      })}
                      {experienceItems.length > 0 && experienceSection && renderStructuredSectionBlock(experienceSection, {
                        itemKey:experienceItemKey,
                        jobsForPage:experienceJobsForPage,
                        showAddJob:showExperienceAdd,
                        forceExperience:true,
                      })}
                    </>
                  );
                })()}
              </div>
            ))}
            {sorted.filter(s=>!s.is_visible&&s.section_type!=="name").length>0 && (
              <div style={{ padding:"6px 12px", background:"#F1F5F9", borderRadius:7, fontSize:11, color:C.textMuted }}>
                Hidden: {sorted.filter(s=>!s.is_visible&&s.section_type!=="name").map(s=>s.label).join(", ")}
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        {inspectorOpen && (
          <div style={{ width:260, flexShrink:0, background:"#fff", borderLeft:`1px solid ${C.border}`, overflowY:"auto", display:"flex", flexDirection:"column" }}>
            {renderRightPanel()}
            {!isPaid && (
              <div style={{ margin:12, padding:"10px 12px", background:"#FFFBEB", border:`1px solid #F6E05E`, borderRadius:8 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#92600A", marginBottom:4 }}>Pro Features</div>
                <div style={{ fontSize:11, color:"#92600A", lineHeight:1.5 }}>Banner headers, sidebar layouts, premium templates.</div>
              </div>
            )}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
// AI Optimizer










