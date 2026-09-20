# NEUL v0.40.12 Test Report

## Result
PASS

## Automated regression
- `npm run check`: PASS.
- Existing Taiwan-only fallback/data-source/coverage auditor checks: PASS.
- Future-event automatic custom 3D pipeline: PASS for known venue, second event at the same venue, and unknown future venue.
- WebGL + Canvas fallback, PWA + IndexedDB checks: PASS.

## v0.40.12 assertions
- `eventsAgendaList` exists independently from `eventsModalList`: PASS.
- Monthly calendar and original activity list coexist: PASS.
- Month grid includes leading/trailing blank cells: PASS.
- Official seat-map reference grid exists in the 3D preview: PASS.
- Event-specific pending map state remains visible rather than hidden: PASS.
- Cached resolver `resolvedUrl` is used by the visible official reference: PASS.
- Featured pool still uses up to 10 current events: PASS.
- Featured autoplay is 10 seconds, visible, restartable after manual navigation and tab visibility changes: PASS.

## Browser rendering note
A container Chromium process could not complete headless rendering in this environment because its system D-Bus/headless process did not terminate normally. Static DOM/CSS assertions, JavaScript syntax checks and the project regression suite were used instead.
