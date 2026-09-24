const SOURCE_DEFS = [
  {id:'kktix',label:'KKTIX',url:'https://kktix.com/events',host:/\.kktix\.cc$|^kktix\.com$/i},
  {id:'tixcraft',label:'tixCraft 拓元',url:'https://tixcraft.com/activity',host:/\.tixcraft\.com$|^tixcraft\.com$/i},
  {id:'ibon',label:'ibon 售票',url:'https://ticket.ibon.com.tw/',host:/\.ibon\.com\.tw$|^ticket\.ibon\.com\.tw$/i},
  {id:'era',label:'年代售票',url:'https://ticket.com.tw/',host:/^ticket\.com\.tw$/i},
  {id:'kham',label:'寬宏售票',url:'https://kham.com.tw/application/UTK01/UTK0101_.aspx',host:/\.kham\.com\.tw$|^kham\.com\.tw$/i},
  {id:'mna',label:'MNA 牛耳藝術',url:'https://www.mna.com.tw/',host:/\.mna\.com\.tw$|^mna\.com\.tw$/i},
  {id:'livenation',label:'Live Nation Taiwan',url:'https://www.livenation.com.tw/',host:/\.livenation\.com\.tw$|^www\.livenation\.com\.tw$/i},
  {id:'ticketplus',label:'Ticket Plus 遠大售票',url:'https://ticketplus.com.tw/',host:/\.ticketplus\.com\.tw$|^ticketplus\.com\.tw$/i},
  {id:'famiticket',label:'全網購票網',url:'https://www.famiticket.com.tw/',host:/\.famiticket\.com\.tw$|^www\.famiticket\.com\.tw$/i},
  {id:'indievox',label:'iNDIEVOX',url:'https://www.indievox.com/',host:/\.indievox\.com$|^www\.indievox\.com$/i}
];

const decode = s => s.replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const abs = (u, base) => { try { return new URL(u, base).toString(); } catch { return ''; } };
const slug = s => decode(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9\u4e00-\u9fff]+/g,'-').replace(/^-|-$/g,'').slice(0,80);

function extractLinks(html, source) {
  const out=[]; let m;
  const re=/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  while((m=re.exec(html)) && out.length<160){
    const title=decode(m[2]);
    if(title.length<4) continue;
    if(!/(concert|tour|fan|live|演唱會|巡迴|見面會|音樂會|專場|show|festival|award)/i.test(title)) continue;
    const url=abs(m[1],source.url); if(!url) continue;
    out.push({title,url});
  }
  return out;
}
function parseDate(text){
  let m=text.match(/(20\d{2})[\/.\-年]\s*(\d{1,2})[\/.\-月]\s*(\d{1,2})/);
  if(m) return `${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`;
  m=text.match(/(\d{1,2})[\/.\-月]\s*(\d{1,2})/);
  if(m){const y=new Date().getFullYear(); return `${y}-${String(m[1]).padStart(2,'0')}-${String(m[2]).padStart(2,'0')}`;}
  return '';
}
export async function fetchSource(source, {timeoutMs=6500}={}){
  const ac=new AbortController(); const t=setTimeout(()=>ac.abort(),timeoutMs);
  const started=Date.now();
  try{
    const res=await fetch(source.url,{signal:ac.signal,headers:{'user-agent':'Mozilla/5.0 (compatible; NEUL/1.0; +concert-discovery)','accept-language':'zh-TW,zh;q=0.9,en;q=0.7'}});
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const html=await res.text();
    const links=extractLinks(html,source).map(x=>({
      id:`${source.id}-${slug(x.title)}`,
      date:parseDate(x.title),artist:x.title.split(/[|｜–—-]/)[0].trim().slice(0,60),title:x.title,
      venue:'待官方資料回補',city:'',category:'其他',source:source.label,sourceUrl:x.url,ticketUrl:x.url,price:'TBA',mapUrl:'',layoutId:`auto-${source.id}-${slug(x.title)}`,stage:'end',featured:false,image:'',discovered:true
    }));
    return {id:source.id,label:source.label,ok:true,status:res.status,ms:Date.now()-started,count:links.length,events:links.slice(0,40),checkedAt:new Date().toISOString()};
  } catch(e){
    return {id:source.id,label:source.label,ok:false,error:String(e?.message||e),ms:Date.now()-started,count:0,events:[],checkedAt:new Date().toISOString()};
  } finally { clearTimeout(t); }
}
export async function discoverAll(opts={}){
  const results=await Promise.allSettled(SOURCE_DEFS.map(s=>fetchSource(s,opts)));
  return results.map((r,i)=>r.status==='fulfilled'?r.value:{id:SOURCE_DEFS[i].id,label:SOURCE_DEFS[i].label,ok:false,error:String(r.reason),events:[],count:0});
}
export function isTrustedImageUrl(raw){
  try { const u=new URL(raw); return SOURCE_DEFS.some(s=>s.host.test(u.hostname)) || /(^|\.)assets\.kktix\.io$/i.test(u.hostname) || /(^|\.)static\.tixcraft\.com$/i.test(u.hostname) || /(^|\.)networksites\.livenationinternational\.com$/i.test(u.hostname); } catch { return false; }
}
export {SOURCE_DEFS};


export async function fetchCoverageReference({timeoutMs=6500}={}){
  const url='https://twconcertview.com/calendar';
  const ac=new AbortController(); const t=setTimeout(()=>ac.abort(),timeoutMs);
  const started=Date.now();
  try{
    const res=await fetch(url,{signal:ac.signal,headers:{'user-agent':'Mozilla/5.0 (compatible; NEUL/1.0; coverage-reconciliation)','accept-language':'zh-TW,zh;q=0.9'}});
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const html=await res.text();
    const text=decode(html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' '));
    const advertised=Number((text.match(/近期\s*(\d+)\s*場演出/)||[])[1]||0);
    const re=/(20\d{2}-\d{2}-\d{2})\s*[｜|]\s*([^｜|]{2,120})\s*[｜|]\s*([^｜|]{2,120}?)(?=\s+20\d{2}-\d{2}-\d{2}|$)/g;
    const events=[]; let m;
    while((m=re.exec(text)) && events.length<500){
      const date=m[1], artist=m[2].trim(), venue=m[3].trim().slice(0,120);
      if(/澎湖.*燈光節|市集|講座|工作坊/i.test(artist)) continue;
      const key=slug(`${date}-${artist}-${venue}`);
      events.push({id:`coverage-${key}`,date,artist,title:artist,venue,city:'',category:'其他',source:'TWConcertView coverage reference',sourceUrl:url,ticketUrl:'',price:'TBA',mapUrl:'',layoutId:`auto-coverage-${key}`,stage:'end',featured:false,image:'',verified:false,coverageOnly:true});
    }
    const unique=[...new Map(events.map(e=>[`${e.date}|${canonicalTitle(e.artist)}|${canonicalTitle(e.venue)}`,e])).values()];
    return {id:'coverage-reference',label:'TWConcertView coverage reference',ok:true,status:res.status,ms:Date.now()-started,count:unique.length,advertised,events:unique,checkedAt:new Date().toISOString()};
  } catch(e){return {id:'coverage-reference',label:'TWConcertView coverage reference',ok:false,error:String(e?.message||e),ms:Date.now()-started,count:0,advertised:0,events:[],checkedAt:new Date().toISOString()};}
  finally{clearTimeout(t)}
}
function canonicalTitle(s){return String(s||'').toLowerCase().normalize('NFKC').replace(/[^a-z0-9\u4e00-\u9fff]/g,'')}

export async function fetchNews({timeoutMs=6500}={}){
  const queries={kr:'韓星 OR KPOP 台灣 演唱會',tw:'台灣 歌手 演唱會',west:'歐美 歌手 台灣 演唱會',jp:'日本 歌手 台灣 演唱會'};
  const out={};
  for(const [cat,q] of Object.entries(queries)){
    const ac=new AbortController(); const t=setTimeout(()=>ac.abort(),timeoutMs);
    try{
      const url='https://news.google.com/rss/search?q='+encodeURIComponent(q)+'&hl=zh-TW&gl=TW&ceid=TW:zh-Hant';
      const res=await fetch(url,{signal:ac.signal,headers:{'user-agent':'Mozilla/5.0 NEUL-news/1.0'}});
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml=await res.text(); const items=[]; let m;
      const re=/<item>([\s\S]*?)<\/item>/gi;
      while((m=re.exec(xml)) && items.length<24){
        const block=m[1];
        const val=(tag)=>decode((block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`,'i'))||[])[1]||'').replace(/^<!\[CDATA\[|\]\]>$/g,'');
        const title=val('title'), link=val('link'), pubDate=val('pubDate'), source=val('source');
        if(title&&link) items.push({title,link,pubDate,source,category:cat});
      }
      out[cat]=items;
    }catch{out[cat]=[]} finally{clearTimeout(t)}
  }
  return out;
}
