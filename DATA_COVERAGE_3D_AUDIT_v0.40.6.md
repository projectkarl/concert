# NEUL v0.40.6 — Taiwan event coverage / 3D / pricing audit

Audit date: 2026-09-20 (Asia/Taipei)

## Executive result

- A fixed packaged list cannot honestly guarantee **every** Taiwan concert. Taiwan has no single public registry covering major arena concerts, independent live houses, free performances, local promoters, rescheduled shows and newly announced events.
- v0.40.5 had 66 packaged events and all 66 had event-specific 3D, but external cross-checking found real announced Taiwan shows missing from that fallback list. Therefore “66/66 3D” was a 3D integrity statement, not a nationwide coverage statement.
- v0.40.6 changes the architecture to **official live discovery first + curated fallback second + source-health reporting**. The fallback now contains 75 cross-checked events.
- Static 3D audit: **75/75 events have a unique event-specific layout**, but only **9** packaged events have a direct official seat-map/manual calibration. The other 66 are venue-derived event drafts until the official seat map is found and passes client OCR/Vision QA.

## Cross-checks that exposed the old coverage gap

The following current Taiwan events were absent from the v0.40.5 66-event fallback and are now added as verified fallbacks:

- Engelbert Humperdinck — 2026/09/23 19:30 — TICC — KKTIX official
  - https://globalmusic.kktix.cc/events/5dee326c
- STAYC — 2026/10/11 17:00 — TICC — KKTIX / Far Glory Creative official
  - https://farglorycreative.kktix.cc/events/cacf3d76
- Novelbright — 2026/10/24 18:00 — New Taipei City Exhibition Hall — artist official + ERA Ticket
  - https://novelbright.jp/news/detail/2355
  - https://ticket.com.tw/application/UTK02/UTK0201_.aspx?PRODUCT_ID=P19QK265
- Hitsujibungaku — 2026/10/24 and 10/25 18:30 — LIVE WAREHOUSE — KKTIX official
  - https://baodaorecords.kktix.cc/events/ff315f99
  - https://baodaorecords.kktix.cc/events/7d4a9a50
- Fujii Kaze — 2026/10/31 19:00 — Kaohsiung National Stadium — KKTIX / KKLIVE official
  - https://kklivetw.kktix.cc/events/34473ba4
- Jason Mraz — 2026/11/02 19:30 — Nangang Exhibition Center Hall 1 4F — ERA Ticket official
  - https://ticket.com.tw/Application/UTK02/UTK0201_.aspx?PRODUCT_ID=P1AT93WA
- yung kai — 2026/11/11 20:00 — Zepp New Taipei — tixCraft official
  - https://tixcraft.com/activity/detail/26_yungkai
- BINI — 2026/11/15 17:00 — New Taipei Exhibition Hall — tixCraft official
  - https://tixcraft.com/activity/detail/26_bini
- Gareth Gates — 2027/01/24 18:00 — Zepp New Taipei — KKTIX official
  - https://createwonderfullife.kktix.cc/events/339d88a-a01

This is not intended to be a manually frozen exhaustive list. Current iNDIEVOX and ticket-platform indexes contain additional local / independent shows; v0.40.6 now ingests those indexes more broadly instead of pretending the fallback list is nationwide-complete.

## Discovery architecture

Configured ticket-platform families:

1. tixCraft / promoter subdomains
2. KKTIX / promoter subdomains
3. Ticket Plus
4. KHAM / Kham
5. FamiTicket
6. udn tickets
7. ibon
8. MNA
9. ERA / ticket.com.tw
10. TixFun
11. OPENTIX
12. FANSI GO
13. iNDIEVOX
14. Books Tickets

Additional layers: Live Nation Taiwan, artist/agency official tour pages, Taipei Arena official feed and Kaohsiung Arena official feed.

v0.40.6 changes:

- tixCraft accepts promoter subdomains and scans up to 128 discovered detail URLs.
- KKTIX scans 20 global index pages plus selected promoter indexes, then validates event details.
- Ticket Plus / ibon / ERA detail depth is increased.
- ERA scans overall concert category plus north/central/south/east category views.
- iNDIEVOX parses its complete table/card indexes so shows beyond detail-fetch caps are still discovered; detail pages later enrich price/map data.
- Taiwan markers now include all counties/offshore areas and common live-house names used by Taiwan shows.
- `/api/events.coverage` exposes source warnings / empty sources / official-map count / mapped-price count and explicitly states that completeness is not guaranteed.

## 3D correctness definition

NEUL now treats these as separate claims:

1. **Event-specific 3D exists** — the event owns a unique layout and does not directly reuse the venue base layout.
2. **Official seat map linked** — an official event map has been located.
3. **Official map auto-verified** — OCR/Vision has analyzed the official map, stage confidence is at least 0.82 and at least two sections are mapped.
4. **Price mapping verified** — official section-price data is mapped to matching 3D section labels. Color palette order alone is never treated as price evidence.

A show with only (1) is shown as `venue-derived-draft`, not “official-map verified”.

Static packaged audit at build time:

- Total fallback events: 75
- Unique event-specific layouts: 75/75
- Direct official seat-map/manual calibration in package: 9
- Venue-derived / live-map-follow-up required: 66

The live browser pipeline can upgrade those 66 after deployment when official seat maps are successfully fetched and analyzed.

## Price correctness

- Event-level price text can be displayed when confirmed on an official source.
- Exact 3D section prices are only displayed when section labels can be reliably matched.
- If an official page publishes price bands but not a parseable seat map, NEUL keeps the official event-level price bands and leaves section-level 3D pricing unverified.
- Standing live-house events do not invent fixed seats.

## Daily concert calendar

The existing 「查看更多活動」 modal now contains:

- month navigation;
- a day cell with the number of shows on that date;
- daily agenda with time, artist, venue/city and 3D verification state;
- existing city / month / date-range filters;
- multi-day/session-aware expansion: events with explicit sessions appear on each actual show date.

The homepage and original NEUL visual structure are unchanged; calendar UI is scoped to the existing modal only.

## Remaining boundary

No crawler can prove 100% coverage of every Taiwan performance when an organizer publishes only on social media, blocks automated access, announces a show after the last refresh, or uses a ticket system not yet configured. v0.40.6 makes that limitation visible and testable instead of silently declaring completeness.
