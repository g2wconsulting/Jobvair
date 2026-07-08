import { DEFAULT_TEMPLATE_COLLECTIONS } from "./categories.js";

export const RESUME_TEMPLATE_VERSION = "resume_template_v1";

export const DEFAULT_RESUME_TEMPLATE_CONFIG = {
  version: RESUME_TEMPLATE_VERSION,
  id: "modern",
  source: "system",
  name: "Modern",
  slug: "modern",
  description: "A clean, modern resume template.",
  tier: "free",
  category: "corporate",
  collections: DEFAULT_TEMPLATE_COLLECTIONS,
  audience: [],
  ats_friendly: true,
  is_active: true,
  is_featured: false,
  preview_image_url: "",
  sort_order: 0,
  colors: {
    text: "#1E293B",
    muted: "#64748B",
    accent: "#00BFA5",
    background: "#FFFFFF",
    border: "#E2E8F0",
  },
  typography: {
    font_family: "DM Sans, sans-serif",
    base_font_size: 13,
    line_height: 1.6,
    heading_style: "uppercase",
  },
  layout: {
    page: {
      size: "letter",
      margin: "normal",
      columns: 1,
      section_spacing: "normal",
    },
    header: {
      style: "left",
      contact_separator: "dot",
      show_headline: true,
    },
    body: {
      layout_type: "single_column",
      section_order: ["summary", "skills", "experience", "education", "certifications"],
      two_column_sections: [],
    },
  },
  sections: {
    summary: { heading: "Professional Summary", visible: true },
    skills: { heading: "Skills", visible: true },
    experience: { heading: "Work Experience", visible: true },
    education: { heading: "Education", visible: true },
    certifications: { heading: "Certifications", visible: true },
  },
  preview: {
    mode: "generated",
    sample_profile: "default",
  },
  customization: {
    allow_font: true,
    allow_colors: true,
    allow_spacing: true,
    allow_header_layout: true,
    allow_columns: false,
    locked_fields: [],
  },
};

export function createDefaultResumeTemplateConfig(overrides = {}) {
  return {
    ...DEFAULT_RESUME_TEMPLATE_CONFIG,
    ...overrides,
    colors: {
      ...DEFAULT_RESUME_TEMPLATE_CONFIG.colors,
      ...(overrides.colors || {}),
    },
    typography: {
      ...DEFAULT_RESUME_TEMPLATE_CONFIG.typography,
      ...(overrides.typography || {}),
    },
    layout: {
      ...DEFAULT_RESUME_TEMPLATE_CONFIG.layout,
      ...(overrides.layout || {}),
      page: {
        ...DEFAULT_RESUME_TEMPLATE_CONFIG.layout.page,
        ...(overrides.layout?.page || {}),
      },
      header: {
        ...DEFAULT_RESUME_TEMPLATE_CONFIG.layout.header,
        ...(overrides.layout?.header || {}),
      },
      body: {
        ...DEFAULT_RESUME_TEMPLATE_CONFIG.layout.body,
        ...(overrides.layout?.body || {}),
      },
    },
    sections: {
      ...DEFAULT_RESUME_TEMPLATE_CONFIG.sections,
      ...(overrides.sections || {}),
    },
    preview: {
      ...DEFAULT_RESUME_TEMPLATE_CONFIG.preview,
      ...(overrides.preview || {}),
    },
    customization: {
      ...DEFAULT_RESUME_TEMPLATE_CONFIG.customization,
      ...(overrides.customization || {}),
    },
  };
}
