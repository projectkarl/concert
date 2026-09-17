# NEUL v0.34 Test Report

Build: TaiwanOnly · CompleteArena · HDFeatured · RegionExplorer · MultiSource

PASS
- Native WebGL2 renderer retained; no image-pan fake 3D.
- Taipei Arena base 2F + complete 3F structural bowl present; event layouts merge over the physical venue instead of replacing it.
- IVE event-specific layout remains calibrated and the rest of the arena remains visible as structural seating.
- Selected-zone rows, aisles, cross-aisles, rails, LED panel seams and stage geometry remain true WebGL geometry.
- Homepage visual layout retained; hero asset upgraded to 1920×1600 local WebP.
- Featured Concert carousel uses different local images per featured event.
- Upcoming expanded modal supports dynamic city list, region/city filtering, venue/artist keyword search, month and date filters.
- Expanded Upcoming uses all Taiwan events, not only the three compact homepage city chips.
- Taiwan-only event/venue guard retained; overseas venues/events are filtered.
- Live Nation Taiwan, Taipei Arena, Kaohsiung Arena, artist official tours and Taiwan ticket-platform discovery are wired into /api/events.
- tixCraft gap regression seeds include LE SSERAFIM 2026/11/14–15 NTSU Arena and KIM JI WON 2026/11/08 Legacy TERA.
- npm run check: PASS.
- JS module syntax: PASS.
- PWA / service worker cache bumped to v0.34.0.

Important accuracy behavior
- A physical venue section can be shown in subdued 3D even when it is not published as a ticketed section for the selected event. This means “venue exists”, not “ticket is on sale”.
- Unknown seat-number ranges or unpublished event configurations are not invented.


## v0.34 regression coverage
- PASS: Stray Kids section `106` resolves to official-map price `NT$6,880` through the same `sectionTicketLabel()` path used by the 3D UI.
- PASS: selected-section and fullscreen 3D viewer price chips are present.
- PASS: AAA seed event is present, Taiwan-only, dated 2026-12-05/06, and generates Kaohsiung National Stadium centered-stage 3D with official seat-map linkage.
- PASS: ticket-platform parser recognizes an AAA-style Chinese date / venue page.
- PASS: duplicate Stray Kids records from promoter + ticketing collapse to one event while preserving rich price, calibrated layout id, seat-map URL, and both source references.
- PASS: service worker cache bumped to v0.34.0.
- PASS: static HTTP smoke test returned 200 for `/index.html` after the v0.34 changes.
- PASS: 40 curated Taiwan seed records remain 40 after seed-only duplicate review; distinct Taipei Arena `News_Content.aspx?s=...` pages no longer collapse because content-identifying query parameters are preserved.
