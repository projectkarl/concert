# NEUL v0.40.15 — 3D Layout Audit

## Requested rollback
The 3D presentation has been restored to the v0.40.11 single-column composition while keeping later automation/runtime fixes.

## DOM order
1. Venue overview 3D canvas
2. Venue / event / section controls
3. Seat-view preview canvas
4. Seat-view explanation / warning
5. Official position / seating-layout reference
6. Preview interaction hints

The official reference is no longer placed beside the preview canvas.

## Responsive safeguards
- `seat-preview-reference-grid` is removed.
- Official reference uses the original single-column `official-seatmap-inline` sizing.
- The reference therefore cannot shrink the seat-view canvas or create a second column on desktop/mobile.
- The v0.40.11 preview card dimensions and responsive breakpoints remain the visual base.

## Functionality retained
- Official seat-map resolver / pending recovery.
- Official image refresh when newly resolved.
- Section marker linkage.
- Future event automatic event-specific 3D.
- Unknown venue runtime model generation.
- WebGL with Canvas recovery / Safari-safe fallback.
- IVE example remains in the activity-layout selector only.

## QA
- `npm run check`: PASS.
- Runtime 3D: 75 / 75 PASS.
- Future auto custom 3D: PASS.
- No side-by-side preview grid: PASS.
- Official reference after explanation: PASS.
