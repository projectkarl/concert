const ALLOWED=['tixcraft.com','kktix.com','kktix.cc','livenation.com.tw','ticket.ibon.com.tw','ticketplus.com.tw','cityline.com'];
export default async function handler(req,res){
  try{
    const raw=String(req.query?.url||''); if(!raw)return res.status(400).json({error:'missing url'});
    const u=new URL(raw); if(u.protocol!=='https:')return res.status(400).json({error:'https only'});
    const ok=ALLOWED.some(d=>u.hostname===d||u.hostname.endsWith('.'+d)); if(!ok)return res.status(403).json({error:'source not allowed'});
    const r=await fetch(u,{headers:{'user-agent':'NEUL/0.51 SeatMapVision'}}); if(!r.ok)throw new Error(`upstream ${r.status}`);
    const type=r.headers.get('content-type')||''; if(!type.startsWith('image/'))return res.status(415).json({error:'not image'});
    const buf=Buffer.from(await r.arrayBuffer()); if(buf.length>6_000_000)return res.status(413).json({error:'image too large'});
    res.setHeader('Content-Type',type); res.setHeader('Cache-Control','public, s-maxage=21600, stale-while-revalidate=86400');
    return res.status(200).send(buf);
  }catch(e){return res.status(502).json({error:String(e?.message||e)})}
}
