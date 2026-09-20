import {readEvents,normalizeEvents} from './events.mjs';
import {discoverTixcraft,detailTixcraft} from './adapters/tixcraft.mjs';
import {discoverMna,detailMna} from './adapters/mna.mjs';
import {build3DSchema} from './venue.mjs';
import {withTimeout} from './http.mjs';
const allowed=new Set(['tixcraft.com','www.tixcraft.com','ticket.mna.com.tw']);
export async function discoverEvents(){
  const fallback=await readEvents(); const jobs=[safe('Tixcraft',()=>withTimeout(discoverTixcraft(),5200)),safe('MNA',()=>withTimeout(discoverMna(),5200))]; const results=await Promise.all(jobs);
  const live=results.flatMap(x=>x.events||[]); const merged=mergeByUrl([...live,...fallback]);
  return {events:normalizeEvents(merged),sources:results.map(({source,ok,count,error})=>({source,ok,count,error})),mode:live.length?'live+fallback':'fallback'};
}
export async function buildEventDetail(url,base={}){
  validateUrl(url); const host=new URL(url).hostname; let parsed;
  if(/tixcraft\.com$/.test(host)) parsed=await detailTixcraft(url); else if(host==='ticket.mna.com.tw') parsed=await detailMna(url); else throw new Error('unsupported source');
  const event={...base,...parsed,ticketUrl:url}; const schema=build3DSchema(event); const qa=quality(event,schema);
  return {...event,threeD:schema,qa,automation:{discovered:true,detailParsed:true,seatMapFound:(event.seatMapCandidates||[]).length>0,sectionMapped:schema.sections.length>0,ocrEligible:(event.seatMapCandidates||[]).some(x=>/\.(png|jpe?g|webp)(\?|$)/i.test(x.src||'')),generated3D:true,publishMode:qa.score>=60?'custom-3d':'venue-fallback'}};
}
export function quality(event,schema){let score=20;const checks=[];const add=(name,ok,pts)=>{checks.push({name,ok});if(ok)score+=pts};add('date',!!event.date,10);add('venue',!!event.venue,10);add('price',(event.prices||[]).length>0,10);add('seatMap',(event.seatMapCandidates||[]).length>0,18);add('sections',(event.sections||[]).length>0,17);add('geometry',(schema.sections||[]).length>0,15);score=Math.min(100,score);return{score,level:score>=80?'high':score>=60?'medium':'fallback',checks,verifiedAt:new Date().toISOString()}}
function validateUrl(url){const u=new URL(url);if(u.protocol!=='https:'||!allowed.has(u.hostname))throw new Error('URL not allowed')}
async function safe(source,fn){try{const events=await fn();return{source,ok:true,count:events.length,events}}catch(e){return{source,ok:false,count:0,events:[],error:String(e?.message||e)}}}
function mergeByUrl(items){const m=new Map;for(const x of items){const k=x.ticketUrl||x.id;if(!m.has(k))m.set(k,x);else m.set(k,{...x,...m.get(k),liveDiscovered:m.get(k).liveDiscovered||x.liveDiscovered})}return[...m.values()]}
