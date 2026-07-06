import "./ui.css";

export function TextArea({ label, id, hint, error, required = false, className = "", rows = 4, ...props }) {
  const inputId = id || props.name;

  return (
    <label className={["jv-field", className].filter(Boolean).join(" ")} htmlFor={inputId}>
      {label && (
        <span className="jv-field__label">
          {label}
          {required && <span className="jv-field__required"> *</span>}
        </span>
      )}
      <textarea id={inputId} className="jv-textarea" rows={rows} aria-invalid={Boolean(error)} required={required} {...props} />
      {hint && <span className="jv-field__hint">{hint}</span>}
      {error && <span className="jv-field__error">{error}</span>}
    </label>
  );
}
