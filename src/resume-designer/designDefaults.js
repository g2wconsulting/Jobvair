export const DESIGN_VERSION = "resume_design_v1";

export const PAGE_PRESETS = {
  letter: {
    id: "letter",
    label: "Letter",
    width: 816,
    height: 1056,
  },
};

export const DEFAULT_DESIGN_THEME = {
  fontFamily: "Inter, sans-serif",
  primaryColor: "#0F172A",
  accentColor: "#00BFA5",
  mutedColor: "#64748B",
  borderColor: "#E2E8F0",
  backgroundColor: "#FFFFFF",
};

export const DEFAULT_BLOCK_STYLE = {
  fontFamily: "Inter, sans-serif",
  fontSize: 14,
  fontWeight: 500,
  color: "#0F172A",
  backgroundColor: "transparent",
  borderColor: "transparent",
  borderWidth: 0,
  borderRadius: 0,
  padding: 0,
  textAlign: "left",
};

export function createBlock(overrides = {}) {
  return {
    id: overrides.id || `block_${Date.now()}`,
    type: overrides.type || "text_box",
    linkedSectionType: overrides.linkedSectionType || null,
    linkedEntityId: overrides.linkedEntityId || null,
    pageId: overrides.pageId || "page_1",
    x: overrides.x ?? 56,
    y: overrides.y ?? 56,
    width: overrides.width ?? 260,
    height: overrides.height ?? 80,
    rotation: 0,
    zIndex: overrides.zIndex ?? 1,
    locked: false,
    visible: true,
    label: overrides.label || "Text",
    content: {
      text: overrides.content?.text || overrides.text || "",
      ...(overrides.content || {}),
    },
    style: {
      ...DEFAULT_BLOCK_STYLE,
      ...(overrides.style || {}),
    },
  };
}

export function createDefaultDesign({ header = {}, sections = [], jobs = [], theme = DEFAULT_DESIGN_THEME } = {}) {
  const summary = sections.find(section => section.section_type === "summary")?.content?.text || "Add a concise career summary.";
  const skills = sections.find(section => section.section_type === "skills")?.content?.text || "Add your strongest skills.";
  const experienceText = jobs.length
    ? jobs.slice(0, 2).map(job => `${job.job_title || "Role"} - ${job.company || "Company"}\n${job.description || "Add role highlights."}`).join("\n\n")
    : sections.find(section => section.section_type === "experience")?.content?.text || "Add work experience highlights.";

  return {
    version: DESIGN_VERSION,
    mode: "visual_designer",
    page: {
      size: "letter",
      orientation: "portrait",
      unit: "px",
      ...PAGE_PRESETS.letter,
      background: theme.backgroundColor,
      margin: 0,
    },
    theme,
    pages: [
      {
        id: "page_1",
        pageNumber: 1,
        background: theme.backgroundColor,
        blocks: [
          createBlock({
            id: "accent_band_1",
            type: "accent_band",
            label: "Accent Band",
            x: 0,
            y: 0,
            width: 816,
            height: 120,
            zIndex: 1,
            style: { backgroundColor: theme.accentColor, borderRadius: 0 },
          }),
          createBlock({
            id: "profile_name_1",
            type: "profile_name",
            linkedSectionType: "name",
            label: "Name",
            text: header.name || "Your Name",
            x: 56,
            y: 42,
            width: 500,
            height: 44,
            zIndex: 2,
            style: { fontSize: 34, fontWeight: 850, color: "#FFFFFF", backgroundColor: "transparent" },
          }),
          createBlock({
            id: "profile_contact_1",
            type: "profile_contact",
            linkedSectionType: "name",
            label: "Contact",
            text: [header.email, header.phone, header.location].filter(Boolean).join(" · ") || "email@example.com · Phone · City, State",
            x: 56,
            y: 88,
            width: 600,
            height: 28,
            zIndex: 2,
            style: { fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.86)", backgroundColor: "transparent" },
          }),
          createBlock({
            id: "sidebar_band_1",
            type: "sidebar_band",
            label: "Sidebar",
            x: 0,
            y: 120,
            width: 210,
            height: 936,
            zIndex: 1,
            style: { backgroundColor: "#F1F5F9", borderRadius: 0 },
          }),
          createBlock({
            id: "skills_1",
            type: "skills_section",
            linkedSectionType: "skills",
            label: "Skills",
            text: skills,
            x: 28,
            y: 168,
            width: 158,
            height: 240,
            zIndex: 3,
            style: { fontSize: 12, fontWeight: 600, color: theme.primaryColor, backgroundColor: "transparent", padding: 0 },
          }),
          createBlock({
            id: "summary_1",
            type: "summary_section",
            linkedSectionType: "summary",
            label: "Summary",
            text: summary,
            x: 256,
            y: 168,
            width: 500,
            height: 140,
            zIndex: 3,
            style: { fontSize: 14, fontWeight: 500, color: theme.primaryColor, backgroundColor: "transparent", padding: 0 },
          }),
          createBlock({
            id: "experience_1",
            type: "experience_section",
            linkedSectionType: "experience",
            label: "Experience",
            text: experienceText,
            x: 256,
            y: 340,
            width: 500,
            height: 360,
            zIndex: 3,
            style: { fontSize: 13, fontWeight: 500, color: theme.primaryColor, backgroundColor: "transparent", padding: 0 },
          }),
          createBlock({
            id: "divider_1",
            type: "divider_line",
            label: "Divider",
            x: 256,
            y: 318,
            width: 500,
            height: 3,
            zIndex: 2,
            style: { backgroundColor: theme.accentColor, borderRadius: 999 },
          }),
        ],
      },
    ],
  };
}