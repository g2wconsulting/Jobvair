import "./ui.css";

export function Cluster({ children, gap = "var(--jv-space-3)", align = "center", justify = "flex-start", className = "", ...props }) {
  return (
    <div
      className={["jv-cluster", className].filter(Boolean).join(" ")}
      style={{ "--jv-cluster-gap": gap, "--jv-cluster-align": align, "--jv-cluster-justify": justify, ...props.style }}
      {...props}
    >
      {children}
    </div>
  );
}
