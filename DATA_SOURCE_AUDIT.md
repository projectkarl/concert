# NEUL v0.41 Data Source Audit

Audit date: 2026-09-17

Scope: Taiwan performances only. Overseas venues and overseas performances are excluded; artist nationality is unrestricted.

## Verified issue fixed in v0.40

v0.39 could detect an official seat-map URL without actually deriving a custom 3D layout from the image. That is why the BTS official map could visibly disagree with the 3D scene. v0.40 separates four states: event discovered, official map found, section prices found, and event-specific 3D generated/calibrated.

The official monitor now reads both primary and secondary official sources. For example, a Live Nation event can use tixCraft as the secondary authoritative seat-map/price source and both are rechecked.

## Automatic public sources

1. Live Nation Taiwan
   - Taiwan index/venue pages
   - artist-page -> Taiwan event-page follow-up
2. Taipei Arena official event list
3. Kaohsiung Arena official calendar
4. Artist / agency official tour pages
5. Taiwan official ticket platforms
   - tixCraft / 拓元
   - KKTIX, including paginated public event indexes and selected promoter subdomains
   - Ticket Plus / 遠大售票
   - KHAM / 寬宏售票
   - FamiTicket / 全網售票
   - udn 售票網
   - ibon 售票
   - MNA / 牛耳藝術
   - 年代售票
6. Curated verified fallbacks for important events when upstream HTML is temporarily unavailable

## BTS audit

Official tixCraft event: `https://tixcraft.com/activity/detail/26_btskns`
Official map image: `https://static.tixcraft.com/images/activity/field/26_btskns_299447f2cd153382c7af192304de21d1.jpg`

The map is not a standard end-stage stadium layout. v0.40 uses a calibrated central-stage layout with four diagonal arms. VIP package is NT$9,380; general price bands are NT$7,980 / 6,980 / 5,980 / 4,980 / 3,980 / 2,980. The fixed Kaohsiung National Stadium grandstands remain visible beneath the activity overlay.

## T-ARA audit

Official KKTIX event: `https://wve.kktix.cc/events/2026tara-kh`
Official map image: `https://assets.kktix.io/organization_resource_files/43521/79950/81268528ae0b885c.jpg`

Event: 2026/10/18 17:00, Kaohsiung Music Center Hi-ing Music Hall. Published prices are NT$5,980 / 5,680 / 4,680 / 3,680, with disabled-seat pricing separately listed. v0.40 includes an event-specific map/layout and KKTIX promoter-subdomain discovery so this event is not dependent on a manual homepage list.

## Seat-map automation

- Map images are fetched only from allowlisted official ticket/media hosts.
- Image bytes are hashed; a changed hash triggers re-analysis even when the image URL stays the same.
- Official page text supplies prices and recognizable section-price rules.
- Image pixels supply conservative stage/zone geometry for auto-generated drafts.
- Full base-venue geometry is retained unless an event explicitly overlays a configurable activity tier.
- Stage / runway / B-stage / FOH areas remain no-seat production zones.
- Ambiguous maps or price mappings remain pending/TBA rather than being guessed.

## Remaining limitation

No public Taiwan ticket source is guaranteed complete and publisher seat-map graphics are not standardized. The system now materially reduces both failure modes, but it must still expose source/automation status rather than claim that every arbitrary image can be reconstructed as exact CAD geometry.


## v0.41 source-to-3D scheduling

The event feed continues to use a six-hour shared cache. While the site is open, the client schedules its next refresh from `nextUpdateAt`; once refreshed, every current event with an official seat-map URL re-enters the image-hash / geometry hydration pipeline. A changed seat-map image therefore regenerates the event-floor draft without requiring a new deployment.
