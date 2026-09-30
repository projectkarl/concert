# NEUL Cloudflare v1.3.0 — 部署說明

本版本以 `NEUL-v0.40.17-Expanded-AutoCoverage.zip` 為唯一前台基準。首頁、CSS、前端 JS、WebGL 3D、座位圖 intelligence、新聞 UI、PWA 與所有公開資產均以 SHA-256 鎖定，不在 Cloudflare 移植過程重新設計。

## 1. 安裝與登入

```bash
npm install
npx wrangler login
```

## 2. 建立 KV

```bash
npx wrangler kv namespace create CACHE
```

把 Cloudflare 回傳的 namespace `id` 填入 `wrangler.jsonc`：

```json
"kv_namespaces": [
  { "binding": "CACHE", "id": "你的 KV namespace id" }
]
```

請勿更動 binding 名稱 `CACHE`。

## 3. 建議設定管理權杖

`/api/refresh` 可手動補資料。正式站建議一定設定：

```bash
npx wrangler secret put ADMIN_TOKEN
```

若也希望保護手動 `/api/push-digest`：

```bash
npx wrangler secret put CRON_SECRET
```

## 4. Web Push（選用）

原版的瀏覽器本機提醒不受影響。Cloudflare Web Push 預設關閉；若要啟用跨裝置/背景 Push：

先把 `wrangler.jsonc` 的：

```json
"ENABLE_WEB_PUSH": "0"
```

改成：

```json
"ENABLE_WEB_PUSH": "1"
```

再設定：

```bash
npx wrangler secret put VAPID_PUBLIC_KEY
npx wrangler secret put VAPID_PRIVATE_KEY
npx wrangler secret put VAPID_SUBJECT
```

`VAPID_SUBJECT` 可使用 `mailto:你的聯絡信箱`。Cloudflare 版採 contentless VAPID Push；原 Service Worker 收到後仍會顯示 NEUL 既有通用提醒，不改前台通知 UI。

## 5. 部署前完整驗證

```bash
npm run check
npm run cf:verify-ui
npm run cf:check
npm run cf:smoke
npm run cf:scheduled-smoke
```

全部 PASS 才部署。

- `npm run check`：原 NEUL 全套 regression（3D、場館、Archive、新聞、手機、座位圖、coverage）。
- `cf:verify-ui`：比對原 v0.40.17 的 48 個公開資產 SHA-256。
- `cf:check`：檢查 Cloudflare API contract、Cron、來源數與免費方案 request budget guard。
- `cf:smoke`：直接呼叫 Worker 的 API handler 做本地 smoke。
- `cf:scheduled-smoke`：用模擬上游來源驗證 Cron → KV → `/api/events` / news 流程。

## 6. 部署

```bash
npm run cf:deploy
```

部署完成後至少檢查：

```text
/api/health
/api/events
/api/coverage
/api/official
/api/entertainment-news?category=kr
```

`/api/health` 應顯示 `runtime: cloudflare-workers`、`bindings.assets: true`、`bindings.kv: true`。

## 7. 第一次資料暖機

可以直接等每小時 Cron 輪替，也可以部署後手動分批暖機。分批是刻意設計，用來控制單次外部請求：

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://你的網域/api/refresh?phase=sources-a"

curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://你的網域/api/refresh?phase=sources-b"

curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://你的網域/api/refresh?phase=sources-c"

curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://你的網域/api/refresh?phase=references"

curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://你的網域/api/refresh?phase=news"
```

若沒有設定 `ADMIN_TOKEN`，API 目前允許 refresh；正式公開站仍強烈建議設定。

## 8. 排程策略

Cloudflare 版只使用兩個 Cron Trigger：

- `17 * * * *`：每小時啟動一次，以 6 個 phase 輪替。
  - phase 0：來源 A
  - phase 1：來源 B
  - phase 2：來源 C + 娛樂新聞
  - phase 3：TWConcertView + Artists.tw coverage reference
  - phase 4–5：低負載 idle / health slot
- `30 0 * * *`：每日 Push digest；UTC 00:30 約等於台北 08:30。

因此每個主要資料群約每 6 小時完成一輪，同時避免把所有售票與官方來源集中在同一 invocation。

## 9. 來源失效時的行為

- 每個來源獨立保存 last-good KV；單一來源錯誤不會清掉上一份成功資料。
- `/api/events` 會合併 seed、各來源、coverage candidates，再去重。
- 已結束活動只保留最近 20 場 Archive。
- 官方座位圖 resolver 有可信網域白名單、遞迴解析 budget、resolved URL/hash 快取。
- 前台每小時重新讀資料時，只允許小量 background revalidation，不會因每個訪客而全量爬來源。

## 10. 重要限制

這個 release 已完成本地完整 regression、UI hash lock、API contract、一般 smoke 與模擬 scheduled flow；但在這個建置環境中沒有使用你的 Cloudflare 帳號真正執行 `wrangler deploy`，也無法替你的正式 Worker IP 驗證每一個售票網站當下是否接受連線。

部署後請以 `/api/health` 的 `sourceHealth` / cron 時間，以及 `/api/coverage` 為實際線上判斷依據。上游若暫時封鎖 Cloudflare IP，NEUL 會保留 last-good 資料而不是把活動清空。
