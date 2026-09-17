import { extractOfficialSeatLayoutUrl } from "./official-monitor.js";

const UA = "Mozilla/5.0 (compatible; NEUL/0.34; +https://vercel.app)";
const TAIWAN_MARKERS = /台北|臺北|新北|桃園|林口|台中|臺中|台南|臺南|高雄|新竹|基隆|嘉義|彰化|屏東|宜蘭|花蓮|台東|臺東|世運|國家體育場|Taipei|Taoyuan|Taichung|Tainan|Kaohsiung|National Stadium|NTSU|Legacy TERA/i;
const CITY_RULES = [
  [/桃園|林口|NTSU/i,"Taoyuan"],[/高雄|Kaohsiung/i,"Kaohsiung"],[/台中|臺中|Taichung/i,"Taichung"],[/台南|臺南|Tainan/i,"Tainan"],[/新北/i,"New Taipei"],[/新竹/i,"Hsinchu"],[/基隆/i,"Keelung"],[/嘉義/i,"Chiayi"],[/彰化/i,"Changhua"],[/屏東/i,"Pingtung"],[/宜蘭/i,"Yilan"],[/花蓮/i,"Hualien"],[/台東|臺東/i,"Taitung"],[/台北|臺北|Taipei|Legacy TERA/i,"Taipei"]
];
const PLATFORM_INDEXES = [
  {name:"tixCraft 拓元",url:"https://tixcraft.com/activity",detail:/https?:\/\/tixcraft\.com\/activity\/detail\/[A-Za-z0-9_-]+/g},
  {name:"KKTIX",url:"https://kktix.com/events",detail:/https?:\/\/[A-Za-z0-9.-]*kktix\.cc\/events\/[A-Za-z0-9_-]+/g},
  {name:"Ticket Plus 遠大售票",url:"https://ticketplus.com.tw/activity",detail:/https?:\/\/ticketplus\.com\.tw\/activity\/[A-Za-z0-9_-]+/g},
  {name:"寬宏售票",url:"https://kham.com.tw/application/UTK02/UTK0201_.aspx",detail:/https?:\/\/kham\.com\.tw\/application\/UTK02\/[A-Za-z0-9_?.=&%-]+/g}
];

async function getText(url){const r=await fetch(url,{headers:{"user-agent":UA,"accept-language":"zh-TW,zh;q=0.9,en;q=0.7"},redirect:"follow"});if(!r.ok)throw new Error(`${r.status} ${url}`);return await r.text();}
const decode=s=>String(s||"").replace(/<[^>]+>/g," ").replace(/&nbsp;|&#160;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/\s+/g," ").trim();
function absolute(base,href){try{return new URL(href,base).href}catch{return""}}
function linksFrom(html,base,platform){const out=new Set();for(const m of html.matchAll(/href=["']([^"']+)["']/gi)){const u=absolute(base,m[1]);if(u&&platform.detail.test(u)){platform.detail.lastIndex=0;out.add(u.split('#')[0]);}else platform.detail.lastIndex=0;}for(const m of html.matchAll(platform.detail)){out.add(m[0].split('#')[0]);}return [...out];}
function firstMatch(text,res){for(const re of res){const m=text.match(re);if(m?.[1])return decode(m[1]);}return""}

function parseDate(raw){
  const text=String(raw||"");
  const m=text.match(/(20\d{2})[\/.\-](\d{1,2})[\/.\-](\d{1,2})(?:[^0-9]{0,18}(\d{1,2})[:：](\d{2}))?/)
    || text.match(/(20\d{2})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日(?:[^0-9]{0,18}(\d{1,2})[:：](\d{2}))?/);
  if(!m)return null;
  const [,y,mo,d,h="18",mi="00"]=m;
  return `${y}-${mo.padStart(2,"0")}-${d.padStart(2,"0")}T${h.padStart(2,"0")}:${mi}+08:00`;
}

export function parsePage(html,url,platform){
  const text=decode(html);
  if(!TAIWAN_MARKERS.test(text))return null;
  const title=firstMatch(html,[/<title[^>]*>([\s\S]*?)<\/title>/i,/<h1[^>]*>([\s\S]*?)<\/h1>/i])||"台灣演出";
  const isAwards=/asia\s*artist\s*awards|\bAAA\s*2026|頒獎典禮|award\s*ceremony/i.test(title+" "+text);
  const artist=isAwards ? "Asia Artist Awards" : (firstMatch(text,[/演出(?:藝人)?[：:]\s*([^｜|。]{2,60})/i,/^\s*([A-Z][A-Z0-9 .&'_-]{2,40})\s+(?:WORLD|ASIA|TOUR|FAN)/i])||title.split(/[-｜|]/)[0].trim().slice(0,60));
  const venue=firstMatch(text,[/演出地點[：:]\s*([^。\n]{2,80})/i,/VENUE[：:]?\s*([^。\n]{2,80})/i,/演出場所[：:]\s*([^。\n]{2,80})/i])
    || firstMatch(text,[/(台北小巨蛋|臺北小巨蛋|台北大巨蛋|臺北大巨蛋|林口體育館|國立體育大學綜合體育館|高雄巨蛋|高雄國家體育場(?:（世運主場館）)?|世運主場館|Kaohsiung National Stadium|TICC|台北流行音樂中心|臺北流行音樂中心|Legacy TERA)/i]);
  if(!venue)return null;
  const dateRaw=firstMatch(text,[/演出(?:日期|時間)[：:]\s*([^。]{4,120})/i,/PERFORMANCE DATE[^:：]*[：:]?\s*([^。]{4,120})/i,/Event Dates?[：:]\s*([^。]{4,120})/i]);
  const start=parseDate(dateRaw||text);
  if(!start)return null;
  const city=(CITY_RULES.find(([re])=>re.test(venue))||CITY_RULES.find(([re])=>re.test(text))||[])[1]||"Taipei";
  const price=firstMatch(text,[/演出票價[：:]\s*([^。]{2,180})/i,/TICKET PRICES?[：:]\s*([^。]{2,180})/i,/票價[：:]\s*([^。]{2,180})/i]);
  const general=firstMatch(text,[/一般售票(?:日期|時間)?\s*[：:]\s*([^。]{4,100})/i,/一般售票\s*[：:]\s*([^。]{4,100})/i,/售票時間[：:]\s*([^。]{4,100})/i,/General Sale(?:\s*Time)?[：:]?\s*([^。]{4,100})/i]);
  const seatLayoutSourceUrl=extractOfficialSeatLayoutUrl(html,url);
  const type=isAwards?"AWARDS":(/fan ?meeting|見面會/i.test(title+text)?"FAN MEETING":"CONCERT");
  const statusLabel=isAwards?"頒獎典禮":(type==="FAN MEETING"?"見面會":"演唱會");
  return {
    id:`auto-${platform.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}-${Buffer.from(url).toString("base64url").slice(0,16)}`,
    artist,title,type,region:"TW",start,venue,city,statusLabel,ticketStatus:"OFFICIAL",
    generalSale:parseDate(general),ticketing:platform.name,price:price||"依官方售票頁公告",
    sourceName:platform.name,sourceUrl:url,seatLayoutSourceUrl:seatLayoutSourceUrl||null,
    verified:true,checkedAt:new Date().toISOString(),tags:["AUTO DISCOVERED","TAIWAN",...(isAwards?["AWARDS"]:[])],
    summary:"由台灣官方售票平台活動頁自動發現；票價、日期與場館仍以原頁最新公告為準。"
  };
}

export async function discoverTaiwanTicketPlatforms(){
  const events=[],indexErrors=[],pageErrors=[];let checkedUrls=0;
  for(const platform of PLATFORM_INDEXES){
    try{
      const html=await getText(platform.url);checkedUrls++;
      const urls=linksFrom(html,platform.url,platform).slice(0,36);
      for(const url of urls){
        try{const detail=await getText(url);checkedUrls++;const e=parsePage(detail,url,platform);if(e)events.push(e);}catch(err){pageErrors.push(`${platform.name}: ${err.message}`)}
      }
    }catch(err){indexErrors.push(`${platform.name}: ${err.message}`)}
  }
  return{events,checkedUrls,indexErrors,pageErrors,source:"tixCraft + KKTIX + Ticket Plus + 寬宏"};
}
