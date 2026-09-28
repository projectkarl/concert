# NEUL v0.40.2 UX.2 Test Report

## New checks
- Mobile Planner/作戰 button hidden and bottom nav reflows to 4 columns: PASS
- View More close button fixed to mobile safe-area top-right: PASS
- Backdrop and Escape close path retained: PASS
- Entertainment News section hooks: PASS
- Default category = Korean: PASS
- Four categories KR/TW/US-EU/Other: PASS
- Keyword query support: PASS
- RSS XML title/source/date parser with mocked feed: PASS
- API edge cache header: PASS
- No user API key required: PASS
- PWA app shell includes `news.js`: PASS
- Four-language static news UI strings: PASS

## Regression
Run `npm run check` to validate original NEUL v0.40.2 Full Coverage / Calendar / 3D / official-map / lifecycle / UX baseline together with these new checks.
