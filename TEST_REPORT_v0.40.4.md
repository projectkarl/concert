# NEUL v0.40.4 Test Report

Date: 2026-09-20

## Automated regression

Command: `node scripts/check.mjs`

Result: **PASS**

- Taiwan seed events: 66
- Venue models: 12
- Ticket discovery sources: 14 + official artist/venue feeds
- BTS official event layout and full floor section family: PASS
- BTS stage topology protection: PASS
- BTS section pricing: PASS
- BABYMONSTER event-specific layout: PASS
- BABYMONSTER 2F/VIP/special exact pricing: PASS
- BABYMONSTER 3F multi-price range guard: PASS
- OCR/Vision event-specific reference sections: PASS
- Traditional-Chinese + English OCR path: PASS (static/runtime wiring)
- Chinese/full-width section-range expansion: PASS
- OCR STAGE-label dark-component targeting: PASS
- OCR legend price safety: PASS
- calibrated geometry overwrite confidence guard: PASS
- secondary ticket URL seat-map eligibility: PASS
- Ticket Plus discovery expansion: PASS
- official seat-map preview/3D linkage retained: PASS
- physical aisle geometry retained: PASS
- light-floor behavior retained: PASS
- WebGL + Canvas fallback: PASS
- PWA + IndexedDB: PASS

## Syntax

All `.js` and `.mjs` files pass `node --check`.

## UI lock

`index.html` SHA-256: `de430c705e9f6db2767bfa0e41e93fa84210608e91e6fbb8ba1eea5239a29f81`

`styles.css` SHA-256: `3186e2e505627c3d0e2182a92c31ffacaa567bbf1a02a1caae103db89d12f5e0`

Both match the v0.40.3 base exactly.
