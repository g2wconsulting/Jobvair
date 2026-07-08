import { Card } from "./Card.jsx";
import "./ui.css";

export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "primary",
  trend,
  interactive = false,
  className = "",
  ...props
}) {
  return (
    <Card interactive={interactive} className={["jv-stat-card", `jv-stat-card--${tone}`, className].filter(Boolean).join(" ")} {...props}>
      <div className="jv-stat-card__header">
        {Icon && (
          <span className="jv-stat-card__icon">
            <Icon size={20} aria-hidden="true" />
          </span>
        )}
        {trend && <span className="jv-stat-card__trend">{trend}</span>}
      </div>
      <div className="jv-stat-card__value">{value}</div>
      <div className="jv-stat-card__label">{label}</div>
      {description && <p className="jv-stat-card__description">{description}</p>}
    </Card>
  );
}
