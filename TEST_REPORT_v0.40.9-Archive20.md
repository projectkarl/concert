# NEUL v0.40.9 Archive20 test report

Status: **PASS**

Validated:
- `/api/events` retains at most 20 ended events while preserving every active/upcoming event.
- Browser fallback applies the same 20-event Archive cap.
- A synthetic 25-ended + 2-upcoming test retains the 20 newest ended events and both upcoming events.
- Lifecycle compaction runs every minute so newly ended events roll into Archive without a reload.
- Ended events are excluded from official-seat-map OCR/Vision hydration.
- Ended event-specific layouts are removed from the live 3D selector even if that layout was selected at the moment the event ended.
- The selector then falls back to the venue K-star reference example or base venue layout.
- Hourly automatic event refresh and the existing daily Vercel refresh schedule remain present.
- Full regression, coverage, mobile/news, venue policy, topology, aespa geometry and baseline verification pass.
