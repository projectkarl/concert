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
