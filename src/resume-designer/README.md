# Resume Designer

This folder contains the local Visual Resume Designer prototype.

Phase 1 is intentionally local-state only:

- No database schema changes.
- No Supabase writes.
- No changes to structured Resume Builder save/load behavior.
- No AI calls.
- No paid/free gating.

The designer uses a page/block model. Blocks can be positioned visually while keeping optional links back to structured resume sections through `linkedSectionType` and `linkedEntityId`.