import { seedEvents } from "./data/events.js";
import { seedArtists } from "./data/artists.js";
import { venueModels, venueLayouts, layoutsForVenue, getVenueModel, getVenueLayout, getVenueTier, getVenueSection, venueSectionPosition, venueSectionWarning, sectionTicketLabel, venueIdFromName, effectiveTiers, effectiveSections, ensureAutoEventLayout, ensureVenueModelForEvent, applyAutoSeatMapAnalysis, baseLayoutIdForVenue } from "./data/multi-venue-geometry.js";
import { createVenueWebGL } from "./webgl-venue.js";
import { analyzeSeatMap, canAnalyzeSeatMap } from "./seat-map-intelligence.js";
import { saveFollowed, saveMode, recordEventChanges, saveOfflineSnapshot, loadFollowed } from "./storage.js";
import { ticketSaleLifecycle } from "./lib/ticket-lifecycle.js";

const $ = (q, root = document) => root.querySelector(q);
const $$ = (q, root = document) => [...root.querySelectorAll(q)];
const uiLocale = () => window.NEUL_I18N?.locale?.() || 'zh-TW';
const state = {
  events: seedEvents.filter(e => e?.region === "TW"),
  artists: seedArtists.map(a => ({ ...a, upcomingEventCount: 0, nextEvent: null, eventIds: [] })),
  dataUpdatedAt: null,
  nextUpdateAt: null,
  autoUpdateEnabled: true,
  upstream: "curated-fallback",
  coverage: null,
  discoveryHealth: null,
  officialUpdatedAt: null,
  officialMonitorCount: 0,
  query: "",
  type: "ALL",
  region: "TW",
  city: "ALL",
  archiveMode: false,
  visibleEventLimit: 5,
  followed: new Set(JSON.parse(localStorage.getItem("neul-followed") || localStorage.getItem("stan-followed") || '["Stray Kids","aespa","PLAVE","NCT 127"]')),
  detailId: null,
  venueId: "taipei-dome",
  floor: "LOWER",
  section: "106",
  row: "18",
  seatNumber: "",
  viewerHeight: 160,
  posture: "seated",
  lens: "eye",
  layoutId: "skz-run-it-2026",
  featuredId: "skz-run-it-taipei-2026",
  featuredIndex: 0
};

const fmtDate = (iso, rangeEnd = null) => {
  if (!iso) return "日期待公布";
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat(uiLocale(), { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short", timeZone: "Asia/Taipei" }).formatToParts(d);
  const get = t => parts.find(x => x.type === t)?.value || "";
  let out = `${get("year")}.${get("month")}.${get("day")} (${get("weekday").replace("週", "")})`;
  if (rangeEnd) {
    const e = new Date(rangeEnd);
    const end = new Intl.DateTimeFormat(uiLocale(), { month: "2-digit", day: "2-digit", timeZone: "Asia/Taipei" }).format(e).replace("/", ".");
    out = `${get("year")}.${get("month")}.${get("day")}–${end}`;
  }
  return out;
};
const fmtTime = iso => iso ? new Intl.DateTimeFormat(uiLocale(), { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Taipei" }).format(new Date(iso)) : "";
const fmtEventTime = event => {
  if (!event?.start) return "";
  const m = String(event.start).match(/T(\d{2}):(\d{2})/);
  if (m && m[1] === "00" && m[2] === "00" && event.timeConfirmed !== true) return "時間待公告";
  return fmtTime(event.start);
};
const escapeHtml = (v = "") => String(v).replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
const safeUrl = v => { try { const u = new URL(v); return /^https?:$/.test(u.protocol) ? u.href : "#"; } catch { return "#"; } };
const friendlySourceName = value => {
  const v = String(value || "官方活動來源");
  if (/official event source/i.test(v)) return "官方活動來源";
  return v.replace(/\s*API\s*/gi, " ").trim();
};


function normalizeSourceUrl(value="") {
  try {
    const u=new URL(value);
    u.hash="";
    for(const key of [...u.searchParams.keys()]) if(/^(?:utm_.+|fbclid|gclid|ref)$/i.test(key)) u.searchParams.delete(key);
    return u.href.replace(/\/$/,"");
  } catch { return ""; }
}
function sourceRoleFor(event={}, url="", fallback="") {
  const normalized=normalizeSourceUrl(url);
  const seat=normalizeSourceUrl(event.seatLayoutSourceUrl||"");
  const primary=normalizeSourceUrl(event.sourceUrl||"");
  const secondary=normalizeSourceUrl(event.secondarySourceUrl||"");
  if(seat && normalized===seat) return "官方座位圖 · Section / 3D 校正";
  if(primary && normalized===primary) return event.price && !/依.*公告|tba/i.test(String(event.price)) ? "活動資訊 · 售票 · 價位" : "活動資訊 · 售票";
  if(secondary && normalized===secondary) return "補充公告 · 主辦 / 藝人 / 場館核對";
  const host=(()=>{try{return new URL(url).hostname.toLowerCase()}catch{return ""}})();
  if(/tixcraft|kktix|ticketplus|kham|ibon|famiticket|udnfunlife|ticket\.mna|ticket\.com\.tw|opentix|tixfun|fansi|indievox|books\.com\.tw/.test(host)) return "官方售票 / 活動資料";
  if(/livenation/.test(host)) return "主辦 / 活動公告";
  if(/weverse|ygfamily|jype|smtown|hybe/.test(host)) return "藝人官方公告";
  if(/arena|stadium|tmc|ticc|kph|gov\.tw|edu\.tw/.test(host)) return "場館 / 3D 校正";
  return fallback || "活動資料核對";
}
function eventSourceEntries(event={}) {
  const out=[]; const seen=new Set();
  const add=(name,url,role)=>{
    const safe=normalizeSourceUrl(url); if(!safe||safe==="#"||seen.has(safe)) return;
    seen.add(safe); out.push({name:friendlySourceName(name||"官方來源"),url:safe,role:role||sourceRoleFor(event,safe)});
  };
  add(event.sourceName||event.ticketing,event.sourceUrl,sourceRoleFor(event,event.sourceUrl));
  for(const ref of (event.sourceRefs||[])) add(ref?.name||"官方來源",ref?.url,sourceRoleFor(event,ref?.url));
  add("補充官方公告",event.secondarySourceUrl,"補充公告 · 主辦 / 藝人 / 場館核對");
  add("官方座位配置",event.seatLayoutSourceUrl,"官方座位圖 · Section / 3D 校正");
  add(event.autoSourceName||"自動發現來源",event.autoSourceUrl,"自動發現 / 交叉比對");
  try {
    const model=getVenueModel(eventVenueModelId(event));
    if(model?.sourceUrl) add(model.sourceName||"場館官方資料",model.sourceUrl,"場館幾何 · 3D 基準校正");
    const layout=getVenueLayout(eventVenueLayoutId(event));
    if(layout?.sourceUrl) add(layout.sourceName||"本場 3D 配置來源",layout.sourceUrl,layout.seatMapDetected?"本場座位圖 · 3D 客製校正":"本場 3D 配置參考");
  } catch {}
  return out.slice(0,8);
}
function sourceInfoTriggerMarkup(event={}, extraClass="") {
  const count=eventSourceEntries(event).length;
  return `<span class="source-info-trigger ${escapeHtml(extraClass)}" data-source-info-event="${escapeHtml(event.id||"")}" aria-label="查看目前活動資料來源" title="資料來源 ${count ? `${count} 項` : "資訊"}">i</span>`;
}
let sourceInfoPopover=null, sourceInfoCloseTimer=null, sourceInfoEventId="";
function ensureSourceInfoPopover(){
  if(sourceInfoPopover) return sourceInfoPopover;
  sourceInfoPopover=document.createElement("div");
  sourceInfoPopover.className="source-info-popover";
  sourceInfoPopover.hidden=true;
  sourceInfoPopover.setAttribute("role","dialog");
  sourceInfoPopover.setAttribute("aria-label","目前活動資料來源");
  document.body.appendChild(sourceInfoPopover);
  sourceInfoPopover.addEventListener("mouseenter",()=>clearTimeout(sourceInfoCloseTimer));
  sourceInfoPopover.addEventListener("mouseleave",scheduleSourceInfoClose);
  sourceInfoPopover.addEventListener("click",e=>e.stopPropagation());
  return sourceInfoPopover;
}
function sourceInfoQualityLabel(event={}){
  try{
    const q=eventCustom3DMeta(event);
    if(q.officialMapVerified) return q.priceMapped3D ? "3D：官方座位圖與價位已對照" : "3D：官方座位圖已對照";
    if(q.officialSeatMap) return "3D：已取得官方座位圖，待完整校正";
    return "3D：場館衍生草稿，待官方圖校正";
  }catch{return "";}
}
function openSourceInfoPopover(trigger,event){
  if(!trigger||!event) return;
  clearTimeout(sourceInfoCloseTimer);
  const pop=ensureSourceInfoPopover(); const entries=eventSourceEntries(event);
  sourceInfoEventId=event.id||"";
  pop.innerHTML=`<div class="source-info-head"><b>目前活動資料來源</b><span>${entries.length} 項</span></div><div class="source-info-event">${escapeHtml(event.artist)} · ${escapeHtml(event.title||"")}</div><div class="source-info-list">${entries.length?entries.map(x=>`<a href="${safeUrl(x.url)}" target="_blank" rel="noopener noreferrer"><strong>${escapeHtml(x.name)}</strong><small>${escapeHtml(x.role)}</small><em>↗</em></a>`).join(""):`<div class="source-info-empty">目前僅有已核對的活動資料，尚未保留可開啟來源網址。</div>`}</div><div class="source-info-quality">${escapeHtml(sourceInfoQualityLabel(event))}</div>`;
  pop.hidden=false; pop.classList.add("open");
  const mobile=window.innerWidth<=620;
  if(mobile){pop.style.left="12px";pop.style.right="12px";pop.style.top="auto";pop.style.bottom="calc(14px + env(safe-area-inset-bottom))";pop.style.width="auto";}
  else{
    const r=trigger.getBoundingClientRect(), width=Math.min(340,window.innerWidth-24);
    const left=Math.max(12,Math.min(r.left-width/2+r.width/2,window.innerWidth-width-12));
    let top=r.bottom+8; if(top+300>window.innerHeight) top=Math.max(12,r.top-288);
    Object.assign(pop.style,{left:`${left}px`,right:"auto",top:`${top}px`,bottom:"auto",width:`${width}px`});
  }
}
function closeSourceInfoPopover(){ if(!sourceInfoPopover)return; sourceInfoPopover.classList.remove("open"); sourceInfoPopover.hidden=true; sourceInfoEventId=""; }
function scheduleSourceInfoClose(){ clearTimeout(sourceInfoCloseTimer); sourceInfoCloseTimer=setTimeout(closeSourceInfoPopover,160); }
function wireSourceInfoTriggers(root=document){
  $$('[data-source-info-event]',root).forEach(trigger=>{
    if(trigger.dataset.sourceInfoWired==="1") return; trigger.dataset.sourceInfoWired="1";
    const getEvent=()=>state.events.find(x=>x.id===trigger.dataset.sourceInfoEvent);
    trigger.addEventListener("mouseenter",()=>openSourceInfoPopover(trigger,getEvent()));
    trigger.addEventListener("mouseleave",scheduleSourceInfoClose);
    trigger.addEventListener("click",ev=>{ev.preventDefault();ev.stopPropagation(); const event=getEvent(); if(sourceInfoPopover&&!sourceInfoPopover.hidden&&sourceInfoEventId===event?.id) closeSourceInfoPopover(); else openSourceInfoPopover(trigger,event);});
  });
}
document.addEventListener("click",e=>{if(sourceInfoPopover&&!sourceInfoPopover.hidden&&!e.target.closest('.source-info-popover')&&!e.target.closest('[data-source-info-event]')) closeSourceInfoPopover();});
window.addEventListener("resize",()=>{if(sourceInfoPopover&&!sourceInfoPopover.hidden) closeSourceInfoPopover();});

const TAIWAN_VENUE_CITIES = new Set(["Taipei","New Taipei","Taoyuan","Taichung","Tainan","Kaohsiung","Hsinchu","Keelung","Chiayi","Pingtung","Yilan","Hualien","Taitung","Penghu"]);
const taiwanEventsOnly = events => (Array.isArray(events) ? events : []).filter(e => e?.region === "TW");
const taiwanVenueModels = () => Object.values(venueModels).filter(v => TAIWAN_VENUE_CITIES.has(String(v.city || "")));

const TAIPEI_TZ = "Asia/Taipei";
const dayMs = 86400000;


function eventSessionTs(session, event={}) {
  if (!session?.date) return NaN;
  const date=String(session.date).replaceAll('/','-');
  const time=String(session.time||'23:59').padStart(5,'0');
  const d=new Date(`${date}T${time.length===5?time:'23:59'}:00+08:00`);
  return d.getTime();
}
function isMidnightIso(iso='') { return /T00:00(?::00)?(?:\+08:00|Z)?$/i.test(String(iso)); }
function endOfTaipeiDayTs(iso='') {
  const d=new Date(iso); if(!Number.isFinite(d.getTime())) return NaN;
  const key=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:TAIPEI_TZ}).format(d);
  return new Date(`${key}T23:59:59+08:00`).getTime();
}
function eventEffectiveEndTs(event={}) {
  const sessionTs=(event.sessions||[]).map(x=>eventSessionTs(x,event)).filter(Number.isFinite);
  if(sessionTs.length) return Math.max(...sessionTs) + 6*3600000;
  if(event.end){
    const raw=new Date(event.end).getTime();
    if(Number.isFinite(raw)) return isMidnightIso(event.end) ? endOfTaipeiDayTs(event.end) : raw + 6*3600000;
  }
  const start=new Date(event.start||0).getTime();
  if(!Number.isFinite(start)) return NaN;
  if(event.timeConfirmed===false || isMidnightIso(event.start)) return endOfTaipeiDayTs(event.start);
  return start + 6*3600000;
}
function eventLifecycle(event={}, now=Date.now()) {
  const startTs=new Date(event.start||0).getTime(), endTs=eventEffectiveEndTs(event);
  if(event.historical) return {state:'ended',ended:true,active:false,upcoming:false,startTs,endTs};
  if(Number.isFinite(startTs) && now < startTs) return {state:'upcoming',ended:false,active:false,upcoming:true,startTs,endTs};
  if(Number.isFinite(endTs) && now <= endTs) return {state:'active',ended:false,active:true,upcoming:false,startTs,endTs};
  return {state:'ended',ended:true,active:false,upcoming:false,startTs,endTs};
}


function relativeTime(iso) {
  if (!iso) return "";
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return "";
  const diff = ts - Date.now();
  const abs = Math.abs(diff);
  const future = diff >= 0;
  if (abs < 3600000) {
    const mins = Math.max(1, Math.round(abs / 60000));
    return future ? `${mins} 分鐘後` : `${mins} 分鐘前`;
  }
  if (abs < dayMs) {
    const hrs = Math.max(1, Math.round(abs / 3600000));
    return future ? `${hrs} 小時後` : `${hrs} 小時前`;
  }
  const days = Math.max(1, Math.ceil(abs / dayMs));
  return future ? `${days} 天後` : `${days} 天前`;
}

function eventBadge(event) {
  const now=Date.now(), life=eventLifecycle(event,now);
  if (event?.historical || life.ended) return "已結束";
  if (life.active) return "演出進行中";
  const sale=ticketSaleLifecycle(event,now);
  const startTs = new Date(event.start || 0).getTime();
  if (sale.state==='pre-sale') return `搶票 ${relativeTime(new Date(sale.saleTs).toISOString())}`;
  if (sale.state==='sale-day') return "今日開賣";
  if (Number.isFinite(startTs) && startTs >= now && startTs - now <= 7 * dayMs) return "本週登場";
  if (sale.state==='post-sale-day' && Number.isFinite(startTs) && startTs > now) return "已開賣";
  return event.statusLabel || event.type || "活動";
}

function nextAction(event) {
  if (event?.historical || eventLifecycle(event).ended) return { label: "歷史案例", value: "活動已結束 · 已自動移入 Archive" };
  const now = Date.now();
  const startTs = new Date(event.start || 0).getTime();
  const sale=ticketSaleLifecycle(event,now);
  if (sale.state==='pre-sale') {
    return { label: "下一步：搶票倒數", value: `${fmtDate(new Date(sale.saleTs).toISOString())} ${fmtTime(new Date(sale.saleTs).toISOString())} · ${relativeTime(new Date(sale.saleTs).toISOString())}` };
  }
  if (sale.state==='sale-day') return {label:"今日開賣",value:"今天為官方售票日；售票狀態與餘票請以官方售票頁為準"};
  if (Number.isFinite(startTs) && startTs > now) {
    return { label: "下一步：演出倒數", value: `${fmtDate(event.start, event.end)}${event.end ? "" : ` ${fmtEventTime(event)}`} · ${relativeTime(event.start)}` };
  }
  return { label: "活動狀態", value: "請回官方來源確認最新公告" };
}


function rebuildArtistStats() {
  const seedMap = new Map(seedArtists.map(a => [a.name.toLowerCase(), { ...a }]));
  const oldMap = new Map(state.artists.map(a => [String(a.name).toLowerCase(), { ...a }]));
  const map = new Map();
  for (const event of state.events) {
    const key = String(event.artist || "").toLowerCase();
    if (!key) continue;
    const base = map.get(key) || oldMap.get(key) || seedMap.get(key) || event.artistProfile || {
      id: `auto-${key.replace(/[^a-z0-9]+/g, "-")}`,
      name: event.artist,
      shortName: event.shortArtist || event.artist.slice(0, 3).toUpperCase(),
      type: "ARTIST",
      market: "INTL",
      sourceName: event.sourceName || "官方活動來源",
      officialUrl: event.sourceUrl || null,
      verified: Boolean(event.verified)
    };
    const current = map.get(key) || { ...base, upcomingEventCount: 0, nextEvent: null, eventIds: [] };
    current.eventIds = [...new Set([...(current.eventIds || []), event.id])];
    const future = event.start && new Date(event.start).getTime() >= Date.now() - 86400000;
    if (future) current.upcomingEventCount = (current.upcomingEventCount || 0) + 1;
    if (future && (!current.nextEvent || new Date(event.start) < new Date(current.nextEvent.start))) {
      current.nextEvent = { id: event.id, title: event.title, start: event.start, end: event.end || null, venue: event.venue, city: event.city, statusLabel: event.statusLabel, sourceUrl: event.sourceUrl };
    }
    current.updatedAt = event.checkedAt || current.updatedAt || state.dataUpdatedAt;
    map.set(key, current);
  }
  for (const [key, artist] of oldMap) if (!map.has(key)) map.set(key, artist);
  state.artists = [...map.values()].sort((a, b) => {
    if (a.nextEvent && b.nextEvent) return new Date(a.nextEvent.start) - new Date(b.nextEvent.start);
    if (a.nextEvent) return -1;
    if (b.nextEvent) return 1;
    return a.name.localeCompare(b.name);
  });
}

function applyOfficialResults(data) {
  if (!Array.isArray(data?.results)) return;
  let changed = false;
  const byId = new Map(data.results.map(x => [x.eventId, x]));
  state.events = state.events.map(event => {
    const result = byId.get(event.id);
    if (!result) return event;
    const patch = result.check?.status === "live" ? (result.patch || {}) : {};
    if (Object.keys(patch).length) changed = true;
    return { ...event, ...patch, officialCheck: result.check, officialCheckedAt: result.checkedAt || null };
  });
  if (changed) state.events = prepareEvents3D(state.events);
  state.officialUpdatedAt = data.updatedAt || null;
  state.officialMonitorCount = data.monitored || 0;
  if (changed) rebuildArtistStats();
}

async function loadOfficialUpdates({ force = false } = {}) {
  const cacheKey = "neul-official-check-at";
  const last = Number(localStorage.getItem(cacheKey) || 0);
  if (!force && last && Date.now() - last < 3600000) return;
  try {
    const res = await fetch("/api/official", { headers: { Accept: "application/json" } });
    if (!res.ok) return;
    const data = await res.json();
    applyOfficialResults(data);
    await recordEventChanges(state.events);
    await saveOfflineSnapshot({ at: state.officialUpdatedAt || state.dataUpdatedAt || new Date().toISOString(), upstream: "official-monitor", count: state.events.length });
    localStorage.setItem(cacheKey, String(Date.now()));
    renderEvents();
    renderFollowing();
    renderFeatured();
    updateFreshness();
    window.dispatchEvent(new CustomEvent("neul:dataupdated", { detail: { events: state.events, updatedAt: state.officialUpdatedAt || state.dataUpdatedAt } }));
    if (state.detailId) openDetail(state.detailId);
  } catch {
    // Existing verified data remains usable when an upstream source is unavailable.
  }
}

function normalizeSearch(v="") { return String(v).toLowerCase().replace(/[臺台]/g,"台").replace(/[-_/]/g," ").replace(/\s+/g," ").trim(); }
function filteredEvents() {
  const q = normalizeSearch(state.query);
  const now = Date.now();
  const qTokens = q.split(" ").filter(Boolean);
  return state.events.filter(e => {
    const typeOk = state.type === "ALL" || e.type === state.type;
    const regionOk = e.region === state.region;
    const cityOk = state.city === "ALL" || state.city === "ARCHIVE" || String(e.city || "").toLowerCase() === state.city.toLowerCase();
    const life = eventLifecycle(e,now);
    const past = life.ended;
    const historyOk = state.archiveMode ? past : (q ? true : !past);
    const dateText = e.start ? new Intl.DateTimeFormat(uiLocale(),{year:"numeric",month:"2-digit",day:"2-digit",timeZone:"Asia/Taipei"}).format(new Date(e.start)) : "";
    const hay = normalizeSearch(`${e.artist} ${e.title} ${e.venue} ${e.city} ${dateText} ${(e.tags || []).join(" ")}`);
    const queryOk = !qTokens.length || qTokens.every(t => hay.includes(t));
    return typeOk && regionOk && cityOk && historyOk && queryOk;
  }).sort((a, b) => state.archiveMode ? new Date(b.start || 0) - new Date(a.start || 0) : new Date(a.start || 0) - new Date(b.start || 0));
}

function posterCode(e) {
  return (e.shortArtist || e.artist.slice(0, 3)).toUpperCase();
}

function renderEvents() {
  const list = filteredEvents();
  const root = $("#eventList");
  const meta = $("#eventResultMeta");
  const more = $("#viewMoreBtn");
  if (meta) meta.textContent = list.length ? "台灣活動 · 已去重同步" : "沒有符合條件的活動";
  if (!list.length) {
    root.innerHTML = `<div class="empty-upcoming">目前沒有符合條件的活動。<br>切回「台灣／全部活動」可查看已核對資料。</div>`;
    if (more) more.hidden = true;
    return;
  }
  const visible = list.slice(0, 10);
  root.innerHTML = visible.map(e => `
    <button class="event-row" data-event-id="${escapeHtml(e.id)}">
      <span class="event-poster">${escapeHtml(posterCode(e))}</span>
      <span class="event-info">
        <span class="event-artist-line"><strong>${escapeHtml(e.artist)}</strong>${sourceInfoTriggerMarkup(e,"event-row-info")}</span>
        <span class="title">${escapeHtml(e.title)}</span>
        <span class="date">${fmtDate(e.start, e.end)}${e.end ? "" : ` · ${escapeHtml(fmtEventTime(e))}`}</span>
        <span class="venue">${escapeHtml(e.venue)}</span>
      </span>
      <span class="event-arrow"><span class="event-tag">${escapeHtml(eventBadge(e))}</span><b>›</b></span>
    </button>`).join("");
  $$(".event-row", root).forEach(btn => btn.addEventListener("click", ev => { if(ev.target.closest('[data-source-info-event]')) return; openDetail(btn.dataset.eventId); }));
  wireSourceInfoTriggers(root);
  if (more) {
    more.hidden = list.length <= 5;
    more.textContent = "查看更多活動 →";
  }
}

function artistFor(name) {
  return state.artists.find(a => a.name.toLowerCase() === String(name).toLowerCase());
}

function renderFollowing() {
  const root = $("#artistBubbles");
  const artists = [...state.followed];
  const visible = artists.length ? artists.slice(0, 5) : ["Stray Kids", "aespa", "PLAVE", "NCT 127"];
  root.innerHTML = visible.map(name => {
    const profile = artistFor(name);
    const e = state.events.find(x => x.artist.toLowerCase() === name.toLowerCase());
    const code = profile?.shortName || e?.shortArtist || name.split(/\s+/).map(s => s[0]).join("").slice(0, 3).toUpperCase();
    const count = profile?.upcomingEventCount || 0;
    return `<button class="artist-bubble" data-artist="${escapeHtml(name)}" aria-label="查看 ${escapeHtml(name)}">
      <span class="artist-avatar">${escapeHtml(code)}</span><span class="artist-name">${escapeHtml(name)}</span>${count ? `<em>${count} EVENT${count > 1 ? "S" : ""}</em>` : ""}
    </button>`;
  }).join("");
  $$(".artist-bubble", root).forEach(btn => btn.addEventListener("click", () => openArtistDetail(btn.dataset.artist)));
  saveFollowed([...state.followed]);
  const featureBtn = $(".follow-feature");
  if (featureBtn) {
    const featured = state.events.find(x => x.id === state.featuredId);
    const artist = featured?.artist || featureBtn.dataset.artist || "Stray Kids";
    featureBtn.dataset.artist = artist;
    featureBtn.textContent = state.followed.has(artist) ? "✓ 已追蹤" : "加入追蹤";
  }
}

function featuredEvents() {
  const threshold = Date.now() - dayMs;
  return [...state.events]
    .filter(e => e.region === "TW" && !eventLifecycle(e).ended && e.start && eventEffectiveEndTs(e) >= threshold)
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, 10);
}

function pickFeaturedEvent() {
  const items = featuredEvents();
  if (!items.length) return state.events.find(e => !e.historical) || state.events[0] || null;
  let index = items.findIndex(e => e.id === state.featuredId);
  if (index < 0) index = 0;
  state.featuredIndex = index;
  return items[index];
}

function stepFeatured(delta) {
  const items = featuredEvents();
  if (!items.length) return;
  let index = items.findIndex(e => e.id === state.featuredId);
  if (index < 0) index = 0;
  index = (index + delta + items.length) % items.length;
  state.featuredIndex = index;
  state.featuredId = items[index].id;
  renderFeatured();
  const card = $(".featured-main");
  if (card) {
    card.classList.remove("is-changing");
    void card.offsetWidth;
    card.classList.add("is-changing");
  }
}

const FEATURED_IMAGES = [
  "/assets/featured-live-1.webp",
  "/assets/featured-live-2.webp",
  "/assets/featured-live-3.webp",
  "/assets/featured-live-4.webp"
];
let featuredAutoTimer = null;
let featuredProgressTimer = null;
let featuredAutoDeadline = 0;
function updateFeaturedAutoplayProgress(){
  const bar=$("#featuredProgressBar");
  const items=featuredEvents();
  if(!bar) return;
  if(items.length<=1){ bar.style.width="0%"; return; }
  const remaining=Math.max(0,featuredAutoDeadline-Date.now());
  const elapsed=Math.min(10000,Math.max(0,10000-remaining));
  bar.style.width=`${Math.min(100,elapsed/100)}%`;
}
function startFeaturedAutoplay(){
  clearTimeout(featuredAutoTimer);
  clearInterval(featuredProgressTimer);
  const items=featuredEvents();
  featuredAutoDeadline=Date.now()+10000;
  updateFeaturedAutoplayProgress();
  if(items.length<=1) return;
  featuredProgressTimer=setInterval(updateFeaturedAutoplayProgress,250);
  featuredAutoTimer=setTimeout(()=>{
    if(!document.hidden) stepFeatured(1);
    startFeaturedAutoplay();
  },10000);
}
function featuredImageFor(event, index=0) {
  const key=String(event?.id||event?.artist||index);
  let hash=0; for(let i=0;i<key.length;i++) hash=((hash<<5)-hash+key.charCodeAt(i))|0;
  return FEATURED_IMAGES[Math.abs(hash + index) % FEATURED_IMAGES.length];
}
function renderFeatured() {
  const event = pickFeaturedEvent();
  if (!event) return;
  state.featuredId = event.id;
  const mark = $("#featuredArtistMark");
  const title = $("#featuredTitle");
  const meta = $("#featuredMeta");
  const follow = $(".follow-feature");
  if (mark) mark.textContent = event.shortArtist || event.artist;
  if (title) title.innerHTML = escapeHtml(event.title).replace(/\s+(IN\s+TAIPEI|TAIPEI)$/i, "<br>$1");
  if (meta) meta.innerHTML = `${escapeHtml(fmtDate(event.start, event.end))}${event.end ? "" : ` ${escapeHtml(fmtEventTime(event))}`}<br>${escapeHtml(event.venue)}`;
  if (follow) {
    follow.dataset.artist = event.artist;
    follow.textContent = state.followed.has(event.artist) ? "✓ 已追蹤" : "加入追蹤";
  }
  const items = featuredEvents();
  const index = Math.max(0, items.findIndex(x => x.id === event.id));
  const photo = $(".featured-stage");
  if (photo) {
    photo.style.backgroundImage = `url('${featuredImageFor(event,index)}')`;
    photo.dataset.featuredImage = String((Math.abs(index)%FEATURED_IMAGES.length)+1);
  }
  const count = $("#featuredCount");
  if (count) count.textContent = `${Math.min(index + 1, Math.max(items.length, 1))}/${Math.max(items.length, 1)}`;
  const prev = $("#featuredPrevBtn");
  const next = $("#featuredNextBtn");
  const disabled = items.length <= 1;
  if (prev) prev.disabled = disabled;
  if (next) next.disabled = disabled;
}

function artistEvents(name) {
  return state.events
    .filter(e => e.artist.toLowerCase() === String(name).toLowerCase())
    .sort((a, b) => new Date(a.start || 0) - new Date(b.start || 0));
}

function openArtistDetail(name) {
  const profile = artistFor(name) || {
    name,
    shortName: name.slice(0, 3).toUpperCase(),
    type: "ARTIST",
    market: "INTL",
    sourceName: "活動資料",
    officialUrl: null,
    verified: false
  };
  const events = artistEvents(name);
  const next = events.find(e => e.start && new Date(e.start).getTime() >= Date.now() - 86400000) || events[0];
  const updated = profile.updatedAt || state.dataUpdatedAt;
  const checked = updated ? new Intl.DateTimeFormat(uiLocale(), { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Taipei" }).format(new Date(updated)) : "依活動資料同步";
  $("#detailContent").innerHTML = `
    <div class="detail-kicker">ARTIST WATCH · ${profile.verified ? "OFFICIAL SOURCE" : "EVENT-DERIVED"}</div>
    <h2>${escapeHtml(profile.name)}</h2>
    <div class="artist-profile-line"><span>${escapeHtml(profile.type || "ARTIST")}</span>${profile.market ? `<span>${escapeHtml(profile.market)}</span>` : ""}${profile.agency ? `<span>${escapeHtml(profile.agency)}</span>` : ""}</div>
    <p class="detail-title">追蹤中的藝人頁會依目前已收錄的官方活動資料，自動更新下一場活動與活動數量。</p>
    <div class="detail-meta">
      <div><span>UPCOMING</span><strong>${profile.upcomingEventCount || events.length || 0} 場</strong></div>
      <div><span>NEXT EVENT</span><strong>${next ? `${fmtDate(next.start, next.end)}<br>${escapeHtml(next.venue)}` : "目前沒有已收錄場次"}</strong></div>
      <div><span>TYPE</span><strong>${escapeHtml(profile.type || "ARTIST")}</strong></div>
      <div><span>SOURCE</span><strong>${escapeHtml(friendlySourceName(profile.sourceName))}</strong></div>
    </div>
    <section class="detail-section"><h3>近期活動</h3>
      <div class="artist-event-stack">${events.length ? events.map(e => `
        <button class="artist-event-mini" data-event-id="${escapeHtml(e.id)}">
          <span><b>${escapeHtml(e.title)}</b><small>${fmtDate(e.start, e.end)} · ${escapeHtml(e.venue)}</small></span><i>→</i>
        </button>`).join("") : `<div class="detail-empty">目前沒有已收錄的近期活動。</div>`}</div>
    </section>
    <div class="detail-source">
      ${profile.officialUrl ? `<a href="${safeUrl(profile.officialUrl)}" target="_blank" rel="noopener noreferrer">官方頁面 ↗</a>` : ""}
      <button class="pink-mini drawer-follow" data-artist="${escapeHtml(profile.name)}">${state.followed.has(profile.name) ? "✓ 已追蹤" : "+ 加入追蹤"}</button>
    </div>
    <div class="detail-check">活動狀態最後同步：${escapeHtml(checked)}。詳細資訊仍以官方最新公告為準。</div>`;
  $("#detailBackdrop").hidden = false;
  $("#detailDrawer").classList.add("open");
  $("#detailDrawer").setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  $$(".artist-event-mini").forEach(btn => btn.addEventListener("click", () => openDetail(btn.dataset.eventId)));
  const followBtn = $(".drawer-follow");
  if (followBtn) followBtn.addEventListener("click", () => {
    toggleFollow(profile.name);
    followBtn.textContent = state.followed.has(profile.name) ? "✓ 已追蹤" : "+ 加入追蹤";
  });
}

function openArtistDirectory() {
  const list = [...state.artists].sort((a, b) => (b.upcomingEventCount || 0) - (a.upcomingEventCount || 0) || a.name.localeCompare(b.name));
  $("#detailContent").innerHTML = `
    <div class="detail-kicker">ARTIST WATCH</div>
    <h2>Artists</h2>
    <p class="detail-title">已收錄與官方活動來源帶入的藝人，會依近期活動持續更新。</p>
    <div class="artist-directory">${list.map(a => `
      <button class="artist-directory-row" data-artist="${escapeHtml(a.name)}">
        <span class="artist-directory-code">${escapeHtml(a.shortName || a.name.slice(0, 3).toUpperCase())}</span>
        <span><b>${escapeHtml(a.name)}</b><small>${a.upcomingEventCount || 0} upcoming · ${escapeHtml(friendlySourceName(a.sourceName))}</small></span>
        <i>→</i>
      </button>`).join("")}</div>`;
  $("#detailBackdrop").hidden = false;
  $("#detailDrawer").classList.add("open");
  $("#detailDrawer").setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  $$(".artist-directory-row").forEach(btn => btn.addEventListener("click", () => openArtistDetail(btn.dataset.artist)));
}


let countdownTimer = null;
const countdownFlipTimers = new WeakMap();

function parseSessionDateTime(session, event) {
  if (!session?.date) return null;
  const date = String(session.date).trim().replace(/\//g, "-");
  const time = String(session.time || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!time) return null;
  const hh = String(time[1]).padStart(2, "0");
  const mm = time[2];
  const d = new Date(`${date}T${hh}:${mm}:00+08:00`);
  return Number.isFinite(d.getTime()) ? d : null;
}

function parseTimelineDateTime(item, event) {
  const text = String(item?.time || "");
  const year = String(event?.start || "").slice(0, 4) || String(new Date().getFullYear());
  const full = text.match(/(20\d{2})[\/.](\d{1,2})[\/.](\d{1,2})\s+(\d{1,2}):(\d{2})/);
  const short = text.match(/(^|\s)(\d{1,2})[\/.](\d{1,2})\s+(\d{1,2}):(\d{2})/);
  let parts = null;
  if (full) parts = [full[1], full[2], full[3], full[4], full[5]];
  else if (short) parts = [year, short[2], short[3], short[4], short[5]];
  if (!parts) return null;
  const [y,m,d,h,min] = parts.map((v,i) => i === 0 ? v : String(v).padStart(2, "0"));
  const dt = new Date(`${y}-${m}-${d}T${h}:${min}:00+08:00`);
  return Number.isFinite(dt.getTime()) ? dt : null;
}

function countdownTarget(event) {
  const now = Date.now();
  const life=eventLifecycle(event,now);
  if(life.active) return {active:true,label:"演出進行中",note:"活動尚未結束；結束時間以最後場次與官方公告為準",kind:"active"};
  if(life.ended) return null;

  const sale=ticketSaleLifecycle(event,now);
  if(sale.state==='pre-sale') {
    return {ts:sale.saleTs,label:"搶票倒數",note:`${sale.candidate?.label||"正式售票"} · ${fmtDate(new Date(sale.saleTs).toISOString())} ${fmtTime(new Date(sale.saleTs).toISOString())}`,kind:"sale"};
  }
  if(sale.state==='sale-day') {
    return {saleLive:true,label:"今日開賣",note:`${sale.candidate?.label||"官方售票"}今日開賣；餘票狀態以官方售票頁即時公告為準`,kind:"sale-live"};
  }

  const futureSessions = (event?.sessions || [])
    .map(session => ({ session, date: parseSessionDateTime(session, event) }))
    .filter(x => x.date && x.date.getTime() > now)
    .sort((a,b) => a.date - b.date);
  if (futureSessions.length) {
    const next = futureSessions[0];
    return {
      ts: next.date.getTime(),
      label: `距離 ${next.session.date} ${next.session.time} 演出`,
      note: next.session.note || "演出時間已確認",
      kind: "show"
    };
  }

  const startTs = new Date(event?.start || 0).getTime();
  if (Number.isFinite(startTs) && startTs > now && event?.timeConfirmed !== false) {
    return { ts: startTs, label: "距離演出", note: `${fmtDate(event.start)} ${fmtEventTime(event)}`, kind: "show" };
  }

  if (Number.isFinite(startTs) && startTs > now && event?.timeConfirmed === false) {
    return { ts: startTs, label: "距離活動日期", note: "演出時間待官方公告，倒數以活動日期 00:00 為基準", kind: "date", approximate: true };
  }

  return null;
}

function countdownMarkup(event) {
  const target = countdownTarget(event);
  if (target?.active) {
    return `<section class="concert-countdown countdown-live" data-countdown-live="true"><div class="countdown-eyebrow">LIVE NOW</div><div class="countdown-ended-title">演出進行中</div><p>${escapeHtml(target.note)}</p></section>`;
  }
  if (target?.saleLive) {
    return `<section class="concert-countdown countdown-sale-live" data-countdown-sale-live="true"><div class="countdown-eyebrow">TICKET DAY</div><div class="countdown-ended-title">今日開賣</div><p>${escapeHtml(target.note)}</p></section>`;
  }
  if (!target) {
    return `<section class="concert-countdown countdown-ended" data-countdown-ended="true">
      <div class="countdown-eyebrow">LIVE COUNTDOWN</div>
      <div class="countdown-ended-title">演出已結束</div>
      <p>此場次保留活動資訊、座位配置與 3D 視角作為歷史案例。</p>
    </section>`;
  }
  return `<section class="concert-countdown" data-countdown-ts="${target.ts}" data-countdown-label="${escapeHtml(target.label)}">
    <div class="countdown-head">
      <div><span class="countdown-eyebrow">LIVE COUNTDOWN</span><strong>${escapeHtml(target.label)}</strong></div>
      <p>${escapeHtml(target.note)}${target.approximate ? " · 時間待公告" : ""}</p>
    </div>
    <div class="flip-countdown" role="timer" aria-label="${escapeHtml(target.label)}">
      ${[["days","日"],["hours","時"],["minutes","分"],["seconds","秒"]].map(([unit,label]) => `
        <div class="flip-unit" data-unit="${unit}">
          <div class="flip-card" aria-hidden="true">
            <span class="flip-base">00</span>
            <span class="flip-old">00</span>
            <span class="flip-new">00</span>
          </div>
          <span class="flip-label">${label}</span>
        </div>`).join("")}
    </div>
    <span class="countdown-a11y sr-only"></span>
  </section>`;
}

function setFlipValue(unitEl, value, immediate = false) {
  const card = unitEl?.querySelector(".flip-card");
  if (!card) return;
  const base = card.querySelector(".flip-base");
  const oldEl = card.querySelector(".flip-old");
  const newEl = card.querySelector(".flip-new");
  const current = card.dataset.current;
  if (current === value) return;
  const pending = countdownFlipTimers.get(card);
  if (pending) clearTimeout(pending);
  if (immediate || current == null) {
    base.textContent = value; oldEl.textContent = value; newEl.textContent = value;
    card.dataset.current = value;
    card.classList.remove("is-flipping");
    return;
  }
  oldEl.textContent = current;
  newEl.textContent = value;
  base.textContent = value;
  card.classList.remove("is-flipping");
  void card.offsetWidth;
  card.classList.add("is-flipping");
  card.dataset.current = value;
  const t = setTimeout(() => card.classList.remove("is-flipping"), 640);
  countdownFlipTimers.set(card, t);
}

function updateCountdown() {
  const root = $(".concert-countdown[data-countdown-ts]");
  if (!root) return;
  const target = Number(root.dataset.countdownTs);
  const diff = Math.max(0, target - Date.now());
  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const values = {
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0")
  };
  for (const [unit, value] of Object.entries(values)) setFlipValue(root.querySelector(`[data-unit="${unit}"]`), value, !root.dataset.ready);
  root.dataset.ready = "true";
  const a11y = root.querySelector(".countdown-a11y");
  if (a11y) a11y.textContent = `${root.dataset.countdownLabel || "倒數"}：${days} 日 ${hours} 時 ${minutes} 分 ${seconds} 秒`;
  if (diff <= 0 && state.detailId) {
    clearInterval(countdownTimer); countdownTimer = null;
    setTimeout(() => openDetail(state.detailId), 40);
  }
}

function startCountdown() {
  if (countdownTimer) clearInterval(countdownTimer);
  updateCountdown();
  if ($(".concert-countdown[data-countdown-ts]")) countdownTimer = setInterval(updateCountdown, 1000);
}

function stopCountdown() {
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = null;
}

function toggleFollow(name) {
  state.followed.has(name) ? state.followed.delete(name) : state.followed.add(name);
  renderFollowing();
  window.dispatchEvent(new CustomEvent("neul:followschanged", { detail: { artists: [...state.followed] } }));
}

function timelineHtml(items = []) {
  return items.map(x => `<div class="timeline-item ${escapeHtml(x.state || "")}">
    <span class="timeline-dot"></span><div><b>${escapeHtml(x.label)}</b><span>${escapeHtml(x.time)}</span></div>
  </div>`).join("");
}

function detailList(title, arr = []) {
  if (!arr.length) return "";
  return `<section class="detail-section"><h3>${escapeHtml(title)}</h3><ul class="detail-list">${arr.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul></section>`;
}
function sectionPriceRulesMarkup(rules = []) {
  if (!Array.isArray(rules) || !rules.length) return "";
  const clean = rules.slice(0, 16).filter(x => x?.label && x?.price);
  if (!clean.length) return "";
  return `<section class="detail-section"><h3>官方票區價位</h3><div class="section-price-grid">${clean.map(x => `<div><span>${escapeHtml(x.label)}</span><strong>${escapeHtml(x.price)}</strong></div>`).join("")}</div><p class="section-price-note">能與 NEUL 票區名稱可靠對上的價位會自動顯示在 3D；名稱不一致時只保留官方價位，不會猜測配對。</p></section>`;
}

function eventVenueModelId(event) { return ensureVenueModelForEvent(event) || event?.venueModelId || venueIdFromName(event?.venue || ""); }
function eventBaseLayoutId(event) {
  const venueId = eventVenueModelId(event);
  return venueId ? baseLayoutIdForVenue(venueId) : null;
}
function eventVenueLayoutId(event) {
  const venueId = eventVenueModelId(event);
  if (!venueId) return null;
  return ensureAutoEventLayout({ ...event, venueModelId: venueId }) || event?.venueLayoutId || getVenueModel(venueId).baseLayoutId;
}
function eventCustom3DMeta(event={}) {
  const venueModelId=eventVenueModelId(event);
  if(!venueModelId) return {ready:false,grade:"no-venue-model",requiresReview:true};
  const venueLayoutId=eventVenueLayoutId({...event,venueModelId});
  const layout=venueLayoutId?getVenueLayout(venueLayoutId):null;
  if(!layout) return {ready:false,grade:"no-event-layout",requiresReview:true,venueModelId};
  const officialSeatMap=Boolean(event.seatLayoutSourceUrl||layout.seatMapDetected||layout.latestSeatLayoutSourceUrl);
  const mappedCount=Number(layout.sectionMapping?.mappedCount||0);
  const analyzed=Boolean(layout.autoMapAnalyzedAt||layout.seatMapFingerprint);
  const stageConfidence=Number(layout.autoStageConfidence||0);
  const manualOfficial=Boolean(!layout.autoGenerated && officialSeatMap);
  const officialMapVerified=manualOfficial || Boolean(layout.qaGate?.officialMapVerified) || Boolean(analyzed && stageConfidence>=.82 && mappedCount>=2);
  const priceDataFound=Boolean((event.sectionPriceRules?.length||0)||event.price);
  const mappedPriceCount=Object.keys(layout.sectionPriceLabels||{}).length+Object.keys(layout.priceLabels||{}).length;
  const priceMapped3D=Boolean(layout.qaGate?.priceMappingVerified) || Boolean(priceDataFound && mappedPriceCount>0);
  let grade='venue-derived-draft';
  if(manualOfficial) grade='official-map-calibrated';
  else if(officialMapVerified) grade='official-map-auto-verified';
  else if(officialSeatMap&&analyzed) grade='official-map-partial';
  else if(officialSeatMap) grade='official-map-linked-pending';
  return {ready:Boolean(layout.eventId===event.id&&layout.stage?.main),venueModelId,layoutId:venueLayoutId,uniqueEventLayout:Boolean(layout.eventId===event.id),officialSeatMap,officialMapVerified,priceDataFound,priceMapped3D,mappedCount,stageConfidence,grade,generationState:layout.generationState||grade,pipelineVersion:layout.autoPipelineVersion||null,seatMapNeedsRefresh:Boolean(layout.seatMapNeedsRefresh),verifiedAgainstCurrentSource:Boolean(layout.verifiedAgainstCurrentSource||manualOfficial),requiresReview:Boolean(layout.qaGate?.requiresReview||!officialMapVerified)};
}
function hydrateResolvedSeatMapFromCache(event={}) {
  try {
    const key=`neul-seatmap-hash:${event.id}`;
    const resolved=localStorage.getItem(`${key}:resolvedUrl`);
    const checkedAt=localStorage.getItem(`${key}:checkedAt`);
    if(!resolved) return event;
    const refs=[...(event.sourceRefs||[])];
    if(!refs.some(ref=>normalizeSourceUrl(ref?.url)===normalizeSourceUrl(resolved))) refs.push({name:'官方座位圖（自動解析）',url:resolved});
    return {...event,seatLayoutSourceUrl:event.seatLayoutSourceUrl||resolved,seatMapResolvedAt:checkedAt||event.seatMapResolvedAt||null,sourceRefs:refs};
  } catch { return event; }
}
function prepareEvents3D(events = []) {
  return events.map(rawEvent => {
    const event=hydrateResolvedSeatMapFromCache(rawEvent);
    const venueModelId = eventVenueModelId(event);
    if (!venueModelId) return { ...event, custom3D:eventCustom3DMeta(event) };
    const venueLayoutId = eventVenueLayoutId({ ...event, venueModelId });
    const prepared={ ...event, venueModelId, venueLayoutId, baseVenueLayoutId: baseLayoutIdForVenue(venueModelId) };
    return { ...prepared, custom3D:eventCustom3DMeta(prepared) };
  });
}

function openDetail(id) {
  const e = state.events.find(x => x.id === id);
  if (!e) return;
  state.detailId = id;
  const checked = new Intl.DateTimeFormat(uiLocale(), { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Taipei" }).format(new Date(e.checkedAt || Date.now()));
  const action = nextAction(e);
  const activityLayoutId = eventVenueLayoutId(e);
  const activityLayout = activityLayoutId ? getVenueLayout(activityLayoutId) : null;
  const activity3DStatus = activityLayout?.autoGenerated
    ? (activityLayout.generationConfidence === "ocr-section-mapped" ? "AUTO 3D · OCR/Vision 精準票區映射完成" : activityLayout.generationConfidence === "ocr-partial-mapped" ? "AUTO 3D · OCR/Vision 票區映射完成" : activityLayout.generationConfidence === "map-pixel-derived" ? "AUTO 3D · 官方座位圖已解析並客製生成" : (activityLayout.seatMapDetected ? "AUTO 3D · 已偵測官方座位配置來源" : "AUTO 3D · 依場館自動生成"))
    : (activityLayout?.eventId ? "CALIBRATED 3D · 本場專屬配置" : "");
  $("#detailContent").innerHTML = `
    <div class="detail-kicker">${escapeHtml(e.statusLabel || e.type)} · ${e.historical ? "HISTORICAL VERIFIED" : (e.officialCheck?.status === "live" ? "OFFICIAL LIVE" : "OFFICIAL CHECKED")}</div>
    <div class="detail-heading-line"><h2>${escapeHtml(e.artist)}</h2>${sourceInfoTriggerMarkup(e,"detail-info")}</div>
    <div class="detail-title">${escapeHtml(e.title)}</div>
    <p class="detail-title">${escapeHtml(e.summary || "")}</p>
    ${countdownMarkup(e)}
    <div class="detail-next-action"><span>${escapeHtml(action.label)}</span><strong>${escapeHtml(action.value)}</strong></div>
    <div class="detail-meta">
      <div><span>DATE / TIME</span><strong>${fmtDate(e.start, e.end)}<br>${e.end ? "多場次" : escapeHtml(fmtEventTime(e))}</strong></div>
      <div><span>VENUE</span><strong>${escapeHtml(e.venue)}</strong></div>
      <div><span>TICKETING</span><strong>${escapeHtml(e.ticketing || "TBA")}</strong></div>
      <div><span>PRICE</span><strong>${escapeHtml(e.price || "TBA")}</strong></div>
    </div>
    ${sectionPriceRulesMarkup(e.sectionPriceRules)}
    ${e.sessions?.length ? `<section class="detail-section"><h3>場次</h3><div class="timeline">${e.sessions.map(s => `<div class="timeline-item"><span class="timeline-dot"></span><div><b>${escapeHtml(s.date)} · ${escapeHtml(s.time)}</b><span>${escapeHtml(s.note || "")}</span></div></div>`).join("")}</div></section>` : ""}
    <section class="detail-section"><h3>售票時間軸</h3><div class="timeline">${timelineHtml(e.ticketTimeline || [])}</div></section>
    ${detailList("粉絲福利", e.benefits)}
    ${detailList("需要注意", e.notes)}
    ${activity3DStatus ? (()=>{const q=eventCustom3DMeta(e);const qtext=q.officialMapVerified?`官方座位圖已完成 3D 對照 · ${q.mappedCount||0} 個 Section 映射${q.priceMapped3D?" · 價位已同步":""}`:(q.officialSeatMap?"已取得官方座位圖，OCR/Vision 尚未達自動發布門檻":"尚未取得可解析官方座位圖，目前為場館衍生客製草稿");return `<div class="detail-3d-status"><b>${escapeHtml(activity3DStatus)}</b><span>${escapeHtml(qtext)}</span></div>`;})() : ""}
    <div class="detail-source">
      <a href="${safeUrl(e.sourceUrl)}" target="_blank" rel="noopener noreferrer">官方來源 ↗</a>
      ${e.secondarySourceUrl ? `<a href="${safeUrl(e.secondarySourceUrl)}" target="_blank" rel="noopener noreferrer">補充公告 ↗</a>` : ""}
      ${e.seatLayoutSourceUrl ? `<a href="${safeUrl(e.seatLayoutSourceUrl)}" target="_blank" rel="noopener noreferrer">官方座位配置 ↗</a>` : ""}
      ${eventVenueModelId(e) ? `<button class="outline-mini detail-venue-btn" data-venue="${escapeHtml(eventVenueModelId(e))}" data-layout="${escapeHtml(eventVenueLayoutId(e))}">查看本場 3D →</button><button class="outline-mini detail-base-venue-btn" data-venue="${escapeHtml(eventVenueModelId(e))}" data-layout="${escapeHtml(eventBaseLayoutId(e))}">一般場館 3D →</button>` : ""}
      <button class="pink-mini drawer-follow" data-artist="${escapeHtml(e.artist)}">${state.followed.has(e.artist) ? "✓ 已追蹤" : "+ 加入追蹤"}</button>
    </div>
    <div class="detail-check">${e.officialCheck?.status === "live" ? "官方頁面已連線 · " : e.officialCheck?.status === "review" ? "官方公告可能有變更 · " : "本站最後核對 · "}${escapeHtml(checked)}。詳細規則與臨時變更請回官方來源確認。</div>`;
  $("#detailBackdrop").hidden = false;
  $("#detailDrawer").classList.add("open");
  $("#detailDrawer").setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  startCountdown();
  wireSourceInfoTriggers($("#detailContent"));
  const df = $(".drawer-follow");
  if (df) df.addEventListener("click", () => { toggleFollow(e.artist); df.textContent = state.followed.has(e.artist) ? "✓ 已追蹤" : "+ 加入追蹤"; });
  const wireVenueJump = selector => {
    const btn = $(selector);
    if (!btn) return;
    btn.addEventListener("click", () => {
      setVenue(btn.dataset.venue || eventVenueModelId(e), btn.dataset.layout || eventVenueLayoutId(e));
      closeDetail();
      $("#venue3d").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };
  wireVenueJump(".detail-venue-btn");
  wireVenueJump(".detail-base-venue-btn");
}
function closeDetail() {
  stopCountdown();
  $("#detailDrawer").classList.remove("open");
  $("#detailDrawer").setAttribute("aria-hidden", "true");
  $("#detailBackdrop").hidden = true;
  document.body.style.overflow = "";
}

function updateFreshness() {
  const el = $("#dataFreshness");
  if (!el) return;
  const sourceCount=Number(state.coverage?.sourceCount||0);
  const warningCount=Number(state.coverage?.sourceWarnings||0);
  const health=sourceCount?`<span class="freshness-next">官方來源 ${sourceCount} 類${warningCount?` · ${warningCount} 項需重試`:" · 正常"}</span>`:"";
  const cadence = `<span class="freshness-cadence">約每 1 小時自動檢查官方來源 · 每日排程同步</span>`;
  if (!state.dataUpdatedAt) {
    el.innerHTML = `目前顯示已核對活動${health}${cadence}`;
    el.title = "活動資料採 1 小時快取；頁面開啟時會自動重新驗證，並另有每日排程同步。";
    return;
  }
  const t = new Intl.DateTimeFormat(uiLocale(), { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Taipei" }).format(new Date(state.dataUpdatedAt));
  const officialTime = state.officialUpdatedAt ? new Intl.DateTimeFormat(uiLocale(), { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Taipei" }).format(new Date(state.officialUpdatedAt)) : null;
  const headline = officialTime ? `官方資訊更新 ${officialTime}` : (state.autoUpdateEnabled ? `台灣活動同步 ${t}` : `已核對資料 · ${t}`);
  const next = state.nextUpdateAt ? new Intl.DateTimeFormat(uiLocale(), { month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", hour12:false, timeZone:"Asia/Taipei" }).format(new Date(state.nextUpdateAt)) : null;
  const schedule = next ? `<span class="freshness-next">下次預計更新 ${next}</span>` : "";
  el.innerHTML = `${headline}${schedule}${health}${cadence}`;
  el.title = "活動資料採 1 小時快取；頁面開啟時會自動重新驗證，並另有每日排程同步。詳細內容仍以官方最新公告為準。";
}

function updateSearchScope() {
  const el = $("#searchScopeNote");
  if (!el) return;
  const starts = state.events.map(e => new Date(e.start || 0)).filter(d => Number.isFinite(d.getTime()) && d.getFullYear() >= 2000);
  if (!starts.length) return;
  const earliest = new Date(Math.min(...starts.map(d => d.getTime())));
  const label = new Intl.DateTimeFormat(uiLocale(), { year: "numeric", month: "2-digit", timeZone: TAIPEI_TZ }).format(earliest);
  el.textContent = `目前已收錄資料自 ${label} 起；更早場次持續補齊。搜尋會同時查近期與已收錄 Archive。`;
}

async function loadEvents({ preserveOnFailure = false } = {}) {
  try {
    const res = await fetch("/api/events", { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("events unavailable");
    const data = await res.json();
    if (Array.isArray(data.events) && data.events.length) state.events = prepareEvents3D(taiwanEventsOnly(data.events));
    if (Array.isArray(data.artists) && data.artists.length) state.artists = data.artists;
    state.dataUpdatedAt = data.updatedAt || null;
    state.nextUpdateAt = data.nextUpdateAt || (data.updatedAt ? new Date(new Date(data.updatedAt).getTime()+3600000).toISOString() : null);
    state.autoUpdateEnabled = data.autoUpdateEnabled !== false;
    state.upstream = data.upstream || "curated-fallback";
    state.coverage = data.coverage || null;
    state.discoveryHealth = data.discovery?.sourceHealth || null;
  } catch {
    if (!preserveOnFailure || !state.events.length) {
      state.events = prepareEvents3D(taiwanEventsOnly(seedEvents));
      state.artists = seedArtists.map(a => ({ ...a, upcomingEventCount: seedEvents.filter(e => e.artist.toLowerCase() === a.name.toLowerCase()).length, nextEvent: null, eventIds: [] }));
      state.dataUpdatedAt = null;
      state.nextUpdateAt = null;
      state.autoUpdateEnabled = false;
      state.upstream = "curated-fallback";
      state.coverage = {completenessGuaranteed:false,sourceCount:0,sourceWarnings:1,note:"即時官方來源暫不可用，使用已核對 fallback。"};
      state.discoveryHealth = null;
    }
  }
  await recordEventChanges(state.events);
  await saveOfflineSnapshot({ at: state.dataUpdatedAt || new Date().toISOString(), upstream: state.upstream, count: state.events.length });
  rebuildArtistStats();
  renderEvents();
  renderFollowing();
  renderFeatured();
  startFeaturedAutoplay();
  renderLayoutOptions();
  updateFreshness();
  updateSearchScope();
  window.dispatchEvent(new CustomEvent("neul:dataupdated", { detail: { events: state.events, updatedAt: state.dataUpdatedAt } }));
  const idle = window.requestIdleCallback || (fn => setTimeout(fn, 900));
  idle(async () => { await loadOfficialUpdates(); await hydrateSeatMapGeometry(state.events); });
}


let eventsAutoRefreshTimer=null;
let lifecycleSyncTimer=null;
function startAutomaticEventVerification(){
  clearInterval(eventsAutoRefreshTimer);
  clearInterval(lifecycleSyncTimer);
  // CDN caching makes this global rather than per-user crawling: while a page is open,
  // re-check the merged official event feed hourly without requiring a reload.
  eventsAutoRefreshTimer=setInterval(()=>{ if(!document.hidden) loadEvents({preserveOnFailure:true}); },3600000);
  // Lifecycle transitions are local-time calculations, so Archive / 3D / Featured can switch
  // within a minute even when no network request is needed.
  lifecycleSyncTimer=setInterval(()=>{
    renderEvents();
    renderFeatured();
    const previousLayoutId=state.layoutId;
    renderLayoutOptions();
    if(state.layoutId!==previousLayoutId) setVenue(state.venueId,state.layoutId);
    updateFreshness();
    if(state.detailId) openDetail(state.detailId);
  },60000);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden) return;
    const last=new Date(state.dataUpdatedAt||0).getTime();
    if(!Number.isFinite(last)||Date.now()-last>=3600000) loadEvents({preserveOnFailure:true});
    renderLayoutOptions();
  });
}

async function hydrateSeatMapGeometry(events=[]) {
  const now=Date.now();
  const candidates=events
    .filter(e=>canAnalyzeSeatMap(e)&&eventVenueModelId(e)&&!eventLifecycle(e,now).ended)
    .sort((a,b)=>new Date(a.start||0)-new Date(b.start||0));
  let changed=false;
  const analyzeOne=async event=>{
    try{
      const layoutId=eventVenueLayoutId(event), layout=getVenueLayout(layoutId), model=getVenueModel(eventVenueModelId(event));
      const key=`neul-seatmap-hash:${event.id}`, previous=localStorage.getItem(key)||'';
      let cachedAnalysis=null;try{cachedAnalysis=JSON.parse(localStorage.getItem(`${key}:analysis`)||'null');}catch{}
      const referenceSections=effectiveSections(model.id,layoutId);
      const analysis=await analyzeSeatMap(event,model,{hash:previous,analysis:cachedAnalysis},{referenceSections});
      if(!analysis?.hash){
        const failKey=`${key}:resolverFailure`;let fail={count:0};try{fail=JSON.parse(localStorage.getItem(failKey)||'{"count":0}');}catch{}
        localStorage.setItem(failKey,JSON.stringify({count:Number(fail.count||0)+1,checkedAt:new Date().toISOString(),sourceSignature:JSON.stringify([event.sourceUrl,event.secondarySourceUrl,event.autoSourceUrl,event.ticketUrl,event.ticketSourceUrl,(event.sourceRefs||[]).map(x=>x?.url)])}));
        return false;
      }
      const firstSeen=!previous, hashChanged=Boolean(previous&&previous!==analysis.hash);
      // Geometry and metadata have different trust thresholds. Every verified image refresh can
      // update OCR/Section mapping; stage geometry is allowed to move only with strong shape evidence.
      const profileOk=!layout?.autoMapProfileExpected || analysis.profile===layout.autoMapProfileExpected;
      const autoGeometryOk=Boolean(layout?.autoGenerated && Number(analysis.stageConfidence||0)>=.72);
      const calibratedGeometryOk=Boolean(layout?.seatMapAutoRegenerate && hashChanged && layout?.autoGeometryPolicy!=='manual-protected' && profileOk && Number(analysis.stageConfidence||0)>=.90);
      const geometryAllowed=autoGeometryOk || calibratedGeometryOk;
      const applied=Boolean(applyAutoSeatMapAnalysis(layoutId,analysis,{geometry:geometryAllowed,replaceSections:Boolean(layout?.autoGenerated)}));
      const resolvedChanged=Boolean(analysis.resolvedUrl && event.seatLayoutSourceUrl!==analysis.resolvedUrl);
      localStorage.setItem(key,analysis.hash);
      localStorage.setItem(`${key}:profile`,analysis.profile||'unknown');
      if(analysis.resolvedUrl){event.seatLayoutSourceUrl=analysis.resolvedUrl;localStorage.setItem(`${key}:resolvedUrl`,analysis.resolvedUrl);}
      if(analysis.sourcePage){event.seatLayoutResolvedFrom=analysis.sourcePage;localStorage.setItem(`${key}:sourcePage`,analysis.sourcePage);}
      localStorage.setItem(`${key}:mapping`,JSON.stringify({confidence:analysis.confidence,ocr:analysis.ocr?.engine||'vision-only',mappedCount:analysis.ocr?.mappedCount||0,profile:analysis.profile||'unknown',stageConfidence:Number(analysis.stageConfidence||0),legendConfidence:analysis.legendConfidence||'unverified-no-price-guess',geometryApplied:geometryAllowed}));
      if(!analysis.cacheHit){try{const compact={...analysis,ocr:{...(analysis.ocr||{}),text:''}};localStorage.setItem(`${key}:analysis`,JSON.stringify(compact));}catch{}}
      localStorage.setItem(`${key}:checkedAt`,new Date().toISOString()); localStorage.removeItem(`${key}:resolverFailure`);
      if(firstSeen && layout?.seatMapAutoRegenerate) localStorage.setItem(`${key}:baseline`,analysis.hash);
      return applied||resolvedChanged;
    }catch{return false;}
  };
  // Analyze every current event that has an official map, but keep OCR work bounded to one image
  // at a time so Safari/mobile remains responsive. CDN/proxy caching keeps the six-hour refresh light.
  for(let i=0;i<candidates.length;i+=1){
    const batch=await Promise.all(candidates.slice(i,i+1).map(analyzeOne));
    if(batch.some(Boolean)) changed=true;
    await new Promise(r=>setTimeout(r,0));
  }
  if(changed){
    // Recompute per-event 3D QA metadata after OCR/Vision mutates runtime layouts.
    // This keeps newly discovered future events and upgraded official maps in sync without a reload.
    state.events=prepareEvents3D(state.events);
    renderEvents(); renderFeatured();
    if(state.detailId) openDetail(state.detailId);
    try{renderVenueOptions();renderLayoutOptions();drawVenueOverview();drawSeatPreview();renderOfficialSeatMap(true);}catch{}
  }
}

function runSearch() {
  state.query = $("#searchInput").value;
  state.visibleEventLimit = 5;
  renderEvents();
  $("#upcoming").scrollIntoView({ behavior: "smooth", block: "start" });
}

$("#searchInput").addEventListener("input", e => { state.query = e.target.value; state.visibleEventLimit = 5; renderEvents(); });
$("#searchInput").addEventListener("keydown", e => { if (e.key === "Enter") runSearch(); });
$("#searchSubmit").addEventListener("click", runSearch);
$("#searchFocusBtn").addEventListener("click", () => { $("#searchInput").focus(); $("#top").scrollIntoView({ behavior: "smooth" }); });
$$(".category").forEach(btn => btn.addEventListener("click", () => {
  $$(".category").forEach(x => x.classList.remove("active")); btn.classList.add("active");
  state.type = btn.dataset.type; state.visibleEventLimit = 5; renderEvents();
}));
$$(".region").forEach(btn => btn.addEventListener("click", () => {
  $$(".region").forEach(x => x.classList.remove("active")); btn.classList.add("active");
  state.city = btn.dataset.city || "ALL"; state.archiveMode = state.city === "ARCHIVE"; state.visibleEventLimit = 5; renderEvents();
}));
const allEventsModal = $("#allEventsModal");
const allEventsList = $("#eventsModalList");
const eventsAgendaList = $("#eventsAgendaList");
const allEventsSummary = $("#eventsModalSummary");
const eventsMonthFilter = $("#eventsMonthFilter");
const eventsStartFilter = $("#eventsStartFilter");
const eventsEndFilter = $("#eventsEndFilter");
const eventsAreaSearch = $("#eventsAreaSearch");
const eventsCityFilter = $("#eventsCityFilter");
const eventsCalendarGrid = $("#eventsCalendarGrid");
const eventsCalendarMonthLabel = $("#eventsCalendarMonthLabel");
const eventsAgendaDateLabel = $("#eventsAgendaDateLabel");
let eventsCalendarMonth = "";
let eventsCalendarDate = "";

function cityLabel(city) {
  return ({Taipei:"台北",NewTaipei:"新北",Taoyuan:"桃園",Taichung:"台中",Tainan:"台南",Kaohsiung:"高雄",Hsinchu:"新竹",Keelung:"基隆",Chiayi:"嘉義",Changhua:"彰化",Pingtung:"屏東",Yilan:"宜蘭",Hualien:"花蓮",Taitung:"台東",Miaoli:"苗栗",Nantou:"南投",Yunlin:"雲林",Penghu:"澎湖",Kinmen:"金門",Matsu:"馬祖"})[city] || city || "其他";
}
function refreshEventsCityFilter() {
  if (!eventsCityFilter) return;
  const current=eventsCityFilter.value||"ALL";
  const cities=[...new Set(state.events.filter(e=>e.region==="TW" && e.city).map(e=>String(e.city)))].sort((a,b)=>cityLabel(a).localeCompare(cityLabel(b),"zh-Hant"));
  eventsCityFilter.innerHTML=`<option value="ALL">全台</option>`+cities.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(cityLabel(c))}</option>`).join("");
  eventsCityFilter.value=cities.includes(current)?current:"ALL";
}

function taipeiDateKey(value) {
  if (!value) return "";
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", { year:"numeric", month:"2-digit", day:"2-digit", timeZone:TAIPEI_TZ }).formatToParts(d);
  const get = t => parts.find(x => x.type === t)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
function modalBaseEvents() {
  const now = Date.now();
  const q = normalizeSearch(state.query);
  const qTokens = q.split(" ").filter(Boolean);
  return state.events.filter(e => {
    const future = !eventLifecycle(e,now).ended;
    const typeOk = state.type === "ALL" || e.type === state.type;
    const cityOk = state.city === "ALL" || state.city === "ARCHIVE" || String(e.city || "").toLowerCase() === state.city.toLowerCase();
    const dateText = e.start ? taipeiDateKey(e.start) : "";
    const hay = normalizeSearch(`${e.artist} ${e.title} ${e.venue} ${e.city} ${dateText} ${(e.tags || []).join(" ")}`);
    const queryOk = !qTokens.length || qTokens.every(t => hay.includes(t));
    return future && e.region === state.region && typeOk && cityOk && queryOk;
  }).sort((a,b) => new Date(a.start || 0) - new Date(b.start || 0));
}
function modalFilteredEvents() {
  // The expanded Upcoming explorer intentionally starts from all Taiwan events,
  // rather than inheriting the three homepage city chips. This keeps the UI
  // scalable when more counties/cities are added to the feed.
  const now=Date.now();
  let list=state.events.filter(e=>{
    const future=!eventLifecycle(e,now).ended;
    return future && e.region==="TW" && (state.type==="ALL" || e.type===state.type);
  }).sort((a,b)=>new Date(a.start||0)-new Date(b.start||0));
  const month = eventsMonthFilter?.value || "";
  const start = eventsStartFilter?.value || "";
  const end = eventsEndFilter?.value || "";
  const city = eventsCityFilter?.value || "ALL";
  const areaQ = normalizeSearch(eventsAreaSearch?.value || "");
  if (city !== "ALL") list = list.filter(e => String(e.city||"") === city);
  if (areaQ) list = list.filter(e => normalizeSearch(`${e.artist} ${e.title} ${e.venue} ${e.city} ${cityLabel(e.city)} ${(e.tags||[]).join(" ")}`).includes(areaQ));
  if (month) list = list.filter(e => occurrenceDateKeys(e).some(k => k.startsWith(month)));
  if (start) list = list.filter(e => occurrenceDateKeys(e).some(k => k >= start));
  if (end) list = list.filter(e => occurrenceDateKeys(e).some(k => k <= end));
  return list;
}
function occurrenceDateKeys(event={}) {
  const sessions=(event.sessions||[]).map(s=>String(s.date||'').replaceAll('/','-')).filter(x=>/^20\d{2}-\d{2}-\d{2}$/.test(x));
  if(sessions.length) return [...new Set(sessions)];
  const start=taipeiDateKey(event.start); if(!start) return [];
  const end=event.end?taipeiDateKey(event.end):start;
  if(!end || end===start) return [start];
  const out=[]; let cursor=new Date(`${start}T12:00:00+08:00`), stop=new Date(`${end}T12:00:00+08:00`);
  for(let guard=0;guard<14 && cursor<=stop;guard++,cursor=new Date(cursor.getTime()+dayMs)) out.push(taipeiDateKey(cursor));
  return out.length?out:[start];
}
function calendarOccurrences(list=[]) {
  const out=[];
  for(const event of list) for(const dateKey of occurrenceDateKeys(event)) out.push({event,dateKey});
  return out.sort((a,b)=>a.dateKey.localeCompare(b.dateKey)||new Date(a.event.start||0)-new Date(b.event.start||0));
}
function taipeiMonthKey(value=new Date()) { const k=taipeiDateKey(value); return k?k.slice(0,7):''; }
function monthLabel(month='') {
  const m=String(month).match(/^(20\d{2})-(\d{2})$/); if(!m) return '—';
  return new Intl.DateTimeFormat(uiLocale(),{year:'numeric',month:'long',timeZone:TAIPEI_TZ}).format(new Date(`${month}-15T12:00:00+08:00`));
}
function shiftMonth(month,delta){
  const m=String(month).match(/^(20\d{2})-(\d{2})$/); if(!m) return taipeiMonthKey();
  const d=new Date(Date.UTC(Number(m[1]),Number(m[2])-1+delta,15));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`;
}
function calendarWeekdayIndex(dateKey){
  const wd=new Intl.DateTimeFormat('en-US',{weekday:'short',timeZone:TAIPEI_TZ}).format(new Date(`${dateKey}T12:00:00+08:00`));
  return ({Mon:0,Tue:1,Wed:2,Thu:3,Fri:4,Sat:5,Sun:6})[wd] ?? 0;
}
function ensureCalendarSelection(list){
  const occ=calendarOccurrences(list);
  let month=eventsMonthFilter?.value || eventsCalendarMonth || taipeiMonthKey();
  if(!occ.some(x=>x.dateKey.startsWith(month)) && occ.length) month=occ[0].dateKey.slice(0,7);
  eventsCalendarMonth=month;
  const today=taipeiDateKey(new Date());
  const monthDates=occ.filter(x=>x.dateKey.startsWith(month)).map(x=>x.dateKey);
  if(!eventsCalendarDate || !eventsCalendarDate.startsWith(month)) eventsCalendarDate=monthDates.includes(today)?today:(monthDates[0]||`${month}-01`);
  return {occ,month};
}
function renderDailyCalendar(list){
  if(!eventsCalendarGrid) return;
  const {occ,month}=ensureCalendarSelection(list);
  if(eventsCalendarMonthLabel) eventsCalendarMonthLabel.textContent=monthLabel(month);
  const [y,m]=month.split('-').map(Number); const days=new Date(Date.UTC(y,m,0)).getUTCDate();
  const firstIndex=calendarWeekdayIndex(`${month}-01`); const byDate=new Map();
  for(const item of occ){ if(!item.dateKey.startsWith(month)) continue; const a=byDate.get(item.dateKey)||[]; a.push(item.event); byDate.set(item.dateKey,a); }
  const today=taipeiDateKey(new Date()); const cells=[];
  for(let i=0;i<firstIndex;i++) cells.push('<span class="events-calendar-spacer" aria-hidden="true"></span>');
  for(let d=1;d<=days;d++){
    const key=`${month}-${String(d).padStart(2,'0')}`; const events=byDate.get(key)||[];
    const names=[...new Set(events.map(e=>e.artist))].slice(0,2);
    cells.push(`<button type="button" class="events-calendar-day${events.length?' has-events':''}${key===eventsCalendarDate?' active':''}${key===today?' today':''}" data-calendar-date="${key}" aria-label="${key} ${events.length} 場活動"><span class="events-calendar-number">${d}</span>${events.length?`<b>${events.length}</b><small>${names.map(escapeHtml).join(' · ')}</small>`:''}</button>`);
  }
  const used=firstIndex+days, target=used<=35?35:42;
  for(let i=used;i<target;i++) cells.push('<span class="events-calendar-spacer" aria-hidden="true"></span>');
  eventsCalendarGrid.innerHTML=cells.join('');
  $$('[data-calendar-date]',eventsCalendarGrid).forEach(btn=>btn.addEventListener('click',()=>{eventsCalendarDate=btn.dataset.calendarDate;renderAllEventsModal();}));
  const selected=occ.filter(x=>x.dateKey===eventsCalendarDate).map(x=>x.event);
  if(eventsAgendaDateLabel){
    const label=new Intl.DateTimeFormat(uiLocale(),{year:'numeric',month:'long',day:'numeric',weekday:'short',timeZone:TAIPEI_TZ}).format(new Date(`${eventsCalendarDate}T12:00:00+08:00`));
    eventsAgendaDateLabel.textContent=`${label} · ${selected.length} 場`;
  }
  return {selected,occ,month};
}
function eventModalRowMarkup(e,{agenda=false}={}) {
  const layout=eventCustom3DMeta(e);
  const quality=layout.officialMapVerified?'官方圖已對照':(layout.officialSeatMap?'官方圖待解析':'場館草稿待校正');
  const primary=agenda?(fmtEventTime(e)||'時間待公告'):`${fmtDate(e.start,e.end)}${e.end?'':` ${fmtEventTime(e)}`}`;
  return `<button class="events-modal-row" data-event-id="${escapeHtml(e.id)}">
    <span class="events-modal-date">${escapeHtml(primary)}</span>
    <span class="events-modal-copy"><span class="events-modal-artist-line"><strong>${escapeHtml(e.artist)}</strong>${sourceInfoTriggerMarkup(e,agenda?"calendar-info":"list-info")}</span><span>${escapeHtml(e.title)}</span><small>${escapeHtml(cityLabel(e.city))} · ${escapeHtml(e.venue)} · ${escapeHtml(eventBadge(e))} · ${escapeHtml(quality)}</small></span>
    <span class="events-modal-arrow">›</span>
  </button>`;
}
function wireEventModalRows(root){
  if(!root) return;
  $$(".events-modal-row", root).forEach(btn => btn.addEventListener("click", ev => {
    if(ev.target.closest('[data-source-info-event]')) return;
    closeAllEventsModal();
    openDetail(btn.dataset.eventId);
  }));
  wireSourceInfoTriggers(root);
}
function renderAllEventsModal() {
  if (!allEventsList) return;
  const list = modalFilteredEvents();
  const cal=renderDailyCalendar(list)||{selected:list,occ:calendarOccurrences(list),month:''};
  const monthCount=cal.occ.filter(x=>!cal.month||x.dateKey.startsWith(cal.month)).length;
  if (allEventsSummary) allEventsSummary.textContent = list.length ? `${list.length} 場符合條件 · ${monthLabel(cal.month)} 共 ${monthCount} 個演出日` : "沒有符合時間條件的活動";
  const selected=cal.selected||[];
  if(eventsAgendaList){
    eventsAgendaList.innerHTML = selected.length ? selected.map(e => eventModalRowMarkup(e,{agenda:true})).join("") : `<div class="events-modal-empty">這一天目前沒有符合篩選條件的演唱會。</div>`;
  }
  allEventsList.innerHTML = list.length ? list.map(e => eventModalRowMarkup(e,{agenda:false})).join("") : `<div class="events-modal-empty">目前沒有符合篩選條件的演唱會。</div>`;
  wireEventModalRows(eventsAgendaList);
  wireEventModalRows(allEventsList);
  window.NEUL_I18N?.apply?.();
}
function openAllEventsModal() {
  if (!allEventsModal) return;
  allEventsModal.hidden = false;
  allEventsModal.setAttribute("aria-hidden","false");
  document.body.classList.add("events-modal-open");
  refreshEventsCityFilter();
  renderAllEventsModal();
}
function closeAllEventsModal() {
  if (!allEventsModal) return;
  allEventsModal.hidden = true;
  allEventsModal.setAttribute("aria-hidden","true");
  document.body.classList.remove("events-modal-open");
}
function setQuickEventWindow(days) {
  const today = new Date();
  const start = new Intl.DateTimeFormat("en-CA",{year:"numeric",month:"2-digit",day:"2-digit",timeZone:TAIPEI_TZ}).format(today);
  eventsMonthFilter.value = "";
  eventsCalendarMonth = ""; eventsCalendarDate = "";
  if (days === "all") { eventsStartFilter.value = ""; eventsEndFilter.value = ""; if(eventsAreaSearch) eventsAreaSearch.value=""; if(eventsCityFilter) eventsCityFilter.value="ALL"; }
  else {
    const endDate = new Date(today.getTime() + Number(days)*dayMs);
    const end = new Intl.DateTimeFormat("en-CA",{year:"numeric",month:"2-digit",day:"2-digit",timeZone:TAIPEI_TZ}).format(endDate);
    eventsStartFilter.value = start;
    eventsEndFilter.value = end;
  }
  $$("[data-events-window]").forEach(b => b.classList.toggle("active", b.dataset.eventsWindow === String(days)));
  renderAllEventsModal();
}
$("#viewMoreBtn")?.addEventListener("click", openAllEventsModal);
$("#allEventsClose")?.addEventListener("click", closeAllEventsModal);
allEventsModal?.addEventListener("click", e => { if (e.target === allEventsModal) closeAllEventsModal(); });
[eventsMonthFilter,eventsStartFilter,eventsEndFilter,eventsCityFilter].filter(Boolean).forEach(input => input.addEventListener("change", () => {
  $$("[data-events-window]").forEach(b => b.classList.remove("active"));
  if(input===eventsMonthFilter){ eventsCalendarMonth=eventsMonthFilter.value||""; eventsCalendarDate=""; }
  renderAllEventsModal();
}));
$("#eventsCalendarPrev")?.addEventListener("click",()=>{eventsCalendarMonth=shiftMonth(eventsCalendarMonth||eventsMonthFilter?.value||taipeiMonthKey(),-1);eventsCalendarDate="";if(eventsMonthFilter)eventsMonthFilter.value=eventsCalendarMonth;renderAllEventsModal();});
$("#eventsCalendarNext")?.addEventListener("click",()=>{eventsCalendarMonth=shiftMonth(eventsCalendarMonth||eventsMonthFilter?.value||taipeiMonthKey(),1);eventsCalendarDate="";if(eventsMonthFilter)eventsMonthFilter.value=eventsCalendarMonth;renderAllEventsModal();});
eventsAreaSearch?.addEventListener("input", renderAllEventsModal);
$("#eventsFilterReset")?.addEventListener("click", () => setQuickEventWindow("all"));
$$('[data-events-window]').forEach(btn => btn.addEventListener("click", () => setQuickEventWindow(btn.dataset.eventsWindow)));
window.addEventListener("keydown", e => { if (e.key === "Escape") closeAllEventsModal(); });
$("#featuredDetailBtn").addEventListener("click", () => openDetail(state.featuredId));
$("#featuredPrevBtn")?.addEventListener("click", () => { stepFeatured(-1); startFeaturedAutoplay(); });
$("#featuredNextBtn")?.addEventListener("click", () => { stepFeatured(1); startFeaturedAutoplay(); });
document.addEventListener("visibilitychange",()=>{ if(!document.hidden) startFeaturedAutoplay(); });
$("#featuredSourceBtn").addEventListener("click", () => { const e = state.events.find(x => x.id === state.featuredId) || seedEvents[0]; window.open(safeUrl(e.sourceUrl), "_blank", "noopener,noreferrer"); });
$(".follow-feature").addEventListener("click", e => toggleFollow(e.currentTarget.dataset.artist || "Stray Kids"));
$("#clearFollowingBtn").addEventListener("click", openArtistDirectory);
$("#detailClose").addEventListener("click", closeDetail);
$("#detailBackdrop").addEventListener("click", closeDetail);
document.addEventListener("keydown", e => { if (e.key === "Escape") { closeDetail(); closeViewer(); } });

function applyTheme(mode, persist = true) {
  const light = mode === "light";
  document.body.classList.toggle("light-mode", light);
  document.documentElement.style.colorScheme = light ? "light" : "dark";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", light ? "#f5f2ef" : "#0b0d10");
  document.querySelectorAll(".theme-choice button").forEach(btn => btn.classList.toggle("active", btn.dataset.theme === (light ? "light" : "dark")));
  if (persist) saveMode(light ? "light" : "dark");
  if (typeof renderVenue === "function") requestAnimationFrame(() => { try { renderVenue(); drawSeatPreview(); } catch {} });
}
const savedTheme = localStorage.getItem("neul-mode") || localStorage.getItem("stan-mode") || "dark";
applyTheme(savedTheme, false);
$("#themeDarkBtn")?.addEventListener("click", () => applyTheme("dark"));
$("#themeLightBtn")?.addEventListener("click", () => applyTheme("light"));

const venueSelect = $("#venueSelect");
const layoutSelect = $("#layoutSelect");
const sectionSelect = $("#sectionSelect");
const rowSelect = $("#rowSelect");
const seatNumberInput = $("#seatNumberInput");
const viewerHeightSelect = $("#viewerHeightSelect");
const postureTabs = $("#postureTabs");
const lensTabs = $("#lensTabs");
const previewCanvas = $("#seatPreviewCanvas");
const overviewCanvas = $("#venueOverviewCanvas");
const officialSeatMapPanel = $("#officialSeatMapPanel");
const officialSeatMapFrame = $("#officialSeatMapFrame");
const officialSeatMapImage = $("#officialSeatMapImage");
const officialSeatMapMarker = $("#officialSeatMapMarker");
const officialSeatMapLoading = $("#officialSeatMapLoading");
const officialSeatMapSource = $("#officialSeatMapSource");
const officialSeatMapSync = $("#officialSeatMapSync");
const officialSeatMapSourceLink = $("#officialSeatMapSourceLink");
let officialSeatMapKey = "";
let venueWebGL = null;
let webglStatus = "loading";

function activeVenueModel() { return getVenueModel(state.venueId); }
function currentVenueLayout() { return getVenueLayout(state.layoutId); }
function activeLayoutEvent() {
  const layout = currentVenueLayout();
  return layout?.eventId ? state.events.find(e => e.id === layout.eventId) || null : null;
}
function officialSeatMapSourceForCurrentLayout() {
  const layout = currentVenueLayout();
  const event = activeLayoutEvent();
  if (!layout?.eventId || !event) return null;
  let cachedResolved="";
  try{ cachedResolved=localStorage.getItem(`neul-seatmap-hash:${event.id}:resolvedUrl`)||""; }catch{}
  const machineRaw = event.seatLayoutSourceUrl || event.seatMapResolvedUrl || cachedResolved || layout.seatMapResolvedUrl || layout.latestSeatLayoutSourceUrl || (layout.seatMapDetected && !event.seatLayoutDisplayUrl ? layout.sourceUrl : null);
  const displayRaw = event.seatLayoutDisplayUrl || machineRaw;
  let cachedSourcePage="";try{cachedSourcePage=localStorage.getItem(`neul-seatmap-hash:${event.id}:sourcePage`)||"";}catch{}
  const sourcePage=event.seatLayoutResolvedFrom || cachedSourcePage || event.ticketUrl || event.ticketSourceUrl || event.sourceUrl || layout.sourceUrl || machineRaw || "";
  if (!displayRaw) return { event, layout, missing:true, raw:"", machineRaw:"", sourcePage, displayOnly:false, proxied:"" };
  const displayOnly=Boolean(event.seatLayoutDisplayUrl && !event.seatLayoutSourceUrl && !cachedResolved);
  const proxied=event.seatLayoutDisplayUrl || `/api/seat-map-image?url=${encodeURIComponent(machineRaw||displayRaw)}`;
  return { event, layout, missing:false, raw:displayRaw, machineRaw:machineRaw||displayRaw, sourcePage, displayOnly, proxied };
}
function normalizeSeatMapSectionLabel(value = "") {
  return String(value || "").toUpperCase().replace(/[區席票座位\s_]/g, "").replace(/[（）()]/g, "").replace(/[^A-Z0-9\-\u4e00-\u9fff]/g, "");
}
function seatMapMappings(layout, event) {
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem(`neul-seatmap-hash:${event.id}:analysis`) || 'null'); } catch {}
  const mapped = Array.isArray(layout?.sectionMapping?.mapped) && layout.sectionMapping.mapped.length
    ? layout.sectionMapping.mapped
    : (Array.isArray(cached?.ocr?.mapped) ? cached.ocr.mapped : []);
  const withCoordinates = mapped.filter(m => Number.isFinite(Number(m.x)) && Number.isFinite(Number(m.y)));
  if (withCoordinates.length) return withCoordinates;
  // Hand-calibrated layouts are intentionally protected from OCR geometry overwrite. For those
  // events, use exact OCR label/token matches only to connect the official image to verified 3D sections.
  const tokens = Array.isArray(layout?.sectionMapping?.tokens) ? layout.sectionMapping.tokens : (Array.isArray(cached?.ocr?.tokens) ? cached.ocr.tokens : []);
  const sections = effectiveSections(state.venueId, state.layoutId);
  const byAlias = new Map();
  for (const sec of sections) for (const alias of [sec.id, sec.label, sec.officialId, ...(sec.aliases || [])]) {
    const key = normalizeSeatMapSectionLabel(alias);
    if (key && !byAlias.has(key)) byAlias.set(key, String(sec.id));
  }
  const out = [];
  for (const token of tokens) {
    const key = normalizeSeatMapSectionLabel(token.text);
    const section = byAlias.get(key);
    if (!section || !Number.isFinite(Number(token.x)) || !Number.isFinite(Number(token.y))) continue;
    out.push({ token: token.text, section, confidence: token.confidence, score: 100, x: Number(token.x), y: Number(token.y), exactTokenMatch: true });
  }
  return out;
}
function seatMapImagePoint(normalizedX, normalizedY) {
  if (!officialSeatMapImage?.naturalWidth || !officialSeatMapFrame) return null;
  const fw = officialSeatMapFrame.clientWidth, fh = officialSeatMapFrame.clientHeight;
  const iw = officialSeatMapImage.naturalWidth, ih = officialSeatMapImage.naturalHeight;
  const scale = Math.min(fw / iw, fh / ih);
  const rw = iw * scale, rh = ih * scale, ox = (fw - rw) / 2, oy = (fh - rh) / 2;
  return { x: ox + normalizedX * rw, y: oy + normalizedY * rh, ox, oy, rw, rh };
}
function updateOfficialSeatMapMarker() {
  if (!officialSeatMapPanel || officialSeatMapPanel.hidden || !officialSeatMapMarker) return;
  const source = officialSeatMapSourceForCurrentLayout();
  if (!source) { officialSeatMapMarker.hidden = true; return; }
  const match = seatMapMappings(source.layout, source.event).find(m => String(m.section) === String(state.section) && Number.isFinite(Number(m.x)) && Number.isFinite(Number(m.y)));
  if (!match) { officialSeatMapMarker.hidden = true; return; }
  const pt = seatMapImagePoint(Number(match.x), Number(match.y));
  if (!pt) { officialSeatMapMarker.hidden = true; return; }
  officialSeatMapMarker.hidden = false;
  officialSeatMapMarker.style.left = `${pt.x}px`;
  officialSeatMapMarker.style.top = `${pt.y}px`;
  officialSeatMapMarker.title = `官方座位圖：${match.token || match.section} → ${match.section}`;
}
function selectMappedSeatMapSection(sectionId) {
  const tiers = availableVenueTiers();
  const tier = tiers.find(t => (t.sections || []).map(String).includes(String(sectionId)));
  if (!tier) return false;
  state.floor = tier.id;
  state.section = String(sectionId);
  renderTierTabs();
  refreshSectionOptions(false);
  updateSeatLabel();
  return true;
}
function renderOfficialSeatMap(force = false) {
  if (!officialSeatMapPanel || !officialSeatMapImage) return;
  const source = officialSeatMapSourceForCurrentLayout();
  if (!source) {
    officialSeatMapPanel.hidden = true;
    officialSeatMapPanel.classList.remove('is-pending');
    officialSeatMapKey = "";
    officialSeatMapImage.removeAttribute('src');
    return;
  }
  officialSeatMapPanel.hidden = false;
  if (officialSeatMapSourceLink) {
    const href=source.sourcePage || source.raw;
    officialSeatMapSourceLink.hidden=!href;
    if(href) officialSeatMapSourceLink.href=safeUrl(href);
  }
  if(source.missing){
    officialSeatMapPanel.classList.add('is-pending');
    officialSeatMapKey=`${source.event.id}|pending`;
    officialSeatMapImage.removeAttribute('src');
    if(officialSeatMapMarker) officialSeatMapMarker.hidden=true;
    if(officialSeatMapSource) officialSeatMapSource.textContent=source.event.sourceName || source.event.ticketing || '官方來源持續自動驗證';
    if(officialSeatMapSync) officialSeatMapSync.textContent='尚未取得可顯示官方座位圖 · 3D 目前為待校正草稿';
    if(officialSeatMapLoading){ officialSeatMapLoading.hidden=false; officialSeatMapLoading.textContent='官方座位圖尚未取得；系統會持續從售票／主辦／場館來源自動回補。'; }
    return;
  }
  officialSeatMapPanel.classList.remove('is-pending');
  if (officialSeatMapSource) officialSeatMapSource.textContent = source.event.seatLayoutDisplaySource || source.layout.sourceName || source.event.sourceName || source.event.ticketing || '官方座位配置';
  if (officialSeatMapSync) {
    const mapped = seatMapMappings(source.layout, source.event).length;
    officialSeatMapSync.textContent = mapped ? `OCR/Vision 已對應 ${mapped} 區` : '官方原圖 · 等待/使用票區校正';
  }
  const key = `${source.event.id}|${source.raw}`;
  if (!force && key === officialSeatMapKey && officialSeatMapImage.getAttribute('src')) { updateOfficialSeatMapMarker(); return; }
  officialSeatMapKey = key;
  if (officialSeatMapLoading) { officialSeatMapLoading.hidden = false; officialSeatMapLoading.textContent = '載入官方座位圖…'; }
  officialSeatMapMarker.hidden = true;
  let triedDirect=false;
  officialSeatMapImage.onload = () => { if (officialSeatMapLoading) officialSeatMapLoading.hidden = true; updateOfficialSeatMapMarker(); };
  officialSeatMapImage.onerror = () => {
    if(!triedDirect && source.raw && officialSeatMapImage.src!==source.raw){
      triedDirect=true;
      officialSeatMapImage.src=source.raw;
      return;
    }
    if (officialSeatMapLoading) { officialSeatMapLoading.hidden = false; officialSeatMapLoading.textContent = '官方座位圖來源已找到，但圖片暫時無法顯示；3D 仍保留已解析校正資料。'; }
    officialSeatMapMarker.hidden = true;
  };
  officialSeatMapImage.src = source.proxied || source.raw;
}
function handleOfficialSeatMapClick(ev) {
  const source = officialSeatMapSourceForCurrentLayout();
  if (!source || !officialSeatMapImage?.naturalWidth || !officialSeatMapFrame) return;
  const rect = officialSeatMapFrame.getBoundingClientRect();
  const fw = rect.width, fh = rect.height, iw = officialSeatMapImage.naturalWidth, ih = officialSeatMapImage.naturalHeight;
  const scale = Math.min(fw / iw, fh / ih), rw = iw * scale, rh = ih * scale, ox = (fw - rw) / 2, oy = (fh - rh) / 2;
  const x = ev.clientX - rect.left, y = ev.clientY - rect.top;
  if (x < ox || x > ox + rw || y < oy || y > oy + rh) return;
  const nx = (x - ox) / rw, ny = (y - oy) / rh;
  let best = null, bestD = .11;
  for (const m of seatMapMappings(source.layout, source.event)) {
    if (!Number.isFinite(Number(m.x)) || !Number.isFinite(Number(m.y))) continue;
    const d = Math.hypot(nx - Number(m.x), ny - Number(m.y));
    if (d < bestD) { bestD = d; best = m; }
  }
  if (best && selectMappedSeatMapSection(best.section)) updateOfficialSeatMapMarker();
}
function tierById(id) { return getVenueTier(state.venueId, id, state.layoutId); }
function availableVenueTiers() {
  const model = activeVenueModel();
  const tiers = effectiveTiers(state.venueId, state.layoutId);
  if (state.venueId === "taipei-dome" && state.layoutId === "taipei-dome-base") return tiers.filter(t => t.id !== "FLOOR");
  return tiers;
}
function renderVenueIdentity() {
  const model = activeVenueModel();
  const title = $("#venueTitle");
  if (title) { title.textContent = model.name; title.title = model.name; }
  if (overviewCanvas) overviewCanvas.setAttribute("aria-label", `${model.name} 3D 區域模型`);
  const canvasLabel = $("#venueCanvas");
  if (canvasLabel) canvasLabel.setAttribute("aria-label", `${model.name}互動 3D 場館`);
  const tip = $(".venue-tip");
  if (tip) tip.title = `${model.sourceName}：${model.sourceUrl}`;
}
function renderVenueOptions() {
  if (!venueSelect) return;
  venueSelect.innerHTML = taiwanVenueModels().map(v => `<option value="${escapeHtml(v.id)}" ${v.id===state.venueId?"selected":""}>${escapeHtml(v.name)}</option>`).join("");
}
function renderLayoutOptions() {
  const now=Date.now();
  const model=activeVenueModel();
  const all=layoutsForVenue(state.venueId);
  const options=all.filter(layout=>{
    // Keep the completed IVE Taipei reconstruction as an explicit reference sample in the
    // Taipei Arena activity selector. It is never treated as an upcoming event elsewhere.
    if(layout.id==="ive-show-what-i-am-2026" && state.venueId==="taipei-arena") return true;
    if(layout.id===model.baseLayoutId || !layout.eventId) return !layout.historical;
    const event=state.events.find(e=>e.id===layout.eventId);
    if(!event || event.historical) return false;
    return !eventLifecycle(event,now).ended;
  }).sort((a,b)=>{
    if(a.id===model.baseLayoutId) return -1;
    if(b.id===model.baseLayoutId) return 1;
    const ea=state.events.find(e=>e.id===a.eventId), eb=state.events.find(e=>e.id===b.eventId);
    return new Date(ea?.start||0)-new Date(eb?.start||0);
  });
  if (!options.some(x => x.id === state.layoutId)) {
    // If the selected concert has just ended, immediately move the 3D selector to the next
    // upcoming event at this venue instead of leaving an archived layout visible.
    const nextEventLayout=options
      .filter(x=>x.eventId)
      .sort((a,b)=>{
        const ea=state.events.find(e=>e.id===a.eventId), eb=state.events.find(e=>e.id===b.eventId);
        return new Date(ea?.start||0)-new Date(eb?.start||0);
      })[0];
    state.layoutId=nextEventLayout?.id||model.baseLayoutId;
  }
  layoutSelect.innerHTML = options.map(x => {
    const label=x.id==="ive-show-what-i-am-2026" ? `${x.label} · IVE 範例` : x.label;
    return `<option value="${escapeHtml(x.id)}" ${x.id===state.layoutId?"selected":""}>${escapeHtml(label)}</option>`;
  }).join("");
  layoutSelect.title = getVenueLayout(state.layoutId)?.label || "";
}

function setVenue(venueId, layoutId = null) {
  const model = getVenueModel(venueId);
  state.venueId = model.id;
  const candidate = layoutId ? getVenueLayout(layoutId) : null;
  state.layoutId = candidate?.venueId === model.id ? candidate.id : model.baseLayoutId;
  const activeLayout = getVenueLayout(state.layoutId);
  state.floor = activeLayout.defaultTier || model.defaultTier;
  state.section = activeLayout.defaultSection || model.defaultSection;
  state.row = String(activeLayout.defaultRow || model.defaultRow || 10);
  if (venueSelect) venueSelect.value = state.venueId;
  renderVenueIdentity();
  renderLayoutOptions();
  renderTierTabs();
  refreshSectionOptions(true);
  renderOfficialSeatMap(true);
}
function renderTierTabs() {
  const tabs = $("#floorTabs");
  const tiers = availableVenueTiers();
  if (!tiers.some(t => t.id === state.floor)) state.floor = tiers[0].id;
  tabs.innerHTML = tiers.map(t => `<button class="${t.id === state.floor ? "active" : ""}" data-floor="${escapeHtml(t.id)}" title="${escapeHtml(t.label)}">${escapeHtml(t.short)}</button>`).join("");
  $$("button", tabs).forEach(btn => btn.addEventListener("click", () => {
    state.floor = btn.dataset.floor;
    renderTierTabs();
    refreshSectionOptions(true);
  }));
}
function refreshRowOptions() {
  const section = getVenueSection(state.venueId, state.section, state.layoutId);
  const minRow = Math.max(1, Number(section?.rowMin || 1));
  const maxRow = Math.max(minRow, Number(section?.rowMax || (section?.tier === "LOWER" ? 38 : 30)));
  const current = Math.max(minRow, Math.min(maxRow, Number(state.row) || minRow));
  state.row = String(current);
  rowSelect.innerHTML = Array.from({length:maxRow-minRow+1},(_,i)=>minRow+i).map(n=>`<option value="${n}" ${n===current?"selected":""}>${n}</option>`).join("");
  const seatMax = Number(section?.seatEstimateMax);
  if (seatNumberInput) {
    seatNumberInput.max = Number.isFinite(seatMax) && seatMax > 0 ? String(seatMax) : "99";
    seatNumberInput.placeholder = Number.isFinite(seatMax) && seatMax > 0 ? `公開紀錄約至 ${seatMax}，依排別` : "依票券座號";
    seatNumberInput.title = Number.isFinite(seatMax) && seatMax > 0 ? `本區公開座位紀錄上限約 ${seatMax} 號；不同排別可能不同。` : "此區尚無可靠逐排座號上限，請以官方票券為準。";
  }
}
function refreshSectionOptions(forceDefault = false) {
  const tier = tierById(state.floor);
  if (forceDefault || !tier.sections.includes(String(state.section))) state.section = tier.sections[Math.floor(tier.sections.length / 2)] || tier.sections[0];
  sectionSelect.innerHTML = tier.sections.map(id => {
    const sec=getVenueSection(state.venueId,id,state.layoutId);
    const label=sec?.label || id;
    const ticket=sectionTicketLabel(state.layoutId,id);
    const optionLabel=ticket ? `${label} · ${ticket}` : label;
    return `<option value="${escapeHtml(id)}" ${id === String(state.section) ? "selected" : ""}>${escapeHtml(optionLabel)}</option>`;
  }).join("");
  refreshRowOptions();
  updateSeatLabel();
}
function updateSeatWarning() {
  const box = $("#seatWarning");
  const confidence = $("#venueConfidence");
  const model = activeVenueModel();
  const layout = currentVenueLayout();
  const warning = venueSectionWarning(state.venueId, state.section, state.row, state.layoutId, {heightCm:state.viewerHeight,posture:state.posture,seatNumber:state.seatNumber,lens:state.lens});
  confidence.textContent = layout.historical
    ? "歷史官方票區圖重建 · 區域位置校正 · 單席視角未宣稱精準"
    : layout.eventId
      ? "官方本場配置已核對 · 固定席排數依公開座位紀錄校正 · 座號依排別可能不同 · 現場舞台／燈光為 3D 模擬"
      : `${model.confidence} · 舞台依目前公開資料呈現 · 現場燈光為模擬`;
  if (!warning.messages.length) { box.hidden = true; return; }
  box.hidden = false;
  box.className = `seat-warning ${warning.level}`;
  box.innerHTML = warning.messages.map(m => `<span>${escapeHtml(m)}</span>`).join("");
}
function updateSeatLabel() {
  const tier = tierById(state.floor);
  const id = String(state.section);
  const sectionObj = getVenueSection(state.venueId,id,state.layoutId);
  const sectionLabel = sectionObj?.label || id;
  const model = activeVenueModel();
  const seatText = state.seatNumber ? ` ${state.seatNumber}號` : "";
  $("#previewSeatLabel").textContent = `${tier.label} · ${sectionLabel} ${state.row}排${seatText}`;
  $("#viewerSeatLabel").textContent = `${model.en} · ${tier.label} · ${sectionLabel} ${state.row}排${seatText}`;
  const lensLabel = ({eye:"肉眼",phone1:"1×",phone2:"2×",phone5:"5×"})[state.lens] || "肉眼";
  const chip=$("#viewerLensChip"); if(chip) chip.textContent=`${lensLabel} · ${state.viewerHeight}cm · ${state.posture==="standing"?"站著":"坐著"}`;
  const zone = $(".selected-zone");
  if (zone) zone.textContent = id;
  const exactPrice = sectionTicketLabel(state.layoutId, id);
  // 3D must never paste an event-wide list of every price onto one selected section.
  // Only show a price when the official zone label can be reliably mapped to this section.
  const shownPrice = exactPrice ? `本區 ${exactPrice}` : "";
  const selectedPrice = $("#selectedPrice");
  if (selectedPrice) {
    selectedPrice.hidden = !shownPrice;
    selectedPrice.textContent = shownPrice;
    selectedPrice.title = exactPrice ? "依官方本場票區名稱對應" : "本區尚無可靠官方價位對應";
  }
  const viewerPriceChip = $("#viewerPriceChip");
  if (viewerPriceChip) {
    viewerPriceChip.hidden = !shownPrice;
    viewerPriceChip.textContent = shownPrice;
  }
  updateSeatWarning();
  drawSeatPreview();
  drawVenueOverview();
  renderOfficialSeatMap(false);
  updateOfficialSeatMapMarker();
}

venueSelect?.addEventListener("change", e => setVenue(e.target.value));
layoutSelect.addEventListener("change", e => {
  state.layoutId = e.target.value;
  const layout = currentVenueLayout();
  if (state.venueId === "taipei-dome" && state.layoutId === "taipei-dome-base" && state.floor === "FLOOR") state.floor = "LOWER";
  if (layout.defaultTier) state.floor = layout.defaultTier;
  if (layout.defaultSection) state.section = layout.defaultSection;
  if (layout.defaultRow) state.row = String(layout.defaultRow);
  renderTierTabs();
  refreshSectionOptions(false);
  renderOfficialSeatMap(true);
});
sectionSelect.addEventListener("change", e => { state.section = e.target.value; refreshRowOptions(); updateSeatLabel(); });
rowSelect.addEventListener("change", e => { state.row = e.target.value; updateSeatLabel(); });
seatNumberInput?.addEventListener("input", e => { state.seatNumber = String(e.target.value || ""); updateSeatLabel(); });
viewerHeightSelect?.addEventListener("change", e => { state.viewerHeight = Number(e.target.value)||160; updateSeatLabel(); });
postureTabs?.addEventListener("click", e => { const b=e.target.closest("button[data-posture]"); if(!b)return; state.posture=b.dataset.posture; $$("button",postureTabs).forEach(x=>x.classList.toggle("active",x===b)); updateSeatLabel(); });
lensTabs?.addEventListener("click", e => { const b=e.target.closest("button[data-lens]"); if(!b)return; state.lens=b.dataset.lens; $$("button",lensTabs).forEach(x=>x.classList.toggle("active",x===b)); updateSeatLabel(); requestVenueFrame(); });
officialSeatMapFrame?.addEventListener("click", handleOfficialSeatMapClick);
window.addEventListener("resize", () => updateOfficialSeatMapMarker(), { passive: true });
$("#seatPreviewBtn").addEventListener("click", () => { updateSeatLabel(); openViewer(true); });
$("#open3dBtn").addEventListener("click", () => openViewer(false));
$("#expandPreviewBtn").addEventListener("click", () => openViewer(true));


const viewer = $("#viewerModal");
const canvas = $("#venueCanvas");
let yaw = -.45, pitch = .72, zoom = 1, dragging = false, px = 0, py = 0, seatMode = false, raf = 0;
const activePointers = new Map();
let pinchDistance = 0;

function activeSection() { return getVenueSection(state.venueId, state.section, state.layoutId); }
function activeStage() { return currentVenueLayout().stage || activeVenueModel().stage; }
function activeSeatTarget() {
  const stage = activeStage();
  const id = String(state.section);
  const layout = currentVenueLayout();
  const section = activeSection();
  if (stage.bStage && layout.bStageFacingSections?.includes(id)) return [stage.bStage.x, stage.bStage.y + 8, stage.bStage.z];
  const m=stage.main;
  const seat=venueSectionPosition(state.venueId, section, Number(state.row), state.seatNumber);
  const isCenterStage = Math.abs(m.z) < Math.max(18,(m.depth||24)*.45) && !stage.runway;
  if (isCenterStage) return [m.x, m.y + 12, m.z];
  // Aim at the performance surface, not the LED/back-wall plane. Side seats get a slightly
  // biased target so they look across the stage naturally instead of "through" the screen.
  const frontZ=m.z + Math.max(9,(m.depth||24)*.60);
  const sideSeat=Math.abs(seat.x-m.x) > Math.max(48,(m.width||80)*.46);
  const targetX=Math.max(m.x-(m.width||80)*.30,Math.min(m.x+(m.width||80)*.30,m.x+(seat.x-m.x)*.18));
  const behindStage=seat.z < m.z-Math.max(8,(m.depth||24)*.30);
  if (stage.runway && (sideSeat || /^(紅2|紫2)/.test(id))) {
    const nearRunwayZ=Math.min(stage.runway.z2, Math.max(stage.runway.z1, frontZ + Math.abs(stage.runway.z2-stage.runway.z1)*.20));
    return [stage.runway.x + (targetX-m.x)*.22, m.y + 10, nearRunwayZ];
  }
  if (behindStage) return [targetX, m.y + 10, frontZ + Math.max(6,(m.depth||24)*.18)];
  return [targetX, m.y + 15, frontZ];
}
function viewerEyeOffset() {
  const h = Math.max(140,Math.min(195,Number(state.viewerHeight)||160));
  return (state.posture === "standing" ? 10.2 : 6.8) + (h-160)*.035;
}
function lensFov() { return ({eye:55,phone1:64,phone2:34,phone5:16})[state.lens] || 55; }
function seatCameraPosition() {
  const p = venueSectionPosition(state.venueId, activeSection(), Number(state.row), state.seatNumber);
  return [p.x, p.y + viewerEyeOffset(), p.z];
}
function activeOccluders(){
  const id=String(state.section), row=Number(state.row), p=seatCameraPosition(), t=activeSeatTarget();
  let dx=t[0]-p[0], dz=t[2]-p[2], len=Math.hypot(dx,dz)||1; dx/=len; dz/=len;
  const rx=-dz, rz=dx, ry=Math.atan2(dx,dz);
  const out=[];
  const rail=(distance=7,width=38,height=3.8)=>out.push({kind:"rail",x:p[0]+dx*distance,y:p[1]-2.7,z:p[2]+dz*distance,width,depth:1.2,height,ry,color:"#59616a"});
  const overhang=(distance=13,width=78,depth=36)=>out.push({kind:"overhang",x:p[0]+dx*distance,y:p[1]+15,z:p[2]+dz*distance,width,depth,height:4.2,ry,color:"#242b31"});
  const overhead=(distance=16,width=22,depth=9,height=7)=>out.push({kind:"equipment",x:p[0]+dx*distance,y:p[1]+13,z:p[2]+dz*distance,width,depth,height,ry,color:"#20262c"});
  const crowd=()=>{
    const baseY=(activeSection()?.y??-20), frontH=9.0;
    [-3.2,3.2,0].forEach((off,i)=>out.push({kind:"crowd",x:p[0]+dx*(8+i*2)+rx*off,y:baseY+frontH/2,z:p[2]+dz*(8+i*2)+rz*off,width:2.5,depth:2.5,height:frontH,ry:0,color:"#171a1f"}));
  };

  if(state.venueId==="taipei-dome") {
    const frontRisk=(row<=3)||((id==="107"&&row<=8)||(id==="122"&&row<=9)||(id==="222"&&row<=2)||(id==="301"&&row<=2));
    if(frontRisk) rail();
    if((id==="108"||id==="111")&&row>=35) overhang();
    if(activeSection()?.tier==="FLOOR") crowd();
    return out;
  }
  if(state.venueId==="ntsu-arena") {
    if(row===0 || row>=14) rail(6,34,3.2);
    return out;
  }
  if(state.venueId==="taipei-arena") {
    if(/^黃3/.test(id) && row>=26) overhang(12,70,30);
    if(row<=2) rail(6,32,3.0);
    return out;
  }
  if(state.venueId==="kaohsiung-arena") {
    if(/^4/.test(id) && row<=1) rail(6,34,3.4);
    if(id==="208" && row<=2) crowd();
    if(id==="220") overhead(18,18,9,8);
    return out;
  }
  if(state.venueId==="taipei-music-center") {
    if(id.startsWith("3") && row<=3) rail(6,34,3.0);
    if(id.startsWith("1F")) crowd();
    return out;
  }
  if(state.venueId==="kaohsiung-music-center") {
    if(id==="2A2") { rail(6,30,3.2); overhead(18,24,10,8); }
    if((id==="2B1" && row<=1) || id==="2E1" || id==="2E2" || id==="2C1-1") rail(6,30,3.4);
    if(id==="2C3") rail(7,34,3.0);
    return out;
  }
  if(state.venueId==="tianmu-gymnasium") {
    if(/^[LR]/.test(id) && row<=3) rail(6,34,3.5);
    if(id.startsWith("平面")) crowd();
    return out;
  }
  if(state.venueId==="ticc") {
    if(/BOX/.test(id) && row<=3) rail(5,24,3.2);
    if(id==="2F-A" && row<=1) crowd();
  }
  if(["taoyuan-arena","ntu-sports-center","kaohsiung-stadium"].includes(state.venueId) && id.startsWith("平面")) crowd();
  return out;
}

function openViewer(seat = false) {
  seatMode = seat;
  if (seat) { yaw = 0; pitch = 0; zoom = 1.08; } else { yaw = -.45; pitch = .72; zoom = 1; }
  updateSeatLabel();
  $("#viewerHelp").textContent = seat
    ? "拖曳左右觀看 · 可切肉眼／手機倍率 · 真 3D 座椅列／階梯／走道／欄杆與舞台螢幕"
    : "拖曳旋轉場館 · 滾輪／雙指縮放 · 選取區域會高亮";
  viewer.hidden = false; document.body.style.overflow = "hidden";
  requestVenueFrame();
}
function closeViewer() { viewer.hidden = true; document.body.style.overflow = ""; if (raf) { cancelAnimationFrame(raf); raf = 0; } }
$("#viewerClose").addEventListener("click", closeViewer);

canvas.addEventListener("pointerdown", e => {
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  dragging = activePointers.size === 1;
  px = e.clientX; py = e.clientY;
  canvas.setPointerCapture?.(e.pointerId);
});
canvas.addEventListener("pointermove", e => {
  if (!activePointers.has(e.pointerId)) return;
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const points = [...activePointers.values()];
  if (points.length >= 2) {
    const d = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
    if (pinchDistance) zoom = Math.max(.55, Math.min(1.9, zoom + (d - pinchDistance) * .004));
    pinchDistance = d; dragging = false; requestVenueFrame(); return;
  }
  pinchDistance = 0;
  if (!dragging) { dragging = true; px = e.clientX; py = e.clientY; return; }
  if (seatMode) {
    yaw = Math.max(-1.55, Math.min(1.55, yaw + (e.clientX - px) * .006));
    pitch = Math.max(-.72, Math.min(.72, pitch - (e.clientY - py) * .005));
    requestVenueFrame();
  } else {
    yaw += (e.clientX - px) * .007;
    pitch = Math.max(.13, Math.min(1.32, pitch + (e.clientY - py) * .006));
    requestVenueFrame();
  }
  px = e.clientX; py = e.clientY;
});
function releasePointer(e) { activePointers.delete(e.pointerId); pinchDistance = 0; dragging = false; }
canvas.addEventListener("pointerup", releasePointer);
canvas.addEventListener("pointercancel", releasePointer);
canvas.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") releasePointer(e); });
canvas.addEventListener("wheel", e => { e.preventDefault(); zoom = Math.max(.55, Math.min(1.9, zoom - e.deltaY * .001)); requestVenueFrame(); }, { passive: false });

function vecNorm(v) { const l = Math.hypot(v[0],v[1],v[2]) || 1; return [v[0]/l,v[1]/l,v[2]/l]; }
function vecCross(a,b) { return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }
function vecDot(a,b) { return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
function rotateDirection(base, yawOffset, pitchOffset) {
  const baseYaw = Math.atan2(base[0], base[2]);
  const basePitch = Math.asin(Math.max(-1, Math.min(1, base[1])));
  const ay = baseYaw + yawOffset, ap = basePitch + pitchOffset;
  return [Math.sin(ay)*Math.cos(ap), Math.sin(ap), Math.cos(ay)*Math.cos(ap)];
}
function makeSeatProjector(cw, ch, localYaw = yaw, localPitch = pitch, localZoom = zoom) {
  const cam = seatCameraPosition(), target = activeSeatTarget();
  const base = vecNorm([target[0]-cam[0], target[1]-cam[1], target[2]-cam[2]]), forward = vecNorm(rotateDirection(base, localYaw, localPitch));
  let right = vecNorm(vecCross(forward, [0,1,0])); if (Math.hypot(...right) < .1) right = [1,0,0];
  const up = vecNorm(vecCross(right, forward)), fov=Math.max(12,Math.min(82,lensFov()/Math.max(.55,localZoom))), focal=(ch/2)/Math.tan((fov*Math.PI/180)/2);
  return p => { const rel=[p[0]-cam[0],p[1]-cam[1],p[2]-cam[2]], z=vecDot(rel,forward); if(z<=2)return null; const x=vecDot(rel,right), y=vecDot(rel,up), f=focal/z; return [cw/2+x*f,ch*.56-y*f,z]; };
}
function makeOrbitProjector(cw, ch, localYaw = yaw, localPitch = pitch, localZoom = zoom) {
  return p => { let [x,y,z]=p; const cy=Math.cos(localYaw),sy=Math.sin(localYaw),cp=Math.cos(localPitch),sp=Math.sin(localPitch); const x1=x*cy-z*sy,z1=x*sy+z*cy,y1=y*cp-z1*sp,z2=y*sp+z1*cp,denom=z2+760; if(denom<=10)return null; const f=520*localZoom/denom; return [cw/2+x1*f,ch*.55-y1*f,denom]; };
}
function sectionPoly(section) {
  if (section.tier === "FLOOR" || section.shape === "block" || Number.isFinite(section.x)) {
    const w=section.width || 38,d=section.depth || 32,y=section.y ?? -20; return [[section.x-w/2,y,section.z-d/2],[section.x+w/2,y,section.z-d/2],[section.x+w/2,y,section.z+d/2],[section.x-w/2,y,section.z+d/2]];
  }
  const half=section.span || .11, outerX=section.radiusX+22,outerZ=section.radiusZ+17,innerX=section.radiusX-5,innerZ=section.radiusZ-4,y0=section.y,y1=section.y+11;
  return [[Math.cos(section.angle-half)*innerX,y0,Math.sin(section.angle-half)*innerZ],[Math.cos(section.angle+half)*innerX,y0,Math.sin(section.angle+half)*innerZ],[Math.cos(section.angle+half)*outerX,y1,Math.sin(section.angle+half)*outerZ],[Math.cos(section.angle-half)*outerX,y1,Math.sin(section.angle-half)*outerZ]];
}
function circlePoly(x,y,z,r,n=18){return Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2;return[x+Math.cos(a)*r,y,z+Math.sin(a)*r];});}

function renderVenueScene(targetCanvas, opts = {}) {
  const context=targetCanvas.getContext("2d"), rect=targetCanvas.getBoundingClientRect(), dpr=Math.min(devicePixelRatio||1,2), w=Math.max(1,Math.floor(rect.width*dpr)), h=Math.max(1,Math.floor(rect.height*dpr));
  if(targetCanvas.width!==w||targetCanvas.height!==h){targetCanvas.width=w;targetCanvas.height=h;} context.setTransform(dpr,0,0,dpr,0,0);
  const cw=rect.width,ch=rect.height,model=activeVenueModel(),layout=currentVenueLayout(),grad=context.createLinearGradient(0,0,0,ch); grad.addColorStop(0,"#111821");grad.addColorStop(.6,"#080c10");grad.addColorStop(1,"#050709");context.fillStyle=grad;context.fillRect(0,0,cw,ch);
  const viewSeat=opts.seatMode??seatMode, project=viewSeat?makeSeatProjector(cw,ch,opts.yaw??yaw,opts.pitch??pitch,opts.zoom??zoom):makeOrbitProjector(cw,ch,opts.yaw??yaw,opts.pitch??pitch,opts.zoom??zoom);
  const poly=(points,fill,stroke="#343942",width=1)=>{const pp=points.map(project).filter(Boolean);if(pp.length!==points.length)return;context.beginPath();pp.forEach((q,i)=>i?context.lineTo(q[0],q[1]):context.moveTo(q[0],q[1]));context.closePath();context.fillStyle=fill;context.fill();context.strokeStyle=stroke;context.lineWidth=width;context.stroke();};
  const line=(points,stroke,width=1)=>{const pp=points.map(project).filter(Boolean);if(pp.length<2)return;context.beginPath();pp.forEach((q,i)=>i?context.lineTo(q[0],q[1]):context.moveTo(q[0],q[1]));context.strokeStyle=stroke;context.lineWidth=width;context.stroke();};
  poly([[-model.field.x,-25,-model.field.z],[model.field.x,-25,-model.field.z],[model.field.x,-25,model.field.z],[-model.field.x,-25,model.field.z]],isLight?"#d9dde1":"#b8c0c7",isLight?"#aeb7bf":"#8f9aa3");
  const isLight=document.body.classList.contains("light-mode");
  const selectedId=String(state.section), allowedTiers=availableVenueTiers(), palette=isLight?["#69859a","#7890a3","#8d789b","#71889a","#7c92a2","#657f96"]:["#27313b","#313945","#3b3340","#2f3740","#333b45","#303943"];
  for(const tier of allowedTiers) for(const id of tier.sections){const sec=getVenueSection(state.venueId,id,state.layoutId);if(!sec)continue;const selected=id===selectedId,restricted=layout.restrictedViewSections?.includes(id),floorFacing=layout.bStageFacingSections?.includes(id);let fill=(sec.tier==="FLOOR"||sec.shape==="block")?"#252a31":palette[Math.max(0,allowedTiers.findIndex(t=>t.id===sec.tier))%palette.length];if(layout.id==="plave-keep-it-manic-2026"){const groupFill={vip6300:"#4a262d","5300":"#24433d","3800":"#47442a","2900":"#253b29"};fill=groupFill[sec.group]||fill;}if(layout.id==="le-sserafim-pureflow-2026"){const groupFill={"6980":"#294f8e","6380":"#a7e1e7","5880":"#82c7ee","4680":"#777ac0","3680-4680":"#416fae"};fill=groupFill[sec.group]||fill;}if(layout.id==="babymonster-choom-taipei-2026"){const groupFill={bm6780:"#486ca7",bm5800:"#c27d4a",bm4800:"#9f5360",bm3range:"#64745f"};fill=groupFill[sec.group]||fill;}if(layout.id==="ive-show-what-i-am-2026"){const groupFill={vip7800:"#b44785","5800":"#426b86","4800":"#9b5c62","3800":"#3f827f",side2f:"#52657d","3fRange":"#66507c",box4800:"#76545d"};fill=groupFill[sec.group]||fill;}if(restricted)fill=isLight?"#b97837":"#5a4334";if(floorFacing&&!restricted)fill=isLight?"#7c708c":"#343042";if(selected)fill=isLight?"#dc55e8":"#c47ae3";poly(sectionPoly(sec),fill,selected?(isLight?"#fff1ff":"#f4daf2"):restricted?(isLight?"#f2c27a":"#c29a69"):(isLight?"#9db1c0":"#4a5661"),selected?2.2:.95);}
  const stage=activeStage(),m=stage.main;
  if(m.shape==='circle') poly(circlePoly(m.x,m.y,m.z,Number(m.radius||Math.min(m.width,m.depth)/2),36),"#090b0f","#d2b4cd",1.2);
  else poly([[m.x-m.width/2,m.y,m.z-m.depth/2],[m.x+m.width/2,m.y,m.z-m.depth/2],[m.x+m.width/2,m.y,m.z+m.depth/2],[m.x-m.width/2,m.y,m.z+m.depth/2]],"#090b0f","#d2b4cd",1.2);
  if(Array.isArray(layout.extraStageRects)) for(const r of layout.extraStageRects){const a=Number(r.ry||0),ca=Math.cos(a),sa=Math.sin(a),pts=[[-r.width/2,-r.depth/2],[r.width/2,-r.depth/2],[r.width/2,r.depth/2],[-r.width/2,r.depth/2]].map(([x,z])=>[r.x+x*ca+z*sa,r.y,r.z-x*sa+z*ca]);poly(pts,"#11131a","#a78da2",1.05);}
  if(stage.runway){const r=stage.runway;poly([[r.x-r.width/2,r.y,r.z1],[r.x+r.width/2,r.y,r.z1],[r.x+r.width/2,r.y,r.z2],[r.x-r.width/2,r.y,r.z2]],"#11131a","#9f879d");}
  if(stage.bStage)poly(circlePoly(stage.bStage.x,stage.bStage.y,stage.bStage.z,stage.bStage.radius,stage.bStage.shape==="octagon"?8:18),"#14151c","#b49bb0",1.1);
  if(layout.foh){const f=layout.foh;poly([[f.x-f.width/2,f.y,f.z-f.depth/2],[f.x+f.width/2,f.y,f.z-f.depth/2],[f.x+f.width/2,f.y,f.z+f.depth/2],[f.x-f.width/2,f.y,f.z+f.depth/2]],"#34383d","#858b91",1);}
  if(state.layoutId==="skz-run-it-2026"){poly([[-28,-19,72],[-5,-19,72],[-5,-19,92],[-28,-19,92]],"#3b3e42","#72777d");poly([[5,-19,72],[28,-19,72],[28,-19,92],[5,-19,92]],"#3b3e42","#72777d");}
  if(!viewSeat){for(let r=0;r<3;r++){const pts=Array.from({length:43},(_,i)=>{const a=Math.PI*1.03+(Math.PI*.94)*i/42;return[Math.cos(a)*(model.field.x*2.0+r*10),95+r*20,Math.sin(a)*(model.field.z*2.0+r*8)];});line(pts,`rgba(210,218,226,${.16-r*.035})`,1);}}
  const stageCenter=project([m.x,m.y+18,m.z]); if(stageCenter){const beams=[[-model.field.x*.7,90,-10],[model.field.x*.7,90,-10],[-model.field.x*.45,72,model.field.z*.55],[model.field.x*.45,72,model.field.z*.55]].map(project).filter(Boolean);beams.forEach(q=>{context.beginPath();context.moveTo(stageCenter[0],stageCenter[1]);context.lineTo(q[0],q[1]);context.strokeStyle="rgba(246,218,242,.10)";context.stroke();});}
  function label(world,text,sub=false){const q=project(world);if(!q)return;context.font=`${sub?600:800} ${sub?9:10}px system-ui,sans-serif`;context.fillStyle=sub?"rgba(224,228,232,.72)":"rgba(255,255,255,.9)";context.textAlign="center";context.fillText(text,q[0],q[1]);}
  label([m.x,m.y+5,m.z],layout.stage?.bStage?"MAIN STAGE":"STAGE"); if(stage.bStage)label([stage.bStage.x,stage.bStage.y+5,stage.bStage.z],stage.bStage.shape==="octagon"?"CENTER STAGE":"B STAGE",true); if(layout.foh)label([layout.foh.x,layout.foh.y+5,layout.foh.z],"FOH",true);
  if(!viewSeat){const p=venueSectionPosition(state.venueId,activeSection(),Number(state.row),state.seatNumber);label([p.x,p.y+18,p.z],`${selectedId} · ${state.row}排${state.seatNumber?` · ${state.seatNumber}號`:""}`);} context.textAlign="left";
  if(viewSeat){
    const occ=activeOccluders();
    if(occ.some(o=>o.kind==="overhang")){context.fillStyle="rgba(18,22,27,.92)";context.fillRect(0,0,cw,ch*.16);context.fillStyle="rgba(230,220,229,.62)";context.font="700 8px system-ui";context.fillText("OVERHANG · 校正遮擋",14,ch*.16-8);}
    if(occ.some(o=>o.kind==="rail")){context.fillStyle="rgba(95,103,112,.78)";context.fillRect(0,ch*.69,cw,8);}
    const targetText=stage.bStage&&layout.bStageFacingSections?.includes(selectedId)?"B-STAGE ORIENTATION":"STAGE ORIENTATION";context.fillStyle="rgba(245,221,241,.72)";context.font="700 9px system-ui,sans-serif";context.fillText(targetText,14,ch-16);
  }
}
function venueWebGLConfig(){
  return {
    venueId: state.venueId,
    layoutId: state.layoutId,
    model: activeVenueModel(),
    layout: currentVenueLayout(),
    tiers: availableVenueTiers(),
    sections: effectiveSections(state.venueId, state.layoutId),
    selectedId: String(state.section),
    row: Number(state.row),
    seatNumber: state.seatNumber,
    seatPosition: seatCameraPosition(),
    target: activeSeatTarget(),
    viewFov: lensFov(),
    theme: document.body.classList.contains("light-mode") ? "light" : "dark",
    viewerHeight: state.viewerHeight,
    posture: state.posture,
    occluders: activeOccluders()
  };
}
function drawSeatPreview(){
  if(!previewCanvas||previewCanvas.clientWidth<4)return;
  if(webglStatus === "loading") return;
  if(venueWebGL){ venueWebGL.renderPreview(); return; }
  renderVenueScene(previewCanvas,{seatMode:true,yaw:0,pitch:0,zoom:1.05});
}
function drawVenueOverview(){
  if(!overviewCanvas||overviewCanvas.clientWidth<4)return;
  if(webglStatus === "loading") return;
  if(venueWebGL){ venueWebGL.renderOverview(); return; }
  renderVenueScene(overviewCanvas,{seatMode:false,yaw:-.48,pitch:.72,zoom:1.05});
}
function requestVenueFrame(){ if(!raf) raf=requestAnimationFrame(drawVenue); }
function drawVenue(){
  raf=0;
  if(viewer.hidden)return;
  if(webglStatus === "loading") return;
  if(venueWebGL){ venueWebGL.renderViewer({seatMode,yaw,pitch,zoom}); return; }
  renderVenueScene(canvas);
}
async function initVenueWebGL(){
  venueWebGL = await createVenueWebGL({
    overviewCanvas, previewCanvas, viewerCanvas: canvas, getConfig: venueWebGLConfig,
    onStatus: status => { webglStatus = status === "fallback" ? "fallback" : "ready"; }
  });
  if(!venueWebGL && webglStatus === "loading") webglStatus = "fallback";
  drawVenueOverview(); drawSeatPreview(); if(!viewer.hidden) requestVenueFrame();
}

state.events = prepareEvents3D(state.events);

const deepLayoutId = new URLSearchParams(location.search).get("layout");
if (deepLayoutId) {
  const deepLayout = getVenueLayout(deepLayoutId);
  if (deepLayout?.id === deepLayoutId) { state.venueId = deepLayout.venueId; state.layoutId = deepLayout.id; }
}
renderVenueOptions();
setVenue(state.venueId, state.layoutId);

loadFollowed().then(names => { if (Array.isArray(names) && names.length) { state.followed = new Set(names); renderFollowing(); } });
loadEvents();
startAutomaticEventVerification();
renderFollowing();
renderFeatured();
updateSeatLabel();
initVenueWebGL();
window.addEventListener("neul:languagechange", () => {
  renderEvents();
  renderFollowing();
  renderFeatured();
  startFeaturedAutoplay();
  try {
    renderVenueOptions();
    const previousLayoutId=state.layoutId;
    renderLayoutOptions();
    if(state.layoutId!==previousLayoutId) setVenue(state.venueId,state.layoutId);
  } catch {}
  updateFreshness();
  updateSearchScope();
  updateSeatLabel();
  renderVenueIdentity();
  renderVenueOptions();
  renderLayoutOptions();
  renderTierTabs();
  refreshSectionOptions(false);
  if (state.detailId && !$("#detailDrawer").getAttribute("aria-hidden")?.includes("true")) openDetail(state.detailId);
});

window.NEUL_APP = {
  state, openDetail, closeDetail, setVenue, renderEvents, renderFollowing, renderFeatured, updateFreshness,
  getEvent: id => state.events.find(e => e.id === id),
  activeVenueModel, currentVenueLayout, activeSection, activeStage, seatCameraPosition, activeSeatTarget,
  getVenueModel, getVenueLayout, getVenueSection, venueSectionPosition, venueSectionWarning, sectionTicketLabel,
  fmtDate, fmtTime, fmtEventTime, safeUrl, escapeHtml, nextAction, drawSeatPreview, drawVenueOverview, updateSeatLabel
};
window.dispatchEvent(new CustomEvent("neul:ready", { detail: window.NEUL_APP }));
window.addEventListener("resize", () => { drawVenueOverview(); drawSeatPreview(); if(!viewer.hidden) requestVenueFrame(); });
