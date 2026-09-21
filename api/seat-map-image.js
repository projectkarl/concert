import crypto from 'node:crypto';
import { extractOfficialSeatLayoutCandidates, extractOfficialTicketLinks } from '../lib/official-monitor.js';

const ALLOWED = [
  'tixcraft.com','static.tixcraft.com','kktix.com','kktix.cc','assets.kktix.io','ticketplus.com.tw','www.ticketplus.com.tw',
  'kham.com.tw','www.kham.com.tw','ticket.ibon.com.tw','www.famiticket.com.tw','famiticket.com.tw',
  'tickets.udnfunlife.com','ticket.mna.com.tw','ticket.com.tw','www.ticket.com.tw','livenation.com.tw','www.livenation.com.tw','weverse.io','www.weverse.io','ygfamily.com','www.ygfamily.com','arena.taipei','www.arena.taipei','tmc.taipei','www.tmc.taipei','kaoarena.com.tw','www.kaoarena.com.tw','kpmc.com.tw','www.kpmc.com.tw','opentix.life','www.opentix.life','tixfun.com','www.tixfun.com','go.fansi.me','tickets.books.com.tw','indievox.com','www.indievox.com',
  'farglorydome.com.tw','www.farglorydome.com.tw','news-images.tvbs.com.tw','ntsu.edu.tw','phk.ntsu.edu.tw','dst.tycg.gov.tw','tycg.gov.tw','www.tycg.gov.tw','rent.pe.ntu.edu.tw','pe.ntu.edu.tw','ntu.edu.tw','www.ntu.edu.tw','ticc.com.tw','www.ticc.com.tw','tainex.com.tw','www.tainex.com.tw','zepp.co.jp','www.zepp.co.jp','kcg.gov.tw','www.kcg.gov.tw','kph.tw','www.kph.tw'
];
function allowed(u){return u.protocol==='https:'&&ALLOWED.some(h=>u.hostname===h||u.hostname.endsWith('.'+h));}
async function fetchOfficial(u,accept,fetchImpl=fetch){return fetchImpl(u.href,{headers:{'user-agent':'Mozilla/5.0 (compatible; NEUL/0.40.9 auto-seat-map)','accept':accept,'accept-language':'zh-TW,zh;q=0.9,en;q=0.7','referer':`${u.protocol}//${u.hostname}/`},redirect:'follow',signal:AbortSignal.timeout(7000)});}
const contentType=r=>(r.headers.get('content-type')||'application/octet-stream').split(';')[0].toLowerCase();

const HINT_GROUPS = [
  {id:'taipei',re:/台北|臺北|\btaipei\b/i,opposes:['kaohsiung']},
  {id:'kaohsiung',re:/高雄|\bkaohsiung\b/i,opposes:['taipei']},
  {id:'taipei-arena',re:/小巨蛋|taipei\s*arena/i,opposes:['kaohsiung-arena']},
  {id:'kaohsiung-arena',re:/高雄巨蛋|kaohsiung\s*arena|k-?arena/i,opposes:['taipei-arena']},
  {id:'ticc',re:/\bticc\b|台北國際會議中心|臺北國際會議中心/i,opposes:[]},
  {id:'ntsu-arena',re:/\bntsu\b|國立體育大學|林口體育館|林口.*arena/i,opposes:[]},
  {id:'taipei-music-center',re:/北流|臺北流行音樂中心|台北流行音樂中心|taipei\s*music\s*center/i,opposes:[]},
  {id:'kaohsiung-music-center',re:/海音館|高雄流行音樂中心|kaohsiung\s*music\s*center/i,opposes:[]},
  {id:'zepp-new-taipei',re:/zepp\s*new\s*taipei/i,opposes:[]},
  {id:'nangang',re:/南港展覽館|nangang\s*exhibition/i,opposes:[]}
];
function hintProfile(text=''){
  const raw=String(text||'');
  return new Set(HINT_GROUPS.filter(g=>g.re.test(raw)).map(g=>g.id));
}
function scoreCandidateHints(candidate,hints=[]){
  const hintText=hints.filter(Boolean).join(' ');
  if(!hintText.trim()) return 0;
  const target=hintProfile(hintText);
  const hay=`${candidate.url||''} ${candidate.context||''}`;
  const found=hintProfile(hay);
  let score=0;
  for(const id of target){
    if(found.has(id)) score += id==='taipei'||id==='kaohsiung' ? 18 : 28;
    const group=HINT_GROUPS.find(g=>g.id===id);
    for(const opposite of group?.opposes||[]) if(found.has(opposite)) score-=24;
  }
  const norm=v=>String(v||'').toLowerCase().replace(/[臺台]/g,'台').replace(/\s+/g,'');
  const hn=norm(hintText),cn=norm(candidate.context||'');
  for(const token of ['台北','高雄','小巨蛋','高雄巨蛋','ticc','北流','海音館']){
    if(hn.includes(token) && cn.includes(token)) score+=8;
  }
  return score;
}
function rankCandidatesForEvent(candidates,hints=[]){
  return (candidates||[]).map(c=>{
    const hintScore=scoreCandidateHints(c,hints);
    return {...c,hintScore,eventScore:Number(c.score||0)+hintScore};
  }).sort((a,b)=>b.eventScore-a.eventScore || b.hintScore-a.hintScore || b.score-a.score);
}

export async function resolveOfficialSeatMap(raw,{fetchImpl=fetch,maxPages=5,maxCandidates=8,hints=[],strictHint=false}={}){
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
    const baseRanked=extractOfficialSeatLayoutCandidates(html,u.href).slice(0,maxCandidates);
    const ranked=rankCandidatesForEvent(baseRanked,hints);
    candidateCount+=ranked.length;
    const hintMismatch = strictHint && ranked.length && (ranked[0].hintScore < 0 || (ranked.length>1 && ranked[0].hintScore<=0));
    if(hintMismatch){
      lastError='ambiguous multi-venue seat map: no candidate matches the event venue hint';
    } else for(const candidate of ranked){
      if(seenImages.has(candidate.url))continue;seenImages.add(candidate.url);
      let imgUrl;try{imgUrl=new URL(candidate.url);}catch{continue;}if(!allowed(imgUrl))continue;
      try{
        const ir=await fetchOfficial(imgUrl,'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',fetchImpl);
        if(!ir.ok)continue;const it=contentType(ir);if(!/^image\//i.test(it))continue;
        const ab=await ir.arrayBuffer();if(!ab.byteLength||ab.byteLength>10_000_000)continue;
        return{buf:Buffer.from(ab),type:it,resolved:imgUrl.href,pagesScanned:seenPages.size,candidateCount,direct:false,score:candidate.score,hintScore:candidate.hintScore||0,eventScore:candidate.eventScore||candidate.score};
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
  const venue=String(req.query?.venue||'');
  const venueId=String(req.query?.venueId||'');
  const event=String(req.query?.event||'');
  const strictHint=String(req.query?.shared||'')==='1';
  try{
    const found=await resolveOfficialSeatMap(raw,{hints:[venue,venueId,event],strictHint});
    if(found.buf.byteLength>10_000_000)return res.status(413).json({error:'image too large'});
    const hash=crypto.createHash('sha256').update(found.buf).digest('hex');
    res.setHeader('Content-Type',found.type);res.setHeader('Cache-Control','s-maxage=21600, stale-while-revalidate=86400');
    res.setHeader('X-NEUL-SeatMap-Hash',hash);res.setHeader('X-NEUL-SeatMap-Resolved',found.resolved);
    res.setHeader('X-NEUL-SeatMap-Resolver','recursive-v3-venue-hint');res.setHeader('X-NEUL-SeatMap-Pages',String(found.pagesScanned||1));res.setHeader('X-NEUL-SeatMap-Candidates',String(found.candidateCount||0));res.setHeader('X-NEUL-SeatMap-HintScore',String(found.hintScore||0));
    res.setHeader('Access-Control-Expose-Headers','X-NEUL-SeatMap-Hash, X-NEUL-SeatMap-Resolved, X-NEUL-SeatMap-Resolver, X-NEUL-SeatMap-Pages, X-NEUL-SeatMap-Candidates, X-NEUL-SeatMap-HintScore');
    return res.status(200).send(found.buf);
  }catch(err){
    const status=err.status||502;if(status===404)res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=900');
    return res.status(status).json({error:status===404?'official seat map not found yet':'seat map unavailable',message:err.message,...(err.meta||{})});
  }
}
