import { createDefaultResumeTemplateConfig, RESUME_TEMPLATE_VERSION } from "./templateDefaults.js";

function parseConfig(templateRow) {
  const raw = templateRow?.template_config_json || templateRow?.config_json || templateRow?.config;
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  if (typeof raw !== "string") return {};

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function normalizeCollections(templateRow, config) {
  const collections = templateRow?.collections || templateRow?.template_collections || config.collections;
  if (Array.isArray(collections)) return collections.filter(Boolean);
  if (typeof collections === "string") return collections.split(",").map(item => item.trim()).filter(Boolean);
  return undefined;
}

export function normalizeResumeTemplate(templateRow = null) {
  const config = parseConfig(templateRow);
  const accentColor = templateRow?.accent_color || templateRow?.color || config.colors?.accent;
  const normalized = createDefaultResumeTemplateConfig({
    ...config,
    version: config.version || RESUME_TEMPLATE_VERSION,
    id: templateRow?.id || config.id || templateRow?.slug,
    name: templateRow?.name || config.name,
    slug: templateRow?.slug || config.slug,
    description: templateRow?.description || config.description,
    tier: templateRow?.tier || config.tier,
    category: templateRow?.category || config.category,
    collections: normalizeCollections(templateRow, config) || config.collections,
    ats_friendly: templateRow?.ats_friendly ?? config.ats_friendly,
    is_active: templateRow?.is_active ?? config.is_active,
    is_featured: templateRow?.is_featured ?? config.is_featured,
    preview_image_url: templateRow?.preview_image_url || config.preview_image_url,
    sort_order: templateRow?.sort_order ?? config.sort_order,
    colors: {
      ...config.colors,
      accent: accentColor,
    },
    typography: {
      ...config.typography,
      font_family: templateRow?.font_family || config.typography?.font_family,
      base_font_size: templateRow?.base_font_size || config.typography?.base_font_size,
      heading_style: templateRow?.heading_style || config.typography?.heading_style,
    },
    layout: {
      ...config.layout,
      page: {
        ...config.layout?.page,
        margin: templateRow?.page_margin || config.layout?.page?.margin,
        section_spacing: templateRow?.section_spacing || config.layout?.page?.section_spacing,
      },
      header: {
        ...config.layout?.header,
        style: templateRow?.header_style || config.layout?.header?.style,
      },
      body: {
        ...config.layout?.body,
        layout_type: templateRow?.layout_type || config.layout?.body?.layout_type,
      },
    },
  });

  // Legacy aliases preserve the current BuilderPage/ResumesPage rendering contract.
  return {
    ...templateRow,
    ...normalized,
    font_family: normalized.typography.font_family,
    base_font_size: normalized.typography.base_font_size,
    heading_style: normalized.typography.heading_style,
    header_style: normalized.layout.header.style,
    layout_type: normalized.layout.body.layout_type,
    page_margin: normalized.layout.page.margin,
    section_spacing: normalized.layout.page.section_spacing,
    accent_color: normalized.colors.accent,
    color: templateRow?.color || normalized.colors.accent,
    template_config: normalized,
  };
}

export function normalizeResumeTemplates(templateRows = []) {
  return (templateRows || []).map(normalizeResumeTemplate);
}
