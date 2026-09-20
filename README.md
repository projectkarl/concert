# NEUL v0.56

Rebuilt from the confirmed v0.40-series product requirements because the prior ZIP itself was not present in the current runtime.

## Included
- Original NEUL dark / Korean-inspired dashboard direction, with clean light theme (no image inversion filter).
- Responsive desktop/mobile layout; modal can always be closed on mobile.
- Featured excludes ended events and rotates every 10 seconds.
- Archive is computed from event end date, so future events cannot enter Archive.
- 3D viewer with light venue floor, stage, screen, seating geometry, orbit-like drag, zoom, stage/seat viewpoints.
- Event-specific geometry modes including standing + 2F and end-stage/concert hall approximations.
- Ticket/source links and current seeded official data for izna and selected MNA events.
- Vercel `/api/health` and `/api/events` endpoints.
- QA script (`npm run check`).

## Important
This package deliberately labels the 3D output as an approximate model when exact seat-map geometry is not verified. It does not fabricate precise row/seat coordinates.

## Deploy
Vercel Framework Preset: Other. Root: project root. No build command required.
