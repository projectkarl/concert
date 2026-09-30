# NEUL v0.40.2 Complete Automation Test Report

Date: 2026-09-20 (Asia/Taipei)
Baseline: **NEUL v0.40.2 – Full Source Audit + izna + Lifecycle Fix + Light Floor + 3D**

## Result

PASS — `npm run check`

- 101 refreshed fallback events
- 101 / 101 unique event-specific 3D layouts
- 0 event-specific 3D failures in the seed audit
- 31 event records currently rely on runtime venue fallback geometry when a static calibrated venue model is not available
- 14 ticket-platform source families + artist / promoter / venue official feeds
- Full Coverage Auditor + Auto Backfill enabled
- Hourly event/API revalidation while the site is active
- Daily scheduled warm-up remains enabled
- Silent Featured autoplay: 10 seconds, up to 10 active events, no visible AUTO/10s label
- Daily concert calendar enabled while retaining the original full event list
- Multi-session events expand to each performance date in the calendar
- IVE 2026 historical example remains dropdown-only
- Official position/seat map renders directly below the sightline preview explanation
- Third-party repost URLs are not accepted as the official-map display source
- Official seat-map URL alone is **not** treated as verified
- OCR/Vision QA is required before `official-map-verified`
- Special central-X stage fixture successfully upgraded after Vision QA
- New event at a previously unknown venue automatically receives a runtime venue model and unique custom 3D
- Light floor / ground regression check passed

## Coverage / discovery checks

- tixCraft: full current activity index + up to 128 detail pages
- KKTIX: first 12 index pages every cycle + rotating pages 13–60 + promoter subsite discovery
- KHAM: concert category + recent category + general current-program index; detail cap raised to 96
- Ticket Plus, FamiTicket, udn, ibon, MNA, 年代, TixFun, OPENTIX, FANSI GO, iNDIEVOX, 博客來 retained
- Venue-calendar coverage auditor and `needsTicketBackfill` queue retained
- Recursive official-seat-map resolver follows an official index/promoter page to official ticket detail pages before concluding that no map is available

## Important interpretation

The 101 fallback events are not presented as the complete Taiwan concert total. They are the offline resilience set. The runtime list is built by merging fallback records with official-source discovery and venue-calendar coverage gaps. A source failure or inaccessible/private event can still prevent discovery, so the product does not claim mathematical 100% completeness.
