# NEUL v0.40.9 Test Report

Date: 2026-09-21

## Result

PASS — full regression suite after concert-coverage reconciliation.

## Coverage checks

- Month URL generator covers September 2026 and October 2026 and scans at least 20 calendar endpoints including the root calendar.
- September and October fixtures parse independently and reconcile against an advertised 315-show reference count.
- Cross-month event mapping verifies `izna` at Zepp New Taipei resolves to the Zepp calibrated model.
- Non-performance ticket product fixture (fan return bus) is excluded while the real LANY performance remains.
- API emits coverage reference count / parsed count / ratio / completion / scanned-month / successful-page telemetry.
- Frontend stores discovery telemetry and shows `補漏對帳 parsed/reference (ratio%)` in the full event-list status.

## aespa guard checks

- aespa reference exists.
- Exactly 14 official floor blocks (001–014) are present.
- No unverified runway or B-stage is present.
- Generic vertical support towers and side speaker arrays are disabled.
- Official-map preview path remains available for the reference layout.

## Existing regression coverage retained

- 101 bundled fallback events remain available for offline/source-failure fallback only.
- 12 retained calibrated 3D venues remain gated; uncalibrated venues cannot silently fall back to Taipei Dome/generic 3D.
- TICC topology guard remains active.
- News stays at the bottom and Japan remains an independent news category.
- Mobile event list / calendar and safe-area controls retain their prior checks.
