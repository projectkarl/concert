# NEUL v0.40.15 Test Report

## Scope
Restore the 3D UI composition to the v0.40.11 design while retaining newer automation and reliability improvements.

## Results
- `npm run check`: PASS.
- Existing fallback events: 75.
- Runtime 3D audit: 75 / 75 PASS, 0 failures.
- Future-event automatic custom 3D: PASS.
- Unknown future venue runtime model + event-specific 3D: PASS.
- WebGL + safe Canvas fallback: retained.
- Official seat-map auto resolver / cache / refresh: retained.
- Official seat-map DOM appears after the seat-view explanation, not beside the preview canvas: PASS.
- `seat-preview-reference-grid` removed: PASS.
- IVE historical example remains in the activity-layout dropdown only: retained.
- Activity Explorer and calendar/list improvements: retained.

## Regression guard
The automated check now verifies the ordering `seatPreviewCanvas` → explanatory copy → `officialSeatMapPanel`, and rejects any reintroduction of the side-by-side reference grid.
