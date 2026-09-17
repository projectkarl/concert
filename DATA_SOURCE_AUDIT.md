# NEUL v0.32 Taiwan Event Source Audit

## Automatic sources

1. **Live Nation Taiwan public event pages** — discovery is nationality-neutral. Taiwan shows are retained whether the artist is Korean, Japanese, American, British, Australian, European or otherwise international.
2. **Taipei Arena official public event list** — adds venue-published shows that are not promoted by Live Nation.
3. **Kaohsiung Arena official calendar** — retains the existing venue-level official calendar discovery.
4. **Artist official tour pages** — new source class. v0.32 includes a YG Entertainment official parser for BABYMONSTER's 2026–27 CHOOM tour and only imports fields actually published by the artist/agency.
5. **Curated verified fallback seeds** — ensures verified events remain visible when an upstream site is temporarily unavailable. These entries keep their official source URL and do not fabricate missing ticket details.

## Taiwan performances by artists from multiple markets

The current verified fallback set includes upcoming Taiwan appearances from markets beyond Korea, including Hans Zimmer, LANY, BE:FIRST, Henry Moodie, Yuuri, XG, Charlie Puth, Vaundy, Malcolm Todd, 5 Seconds of Summer, Khalid and FKJ, plus BABYMONSTER via YG official tour data.

## Missing-data rule

If an official page confirms only city/date/venue, NEUL stores only those fields. Price, onsale time, promoter, seat map and detailed configuration remain `TBA` / `CHECK OFFICIAL` until a reliable official source publishes them.

## Discovery regression fixed

The old Live Nation parser contained a Korea-oriented gate that could discard non-Korean artists before they reached the UI. v0.31 removes that gate and assigns a market tag only for display/metadata purposes; market does not determine eligibility.


## Taiwan-only boundary (v0.32)
Only performances physically held in Taiwan are eligible for the product feed. Overseas tour dates and overseas venue models are intentionally excluded. Artists from Korea, Japan, Europe, the Americas or elsewhere remain eligible only when the event venue is in Taiwan.
