import "./ui.css";

export function Stack({ children, gap = "var(--jv-space-4)", className = "", ...props }) {
  return (
    <div className={["jv-stack", className].filter(Boolean).join(" ")} style={{ "--jv-stack-gap": gap, ...props.style }} {...props}>
      {children}
    </div>
  );
}
