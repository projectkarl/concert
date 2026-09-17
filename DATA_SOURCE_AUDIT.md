# NEUL v0.37 Data Source Audit

Audit date: 2026-09-17

Scope: Taiwan performances only. Artist nationality is unrestricted; overseas performances and overseas venues are excluded before frontend display.

## Automatic public-source layers

1. Live Nation Taiwan
   - Taiwan discovery/index pages
   - known Taiwan venue pages
   - bounded artist-page -> event-page follow-up
2. Taipei Arena official published events
3. Kaohsiung Arena official calendar
4. Artist / agency official tour pages
5. Taiwan official ticket-platform discovery
   - tixCraft / 拓元
   - KKTIX
   - Ticket Plus / 遠大售票
   - KHAM / 寬宏售票
   - FamiTicket / 全網售票
   - udn 售票網
   - ibon 售票 (`/ActivityInfo/Details/...`)
   - MNA / 牛耳藝術 (`ticket.mna.com.tw`)
   - 年代售票 (`ticket.com.tw`)
6. Curated verified fallback records when an upstream source is temporarily unavailable or changes HTML

The sources are merged, normalized and deduplicated. A single event discovered by several official sources is shown once while useful ticket, seat-map and source metadata are combined.

## Verified fallback coverage added in v0.37

- 傳說對決十週年演唱會 — 2026/10/31 — 臺北大巨蛋 — Garena + ibon
- Silica Gel Asia Tour — 2026/10/17 — Legacy Taipei — KKTIX
- MAMAMOO WORLD TOUR <4WARD> in TAIPEI — 2026/11/28–29 — 臺北小巨蛋 — ibon / promoter-confirmed public information
- YOASOBI DOME LIVE 2026-2027 “SUPER PLANET” TAIPEI — 2027/01/09–10 — 臺北大巨蛋 — Ticket Plus
- BABYMONSTER WORLD TOUR [CHOOM] IN TAIPEI — 2026/11/21–22 — 臺北小巨蛋 — Ticket Plus schedule/price fallback plus YG official tour source

Previously retained verified fallbacks include Charlie Puth, Post Malone, BTS, BIGBANG, Bruno Mars and other Taiwan events.

## Discovery policy

No single public Taiwan concert feed is complete. NEUL therefore uses overlapping official/public source layers. Third-party calendars can help identify gaps during development, but event facts are promoted into the verified fallback layer only after an official venue, ticketing platform, promoter, artist or agency source supports them.

Runtime discovery is intentionally bounded for Vercel Hobby safety, so the fallback layer protects major verified events from temporary upstream failures. The architecture can add future ticket sources without changing the homepage UI.

## Seat-map / price sync boundary

- Recognizable section-price pairs become `sectionPriceRules`.
- `seatLayoutSourceUrl`, total `price`, structured zone prices and source references are merged across official sources.
- 3D layouts consume exact section-price rules only; overall event prices are not copied onto every 3D section.
- A refreshed event map overlays the full base venue model. It cannot erase a physical floor or fixed tier.
- Ambiguous or not-yet-machine-readable zone mappings stay unmatched/TBA instead of being guessed.
