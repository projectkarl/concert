# NEUL v0.40.6 Test Report

Date: 2026-09-21

`npm run check` passed completely.

Validated:
- 101 Taiwan fallback events remain available.
- 10/10 mainstream 3D venues are present and each has a Korean-star reference scene with distance calibration metadata.
- 桃園巨蛋 / 臺大綜合體育館 / 天母體育館 are listing-only and do not enter the 3D/OCR generation pipeline.
- Unknown/provisional venues remain excluded even when a seat-map URL is attached.
- Desktop Planner link is removed; News links to the actual Entertainment News block.
- Entertainment News is the final content section before footer.
- K-star reference dropdown labels uniformly end with `· 範例`.
- Reference layouts without a current `eventId` can invoke the official-map resolver.
- Official-map proxy receives event/venue hints and recognizes official venue domains used by the mainstream 10.
- Shared-ticket-page disambiguation and TICC topology guard still pass.
- Japan entertainment-news category and mobile News navigation remain intact.
- Mobile list/calendar containment regressions remain green.
- Service-worker version and baseline SHA manifest updated to v0.40.6.

Final automated output:
- Core checks: PASS
- Coverage auditor: PASS
- Complete 3D checks: PASS (69/69 eligible mainstream/current layouts; 32 exclusions)
- UX checks: PASS
- News/mobile checks: PASS
- Venue policy: PASS
- Topology integrity: PASS
- v0.40.4 compatibility checks: PASS
- v0.40.6 release checks: PASS
- Baseline verification: PASS (20 core files / 36 required features)
