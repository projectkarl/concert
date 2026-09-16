# NEUL v0.19 Test Report

## Static / syntax
- Required project files: PASS
- JavaScript module syntax/import check: PASS
- Manifest / Vercel JSON parse: PASS
- WebGL2 renderer + Canvas fallback hooks: PASS
- PWA cache version v0.19: PASS

## Venue precision regression targets
- Taipei Music Center 2F 1–15 rows: PASS
- Taipei Music Center 3F supports row 17 / max 18: PASS
- TICC official 2MF/3F–6F five-block IDs + A–E aliases: PASS
- TICC 3F-B row range 17–25: PASS
- TICC 4F-B control-booth warning / volume: PASS
- KMC 2A2 obstruction calibration: PASS
- KMC 2B3 supports observed row 20: PASS
- KMC 2B4 calibrated as independent 18–19 row sub-zone: PASS
- KMC 2B5 starts at row 24: PASS
- KMC default section resolves to real calibrated 2C3: PASS
- KMC 3C-1 / 3C-2 sections exist: PASS
- 11 venue mappings retained: PASS
- Advanced venue+section search across all 11 venue models: PASS
- Section display-label / official-ID support: PASS

## Product regressions
- Taiwan-only activity data: PASS
- IVE / PLAVE / Stray Kids event layouts: PASS
- PWA / IndexedDB / archive / calendar / reminders / seat compare / submission: PASS
- No Ticketmaster frontend dependency: PASS


## HTTP smoke test
- `/`: 200
- `/manifest.webmanifest`: 200
- `/data/multi-venue-geometry.js`: 200

## v0.19 brand / typography regression
- Browser title uses `NEUL — Stay Close to What You Love`: PASS
- Desktop + mobile logo lockup shows `NEUL / 늘`: PASS
- Brand subtitle uses `Stay Close to What You Love.`: PASS
- Hero headline changed to non-duplicating editorial copy: PASS
- Noto Sans KR / TC web-font links present with system fallback: PASS
- Main Georgia / Times display-font declarations removed: PASS
- `/styles.css`: 200
- `/sw.js`: 200
