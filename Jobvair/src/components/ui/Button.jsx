import "./ui.css";

const iconSizes = {
  sm: 14,
  md: 16,
  lg: 18,
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  full = false,
  icon: Icon,
  iconPosition = "left",
  className = "",
  type = "button",
  ...props
}) {
  const classes = [
    "jv-button",
    `jv-button--${variant}`,
    size !== "md" ? `jv-button--${size}` : "",
    full ? "jv-button--full" : "",
    className,
  ].filter(Boolean).join(" ");
  const icon = Icon ? <span className="jv-button__icon"><Icon size={iconSizes[size] || iconSizes.md} aria-hidden="true" /></span> : null;

  return (
    <button type={type} className={classes} {...props}>
      {iconPosition === "left" && icon}
      {children}
      {iconPosition === "right" && icon}
    </button>
  );
}
