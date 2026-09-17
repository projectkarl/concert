# NEUL v0.40 QA Report

Date: 2026-09-17

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

## Accuracy boundary

The container validates syntax, data wiring, source-monitor logic and geometry rules. It does not reproduce final Safari/Chrome GPU rendering. Automatic seat-map pixel analysis is deliberately conservative: it can generate useful event-specific drafts, but arbitrary publisher graphics are not guaranteed to map to exact CAD/per-seat coordinates without calibration.
