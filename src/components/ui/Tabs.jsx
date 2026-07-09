import "./ui.css";

export function Tabs({ tabs, active, onChange, className = "" }) {
  return (
    <div className={["jv-tabs", className].filter(Boolean).join(" ")}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`jv-tabs__item${active === t.id ? " jv-tabs__item--active" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
