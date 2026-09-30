# Vercel Node 24 deployment fix

Date: 2026-09-21

## Change

- Changed `package.json` from `engines.node: ">=20"` to `engines.node: "24.x"`.
- Updated `NEUL_BASELINE_MANIFEST.json` for the intentional package.json hash change.
- No application, UI, concert data, WebGL, 3D geometry, Archive, News, or mobile behavior was changed.

## Why

Vercel warns that an open-ended range such as `>=20` can automatically move to a future major Node.js release. Node.js 20 is also scheduled to be disabled for new Vercel deployments on 2026-10-01. Pinning `24.x` keeps deployments on the Node 24 major while still receiving patch/minor updates within that major.

## Validation

`npm run check` passes, including baseline verification (25 core files / 46 required features).
