import "./ui.css";

export function Avatar({ name, size = 40, className = "" }) {
  const initials = name ? name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "U";

  return (
    <div
      className={["jv-avatar", className].filter(Boolean).join(" ")}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}
