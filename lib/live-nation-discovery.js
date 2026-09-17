import { htmlToText, parseLiveNation } from "./official-monitor.js";
import { liveNationDiscovery, koreanEventMarkers } from "../data/discovery.js";

const uniq = values => [...new Set(values.filter(Boolean))];
const slugId = url => {
  try {
    const last = new URL(url).pathname.split("/").filter(Boolean).pop() || "event";
    return `ln-${last.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}`;
  } catch {
    return `ln-${Math.random().toString(36).slice(2)}`;
  }
};

function stripTags(value = "") {
  return htmlToText(String(value)).replace(/\s+/g, " ").trim();
}

function extractTitle(html = "") {
  const h1 = String(html).match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  if (h1) return stripTags(h1);
  const title = String(html).match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return title ? stripTags(title).replace(/\s*[|–-]\s*Live Nation Taiwan.*$/i, "").trim() : null;
}

function extractArtist(text = "", title = "") {
  const patterns = [
    /Line-Up\s+Headliner\s+([^\n]{2,100})/i,
    /本活動藝人名稱\s+主要表演者\s+([^\n]{2,100})/i,
    /主要表演者\s+([^\n]{2,100})/i
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[1].replace(/\s{2,}.*/, "").trim();
  }
  const cleaned = String(title)
    .replace(/\b(?:world tour|asia fanmeeting tour|fan meeting|solo tour|concert|in taipei|taipei)\b[\s\S]*$/i, "")
    .replace(/^2026\s+/i, "")
    .trim();
  return cleaned || title || "K-POP Artist";
}

function looksKorean(text = "", artist = "", title = "") {
  const hay = `${artist} ${title} ${text}`.toLowerCase();
  if (/[가-힣]/.test(hay)) return true;
  return koreanEventMarkers.some(marker => hay.includes(marker.toLowerCase()));
}

function normalizeEventUrl(value, base = "https://www.livenation.com.tw/en") {
  try {
    const u = new URL(value, base);
    if (!u.hostname.endsWith("livenation.com.tw")) return null;
    if (!/\/event\//i.test(u.pathname)) return null;
    u.hash = "";
    u.search = "";
    return u.href;
  } catch {
    return null;
  }
}

export function extractLiveNationEventUrls(html = "", base) {
  const out = [];
  const re = /href\s*=\s*["']([^"']+)["']/gi;
  for (const m of String(html).matchAll(re)) {
    const url = normalizeEventUrl(m[1], base);
    if (url) out.push(url);
  }
  return uniq(out);
}

function parseAdditionalDate(text = "") {
  const m = text.match(/(?:ADDED DATE|ADDED SHOW|加場時間|加場)\s*[:：]\s*(20\d{2})[\/.\-](\d{1,2})[\/.\-](\d{1,2})(?:[^\d]{0,12}(\d{1,2})(?::(\d{2}))?)?/i);
  if (!m) return null;
  const [_, y, mo, d, h = "0", mi = "0"] = m;
  return `${y}-${String(mo).padStart(2,"0")}-${String(d).padStart(2,"0")}T${String(h).padStart(2,"0")}:${String(mi).padStart(2,"0")}:00+08:00`;
}

function sourceSummary(text = "") {
  const compact = text.replace(/\s+/g, " ");
  const sentence = compact.match(/(?:South Korean|K-POP|韓國|韓星)[^.。]{0,180}[.。]?/i)?.[0];
  return sentence?.trim() || "Live Nation Taiwan 公開活動頁已確認台灣場次；完整規則與異動請回官方頁面查看。";
}

export function parseLiveNationDiscoveredEvent(html, url) {
  const text = htmlToText(html);
  const title = extractTitle(html) || "Live Event";
  const artist = extractArtist(text, title);
  if (!looksKorean(text, artist, title)) return null;

  const parsed = parseLiveNation(html, { artist, title, start: null, venue: "", sourceUrl: url });
  const patch = parsed.patch || {};
  if (!patch.start || !patch.venue) return null;
  const addedDate = parseAdditionalDate(text);
  const now = Date.now();
  const eventTs = new Date(patch.start).getTime();
  if (!Number.isFinite(eventTs) || eventTs < now - 86400000) return null;

  const type = /fan\s*meeting|fanmeeting|見面會/i.test(`${title} ${text}`) ? "FAN MEETING" : "CONCERT";
  const short = artist.split(/\s+/).map(x => x[0]).join("").replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase() || "KR";
  const event = {
    id: slugId(url),
    artist,
    shortArtist: short,
    title,
    type,
    region: "TW",
    start: patch.start,
    end: addedDate || null,
    venue: patch.venue,
    city: /kaohsiung|高雄/i.test(`${patch.venue} ${text}`) ? "Kaohsiung" : /taoyuan|桃園|linkou|林口/i.test(`${patch.venue} ${text}`) ? "Taoyuan" : "Taipei",
    statusLabel: type === "FAN MEETING" ? "見面會" : "演唱會",
    ticketStatus: patch.ticketStatus || "CHECK OFFICIAL",
    generalSale: patch.generalSale || null,
    ticketing: patch.ticketing || "依官方售票頁公告",
    price: patch.price || "依官方售票頁公告",
    sectionPriceRules: patch.sectionPriceRules || [],
    seatLayoutSourceUrl: patch.seatLayoutSourceUrl || null,
    sourceName: "Live Nation Taiwan",
    sourceUrl: url,
    verified: true,
    checkedAt: new Date().toISOString(),
    tags: ["KOREA", "TAIWAN", "LIVE NATION", "AUTO"],
    summary: sourceSummary(text),
    ticketTimeline: patch.generalSale ? [{ label: "一般售票", time: patch.generalSale, state: eventTs > now ? "next" : "done" }] : [],
    notes: ["活動、售票與入場規則請以 Live Nation Taiwan 及官方售票平台最新公告為準。"],
    artistProfile: {
      id: `auto-${artist.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      name: artist,
      shortName: short,
      type: "ARTIST",
      market: "KR",
      agency: null,
      officialUrl: url,
      sourceName: "Live Nation Taiwan",
      verified: true
    }
  };
  return event;
}

async function fetchText(url, timeoutMs = 4200) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
      "User-Agent": "NEUL/0.7 (+taiwan-public-event-check)"
    },
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
}

async function settledInBatches(items, worker, batchSize = 4) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const settled = await Promise.allSettled(batch.map(worker));
    results.push(...settled);
  }
  return results;
}

export async function discoverLiveNationTaiwan({ maxPages = liveNationDiscovery.maxDiscoveredPagesPerRefresh } = {}) {
  const discovered = new Set(liveNationDiscovery.pinnedEventUrls);
  const indexErrors = [];
  const indexResults = await Promise.allSettled(liveNationDiscovery.indexUrls.map(async url => {
    const html = await fetchText(url, 3500);
    return extractLiveNationEventUrls(html, url);
  }));
  for (const result of indexResults) {
    if (result.status === "fulfilled") result.value.forEach(url => discovered.add(url));
    else indexErrors.push(result.reason?.message || "index unavailable");
  }

  const pinned = liveNationDiscovery.pinnedEventUrls;
  const rest = [...discovered].filter(x => !pinned.includes(x));
  const urls = uniq([...pinned, ...rest]).slice(0, Math.max(maxPages, pinned.length));
  const pageResults = await settledInBatches(urls, async url => {
    const html = await fetchText(url, 4200);
    return parseLiveNationDiscoveredEvent(html, url);
  }, 4);
  const events = pageResults.flatMap(r => r.status === "fulfilled" && r.value ? [r.value] : []);
  const pageErrors = pageResults.filter(r => r.status === "rejected").map(r => r.reason?.message || "event unavailable");
  return {
    events,
    checkedUrls: urls.length,
    indexErrors,
    pageErrors,
    source: "Live Nation Taiwan public pages"
  };
}
