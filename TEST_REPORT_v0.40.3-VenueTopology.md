# NEUL v0.40.3 Venue Topology QA

日期：2026-09-21

## Automated checks
- JS syntax: PASS
- Final full `npm run check`: PASS (all core / coverage / complete / UX / news / venue-policy / topology / baseline checks)
- Current event topology audit: 101/101 processed
- Calibrated event 3D: 71/71 generated with a known venue model
- Uncalibrated / outdoor / temporary: 30/30 blocked from generic 3D
- Current runtime generic fallbacks: 0
- TICC general 1F audience tier: 0
- TICC 2MF→6F continuous rake progression: PASS
- Fixed-venue topology replacement by auto Vision/OCR: BLOCKED
- Flexible-tier event-map insertion: PASS
- Shared KHAM multi-venue map resolver (Taipei vs Kaohsiung fixture): PASS
- Unknown explicit venueModelId falling back to Taipei Dome: BLOCKED

## 彭佳慧 regression
`julia-peng-counting-days-taipei-2026` 與 `julia-peng-counting-days-kaohsiung-2026` 共用 KHAM PRODUCT_ID `P1D3G65D`。

修正後：
- 台北場固定 `taipei-arena`，variant hint = `台北／臺北小巨蛋`
- 高雄場固定 `kaohsiung-arena`，variant hint = `高雄／高雄巨蛋`
- resolver 對多張官方圖先做場館提示重排；若仍無正向匹配就不套圖。

## TICC regression
- Building 1F ≠ Plenary Hall general audience tier.
- 大會堂官方 seat finder topology in NEUL is limited to 2MF / 3F / 4F / 5F / 6F / BOX.
- Auto map cannot add synthetic 1F sections to TICC.
- TICC fixed stage cannot be moved by low-confidence pixel detection.

## Final release gate
- TICC band geometry assertion verifies both distance (z) and elevation (y) rise from 2MF through 6F.
- Shared-page resolver rejects a negatively matched single candidate as well as ambiguous multi-candidate pages.
- Release package generated only after the full test chain passes.
