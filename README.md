# NEUL Cloudflare v1.0.0

全新 Cloudflare Workers 版本。前台採 Static Assets，API / 資料同步由單一 Worker 處理，演唱會來源同步透過 Cron 每 6 小時執行；使用者開頁不會觸發來源爬取。

## 首次部署

```bash
npm install
npx wrangler login
npx wrangler kv namespace create CACHE
```

把指令回傳的 `id` 貼到 `wrangler.jsonc` 的 `kv_namespaces[0].id`。

```bash
npm run check
npm run deploy
```

Cloudflare Dashboard 也可以連 GitHub，Build command 使用 `npm run deploy`（或採 Workers Builds 自動偵測）。

## 自動化

- 每 6 小時：10 類官方／售票來源 discovery + TWConcertView coverage reference → 合併去重 → lifecycle → coverage audit → 新聞 RSS → KV snapshot。
- `/api/events`：讀 KV snapshot，KV 未初始化時使用內建 seed，不會整頁壞掉。
- `/api/health`：前台、KV、來源狀態、資料時間、排程資訊。
- `/api/coverage`：活動總數、來源、座位圖、3D、待複核統計。
- `/api/refresh`：只允許 `Authorization: Bearer <ADMIN_TOKEN>` 手動執行；請用 `wrangler secret put ADMIN_TOKEN` 設定。
- `/api/seat-map-image?url=`：只允許白名單官方網域，避免 open proxy。

## CPU / 請求控制

- 不在一般 `fetch()` 中爬外站。
- 來源抓取有 timeout、單輪 batch、去重與 stale-while-revalidate 型快取。
- 前台預設 60 秒 API refresh，只讀 KV，不會觸發 discovery。
- 來源失敗時保留上一份成功快照，避免空白首頁。

## 注意

部分售票站會變更 HTML 或阻擋機器存取，因此 connector 採容錯解析；若該站封鎖 Cloudflare IP，來源健康狀態會標示 degraded，而非拖垮整站。
