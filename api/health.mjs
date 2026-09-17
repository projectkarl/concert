export default function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.statusCode=200;
  res.end(JSON.stringify({ok:true,app:'NEUL',build:'v0.40-auto3d',runtime:'node',time:new Date().toISOString(),automation:{eventRefresh:'6h request-driven CDN revalidation',backgroundScan:'daily Vercel Hobby cron',sceneGeneration:'seat-map + price + section mapping + Vision/OCR'}}));
}
