const CALENDAR_URL = 'https://twconcertview.com/calendar';
const CALENDAR_EN_URL = 'https://twconcertview.com/en/calendar';
const UA = 'Mozilla/5.0 (compatible; NEUL/0.40.9; +coverage-cross-check)';
const pad = n => String(n).padStart(2,'0');
const slug = value => String(value || '').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g,'-').replace(/^-|-$/g,'').slice(0,78);

const VENUE_CITY_RULES = [
  [/高雄|Kaohsiung|LIVE WAREHOUSE/i,'Kaohsiung'],
  [/桃園|林口體育館|國立體育大學|NTSU/i,'Taoyuan'],
  [/新北|Zepp New Taipei|新莊|板橋|三重|淡水|新店|汐止|五股/i,'New Taipei'],
  [/台中|臺中|Taichung/i,'Taichung'],
  [/台南|臺南|Tainan/i,'Tainan'],
  [/新竹|Hsinchu/i,'Hsinchu'],
  [/基隆|Keelung/i,'Keelung'],
  [/嘉義|Chiayi/i,'Chiayi'],
  [/彰化|Changhua/i,'Changhua'],
  [/苗栗|Miaoli/i,'Miaoli'],
  [/南投|Nantou/i,'Nantou'],
  [/雲林|Yunlin/i,'Yunlin'],
  [/屏東|Pingtung/i,'Pingtung'],
  [/宜蘭|Yilan/i,'Yilan'],
  [/花蓮|Hualien/i,'Hualien'],
  [/台東|臺東|Taitung/i,'Taitung'],
  [/澎湖|Penghu/i,'Penghu'],
  [/金門|Kinmen/i,'Kinmen'],
  [/馬祖|Matsu/i,'Matsu'],
  [/台北|臺北|Taipei|Legacy|MOONDOG|WESTAR|HANASPACE|Clapper Studio|Billboard Live|典空間|REVOLVER/i,'Taipei']
];

const VENUE_MODEL_RULES = [
  [/臺?北大巨蛋|Taipei Dome/i,'taipei-dome'],
  [/臺?北小巨蛋|Taipei Arena/i,'taipei-arena'],
  [/林口體育館|國立體育大學|NTSU/i,'ntsu-arena'],
  [/高雄巨蛋|Kaohsiung Arena/i,'kaohsiung-arena'],
  [/高雄世運|世運主場館|國家體育場|Kaohsiung National Stadium/i,'kaohsiung-stadium'],
  [/臺?北流行音樂中心|Taipei Music Center/i,'taipei-music-center'],
  [/臺?北國際會議中心|TICC/i,'ticc'],
  [/高雄流行音樂中心|海音館|Kaohsiung Music Center/i,'kaohsiung-music-center'],
  [/桃園巨蛋|Taoyuan Arena/i,'taoyuan-arena'],
  [/臺?大綜合體育館|NTU Sports Center/i,'ntu-sports-center'],
  [/南港展覽館.*(?:一館|1館).*4F|Nangang Exhibition.*Hall 1/i,'nangang-exhibition-hall1-4f'],
  [/Zepp New Taipei/i,'zepp-new-taipei']
];

function decodeEntities(value='') {
  return String(value)
    .replace(/\\uFF5C/gi,'｜').replace(/\\u003c/gi,'<').replace(/\\u003e/gi,'>')
    .replace(/\\n/g,'\n').replace(/&nbsp;|&#160;/gi,' ')
    .replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>')
    .replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'")
    .replace(/&#(x[0-9a-f]+|\d+);/gi,(_,code)=>{try{return String.fromCodePoint(code[0].toLowerCase()==='x'?parseInt(code.slice(1),16):parseInt(code,10));}catch{return'';}});
}
function plainText(html='') {
  return decodeEntities(String(html))
    .replace(/<script[\s\S]*?<\/script>/gi,' ')
    .replace(/<style[\s\S]*?<\/style>/gi,' ')
    .replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/li\s*>/gi,'\n').replace(/<\/p\s*>/gi,'\n')
    .replace(/<[^>]+>/g,' ')
    .replace(/[ \t]+/g,' ').replace(/\n[ \t]+/g,'\n');
}
function clean(value=''){return String(value).replace(/\s+/g,' ').trim();}
function inferCity(venue=''){return VENUE_CITY_RULES.find(([re])=>re.test(venue))?.[1] || '';}
function inferVenueModel(venue=''){return VENUE_MODEL_RULES.find(([re])=>re.test(venue))?.[1] || null;}
function inferArtist(title=''){
  const t=clean(title).replace(/^[「『【<＜].*?[」』】>＞]\s*/,'');
  const beforeTour=t.split(/\s+(?:WORLD\s+TOUR|ASIA\s+TOUR|TOUR|LIVE|CONCERT|FAN\s*(?:MEETING|CONCERT)|巡迴|演唱會|見面會)/i)[0];
  return clean(beforeTour || t).slice(0,80) || 'Live Event';
}
function inferMarket(title=''){
  const t=String(title||'');
  if(/[ぁ-んァ-ヶ]/u.test(t) || /J-?POP|日本(?:藝人|歌手|樂團|偶像)?|Japan(?:ese)?|SKE48|AKB48|NMB48|HKT48|櫻坂46|乃木坂46|日向坂46|THE\s+RAMPAGE|藤川千愛|花澤香菜|Furui Riho|Do As Infinity|BE:?FIRST/i.test(t)) return 'JP';
  if(/K-?POP|韓國|韓星|Korea(?:n)?|TREASURE|BLACKPINK|IVE|LE SSERAFIM|aespa|NMIXX|BABYMONSTER|SEVENTEEN|BTS|PLAVE|QWER|izna|INFINITE|N\.F(?:lying|LYING)|李泳知|THE ROSE/i.test(t)) return 'KR';
  if(/[A-Za-z]/.test(t) && !/[\u4e00-\u9fff]/u.test(t)) return 'INTL';
  return 'TW';
}
function inferType(title=''){
  if(/fan\s*con|fancon/i.test(title)) return 'FANCON';
  if(/fan\s*meeting|見面會/i.test(title)) return 'FAN MEETING';
  if(/festival|音樂節|祭/i.test(title)) return 'FESTIVAL';
  return 'CONCERT';
}

function calendarMonthUrl(year, zeroBasedMonth){
  return `${CALENDAR_EN_URL}?m=${zeroBasedMonth}&y=${year}`;
}

export function buildTwConcertViewCalendarUrls(now=new Date(), monthsBack=1, monthsAhead=18){
  const year=Number(new Intl.DateTimeFormat('en',{year:'numeric',timeZone:'Asia/Taipei'}).format(now));
  const month=Number(new Intl.DateTimeFormat('en',{month:'numeric',timeZone:'Asia/Taipei'}).format(now))-1;
  const urls=[CALENDAR_URL];
  const seen=new Set(urls);
  for(let offset=-Math.max(0,monthsBack);offset<=Math.max(0,monthsAhead);offset++){
    const absolute=year*12+month+offset;
    const y=Math.floor(absolute/12), m=((absolute%12)+12)%12;
    const url=calendarMonthUrl(y,m);
    if(!seen.has(url)){seen.add(url);urls.push(url);}
  }
  return urls;
}

export function parseTwConcertViewCalendar(html='', {sourceUrl=CALENDAR_URL}={}) {
  const decoded=decodeEntities(html);
  const text=plainText(decoded);
  const referenceCounts=[...text.matchAll(/(?:近期\s*|—\s*)(\d{2,4})\s*(?:場演出|upcoming shows)/gi)].map(m=>Number(m[1])).filter(Number.isFinite);
  const referenceCount=referenceCounts.length?Math.max(...referenceCounts):0;
  const pool=`${decoded.replace(/<[^>]+>/g,'\n')}\n${text}`;
  const re=/(20\d{2})-(\d{2})-(\d{2})\s*｜\s*([^｜\n<>]{1,180}?)\s*｜\s*([^\n<>]{1,130})/g;
  const map=new Map(); let m;
  while((m=re.exec(pool))){
    const y=+m[1],mo=+m[2],d=+m[3],title=clean(m[4]),venue=clean(m[5]).replace(/\s+(?:#|Taiwan Concert Calendar).*$/i,'');
    if(!title || !venue || venue.length>130) continue;
    const key=`${m[1]}-${m[2]}-${m[3]}|${title.toLowerCase()}|${venue.toLowerCase()}`;
    if(map.has(key)) continue;
    const artist=inferArtist(title), market=inferMarket(title), city=inferCity(venue), venueModelId=inferVenueModel(venue);
    const start=`${y}-${pad(mo)}-${pad(d)}T00:00:00+08:00`;
    map.set(key,{id:`coverage-twcv-${slug(`${title}-${venue}`)}-${y}${pad(mo)}${pad(d)}`,artist,shortArtist:artist.replace(/[^A-Za-z0-9]/g,'').slice(0,4).toUpperCase()||'LIVE',title,type:inferType(title),region:'TW',market,start,end:null,timeConfirmed:false,venue,city,statusLabel:'跨站補漏待官方核對',ticketStatus:'CHECK OFFICIAL',ticketing:'請回查主辦／官方售票平台',price:'依官方售票頁公告',sourceName:'twconcertview 行事曆（覆蓋補漏）',sourceUrl,sharedSourceUrl:true,verified:false,coverageReference:true,autoUpdated:true,checkedAt:new Date().toISOString(),tags:[market,'COVERAGE REFERENCE','AUTO'],venueModelId,summary:'由公開演唱會行事曆作為 coverage cross-check 補漏；NEUL 仍以主辦、售票平台與場館官方來源覆核活動細節。',notes:['此來源只用來發現可能漏掉的台灣演出，不作為票價、售票規則或舞台配置的最終依據。']});
  }
  return {events:[...map.values()],referenceCount,parsedCount:map.size,sourceUrl};
}

async function getCalendar(url){
  const r=await fetch(url,{headers:{Accept:'text/html,application/xhtml+xml','Accept-Language':'zh-TW,zh;q=0.9,en;q=0.7','User-Agent':UA},redirect:'follow',signal:AbortSignal.timeout(6500)});
  if(!r.ok) throw new Error(`TWCV_${r.status} ${url}`);
  const html=await r.text();
  return {url:r.url||url,html};
}
async function inBatches(items,worker,size=6){
  const out=[];
  for(let i=0;i<items.length;i+=size){
    const batch=items.slice(i,i+size);
    out.push(...await Promise.allSettled(batch.map(worker)));
  }
  return out;
}

function mergeCalendarPages(parsedPages=[]){
  const map=new Map();
  let referenceCount=0;
  for(const page of parsedPages){
    referenceCount=Math.max(referenceCount,Number(page.referenceCount||0));
    for(const event of (page.events||[])){
      const key=`${String(event.start||'').slice(0,10)}|${clean(event.title).toLowerCase()}|${clean(event.venue).toLowerCase()}`;
      const old=map.get(key);
      if(!old){map.set(key,{...event,coveragePageUrls:[page.sourceUrl].filter(Boolean)});continue;}
      const urls=new Set([...(old.coveragePageUrls||[]),page.sourceUrl].filter(Boolean));
      old.coveragePageUrls=[...urls];
      // Prefer a page-specific URL over the root calendar if available, but never mark it verified.
      if(old.sourceUrl===CALENDAR_URL && page.sourceUrl && page.sourceUrl!==CALENDAR_URL) old.sourceUrl=page.sourceUrl;
    }
  }
  const events=[...map.values()].sort((a,b)=>new Date(a.start)-new Date(b.start));
  const parsedCount=events.length;
  const coverageRatio=referenceCount>0?Math.min(1,parsedCount/referenceCount):null;
  return {events,referenceCount,parsedCount,coverageRatio};
}

export async function discoverTwConcertViewCalendar(){
  const now=new Date();
  const rootUrls=[CALENDAR_URL,CALENDAR_EN_URL];
  const pageErrors=[];
  const parsed=[];
  try{
    // Fast path: the public calendar root commonly contains the full upcoming list.
    // Avoid scanning ~20 month pages on every request when the root already reaches the advertised total.
    const roots=await Promise.allSettled(rootUrls.map(url=>getCalendar(url)));
    for(let i=0;i<roots.length;i++){
      const result=roots[i],requested=rootUrls[i];
      if(result.status!=="fulfilled"){pageErrors.push(result.reason?.message||`twconcertview unavailable ${requested}`);continue;}
      try{parsed.push(parseTwConcertViewCalendar(result.value.html,{sourceUrl:result.value.url||requested}));}
      catch(error){pageErrors.push(`TWCV_PARSE ${requested} ${error?.message||error}`);}
    }
    let merged=mergeCalendarPages(parsed);
    const rootComplete=merged.referenceCount>0 && merged.parsedCount>=Math.ceil(merged.referenceCount*0.9);
    let checkedUrls=rootUrls.length;
    let monthsScanned=0;

    if(!rootComplete){
      const monthUrls=buildTwConcertViewCalendarUrls(now,0,18).filter(url=>!rootUrls.includes(url)&&url!==CALENDAR_URL);
      const settled=await inBatches(monthUrls,async url=>getCalendar(url),8);
      for(let i=0;i<settled.length;i++){
        const result=settled[i],requested=monthUrls[i];
        if(result.status!=="fulfilled"){pageErrors.push(result.reason?.message||`twconcertview unavailable ${requested}`);continue;}
        try{parsed.push(parseTwConcertViewCalendar(result.value.html,{sourceUrl:result.value.url||requested}));}
        catch(error){pageErrors.push(`TWCV_PARSE ${requested} ${error?.message||error}`);}
      }
      checkedUrls+=monthUrls.length;
      monthsScanned=monthUrls.length;
      merged=mergeCalendarPages(parsed);
    }

    const successCount=parsed.length;
    const conservativeComplete=merged.referenceCount>0 && merged.parsedCount>=Math.ceil(merged.referenceCount*0.9);
    return {
      ...merged,
      checkedUrls,
      successfulPages:successCount,
      monthsScanned,
      rootFastPathComplete:rootComplete,
      completeAgainstReference:conservativeComplete,
      source:'twconcertview 公開行事曆（316 候選 coverage cross-check；不足才逐月補掃）',
      pageErrors,indexErrors:[],
      sourceHealth:[{
        name:'twconcertview coverage cross-check',
        discovered:merged.parsedCount,
        referenceCount:merged.referenceCount,
        coverageRatio:merged.coverageRatio,
        completeAgainstReference:conservativeComplete,
        rootFastPathComplete:rootComplete,
        checkedUrls,
        successfulPages:successCount,
        errors:pageErrors.length
      }]
    };
  }catch(error){
    return {events:[],referenceCount:0,parsedCount:0,coverageRatio:null,completeAgainstReference:false,checkedUrls:rootUrls.length,successfulPages:0,monthsScanned:0,rootFastPathComplete:false,source:'twconcertview 公開行事曆（316 候選 coverage cross-check）',pageErrors:[error?.message||'twconcertview unavailable'],indexErrors:[],sourceHealth:[{name:'twconcertview coverage cross-check',discovered:0,referenceCount:0,coverageRatio:null,completeAgainstReference:false,checkedUrls:rootUrls.length,successfulPages:0,errors:1}]};
  }
}
