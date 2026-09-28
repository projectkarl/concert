import { htmlToText } from './official-monitor.js';
import { artistMarketMarkers } from '../data/discovery.js';

const CALENDAR_URL='https://www.kaoarena.com.tw/Home/CalendarList?Category=%E8%97%9D%E6%96%87%E8%A1%A8%E6%BC%94&year=2026';
const pad=n=>String(n).padStart(2,'0');
const iso=(y,m,d)=>`${y}-${pad(m)}-${pad(d)}T00:00:00+08:00`;
const slug=s=>String(s).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g,'-').replace(/^-|-$/g,'').slice(0,70);
const artistAliases=[
  ['TREASURE','TREASURE'],['PLAVE','PLAVE'],['TWS','TWS'],['NMIXX','NMIXX'],['EXO','EXO'],['SUPER JUNIOR','SUPER JUNIOR'],['ITZY','ITZY'],['JOJI','JOJI']
];
function inferMarket(title=''){const h=title.toLowerCase();for(const [market,markers] of Object.entries(artistMarketMarkers||{}))if(markers.some(m=>h.includes(String(m).toLowerCase())))return market;if(/[가-힣]/.test(title))return 'KR';return 'INTL';}
function artistFromTitle(title=''){for(const [needle,name] of artistAliases)if(title.toUpperCase().includes(needle))return name;return title.split(/\s+(?:WORLD|TOUR|THE|IN|LIVE|演唱會)/i)[0].trim()||title;}
export function parseKaohsiungArenaCalendar(html=''){
  const text=htmlToText(html)
    .replace(/[ \t]+/g,' ')
    .replace(/\s+(?=(?:藝文表演|運動賽事|商業展演|其他)\s)/g,'\n');
  const out=[]; const now=Date.now()-86400000;
  for(const line of text.split(/\n+/).map(x=>x.trim()).filter(Boolean)){
    const m=line.match(/^藝文表演\s+(.+?)\s+(20\d{2})\/(\d{2})\/(\d{2})(?:~(20\d{2})\/(\d{2})\/(\d{2}))?/);
    if(!m)continue;
    const title=m[1].trim(); const market=inferMarket(title);
    const start=iso(m[2],m[3],m[4]); if(new Date(start).getTime()<now)continue;
    const end=m[5]?iso(m[5],m[6],m[7]):null; const artist=artistFromTitle(title);
    out.push({id:`kao-${slug(title)}-${m[2]}${m[3]}${m[4]}`,artist,shortArtist:artist.replace(/[^A-Za-z0-9]/g,'').slice(0,3).toUpperCase()||'INT',title,type:'CONCERT',region:'TW',start,end,timeConfirmed:false,venue:'高雄巨蛋 Kaohsiung Arena',city:'Kaohsiung',statusLabel:'演唱會',ticketStatus:'CHECK OFFICIAL',generalSale:null,ticketing:'依主辦／官方售票平台公告',price:'依官方售票頁公告',sourceName:'高雄巨蛋官方活動行事曆',sourceUrl:CALENDAR_URL,sharedSourceUrl:true,verified:true,checkedAt:new Date().toISOString(),market,tags:[market,'KAOHSIUNG','OFFICIAL CALENDAR','AUTO'],summary:'高雄巨蛋官方活動行事曆已確認本場次；售票、舞台與入場資訊請回主辦及官方售票平台核對。',ticketTimeline:[],notes:['高雄巨蛋行事曆用於確認場次日期；完整票務規則以藝人、主辦與官方售票平台公告為準。'],venueModelId:'kaohsiung-arena',venueLayoutId:'kaohsiung-base'});
  }
  return out;
}
async function fetchText(url,timeoutMs=3500){const r=await fetch(url,{headers:{Accept:'text/html,application/xhtml+xml','Accept-Language':'zh-TW,zh;q=0.9,en;q=0.8','User-Agent':'NEUL/0.7 (+taiwan-public-event-check)'},redirect:'follow',signal:AbortSignal.timeout(timeoutMs)});if(!r.ok)throw new Error(`${r.status} ${url}`);return r.text();}
export async function discoverKaohsiungArena(){const html=await fetchText(CALENDAR_URL);return {events:parseKaohsiungArenaCalendar(html),checkedUrls:1,source:'高雄巨蛋官方活動行事曆'};}
