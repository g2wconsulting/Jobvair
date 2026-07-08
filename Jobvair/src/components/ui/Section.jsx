import "./ui.css";

export function Section({ children, title, description, actions, spacing, className = "", ...props }) {
  const style = spacing ? { "--jv-section-spacing": spacing, ...props.style } : props.style;

  return (
    <section className={["jv-section", className].filter(Boolean).join(" ")} {...props} style={style}>
      {(title || description || actions) && (
        <div className="jv-section__header">
          <div>
            {title && <h2 className="jv-section__title">{title}</h2>}
            {description && <p className="jv-section__description">{description}</p>}
          </div>
          {actions && <div className="jv-section__actions">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
