# NEUL v0.40.14 Test Report

Date: 2026-09-23

## Scope

Regression and venue-calibration validation for the merge of v0.40.13 Verified316 data logic and the v0.40.11.1 Taipei Dome recalibration.

## Automated checks

- Core NEUL v0.40 regression suite
- Coverage Auditor / Auto Backfill checks
- Event lifecycle + Archive20 checks
- News / mobile navigation checks
- Venue policy / topology integrity checks
- 3D precision / non-regression checks
- Official-seat-map checks
- v0.40.13 Verified316 checks
- Taipei Dome recalibration checks
- New v0.40.14 venue calibration checks
- Baseline SHA-256 manifest verification

## v0.40.14 venue assertions

- Taipei Dome uses an asymmetric footprint and dedicated Dome renderer branch.
- NTSU lower activity seats are structural/event-flexible and are not exposed as fabricated permanent ticket-section names.
- NTSU fixed-tier metadata contains verified official sub-section / seat-capacity metadata.
- Taipei Music Center 1F is event-flexible and non-ticket in the permanent venue base.
- Taipei Music Center 2F mapped official section capacity: 1,463.
- Taipei Music Center 3F visible mapped section capacity: 1,671; official published total retained: 1,675; delta: 4.
- Internal sightline calibration references are not emitted into the public UI.

## Known calibration boundary

Taipei Arena 2F per-section row maxima are not globally overridden in this release. A blanket guessed row depth would be less accurate than leaving the current model conservative; future calibration should be per official section / row.

## Result

PASS — the complete `npm run check` chain passed, including baseline verification (31 core files / 54 required features). All JavaScript / MJS files also pass `node --check`, the public app bundle contains no internal sightline-source marker, and a local static-server smoke check successfully serves the NEUL entry page and venue geometry module.
