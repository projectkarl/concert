
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

## v0.40.2 Coverage build
This package keeps the v0.40.2 interface and 3D base while adding Full Coverage Auditor + Auto Backfill. The 101 bundled events are fallback data; live event completeness is improved by ticket/promoter/artist discovery plus independent official venue calendars. See `V0.40.2_COVERAGE_CHANGELOG.md` and `TEST_REPORT_v0.40.2-Coverage.md`.


## v0.40.2 UX + continuity safeguards

- Upcoming can switch between the full list and a standard 6-week calendar view.
- Modal close control stays at the top while scrolling.
- Countdown refresh is aligned to real second boundaries to reduce browser timer drift.
- The selected 3D zone label follows the chosen section/row position.
- Selected zones render visible aisle surfaces and chair-like seats; Canvas fallback also shows simplified seats/aisles.
- IVE 2026 remains available only as a Taipei Arena activity-layout example.
- `NEUL_BASELINE_MANIFEST.json` records required capabilities and hashes of the core source-of-truth files. Run `npm run verify:baseline` before any future repack/update.

Deleting the only Git repository or working folder can lose manual edits and any browser-local seat-map analysis cache. Keep the latest ZIP/release or a Git tag as the canonical source. Runtime-discovered public events and official maps can be rediscovered, but unpublished/manual calibration work should be committed or included in the release package.


## v0.40.2 UX.2：行動版修正＋演藝新聞
- 行動版底部導覽移除「作戰」按鈕，改為 4 欄：首頁／活動／視野／我的。
- 「查看更多活動」在手機改用 safe-area 固定右上關閉鈕；背景點擊與 Esc 關閉仍保留。
- 新增「演藝新聞」共通區塊，預設韓星，可切換韓／台／歐美／其他並依關鍵字搜尋。
- 新聞由伺服器端讀取公開新聞 RSS 索引，不需要使用者 API key；15 分鐘 CDN 快取、失敗時顯示可重試狀態。
- 四語介面已補上新聞區基本文字。
