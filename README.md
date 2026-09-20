# NEUL

## v0.40.6 Taiwan Coverage / Daily Concert Calendar / 3D QA (2026-09-20)

- The website/homepage design remains locked to the v0.40 line. The only visible layout addition is inside the existing **「查看更多活動」** modal: a month calendar plus per-day concert agenda.
- Curated offline fallback increased from 66 to **75 officially cross-checked Taiwan events**. Live discovery remains the primary source and now has deeper tixCraft/KKTIX/Ticket Plus/ERA/ibon coverage plus complete iNDIEVOX index ingestion.
- `/api/events` exposes source-health and explicitly sets `completenessGuaranteed: false`; NEUL no longer equates a fixed seed count with “all concerts in Taiwan”.
- Each event still receives its own event-specific 3D layout, but 3D quality is graded separately: `official-map-calibrated`, `official-map-auto-verified`, `official-map-partial`, `official-map-linked-pending`, or `venue-derived-draft`.
- A venue-derived draft is renderable 3D, **not proof that it matches the official event map**. Official-map status requires the event map plus OCR/Vision QA; section pricing is never guessed from color order alone.
- Current static audit: **75/75 unique event-specific layouts**, 9 with direct official-map/manual calibration in the packaged fallback, and 66 requiring live official-map discovery / QA before being presented as officially calibrated.
- Newly cross-checked fallback events include Engelbert Humperdinck, STAYC, Novelbright, Hitsujibungaku, Fujii Kaze, Jason Mraz, yung kai, BINI and Gareth Gates.

See `DATA_COVERAGE_3D_AUDIT_v0.40.6.md`, `CUSTOM_3D_AUDIT_v0.40.6.md`, `TEST_REPORT_v0.40.6.md`, and `V0.40.6_CHANGELOG.md`.

## v0.40.4 BTS / BABYMONSTER / Auto-generation audit (2026-09-20)

- Website design remains locked to the v0.40 line; `index.html` and `styles.css` are unchanged from v0.40.3.
- BTS Kaohsiung uses a manually calibrated central circular core plus four diagonal extensions, with complete A1–A13 / M1–M13 / Y1–Y14 / R1–R14 floor families.
- Central-stage shows no longer inherit the generic end-stage rear LED wall.
- BABYMONSTER Taipei has an event-specific main stage + runway + end platform + FOH layout and complete published zone-price bindings.
- Seat-map automation now attempts Traditional-Chinese + English OCR, expands section ranges such as `VIP A～E` / `特A～C` / `黃3A～J`, anchors dark-stage selection with the OCR `STAGE` token when available, and requires diagonal evidence before generating an X-stage.
- Calibrated special-stage geometry is protected from low-confidence auto-regeneration; price colors are never guessed from palette order without OCR legend evidence.
- Ticket-page seat-map eligibility checks secondary/ticket URLs in addition to the primary source URL.

See `AUTO_GENERATION_AUDIT_v0.40.4.md`, `V0.40.4_CHANGELOG.md`, and `TEST_REPORT_v0.40.4.md`.


## v0.40.2 Full Audit (2026-09-20)
- Fixed premature “ended” state with session-aware lifecycle rules.
- Added izna + Zepp New Taipei 3D baseline.
- Expanded discovery to 14 Taiwan ticket sources including iNDIEVOX; tixCraft crawl depth increased and source-health diagnostics added.
- All venue grounds are light in WebGL and Canvas fallback; high-quality 3D seat density and render DPR increased.
- See `FULL_AUDIT_2026-09-20.md`.
# NEUL v0.40 — Seat Map Vision + BTS / T-ARA Source Audit

Taiwan-only concert discovery and true WebGL venue/seat-view prototype for Vercel Hobby. The existing NEUL UI is preserved. v0.40 fixes a key automation gap: finding an official seat-map URL is no longer treated as equivalent to building an event-specific 3D layout.

## v0.40 highlights

- Official seat-map images can now be fetched through a same-origin, allowlisted proxy and fingerprinted by SHA-256 content hash.
- The browser-side `seat-map-intelligence.js` analyzes the actual official image pixels to derive a conservative stage profile and ticket-zone blocks for auto-generated event drafts.
- Auto-generated events consume an official map immediately. Hand-calibrated high-profile layouts establish a verified baseline; if the official seat-map image bytes later change, the new hash triggers a fresh event-specific analysis instead of silently keeping the stale layout.
- Official ticket pages are still the authority for prices. Image analysis does not invent ticket prices; only recognizable official section-price data is mapped into 3D.
- The six-hour official monitor now checks both `sourceUrl` and `secondarySourceUrl`. This fixes cases such as BTS where Live Nation is the main source but the detailed official map/prices live on tixCraft.
- KKTIX discovery now covers the global event index through multiple pages plus promoter subdomains including WANIN Visual (`wve.kktix.cc`), which fixes the missing T-ARA event.
- BTS WORLD TOUR 'ARIRANG' IN KAOHSIUNG now uses a calibrated event layout based on the official tixCraft map: central stage, four diagonal stage arms, floor-zone families and section prices.
- T-ARA Fancon 2026 in Taiwan is included with the official KKTIX seat map, event-specific Kaohsiung Music Center layout and section-price bands.
- Prior protections remain: full base venue tiers are preserved, seats cannot occupy stage/FOH production zones, ended event layouts leave the active venue selector, and section prices are not copied indiscriminately across unrelated zones.

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

`/api/events` is cached for six hours. On active use, stale data revalidates after that interval; the UI shows the actual last-sync timestamp and calculated next expected refresh time. A daily Vercel warm-up cron remains for Hobby-friendly background warming.

## v0.40.1 automatic seat-map pipeline

This build keeps the v0.40 interface and extends only the automation path:

1. Scan supported official ticket sources and event pages.
2. Resolve the real seat-map image from normal/lazy/srcset/CSS image references.
3. Fetch the official image through an allow-listed proxy and fingerprint it with SHA-256.
4. Run client-side Vision segmentation plus zero-key Tesseract.js OCR in the background.
5. Read numeric / Latin zone labels such as `106`, `2A`, `VIP A`, then reconcile them against the fixed venue geometry by label + spatial position.
6. Reuse calibrated venue geometry for matched sections; create image-derived blocks only for event-only floor/VIP zones that have no structural match.
7. Build/update `auto-<event-id>` so every event owns a separate 3D layout. A changed official seat-map hash triggers regeneration.
8. Cache the compact analysis on the device; unchanged official maps skip repeated OCR.

Current discovery adapters cover tixCraft, KKTIX, Ticket Plus, KHAM, FamiTicket, udn, ibon, MNA, ERA/ticket.com.tw, TixFun, OPENTIX, FANSI GO and Books Tickets, plus artist/venue official feeds. Sites can block automated fetching or change markup; those cases fall back to the verified venue model instead of inventing a seat map.


## v0.40.7 活動資料來源 i
活動卡、每日演唱會行事曆與活動明細提供小型 `i` 圖示；桌機 hover、手機點擊可查看該場目前實際使用的官方售票、藝人/主辦、場館、官方座位圖與 3D 校正來源。
