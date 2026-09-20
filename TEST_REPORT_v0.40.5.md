# NEUL v0.40.5 Test Report

## Scope
- Base: v0.40.4
- UI/visual design: locked; no changes to `index.html` or `styles.css`
- Goal: every current event has its own event-specific 3D layout; future unknown venues must also receive a safe 3D fallback.

## Results
- Seed events audited: 66
- Event-specific 3D PASS: 66 / 66
- Unique event layout IDs: 66 / 66
- Failed event 3D mappings: 0
- Direct official-seat-map / calibrated events: 9
- Venue-derived custom drafts awaiting official-map refinement: 57
- Hand-calibrated event layouts: 8
- Auto event-specific layouts: 58
- Venue models after coverage expansion: 22 static models + runtime unknown-venue fallback
- Ticket discovery families: 14 + official artist / venue feeds

## New venue coverage
Added safe baseline models for:
- Legacy TERA
- Legacy Taipei
- NEXT TV No.1 Studio
- New Taipei City Exhibition Hall
- Cohesion Space
- WESTAR Taipei
- HANA SPACE
- Kaohsiung Dream Mall outdoor field
- Penghu Guanyinting Recreation Area
- LIVE WAREHOUSE

These baseline models are deliberately conservative and are not presented as official single-seat geometry. Official event maps remain authoritative.

## Per-event QA gate
Each current event must satisfy all of the following:
1. Venue resolves to a 3D model.
2. Event has a unique `venueLayoutId`.
3. Layout `eventId` matches the event.
4. Layout is not the venue base layout.
5. Main stage geometry exists.
6. Existing section-price rules remain synced.
7. Official-map confidence/review state is retained.

All 66 current events pass.

## Future venue safety
A simulated event at an unknown future Taiwan venue was tested. NEUL now creates a conservative runtime venue model and then a unique event-specific 3D layout instead of returning no 3D.

## Regression
`node scripts/check.mjs` passes after the changes, including BTS special-stage geometry, BABYMONSTER price mapping, OCR/Vision section mapping, physical aisles, all-venue light floors, WebGL + Canvas fallback, PWA and IndexedDB.

## UI lock verification
SHA-256 comparison against v0.40.4:
- `index.html`: identical
- `styles.css`: identical

Therefore the website design/layout was not changed by v0.40.5.
