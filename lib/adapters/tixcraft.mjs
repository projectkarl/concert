import {fetchText} from '../http.mjs';
import {anchors,images,titleFromHtml,stripHtml,money,dateRange,sectionTokens,unique} from '../html.mjs';
const LIST='https://tixcraft.com/activity/d';
export async function discoverTixcraft(){
  const html=await fetchText(LIST); const text=stripHtml(html);
  const out=[];
  for(const a of anchors(html,LIST)){
    if(!/\/activity\/detail\//.test(a.href)) continue;
    if(/mastercard|vip upgrade|返鄉專車|季票|softbank|福岡/i.test(a.text)) continue;
    const around=stripHtml(html.slice(Math.max(0,a.index-800),a.index+1000));
    const dr=dateRange(around); if(!dr.date) continue;
    const venue=((around.match(/(?:臺北大巨蛋|台北大巨蛋|臺北小巨蛋|台北小巨蛋|國立體育大學綜合體育館|高雄巨蛋|台北流行音樂中心表演廳|Zepp New Taipei|Legacy TERA|Legacy Taipei|LIVE WAREHOUSE|Clapper Studio|桃園陽光劇場)/i)||[])[0]||'').replace('台北','臺北');
    const id='tix-'+a.href.split('/').filter(Boolean).pop().replace(/[^a-z0-9_-]/gi,'').toLowerCase();
    out.push({id,artist:artistFromTitle(a.text),title:a.text,date:dr.date,endDate:dr.endDate,venue,city:cityFromVenue(venue),ticketUrl:a.href,source:'Tixcraft',featured:false,liveDiscovered:true});
  }
  return dedupe(out).slice(0,50);
}
export async function detailTixcraft(url){
  const html=await fetchText(url,{timeout:6000}); const text=stripHtml(html); const title=titleFromHtml(html); const dr=dateRange(text);
  const venue=extractVenue(text); const prices=extractTicketPrices(text); const sections=sectionTokens(text);
  const imgs=images(html,url).map(im=>({...im,context:stripHtml(html.slice(Math.max(0,im.index-350),im.index+450))}));
  const seatMapCandidates=imgs.filter(x=>/(座位|票區|seat|map|price|票價)/i.test(`${x.alt} ${x.context} ${x.src}`)).slice(0,5);
  const layout=inferLayout(text,venue);
  return {title,artist:artistFromTitle(title),...dr,venue,city:cityFromVenue(venue),prices,sections,seatMapCandidates,seatMapMode:layout.mode,stage:layout.stage,rawSignals:{standing:/站席|站區|standing/i.test(text),obstructed:/視線受阻|遮蔽|obstructed/i.test(text),sectionCount:sections.length},source:'Tixcraft',ticketUrl:url};
}
function extractVenue(t){return ((t.match(/(?:VENUE|地點|Venue)\s*[:：]?\s*([^\n]{2,60})/i)||[])[1]|| (t.match(/(?:臺北大巨蛋|台北大巨蛋|臺北小巨蛋|台北小巨蛋|國立體育大學綜合體育館|高雄巨蛋|台北流行音樂中心表演廳|Zepp New Taipei|Legacy TERA|Legacy Taipei|LIVE WAREHOUSE|Clapper Studio|桃園陽光劇場)/i)||[])[0]||'').replace('台北','臺北').trim()}
function extractTicketPrices(t){const lines=t.split('\n').filter(l=>/(票價|ticket price|ticket prices)/i.test(l));const near=lines.join(' ');const p=money(near);return p.length?p:money(t).filter(n=>n!==200).slice(0,16)}
function inferLayout(t,venue){if(/Zepp/i.test(venue))return{mode:'standing+2f',stage:'end'};if(/延伸舞台|thrust/i.test(t))return{mode:'arena-thrust',stage:'thrust'};if(/站席|站區|standing/i.test(t))return{mode:'arena-hybrid',stage:'end'};if(/國立體育大學|巨蛋|小巨蛋|體育館/i.test(venue))return{mode:'arena-seated',stage:'end'};return{mode:'end-stage',stage:'end'}}
function artistFromTitle(t=''){return t.replace(/^Tickets:\s*/i,'').split(/[:：·@\-–—|＜<]/)[0].trim().slice(0,60)||'Live'}
function cityFromVenue(v=''){if(/高雄/.test(v))return'高雄';if(/桃園|國立體育大學/.test(v))return'桃園';if(/新北|Zepp/.test(v))return'新北';return'台北'}
function dedupe(a){const m=new Map;for(const x of a){if(!m.has(x.ticketUrl))m.set(x.ticketUrl,x)}return [...m.values()]}
