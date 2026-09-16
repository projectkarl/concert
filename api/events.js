import { seedEvents } from "../data/events.js";
import { seedArtists } from "../data/artists.js";
import { discoverLiveNationTaiwan } from "../lib/live-nation-discovery.js";
import { discoverKaohsiungArena } from "../lib/kaohsiung-arena-discovery.js";

const dateKey = iso => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Taipei" }).format(d);
};

function normalizeUrl(url = "") {
  try {
    const u = new URL(url);
    u.search = "";
    u.hash = "";
    return u.href.replace(/\/$/, "");
  } catch { return ""; }
}

function normalizeText(value = "") {
  return String(value).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ").trim();
}

function mergeDiscovered(seed, live) {
  const updateFields = ["start", "end", "venue", "city", "ticketStatus", "generalSale", "ticketing", "price", "seatLayoutSourceUrl", "checkedAt"];
  const out = { ...seed };
  for (const key of updateFields) {
    if (live[key] == null || live[key] === "") continue;
    if (key === "start" && live.timeConfirmed === false && seed.start && !/T00:00:00/.test(seed.start)) continue;
    out[key] = live[key];
  }
  if (live.timeConfirmed != null && !(live.timeConfirmed === false && seed.start && !/T00:00:00/.test(seed.start))) out.timeConfirmed = live.timeConfirmed;
  out.autoUpdated = true;
  out.autoSourceName = live.sourceName;
  out.autoSourceUrl = live.sourceUrl;
  return out;
}

function mergeAndDedupe(seeds, discovered) {
  const result = seeds.map(x => ({ ...x }));
  for (const live of discovered) {
    const liveUrl = normalizeUrl(live.sourceUrl);
    const idx = result.findIndex(seed => {
      const sameUrl = !live.sharedSourceUrl && liveUrl && normalizeUrl(seed.sourceUrl) === liveUrl;
      const sameEvent = normalizeText(seed.artist) === normalizeText(live.artist)
        && dateKey(seed.start) === dateKey(live.start)
        && normalizeText(seed.venue) === normalizeText(live.venue)
        && dateKey(seed.start);
      return sameUrl || sameEvent;
    });
    if (idx >= 0) result[idx] = mergeDiscovered(result[idx], live);
    else result.push(live);
  }
  return result
    .filter(e => e.region === "TW")
    .sort((a, b) => new Date(a.start || 0) - new Date(b.start || 0));
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
      market: "KR",
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

export default async function handler(req, res) {
  // Six-hour CDN cache keeps Hobby usage low. Stale content remains usable while Vercel revalidates.
  res.setHeader("Cache-Control", "s-maxage=21600, stale-while-revalidate=86400");

  let discovery = { events: [], checkedUrls: 0, indexErrors: [], pageErrors: [], source: "Taiwan official public pages" };
  let autoUpdateError = null;
  const [liveNationResult, kaohsiungResult] = await Promise.allSettled([
    discoverLiveNationTaiwan(),
    discoverKaohsiungArena()
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
  if (errors.length) autoUpdateError = errors.join(" · ");
  discovery.source = sources.join(" + ") || "curated fallback";

  const events = mergeAndDedupe(seedEvents, discovery.events || []);
  const artists = buildArtists(events);
  return res.status(200).json({
    updatedAt: new Date().toISOString(),
    upstream: discovery.events?.length ? "taiwan-official+curated" : "curated-fallback",
    autoUpdateEnabled: true,
    liveEnabled: true,
    autoUpdateError,
    discovery: {
      source: discovery.source,
      checkedUrls: discovery.checkedUrls || 0,
      discoveredCount: discovery.events?.length || 0,
      sourceWarnings: (discovery.indexErrors?.length || 0) + (discovery.pageErrors?.length || 0) + (autoUpdateError ? 1 : 0)
    },
    count: events.length,
    artistCount: artists.length,
    events,
    artists
  });
}
