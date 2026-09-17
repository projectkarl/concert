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

## v0.40 Auto3D Enhancement (UI locked)
本版以保存下來、README 明確註記「以 v0.40 已確認方向重新整理」的原版前端作為 v0.40 基底。

### UI 鎖定
- `index.html`：未修改。
- `styles.css`：未修改。
- 介面版型、Hero、Featured、Upcoming、3D Viewer、右側控制面板、資料驗證與 About 均維持原版。

### 只升級 3D / 自動化
- 自動掃描活動來源、活動詳細頁、座位圖、票價與票區文字。
- Section Mapping / SeatMap Vision / OCR Label Assist。
- AutoScene v2：資料充分時自動產生 SceneSpec 與 Scene Version。
- 6 小時 request-driven CDN refresh + 每日 Vercel Hobby cron 背景來源掃描。
- 3D 原布局不改，只增加舞台邊緣、LED 框、看台護欄、實體燈架與陰影細節。
- 場館地面改為淺色暖灰 `#e3ded3`。
- 手機只降低 WebGL pixel ratio / crowd density，不改原 UI 排版。


## Archive 判定修正
Archive 不再採信來源網站的 `status`。Neul 只會在活動實際結束後歸檔；若缺少 `dateEnd`，以最後一場開始時間後至少 8 小時與台北當日 23:59 兩者較晚者作安全結束點。多日活動以最後一場為準。
