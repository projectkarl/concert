# NEUL Cloudflare v1.4.1 — Official Map / Auto 3D / Venue Fix

Date: 2026-09-30
Base: NEUL v0.40.17 Expanded Auto Coverage

## Release goal

Preserve the existing NEUL visual interface while fixing the deployed Cloudflare runtime path for official seat maps, automatic event-specific 3D generation and venue topology. This release also closes a packaging bug where modified source modules were not guaranteed to be the same bytes served from `public/`.

## Critical deployment fix

- Added `cloudflare/prepare-public.mjs` as the canonical source → `public/` synchronization step.
- Added `cloudflare/check-public-sync.mjs`; 19 critical runtime files must be byte-identical between root and `public/`.
- `postinstall` prepares `public/` automatically during Cloudflare Git builds.
- Recommended Deploy command is now `npm run deploy`, which runs synchronization + asset/API/seat-map/frontend-integrity checks before Wrangler.
- Service Worker cache key was bumped to `neul-v0.40.17-expanded-auto-coverage-cf-v1.4.1-seatmap-venuefix`, so existing browsers stop reusing the previous seat-map / venue runtime modules.

## Official seat-map resolver

- Restored multi-source candidates: display URL, source URL, secondary URL, ticket URL, auto source URL and merged source refs.
- Trusted official-source coverage expanded to Live Nation, Live Nation International CDN, Weverse, official ticketing/CDN hosts and official venue domains.
- Recursive resolver scans normal/lazy image attributes, `srcset`, CSS `url(...)`, HTML, JSON and script text.
- Candidate scoring understands seat-map terms including 座位圖 / 票區 / 場域圖 / 場地圖 / 位置圖 / 配置圖 / 平面圖 / 席次圖 / 票價圖 / 視線.
- Live Nation International CDN requests send a Live Nation Taiwan Referer when required.
- Resolved URL, image hash, resolver metadata and cache state are returned to the frontend; changed image bytes can trigger regeneration.
- The resolver remains allowlisted and bounded by fetch/depth budgets rather than becoming an unrestricted proxy.

## Automatic 3D generation

- Official-map browser intelligence accepts the expanded official source family instead of ticketing-only URLs.
- Fixed venue topology remains authoritative; OCR/Vision may modify event-flexible floor/activity blocks but cannot fabricate building floors or replace fixed tiers at low confidence.
- Auto-generation version/signature bumped so affected event scenes can be recalculated after the venue fixes.
- Outdoor / provisional / uncalibrated venues continue to be blocked from generic fabricated 3D.

## Venue geometry fixes

- Kaohsiung Music Center / 海音館: `3B / 3C-1 / 3C-2 / 3D` are now treated as named rear/upper sections within physical 2F, not a synthetic physical 3F.
- NTSU Arena: interior bowl rendering adjusted away from a perfect oval toward the official broad/open 元寶型 spectator form.
- Kaohsiung National Stadium: shell/roof rendering changed from a closed generic stadium ring toward an open-ended spiral form.
- Kaohsiung Arena: upper-level fixed safety-railing warnings now cover the first three rows behind the railing.
- Zepp New Taipei: venue geometry/source metadata now points to the official Zepp floor guide; 1F remains event-flexible and 2F fixed seating remains structural.
- Concert-hall / auditorium / live-house envelopes are rendered as room/hall structures instead of inheriting arena roof rings.
- Nangang Exhibition Hall 1 4F remains a flat exhibition-hall model rather than an arena bowl.

## 2026-09-30 official event fallback refresh

Eight official/current records were added to the cold-start fallback so temporary crawler failure does not hide newly announced shows:

- F✦FOREVER at Taipei Dome (11/28–29).
- HWANG MIN HYUN fanmeeting at Legacy TERA (11/27).
- Diana Krall at Taipei Music Center (11/28–29).
- K21 顏社二十一週年 at Taipei Music Center (12/12–13).
- 江美琪 Zepp New Taipei (10/2–3).
- MISOGI at Zepp New Taipei (10/4).
- PERSONA LIVE TOUR 2026 - Resonance - at Zepp New Taipei (10/10).
- OPEN!夢想音樂節 at Dream Mall Boulevard, Kaohsiung (12/4–5); this outdoor temporary venue remains excluded from fixed-venue 3D.

Live official discovery still has priority and may replace/augment these records.

## UI preservation

The page layout, styling, navigation, cards, dialogs, mobile UI, news layout and public artwork remain locked to the original v0.40.17 release. Five runtime/data modules are intentionally different because they contain the fixes above:

- `seat-map-intelligence.js`
- `webgl-venue.js`
- `data/multi-venue-geometry.js`
- `data/events.js`
- `sw.js`

The integrity gate locks the remaining 43 original UI/assets to the v0.40.17 hashes and separately locks these five intentional overrides.
