const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
};

function decodeEntities(value = "") {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

export function htmlToText(html = "") {
  return decodeEntities(String(html))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/p\s*>|<\/li\s*>|<\/div\s*>|<\/h\d\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}


const OFFICIAL_TICKET_HOSTS = [
  // Ticketing / promoter platforms.
  'livenation.com.tw','tixcraft.com','static.tixcraft.com','kktix.com','kktix.cc','assets.kktix.io','ibon.com.tw','ticket.ibon.com.tw','ticketplus.com.tw',
  'tickets.udnfunlife.com','ticket.com.tw','ticket.mna.com.tw','famiticket.com.tw','kham.com.tw','opentix.life','tixfun.com','go.fansi.me','tickets.books.com.tw','indievox.com','kkday.com',
  // Artist / label / venue official pages that may publish the map directly or link to the ticket detail page.
  'weverse.io','ygfamily.com','xgalx.com','arena.taipei','kaoarena.com.tw','ticc.com.tw','kpmc.com.tw','penghumusicfestival.com','novelbright.jp','vaundy.jp','moba.garena.tw'
];

function officialishUrl(value, baseUrl='') {
  try {
    const u=new URL(value,baseUrl||'https://example.invalid');
    if (!/^https?:$/.test(u.protocol)) return null;
    const host=u.hostname.toLowerCase();
    if (!OFFICIAL_TICKET_HOSTS.some(x=>host===x||host.endsWith(`.${x}`))) return null;
    u.hash='';
    return u.href;
  } catch { return null; }
}

export function extractOfficialSeatLayoutCandidates(html='', baseUrl='') {
  const candidates=[];
  const source=decodeEntities(String(html))
    .replace(/\\u002F/gi,'/').replace(/\\u003A/gi,':').replace(/\\u0026/gi,'&')
    .replace(/\\u003D/gi,'=').replace(/\\u002D/gi,'-').replace(/\\\//g,'/');
  const score=(url,context='')=>{
    const decoded=(()=>{try{return decodeURIComponent(url)}catch{return url}})();
    const hay=`${decoded} ${context}`.toLowerCase();
    let n=0;
    if (/seat\s*map|seating|seatmap|field|venue\s*map|floor\s*map|zone\s*map|座位|票區|座席|場地圖|配置圖|平面圖|席次圖|座位配置|票價圖|座位表/.test(hay)) n+=9;
    if (/static\.tixcraft\.com\/images\/activity\/field\//.test(url.toLowerCase())) n+=18;
    if (/organization_resource_files/.test(url.toLowerCase()) && /座位|seat|map|視線|票區|stage/i.test(hay)) n+=10;
    if (/map|seat|field|plan|layout|zone|floor|座位|票區|視線|場地|配置/.test(hay)) n+=5;
    if (/\.(?:png|jpe?g|webp|avif)(?:\?|$)/i.test(url)) n+=4;
    if (/poster|banner|logo|artist|kv|keyvisual|header|share|ogimage|avatar|thumbnail|sponsor/i.test(decoded.toLowerCase())) n-=9;
    if (/static\.tixcraft\.com|tixcraft\.com|kktix\.(?:com|cc)|assets\.kktix\.io|ticketplus\.com\.tw|kham\.com\.tw|ticket\.ibon\.com\.tw|famiticket\.com\.tw|udnfunlife\.com|ticket\.mna\.com\.tw|ticket\.com\.tw|opentix\.life|tixfun\.com|go\.fansi\.me|tickets\.books\.com\.tw|indievox\.com/.test(url)) n+=3;
    return n;
  };
  const push=(raw,context='')=>{
    const cleaned=String(raw||'').trim().replace(/^["']|["']$/g,'').replace(/&amp;/g,'&');
    const url=officialishUrl(cleaned,baseUrl);if(url)candidates.push({url,score:score(url,context)});
  };
  const attrRe=/(?:href|src|data-src|data-original|data-lazy|data-image|data-url|content|poster)\s*=\s*["']([^"']+)["']/gi;
  for (const m of source.matchAll(attrRe)) push(m[1],source.slice(Math.max(0,(m.index||0)-320),(m.index||0)+1100));
  const srcsetRe=/(?:srcset|data-srcset)\s*=\s*["']([^"']+)["']/gi;
  for (const m of source.matchAll(srcsetRe)) for(const part of m[1].split(',')) push(part.trim().split(/\s+/)[0],m[0]);
  for (const m of source.matchAll(/url\((?:["']?)([^)"']+)(?:["']?)\)/gi)) push(m[1],source.slice(Math.max(0,(m.index||0)-220),(m.index||0)+500));
  // Modern ticket sites often serialize images in JSON instead of ordinary <img> tags.
  for (const m of source.matchAll(/["'](?:seat(?:Map|_map)?|seating(?:Map)?|floor(?:Map)?|venue(?:Map)?|field(?:Map)?|layout(?:Image|Url)?|image(?:Url|Src)?|fileUrl|assetUrl)["']\s*:\s*["']([^"']+)["']/gi)) {
    push(m[1],source.slice(Math.max(0,(m.index||0)-220),(m.index||0)+520));
  }
  // Capture relative official asset paths embedded inside script payloads.
  for (const m of source.matchAll(/(?:https?:)?\/\/[A-Za-z0-9._-]+\/[A-Za-z0-9_./%?=&+~-]+|\/(?:images|uploads|upload|assets|organization_resource_files)\/[A-Za-z0-9_./%?=&+~-]+/gi)) {
    push(m[0],source.slice(Math.max(0,(m.index||0)-180),(m.index||0)+420));
  }
  for (const raw of source.match(/https?:\/\/[^\s"'<>\\]+/gi)||[]) {const i=source.indexOf(raw);push(raw,i>=0?source.slice(Math.max(0,i-260),i+raw.length+300):'');}
  const unique=new Map();for(const c of candidates){const old=unique.get(c.url);if(!old||c.score>old.score)unique.set(c.url,c);}
  return [...unique.values()].sort((a,b)=>b.score-a.score).filter(c=>c.score>=4);
}

export function extractOfficialSeatLayoutUrl(html='', baseUrl='') {
  const ranked=extractOfficialSeatLayoutCandidates(html,baseUrl);
  return ranked[0]?.score>=6 ? ranked[0].url : null;
}

export function extractOfficialTicketLinks(html='', baseUrl='') {
  const source=decodeEntities(String(html)).replace(/\\u002F/gi,'/').replace(/\\u003A/gi,':').replace(/\\\//g,'/');
  const detailPatterns=[
    /\/activity\/detail\/[A-Za-z0-9_-]+/i,
    /\/events\/[A-Za-z0-9_-]+/i,
    /\/activity\/[A-Za-z0-9_-]+/i,
    /\/ActivityInfo\/Details\/\d+/i,
    /\/activity_info\.aspx\?code=/i,
    /\/UTK02\/UTK0201/i,
    /\/event\/\d+/i,
    /\/tickets\/show\/\d+/i,
    /\/activity\/detail\/[A-Za-z0-9_-]+/i
  ];
  const out=new Set();
  const push=raw=>{const u=officialishUrl(String(raw||'').replace(/&amp;/g,'&'),baseUrl);if(!u)return;try{const x=new URL(u);if(detailPatterns.some(re=>re.test(`${x.pathname}${x.search}`))&&!/\.(?:png|jpe?g|webp|avif|svg)(?:$|\?)/i.test(u))out.add(u);}catch{}};
  for(const m of source.matchAll(/(?:href|data-url|data-href)\s*=\s*["']([^"']+)["']/gi))push(m[1]);
  for(const raw of source.match(/https?:\/\/[^\s"'<>\\]+/gi)||[])push(raw);
  return [...out];
}

function pad(n) { return String(n).padStart(2, "0"); }
function toTaipeiIso(year, month, day, hour = 0, minute = 0) {
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00+08:00`;
}

function parseClock(hourRaw, minuteRaw = "0", ampm = "") {
  let hour = Number(hourRaw);
  const minute = Number(minuteRaw || 0);
  const marker = String(ampm || "").toLowerCase();
  if (marker === "pm" && hour < 12) hour += 12;
  if (marker === "am" && hour === 12) hour = 0;
  return { hour, minute };
}

function parseEnglishDateTime(value = "") {
  const m = String(value).match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s*(20\d{2})(?:[^\d]{0,20}(\d{1,2})(?::(\d{2}))?\s*(AM|PM))?/i);
  if (!m) return null;
  const month = MONTHS[m[1].toLowerCase()];
  const clock = parseClock(m[4] || 0, m[5] || 0, m[6] || "");
  return toTaipeiIso(Number(m[3]), month, Number(m[2]), clock.hour, clock.minute);
}

function parseNumericDateTime(value = "") {
  const source = String(value);
  const date = source.match(/(20\d{2})[\/.\-](\d{1,2})[\/.\-](\d{1,2})(?!\d)/);
  if (!date) return null;
  const rest = source.slice((date.index || 0) + date[0].length);
  let hour = 0, minute = 0;
  const colon = rest.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  const ampmOnly = rest.match(/(\d{1,2})\s*(AM|PM)\b/i);
  if (colon) ({ hour, minute } = parseClock(colon[1], colon[2], colon[3] || ""));
  else if (ampmOnly) ({ hour, minute } = parseClock(ampmOnly[1], 0, ampmOnly[2]));
  return toTaipeiIso(Number(date[1]), Number(date[2]), Number(date[3]), hour, minute);
}

function parseChineseDateTime(value = "") {
  const source=String(value);
  const m=source.match(/(20\d{2})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if(!m) return null;
  const tail=source.slice((m.index||0)+m[0].length);
  let hour=0,minute=0,explicit=false;
  const colon=tail.match(/(\d{1,2})[:：](\d{2})\s*(AM|PM)?/i);
  const ampm=tail.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\b/i);
  const zh=tail.match(/(凌晨|早上|上午|中午|下午|晚上)\s*(\d{1,2})(?:[:：](\d{2}))?/);
  if(colon){({hour,minute}=parseClock(colon[1],colon[2],colon[3]||''));explicit=true;}
  else if(ampm){({hour,minute}=parseClock(ampm[1],ampm[2]||0,ampm[3]));explicit=true;}
  else if(zh){hour=Number(zh[2]);minute=Number(zh[3]||0);explicit=true;if((zh[1]==='下午'||zh[1]==='晚上')&&hour<12)hour+=12;if((zh[1]==='凌晨'||zh[1]==='上午'||zh[1]==='早上')&&hour===12)hour=0;if(zh[1]==='中午'&&hour<11)hour+=12;}
  return explicit?toTaipeiIso(Number(m[1]),Number(m[2]),Number(m[3]),hour,minute):null;
}

export function extractGeneralSaleDateTime(text = "", fallbackYear = null) {
  const source=String(text);
  const patterns=[
    /(?:一般|正式|公開)售票(?:日期|時間)?\s*[：:]?\s*([^\n。]{4,140})/i,
    /全面(?:開賣|啟售)(?:日期|時間)?\s*[：:]?\s*([^\n。]{4,140})/i,
    /(?:售票|開賣|啟售)(?:日期|時間)\s*[：:]?\s*([^\n。]{4,140})/i,
    /(?:^|\s)啟售\s*[｜|:：]?\s*([^\n。]{4,140})/i,
    /General Sale(?:\s*(?:Date|Time))?\s*[：:]?\s*([^\n。]{4,140})/i,
    /Public Sale(?:\s*(?:Date|Time))?\s*[：:]?\s*([^\n。]{4,140})/i,
    /On[- ]Sale(?:\s*(?:Date|Time))?\s*[：:]?\s*([^\n。]{4,140})/i
  ];
  for(const re of patterns){
    const m=source.match(re);
    if(!m?.[1]) continue;
    let iso=parseEnglishDateTime(m[1])||parseNumericDateTime(m[1])||parseChineseDateTime(m[1]);
    if(!iso&&fallbackYear){
      const short=String(m[1]).match(/(?:^|\s)(\d{1,2})[\/.\-](\d{1,2})(?!\d)/);
      if(short){
        const tail=String(m[1]).slice((short.index||0)+short[0].length);
        let hour=0,minute=0,explicit=false;
        const colon=tail.match(/(\d{1,2})[:：](\d{2})\s*(AM|PM)?/i), ampm=tail.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\b/i), zh=tail.match(/(凌晨|早上|上午|中午|下午|晚上)\s*(\d{1,2})(?:[:：](\d{2}))?/);
        if(colon){({hour,minute}=parseClock(colon[1],colon[2],colon[3]||''));explicit=true;} else if(ampm){({hour,minute}=parseClock(ampm[1],ampm[2]||0,ampm[3]));explicit=true;} else if(zh){hour=Number(zh[2]);minute=Number(zh[3]||0);explicit=true;if((zh[1]==='下午'||zh[1]==='晚上')&&hour<12)hour+=12;if((zh[1]==='凌晨'||zh[1]==='上午'||zh[1]==='早上')&&hour===12)hour=0;if(zh[1]==='中午'&&hour<11)hour+=12;}
        if(explicit) iso=toTaipeiIso(Number(fallbackYear),Number(short[1]),Number(short[2]),hour,minute);
      }
    }
    if(iso) return {iso,raw:m[1].trim()};
  }
  return null;
}

function normalizedNeedlesForDate(iso) {
  if (!iso) return [];
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return [];
  const parts = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Taipei" }).formatToParts(d);
  const year = parts.find(x => x.type === "year")?.value;
  const monthName = parts.find(x => x.type === "month")?.value;
  const day = Number(parts.find(x => x.type === "day")?.value || 0);
  const month = d.toLocaleString("en-US", { month: "2-digit", timeZone: "Asia/Taipei" });
  return [
    `${monthName} ${day}, ${year}`,
    `${year}/${Number(month)}/${day}`,
    `${year}/${month}/${pad(day)}`,
    `${year}.${month}.${pad(day)}`,
    `${year}-${month}-${pad(day)}`
  ].filter(Boolean);
}

function compactVenueNeedles(venue = "") {
  const raw = String(venue).trim();
  const out = new Set([raw]);
  const ascii = raw.replace(/[^A-Za-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  if (ascii.length >= 4) out.add(ascii);
  for (const token of ["Taipei Dome", "Taipei Arena", "NTSU ARENA", "LINKOU ARENA", "NEXT TV"]) {
    if (raw.toLowerCase().includes(token.toLowerCase())) out.add(token);
  }
  return [...out].filter(x => x.length >= 4);
}

function containsAny(haystack, needles) {
  const h = String(haystack).toLowerCase();
  return needles.some(n => h.includes(String(n).toLowerCase()));
}


export function extractSectionPriceRules(text = "") {
  const compact = String(text).replace(/\s+/g, " ");
  const out = [];
  const seen = new Set();
  const patterns = [
    /((?:VIP|VVIP)(?:\s*[A-F0-9]+)?|ZONE\s*[A-Z0-9]+|[A-Z]\s*區|[A-Z]\d+(?:-\d+)?|特\s*\d+\s*區|[紅紫黃藍綠橙]\s*\d[A-Z]?|\dF(?:-[A-Z0-9]+)?|\d樓(?:[A-Z0-9-]+)?)[\s:：\-–—]*(?:NT\$|NTD|TWD)?\s*([0-9][0-9,]{2,})/gi,
    /((?:VIP|VVIP)|搖滾[ABC]?區|平面[ABC]?區|看台[ABC]?區)[\s:：\-–—]*(?:NT\$|NTD|TWD)?\s*([0-9][0-9,]{2,})/gi
  ];
  for (const re of patterns) {
    for (const m of compact.matchAll(re)) {
      const label = m[1].replace(/\s+/g, " ").trim();
      const amount = m[2].replace(/,/g, "");
      const key = `${label.toLowerCase()}-${amount}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ label, price: `NT$${Number(amount).toLocaleString('en-US')}` });
      if (out.length >= 40) return out;
    }
  }
  return out;
}

function extractBetween(text, startRegex, endRegex, max = 220) {
  const m = text.match(startRegex);
  if (!m) return null;
  const start = m.index + m[0].length;
  const tail = text.slice(start, start + max);
  const end = tail.search(endRegex);
  return (end >= 0 ? tail.slice(0, end) : tail).replace(/\s+/g, " ").trim().replace(/^[:：\-–]+\s*/, "");
}

export function parseLiveNation(html, seed) {
  const text = htmlToText(html);
  const patch = {};
  const sectionPriceRules = extractSectionPriceRules(text);
  if (sectionPriceRules.length) patch.sectionPriceRules = sectionPriceRules;
  const seatLayoutSourceUrl = extractOfficialSeatLayoutUrl(html, seed?.sourceUrl || 'https://www.livenation.com.tw/en');
  if (seatLayoutSourceUrl) patch.seatLayoutSourceUrl = seatLayoutSourceUrl;
  const timeBlock = extractBetween(text, /(?:●\s*)?TIME\s*[:：]/i, /(?:●\s*)?VENUE\s*[:：]|(?:●\s*)?PRICE\s*[:：]|➤/i, 120);
  const parsedStart = parseNumericDateTime(timeBlock || "");
  if (parsedStart) {
    const hasExplicitClock = /(?:\d{1,2}:\d{2}|\d{1,2}\s*(?:AM|PM)\b)/i.test(timeBlock || "");
    if (!hasExplicitClock && seed.start) {
      const seedClock = String(seed.start).match(/T(\d{2}):(\d{2})/);
      patch.start = seedClock ? parsedStart.replace(/T\d{2}:\d{2}/, `T${seedClock[1]}:${seedClock[2]}`) : parsedStart;
    } else patch.start = parsedStart;
  }

  const venue = extractBetween(text, /(?:●\s*)?VENUE\s*[:：]/i, /(?:●\s*)?PRICE\s*[:：]|➤|\n/i, 140);
  if (venue && venue.length <= 120) patch.venue = venue;

  const price = extractBetween(text, /(?:●\s*)?PRICE\s*[:：]/i, /(?:●\s*)?For\s+Limit|➤|\n/i, 240);
  if (price && /NT\$|NTD|\d[,\d]{2,}/i.test(price)) patch.price = price.replace(/\s*&\s*/g, " / ");

  const saleMatch = text.match(/General Sale[\s\S]{0,100}?(20\d{2})[\/.](\d{1,2})[\/.](\d{1,2})[^\d]{0,15}(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i)
    || text.match(/On sale:\s*(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)?,?\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s*(20\d{2}),?\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (saleMatch) {
    if (/^20\d{2}$/.test(saleMatch[1])) {
      const clock = parseClock(saleMatch[4], saleMatch[5] || 0, saleMatch[6] || "");
      patch.generalSale = toTaipeiIso(Number(saleMatch[1]), Number(saleMatch[2]), Number(saleMatch[3]), clock.hour, clock.minute);
    } else {
      const month = MONTHS[saleMatch[1].toLowerCase()];
      const clock = parseClock(saleMatch[4], saleMatch[5] || 0, saleMatch[6] || "");
      patch.generalSale = toTaipeiIso(Number(saleMatch[3]), month, Number(saleMatch[2]), clock.hour, clock.minute);
    }
  }

  if (/On sale soon/i.test(text)) patch.ticketStatus = "ON SALE SOON";
  else if (/Tickets?\s+available|On sale now|Buy Tickets/i.test(text)) patch.ticketStatus = "ON SALE";
  if (/tixcraft is the only officially authorized ticketing platform/i.test(text)) patch.ticketing = "tixCraft 拓元";

  const dateOk = containsAny(text, normalizedNeedlesForDate(patch.start || seed.start));
  const venueOk = containsAny(text, compactVenueNeedles(patch.venue || seed.venue));
  return {
    patch,
    check: {
      status: dateOk && venueOk ? "live" : "review",
      dateOk,
      venueOk,
      titleOk: text.toLowerCase().includes(String(seed.artist).toLowerCase()),
      message: dateOk && venueOk ? "官方活動頁已連線" : "官方頁面內容可能已調整"
    }
  };
}

export function parseWeverse(html, seed) {
  const text = htmlToText(html);
  const patch = {};
  const sectionPriceRules = extractSectionPriceRules(text);
  if (sectionPriceRules.length) patch.sectionPriceRules = sectionPriceRules;
  const seatLayoutSourceUrl = extractOfficialSeatLayoutUrl(html, seed?.sourceUrl || 'https://weverse.io');
  if (seatLayoutSourceUrl) patch.seatLayoutSourceUrl = seatLayoutSourceUrl;
  const venueMatch = text.match(/Venue\s*:\s*([^\n]{3,100})/i);
  if (venueMatch) patch.venue = venueMatch[1].replace(/\s*(Ticketing Site|General On-Sale).*$/i, "").trim();

  const ticketMatch = text.match(/Ticketing Site\s*:\s*([^\n]{2,80})/i);
  if (ticketMatch) patch.ticketing = ticketMatch[1].replace(/\s*General On-Sale.*$/i, "").trim();

  const saleMatch = text.match(/General On-Sale\s*:\s*([^\n]{5,120})/i);
  if (saleMatch) {
    const iso = parseEnglishDateTime(saleMatch[1]) || parseNumericDateTime(saleMatch[1]);
    if (iso) patch.generalSale = iso;
  }

  const dateText = text.match(/(?:Additional Show Date & Time|Date(?:\s*&\s*Time)?)\s*:\s*([^\n]{5,140})/i)?.[1] || "";
  const parsedStart = parseEnglishDateTime(dateText) || parseNumericDateTime(dateText);
  if (parsedStart) patch.start = parsedStart;

  const dateOk = containsAny(text, normalizedNeedlesForDate(patch.start || seed.start));
  const venueOk = containsAny(text, compactVenueNeedles(patch.venue || seed.venue));
  const titleOk = text.toLowerCase().includes(String(seed.artist).toLowerCase()) || text.toLowerCase().includes(String(seed.title).toLowerCase().slice(0, 24));
  return {
    patch,
    check: {
      status: dateOk && venueOk ? "live" : "review",
      dateOk,
      venueOk,
      titleOk,
      message: dateOk && venueOk ? "官方公告已連線" : "官方公告內容可能已調整"
    }
  };
}

function sourceKind(url = "") {
  try {
    const host = new URL(url).hostname;
    if (host.includes("livenation.com.tw")) return "livenation";
    if (host.includes("weverse.io")) return "weverse";
    if (/tixcraft\.com|kktix\.cc|kktix\.com|ticketplus\.com\.tw|kham\.com\.tw|ibon\.com\.tw|famiticket\.com\.tw|udnfunlife\.com|mna\.com\.tw|ticket\.com\.tw/i.test(host)) return "ticket";
  } catch {}
  return "generic";
}

function parseTicketPage(html, seed, url='') {
  const text=htmlToText(html), patch={};
  const seatLayoutSourceUrl=extractOfficialSeatLayoutUrl(html,url);
  if(seatLayoutSourceUrl) patch.seatLayoutSourceUrl=seatLayoutSourceUrl;
  const sectionPriceRules=extractSectionPriceRules(text); if(sectionPriceRules.length) patch.sectionPriceRules=sectionPriceRules;
  const prices=[...new Set((text.match(/(?:NT\$|TWD\$?|\$)\s*[\d,]{3,6}/gi)||[]).map(x=>x.replace(/TWD/ig,'NT').replace(/\s+/g,'')))];
  if(prices.length>=2) patch.price=prices.slice(0,12).join(' / ');
  const sale=extractGeneralSaleDateTime(text,String(seed.start||"").slice(0,4));
  if(sale?.iso){patch.generalSale=sale.iso;patch.saleSourceText=sale.raw;}
  if(/(?:售罄|完售|sold\s*out)/i.test(text)) patch.ticketStatus='SOLD OUT';
  else if(/(?:立即購票|立即訂購|開始售票|現正熱賣|on sale now|buy tickets?)/i.test(text)) patch.ticketStatus='ON SALE';
  else if(sale?.iso && new Date(sale.iso).getTime()>Date.now()) patch.ticketStatus='ON SALE SOON';
  const dateOk=containsAny(text, normalizedNeedlesForDate(seed.start));
  const venueOk=containsAny(text, compactVenueNeedles(seed.venue));
  const titleOk=text.toLowerCase().includes(String(seed.artist||'').toLowerCase()) || text.toLowerCase().includes(String(seed.title||'').toLowerCase().slice(0,18));
  return {patch,check:{status:(dateOk||titleOk)&&venueOk?'live':'review',dateOk,venueOk,titleOk,saleDateOk:Boolean(sale?.iso),message:(dateOk||titleOk)&&venueOk?'官方售票頁已連線':'官方售票頁內容可能已調整'}};
}

export async function monitorOfficialSource(seed, { fetchImpl = fetch, timeoutMs = 4500 } = {}) {
  const refUrls=(seed.sourceRefs||[]).flatMap(ref=>[ref?.url,ref?.sourceUrl]);
  const urls=[seed.sourceUrl,seed.ticketUrl,seed.ticketSourceUrl,seed.secondarySourceUrl,seed.autoSourceUrl,...refUrls].filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i);
  const supportedUrls=urls.filter(u=>["livenation","weverse","ticket"].includes(sourceKind(u)));
  if(!supportedUrls.length) return {eventId:seed.id,sourceUrl:seed.sourceUrl||null,sourceName:seed.sourceName,kind:"generic",supported:false,patch:{},check:{status:"unsupported",message:"此來源暫採索引掃描"}};
  const startedAt=Date.now(), mergedPatch={}, checks=[];
  const settled=await Promise.allSettled(supportedUrls.map(async url=>{
    const kind=sourceKind(url); const response=await fetchImpl(url,{headers:{"Accept":"text/html,application/xhtml+xml","Accept-Language":"zh-TW,zh;q=0.9,en;q=0.8","User-Agent":"NEUL/0.40 (+public-event-monitor)"},redirect:"follow",signal:AbortSignal.timeout(timeoutMs)});
    if(!response.ok) throw new Error(`HTTP ${response.status}`); const html=await response.text();
    const parsed=kind==="livenation"?parseLiveNation(html,{...seed,sourceUrl:url}):kind==="weverse"?parseWeverse(html,{...seed,sourceUrl:url}):parseTicketPage(html,seed,url);
    return {url,kind,parsed};
  }));
  for(const result of settled){
    if(result.status!=="fulfilled"){checks.push({status:"unreachable",message:result.reason?.message||"source unavailable"});continue;}
    const {parsed}=result.value; Object.assign(mergedPatch,parsed.patch||{}); checks.push(parsed.check||{});
  }
  const live=checks.some(c=>c.status==="live"), review=checks.some(c=>c.status==="review");
  return {eventId:seed.id,sourceUrl:seed.sourceUrl||supportedUrls[0],sourceName:seed.sourceName,kind:"multi-source",supported:true,checkedAt:new Date().toISOString(),latencyMs:Date.now()-startedAt,patch:{...mergedPatch,checkedAt:new Date().toISOString()},check:{status:live?"live":review?"review":"unreachable",message:live?"官方主辦／售票來源已同步":review?"官方來源內容可能已調整":"暫時無法連線官方來源",sourcesChecked:supportedUrls.length}};
}
