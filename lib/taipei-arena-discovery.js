import { htmlToText } from "./official-monitor.js";

const INDEX = "https://www.arena.taipei/News.aspx?n=2E1489AFE4B1BEA1&sms=F9A95D3F5A5C2C68";
const uniq = values => [...new Set(values.filter(Boolean))];
const pad = n => String(n).padStart(2, "0");
const slug = value => String(value).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g,"-").replace(/^-|-$/g,"").slice(0,72);

async function fetchText(url, timeoutMs=4200){
  const r=await fetch(url,{headers:{Accept:"text/html,application/xhtml+xml","Accept-Language":"zh-TW,zh;q=0.9,en;q=0.8","User-Agent":"NEUL/0.31 (+taipei-arena-public-events)"},redirect:"follow",signal:AbortSignal.timeout(timeoutMs)});
  if(!r.ok) throw new Error(`${r.status} ${url}`); return r.text();
}
function absolute(href){try{const u=new URL(href,INDEX);if(u.hostname!=="www.arena.taipei")return null;if(!/News_Content\.aspx/i.test(u.pathname))return null;u.hash="";return u.href;}catch{return null;}}
export function extractTaipeiArenaLinks(html=""){
  const out=[]; const re=/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for(const m of String(html).matchAll(re)){const url=absolute(m[1]);if(!url)continue;const title=htmlToText(m[2]);if(/20\d{2}\//.test(title))out.push({url,title});}
  return uniq(out.map(x=>`${x.url}\t${x.title}`)).map(x=>{const [url,...rest]=x.split("\t");return{url,title:rest.join("\t")};});
}
export function parseTaipeiArenaDates(title=""){
  const year=Number(title.match(/(20\d{2})\//)?.[1]); if(!year)return null;
  const md=[...title.matchAll(/(?:20\d{2}\/)?(\d{1,2})\/(\d{1,2})/g)].map(m=>[Number(m[1]),Number(m[2])]);
  if(!md.length)return null; const [m1,d1]=md[0], [m2,d2]=md[1]||md[0];
  return {start:`${year}-${pad(m1)}-${pad(d1)}T00:00:00+08:00`,end:md[1]?`${year}-${pad(m2)}-${pad(d2)}T00:00:00+08:00`:null};
}
function cleanTitle(title=""){return title.replace(/^20\d{2}\/[\d、/,]+\s*/,"").replace(/^《|》$/g,"").trim();}
function artistFromTitle(title=""){
  const t=cleanTitle(title).replace(/[《＜<].*$/," ").trim();
  const known=[
    [/BABYMONSTER/i,"BABYMONSTER"],[/Charlie Puth/i,"Charlie Puth"],[/LANY/i,"LANY"],
    [/Yuuri|優里/i,"Yuuri"],[/XG/i,"XG"],[/Vaundy/i,"Vaundy"],[/Hans Zimmer|漢斯[·・．]?季默/i,"Hans Zimmer"]
  ];
  const hit=known.find(([re])=>re.test(title)); return hit?.[1]||t.slice(0,60)||"Taipei Arena Event";
}
function market(title=""){const h=title.toLowerCase();if(/yuuri|vaundy|xg|日本/.test(h))return"JP";if(/lany|charlie puth|hans zimmer|漢斯/.test(h))return"INTL";if(/babymonster|ive|k-pop|韓/.test(h))return"KR";return"TW";}
export async function discoverTaipeiArena(){
  const html=await fetchText(INDEX,3800); const links=extractTaipeiArenaLinks(html); const now=Date.now(); const events=[];
  for(const item of links){const dates=parseTaipeiArenaDates(item.title);if(!dates)continue;const ts=new Date(dates.start).getTime();if(!Number.isFinite(ts)||ts<now-86400000*3)continue;const title=cleanTitle(item.title),artist=artistFromTitle(item.title),m=market(item.title);
    events.push({id:`arena-${slug(`${artist}-${dates.start}`)}`,artist,shortArtist:artist.replace(/[^A-Za-z0-9]/g,"").slice(0,3).toUpperCase()||"TA",title,type:"CONCERT",region:"TW",market:m,start:dates.start,end:dates.end,timeConfirmed:false,venue:"臺北小巨蛋 Taipei Arena",city:"Taipei",statusLabel:"場館已公開",ticketStatus:"CHECK OFFICIAL",ticketing:"依場館／主辦公告",price:"依官方公告",sourceName:"臺北小巨蛋官方活動",sourceUrl:item.url,verified:true,checkedAt:new Date().toISOString(),tags:[m,"TAIPEI ARENA","VENUE OFFICIAL","AUTO"],venueModelId:"taipei-arena",venueLayoutId:"taipei-arena-far",summary:"臺北小巨蛋官方已公開活動；時間、票價與售票規則請進活動頁核對。",notes:["此來源只補充在臺北小巨蛋舉辦的台灣場次；藝人國籍不限，不匯入任何海外場次。"]});
  }
  return {events,checkedUrls:1+links.length,source:"臺北小巨蛋官方已公開活動",pageErrors:[],indexErrors:[]};
}
