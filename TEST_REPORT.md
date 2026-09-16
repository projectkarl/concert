# NEUL v0.27 Test Report

## Multilingual UI
- Traditional Chinese selector present: PASS
- English selector present: PASS
- Japanese selector present: PASS
- Korean selector present: PASS
- Language selection persisted via `neul-language`: PASS
- `<html lang>` changes with selected language: PASS
- Locale-aware date / weekday formatting hooked into app.js: PASS
- Dynamic DOM translation observer present: PASS
- Search placeholder / interface labels translated: PASS
- Event / artist proper nouns remain source-driven: PASS
- Japanese font family loaded: PASS

## PWA
- `i18n.js` included in app shell: PASS
- Service Worker cache version v0.27: PASS
- Offline UI translation code cached: PASS

## Regression
- JS syntax: PASS
- npm project checks: PASS
- 24 seed events retained: PASS
- 11 venue models retained: PASS
- WebGL2 + Canvas fallback retained: PASS
- Dark / Light mode retained: PASS
- Alerts remain separate from Settings: PASS
- Auto 3D and venue baseline 3D retained: PASS
