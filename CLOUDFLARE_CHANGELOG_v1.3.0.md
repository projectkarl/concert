# NEUL Cloudflare v1.3.0 — Exact UI / Full Runtime

## Interface policy

No frontend redesign. The Cloudflare release is based directly on `NEUL v0.40.17 Expanded AutoCoverage`. 48 public assets are SHA-256 locked against that source archive.

## Runtime completeness restored

Compared with the earlier adapter builds, v1.3 restores the complete original frontend API surface:

- events
- official revalidation
- entertainment news
- official seat-map image resolver
- push config
- push subscription

and adds operational Cloudflare endpoints for coverage, health, manual refresh and Push digest.

## Automation

- 15 ticket/promoter source definitions including Live Nation.
- 6 official venue-calendar definitions.
- TWConcertView + Artists.tw dual coverage-reference layer.
- five entertainment-news categories.
- one hourly scheduled source job with six rotating phases.
- one daily Push digest schedule.
- last-good per-source KV retention.
- Archive20 compaction.

## Stability / performance

- source fetching is sharded instead of all-at-once;
- bounded source response sizes and timeouts;
- versioned KV cache namespace;
- normalized/indexed event dedupe;
- request-budgeted trusted-host seat-map resolver;
- small on-demand HTTP revalidation rather than visitor-triggered full crawling;
- health/cron observability through `/api/health`.

## Push

Cloudflare Web Push is optional. The Worker uses VAPID/WebCrypto and sends contentless Push, allowing the unchanged original Service Worker to present its existing generic notification.

## Testing

- original NEUL regression: PASS
- 48-asset exact UI lock: PASS
- Cloudflare contract: PASS
- request smoke: PASS
- scheduled-flow smoke: PASS
