# NEUL Cloudflare v1.3.2 — Git repository root check

This release is intended to be copied directly into the Git repository root used by Cloudflare Workers Builds.

Before pushing, the repository root must contain all of the following at the same level:

- `wrangler.jsonc`
- `package.json`
- `public/`
- `public/index.html`
- `cloudflare/`

Verify locally:

```bash
grep -n '"directory"' wrangler.jsonc
test -f public/index.html && echo "public/index.html OK"
git grep -n '\.cf-public' || true
```

Expected:

- `wrangler.jsonc` contains `"directory": "./public"`
- `public/index.html OK`
- the `.cf-public` search returns no matches

For Cloudflare Workers Builds:

- If these files are in the repository root, set **Root directory** to `/` (or leave it empty/default).
- If you intentionally place this project in a subfolder, set **Root directory** to that exact subfolder.
- Deploy command: `npx wrangler deploy`

Do not retry an old commit that still contains `.cf-public`; push a new commit with this release first.
