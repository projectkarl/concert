import {seedEvents} from '../data/events.js';
import {venueModels, venueIdFromName, shouldGenerateEvent3D, ensureVenueModelForEvent, ensureAutoEventLayout, getVenueLayout} from '../data/multi-venue-geometry.js';
let ok=true; const fail=(m,x)=>{console.error(m,x??'');ok=false;};
for(const [id,m] of Object.entries(venueModels)){
  if(!m.geometryPolicy) fail('missing venue geometry policy',id);
  if(!Array.isArray(m.sections)||!m.sections.length) fail('venue has no structural sections',id);
}
const ticc=venueModels.ticc;
if(!ticc||ticc.tiers.some(t=>String(t.id)==='1F')||ticc.geometryPolicy?.audienceFloor1!==false) fail('TICC audience topology regression');
const ticcBands=['2F-A','3F-A','4F-A','5F-A','6F-A'].map(id=>ticc.sections.find(s=>s.id===id));
for(let i=1;i<ticcBands.length;i++) if(!(ticcBands[i].z>ticcBands[i-1].z && ticcBands[i].y>ticcBands[i-1].y)) fail('TICC continuous rake progression regression',ticcBands);
for(const e of seedEvents){
  const resolved=ensureVenueModelForEvent(e); const eligible=shouldGenerateEvent3D(e);
  if(eligible && (!resolved||!venueModels[resolved])) fail('eligible event without calibrated venue',e.id);
  if(!eligible && resolved) fail('excluded event resolved a venue model',e.id);
  if(e.venueModelId && !venueModels[e.venueModelId] && eligible) fail('unknown explicit venue id became eligible',e.id);
  const layoutId=ensureAutoEventLayout(e);
  if(eligible){ const l=getVenueLayout(layoutId); if(!l||l.venueId!==resolved) fail('event layout/venue mismatch',{id:e.id,resolved,layoutId}); }
}
const pengT=seedEvents.find(e=>e.id==='julia-peng-counting-days-taipei-2026');
const pengK=seedEvents.find(e=>e.id==='julia-peng-counting-days-kaohsiung-2026');
if(!pengT?.sharedSourceUrl||!pengK?.sharedSourceUrl||pengT.sourceUrl!==pengK.sourceUrl||!/台北/.test(pengT.seatMapVariantHint||'')||!/高雄/.test(pengK.seatMapVariantHint||'')) fail('Peng shared KHAM page variant hints missing');
if(!ok) process.exit(1);
console.log(`NEUL topology integrity passed · ${seedEvents.length} events · ${Object.keys(venueModels).length} calibrated venue models · TICC continuous rake · Peng shared-map disambiguation`);
