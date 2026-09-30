# NEUL Cloudflare v1.4.2 Test Report

Date: 2026-09-30
Release: `1.4.2-seatmap-lastgood-autogen`

## Result

**PASS — NEUL application regression + Cloudflare API/seat-map/scheduled automation simulations.**

## Original NEUL regression

`npm run check` PASS:

- 148 Taiwan seed/reference records.
- 13 venue models.
- 14 ticket-source families + official artist/venue feeds.
- 82 / 82 eligible calibrated event-specific 3D layouts PASS.
- 66 uncalibrated / outdoor exclusions remain blocked from generic 3D.
- 0 runtime generic venue fallbacks.
- WebGL + Canvas fallback, PWA + IndexedDB PASS.
- Calendar/list UX, mobile containment and Entertainment News PASS.
- Archive20 lifecycle PASS.
- TICC continuous-rake topology guard PASS.
- Taipei Dome asymmetric bowl PASS.
- v0.40.14 venue calibration, v0.40.15 map fallback, v0.40.16 reference queue, v0.40.17 Artists.tw/TWCV coverage regression PASS.
- Baseline verification PASS: 42 core files / 82 required features.

## Cloudflare doctor

`npm run cf:doctor` PASS:

- `assets.directory = ./public` and required frontend assets exist.
- 19 critical runtime files root ↔ public byte-identical.
- KV config uses Wrangler automatic provisioning; no placeholder namespace ID.
- Frontend API contract complete.
- Official seat-map recursive resolver + Live Nation CDN Referer PASS.
- Seat-map binary last-good cache PASS.
- `/api/seat-map-status` diagnostics PASS.
- Frontend integrity: 43 original UI/assets locked + 5 intentional runtime/data overrides.
- Worker smoke PASS.
- Scheduled source/reference/news/enrichment smoke PASS.

## Seat-map failure simulation

Fixture flow:

1. Resolve tixCraft event HTML → official static field image.
2. Store resolved image bytes/hash in KV.
3. Replace all upstream network fetches with HTTP 503.
4. Request the same official map again.
5. Worker returns the saved official image using `kv-last-good-fresh` without making another upstream request.
6. `/api/seat-map-status` confirms both request cache and event last-good metadata.
7. A `.jpg` URL returning `text/html` is rejected instead of being served as a broken image.
8. If cached binary bytes expire while metadata remains, a successful origin revalidation recreates the binary artifact before the next outage.

Result:

`SEATMAP SMOKE PASS — recursive official map + CDN referer + strict MIME guard + KV last-good repair`

## Scheduled automation simulation

The six-phase hourly cycle was simulated with deterministic upstream fixtures, including enrichment phases.

Result:

`SCHEDULED SMOKE PASS — events=124, TWCV=317, Artists.tw=222, news=1, seatmaps=16`

This verifies Cron → source/detail discovery → direct official seat-map prefetch → image hash → KV → `/api/events` propagation.

## Wrangler dry-run limitation

A true Wrangler dry-run was attempted. This isolated artifact environment does not contain Bun, and npm dependency download timed out before Wrangler could be installed. Therefore this report does **not** claim a successful real `wrangler deploy --dry-run`.

The user-provided Cloudflare build log already shows Cloudflare's build environment supplies Bun 1.2.15 and can install Wrangler. v1.4.2 reduces the package dependency surface to pinned Wrangler only and removes the prior manual KV-ID requirement.
