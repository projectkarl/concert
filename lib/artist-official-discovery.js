import { htmlToText } from "./official-monitor.js";
import { artistOfficialDiscovery } from "../data/discovery.js";

const pad = n => String(n).padStart(2, "0");

async function fetchText(url, timeoutMs = 4200) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8,ko;q=0.7,ja;q=0.6",
      "User-Agent": "NEUL/0.36 (+artist-official-tour-monitor)"
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

export function parseBigBangCosmosTaiwan(html = "", source = artistOfficialDiscovery.find(x=>x.parser==="yg-bigbang-cosmos")) {
  const text = htmlToText(html).replace(/\s+/g, " ").trim();
  const pick = (city, venue, modelId, layoutId) => {
    const i = text.search(new RegExp(`${city}\\s+${venue}`, 'i'));
    if (i < 0) return null;
    const tail = text.slice(i, i + 420);
    const stop = tail.search(/\b(?:GET TICKETS|SOLD OUT|COMING SOON)\b/i);
    const chunk = stop > 0 ? tail.slice(0, stop) : tail.slice(0, 260);
    const first = chunk.match(/(20\d{2})[./-](\d{1,2})[./-](\d{1,2})/);
    if (!first) return null;
    const year=Number(first[1]);
    const dates=[];
    const re=/(?:(20\d{2})[./-])?(\d{1,2})[./-](\d{1,2})/g;
    for (const m of chunk.matchAll(re)) {
      const y=Number(m[1]||year), mo=Number(m[2]), d=Number(m[3]);
      if (y<2026||y>2028||mo<1||mo>12||d<1||d>31) continue;
      const iso=`${y}-${pad(mo)}-${pad(d)}T00:00:00+08:00`;
      if(!dates.includes(iso)) dates.push(iso);
      if(dates.length>=4) break;
    }
    if(!dates.length) return null;
    const isTaipei=/TAIPEI/i.test(city);
    return {
      id:`bigbang-cosmos-${isTaipei?'taipei':'kaohsiung'}-${year}`,
      artist:"BIGBANG",shortArtist:"BB",market:"KR",
      title:`BIGBANG 2026-2027 WORLD TOUR < XX : COSMOS > IN ${isTaipei?'TAIPEI':'KAOHSIUNG'}`,
      type:"CONCERT",region:"TW",start:dates[0],end:dates.at(-1),timeConfirmed:false,
      venue:isTaipei?"臺北大巨蛋 Taipei Dome":"高雄國家體育場（世運主場館） Kaohsiung National Stadium",
      city:isTaipei?"Taipei":"Kaohsiung",statusLabel:"演唱會",ticketStatus:"CHECK OFFICIAL",
      ticketing:isTaipei?"Ticket Plus 遠大售票":"寬宏售票",price:"依官方售票頁公告",
      sourceName:source?.sourceName||"YG Entertainment Official",sourceUrl:source?.sourceUrl,verified:true,
      checkedAt:new Date().toISOString(),tags:["KR","K-POP","YG","ARTIST OFFICIAL","AUTO"],
      venueModelId:modelId,venueLayoutId:layoutId,
      sessions:dates.map(x=>({date:x.slice(0,10).replaceAll('-','/'),time:"依官方公告",note:"YG 官方巡演頁"})),
      summary:`YG 官方巡演頁已確認 BIGBANG ${isTaipei?'台北':'高雄'}站；票價與場次細節以官方售票頁最新公告為準。`
    };
  };
  return [
    pick('TAIPEI','TAIPEI DOME','taipei-dome','td-standard'),
    pick('KAOHSIUNG','KAOHSIUNG NATIONAL STADIUM','kaohsiung-stadium','ks-standard')
  ].filter(Boolean);
}

function parseSource(html, source) {
  if (source.parser === "yg-babymonster-choom") return parseBabymonsterChoomTaipei(html, source);
  if (source.parser === "yg-bigbang-cosmos") return parseBigBangCosmosTaiwan(html, source);
  return null;
}

export async function discoverArtistOfficialTours() {
  const settled = await Promise.allSettled(artistOfficialDiscovery.map(async source => {
    const html = await fetchText(source.sourceUrl, 4200);
    return parseSource(html, source);
  }));
  const events = settled.flatMap(r => {
    if (r.status !== "fulfilled" || !r.value) return [];
    return Array.isArray(r.value) ? r.value : [r.value];
  });
  const pageErrors = settled.filter(r => r.status === "rejected").map(r => r.reason?.message || "artist official source unavailable");
  return {
    events,
    checkedUrls: artistOfficialDiscovery.length,
    source: "藝人官方巡演頁",
    indexErrors: [],
    pageErrors
  };
}
