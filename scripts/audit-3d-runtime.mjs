import { seedEvents } from '../data/events.js';
import {
  ensureVenueModelForEvent, ensureAutoEventLayout, getVenueModel, getVenueLayout,
  effectiveTiers, getVenueSection, venueSectionPosition
} from '../data/multi-venue-geometry.js';

const rows=[];
const finite=n=>Number.isFinite(Number(n));
for(const event of seedEvents){
  const venueId=ensureVenueModelForEvent(event);
  const layoutId=ensureAutoEventLayout({...event,venueModelId:venueId});
  const model=venueId?getVenueModel(venueId):null;
  const layout=layoutId?getVenueLayout(layoutId):null;
  const tiers=venueId&&layoutId?effectiveTiers(venueId,layoutId):[];
  const stage=layout?.stage?.main || model?.stage?.main;
  const issues=[];
  if(!venueId||!model) issues.push('missing-venue');
  if(!layoutId||!layout) issues.push('missing-layout');
  if(!layout?.eventId||layout.eventId!==event.id) issues.push('not-event-specific');
  if(!stage||![stage.x,stage.y,stage.z,stage.width,stage.depth].every(finite)) issues.push('invalid-stage');
  if(!tiers.length) issues.push('missing-tiers');
  for(const tier of tiers){
    if(!Array.isArray(tier.sections)||!tier.sections.length){issues.push(`empty-tier:${tier.id}`);continue;}
    for(const sid of tier.sections.slice(0,3)){
      const sec=getVenueSection(venueId,sid,layoutId);
      if(!sec){issues.push(`missing-section:${sid}`);continue;}
      const p=venueSectionPosition(venueId,sec,Number(sec.rowMin||1));
      if(!p || ![p.x,p.y,p.z].every(finite)) issues.push(`invalid-position:${sid}`);
    }
  }
  rows.push({id:event.id,artist:event.artist,venue:event.venue,venueId,layoutId,tiers:tiers.length,issues:[...new Set(issues)]});
}
const failed=rows.filter(r=>r.issues.length);
console.log(JSON.stringify({total:rows.length,passed:rows.length-failed.length,failed:failed.length,failures:failed},null,2));
if(failed.length) process.exit(1);
