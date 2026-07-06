import { Info } from "lucide-react";
import "./ui.css";

export function Banner({ title, children, tone = "info", icon: Icon = Info, actions, className = "" }) {
  return (
    <div className={["jv-banner", `jv-banner--${tone}`, className].filter(Boolean).join(" ")} role={tone === "danger" ? "alert" : "status"}>
      <span className="jv-banner__icon">
        <Icon size={18} aria-hidden="true" />
      </span>
      <div className="jv-banner__content">
        {title && <h3>{title}</h3>}
        {children && <div className="jv-banner__body">{children}</div>}
      </div>
      {actions && <div className="jv-banner__actions">{actions}</div>}
    </div>
  );
}
