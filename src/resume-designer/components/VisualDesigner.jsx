import { useEffect, useMemo, useRef, useState } from "react";
import { createBlock, createDefaultDesign } from "../designDefaults.js";

const C = {
  navy: "#0F172A",
  slate: "#334155",
  muted: "#64748B",
  light: "#E2E8F0",
  bg: "#E8EEF4",
  card: "#FFFFFF",
  teal: "#00BFA5",
  tealLight: "#E6FFFB",
};

const FONT_OPTIONS = [
  "Inter, sans-serif",
  "DM Sans, sans-serif",
  "Montserrat, sans-serif",
  "Lato, sans-serif",
  "Nunito, sans-serif",
  "Arial, sans-serif",
  "Georgia, serif",
];

function getPage(design) {
  return design.pages[0];
}

function createBlankPage(pageNumber, design) {
  return {
    id: `page_${pageNumber}`,
    pageNumber,
    background: design.theme?.backgroundColor || "#FFFFFF",
    blocks: [],
  };
}

function getBlocks(design) {
  return design.pages.flatMap(page => (page.blocks || []).map(block => ({ ...block, pageId: page.id })));
}

function updateBlockInDesign(design, blockId, updater) {
  return {
    ...design,
    pages: design.pages.map(page => ({
      ...page,
      blocks: page.blocks.map(block => block.id === blockId ? updater(block, page) : block),
    })),
  };
}

function moveBlockInDesign(design, blockId, x, y) {
  const pageHeight = design.page.height;
  const pageWidth = design.page.width;
  let pages = design.pages.map(page => ({ ...page, blocks: [...page.blocks] }));
  let sourcePageIndex = pages.findIndex(page => page.blocks.some(block => block.id === blockId));
  if (sourcePageIndex < 0) return design;

  const sourcePage = pages[sourcePageIndex];
  const blockIndex = sourcePage.blocks.findIndex(block => block.id === blockId);
  const block = sourcePage.blocks[blockIndex];
  let targetPageIndex = sourcePageIndex;
  let nextY = y;

  if (y + block.height > pageHeight - 24) {
    targetPageIndex = sourcePageIndex + 1;
    nextY = 40;
  } else if (y < 0 && sourcePageIndex > 0) {
    targetPageIndex = sourcePageIndex - 1;
    nextY = pageHeight - block.height - 40;
  }

  while (targetPageIndex >= pages.length) {
    pages.push(createBlankPage(pages.length + 1, design));
  }

  const movedBlock = {
    ...block,
    pageId: pages[targetPageIndex].id,
    x: Math.max(0, Math.min(x, pageWidth - Math.min(block.width, pageWidth))),
    y: Math.max(0, Math.min(nextY, pageHeight - Math.min(block.height, pageHeight))),
  };

  pages[sourcePageIndex].blocks.splice(blockIndex, 1);
  pages[targetPageIndex].blocks.push(movedBlock);

  return {
    ...design,
    pages,
  };
}

function addBlockToDesign(design, block) {
  const targetPageId = block.pageId || design.pages[0]?.id || "page_1";
  return {
    ...design,
    pages: design.pages.map(page => page.id === targetPageId ? {
      ...page,
      blocks: [...page.blocks, { ...block, pageId: targetPageId }],
    } : page),
  };
}

function CanvasBlock({ block, selected, zoom, onSelect, onMove }) {
  const dragRef = useRef(null);
  const isShape = ["accent_band", "sidebar_band", "shape_box", "divider_line"].includes(block.type);

  const onPointerDown = event => {
    if (block.locked) return;
    event.preventDefault();
    event.stopPropagation();
    onSelect(block.id);
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originalX: block.x,
      originalY: block.y,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = event => {
    if (!dragRef.current) return;
    const dx = (event.clientX - dragRef.current.startX) / zoom;
    const dy = (event.clientY - dragRef.current.startY) / zoom;
    onMove(block.id, dragRef.current.originalX + dx, dragRef.current.originalY + dy);
  };

  const endDrag = event => {
    dragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      style={{
        position: "absolute",
        left: block.x,
        top: block.y,
        width: block.width,
        height: block.height,
        zIndex: block.zIndex,
        cursor: block.locked ? "default" : "grab",
        outline: selected ? `2px solid ${C.teal}` : "1px solid transparent",
        outlineOffset: selected ? 2 : 0,
        borderRadius: Math.max(2, block.style.borderRadius || 0),
        userSelect: "none",
      }}
      title="Drag to move"
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          boxSizing: "border-box",
          overflow: "hidden",
          whiteSpace: isShape ? "normal" : "pre-wrap",
          overflowWrap: "break-word",
          wordBreak: "break-word",
          fontFamily: block.style.fontFamily,
          fontSize: block.style.fontSize,
          fontWeight: block.style.fontWeight,
          color: block.style.color,
          background: block.style.backgroundColor,
          border: `${block.style.borderWidth || 0}px solid ${block.style.borderColor || "transparent"}`,
          borderRadius: block.style.borderRadius,
          padding: block.style.padding,
          textAlign: block.style.textAlign,
          lineHeight: 1.45,
        }}
      >
        {isShape ? null : block.content.text}
      </div>
      {selected && (
        <div style={{ position:"absolute", top:-24, left:0, background:C.teal, color:"#fff", fontSize:10, fontWeight:800, borderRadius:999, padding:"3px 8px", whiteSpace:"nowrap" }}>
          {block.label}
        </div>
      )}
    </div>
  );
}

function Inspector({ block, onStyleChange, onTextChange }) {
  if (!block) {
    return (
      <div style={{ padding:16, color:C.muted, fontSize:12, lineHeight:1.5 }}>
        Select a block on the canvas to edit its position, font, color, and box styling.
      </div>
    );
  }

  const controlLabel = { fontSize:11, fontWeight:800, color:C.navy, marginBottom:5 };
  const input = { width:"100%", boxSizing:"border-box", border:`1px solid ${C.light}`, borderRadius:8, padding:"7px 8px", fontSize:12, fontFamily:"inherit" };

  return (
    <div style={{ padding:16, display:"flex", flexDirection:"column", gap:12 }}>
      <div>
        <div style={{ fontSize:13, fontWeight:900, color:C.navy }}>{block.label}</div>
        <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{block.type}</div>
      </div>

      {!block.type.includes("band") && block.type !== "divider_line" && (
        <div>
          <div style={controlLabel}>Text</div>
          <textarea value={block.content.text || ""} onChange={e=>onTextChange(e.target.value)} rows={5} style={{ ...input, resize:"vertical", lineHeight:1.45 }} />
        </div>
      )}

      <div>
        <div style={controlLabel}>Font</div>
        <select value={block.style.fontFamily} onChange={e=>onStyleChange("fontFamily", e.target.value)} style={input}>
          {FONT_OPTIONS.map(font => <option key={font} value={font}>{font.split(",")[0]}</option>)}
        </select>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        <div>
          <div style={controlLabel}>Size</div>
          <input type="number" value={block.style.fontSize || 14} onChange={e=>onStyleChange("fontSize", Number(e.target.value))} style={input} />
        </div>
        <div>
          <div style={controlLabel}>Weight</div>
          <input type="number" step="50" value={block.style.fontWeight || 500} onChange={e=>onStyleChange("fontWeight", Number(e.target.value))} style={input} />
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        <div>
          <div style={controlLabel}>Text</div>
          <input type="color" value={block.style.color || "#0F172A"} onChange={e=>onStyleChange("color", e.target.value)} style={{ ...input, height:36, padding:3 }} />
        </div>
        <div>
          <div style={controlLabel}>Box</div>
          <input type="color" value={block.style.backgroundColor === "transparent" ? "#FFFFFF" : block.style.backgroundColor} onChange={e=>onStyleChange("backgroundColor", e.target.value)} style={{ ...input, height:36, padding:3 }} />
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        <div>
          <div style={controlLabel}>Border</div>
          <input type="color" value={block.style.borderColor === "transparent" ? "#E2E8F0" : block.style.borderColor} onChange={e=>onStyleChange("borderColor", e.target.value)} style={{ ...input, height:36, padding:3 }} />
        </div>
        <div>
          <div style={controlLabel}>Radius</div>
          <input type="number" value={block.style.borderRadius || 0} onChange={e=>onStyleChange("borderRadius", Number(e.target.value))} style={input} />
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        <div>
          <div style={controlLabel}>X</div>
          <input type="number" value={Math.round(block.x)} readOnly style={{ ...input, background:"#F8FAFC" }} />
        </div>
        <div>
          <div style={controlLabel}>Y</div>
          <input type="number" value={Math.round(block.y)} readOnly style={{ ...input, background:"#F8FAFC" }} />
        </div>
      </div>
    </div>
  );
}

export function VisualDesigner({ headerConfig, sections, jobEntries }) {
  const [design, setDesign] = useState(() => createDefaultDesign({ header: headerConfig, sections: sections || [], jobs: jobEntries || [] }));
  const [selectedBlockId, setSelectedBlockId] = useState("profile_name_1");
  const [zoom, setZoom] = useState(0.72);
  const canvasRef = useRef(null);
  const [fitZoom, setFitZoom] = useState(0.72);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the prototype's local design state whenever the structured builder's data changes upstream
    setDesign(createDefaultDesign({ header: headerConfig, sections: sections || [], jobs: jobEntries || [] }));
    setSelectedBlockId("profile_name_1");
  }, [headerConfig, sections, jobEntries]);

  useEffect(() => {
    const node = canvasRef.current;
    if (!node) return undefined;

    const updateFitZoom = () => {
      const availableWidth = node.clientWidth - 48;
      const nextZoom = Math.max(0.45, Math.min(0.82, availableWidth / 816));
      setFitZoom(Number(nextZoom.toFixed(2)));
    };

    updateFitZoom();
    const resizeObserver = new ResizeObserver(updateFitZoom);
    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, []);

  const page = getPage(design);
  const pages = design.pages;
  const blocks = useMemo(() => getBlocks(design).filter(block => block.visible !== false).sort((a, b) => a.zIndex - b.zIndex), [design]);
  const selectedBlock = blocks.find(block => block.id === selectedBlockId) || null;
  const displayZoom = Math.min(zoom, fitZoom);

  const moveBlock = (blockId, x, y) => {
    setDesign(current => moveBlockInDesign(current, blockId, x, y));
  };

  const updateSelectedStyle = (key, value) => {
    if (!selectedBlockId) return;
    setDesign(current => updateBlockInDesign(current, selectedBlockId, block => ({
      ...block,
      style: { ...block.style, [key]: value },
    })));
  };

  const updateSelectedText = value => {
    if (!selectedBlockId) return;
    setDesign(current => updateBlockInDesign(current, selectedBlockId, block => ({
      ...block,
      content: { ...block.content, text: value },
    })));
  };

  const addTextBox = () => {
    const block = createBlock({
      id: `text_box_${Date.now()}`,
      type: "text_box",
      label: "Text Box",
      text: "New text block",
      x: 300,
      y: 760,
      width: 240,
      height: 90,
      zIndex: blocks.length + 2,
      style: { fontSize: 14, color: C.navy, backgroundColor: "#FFFFFF", borderColor: C.light, borderWidth: 1, borderRadius: 8, padding: 10 },
    });
    setDesign(current => addBlockToDesign(current, block));
    setSelectedBlockId(block.id);
  };

  const addShape = () => {
    const block = createBlock({
      id: `shape_box_${Date.now()}`,
      type: "shape_box",
      label: "Color Box",
      x: 560,
      y: 760,
      width: 150,
      height: 90,
      zIndex: blocks.length + 2,
      style: { backgroundColor: "#E6FFFB", borderColor: C.teal, borderWidth: 1, borderRadius: 14 },
    });
    setDesign(current => addBlockToDesign(current, block));
    setSelectedBlockId(block.id);
  };

  return (
    <div style={{ display:"flex", flex:1, minWidth:0, maxWidth:"100%", overflow:"hidden", background:"#DDE7F0" }}>
      <aside style={{ width:200, flexShrink:0, background:"#fff", borderRight:`1px solid ${C.light}`, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:14, borderBottom:`1px solid ${C.light}` }}>
          <div style={{ fontSize:13, fontWeight:900, color:C.navy }}>Visual Designer</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:3, lineHeight:1.4 }}>Local prototype. Drag blocks on the page.</div>
        </div>
        <div style={{ padding:12, display:"grid", gap:8, borderBottom:`1px solid ${C.light}` }}>
          <button onClick={addTextBox} style={{ border:`1px solid ${C.light}`, background:C.tealLight, color:C.navy, borderRadius:8, padding:"8px 10px", fontSize:12, fontWeight:800, cursor:"pointer" }}>+ Text Box</button>
          <button onClick={addShape} style={{ border:`1px solid ${C.light}`, background:"#F8FAFC", color:C.navy, borderRadius:8, padding:"8px 10px", fontSize:12, fontWeight:800, cursor:"pointer" }}>+ Color Box</button>
        </div>
        <div style={{ padding:12, overflowY:"auto", flex:1 }}>
          <div style={{ fontSize:11, color:C.muted, fontWeight:900, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Layers</div>
          {blocks.slice().reverse().map(block => (
            <button key={block.id} onClick={()=>setSelectedBlockId(block.id)} style={{ width:"100%", textAlign:"left", border:`1px solid ${selectedBlockId === block.id ? C.teal : C.light}`, background:selectedBlockId === block.id ? C.tealLight : "#fff", borderRadius:8, padding:"8px 9px", marginBottom:6, cursor:"pointer", fontFamily:"inherit" }}>
              <div style={{ fontSize:12, fontWeight:800, color:C.navy, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{block.label}</div>
              <div style={{ fontSize:10, color:C.muted }}>{block.type}</div>
            </button>
          ))}
        </div>
      </aside>

      <main ref={canvasRef} style={{ flex:1, minWidth:0, overflowY:"auto", overflowX:"hidden", display:"flex", flexDirection:"column", alignItems:"center", padding:"18px clamp(12px, 2vw, 24px)", boxSizing:"border-box", background:"linear-gradient(180deg, #E8EEF4 0%, #DDE7F0 100%)" }} onClick={e=>{ if(e.target === e.currentTarget) setSelectedBlockId(null); }}>
        <div style={{ width:"min(100%, 760px)", boxSizing:"border-box", marginBottom:12, padding:"10px 14px", borderRadius:12, border:`1px solid ${C.light}`, background:"#FFFFFF", color:C.slate, fontSize:12, lineHeight:1.45, boxShadow:"0 8px 24px rgba(15,23,42,0.08)" }}>
          <strong style={{ color:C.navy }}>Visual Designer is a prototype.</strong> Changes are local only. Use Structured mode for resume content editing, saving, exporting, and reliable formatting.
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14, color:C.slate, fontSize:12, background:"rgba(255,255,255,0.82)", border:`1px solid ${C.light}`, borderRadius:999, padding:"6px 10px" }}>
          <span>Zoom</span>
          {[0.62, 0.72, 0.85, 1].map(value => (
            <button key={value} onClick={()=>setZoom(value)} style={{ border:`1px solid ${zoom === value ? C.teal : C.light}`, background:zoom === value ? C.tealLight : "#fff", borderRadius:999, padding:"4px 9px", fontSize:11, fontWeight:800, cursor:"pointer" }}>{Math.round(Math.min(value, fitZoom) * 100)}%</button>
          ))}
        </div>
        <div style={{ width:"100%", minWidth:0, height:(page.height * pages.length + 56 * Math.max(0, pages.length - 1)) * displayZoom + 24, display:"flex", justifyContent:"center", alignItems:"flex-start" }}>
          <div style={{ transform:`scale(${displayZoom})`, transformOrigin:"top center", width:page.width, position:"relative", display:"flex", flexDirection:"column", gap:56 }}>
            {pages.map(currentPage => {
              const pageBlocks = blocks.filter(block => block.pageId === currentPage.id);
              return (
                <div key={currentPage.id} style={{ position:"relative", width:page.width, height:page.height }}>
                  <div style={{ position:"absolute", top:-26, left:0, fontSize:10, fontWeight:800, color:C.muted, letterSpacing:"0.08em", textTransform:"uppercase" }}>Page {currentPage.pageNumber}</div>
                  <div style={{ position:"relative", width:page.width, height:page.height, background:currentPage.background || "#FFFFFF", border:"1px solid #CBD5E1", boxShadow:"0 18px 60px rgba(15,23,42,0.24)", overflow:"hidden" }}>
                    {pageBlocks.map(block => (
                      <CanvasBlock key={block.id} block={block} selected={selectedBlockId === block.id} zoom={displayZoom} onSelect={setSelectedBlockId} onMove={moveBlock} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <aside style={{ width:260, flexShrink:0, background:"#fff", borderLeft:`1px solid ${C.light}`, overflowY:"auto", overflowX:"hidden" }}>
        <Inspector block={selectedBlock} onStyleChange={updateSelectedStyle} onTextChange={updateSelectedText} />
      </aside>
    </div>
  );
}
