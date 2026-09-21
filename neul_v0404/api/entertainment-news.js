const CATEGORIES = {
  kr: {
    label: "韓星",
    query: '(K-pop OR KPOP OR 韓星 OR 韓團 OR 韓國藝人 OR 韓國歌手 OR 韓國演員)'
  },
  tw: {
    label: "台灣",
    query: '(台灣藝人 OR 台灣歌手 OR 台灣演員 OR 台灣娛樂 OR 華語歌手)'
  },
  west: {
    label: "歐美",
    query: '(Hollywood OR celebrity OR "pop star" OR "music artist" OR 歐美藝人 OR 歐美歌手)'
  },
  jp: {
    label: "日本",
    query: '(J-pop OR JPOP OR 日本藝人 OR 日本歌手 OR 日本演員 OR 日本樂團 OR 日本偶像)'
  },
  other: {
    label: "其他",
    query: '(泰國藝人 OR 泰國歌手 OR 香港藝人 OR 香港歌手 OR 亞洲娛樂) -JPOP -J-pop -日本藝人 -日本歌手'
  }
};

function decodeXml(value = "") {
  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code) => {
      try { return String.fromCodePoint(code[0].toLowerCase() === "x" ? parseInt(code.slice(1), 16) : parseInt(code, 10)); }
      catch { return ""; }
    })
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
}

function stripHtml(value = "") {
  return decodeXml(String(value).replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ").trim();
}
function tag(block, name) {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
  return m ? decodeXml(m[1]).trim() : "";
}
function attrTag(block, name) {
  const m = block.match(new RegExp(`<${name}\\b([^>]*)>([\\s\\S]*?)<\\/${name}>`, "i"));
  if (!m) return { text: "", attrs: "" };
  return { text: stripHtml(m[2]), attrs: m[1] || "" };
}
function safeHttpUrl(raw = "") {
  try { const u = new URL(decodeXml(raw)); return /^https?:$/.test(u.protocol) ? u.href : ""; } catch { return ""; }
}
function normalizeTitle(title = "", source = "") {
  const clean = stripHtml(title);
  if (!source) return clean;
  const suffix = ` - ${source}`;
  return clean.endsWith(suffix) ? clean.slice(0, -suffix.length).trim() : clean;
}
function parseFeed(xml = "") {
  const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];
  return items.map(block => {
    const sourceTag = attrTag(block, "source");
    const source = sourceTag.text || "新聞來源";
    const title = normalizeTitle(tag(block, "title"), source);
    const url = safeHttpUrl(tag(block, "link") || tag(block, "guid"));
    const publishedAt = tag(block, "pubDate");
    const description = stripHtml(tag(block, "description"));
    if (!title || !url) return null;
    return { title, url, source, publishedAt, summary: description.slice(0, 180) };
  }).filter(Boolean);
}
function dedupe(items = []) {
  const seen = new Set();
  return items.filter(item => {
    const key = item.title.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}
function cleanSearch(value = "") {
  return String(value).replace(/[<>"'`]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  const category = CATEGORIES[req.query.category] ? req.query.category : "kr";
  const extra = cleanSearch(req.query.q || "");
  const base = CATEGORIES[category];
  const query = `${base.query}${extra ? ` ${extra}` : ""} when:14d`;
  const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;
  try {
    const response = await fetch(feedUrl, {
      headers: { "User-Agent": "Mozilla/5.0 NEUL/0.40.4", "Accept": "application/rss+xml, application/xml, text/xml;q=0.9,*/*;q=0.5" },
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error(`RSS_${response.status}`);
    const xml = await response.text();
    const results = dedupe(parseFeed(xml)).slice(0, 12);
    res.setHeader("Cache-Control", "public, s-maxage=900, stale-while-revalidate=3600");
    return res.status(200).json({ category, label: base.label, query: extra, fetchedAt: new Date().toISOString(), results });
  } catch (error) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({ category, label: base.label, query: extra, fetchedAt: new Date().toISOString(), results: [], error: "NEWS_SOURCE_UNAVAILABLE" });
  }
}
