# NEUL v0.40.14 — CPU Saver Test Report

Date: 2026-09-24 (Asia/Taipei)
Base: NEUL v0.40.13 Verified316 RecentData

## Result

PASS — full `npm run check` suite completed successfully.

## CPU Saver verification

- `/api/events` shared CDN cache: 6 hours (`s-maxage=21600`), stale window 24 hours.
- `/api/official` shared CDN cache: 6 hours; official-monitor rotation bucket: 6 hours.
- Browser event refresh: 6 hours; tab-return refresh only when stale.
- `/api/refresh`: no timestamp query cache busting.
- `/api/coverage`: no timestamp query cache busting.
- `/api/seat-map-image`: successful resolutions cached 6 hours.
- `/api/seat-map-image`: 404/not-found results cached 6 hours instead of 5 minutes.
- Seat-map background hydration: maximum 1 stale event per page load.
- Seat-map background source fan-out: maximum 1 source.
- Selected event detail: lazy priority hydration, maximum 3 candidate sources, with 6-hour per-device freshness guard.
- Background seat-map freshness guard: 24 hours unless source signature changes.
- Entertainment-news RSS shared cache: 1 hour.
- Service worker cache version bumped to v0.40.14.

## Non-regression suite passed

- Taiwan-only event coverage and dedupe
- 101 fallback events
- 14 ticket/official discovery sources
- Archive 20 lifecycle
- WebGL2 + Canvas fallback
- row/seat parallax and LOS obstruction
- official seat-map resolver and CDN handling
- calibrated venue topology integrity
- mobile list/calendar containment and safe-area close
- entertainment news categories and progressive More
- v0.40.13 Verified316 discovery/recent-data behavior
- baseline SHA-256 verification for 32 core files

## Expected CPU effect

The heaviest server-side discovery/official-monitor refresh cadence is reduced from up to 24 refresh windows/day to 4 refresh windows/day per shared cache key. Repeated seat-map misses no longer trigger five-minute recursive retries, and ordinary homepage loads no longer attempt to hydrate every eligible event seat map.

Actual Vercel Active CPU reduction depends on traffic mix, cache hit rate, cold starts, and upstream source behavior, so production Usage should still be observed after deployment.
