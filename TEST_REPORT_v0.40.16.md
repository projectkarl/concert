# NEUL v0.40.16 test report

## 3D regression
- Base: v0.40.14.
- `app.js`: v0.40.14 3D runtime preserved.
- `webgl-venue.js`: v0.40.14 WebGL implementation preserved.
- 75/75 current fallback events resolve to a valid venue, event-specific layout and stage geometry.
- Future known-venue event auto-3D: PASS.
- Future unknown-venue runtime model + event-specific auto-3D: PASS.
- Canvas/WebGL recovery code: PASS static/runtime audit.

## Layout
- Official map is no longer in the `seat-preview-reference-grid` that changes the preview canvas width.
- Official map is rendered in a separate grid row after the seat-view preview/explanation.
- Mobile grid order: intro → venue render → controls → seat preview → official map → tip.

## Automated checks
`npm run check`: PASS.
- 75 fallback events
- 24 venue models
- 14 ticket sources plus promoter/artist/venue calendars
- coverage-gap auditor
- PWA + IndexedDB

## Note
A container-headless Chromium instance could not initialize EGL/WebGL in this environment, so the browser GPU path cannot be visually certified here. The app's v0.40.14 Canvas fallback/recovery path is preserved unchanged and all project runtime audits pass.
