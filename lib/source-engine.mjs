import crypto from 'node:crypto';

export const SIX_HOURS = 6 * 60 * 60 * 1000;

export function eventLifecycle(e, now=Date.now()){
  const starts=[e?.dateStart,...(Array.isArray(e?.dates)?e.dates:[])].map(x=>+new Date(x)).filter(Number.isFinite).sort((a,b)=>a-b);
  const start=starts[0]??NaN,lastStart=starts.at(-1)??start;
  let end=e?.dateEnd?+new Date(e.dateEnd):NaN;
  if(!Number.isFinite(end)&&Number.isFinite(lastStart)){
    const d=new Date(lastStart);
    const taipeiEndOfDay=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),15,59,59,999);
    end=Math.max(lastStart+8*60*60*1000,taipeiEndOfDay);
  }
  if(Number.isFinite(lastStart)&&(!Number.isFinite(end)||end<lastStart))end=lastStart+8*60*60*1000;
  const phase=!Number.isFinite(start)?'unknown':now>end?'archive':now>=start?'live':'upcoming';
  return {
    phase,
    startAt:Number.isFinite(start)?new Date(start).toISOString():null,
    endAt:Number.isFinite(end)?new Date(end).toISOString():null,
    archiveEligible:phase==='archive'
  };
}
const FETCH_MEMO=new Map();
const FETCH_MEMO_TTL=2*60*1000;

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
  const now=Date.now(),cached=FETCH_MEMO.get(url);
  if(cached && now-cached.at<FETCH_MEMO_TTL) return cached.promise;
  const promise=(async()=>{
    const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),timeoutMs);
    try{
      const res=await fetch(url,{signal:ctrl.signal,headers:{'user-agent':'Mozilla/5.0 NEUL/0.53 (+https://vercel.app)','accept-language':'zh-TW,zh;q=0.9,en;q=0.7'}});
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } finally { clearTimeout(timer); }
  })();
  FETCH_MEMO.set(url,{at:now,promise});
  try{return await promise}catch(err){FETCH_MEMO.delete(url);throw err}
}


const EVENT_HINT = /(concert|tour|fancon|fanmeeting|live|演唱會|巡迴|見面會|粉絲見面會|世界巡演)/i;
const TAIWAN_HINT = /(台北|臺北|高雄|台中|臺中|桃園|新北|台南|臺南|Taipei|Kaohsiung|Taichung|Taoyuan|Taiwan)/i;
const VENUE_HINT = /(小巨蛋|大巨蛋|國家體育場|世運|流行音樂中心|海音館|北流|高流|體育館|Arena|Stadium|Music Center)/i;

function extractLinks(html, base){
  const out=[];
  for(const m of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
    const url=abs(m[1],base), label=stripTags(m[2]);
    if(url && label) out.push({url,label});
  }
  return out;
}
function inferDate(text){
  const year=(text.match(/\b(2026|2027)\b/)||[])[1]||String(new Date().getUTCFullYear());
  let m=text.match(/(?:2026|2027)?\s*[\/.\-年]\s*(1[0-2]|0?[1-9])\s*[\/.\-月]\s*([0-3]?\d)/);
  if(!m) m=text.match(/\b(1[0-2]|0?[1-9])[\/.\-]([0-3]?\d)\b/);
  if(!m) return null;
  const mm=String(+m[1]).padStart(2,'0'), dd=String(+m[2]).padStart(2,'0');
  return `${year}-${mm}-${dd}T19:00:00+08:00`;
}
function inferVenue(text){
  const known=['台北大巨蛋','台北小巨蛋','高雄國家體育場','高雄流行音樂中心 海音館','台北流行音樂中心表演廳','桃園市立體育館','國立體育大學綜合體育館'];
  return known.find(v=>text.includes(v)) || (text.match(VENUE_HINT)||[])[0] || '場館待確認';
}
function slug(s='event'){return clean(s).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g,'-').replace(/^-|-$/g,'').slice(0,64)||'event'}

export async function discoverEventsFromSources(limitPerSource=8,totalLimit=24){
  const tasks=SOURCE_LIST.map(async source=>{
    try{
      const html=await fetchText(source.url,6000);
      const links=extractLinks(html,source.url).filter(x=>EVENT_HINT.test(x.label)||EVENT_HINT.test(x.url)).slice(0,limitPerSource);
      const events=[];
      for(const link of links){
        if(!TAIWAN_HINT.test(link.label) && source.id==='cityline') continue;
        const dateStart=inferDate(link.label); if(!dateStart) continue;
        const title=clean(link.label).slice(0,180);
        events.push({
          id:`auto-${source.id}-${slug(title)}-${dateStart.slice(0,10)}`,
          artist:title.split(/[｜|–—:：]/)[0].trim().slice(0,80), title, dateStart,
          venue:inferVenue(link.label), city:(link.label.match(TAIWAN_HINT)||[])[0]||'台灣',
          ticketing:source.name, sourceUrl:link.url, sourceType:'auto-discovered',
          status:'upcoming', featured:false, stageType:null, prices:[], sections:[], seatMapImage:null,
          discovery:{automatic:true,sourceId:source.id,discoveredAt:new Date().toISOString()}
        });
      }
      return {events,audit:{id:source.id,name:source.name,url:source.url,kind:source.kind,ok:true,candidates:links.length,accepted:events.length}};
    }catch(err){
      return {events:[],audit:{id:source.id,name:source.name,url:source.url,kind:source.kind,ok:false,error:String(err?.message||err),candidates:0,accepted:0}};
    }
  });
  const rows=await Promise.all(tasks);
  const discovered=rows.flatMap(x=>x.events).slice(0,totalLimit);
  return {events:mergeAndSort(discovered),audits:rows.map(x=>x.audit)};
}


function inferTopologyFromSignals(seed, good, seatImages, prices){
  const text=good.map(x=>x.text||'').join(' ');
  const stageType=seed.stageType || good.map(x=>x.stageType).find(x=>x&&x!=='unknown') || 'end';
  const center=stageType.startsWith('center');
  const extended=stageType.includes('extended');
  const hasRunway=extended || /(花道|延伸舞台|延伸台|runway|extended\s*stage)/i.test(text);
  const hasBStage=/(副舞台|b\s*stage|second(?:ary)?\s*stage)/i.test(text) || (extended && center);
  const hasPA=/(控台|PA區|FOH|front\s*of\s*house|mix(?:ing)?\s*position)/i.test(text);
  const hasSideScreens=/(側螢幕|側屏|side\s*screen)/i.test(text);
  const confidence=Math.min(0.98,0.35+(seatImages.length?0.35:0)+(prices.length?0.12:0)+(good.length?0.08:0)+(seed.sections?.length?0.08:0));
  return {
    schema:1, source:'signal-derived', confidence:Number(confidence.toFixed(2)),
    stage:{type:stageType,main:{width:center?20:34,depth:center?18:16,height:1.4},runway:hasRunway?{width:7,length:center?34:32}:null,bStage:hasBStage?{shape:'circle',radius:8}:null},
    screens:{main:!center,side:hasSideScreens},
    obstructions:{pa:hasPA,restrictedView:good.some(x=>x.obstructed)||(seed.sections||[]).some(x=>x.obstructed)},
    zones:(seed.sections||[]).map((x,i)=>({id:`zone-${i+1}`,name:x.name,price:x.price||null,level:x.level||1,angle:x.angle||0,distance:x.distance||42,obstructed:!!x.obstructed}))
  };
}



function normalizeSectionName(name=''){
  return clean(name)
    .replace(/^(票價|座位|票區|區域)[:：\s]*/,'')
    .replace(/\s+/g,' ')
    .slice(0,40);
}
function sectionLevelFromName(name=''){
  const n=String(name).toLowerCase();
  const floor=n.match(/(?:^|\D)([1-5])\s*(?:f|樓)/i);
  if(floor) return Math.max(1,Math.min(5,+floor[1]));
  const colorNum=n.match(/[紅黃紫藍綠橘橙灰白黑]\s*([1-5])/);
  if(colorNum) return Math.max(1,Math.min(5,+colorNum[1]));
  if(/上層|upper/.test(n)) return 3;
  if(/二樓|2f|middle/.test(n)) return 2;
  if(/三樓|3f/.test(n)) return 3;
  return 1;
}
function sectionPricePairsFromText(text=''){
  const found=[];
  // Conservative ticket-zone labels only. Avoid matching arbitrary prose.
  const patterns=[
    /((?:VIP\s*)?[A-Z]{1,3}(?:\s*[-–]\s*[A-Z0-9]{1,3})?\s*區|[A-Z]{1,3}\s*區|[紅黃紫藍綠橘橙灰白黑]\s*\d{1,2}(?:\s*區)?|(?:[1-5]\s*(?:F|樓)\s*)?[A-Z0-9一二三四五六七八九十]+(?:區|席)|(?:一|二|三|四|五)樓(?:中段|後段|前段|側段)?)[^0-9]{0,24}(?:NTD|NT\$|NT\s*\$|票價[:：]?\s*)?\s*([0-9][0-9,]{2,5})/gi,
    /((?:VIP\s*)?[A-Z]{1,3}(?:\s*[-–]\s*[A-Z0-9]{1,3})?\s*區|[紅黃紫藍綠橘橙灰白黑]\s*\d{1,2}(?:\s*區)?)[\s:：\-–]*(?:\$|NT\$)?\s*([0-9][0-9,]{2,5})/gi
  ];
  for(const rx of patterns){
    for(const m of text.matchAll(rx)){
      const name=normalizeSectionName(m[1]);
      const price=Number(String(m[2]).replace(/,/g,''));
      if(!name || price<500 || price>30000) continue;
      found.push({name,price});
    }
  }
  const dedup=new Map();
  for(const x of found) dedup.set(`${x.name}|${x.price}`,x);
  return [...dedup.values()].slice(0,40);
}
export function inferSectionsFromSignals(seed, good, prices, stageType, seatMapImage){
  if(Array.isArray(seed.sections)&&seed.sections.length){
    return {
      status:'curated',
      confidence:1,
      source:'seed-curated',
      sections:seed.sections.map((x,i)=>({...x,mappingConfidence:x.mappingConfidence||'calibrated',mappingSource:'curated'}))
    };
  }
  const text=good.map(x=>x.text||'').join(' ');
  const pairs=sectionPricePairsFromText(text);
  if(!pairs.length){
    return {status:seatMapImage?'seatmap-unmapped':'baseline',confidence:0,source:'none',sections:[]};
  }
  const count=pairs.length;
  const center=String(stageType||'').startsWith('center');
  const maxArc=center?155:118;
  const minArc=-maxArc;
  const conf=Math.min(.88,(seatMapImage?.length?0.42:0.18)+Math.min(.30,count*.045)+(prices.length?0.08:0));
  const sections=pairs.map((p,i)=>{
    const t=count===1?.5:i/(count-1);
    const angle=minArc+(maxArc-minArc)*t;
    const level=sectionLevelFromName(p.name);
    const priceRank=Math.max(0,prices.indexOf(p.price));
    const distance=(center?26:34)+level*7+priceRank*2.5;
    return {
      name:p.name,price:p.price,level,
      angle:Number(angle.toFixed(1)),
      distance:Number(distance.toFixed(1)),
      obstructed:false,
      mappingConfidence:seatMapImage&&count>=3?'estimated':'estimated',
      mappingSource:'ticket-page-text'
    };
  });
  return {
    status:seatMapImage&&count>=3?'mapped-estimated':'partial',
    confidence:Number(conf.toFixed(2)),
    source:'ticket-page-text',
    sections
  };
}


function buildSceneSpec(seed, stageType, seatMapImage, prices, obstructed, sectionMapping){
  const sourceSections=(sectionMapping?.sections?.length?sectionMapping.sections:(seed.sections||[]));
  const sections=sourceSections.map((x,i)=>({
    id:`section-${i}`,name:x.name||`票區 ${i+1}`,price:x.price||null,level:x.level||1,
    angle:Number.isFinite(+x.angle)?+x.angle:0,distance:Number.isFinite(+x.distance)?+x.distance:42,
    obstructed:!!x.obstructed,
    mappingConfidence:x.mappingConfidence||((seed.sections||[]).length?'calibrated':'estimated'),
    mappingSource:x.mappingSource||((seed.sections||[]).length?'curated':'unknown')
  }));
  const center=String(stageType).startsWith('center');
  const extended=String(stageType).includes('extended');
  const geometry={
    layout:center?'center':'end',
    mainStage:center?{shape:'octagon',width:20,depth:20,z:0}:{shape:'rect',width:34,depth:16,z:-35},
    runway:extended?{enabled:true,width:center?8:7,length:center?30:34,z:center?-19:-13}:null,
    satellite:extended?{enabled:true,shape:'circle',radius:8,z:center?-34:5}:null,
    screen:center?{enabled:false}:{enabled:true,width:27,height:12,z:-42.8},
    rig:{enabled:true,count:center?10:8},
    sections
  };
  const evidence=[];
  if(seatMapImage)evidence.push('seat-map-image');
  if(prices.length)evidence.push('ticket-prices');
  if(seed.stageType)evidence.push('curated-stage-type');
  if((seed.sections||[]).length)evidence.push('curated-section-geometry');
  else if(sectionMapping?.sections?.length)evidence.push('auto-section-mapping');
  if(obstructed)evidence.push('restricted-view-signal');
  const sectionScore=(seed.sections||[]).length?25:(sectionMapping?.status==='mapped-estimated'?18:sectionMapping?.sections?.length?8:0);
  const stageEvidence=stageType&&stageType!=='unknown';
  const score=Math.min(100,(seatMapImage?35:0)+(prices.length?15:0)+(stageEvidence?20:0)+sectionScore+(obstructed?5:0));
  const status=score>=80&&seatMapImage?'ready':score>=55?'review':'baseline';
  return {schema:'neul.autoscene.v2',status,confidence:score,evidence,geometry,sectionMappingStatus:sectionMapping?.status||'none',
    generatedAt:new Date().toISOString(),
    guard: seatMapImage ? 'seat-map-present' : 'no-seat-map-no-custom-claim'};
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
  const topology=inferTopologyFromSignals({...seed,stageType},good,seatImages,prices);
  const sectionMapping=inferSectionsFromSignals(seed,good,prices,stageType,seatMapImage);
  const sceneSpec=buildSceneSpec(seed,stageType,seatMapImage,prices,obstructed,sectionMapping);
  const topologyHash=sha(JSON.stringify(topology));
  const seatMapHash = sha(`${seatMapImage||'none'}|${seatImages.join('|')}|${prices.join(',')}|${stageType}|${obstructed}|${topologyHash}`);
  return {
    ...seed,
    prices,
    stageType,
    seatMapImage,
    seatMapCandidates:seatImages.slice(0,6),
    seatMapHash,
    sceneVersion:seatMapHash.slice(0,12),
    sceneSpec,
    sectionMapping,
    sceneTopology:topology,
    topologyHash:topologyHash.slice(0,16),
    sourceChecks:snapshots.map(x=>({url:x.url,ok:x.ok,error:x.error||null,seatMapCount:x.seatImages?.length||0,priceCount:x.prices?.length||0})),
    automation:{detailFetched:good.length>0,seatMapCaptured:!!seatMapImage,priceCaptured:prices.length>0,sectionMapped:sectionMapping.sections.length>0,sceneRebuildKey:seatMapHash,
      sceneReady:sceneSpec.status==='ready',sceneMode:seatMapImage?(sectionMapping.sections.length?'seatmap-section-assisted':'seatmap-unmapped'):'venue-fallback',sceneConfidence:sceneSpec.confidence,sectionConfidence:sectionMapping.confidence,topologyConfidence:topology.confidence,lastCheckedAt:new Date().toISOString()},
    verification:{
      status:!seatMapImage?'awaiting-seatmap':sectionMapping.status==='seatmap-unmapped'?'seatmap-awaiting-section-map':sectionMapping.status,
      canClaimCustomized:!!seatMapImage && ['curated','mapped-estimated'].includes(sectionMapping.status),
      sourceCount:good.length,
      note:!seatMapImage?'尚未取得座位圖，不標示為已完成客製 3D。':sectionMapping.status==='seatmap-unmapped'?'已取得座位圖，但尚未建立可驗證票區映射，因此仍維持待校正。':sectionMapping.status==='mapped-estimated'?'已取得座位圖並由售票頁票區文字建立自動 Section Mapping；位置仍標示為推估。':'已取得座位圖並套用已校正票區資料。'
    },
    obstructed,
    lifecycle:eventLifecycle(seed)
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
