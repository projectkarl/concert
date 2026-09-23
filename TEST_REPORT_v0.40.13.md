# NEUL v0.40.13 Test Report

## Scope
Verified 316 discovery reconciliation, stale-data reduction, entertainment-news recency/order, progressive News More, and existing 3D/lifecycle non-regression.

## Expected policy
- twconcertview advertised count is a candidate coverage target, not a verified final count.
- Only official/promoter/ticket/venue-confirmed facts may upgrade a candidate record.
- Upcoming discovery persistence contains only non-ended events.
- Archive is independently capped at 20.
- Entertainment News is newest-first and restricted to the last 7 days, with up to 24 recent results and 8 displayed initially.

## Automated checks
Run `npm run check`.

## Result
`npm run check` PASS — baseline verified: 27 core files / 50 required features. Existing WebGL2 3D, official-map resolver, Archive20, mobile list/calendar, and venue topology tests all remain green.
