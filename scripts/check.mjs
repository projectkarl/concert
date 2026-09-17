import fs from "node:fs";
import { extractLiveNationEventUrls, parseLiveNationDiscoveredEvent } from "../lib/live-nation-discovery.js";
import { extractOfficialSeatLayoutUrl } from "../lib/official-monitor.js";
import { parseKaohsiungArenaCalendar } from "../lib/kaohsiung-arena-discovery.js";
import { seedEvents } from "../data/events.js";
import { venueModels, venueLayouts, getVenueSection, venueSectionWarning, venueSectionPosition, venueIdFromName, ensureAutoEventLayout, getVenueLayout } from "../data/multi-venue-geometry.js";

const required = [
  "index.html","styles.css","app.js","i18n.js","enhancements.js","storage.js","pwa.js","sw.js","manifest.webmanifest","webgl-venue.js","THIRD_PARTY_NOTICES.md","vercel.json","api/events.js","api/official.js","api/refresh.js","api/push-config.js","api/push-subscribe.js","api/push-digest.js",
  "data/events.js","data/artists.js","data/venues.js","data/discovery.js","data/taipei-dome-geometry.js","data/multi-venue-geometry.js",
  "lib/official-monitor.js","lib/live-nation-discovery.js","lib/kaohsiung-arena-discovery.js",
  "assets/hero-crowd.webp","assets/feature-stage.webp","assets/venue-3d.webp","assets/seat-view.webp",
  "icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/apple-touch-icon.png"
];
let ok = true;
for (const f of required) if (!fs.existsSync(new URL(`../${f}`, import.meta.url))) { console.error("missing", f); ok = false; }
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
for (const id of ["eventList","eventResultMeta","dataFreshness","venueCanvas","seatPreviewCanvas","venueOverviewCanvas","venueSelect","layoutSelect","detailDrawer","sectionSelect","rowSelect","seatNumberInput","viewerHeightSelect","postureTabs","lensTabs","featuredArtistMark","featuredTitle","featuredMeta","featuredCount","featuredPrevBtn","featuredNextBtn","venueTitle"]) {
  if (!html.includes(`id="${id}"`)) { console.error("missing id", id); ok = false; }
}
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const webgl = fs.readFileSync(new URL("../webgl-venue.js", import.meta.url), "utf8");
const pwa = fs.readFileSync(new URL("../pwa.js", import.meta.url), "utf8");
const enhancements = fs.readFileSync(new URL("../enhancements.js", import.meta.url), "utf8");
const storage = fs.readFileSync(new URL("../storage.js", import.meta.url), "utf8");
const sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
const manifest = JSON.parse(fs.readFileSync(new URL("../manifest.webmanifest", import.meta.url), "utf8"));
if (/ticketmaster/i.test(app + html + webgl)) { console.error("unexpected Ticketmaster dependency in frontend"); ok = false; }
JSON.parse(fs.readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
if (!/createVenueWebGL/.test(app) || !/getContext\(\'webgl2\'/.test(webgl) || !/drawArraysInstanced/.test(webgl) || !/mat4Perspective/.test(webgl)) { console.error("native WebGL2 venue upgrade incomplete"); ok = false; }
if (/cdnjs|three\.js|jsdelivr|unpkg/i.test(webgl + html)) { console.error("unexpected external 3D runtime dependency"); ok = false; }
if (!/fallback/.test(webgl) || !/renderVenueScene/.test(app)) { console.error("Canvas fallback path missing"); ok = false; }
if (!/countdownMarkup/.test(app) || !/startCountdown/.test(app) || !/flip-countdown/.test(app) || !/countdownTarget/.test(app)) { console.error("concert flip countdown missing"); ok = false; }
if (!html.includes('rel="manifest"') || !html.includes('apple-touch-icon') || !html.includes('id="installAppBtn"')) { console.error("PWA HTML hooks missing"); ok = false; }
if (!/serviceWorker\.register/.test(pwa) || !/beforeinstallprompt/.test(pwa) || !/navigator\.standalone/.test(pwa)) { console.error("PWA install flow incomplete"); ok = false; }
if (!/APP_SHELL/.test(sw) || !/skipWaiting/.test(sw) || !/clients\.claim/.test(sw) || !/\/api\//.test(sw) || !/notificationclick/.test(sw) || !/addEventListener\("push"/.test(sw)) { console.error("service worker strategy incomplete"); ok = false; }
if (!/indexedDB/.test(storage) || !/recordEventChanges/.test(storage)) { console.error("IndexedDB persistence incomplete"); ok = false; }
for (const feature of ["openDayMode","openSeatCompare","addCalendar","enablePush","advancedSearchAssist","maybeDayModeBanner"]) { if (!enhancements.includes(feature)) { console.error("missing enhancement", feature); ok = false; } }
if (!/data-city=\"ARCHIVE\"/.test(enhancements) || !/seat-compare-tools/.test(enhancements)) { console.error("archive or seat compare UI missing"); ok = false; }
if (manifest.display !== "standalone" || manifest.scope !== "/" || !Array.isArray(manifest.icons) || manifest.icons.length < 3) { console.error("manifest incomplete"); ok = false; }


const fixture = `<html><body><a href="/en/event/test-kpop-taipei-tickets-edp123">test</a><h1>TEST K-POP WORLD TOUR IN TAIPEI</h1><div>South Korean K-pop artist</div><div>● TIME：2026/12/30 19:00</div><div>● VENUE：Taipei Arena</div><div>● PRICE：NT$ 5,800 / 3,800</div><div>➤ General Sale 2026/10/1 11AM</div><div>Line-Up</div><div>Headliner</div><div>TEST KPOP</div><div>Please note that tixcraft is the only officially authorized ticketing platform</div></body></html>`;
const urls = extractLiveNationEventUrls(fixture, "https://www.livenation.com.tw/en");
if (urls.length !== 1) { console.error("discovery URL parser failed", urls); ok = false; }
const parsed = parseLiveNationDiscoveredEvent(fixture, urls[0]);
if (!parsed || parsed.region !== "TW" || parsed.venue !== "Taipei Arena" || !parsed.start.startsWith("2026-12-30")) { console.error("discovery event parser failed", parsed); ok = false; }

const kaoFixture = `<div>藝文表演 TREASURE THE STAGE 2026 NEW WAV : LIVE IN KAOHSIUNG 2026/09/26~2026/09/26</div><div>藝文表演 2026 PLAVE World Tour [KEEP IT MANIC] in Kaohsiung 2026/10/03~2026/10/03</div><div>其他 KICA 2026/10/09~2026/10/12</div><div>地址：高雄市左營區博愛二路757號</div>`;
const kao = parseKaohsiungArenaCalendar(kaoFixture);
if (kao.length !== 2 || !kao.every(e => e.city === "Kaohsiung" && e.venueLayoutId === "kaohsiung-base")) { console.error("Kaohsiung official calendar parser failed", kao); ok = false; }

if (seedEvents.some(e => e.region !== "TW")) { console.error("non-TW seed event found"); ok = false; }
if (seedEvents.length < 10) { console.error("unexpectedly small Taiwan seed set", seedEvents.length); ok = false; }
const skz = seedEvents.find(e => e.id === "skz-run-it-taipei-2026");
const nct = seedEvents.find(e => e.id === "nct127-redline-taipei-2027");
const plave = seedEvents.find(e => e.id === "plave-keep-it-manic-taipei-2026");
const treasure = seedEvents.find(e => e.id === "treasure-new-wav-kaohsiung-2026");
const ive2026 = seedEvents.find(e => e.id === "ive-show-what-i-am-taipei-2026");
if (!skz || skz.venueModelId !== "taipei-dome" || skz.venueLayoutId !== "skz-run-it-2026") { console.error("Taipei Dome event mapping missing"); ok = false; }
if (!nct || nct.venueModelId !== "taipei-arena") { console.error("Taipei Arena mapping missing"); ok = false; }
if (!plave || plave.venueModelId !== "ntsu-arena" || plave.venueLayoutId !== "plave-keep-it-manic-2026") { console.error("NTSU event layout mapping missing"); ok = false; }
if (!treasure || treasure.venueModelId !== "kaohsiung-arena" || !treasure.start.includes("T18:00:00")) { console.error("Kaohsiung mapping/time missing"); ok = false; }
if (!ive2026 || ive2026.venueModelId !== "taipei-arena" || ive2026.venueLayoutId !== "ive-show-what-i-am-2026" || ive2026.historical !== true || !ive2026.start.startsWith("2026-09-11")) { console.error("IVE 2026 recent historical mapping missing"); ok = false; }
if (!nct.start.includes("T00:00:00") || nct.timeConfirmed !== false) { console.error("NCT 127 unconfirmed time should remain TBA"); ok = false; }

for (const id of ["taipei-dome","taipei-arena","ntsu-arena","kaohsiung-arena","taipei-music-center","ticc","kaohsiung-music-center","kaohsiung-stadium","taoyuan-arena","ntu-sports-center","tianmu-gymnasium"]) {
  const model = venueModels[id];
  if (!model || model.sections.length < 10 || !venueLayouts[model.baseLayoutId]) { console.error("venue model incomplete", id); ok = false; }
}
if (!getVenueSection("taipei-arena","黃2C") || !getVenueSection("ntsu-arena","綠3中") || !getVenueSection("kaohsiung-arena","213")) { console.error("multi venue sections missing"); ok = false; }
// v0.17 priority venue expansion checks
const newVenueSections = [
  ["taipei-music-center","2D"],["taipei-music-center","3D"],
  ["ticc","2F-B"],["ticc","5F-B"],["ticc","BOX-R1"],
  ["kaohsiung-music-center","2C3"],["kaohsiung-music-center","3C-1"],
  ["kaohsiung-stadium","北4"],["taoyuan-arena","B11"],
  ["ntu-sports-center","3B3"],["tianmu-gymnasium","M1"]
];
for (const [venue,section] of newVenueSections) { if (!getVenueSection(venue,section)) { console.error("priority venue section missing",venue,section); ok=false; } }
const ticc3 = getVenueSection("ticc","3F-B");
if (!ticc3 || ticc3.rowMin !== 17 || ticc3.rowMax !== 25) { console.error("TICC real row range missing",ticc3); ok=false; }
if (!/section\?\.rowMin/.test(app) || !/maxRow-minRow\+1/.test(app)) { console.error("rowMin-aware UI missing"); ok=false; }
const venueResolverFixtures = [
  ["北流 Taipei Music Center","taipei-music-center"],["TICC 台北國際會議中心","ticc"],
  ["高雄流行音樂中心 海音館","kaohsiung-music-center"],["高雄世運主場館","kaohsiung-stadium"],
  ["桃園巨蛋","taoyuan-arena"],["臺大綜合體育館","ntu-sports-center"],["天母體育館","tianmu-gymnasium"]
];
for (const [name,id] of venueResolverFixtures) { if (venueIdFromName(name)!==id) { console.error("priority venue resolver failed",name,venueIdFromName(name)); ok=false; } }
if (!/kaohsiung-music-center/.test(enhancements) || !/ntu-sports-center/.test(enhancements) || !/sec\?\.label/.test(app)) { console.error("expanded venue search or section display labels missing"); ok=false; }
const tmc3d = getVenueSection("taipei-music-center","3D");
if (!tmc3d || tmc3d.rowMax !== 18) { console.error("TMC 3F row-depth calibration missing",tmc3d); ok=false; }
const tmcWarn = venueSectionWarning("taipei-music-center","3D",17,"tmc-base");
if (!tmcWarn.messages.some(x=>x.includes("最後排"))) { console.error("TMC rear-row calibration warning missing",tmcWarn); ok=false; }
const ksWarn = venueSectionWarning("kaohsiung-stadium","平面A1",10,"ks-standard");
if (!ksWarn.messages.some(x=>x.includes("平地"))) { console.error("Kaohsiung Stadium floor warning missing",ksWarn); ok=false; }
const ticc5e = getVenueSection("ticc","5F-E");
if (!ticc5e) { console.error("TICC five-block floor geometry missing"); ok=false; }
const ticc2a = getVenueSection("ticc","2F-A");
if (!ticc2a || ticc2a.officialId !== "2MF-1" || !String(ticc2a.label).includes("2MF-1")) { console.error("TICC official zone label mapping missing",ticc2a); ok=false; }
const kmc2b4 = getVenueSection("kaohsiung-music-center","2B4");
const kmc2b5 = getVenueSection("kaohsiung-music-center","2B5");
const kmc2b3 = getVenueSection("kaohsiung-music-center","2B3");
if (!kmc2b3 || kmc2b3.rowMax < 20 || !kmc2b4 || kmc2b4.rowMin !== 18 || kmc2b4.rowMax < 19 || !kmc2b5 || kmc2b5.rowMin !== 24) { console.error("KMC calibrated sub-zone row ranges missing",kmc2b3,kmc2b4,kmc2b5); ok=false; }
if (venueModels['kaohsiung-music-center'].defaultSection !== '2C3') { console.error('KMC default section should resolve to an actual calibrated section'); ok=false; }
const kmcWarn = venueSectionWarning("kaohsiung-music-center","2A2",13,"kmc-base");
if (kmcWarn.level !== "caution" || !kmcWarn.messages.some(x=>x.includes("上方設備"))) { console.error("KMC 2A2 obstruction calibration missing",kmcWarn); ok=false; }
const ticcWarn = venueSectionWarning("ticc","4F-B",36,"ticc-base");
if (!ticcWarn.messages.some(x=>x.includes("控台"))) { console.error("TICC control-booth calibration warning missing",ticcWarn); ok=false; }
if (!getVenueSection("ntsu-arena","VIP B","plave-keep-it-manic-2026") || !getVenueSection("ntsu-arena","Y2A-2","plave-keep-it-manic-2026")) { console.error("PLAVE event ticket sections missing"); ok = false; }
if (!getVenueSection("taipei-arena","特5區","ive-show-what-i-am-2026") || !getVenueSection("taipei-arena","黃2C","ive-show-what-i-am-2026") || !getVenueSection("taipei-arena","東310","ive-show-what-i-am-2026")) { console.error("IVE 2026 event sections missing"); ok = false; }
const iveWarning = venueSectionWarning("taipei-arena","黃3E",8,"ive-show-what-i-am-2026");
if (iveWarning.level !== "notice" || !iveWarning.messages.some(x => x.includes("單席"))) { console.error("IVE 2026 reconstruction warning failed", iveWarning); ok = false; }
const plaveWarning = venueSectionWarning("ntsu-arena","Y2A-2",2,"plave-keep-it-manic-2026");
if (plaveWarning.level !== "caution" || !plaveWarning.messages.some(x => x.includes("視線"))) { console.error("PLAVE restricted-view warning failed", plaveWarning); ok = false; }
if (venueIdFromName("高雄巨蛋 Kaohsiung Arena") !== "kaohsiung-arena" || venueIdFromName("NTSU ARENA") !== "ntsu-arena") { console.error("venue name resolver failed"); ok = false; }
const warning = venueSectionWarning("taipei-dome","114",1,"skz-run-it-2026");
if (!warning.messages.length || warning.level !== "caution") { console.error("restricted-view warning logic failed", warning); ok = false; }


// v0.16 Taipei Dome calibration checks (retained in v0.17)
for (const id of ["131","146","201","225","233","244","319","334","509"]) { if (!getVenueSection("taipei-dome",id)) { console.error("Taipei Dome official-map section missing",id); ok=false; } }
const dome106=getVenueSection("taipei-dome","106");
if (!dome106 || dome106.rowMax < 38) { console.error("Taipei Dome B1 row range not expanded", dome106); ok=false; }
const row30=venueSectionPosition("taipei-dome",dome106,30), row38=venueSectionPosition("taipei-dome",dome106,38);
if (Math.hypot(row38.x-row30.x,row38.y-row30.y,row38.z-row30.z) < 2) { console.error("row 30/38 still collapse to same depth"); ok=false; }
const seat1=venueSectionPosition("taipei-dome",dome106,18,1), seat30=venueSectionPosition("taipei-dome",dome106,18,30);
if (Math.hypot(seat30.x-seat1.x,seat30.z-seat1.z) < 5) { console.error("seat number does not change lateral position"); ok=false; }
const overhang=venueSectionWarning("taipei-dome","108",35,"taipei-dome-base",{heightCm:160,posture:"seated"});
if (!overhang.messages.some(x=>x.includes("屋簷"))) { console.error("Taipei Dome overhang calibration warning missing",overhang); ok=false; }
if (!/phone5/.test(app) || !/viewerHeight/.test(app) || !/activeOccluders/.test(app) || !/viewFov/.test(webgl)) { console.error("v0.16 calibrated viewer controls incomplete"); ok=false; }
if (/直線距離/.test(enhancements) || /約 \${Math\.round\(m\.distance\)} m/.test(enhancements)) { console.error("unscaled model distance still mislabeled as meters"); ok=false; }


const septemberArchive = seedEvents.filter(e => e.historical === true && String(e.start || "").startsWith("2026-09") && new Date(e.start).getTime() < new Date("2026-09-17T00:00:00+08:00").getTime());
if (septemberArchive.length < 14) { console.error("September ended-event archive test set incomplete", septemberArchive.length); ok = false; }
if (!/function featuredEvents\(\)/.test(app) || !/function stepFeatured\(delta\)/.test(app) || !/featuredPrevBtn/.test(app) || !/featuredNextBtn/.test(app)) { console.error("Featured Concert carousel controls missing"); ok = false; }
if (!/\.wordmark\{font-size:29px\}/.test(fs.readFileSync(new URL("../styles.css", import.meta.url), "utf8"))) { console.error("v0.20 logo readability scale missing"); ok = false; }

// v0.21 transparency / submission / live-atmosphere checks
const indexHtml = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../styles.css", import.meta.url), "utf8");
if (!/searchScopeNote/.test(indexHtml) || !/2026\/09/.test(indexHtml) || !/updateSearchScope/.test(app)) { console.error("search scope hint missing"); ok=false; }
if (!/約每 6 小時/.test(app) || !/每日排程同步/.test(app)) { console.error("update cadence label missing"); ok=false; }
if (!/diamondEgg/.test(indexHtml) || !/fanProjectNote/.test(indexHtml) || !/wireDiamondEgg/.test(enhancements)) { console.error("About diamond easter egg missing"); ok=false; }
if (!/喜歡追星的人/.test(indexHtml)) { console.error("fan-made project disclosure missing"); ok=false; }
if (!/search-scope-note/.test(css)) { console.error("search scope UI style missing"); ok=false; }
if (!/Main LED wall/.test(webgl) || !/audience light points/.test(webgl) || !/Soft spotlight beams/.test(webgl)) { console.error("WebGL concert atmosphere pass missing"); ok=false; }

// v0.23 layout stability + IVE side-view calibration
const autoId=ensureAutoEventLayout({id:'test-auto-event',artist:'TEST STAR',title:'TEST CONCERT',type:'CONCERT',venue:'臺北小巨蛋 Taipei Arena',sourceUrl:'https://example.com/event'});
const autoLayout=getVenueLayout(autoId);
if (!autoLayout?.autoGenerated || autoLayout.venueId!=='taipei-arena' || !autoLayout.stage?.main) { console.error('automatic activity 3D generation failed',autoLayout); ok=false; }
const autoMapId=ensureAutoEventLayout({id:'test-auto-map',artist:'MAP STAR',title:'MAP CONCERT',type:'CONCERT',venue:'高雄巨蛋 Kaohsiung Arena',seatLayoutSourceUrl:'https://tixcraft.com/activity/detail/test',sourceUrl:'https://example.com/event'});
const autoMap=getVenueLayout(autoMapId);
if (!autoMap?.seatMapDetected || autoMap.generationConfidence!=='seat-map-linked-draft') { console.error('seat-map-linked auto 3D state failed',autoMap); ok=false; }
if (!/一般場館 3D/.test(app) || !/AUTO 3D/.test(app)) { console.error('activity/base 3D dual UI missing'); ok=false; }
const mockSeat=extractOfficialSeatLayoutUrl('<a href="https://static.tixcraft.com/images/activity/field/test.jpg">官方座位配置圖</a>','https://www.livenation.com.tw/en/event/test');
if (!mockSeat || !mockSeat.includes('static.tixcraft.com')) { console.error('official seat-layout URL discovery failed',mockSeat); ok=false; }
if (/投稿視角|viewSubmitForm|api\/submissions/.test(enhancements)) { console.error('fan submission UI should be removed'); ok=false; }


// v0.27 multilingual UI checks
const i18n = fs.readFileSync(new URL("../i18n.js", import.meta.url), "utf8");
if (!/zh-Hant/.test(i18n) || !/locale: 'en-US'/.test(i18n) || !/locale: 'ja-JP'/.test(i18n) || !/locale: 'ko-KR'/.test(i18n)) { console.error("four-language i18n config missing"); ok=false; }
if (!/data-lang="zh-Hant"/.test(indexHtml) || !/data-lang="en"/.test(indexHtml) || !/data-lang="ja"/.test(indexHtml) || !/data-lang="ko"/.test(indexHtml)) { console.error("language selector buttons missing"); ok=false; }
if (!/neul-language/.test(i18n) || !/neul:languagechange/.test(i18n) || !/MutationObserver/.test(i18n)) { console.error("dynamic language switching incomplete"); ok=false; }
if (!/Noto\+Sans\+JP/.test(indexHtml)) { console.error("Japanese font support missing"); ok=false; }
if (!/\/i18n\.js/.test(sw) || !/neul-v0\.30\.0/.test(sw)) { console.error("PWA multilingual cache update missing"); ok=false; }
if (!/uiLocale/.test(app) || !/neul:languagechange/.test(app)) { console.error("locale-aware dynamic render hook missing"); ok=false; }


// v0.28 settings reliability + Upcoming modal checks
for (const id of ["allEventsModal","eventsMonthFilter","eventsStartFilter","eventsEndFilter","eventsModalList","eventsFilterReset"]) {
  if (!indexHtml.includes(`id="${id}"`)) { console.error("upcoming modal hook missing", id); ok=false; }
}
if (!/openAllEventsModal/.test(app) || !/modalFilteredEvents/.test(app) || !/eventsMonthFilter/.test(app) || !/data-events-window/.test(indexHtml)) { console.error("Upcoming modal/time filter incomplete"); ok=false; }
if (!/document\.addEventListener\("click"/.test(pwa) || !/closest\("#settingsBtn"\)/.test(pwa) || !/aria-expanded/.test(indexHtml)) { console.error("settings gear delegated click fix missing"); ok=false; }
if (!/events-modal-card/.test(css) || !/body\.events-modal-open/.test(css)) { console.error("Upcoming modal styles missing"); ok=false; }

// v0.30 venue calibration + realism audit
const kh219=getVenueSection("kaohsiung-arena","219");
if (!kh219 || kh219.rowMax < 41) { console.error("Kaohsiung Arena 219 rear-row calibration missing",kh219); ok=false; }
const ntsuUpperProbe=getVenueSection("ntsu-arena","黃2上");
if (!ntsuUpperProbe || ntsuUpperProbe.rowMax < 16) { console.error("NTSU upper row-depth extension missing",ntsuUpperProbe); ok=false; }
let collapsedRows=[];
for (const [venueId,model] of Object.entries(venueModels)) {
  for (const sec of model.sections) {
    const min=Number(sec.rowMin ?? 1), max=Number(sec.rowMax ?? min);
    if (!(max>min)) continue;
    const a=venueSectionPosition(venueId,sec,min,10), b=venueSectionPosition(venueId,sec,max,10);
    const delta=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z);
    if (delta < .75) collapsedRows.push(`${venueId}:${sec.id}:${delta.toFixed(2)}`);
  }
}
if (collapsedRows.length) { console.error("row-depth calibration collapsed",collapsedRows.slice(0,20)); ok=false; }
if (!/rearView/.test(webgl) || !/Cross-truss grid/.test(webgl) || !/Sparse audience silhouettes/.test(webgl) || !/Runway edge/.test(webgl)) { console.error("v0.30 live-atmosphere / rear-screen pass incomplete"); ok=false; }
if (!/behindStage/.test(app) || !/performance surface/.test(app)) { console.error("stage-facing target sanity correction missing"); ok=false; }
const rearWarn=venueSectionWarning("taipei-arena","紅2A",10,"taipei-arena-far");
if (!Array.isArray(rearWarn.messages)) { console.error("generic rear-stage warning path failed",rearWarn); ok=false; }

if (!ok) process.exit(1);
console.log(`NEUL v0.30 checks passed · Taiwan-only · ${seedEvents.length} seed events · ${Object.keys(venueModels).length} venue models · WebGL + Canvas fallback · PWA + IndexedDB · day mode · archive · calendar/reminders · seat compare · Web Push foundation · Taipei Dome Calibration 2.0 · TICC / TMC / KMC precision pass`);
