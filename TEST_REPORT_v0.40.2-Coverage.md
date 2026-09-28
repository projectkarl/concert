# NEUL v0.40.2 Coverage Build — Test Report

## Result
PASS

## Original v0.40.2 regression suite
- 66 seed Taiwan events: PASS
- 12 venue models: PASS
- 14 ticket-source families: PASS
- Light-floor / event-specific 3D base merge: PASS
- OCR / Vision / section mapping: PASS
- Archive / expired-layout cleanup: PASS
- WebGL + Canvas fallback paths: PASS
- PWA + IndexedDB: PASS

## Coverage / automation suite
- Official venue-calendar parser fixtures (TMC / Zepp / KPMC): PASS
- Venue-only event detected as coverage gap: PASS
- Venue-only event queued for ticket backfill: PASS
- Source-health warning propagation: PASS
- Rotating KKTIX deep discovery: PASS
- Recursive official seat-map / ticket-detail resolver: PASS
- `/api/coverage`: PASS
- `/api/events` one-hour CDN revalidation: PASS
- Browser hourly automatic event refresh: PASS
- Resume-from-background stale refresh: PASS

## v0.40.2 3D/UI base lock
SHA-256 is identical between source v0.40.2 and this build for:
- `index.html`: `5e2c32e321a8e50bb0a8931e0c154484619deb3cb01cb37f7295713dca9d6359`
- `styles.css`: `e0ef4183329c8e299f4301023c07fdff4f0ee72f40e5bcd4f285d554a1156ac3`
- `webgl-venue.js`: `9a7aca51a99b3379a0a9fa726676c5f9f9d305d57851b2cd0d9f2d59b1e4a351`
- `data/multi-venue-geometry.js`: `02e4dd5898ed30f2e0e65a1e9917b348dfa377230254fef7b4b7d71ba403c5b3`

`app.js` changes are limited to automatic refresh/coverage state handling and a Canvas fallback declaration-order fix; the WebGL renderer and venue geometry are not replaced.
