# NEUL Cloudflare v1.4.1 Test Report

Date: 2026-09-30
Release: `1.4.1-seatmap-venue-autogen`

## Result

**PASS — application regression, Cloudflare contract, seat-map resolver and scheduled-flow simulations.**

## Original NEUL regression

`npm run check` passed completely after the intentional runtime changes.

Validated output includes:

- 148 Taiwan seed/reference records loaded by the current regression fixture.
- 13 venue models.
- 14 ticket-source families + official artist/venue feeds.
- 82 / 82 calibrated eligible event-specific 3D layouts PASS.
- 66 uncalibrated/outdoor exclusions remain blocked from generic 3D.
- 0 current runtime generic venue fallbacks.
- WebGL + Canvas fallback, PWA + IndexedDB PASS.
- Calendar/list UX, mobile containment and News PASS.
- Archive20 lifecycle PASS.
- TICC continuous-rake topology guard PASS.
- Taipei Dome asymmetric stadium recalibration PASS.
- v0.40.14 venue calibration compatibility PASS.
- v0.40.15 seat-map fallback compatibility PASS.
- v0.40.16 TWCV reference queue PASS.
- v0.40.17 Artists.tw / dual-reference coverage PASS.
- Baseline verification PASS: 38 core files / 76 required features.

## Cloudflare doctor

`npm run cf:doctor` PASS:

- `public/` assets directory exists.
- 19 critical runtime files are byte-identical root ↔ `public/`.
- Frontend API contract complete.
- `/api/events`, `/api/official`, `/api/entertainment-news`, Push config/subscription and seat-map routes present.
- Seat-map resolved URL/hash headers present.
- Recursive seat-map resolver present.
- Live Nation CDN Referer behavior present.
- Hourly rotating six-phase source cycle present.
- 14+ source families present.
- TWCV + Artists.tw reference layers present.
- News categories present.
- Free-plan external-request budget guard present.
- Seat-map resolver smoke PASS.
- Frontend integrity PASS: 43 original UI/assets + 5 intentional functional overrides.

## Worker smoke

`npm run cf:smoke`:

`SMOKE PASS — events=121, exact API compatibility routes OK`

## Scheduled pipeline smoke

`npm run cf:scheduled-smoke`:

`SCHEDULED SMOKE PASS — events=124, TWCV=317, Artists.tw=222, news=1`

This test uses deterministic mocked upstream sources to verify Cron → per-source snapshot → merge → KV → API behavior. It is not a claim that every upstream site is reachable from every Cloudflare POP at every moment.

## Official seat-map smoke

The resolver fixture validates two critical paths:

1. tixCraft official event HTML → official static field image.
2. Live Nation page/script → `networksites.livenationinternational.com` seat-map image that rejects the request unless the correct Live Nation Taiwan Referer is sent.

Result:

`SEATMAP SMOKE PASS — recursive official map + Live Nation CDN referer`

## 2026-09-30 event refresh gate

The v1.4.1 release gate also verifies that eight newly official/current records are present in the fallback and that OPEN!夢想音樂節 remains excluded from fixed-venue 3D. After the refresh, the full original regression reports **148 seed records / 82 calibrated eligible 3D / 66 uncalibrated or outdoor exclusions**.

## Cloudflare Wrangler dry-run limitation

A real `wrangler deploy --dry-run` was attempted in this isolated build environment, but there was no preinstalled project `node_modules` and external Wrangler package download timed out. Therefore this report does **not** claim a successful Wrangler dry-run. The package-level Worker/API/static regression checks above all pass; Cloudflare Git build will install declared dependencies before running the configured deploy command.

## Release gate

Recommended Cloudflare Git Deploy command:

`npm run deploy`

Do not use bare `npx wrangler deploy` for this release when avoidable, because the project deploy script intentionally performs source → public synchronization and all critical predeploy checks first.
