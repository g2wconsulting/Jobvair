import { useRef, useState } from "react";
import { FONT_PRESETS } from "../../constants/appConstants.js";
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, FILL_SWATCHES, ELEMENT_PALETTE,
  isTextElement, isShapeElement, createFreeformElement, clampToCanvas,
} from "../freeformDefaults.js";
import {
  Type, Heading1, AlignLeft, Square, Minus, GripVertical,
  BarChart3, Tag, ImageIcon, Circle, Grid3x3, Copy, Trash2,
  ChevronUp, ChevronDown, AlignCenter, AlignRight,
} from "lucide-react";

const PALETTE_ICONS = {
  heading: Heading1, subheading: Type, text_block: AlignLeft, color_block: Square,
  divider: Minus, vertical_line: GripVertical, skill_bar: BarChart3, tag_pill: Tag,
  photo_placeholder: ImageIcon, circle_shape: Circle,
};

const HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
const HANDLE_CURSOR = { nw: "nwse-resize", n: "ns-resize", ne: "nesw-resize", e: "ew-resize", se: "nwse-resize", s: "ns-resize", sw: "nesw-resize", w: "ew-resize" };
const MIN_SIZE = 16;

function resizeElement(el, handle, dx, dy) {
  let { x, y, w, h } = el;
  if (handle.includes("n")) { const newH = h - dy; if (newH >= MIN_SIZE) { y += dy; h = newH; } }
  if (handle.includes("s")) { h = Math.max(MIN_SIZE, h + dy); }
  if (handle.includes("w")) { const newW = w - dx; if (newW >= MIN_SIZE) { x += dx; w = newW; } }
  if (handle.includes("e")) { w = Math.max(MIN_SIZE, w + dx); }
  return { ...el, x, y, w, h };
}

function ResizeHandle({ handle, onResizeStart }) {
  const pos = {
    nw: { top: -5, left: -5 }, n: { top: -5, left: "50%", marginLeft: -5 }, ne: { top: -5, right: -5 },
    e: { top: "50%", right: -5, marginTop: -5 }, se: { bottom: -5, right: -5 }, s: { bottom: -5, left: "50%", marginLeft: -5 },
    sw: { bottom: -5, left: -5 }, w: { top: "50%", left: -5, marginTop: -5 },
  }[handle];
  return (
    <div
      onPointerDown={e => onResizeStart(e, handle)}
      style={{
        position: "absolute", width: 10, height: 10, borderRadius: "50%",
        background: "#fff", border: "2px solid #00BFA5", cursor: HANDLE_CURSOR[handle],
        zIndex: 1000, ...pos,
      }}
    />
  );
}

function CanvasElement({ el, selected, zoom, onSelect, onMove, onResize, onTextChange }) {
  const dragRef = useRef(null);
  const resizeRef = useRef(null);
  const [editing, setEditing] = useState(false);

  const onPointerDown = e => {
    if (editing) return;
    e.preventDefault(); e.stopPropagation();
    onSelect(el.id);
    dragRef.current = { startX: e.clientX, startY: e.clientY, originalX: el.x, originalY: el.y };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = e => {
    if (!dragRef.current) return;
    const dx = (e.clientX - dragRef.current.startX) / zoom;
    const dy = (e.clientY - dragRef.current.startY) / zoom;
    onMove(el.id, dragRef.current.originalX + dx, dragRef.current.originalY + dy);
  };
  const endDrag = e => { dragRef.current = null; e.currentTarget.releasePointerCapture?.(e.pointerId); };

  const onResizeStart = (e, handle) => {
    e.preventDefault(); e.stopPropagation();
    onSelect(el.id);
    resizeRef.current = { handle, startX: e.clientX, startY: e.clientY, original: el };
    const onMoveResize = ev => {
      if (!resizeRef.current) return;
      const dx = (ev.clientX - resizeRef.current.startX) / zoom;
      const dy = (ev.clientY - resizeRef.current.startY) / zoom;
      onResize(el.id, resizeElement(resizeRef.current.original, resizeRef.current.handle, dx, dy));
    };
    const onUpResize = () => {
      resizeRef.current = null;
      window.removeEventListener("pointermove", onMoveResize);
      window.removeEventListener("pointerup", onUpResize);
    };
    window.addEventListener("pointermove", onMoveResize);
    window.addEventListener("pointerup", onUpResize);
  };

  const isText = isTextElement(el.type);
  const isCircle = el.type === "circle_shape";

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={() => { if (isText && el.type !== "skill_bar") setEditing(true); }}
      style={{
        position: "absolute", left: el.x, top: el.y, width: el.w, height: el.h,
        zIndex: el.zIndex, opacity: el.opacity, cursor: editing ? "text" : "grab",
        outline: selected ? "2px solid #00BFA5" : "1px solid transparent", outlineOffset: 2,
        userSelect: "none",
      }}
      title="Drag to move · double-click to edit text"
    >
      {el.type === "skill_bar" ? (
        <div style={{ width: "100%", height: "100%" }}>
          <div style={{ fontSize: el.fontSize, fontWeight: el.fontWeight, color: el.textColor, fontFamily: el.fontFamily, marginBottom: 4 }}>{el.skillLabel}</div>
          <div style={{ width: "100%", height: 8, background: "#E2E8F0", borderRadius: el.borderRadius }}>
            <div style={{ width: `${el.skillValue}%`, height: "100%", background: el.fill, borderRadius: el.borderRadius }} />
          </div>
        </div>
      ) : el.type === "photo_placeholder" ? (
        <div style={{ width: "100%", height: "100%", background: el.fill, borderRadius: el.borderRadius, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px dashed #CBD5E1" }}>
          <ImageIcon size={Math.min(el.w, el.h) * 0.35} color="#94A3B8" />
        </div>
      ) : isShapeElement(el.type) ? (
        <div style={{ width: "100%", height: "100%", background: el.fill, borderRadius: isCircle ? "50%" : el.borderRadius }} />
      ) : editing ? (
        <textarea
          autoFocus
          defaultValue={el.text}
          onBlur={e => { onTextChange(el.id, e.target.value); setEditing(false); }}
          onKeyDown={e => { if (e.key === "Escape") setEditing(false); }}
          style={{
            width: "100%", height: "100%", border: "1px dashed #00BFA5", outline: "none", resize: "none",
            fontFamily: el.fontFamily, fontSize: el.fontSize, fontWeight: el.fontWeight, color: el.textColor,
            textAlign: el.textAlign, background: el.fill === "transparent" ? "rgba(255,255,255,0.9)" : el.fill,
            boxSizing: "border-box", padding: 4, lineHeight: 1.4,
          }}
        />
      ) : (
        <div style={{
          width: "100%", height: "100%", boxSizing: "border-box", overflow: "hidden",
          whiteSpace: "pre-wrap", overflowWrap: "break-word", wordBreak: "break-word",
          fontFamily: el.fontFamily, fontSize: el.fontSize, fontWeight: el.fontWeight, color: el.textColor,
          textAlign: el.textAlign, background: el.fill, borderRadius: el.borderRadius,
          display: "flex", alignItems: el.type === "tag_pill" ? "center" : "flex-start",
          justifyContent: el.textAlign === "center" ? "center" : el.textAlign === "right" ? "flex-end" : "flex-start",
          padding: el.type === "tag_pill" ? "0 12px" : 0, lineHeight: 1.4,
        }}>
          {el.text}
        </div>
      )}

      {selected && !editing && HANDLES.map(h => (
        <ResizeHandle key={h} handle={h} onResizeStart={onResizeStart} />
      ))}
    </div>
  );
}

const controlLabelStyle = { fontSize: 11, fontWeight: 700, color: "#0F172A", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" };
const inputStyle = { width: "100%", boxSizing: "border-box", border: "1px solid #E2E8F0", borderRadius: 8, padding: "7px 8px", fontSize: 12, fontFamily: "inherit" };

function PropertiesPanel({ el, onUpdate, onDuplicate, onDelete, onLayer }) {
  if (!el) {
    return (
      <div style={{ padding: 20, color: "#64748B", fontSize: 12.5, lineHeight: 1.6 }}>
        Select an element on the canvas to edit its position, size, color, and typography.
      </div>
    );
  }

  const set = (key, value) => onUpdate(el.id, { [key]: value });
  const isText = isTextElement(el.type);
  const isShape = isShapeElement(el.type);
  const hasTextColor = isText;
  const hasFill = el.type !== "heading" && el.type !== "subheading" && el.type !== "text_block";

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>{ELEMENT_PALETTE.find(p => p.type === el.type)?.label || el.type}</div>
      </div>

      <div>
        <div style={controlLabelStyle}>Position &amp; Size</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div><div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 2 }}>X</div><input type="number" value={Math.round(el.x)} onChange={e => set("x", Number(e.target.value))} style={inputStyle} /></div>
          <div><div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 2 }}>Y</div><input type="number" value={Math.round(el.y)} onChange={e => set("y", Number(e.target.value))} style={inputStyle} /></div>
          <div><div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 2 }}>Width</div><input type="number" value={Math.round(el.w)} onChange={e => set("w", Math.max(MIN_SIZE, Number(e.target.value)))} style={inputStyle} /></div>
          <div><div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 2 }}>Height</div><input type="number" value={Math.round(el.h)} onChange={e => set("h", Math.max(MIN_SIZE, Number(e.target.value)))} style={inputStyle} /></div>
        </div>
      </div>

      {hasFill && (
        <div>
          <div style={controlLabelStyle}>{isShape ? "Fill Color" : "Background"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 5, marginBottom: 8 }}>
            {FILL_SWATCHES.map(c => (
              <button key={c} onClick={() => set("fill", c)} style={{ width: 22, height: 22, borderRadius: "50%", background: c, border: el.fill === c ? "2px solid #0F172A" : "1px solid #E2E8F0", cursor: "pointer", padding: 0 }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="color" value={el.fill?.startsWith("#") ? el.fill : "#00BFA5"} onChange={e => set("fill", e.target.value)} style={{ width: 32, height: 28, padding: 0, border: "1px solid #E2E8F0", borderRadius: 6, cursor: "pointer" }} />
            <input type="text" value={el.fill} onChange={e => set("fill", e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          </div>
        </div>
      )}

      {hasTextColor && (
        <div>
          <div style={controlLabelStyle}>Text Color</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="color" value={el.textColor} onChange={e => set("textColor", e.target.value)} style={{ width: 32, height: 28, padding: 0, border: "1px solid #E2E8F0", borderRadius: 6, cursor: "pointer" }} />
            <input type="text" value={el.textColor} onChange={e => set("textColor", e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          </div>
        </div>
      )}

      {isText && el.type !== "skill_bar" && (
        <div>
          <div style={controlLabelStyle}>Text</div>
          <textarea value={el.text} onChange={e => set("text", e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
        </div>
      )}

      {el.type === "skill_bar" && (
        <div>
          <div style={controlLabelStyle}>Skill Label</div>
          <input type="text" value={el.skillLabel} onChange={e => set("skillLabel", e.target.value)} style={{ ...inputStyle, marginBottom: 10 }} />
          <div style={controlLabelStyle}>Value ({el.skillValue}%)</div>
          <input type="range" min={0} max={100} value={el.skillValue} onChange={e => set("skillValue", Number(e.target.value))} style={{ width: "100%" }} />
        </div>
      )}

      {isText && (
        <div>
          <div style={controlLabelStyle}>Typography</div>
          <select value={el.fontFamily} onChange={e => set("fontFamily", e.target.value)} style={{ ...inputStyle, marginBottom: 8 }}>
            {FONT_PRESETS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div><div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 2 }}>Size</div><input type="number" value={el.fontSize} onChange={e => set("fontSize", Number(e.target.value))} style={inputStyle} /></div>
            <div><div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 2 }}>Weight</div><input type="number" step={100} value={el.fontWeight} onChange={e => set("fontWeight", Number(e.target.value))} style={inputStyle} /></div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]].map(([val, Icon]) => (
              <button key={val} onClick={() => set("textAlign", val)} style={{ flex: 1, padding: "7px 0", border: `1.5px solid ${el.textAlign === val ? "#00BFA5" : "#E2E8F0"}`, background: el.textAlign === val ? "#E6FFFB" : "#fff", borderRadius: 7, cursor: "pointer", display: "flex", justifyContent: "center" }}>
                <Icon size={14} color={el.textAlign === val ? "#009688" : "#64748B"} />
              </button>
            ))}
          </div>
        </div>
      )}

      {(isShape || el.type === "tag_pill" || el.type === "skill_bar") && el.type !== "vertical_line" && el.type !== "divider" && (
        <div>
          <div style={controlLabelStyle}>Shape</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {[["Square", 0], ["Rounded", 12], ["Pill", 999]].map(([label, val]) => (
              <button key={label} onClick={() => set("borderRadius", val)} style={{ flex: 1, padding: "6px 0", border: `1.5px solid ${el.borderRadius === val ? "#00BFA5" : "#E2E8F0"}`, background: el.borderRadius === val ? "#E6FFFB" : "#fff", borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 650, color: "#334155" }}>{label}</button>
            ))}
          </div>
          <input type="number" value={el.borderRadius} onChange={e => set("borderRadius", Number(e.target.value))} style={inputStyle} />
        </div>
      )}

      <div>
        <div style={controlLabelStyle}>Opacity ({Math.round(el.opacity * 100)}%)</div>
        <input type="range" min={0} max={100} value={Math.round(el.opacity * 100)} onChange={e => set("opacity", Number(e.target.value) / 100)} style={{ width: "100%" }} />
      </div>

      <div>
        <div style={controlLabelStyle}>Layer Order</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => onLayer(el.id, 1)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "7px 0", border: "1px solid #E2E8F0", borderRadius: 7, background: "#fff", cursor: "pointer", fontSize: 11.5, fontWeight: 650, color: "#334155" }}>
            <ChevronUp size={13} /> Forward
          </button>
          <button onClick={() => onLayer(el.id, -1)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "7px 0", border: "1px solid #E2E8F0", borderRadius: 7, background: "#fff", cursor: "pointer", fontSize: 11.5, fontWeight: 650, color: "#334155" }}>
            <ChevronDown size={13} /> Back
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, borderTop: "1px solid #E2E8F0", paddingTop: 14 }}>
        <button onClick={() => onDuplicate(el.id)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 0", border: "1px solid #E2E8F0", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 650, color: "#334155" }}>
          <Copy size={13} /> Duplicate
        </button>
        <button onClick={() => onDelete(el.id)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 0", border: "1px solid #FCA5A5", borderRadius: 8, background: "#FEF2F2", cursor: "pointer", fontSize: 12, fontWeight: 650, color: "#DC2626" }}>
          <Trash2 size={13} /> Delete
        </button>
      </div>
    </div>
  );
}

export default function FreeFormBuilder() {
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(0.72);
  const addCountRef = useRef(0);

  const selected = elements.find(e => e.id === selectedId) || null;

  const addElement = (type) => {
    const offset = (addCountRef.current % 8) * 22;
    addCountRef.current += 1;
    const maxZ = elements.reduce((m, e) => Math.max(m, e.zIndex), 0);
    const el = createFreeformElement(type, { x: 60 + offset, y: 60 + offset, zIndex: maxZ + 1 });
    setElements(list => [...list, el]);
    setSelectedId(el.id);
  };

  const updateElement = (id, patch) => {
    setElements(list => list.map(e => e.id === id ? clampToCanvas({ ...e, ...patch }) : e));
  };

  const moveElement = (id, x, y) => {
    setElements(list => list.map(e => e.id === id ? clampToCanvas({ ...e, x, y }) : e));
  };

  const resizeElementById = (id, patch) => {
    setElements(list => list.map(e => e.id === id ? clampToCanvas(patch) : e));
  };

  const textChange = (id, text) => updateElement(id, { text });

  const duplicateElement = (id) => {
    const el = elements.find(e => e.id === id);
    if (!el) return;
    const maxZ = elements.reduce((m, e) => Math.max(m, e.zIndex), 0);
    const copy = { ...el, id: `${el.type}_${Date.now()}`, x: el.x + 18, y: el.y + 18, zIndex: maxZ + 1 };
    setElements(list => [...list, copy]);
    setSelectedId(copy.id);
  };

  const deleteElement = (id) => {
    setElements(list => list.filter(e => e.id !== id));
    setSelectedId(null);
  };

  const layerElement = (id, dir) => {
    setElements(list => {
      const sorted = [...list].sort((a, b) => a.zIndex - b.zIndex);
      const idx = sorted.findIndex(e => e.id === id);
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= sorted.length) return list;
      const a = sorted[idx], b = sorted[swapIdx];
      const az = a.zIndex, bz = b.zIndex;
      return list.map(e => e.id === a.id ? { ...e, zIndex: bz } : e.id === b.id ? { ...e, zIndex: az } : e);
    });
  };

  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div style={{ display: "flex", flex: 1, minWidth: 0, maxWidth: "100%", overflow: "hidden", background: "#DDE7F0" }}>
      <aside style={{ width: 210, flexShrink: 0, background: "#fff", borderRight: "1px solid #E2E8F0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "14px 14px 10px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Elements</div>
          <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>Click to add to canvas</div>
        </div>
        <div style={{ padding: "0 10px 10px", overflowY: "auto", flex: 1 }}>
          {ELEMENT_PALETTE.map(item => {
            const Icon = PALETTE_ICONS[item.type];
            return (
              <button
                key={item.type}
                onClick={() => addElement(item.type)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                  border: "1px solid #E2E8F0", background: "#fff", borderRadius: 9, padding: "9px 10px",
                  marginBottom: 6, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                <div style={{ width: 30, height: 30, borderRadius: 7, background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={15} color="#334155" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A" }}>{item.label}</div>
                  <div style={{ fontSize: 10.5, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.description}</div>
                </div>
              </button>
            );
          })}
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", borderTop: "1px solid #E2E8F0", cursor: "pointer", fontSize: 12.5, color: "#334155", fontWeight: 600 }}>
          <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} style={{ accentColor: "#00BFA5" }} />
          <Grid3x3 size={14} color="#64748B" /> Grid dots
        </label>
      </aside>

      <main
        style={{ flex: 1, minWidth: 0, overflow: "auto", display: "flex", flexDirection: "column", alignItems: "center", padding: "24px", boxSizing: "border-box", position: "relative" }}
        onClick={e => { if (e.target === e.currentTarget) setSelectedId(null); }}
      >
        <div style={{ width: CANVAS_WIDTH * zoom, marginBottom: 60 }}>
          <div
            onClick={e => { if (e.target === e.currentTarget) setSelectedId(null); }}
            style={{
              transform: `scale(${zoom})`, transformOrigin: "top left",
              width: CANVAS_WIDTH, height: CANVAS_HEIGHT, position: "relative",
              background: showGrid ? "radial-gradient(circle, #CBD5E1 1px, #FFFFFF 1px)" : "#FFFFFF",
              backgroundSize: showGrid ? "18px 18px" : undefined,
              boxShadow: "0 18px 60px rgba(15,23,42,0.22)",
              border: "1px solid #CBD5E1",
            }}
          >
            {elements.length === 0 && (
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", color: "#94A3B8", fontSize: 13, pointerEvents: "none" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>+</div>
                <div>Click elements in the panel to add them</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>Then drag to position, drag corners to resize, double-click to edit text</div>
              </div>
            )}
            {sortedElements.map(el => (
              <CanvasElement
                key={el.id}
                el={el}
                selected={selectedId === el.id}
                zoom={zoom}
                onSelect={setSelectedId}
                onMove={moveElement}
                onResize={resizeElementById}
                onTextChange={textChange}
              />
            ))}
          </div>
        </div>

        <div style={{ position: "sticky", bottom: 12, display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 999, padding: "6px 12px", boxShadow: "0 4px 16px rgba(15,23,42,0.12)", alignSelf: "flex-start", marginLeft: 8 }}>
          <button onClick={() => setZoom(z => Math.max(0.4, Math.round((z - 0.08) * 100) / 100))} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 16, color: "#64748B" }}>−</button>
          <span style={{ fontSize: 12, fontWeight: 650, color: "#334155", minWidth: 36, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(1.4, Math.round((z + 0.08) * 100) / 100))} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 16, color: "#64748B" }}>+</button>
        </div>
      </main>

      <aside style={{ width: 260, flexShrink: 0, background: "#fff", borderLeft: "1px solid #E2E8F0", overflowY: "auto", overflowX: "hidden" }}>
        <PropertiesPanel el={selected} onUpdate={updateElement} onDuplicate={duplicateElement} onDelete={deleteElement} onLayer={layerElement} />
      </aside>
    </div>
  );
}
