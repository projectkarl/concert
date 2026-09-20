# NEUL v0.59 — Geometry + Sightline Calibration

This build continues v0.58 without redesigning the UI. It deepens the venue geometry layer and keeps source confidence explicit.

## Added in v0.59
- Taipei Arena: 1F / 2F / 3F-800 tier semantics, section token parsing for labels such as 1A / 2B / 3E800 and numbered zones.
- Taipei Dome: 100 / 200 / 300 / 400 section bands, four distinct elevations, longer lower-bowl row model.
- Per-tier row rise, aisles/walkways and front railings are represented in the 3D scene.
- Seat-view camera now uses row rise + aisle depth rather than a flat constant offset.
- Center/360 stage detection and 4-sided screen layout.
- Community view reports are used only as *empirical obstruction hints* (rail, overhang, distance, side angle). They are never promoted to official geometry.
- UI displays venue calibration source and empirical-view source separately.

## Source hierarchy
1. Official event ticket page: event/date/seat map/prices.
2. Official venue map: floor/tier/gate skeleton.
3. Event seat-map OCR: section token discovery.
4. Community view reports: qualitative risk hints only.
5. Model estimate: remaining row/seat geometry.

## Important limitation
This is not survey-grade CAD. Exact per-seat X/Y/Z coordinates are still estimated unless an official seat pattern is available (e.g. Zepp basic seating pattern). The UI labels those estimates rather than presenting them as measured truth.

## QA
Run `npm run check` and `npm test` before deployment.
