import { HeaderRenderer } from "./renderers/HeaderRenderer.jsx";
import { SectionHeadingRenderer } from "./renderers/SectionHeadingRenderer.jsx";

const SAMPLE_HEADER = {
  name: "Jordan Smith",
  headline: "Senior Product Manager",
  email: "jordan@email.com",
  phone: "(555) 123-4567",
  location: "Austin, TX",
  show_headline: true,
  show_email: true,
  show_phone: true,
  show_location: true,
};

const SAMPLE_SECTIONS = [
  {
    label: "Professional Summary",
    text: "Results-driven professional with 8+ years leading cross-functional teams and delivering measurable growth.",
  },
  {
    label: "Work Experience",
    text: "Senior Product Manager — Acme Corp\nLed a team of 6 to launch 3 major product lines, increasing revenue by 24%.",
  },
];

const CANVAS_WIDTH = 700;

/**
 * Renders a small, real (not screenshotted) preview of a resume template using
 * the same HeaderRenderer/SectionHeadingRenderer components the actual builder
 * uses, at full size, then scaled down with a CSS transform. This keeps the
 * thumbnail visually identical to what the template really looks like.
 */
export default function TemplateThumbnail({ template, width = 220 }) {
  const accent = template.accent_color || "#00BFA5";
  const fontFamily = template.font_family || "DM Sans, sans-serif";
  const fontSize = template.base_font_size || 13;
  const lineHeight = template.line_height || 1.6;
  const margins = template.page_margin === "tight" ? "20px 24px" : template.page_margin === "wide" ? "30px 36px" : "26px 30px";
  const headerStyle = template.header_style === "sidebar" ? "left" : (template.header_style || "left");
  const scale = width / CANVAS_WIDTH;
  const height = Math.round(width * 11 / 8.5);

  return (
    <div style={{ width, height, overflow: "hidden", background: "#fff", position: "relative" }}>
      <div style={{ width: CANVAS_WIDTH, transform: `scale(${scale})`, transformOrigin: "top left", fontFamily, fontSize, color: "#1E293B", padding: margins, boxSizing: "border-box" }}>
        <HeaderRenderer
          contactFields={SAMPLE_HEADER}
          editing={false}
          tmpl={template}
          effectiveHdrLayout={headerStyle}
          margins={margins}
          accent={accent}
          fontFamily={fontFamily}
          fontSize={fontSize}
          onFieldChange={() => {}}
          onOpenHeaderPanel={() => {}}
        />
        {SAMPLE_SECTIONS.map(s => (
          <div key={s.label} style={{ marginBottom: 16 }}>
            <SectionHeadingRenderer label={s.label} tmpl={template} accent={accent} fontSize={fontSize} />
            <div style={{ fontSize, color: "#334155", lineHeight, whiteSpace: "pre-wrap" }}>{s.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
