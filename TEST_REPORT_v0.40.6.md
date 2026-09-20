# NEUL v0.40.6 Test Report

Date: 2026-09-20

## Passed

- `node scripts/check.mjs`
- 75/75 curated fallback events remain Taiwan-only.
- 75/75 fallback events receive unique event-specific 3D layout IDs.
- No event-specific layout directly equals its venue base layout.
- Unknown future venues still receive a runtime baseline plus a separate event layout.
- BTS / BABYMONSTER / LE SSERAFIM / T-ARA calibrated 3D regression checks pass.
- Official seat-map OCR/Vision, Traditional-Chinese OCR, stage topology QA and no-price-guess checks pass.
- Source discovery contains all 14 configured ticket-platform families plus official artist/venue feeds.
- tixCraft promoter subdomains accepted.
- KKTIX 20-page index coverage configured.
- Ticket Plus / ibon / ERA discovery depth expanded.
- iNDIEVOX complete-index parser fixture passes.
- Daily calendar DOM hooks / rendering helpers / styles pass static regression checks.
- Calendar uses sessions first and expands multi-day ranges when sessions are unavailable.
- `/api/events` exposes `coverage.completenessGuaranteed=false` and source-health metadata.
- API distinguishes `threeDReady` from `threeDOfficialVerified` / `priceMappingVerified`.
- Service-worker cache version updated to v0.40.6.
- JavaScript syntax checks pass for all project JS/MJS files.
- Vercel Serverless Function count: 7 (below Hobby 12-function cap).

## Static 3D audit

`CUSTOM_3D_AUDIT_v0.40.6.md`:

- Total: 75
- Unique event-specific 3D: 75/75
- Direct official-map/manual-calibrated package entries: 9
- Requires official-map/live QA before claiming official accuracy: 66

This distinction is intentional. A generated event-specific draft is not described as an official-map match until the official image passes OCR/Vision QA.

## UI lock check

Diff against v0.40.5:

- `index.html`: only the existing all-events modal was extended with the calendar/agenda markup.
- `styles.css`: only calendar/agenda styles were appended.
- Homepage hero, Featured, Upcoming, venue cards, settings, theme and existing 3D layout structure were not redesigned.
