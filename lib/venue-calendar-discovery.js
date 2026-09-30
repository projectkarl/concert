import { htmlToText } from './official-monitor.js';

const UA='Mozilla/5.0 (compatible; NEUL/0.40.3-Coverage +official-venue-calendar-auditor)';
const pad=n=>String(n).padStart(2,'0');
const slug=s=>String(s||'').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g,'-').replace(/^-|-$/g,'').slice(0,76);
const iso=(y,m,d,h=0,mi=0)=>`${y}-${pad(m)}-${pad(d)}T${pad(h)}:${pad(mi)}:00+08:00`;
const CONCERT_WORDS=/演唱會|concert|world\s*tour|asia\s*tour|\btour\b|\blive\b|fan\s*(?:meeting|concert)|音樂會|樂團|歌手|idol|k-pop|j-pop/i;
const EXCLUDE_WORDS=/論壇|研討會|說明會|記者會|展覽|課程|講座|市集|競賽|徵件|婚宴|會議|conference|seminar/i;

async function getText(url,timeoutMs=5200){
  const r=await fetch(url,{headers:{Accept:'text/html,application/xhtml+xml','Accept-Language':'zh-TW,zh;q=0.9,en;q=0.8','User-Agent':UA},redirect:'follow',signal:AbortSignal.timeout(timeoutMs)});
  if(!r.ok)throw new Error(`${r.status} ${url}`);return r.text();
}
function clean(v=''){return String(v).replace(/\s+/g,' ').trim();}
function titleArtist(title=''){
  const t=clean(title).replace(/^演唱會\s*/,'').replace(/[《＜<].*$/,'').trim();
  const known=[[/LEE\s*YOUNGJI/i,'LEE YOUNGJI'],[/TAKUYA\s*KIMURA/i,'TAKUYA KIMURA'],[/Diana\s*Krall|戴安娜/i,'Diana Krall'],[/Atarayo|あたらよ/i,'Atarayo'],[/Do\s*As\s*Infinity/i,'Do As Infinity'],[/Kodaline/i,'Kodaline'],[/wave\s*to\s*earth/i,'wave to earth'],[/Central\s*Cee/i,'Central Cee']];
  const hit=known.find(([re])=>re.test(title));if(hit)return hit[1];
  return (t.split(/\s+(?:WORLD|ASIA|LIVE|TOUR|演唱會|巡迴)/i)[0]||t||'Live Event').slice(0,60);
}
function marketFromTitle(title=''){const t=title.toLowerCase();if(/k-pop|韓|youngji|wave to earth/.test(t))return'KR';if(/日本|kimura|atarayo|do as infinity/.test(t))return'JP';if(/[A-Za-z]/.test(title))return'INTL';return'TW';}
function eventBase({id,title,start,end=null,venue,city,sourceName,sourceUrl,venueModelId=null,venueLayoutId=null}){
  const artist=titleArtist(title);const market=marketFromTitle(title);
  return {id,artist,shortArtist:artist.replace(/[^A-Za-z0-9]/g,'').slice(0,4).toUpperCase()||'TW',title,type:'CONCERT',region:'TW',market,start,end,timeConfirmed:/T(?!00:00)/.test(start),venue,city,statusLabel:'場館官方已公開',ticketStatus:'CHECK OFFICIAL',ticketing:'依主辦／官方售票平台公告',price:'依官方售票頁公告',sourceName,sourceUrl,sharedSourceUrl:true,verified:true,checkedAt:new Date().toISOString(),tags:[market,'VENUE OFFICIAL','COVERAGE AUDITOR','AUTO'],summary:'由場館官方行事曆交叉發現；NEUL 會再回查主辦與官方售票頁，補入售票日、票價、座位圖與活動專屬 3D。',notes:['場館行事曆用於 coverage gap 偵測，不代表票價或舞台配置已完成驗證。'],venueModelId,venueLayoutId};
}

export function parseTmcCalendar(html='',sourceUrl='https://www.tmc.taipei/tw/blog/show'){
  const text=htmlToText(html).replace(/\s+/g,' ');const out=[];const re=/演唱會\s+(.+?)\s+(20\d{2})\.(\d{1,2})\.(\d{1,2})\s*\([^)]*\)(?:\s*~\s*(20\d{2})\.(\d{1,2})\.(\d{1,2})\s*\([^)]*\))?\s+(表演廳|Live House D|戶外表演空間|其他)/gi;let m;
  while((m=re.exec(text))){const title=clean(m[1]);if(EXCLUDE_WORDS.test(title))continue;const start=iso(+m[2],+m[3],+m[4]),end=m[5]?iso(+m[5],+m[6],+m[7]):null;if(new Date(end||start).getTime()<Date.now()-86400000)continue;out.push(eventBase({id:`venue-tmc-${slug(title)}-${m[2]}${pad(m[3])}${pad(m[4])}`,title,start,end,venue:'臺北流行音樂中心 Taipei Music Center',city:'Taipei',sourceName:'臺北流行音樂中心官方活動',sourceUrl,venueModelId:'taipei-music-center'}));}
  return out;
}
function tmcFilter(page){return Buffer.from(JSON.stringify({pages:page,category:'',year:'',month:'',keyword:'',direction:'latest'})).toString('base64');}
export async function discoverTaipeiMusicCenter(){
  const urls=['https://www.tmc.taipei/tw/blog/show',...Array.from({length:5},(_,i)=>`https://www.tmc.taipei/tw/blog/show?filter=${encodeURIComponent(tmcFilter(i+2))}`)];
  const settled=await Promise.allSettled(urls.map(getText));const events=[],pageErrors=[];settled.forEach((r,i)=>{if(r.status==='fulfilled')events.push(...parseTmcCalendar(r.value,urls[i]));else pageErrors.push(r.reason?.message||'TMC unavailable');});
  return {events:[...new Map(events.map(e=>[`${e.title}|${e.start}`,e])).values()],checkedUrls:urls.length,source:'臺北流行音樂中心官方活動',pageErrors,indexErrors:[]};
}

function taipeiDate(d){const p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;}
function ticcUrls(){const start=new Date(Date.now()-3*86400000),end=new Date(Date.now()+540*86400000);return [1,2,3,4].map(page=>`https://www.ticc.com.tw/wSite/sp?BaseDSD=7&CtUnit=96&ctNode=318&mp=1&nowpage=${page}&s_datetype=1&s_enddate=${taipeiDate(end)}&s_keywords=&s_order=1&s_roomId=0&s_startdate=${taipeiDate(start)}&xdUrl=%2FwSite%2Fap%2Flp_Activity_3.jsp`);}
export function parseTiccCalendar(html='',sourceUrl='https://www.ticc.com.tw/'){
  const text=htmlToText(html).replace(/\s+/g,' ');const out=[];
  const re=/(.{3,120}?)\s+活動單位\s*\/\s*[^\d]{1,90}(20\d{2})\/(\d{2})\/(\d{2})\s*~\s*(20\d{2})\/(\d{2})\/(\d{2})/g;let m;
  while((m=re.exec(text))){let title=clean(m[1]).replace(/^.*?(?=(?:演唱會|[A-Za-z0-9]))/,'');if(!CONCERT_WORDS.test(title)||EXCLUDE_WORDS.test(title))continue;const start=iso(+m[2],+m[3],+m[4]),end=iso(+m[5],+m[6],+m[7]);if(new Date(end).getTime()<Date.now()-86400000)continue;out.push(eventBase({id:`venue-ticc-${slug(title)}-${m[2]}${m[3]}${m[4]}`,title,start,end,venue:'臺北國際會議中心 TICC',city:'Taipei',sourceName:'TICC 官方活動行事曆',sourceUrl,venueModelId:'ticc'}));}
  return out;
}
export async function discoverTicc(){const urls=ticcUrls(),settled=await Promise.allSettled(urls.map(getText)),events=[],pageErrors=[];settled.forEach((r,i)=>{if(r.status==='fulfilled')events.push(...parseTiccCalendar(r.value,urls[i]));else pageErrors.push(r.reason?.message||'TICC unavailable');});return{events:[...new Map(events.map(e=>[`${e.title}|${e.start}`,e])).values()],checkedUrls:urls.length,source:'TICC 官方活動行事曆',pageErrors,indexErrors:[]};}

export function parseZeppCalendar(html='',sourceUrl='https://www.zepp.co.jp/hall/newtaipei/schedule/'){
  const text=htmlToText(html).replace(/\s+/g,' ');const out=[];const re=/(20\d{2})\s+(\d{1,2})\.(\d{1,2})\s+(?:MON|TUE|WED|THU|FRI|SAT|SUN)\s+(.+?)\s+(?:\[OPEN\]\s*\d{1,2}:\d{2}\s*)?\[START\]\s*(\d{1,2}):(\d{2})/gi;let m;
  while((m=re.exec(text))){const title=clean(m[4]);if(EXCLUDE_WORDS.test(title))continue;const start=iso(+m[1],+m[2],+m[3],+m[5],+m[6]);if(new Date(start).getTime()<Date.now()-86400000)continue;out.push(eventBase({id:`venue-zepp-${slug(title)}-${m[1]}${pad(m[2])}${pad(m[3])}`,title,start,venue:'Zepp New Taipei',city:'New Taipei',sourceName:'Zepp New Taipei 官方 Schedule',sourceUrl,venueModelId:'zepp-new-taipei'}));}
  return out;
}
export async function discoverZeppNewTaipei(){const url='https://www.zepp.co.jp/hall/newtaipei/schedule/';try{const html=await getText(url);return{events:parseZeppCalendar(html,url),checkedUrls:1,source:'Zepp New Taipei 官方 Schedule',pageErrors:[],indexErrors:[]};}catch(error){return{events:[],checkedUrls:1,source:'Zepp New Taipei 官方 Schedule',pageErrors:[error.message],indexErrors:[]};}}


export function parseKpmcCalendar(html='',sourceUrl='https://kpmc.com.tw/program/'){
  const text=htmlToText(html).replace(/\s+/g,' ');const out=[];
  const year=Number((text.match(/\b(20\d{2})\b/)||[])[1])||new Date().getFullYear();
  const re=/(\d{2})\.(\d{2})\s*\([^)]*\)\s*(\d{1,2}):(\d{2})\s+(海音館|LIVE WAREHOUSE(?:\s*小庫)?|珊瑚礁群|鯨魚堤岸[^\s]*|高雄流行音樂中心)\s+(.+?)(?=\s+\d{2}\.\d{2}\s*\(|\s+除室內區域|$)/g;let m;
  while((m=re.exec(text))){const place=clean(m[5]),title=clean(m[6]);if(EXCLUDE_WORDS.test(title))continue;const strongVenue=/海音館|LIVE WAREHOUSE/i.test(place);if(!strongVenue&&!CONCERT_WORDS.test(title))continue;const start=iso(year,+m[1],+m[2],+m[3],+m[4]);if(new Date(start).getTime()<Date.now()-86400000)continue;const isLive=/LIVE WAREHOUSE/i.test(place);out.push(eventBase({id:`venue-kpmc-${slug(title)}-${year}${m[1]}${m[2]}`,title,start,venue:isLive?'LIVE WAREHOUSE Kaohsiung':'高雄流行音樂中心 Kaohsiung Music Center',city:'Kaohsiung',sourceName:'高雄流行音樂中心官方展演資訊',sourceUrl,venueModelId:isLive?'live-warehouse':'kaohsiung-music-center'}));}
  return out;
}
export async function discoverKaohsiungMusicCenter(){const url='https://kpmc.com.tw/program/';try{const html=await getText(url);return{events:parseKpmcCalendar(html,url),checkedUrls:1,source:'高雄流行音樂中心官方展演資訊',pageErrors:[],indexErrors:[]};}catch(error){return{events:[],checkedUrls:1,source:'高雄流行音樂中心官方展演資訊',pageErrors:[error.message],indexErrors:[]};}}

export async function discoverVenueCalendars(){
  const settled=await Promise.allSettled([discoverTaipeiMusicCenter(),discoverTicc(),discoverZeppNewTaipei(),discoverKaohsiungMusicCenter()]);
  const events=[],pageErrors=[],indexErrors=[],sourceHealth=[];let checkedUrls=0;
  for(const r of settled){if(r.status!=='fulfilled'){pageErrors.push(r.reason?.message||'venue calendar unavailable');continue;}const d=r.value;events.push(...(d.events||[]));checkedUrls+=d.checkedUrls||0;pageErrors.push(...(d.pageErrors||[]));indexErrors.push(...(d.indexErrors||[]));sourceHealth.push({name:d.source,discovered:(d.events||[]).length,checkedUrls:d.checkedUrls||0,errors:(d.pageErrors?.length||0)+(d.indexErrors?.length||0)});}
  return {events,checkedUrls,pageErrors,indexErrors,source:'TMC + TICC + Zepp New Taipei + KPMC venue calendars',sourceHealth};
}
