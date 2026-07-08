import "./ui.css";

export function ResponsiveGrid({ children, min = "260px", gap = "20px", className = "", ...props }) {
  return (
    <div
      className={["jv-grid", className].filter(Boolean).join(" ")}
      style={{ "--jv-grid-min": min, "--jv-grid-gap": gap, ...props.style }}
      {...props}
    >
      {children}
    </div>
  );
}
