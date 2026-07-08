import "./ui.css";

export function Page({ children, size = "default", className = "", padding, ...props }) {
  const classes = ["jv-page", size !== "default" ? `jv-page--${size}` : "", className].filter(Boolean).join(" ");
  const style = padding ? { "--jv-page-padding": padding, ...props.style } : props.style;

  return (
    <main className={classes} {...props} style={style}>
      {children}
    </main>
  );
}
