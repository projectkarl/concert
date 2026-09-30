# NEUL Cloudflare v1.4.2 — Seat-map Last-Good + Auto3D Hash Refresh

Date: 2026-09-30
Base: NEUL v0.40.17 + Cloudflare v1.4.1

## Official seat-map reliability

- Successful official seat-map images are now stored as a bounded binary last-good artifact in Workers KV.
- Default seat-map binary cache limit: 8 MiB per image.
- Last-good binary TTL: 30 days.
- Resolver metadata is revalidated every 6 hours by default.
- If an official ticket/CDN source returns 403, 404, timeout or temporary failure after a previous success, `/api/seat-map-image` serves the last-good official image instead of showing a blank panel.
- Responses expose `X-NEUL-SeatMap-Stale` and `X-NEUL-SeatMap-Fetched-At` in addition to resolved URL/hash/resolver metadata.
- Added `/api/seat-map-status` for non-image diagnostics of the resolver/cache state.
- A `.jpg/.png` suffix no longer overrides an explicit non-image upstream `Content-Type`; HTML/CDN error pages are rejected before they can appear as broken seat maps.
- If a KV binary artifact expires while its metadata is still current, the next successful revalidation automatically recreates the missing binary last-good copy.

## Automatic seat-map / 3D refresh

- Scheduled enrichment prefetches directly discoverable official seat-map images while checking event detail pages.
- Prefetched image hash, resolved URL and resolved time are merged back into `/api/events`.
- Event-specific 3D generation signatures now include `seatMapHash` and `seatMapResolvedUrl`.
- If an organiser replaces the image at the same URL, the changed hash invalidates the previous automatic 3D mapping and sends it through OCR/Vision/topology QA again.
- Existing hand-calibrated scenes remain topology-authoritative; hash changes mark source verification stale without silently replacing fixed venue geometry.

## Cloudflare deployment

- `kv_namespaces` now declares only binding `CACHE`; Wrangler 4 automatic provisioning creates the namespace on first deploy when needed.
- Removed `REPLACE_WITH_KV_NAMESPACE_ID` from the deployable config.
- Cloudflare-only package dependencies were reduced to Wrangler; Vercel Blob and Node web-push packages are no longer installed in this release.
- Wrangler is pinned to `4.144.0` and package manager metadata matches the Cloudflare build environment used in the supplied deployment log (`bun@1.2.15`).
- Worker external subrequests are explicitly capped at 45, below the Workers Free 50-external-subrequest ceiling.
- `npm run deploy` performs source→public sync, frontend integrity, API contract, seat-map smoke, Worker smoke and scheduled-pipeline smoke before Wrangler deploy.

## Interface / venue model

No UI redesign. The existing v0.40.17 HTML/CSS/artwork remain locked. v1.4.1 venue corrections are retained:

- 海音館 3B / 3C-1 / 3C-2 / 3D remain physical 2F rear-zone labels, not a fabricated 3F.
- NTSU retains the broader/open ingot-shaped spectator bowl treatment.
- Kaohsiung National Stadium retains the open-ended stadium/shell treatment.
- Kaohsiung Arena retains fixed safety-railing LOS warnings for the first rows behind the railing.
- Zepp New Taipei remains 1F event-flexible + 2F fixed seating using the official floor guide.
