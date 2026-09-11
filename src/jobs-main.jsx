import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import PublicJobsApp from "./pages/PublicJobsApp.jsx";
import "./components/ui/theme.css";
import "./components/ui/ui.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PublicJobsApp />
  </StrictMode>
);
