# NEUL Cloudflare Git Root Check

Cloudflare Workers Build 必須在本 release 的 repository root 執行。

Git repository 最外層應直接存在：

```text
package.json
wrangler.jsonc
public/index.html
cloudflare/worker.js
```

部署前可執行：

```bash
grep -n '"directory"' wrangler.jsonc
test -f public/index.html && echo "public/index.html OK"
test -f cloudflare/worker.js && echo "cloudflare/worker.js OK"
npm run cf:doctor
```

`wrangler.jsonc` 的有效設定必須是：

```text
"directory": "./public"
```

歷史文件可能提到舊的 `.cf-public` 問題，這不代表有效 Wrangler 設定仍使用它。若要確認程式與設定沒有舊路徑，可用：

```bash
grep -RIn --include='wrangler.*' --include='package.json' --include='*.js' --include='*.mjs' '\.cf-public' . || true
```

上述指令在 v1.4.2 應沒有結果。

Cloudflare Git Build 建議：

```text
Root directory: repository root
Build command: blank
Deploy command: npm run deploy（建議）

若維持 Cloudflare 預設 `npx wrangler deploy` 也可部署；`public/` 已包含在 repository，KV 會由 Wrangler 自動 provision。
```

不要 Retry 一個仍指向舊 commit 的 deployment；先確認新 commit 真的包含 `public/` 與目前的 `wrangler.jsonc`。
