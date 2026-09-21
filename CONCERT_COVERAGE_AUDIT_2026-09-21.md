# Concert Coverage Audit — 2026-09-21

## Live benchmark used for this release

- `twconcertview` publicly reported 315 upcoming shows when rechecked on 2026-09-21.
- That number is used as an external reconciliation target, not as an authority for ticket/seat-map details.
- Official sources (ticketing, promoter, artist, venue) override coverage-only records when a match exists.

## Why v0.40.8 could still miss concerts

The previous implementation parsed only one calendar response. The source page can expose only a subset of its full event inventory in initial HTML/metadata, so displaying the site's advertised total did not prove that NEUL had actually ingested the same number of events.

## v0.40.9 policy

1. Scan the root calendar plus month-specific calendar pages.
2. Merge all parsed events across months.
3. Deduplicate by date/title/venue, then run the normal multi-source event identity merge.
4. Compare parsed unique coverage records against the advertised upcoming-show count.
5. Surface the ratio and crawl health to the UI/API.
6. Keep all discovered concert records in the full list; only the homepage preview is capped.
7. Reject non-performance ticket products.
8. Never claim completeness when the coverage ratio is below the threshold or source pages fail.

## Accuracy boundary

No public web aggregation can guarantee every Taiwan performance because organizers may announce through social channels first, pages may be geo/bot restricted, and event data changes continuously. NEUL therefore reports coverage health instead of making an absolute completeness claim.
