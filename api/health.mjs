export default function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.statusCode=200;
  res.end(JSON.stringify({
    ok:true,app:'NEUL',build:'0.53',runtime:'node',time:new Date().toISOString(),
    automation:{
      eventRefresh:'6h request-driven CDN revalidation',
      backgroundScan:'daily Vercel Hobby cron',
      sceneGeneration:'automatic from latest event/seat-map/section mapping data'
    }
  }));
}
