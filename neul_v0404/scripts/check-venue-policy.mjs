import fs from 'node:fs';
import {seedEvents} from '../data/events.js';
import {shouldGenerateEvent3D,ensureVenueModelForEvent,ensureAutoEventLayout,getVenueModel,getVenueLayout} from '../data/multi-venue-geometry.js';
import {resolveOfficialSeatMap} from '../api/seat-map-image.js';
let ok=true; const fail=(m,x)=>{console.error(m,x||'');ok=false;};
for(const id of ['waterbomb-kaohsiung-2026','kyuhyun-penghu-music-festival-2026']){
  const e=seedEvents.find(x=>x.id===id); if(!e) fail('missing outdoor fixture '+id);
  else if(shouldGenerateEvent3D(e)||ensureVenueModelForEvent(e)||ensureAutoEventLayout(e)) fail('temporary outdoor venue still generates 3D '+id);
}

const unknownIndoor={id:'unknown-indoor',artist:'TEST',title:'TEST',venue:'Unknown Hall',city:'Taipei',sourceUrl:'https://example.com/test'};
if(shouldGenerateEvent3D(unknownIndoor)||ensureVenueModelForEvent(unknownIndoor)||ensureAutoEventLayout(unknownIndoor)) fail('unknown indoor venue must not silently fabricate generic 3D');
const provisional={...unknownIndoor,id:'unknown-official',seatLayoutSourceUrl:'https://static.tixcraft.com/images/activity/field/test.jpg',allowProvisional3D:true};
const provisionalId=ensureVenueModelForEvent(provisional);
if(!String(provisionalId||'').startsWith('runtime-')) fail('explicit official-map provisional opt-in did not create guarded runtime venue',provisionalId);

const jason=seedEvents.find(x=>x.id==='jason-mraz-asia-tour-taipei-2026');
if(!jason) fail('Jason Mraz event missing');
else{
  const vid=ensureVenueModelForEvent(jason), lid=ensureAutoEventLayout(jason), model=getVenueModel(vid), layout=getVenueLayout(lid);
  if(vid!=='nangang-exhibition-hall1-4f') fail('Jason Mraz venue model is not Nangang Hall 1 4F',vid);
  if(!model||model.tiers?.length!==1||model.tiers?.[0]?.id!=='FLOOR') fail('Nangang base model must remain a flat exhibition floor');
  if(!layout?.stage?.main) fail('Jason Mraz event-specific layout missing');
}
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
if(!/officialPages=\[event\.ticketUrl,event\.ticketSourceUrl,event\.secondarySourceUrl,event\.sourceUrl/.test(app)) fail('official map renderer does not resolve directly from official event pages');
const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');
if(!/\.entertainment-news\{grid-area:news;/.test(css)) fail('Entertainment News is not anchored to the NEUL page grid');
if(!/"news news"/.test(css)) fail('NEUL page grid is missing the news row');
// Mock an official 年代 page where the map filename itself is generic; context must still find and return the image.
const page='https://ticket.com.tw/Application/UTK02/UTK0201_.aspx?PRODUCT_ID=P1AT93WA';
const image='https://ticket.com.tw/Upload/Product/ABC123.jpg';
const fetchImpl=async (url)=>{
  const u=String(url);
  if(u===page) return new Response('<h4>場地示意圖</h4><img src="/Upload/Product/ABC123.jpg" alt="示意圖">',{status:200,headers:{'content-type':'text/html; charset=utf-8'}});
  if(u===image) return new Response(new Uint8Array([1,2,3,4]),{status:200,headers:{'content-type':'image/jpeg'}});
  return new Response('not found',{status:404,headers:{'content-type':'text/plain'}});
};
try{ const found=await resolveOfficialSeatMap(page,{fetchImpl}); if(found.resolved!==image||found.type!=='image/jpeg') fail('official page -> map image resolver failed',found); }
catch(err){fail('official map source-page resolver failed',err.message);}

// A shared KHAM product page may contain separate Taipei and Kaohsiung seating maps.
// Venue hints must choose the matching image instead of blindly taking the first map.
const sharedPage='https://kham.com.tw/application/UTK02/UTK0201_.aspx?PRODUCT_ID=P1D3G65D';
const taipeiImg='https://kham.com.tw/images/peng-taipei-map.jpg';
const kaohsiungImg='https://kham.com.tw/images/peng-kaohsiung-map.jpg';
const sharedHtml=`<section><h4>票價區示意圖[台北]</h4><img src="${taipeiImg}" alt="台北小巨蛋 票價區示意圖"></section>${'X'.repeat(2200)}<section><h4>票價區示意圖[高雄]</h4><img src="${kaohsiungImg}" alt="高雄巨蛋 票價區示意圖"></section>`;
const sharedFetch=async (url)=>{
  const u=String(url);
  if(u===sharedPage)return new Response(sharedHtml,{status:200,headers:{'content-type':'text/html; charset=utf-8'}});
  if(u===taipeiImg||u===kaohsiungImg)return new Response(new Uint8Array([9,8,7]),{status:200,headers:{'content-type':'image/jpeg'}});
  return new Response('not found',{status:404,headers:{'content-type':'text/plain'}});
};
try{
  const t=await resolveOfficialSeatMap(sharedPage,{fetchImpl:sharedFetch,hints:['臺北小巨蛋 Taipei Arena','taipei-arena','彭佳慧 台北場'],strictHint:true});
  const k=await resolveOfficialSeatMap(sharedPage,{fetchImpl:sharedFetch,hints:['高雄巨蛋 Kaohsiung Arena','kaohsiung-arena','彭佳慧 高雄場'],strictHint:true});
  if(t.resolved!==taipeiImg||k.resolved!==kaohsiungImg||!(t.hintScore>0)||!(k.hintScore>0)) fail('shared multi-venue map hint resolver selected the wrong seating map',{t:t.resolved,k:k.resolved,tScore:t.hintScore,kScore:k.hintScore});
}catch(err){fail('shared multi-venue map resolver failed',err.message);}

if(!ok)process.exit(1);
console.log('NEUL venue policy checks passed · unknown venue 3D blocked · shared-ticket-page venue hints · TICC/topology-safe official map resolver · native-grid news');
