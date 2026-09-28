const CALENDAR_URL = 'https://twconcertview.com/calendar';
const CALENDAR_EN_URL = 'https://twconcertview.com/en/calendar';
const UA = 'Mozilla/5.0 (compatible; NEUL/0.40.17; +expanded-coverage-reference)';
const VERIFIED_ZH_REFERENCE = { count: 317, checkedAt: '2026-09-24', validUntil: '2026-10-01' };
const isEnglishCalendar = url => /\/en\/calendar/i.test(String(url||''));
const verifiedZhFloor = now => now <= new Date(`${VERIFIED_ZH_REFERENCE.validUntil}T23:59:59+08:00`) ? VERIFIED_ZH_REFERENCE.count : 0;
const pad = n => String(n).padStart(2,'0');
const slug = value => String(value || '').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g,'-').replace(/^-|-$/g,'').slice(0,78);

const VENUE_CITY_RULES = [
  [/高雄|Kaohsiung|LIVE WAREHOUSE/i,'Kaohsiung'],
  [/桃園|林口體育館|國立體育大學|NTSU/i,'Taoyuan'],
  [/新北|Zepp New Taipei|新莊|板橋|三重|淡水|新店|汐止|五股/i,'New Taipei'],
  [/台中|臺中|Taichung/i,'Taichung'],
  [/台南|臺南|Tainan/i,'Tainan'],
  [/新竹|Hsinchu/i,'Hsinchu'],[/基隆|Keelung/i,'Keelung'],[/嘉義|Chiayi/i,'Chiayi'],
  [/彰化|Changhua/i,'Changhua'],[/苗栗|Miaoli/i,'Miaoli'],[/南投|Nantou/i,'Nantou'],
  [/雲林|Yunlin/i,'Yunlin'],[/屏東|Pingtung/i,'Pingtung'],[/宜蘭|Yilan/i,'Yilan'],
  [/花蓮|Hualien/i,'Hualien'],[/台東|臺東|Taitung/i,'Taitung'],[/澎湖|Penghu/i,'Penghu'],
  [/金門|Kinmen/i,'Kinmen'],[/馬祖|Matsu/i,'Matsu'],
  [/台北|臺北|Taipei|Legacy|MOONDOG|WESTAR|HANASPACE|Clapper Studio|Billboard Live|典空間|REVOLVER/i,'Taipei']
];

const VENUE_MODEL_RULES = [
  [/臺?北大巨蛋|Taipei Dome/i,'taipei-dome'],[/臺?北小巨蛋|Taipei Arena/i,'taipei-arena'],
  [/林口體育館|國立體育大學|NTSU/i,'ntsu-arena'],[/高雄巨蛋|Kaohsiung Arena/i,'kaohsiung-arena'],
  [/高雄世運|世運主場館|國家體育場|Kaohsiung National Stadium/i,'kaohsiung-stadium'],
  [/臺?北流行音樂中心|Taipei Music Center/i,'taipei-music-center'],[/臺?北國際會議中心|TICC/i,'ticc'],
  [/高雄流行音樂中心|海音館|Kaohsiung Music Center/i,'kaohsiung-music-center'],[/桃園巨蛋|Taoyuan Arena/i,'taoyuan-arena'],
  [/臺?大綜合體育館|NTU Sports Center/i,'ntu-sports-center'],
  [/南港展覽館.*(?:一館|1館).*4F|Nangang Exhibition.*Hall 1/i,'nangang-exhibition-hall1-4f'],[/Zepp New Taipei/i,'zepp-new-taipei']
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
  return decodeEntities(String(html)).replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ')
    .replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/(?:li|p|div|article|section|tr|h\d)\s*>/gi,'\n')
    .replace(/<[^>]+>/g,' ').replace(/[ \t]+/g,' ').replace(/\n[ \t]+/g,'\n');
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
function inferType(title=''){if(/fan\s*con|fancon/i.test(title))return'FANCON';if(/fan\s*meeting|見面會/i.test(title))return'FAN MEETING';if(/festival|音樂節|祭/i.test(title))return'FESTIVAL';return'CONCERT';}

function calendarMonthUrl(year, zeroBasedMonth, locale='zh'){
  const root=locale==='en'?CALENDAR_EN_URL:CALENDAR_URL;
  return `${root}?m=${zeroBasedMonth}&y=${year}`;
}
export function buildTwConcertViewCalendarUrls(now=new Date(), monthsBack=1, monthsAhead=18, locale='zh'){
  const year=Number(new Intl.DateTimeFormat('en',{year:'numeric',timeZone:'Asia/Taipei'}).format(now));
  const month=Number(new Intl.DateTimeFormat('en',{month:'numeric',timeZone:'Asia/Taipei'}).format(now))-1;
  const root=locale==='en'?CALENDAR_EN_URL:CALENDAR_URL;
  const urls=[root],seen=new Set(urls);
  for(let offset=-Math.max(0,monthsBack);offset<=Math.max(0,monthsAhead);offset++){
    const absolute=year*12+month+offset,y=Math.floor(absolute/12),m=((absolute%12)+12)%12,url=calendarMonthUrl(y,m,locale);
    if(!seen.has(url)){seen.add(url);urls.push(url);}
  }
  return urls;
}
export function buildTwConcertViewRollingMonthUrls(now=new Date(), locale='zh', batchSize=6){
  const all=buildTwConcertViewCalendarUrls(now,0,18,locale).slice(1);
  if(!all.length)return[];
  const size=Math.min(Math.max(1,batchSize),all.length);
  const bucket=Math.floor(now.getTime()/3600000);
  const start=(bucket*size)%all.length;
  return Array.from({length:size},(_,i)=>all[(start+i)%all.length]);
}

export function parseTwConcertViewCalendar(html='', {sourceUrl=CALENDAR_URL}={}) {
  const decoded=decodeEntities(html),text=plainText(decoded);
  const referenceCounts=[...text.matchAll(/(?:近期\s*|—\s*)(\d{2,4})\s*(?:場演出|upcoming shows)/gi)].map(m=>Number(m[1])).filter(Number.isFinite);
  const referenceCount=referenceCounts.length?Math.max(...referenceCounts):0;
  const re=/(20\d{2})-(\d{2})-(\d{2})\s*｜\s*([^｜\n<>]{1,180}?)\s*｜\s*([^\n<>]{1,130})/g;
  const pools=[text,decoded.replace(/<[^>]+>/g,'\n')];
  const map=new Map(); let rawOccurrenceCount=0;
  for(const pool of pools){
    let m,matched=0; re.lastIndex=0;
    while((m=re.exec(pool))){
      matched++;
      const y=+m[1],mo=+m[2],d=+m[3],title=clean(m[4]),venue=clean(m[5]).replace(/\s+(?:#|Taiwan Concert Calendar).*$/i,'');
      if(!title || !venue || venue.length>130) continue;
      rawOccurrenceCount++;
      const key=`${m[1]}-${m[2]}-${m[3]}|${title.toLowerCase()}|${venue.toLowerCase()}`;
      const existing=map.get(key);
      if(existing){existing.referenceOccurrenceCount=(existing.referenceOccurrenceCount||1)+1;continue;}
      const artist=inferArtist(title),market=inferMarket(title),city=inferCity(venue),venueModelId=inferVenueModel(venue),start=`${y}-${pad(mo)}-${pad(d)}T00:00:00+08:00`;
      map.set(key,{id:`coverage-twcv-${slug(`${title}-${venue}`)}-${y}${pad(mo)}${pad(d)}`,artist,shortArtist:artist.replace(/[^A-Za-z0-9]/g,'').slice(0,4).toUpperCase()||'LIVE',title,type:inferType(title),region:'TW',market,start,end:null,timeConfirmed:false,venue,city,statusLabel:'參考收錄 · 待官方覆核',ticketStatus:'CHECK OFFICIAL',ticketing:'待官方售票來源回補',price:'依官方售票頁公告',sourceName:'twconcertview 行事曆（補漏參考）',sourceUrl,sharedSourceUrl:true,verified:false,referenceOnly:true,verificationLevel:'reference',coverageReference:true,referenceOccurrenceCount:1,autoUpdated:true,checkedAt:new Date().toISOString(),tags:[market,'COVERAGE REFERENCE','REFERENCE QUEUE','AUTO'],venueModelId,summary:'由公開演唱會行事曆加入補漏參考佇列；NEUL 會再以主辦、售票平台、藝人或場館官方來源覆核後升級。',notes:['參考來源只用來避免漏掉活動；票價、開賣、座位圖與舞台配置仍必須以官方資料為準。']});
    }
    if(matched)break; // Never parse both representations and double-count the same rendered rows.
  }
  return {events:[...map.values()],referenceCount,parsedCount:map.size,rawOccurrenceCount,sourceUrl};
}

async function getCalendar(url){
  const r=await fetch(url,{headers:{Accept:'text/html,application/xhtml+xml','Accept-Language':'zh-TW,zh;q=0.9,en;q=0.7','User-Agent':UA},redirect:'follow',signal:AbortSignal.timeout(5500)});
  if(!r.ok)throw new Error(`TWCV_${r.status} ${url}`);
  return {url:r.url||url,html:await r.text()};
}
async function inBatches(items,worker,size=6){const out=[];for(let i=0;i<items.length;i+=size)out.push(...await Promise.allSettled(items.slice(i,i+size).map(worker)));return out;}

function mergeCalendarPages(parsedPages=[]){
  const map=new Map(); let referenceCount=0;
  for(const page of parsedPages){
    referenceCount=Math.max(referenceCount,Number(page.referenceCount||0));
    for(const event of(page.events||[])){
      const key=`${String(event.start||'').slice(0,10)}|${clean(event.title).toLowerCase()}|${clean(event.venue).toLowerCase()}`;
      const old=map.get(key);
      if(!old){map.set(key,{...event,coveragePageUrls:[page.sourceUrl].filter(Boolean)});continue;}
      old.referenceOccurrenceCount=Math.max(Number(old.referenceOccurrenceCount||1),Number(event.referenceOccurrenceCount||1));
      old.coveragePageUrls=[...new Set([...(old.coveragePageUrls||[]),page.sourceUrl].filter(Boolean))];
      if(old.sourceUrl===CALENDAR_URL && page.sourceUrl && page.sourceUrl!==CALENDAR_URL)old.sourceUrl=page.sourceUrl;
    }
  }
  const events=[...map.values()].sort((a,b)=>new Date(a.start)-new Date(b.start));
  const parsedCount=events.length;
  const referenceOccurrenceCount=events.reduce((sum,event)=>sum+Math.max(1,Number(event.referenceOccurrenceCount||1)),0);
  const uniqueEventRatio=referenceCount>0?Math.min(1,parsedCount/referenceCount):null;
  const coverageRatio=referenceCount>0?Math.min(1,referenceOccurrenceCount/referenceCount):null;
  return {events,referenceCount,parsedCount,uniqueEventRatio,rawOccurrenceCount:referenceOccurrenceCount,referenceOccurrenceCount,coverageRatio};
}

export async function discoverTwConcertViewCalendar(){
  const now=new Date(),pageErrors=[],parsed=[];let checkedUrls=0,zhMonthPages=0,enFallbackPages=0,zhRedirectedPages=0,zhRootRedirected=false;
  try{
    // Traditional-Chinese root is the primary reference because it currently exposes the broader Taiwan list.
    // English is fallback only; a smaller localized inventory must never lower the Chinese reference target.
    try{const root=await getCalendar(CALENDAR_URL);checkedUrls++;zhRootRedirected=isEnglishCalendar(root.url);if(zhRootRedirected)zhRedirectedPages++;parsed.push(parseTwConcertViewCalendar(root.html,{sourceUrl:root.url||CALENDAR_URL}));}
    catch(error){pageErrors.push(error?.message||'twconcertview zh root unavailable');}
    if(!parsed.length || !parsed[0].referenceCount){
      try{const en=await getCalendar(CALENDAR_EN_URL);checkedUrls++;parsed.push(parseTwConcertViewCalendar(en.html,{sourceUrl:en.url||CALENDAR_EN_URL}));}
      catch(error){pageErrors.push(error?.message||'twconcertview en root unavailable');}
    }
    let merged=mergeCalendarPages(parsed);
    const zhReferenceFloor=zhRootRedirected?verifiedZhFloor(now):0;
    if(zhReferenceFloor>merged.referenceCount){merged.referenceCount=zhReferenceFloor;merged.uniqueEventRatio=Math.min(1,merged.parsedCount/zhReferenceFloor);merged.coverageRatio=Math.min(1,(merged.referenceOccurrenceCount||0)/zhReferenceFloor);}
    let showingParsedCount=merged.referenceOccurrenceCount||0;
    const rootComplete=merged.referenceCount>0 && showingParsedCount>=Math.ceil(merged.referenceCount*0.9);
    if(!rootComplete){
      // Serverless-safe rolling reconciliation: scan only six zh months per run. The Vercel Blob snapshot in
      // /api/events accumulates these reference-queue rows across runs, so all 19 months are covered over time
      // without a single request trying to crawl the whole site and timing out.
      const zhMonthUrls=buildTwConcertViewRollingMonthUrls(now,'zh',6);
      const zhSettled=await inBatches(zhMonthUrls,url=>getCalendar(url),6); let zhSuccess=0;
      for(let i=0;i<zhSettled.length;i++){
        const result=zhSettled[i],requested=zhMonthUrls[i];
        if(result.status!=='fulfilled'){pageErrors.push(result.reason?.message||`twconcertview unavailable ${requested}`);continue;}
        const redirected=isEnglishCalendar(result.value.url);if(redirected)zhRedirectedPages++;else zhSuccess++;try{parsed.push(parseTwConcertViewCalendar(result.value.html,{sourceUrl:result.value.url||requested}));}catch(error){pageErrors.push(`TWCV_PARSE ${requested} ${error?.message||error}`);}
      }
      checkedUrls+=zhMonthUrls.length;zhMonthPages=zhMonthUrls.length;merged=mergeCalendarPages(parsed);if(zhReferenceFloor>merged.referenceCount){merged.referenceCount=zhReferenceFloor;merged.uniqueEventRatio=Math.min(1,merged.parsedCount/zhReferenceFloor);merged.coverageRatio=Math.min(1,(merged.referenceOccurrenceCount||0)/zhReferenceFloor);}showingParsedCount=merged.referenceOccurrenceCount||0;
      // English monthly pages are an availability fallback only, not a competing completeness benchmark.
      if(zhSuccess===0 && zhRedirectedPages===0){
        const enMonthUrls=buildTwConcertViewRollingMonthUrls(now,'en',3),enSettled=await inBatches(enMonthUrls,url=>getCalendar(url),3);
        for(let i=0;i<enSettled.length;i++){
          const result=enSettled[i],requested=enMonthUrls[i];
          if(result.status!=='fulfilled'){pageErrors.push(result.reason?.message||`twconcertview unavailable ${requested}`);continue;}
          try{parsed.push(parseTwConcertViewCalendar(result.value.html,{sourceUrl:result.value.url||requested}));}catch(error){pageErrors.push(`TWCV_PARSE ${requested} ${error?.message||error}`);}
        }
        checkedUrls+=enMonthUrls.length;enFallbackPages=enMonthUrls.length;merged=mergeCalendarPages(parsed);if(zhReferenceFloor>merged.referenceCount){merged.referenceCount=zhReferenceFloor;merged.uniqueEventRatio=Math.min(1,merged.parsedCount/zhReferenceFloor);merged.coverageRatio=Math.min(1,(merged.referenceOccurrenceCount||0)/zhReferenceFloor);}showingParsedCount=merged.referenceOccurrenceCount||0;
      }
    }
    const completeAgainstReference=merged.referenceCount>0 && showingParsedCount>=Math.ceil(merged.referenceCount*0.9);
    return {...merged,checkedUrls,successfulPages:parsed.length,monthsScanned:zhMonthPages+enFallbackPages,rootFastPathComplete:rootComplete,completeAgainstReference,referenceUnit:'showings',showingParsedCount,uniqueEventCount:merged.parsedCount,uniqueEventRatio:merged.uniqueEventRatio,referenceQueueCount:merged.events.filter(x=>x.referenceOnly).length,zhMonthPages,enFallbackPages,zhRootRedirected,zhRedirectedPages,verifiedZhReferenceFloor:zhReferenceFloor,verifiedZhReferenceCheckedAt:VERIFIED_ZH_REFERENCE.checkedAt,source:'twconcertview 公開行事曆（補漏參考佇列；繁中主來源、英文僅備援）',pageErrors,indexErrors:[],sourceHealth:[{name:'twconcertview reference queue',discovered:merged.parsedCount,referenceCount:merged.referenceCount,referenceUnit:'showings',referenceQueueCount:merged.events.filter(x=>x.referenceOnly).length,uniqueEventCount:merged.parsedCount,showingParsedCount,uniqueEventRatio:merged.uniqueEventRatio,zhMonthPages,enFallbackPages,zhRootRedirected,zhRedirectedPages,verifiedZhReferenceFloor:zhReferenceFloor,coverageRatio:merged.coverageRatio,completeAgainstReference,rootFastPathComplete:rootComplete,checkedUrls,successfulPages:parsed.length,errors:pageErrors.length}]};
  }catch(error){
    return {events:[],referenceCount:0,parsedCount:0,referenceOccurrenceCount:0,coverageRatio:null,referenceUnit:'showings',referenceQueueCount:0,completeAgainstReference:false,checkedUrls,successfulPages:0,monthsScanned:0,rootFastPathComplete:false,zhMonthPages,enFallbackPages,source:'twconcertview 公開行事曆（補漏參考佇列）',pageErrors:[error?.message||'twconcertview unavailable',...pageErrors],indexErrors:[],sourceHealth:[{name:'twconcertview reference queue',discovered:0,referenceCount:0,coverageRatio:null,completeAgainstReference:false,checkedUrls,successfulPages:0,errors:1}]};
  }
}
