import { Inbox } from "lucide-react";
import { Button } from "./Button.jsx";
import "./ui.css";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  actionLabel,
  onAction,
  className = "",
}) {
  return (
    <div className={["jv-card", "jv-empty-state", className].filter(Boolean).join(" ")}>
      <span className="jv-empty-state__icon">
        <Icon size={22} aria-hidden="true" />
      </span>
      {title && <h3 className="jv-empty-state__title">{title}</h3>}
      {description && <p className="jv-empty-state__description">{description}</p>}
      {action || (actionLabel && onAction ? <Button onClick={onAction}>{actionLabel}</Button> : null)}
    </div>
  );
}
