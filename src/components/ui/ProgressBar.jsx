import "./ui.css";

export function ProgressBar({ value, max = 100, tone = "primary", label, className = "" }) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));

  return (
    <div className={["jv-progress", className].filter(Boolean).join(" ")}>
      {label && (
        <div className="jv-progress__header">
          <span className="jv-progress__label">{label}</span>
          <span className="jv-progress__value">{pct}%</span>
        </div>
      )}
      <div className="jv-progress__track">
        <div className={`jv-progress__fill jv-progress__fill--${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
