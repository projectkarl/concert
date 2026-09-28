import fs from 'node:fs';
import { getVenueModel, getVenueSection, venueSectionPosition, getVenueLayout, effectiveSections } from '../data/multi-venue-geometry.js';

let ok=true;
const fail=(msg,detail='')=>{ console.error('FAIL',msg,detail); ok=false; };
const model=getVenueModel('taipei-dome');
if(!model) fail('Taipei Dome model missing');
if(model && !(model.field?.z > 170 && model.field?.x > 190)) fail('Taipei Dome footprint still uses compact arena proportions',model?.field);

for(const id of ['102','113','124','131','138','139','146','201','213','225','233','238','244','301','309','317','319','326','334','401','409','417','501','508','515']) {
  if(!getVenueSection('taipei-dome',id)) fail('official fixed section missing',id);
}

const p=id=>{
  const s=getVenueSection('taipei-dome',id);
  return venueSectionPosition('taipei-dome',s,Math.min(10,Number(s?.rowMax||10)),15);
};
const home=p('113'), outL=p('138'), outR=p('139'), foulR=p('102'), foulL=p('124');
if(!(home.z>150)) fail('lower bowl no longer reaches the home-plate/infield side',home);
if(!(outL.z<-150 && outR.z<-150)) fail('outfield bowl is not materially deeper than the arena approximation',{outL,outR});
if(!(foulR.x>150 && foulL.x<-150)) fail('foul-side lower bowl anchors are misplaced',{foulR,foulL});
if(Math.abs(Math.abs(outL.x)-Math.abs(outR.x))>8) fail('outfield center pair lost left/right balance',{outL,outR});

for(const id of ['401','409','417','501','508','515']) {
  const q=p(id);
  if(q.z<0) fail('4xx/5xx upper deck incorrectly wrapped into the outfield', {id,q});
}
const lower=getVenueSection('taipei-dome','106');
if(!Number.isFinite(lower?.centerZ)||!Number.isFinite(lower?.depthZ)) fail('asymmetric baseball-bowl geometry metadata missing',lower);

const aespa=getVenueLayout('aespa-complexity-taipei-dome-2026');
if(!aespa || aespa.stage?.runway || aespa.stage?.bStage) fail('aespa official no-runway/no-B-stage guard regressed');
const aespaEffective=effectiveSections('taipei-dome','aespa-complexity-taipei-dome-2026');
for(const id of ['102','113','138','201','238','301','401','508']) if(!aespaEffective.some(s=>String(s.id)===id)) fail('event overlay deleted permanent Taipei Dome structure',id);

const webgl=fs.readFileSync(new URL('../webgl-venue.js',import.meta.url),'utf8');
if(!webgl.includes("model.id==='taipei-dome'")) fail('Taipei Dome dedicated renderer branch missing');
if(!webgl.includes('baseball stadium under a broad arched lattice roof')) fail('Taipei Dome roof/lattice implementation missing');
if(!webgl.includes('centerZ')) fail('renderer does not honor asymmetric section centers');
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
if(/twconcertview|sightlineSourceUrl/.test(app)) fail('internal sightline calibration source leaked into public UI');

if(!ok) process.exit(1);
console.log('Taipei Dome recalibration passed · asymmetric baseball bowl · deeper outfield · infield-only upper decks · arched roof lattice · event overlays preserved');
