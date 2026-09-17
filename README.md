# NEUL v0.30 — Venue Realism & Calibration Pass

Taiwan-first concert discovery + venue 3D/PWA prototype, optimized for Vercel Hobby.

## v0.30 highlights

- Re-audited all 11 existing venue models for row-depth movement, section orientation and stage-facing camera logic.
- Corrected Kaohsiung Arena 219 rear-row depth to support public seat-view evidence reaching row 41.
- Extended NTSU upper calibration to row 16 and retained reverse-row logic where community evidence shows larger printed row numbers can be physically closer to the front.
- Side-seat camera target now biases toward the performance surface / runway rather than the LED wall.
- Generic end-stage seats that fall behind the stage are flagged as rear-stage baseline positions; the LED rear no longer glows like a second screen.
- WebGL atmosphere pass: improved specular lighting, runway edge lights, cross-truss depth, sparse audience silhouettes and upgraded stage technical details.
- Existing PWA, multilingual UI, dark/light theme, reminders, Upcoming explorer, Auto 3D and venue pricing remain intact.

## Accuracy boundary

The venue models are calibrated reconstructions, not BIM or official per-seat CAD. Event-specific official ticket maps always take priority over the generic venue baseline. Community seat-view reports are used only as external validation evidence and are not copied into NEUL.
