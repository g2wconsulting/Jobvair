import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import { C, DEFAULT_SECTIONS, EMPTY_USER, FONT_PRESETS, HEADER_LAYOUTS } from "../constants/appConstants.js";
import { Button } from "../components/ui/index.js";
import { Settings2, LayoutTemplate, IdCard, Type, Palette, Sparkles, Eye, Download, Save, CheckCircle2, AlertCircle } from "lucide-react";
import "./BuilderToolbar.css";
import { edgeFetch } from "../lib/edgeFetch.js";
import { normalizeResumeTemplate } from "../resume-templates/normalizeResumeTemplate.js";
import { HeaderRenderer } from "../resume-templates/renderers/HeaderRenderer.jsx";
import { SectionHeadingRenderer } from "../resume-templates/renderers/SectionHeadingRenderer.jsx";
import { findResumeTemplateBySlug, getPersistableTemplateId, mergeResumeTemplates } from "../resume-templates/templateRegistry.js";
import TemplateGalleryModal from "../resume-templates/TemplateGalleryModal.jsx";
import FreeFormBuilder from "../resume-designer/components/FreeFormBuilder.jsx";
import AssistantPanel from "../assistant/AssistantPanel.jsx";

const ACCENT_COLOR_SWATCHES = [
  "#00BFA5", "#0B1F33", "#2563EB", "#0F766E", "#111827",
  "#7C3AED", "#1D4ED8", "#DB2777", "#DC2626", "#059669", "#EA580C",
];

export default function BuilderPage({ profileForm, profileSkills, profileWork, profileEdu, user }) {
  const profile = profileForm || EMPTY_USER;
  const skills  = useMemo(() => profileSkills || [], [profileSkills]);
  const work    = useMemo(() => profileWork   || [], [profileWork]);
  const edu     = useMemo(() => profileEdu    || [], [profileEdu]);
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
  const [customAccent,   setCustomAccent]    = useState(null); // overrides template accent_color
  const [customFontSize, setCustomFontSize]  = useState(null); // overrides template base_font_size
  const [customLineHeight, setCustomLineHeight] = useState(null); // overrides template typography.line_height
  const [customSpacing,  setCustomSpacing]   = useState(null); // overrides template section_spacing
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
  const [measuredHeights, setMeasuredHeights] = useState({});
  const [assistantOpen,  setAssistantOpen]   = useState(false);
  const [galleryOpen,    setGalleryOpen]     = useState(false);
  const [freeformSaveState, setFreeformSaveState] = useState("idle");
  const freeformRef = useRef(null);
  const fileRef    = useRef(null);
  const previewRef = useRef(null);
  const structuredHeaderRef = useRef(null);
  const structuredSectionRefs = useRef({});

  // Derived template values
  const tmpl = selectedTmpl || normalizeResumeTemplate({ slug:"modern", name:"Modern", accent_color:C.teal });
  const accent     = customAccent || tmpl.accent_color || C.teal;
  const fontFamily = customFont || tmpl.font_family || "DM Sans, sans-serif";
  const hdrLayout  = headerLayout || tmpl.header_style || "left";
  const effectiveHdrLayout = hdrLayout === "sidebar" ? "left" : hdrLayout;
  const isHeaderLayoutImplemented = id => id !== "sidebar";
  const fontSize   = customFontSize || tmpl.base_font_size || 13;
  const lineHeight = customLineHeight || tmpl.line_height || 1.6;
  const sGap       = { compact:10, normal:18, spacious:28 }[customSpacing || tmpl.section_spacing] || 18;
  const margins    = tmpl.page_margin === "tight" ? "32px 40px" : tmpl.page_margin === "wide" ? "52px 72px" : "44px 56px";
  const structuredPageWidth = 980;
  const structuredPageHeight = Math.round(structuredPageWidth * 11 / 8.5);
  const structuredMarginY = Number.parseInt(margins, 10) || 44;
  const structuredContentHeight = structuredPageHeight - structuredMarginY * 2;
  const showHeaderPanel = activeToolbarPanel === "header";
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
            // Restore custom font, header layout, and other style overrides from layout_config
            const layoutCfg = secs.find(s => s.section_type === "name")?.layout_config_json || {};
            if (layoutCfg.custom_font)   setCustomFont(layoutCfg.custom_font);
            if (layoutCfg.header_layout) setHeaderLayout(layoutCfg.header_layout);
            if (layoutCfg.custom_accent) setCustomAccent(layoutCfg.custom_accent);
            if (layoutCfg.custom_font_size) setCustomFontSize(layoutCfg.custom_font_size);
            if (layoutCfg.custom_line_height) setCustomLineHeight(layoutCfg.custom_line_height);
            if (layoutCfg.custom_spacing) setCustomSpacing(layoutCfg.custom_spacing);
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
        layout_config_json: s.section_type === "name" ? { custom_font:customFont, header_layout:headerLayout, custom_accent:customAccent, custom_font_size:customFontSize, custom_line_height:customLineHeight, custom_spacing:customSpacing } : (s.layout_config_json||{}),
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
      return rid;
    } catch (err) {
      console.error("[BuilderPage] save error:", err.message);
      setSaveState("error"); setTimeout(() => setSaveState("idle"), 3000);
      return null;
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
      margin:0, filename:`${resumeName.replace(/\s+/g,"_")}.pdf`,
      image:{ type:"jpeg", quality:0.98 },
      html2canvas:{ scale:2, useCORS:true, letterRendering:true },
      jsPDF:{ unit:"in", format:"letter", orientation:"portrait" },
      pagebreak:{ mode:["css","legacy"], after:".jobvair-pdf-page" },
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
      const measured = measuredHeights[item.key];
      if (measured) return measured;
      const job = visibleJobs.find(candidate => candidate.id === item.jobId);
      const descriptionHeight = estimateTextHeight(job?.description || "", 86, fontSize - 1);
      return Math.max(92, 74 + descriptionHeight);
    }

    const measured = measuredHeights[item.key];
    if (measured) return measured;
    const section = visibleStructuredSections.find(candidate => getSectionId(candidate) === item.sectionId);
    const textHeight = estimateTextHeight(section?.content?.text || "", 92, fontSize);
    return Math.max(84, 54 + textHeight + sGap);
  };
  const paginateStructuredItems = () => {
    if (!structuredItemKeys.length) return [[]];
    const pages = [[]];
    let currentHeight = measuredHeights.__header ?? 150;

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

  // Measure real rendered heights of header/section/job blocks after every render.
  // Pagination above starts from a character-count estimate so the first paint has
  // something to show, then this effect corrects it to the actual DOM height, which
  // triggers one more render with accurate page breaks. This is what keeps content
  // from overflowing past the bottom of a page when real font metrics, wrapping, or
  // bullet lengths differ from the estimate.
  useLayoutEffect(() => {
    const next = {};
    if (structuredHeaderRef.current) {
      next.__header = Math.ceil(structuredHeaderRef.current.getBoundingClientRect().height) + sGap;
    }
    structuredItems.forEach(item => {
      if (item.type === "experienceHeader" || item.type === "experienceAdd") return;
      const node = structuredSectionRefs.current[item.key];
      if (node) {
        next[item.key] = Math.ceil(node.getBoundingClientRect().height);
      }
    });

    setMeasuredHeights(prev => {
      const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
      let changed = false;
      for (const key of keys) {
        if (Math.abs((prev[key] || 0) - (next[key] || 0)) > 1) { changed = true; break; }
      }
      return changed ? next : prev;
    });
  }, [structuredItems, sGap]);

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
        ref={node => { if(node) structuredSectionRefs.current[sectionRefKey] = node; else delete structuredSectionRefs.current[sectionRefKey]; }}
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
              <div key={job.id} ref={node => { if(node) structuredSectionRefs.current[`job:${job.id}`] = node; else delete structuredSectionRefs.current[`job:${job.id}`]; }}>
                <JobBlock job={job} editing={true} />
              </div>
            ))}
            {showAddJob && <div ref={node => { if(node) structuredSectionRefs.current[`experience:${sid}:add`] = node; else delete structuredSectionRefs.current[`experience:${sid}:add`]; }}>
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
          <Button size="sm" variant="secondary" onClick={exportPDF}>Export PDF</Button>
          <Button size="sm" onClick={() => setPreviewMode(false)}>Back to Editor</Button>
        </div>
      </div>
      <div style={{ display:"flex", justifyContent:"center", background:"#E2E8F0", padding:"32px 24px", borderRadius:12, minHeight:800 }}>
        <div ref={previewRef} style={{ width:900, maxWidth:"calc(100vw - 80px)", background:"#fff", boxShadow:"0 8px 48px rgba(0,0,0,0.18)", fontFamily, fontSize, color:"#1E293B", padding:margins, boxSizing:"border-box", lineHeight }}>
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
        <div className="jv-inspector-header">
          <div>
            <div className="jv-inspector-title">Header</div>
            <div className="jv-inspector-sub">Edit resume-specific name, title, and contact info</div>
          </div>
          <button className="jv-panel-done" onClick={closeToolbarPanel}>Done</button>
        </div>
        <div className="jv-inspector-body">
          {[
            ["name","Full Name","text"],["headline","Optional Headline / Title","text"],["email","Email","email"],
            ["phone","Phone","tel"],["location","Location","text"],["linkedin","LinkedIn URL","text"],
            ["website","Website","text"],["github","GitHub","text"],["custom_contact_line","Custom Line","text"],
          ].map(([field,label,type]) => (
            <div key={field}>
              <div className="jv-field-label">{label}</div>
              <input type={type} value={hc[field]||""} onChange={e=>setHC(field,e.target.value)} placeholder={label} className="jv-field-input" />
            </div>
          ))}
          <div className="jv-inspector-divider">
            <div className="jv-inspector-divider-title">Show / Hide</div>
            {[
              ["show_headline","Optional Headline / Title"],["show_email","Email"],["show_phone","Phone"],
              ["show_location","Location"],["show_linkedin","LinkedIn"],["show_website","Website"],
              ["show_github","GitHub"],["show_custom","Custom Line"],
            ].map(([field,label]) => (
              <label key={field} className="jv-checkbox-row">
                <input type="checkbox" checked={hc[field]||false} onChange={e=>setHC(field,e.target.checked)} />
                <span style={{ fontSize:12, color:hc[field]?"var(--jv-color-teal-700)":"var(--jv-color-slate-600)" }}>{label}</span>
              </label>
            ))}
          </div>
          <div className="jv-inspector-divider">
            <div className="jv-inspector-divider-title">Header Layout</div>
            {HEADER_LAYOUTS.map(h => {
              const locked = h.tier==="premium" && !isPaid;
              const implemented = isHeaderLayoutImplemented(h.id);
              const disabled = locked || !implemented;
              const isActive = hdrLayout===h.id;
              return (
                <div key={h.id} onClick={()=>{ if(!disabled) setHeaderLayout(h.id); }}
                  className={`jv-layout-row${isActive?" jv-layout-row--active":""}${disabled?" jv-layout-row--disabled":""}`}>
                  <span style={{ fontSize:16 }}>{h.icon}</span>
                  <span style={{ fontSize:12, flex:1, color:"var(--jv-color-heading)" }}>{h.label}</span>
                  {!implemented && <span style={{ fontSize:10, color:"var(--jv-color-muted)" }}>Coming soon</span>}
                  {locked && <span style={{ fontSize:10, color:"var(--jv-color-gold-500)" }}>Pro</span>}
                  {isActive && <span style={{ fontSize:11, color:"var(--jv-color-primary)", fontWeight:700 }}>✓</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );

    if (activeSection === "experience") return (
      <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
        <div className="jv-inspector-header" style={{ display:"block" }}>
          <div className="jv-inspector-title">Work Experience</div>
          <div className="jv-inspector-sub">Drag jobs to reorder</div>
        </div>
        <div style={{ padding:16 }}>
          <button onClick={addJob} className="jv-add-btn">Add Job</button>
          {sortedJobs.map(j => (
            <div key={j.id} onClick={()=>{ setActiveJobId(j.id); setInspectorOpen(true); }}
              className={`jv-job-row${activeJobId===j.id?" jv-job-row--active":""}`}>
              <div style={{ fontSize:12, fontWeight:600, color:"var(--jv-color-heading)" }}>{j.job_title||"(no title)"}</div>
              <div style={{ fontSize:11, color:"var(--jv-color-muted)" }}>{j.company||""}</div>
            </div>
          ))}
        </div>
      </div>
    );

    if (activeSec) return (
      <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
        <div className="jv-inspector-header" style={{ display:"block" }}>
          <div className="jv-inspector-title">{activeSec.label}</div>
          <div className="jv-inspector-sub">Edit this resume block</div>
        </div>
        <div className="jv-inspector-body">
          <div>
            <div className="jv-field-label">Content</div>
            <textarea
              value={activeSec.content?.text || ""}
              onChange={e=>setContent(activeSec.id || activeSec.section_type, e.target.value)}
              rows={10}
              placeholder={`Enter your ${activeSec.label.toLowerCase()}...`}
              className="jv-field-input"
              style={{ resize:"vertical", minHeight:160, lineHeight:1.55 }}
            />
          </div>
          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:activeSec.is_required?"not-allowed":"pointer", opacity:activeSec.is_required?0.5:1 }}>
            <input type="checkbox" checked={activeSec.is_visible!==false} disabled={activeSec.is_required} onChange={()=>toggleVisible(activeSec.id || activeSec.section_type)} style={{ accentColor:"var(--jv-color-primary)", width:14, height:14 }} />
            <span style={{ fontSize:12, color:"var(--jv-color-slate-600)" }}>Show section on resume</span>
          </label>
          <div className="jv-doc-card" style={{ fontSize:11, color:"var(--jv-color-muted)", lineHeight:1.5 }}>
            Reorder this block from the canvas or the Layers panel on the left.
          </div>
        </div>
      </div>
    );

    // Default document inspector
    return (
      <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
        <div className="jv-inspector-header" style={{ display:"block" }}>
          <div className="jv-inspector-title">Document Settings</div>
          <div className="jv-inspector-sub">Select a resume block to edit its properties.</div>
        </div>
        <div className="jv-inspector-body">
          {[
            ["Template", selectedTmpl?.name || tmpl.name || "Modern", () => openToolbarPanel("templates")],
            ["Font", FONT_PRESETS.find(f => f.value === fontFamily)?.label || fontFamily.split(",")[0], () => openToolbarPanel("fonts")],
            ["Header Layout", HEADER_LAYOUTS.find(h => h.id === hdrLayout)?.label || "Left Aligned", () => openToolbarPanel("design")],
            ["Section Spacing", tmpl.section_spacing || "normal", null],
            ["Page Margins", tmpl.page_margin || "normal", null],
          ].map(([label, value, action]) => (
            <div key={label} className="jv-doc-card">
              <div className="jv-doc-card__label">{label}</div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ flex:1, fontSize:12, color:"var(--jv-color-heading)", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{value}</div>
                {action && <button onClick={action} className="jv-doc-card__edit">Edit</button>}
              </div>
            </div>
          ))}
          <div className="jv-info-banner">
            Use the Layers panel on the left to add, hide, and reorder sections. Click a block on the resume to edit it here.
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="jobvair-builder-shell" style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 60px)", overflow:"hidden", margin:"-28px -32px", fontFamily:"inherit", width:"auto", maxWidth:"none", textAlign:"left" }}>

      {/* Top bar */}
      <div className="jv-builder-topbar">
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <input value={resumeName} onChange={e=>setResumeName(e.target.value)} className="jv-builder-name-input" />
          {saveState==="saved" && <span className="jv-save-indicator jv-save-indicator--saved"><CheckCircle2 size={13} /> Saved</span>}
          {saveState==="error" && <span className="jv-save-indicator jv-save-indicator--error"><AlertCircle size={13} /> Save failed</span>}
          <div className="jv-mode-switch">
            <button onClick={()=>setBuilderMode("structured")} className={`jv-mode-switch__btn${builderMode==="structured"?" jv-mode-switch__btn--active":""}`}>Templates</button>
            <button onClick={()=>{ setBuilderMode("visual"); closeToolbarPanel(); setInspectorOpen(false); }} className={`jv-mode-switch__btn${builderMode==="visual"?" jv-mode-switch__btn--active":""}`}>Free Build</button>
          </div>
        </div>
        {builderMode === "structured" ? (
          <div style={{ display:"flex", gap:4, alignItems:"center" }}>
            {[
              ["Document", Settings2, showDocumentSettings, !activeSection && !activeToolbarPanel],
              ["Template", LayoutTemplate, () => setGalleryOpen(true), false],
              ["Header",   IdCard, () => selectSection("name", "header"), showHeaderPanel],
              ["Font",     Type, () => openToolbarPanel("fonts"), showFonts],
              ["Design",   Palette, () => openToolbarPanel("design"), showDesign],
            ].map(([label, Icon, handler, active]) => (
              <button key={label} onClick={handler} className={`jv-toolbar-btn${active?" jv-toolbar-btn--active":""}`}><Icon size={14} />{label}</button>
            ))}
          </div>
        ) : (
          <div style={{ fontSize:12, color:C.textMuted, fontWeight:700 }}>
            Drag elements onto the canvas, then style them in the panel on the right
          </div>
        )}
        {builderMode === "structured" ? (
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <button className="jv-toolbar-action" onClick={()=>setAssistantOpen(true)}><Sparkles size={14} /> Assistant</button>
            <button className="jv-toolbar-action" onClick={enterPreviewMode}><Eye size={14} /> Preview</button>
            <button className="jv-toolbar-action" onClick={exportPDF}><Download size={14} /> PDF</button>
            <button className="jv-toolbar-action jv-toolbar-action--primary" disabled={saveState==="saving"} onClick={saveResume}>
              <Save size={14} /> {saveState==="saving"?"Saving...":"Save"}
            </button>
          </div>
        ) : (
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {freeformSaveState==="saved" && <span className="jv-save-indicator jv-save-indicator--saved"><CheckCircle2 size={13} /> Saved</span>}
            {freeformSaveState==="error" && <span className="jv-save-indicator jv-save-indicator--error"><AlertCircle size={13} /> Save failed</span>}
            <button className="jv-toolbar-action jv-toolbar-action--primary" disabled={freeformSaveState==="saving"} onClick={()=>freeformRef.current?.saveNow()}>
              <Save size={14} /> {freeformSaveState==="saving"?"Saving...":"Save"}
            </button>
          </div>
        )}
      </div>

      {assistantOpen && (
        <AssistantPanel
          onClose={()=>setAssistantOpen(false)}
          builderState={{
            resume_id: resumeId,
            user_id: user?.id ?? null,
            resume_name: resumeName,
            header: normalizeHeaderConfig(headerConfig),
            sections: sections || [],
            jobs: jobEntries || [],
            template: selectedTmpl || {},
            profile_context: {
              name: profile.name, email: profile.email, phone: profile.phone, location: profile.location,
              summary: profile.summary, desired_titles: profile.desiredTitles, industries: profile.industries,
              skills, work, education: edu,
            },
          }}
          onApply={(previewPayload) => {
            if (previewPayload.header) setHeaderConfig(h => ({ ...normalizeHeaderConfig(h), ...previewPayload.header }));
            if (Array.isArray(previewPayload.sections) && previewPayload.sections.length) setSections(previewPayload.sections);
            if (Array.isArray(previewPayload.jobs) && previewPayload.jobs.length) setJobEntries(previewPayload.jobs);
          }}
        />
      )}

      {galleryOpen && (
        <TemplateGalleryModal
          templates={templates}
          selectedTmpl={selectedTmpl}
          onSelect={(t) => { setSelectedTmpl(t); setGalleryOpen(false); }}
          onClose={() => setGalleryOpen(false)}
        />
      )}

      {builderMode === "visual" ? (
        <FreeFormBuilder ref={freeformRef} resumeId={resumeId} userId={user?.id} onEnsureResumeId={saveResume} onSaveStateChange={setFreeformSaveState} />
      ) : (
        <>
          <div style={{ flexShrink:0, padding:"8px 20px", background:"#F8FAFC", borderBottom:`1px solid ${C.border}`, color:C.textMuted, fontSize:12, fontWeight:600 }}>
            Structured Resume Builder is recommended. Best for editing resume content and exporting.
          </div>
      {/* Design panels */}
      {(showFonts || showDesign) && (
        <div className="jv-panel-bar">
          {showFonts && (
            <div>
              <div className="jv-panel-row-header">
                <div className="jv-panel-title">Font</div>
                <button className="jv-panel-done" onClick={closeToolbarPanel}>Done</button>
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {FONT_PRESETS.map(f => {
                  const isActive = (customFont||tmpl.font_family)===f.value;
                  return (
                    <div key={f.value} onClick={()=>setCustomFont(f.value)} className={`jv-chip${isActive?" jv-chip--active":""}`}>
                      <div className="jv-chip__title" style={{ fontFamily:f.value }}>{f.label}</div>
                      <div className="jv-chip__meta">{f.category}</div>
                    </div>
                  );
                })}
                {customFont && <button onClick={()=>setCustomFont(null)} className="jv-reset-link">Reset</button>}
              </div>
            </div>
          )}
          {showDesign && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div className="jv-panel-row-header" style={{ marginBottom:0 }}>
                <div className="jv-panel-title">Design &amp; Style</div>
                <button className="jv-panel-done" onClick={closeToolbarPanel}>Done</button>
              </div>

              <div>
                <div className="jv-panel-label">Header Layout</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {HEADER_LAYOUTS.map(h => {
                    const locked = h.tier==="premium" && !isPaid;
                    const implemented = isHeaderLayoutImplemented(h.id);
                    const disabled = locked || !implemented;
                    const isActive = hdrLayout===h.id;
                    return (
                      <div key={h.id} onClick={()=>{ if(!disabled) setHeaderLayout(h.id); }} className={`jv-chip${isActive?" jv-chip--active":""}${disabled?" jv-chip--disabled":""}`}>
                        <div style={{ fontSize:18, marginBottom:3 }}>{h.icon}</div>
                        <div className="jv-chip__title">{h.label}</div>
                        {!implemented && <div className="jv-chip__meta">Coming soon</div>}
                        {locked && <div className="jv-chip__meta" style={{ color:"var(--jv-color-gold-500)" }}>Pro</div>}
                        {isActive && <div className="jv-chip__meta jv-chip__meta--active">Active</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="jv-panel-label">Accent Color</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                  {ACCENT_COLOR_SWATCHES.map(c => (
                    <button key={c} onClick={()=>setCustomAccent(c)} title={c} className={`jv-swatch${accent===c?" jv-swatch--active":""}`} style={{ background:c }} />
                  ))}
                  <input type="color" value={accent} onChange={e=>setCustomAccent(e.target.value)} title="Custom color" className="jv-swatch" style={{ background:"none" }} />
                  {customAccent && <button onClick={()=>setCustomAccent(null)} className="jv-reset-link" style={{ border:"1px solid var(--jv-color-border)" }}>Reset</button>}
                </div>
              </div>

              <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
                <div>
                  <div className="jv-panel-label">Font Size</div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <button onClick={()=>setCustomFontSize(Math.max(11, fontSize-1))} className="jv-stepper-btn">−</button>
                    <span className="jv-stepper-value">{fontSize}</span>
                    <button onClick={()=>setCustomFontSize(Math.min(16, fontSize+1))} className="jv-stepper-btn">+</button>
                    {customFontSize && <button onClick={()=>setCustomFontSize(null)} className="jv-reset-link">Reset</button>}
                  </div>
                </div>
                <div>
                  <div className="jv-panel-label">Line Height</div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <button onClick={()=>setCustomLineHeight(Math.max(1.3, Math.round((lineHeight-0.1)*10)/10))} className="jv-stepper-btn">−</button>
                    <span className="jv-stepper-value" style={{ minWidth:28 }}>{lineHeight.toFixed(1)}</span>
                    <button onClick={()=>setCustomLineHeight(Math.min(1.9, Math.round((lineHeight+0.1)*10)/10))} className="jv-stepper-btn">+</button>
                    {customLineHeight && <button onClick={()=>setCustomLineHeight(null)} className="jv-reset-link">Reset</button>}
                  </div>
                </div>
              </div>

              <div>
                <div className="jv-panel-label">Section Spacing</div>
                <div style={{ display:"flex", gap:6 }}>
                  {["compact","normal","spacious"].map(sp => {
                    const isActive = (customSpacing || tmpl.section_spacing || "normal") === sp;
                    return (
                      <button key={sp} onClick={()=>setCustomSpacing(sp)} className={`jv-pill-option${isActive?" jv-pill-option--active":""}`}>{sp}</button>
                    );
                  })}
                  {customSpacing && <button onClick={()=>setCustomSpacing(null)} className="jv-reset-link" style={{ marginLeft:4 }}>Reset</button>}
                </div>
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
          <div ref={previewRef} style={{ width:structuredPageWidth, maxWidth:"100%", flexShrink:1, display:"flex", flexDirection:"column", gap:28, fontFamily, fontSize, color:"#1E293B", lineHeight, overflowWrap:"break-word", wordBreak:"break-word" }}>
            {structuredPageGroups.map((pageSectionIds, pageIndex) => (
              <div key={pageIndex} className={pageIndex < structuredPageGroups.length - 1 ? "jobvair-pdf-page" : undefined} style={{ position:"relative", width:"100%", minHeight:structuredPageHeight, overflow:"visible", background:"#fff", boxShadow:"0 8px 48px rgba(0,0,0,0.15)", padding:margins, boxSizing:"border-box" }}>
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










