import "./ui.css";

export function Toggle({ checked, onChange, label, className = "" }) {
  return (
    <label className={["jv-toggle", className].filter(Boolean).join(" ")}>
      <span
        className={`jv-toggle__track${checked ? " jv-toggle__track--on" : ""}`}
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
      >
        <span className="jv-toggle__thumb" />
      </span>
      {label && <span className="jv-toggle__label">{label}</span>}
    </label>
  );
}
