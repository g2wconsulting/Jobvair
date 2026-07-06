import "./ui.css";

export function PageHeader({ title, description, eyebrow, actions, className = "" }) {
  return (
    <header className={["jv-page-header", className].filter(Boolean).join(" ")}>
      <div className="jv-page-header__content">
        {eyebrow && <p className="jv-page-header__eyebrow">{eyebrow}</p>}
        {title && <h1 className="jv-page-header__title">{title}</h1>}
        {description && <p className="jv-page-header__description">{description}</p>}
      </div>
      {actions && <div className="jv-page-header__actions">{actions}</div>}
    </header>
  );
}
