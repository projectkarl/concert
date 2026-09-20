# NEUL v0.40.11 Test Report

## Result

PASS

## Automated checks

- `npm run check`: PASS
- Existing Taiwan-only regression suite: PASS
- Future-event automatic custom 3D pipeline: PASS
- New TMC calendar parser fixture: PASS
- New TICC calendar parser fixture: PASS
- New Zepp New Taipei schedule parser fixture: PASS
- New KPMC / LIVE WAREHOUSE parser fixture: PASS
- Coverage-gap auditor fixture: PASS
- Venue-only backfill / ticket-follow-up detection: PASS
- KKTIX rotating deep-page discovery wiring: PASS
- KKTIX organizer-root discovery wiring: PASS
- All JS/MJS syntax checks: PASS

## Future 3D simulation

- Known venue new event => unique `auto-<event>` layout: PASS
- Second event at same venue => distinct layout: PASS
- Unknown Taiwan venue => runtime venue model + unique event layout: PASS
- Missing official seat map remains pending QA rather than being falsely marked verified: PASS

## UI lock

v0.40.10 and v0.40.11:
- `index.html`: SHA-256 identical
- `styles.css`: SHA-256 identical

No website layout redesign was introduced.

## External-source note

The local sandbox used for code tests cannot reliably reach every external venue website, so live upstream availability is represented by runtime source-health warnings. Current public-web verification confirms that TMC, TICC, Zepp New Taipei and KPMC expose official event/schedule pages suitable for independent coverage cross-checking.
