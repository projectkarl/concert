# NEUL v0.40.7 Test Report

## Result
PASS

## Regression
- Existing `scripts/check.mjs`: PASS — 75 seed events, 24 venue models, 14 ticket sources, WebGL/Canvas, PWA/IndexedDB.
- Existing custom 3D audit: PASS — 75/75 event-specific layouts, 75 unique layouts.
- `node --check app.js`: PASS.
- All project JavaScript syntax checks: PASS.

## Source info popover
- Upcoming event rows include per-event source trigger: PASS.
- Daily calendar agenda rows include per-event source trigger: PASS.
- Event detail heading includes per-event source trigger: PASS.
- Hover opens the popover on desktop: implemented.
- Tap toggles popover on touch/mobile: implemented.
- Outside click closes popover: implemented.
- Source list reads `sourceRefs`, primary source, secondary source, official seat map, auto-discovery source, venue model source, and event layout source: PASS.
- Duplicate URLs are removed before rendering: PASS.
- 3D official-map / price mapping status appears in the source panel: PASS.

## Design lock
No homepage/Featured/Upcoming/venue layout redesign was performed. CSS additions are scoped to `.source-info-*`, `.event-artist-line`, `.events-modal-artist-line`, and `.detail-heading-line`.
