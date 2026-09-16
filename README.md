# NEUL v0.27 — Multilingual UI

NEUL is a Taiwan-focused concert companion for K-pop fans, with event discovery, countdowns, PWA reminders, venue 3D views and calibrated seat-view simulation.

## v0.27 changes

- Added four interface languages: Traditional Chinese, English, Japanese and Korean.
- Language switch is located in Settings and changes immediately without reloading.
- Language preference is saved locally and restored on the next visit.
- Date / weekday formatting follows the selected interface locale while continuing to use Asia/Taipei for event times.
- Navigation, search, event filters, Upcoming, Featured, My List, venue controls, seat preview, event drawer, countdown labels, reminders, seat comparison, day mode, settings and disclaimers are translated.
- Artist names, official event titles, official venue / ticketing identifiers and source-provided content retain their official wording when appropriate, reducing the risk of mistranslating proper nouns.
- Added Noto Sans JP to complement the existing Korean / Traditional Chinese font system.
- PWA cache version upgraded to v0.27 and includes `/i18n.js` for offline interface language support.

## Languages

- `zh-Hant` — 繁體中文
- `en` — English
- `ja` — 日本語
- `ko` — 한국어

The selected language is stored under `neul-language` in localStorage.

## Existing functionality retained

- Taiwan-only event discovery and archive
- 11 venue models
- Event Auto 3D + venue baseline 3D
- WebGL2 + Canvas fallback
- Seat row / seat-number / height / posture / lens simulation
- Featured concert carousel
- Flip countdown
- PWA installation
- Independent alerts center
- Dark / light themes
- IndexedDB persistence
- Seat A/B comparison
- Concert-day mode

## Deploy

Deploy the entire folder to Vercel. No additional translation API or paid service is required.
