# NEUL v0.41 QA Report

Date: 2026-09-18

## Automated checks

- PASS — 59 Taiwan-only seed/fallback events, no holes
- PASS — 11 Taiwan venue models; overseas venue leakage rejected
- PASS — nine Taiwan ticket-platform families plus official venue / artist / promoter sources
- PASS — KKTIX pagination and WANIN Visual promoter source included
- PASS — BTS official tixCraft map URL present
- PASS — BTS event layout uses a central stage plus four diagonal stage arms
- PASS — BTS sample floor prices: VIP A2 NT$9,380, Y1 NT$7,980, A9 NT$6,980
- PASS — T-ARA 2026/10/18 event and official KKTIX map present
- PASS — T-ARA section-price samples map to NT$5,980 / 5,680 / 4,680 / 3,680
- PASS — official monitor checks `secondarySourceUrl`, not only the promoter page
- PASS — seat-map image proxy exposes SHA-256 content fingerprint
- PASS — client seat-map intelligence uses actual image pixels / `createImageBitmap`
- PASS — auto-generated seat-map layouts can update on changed image hash
- PASS — all current map-linked events are analyzed in small browser batches, not limited to the first 14
- PASS — stage / standing / FOH no-seat guards retained
- PASS — base venue geometry merge, exact section-price guard, expired-layout cleanup and UI overflow protections retained
- PASS — native WebGL2 + Canvas fallback, PWA and IndexedDB retained
- PASS — six-hour client refresh scheduler uses the API `nextUpdateAt` and refresh bucket
- PASS — Archive filter is strictly ended-only; search cannot pull future/current events into Archive
- PASS — date-only / midnight event ranges stay live through the listed day instead of archiving at 00:00
- PASS — automatic official-map floor generation uses `AUTO-FLOOR`, preserves all fixed venue tiers and excludes production overlap
- PASS — auto-generated layouts remain eligible for recurring seat-map regeneration when the official image hash changes
- PASS — dark-mode venue field uses a lighter neutral floor; stage fascia / stairs / event surfaces have improved contrast

## Accuracy boundary

The container validates syntax, data wiring, source-monitor logic and geometry rules. It does not reproduce final Safari/Chrome GPU rendering. Automatic seat-map pixel analysis is deliberately conservative: it can generate useful event-specific drafts, but arbitrary publisher graphics are not guaranteed to map to exact CAD/per-seat coordinates without calibration.
