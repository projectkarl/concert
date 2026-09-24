# Cloudflare 部署步驟

1. 安裝 Node.js 20+。
2. 在專案資料夾執行 `npm install`。
3. `npx wrangler login`。
4. `npx wrangler kv namespace create CACHE`。
5. 把輸出的 namespace id 貼到 `wrangler.jsonc` 內 `REPLACE_WITH_KV_NAMESPACE_ID`。
6. （建議）執行 `npx wrangler secret put ADMIN_TOKEN`，輸入一組長隨機字串。
7. `npm run check`。
8. `npm run deploy`。

部署後先開：
- `/api/health`
- `/api/events`
- `/api/coverage`

若需要立即跑一次來源同步，而不等 Cron：

```bash
curl -X POST 'https://<your-worker>.workers.dev/api/refresh' \
  -H 'Authorization: Bearer <ADMIN_TOKEN>'
```

## Cron

`17 */6 * * *` 使用 UTC：台灣時間每日約 02:17、08:17、14:17、20:17 執行。刻意避開整點，降低熱門整點資源競爭。
