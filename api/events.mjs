import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { enrichEvent, mergeAndSort, nextTaipeiRefresh, SOURCE_LIST } from '../lib/source-engine.mjs';

export default async function handler(req,res){
  if(req.method!=='GET'){ res.statusCode=405; return res.end('Method Not Allowed'); }
  try{
    const dataPath=fileURLToPath(new URL('../data/events.seed.json', import.meta.url));
    const raw=await fs.readFile(dataPath,'utf8');
    const seed=JSON.parse(raw);
    const concurrency=3;
    const out=[];
    let idx=0;
    async function worker(){
      while(idx<seed.length){ const i=idx++; out[i]=await enrichEvent(seed[i]); }
    }
    await Promise.all(Array.from({length:Math.min(concurrency,seed.length)},()=>worker()));
    const now=new Date();
    const body={
      ok:true,
      generatedAt:now.toISOString(),
      nextRefreshAt:nextTaipeiRefresh(now),
      refreshPolicy:'6h-edge-cache',
      events:mergeAndSort(out),
      sources:SOURCE_LIST,
      summary:{events:out.length,seatMaps:out.filter(e=>e.automation.seatMapCaptured).length,prices:out.filter(e=>e.automation.priceCaptured).length,sourceErrors:out.flatMap(e=>e.sourceChecks).filter(s=>!s.ok).length}
    };
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.setHeader('Cache-Control','public, s-maxage=21600, stale-while-revalidate=3600');
    res.setHeader('CDN-Cache-Control','public, s-maxage=21600, stale-while-revalidate=3600');
    res.statusCode=200;
    res.end(JSON.stringify(body));
  }catch(err){
    res.statusCode=500;
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.end(JSON.stringify({ok:false,error:String(err?.message||err)}));
  }
}
