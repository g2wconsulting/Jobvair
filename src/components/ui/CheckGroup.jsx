import "./ui.css";

export function CheckGroup({ label, options, value, onChange, className = "" }) {
  const toggle = (v) => {
    const next = value.includes(v) ? value.filter((x) => x !== v) : [...value, v];
    onChange(next);
  };

  return (
    <div className={className}>
      {label && <div className="jv-check-group__label">{label}</div>}
      <div className="jv-check-group__options">
        {options.map((o) => {
          const isChecked = value.includes(o.value);
          return (
            <label key={o.value} className={`jv-check-group__option${isChecked ? " jv-check-group__option--active" : ""}`}>
              <input type="checkbox" checked={isChecked} onChange={() => toggle(o.value)} />
              {o.label}
            </label>
          );
        })}
      </div>
    </div>
  );
}
