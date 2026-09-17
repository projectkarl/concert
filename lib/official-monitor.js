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
  'livenation.com.tw','tixcraft.com','static.tixcraft.com','kktix.com','ibon.com.tw','ticketplus.com.tw',
  'tickets.udnfunlife.com','ticket.com.tw','famiticket.com.tw','kham.com.tw','weverse.io'
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

export function extractOfficialSeatLayoutUrl(html='', baseUrl='') {
  const candidates=[];
  const source=String(html);
  const score=(url,context='')=>{
    const hay=`${url} ${context}`.toLowerCase();
    let n=0;
    if (/seat\s*map|seating|seatmap|field|venue\s*map|座位|票區|座席|場地圖|配置圖|平面圖/.test(hay)) n+=5;
    if (/map|seat|field|plan/.test(url.toLowerCase())) n+=2;
    if (/\.(?:png|jpe?g|webp|pdf)(?:\?|$)/i.test(url)) n+=2;
    if (/static\.tixcraft\.com|tixcraft\.com|kktix\.com|ticketplus\.com\.tw/.test(url)) n+=1;
    return n;
  };
  const tagRe=/<(?:a|img)\b[^>]*(?:href|src)\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?<\/(?:a)>|)/gi;
  for (const m of source.matchAll(tagRe)) {
    const url=officialishUrl(m[1],baseUrl); if(!url) continue;
    const context=m[0].slice(0,700);
    candidates.push({url,score:score(url,context)});
  }
  const rawUrlRe=/https?:\/\/[^\s"'<>]+/gi;
  for (const raw of source.match(rawUrlRe)||[]) {
    const url=officialishUrl(raw.replace(/&amp;/g,'&'),baseUrl); if(!url) continue;
    const i=source.indexOf(raw); const context=i>=0?source.slice(Math.max(0,i-180),i+raw.length+180):'';
    candidates.push({url,score:score(url,context)});
  }
  candidates.sort((a,b)=>b.score-a.score);
  return candidates[0]?.score>=5 ? candidates[0].url : null;
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


function extractSectionPriceRules(text = "") {
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
  } catch {}
  return "generic";
}

export async function monitorOfficialSource(seed, { fetchImpl = fetch, timeoutMs = 4500 } = {}) {
  const url = seed.sourceUrl;
  const kind = sourceKind(url);
  if (!url || !["livenation", "weverse"].includes(kind)) {
    return { eventId: seed.id, sourceUrl: url || null, sourceName: seed.sourceName, kind, supported: false, patch: {}, check: { status: "unsupported", message: "此來源暫採人工核對" } };
  }
  const startedAt = Date.now();
  try {
    const response = await fetchImpl(url, {
      headers: {
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
        "User-Agent": "NEUL/0.7 (+public-event-monitor)"
      },
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const parsed = kind === "livenation" ? parseLiveNation(html, seed) : parseWeverse(html, seed);
    return {
      eventId: seed.id,
      sourceUrl: url,
      sourceName: seed.sourceName,
      kind,
      supported: true,
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      patch: { ...parsed.patch, checkedAt: new Date().toISOString() },
      check: parsed.check
    };
  } catch (error) {
    return {
      eventId: seed.id,
      sourceUrl: url,
      sourceName: seed.sourceName,
      kind,
      supported: true,
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      patch: {},
      check: { status: "unreachable", message: "暫時無法連線官方頁面", error: error.message }
    };
  }
}
