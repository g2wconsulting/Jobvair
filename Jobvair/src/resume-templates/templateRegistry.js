import { normalizeResumeTemplate, normalizeResumeTemplates } from "./normalizeResumeTemplate.js";
import { LOCAL_RESUME_TEMPLATE_PRESETS } from "./presets/localResumeTemplatePresets.js";

export const LOCAL_RESUME_TEMPLATES = LOCAL_RESUME_TEMPLATE_PRESETS.map(template => ({
  ...normalizeResumeTemplate(template),
  source: "local",
  is_local: true,
}));

export function mergeResumeTemplates(supabaseTemplateRows = []) {
  const supabaseTemplates = normalizeResumeTemplates(supabaseTemplateRows).map(template => ({
    ...template,
    source: template.source || "supabase",
    is_local: false,
  }));
  const seen = new Set(supabaseTemplates.map(template => template.slug).filter(Boolean));
  const localTemplates = LOCAL_RESUME_TEMPLATES.filter(template => !seen.has(template.slug));

  return [...supabaseTemplates, ...localTemplates].sort((a, b) => {
    const orderA = Number.isFinite(a.sort_order) ? a.sort_order : 999;
    const orderB = Number.isFinite(b.sort_order) ? b.sort_order : 999;
    return orderA - orderB || String(a.name || "").localeCompare(String(b.name || ""));
  });
}

export function findResumeTemplateBySlug(templates = [], slug) {
  if (!slug) return null;
  return templates.find(template => template.slug === slug) || null;
}

export function getPersistableTemplateId(template) {
  return template?.is_local ? null : template?.id || null;
}