# NEUL v0.40.2 Complete Integration Audit

Date: 2026-09-20 (Asia/Taipei)
Baseline: **NEUL v0.40.2 – Full Source Audit + izna + Lifecycle Fix + Light Floor + 3D**
Build: `0.40.2-complete.2`

## Baseline integrity

- The WebGL 3D renderer is unchanged from the original v0.40.2 baseline.
- `webgl-venue.js` SHA-256: `9a7aca51a99b3379a0a9fa726676c5f9f9d305d57851b2cd0d9f2d59b1e4a351`
- Light venue floor / ground design remains intact.
- Later v0.40.11–v0.40.16 3D renderer replacements are not used.

## Current data / automation

- 101 explicit offline fallback events.
- 14 ticket-source families plus artist / promoter / venue official feeds.
- Full Coverage Auditor + Auto Backfill.
- Hourly foreground refresh + daily scheduled warm-up.
- Venue-calendar coverage gaps enter `needsTicketBackfill` rather than disappearing.
- A fixed fallback count is never treated as the Taiwan concert total.

## Event lifecycle

- Pre-sale: ticket-sale countdown.
- Sale day: sale-day state.
- After sale day: concert countdown.
- After the final session: Archive.
- Ended events leave active 3D activity selectors automatically.

## Event discovery UI

- Featured silently rotates every 10 seconds; no visible AUTO / 10-second copy.
- Daily/monthly concert calendar is present.
- Multi-session concerts appear on each actual performance date.
- Original complete event list remains available below the calendar and agenda.
- IVE 2026 remains a dropdown-only historical example.

## Automatic custom 3D

- 101 / 101 current fallback events receive unique event-specific layouts.
- 31 events currently rely on runtime venue fallback models where no static calibrated venue is available.
- New events at known venues receive unique event layouts automatically.
- New events at unknown venues create a runtime venue model, then their own event layout.
- Official seat-map publication triggers re-analysis of the same event layout.
- Special-stage profiles can upgrade to `central-x`, `central-stage`, or `end-stage` after OCR/Vision QA.
- An official map URL alone is not enough for `official-map-verified` status.

## Official map comparison

- Official position / seat map appears below the sightline preview explanation.
- Only official ticketing, promoter, artist, venue sources, or images resolved from those sources are eligible for the “official map” panel.
- If no official map can currently be resolved, the UI reports pending auto-backfill instead of claiming no official map exists.
- Price mapping remains evidence-based and is not inferred from arbitrary color order.

## Final automated result

`npm run check` PASS

- 101 seed events
- 101 / 101 unique custom 3D layouts
- 31 runtime venue fallbacks
- 14 ticket source families + official artist / promoter / venue feeds
- Coverage gap / Auto Backfill PASS
- Recursive official-map resolver PASS
- Silent Featured 10s PASS
- Calendar + full list PASS
- Future special-stage auto-upgrade PASS
- WebGL + Canvas fallback / PWA / IndexedDB PASS

## Completeness note

NEUL continuously checks monitored public official sources and exposes coverage gaps/source-health failures. No public crawler can guarantee mathematically zero omissions for private, unpublished, login-protected, or newly announced events between scans. The system therefore automatically backfills observed omissions instead of presenting the 101-event fallback as a complete total.
