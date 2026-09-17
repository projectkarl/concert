# NEUL v0.41 — SourceVision Clean Rebuild

此版以 v0.40 已確認方向重新整理為可直接部署 Vercel 的完整專案，不採 CSS/JS 補丁式疊加。

## 核心改動

1. **每個活動頁都做 detail fetch**：不只抓活動名稱，會從官方活動頁嘗試抽取座位／票區圖、票價、視線遮蔽文字。
2. **座位圖 Hash → 3D Scene Version**：`seatMapHash` 改變時，前端會偵測並重建該場 3D。
3. **票價直接進 3D 區域控制**：選區時顯示該區票價與視線提醒。
4. **BTS / T-ARA 各自 Scene**：BTS 高雄世運使用中央＋延伸舞台場景；T-ARA 海音館使用端景場景並標記 A/E 區官方視線限制。
5. **6 小時更新不使用 Vercel Hobby 高頻 Cron**：`/api/events` 使用 `s-maxage=21600` + stale-while-revalidate，避免 Hobby 每日 Cron 限制造成部署失敗。
6. **下次更新時間**：API 直接回傳 `nextRefreshAt`，前台首頁顯示。
7. **Featured 每 10 秒輪播**：保留左右按鈕手動切換。
8. **真 3D**：Three.js 即時幾何，不是單張圖片平移；舞台、跑道、看台、觀眾燈海與座位相機皆是 3D。
9. **黑／白模式**：淺色模式只切 UI，3D 場館維持對比，不把場館畫面洗白。

## 部署

- Vercel Framework Preset：Other
- Root Directory：`./`
- Build Command：留空
- Output Directory：留空
- Node：18+ / 22.x 均可

部署後先開：

- `/api/health`
- `/api/events`

`/api/events` 第一次請求會實際抓活動頁，因此可能較慢；之後由 CDN 快取 6 小時。

## 重要限制

- 「自動客製 3D」目前是依**官方活動頁文字、官方座位圖 URL/Hash、票價與事件專屬規則**重建；不使用付費視覺 AI，因此不宣稱能從任何未知座位圖像素中 100% 自動理解所有舞台幾何。
- 若官方頁面使用反爬、登入、純前端 API 或圖片沒有可辨識標籤，會標記 `座位圖待抓`，不亂猜。
- 可在 `data/events.seed.json` 放入主辦／售票的 event detail URL，API 會自動對該頁做二次解析。


## v0.42 AutoScene Guard
- API 重新驗證時會掃描已設定的售票/主辦入口，嘗試發現新的台灣演唱會。
- 新活動再進入 detail page，尋找座位/票區圖、票價、舞台文字訊號。
- 只有取得座位圖候選才標示「座位圖客製」；否則明確顯示「場館基準/待校正」。
- Scene Version 由座位圖、票價、舞台型態與遮蔽資訊 Hash 產生，來源變動會觸發新版場景。
- Hobby 的 6 小時更新屬於有請求時的 CDN/API revalidation；無訪客時不宣稱每 6 小時背景執行。


## v0.43 SeatMap → 3D topology
- 新增 `sceneTopology`：把活動頁文字訊號、座位圖候選、票價、既有票區轉成可版本化的 3D 結構描述。
- Three.js 不再只讀 `stageType`；會讀 main stage、runway、B-stage、PA/FOH 與票區 zone。
- topology 也納入 Scene Hash；配置訊號變更會產生新 Scene Version。
- `sceneConfidence` 顯示目前自動解析可信度。未取得座位圖時仍維持待校正標示。
- 注意：純 Node/Vercel 無內建電腦視覺模型，因此 v0.43 是「座位圖候選 + 官方頁訊號 → 結構化 3D」；若要真正讀取圖片像素辨識舞台輪廓，下一階段需加入瀏覽器端影像解析或外部視覺模型。


## v0.43 AutoScene Geometry
- 新增 `sceneSpec`（neul.autoscene.v1）：把舞台型態、延伸台、衛星台、螢幕、票區角度/距離與遮蔽訊號轉成可重建的 3D 幾何規格。
- 前端 Three.js 不再只讀 `stageType`；優先依 `sceneSpec.geometry` 建舞台與票區。
- Scene Hash 納入 geometry，因此票區/舞台規格改變會得到新的 Scene Version。
- 新增 confidence / ready / review / baseline。沒有座位圖時仍不得宣稱「座位圖客製」。
- 注意：本版是座位圖「存在性 + 網頁文字訊號 + 已校正票區資料」驅動的 AutoScene；未使用付費視覺 AI，因此不會假裝已從圖片像素精準辨識花道輪廓。

## v0.44 SeatMap Vision Lite
- 新增 `/api/seatmap-image` 白名單圖片代理，讓瀏覽器可在同源 Canvas 中安全讀取售票來源座位圖。
- 前端會對座位圖做像素級輕量分析：原始尺寸、色塊比例、暗區比例、邊緣密度與 Vision confidence。
- 這不是付費 Vision API，也不假裝能理解所有座位圖語意；目前結果作為 Scene Guard 的額外證據，不會在低可信度時覆蓋人工校正。
- 修正 v0.43 `sceneSpec` 建立順序與重複 confidence 欄位問題。


## v0.45 Mobile & Visual Polish
- iPhone safe-area、44px 觸控目標、手機 3D 58svh。
- Three.js 手機 pixel ratio 降至 1.35，降低 GPU 壓力；停用 pan 避免誤觸。
- 技術 Scene/Vision 資訊預設收進「資料與校正資訊」。
- 白色模式 Hero 與輸入框重新配色，避免泛白與低對比。
- Modal 手機改底部 sheet，限制 88svh 並保留 Home Indicator safe area。
- 320–380px、390–430px、tablet、desktop 皆有 overflow 防護。


## v0.46 QA Hardened
修正 Modal→3D 流程、背景捲動、Escape、活動切換座位狀態、手機 WebGL 負載、ResizeObserver/旋轉螢幕、座位圖容器、360px 窄螢幕與鍵盤焦點。


## v0.47 3D Immersion
- 區域幾何加入樓層高度、階梯式排數與前緣安全欄杆。
- 排數會影響視點高度/距離；座號會沿區塊切線左右移動，不再只使用區域中心點。
- LED 加入框體、雙面顯示與舞台燈架；主舞台增加 fascia 層次。
- 新增 FOH/PA 控台作為距離與遮蔽參考。
- 手機仍使用較少座席階梯與既有低 pixel-ratio 策略。
- 保留 v0.46 UI、AutoScene Guard、SeatMap Vision 與 QA Hardened 流程。


## v0.48 Venue Geometry Database
- 新增 `data/venue-geometry.json`，把「官方已驗證事實」與「3D rendering estimates」分開保存。
- 首批基準場館：臺北大巨蛋、臺北小巨蛋。
- 大巨蛋官方基準：4萬席、內野約3萬/外野約1萬、球場層 B2、Gate 1–5 內野 / Gate 6–9 外野。
- 小巨蛋官方基準：B1 可依活動搭舞台/臨時座椅/站位；2F/3F 為主要座席層，3F/4F 含包廂。
- 3D Camera 與 section tier 開始讀 Venue Geometry，不再只靠通用距離公式。
- 新增 `/api/venue-geometry.mjs`，6 小時 CDN cache，後續自動生成場次共用同一基準場館。
- 幾何座標明確標示為 rendering estimates；沒有官方尺寸/排號資料時不宣稱為建築實測值。


## v0.49 Seat Coordinate Mapping
- 新增統一 `seatCoordinate()`：區域 anchor + 排數徑向位移 + 座號切向位移 + tier row-rise。
- Camera 與 UI 共用同一座標計算，避免畫面與距離摘要各算各的。
- Venue DB 新增 `seatMapping`、rowDepth、seatPitch、sectionFamilies 與 confidence。
- 自動新增活動只要命中場館即可繼承 mapping；活動座位圖仍可覆蓋 section / stage / floor / price。
- UI 顯示「官方 / 已校正 / 推估定位」品質標記；目前逐座幾何尚無足夠官方資料者維持「推估定位」。


## v0.50 SeatMap → Section Mapping
- 新增售票頁票區/票價解析器，從可驗證的頁面文字抽取 A區、VIP、紅2、2F 等票區名稱與票價。
- 新增 `sectionMapping`：`curated / mapped-estimated / partial / seatmap-unmapped / baseline`。
- 沒有 seed sections 的新活動，Scene 可使用自動票區映射，不再只能顯示一個「一般視角」。
- `sceneSpec` 升級為 `neul.autoscene.v2`，明確記錄 Section Mapping 狀態。
- 安全防線升級：只有「座位圖 + 可用票區映射」才可標示為客製；只有座位圖但無票區映射時，UI 會顯示「座位圖已取得 · 票區待映射」。
- 自動映射的角度/距離仍標示 estimated，不會假裝是官方逐座座標。


## v0.51 SeatMap Vision Mapping
- `SeatMap Vision Lite` 升級為可測試的 `neul.seatmap.vision.v2`。
- 瀏覽器透過同源白名單 proxy 載入官方座位圖，縮圖後辨識紅／橘／黃／綠／藍／紫色塊與連通區域。
- 票區名稱若含明確色名（例如紅2、黃2、紫2），且影像中有唯一對應色塊，才允許使用視覺 centroid 修正左右角度。
- 同色多票區、A/B/C 無色名、色塊不足或 Vision confidence 過低時，不會自動套用。
- `curated sections` 永遠高於 Vision；人工/官方校正資料不被像素分析覆蓋。
- 自動套用後狀態為 `vision-assisted-estimated`，不是「官方精準座標」。
- Vision 結果依 SeatMap Hash 存入瀏覽器 localStorage；同版本座位圖不需重複分析。
- v0.48 Venue Geometry loader 與 v0.49 seatCoordinate 在本版整合回主流程：排數、座號與場館 tier 使用同一套座標計算。


## v0.52 SeatMap Label Assist
- 色塊 Vision 無法建立票區位置時，才啟動文字標籤辨識，避免正常頁面載入大型 OCR。
- 優先使用瀏覽器原生 `TextDetector`；不支援時才 lazy-load 免費 `tesseract.js`。
- OCR fallback 使用 `eng+chi_tra`，只在需要時載入，不增加 Vercel Function 運算成本。
- 新增 `seatmap-labels.mjs`，把 OCR 文字框與售票頁票區名稱做一對一比對。
- A區、B區、VIP A、2F A、紅2 等文字可在高信心且不歧義時轉成圖片座標 anchor。
- 同一 OCR 標籤或同一票區有接近分數的競爭匹配時直接跳過，避免誤配。
- 自動成功後狀態為 `ocr-assisted-estimated`；仍不宣稱為官方逐座座標。
- OCR 設 16 秒上限；失敗會回到既有 Section Mapping，不阻塞 3D。


## v0.53 Full QA + Automation Hardening
- 修正 `/api/seatmap-image`、`/api/venue-geometry` 缺少 Vercel rewrite 的部署 404 風險。
- `venue-geometry.mjs` 改用 `import.meta.url` 讀取資料檔，避免 Serverless bundle / cwd 差異。
- 來源首頁改為並行掃描，最多自動發現 24 筆；事件 enrichment concurrency 提升到 6。
- 同一 invocation 的重複 upstream URL 使用 2 分鐘 memo，避免多場 seed 重複抓同一售票首頁。
- 新增 Hobby 相容的每日 Cron `/api/automation-scan`，真正做背景來源健康掃描。
- 6 小時更新定義修正為「請求式 CDN revalidation」；不再誤稱每 6 小時一定背景執行。
- Health build 更新為 0.53，並回報 automation mode。


### v0.53.1 sceneReady fix
- 修正 AutoScene 評分誤讀 `seed.stageType`：現在會使用 detail page 已推導出的 `stageType`。
- 自動發現活動在具備 seat map + prices + section mapping + stage evidence 時可真正進入 `sceneReady=true`。

## v0.54 Original Style Restore
- 視覺基底完整回到 v0.41 原始 Neul 設計；原始 `styles.css` 內容保持逐字不變並作為前段基底。
- 只在原始 CSS 後追加功能相容層，不重設 Hero、Feature、Card、Viewer、Sidepanel、Modal 的視覺語言。
- 保留 v0.53.1 全部自動化：來源掃描、座位圖、票價、Section Mapping、Vision/OCR、SceneSpec、Scene Version、每日背景掃描。
- 保留 v0.47+ 3D：排/號視角差、Venue Geometry、LED/Truss/FOH、Camera mapping。
- 保留手機優化：safe-area、48px 觸控目標、360/390/430px 防溢位、Modal 高度、WebGL 行動負載策略。
- 白色模式只做可讀性修正，不更動原始版面結構。
