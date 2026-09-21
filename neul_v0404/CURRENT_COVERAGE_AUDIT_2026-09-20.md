# NEUL Current Concert Coverage Audit — 2026-09-20

## What changed

The v0.40.2 fallback set was refreshed to **101 explicit fallback events**, while preserving official live discovery as the primary source of truth.

Newly added fallback examples confirmed on official ticket pages include:

- NIEL — FEARLESS SHOWCASE IN TAIPEI — tixCraft
- 82MAJOR — 82CLUB: OUT OF CONTROL — tixCraft
- Slowdive 2026 Live in Taipei — tixCraft
- DOMi & JD BECK — WHO ASKED? Tour — tixCraft
- 孫盛希 Shi Shi — The Taste of… — tixCraft
- 2026 FIREBALL Fest. — tixCraft
- MUSIC EXPO LIVE 2026 in TAIPEI — KHAM
- 2026 KPOP PRIME — KHAM
- Shizuka Kudo 2026 “Dynamic” CONCERT in TAIPEI — KHAM
- 玉置成實 2026 Asia Tour Taipei — KKTIX
- Fear, and Loathing in Las Vegas Taipei 2026 — KKTIX
- MONO “Snowdrop” Asia Tour Taipei — KKTIX
- Age Factory 静脈/ERROR Release Tour Taipei — KKTIX
- JESSICA Concert Tour “Reflections” 2026 Taipei — KKTIX
- 吉卜力動畫音樂原唱歌手交響演唱會 — KHAM / Taipei Arena
- EUNHYUK — BEWARE OF RABBIT — KHAM
- N.Flying — CON5 in Kaohsiung — KHAM
- FEniX — BBM FAN CONCERT — KHAM
- 小宇 宋念宇 — 《不完美的人》 — KHAM
- 郭子 & 浮花樂隊 — Legacy Taipei
- 彭佳慧 — 《數日子》台北 / 高雄 — KHAM
- Roselyn — 20Hz in Taipei — tixCraft
- THE BOYZ — WE START in Taipei — tixCraft
- 徐暐翔 — LOVE VOLCANO — tixCraft
- JEONG EUNJI — Summer I in Taipei — KHAM

## Current official-source cross-check

Current official tixCraft listings still contain many future Taiwan performances through 2027, including Slowdive, DOMi & JD BECK, 82MAJOR, BOYNEXTDOOR, Stray Kids, Maroon 5 and Bruno Mars.

Current KHAM concert-category pages contain additional active/future concert projects such as JEONG EUNJI, EUNHYUK, N.Flying, FEniX, 小宇宋念宇, 彭佳慧, MUSIC EXPO, KPOP PRIME, Shizuka Kudo and BAND-MAID. These are why NEUL must keep live discovery and cannot use a fixed fallback count as the total number of concerts.

## Anti-omission design

1. Full/rotating official ticket indexes discover events.
2. KKTIX promoter subdomains are discovered automatically.
3. Venue calendars are compared against ticket discovery.
4. `coverage gap` is created when a venue official source knows an event but ticket discovery does not.
5. Gap events are inserted into the runtime list and marked `needsTicketBackfill`.
6. Later cycles fill ticket sale time, price, official map and source references.
7. Every newly discovered event receives an event-specific 3D draft automatically.
8. An official seat-map publication triggers resolver + OCR/Vision + stage/section/price QA.
9. The same event-specific layout upgrades rather than being replaced with a generic venue layout.

## Completeness statement

No public crawler can honestly promise zero omissions across all Taiwan concerts because announcements can be private, login-protected, newly published between scans, or absent from monitored sources. NEUL therefore reports source health / coverage gaps and continuously backfills rather than declaring a fixed list “complete”.
