# NEUL v0.40.3 Test Report

Date: 2026-09-20 (Asia/Taipei)

## Automated regression

`npm run check` passed.

Coverage retained:
- 66 Taiwan fallback events
- 12 venue models
- 14 ticket-source categories plus artist/venue official feeds
- existing lifecycle / Archive guards
- BTS / T-ARA / LE SSERAFIM / izna regressions
- WebGL2 + Canvas fallback
- PWA + IndexedDB

## v0.40.3 checks

Passed:
- official seat-map panel exists only inside existing 3D preview card
- official image is loaded via same-origin seat-map resolver
- OCR/Vision normalized x/y coordinates retained for map linkage
- official-map click -> matching 3D section linkage wired
- selected 3D section -> official-map marker wired
- hand-calibrated layouts can use exact OCR token matches without geometry overwrite
- physical side aisles / cross aisles are generated in WebGL
- seats are excluded from aisle bands
- walkway surfaces remain light in both themes
- service-worker cache version bumped for deployment refresh

## UI-lock comparison

Compared with v0.40.2:
- Existing HTML structure is unchanged except one functional `official-seatmap-inline` block inserted under `seatPreviewCanvas`.
- Existing CSS rules are unchanged; new styles are appended only for the official seat-map block.
- No homepage, Upcoming, Featured, settings, navigation, color-system, or existing 3D control layout was redesigned.
