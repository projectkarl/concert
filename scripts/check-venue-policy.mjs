import fs from 'node:fs';
import {seedEvents} from '../data/events.js';
import {shouldGenerateEvent3D,ensureVenueModelForEvent,ensureAutoEventLayout,getVenueModel,getVenueLayout} from '../data/multi-venue-geometry.js';
import {resolveOfficialSeatMap} from '../api/seat-map-image.js';
let ok=true; const fail=(m,x)=>{console.error(m,x||'');ok=false;};
for(const id of ['waterbomb-kaohsiung-2026','kyuhyun-penghu-music-festival-2026']){
  const e=seedEvents.find(x=>x.id===id); if(!e) fail('missing outdoor fixture '+id);
  else if(shouldGenerateEvent3D(e)||ensureVenueModelForEvent(e)||ensureAutoEventLayout(e)) fail('temporary outdoor venue still generates 3D '+id);
}
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
if(!ok)process.exit(1);
console.log('NEUL venue policy checks passed · temporary outdoor 3D filtered · Jason Mraz flat Nangang model · official page map resolver · native-grid news');
