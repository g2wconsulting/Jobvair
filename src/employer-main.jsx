import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./components/ui/theme.css";
import EmployerApp from "./employer.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode><EmployerApp /></StrictMode>
);
