# NEUL v0.40.16 Test Report

Date: 2026-09-23

## Scope

Convert twconcertview from headline-count-only coverage comparison into an explicit reference queue while keeping official ticket/promoter/artist/venue sources authoritative.

## Assertions

- Reference headline count and deduplicated event records remain separate units.
- Repeated same-date/title/venue source rows increase `referenceOccurrenceCount` without duplicating the visible activity row.
- New unmatched reference records are flagged `referenceOnly` and `參考收錄 · 待官方覆核`.
- A matching official source automatically clears `referenceOnly` while retaining twconcertview provenance in `sourceRefs`.
- twconcertview Traditional-Chinese root remains the primary reference source.
- Thin roots trigger only six rotating Traditional-Chinese month pages per sync; English month pages run only if the whole zh-TW batch is unavailable.
- API reports parsed, pending-official, and promoted reference-queue counts separately.
- Existing v0.40.15 official seat-map fallback / official backfill and v0.40.14 venue calibration remain intact.

## Result

PASS — full `npm run check` chain passed: 35 baseline core files / 65 required features, including v0.40.16 reference-queue tests.
