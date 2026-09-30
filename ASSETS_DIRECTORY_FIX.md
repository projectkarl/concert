# NEUL Cloudflare v1.3.1 — assets.directory fix

The v1.3.0 package used a hidden static-assets folder named `.cf-public`.
Some Cloudflare Dashboard / Git / archive import paths can omit dot-prefixed folders, causing Wrangler to report:

`The directory specified by the "assets.directory" field in your configuration file does not exist.`

v1.3.1 changes only Cloudflare deployment infrastructure:

- Static assets folder: `.cf-public` -> `public`
- `wrangler.jsonc`: `assets.directory` -> `./public`
- `npm run cf:deploy` now runs an asset-directory doctor before Wrangler.
- Frontend bytes inside `public/` remain identical to the v0.40.17 originals.

Run commands from the folder containing `wrangler.jsonc`:

```bash
npm install
npm run cf:doctor
npm run cf:deploy
```
