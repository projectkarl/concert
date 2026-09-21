# NEUL v0.40.6

**本版收斂為 10 個主流 3D 場館，桌面版 Planner 改為 News，演藝新聞維持在全頁最後一個內容區塊；所有韓星場館示範統一在活動配置名稱後標示「範例」。**

主流 3D 場館：臺北大巨蛋、臺北小巨蛋、NTSU 林口體育館、高雄巨蛋、臺北流行音樂中心、TICC、高雄流行音樂中心海音館、高雄國家體育場（世運主場館）、南港展覽館一館 4F、Zepp New Taipei。

桃園巨蛋、臺大綜合體育館、天母體育館仍保留活動資料與既有幾何程式碼作相容性/歷史資料用途，但不再出現在主流 3D 場館選單，也不啟動活動自動 3D/OCR 生成。

官方圖預覽修正：範例 layout 即使沒有目前活動資料的 `eventId`，也會使用該範例自己的官方活動／售票／場館來源交給 `/api/seat-map-image` 解析；resolver 會收到場館、場館 ID、活動名稱提示，降低共用售票頁抓錯圖。官方來源若當下封鎖抓取、撤圖或沒有提供可解析圖片，介面仍會保留官方來源連結與已驗證 3D，不會把第三方圖冒充官方圖。

> 3D 原則：只把資源集中在主流 10 場館；官方固定場館結構優先，活動舞台／可變票區逐場客製；twconcertview 僅作實拍視野交叉核對。

# NEUL v0.40.3 — Venue Topology Guard (2026-09-21)

This release keeps the v0.40.2 UX3 interface and changes the 3D correctness pipeline only.

- TICC Plenary Hall is rebuilt as one continuous raked auditorium. Its audience zones begin at 2MF; NEUL no longer invents a general 1F audience tier.
- Shared ticket pages are venue-aware. The Julia Peng Taipei / Kaohsiung shows share one KHAM product page, so seat-map selection now carries city / venue / event hints and refuses ambiguous maps.
- Fixed venue topology is authoritative. OCR/Vision can customize only physically reconfigurable tiers such as arena floors; it cannot replace fixed balconies or create new building floors.
- Unknown indoor venues no longer silently fall back to a generic theatre or Taipei Dome. Uncalibrated venues keep the event listing but withhold 3D until an official geometry source exists.
- `VENUE_3D_TOPOLOGY_AUDIT_2026-09-21.md` contains the 101-event audit; `TEST_REPORT_v0.40.3-VenueTopology.md` records regression checks.


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

## UX.3 venue / map policy
- Entertainment News uses the native NEUL grid/card design.
- Temporary outdoor plazas/parks/festival grounds remain listed but do not receive fabricated seating 3D.
- Jason Mraz Taipei uses a flat Nangang Exhibition Hall 1 4F baseline until the official event map upgrades it.
- Official seat-map preview can resolve directly from supported official event pages; it no longer requires a pre-filled direct image URL.
