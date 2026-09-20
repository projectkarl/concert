# NEUL v0.40.9 Test Report

## Result

PASS

## Existing project regression

- Existing NEUL check suite: PASS
- Current fallback events with a unique event-specific 3D: 75 / 75
- Unique event layout IDs: 75 / 75
- Current event layouts compatible with v0.40.9 pipeline: 75 / 75
- Existing hand-calibrated layouts preserved: PASS
- Unknown-venue runtime fallback model: PASS
- PWA / WebGL / Canvas fallback / Archive / ticket lifecycle / Featured carousel regression: PASS

## Future-event automatic generation simulation

Synthetic post-deployment events were used to test the runtime path rather than relying only on current seed data.

1. New event at an existing venue → unique `auto-<event>` layout: PASS
2. Second event at same venue → different event layout: PASS
3. Event initially without seat map → conservative event draft: PASS
4. Official seat map + Section prices arrive later → same layout moves to `official-map-pending`: PASS
5. OCR/Vision analysis passes stage + Section QA → moves to `official-map-verified`: PASS
6. Section price evidence is mapped → `priceMappingVerified`: PASS
7. Official seat-map URL changes later → previous verification is invalidated and fresh QA is required: PASS
8. Completely new venue → `runtime-<venue>` model + unique event layout generated automatically: PASS

## Verification semantics

A server-discovered seat-map URL is evidence that automatic QA can start; it is no longer treated as proof that the 3D geometry or Section pricing is already verified.
