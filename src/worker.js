import {seedEvents, venueCatalog} from './seed.js';
import {discoverAll,isTrustedImageUrl,SOURCE_DEFS,fetchCoverageReference,fetchNews} from './connectors.js';

const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=30, s-maxage=300','access-control-allow-origin':'*',...extra}});
const nowIso=()=>new Date().toISOString();
const todayTW=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const canonical=s=>(s||'').toLowerCase().normalize('NFKC').replace(/[^a-z0-9\u4e00-\u9fff]/g,'');
function mergeEvents(base,found){
  const map=new Map();
  for(const e of [...base,...found]){
    const key=e.id||`${canonical(e.title)}-${e.date||''}`;
    const old=map.get(key);
    if(!old) map.set(key,e);
    else map.set(key,{...old,...Object.fromEntries(Object.entries(e).filter(([,v])=>v!==''&&v!=null)),featured:old.featured||e.featured});
  }
  return [...map.values()].sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'));
}
function lifecycle(events){
  const today=todayTW();
  return events.map(e=>({...e,lifecycle:e.date && e.date<today?'archived':'upcoming'}));
}
function coverage(events,sources=[]){
  const upcoming=events.filter(e=>e.lifecycle!=='archived');
  return {total:events.length,upcoming:upcoming.length,archived:events.length-upcoming.length,officialMap:events.filter(e=>!!e.mapUrl).length,event3d:events.filter(e=>!!e.layoutId).length,priceKnown:events.filter(e=>e.price&&e.price!=='TBA').length,needsReview:events.filter(e=>!e.mapUrl||!e.date||e.venue==='待官方資料回補').length,healthySources:sources.filter(s=>s.ok).length,totalSources:SOURCE_DEFS.length,coverageReferenceAdvertised:Number(sources.find(s=>s.id==='coverage-reference')?.advertised||0),coverageReferenceParsed:Number(sources.find(s=>s.id==='coverage-reference')?.count||0)};
}
async function getSnapshot(env){
  if(env.CACHE){ const raw=await env.CACHE.get('snapshot:events','json'); if(raw?.events?.length) return raw; }
  const events=lifecycle(seedEvents);
  return {events,sourceHealth:[],updatedAt:null,coverage:coverage(events,[]),fallback:true};
}
async function runSync(env){
  const previous=await getSnapshot(env);
  const [officialSources,coverageRef,news]=await Promise.all([discoverAll({timeoutMs:Number(env.SOURCE_TIMEOUT_MS||6500)}),fetchCoverageReference({timeoutMs:Number(env.SOURCE_TIMEOUT_MS||6500)}),fetchNews({timeoutMs:Number(env.SOURCE_TIMEOUT_MS||6500)})]);
  const sourceHealth=[...officialSources,coverageRef];
  const found=[...officialSources.flatMap(s=>s.events||[]),...(coverageRef.events||[])].filter(e=>e.date || /2026|2027/.test(e.title));
  let events=mergeEvents(seedEvents,found);
  events=lifecycle(events);
  const archiveLimit=Number(env.ARCHIVE_LIMIT||20);
  const active=events.filter(e=>e.lifecycle==='upcoming');
  const archived=events.filter(e=>e.lifecycle==='archived').sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,archiveLimit);
  const snap={events:[...active,...archived],sourceHealth:sourceHealth.map(({events,...s})=>s),updatedAt:nowIso(),coverage:coverage(events,sourceHealth),fallback:false};
  if(env.CACHE){ await env.CACHE.put('snapshot:events',JSON.stringify(snap),{expirationTtl:60*60*24*14}); await env.CACHE.put('snapshot:news',JSON.stringify({news,updatedAt:snap.updatedAt}),{expirationTtl:60*60*24*14}); await env.CACHE.put('snapshot:last-success',snap.updatedAt); }
  return {...snap,previousUpdatedAt:previous.updatedAt};
}
function authOk(req,env){const token=env.ADMIN_TOKEN;if(!token)return false;return req.headers.get('authorization')===`Bearer ${token}`;}
async function proxyImage(req){
  const u=new URL(req.url); const target=u.searchParams.get('url')||'';
  if(!isTrustedImageUrl(target)) return json({error:'untrusted_image_host'},400);
  try{
    const res=await fetch(target,{headers:{'user-agent':'Mozilla/5.0 NEUL-seatmap/1.0','accept':'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'}});
    if(!res.ok) return json({error:'upstream_image_error',status:res.status},502);
    const ct=res.headers.get('content-type')||''; if(!ct.startsWith('image/')) return json({error:'not_an_image'},415);
    return new Response(res.body,{headers:{'content-type':ct,'cache-control':'public,max-age=21600,s-maxage=86400','access-control-allow-origin':'*'}});
  }catch(e){return json({error:'image_fetch_failed',detail:String(e?.message||e)},502)}
}
async function api(req,env){
  const url=new URL(req.url); const p=url.pathname;
  if(p==='/api/events'){
    const s=await getSnapshot(env); const includeArchive=url.searchParams.get('archive')==='1';
    return json({...s,events:s.events.filter(e=>includeArchive||e.lifecycle!=='archived')});
  }
  if(p==='/api/venues') return json({venues:venueCatalog,updatedAt:nowIso()});
  if(p==='/api/news'){ const n=env.CACHE?await env.CACHE.get('snapshot:news','json'):null; return json(n||{news:{kr:[],tw:[],west:[],jp:[]},updatedAt:null,fallback:true}); }
  if(p==='/api/coverage'){const s=await getSnapshot(env);return json({coverage:s.coverage,sourceHealth:s.sourceHealth,updatedAt:s.updatedAt,fallback:s.fallback});}
  if(p==='/api/health'){
    const s=await getSnapshot(env); return json({ok:true,app:'NEUL',version:env.APP_VERSION||'1.0.0-cf',runtime:'cloudflare-workers',time:nowIso(),timezone:'Asia/Taipei',cron:'17 */6 * * * (UTC)',dataUpdatedAt:s.updatedAt,fallback:s.fallback,coverage:s.coverage,bindings:{assets:!!env.ASSETS,kv:!!env.CACHE}});
  }
  if(p==='/api/seat-map-image') return proxyImage(req);
  if(p==='/api/refresh' && req.method==='POST'){
    if(!authOk(req,env)) return json({error:'unauthorized'},401,{'cache-control':'no-store'});
    const result=await runSync(env); return json({ok:true,updatedAt:result.updatedAt,coverage:result.coverage,sourceHealth:result.sourceHealth},200,{'cache-control':'no-store'});
  }
  return json({error:'not_found'},404);
}
export default {
  async fetch(req,env){
    const u=new URL(req.url);
    if(u.pathname.startsWith('/api/')) return api(req,env);
    return env.ASSETS.fetch(req);
  },
  async scheduled(controller,env,ctx){
    ctx.waitUntil(runSync(env));
  }
};
export {mergeEvents,lifecycle,coverage};
