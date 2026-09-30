# NEUL Cloudflare v1.3.0 — Final Test Report

Date: 2026-09-29 (Asia/Taipei)
Base: `NEUL-v0.40.17-Expanded-AutoCoverage.zip`
Cloudflare target: Workers + Static Assets + KV + Cron Triggers

## Result

**PASS — local/static/mock regression suite**

## 1. Original NEUL regression

`npm run check` passed in full.

Validated output includes:

- 140 Taiwan seed events.
- 13 calibrated venue models.
- 14 ticket-source families + official artist/venue feeds.
- Coverage Auditor / venue-gap backfill.
- 76 / 76 eligible calibrated custom 3D scenes.
- 64 uncalibrated/outdoor exclusions.
- WebGL2 rotate / zoom / pinch / seat parallax / LOS obstruction regressions.
- TICC topology guard.
- Taipei Dome recalibration.
- aespa official 001–014 floor guard.
- Archive20 lifecycle.
- official-map recursive resolver + CDN byte path.
- Entertainment News 5 categories, including Japan.
- mobile list/calendar/news containment.
- v0.40.15 / v0.40.16 / v0.40.17 coverage regressions.
- v0.40.17 offline upcoming fixture: 122.
- Artists.tw ICS/HTML dual reference discovery.

Two old test fixtures were made date-robust because the original tests contained dates that became historical after 2026-09-26. This only changes development tests; no frontend asset was changed.

## 2. Exact UI lock

Command:

```bash
npm run cf:verify-ui
```

Result:

```text
ORIGINAL UI LOCK PASS — 48 assets exactly match NEUL-v0.40.17-Expanded-AutoCoverage.zip
```

The lock includes the original public HTML/CSS/JS/PWA/3D/data/assets tree. `FRONTEND-INTEGRITY.json` contains the release hashes.

Source archive SHA-256:

```text
54be4231f04ed075cb2ae937a831f88df41c2b3fcc165729f52c2d587ce26f9d
```

## 3. Cloudflare API contract

Command:

```bash
npm run cf:check
```

Result: PASS for

- frontend API contract completeness;
- `/api/events`;
- `/api/official` expected patch/check shape;
- `/api/entertainment-news` exact frontend endpoint;
- `/api/push-config` + `/api/push-subscribe`;
- Push digest scheduled handler;
- seat-map hash/resolved response headers;
- hourly rotating six-hour source cycle;
- versioned KV keys;
- 14+ ticket/promoter source families;
- TWConcertView + Artists.tw reference layer;
- five entertainment-news categories;
- scheduled external-request shard guard.

Frontend-discovered routes checked:

```text
/api/entertainment-news
/api/events
/api/official
/api/push-config
/api/push-subscribe
/api/seat-map-image
```

Additional operational routes:

```text
/api/coverage
/api/health
/api/refresh
/api/push-digest
```

## 4. Request smoke

Command:

```bash
npm run cf:smoke
```

Result:

```text
SMOKE PASS — events=114, exact API compatibility routes OK
```

114 is the current-date visible fallback snapshot after applying current lifecycle and Archive20; it is not the raw 140-row packaged seed count.

## 5. Scheduled-flow smoke

Command:

```bash
npm run cf:scheduled-smoke
```

Result:

```text
SCHEDULED SMOKE PASS — events=117, TWCV=317, Artists.tw=222, news=1
```

This is a deterministic mocked-upstream test and validates:

1. Cron phase execution.
2. Source parsing.
3. per-source KV persistence.
4. dual coverage-reference persistence.
5. entertainment-news cache write.
6. snapshot rebuild.
7. final `/api/events` read path.

It does **not** claim the live public sources currently return those fixture counts.

## 6. Cloudflare-specific hardening

- Static Assets serve the original frontend byte-for-byte.
- Worker only intercepts `/api/*` before static assets.
- one hourly rotating data Cron + one daily Push Cron.
- each source retains last-good KV on transient failure.
- data cache keys are versioned under the v1.3 namespace.
- event merge uses indexed candidate buckets and normalized URL/date/venue identities.
- official seat-map proxy rejects untrusted hosts and uses a bounded recursive resolver.
- seat-map `X-NEUL-SeatMap-Hash`, `X-NEUL-SeatMap-Resolved`, and hint score headers are preserved.
- News cache keeps the original 7-day policy.
- Web Push is optional and disabled until VAPID variables are supplied.
- `/api/health` exposes data freshness, bindings, source state and Cron checkpoints.

## 7. Deployment boundary

No real Cloudflare account credentials are available in this build environment, so `wrangler deploy` to the user's account was **not** run. Live upstream connectivity from the final Cloudflare Worker POP therefore remains a post-deployment check.

A real deployment should be considered healthy only after:

- `/api/health` reports KV + Assets bindings;
- source cron timestamps begin updating;
- `/api/events` keeps current/upcoming data;
- `/api/coverage` shows reference/source health;
- at least one official seat-map proxy request succeeds for an eligible event;
- entertainment-news results update within the expected cycle.
