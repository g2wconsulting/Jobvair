import "./ui.css";

export function Card({ children, className = "", interactive = false, padding, ...props }) {
  const classes = ["jv-card", interactive ? "jv-card--interactive" : "", className].filter(Boolean).join(" ");
  const style = padding ? { "--jv-card-padding": padding, ...props.style } : props.style;

  return (
    <div className={classes} {...props} style={style}>
      <div className="jv-card__body">{children}</div>
    </div>
  );
}
