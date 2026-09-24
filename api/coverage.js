export default async function handler(req,res){
  res.setHeader("Cache-Control","public, s-maxage=21600, stale-while-revalidate=86400");
  try{
    const host=req.headers.host; const proto=host?.includes("localhost")?"http":"https";
    const r=await fetch(`${proto}://${host}/api/events`,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(12000)});
    if(!r.ok) throw new Error(`events ${r.status}`);
    const body=await r.json();
    return res.status(200).json({updatedAt:body.updatedAt,nextUpdateAt:body.nextUpdateAt,upstream:body.upstream,count:body.count,coverage:body.coverage,coverageAudit:body.coverageAudit,sourceHealth:body.discovery?.sourceHealth||[],autoUpdateError:body.autoUpdateError||null});
  }catch(error){return res.status(500).json({ok:false,error:error.message});}
}
