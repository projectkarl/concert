# NEUL v0.41 — Auto Event 3D + Strict Archive + Light Venue Floor

Taiwan-only concert discovery and true WebGL venue/seat-view prototype for Vercel Hobby. The existing NEUL interface is preserved. v0.41 strengthens the automatic event-to-3D pipeline, keeps the physical venue complete, makes the venue floor easier to read, and makes Archive strictly ended-only.

## v0.41 highlights

- Official seat-map images can now be fetched through a same-origin, allowlisted proxy and fingerprinted by SHA-256 content hash.
- The browser-side `seat-map-intelligence.js` analyzes the actual official image pixels to derive a conservative stage profile and ticket-zone blocks for auto-generated event drafts.
- Auto-generated events consume an official map immediately. Hand-calibrated high-profile layouts establish a verified baseline; if the official seat-map image bytes later change, the new hash triggers a fresh event-specific analysis instead of silently keeping the stale layout.
- Official ticket pages are still the authority for prices. Image analysis does not invent ticket prices; only recognizable official section-price data is mapped into 3D.
- The six-hour official monitor now checks both `sourceUrl` and `secondarySourceUrl`. This fixes cases such as BTS where Live Nation is the main source but the detailed official map/prices live on tixCraft.
- KKTIX discovery now covers the global event index through multiple pages plus promoter subdomains including WANIN Visual (`wve.kktix.cc`), which fixes the missing T-ARA event.
- BTS WORLD TOUR 'ARIRANG' IN KAOHSIUNG now uses a calibrated event layout based on the official tixCraft map: central stage, four diagonal stage arms, floor-zone families and section prices.
- T-ARA Fancon 2026 in Taiwan is included with the official KKTIX seat map, event-specific Kaohsiung Music Center layout and section-price bands.
- Prior protections remain: full base venue tiers are preserved, seats cannot occupy stage/FOH production zones, ended event layouts leave the active venue selector, and section prices are not copied indiscriminately across unrelated zones.

- While the page is open, NEUL now schedules the next source refresh from the API-provided `nextUpdateAt`; at the six-hour boundary it refreshes the event feed automatically instead of requiring a manual browser reload.
- Newly discovered events with official seat maps automatically enter the seat-map image pipeline. Event-floor blocks are rebuilt from the current official image while fixed venue bowls remain intact.
- Automatic image-derived floor blocks are restricted to the central event floor; outer fixed-bowl colors no longer create duplicate fake floor blocks. Production/stage overlaps are filtered before seats are generated.
- Archive is now based on the actual calculated event end time. A future record cannot enter Archive merely because a stale `historical` flag exists. Date-only/midnight ranges are kept current through the end of the listed day.
- Event-specific layouts leave the normal VENUE selector immediately after the event has actually ended.
- WebGL and Canvas fallback both use a lighter neutral venue floor. Stage deck, front fascia, shallow stairs, runway and extra-stage surfaces are brighter and easier to distinguish without changing venue geometry.

## Automatic seat-map pipeline

For every current event that exposes an official map, NEUL now runs this pipeline:

1. Discover / refresh official event page(s).
2. Extract the best official seat-map image URL.
3. Fetch the image through `/api/seat-map-image` and calculate an image-content hash.
4. Parse recognizable section-price data from official ticket-page text.
5. Analyze seat-map pixels for stage position/profile and colored ticket-zone components.
6. Create or update the event-specific 3D draft while keeping the full physical venue model underneath.
7. On later refreshes, compare the official image hash. If the bytes changed, rerun the event-specific map analysis.

The frontend checks all current events with official seat maps in small batches instead of only the first few events.

## Important accuracy boundary

Automatic image analysis is a conservative fallback, not an OCR/CAD engine. Publisher graphics differ greatly. Known high-profile events can keep a calibrated event layout, while future image changes can trigger automatic regeneration. If a map is ambiguous, NEUL should keep the last verified geometry or mark the section/map as pending rather than fabricate exact seat coordinates.

## Source coverage

Automatic public-source layers include Live Nation Taiwan, official Taipei/Kaohsiung venue calendars, artist/agency tour pages, and nine Taiwan ticket-platform families: tixCraft, KKTIX, Ticket Plus/遠大, KHAM/寬宏, FamiTicket, udn tickets, ibon, MNA/牛耳 and 年代售票.

`/api/events` is cached for six hours. On active use, NEUL schedules a refresh at the returned `nextUpdateAt`, then reruns official-map hydration for current events. The UI shows the actual last-sync timestamp and calculated next expected refresh time. A daily Vercel warm-up cron remains for Hobby-friendly background warming.
