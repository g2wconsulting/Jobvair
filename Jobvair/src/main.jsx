import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Route to admin panel if URL contains /admin
const isAdmin = window.location.pathname.includes("admin") || 
                window.location.search.includes("admin");

async function init() {
  let App;
  if (isAdmin) {
    const mod = await import("./admin.jsx");
    App = mod.default;
  } else {
    const mod = await import("./App.jsx");
    App = mod.default;
  }
  createRoot(document.getElementById("root")).render(
    <StrictMode><App /></StrictMode>
  );
}

init();