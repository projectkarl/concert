import crypto from 'node:crypto';
import { extractOfficialSeatLayoutCandidates, extractOfficialTicketLinks } from '../lib/official-monitor.js';

const ALLOWED = [
  'tixcraft.com','static.tixcraft.com','kktix.com','kktix.cc','assets.kktix.io','ticketplus.com.tw','www.ticketplus.com.tw',
  'kham.com.tw','www.kham.com.tw','ticket.ibon.com.tw','www.famiticket.com.tw','famiticket.com.tw',
  'tickets.udnfunlife.com','ticket.mna.com.tw','ticket.com.tw','www.ticket.com.tw','opentix.life','www.opentix.life','tixfun.com','www.tixfun.com','go.fansi.me','tickets.books.com.tw','indievox.com','www.indievox.com'
];
function allowed(u){return u.protocol==='https:'&&ALLOWED.some(h=>u.hostname===h||u.hostname.endsWith('.'+h));}
async function fetchOfficial(u,accept,fetchImpl=fetch){return fetchImpl(u.href,{headers:{'user-agent':'Mozilla/5.0 (compatible; NEUL/0.40.2-Coverage auto-seat-map)','accept':accept,'accept-language':'zh-TW,zh;q=0.9,en;q=0.7','referer':`${u.protocol}//${u.hostname}/`},redirect:'follow',signal:AbortSignal.timeout(7000)});}
const contentType=r=>(r.headers.get('content-type')||'application/octet-stream').split(';')[0].toLowerCase();

export async function resolveOfficialSeatMap(raw,{fetchImpl=fetch,maxPages=5,maxCandidates=8}={}){
  let start;try{start=new URL(raw);}catch{throw Object.assign(new Error('invalid url'),{status:400});}
  if(!allowed(start))throw Object.assign(new Error('seat map host not allowed'),{status:403});
  const pageQueue=[start.href],seenPages=new Set(),seenImages=new Set();let candidateCount=0,lastError='official seat map not found';
  while(pageQueue.length&&seenPages.size<maxPages){
    const pageUrl=pageQueue.shift();if(seenPages.has(pageUrl))continue;seenPages.add(pageUrl);
    let u=new URL(pageUrl),r;try{r=await fetchOfficial(u,'image/avif,image/webp,image/apng,image/svg+xml,image/*,text/html;q=0.9,*/*;q=0.5',fetchImpl);}catch(err){lastError=err.message;continue;}
    if(!r.ok){lastError=`HTTP ${r.status}`;continue;}
    let type=contentType(r);
    if(/^image\//i.test(type)){
      const ab=await r.arrayBuffer();return{buf:Buffer.from(ab),type,resolved:u.href,pagesScanned:seenPages.size,candidateCount,direct:true};
    }
    if(!/text\/html|application\/xhtml\+xml|application\/json|text\/plain/.test(type)){lastError=`unsupported ${type}`;continue;}
    const html=await r.text();
    const ranked=extractOfficialSeatLayoutCandidates(html,u.href).slice(0,maxCandidates);
    candidateCount+=ranked.length;
    for(const candidate of ranked){
      if(seenImages.has(candidate.url))continue;seenImages.add(candidate.url);
      let imgUrl;try{imgUrl=new URL(candidate.url);}catch{continue;}if(!allowed(imgUrl))continue;
      try{
        const ir=await fetchOfficial(imgUrl,'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',fetchImpl);
        if(!ir.ok)continue;const it=contentType(ir);if(!/^image\//i.test(it))continue;
        const ab=await ir.arrayBuffer();if(!ab.byteLength||ab.byteLength>10_000_000)continue;
        return{buf:Buffer.from(ab),type:it,resolved:imgUrl.href,pagesScanned:seenPages.size,candidateCount,direct:false,score:candidate.score};
      }catch(err){lastError=err.message;}
    }
    // A promoter/index page may only link to the real official ticket detail page. Follow those
    // links once or twice instead of concluding that the official map does not exist.
    for(const link of extractOfficialTicketLinks(html,u.href)){
      if(!seenPages.has(link)&&pageQueue.length+seenPages.size<maxPages+3)pageQueue.push(link);
    }
  }
  throw Object.assign(new Error(lastError),{status:404,meta:{pagesScanned:seenPages.size,candidateCount}});
}

export default async function handler(req,res){
  const raw=String(req.query?.url||'');
  try{
    const found=await resolveOfficialSeatMap(raw);
    if(found.buf.byteLength>10_000_000)return res.status(413).json({error:'image too large'});
    const hash=crypto.createHash('sha256').update(found.buf).digest('hex');
    res.setHeader('Content-Type',found.type);res.setHeader('Cache-Control','s-maxage=21600, stale-while-revalidate=86400');
    res.setHeader('X-NEUL-SeatMap-Hash',hash);res.setHeader('X-NEUL-SeatMap-Resolved',found.resolved);
    res.setHeader('X-NEUL-SeatMap-Resolver','recursive-v2');res.setHeader('X-NEUL-SeatMap-Pages',String(found.pagesScanned||1));res.setHeader('X-NEUL-SeatMap-Candidates',String(found.candidateCount||0));
    res.setHeader('Access-Control-Expose-Headers','X-NEUL-SeatMap-Hash, X-NEUL-SeatMap-Resolved, X-NEUL-SeatMap-Resolver, X-NEUL-SeatMap-Pages, X-NEUL-SeatMap-Candidates');
    return res.status(200).send(found.buf);
  }catch(err){
    const status=err.status||502;if(status===404)res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=900');
    return res.status(status).json({error:status===404?'official seat map not found yet':'seat map unavailable',message:err.message,...(err.meta||{})});
  }
}
