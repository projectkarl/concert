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
- The official monitor checks primary and secondary/ticket URLs so sale dates, prices and seat maps can refresh from the actual ticket page. This fixes cases such as BTS where Live Nation is the main source but the detailed official map/prices live on tixCraft.
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

`/api/events` is cached for one hour. While the page is open, NEUL automatically revalidates the merged official feed every hour; returning to a stale tab also triggers a refresh. A daily Vercel warm-up cron remains as a no-traffic safety net. Event/ticket lifecycle transitions are recalculated locally every minute, so Archive and 3D selections do not wait for the next network refresh.

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

## v0.40.8 — Automatic ticket / concert lifecycle

v0.40.8 adds automatic official-source refresh and the lifecycle `ticket countdown → sale day → show countdown → live → Archive`. Finished event layouts are automatically removed from the 3D concert selector, while Featured rotates up to 10 upcoming events every 10 seconds. The existing website layout is unchanged.

## v0.40.9 — Future Event Auto Custom 3D

- Every event returned by `/api/events` is immediately assigned a unique event-specific 3D layout, including events discovered after deployment.
- New/unknown venues receive a conservative runtime venue model first, then a unique event layout.
- When an official seat map, stage layout, or section pricing changes, the same event layout is marked stale and automatically re-enters OCR/Vision QA instead of inheriting the previous verification.
- Official-map verification and 3D section-price verification are client QA results; server discovery no longer treats a seat-map URL alone as proof of a calibrated 3D scene.
- Drafts remain usable but are labelled for review until stage confidence and Section Mapping meet the QA gate.


## v0.40.10 Seat-map resolver
官方座位圖採 recursive-v2 多來源自動解析：完整 sourceRefs、JSON/lazy asset、detail-page follow、hash cache 與每小時缺圖優先輪替驗證。一次抓取失敗不代表官方未公布。

## v0.40.11 Full Coverage Auditor

v0.40.11 no longer treats the fallback event count as the Taiwan concert total. It cross-checks ticket/promoter discovery with independent official venue calendars (TMC, TICC, Zepp New Taipei, KPMC/LIVE WAREHOUSE, plus the existing Taipei Arena and Kaohsiung Arena sources). Venue-only events are backfilled and flagged for ticket-source follow-up. New activities still automatically receive event-specific 3D drafts and upgrade when official seat maps/prices are found and pass QA.
## v0.40.12 Calendar + Official Map Reference + Featured Autoplay

- The expanded Upcoming modal now keeps both views: a real month calendar with daily agenda and the original full filtered activity list below it.
- The calendar uses complete week rows with blank day cells, so it reads like a normal monthly calendar instead of a date-only activity picker.
- The 3D seat preview now places the official seat-map reference beside the simulated view on desktop and stacks it below on mobile. For event layouts with no map yet, the reference area remains visible and explicitly says the official map is still being automatically backfilled instead of disappearing.
- Previously resolved seat-map URLs stored in the local resolver cache are also used by the visible reference panel, preventing a successful resolver result from being hidden after a data refresh.
- Featured Concert keeps up to 10 active events and now has a visible AUTO 10s countdown/progress indicator. Autoplay uses a restartable 10-second timer, resumes when the tab becomes visible, and resets after manual previous/next navigation.
- Archive, future-event automatic custom 3D, Coverage Auditor, source backfill and ticket lifecycle logic remain unchanged.


## v0.40.13 — Official Map Display / Silent Featured
- IVE 2026 `SHOW WHAT I AM` 保留為台北小巨蛋「活動配置」選單中的歷史 3D 校正範例，不另顯示示範卡。
- Featured 保留 10 秒自動輪播但移除 `AUTO 10s` 文字。
- 3D 活動預覽固定提供「官方位置／座位配置參考」；已取得顯示官方圖，未取得顯示待自動回補。
- Resolver 擴充至活動全部可信官方來源與 sourceRefs，並能由藝人／主辦／場館頁追售票 detail page。
- 新官方圖解析成功會立即刷新 UI；hash 改變自動重新跑 OCR/Vision、Section/Price、3D QA。
- 第三方轉載圖不作官方位置圖。
- 活動資料每小時重新驗證，生命週期每分鐘更新，每日 refresh 作保底。

## v0.40.16
- 活動查詢改為完整清單優先＋月曆並存；手機完整清單先顯示。
- 修復 Safari/WebGL 失敗時 3D Canvas fallback 空白問題。
- 新增 WebGL runtime 自動安全恢復。
- 補上南港展覽館一館模型；目前 75/75 fallback events 通過 event-specific 3D runtime audit。
