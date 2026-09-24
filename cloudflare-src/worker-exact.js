import {seedEvents} from './generated-seed.js';
import {discoverAll,SOURCE_DEFS,fetchCoverageReference,fetchNews,isTrustedImageUrl} from './connectors.js';

const enc=new TextEncoder();
const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=60, s-maxage=3600','access-control-allow-origin':'*',...extra}});
const nowIso=()=>new Date().toISOString();
const twParts=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).reduce((a,x)=>(a[x.type]=x.value,a),{});
const todayTW=()=>{const p=twParts();return `${p.year}-${p.month}-${p.day}`};
const canonical=s=>String(s||'').toLowerCase().normalize('NFKC').replace(/[^a-z0-9\u4e00-\u9fff]/g,'');
const dateKey=e=>String(e.date||e.startDate||e.eventDate||e.sessions?.[0]?.date||'');
const identity=e=>`${canonical(e.artist||e.title)}|${dateKey(e)}|${canonical(e.venue)}`;
function mergeEvents(base, found){
 const m=new Map();
 for(const e of [...base,...found]){
   const k=e.id||identity(e); const old=m.get(k);
   if(!old) m.set(k,e); else m.set(k,{...old,...Object.fromEntries(Object.entries(e).filter(([,v])=>v!==''&&v!=null)),featured:!!(old.featured||e.featured)});
 }
 return [...m.values()].sort((a,b)=>dateKey(a).localeCompare(dateKey(b)));
}
function eventEnded(e){
 const today=todayTW();
 const sessionDates=(e.sessions||[]).map(s=>String(s.date||s.start||'').slice(0,10)).filter(Boolean).sort();
 const last=sessionDates.at(-1)||String(e.endDate||e.date||'').slice(0,10);
 return !!last && last<today;
}
function lifecycle(events,limit=20){
 const active=[],ended=[];
 for(const e of events){(eventEnded(e)?ended:active).push({...e,lifecycle:eventEnded(e)?'archived':'upcoming'});}
 ended.sort((a,b)=>dateKey(b).localeCompare(dateKey(a)));
 return [...active,...ended.slice(0,limit)];
}
function metrics(events,sourceHealth=[],coverageRef={}){
 const active=events.filter(e=>e.lifecycle!=='archived');
 const officialMap=events.filter(e=>e.mapUrl||e.seatMapUrl||e.officialSeatMapUrl).length;
 const verified3d=events.filter(e=>e.threeDOfficialVerified||e.custom3D?.officialMapVerified).length;
 return {
  completenessGuaranteed:false,total:events.length,upcoming:active.length,archived:events.length-active.length,
  officialMap,event3d:events.filter(e=>e.layoutId||e.custom3D?.layoutId).length,threeDOfficialVerified:verified3d,
  healthySources:sourceHealth.filter(s=>s.ok).length,totalSources:SOURCE_DEFS.length,
  coverageReferenceCount:Number(coverageRef.advertised||0),coverageReferenceParsedCount:Number(coverageRef.count||0),
  coverageReferenceRatio:coverageRef.advertised?Number((coverageRef.count/coverageRef.advertised).toFixed(3)):0,
  coverageReferenceComplete:!!coverageRef.advertised && coverageRef.count>=coverageRef.advertised*0.9
 };
}
async function getSnapshot(env){
 if(env.CACHE){const s=await env.CACHE.get('neul:events','json'); if(s?.events?.length) return s;}
 const events=lifecycle(seedEvents,Number(env.ARCHIVE_LIMIT||20));
 return {events,updatedAt:null,fallback:true,sourceHealth:[],coverage:metrics(events,[],{}),coverageAudit:{coverageGaps:[],needsTicketBackfill:[]},discovery:{sourceHealth:[],coverageGaps:[],needsTicketBackfill:[]}};
}
async function sync(env){
 const previous=await getSnapshot(env);
 const [sources,ref,news]=await Promise.all([discoverAll({timeoutMs:Number(env.SOURCE_TIMEOUT_MS||6500)}),fetchCoverageReference({timeoutMs:Number(env.SOURCE_TIMEOUT_MS||6500)}),fetchNews({timeoutMs:Number(env.SOURCE_TIMEOUT_MS||6500)})]);
 const found=[...sources.flatMap(s=>s.events||[]),...(ref.events||[])];
 const events=lifecycle(mergeEvents(seedEvents,found),Number(env.ARCHIVE_LIMIT||20));
 const gaps=(ref.events||[]).filter(r=>!sources.some(s=>(s.events||[]).some(e=>identity(e)===identity(r)))).slice(0,120);
 const needsTicketBackfill=gaps.map(e=>({...e,needsTicketBackfill:true}));
 const sourceHealth=[...sources,ref].map(({events,...x})=>x);
 const coverage=metrics(events,sourceHealth,ref);
 const snap={events,updatedAt:nowIso(),fallback:false,sourceHealth,coverage,coverageAudit:{coverageGaps:gaps,needsTicketBackfill},discovery:{sourceHealth,coverageGaps:gaps,needsTicketBackfill},coverageReferenceCount:coverage.coverageReferenceCount,coverageReferenceParsedCount:coverage.coverageReferenceParsedCount,coverageReferenceRatio:coverage.coverageReferenceRatio,coverageReferenceComplete:coverage.coverageReferenceComplete};
 if(env.CACHE){
  await Promise.all([
   env.CACHE.put('neul:events',JSON.stringify(snap),{expirationTtl:60*60*24*14}),
   env.CACHE.put('neul:news',JSON.stringify({news,updatedAt:snap.updatedAt}),{expirationTtl:60*60*24*14}),
   env.CACHE.put('neul:last-success',snap.updatedAt)
  ]);
 }
 return {...snap,previousUpdatedAt:previous.updatedAt};
}
function auth(req,env){return !!env.ADMIN_TOKEN && req.headers.get('authorization')===`Bearer ${env.ADMIN_TOKEN}`;}
function extractUrls(html,base){
 const out=[]; const push=u=>{try{const a=new URL(u,base).toString(); if(!out.includes(a)) out.push(a)}catch{}};
 for(const re of [/\b(?:src|data-src|data-original|href)=["']([^"']+)["']/gi,/url\(["']?([^"')]+)["']?\)/gi,/["'](https?:\\?\/\\?\/[^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/gi]){let m;while((m=re.exec(html))&&out.length<180) push(m[1].replace(/\\\//g,'/'));}
 return out;
}
function scoreImage(u,context=''){
 const s=(u+' '+context).toLowerCase(); let n=0;
 if(/seat|seating|field|venue|map|layout|ticketmap|座位|票區|場域圖|場地圖|位置圖/.test(s)) n+=8;
 if(/logo|icon|avatar|banner|hero|og-image|favicon/.test(s)) n-=5;
 if(/static\.tixcraft|assets\.kktix|networksites\.livenationinternational/.test(s)) n+=3;
 return n;
}
async function fetchWithTimeout(url,timeout=7000,headers={}){const ac=new AbortController();const t=setTimeout(()=>ac.abort(),timeout);try{return await fetch(url,{signal:ac.signal,redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; NEUL/1.1; seat-map resolver)','accept-language':'zh-TW,zh;q=0.9,en;q=0.7',...headers}})}finally{clearTimeout(t)}}
async function resolveSeatMap(start,depth=0,seen=new Set()){
 if(depth>2||seen.has(start)) return null; seen.add(start);
 if(!/^https?:/i.test(start)) return null;
 let res; try{res=await fetchWithTimeout(start)}catch{return null}
 if(!res.ok) return null;
 const ct=(res.headers.get('content-type')||'').toLowerCase();
 if(ct.startsWith('image/')) return {response:res,url:res.url||start};
 if(!ct.includes('html')&&!ct.includes('json')&&!ct.includes('text')) return null;
 const html=await res.text();
 const candidates=extractUrls(html,res.url||start).filter(isTrustedImageUrl).sort((a,b)=>scoreImage(b,html.slice(0,5000))-scoreImage(a,html.slice(0,5000)));
 for(const u of candidates.slice(0,20)){
  try{const r=await fetchWithTimeout(u,6000,(/livenation/i.test(u)?{'referer':start}:{})); const c=(r.headers.get('content-type')||'').toLowerCase(); if(r.ok&&c.startsWith('image/')) return {response:r,url:r.url||u};}catch{}
 }
 const links=extractUrls(html,res.url||start).filter(u=>/^https?:/.test(u)&&/(activity|event|ticket|detail|concert|show)/i.test(u)).slice(0,12);
 for(const u of links){const r=await resolveSeatMap(u,depth+1,seen);if(r)return r;}
 return null;
}
async function seatMap(req,env){
 const u=new URL(req.url); const target=u.searchParams.get('url')||u.searchParams.get('src')||u.searchParams.get('page')||'';
 if(!target) return json({error:'missing_url'},400);
 const cacheKey='seatmap:'+await crypto.subtle.digest('SHA-256',enc.encode(target)).then(b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''));
 if(env.CACHE){const c=await env.CACHE.get(cacheKey,'json'); if(c?.url){try{const r=await fetchWithTimeout(c.url,5500);if(r.ok&&(r.headers.get('content-type')||'').startsWith('image/')) return new Response(r.body,{headers:{'content-type':r.headers.get('content-type'),'cache-control':'public,max-age=21600,s-maxage=86400','x-neul-resolved-url':c.url}})}catch{}}}
 const found=await resolveSeatMap(target);
 if(!found) return json({error:'seat_map_not_found',source:target},404,{'cache-control':'public,max-age=300'});
 if(env.CACHE) await env.CACHE.put(cacheKey,JSON.stringify({url:found.url,at:nowIso()}),{expirationTtl:86400*7});
 return new Response(found.response.body,{headers:{'content-type':found.response.headers.get('content-type')||'image/jpeg','cache-control':'public,max-age=21600,s-maxage=86400','access-control-allow-origin':'*','x-neul-resolved-url':found.url}});
}
async function api(req,env){
 const u=new URL(req.url),p=u.pathname;
 if(p==='/api/events'){
  const s=await getSnapshot(env); const includeArchive=u.searchParams.get('archive')!=='0';
  return json({...s,events:includeArchive?s.events:s.events.filter(e=>e.lifecycle!=='archived')});
 }
 if(p==='/api/coverage'){const s=await getSnapshot(env);return json({coverage:s.coverage,coverageAudit:s.coverageAudit,discovery:s.discovery,sourceHealth:s.sourceHealth,updatedAt:s.updatedAt,fallback:s.fallback});}
 if(p==='/api/news'){const n=env.CACHE?await env.CACHE.get('neul:news','json'):null;return json(n||{news:{kr:[],tw:[],west:[],jp:[]},updatedAt:null,fallback:true});}
 if(p==='/api/official'){const s=await getSnapshot(env);return json({events:s.events.filter(e=>e.lifecycle!=='archived'),updatedAt:s.updatedAt,sourceHealth:s.sourceHealth,fallback:s.fallback});}
 if(p==='/api/seat-map-image') return seatMap(req,env);
 if(p==='/api/refresh'){
  if(req.method!=='POST'&&req.method!=='GET') return json({error:'method_not_allowed'},405);
  if(env.ADMIN_TOKEN && !auth(req,env)) return json({error:'unauthorized'},401,{'cache-control':'no-store'});
  const s=await sync(env);return json({ok:true,updatedAt:s.updatedAt,coverage:s.coverage,coverageAudit:s.coverageAudit,sourceHealth:s.sourceHealth},200,{'cache-control':'no-store'});
 }
 if(p==='/api/health'){const s=await getSnapshot(env);return json({ok:true,app:'NEUL',version:env.APP_VERSION||'1.1.0-exact-ui',runtime:'cloudflare-workers',dataUpdatedAt:s.updatedAt,fallback:s.fallback,coverage:s.coverage,bindings:{assets:!!env.ASSETS,kv:!!env.CACHE}});}
 return json({error:'not_found'},404);
}
export default {async fetch(req,env){const u=new URL(req.url);if(u.pathname.startsWith('/api/'))return api(req,env);return env.ASSETS.fetch(req)},async scheduled(_c,env,ctx){ctx.waitUntil(sync(env))}};
