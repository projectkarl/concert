# NEUL v0.30 Test Report

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
