# NEUL v0.40.4 — Auto Generation Audit

Date: 2026-09-20 (Asia/Taipei)
Base: NEUL v0.40.3
Scope: BTS special-stage geometry, BABYMONSTER section pricing, official seat-map OCR/Vision automation, 3D regeneration safety.

## Findings and fixes

1. **BTS special-stage geometry was incomplete.**
   - Previous 3D represented the central core as a rectangular block and only a partial set of floor sections.
   - v0.40.4 uses a circular central stage plus four diagonal extensions for the calibrated BTS event layout.
   - The event floor now contains the complete calibrated A1–A13, M1–M13, Y1–Y14, and R1–R14 section families.
   - Central-stage layouts no longer inherit the generic end-stage rear LED wall. The renderer keeps a neutral overhead truss unless verified event-specific screen geometry exists.

2. **Automatic stage inference could over-create X-shaped catwalks or choose the wrong dark object as the stage.**
   - Previous logic was too willing to infer four arms from a dark central region.
   - v0.40.4 uses an OCR `STAGE` label, when available, to choose the nearest plausible dark geometry instead of always trusting the largest dark object.
   - It then requires four diagonal angular sectors in the Vision mask before the `central-x` profile is emitted.
   - A central stage without that evidence becomes `central-stage` with zero automatic arms.
   - Stage inference now exposes `stageConfidence`; manually calibrated stage geometry is overwritten only by a matching high-confidence profile.

3. **Event-specific and Traditional-Chinese section labels were under-recognized.**
   - Previous OCR matching could rely too heavily on venue-base sections and loaded an English-only OCR worker.
   - v0.40.4 passes the effective event sections into Vision/OCR and attempts `eng+chi_tra` first, falling back to English only if the Traditional-Chinese model cannot load.
   - Section normalization now handles full-width forms, and range rules such as `VIP A～E`, `特A～C`, and `黃3A～J` are expanded before price matching.

4. **Automatic price-color mapping had a correctness risk.**
   - A palette ordered by image position must not be paired with the textual price list by ordinal position.
   - v0.40.4 only creates a color→price mapping when OCR finds a numeric price and an adjacent legend swatch.
   - If no trustworthy legend relation is found, the result is `unverified-no-price-guess`; NEUL does not invent a price from palette order.

5. **BABYMONSTER section pricing was incomplete in 3D.**
   - v0.40.4 adds the calibrated event layout and binds published zones: VIP/selected 2F = NT$6,780, 特/selected 2F = NT$5,800, 黃2A–2E = NT$4,800.
   - 黃3A–3J keeps the published NT$4,200 / 3,600 / 2,600 / 800 range because an exact per-row cutoff is not represented as a fake section-level fact.
   - The event uses a main stage + runway + end platform + FOH geometry rather than the venue-generic stage.

6. **Ticket-page eligibility could miss secondary official ticket URLs.**
   - v0.40.4 checks `seatLayoutSourceUrl`, `ticketUrl`, `ticketSourceUrl`, `secondarySourceUrl`, then `sourceUrl`.
   - This allows an artist/promoter page to remain the primary source while an official ticket page still enters the seat-map resolver pipeline.

7. **Ticket Plus discovery depth increased.**
   - Detail discovery cap raised from 32 to 64 for Ticket Plus.

## Regeneration policy

- **Automatic event layout:** OCR/Vision may generate sections and geometry when confidence thresholds are satisfied.
- **Hand-calibrated event layout:** OCR/Vision may enrich exact section/price metadata, but geometry is protected unless the official image changed, the detected stage profile matches the expected profile, and stage confidence is at least 0.90.
- **No reliable legend evidence:** price-color mapping is withheld instead of guessed.
- **No reliable special-stage evidence:** NEUL falls back to the calibrated/base geometry instead of inventing catwalks.

## QA result

`node scripts/check.mjs` passed:

- 66 Taiwan seed events
- 12 venue models
- 14 ticket sources + official artist/venue feeds
- BTS circular core + four-arm special stage
- BTS complete A/M/Y/R floor families
- BABYMONSTER exact section price bindings + 3F range guard
- event-specific OCR section candidates
- safe OCR legend mapping
- high-confidence calibrated-stage overwrite guard
- WebGL + Canvas fallback
- PWA + IndexedDB

All JavaScript/ESM files pass `node --check`.

## UI lock verification

`index.html` and `styles.css` SHA-256 hashes are identical to the v0.40.3 base used for this build. No website redesign was introduced.
