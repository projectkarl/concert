# NEUL v0.40.8 Test Report

Date: 2026-09-20 (Asia/Taipei)

## Result
PASS

## Regression suite
`npm run check` passes with:
- 75 packaged fallback events
- 24 venue models
- 14 ticket source families + artist/venue official feeds
- every-event custom 3D audit
- official seat-map / OCR / exact-section pricing guards
- PWA + IndexedDB + WebGL + Canvas fallback
- daily calendar and source info UI

## New v0.40.8 checks
PASS — ticket lifecycle transitions:
- before sale time → `pre-sale`
- after sale start, same Taiwan date → `sale-day`
- next Taiwan date after final sale milestone → `post-sale-day`

PASS — multi-stage sale sequencing:
- earlier member/presale milestone is shown first
- after that sale day, the next general-sale milestone becomes the next ticket countdown
- after all known sale dates pass, the UI falls through to show countdown

PASS — sale-date parsing fixtures:
- `正式售票時間：10/14 12:00`
- `加場全面開賣：2026.08.09 (日) 12PM`
- `啟售時間：2026 年 7 月 19 日 13:00開賣`

PASS — runtime automation guards:
- one-hour events API cache + next-update metadata
- one-hour browser auto verification
- minute-level local lifecycle recalculation
- ended 3D layout cleanup + next-event selection
- Featured pool up to 10 events, rotating every 10 seconds
- new service-worker cache version includes `lib/ticket-lifecycle.js`

## Current-date state fixture (2026-09-20 17:42 +08:00)
The packaged data correctly classifies:
- YESUNG (general sale 18:00 today) → pre-sale / ticket countdown
- KIM JI WON (general sale 12:00 today) → sale-day

This fixed-time fixture validates the exact user-requested transition on the current release date without making the test dependent on the real clock.

## UI lock verification
`index.html` SHA-256 is identical to v0.40.7.
`styles.css` SHA-256 is identical to v0.40.7.

Therefore no website layout redesign was introduced.
