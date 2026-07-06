import "./ui.css";

export function Spinner({ size = 24, label = "Loading", className = "" }) {
  return (
    <span
      className={["jv-spinner", className].filter(Boolean).join(" ")}
      role="status"
      aria-label={label}
      style={{ "--jv-spinner-size": `${size}px` }}
    />
  );
}
