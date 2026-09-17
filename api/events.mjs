import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { discoverEventsFromSources, enrichEvent, mergeAndSort, nextTaipeiRefresh, SOURCE_LIST, eventLifecycle } from '../lib/source-engine.mjs';

export default async function handler(req,res){
  if(req.method!=='GET'){ res.statusCode=405; return res.end('Method Not Allowed'); }
  try{
    const dataPath=fileURLToPath(new URL('../data/events.seed.json', import.meta.url));
    const raw=await fs.readFile(dataPath,'utf8');
    const seed=JSON.parse(raw);
    const discovery=await discoverEventsFromSources(8,24);
    const combined=mergeAndSort([...seed,...discovery.events]);
    const concurrency=6;
    const out=[];
    let idx=0;
    async function worker(){
      while(idx<combined.length){ const i=idx++; out[i]=await enrichEvent(combined[i]); }
    }
    await Promise.all(Array.from({length:Math.min(concurrency,combined.length)},()=>worker()));
    const now=new Date();
    const body={
      ok:true,
      generatedAt:now.toISOString(),
      nextRefreshAt:nextTaipeiRefresh(now),
      refreshPolicy:'request-driven-6h-cache',
      backgroundScanPolicy:'daily-hobby-cron',
      events:mergeAndSort(out).map(e=>({...e,lifecycle:eventLifecycle(e)})),
      sources:discovery.audits,
      summary:{upcoming:out.filter(e=>eventLifecycle(e).phase==='upcoming').length,live:out.filter(e=>eventLifecycle(e).phase==='live').length,archive:out.filter(e=>eventLifecycle(e).phase==='archive').length,events:out.length,discovered:discovery.events.length,seatMaps:out.filter(e=>e.automation.seatMapCaptured).length,sectionMapped:out.filter(e=>e.automation.sectionMapped).length,seatMapUnmapped:out.filter(e=>e.automation.sceneMode==='seatmap-unmapped').length,prices:out.filter(e=>e.automation.priceCaptured).length,sourceErrors:out.flatMap(e=>e.sourceChecks).filter(s=>!s.ok).length}
    };
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.setHeader('Cache-Control','public, s-maxage=21600, stale-while-revalidate=3600');
    res.setHeader('CDN-Cache-Control','public, s-maxage=21600, stale-while-revalidate=3600');
    res.setHeader('Vercel-CDN-Cache-Control','public, s-maxage=21600, stale-while-revalidate=3600');
    res.statusCode=200;
    res.end(JSON.stringify(body));
  }catch(err){
    res.statusCode=500;
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.end(JSON.stringify({ok:false,error:String(err?.message||err)}));
  }
}
