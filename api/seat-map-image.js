import crypto from 'node:crypto';

const ALLOWED = [
  'static.tixcraft.com','assets.kktix.io','ticketplus.com.tw','www.ticketplus.com.tw',
  'kham.com.tw','www.kham.com.tw','ticket.ibon.com.tw','www.famiticket.com.tw',
  'tickets.udnfunlife.com','ticket.mna.com.tw','ticket.com.tw','www.ticket.com.tw'
];

export default async function handler(req,res){
  const raw=String(req.query?.url||'');
  let u;
  try{u=new URL(raw);}catch{return res.status(400).json({error:'invalid url'});}
  if(u.protocol!=='https:' || !ALLOWED.some(h=>u.hostname===h || u.hostname.endsWith('.'+h))){
    return res.status(403).json({error:'seat map host not allowed'});
  }
  try{
    const r=await fetch(u.href,{headers:{'user-agent':'Mozilla/5.0 (compatible; NEUL/0.41 seat-map-sync)','accept':'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'},redirect:'follow',signal:AbortSignal.timeout(6500)});
    if(!r.ok) throw new Error(`HTTP ${r.status}`);
    const type=(r.headers.get('content-type')||'application/octet-stream').split(';')[0];
    if(!/^image\//i.test(type)) return res.status(415).json({error:'not an image'});
    const ab=await r.arrayBuffer();
    if(ab.byteLength>8_000_000) return res.status(413).json({error:'image too large'});
    const buf=Buffer.from(ab); const hash=crypto.createHash('sha256').update(buf).digest('hex');
    res.setHeader('Content-Type',type); res.setHeader('Cache-Control','s-maxage=21600, stale-while-revalidate=86400');
    res.setHeader('X-NEUL-SeatMap-Hash',hash); res.setHeader('Access-Control-Expose-Headers','X-NEUL-SeatMap-Hash');
    return res.status(200).send(buf);
  }catch(err){return res.status(502).json({error:'seat map unavailable',message:err.message});}
}
