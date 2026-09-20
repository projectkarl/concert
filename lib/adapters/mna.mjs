import {fetchText} from '../http.mjs';
import {anchors,images,titleFromHtml,stripHtml,money,dateRange,sectionTokens} from '../html.mjs';
const LIST='https://ticket.mna.com.tw/UTK0101_';
export async function discoverMna(){
  const html=await fetchText(LIST); const out=[];
  for(const a of anchors(html,LIST)){
    if(!/UTK0201_\?PRODUCT_ID=/i.test(a.href)||!a.text)continue;
    const around=stripHtml(html.slice(Math.max(0,a.index-650),a.index+900)); const dr=dateRange(around); if(!dr.date)continue;
    const id='mna-'+new URL(a.href).searchParams.get('PRODUCT_ID').toLowerCase();
    out.push({id,artist:artistFromTitle(a.text),title:a.text,date:dr.date,endDate:dr.endDate,venue:extractVenue(around),city:cityFromVenue(around),ticketUrl:a.href,source:'MNA',featured:false,liveDiscovered:true});
  }
  return dedupe(out).slice(0,60);
}
export async function detailMna(url){
  const html=await fetchText(url,{timeout:6000}); const text=stripHtml(html); const title=titleFromHtml(html); const dr=dateRange(text); const venue=extractVenue(text);
  const prices=money((text.match(/票價[\s\S]{0,500}/i)||[])[0]||text).slice(0,18); const sections=sectionTokens(text);
  const seatLinks=anchors(html,url).filter(a=>/(座位圖|票價座位圖|票圖|seat)/i.test(a.text)).map(a=>({src:a.href,alt:a.text,context:a.text}));
  const seatImages=images(html,url).map(i=>({...i,context:stripHtml(html.slice(Math.max(0,i.index-250),i.index+350))})).filter(x=>/(座位|票價|seat|map)/i.test(`${x.alt} ${x.context}`));
  return {title,artist:artistFromTitle(title),...dr,venue,city:cityFromVenue(text),prices,sections,seatMapCandidates:[...seatLinks,...seatImages].slice(0,5),seatMapMode:/音樂廳/.test(venue)?'concert-hall':'end-stage',stage:'end',rawSignals:{standing:/站席|站區/.test(text),obstructed:/視線|遮蔽/.test(text),sectionCount:sections.length},source:'MNA',ticketUrl:url};
}
function extractVenue(t=''){return (t.match(/(?:節目場次[\s\S]{0,160}?)(臺北國家音樂廳|臺中國家歌劇院|衛武營音樂廳|臺北小巨蛋|臺北大巨蛋)/)||t.match(/(臺北國家音樂廳|臺中國家歌劇院|衛武營音樂廳|臺北小巨蛋|臺北大巨蛋)/)||[])[1]||''}
function artistFromTitle(t=''){return t.replace(/^(凱基|遠東|富邦|BMW|玉山|2026臺中)[^—-]{0,20}[—-]?/,'').split(/[—–·《@]/)[0].trim().slice(0,60)||'Live'}
function cityFromVenue(t=''){if(/臺中/.test(t))return'台中';if(/高雄|衛武營/.test(t))return'高雄';return'台北'}
function dedupe(a){const m=new Map;for(const x of a)if(!m.has(x.ticketUrl))m.set(x.ticketUrl,x);return[...m.values()]}
