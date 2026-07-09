# Resume Designer

This folder contains the Free Build canvas builder — a freestyle, absolutely-positioned
canvas distinct from the Structured Resume Builder's template-driven document.

Structured mode (in `src/pages/BuilderPage.jsx`) remains the primary editing/export
mode: it owns the actual resume document, pagination, PDF export, and the Template
Gallery. Free Build is a separate, simpler creative canvas for building a resume
layout entirely from scratch, saved independently per-resume via
`resumes.freeform_design_json`.

See `freeformDefaults.js` for the element schema and `components/FreeFormBuilder.jsx`
for the canvas/palette/properties-panel implementation.
