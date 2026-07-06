import { HeaderRenderer } from "./HeaderRenderer.jsx";
import { SectionHeadingRenderer } from "./SectionHeadingRenderer.jsx";

export function ResumeTemplateRenderer({ contactFields, sections, tmpl, style = {} }) {
  const visible = [...sections]
    .filter(s => s.is_visible && s.section_type !== "name")
    .sort((a, b) => a.display_order - b.display_order);

  const margins = { tight: "24px 28px", normal: "32px 40px", wide: "40px 56px" }[tmpl.page_margin] || "32px 40px";
  const sectionGap = { compact: 12, normal: 18, spacious: 26 }[tmpl.section_spacing] || 18;
  const fontSize = tmpl.base_font_size || 13;

  return (
    <div style={{
      background:"#fff", fontFamily: tmpl.font_family || "DM Sans, sans-serif",
      fontSize: fontSize, color:"#1E293B", lineHeight:1.6,
      padding: margins, boxShadow:"0 4px 32px rgba(0,0,0,0.12)",
      width:"100%", minHeight:800, boxSizing:"border-box",
      ...style,
    }}>
      <HeaderRenderer
        contactFields={contactFields}
        tmpl={tmpl}
        effectiveHdrLayout={tmpl.header_style}
        margins={margins}
        accent={tmpl.accent_color}
        fontFamily={tmpl.font_family || "DM Sans, sans-serif"}
        fontSize={fontSize}
      />
      {visible.map(s => (
        <div key={s.section_type || s.id} style={{ marginBottom: sectionGap }}>
          <SectionHeadingRenderer label={s.label} tmpl={tmpl} accent={tmpl.accent_color} fontSize={fontSize} mode="document" />
          <div style={{ fontSize, color:"#334155", lineHeight:1.65, whiteSpace:"pre-wrap" }}>
            {s.content?.text || ""}
          </div>
        </div>
      ))}
    </div>
  );
}
