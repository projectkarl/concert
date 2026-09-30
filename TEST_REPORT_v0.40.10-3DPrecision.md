# NEUL v0.40.10 — 3D Precision / Non-Regression Test Report

Date: 2026-09-21 (Asia/Taipei)

## Goal

Improve seat distance, view angle and obstruction detail without replacing or flattening the existing interactive 3D venue experience.

## Browser-level verification

Tested with a real, headed Chromium session under a virtual display with WebGL enabled (not a DOM-only/static test).

- `#venueCanvas` successfully obtained a **WebGL2** context.
- Desktop 1440×1000: dragging the 3D scene changed ~**71.2%** of captured canvas pixels; wheel zoom changed ~**91.3%** after the drag state.
- Mobile 390×844: WebGL2 stayed active; drag changed ~**52.9%** of captured canvas pixels.
- Mobile document width stayed **390 / 390 px** (no horizontal overflow in the tested state).
- No JavaScript `pageerror` remained after restoring the missing `offlineState()` handler.

These checks verify that the venue remains a live interactive renderer. They do not claim millimetre-accurate real-world reconstruction.

## 12 retained venue render sweep

Each retained venue was selected in the UI and its overview canvas was captured after the switch. Every capture was non-flat/non-empty. Pixel standard deviation is listed as a simple regression signature (higher than zero means the frame is not a uniform blank canvas):

| Venue | Canvas pixel std. dev. |
|---|---:|
| Taipei Dome | 31.81 |
| Taipei Arena | 38.66 |
| NTSU Arena | 39.18 |
| Kaohsiung Arena | 37.44 |
| Taipei Music Center | 47.87 |
| TICC | 37.31 |
| Kaohsiung Music Center | 47.21 |
| National Stadium (Kaohsiung) | 29.65 |
| Taoyuan Arena | 43.85 |
| NTU Sports Center | 48.21 |
| Nangang Exhibition Hall 1 4F | 36.88 |
| Zepp New Taipei | 48.13 |

No venue switch produced a page-level JavaScript exception in the sweep.

## Seat precision wiring

Taipei Dome QA case:

- Same row, seat number `1` → estimated main-stage-nearest band **98–110 m**.
- Same row, seat number `40` → estimated main-stage-nearest band **85–97 m**.
- First tested row → **79–91 m** and line-of-sight rail warning triggered.
- Last tested row → **91–103 m** and that rail warning cleared.

This confirms that row and seat number affect the actual geometric camera/measurement inputs rather than only changing labels.

## Accuracy model changes

- Main-stage distance is measured to the nearest point on the stage rectangle rather than only the stage centre.
- Runway / B-stage / extra-stage rectangles can expose their own nearest-distance band when present in the verified layout.
- Seat number changes lateral position within the section; row changes depth and rise.
- HUD exposes viewing direction plus elevation/depression angle and calibrated uncertainty.
- Obstruction warnings now require a line-of-sight intersection with the known rail / overhang / equipment / crowd proxy, instead of warning merely because an object exists somewhere in the section.
- Unknown or unverified temporary obstructions are still not invented.

## Static regression suite

Added `scripts/check-v0411.mjs` to enforce:

- three venue/preview/viewer canvases remain present;
- native WebGL2 renderer remains wired;
- pointer drag, wheel zoom and pinch controls remain wired;
- seat-number parallax remains active;
- stage-edge distance, viewing angle/elevation and line-of-sight obstruction logic remain present;
- 12 retained venues remain the 3D resource policy;
- aespa official-geometry guard remains intact;
- 3D pipeline version is bumped so stale derived layout state can be refreshed.

