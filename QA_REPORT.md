# NEUL v0.41 QA

## 靜態檢查
- [x] index.html / CSS / JS 分離，避免補丁疊加
- [x] 手機斷點 680px、平板斷點 1050px
- [x] 3D 使用 Three.js 幾何場景，不是圖片拖曳
- [x] Featured 左右按鈕 + 10 秒輪播
- [x] 黑／白模式
- [x] 設定齒輪有回應
- [x] Upcoming 預設 5 筆 + 看更多 Modal
- [x] 座位選區 / 排 / 號 / 倍率控制
- [x] 官方座位圖按鈕與來源 Modal
- [x] 6 小時快取與下次更新時間
- [x] `/api/health`
- [x] `/api/events`

## 已納入驗證案例
- [x] BTS WORLD TOUR 'ARIRANG' IN KAOHSIUNG：2026/11/19、21、22；高雄國家體育場；VIP 9,380 / 7,980 / 6,980 / 5,980 / 4,980 / 3,980 / 2,980
- [x] T-ARA Fancon 2026 in Taiwan：2026/10/18；高雄流行音樂中心海音館；5,980 / 5,680 / 4,680 / 3,680 / 愛心 2,840；A/E 區視線限制
- [x] IVE 2026 台北小巨蛋保留作已結束校正樣本

## 尚需正式部署後驗證
- [ ] 各售票站是否回應 server-side fetch
- [ ] 各站 `<img>` 標籤是否能直接解析出座位圖 URL
- [ ] 若某站改為前端動態載入，需新增該站專用 adapter（而不是在前台硬補）


## v0.46 flow QA
PASS: 搜尋→活動→3D；Upcoming Modal→活動→關閉→3D；活動切換不錯用上一場座位；每場保存最後座位；Modal 背景/關閉鈕/Escape；ResizeObserver/orientationchange；360/390/430px 防溢位；座位圖容器分離。
NOTE: 無真實 iOS Safari/WebGL 裝置，觸控與 GPU 最終表現仍需部署後實機驗證。


## v0.47 3D geometry QA
PASS: 同區前/後排相機位置與高度不同。
PASS: 同排左右座號產生橫向視角差。
PASS: 座席階梯、欄杆、LED 框、燈架、FOH 控台均由 Three.js geometry 建立，非平面示意圖。
PASS: 手機降低座席階梯數，維持 v0.46 GPU 降載。
PASS: Dark/Light canvas 對比規則存在。
NOTE: 場館精準排數/高度仍以來源資料為上限；未驗證資料不宣稱實測尺寸。


## v0.48 Venue Geometry QA
PASS: venue-geometry.json schema / JSON parse。
PASS: 臺北大巨蛋與臺北小巨蛋有獨立 baseline。
PASS: 官方事實與 rendering estimates 分層，避免把推估值顯示成官方尺寸。
PASS: cameraForSeat / section tier 讀取 venue baseline。
PASS: 新活動只要 venue alias 命中，即自動繼承相同 Venue Geometry 品質。
PASS: event-specific 舞台/花道/票價仍由 Scene/SeatMap Guard 控制，不因場館 baseline 而誤標「已客製」。


## v0.49 Seat Coordinate QA
PASS: row +1 會沿區域徑向遠離場地並依 tier 增高。
PASS: seat +1 會沿區域切線平移，不改變該排基本半徑。
PASS: Camera 使用 seatCoordinate()，不再有第二套座標公式。
PASS: Venue DB schema 1.1 可解析，兩場館均有 seatMapping。
PASS: confidence 會顯示於 UI；estimated 不會被宣稱為官方精準座標。
PASS: event-specific stage/seat map 仍高於 venue baseline。


## v0.50 Auto Section Mapping QA
PASS: ticket-page text 可抽取 `A區 5980` / `紅2 5800` / `2F A區 4680` 類型票區與票價。
PASS: seed 已有人工校正 sections 時永遠優先，不被自動映射覆蓋。
PASS: seat map 存在但沒有 section mapping 時，`canClaimCustomized=false`。
PASS: seat map + >=3 可辨識票區時建立 `mapped-estimated`，Scene 可直接使用。
PASS: app event/section selector 會在 seed sections 為空時改讀 `sectionMapping.sections`。
PASS: SceneSpec schema 更新為 v2 並攜帶 `sectionMappingStatus`。
PASS: API summary 新增 `sectionMapped` / `seatMapUnmapped`。


## v0.51 SeatMap Vision QA
PASS: 純 JS `seatmap-vision.mjs` 可在 Node 單元測試，不依賴 Canvas 才能驗證 mapping 邏輯。
PASS: synthetic seat map 的紅／黃／紫區域可辨識為獨立色塊。
PASS: 具唯一色名的票區可依 centroid 修正 angle。
PASS: 同色重複票區不自動配對，避免紅2/紅2高排被錯置。
PASS: curated sections 不會被 SeatMap Vision 覆蓋。
PASS: Vision confidence / coverage 未達門檻時不套用。
PASS: Venue Geometry 在事件載入前先載入；Camera 使用 seatCoordinate。
PASS: SeatMap proxy 維持 HTTPS + allowlist，未改成任意 URL open proxy。
NOTE: 影像 OCR/文字框辨識未在 v0.51 啟用；A/B/C 類無色名票區仍以售票頁文字與既有 Mapping 為主。


## v0.52 SeatMap OCR / Label QA
PASS: 純 `mapOcrLabelsToSections()` 可測試 A區/B區/VIP/2F 類標籤，不依賴 OCR 引擎本身。
PASS: 一對一高信心文字匹配會依 bbox centroid 更新 section angle。
PASS: 競爭匹配分數接近時不套用。
PASS: curated sections 不執行 OCR 覆蓋。
PASS: 色塊 Vision 已成功時不啟動 OCR。
PASS: OCR lazy-load；只有 Vision 不足且有 seat map 時才載入 Tesseract。
PASS: OCR timeout / library failure 會安全退回原有 Mapping。
NOTE: Tesseract 語言模型需使用者瀏覽器首次下載；行動網路慢時可能只維持既有 Mapping，這是預期 fallback。


## v0.53 Full-site QA
PASS: 所有 app.js `#id` selector 都能在 index.html 找到。
PASS: `/api/events /api/health /api/seatmap-image /api/venue-geometry /api/automation-scan` rewrite 完整。
PASS: Vercel Hobby cron 為每日一次，不使用會導致 Hobby 部署失敗的高頻 cron。
PASS: mock upstream integration：自動發現活動 → detail fetch → 座位圖抓取 → 票價/票區 mapping → SceneSpec → sceneVersion。
PASS: SeatMap proxy allowlist 擋掉非允許網域。
PASS: Venue Geometry API 可讀取 bundled data file。
PASS: Daily automation scan handler 可完整跑完 discovery/enrichment。
PASS: JS/MJS syntax、JSON parse、3 組既有 mapping/vision/OCR tests 全部通過。
LIMIT: 本包尚未提供 v0.53 的實際 Production URL，因此無法在真實 Vercel CDN、售票站 anti-bot/CORS 與 iPhone Safari 上做 live production E2E；部署後仍需看 Cron/Function logs 做最後確認。


PASS v0.53.1: 自動發現活動的整合測試現在強制要求 `sceneSpec.status=ready` 與 `automation.sceneReady=true`，否則測試直接失敗。

## v0.54 Original Style Restore QA
PASS: `styles.css` 前 10212 characters 與 v0.41 原始 CSS 完全一致。
PASS: v0.54 只在原始 CSS 後追加 compatibility layer；原 Hero/Card/Viewer/Sidepanel 視覺規則沒有被重寫。
PASS: `app.js` 保留 v0.53.1 功能邏輯，不因 UI restore 回退 3D 或自動化。
PASS: 手機 safe-area、48px 觸控、360px 窄螢幕、Modal、SeatMap wrapper、Light mode 可讀性修正保留。
PASS: 3D Canvas 行動裝置 touch / WebGL 效能策略保留。
