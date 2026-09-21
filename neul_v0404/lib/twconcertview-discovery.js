const CALENDAR_URL = 'https://twconcertview.com/calendar';
const UA = 'Mozilla/5.0 (compatible; NEUL/0.40.4; +coverage-cross-check)';
const pad = n => String(n).padStart(2,'0');
const slug = value => String(value || '').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g,'-').replace(/^-|-$/g,'').slice(0,78);

const VENUE_CITY_RULES = [
  [/高雄|Kaohsiung|LIVE WAREHOUSE/i,'Kaohsiung'],
  [/桃園|林口體育館|國立體育大學|NTSU/i,'Taoyuan'],
  [/新北|Zepp New Taipei|新莊|板橋|三重|淡水|新店|汐止/i,'New Taipei'],
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
  [/台北|臺北|Taipei|Legacy|MOONDOG|WESTAR|HANASPACE|Clapper Studio|Billboard Live/i,'Taipei']
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
  [/天母體育館|Tianmu Gymnasium/i,'tianmu-gymnasium'],
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
  // Kana is a reliable Japan signal; Han characters alone are NOT (Chinese titles use them too).
  if(/[ぁ-んァ-ヶ]/u.test(t) || /J-?POP|日本(?:藝人|歌手|樂團|偶像)?|Japan(?:ese)?/i.test(t)) return 'JP';
  if(/K-?POP|韓國|韓星|Korea(?:n)?|TREASURE|BLACKPINK|IVE|LE SSERAFIM|aespa|NMIXX|BABYMONSTER|SEVENTEEN|BTS/i.test(t)) return 'KR';
  if(/[A-Za-z]/.test(t) && !/[\u4e00-\u9fff]/u.test(t)) return 'INTL';
  return 'TW';
}
function inferType(title=''){
  if(/fan\s*con|fancon/i.test(title)) return 'FANCON';
  if(/fan\s*meeting|見面會/i.test(title)) return 'FAN MEETING';
  if(/festival|音樂節|祭/i.test(title)) return 'FESTIVAL';
  return 'CONCERT';
}

export function parseTwConcertViewCalendar(html='') {
  const decoded=decodeEntities(html);
  const text=plainText(decoded);
  const referenceCount=Number((text.match(/(?:近期\s*|—\s*)(\d{2,4})\s*(?:場演出|upcoming shows)/i)||[])[1] || 0);
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
    map.set(key,{id:`coverage-twcv-${slug(`${title}-${venue}`)}-${y}${pad(mo)}${pad(d)}`,artist,shortArtist:artist.replace(/[^A-Za-z0-9]/g,'').slice(0,4).toUpperCase()||'LIVE',title,type:inferType(title),region:'TW',market,start,end:null,timeConfirmed:false,venue,city,statusLabel:'跨站補漏待官方核對',ticketStatus:'CHECK OFFICIAL',ticketing:'請回查主辦／官方售票平台',price:'依官方售票頁公告',sourceName:'twconcertview 行事曆（覆蓋補漏）',sourceUrl:CALENDAR_URL,sharedSourceUrl:true,verified:false,coverageReference:true,autoUpdated:true,checkedAt:new Date().toISOString(),tags:[market,'COVERAGE REFERENCE','AUTO'],venueModelId,summary:'由公開演唱會行事曆作為 coverage cross-check 補漏；NEUL 仍以主辦、售票平台與場館官方來源覆核活動細節。',notes:['此來源只用來發現可能漏掉的台灣演出，不作為票價、售票規則或舞台配置的最終依據。']});
  }
  return {events:[...map.values()],referenceCount,parsedCount:map.size};
}

export async function discoverTwConcertViewCalendar(){
  try{
    const r=await fetch(CALENDAR_URL,{headers:{Accept:'text/html,application/xhtml+xml','Accept-Language':'zh-TW,zh;q=0.9,en;q=0.7','User-Agent':UA},redirect:'follow',signal:AbortSignal.timeout(6500)});
    if(!r.ok) throw new Error(`TWCV_${r.status}`);
    const html=await r.text();
    const parsed=parseTwConcertViewCalendar(html);
    return {...parsed,checkedUrls:1,source:'twconcertview 公開行事曆（coverage cross-check）',pageErrors:[],indexErrors:[],sourceHealth:[{name:'twconcertview coverage cross-check',discovered:parsed.parsedCount,referenceCount:parsed.referenceCount,checkedUrls:1,errors:0}]};
  }catch(error){
    return {events:[],referenceCount:0,parsedCount:0,checkedUrls:1,source:'twconcertview 公開行事曆（coverage cross-check）',pageErrors:[error?.message||'twconcertview unavailable'],indexErrors:[],sourceHealth:[{name:'twconcertview coverage cross-check',discovered:0,referenceCount:0,checkedUrls:1,errors:1}]};
  }
}
