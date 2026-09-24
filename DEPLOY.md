# NEUL Cloudflare Exact-UI Adapter v1.1.0

這個版本**不重做前台**。它以原本 `NEUL-v0.40.17-Expanded-AutoCoverage.zip` 為來源，完整複製原前台，僅加入 Cloudflare Worker / KV / Cron。

## 1. 準備來源
把這個 Adapter 解壓縮，並把原版 `NEUL-v0.40.17-Expanded-AutoCoverage.zip` 放在同一層。

## 2. 產生 Cloudflare 版
```bash
npm run apply -- --source ../NEUL-v0.40.17-Expanded-AutoCoverage.zip --out ../NEUL-cloudflare-exact
```

產生過程會對以下前台檔案做 SHA-256 鎖定並於完成後再次驗證：
`index.html`、`styles.css`、`app.js`、`webgl-venue.js`、`seat-map-intelligence.js`、`sw.js`、`data/events.js`、`data/multi-venue-geometry.js`。
任何一個 byte 被改動，轉換會直接失敗。

## 3. 建立 KV
```bash
cd ../NEUL-cloudflare-exact
npm install
npx wrangler login
npx wrangler kv namespace create CACHE
```
把回傳的 namespace ID 填到 `wrangler.jsonc` 的 `REPLACE_WITH_KV_NAMESPACE_ID`。

## 4. 管理用 refresh token（建議）
```bash
npx wrangler secret put ADMIN_TOKEN
```

## 5. 驗證介面未被更動
```bash
npm run cf:verify
```
必須看到 `UI LOCK PASS`。

## 6. 部署
```bash
npm run cf:deploy
```

## Cloudflare 自動化
- Static Assets：直接服務原版前台，不由 Worker 重新渲染。
- `/api/*`：Worker-first。
- KV：保留最後一次成功活動／新聞快照。
- Cron：`17 */6 * * *`，每 6 小時重新同步。
- `/api/events`：活動、coverage、source-health、Archive lifecycle。
- `/api/official`：原版前台官方資料重驗入口。
- `/api/seat-map-image`：官方座位圖遞迴 resolver / cache。
- `/api/news`：新聞快照。
- `/api/coverage`：資料完整度與來源健康。
- `/api/refresh`：管理者手動重整。
- `/api/health`：部署健康檢查。

> 原版的 UI / WebGL / Canvas fallback / IndexedDB / 3D 操作 / Featured 10 秒輪播 / 行事曆 / 新聞頁 / Archive 前端邏輯全部由原始前台檔案直接保留，不用重新做一套。
