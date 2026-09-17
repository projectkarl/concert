import { htmlToText } from "./official-monitor.js";
import { artistOfficialDiscovery } from "../data/discovery.js";

const pad = n => String(n).padStart(2, "0");

async function fetchText(url, timeoutMs = 4200) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8,ko;q=0.7,ja;q=0.6",
      "User-Agent": "NEUL/0.31 (+artist-official-tour-monitor)"
    },
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
}

export function parseBabymonsterChoomTaipei(html = "", source = artistOfficialDiscovery[0]) {
  const text = htmlToText(html).replace(/\s+/g, " ").trim();
  const block = text.match(/TAIPEI\s+TAIPEI ARENA\s+(20\d{2})[./-](\d{1,2})[./-](\d{1,2})[^0-9]{0,40}(?:\([^)]*\))?\s*(20\d{2})[./-](\d{1,2})[./-](\d{1,2})/i);
  if (!block) return null;
  const [, y1, m1, d1, y2, m2, d2] = block;
  const start = `${y1}-${pad(m1)}-${pad(d1)}T00:00:00+08:00`;
  const end = `${y2}-${pad(m2)}-${pad(d2)}T00:00:00+08:00`;
  return {
    id: "babymonster-choom-taipei-2026",
    artist: "BABYMONSTER",
    shortArtist: "BM",
    market: "KR",
    title: "2026–27 BABYMONSTER WORLD TOUR [춤 (CHOOM)] IN TAIPEI",
    type: "CONCERT",
    region: "TW",
    start,
    end,
    timeConfirmed: false,
    venue: "臺北小巨蛋 Taipei Arena",
    city: "Taipei",
    statusLabel: /COMING SOON/i.test(text) ? "官方已確認" : "演唱會",
    ticketStatus: /COMING SOON/i.test(text) ? "DETAILS TBA" : "CHECK OFFICIAL",
    ticketing: "TBA",
    price: "TBA",
    sourceName: source.sourceName,
    sourceUrl: source.sourceUrl,
    verified: true,
    checkedAt: new Date().toISOString(),
    tags: ["KR", "K-POP", "TAIPEI ARENA", "ARTIST OFFICIAL", "AUTO"],
    venueModelId: source.venueModelId,
    venueLayoutId: source.venueLayoutId,
    summary: "YG 官方世界巡演頁已確認 BABYMONSTER 台北站日期與 Taipei Arena；未公開的售票、票價與座位資訊維持 TBA。",
    sessions: [
      { date: `${y1}/${pad(m1)}/${pad(d1)}`, time: "待公布", note: "藝人官方已確認" },
      { date: `${y2}/${pad(m2)}/${pad(d2)}`, time: "待公布", note: "藝人官方已確認" }
    ],
    notes: ["只同步藝人官方已公開欄位；主辦、票價、開賣時間與活動座位圖尚未公開時不推測。"]
  };
}

function parseSource(html, source) {
  if (source.parser === "yg-babymonster-choom") return parseBabymonsterChoomTaipei(html, source);
  return null;
}

export async function discoverArtistOfficialTours() {
  const settled = await Promise.allSettled(artistOfficialDiscovery.map(async source => {
    const html = await fetchText(source.sourceUrl, 4200);
    return parseSource(html, source);
  }));
  const events = settled.flatMap(r => r.status === "fulfilled" && r.value ? [r.value] : []);
  const pageErrors = settled.filter(r => r.status === "rejected").map(r => r.reason?.message || "artist official source unavailable");
  return {
    events,
    checkedUrls: artistOfficialDiscovery.length,
    source: "藝人官方巡演頁",
    indexErrors: [],
    pageErrors
  };
}
