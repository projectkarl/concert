const ROOT = 'https://www.artists.tw/gigs/';
const ICS = 'https://tw-gigs.orbis-f60.workers.dev/feeds/all.ics';
const UA = 'Mozilla/5.0 (compatible; NEUL/0.40.17; +taiwan-live-reference)';
const pad=n=>String(n).padStart(2,'0');
const slug=v=>String(v||'').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g,'-').replace(/^-|-$/g,'').slice(0,82);
const clean=v=>String(v||'').replace(/\\n/g,' ').replace(/\\,/g,',').replace(/\\;/g,';').replace(/\\\\/g,'\\').replace(/\s+/g,' ').trim();
const cityMap=[[/台北|臺北|Taipei|Legacy|WESTAR|Clapper|Billboard|Revolver|MOONDOG|THE WALL|PIPE/i,'Taipei'],[/新北|New Taipei|Zepp|新莊|板橋|三重/i,'New Taipei'],[/桃園|Taoyuan|林口|NTSU/i,'Taoyuan'],[/台中|臺中|Taichung/i,'Taichung'],[/台南|臺南|Tainan/i,'Tainan'],[/高雄|Kaohsiung|LIVE WAREHOUSE/i,'Kaohsiung'],[/基隆|Keelung/i,'Keelung'],[/新竹|Hsinchu/i,'Hsinchu'],[/嘉義|Chiayi/i,'Chiayi'],[/宜蘭|Yilan/i,'Yilan'],[/花蓮|Hualien/i,'Hualien'],[/台東|臺東|Taitung/i,'Taitung'],[/澎湖|Penghu/i,'Penghu']];
const venueModels=[[/臺?北大巨蛋|Taipei Dome/i,'taipei-dome'],[/臺?北小巨蛋|Taipei Arena/i,'taipei-arena'],[/林口體育館|國立體育大學|NTSU/i,'ntsu-arena'],[/高雄巨蛋|Kaohsiung Arena/i,'kaohsiung-arena'],[/國家體育場|世運主場館|National Stadium/i,'kaohsiung-stadium'],[/臺?北流行音樂中心|Taipei Music Center/i,'taipei-music-center'],[/TICC|臺?北國際會議中心/i,'ticc'],[/高雄流行音樂中心|海音館|Kaohsiung Music Center/i,'kaohsiung-music-center'],[/臺?大綜合體育館|NTU Sports/i,'ntu-sports-center'],[/南港展覽館.*(?:一館|Hall 1)/i,'nangang-exhibition-hall1-4f'],[/Zepp New Taipei/i,'zepp-new-taipei']];
function cityFor(v=''){return cityMap.find(([r])=>r.test(v))?.[1]||''}
function venueModelFor(v=''){return venueModels.find(([r])=>r.test(v))?.[1]||null}
function inferType(t=''){return /festival|音樂節|祭/i.test(t)?'FESTIVAL':/fan\s*(?:meeting|con)|見面會/i.test(t)?'FAN MEETING':'CONCERT'}
function inferMarket(t=''){if(/[ぁ-んァ-ヶ]/u.test(t)||/Japan|J-?POP/i.test(t))return'JP';if(/K-?POP|Korea|韓國|\bTREASURE\b|\bBTS\b|\bIVE\b|\baespa\b|\bNIEL\b|\bWHIB\b/i.test(t))return'KR';if(/[A-Za-z]/.test(t)&&!/\p{Script=Han}/u.test(t))return'INTL';return'TW'}
function eventFrom({title,start,end='',venue='',url=ROOT,source='Artists.tw 現場音樂索引（補漏參考）'}){
  title=clean(title);venue=clean(venue);if(!title||!start)return null;const city=cityFor(venue),market=inferMarket(title);
  return {id:`coverage-artists-${slug(`${title}-${venue}`)}-${String(start).slice(0,10).replaceAll('-','')}`,artist:title,shortArtist:title.replace(/[^A-Za-z0-9]/g,'').slice(0,5).toUpperCase()||'LIVE',title,type:inferType(title),region:'TW',market,start,end:end||null,timeConfirmed:!/T00:00:00/.test(start),venue,city,statusLabel:'參考收錄 · 待官方覆核',ticketStatus:'CHECK OFFICIAL',ticketing:'待官方售票來源回補',price:'依官方售票頁公告',sourceName:source,sourceUrl:url||ROOT,sharedSourceUrl:true,verified:false,referenceOnly:true,verificationLevel:'reference',coverageReference:true,autoUpdated:true,checkedAt:new Date().toISOString(),tags:[market,'COVERAGE REFERENCE','ARTISTS.TW','REFERENCE QUEUE','AUTO'],venueModelId:venueModelFor(venue),summary:'由台灣現場音樂公開索引加入補漏參考佇列；日期、場館、票價與座位配置會再由官方來源覆核。',notes:['Artists.tw 僅作補漏索引；最終資訊以售票、主辦、藝人或場館官方頁為準。']};
}
function unfoldIcs(raw=''){return String(raw).replace(/\r?\n[ \t]/g,'').replace(/\r/g,'')}
function parseIcsDate(raw='',params=''){
  const v=String(raw).trim();if(!v)return'';
  if(/^\d{8}$/.test(v))return`${v.slice(0,4)}-${v.slice(4,6)}-${v.slice(6,8)}T00:00:00+08:00`;
  const m=v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/);if(!m)return'';
  const base=`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]||'00'}`;
  if(m[7])return new Date(`${base}Z`).toISOString();
  // Artists.tw feed is Taiwan-focused; if TZID is absent, interpret floating time as Asia/Taipei.
  return `${base}+08:00`;
}
export function parseArtistsTwIcs(raw=''){
  const text=unfoldIcs(raw),blocks=text.split('BEGIN:VEVENT').slice(1).map(x=>x.split('END:VEVENT')[0]);const events=[];
  for(const block of blocks){const obj={};for(const line of block.split('\n')){const i=line.indexOf(':');if(i<1)continue;const lhs=line.slice(0,i),value=line.slice(i+1),[key,...paramParts]=lhs.split(';');obj[key.toUpperCase()]={value,params:paramParts.join(';')}}
    const title=clean(obj.SUMMARY?.value),venue=clean(obj.LOCATION?.value),start=parseIcsDate(obj.DTSTART?.value,obj.DTSTART?.params),end=parseIcsDate(obj.DTEND?.value,obj.DTEND?.params),url=clean(obj.URL?.value)||ROOT;const e=eventFrom({title,venue,start,end,url});if(e)events.push(e);
  }
  const map=new Map();for(const e of events){const k=`${e.start.slice(0,10)}|${e.title.toLowerCase()}|${e.venue.toLowerCase()}`;if(!map.has(k))map.set(k,e)}return[...map.values()];
}
function htmlText(html=''){return String(html).replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/(?:article|div|p|li|h\d|section|time)>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/\n\s+/g,'\n').replace(/[ \t]+/g,' ').trim()}
export function parseArtistsTwHtml(html='',sourceUrl=ROOT){
  const text=htmlText(html),lines=text.split('\n').map(clean).filter(Boolean),events=[];const ref=Number(text.match(/目前收錄\s*([\d,]+)\s*場演出/)?.[1]?.replaceAll(',','')||0);
  for(let i=0;i<lines.length;i++){const m=lines[i].match(/^(20\d{2})年(\d{1,2})月(\d{1,2})日(?:\s*[(（].*?[)）])?/);if(!m)continue;let venue='',title='';
    // Current cards render title -> venue/city -> date. Walk backwards over price/category noise.
    for(let j=i-1;j>=Math.max(0,i-5);j--){const s=lines[j];if(!venue&&(/·\s*(?:台北市|新北市|桃園市|台中市|臺中市|台南市|臺南市|高雄市|基隆市|新竹市|嘉義市|宜蘭縣|花蓮縣|台東縣|臺東縣|澎湖縣)/.test(s)||/Legacy|WESTAR|Clapper|Zepp|Arena|TICC|LIVE WAREHOUSE|THE WALL|Revolver|MOONDOG/i.test(s))){venue=s.replace(/\s*·\s*(?:台北市|新北市|桃園市|台中市|臺中市|台南市|臺南市|高雄市|基隆市|新竹市|嘉義市|宜蘭縣|花蓮縣|台東縣|臺東縣|澎湖縣).*$/,'');continue;}if(!title&&s!==venue&&!/^(?:NT\$|\$|免費|Free|票價|更多|詳細)/i.test(s)&&s.length>=2){title=s;break;}}
    if(!title)continue;const start=`${m[1]}-${pad(m[2])}-${pad(m[3])}T00:00:00+08:00`,e=eventFrom({title,venue,start,url:sourceUrl});if(e)events.push(e);
  }
  const map=new Map();for(const e of events){const k=`${e.start.slice(0,10)}|${e.title.toLowerCase()}|${e.venue.toLowerCase()}`;if(!map.has(k))map.set(k,e)}return{events:[...map.values()],referenceCount:ref};
}
async function fetchText(url,accept='text/html') {const r=await fetch(url,{headers:{Accept:accept,'Accept-Language':'zh-TW,zh;q=0.9,en;q=0.5','User-Agent':UA},redirect:'follow',signal:AbortSignal.timeout(5200)});if(!r.ok)throw new Error(`ARTISTS_TW_${r.status} ${url}`);return{url:r.url||url,text:await r.text()}}
export async function discoverArtistsTwGigs(){
  const errors=[];let referenceCount=0;const map=new Map(),add=list=>{for(const e of list||[]){const k=`${e.start.slice(0,10)}|${e.title.toLowerCase()}|${e.venue.toLowerCase()}`;if(!map.has(k))map.set(k,e)}};
  try{const feed=await fetchText(ICS,'text/calendar,text/plain;q=0.9,*/*;q=0.5');add(parseArtistsTwIcs(feed.text));}catch(e){errors.push(e?.message||'Artists.tw ICS unavailable')}
  // HTML provides a live advertised total and is also a fallback when the calendar feed is unavailable/thin.
  let htmlPages=0;try{const root=await fetchText(ROOT);const parsed=parseArtistsTwHtml(root.text,root.url);referenceCount=parsed.referenceCount||0;add(parsed.events);htmlPages++;
    if(map.size<120){const urls=Array.from({length:7},(_,i)=>`${ROOT}page/${i+2}/`);const settled=await Promise.allSettled(urls.map(u=>fetchText(u)));for(const r of settled){if(r.status!=='fulfilled'){errors.push(r.reason?.message||'Artists.tw page unavailable');continue;}const p=parseArtistsTwHtml(r.value.text,r.value.url);referenceCount=Math.max(referenceCount,p.referenceCount||0);add(p.events);htmlPages++;}}
  }catch(e){errors.push(e?.message||'Artists.tw root unavailable')}
  const now=Date.now()-86400000,events=[...map.values()].filter(e=>new Date(e.end||e.start||0).getTime()>=now).sort((a,b)=>new Date(a.start)-new Date(b.start));
  return{events,referenceCount,parsedCount:events.length,checkedUrls:1+htmlPages,source:'Artists.tw 現場音樂索引（補漏參考）',pageErrors:errors,indexErrors:[],sourceHealth:[{name:'Artists.tw live reference',discovered:events.length,referenceCount,checkedUrls:1+htmlPages,errors:errors.length}]};
}
