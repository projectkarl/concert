import { seedEvents } from "../data/events.js";
import { seedArtists } from "../data/artists.js";
import { discoverLiveNationTaiwan } from "../lib/live-nation-discovery.js";
import { discoverKaohsiungArena } from "../lib/kaohsiung-arena-discovery.js";
import { discoverTaipeiArena } from "../lib/taipei-arena-discovery.js";
import { discoverArtistOfficialTours } from "../lib/artist-official-discovery.js";
import { discoverTaiwanTicketPlatforms } from "../lib/taiwan-ticket-platform-discovery.js";
import { discoverVenueCalendars } from "../lib/venue-calendar-discovery.js";
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

export function mergeAndDedupe(seeds, discovered) {
  const result = [];
  for (const candidate of [...seeds, ...discovered]) {
    if (!isTaiwanEvent(candidate)) continue;
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
    scope: 'Taiwan public music/concert events discoverable from configured official ticket, promoter, artist and venue sources',
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
      sourceHealthWarnings: auditor.sourceHealthWarnings
    } : null,
    note: 'No public source can guarantee every Taiwan performance. NEUL reconciles ticket platforms, promoter/artist pages and independent official venue calendars; detected gaps are automatically backfilled and flagged for ticket-source follow-up.'
  };
}

export default async function handler(req, res) {
  // One-hour CDN cache lets ticket-sale dates/new events update automatically without per-user crawling.
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=21600");

  let discovery = { events: [], checkedUrls: 0, indexErrors: [], pageErrors: [], source: "Taiwan official public pages" };
  let autoUpdateError = null;
  const [liveNationResult, kaohsiungResult, taipeiArenaResult, artistOfficialResult, ticketPlatformResult, venueCalendarResult] = await Promise.allSettled([
    discoverLiveNationTaiwan(),
    discoverKaohsiungArena(),
    discoverTaipeiArena(),
    discoverArtistOfficialTours(),
    discoverTaiwanTicketPlatforms(),
    discoverVenueCalendars()
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
  if (errors.length) autoUpdateError = errors.join(" · ");
  discovery.source = sources.join(" + ") || "curated fallback";

  const mergedEvents = mergeAndDedupe(seedEvents, discovery.events || []);
  const events = mergedEvents.map(event => {
    const seatMapFound = Boolean(event.seatLayoutSourceUrl);
    const sectionPricesFound = Boolean(event.sectionPriceRules?.length);
    const explicitEventLayout = Boolean(event.venueLayoutId);
    const renderable3D = Boolean(event.venueModelId || event.venueLayoutId || event.venue);
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
  const combinedSourceHealth = [...(discovery.sourceHealth || []), ...(discovery.venueSourceHealth || [])];
  discovery.sourceHealth = combinedSourceHealth;
  const coverageAudit = auditCoverage({events, rawDiscovered: discovery.events || [], sourceHealth: combinedSourceHealth});
  const artists = buildArtists(events);
  const updatedAt = new Date();
  const nextUpdateAt = new Date(updatedAt.getTime() + 3600000);
  return res.status(200).json({
    updatedAt: updatedAt.toISOString(),
    nextUpdateAt: nextUpdateAt.toISOString(),
    upstream: discovery.events?.length ? "taiwan-official+curated" : "curated-fallback",
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
      coverageGaps: coverageAudit.gaps || [],
      needsTicketBackfill: coverageAudit.needsTicketBackfill || []
    },
    coverage: coverageSnapshot(discovery, events, coverageAudit),
    coverageAudit,
    count: events.length,
    artistCount: artists.length,
    events,
    artists
  });
}
