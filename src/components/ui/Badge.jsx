import "./ui.css";

export function Badge({ children, tone = "neutral", icon: Icon, className = "" }) {
  const classes = ["jv-badge", `jv-badge--${tone}`, className].filter(Boolean).join(" ");

  return (
    <span className={classes}>
      {Icon && <Icon size={13} aria-hidden="true" />}
      {children}
    </span>
  );
}
