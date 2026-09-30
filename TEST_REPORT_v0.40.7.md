# NEUL v0.40.7 Test Report

Date: 2026-09-21

## Retained 3D venue policy

- 12/12 retained 3D venues are available in the venue selector.
- 桃園巨蛋 (`taoyuan-arena`) restored to 3D/OCR/official-map pipeline.
- 臺大綜合體育館 (`ntu-sports-center`) restored to 3D/OCR/official-map pipeline.
- 天母體育館 remains listing-only to avoid spending generation resources on a lower-priority venue.
- Both restored venues retain Korean-star reference layouts and distance calibration metadata.
- Official-map allowlist includes Taoyuan City sports venue and NTU official domains.
- Discovery aliases recognize 桃園巨蛋 / 桃園市立綜合體育館 and 臺大/台大綜合體育館.

## Regression status

- Seed events: 101
- Custom calibrated 3D: 71/71 PASS
- Uncalibrated/outdoor exclusions: 30 PASS
- Runtime generic fallbacks: 0 PASS
- TICC topology guard: PASS
- Shared-ticket-page venue map disambiguation: PASS
- Desktop News navigation + News final content section: PASS
- Mobile list/calendar/news regression suite: PASS
- Uniform `範例` suffix on reference layouts: PASS
- Reference official-map preview resolver: PASS
- PWA/service-worker version: PASS
- Baseline SHA verification: PASS
