# NEUL v0.41 Venue Calibration Audit

Audit date: 2026-09-18

## Global auto-generation invariant

Every event-specific 3D layout is now an overlay on the venue's physical base model. Event ticket maps may:
- activate an existing physical section,
- attach verified section pricing,
- add event-flexible floor blocks,
- add production/stage metadata when explicitly supported.

They may not remove the base venue's lower bowl, upper bowl, floor envelope or other known physical tiers. This prevents future automatically generated events from appearing as only a few middle/upper blocks.

Likewise, generic auto-generation no longer invents a runway or B-stage unless event metadata explicitly supports it.

## NTSU Arena / 林口體育館

The previous model only exposed MIDDLE / UPPER visual tiers, which made concert layouts look physically incomplete. v0.40 retains four structural layers:
- FLOOR — configurable activity-floor envelope
- LOWER — lower / event-configurable stepped seating envelope
- MIDDLE — retained bowl
- UPPER — retained bowl

The added FLOOR/LOWER blocks are structural envelopes, not a claim that every concert uses the same exact seat rows. Official event maps can overlay the corresponding activity blocks without deleting the rest of the arena.

## Kaohsiung Arena

A configurable FLOOR structural layer is retained alongside the fixed bowl tiers. Event layouts can add floor ticket zones while the physical venue remains complete.

## Taipei Arena

The v0.36 B1 + 2F + 3F completeness work remains intact:
- B1 flexible/retractable-seat structural envelope
- 2F fixed bowl
- 3F complete structural bowl

B1 is event-dependent and is not presented as a fixed permanent ticket-zone map.

## Price display rule

A 3D section displays a ticket price only when its ID/label/alias can be matched reliably to an official `sectionPriceRule`. A general event price range is not shown as though it were the selected section's price. This fixes the prior behavior where a whole list of ticket prices could appear on every section.

## Expired event layouts

Finished event-specific layouts are automatically removed from the normal venue selector based on event end/start time plus a small grace window. Archive/detail flows can still retain historical records without cluttering the live venue selector.


## v0.40 event-map regeneration

BTS ARIRANG Kaohsiung uses an official-map calibrated central/X-arm activity overlay. T-ARA Fancon uses an official KKTIX activity overlay for Hi-ing Music Hall. Future auto-generated events can derive conservative stage/ticket-zone geometry from official seat-map image pixels; a changed official image hash triggers re-analysis while full physical venue structure remains available underneath.


## v0.41 automatic official-map regeneration

For newly discovered current events, the runtime flow is now: official activity source → official seat-map image → content hash → image analysis → event-floor geometry → production-zone no-seat filtering → event-specific WebGL layout. The image-derived layer is limited to the flexible event floor; fixed lower/middle/upper bowls always come from the calibrated physical venue model.

The analyzer now rejects event-floor blocks that overlap the detected main/central stage or extra production arms, scales row/seat density from the detected block dimensions, and can mark price-linked standing zones as standing-only when the official section-price rules explicitly say so.

## v0.41 visibility pass

The arena field is rendered in a lighter neutral gray in both WebGL2 and Canvas fallback. Stage deck, front fascia, shallow stairs, runway and extra-stage surfaces use higher contrast. This is a presentation-only change: venue distances, section positions and calibrated camera geometry are unchanged.

## v0.41 Archive invariant

Archive is determined from the event's calculated end time, not a stale metadata flag. Date-only or midnight end values are treated as covering the full listed calendar date unless an exact time is confirmed. Current/future events therefore remain in Upcoming and the active venue layout list until they truly end; after that, the activity layout is removed from the normal venue selector and the record becomes Archive-only.
