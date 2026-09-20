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

## v0.40.1 Auto Seat Map Vision / OCR / Section Mapping QA

- Existing v0.40 UI shell regression: PASS (`index.html`, `styles.css`, `webgl-venue.js`, assets and icons unchanged).
- Existing 59 Taiwan seed events / 11 venue models / BTS / T-ARA calibrated layout checks: PASS.
- Ticket source discovery layer: 13 official platform adapters + official artist/venue feeds.
- Event-page → seat-map resolver: PASS for standard `src`, lazy `data-src`, `srcset`, CSS `url(...)`, and absolute image URLs.
- Seat-map proxy SHA-256 fingerprint + resolved image header: PASS (static validation).
- OCR/Vision code path: Tesseract.js v5 zero-key browser worker + vision-only fallback present.
- Section reconciliation: OCR token + section alias + calibrated spatial position + tier hint + section-price rule.
- OCR hash cache: unchanged official map reuses compact prior analysis; new/changed hash triggers regeneration.
- Mobile/Safari guard: OCR concurrency reduced to one image at a time; all eligible events remain in the queue.
- Static shell smoke: `index.html` and `seat-map-intelligence.js` served successfully from a local HTTP server.

### Known external-source limitations

Automated crawling is best-effort. An official ticket site can block server-side fetches, move seat images to a new CDN/domain, render all content behind anti-bot JavaScript, or publish only PDF/interactive seat pickers. In those cases NEUL keeps the calibrated venue model and does not claim false section precision. The source adapter/allow-list is intentionally explicit for SSRF safety.
