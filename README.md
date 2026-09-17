# NEUL v0.35 — Auto Seat/Price Sync + Responsive Polish

Taiwan-only concert discovery and true WebGL venue/seat-view prototype for Vercel Hobby. The original NEUL visual direction is preserved; this release focuses on automatic official-data synchronization, layout reliability, and image clarity.

## v0.35 highlights

- Official Taiwan ticket-platform discovery now extracts structured section/price pairs when the page exposes recognizable zone names and prices.
- Official seating-map URLs, price summaries and section-price rules continuously sync into event-specific 3D layouts. Hand-calibrated geometry/distances are preserved rather than regenerated.
- Unknown or ambiguous section mappings remain unpriced/TBA instead of guessing.
- Upcoming cards received a responsive overflow audit for desktop and mobile: long artist/title/venue/status text is contained inside the card, and compact mobile cards hide the badge before allowing horizontal overflow.
- Global horizontal-overflow guards were added for drawers, event modals, venue controls, Featured copy and media.
- Hero uses a retina-friendly ~2400px-wide WebP asset. Featured carousel uses distinct 1920×1080 WebP images and no longer applies scale transforms that soften the photography.
- Existing Taiwan-only feed, cross-source dedupe, AAA, Stray Kids price-in-3D, complete Taipei Arena structure, IVE demo, multilingual UI and true WebGL2 3D remain intact.

## Automatic-update behavior

`/api/events` is CDN-cached for roughly six hours and re-discovers supported Taiwan official/ticketing sources. New official ticket prices and seating-map URLs are merged into the event record. The browser rebuilds/synchronizes the event 3D metadata from that structured event data. A daily `/api/refresh` cron remains as a warm/sync path.

Important boundary: an official 2D seat map can safely update the seat-map source and structured section prices, but NEUL does not claim pixel-perfect automatic image-to-3D reconstruction. Existing calibrated 3D geometry stays fixed unless a reliable structured mapping is available.
