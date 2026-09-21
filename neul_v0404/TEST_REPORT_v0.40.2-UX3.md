# NEUL v0.40.2 UX.3 Test Report

## Scope
- Entertainment News layout aligned to native NEUL grid/cards
- Selective 3D policy for temporary outdoor/ad-hoc venues
- Jason Mraz / Nangang Exhibition Hall 1 4F venue correction
- Official event page -> official seat-map image resolver/display

## Results
- Full project check: PASS
- Seed events: 101
- 3D eligible events: 99 / 99 PASS
- Temporary outdoor 3D exclusions: 2 PASS
  - WATERBOMB Kaohsiung / Dream Mall opposite plaza
  - Penghu Guanyinting Recreation Area festival event
- Jason Mraz venue mapping: `nangang-exhibition-hall1-4f` PASS
- Nangang base geometry: flat FLOOR-only exhibition hall PASS
- Official source-page seat-map resolver mock (ticket.com.tw / 場地示意圖): PASS
- Entertainment News `grid-area: news`: PASS
- Native light/dark NEUL card styling: PASS
- Existing Coverage Auditor / Auto Backfill: PASS
- Existing list/calendar / Featured / IVE / Archive lifecycle: PASS
- BaselineSafe verification: 16 core files / 21 required features PASS

## Important behavior
Temporary outdoor locations remain in the event list and calendar, but NEUL does not fabricate row/seat 3D for them. Known stadiums/arenas and recurring indoor concert venues remain eligible.
