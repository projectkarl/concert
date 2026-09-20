import fs from "node:fs";
import { extractLiveNationEventUrls, extractLiveNationArtistUrls, parseLiveNationDiscoveredEvent } from "../lib/live-nation-discovery.js";
import { extractOfficialSeatLayoutUrl, extractSectionPriceRules } from "../lib/official-monitor.js";
import { parseKaohsiungArenaCalendar } from "../lib/kaohsiung-arena-discovery.js";
import { extractTaipeiArenaLinks, parseTaipeiArenaDates } from "../lib/taipei-arena-discovery.js";
import { parseBabymonsterChoomTaipei, parseBigBangCosmosTaiwan } from "../lib/artist-official-discovery.js";
import { parsePage as parseTicketPlatformPage } from "../lib/taiwan-ticket-platform-discovery.js";
import { mergeAndDedupe } from "../api/events.js";
import { inferStageProfileForQA, selectStageComponentForQA, priceForLabelForQA } from "../seat-map-intelligence.js";
import { seedEvents } from "../data/events.js";
import { venueModels, venueLayouts, getVenueSection, venueSectionWarning, venueSectionPosition, venueIdFromName, ensureAutoEventLayout, getVenueLayout, sectionTicketLabel, effectiveTiers } from "../data/multi-venue-geometry.js";

const required = [
  "index.html","styles.css","app.js","i18n.js","enhancements.js","storage.js","pwa.js","sw.js","manifest.webmanifest","webgl-venue.js","seat-map-intelligence.js","THIRD_PARTY_NOTICES.md","vercel.json","api/events.js","api/official.js","api/seat-map-image.js","api/refresh.js","api/push-config.js","api/push-subscribe.js","api/push-digest.js",
  "data/events.js","data/artists.js","data/venues.js","data/discovery.js","data/taipei-dome-geometry.js","data/multi-venue-geometry.js",
  "lib/official-monitor.js","lib/live-nation-discovery.js","lib/kaohsiung-arena-discovery.js","lib/taipei-arena-discovery.js","lib/artist-official-discovery.js","lib/taiwan-ticket-platform-discovery.js",
  "assets/hero-crowd.webp","assets/hero-crowd-hd.webp","assets/hero-crowd-hd2.webp","assets/hero-crowd-crisp.webp","assets/hero-live-crisp.webp","assets/feature-stage.webp","assets/venue-3d.webp","assets/seat-view.webp","assets/featured-1.webp","assets/featured-2.webp","assets/featured-3.webp","assets/featured-4.webp","assets/featured-1-hd.webp","assets/featured-2-hd.webp","assets/featured-3-hd.webp","assets/featured-4-hd.webp","assets/featured-1-crisp.webp","assets/featured-2-crisp.webp","assets/featured-3-crisp.webp","assets/featured-4-crisp.webp","assets/featured-live-1.webp","assets/featured-live-2.webp","assets/featured-live-3.webp","assets/featured-live-4.webp",
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

const intlFixture = `<html><body><h1>5 SECONDS OF SUMMER: EVERYONE’S A STAR! WORLD TOUR</h1><div>Australian pop rock band</div><div>● TIME: 2026/11/25</div><div>● VENUE: Taipei Music Center</div><div>● PRICE: NTD $3,380</div><div>Line-Up</div><div>Headliner</div><div>5 Seconds of Summer</div></body></html>`;
const intlParsed = parseLiveNationDiscoveredEvent(intlFixture, "https://www.livenation.com.tw/en/event/5-seconds-of-summer-test");
if (!intlParsed || intlParsed.market !== "AU" || intlParsed.region !== "TW") { console.error("international Live Nation parser still filtering non-Korean event", intlParsed); ok=false; }

const arenaFixture = `<a href="/News_Content.aspx?n=2E1489AFE4B1BEA1&s=AAA&sms=F9A95D3F5A5C2C68">2026/10/09、10/10 Yuuri ASIA TOUR 2026 in Taipei</a><a href="/News_Content.aspx?n=2E1489AFE4B1BEA1&s=BBB&sms=F9A95D3F5A5C2C68">2026/10/31、11/01 Vaundy ASIA ARENA TOUR 2026 “HORO” in TAIPEI</a>`;
const arenaLinks = extractTaipeiArenaLinks(arenaFixture);
const arenaDates = parseTaipeiArenaDates(arenaLinks[0]?.title || "");
if (arenaLinks.length !== 2 || arenaDates?.start !== "2026-10-09T00:00:00+08:00" || arenaDates?.end !== "2026-10-10T00:00:00+08:00") { console.error("Taipei Arena official index parser failed", arenaLinks, arenaDates); ok=false; }

const ygFixture = `<main>TAIPEI TAIPEI ARENA 2026.11.21. (SAT) 2026.11.22. (SUN) COMING SOON SINGAPORE</main>`;
const bmOfficial = parseBabymonsterChoomTaipei(ygFixture);
if (!bmOfficial || bmOfficial.start !== "2026-11-21T00:00:00+08:00" || bmOfficial.end !== "2026-11-22T00:00:00+08:00" || bmOfficial.sourceName !== "YG Entertainment Official") { console.error("BABYMONSTER YG official parser failed", bmOfficial); ok=false; }

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
if (indexHtml.includes('id="searchScopeNote"')) { console.error("deprecated search scope hint still visible"); ok=false; }
if (!/約每 6 小時/.test(app) || !/每日排程同步/.test(app)) { console.error("update cadence label missing"); ok=false; }
if (!/diamondEgg/.test(indexHtml) || !/fanProjectNote/.test(indexHtml) || !/wireDiamondEgg/.test(enhancements)) { console.error("About diamond easter egg missing"); ok=false; }
if (!/喜歡追星的人/.test(indexHtml)) { console.error("fan-made project disclosure missing"); ok=false; }
if (/\.search-scope-note/.test(css)) { console.error("deprecated search scope UI style still present"); ok=false; }
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
if (!/\/i18n\.js/.test(sw) || !/neul-v0\.40\.4-bts-stage-bm-price-autogen-guard/.test(sw)) { console.error("PWA multilingual cache update missing"); ok=false; }
if (!/uiLocale/.test(app) || !/neul:languagechange/.test(app)) { console.error("locale-aware dynamic render hook missing"); ok=false; }


// v0.28 settings reliability + Upcoming modal checks
for (const id of ["allEventsModal","eventsAreaSearch","eventsCityFilter","eventsMonthFilter","eventsStartFilter","eventsEndFilter","eventsModalList","eventsFilterReset"]) {
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

// v0.31 multi-market Taiwan-event + true-3D detail checks
const bm = seedEvents.find(e => e.id === "babymonster-choom-taipei-2026");
const fiveSos = seedEvents.find(e => e.id === "5sos-everyones-a-star-taipei-2026");
const yuuri = seedEvents.find(e => e.id === "yuuri-asia-tour-taipei-2026");
if (!bm || !/ygfamily/i.test(bm.sourceUrl || "") || !bm.start.startsWith("2026-11-21") || !bm.end?.startsWith("2026-11-22")) { console.error("BABYMONSTER Taipei official seed missing", bm); ok=false; }
if (!fiveSos || fiveSos.market !== "AU" || !yuuri || yuuri.market !== "JP") { console.error("western/Japanese event coverage missing", {fiveSos,yuuri}); ok=false; }
for (const red of ["紅2A","紅2B","紅2C","紅2D","紅2E"]) {
  const sec=getVenueSection("taipei-arena",red);
  if (!sec || sec.rowMin !== 1 || sec.rowMax !== 15 || Number(sec.seatEstimateMax||0) < 28) { console.error("Taipei Arena Red 2 calibration mismatch", red, sec); ok=false; }
}
if (!/sectionArchitecture/.test(webgl) || !/Cross aisle/.test(webgl) || !/handrail/i.test(webgl) || !/LED panel seams/.test(webgl) || !/drawArraysInstanced/.test(webgl)) { console.error("true WebGL row/aisle/rail/LED detail pass incomplete"); ok=false; }
if (!/discoverArtistOfficialTours/.test(fs.readFileSync(new URL("../api/events.js", import.meta.url), "utf8"))) { console.error("artist official tour source not wired into API"); ok=false; }


// v0.32 Taiwan-only scope + original-layout IVE demo regression
if (!indexHtml.includes('id="iveTaipeiDemo"') || !indexHtml.includes('id="iveDemoBtn"')) { console.error("IVE compact demo entry missing"); ok=false; }
if (!/model\.id !== "taipei-arena"/.test(app) || !/ive-show-what-i-am-2026/.test(app) || !/紅2D/.test(app)) { console.error("IVE Taipei Arena demo wiring missing"); ok=false; }
if (!/taiwanVenueModels/.test(app) || !/taiwanEventsOnly/.test(app)) { console.error("frontend Taiwan-only guard missing"); ok=false; }
const apiEventsCode = fs.readFileSync(new URL("../api/events.js", import.meta.url), "utf8");
if (!/function isTaiwanEvent/.test(apiEventsCode) || !/TAIWAN_CITIES/.test(apiEventsCode) || !/isTaiwanEvent\(candidate\)/.test(apiEventsCode)) { console.error("API Taiwan-only guard missing"); ok=false; }
const overseasVenueTokens=/Singapore|Tokyo|Seoul|Bangkok|Hong Kong|Macau|Osaka|Yokohama|Singapore Indoor Stadium|東京|首爾|新加坡/;
for (const [id,v] of Object.entries(venueModels)) { if (overseasVenueTokens.test(`${v.name||''} ${v.en||''} ${v.city||''}`)) { console.error("overseas venue leaked into selector model",id,v); ok=false; } }
if (seedEvents.some(e=>e.region!=="TW")) { console.error("overseas seed event leaked into Taiwan feed"); ok=false; }
const iveLayout = getVenueLayout('ive-show-what-i-am-2026');
if (!iveLayout || iveLayout.venueId!=='taipei-arena' || iveLayout.autoGenerated) { console.error("IVE hand-calibrated WebGL layout missing",iveLayout); ok=false; }

// v0.33 complete Taipei Arena + HD/Featured + scalable Upcoming + ticket-platform discovery
const taipeiModel=venueModels["taipei-arena"];
const arena3f=taipeiModel.sections.filter(s=>String(s.id).match(/^[紅黃紫藍]3/));
if (arena3f.length < 40) { console.error("Taipei Arena complete 3F structural bowl missing",arena3f.length); ok=false; }
if (!/eventActive:false/.test(fs.readFileSync(new URL("../data/multi-venue-geometry.js", import.meta.url), "utf8"))) { console.error("event/base venue merge guard missing"); ok=false; }
if (!/hero-live-crisp\.webp/.test(css) || !/FEATURED_IMAGES/.test(app) || !/featuredImageFor/.test(app)) { console.error("HD hero or distinct Featured images missing"); ok=false; }
if (!/eventsAreaSearch/.test(app) || !/eventsCityFilter/.test(app) || !/refreshEventsCityFilter/.test(app)) { console.error("scalable Upcoming region search missing"); ok=false; }
if (!/discoverTaiwanTicketPlatforms/.test(apiEventsCode)) { console.error("Taiwan ticket-platform discovery not wired"); ok=false; }
const lsf=seedEvents.find(e=>e.id==="le-sserafim-pureflow-taipei-2026");
const kjw=seedEvents.find(e=>e.id==="kim-ji-won-wonederland-taipei-2026");
if (!lsf || !kjw) { console.error("known tixCraft gap regression",{lsf,kjw}); ok=false; }

// v0.34 Stray Kids price-in-3D + AAA + cross-source dedupe
const skz34=seedEvents.find(e=>e.id==="skz-run-it-taipei-2026");
const aaa=seedEvents.find(e=>e.id==="aaa-2026-kaohsiung");
if (!skz34 || sectionTicketLabel("skz-run-it-2026","106") !== "NT$6,880" || sectionTicketLabel("skz-run-it-2026","111")) { console.error("Stray Kids fixed-stand 3D ticket price mapping missing/over-guessed",skz34,sectionTicketLabel("skz-run-it-2026","106"),sectionTicketLabel("skz-run-it-2026","111")); ok=false; }
if (!indexHtml.includes('id="selectedPrice"') || !indexHtml.includes('id="viewerPriceChip"') || !/optionLabel=ticket/.test(app) || /本場票價 \$\{layout\.priceSummary\}/.test(app)) { console.error("3D exact-section price chip logic missing or broad fallback regressed"); ok=false; }
if (!aaa || !aaa.start.startsWith("2026-12-05") || aaa.city!=="Kaohsiung" || aaa.type!=="AWARDS" || !indexHtml.includes('data-type="AWARDS"')) { console.error("AAA official seed/filter missing",aaa); ok=false; }
const aaaLayoutId=ensureAutoEventLayout(aaa);
const aaaLayout=getVenueLayout(aaaLayoutId);
if (!aaaLayout || aaaLayout.venueId!=="kaohsiung-stadium" || !aaaLayout.stage?.centerStage || !aaaLayout.seatMapDetected) { console.error("AAA central-stage auto 3D missing",aaaLayout); ok=false; }
const aaaFixture=`<html><head><title>2026 Asia Artist Awards in Kaohsiung</title></head><body>演出日期：2026年12月5日 17:00 演出地點：高雄國家體育場（世運主場館） 票價：NT$6,980 / 5,980 / 4,980 / 3,980 / 2,980 / 1,980 一般售票：2026年9月19日 13:00 <a href="https://static.tixcraft.com/images/activity/field/aaa.jpg">座位圖</a></body></html>`;
const parsedAaa=parseTicketPlatformPage(aaaFixture,"https://tixcraft.com/activity/detail/26_aaa",{name:"tixCraft 拓元"});
if (!parsedAaa || parsedAaa.type!=="AWARDS" || parsedAaa.city!=="Kaohsiung" || !parsedAaa.start.startsWith("2026-12-05")) { console.error("AAA ticket-platform parser failed",parsedAaa); ok=false; }
const dedupeProbe=mergeAndDedupe([
  {id:"seed",artist:"Stray Kids",title:"World Tour RUN IT TAIPEI",region:"TW",start:"2026-12-12T18:00:00+08:00",venue:"臺北大巨蛋 Taipei Dome",city:"Taipei",price:"VIP NT$7,880 / 一般 NT$6,880 / 5,880",sourceName:"Live Nation Taiwan",sourceUrl:"https://www.livenation.com.tw/a",verified:true,venueModelId:"taipei-dome",venueLayoutId:"skz-run-it-2026"}
],[
  {id:"auto",artist:"STRAY KIDS",title:"Stray Kids World Tour RUN IT",region:"TW",start:"2026-12-12T18:00:00+08:00",venue:"Taipei Dome",city:"Taipei",price:"依官方售票頁公告",sourceName:"tixCraft 拓元",sourceUrl:"https://tixcraft.com/activity/detail/26_straykids",verified:true,seatLayoutSourceUrl:"https://static.tixcraft.com/test.jpg"}
]);
if (dedupeProbe.length!==1 || !dedupeProbe[0].price?.includes("7,880") || dedupeProbe[0].venueLayoutId!=="skz-run-it-2026" || !dedupeProbe[0].seatLayoutSourceUrl || (dedupeProbe[0].sourceRefs||[]).length<2) { console.error("cross-source dedupe/quality merge failed",dedupeProbe); ok=false; }
if (!/likelySameEvent/.test(apiEventsCode) || !/canonicalVenue/.test(apiEventsCode) || !/sourceRefs/.test(apiEventsCode)) { console.error("dedupe review engine missing"); ok=false; }
const seedOnlyDedupe=mergeAndDedupe(seedEvents,[]);
if (seedOnlyDedupe.length!==seedEvents.length || !seedOnlyDedupe.some(e=>e.id==="yuuri-asia-tour-taipei-2026")) { console.error("distinct official pages falsely deduped",{raw:seedEvents.length,deduped:seedOnlyDedupe.length}); ok=false; }

// v0.35 official seat-map/price sync + responsive overflow + HD media
const priceFixture=`<html><body>演出日期：2026年12月12日 18:00 演出地點：臺北大巨蛋 票價：VIP NT$7,880 / 紅2A NT$6,880 / 紫2A NT$5,880 <a href="https://static.tixcraft.com/images/activity/field/test-seat-map.jpg">官方座位圖</a></body></html>`;
const parsedPriceFixture=parseTicketPlatformPage(priceFixture,"https://tixcraft.com/activity/detail/26_price_fixture",{name:"tixCraft 拓元"});
if (!parsedPriceFixture?.seatLayoutSourceUrl || !parsedPriceFixture.sectionPriceRules?.length || !parsedPriceFixture.sectionPriceRules.some(x=>String(x.price).includes("6,880"))) { console.error("ticket platform seat-map/section-price sync parser failed",parsedPriceFixture); ok=false; }
const syncProbe={...skz34,sectionPriceRules:[{label:"106",price:"NT$6,880"}],seatLayoutSourceUrl:"https://static.tixcraft.com/images/activity/field/skz-new.jpg",checkedAt:"2026-09-17T06:00:00.000Z"};
const syncLayoutId=ensureAutoEventLayout(syncProbe); const syncLayout=getVenueLayout(syncLayoutId);
if (!syncLayout?.ticketSyncSignature || syncLayout.latestSeatLayoutSourceUrl!==syncProbe.seatLayoutSourceUrl || sectionTicketLabel(syncLayoutId,"106")!=="NT$6,880") { console.error("calibrated 3D official metadata sync failed",syncLayout); ok=false; }
if (!/event-tag\{display:block;max-width:88px;overflow:hidden;text-overflow:ellipsis/.test(css) || !/html,body\{max-width:100%;overflow-x:hidden/.test(css)) { console.error("responsive overflow guard missing"); ok=false; }
if (!/hero-live-crisp\.webp/.test(css) || !/featured-live-1\.webp/.test(app)) { console.error("retina hero/featured assets not wired"); ok=false; }


// v0.36 source coverage + crisp media + complete Taipei Arena B1 layer
const artistHopFixture=`<html><body><a href="/artist/bruno-mars">Bruno Mars</a><a href="https://www.livenation.com.tw/artist/bts">BTS</a></body></html>`;
const artistHopUrls=extractLiveNationArtistUrls(artistHopFixture,"https://www.livenation.com.tw");
if (artistHopUrls.length < 2 || !artistHopUrls.some(x=>/bruno-mars/i.test(x))) { console.error("Live Nation artist-page hop parser missing",artistHopUrls); ok=false; }
const bigbangFixture=`<main>TAIPEI TAIPEI DOME 2026.10.09 FRI 2026.10.10 SAT 2026.10.11 SUN KAOHSIUNG KAOHSIUNG NATIONAL STADIUM 2027.02.27 SAT 2027.02.28 SUN</main>`;
const bigbangOfficial=parseBigBangCosmosTaiwan(bigbangFixture);
if (!Array.isArray(bigbangOfficial) || bigbangOfficial.length<2 || !bigbangOfficial.some(x=>x.city==="Taipei") || !bigbangOfficial.some(x=>x.city==="Kaohsiung")) { console.error("BIGBANG YG Taiwan parser failed",bigbangOfficial); ok=false; }
for (const id of ["bruno-mars-romantic-kaohsiung-2027","bts-arirang-kaohsiung-2026","bigbang-cosmos-taipei-2026","bigbang-cosmos-kaohsiung-2027"]) {
  if (!seedEvents.some(e=>e.id===id)) { console.error("v0.36 verified fallback missing",id); ok=false; }
}
if (seedEvents.length < 66 || seedEvents.some(e=>!e)) { console.error("v0.40.2 seed/source coverage regression",{count:seedEvents.length,hasHole:seedEvents.some(e=>!e)}); ok=false; }
for (const id of ["izna-who-dat-girl-taipei-2026","qwer-rockation-taipei-2026","boynextdoor-knock-on-vol2-taipei-2027","do-as-infinity-27th-taipei-2026"]) if (!seedEvents.some(e=>e?.id===id)) { console.error("current Taiwan fallback missing",id); ok=false; }
const ticketDiscoveryCode=fs.readFileSync(new URL("../lib/taiwan-ticket-platform-discovery.js", import.meta.url),"utf8");
for (const source of ["tixCraft","KKTIX","Ticket Plus","FamiTicket","udn","ibon","iNDIEVOX","FANSI GO"]) if (!ticketDiscoveryCode.includes(source)) { console.error("ticket discovery source missing",source); ok=false; }
if (!/寬宏|KHAM/.test(ticketDiscoveryCode)) { console.error("KHAM ticket discovery source missing"); ok=false; }
const arenaB1=taipeiModel.sections.filter(s=>s.tier==="B1");
if (arenaB1.length!==5 || !arenaB1.every(s=>s.structuralOnly===true && s.eventFlexible===true) || !taipeiModel.sections.some(s=>s.tier==="2F") || !taipeiModel.sections.some(s=>s.tier==="3F")) { console.error("Taipei Arena B1/2F/3F structural completeness missing",arenaB1); ok=false; }
if (!/hero-live-crisp\.webp/.test(css) || !/filter:none/.test(css) || /neul-feature-photo-swap\{[^}]*transform/.test(css)) { console.error("Hero/Featured crisp no-blur/no-zoom regression"); ok=false; }
if (!/#b8c0c7/.test(webgl) || !/quality==='high'\?2\.05/.test(webgl) || !/arena floor grid/.test(webgl) || !/Simulated live-feed content/.test(webgl)) { console.error("v0.40.2 stage/light-floor/LED clarity regression"); ok=false; }


// v0.37 auto-source completeness + base-venue invariant + UI audit (retained)
for (const source of ["MNA","年代售票","ticket.mna.com.tw","ticket.com.tw"]) {
  if (!ticketDiscoveryCode.includes(source)) { console.error("v0.40 ticket discovery source/pattern missing",source); ok=false; }
}
if (!/ActivityInfo\\\/Details/.test(ticketDiscoveryCode)) { console.error("v0.40 ibon detail URL pattern missing"); ok=false; }
for (const id of [
  "aov-10th-anniversary-taipei-dome-2026","silica-gel-asia-tour-taipei-2026","charlie-puth-clever-taipei-2026","post-malone-big-ass-kaohsiung-2026","bts-arirang-kaohsiung-2026","mamamoo-4ward-taipei-2026","yoasobi-super-planet-taipei-2027","bigbang-cosmos-taipei-2026","bigbang-cosmos-kaohsiung-2027"
]) if (!seedEvents.some(e=>e.id===id)) { console.error("user-requested verified Taiwan event missing",id); ok=false; }
const bm37=seedEvents.find(e=>e.id==="babymonster-choom-taipei-2026");
if (!bm37 || bm37.ticketing!=="Ticket Plus 遠大售票" || !String(bm37.price).includes("6,780") || !bm37.generalSale?.startsWith("2026-10-14T12:00")) { console.error("BABYMONSTER current price/sale fallback missing",bm37); ok=false; }
const bmLayoutId=ensureAutoEventLayout(bm37);
if (sectionTicketLabel(bmLayoutId,"紅2B")!=="NT$6,780" || sectionTicketLabel(bmLayoutId,"紅2D")!=="NT$5,800" || sectionTicketLabel(bmLayoutId,"黃2C")!=="NT$4,800" || !String(sectionTicketLabel(bmLayoutId,"黃3E")||"").includes("4,200") || sectionTicketLabel(bmLayoutId,"藍2A")) { console.error("BABYMONSTER official-zone pricing / unknown-zone guard failed",sectionTicketLabel(bmLayoutId,"紅2B"),sectionTicketLabel(bmLayoutId,"紅2D"),sectionTicketLabel(bmLayoutId,"黃2C"),sectionTicketLabel(bmLayoutId,"黃3E")); ok=false; }
const ntsu=venueModels["ntsu-arena"];
const ntsuTiers=[...new Set(ntsu.sections.map(s=>s.tier))];
if (!["FLOOR","LOWER","MIDDLE","UPPER"].every(x=>ntsuTiers.includes(x))) { console.error("NTSU complete base-tier structure missing",ntsuTiers); ok=false; }
const plaveTiers=effectiveTiers("ntsu-arena","plave-keep-it-manic-2026").map(t=>t.id);
if (!["FLOOR","LOWER","MIDDLE","UPPER","VIP","BOWL","REAR"].every(x=>plaveTiers.includes(x))) { console.error("event layout is hiding base NTSU tiers",plaveTiers); ok=false; }
const khTiers=[...new Set(venueModels["kaohsiung-arena"].sections.map(s=>s.tier))];
if (!khTiers.includes("FLOOR")) { console.error("Kaohsiung Arena 1F structural/activity layer missing",khTiers); ok=false; }
if (/const\s+fallbackPrice/.test(app) || /本場票價\s*\$\{layout\.priceSummary\}/.test(app)) { console.error("broad all-prices-on-every-section fallback regressed"); ok=false; }
if (!/eventLifecycle/.test(app) || !/eventEffectiveEndTs/.test(app) || !/layout\.eventId/.test(app) || !/演出進行中/.test(app)) { console.error("event lifecycle / active-show guard missing"); ok=false; }
if (indexHtml.includes('id="searchScopeNote"') || /查看更多活動（\$\{list\.length - 5\}）/.test(app)) { console.error("deprecated search helper / volatile more-count regressed"); ok=false; }
if (!/artist-name/.test(app) || !/\.artist-bubble \.artist-name/.test(css) || !/overflow-wrap:anywhere/.test(css)) { console.error("My List / long-name overflow audit missing"); ok=false; }
if (!/title\.title = model\.name/.test(app) || !/\.venue-intro h2/.test(css)) { console.error("VENUE long-name full-title support missing"); ok=false; }


// v0.40 official-map automation + BTS/T-ARA + prior calibrations
const lsf38=seedEvents.find(e=>e.id==="le-sserafim-pureflow-taipei-2026");
const lsfLayout=getVenueLayout("le-sserafim-pureflow-2026");
if (!lsf38 || lsf38.venueLayoutId!=="le-sserafim-pureflow-2026" || !/activity\/field\/26_lsf_/i.test(lsf38.seatLayoutSourceUrl||"")) { console.error("LE SSERAFIM official seat-map wiring missing",lsf38); ok=false; }
for (const vipId of ["VIP A","VIP B","VIP C"]) {
  const sec=getVenueSection("ntsu-arena",vipId,"le-sserafim-pureflow-2026");
  if (!sec?.standingOnly || sectionTicketLabel("le-sserafim-pureflow-2026",vipId)!=="VIP NT$6,980 · 站席") { console.error("LE SSERAFIM VIP standing/price mapping missing",vipId,sec,sectionTicketLabel("le-sserafim-pureflow-2026",vipId)); ok=false; }
}
const lsfEffectiveTiers=effectiveTiers("ntsu-arena","le-sserafim-pureflow-2026").map(t=>t.id);
if (lsfEffectiveTiers.join(",")!=="VIP,2F,3F" || !lsfLayout?.stage?.runway || lsfLayout.stage?.bStage?.shape!=="octagon" || !lsfLayout.foh) { console.error("LE SSERAFIM official layout geometry mismatch",lsfEffectiveTiers,lsfLayout); ok=false; }
if (sectionTicketLabel("le-sserafim-pureflow-2026","黃1B-1")!=="NT$6,380" || sectionTicketLabel("le-sserafim-pureflow-2026","藍5B-1")!=="NT$5,880" || !String(sectionTicketLabel("le-sserafim-pureflow-2026","黃2A-2")).includes("3,680–4,680")) { console.error("LE SSERAFIM bowl price mapping missing",sectionTicketLabel("le-sserafim-pureflow-2026","黃1B-1"),sectionTicketLabel("le-sserafim-pureflow-2026","藍5B-1"),sectionTicketLabel("le-sserafim-pureflow-2026","黃2A-2")); ok=false; }
if (!/pointInProduction/.test(webgl) || !/section\.structuralOnly \|\| section\.standingOnly/.test(webgl) || !/shape==='octagon'/.test(webgl)) { console.error("systemic no-seats-on-stage / standing-zone renderer guard missing"); ok=false; }
const tixSeatPriority=extractOfficialSeatLayoutUrl('<img src="https://static.tixcraft.com/images/activity/upload/poster.jpg"><img src="https://static.tixcraft.com/images/activity/field/26_lsf_map.jpg">','https://tixcraft.com/activity/detail/26_lsf');
if (!/activity\/field\//.test(tixSeatPriority||'')) { console.error("tixCraft official field-map priority regression",tixSeatPriority); ok=false; }

const sj83=seedEvents.find(e=>e.id==="super-junior-83z-1983-kaohsiung-2026");
if(!sj83 || !sj83.seatLayoutSourceUrl?.includes("assets.kktix.io") || sectionTicketLabel("sj83z-1983-kaohsiung-2026","VIP A2")!=="NT$6,480"){ console.error("SUPER JUNIOR-83z auto/3D regression",sj83); ok=false; }
if(!/setInterval\(.*10000/s.test(app) || !/nextUpdateAt/.test(apiEventsCode) || !/freshness-next/.test(css)){ console.error("v0.40 autoplay/update schedule regression"); ok=false; }
if(!/chuanyeah\.kktix\.cc\/events/.test(ticketDiscoveryCode)){ console.error("KKTIX promoter-index discovery regression"); ok=false; }

const seatVisionCode = fs.readFileSync(new URL("../seat-map-intelligence.js", import.meta.url), "utf8");
const seatProxyCode = fs.readFileSync(new URL("../api/seat-map-image.js", import.meta.url), "utf8");
const officialMonitorCode = fs.readFileSync(new URL("../lib/official-monitor.js", import.meta.url), "utf8");
if (!/createImageBitmap/.test(seatVisionCode) || !/\/api\/seat-map-image/.test(seatVisionCode) || !/map-pixel-derived/.test(seatVisionCode)) { console.error("seat-map pixel intelligence missing"); ok=false; }
if (!/X-NEUL-SeatMap-Hash/.test(seatProxyCode) || !/sha256/i.test(seatProxyCode)) { console.error("seat-map content-hash proxy missing"); ok=false; }
if (!/secondarySourceUrl/.test(officialMonitorCode) || !/assets\.kktix\.io/.test(officialMonitorCode) || !/parseTicketPage/.test(officialMonitorCode)) { console.error("multi-source official monitor regression"); ok=false; }
if (!/wve\.kktix\.cc/.test(ticketDiscoveryCode) || !/kktix\.com\/events\?page=10/.test(ticketDiscoveryCode)) { console.error("KKTIX organization/pagination coverage missing"); ok=false; }
const bts40=seedEvents.find(e=>e.id==="bts-arirang-kaohsiung-2026");
const btsLayout=getVenueLayout("bts-arirang-kaohsiung-2026");
if(!bts40 || bts40.venueLayoutId!=="bts-arirang-kaohsiung-2026" || !/activity\/field\/26_btskns_/i.test(bts40.seatLayoutSourceUrl||"")){ console.error("BTS official map wiring missing",bts40); ok=false; }
if(!btsLayout?.stage?.centerStage || (btsLayout.extraStageRects||[]).length!==4 || !btsLayout.seatMapAutoRegenerate){ console.error("BTS central X-stage / auto-regeneration geometry missing",btsLayout); ok=false; }
if(sectionTicketLabel("bts-arirang-kaohsiung-2026","A2")!=="VIP NT$9,380" || sectionTicketLabel("bts-arirang-kaohsiung-2026","Y1")!=="NT$7,980" || sectionTicketLabel("bts-arirang-kaohsiung-2026","A9")!=="NT$6,980"){ console.error("BTS section pricing regression",sectionTicketLabel("bts-arirang-kaohsiung-2026","A2"),sectionTicketLabel("bts-arirang-kaohsiung-2026","Y1"),sectionTicketLabel("bts-arirang-kaohsiung-2026","A9")); ok=false; }
const tara40=seedEvents.find(e=>e.id==="tara-fancon-kaohsiung-2026");
const taraLayout=getVenueLayout("tara-fancon-kaohsiung-2026");
if(!tara40 || !/wve\.kktix\.cc/.test(tara40.sourceUrl||"") || !/assets\.kktix\.io/.test(tara40.seatLayoutSourceUrl||"") || tara40.venueLayoutId!=="tara-fancon-kaohsiung-2026"){ console.error("T-ARA KKTIX/3D wiring missing",tara40); ok=false; }
if(sectionTicketLabel("tara-fancon-kaohsiung-2026","1F-C")!=="NT$5,980" || sectionTicketLabel("tara-fancon-kaohsiung-2026","2F-A")!=="NT$5,680" || sectionTicketLabel("tara-fancon-kaohsiung-2026","2F-C")!=="NT$4,680" || sectionTicketLabel("tara-fancon-kaohsiung-2026","2F-B-REAR")!=="NT$3,680"){ console.error("T-ARA section pricing regression"); ok=false; }
if (!/hydrateSeatMapGeometry/.test(app) || !/neul-seatmap-hash/.test(app) || !/hashChanged/.test(app) || /slice\(0,14\)/.test(app) || !/i\+=1/.test(app)) { console.error("client seat-map change regeneration pipeline missing/bounded to partial list"); ok=false; }
if (!/seatMapFound/.test(apiEventsCode) || !/sectionPricesFound/.test(apiEventsCode) || !/threeDReady/.test(apiEventsCode)) { console.error("four-stage automation status missing"); ok=false; }
if (!/neul-v0\.40\.4-bts-stage-bm-price-autogen-guard/.test(sw) || !/seat-map-intelligence\.js/.test(sw)) { console.error("v0.40.4 service-worker cache regression"); ok=false; }

// v0.40.1 OCR/Vision + precise section mapping + source expansion
if (!/tesseract\.js@5/.test(seatVisionCode) || !/ocr-section-mapped/.test(seatVisionCode) || !/mapSectionTokenForQA/.test(seatVisionCode) || !/mappingScore/.test(seatVisionCode)) { console.error("OCR/Vision precise section mapping pipeline missing"); ok=false; }
if (!/X-NEUL-SeatMap-Resolved/.test(seatProxyCode) || !/text\/html/.test(seatProxyCode) || !/extractOfficialSeatLayoutUrl/.test(seatProxyCode)) { console.error("ticket page -> seat-map resolver missing"); ok=false; }
for (const source of ["TixFun","OPENTIX","FANSI GO","博客來售票"]) if (!ticketDiscoveryCode.includes(source)) { console.error("expanded ticket discovery source missing",source); ok=false; }
if (!/data-src|data-original/.test(officialMonitorCode) || !/srcset/.test(officialMonitorCode)) { console.error("lazy/srcset seat-map extraction missing"); ok=false; }
if (!/cacheHit/.test(seatVisionCode) || !/neul-seatmap-hash/.test(app) || !/\:analysis/.test(app)) { console.error("seat-map hash/OCR cache missing"); ok=false; }


// v0.40.2 source completeness + lifecycle + light-floor / Zepp coverage
const izna=seedEvents.find(e=>e.id==="izna-who-dat-girl-taipei-2026");
if (!izna || !izna.sourceUrl?.includes("26_izna") || izna.venueModelId!=="zepp-new-taipei") { console.error("izna official fallback/Zepp mapping missing",izna); ok=false; }
if (!venueModels["zepp-new-taipei"] || !venueLayouts["zepp-new-taipei-base"] || venueIdFromName("Zepp New Taipei")!=="zepp-new-taipei") { console.error("Zepp New Taipei 3D base missing"); ok=false; }
if (!/iNDIEVOX/.test(ticketDiscoveryCode) || !/indievox/.test(ticketDiscoveryCode) || !/maxDetails:96/.test(ticketDiscoveryCode)) { console.error("expanded Taiwan source discovery missing"); ok=false; }
if (!/#b8c0c7/.test(webgl) || !/isLight\?"#d9dde1":"#b8c0c7"/.test(app)) { console.error("all-venue light floor not wired in WebGL+fallback"); ok=false; }
const iznaFixture=`<html><head><title>2026 izna Concert Tour：WHO DAT GIRL? in TAIPEI</title></head><body>演出日期｜2026年10月9日 18:00 演出地點｜Zepp New Taipei 活動票價｜NT$4,280 / NT$3,880 / NT$3,580 售票時間｜2026年8月23日 15:00</body></html>`;
const parsedIzna=parseTicketPlatformPage(iznaFixture,"https://tixcraft.com/activity/detail/26_izna",{name:"tixCraft 拓元"});
if (!parsedIzna || parsedIzna.artist?.toLowerCase().includes("台灣演出") || parsedIzna.city!=="New Taipei" || !parsedIzna.start.startsWith("2026-10-09T18:00")) { console.error("izna ticket parser fixture failed",parsedIzna); ok=false; }


// v0.40.3 official seat-map-under-preview + bidirectional mapping + physical aisle geometry
for (const id of ["officialSeatMapPanel","officialSeatMapFrame","officialSeatMapImage","officialSeatMapMarker","officialSeatMapSource","officialSeatMapSync"]) if (!indexHtml.includes(`id="${id}"`)) { console.error("v0.40.3 official seat-map UI hook missing",id); ok=false; }
if (!/renderOfficialSeatMap/.test(app) || !/handleOfficialSeatMapClick/.test(app) || !/selectMappedSeatMapSection/.test(app) || !/seatMapImagePoint/.test(app)) { console.error("v0.40.3 official map/3D linkage missing"); ok=false; }
if (!/x:token\.cx,y:token\.cy/.test(seatVisionCode)) { console.error("v0.40.3 OCR normalized map coordinates missing"); ok=false; }
if (!/sideAisle/.test(webgl) || !/crossAisle/.test(webgl) || !/aisleColor/.test(webgl) || !/prism\(top,\.30\)/.test(webgl)) { console.error("v0.40.3 physical aisle geometry missing"); ok=false; }
if (!/official-seatmap-inline/.test(css) || !/official-seatmap-frame/.test(css)) { console.error("v0.40.3 inline official-map styling missing"); ok=false; }

// v0.40.4 BTS special-stage accuracy + BABYMONSTER pricing + auto-generation guard
const btsExpected=[...Array.from({length:13},(_,i)=>`A${i+1}`),...Array.from({length:13},(_,i)=>`M${i+1}`),...Array.from({length:14},(_,i)=>`Y${i+1}`),...Array.from({length:14},(_,i)=>`R${i+1}`)];
if (btsLayout?.stage?.main?.shape!=="circle" || !(Number(btsLayout?.stage?.main?.radius)>0) || (btsLayout?.extraStageRects||[]).length!==4) { console.error("v0.40.4 BTS circular core + four-arm stage missing",btsLayout?.stage,btsLayout?.extraStageRects); ok=false; }
for(const id of btsExpected) if(!getVenueSection("kaohsiung-stadium",id,"bts-arirang-kaohsiung-2026")){ console.error("v0.40.4 BTS official floor section missing",id); ok=false; break; }
if (sectionTicketLabel("bts-arirang-kaohsiung-2026","A4")!=="NT$7,980" || sectionTicketLabel("bts-arirang-kaohsiung-2026","M13")!=="NT$6,980" || sectionTicketLabel("bts-arirang-kaohsiung-2026","R14")!=="NT$7,980") { console.error("v0.40.4 BTS full floor pricing map regression"); ok=false; }
const bmLayout=getVenueLayout("babymonster-choom-taipei-2026");
if (!bm37?.seatLayoutDisplayUrl || bm37.venueLayoutId!=="babymonster-choom-taipei-2026" || !bmLayout?.stage?.runway || !(bmLayout?.extraStageRects||[]).length || !bmLayout?.foh) { console.error("v0.40.4 BABYMONSTER official-map/custom-stage wiring missing",bm37,bmLayout); ok=false; }
if (sectionTicketLabel("babymonster-choom-taipei-2026","VIP A")!=="NT$6,780" || sectionTicketLabel("babymonster-choom-taipei-2026","特B")!=="NT$5,800" || sectionTicketLabel("babymonster-choom-taipei-2026","黃2E")!=="NT$4,800") { console.error("v0.40.4 BABYMONSTER exact section pricing regression"); ok=false; }
const qaX=inferStageProfileForQA({central:true,xArms:true,circleConfidence:.8});
const qaCentral=inferStageProfileForQA({central:true,xArms:false,circleConfidence:.8});
if (qaX.profile!=="central-x" || qaX.armCount!==4 || qaX.mainShape!=="circle" || qaCentral.profile!=="central-stage" || qaCentral.armCount!==0) { console.error("v0.40.4 stage topology guard regression",qaX,qaCentral); ok=false; }
const stagePick=selectStageComponentForQA([{n:9000,minX:0,maxX:900,minY:750,maxY:900,cx:450,cy:825},{n:1800,minX:360,maxX:640,minY:230,maxY:500,cx:500,cy:365}],1000,1000,{cx:.5,cy:.36});
if (stagePick?.cx!==500 || stagePick?.cy!==365) { console.error("v0.40.4 STAGE-label component targeting regression",stagePick); ok=false; }
if (priceForLabelForQA(bm37,"黃3J")!=="NT$4,200 / 3,600 / 2,600 / 800（依官方圖排數色帶）" || priceForLabelForQA(bm37,"VIP E")!=="NT$6,780" || priceForLabelForQA(bm37,"特C")!=="NT$5,800") { console.error("v0.40.4 Chinese/range section price expansion regression"); ok=false; }
if (!/legendFromOcr/.test(seatVisionCode) || !/unverified-no-price-guess/.test(seatVisionCode) || !/referenceSections/.test(seatVisionCode) || !/stageConfidence/.test(seatVisionCode) || !/central-x/.test(seatVisionCode) || !/eng\+chi_tra/.test(seatVisionCode) || !/ruleAliases/.test(seatVisionCode) || !/selectStageComponent/.test(seatVisionCode)) { console.error("v0.40.4 safe OCR/price/stage inference pipeline missing"); ok=false; }
if (!/stageConfidence\|\|0\)>=?\.90|stageConfidence.*\.90/.test(app) || !/seatLayoutDisplayUrl/.test(app)) { console.error("v0.40.4 calibrated-stage overwrite guard / display map missing"); ok=false; }
if (!/roundStageItem/.test(webgl) || !/if\(!stage\.centerStage\)/.test(webgl) || !/Neutral four-sided overhead truss/.test(webgl)) { console.error("v0.40.4 central-stage renderer protection missing"); ok=false; }
if (!/event\.secondarySourceUrl/.test(apiEventsCode) || !/event\.ticketUrl/.test(apiEventsCode)) { console.error("v0.40.4 secondary ticket URL seat-map eligibility missing"); ok=false; }
if (!/Ticket Plus 遠大售票/.test(ticketDiscoveryCode) || !/maxDetails:64/.test(ticketDiscoveryCode)) { console.error("v0.40.4 Ticket Plus discovery expansion missing"); ok=false; }
if (!ok) process.exit(1);
console.log(`NEUL v0.40.4 checks passed · Taiwan-only · ${seedEvents.length} seed events · ${Object.keys(venueModels).length} venue models · 14 ticket sources + official artist/venue feeds · complete base-tier 3D merge · exact-section pricing · expired-layout cleanup · UI overflow audit · WebGL + Canvas fallback · PWA + IndexedDB`);
