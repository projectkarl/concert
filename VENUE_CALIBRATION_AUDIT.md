# NEUL v0.35 Venue Calibration Audit

## Taipei Arena
- 2F Red / Yellow / Purple / Blue structural sections retained.
- Public-seat-record calibration for 2F remains 1–15 rows where already verified; no unsupported 16+ row claim is introduced.
- 3F structural bowl now renders all four colour families instead of only the previously modelled rear/yellow arc.
- Event-specific layouts no longer delete the rest of the physical arena. Ticket-map sections override matching structural sections; non-ticket-map structural sections remain dimmed.
- IVE event-specific VIP / 2F / 3F / box geometry remains separate from the base venue model.

## Rendering
- Native WebGL2 instanced seats.
- Selected zones retain denser true seat-row geometry.
- Background structural zones now use denser row/seat sampling so the complete bowl reads clearly without excessive mobile load.
- Stair/aisle lines, cross aisles, handrails and LED panel seams remain geometry, not a background image.


## v0.34 event-layout calibration
- Taipei Dome / Stray Kids: official ticket colors are attached only to fixed stands that can be read reliably from the official seating map. Gray or ambiguous fixed sections and floor blocks without a reliable section-to-price match remain unpriced rather than inferred.
- Kaohsiung National Stadium / AAA: auto-generated event layout uses the existing full stadium geometry plus centered-stage mode because the official ticket page describes a four-sided / 360-degree stage. Event geometry is still a draft until precise production dimensions are published.

## v0.35 metadata-sync boundary
Hand-calibrated WebGL geometry remains immutable during routine official-data refresh. Official seat-map URLs, total price summaries and recognizable section-price pairs may update automatically and are reflected in the 3D UI. A changed 2D image alone is not treated as sufficient evidence to move calibrated 3D coordinates.
