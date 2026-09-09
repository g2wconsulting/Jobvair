import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  // Multi-page app: /admin.html and /employer.html are separate entry points
  // from / (index.html). Without this, Vite's dev server SPA-fallbacks any
  // unmatched path (e.g. "/employer") to index.html instead of 404ing,
  // which silently serves the candidate app and masks routing mistakes.
  appType: "mpa",
  build: {
    rollupOptions: {
      input: {
        main:       resolve(__dirname, "index.html"),
        admin:      resolve(__dirname, "admin.html"),
        employer:   resolve(__dirname, "employer.html"),
        assessment: resolve(__dirname, "assessment.html"),
      },
    },
  },
  // Use inline source maps instead of eval-based ones — avoids CSP eval errors
  css: { devSourcemap: false },
  server: {
    headers: {
      "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com;",
    },
  },
});
