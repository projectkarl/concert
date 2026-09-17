# NEUL v0.31 Venue Calibration Audit

This file reports what the current 3D model actually knows. A model row ceiling is not automatically an official per-seat CAD claim. Seat-number limits are only shown where NEUL has an explicit estimate; unknown sections remain unknown rather than being invented.

| Venue | Model sections | Model row range | Sections with seat-number estimate | Highest modeled seat estimate |
|---|---:|---:|---:|---:|
| 臺北大巨蛋 (`taipei-dome`) | 165 | 1–38 | 165/165 | 32 |
| 臺北小巨蛋 (`taipei-arena`) | 30 | 1–30 | 20/30 | 28 |
| 國立體育大學綜合體育館 (`ntsu-arena`) | 36 | 0–16 | 0/36 | — |
| 高雄巨蛋 (`kaohsiung-arena`) | 50 | 1–41 | 0/50 | — |
| 臺北流行音樂中心 (`taipei-music-center`) | 17 | 1–20 | 0/17 | — |
| TICC 台北國際會議中心 (`ticc`) | 31 | 1–52 | 0/31 | — |
| 高雄流行音樂中心 海音館 (`kaohsiung-music-center`) | 25 | 1–29 | 0/25 | — |
| 高雄國家體育場（世運主場館） (`kaohsiung-stadium`) | 54 | 1–80 | 0/54 | — |
| 桃園巨蛋 (`taoyuan-arena`) | 21 | 1–30 | 0/21 | — |
| 臺大綜合體育館 (`ntu-sports-center`) | 37 | 1–33 | 0/37 | — |
| 天母體育館 (`tianmu-gymnasium`) | 11 | 1–30 | 0/11 | — |

## Taipei Arena Red 2 check

| Section | Rows in model | Seat estimate | Confidence |
|---|---:|---:|---|
| 紅2A | 1–15 | up to 28 (row-dependent) | public-seat-records; row-dependent |
| 紅2B | 1–15 | up to 28 (row-dependent) | public-seat-records; row-dependent |
| 紅2C | 1–15 | up to 28 (row-dependent) | public-seat-records; row-dependent |
| 紅2D | 1–15 | up to 28 (row-dependent) | public-seat-records; row-dependent |
| 紅2E | 1–15 | up to 28 (row-dependent) | public-seat-records; row-dependent |

Current public evidence supports Taipei Arena 2F rows through row 15; the build therefore does **not** create row 16+ for Red 2 without a reliable event/venue source. The seat-number estimate is intentionally marked row-dependent.

## True-3D behavior

- WebGL2 geometry remains the primary venue renderer; Canvas is fallback only.
- Selected sections render row-aware seat density. Where a seat estimate exists, high-quality mode can render the full modeled seat count per visual row up to 34 seats.
- Section depth drives riser position, aisle edges, cross-aisles and handrail posts.
- LED walls/screens use real 3D panels and panel-seam geometry; they are not a draggable flat venue screenshot.
- Seat-number lateral positioning now uses the section seat estimate when available instead of a global hard-coded seat center.
