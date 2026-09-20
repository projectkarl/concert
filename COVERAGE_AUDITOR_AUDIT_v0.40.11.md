# NEUL v0.40.11 — Full Coverage Auditor Audit

## Goal

Prevent NEUL from treating a fixed fallback count as the Taiwan concert total. v0.40.11 introduces an independent coverage-audit layer that cross-checks official ticket/promoter discovery against official venue calendars and automatically backfills venue-only events.

## New coverage layers

1. Existing ticket-platform discovery (14 platform families)
2. Live Nation Taiwan / artist-official discovery
3. Existing Taipei Arena and Kaohsiung Arena official calendars
4. New Taipei Music Center official event calendar
5. New TICC official activity calendar
6. New Zepp New Taipei official schedule
7. New Kaohsiung Music Center / LIVE WAREHOUSE official programme feed
8. Coverage auditor compares venue-calendar events against non-venue official discovery

## Coverage-gap rule

A `coverage gap` is created when an independent official venue calendar publishes an event but ticket/promoter/artist discovery has not independently found a matching event (same Taiwan-local date, canonical venue and artist/title identity).

The venue-calendar event is still merged into the public event feed immediately as a safe backfill. It is marked for ticket-source follow-up so sale date, ticket platform, price, official seat map and event-specific 3D QA can be filled later.

## KKTIX improvement

- Pages 1–12 are checked every refresh.
- Deeper pages 13–60 are rotated in hourly windows.
- Known organizer roots include chuanyeah, WVE, KKLive Taiwan, ATC Taiwan, Offtime Music and LDH.
- Organizer subdomains discovered from KKTIX event links are sampled and crawled automatically so organizer-only listings can feed back into the main KKTIX event queue.

## Source-health behavior

Every source exposes discovered/parsed/error counts. A source returning zero results or errors is a warning, not proof that no concerts exist.

`/api/events` now returns:
- `coverage`
- `coverageAudit`
- `discovery.coverageGaps`
- `discovery.needsTicketBackfill`
- ticket + venue source health

`/api/coverage` exposes a lightweight monitoring view of the same audit.

## Seat-map / 3D interaction

Coverage backfill does not claim a venue-calendar-only event has an official seat map. The future-event pipeline still creates a unique event-specific 3D draft, then upgrades it only after the official ticket/seat-map resolver finds evidence and OCR/Vision passes QA.

## Limitations

No public web crawler can prove absolute completeness for every Taiwan performance, especially private shows, unannounced events, login/CAPTCHA-protected pages or events announced only on social media. v0.40.11 improves completeness confidence by making blind spots observable instead of silently treating the fallback catalog as complete.
