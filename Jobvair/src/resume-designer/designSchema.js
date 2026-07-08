export const DESIGN_BLOCK_TYPES = [
  "profile_name",
  "profile_headline",
  "profile_contact",
  "summary_section",
  "skills_section",
  "experience_section",
  "education_section",
  "certifications_section",
  "custom_section",
  "text_box",
  "shape_box",
  "divider_line",
  "accent_band",
  "sidebar_band",
];

export function isDesignDocument(value) {
  return Boolean(value && value.version === "resume_design_v1" && Array.isArray(value.pages));
}

export function clampBlockToPage(block, page) {
  return {
    ...block,
    x: Math.max(0, Math.min(block.x, page.width - Math.min(block.width, page.width))),
    y: Math.max(0, Math.min(block.y, page.height - Math.min(block.height, page.height))),
  };
}