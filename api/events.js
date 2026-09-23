import { seedEvents } from "../data/events.js";
import { seedArtists } from "../data/artists.js";
import { discoverLiveNationTaiwan } from "../lib/live-nation-discovery.js";
import { discoverKaohsiungArena } from "../lib/kaohsiung-arena-discovery.js";
import { discoverTaipeiArena } from "../lib/taipei-arena-discovery.js";
import { discoverArtistOfficialTours } from "../lib/artist-official-discovery.js";
import { discoverTaiwanTicketPlatforms } from "../lib/taiwan-ticket-platform-discovery.js";
import { discoverVenueCalendars } from "../lib/venue-calendar-discovery.js";
import { discoverTwConcertViewCalendar } from "../lib/twconcertview-discovery.js";
import { venues as calibratedVenues, MAINSTREAM_3D_VENUE_IDS } from "../data/venues.js";
import { auditCoverage } from "../lib/coverage-auditor.js";

const dateKey = iso => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Taipei" }).format(d);
};

function normalizeUrl(url = "") {
  try {
    const u = new URL(url);
    u.hash = "";
    // Preserve content-identifying query parameters (e.g. Taipei Arena `s=` IDs).
    // Remove only common tracking noise so distinct official event pages never collapse together.
    for (const key of [...u.searchParams.keys()]) {
      if (/^(?:utm_.+|fbclid|gclid|mc_cid|mc_eid|ref)$/i.test(key)) u.searchParams.delete(key);
    }
    u.searchParams.sort();
    return u.href.replace(/\/$/, "");
  } catch { return ""; }
}

function normalizeText(value = "") {
  return String(value).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ").trim();
}

const MAINSTREAM_3D_SET = new Set(MAINSTREAM_3D_VENUE_IDS);
const CALIBRATED_3D_VENUES = new Set(calibratedVenues.filter(v=>MAINSTREAM_3D_SET.has(v.id)).map(v => v.id));


const ARCHIVE_LIMIT = 20;
function isMidnightIso(iso='') { return /T00:00(?::00)?(?:\+08:00|Z)?$/i.test(String(iso)); }
function endOfTaipeiDayTs(iso='') {
  const d=new Date(iso); if(!Number.isFinite(d.getTime())) return NaN;
  const key=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Taipei'}).format(d);
  return new Date(`${key}T23:59:59+08:00`).getTime();
}
function eventSessionTs(session={},event={}) {
  const date=String(session.date||'').replaceAll('/','-');
  const time=/^\d{1,2}:\d{2}$/.test(String(session.time||''))?String(session.time):'23:59';
  if(/^20\d{2}-\d{2}-\d{2}$/.test(date)) return new Date(`${date}T${time}:00+08:00`).getTime();
  return NaN;
}
function eventEffectiveEndTs(event={}) {
  const sessionTs=(event.sessions||[]).map(x=>eventSessionTs(x,event)).filter(Number.isFinite);
  if(sessionTs.length) return Math.max(...sessionTs)+6*3600000;
  if(event.end){ const raw=new Date(event.end).getTime(); if(Number.isFinite(raw)) return isMidnightIso(event.end)?endOfTaipeiDayTs(event.end):raw+6*3600000; }
  const start=new Date(event.start||0).getTime(); if(!Number.isFinite(start)) return NaN;
  if(event.timeConfirmed===false||isMidnightIso(event.start)) return endOfTaipeiDayTs(event.start);
  return start+6*3600000;
}
export function retainRecentArchive(events=[], now=Date.now(), limit=ARCHIVE_LIMIT) {
  const current=[]; const ended=[];
  for(const event of events||[]) {
    const endedNow=Boolean(event.historical)||(!Number.isFinite(eventEffectiveEndTs(event))||eventEffectiveEndTs(event)<now);
    (endedNow?ended:current).push(event);
  }
  ended.sort((a,b)=>eventEffectiveEndTs(b)-eventEffectiveEndTs(a)||new Date(b.start||0)-new Date(a.start||0));
  return [...current,...ended.slice(0,limit)].sort((a,b)=>new Date(a.start||0)-new Date(b.start||0));
}

const DISCOVERY_SNAPSHOT_PATH = "cache/neul-upcoming-discovery.json";
const DISCOVERY_CACHE_MAX = 420;
async function streamText(stream){ let out=""; const dec=new TextDecoder(); for await(const chunk of stream) out+=dec.decode(chunk,{stream:true}); return out+dec.decode(); }
function upcomingOnly(events=[], now=Date.now()) {
  return (events||[]).filter(event => {
    const end=eventEffectiveEndTs(event);
    const start=new Date(event?.start||0).getTime();
    return Number.isFinite(end) ? end>=now : (Number.isFinite(start) && start>=now);
  }).sort((a,b)=>new Date(a.start||0)-new Date(b.start||0)).slice(0,DISCOVERY_CACHE_MAX);
}
async function readDiscoverySnapshot(){
  try{
    const { get } = await import("@vercel/blob");
    const r=await get(DISCOVERY_SNAPSHOT_PATH,{access:"private",useCache:false});
    if(!r?.stream) return null;
    const data=JSON.parse(await streamText(r.stream));
    if(!Array.isArray(data?.events)) return null;
    return {...data,events:upcomingOnly(data.events)};
  }catch{return null;}
}
async function writeDiscoverySnapshot(events=[],meta={}){
  try{
    const upcoming=upcomingOnly(events);
    if(upcoming.length<40) return false;
    const { put } = await import("@vercel/blob");
    await put(DISCOVERY_SNAPSHOT_PATH,JSON.stringify({version:1,updatedAt:new Date().toISOString(),events:upcoming,meta}),{access:"private",contentType:"application/json",overwrite:true});
    return true;
  }catch{return false;}
}
const TAIWAN_CITIES = new Set(["Taipei","New Taipei","Taoyuan","Taichung","Tainan","Kaohsiung","Hsinchu","Keelung","Chiayi","Changhua","Miaoli","Nantou","Yunlin","Pingtung","Yilan","Hualien","Taitung","Penghu","Kinmen","Matsu"]);
function isTaiwanEvent(event = {}) {
  if (event.region !== "TW") return false;
  const city = String(event.city || "");
  if (city && !TAIWAN_CITIES.has(city)) return false;
  return true;
}

const VENUE_ALIASES = [
  [/臺?北大巨蛋|taipei dome/i, "taipei-dome"],
  [/臺?北小巨蛋|taipei arena/i, "taipei-arena"],
  [/林口體育館|國立體育大學.*(?:體育館|ntsu)|ntsu arena|linkou arena/i, "ntsu-arena"],
  [/高雄巨蛋|kaohsiung arena/i, "kaohsiung-arena"],
  [/高雄國家體育場|世運主場館|kaohsiung national stadium/i, "kaohsiung-stadium"],
  [/桃園巨蛋|桃園市立綜合體育館|taoyuan arena/i, "taoyuan-arena"],
  [/臺?大綜合體育館|台大綜合體育館|ntu sports center/i, "ntu-sports-center"],
  [/台北國際會議中心|臺北國際會議中心|\bticc\b/i, "ticc"],
  [/臺?北流行音樂中心|taipei music center|\btmc\b/i, "taipei-music-center"],
  [/高雄流行音樂中心|kaohsiung music center/i, "kaohsiung-music-center"],
  [/legacy tera/i, "legacy-tera"],
  [/zepp new taipei/i, "zepp-new-taipei"]
];

function canonicalVenue(value = "") {
  const text = String(value || "");
  const hit = VENUE_ALIASES.find(([re]) => re.test(text));
  return hit ? hit[1] : normalizeText(text);
}

function eventIdentityText(event = {}) {
  return normalizeText(`${event.artist || ""} ${event.shortArtist || ""} ${event.title || ""}`)
    .replace(/mastercard專區|vip upgrade|升級vip|加購福利|add on benefit|優先購票|預售專區/g, " ")
    .replace(/\b(world|tour|taipei|taiwan|concert|live|in|the|2026|2025|show|fan|meeting)\b/g, " ")
    .replace(/\s+/g, " ").trim();
}

function tokenSet(text = "") {
  return new Set(normalizeText(text).split(/\s+/).filter(x => x.length > 1));
}

function identityOverlap(a, b) {
  const at = tokenSet(eventIdentityText(a));
  const bt = tokenSet(eventIdentityText(b));
  if (!at.size || !bt.size) return 0;
  let common = 0;
  for (const t of at) if (bt.has(t)) common++;
  return common / Math.min(at.size, bt.size);
}

function likelySameEvent(a = {}, b = {}) {
  const au = normalizeUrl(a.sourceUrl), bu = normalizeUrl(b.sourceUrl);
  if (au && bu && au === bu && !a.sharedSourceUrl && !b.sharedSourceUrl) return true;
  const dayA = dateKey(a.start), dayB = dateKey(b.start);
  if (!dayA || dayA !== dayB) return false;
  if (canonicalVenue(a.venue) !== canonicalVenue(b.venue)) return false;
  const aa = normalizeText(a.artist), ba = normalizeText(b.artist);
  if (aa && ba && (aa === ba || aa.includes(ba) || ba.includes(aa))) return true;
  const ia = eventIdentityText(a), ib = eventIdentityText(b);
  if (ia && ib && (ia.includes(ib) || ib.includes(ia))) return true;
  return identityOverlap(a, b) >= 0.45;
}

const PLACEHOLDER_RE = /^(?:tba|check official|依(?:主辦|官方|售票頁|官方售票頁).*(?:公告|為準)?|待公布|尚未公布|未公布|coming soon|upcoming sale)$/i;
function isMeaningful(value) {
  if (value == null || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return !PLACEHOLDER_RE.test(value.trim());
  return true;
}

function sourcePriority(event = {}) {
  const s = `${event.sourceName || ""} ${event.sourceUrl || ""} ${event.ticketing || ""}`.toLowerCase();
  // Community calendars are discovery-only. They may add a missing event, but never overwrite
  // richer official ticket/promoter/venue details when the same event is already known.
  if (/twconcertview|coverage cross-check|覆蓋補漏/.test(s)) return 10;
  if (/tixcraft|拓元|kktix|ticketplus|遠大|kham|寬宏|ibon|famiticket|全網|udn|聯合|ticket\.mna|mna|牛耳|ticket\.com\.tw|年代|indievox|fansi|opentix|tixfun|tickets\.books/.test(s)) return 60;
  if (/livenation|live nation/.test(s)) return 55;
  if (/weverse|ygfamily|jype|smtown|hybe|official.*tour|藝人官方/.test(s)) return 50;
  if (/arena|小巨蛋|巨蛋|場館|calendar|行事曆/.test(s)) return 40;
  return event.verified ? 30 : 20;
}

function unionByJson(a = [], b = []) {
  const out = [];
  const seen = new Set();
  for (const item of [...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])]) {
    const key = JSON.stringify(item);
    if (!seen.has(key)) { seen.add(key); out.push(item); }
  }
  return out;
}

function sourceRef(event = {}) {
  const url = normalizeUrl(event.sourceUrl);
  if (!url) return null;
  return { name: event.sourceName || event.ticketing || "Official source", url };
}

function mergeRecords(existing, incoming) {
  const out = { ...existing };
  const existingPriority = sourcePriority(existing);
  const incomingPriority = sourcePriority(incoming);
  const protectedFields = new Set(["id", "venueModelId", "venueLayoutId", "artistProfile"]);
  const arrayFields = new Set(["sectionPriceRules", "tags", "ticketTimeline", "sessions", "notes"]);
  const updateFields = [
    "artist","shortArtist","title","type","start","end","venue","city","statusLabel","ticketStatus",
    "generalSale","ticketing","price","seatLayoutSourceUrl","checkedAt","summary","market","timeConfirmed"
  ];

  for (const key of updateFields) {
    if (protectedFields.has(key)) continue;
    const current = out[key];
    const next = incoming[key];
    if (!isMeaningful(next)) continue;
    if (key === "start" && incoming.timeConfirmed === false && existing.start && !/T00:00:00/.test(existing.start)) continue;
    const currentMeaningful = isMeaningful(current);
    const richerString = typeof next === "string" && typeof current === "string" && next.length > current.length * 1.15;
    if (!currentMeaningful || incomingPriority > existingPriority || (incomingPriority === existingPriority && richerString)) out[key] = next;
  }

  for (const key of arrayFields) out[key] = unionByJson(existing[key], incoming[key]);
  if (!out.seatLayoutSourceUrl && incoming.seatLayoutSourceUrl) out.seatLayoutSourceUrl = incoming.seatLayoutSourceUrl;
  if (!out.sectionPriceRules?.length && incoming.sectionPriceRules?.length) out.sectionPriceRules = incoming.sectionPriceRules;
  if (!out.venueModelId && incoming.venueModelId) out.venueModelId = incoming.venueModelId;
  if (!out.venueLayoutId && incoming.venueLayoutId) out.venueLayoutId = incoming.venueLayoutId;

  const refs = unionByJson(
    [...(existing.sourceRefs || []), sourceRef(existing)].filter(Boolean),
    [...(incoming.sourceRefs || []), sourceRef(incoming)].filter(Boolean)
  );
  if (refs.length) out.sourceRefs = refs;
  if (incomingPriority > existingPriority && incoming.sourceUrl) {
    if (out.sourceUrl && normalizeUrl(out.sourceUrl) !== normalizeUrl(incoming.sourceUrl)) out.secondarySourceUrl = out.sourceUrl;
    out.sourceUrl = incoming.sourceUrl;
    out.sourceName = incoming.sourceName || out.sourceName;
  } else if (incoming.sourceUrl && normalizeUrl(incoming.sourceUrl) !== normalizeUrl(out.sourceUrl)) {
    out.secondarySourceUrl ||= incoming.sourceUrl;
  }
  out.verified = Boolean(existing.verified || incoming.verified);
  out.autoUpdated = Boolean(existing.autoUpdated || incoming.autoUpdated || incoming.id?.startsWith("auto-"));
  if (incoming.sourceName) out.autoSourceName = incoming.sourceName;
  if (incoming.sourceUrl) out.autoSourceUrl = incoming.sourceUrl;
  return out;
}

function isNonPerformanceTicketProduct(event = {}) {
  const text = normalizeText(`${event.artist || ""} ${event.title || ""} ${event.venue || ""}`);
  if (/返鄉專車|歌迷專車|接駁專車|接駁車|蛋黃酥|周邊商品|商品預購/.test(text)) return true;
  if (/例行賽|季後賽|季票專區|球賽門票|棒球(?:賽事|門票)|籃球(?:賽事|門票)/.test(text)) return true;
  return false;
}

export function mergeAndDedupe(seeds, discovered) {
  const result = [];
  for (const candidate of [...seeds, ...discovered]) {
    if (!isTaiwanEvent(candidate) || isNonPerformanceTicketProduct(candidate)) continue;
    const idx = result.findIndex(existing => likelySameEvent(existing, candidate));
    if (idx >= 0) result[idx] = mergeRecords(result[idx], candidate);
    else result.push({ ...candidate, sourceRefs: sourceRef(candidate) ? [sourceRef(candidate)] : [] });
  }
  // Defensive second pass catches duplicates whose richer merged title/artist now exposes the identity match.
  const collapsed = [];
  for (const event of result) {
    const idx = collapsed.findIndex(existing => likelySameEvent(existing, event));
    if (idx >= 0) collapsed[idx] = mergeRecords(collapsed[idx], event);
    else collapsed.push(event);
  }
  return collapsed.sort((a, b) => new Date(a.start || 0) - new Date(b.start || 0));
}


function ticketSeatMapEligible(event={}) {
  const refUrls=(event.sourceRefs||[]).flatMap(ref=>[ref?.url,ref?.sourceUrl]);
  const candidates=[event.seatLayoutSourceUrl,event.ticketUrl,event.ticketSourceUrl,event.secondarySourceUrl,event.autoSourceUrl,event.sourceUrl,...refUrls].filter(Boolean);
  for(const raw of candidates){
    try {
      const host=new URL(raw).hostname.toLowerCase();
      if(/((?:^|\.)tixcraft\.com$|(?:^|\.)kktix\.(?:com|cc)$|(?:^|\.)ticketplus\.com\.tw$|(?:^|\.)kham\.com\.tw$|^ticket\.ibon\.com\.tw$|(?:^|\.)famiticket\.com\.tw$|^tickets\.udnfunlife\.com$|^ticket\.mna\.com\.tw$|(?:^|\.)ticket\.com\.tw$|(?:^|\.)opentix\.life$|(?:^|\.)tixfun\.com$|^go\.fansi\.me$|(?:^|\.)indievox\.com$|^tickets\.books\.com\.tw$)/.test(host)) return true;
    } catch {}
  }
  return false;
}

function buildArtists(events) {
  const map = new Map(seedArtists.map(a => [a.name.toLowerCase(), { ...a, upcomingEventCount: 0, nextEvent: null, eventIds: [] }]));
  const now = Date.now();
  for (const event of events) {
    if (!event.artist) continue;
    const key = event.artist.toLowerCase();
    const old = map.get(key);
    const base = old || event.artistProfile || {
      id: `auto-${key.replace(/[^a-z0-9]+/g, "-")}`,
      name: event.artist,
      shortName: event.shortArtist || event.artist.slice(0, 3).toUpperCase(),
      type: "ARTIST",
      market: event.market || "INTL",
      agency: null,
      officialUrl: event.sourceUrl,
      sourceName: event.sourceName || "Official Taiwan event source",
      verified: Boolean(event.verified)
    };
    const artist = { ...base };
    artist.eventIds = [...new Set([...(old?.eventIds || []), event.id])];
    const future = event.start && new Date(event.start).getTime() >= now - 86400000;
    artist.upcomingEventCount = (old?.upcomingEventCount || 0) + (future ? 1 : 0);
    if (future && (!old?.nextEvent || new Date(event.start) < new Date(old.nextEvent.start))) {
      artist.nextEvent = {
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end || null,
        venue: event.venue,
        city: event.city,
        statusLabel: event.statusLabel,
        sourceUrl: event.sourceUrl
      };
    } else artist.nextEvent = old?.nextEvent || null;
    artist.updatedAt = event.checkedAt || old?.updatedAt || new Date().toISOString();
    map.set(key, artist);
  }
  return [...map.values()].sort((a, b) => {
    if (a.nextEvent && b.nextEvent) return new Date(a.nextEvent.start) - new Date(b.nextEvent.start);
    if (a.nextEvent) return -1;
    if (b.nextEvent) return 1;
    return a.name.localeCompare(b.name);
  });
}

function coverageSnapshot(discovery = {}, events = [], auditor = null) {
  const health = Array.isArray(discovery.sourceHealth) ? discovery.sourceHealth : [];
  const emptySources = health.filter(x => Number(x.discovered || 0) === 0).map(x => x.name);
  const sourceWarnings = (discovery.indexErrors?.length || 0) + (discovery.pageErrors?.length || 0);
  const officialMapCount = events.filter(e => e.seatLayoutSourceUrl).length;
  const priceMappedCount = events.filter(e => Array.isArray(e.sectionPriceRules) && e.sectionPriceRules.length).length;
  return {
    completenessGuaranteed: false,
    scope: 'Taiwan public music/concert events discovered from configured official ticket, promoter, artist and venue sources, plus twconcertview coverage cross-check',
    sourceCount: health.length + 4,
    sourceWarnings,
    emptySources,
    officialMapCount,
    priceMappedCount,
    auditor: auditor ? {
      futureEvents: auditor.futureEvents,
      crossVerified: auditor.crossVerified,
      singleSource: auditor.singleSource,
      venueOnlyNeedsTicketBackfill: auditor.venueOnlyNeedsTicketBackfill,
      detectedCoverageGaps: auditor.detectedCoverageGaps,
      sourceHealthWarnings: auditor.sourceHealthWarnings,
      coverageReferenceCandidates: auditor.coverageReferenceCandidates || 0,
      coverageReferenceUnmatched: auditor.coverageReferenceUnmatched || 0,
      coverageReferenceCount: discovery.coverageReferenceCount || 0,
      coverageReferenceParsedCount: discovery.coverageReferenceParsedCount || 0,
      coverageReferenceRatio: discovery.coverageReferenceRatio ?? null,
      coverageReferenceComplete: Boolean(discovery.coverageReferenceComplete),
      coverageReferenceMonthsScanned: discovery.coverageReferenceMonthsScanned || 0,
      coverageReferenceSuccessfulPages: discovery.coverageReferenceSuccessfulPages || 0
    } : null,
    note: 'No public source can guarantee every Taiwan performance. NEUL reconciles official ticket/promoter/artist/venue sources and uses twconcertview only as a discovery cross-check; cross-check-only items stay flagged until an official source is found.'
  };
}

export default async function handler(req, res) {
  // One-hour CDN cache lets ticket-sale dates/new events update automatically without per-user crawling.
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=21600");

  let discovery = { events: [], checkedUrls: 0, indexErrors: [], pageErrors: [], source: "Taiwan official public pages" };
  let autoUpdateError = null;
  const [liveNationResult, kaohsiungResult, taipeiArenaResult, artistOfficialResult, ticketPlatformResult, venueCalendarResult, twConcertViewResult] = await Promise.allSettled([
    discoverLiveNationTaiwan(),
    discoverKaohsiungArena(),
    discoverTaipeiArena(),
    discoverArtistOfficialTours(),
    discoverTaiwanTicketPlatforms(),
    discoverVenueCalendars(),
    discoverTwConcertViewCalendar()
  ]);
  const sources = [];
  const errors = [];
  if (liveNationResult.status === "fulfilled") {
    const d = liveNationResult.value;
    discovery.events.push(...(d.events || []));
    discovery.checkedUrls += d.checkedUrls || 0;
    discovery.indexErrors.push(...(d.indexErrors || []));
    discovery.pageErrors.push(...(d.pageErrors || []));
    sources.push(d.source || "Live Nation Taiwan");
  } else errors.push(liveNationResult.reason?.message || "Live Nation Taiwan unavailable");
  if (kaohsiungResult.status === "fulfilled") {
    const d = kaohsiungResult.value;
    discovery.events.push(...(d.events || []));
    discovery.checkedUrls += d.checkedUrls || 0;
    sources.push(d.source || "高雄巨蛋官方活動行事曆");
  } else errors.push(kaohsiungResult.reason?.message || "Kaohsiung Arena unavailable");
  if (taipeiArenaResult.status === "fulfilled") {
    const d = taipeiArenaResult.value;
    discovery.events.push(...(d.events || []));
    discovery.checkedUrls += d.checkedUrls || 0;
    discovery.indexErrors.push(...(d.indexErrors || []));
    discovery.pageErrors.push(...(d.pageErrors || []));
    sources.push(d.source || "臺北小巨蛋官方已公開活動");
  } else errors.push(taipeiArenaResult.reason?.message || "Taipei Arena unavailable");
  if (artistOfficialResult.status === "fulfilled") {
    const d = artistOfficialResult.value;
    discovery.events.push(...(d.events || []));
    discovery.checkedUrls += d.checkedUrls || 0;
    discovery.indexErrors.push(...(d.indexErrors || []));
    discovery.pageErrors.push(...(d.pageErrors || []));
    sources.push(d.source || "藝人官方巡演頁");
  } else errors.push(artistOfficialResult.reason?.message || "Artist official tour source unavailable");
  if (ticketPlatformResult.status === "fulfilled") {
    const d = ticketPlatformResult.value;
    discovery.events.push(...(d.events || []));
    discovery.checkedUrls += d.checkedUrls || 0;
    discovery.indexErrors.push(...(d.indexErrors || []));
    discovery.pageErrors.push(...(d.pageErrors || []));
    discovery.sourceHealth = d.sourceHealth || [];
    sources.push(d.source || "台灣售票平台");
  } else errors.push(ticketPlatformResult.reason?.message || "Taiwan ticket platforms unavailable");
  if (venueCalendarResult.status === "fulfilled") {
    const d = venueCalendarResult.value;
    discovery.events.push(...(d.events || []));
    discovery.checkedUrls += d.checkedUrls || 0;
    discovery.indexErrors.push(...(d.indexErrors || []));
    discovery.pageErrors.push(...(d.pageErrors || []));
    discovery.venueSourceHealth = d.sourceHealth || [];
    sources.push(d.source || "官方場館行事曆");
  } else errors.push(venueCalendarResult.reason?.message || "Venue calendars unavailable");
  if (twConcertViewResult.status === "fulfilled") {
    const d = twConcertViewResult.value;
    discovery.events.push(...(d.events || []));
    discovery.checkedUrls += d.checkedUrls || 0;
    discovery.indexErrors.push(...(d.indexErrors || []));
    discovery.pageErrors.push(...(d.pageErrors || []));
    discovery.coverageReferenceHealth = d.sourceHealth || [];
    discovery.coverageReferenceCount = d.referenceCount || 0;
    discovery.coverageReferenceParsedCount = d.parsedCount || 0;
    discovery.coverageReferenceRatio = d.coverageRatio ?? null;
    discovery.coverageReferenceComplete = Boolean(d.completeAgainstReference);
    discovery.coverageReferenceMonthsScanned = d.monthsScanned || 0;
    discovery.coverageReferenceSuccessfulPages = d.successfulPages || 0;
    sources.push(d.source || "twconcertview coverage cross-check");
  } else errors.push(twConcertViewResult.reason?.message || "twconcertview coverage cross-check unavailable");
  if (errors.length) autoUpdateError = errors.join(" · ");
  discovery.source = sources.join(" + ") || "curated fallback";

  // Persist only still-upcoming discovery results. If one Vercel crawl is unusually thin,
  // merge the last healthy snapshot so the UI does not collapse back to the small seed set.
  const liveUpcoming = upcomingOnly(discovery.events || []);
  const liveReference = Number(discovery.coverageReferenceCount || 0);
  const liveRatio = liveReference > 0 ? liveUpcoming.length / liveReference : 0;
  let discoverySnapshotUsed = false;
  if (liveUpcoming.length < 120 || (liveReference >= 200 && liveRatio < 0.55)) {
    const snapshot = await readDiscoverySnapshot();
    if (snapshot?.events?.length) {
      discovery.events = mergeAndDedupe(snapshot.events, discovery.events || []);
      discoverySnapshotUsed = true;
      discovery.source += " + last healthy upcoming snapshot";
    }
  }
  const snapshotSaved = await writeDiscoverySnapshot(discovery.events || [], {
    coverageReferenceCount: discovery.coverageReferenceCount || 0,
    coverageReferenceParsedCount: discovery.coverageReferenceParsedCount || 0
  });

  const mergedEvents = mergeAndDedupe(seedEvents, discovery.events || []);
  const allEvents = mergedEvents.map(event => {
    const seatMapFound = Boolean(event.seatLayoutSourceUrl);
    const sectionPricesFound = Boolean(event.sectionPriceRules?.length);
    const explicitEventLayout = Boolean(event.venueLayoutId);
    const renderable3D = Boolean(event.venueModelId && CALIBRATED_3D_VENUES.has(event.venueModelId));
    let threeDVerificationLevel = "venue-derived-client-qa-required";
    if (seatMapFound && sectionPricesFound) threeDVerificationLevel = "official-map-price-linked-client-qa-required";
    else if (seatMapFound) threeDVerificationLevel = "official-map-linked-client-qa-required";
    return {
      ...event,
      automation: {
        eventFound: true,
        ticketSourceFound: ticketSeatMapEligible(event),
        seatMapFound,
        seatMapAutoResolveReady: ticketSeatMapEligible(event),
        ocrVisionReady: renderable3D,
        sectionPricesFound,
        sectionMappingReady: renderable3D,
        threeDReady: renderable3D,
        threeDAutoGenerationReady: renderable3D,
        eventSpecificLayoutRequired: true,
        autoGenerationTrigger: 'on-every-event-sync',
        clientVisionQARequired: Boolean(seatMapFound),
        threeDOfficialVerified: false,
        priceMappingVerified: false,
        serverEvidenceOnly: { seatMapFound, sectionPricesFound, explicitEventLayout },
        threeDVerificationLevel,
        geometrySource: seatMapFound ? "official-seat-map-ocr-vision" : (ticketSeatMapEligible(event) ? "ticket-page-auto-seat-map-resolver" : "venue-base"),
        pipeline: ["ticket-source", "seat-map-resolver", "ocr-vision", "section-mapping", "event-3d", "qa-gate"],
        needsSeatMapFollowup: !seatMapFound,
        needsSectionPriceFollowup: !sectionPricesFound,
        note: threeDVerificationLevel.includes("client-qa-required") ? "每次活動同步都會先建立唯一 event-specific 3D；若取得官方座位圖，會自動進入 OCR/Vision QA，通過前不得標示為官方校正。" : "已具官方座位圖與活動專屬 layout；官方圖或票價更新時會重新進入 QA，仍以官方最新公告為準。"
      }
    };
  });
  const events = retainRecentArchive(allEvents);
  const archiveCount = events.filter(e => Boolean(e.historical) || eventEffectiveEndTs(e) < Date.now()).length;
  const combinedSourceHealth = [...(discovery.sourceHealth || []), ...(discovery.venueSourceHealth || []), ...(discovery.coverageReferenceHealth || [])];
  discovery.sourceHealth = combinedSourceHealth;
  const coverageAudit = auditCoverage({events: allEvents, rawDiscovered: discovery.events || [], sourceHealth: combinedSourceHealth});
  const artists = buildArtists(events);
  const updatedAt = new Date();
  const nextUpdateAt = new Date(updatedAt.getTime() + 3600000);
  return res.status(200).json({
    updatedAt: updatedAt.toISOString(),
    nextUpdateAt: nextUpdateAt.toISOString(),
    upstream: discovery.events?.length ? "taiwan-official+twconcertview-crosscheck+curated" : "curated-fallback",
    autoUpdateEnabled: true,
    liveEnabled: true,
    autoUpdateError,
    discovery: {
      source: discovery.source,
      checkedUrls: discovery.checkedUrls || 0,
      discoveredCount: discovery.events?.length || 0,
      sourceWarnings: (discovery.indexErrors?.length || 0) + (discovery.pageErrors?.length || 0) + (autoUpdateError ? 1 : 0),
      sourceHealth: discovery.sourceHealth || [],
      venueSourceHealth: discovery.venueSourceHealth || [],
      coverageReferenceHealth: discovery.coverageReferenceHealth || [],
      coverageReferenceCount: discovery.coverageReferenceCount || 0,
      coverageReferenceParsedCount: discovery.coverageReferenceParsedCount || 0,
      coverageReferenceRatio: discovery.coverageReferenceRatio ?? null,
      coverageReferenceComplete: Boolean(discovery.coverageReferenceComplete),
      coverageReferenceMonthsScanned: discovery.coverageReferenceMonthsScanned || 0,
      coverageReferenceSuccessfulPages: discovery.coverageReferenceSuccessfulPages || 0,
      coverageReferenceUnmatched: coverageAudit.coverageReferenceUnmatchedEvents || [],
      discoverySnapshotUsed,
      discoverySnapshotSaved: snapshotSaved,
      discoverySnapshotPolicy: "upcoming-only; no archived events; max 420 records",
      coverageGaps: coverageAudit.gaps || [],
      needsTicketBackfill: coverageAudit.needsTicketBackfill || []
    },
    coverage: {...coverageSnapshot(discovery, allEvents, coverageAudit), archiveLimit: ARCHIVE_LIMIT, archiveCount},
    coverageAudit,
    count: events.length,
    archiveLimit: ARCHIVE_LIMIT,
    archiveCount,
    artistCount: artists.length,
    events,
    artists
  });
}
