# NEUL v0.35 Test Report

- Package / JS syntax: PASS
- `npm run check`: PASS after v0.35 QA additions
- Taiwan-only event/venue guard: PASS
- Cross-source event dedupe: PASS
- Official seat-map URL extraction: PASS
- Ticket-platform section/price extraction: PASS
- Hand-calibrated 3D metadata resync without geometry overwrite: PASS
- Stray Kids fixed-stand 3D price mapping regression: PASS
- AAA activity + center-stage auto-3D regression: PASS
- Taipei Arena complete structural bowl regression: PASS
- Upcoming long-text overflow CSS audit: PASS
- Mobile Upcoming badge-collapse rule: PASS
- Hero retina asset wired: PASS
- Distinct Featured 1920×1080 assets wired: PASS
- WebGL2 + Canvas fallback regression: PASS

Note: exact upstream HTML can change without notice. Parsers intentionally fall back to TBA / official-source links rather than inventing prices or sections when reliable extraction fails.
