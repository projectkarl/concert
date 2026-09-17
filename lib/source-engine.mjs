import crypto from 'node:crypto';

export const SIX_HOURS = 6 * 60 * 60 * 1000;

export const SOURCE_LIST = [
  {id:'tixcraft',name:'拓元售票',url:'https://tixcraft.com/activity',kind:'ticketing'},
  {id:'kktix',name:'KKTIX',url:'https://kktix.com/events',kind:'ticketing'},
  {id:'livenation',name:'Live Nation Taiwan',url:'https://www.livenation.com.tw/event/allevents',kind:'promoter'},
  {id:'famiticket',name:'FamiTicket 全網購票',url:'https://www.famiticket.com.tw/Home',kind:'ticketing'},
  {id:'ticketplus',name:'遠大售票 Ticket Plus',url:'https://ticketplus.com.tw/',kind:'ticketing'},
  {id:'ibon',name:'ibon 售票',url:'https://ticket.ibon.com.tw/',kind:'ticketing'},
  {id:'udn',name:'udn售票網',url:'https://tickets.udnfunlife.com/',kind:'ticketing'},
  {id:'ticket-com-tw',name:'年代售票',url:'https://www.ticket.com.tw/',kind:'ticketing'},
  {id:'cityline',name:'Cityline',url:'https://www.cityline.com/',kind:'ticketing'}
];

const clean = (s='') => String(s).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();
const stripTags = (s='') => clean(String(s).replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' '));
const abs = (src, base) => { try { return new URL(src, base).href; } catch { return null; } };
const unique = arr => [...new Set(arr.filter(Boolean))];
const sha = s => crypto.createHash('sha256').update(String(s || '')).digest('hex');

export function nextTaipeiRefresh(now = new Date()) {
  const t = new Date(now.getTime() + 8*60*60*1000);
  const y=t.getUTCFullYear(),m=t.getUTCMonth(),d=t.getUTCDate(),h=t.getUTCHours();
  const nextHour = [0,6,12,18].find(x=>x>h);
  let local;
  if(nextHour !== undefined) local = new Date(Date.UTC(y,m,d,nextHour,0,0));
  else local = new Date(Date.UTC(y,m,d+1,0,0,0));
  return new Date(local.getTime() - 8*60*60*1000).toISOString();
}

export function extractEventSignals(html, pageUrl) {
  const text = stripTags(html);
  const images = [];
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag=m[0];
    const src=(tag.match(/\bsrc=["']([^"']+)["']/i)||tag.match(/\bdata-src=["']([^"']+)["']/i)||[])[1];
    if(!src) continue;
    const alt=(tag.match(/\balt=["']([^"']*)["']/i)||[])[1]||'';
    const title=(tag.match(/\btitle=["']([^"']*)["']/i)||[])[1]||'';
    const label=clean(`${alt} ${title} ${src}`);
    images.push({src:abs(src,pageUrl),label});
  }
  const seatKeywords = /(座位|票區|場域|場地圖|seating|seat\s*map|seating\s*plan|floor\s*plan|venue\s*map|site\s*map)/i;
  const seatImages = images.filter(x=>seatKeywords.test(x.label));
  const allPrice = unique([...text.matchAll(/(?:NTD|NT\$|NT\s*\$|票價[:：]?\s*)\s*([0-9][0-9,]{2,5})/gi)].map(m=>Number(m[1].replace(/,/g,''))).filter(n=>n>=500&&n<=30000)).sort((a,b)=>b-a);
  let stageType='unknown';
  if(/四面台|中央舞台|center\s*stage|in-the-round/i.test(text)) stageType='center';
  else if(/延伸舞台|延伸台|花道|extended\s*stage|runway/i.test(text)) stageType='end-extended';
  else if(/主舞台|main\s*stage/i.test(text)) stageType='end';
  const obstructed = /(視線遮蔽|視線受阻|restricted\s*view|obstructed\s*view)/i.test(text);
  return {text,seatImages,prices:allPrice,stageType,obstructed};
}

export async function fetchText(url, timeoutMs=4500) {
  const ctrl = new AbortController();
  const timer=setTimeout(()=>ctrl.abort(),timeoutMs);
  try{
    const res=await fetch(url,{signal:ctrl.signal,headers:{'user-agent':'Mozilla/5.0 NEUL/0.41 (+https://vercel.app)','accept-language':'zh-TW,zh;q=0.9,en;q=0.7'}});
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally { clearTimeout(timer); }
}

export async function enrichEvent(seed) {
  const urls=unique([seed.sourceUrl,seed.secondarySourceUrl]);
  const snapshots=[];
  for(const url of urls){
    try{
      const html=await fetchText(url);
      const sig=extractEventSignals(html,url);
      snapshots.push({url,ok:true,...sig});
    }catch(err){ snapshots.push({url,ok:false,error:String(err?.message||err)}); }
  }
  const good=snapshots.filter(x=>x.ok);
  const seatImages=unique(good.flatMap(x=>x.seatImages?.map(i=>i.src)||[]));
  const prices=unique([...(seed.prices||[]),...good.flatMap(x=>x.prices||[])]).sort((a,b)=>b-a);
  const inferredStage=good.map(x=>x.stageType).find(x=>x&&x!=='unknown');
  const stageType = seed.stageType || inferredStage || 'end';
  const obstructed = (seed.sections||[]).some(x=>x.obstructed) || good.some(x=>x.obstructed);
  const seatMapImage = seatImages[0] || seed.seatMapImage || null;
  const seatMapHash = sha(`${seatMapImage||'none'}|${seatImages.join('|')}|${prices.join(',')}|${stageType}|${obstructed}`);
  return {
    ...seed,
    prices,
    stageType,
    seatMapImage,
    seatMapCandidates:seatImages.slice(0,6),
    seatMapHash,
    sceneVersion:seatMapHash.slice(0,12),
    sourceChecks:snapshots.map(x=>({url:x.url,ok:x.ok,error:x.error||null,seatMapCount:x.seatImages?.length||0,priceCount:x.prices?.length||0})),
    automation:{detailFetched:good.length>0,seatMapCaptured:!!seatMapImage,priceCaptured:prices.length>0,sceneRebuildKey:seatMapHash},
    obstructed
  };
}

export function mergeAndSort(events){
  const seen=new Map();
  for(const e of events){
    const k=(e.id||`${e.artist}|${e.title}|${e.dateStart}`).toLowerCase();
    if(!seen.has(k)) seen.set(k,e);
  }
  return [...seen.values()].sort((a,b)=>new Date(a.dateStart)-new Date(b.dateStart));
}
