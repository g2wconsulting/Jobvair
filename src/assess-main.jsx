import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AssessApp from "./assess.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AssessApp />
  </StrictMode>
);
