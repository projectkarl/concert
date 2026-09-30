# NEUL Cloudflare v1.4.2 部署

## Git / Dashboard 最簡部署

本版使用 Wrangler 4 的 **KV automatic provisioning**。`wrangler.jsonc` 只宣告 `CACHE` binding、不再放假的 `REPLACE_WITH_KV_NAMESPACE_ID`。Cloudflare Git Build 第一次部署時會自動建立 KV 並綁定 Worker。

建議設定：

```text
Root directory: repository root
Build command: blank
Deploy command: npm run deploy
```

也可以保留 Cloudflare 預設 deploy command：

```text
npx wrangler deploy
```

因為 `public/` 已直接存在 Git repository，裸 `wrangler deploy` 也不會再遇到 `.cf-public`／缺 assets 目錄。`npm run deploy` 只是多跑 UI lock、public sync、seat-map resolver 與 API contract 檢查，較推薦。

## CLI

```bash
bun install
npx wrangler login
npm run cf:doctor
npm run deploy
```

第一次 deploy 若帳號尚無 `CACHE` KV，Wrangler 會自動建立。

## 選用 secrets

只有手動 refresh / Push 功能需要額外設定；一般活動、座位圖、3D、新聞與 Cron 不需要先設定 secret。

```bash
npx wrangler secret put ADMIN_TOKEN
npx wrangler secret put CRON_SECRET
```

Push 預設關閉。要啟用才設定 VAPID 並把 `ENABLE_WEB_PUSH` 改為 `1`。

---

## v1.4.2 runtime 重點

- `assets.directory = ./public`。
- KV 自動 provision。
- 官方座位圖成功後保存 last-good binary；上游暫時 403/逾時仍可顯示。
- 官方座位圖每 6 小時重新驗證；同 URL 換圖時 hash 變化會讓 3D signature 失效並重新校正。
- `/api/seat-map-status` 可檢查 resolved URL、hash、快取時間與 last-good 狀態。
- Service Worker cache 已升版，避免舊裝置持續使用 v1.4.1。

