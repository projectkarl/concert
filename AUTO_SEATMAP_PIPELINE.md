# NEUL v0.40.1 — Automatic Seat Map → OCR/Vision → Section Mapping → Event 3D

## Pipeline

`Official ticket/event source` → `seat-map resolver` → `SHA-256 fingerprint` → `Vision segmentation` → `OCR` → `section reconciliation` → `event-specific 3D`

### Seat-map resolver

The server accepts only allow-listed official ticket hosts. If the URL is already an image it proxies that image. If it is an event page, it scans normal image links, lazy-loading attributes, `srcset`, CSS `url(...)`, and embedded absolute URLs, scores seat-map candidates, then resolves the strongest official image candidate.

### Vision

The browser analyses the image palette, connected colored regions, likely stage geometry and ticket-price color bands. This remains available if OCR cannot load.

### OCR

Tesseract.js v5 is loaded only when a new/changed seat map needs analysis. The first pass is intentionally limited to digits and Latin characters because Taiwan ticket maps commonly encode useful zone identities as numbers / letters (`106`, `A3`, `2A`, `VIP A`). This keeps the model smaller than full Traditional-Chinese OCR.

### Precise Section Mapping

OCR text alone is not trusted. A recognized token is reconciled with the known venue sections using:

- normalized official section ID / aliases;
- OCR confidence;
- spatial distance between the text on the official image and the calibrated section position;
- tier hints such as VIP / FLOOR;
- exact section-price rules when available.

A matched section keeps the venue's calibrated geometry instead of being redrawn from pixels. Unmatched activity-floor blocks remain image-derived and are clearly marked `AUTO-MAP`.

### Event-specific 3D

Each event receives its own runtime layout (`auto-<event-id>`). Hand-calibrated event layouts are preserved. Auto layouts update only when the official seat-map fingerprint changes, while the neutral venue model remains available as a fallback.

## Performance / safety

- OCR runs one map at a time to avoid freezing Safari/mobile.
- Compact analysis is cached per event + image hash in local storage.
- Images are capped at 10 MB and official source hosts are allow-listed.
- If a source blocks crawling, has no public seat map, or uses an unsupported CDN, NEUL falls back to the venue model and does not fabricate precise sections.
