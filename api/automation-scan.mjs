import {discoverEventsFromSources,enrichEvent,mergeAndSort,SOURCE_LIST} from '../lib/source-engine.mjs';
export default async function handler(req,res){
  if(req.method!=='GET'){res.statusCode=405;return res.end('Method Not Allowed');}
  const started=Date.now();
  try{
    const discovery=await discoverEventsFromSources(6,18);
    const sample=discovery.events.slice(0,12);
    const enriched=[];
    let idx=0;
    async function worker(){while(idx<sample.length){const i=idx++;enriched[i]=await enrichEvent(sample[i]);}}
    await Promise.all(Array.from({length:Math.min(6,sample.length)},()=>worker()));
    const body={
      ok:true,mode:'daily-background-source-scan',generatedAt:new Date().toISOString(),
      durationMs:Date.now()-started,sources:discovery.audits,
      summary:{
        configuredSources:SOURCE_LIST.length,discovered:discovery.events.length,enriched:enriched.length,
        seatMaps:enriched.filter(e=>e.automation?.seatMapCaptured).length,
        sectionMapped:enriched.filter(e=>e.automation?.sectionMapped).length,
        sceneReady:enriched.filter(e=>e.automation?.sceneReady).length,
        sourceFailures:discovery.audits.filter(x=>!x.ok).length
      }
    };
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.setHeader('Cache-Control','no-store');
    res.statusCode=200;res.end(JSON.stringify(body));
  }catch(err){
    res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
    res.statusCode=500;res.end(JSON.stringify({ok:false,error:String(err?.message||err),durationMs:Date.now()-started}));
  }
}
