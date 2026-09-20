const allowed=new Set(['tixcraft.com','www.tixcraft.com','ticket.mna.com.tw','static.tixcraft.com']);
export const config={maxDuration:20};
export default async function handler(req,res){
  let worker;
  try{
    const url=String(req.query?.url||''); const u=new URL(url); if(u.protocol!=='https:'||!allowed.has(u.hostname))throw new Error('image URL not allowed');
    const r=await fetch(url,{headers:{'user-agent':'Mozilla/5.0'}}); if(!r.ok)throw new Error(`image HTTP ${r.status}`); const buf=Buffer.from(await r.arrayBuffer()); if(buf.length>6_000_000)throw new Error('image too large');
    const {createWorker}=await import('tesseract.js'); worker=await createWorker('eng'); const ret=await worker.recognize(buf); const text=ret.data.text||'';
    const tokens=[...new Set((text.match(/\b(?:ZONE\s*)?[A-Z]{1,2}\s*\d{0,2}(?:-\d+)?\b/gi)||[]).map(s=>s.replace(/\s+/g,' ').trim()))].slice(0,80);
    res.setHeader('Cache-Control','s-maxage=604800, stale-while-revalidate=2592000');res.status(200).json({ok:true,text:text.slice(0,12000),sectionTokens:tokens,confidence:ret.data.confidence||0});
  }catch(err){res.status(400).json({ok:false,error:String(err?.message||err)})}finally{if(worker)await worker.terminate().catch(()=>{})}
}
