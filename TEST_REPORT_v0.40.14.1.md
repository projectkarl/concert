# NEUL v0.40.14.1 Test Report

## Mobile Entertainment News
- <= 920px search/select text uses 16px to avoid iOS Safari focus zoom: PASS
- <= 720px News toolbar constrained to one-column layout: PASS
- 320–380px narrow-screen search/button/card containment: PASS
- Long publisher names and multilingual headlines cannot expand card width: PASS
- News More button remains within viewport: PASS
- Service-worker cache key bumped so stale mobile CSS is replaced after deployment: PASS

## Regression
- Existing event coverage, archive lifecycle, official seat-map, venue topology, Taipei Dome geometry, 3D interaction and desktop News checks: PASS (`npm run check`).
