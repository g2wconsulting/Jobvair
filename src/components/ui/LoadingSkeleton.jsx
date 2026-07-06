import "./ui.css";

export function LoadingSkeleton({ height = 16, radius = 8, lines = 1, className = "" }) {
  if (lines > 1) {
    return (
      <div className={className} aria-hidden="true">
        {Array.from({ length: lines }).map((_, index) => (
          <span
            className="jv-skeleton"
            key={index}
            style={{
              "--jv-skeleton-height": `${height}px`,
              "--jv-skeleton-radius": `${radius}px`,
              marginTop: index === 0 ? 0 : 10,
              width: index === lines - 1 ? "76%" : "100%",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <span
      className={["jv-skeleton", className].filter(Boolean).join(" ")}
      aria-hidden="true"
      style={{ "--jv-skeleton-height": `${height}px`, "--jv-skeleton-radius": `${radius}px` }}
    />
  );
}
