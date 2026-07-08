import "./ui.css";

const iconSizes = {
  sm: 15,
  md: 18,
  lg: 20,
};

export function IconButton({
  icon: Icon,
  label,
  variant = "ghost",
  size = "md",
  className = "",
  type = "button",
  ...props
}) {
  const classes = [
    "jv-icon-button",
    `jv-icon-button--${variant}`,
    size !== "md" ? `jv-icon-button--${size}` : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button type={type} className={classes} aria-label={label} title={label} {...props}>
      {Icon && <Icon size={iconSizes[size] || iconSizes.md} aria-hidden="true" />}
    </button>
  );
}
