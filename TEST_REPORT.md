# NEUL v0.29 Test Report

- JavaScript syntax: PASS
- Project check: PASS
- Taiwan seed events: 24
- Venue models: 11
- Light/dark venue palette split: PASS
- Theme-switch venue rerender hook: PASS
- WebGL selected/restricted/normal section contrast: PASS
- Canvas fallback light palette: PASS
- Official section-price parser: PASS
- Auto 3D section-price rule propagation: PASS
- Exact section price match smoke test (紅2A -> NT$4,800): PASS
- Ambiguous section labels remain unmatched by design: PASS
- Upcoming Explorer / settings / multilingual / PWA regression checks: PASS

Important limitation: prices embedded only inside a seat-map image are not OCR/CV parsed in this lightweight build. NEUL only auto-maps zone prices when the official public page exposes recognizable text labels and prices.
