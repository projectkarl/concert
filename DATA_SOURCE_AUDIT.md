# NEUL v0.35 Data Source Audit

Scope: Taiwan performances only. Artist nationality is unrestricted; overseas performances and overseas venues are excluded.

Automatic public-source layers:
1. Live Nation Taiwan
2. Taipei Arena official published events
3. Kaohsiung Arena official calendar
4. Artist / agency official tour pages
5. Taiwan ticket-platform discovery: tixCraft, KKTIX, Ticket Plus, Kham
6. Curated verified fallback records when an upstream source is temporarily unavailable

Known-gap regression cases added:
- LE SSERAFIM — 2026/11/14–15 — NTSU Arena — tixCraft official event page
- KIM JI WON — 2026/11/08 — Legacy TERA — tixCraft official event page

All discovered records still pass the Taiwan-region guard before reaching the frontend.


## v0.35 duplicate + award audit
- Stray Kids RUN IT TAIPEI: official promoter and tixCraft records are treated as one event. tixCraft seat-map URL is retained; richer verified price data is protected from placeholder overwrite.
- 2026 Asia Artist Awards in Kaohsiung: added from official tixCraft public activity data and seat-map source.
- Dedupe identity: same Taiwan-local calendar date + canonical venue + artist/title identity overlap, with exact normalized source URL as an additional match path.
- Source priority is used only to choose richer/current fields; all distinct official source references are retained in `sourceRefs`.
- Overseas event records remain excluded by the Taiwan-only gate.

## v0.35 automatic sync audit
- `/api/events` remains the primary six-hour cached discovery/sync endpoint.
- tixCraft / KKTIX / Ticket Plus / KHAM detail parsing now returns `sectionPriceRules` when zone labels and prices are recognizable.
- `seatLayoutSourceUrl`, total `price`, and structured zone prices are merged across official sources.
- `ensureAutoEventLayout()` synchronizes those fields into both auto-generated and hand-calibrated event layouts without overwriting calibrated geometry/distances.
- Ambiguous zone names remain unmatched rather than receiving guessed prices.
