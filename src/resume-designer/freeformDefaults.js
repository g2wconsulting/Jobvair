// Free Build canvas: a flat, independent element model (distinct from the
// structured/Templates design-block model in designDefaults.js). Elements
// here are simple absolutely-positioned shapes/text with no link back to
// resume content — this is a blank creative canvas, not a resume renderer.

export const CANVAS_WIDTH = 680;
export const CANVAS_HEIGHT = 960;

export const FILL_SWATCHES = [
  "#0F172A", "#334155", "#64748B", "#94A3B8", "#CBD5E1", "#F1F5F9", "#FFFFFF",
  "#00BFA5", "#009688", "#0EA5E9", "#2563EB", "#4F46E5", "#7C3AED", "#DB2777",
  "#DC2626", "#EA580C", "#D97706", "#CA8A04", "#65A30D", "#059669",
];

export const ELEMENT_PALETTE = [
  { type: "heading", label: "Name / Heading", description: "Large display text" },
  { type: "subheading", label: "Subheading", description: "Section title" },
  { type: "text_block", label: "Text Block", description: "Body copy or bullets" },
  { type: "color_block", label: "Color Block", description: "Solid background shape" },
  { type: "divider", label: "Divider", description: "Horizontal rule / accent line" },
  { type: "vertical_line", label: "Vertical Line", description: "Column separator" },
  { type: "skill_bar", label: "Skill Bar", description: "Labeled proficiency bar" },
  { type: "tag_pill", label: "Tag / Pill", description: "Skill chip or badge" },
  { type: "photo_placeholder", label: "Photo / Logo", description: "Image placeholder" },
  { type: "circle_shape", label: "Circle Shape", description: "Decorative dot or ring" },
];

const TEXT_TYPES = new Set(["heading", "subheading", "text_block", "tag_pill", "skill_bar"]);
const SHAPE_TYPES = new Set(["color_block", "divider", "vertical_line", "photo_placeholder", "circle_shape"]);

export function isTextElement(type) {
  return TEXT_TYPES.has(type);
}

export function isShapeElement(type) {
  return SHAPE_TYPES.has(type);
}

const TYPE_DEFAULTS = {
  heading: { w: 300, h: 46, fontSize: 28, fontWeight: 800, textAlign: "left", textColor: "#0F172A", fill: "transparent", text: "Heading" },
  subheading: { w: 260, h: 30, fontSize: 16, fontWeight: 700, textAlign: "left", textColor: "#334155", fill: "transparent", text: "Subheading" },
  text_block: { w: 260, h: 90, fontSize: 13, fontWeight: 400, textAlign: "left", textColor: "#334155", fill: "transparent", text: "Body copy goes here. Click to edit this text block." },
  color_block: { w: 160, h: 90, fill: "#00BFA5", borderRadius: 10 },
  divider: { w: 220, h: 3, fill: "#00BFA5", borderRadius: 999 },
  vertical_line: { w: 3, h: 160, fill: "#CBD5E1", borderRadius: 999 },
  skill_bar: { w: 200, h: 30, fill: "#00BFA5", textColor: "#0F172A", fontSize: 12, fontWeight: 650, skillValue: 70, skillLabel: "Skill", borderRadius: 999 },
  tag_pill: { w: 90, h: 28, fill: "#E6FFFB", textColor: "#009688", fontSize: 12, fontWeight: 700, textAlign: "center", borderRadius: 999, text: "Tag" },
  photo_placeholder: { w: 120, h: 120, fill: "#F1F5F9", borderRadius: 12 },
  circle_shape: { w: 80, h: 80, fill: "#00BFA5", borderRadius: 999 },
};

let idCounter = 0;
function nextId(type) {
  idCounter += 1;
  return `${type}_${Date.now()}_${idCounter}`;
}

export function createFreeformElement(type, overrides = {}) {
  const defaults = TYPE_DEFAULTS[type] || TYPE_DEFAULTS.text_block;
  return {
    id: nextId(type),
    type,
    x: 40,
    y: 40,
    w: defaults.w,
    h: defaults.h,
    rotation: 0,
    zIndex: 1,
    opacity: 1,
    fill: defaults.fill ?? "#00BFA5",
    textColor: defaults.textColor ?? "#0F172A",
    text: defaults.text ?? "",
    fontFamily: "DM Sans, sans-serif",
    fontSize: defaults.fontSize ?? 14,
    fontWeight: defaults.fontWeight ?? 500,
    textAlign: defaults.textAlign ?? "left",
    borderRadius: defaults.borderRadius ?? 0,
    skillValue: defaults.skillValue,
    skillLabel: defaults.skillLabel,
    ...overrides,
  };
}

export function clampToCanvas(el) {
  return {
    ...el,
    x: Math.max(0, Math.min(el.x, CANVAS_WIDTH - Math.min(el.w, CANVAS_WIDTH))),
    y: Math.max(0, Math.min(el.y, CANVAS_HEIGHT - Math.min(el.h, CANVAS_HEIGHT))),
  };
}
