# NEUL v0.32 — Taiwan Scope & True3D Refinement

Taiwan-first concert discovery + venue 3D/PWA prototype, optimized for Vercel Hobby.

## v0.32 highlights

- Re-audited all 11 existing venue models for row-depth movement, section orientation and stage-facing camera logic.
- Corrected Kaohsiung Arena 219 rear-row depth to support public seat-view evidence reaching row 41.
- Extended NTSU upper calibration to row 16 and retained reverse-row logic where community evidence shows larger printed row numbers can be physically closer to the front.
- Side-seat camera target now biases toward the performance surface / runway rather than the LED wall.
- Generic end-stage seats that fall behind the stage are flagged as rear-stage baseline positions; the LED rear no longer glows like a second screen.
- WebGL atmosphere pass: improved specular lighting, runway edge lights, cross-truss depth, sparse audience silhouettes and upgraded stage technical details.
- Existing PWA, multilingual UI, dark/light theme, reminders, Upcoming explorer, Auto 3D and venue pricing remain intact.

## Accuracy boundary

The venue models are calibrated reconstructions, not BIM or official per-seat CAD. Event-specific official ticket maps always take priority over the generic venue baseline. Community seat-view reports are used only as external validation evidence and are not copied into NEUL.


## v0.32 Taiwan-only Events + True3D Detail
- Live Nation Taiwan discovery is no longer K-pop-only; Taiwan events are kept regardless of artist nationality.
- Added Taipei Arena official public-event discovery as a second venue-level source.
- Added verified seed coverage for BABYMONSTER, Hans Zimmer, LANY, BE:FIRST, Henry Moodie, Yuuri, XG, Charlie Puth, Vaundy, Malcolm Todd, 5 Seconds of Summer, Khalid and FKJ.
- BABYMONSTER Taipei 2026/11/21-22 is sourced from YG Entertainment official tour schedule; ticketing remains TBA until official sales details appear.
- Taipei Arena 2F row range remains 1-15 because public seat records verify row 15 (including Red 2A row 15 seat 28) and no reliable fixed-seat evidence supports row 16+.
- WebGL2 renderer now draws row-aware seat density, riser lines, aisle edges, handrail posts, cross-aisles and LED panel segmentation. This remains true 3D; no image-pan substitute is used.


## v0.32 scope correction
- Venue selector is Taiwan-only. No overseas arena/stadium models are exposed.
- Event feed is Taiwan-performance-only (`region: TW` plus Taiwan city guard). Artist nationality does not matter.
- Taipei Arena keeps the existing page layout and only adds a compact IVE 2026 demo entry.
- The IVE demo loads the hand-calibrated `ive-show-what-i-am-2026` WebGL layout (default demo seat: 紅2D 14排 19號).
- Hand-calibrated 3D geometry is never overwritten by automatic data refresh; official structured prices/seat-map metadata can sync without moving calibrated distances.


## v0.34 Price Sync + AAA + Duplicate Review

- Stray Kids `RUN IT TAIPEI` keeps the official Taipei Dome 3D layout and now exposes official ticket price labels directly inside the 3D section UI for fixed-stand zones that can be reliably matched to the tixCraft seating map. Gray / unavailable / ambiguous zones are intentionally not assigned a guessed price.
- Added the 2026 Asia Artist Awards in Kaohsiung (2026-12-05 to 12-06) with official tixCraft dates, price range, official seating-map source, and a centered / 360-stage auto-3D draft on the Kaohsiung National Stadium model.
- Cross-source duplicate review now canonicalizes venue names and compares artist/title identity on the same date. Duplicate records from ticketing, promoter, artist official, and venue sources are merged into one event card rather than simply deleting one source.
- Merge quality is source-aware: placeholders such as `TBA` / `依官方售票頁公告` cannot overwrite richer verified prices, while seat-layout URLs, price rules, notes, and source references are preserved and merged.
- UI structure and existing visual design are unchanged; this update is data-quality and True3D functionality only.

## v0.33 refinement
- Original homepage design preserved.
- Taipei Arena auto-3D now keeps the complete physical seating bowl visible.
- HD hero asset and distinct Featured Concert carousel imagery.
- Upcoming “view more” supports dynamic Taiwan city/region search plus venue/artist keyword search.
- Added Taiwan ticket-platform discovery layer while retaining Taiwan-only filtering.
