import crypto from 'node:crypto';
import { extractOfficialSeatLayoutUrl } from '../lib/official-monitor.js';

const ALLOWED = [
  'tixcraft.com','static.tixcraft.com','kktix.com','kktix.cc','assets.kktix.io','ticketplus.com.tw','www.ticketplus.com.tw',
  'kham.com.tw','www.kham.com.tw','ticket.ibon.com.tw','www.famiticket.com.tw','famiticket.com.tw',
  'tickets.udnfunlife.com','ticket.mna.com.tw','ticket.com.tw','www.ticket.com.tw','opentix.life','www.opentix.life','tixfun.com','www.tixfun.com','go.fansi.me','tickets.books.com.tw','indievox.com','www.indievox.com'
];
function allowed(u){return u.protocol==='https:'&&ALLOWED.some(h=>u.hostname===h||u.hostname.endsWith('.'+h));}
async function fetchOfficial(u,accept){return fetch(u.href,{headers:{'user-agent':'Mozilla/5.0 (compatible; NEUL/0.40 auto-seat-map)','accept':accept,'accept-language':'zh-TW,zh;q=0.9,en;q=0.7'},redirect:'follow',signal:AbortSignal.timeout(7000)});}
export default async function handler(req,res){
  const raw=String(req.query?.url||'');let u;try{u=new URL(raw);}catch{return res.status(400).json({error:'invalid url'});}if(!allowed(u))return res.status(403).json({error:'seat map host not allowed'});
  try{
    let resolved=u.href;let r=await fetchOfficial(u,'image/avif,image/webp,image/apng,image/svg+xml,image/*,text/html;q=0.8,*/*;q=0.5');if(!r.ok)throw new Error(`HTTP ${r.status}`);
    let type=(r.headers.get('content-type')||'application/octet-stream').split(';')[0].toLowerCase();
    if(/text\/html|application\/xhtml\+xml/.test(type)){
      const html=await r.text();const candidate=extractOfficialSeatLayoutUrl(html,u.href);if(!candidate) return res.status(404).json({error:'official seat map not found on source page'});
      const imgUrl=new URL(candidate);if(!allowed(imgUrl)) return res.status(403).json({error:'resolved seat map host not allowed'});
      r=await fetchOfficial(imgUrl,'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8');if(!r.ok)throw new Error(`seat-map HTTP ${r.status}`);type=(r.headers.get('content-type')||'application/octet-stream').split(';')[0].toLowerCase();resolved=imgUrl.href;
    }
    if(!/^image\//i.test(type))return res.status(415).json({error:'not an image'});const ab=await r.arrayBuffer();if(ab.byteLength>10_000_000)return res.status(413).json({error:'image too large'});const buf=Buffer.from(ab),hash=crypto.createHash('sha256').update(buf).digest('hex');res.setHeader('Content-Type',type);res.setHeader('Cache-Control','s-maxage=21600, stale-while-revalidate=86400');res.setHeader('X-NEUL-SeatMap-Hash',hash);res.setHeader('X-NEUL-SeatMap-Resolved',resolved);res.setHeader('Access-Control-Expose-Headers','X-NEUL-SeatMap-Hash, X-NEUL-SeatMap-Resolved');return res.status(200).send(buf);
  }catch(err){return res.status(502).json({error:'seat map unavailable',message:err.message});}
}
