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

function estimateTextBlockHeight(text, width, fontSize) {
  const charsPerLine = Math.max(24, Math.floor(width / (fontSize * 0.56)));
  const lineCount = String(text || "").split("\n").reduce((total, line) => total + Math.max(1, Math.ceil(line.length / charsPerLine)), 0);
  return Math.ceil(lineCount * fontSize * 1.55) + 18;
}

function sectionLabel(overrides) {
  return createBlock({
    type: "section_label",
    height: 22,
    zIndex: 4,
    style: {
      fontSize: 11,
      fontWeight: 850,
      letterSpacing: "0.12em",
      color: overrides.accentColor || DEFAULT_DESIGN_THEME.accentColor,
      backgroundColor: "transparent",
      padding: 0,
    },
    ...overrides,
  });
}

function divider(overrides) {
  return createBlock({
    type: "divider_line",
    height: 2,
    zIndex: 2,
    style: {
      backgroundColor: overrides.accentColor || DEFAULT_DESIGN_THEME.accentColor,
      borderRadius: 999,
    },
    ...overrides,
  });
}

export function createDefaultDesign({ header = {}, sections = [], jobs = [], theme = DEFAULT_DESIGN_THEME } = {}) {
  const accent = theme.accentColor || DEFAULT_DESIGN_THEME.accentColor;
  const summary = sections.find(section => section.section_type === "summary")?.content?.text || "Add a concise career summary that explains your target role, strengths, and career direction.";
  const skills = sections.find(section => section.section_type === "skills")?.content?.text || "Add your strongest skills, tools, certifications, and industry keywords.";
  const experienceText = jobs.length
    ? jobs.map(job => `${job.job_title || "Role"} - ${job.company || "Company"}\n${job.description || "Add role highlights."}`).join("\n\n")
    : sections.find(section => section.section_type === "experience")?.content?.text || "Add work experience highlights with measurable impact.";
  const experienceHeight = Math.max(360, estimateTextBlockHeight(experienceText, 536, 13));
  const experienceStartsOnPageTwo = 370 + experienceHeight > PAGE_PRESETS.letter.height - 56;

  const pageOneBlocks = [
    createBlock({
      id: "header_background_1",
      type: "shape_box",
      label: "Header Background",
      x: 40,
      y: 36,
      width: 736,
      height: 110,
      zIndex: 1,
      style: { backgroundColor: "#0F172A", borderRadius: 20 },
    }),
    createBlock({
      id: "header_accent_1",
      type: "accent_band",
      label: "Header Accent",
      x: 40,
      y: 36,
      width: 12,
      height: 110,
      zIndex: 2,
      style: { backgroundColor: accent, borderRadius: "20px 0 0 20px" },
    }),
    createBlock({
      id: "profile_name_1",
      type: "profile_name",
      linkedSectionType: "name",
      label: "Name",
      text: header.name || "Your Name",
      x: 72,
      y: 62,
      width: 470,
      height: 42,
      zIndex: 3,
      style: { fontSize: 32, fontWeight: 850, color: "#FFFFFF", backgroundColor: "transparent" },
    }),
    createBlock({
      id: "profile_contact_1",
      type: "profile_contact",
      linkedSectionType: "name",
      label: "Contact",
      text: [header.email, header.phone, header.location].filter(Boolean).join(" | ") || "email@example.com | Phone | City, State",
      x: 72,
      y: 106,
      width: 640,
      height: 24,
      zIndex: 3,
      style: { fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.84)", backgroundColor: "transparent" },
    }),
    createBlock({
      id: "sidebar_panel_1",
      type: "shape_box",
      label: "Sidebar Panel",
      x: 40,
      y: 170,
      width: 158,
      height: 800,
      zIndex: 1,
      style: { backgroundColor: "#F8FAFC", borderColor: "#E2E8F0", borderWidth: 1, borderRadius: 18 },
    }),
    sectionLabel({
      id: "skills_label_1",
      label: "Skills Label",
      text: "SKILLS",
      x: 64,
      y: 202,
      width: 110,
      accentColor: accent,
    }),
    divider({
      id: "skills_rule_1",
      label: "Skills Rule",
      x: 64,
      y: 232,
      width: 86,
      accentColor: accent,
    }),
    createBlock({
      id: "skills_1",
      type: "skills_section",
      linkedSectionType: "skills",
      label: "Skills",
      text: skills,
      x: 64,
      y: 252,
      width: 104,
      height: 300,
      zIndex: 3,
      style: { fontSize: 11, fontWeight: 600, color: theme.primaryColor, lineHeight: 1.55, backgroundColor: "transparent", padding: 0 },
    }),
    sectionLabel({
      id: "summary_label_1",
      label: "Summary Label",
      text: "SUMMARY",
      x: 228,
      y: 174,
      width: 520,
      accentColor: accent,
    }),
    divider({
      id: "summary_rule_1",
      label: "Summary Rule",
      x: 228,
      y: 204,
      width: 528,
      accentColor: accent,
    }),
    createBlock({
      id: "summary_1",
      type: "summary_section",
      linkedSectionType: "summary",
      label: "Summary",
      text: summary,
      x: 228,
      y: 224,
      width: 528,
      height: 96,
      zIndex: 3,
      style: { fontSize: 14, fontWeight: 500, color: theme.primaryColor, lineHeight: 1.6, backgroundColor: "transparent", padding: 0 },
    }),
    sectionLabel({
      id: "experience_label_1",
      label: "Experience Label",
      text: "EXPERIENCE",
      x: 228,
      y: 348,
      width: 520,
      accentColor: accent,
    }),
    divider({
      id: "experience_rule_1",
      label: "Experience Rule",
      x: 228,
      y: 378,
      width: 528,
      accentColor: accent,
    }),
    createBlock({
      id: "experience_1",
      type: "experience_section",
      pageId: experienceStartsOnPageTwo ? "page_2" : "page_1",
      linkedSectionType: "experience",
      label: "Experience",
      text: experienceText,
      x: experienceStartsOnPageTwo ? 56 : 228,
      y: experienceStartsOnPageTwo ? 112 : 398,
      width: experienceStartsOnPageTwo ? 704 : 528,
      height: Math.min(experienceHeight, PAGE_PRESETS.letter.height - 168),
      zIndex: 3,
      style: { fontSize: 13, fontWeight: 500, color: theme.primaryColor, lineHeight: 1.58, backgroundColor: "transparent", padding: 0 },
    }),
  ].filter(block => block.pageId !== "page_2");

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
        blocks: pageOneBlocks,
      },
      ...(experienceStartsOnPageTwo ? [{
        id: "page_2",
        pageNumber: 2,
        background: theme.backgroundColor,
        blocks: [
          sectionLabel({
            id: "experience_label_2",
            pageId: "page_2",
            label: "Experience Label",
            text: "EXPERIENCE",
            x: 56,
            y: 56,
            width: 704,
            accentColor: accent,
          }),
          divider({
            id: "experience_rule_2",
            pageId: "page_2",
            label: "Experience Rule",
            x: 56,
            y: 86,
            width: 704,
            accentColor: accent,
          }),
          createBlock({
            id: "experience_1",
            type: "experience_section",
            pageId: "page_2",
            linkedSectionType: "experience",
            label: "Experience",
            text: experienceText,
            x: 56,
            y: 112,
            width: 704,
            height: Math.min(experienceHeight, PAGE_PRESETS.letter.height - 168),
            zIndex: 3,
            style: { fontSize: 13, fontWeight: 500, color: theme.primaryColor, lineHeight: 1.58, backgroundColor: "transparent", padding: 0 },
          }),
        ],
      }] : []),
    ],
  };
}
