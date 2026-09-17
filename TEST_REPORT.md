# NEUL v0.32 Test Report

## Automated checks

- `npm run check` — PASS
- 24 Taiwan seed events — PASS
- 11 venue models — PASS
- WebGL2 + Canvas fallback hooks — PASS
- PWA / IndexedDB / i18n / Light-Dark theme regression — PASS
- Auto 3D / Archive / Upcoming modal / countdown / reminders — PASS

## Venue calibration audit

All fixed-seat sections with a row range were checked by computing the 3D coordinate at the first and last supported row.

- Sections audited: **477**
- Collapsed row-depth sections: **0**
- Minimum first-to-last-row movement: **5.83 model units** (Kaohsiung Arena 401, rows 1→2)
- Largest first-to-last-row movement: **54.95 model units** (Taipei Music Center configurable 1F reference block)

Specific v0.30 corrections:

- Kaohsiung Arena 219: row range extended through **41** with deeper rear geometry.
- NTSU upper sections: range extended through **16**; middle-tier reverse numbering remains active.
- Generic end-stage camera target: now points to the performance surface / runway, not the LED back wall.
- Rear-stage baseline positions: flagged; LED rear rendered as dark technical backing.
- WebGL stage realism: specular response, cross truss, runway edge lighting, sparse audience silhouettes.

## Static HTTP smoke test

- `/` — 200
- `/app.js` — 200
- `/webgl-venue.js` — 200
- `/manifest.webmanifest` — 200
- `/data/multi-venue-geometry.js` — 200

## Limitation

This container cannot provide trustworthy GPU/WebGL visual screenshots for real-device Safari/Chrome. Geometry, shader syntax and runtime hooks were validated programmatically; final GPU appearance should still be checked after Vercel deployment on iPhone Safari and desktop Chrome/Safari.



## v0.32 Taiwan-only Events + True3D QA

- `npm run check` — **PASS**
- Full JavaScript / MJS / CJS syntax scan — **PASS**
- Static HTTP smoke test (`/`, `app.js`, `webgl-venue.js`, event data, geometry, manifest) — **PASS / HTTP 200**
- 37 Taiwan seed events load — **PASS**
- Active market coverage includes KR, JP, US, UK, AU, EU and FR — **PASS**
- BABYMONSTER 2026/11/21–22 Taipei Arena with YG Entertainment official source — **PASS**
- Non-Korean Live Nation fixture survives discovery and is tagged AU instead of being discarded — **PASS**
- Taipei Arena official event-index parser — **PASS**
- Artist-official tour parser (YG / BABYMONSTER) — **PASS**
- Taipei Arena Red 2 A–E row model = 1–15; public seat estimate metadata = up to 28, row-dependent — **PASS**
- True WebGL2 renderer still uses instanced 3D seats — **PASS**
- Selected section renders row-aware seats plus stair/riser edges, side aisles, cross-aisle and handrails — **PASS**
- LED panel segmentation is 3D geometry, not a flat venue image — **PASS**
- Seat-number lateral placement now uses per-section seat estimate when available — **PASS**
- PWA cache bumped to `neul-v0.32.0` — **PASS**

### Device limitation

The container cannot provide a trustworthy GPU/WebGL visual capture equivalent to iPhone Safari or desktop Chrome/Safari. Runtime hooks, shader/module syntax, geometry generation and static serving were tested programmatically. Final GPU appearance should still be visually checked on the deployed URL.


## v0.32 scope/layout regression
- Venue selector filters to Taiwan venue cities only — PASS
- API event merge enforces `region=TW` and Taiwan city guard — PASS
- Existing homepage/venue 3D grid remains intact; no replacement redesign — PASS
- Taipei Arena shows compact IVE demo entry only when selected — PASS
- IVE demo switches to true WebGL layout `ive-show-what-i-am-2026`, 紅2D 14排 19號 — PASS
- Hand-calibrated layout geometry remains stable while structured price/source metadata can sync — PASS
