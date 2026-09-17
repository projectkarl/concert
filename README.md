# NEUL v0.38 — Auto Sources + Complete 3D + UI Audit

Taiwan-only concert discovery and true WebGL venue/seat-view prototype for Vercel Hobby. The original NEUL visual design is preserved. This release focuses on automatic source coverage, complete base-venue geometry, exact section-price behavior, automatic removal of ended event layouts, and responsive UI stability.

## v0.38 highlights

- Taiwan ticket-platform discovery now covers nine public official source families: tixCraft, KKTIX, Ticket Plus / 遠大, KHAM / 寬宏, FamiTicket, udn tickets, ibon, MNA / 牛耳, and 年代售票.
- Live Nation Taiwan artist-page hopping, Taipei Arena official events, Kaohsiung Arena calendar, and artist / agency official tour sources remain active as additional automatic layers.
- Current verified seed/fallback coverage is 57 Taiwan event records. Runtime discovery can merge newer official events without a redeploy.
- BABYMONSTER Taipei fallback is updated to the announced Ticket Plus schedule and price bands. Only reliably mapped zones receive a 3D section price; unknown zones remain unmapped instead of receiving the full event price list.
- Four previously missing verified events are now retained as safety fallbacks: Arena of Valor 10th Anniversary Concert, Silica Gel Asia Tour Taipei, MAMAMOO 4WARD Taipei, and YOASOBI SUPER PLANET Taipei Dome.
- NTSU Arena / 林口體育館 keeps FLOOR + LOWER + MIDDLE + UPPER in the general venue model. A hand-calibrated official event map may replace generic flexible envelopes with its published ticket zones while the physical arena floor remains rendered.
- Kaohsiung Arena similarly retains a 1F configurable activity-floor layer in addition to fixed bowl tiers.
- Auto-generated layouts cannot delete base venue structure. Only a hand-calibrated official event map may suppress generic structural placeholders that would otherwise duplicate the published ticket zones.
- Automatic 3D staging is more conservative. Runways, B-stages and center stages are only added when event metadata explicitly supports them.
- Ended concert layouts are automatically removed from the venue event selector while archived event detail can still be opened directly.
- My List, long VENUE names and other narrow cards were audited for overflow. The blue search helper line was removed. “查看更多活動” no longer displays a volatile count while data is still merging/deduping.
- Existing crisp Hero and Featured assets are preserved with no deliberate blur/zoom filters.
- LE SSERAFIM PUREFLOW now uses the current official tixCraft field map: VIP A/B/C are 1F standing zones, the center runway + octagonal performance platform + FOH are reconstructed, and the old generic NTSU floor-seat rendering is disabled for this event.
- True3D now has a production-footprint guard: chair instances are never generated inside the main stage, runway, B-stage, extra stage decks or FOH. Generic structural/flexible floor envelopes and official standing zones never auto-generate chairs.
- tixCraft `images/activity/field/` assets receive explicit seat-map priority so a poster / fan-benefit image is not mistaken for the seating plan.

## Automatic-update behavior

`/api/events` remains the primary runtime discovery endpoint. It uses a bounded cache, then re-checks supported public/official Taiwan sources. Official data is merged and deduplicated before the frontend receives a stable list.

When a supported official source publishes recognizable data, NEUL can merge:
- event date and sessions
- venue and city
- ticket status / onsale metadata
- total price summary
- recognizable section-to-price rules
- official seat-map URL
- official source references

Those fields can refresh without rebuilding the site. Hand-calibrated 3D distances and coordinates remain protected. New event-specific data overlays the base venue; it does not delete physical venue tiers.

## 3D price rule

3D section price is shown only when the selected section can be matched reliably to an official section-price rule. If NEUL only knows the overall event price range, that information stays at event level and is not repeated as though every section had the same price.

## Geometry boundary

Configurable floor / retractable-seat layers are structural envelopes, not claims of official per-seat CAD geometry. Exact floor blocks, standing zones, production footprint and closed seats remain event-specific and are overlaid only when supported by an official event map or calibrated data.
