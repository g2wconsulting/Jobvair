import "./ui.css";

export function Select({ label, id, hint, error, required = false, options = [], className = "", children, ...props }) {
  const inputId = id || props.name;

  return (
    <label className={["jv-field", className].filter(Boolean).join(" ")} htmlFor={inputId}>
      {label && (
        <span className="jv-field__label">
          {label}
          {required && <span className="jv-field__required"> *</span>}
        </span>
      )}
      <select id={inputId} className="jv-select" aria-invalid={Boolean(error)} required={required} {...props}>
        {children || options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && <span className="jv-field__hint">{hint}</span>}
      {error && <span className="jv-field__error">{error}</span>}
    </label>
  );
}
