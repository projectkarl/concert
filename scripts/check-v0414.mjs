import fs from 'node:fs';
import { venueModels, getVenueSection, venueSectionPosition } from '../data/multi-venue-geometry.js';
import { MAINSTREAM_3D_VENUE_IDS } from '../data/venues.js';

let ok=true;
const fail=(msg,detail='')=>{ console.error('FAIL',msg,detail); ok=false; };
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
if(!['0.40.14','0.40.15','0.40.16','0.40.17'].includes(pkg.version)) fail('package must retain v0.40.14 venue calibration',pkg.version);

// Taipei Dome v0.40.11.1 recalibration must survive the v0.40.13 data merge.
const dome=venueModels['taipei-dome'];
if(!dome || dome.field?.x<200 || dome.field?.z<180) fail('Taipei Dome asymmetric baseball footprint regressed',dome?.field);
const d106=getVenueSection('taipei-dome','106');
if(!Number.isFinite(d106?.centerZ)) fail('Taipei Dome asymmetric section center metadata missing',d106);
const webgl=fs.readFileSync(new URL('../webgl-venue.js',import.meta.url),'utf8');
if(!webgl.includes("model.id==='taipei-dome'") || !webgl.includes('broad arched lattice roof')) fail('Taipei Dome dedicated roof renderer missing');

// NTSU: fixed-seat metadata comes from the official colour/sub-section map; configurable lower
// activity seats must never masquerade as permanent ticket-zone names.
const ntsu=venueModels['ntsu-arena'];
if(!ntsu) fail('NTSU venue missing');
for(const fake of ['1F黃側A','1F綠側A','1F橙側A','1F藍側A']) if(getVenueSection('ntsu-arena',fake)) fail('fabricated NTSU lower ticket-zone id still exposed',fake);
for(const id of ['黃4中','黃2中','綠4中','藍3中','黃4上','藍5上']){
  const sec=getVenueSection('ntsu-arena',id);
  if(!Array.isArray(sec?.officialSubsections)||!sec.officialSubsections.length||!Number.isFinite(sec?.officialSeatCapacity)) fail('NTSU official sub-section metadata missing',id);
}
const lower=(ntsu?.sections||[]).filter(s=>s.tier==='LOWER');
if(lower.length!==12 || lower.some(s=>!s.structuralOnly||!s.eventFlexible||!s.nonTicketZone||!String(s.id).startsWith('STRUCT-LOWER-'))) fail('NTSU activity-seat envelope is not safely structural',lower.map(s=>s.id));

// Taipei Music Center: 1F is event-configurable; 2F/3F fixed-seat counts are official.
const tmc=venueModels['taipei-music-center'];
if(!tmc) fail('Taipei Music Center missing');
const tmc1=(tmc?.sections||[]).filter(s=>s.tier==='1F');
if(tmc1.length!==3 || tmc1.some(s=>!s.structuralOnly||!s.eventFlexible||!s.nonTicketZone)) fail('TMC 1F still rendered as permanent fixed seating',tmc1);
const sum=tier=>(tmc?.sections||[]).filter(s=>s.tier===tier).reduce((n,s)=>n+Number(s.officialSeatCapacity||0),0);
if(sum('2F')!==1463) fail('TMC 2F official capacity mismatch',sum('2F'));
if(sum('3F')!==1671) fail('TMC 3F mapped section capacity mismatch',sum('3F'));
if(tmc.officialTierSeatCount?.['2F']!==1463 || tmc.officialTierSeatCount?.['3F']!==1675 || tmc.officialCountDelta?.['3F']!==4) fail('TMC published total vs section-map delta metadata missing',{official:tmc.officialTierSeatCount,mapped:tmc.mappedTierSeatCount,delta:tmc.officialCountDelta});
if(!tmc.sourceUrl?.includes('20260120172250954.pdf')) fail('TMC model is not pinned to current official seat-plan PDF',tmc.sourceUrl);

// Every retained mainstream 3D venue must still have usable geometry and a selectable tier.
for(const id of MAINSTREAM_3D_VENUE_IDS){
  const model=venueModels[id];
  if(!model){ fail('mainstream venue model missing',id); continue; }
  if(!Array.isArray(model.sections)||!model.sections.length||!Array.isArray(model.tiers)||!model.tiers.length){ fail('venue topology incomplete',id); continue; }
  const section=model.sections.find(s=>!s.structuralOnly)||model.sections[0];
  const row=Number(section.rowMin??1);
  const pos=venueSectionPosition(id,section,row,10);
  if(!pos || ![pos.x,pos.y,pos.z].every(Number.isFinite)) fail('venue section position invalid',{id,section:section.id,pos});
}

if(!ok) process.exit(1);
console.log('NEUL v0.40.14 venue calibration passed · v0.40.13 data retained · Taipei Dome merge · NTSU activity/fixed topology · TMC official capacities');
