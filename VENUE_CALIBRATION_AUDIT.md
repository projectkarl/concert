# NEUL v0.37 Venue Calibration Audit

Audit date: 2026-09-17

## Global auto-generation invariant

Every event-specific 3D layout is now an overlay on the venue's physical base model. Event ticket maps may:
- activate an existing physical section,
- attach verified section pricing,
- add event-flexible floor blocks,
- add production/stage metadata when explicitly supported.

They may not remove the base venue's lower bowl, upper bowl, floor envelope or other known physical tiers. This prevents future automatically generated events from appearing as only a few middle/upper blocks.

Likewise, generic auto-generation no longer invents a runway or B-stage unless event metadata explicitly supports it.

## NTSU Arena / 林口體育館

The previous model only exposed MIDDLE / UPPER visual tiers, which made concert layouts look physically incomplete. v0.37 retains four structural layers:
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
