import { extractOfficialSeatLayoutUrl, extractSectionPriceRules, htmlToText } from "./official-monitor.js";

const UA = "Mozilla/5.0 (compatible; NEUL/0.40; +https://vercel.app)";
const TAIWAN_MARKERS = /台北|臺北|新北|桃園|林口|台中|臺中|台南|臺南|高雄|新竹|基隆|嘉義|彰化|苗栗|南投|雲林|屏東|宜蘭|花蓮|台東|臺東|澎湖|金門|馬祖|世運|國家體育場|Taipei|New Taipei|Taoyuan|Taichung|Tainan|Kaohsiung|Hsinchu|Keelung|Chiayi|Changhua|Miaoli|Nantou|Yunlin|Pingtung|Yilan|Hualien|Taitung|Penghu|Kinmen|Matsu|National Stadium|NTSU|Legacy(?: Taipei| TERA| Taichung)?|Zepp New Taipei|TICC|臺北國際會議中心|台北國際會議中心|LIVE WAREHOUSE|SUB|THE WALL/i;
const CITY_RULES = [
  [/桃園|林口|NTSU/i,"Taoyuan"],[/高雄|Kaohsiung/i,"Kaohsiung"],[/台中|臺中|Taichung/i,"Taichung"],[/台南|臺南|Tainan/i,"Tainan"],[/新北|New Taipei/i,"New Taipei"],[/新竹/i,"Hsinchu"],[/基隆/i,"Keelung"],[/嘉義/i,"Chiayi"],[/彰化/i,"Changhua"],[/苗栗/i,"Miaoli"],[/南投/i,"Nantou"],[/雲林/i,"Yunlin"],[/屏東/i,"Pingtung"],[/宜蘭/i,"Yilan"],[/花蓮/i,"Hualien"],[/台東|臺東/i,"Taitung"],[/澎湖/i,"Penghu"],[/金門/i,"Kinmen"],[/馬祖/i,"Matsu"],[/台北|臺北|Taipei|Legacy TERA|Legacy Taipei|SUB|THE WALL/i,"Taipei"]
];
function rotatingKktixIndexes(){
  const always=Array.from({length:12},(_,i)=>`https://kktix.com/events?page=${i+1}`);
  const deep=Array.from({length:48},(_,i)=>i+13);
  const bucket=Math.floor(Date.now()/3600000)%6;
  const start=bucket*8;
  const rotated=[...deep.slice(start,start+8),...deep.slice(0,Math.max(0,start+8-deep.length))].slice(0,8);
  return [...always,...rotated.map(page=>`https://kktix.com/events?page=${page}`),"https://chuanyeah.kktix.cc/events","https://wve.kktix.cc/","https://kklivetw.kktix.cc/events","https://atc-twn.kktix.cc/","https://offtimemusic.kktix.cc/","https://ldh.kktix.cc/"];
}
const PLATFORM_INDEXES = [
  {name:"tixCraft 拓元",url:"https://tixcraft.com/activity",indexes:["https://tixcraft.com/activity"],detail:/https?:\/\/(?:[A-Za-z0-9-]+\.)?tixcraft\.com\/activity\/detail\/[A-Za-z0-9_-]+/gi,maxDetails:128},
  {name:"KKTIX",url:"https://kktix.com/events",indexes:rotatingKktixIndexes(),detail:/https?:\/\/[A-Za-z0-9.-]*kktix\.cc\/events\/[A-Za-z0-9_-]+/gi,maxDetails:128,promoterDiscovery:true},
  {name:"Ticket Plus 遠大售票",url:"https://ticketplus.com.tw/activity",indexes:["https://ticketplus.com.tw/activity"],detail:/https?:\/\/ticketplus\.com\.tw\/activity\/[A-Za-z0-9_-]+/gi,maxDetails:96},
  {name:"寬宏售票",url:"https://kham.com.tw/application/UTK01/UTK0101_06.aspx?CATEGORY=205&TYPE=1",indexes:["https://kham.com.tw/application/UTK01/UTK0101_06.aspx?CATEGORY=205&TYPE=1","https://kham.com.tw/application/UTK01/UTK0101_06.aspx?CATEGORY=100","https://kham.com.tw/application/utk01/UTK0101_03.aspx"],detail:/https?:\/\/kham\.com\.tw\/application\/UTK02\/[A-Za-z0-9_?.=&%-]+/gi,maxDetails:96},
  // Some Taiwan concerts bypass the four major feeds above. Keep these official platforms in the
  // same discovery layer so a show can still surface even when it is not promoted by Live Nation.
  {name:"FamiTicket 全網售票",url:"https://www.famiticket.com.tw/Home",detail:/https?:\/\/(?:www\.)?famiticket\.com\.tw\/activity_info\.aspx\?code=[A-Za-z0-9_-]+/gi,maxDetails:40},
  {name:"udn 售票網",url:"https://tickets.udnfunlife.com/application/UTK01/UTK0101_03.aspx?Category=205&kdid=cateList",detail:/https?:\/\/tickets\.udnfunlife\.com\/(?:Application|application)\/UTK02\/UTK0201(?:_00|_)?\.aspx\?(?:PRODUCT_ID|AGId)=[A-Za-z0-9_-]+/gi,maxDetails:48},
  {name:"ibon 售票",url:"https://ticket.ibon.com.tw/ActivityInfo/Index",detail:/https?:\/\/ticket\.ibon\.com\.tw\/ActivityInfo\/Details\/\d+/gi,maxDetails:64},
  {name:"MNA 牛耳藝術",url:"https://ticket.mna.com.tw/UTK0102_?TYPE=0",detail:/https?:\/\/ticket\.mna\.com\.tw\/UTK0201_\?[^\s"'<>]*PRODUCT_ID=[A-Za-z0-9_-]+[^\s"'<>]*/gi,maxDetails:48},
  {name:"年代售票",url:"https://ticket.com.tw/Application/UTK01/UTK0101_06.aspx?CATEGORY=205&TYPE=1",indexes:["https://ticket.com.tw/Application/UTK01/UTK0101_06.aspx?CATEGORY=205&TYPE=1","https://ticket.com.tw/Application/UTK01/UTK0101_06.aspx?A=%E5%8C%97%E9%83%A8%E5%9C%B0%E5%8D%80&CATEGORY=205&TYPE=1","https://ticket.com.tw/Application/UTK01/UTK0101_06.aspx?A=%E4%B8%AD%E9%83%A8%E5%9C%B0%E5%8D%80&CATEGORY=205&TYPE=1","https://ticket.com.tw/Application/UTK01/UTK0101_06.aspx?A=%E5%8D%97%E9%83%A8%E5%9C%B0%E5%8D%80&CATEGORY=205&TYPE=1","https://ticket.com.tw/Application/UTK01/UTK0101_06.aspx?A=%E6%9D%B1%E9%83%A8%E5%9C%B0%E5%8D%80&CATEGORY=205&TYPE=1"],detail:/https?:\/\/(?:www\.)?ticket\.com\.tw\/(?:Application|application)\/UTK02\/UTK0201_?\.aspx\?[^\s"'<>]*PRODUCT_ID=[A-Za-z0-9_-]+[^\s"'<>]*/gi,maxDetails:64},
  {name:"TixFun",url:"https://tixfun.com/UTK0102_?TYPE=0",detail:/https?:\/\/(?:www\.)?tixfun\.com\/UTK0201_\?[^\s"'<>]*PRODUCT_ID=[A-Za-z0-9_-]+[^\s"'<>]*/gi,maxDetails:40},
  {name:"OPENTIX",url:"https://www.opentix.life/",detail:/https?:\/\/(?:www\.)?opentix\.life\/event\/\d+/gi,maxDetails:32},
  {name:"FANSI GO",url:"https://go.fansi.me/events",indexes:["https://go.fansi.me/events"],detail:/https?:\/\/go\.fansi\.me\/(?:events\/\d+|tickets\/show\/\d+)/gi,maxDetails:48},
  {name:"iNDIEVOX",url:"https://www.indievox.com/activity/latest?type=table",indexes:["https://www.indievox.com/activity/latest?type=table","https://www.indievox.com/activity/latest?type=card","https://www.indievox.com/activity/list/legacy?type=table"],detail:/https?:\/\/(?:www\.)?indievox\.com\/activity\/detail\/[A-Za-z0-9_-]+/gi,maxDetails:72,indexParser:"indievox"},
  {name:"博客來售票",url:"https://tickets.books.com.tw/",detail:/https?:\/\/tickets\.books\.com\.tw\/(?:progshow|index)\/[^\s"'<>]+/gi,maxDetails:16}
];

async function getText(url){
  const r=await fetch(url,{headers:{"user-agent":UA,"accept-language":"zh-TW,zh;q=0.9,en;q=0.7"},redirect:"follow",signal:AbortSignal.timeout(4500)});
  if(!r.ok)throw new Error(`${r.status} ${url}`);
  return await r.text();
}
const decode=s=>String(s||"").replace(/<[^>]+>/g," ").replace(/&nbsp;|&#160;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/\s+/g," ").trim();
function absolute(base,href){try{return new URL(href,base).href}catch{return""}}
function linksFrom(html,base,platform){const out=new Set();for(const m of html.matchAll(/href=["']([^"']+)["']/gi)){const u=absolute(base,m[1]);if(u&&platform.detail.test(u)){platform.detail.lastIndex=0;out.add(u.split('#')[0]);}else platform.detail.lastIndex=0;}for(const m of html.matchAll(platform.detail)){out.add(m[0].split('#')[0]);}return [...out];}
function firstMatch(text,res){for(const re of res){const m=text.match(re);if(m?.[1])return decode(m[1]);}return""}

function parseDate(raw,fallbackYear=null,{requireTime=false,defaultHour=18}={}){
  const text=String(raw||"");
  let m=text.match(/(20\d{2})[\/.\-](\d{1,2})[\/.\-](\d{1,2})/)
    || text.match(/(20\d{2})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if(!m && fallbackYear){
    const short=text.match(/(?:^|\s)(\d{1,2})[\/.\-](\d{1,2})(?!\d)/);
    if(short) m=[short[0],String(fallbackYear),short[1],short[2]];
  }
  if(!m)return null;
  let hour=Number(defaultHour), minute=0, explicitTime=false;
  const colon=text.match(/(?:^|[^0-9])(\d{1,2})[:：](\d{2})\s*(AM|PM)?/i);
  const ampm=text.match(/(?:^|[^0-9])(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\b/i);
  const zh=text.match(/(凌晨|早上|上午|中午|下午|晚上)\s*(\d{1,2})(?:[:：](\d{2}))?/);
  if(colon){hour=Number(colon[1]);minute=Number(colon[2]);explicitTime=true;const ap=String(colon[3]||'').toUpperCase();if(ap==='PM'&&hour<12)hour+=12;if(ap==='AM'&&hour===12)hour=0;}
  else if(ampm){hour=Number(ampm[1]);minute=Number(ampm[2]||0);explicitTime=true;const ap=String(ampm[3]).toUpperCase();if(ap==='PM'&&hour<12)hour+=12;if(ap==='AM'&&hour===12)hour=0;}
  else if(zh){hour=Number(zh[2]);minute=Number(zh[3]||0);explicitTime=true;const marker=zh[1];if((marker==='下午'||marker==='晚上')&&hour<12)hour+=12;if((marker==='凌晨'||marker==='上午'||marker==='早上')&&hour===12)hour=0;if(marker==='中午'&&hour<11)hour+=12;}
  if(requireTime&&!explicitTime)return null;
  const [,y,mo,d]=m;
  return `${y}-${String(mo).padStart(2,"0")}-${String(d).padStart(2,"0")}T${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}+08:00`;
}

export function parsePage(html,url,platform){
  const text=decode(html);
  if(!TAIWAN_MARKERS.test(text))return null;
  const title=firstMatch(html,[/<title[^>]*>([\s\S]*?)<\/title>/i,/<h1[^>]*>([\s\S]*?)<\/h1>/i])||"台灣演出";
  const isAwards=/asia\s*artist\s*awards|\bAAA\s*2026|頒獎典禮|award\s*ceremony/i.test(title+" "+text);
  const artist=isAwards ? "Asia Artist Awards" : (firstMatch(text,[/演出(?:藝人)?[：:]\s*([^｜|。]{2,60})/i,/^\s*([A-Z][A-Z0-9 .&'_-]{2,40})\s+(?:WORLD|ASIA|TOUR|FAN)/i])||title.split(/[-｜|]/)[0].trim().slice(0,60));
  const venue=firstMatch(text,[/演出(?:地點|場地|場所)[：:]\s*([^。\n]{2,100})/i,/活動地點[：:]\s*([^。\n]{2,100})/i,/場地[：:]\s*([^。\n]{2,100})/i,/VENUE[：:]?\s*([^。\n]{2,100})/i])
    || firstMatch(text,[/(台北小巨蛋|臺北小巨蛋|台北大巨蛋|臺北大巨蛋|林口體育館|國立體育大學綜合體育館|高雄巨蛋|高雄國家體育場(?:（世運主場館）)?|世運主場館|Kaohsiung National Stadium|TICC|台北國際會議中心|臺北國際會議中心|台北流行音樂中心|臺北流行音樂中心|Legacy Taipei|Legacy TERA|Zepp New Taipei|臺北國家音樂廳|台北國家音樂廳|新北市工商展覽中心)/i]);
  if(!venue)return null;
  const dateRaw=firstMatch(text,[/演出(?:日期|時間)[：:]\s*([^。]{4,120})/i,/PERFORMANCE DATE[^:：]*[：:]?\s*([^。]{4,120})/i,/Event Dates?[：:]\s*([^。]{4,120})/i]);
  const start=parseDate(dateRaw||text);
  if(!start)return null;
  const city=(CITY_RULES.find(([re])=>re.test(venue))||CITY_RULES.find(([re])=>re.test(text))||[])[1]||"Taipei";
  let price=firstMatch(text,[/演出票價[：:]\s*([^。]{2,180})/i,/TICKET PRICES?[：:]\s*([^。]{2,180})/i,/票價[：:]\s*([^。]{2,180})/i]);
  if(!price){
    const cluster=text.match(/((?:(?:NT\$|TWD|\$)\s*\d{3,5}(?:[,，]\d{3})?)(?:\s*(?:[/／、,，]|至|–|-)\s*(?:(?:NT\$|TWD|\$)?\s*\d{3,5}(?:[,，]\d{3})?)){1,12})/i);
    if(cluster) price=decode(cluster[1]);
  }
  const general=firstMatch(text,[
    /一般售票(?:日期|時間)?\s*[：:]\s*([^。\n]{4,120})/i,
    /正式售票(?:日期|時間)?\s*[：:]\s*([^。\n]{4,120})/i,
    /全面(?:開賣|啟售)(?:日期|時間)?\s*[：:]?\s*([^。\n]{4,120})/i,
    /公開售票(?:日期|時間)?\s*[：:]\s*([^。\n]{4,120})/i,
    /售票(?:日期|時間)\s*[：:]\s*([^。\n]{4,120})/i,
    /開賣(?:日期|時間)\s*[：:]\s*([^。\n]{4,120})/i,
    /General Sale(?:\s*(?:Date|Time))?[：:]?\s*([^。\n]{4,120})/i,
    /Public Sale(?:\s*(?:Date|Time))?[：:]?\s*([^。\n]{4,120})/i,
    /On[- ]Sale(?:\s*(?:Date|Time))?[：:]?\s*([^。\n]{4,120})/i
  ]);
  const seatLayoutSourceUrl=extractOfficialSeatLayoutUrl(html,url);
  const sectionPriceRules=extractSectionPriceRules(htmlToText(html));
  const type=isAwards?"AWARDS":(/fan ?meeting|見面會/i.test(title+text)?"FAN MEETING":"CONCERT");
  const statusLabel=isAwards?"頒獎典禮":(type==="FAN MEETING"?"見面會":"演唱會");
  return {
    id:`auto-${platform.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}-${Buffer.from(url).toString("base64url").slice(0,16)}`,
    artist,title,type,region:"TW",start,venue,city,statusLabel,ticketStatus:"OFFICIAL",
    generalSale:parseDate(general,String(start||"").slice(0,4),{requireTime:true,defaultHour:0}),ticketing:platform.name,price:price||"依官方售票頁公告",
    saleSourceText:general||null,
    sectionPriceRules,
    sourceName:platform.name,sourceUrl:url,seatLayoutSourceUrl:seatLayoutSourceUrl||null,
    verified:true,checkedAt:new Date().toISOString(),tags:["AUTO DISCOVERED","TAIWAN",...(isAwards?["AWARDS"]:[])],
    summary:"由台灣官方售票平台活動頁自動發現；票價、日期與場館仍以原頁最新公告為準。"
  };
}


function cityFromVenueText(venue=''){
  return (CITY_RULES.find(([re])=>re.test(venue))||[])[1] || 'Taipei';
}
function artistFromIndexTitle(title=''){
  const clean=decode(title).replace(/^[〖【\[][^】\]]+[】\]]\s*/,'').trim();
  const parts=clean.split(/(?:\s+[—–-]\s+|《|〈|：|:|\s+20\d{2}\b)/).map(x=>x.trim()).filter(Boolean);
  return (parts[0]||clean||'現場演出').slice(0,60);
}
/** Lightweight index parser used when a platform exposes a complete table/list but
 * fetching every detail page would exceed Hobby execution limits. These records are
 * discovery-only; detail pages still win during merge and supply price / seat-map data. */
export function parseIndievoxIndex(html,base='https://www.indievox.com/activity/latest?type=table'){
  const out=[]; const seen=new Set();
  const rowRe=/<tr[^>]*>([\s\S]*?)<\/tr>/gi; let row;
  while((row=rowRe.exec(html))){
    const body=row[1];
    const href=(body.match(/href=["']([^"']*\/activity\/detail\/[^"']+)["']/i)||[])[1];
    if(!href) continue;
    const url=absolute(base,href); if(!url||seen.has(url)) continue;
    const cells=[...body.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m=>decode(m[1]));
    const dateCell=cells.find(x=>/20\d{2}[\/.\-]\d{1,2}[\/.\-]\d{1,2}/.test(x))||'';
    const start=parseDate(dateCell); if(!start) continue;
    const anchor=(body.match(/<a[^>]*href=["'][^"']*\/activity\/detail\/[^"']+["'][^>]*>([\s\S]*?)<\/a>/i)||[])[1];
    const title=decode(anchor)||cells.find(x=>x&&x!==dateCell)||'現場演出';
    const venue=cells.slice().reverse().find(x=>x&&x!==title&&x!==dateCell)||'';
    if(!venue || !TAIWAN_MARKERS.test(`${venue} ${title}`)) continue;
    seen.add(url);
    out.push({
      id:`auto-indievox-index-${Buffer.from(url).toString('base64url').slice(0,16)}`,
      artist:artistFromIndexTitle(title), title, type:'CONCERT', region:'TW', start, venue,
      city:cityFromVenueText(venue), statusLabel:'演唱會', ticketStatus:'OFFICIAL INDEX',
      ticketing:'iNDIEVOX', price:'待活動頁同步', sourceName:'iNDIEVOX 官方節目表', sourceUrl:url,
      verified:true, checkedAt:new Date().toISOString(), tags:['AUTO DISCOVERED','TAIWAN','INDEX VERIFIED'],
      discoveryDepth:'index', summary:'由 iNDIEVOX 官方節目表直接發現；活動頁解析後會補入票價、座位圖與更完整資訊。'
    });
  }
  return out;
}

async function inBatches(items,worker,size=6){
  const out=[];
  for(let i=0;i<items.length;i+=size){
    const settled=await Promise.allSettled(items.slice(i,i+size).map(worker));
    out.push(...settled);
  }
  return out;
}

export async function discoverTaiwanTicketPlatforms(){
  const events=[],indexEvents=[],indexErrors=[],pageErrors=[];let checkedUrls=0;
  // Fetch platform indexes concurrently, then inspect detail pages in small batches. This improves
  // coverage without turning one Vercel request into a long sequential crawler.
  const indexJobs=[];
  for(const platform of PLATFORM_INDEXES){
    for(const indexUrl of (platform.indexes||[platform.url])) indexJobs.push({platform,indexUrl});
  }
  const indexes=await Promise.allSettled(indexJobs.map(async ({platform,indexUrl})=>({platform,indexUrl,html:await getText(indexUrl)})));
  checkedUrls+=indexJobs.length;
  const urlsByPlatform=new Map();
  for(const result of indexes){
    if(result.status!=="fulfilled"){
      indexErrors.push(result.reason?.message||"ticket index unavailable");
      continue;
    }
    const {platform,indexUrl,html}=result.value;
    const set=urlsByPlatform.get(platform.name)||new Set();
    for(const u of linksFrom(html,indexUrl,platform)) set.add(u);
    urlsByPlatform.set(platform.name,set);
    if(platform.indexParser==='indievox'){
      try{ indexEvents.push(...parseIndievoxIndex(html,indexUrl)); }
      catch(err){ indexErrors.push(`${platform.name} index parse: ${err.message}`); }
    }
  }
  // KKTIX event pages reveal organizer subdomains. Sample organizer roots each hour and fold
  // any additional upcoming event links back into the same platform queue. This reduces the
  // blind spot where a promoter event exists but has not surfaced on the first KKTIX index pages.
  const kktix=PLATFORM_INDEXES.find(p=>p.promoterDiscovery);
  let promoterRootsChecked=0;
  if(kktix){
    const roots=[...new Set([...(urlsByPlatform.get(kktix.name)||[])].map(raw=>{try{const u=new URL(raw);return u.hostname.endsWith('.kktix.cc')?`${u.protocol}//${u.hostname}/`:null;}catch{return null;}}).filter(Boolean))];
    const bucket=Math.floor(Date.now()/3600000); const rotated=roots.length?[...roots.slice(bucket%roots.length),...roots.slice(0,bucket%roots.length)]:[];
    const sample=rotated.slice(0,16); promoterRootsChecked=sample.length;
    const promoterPages=await Promise.allSettled(sample.map(async root=>({root,html:await getText(root)})));
    checkedUrls+=sample.length;
    const set=urlsByPlatform.get(kktix.name)||new Set();
    for(const r of promoterPages){if(r.status!=="fulfilled"){indexErrors.push(`KKTIX promoter: ${r.reason?.message||'unavailable'}`);continue;}for(const u of linksFrom(r.value.html,r.value.root,kktix))set.add(u);}
    urlsByPlatform.set(kktix.name,set);
  }
  const parsedByPlatform=new Map();
  for(const platform of PLATFORM_INDEXES){
    const urls=[...(urlsByPlatform.get(platform.name)||[])].slice(0,platform.maxDetails||24);
    const details=await inBatches(urls,async url=>({url,html:await getText(url)}),6);
    checkedUrls+=urls.length;
    for(const detail of details){
      if(detail.status!=="fulfilled"){
        pageErrors.push(`${platform.name}: ${detail.reason?.message||"detail unavailable"}`);
        continue;
      }
      const {url,html:detailHtml}=detail.value;
      try{const e=parsePage(detailHtml,url,platform);if(e){events.push(e);parsedByPlatform.set(platform.name,(parsedByPlatform.get(platform.name)||0)+1);}}catch(err){pageErrors.push(`${platform.name}: ${err.message}`)}
    }
  }
  // Index-derived events are merged after detail-derived records. mergeAndDedupe gives the richer
  // official detail page higher priority, while retaining index-only concerts that would otherwise
  // fall outside per-request detail caps.
  events.push(...indexEvents);
  return{events,checkedUrls,indexErrors,pageErrors,source:"tixCraft + KKTIX + Ticket Plus + 寬宏 + FamiTicket + udn + ibon + MNA + 年代 + TixFun + OPENTIX + FANSI GO + iNDIEVOX + 博客來",promoterRootsChecked,sourceHealth:PLATFORM_INDEXES.map(p=>({name:p.name,indexCount:(p.indexes||[p.url]).length,detailCap:p.maxDetails||24,discovered:[...(urlsByPlatform.get(p.name)||[])].length,parsed:parsedByPlatform.get(p.name)||0,indexDerived:p.name==='iNDIEVOX'?indexEvents.length:0,promoterRootsChecked:p.name==='KKTIX'?promoterRootsChecked:0,errors:indexErrors.filter(x=>String(x).startsWith(p.name)).length+pageErrors.filter(x=>String(x).startsWith(p.name)).length}))};
}
