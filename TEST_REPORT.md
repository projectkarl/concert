# NEUL v0.37 QA Report

Date: 2026-09-17

## Automated checks

- PASS — 57 Taiwan-only seed/fallback events with no holes
- PASS — cross-source dedupe retains distinct events
- PASS — 11 Taiwan venue models, no overseas venue leakage
- PASS — 9 Taiwan ticket-platform source families wired: tixCraft, KKTIX, Ticket Plus, KHAM, FamiTicket, udn, ibon, MNA, 年代
- PASS — Live Nation artist-page hop remains active
- PASS — user-requested events present: 傳說對決、Silica Gel、Charlie Puth、Post Malone、BTS、MAMAMOO、YOASOBI、BIGBANG 台北/高雄
- PASS — BABYMONSTER current Ticket Plus schedule/price fallback present
- PASS — BABYMONSTER known 6,780 zones map to 3D; unknown zone does not inherit an arbitrary/full price list
- PASS — NTSU Arena base model includes FLOOR / LOWER / MIDDLE / UPPER
- PASS — event-specific NTSU layout retains base tiers while adding VIP/BOWL/REAR overlays
- PASS — Kaohsiung Arena retains 1F configurable floor layer
- PASS — broad all-prices-on-every-section fallback removed
- PASS — ended event layouts filtered from venue selector
- PASS — deprecated blue search helper removed
- PASS — volatile “查看更多活動 (N)” count removed
- PASS — My List long-name overflow guard present
- PASS — VENUE long-title wrapping + native title tooltip support present
- PASS — crisp Hero / Featured media preserved
- PASS — native WebGL2 + Canvas fallback preserved
- PASS — PWA / IndexedDB / archive / reminders / seat compare preserved

## Rendering/data boundary

Container tests validate syntax, structural geometry, data merging and application logic. Exact GPU appearance should still be visually checked on the deployed browser/device because the container does not reproduce Safari/Chrome GPU rendering perfectly.
