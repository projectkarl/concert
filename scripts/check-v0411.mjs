import fs from 'node:fs';
import { MAINSTREAM_3D_VENUE_IDS } from '../data/venues.js';
import { getVenueSection, venueSectionPosition, getVenueLayout } from '../data/multi-venue-geometry.js';

const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
let ok=true; const fail=(m,x='')=>{console.error('FAIL',m,x);ok=false;};
if(!['0.40.10','0.40.11','0.40.13','0.40.14'].includes(pkg.version)) fail('package must preserve v0.40.10+ 3D behavior',pkg.version);
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const webgl=fs.readFileSync(new URL('../webgl-venue.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const enh=fs.readFileSync(new URL('../enhancements.js',import.meta.url),'utf8');
const geom=fs.readFileSync(new URL('../data/multi-venue-geometry.js',import.meta.url),'utf8');

if(MAINSTREAM_3D_VENUE_IDS.length!==12) fail('retained 3D venue count must stay 12',MAINSTREAM_3D_VENUE_IDS.length);
for(const id of ['venueOverviewCanvas','seatPreviewCanvas','venueCanvas']) if(!html.includes(`id="${id}"`)) fail('3D canvas missing',id);
if(!/createVenueWebGL/.test(app)||!/getContext\('webgl2'/.test(webgl)||!/class Renderer/.test(webgl)) fail('native WebGL2 renderer missing');
if(!/canvas\.addEventListener\("pointerdown"/.test(app)||!/canvas\.addEventListener\("pointermove"/.test(app)||!/canvas\.addEventListener\("wheel"/.test(app)||!/activePointers/.test(app)||!/pinchDistance/.test(app)) fail('3D rotate/zoom/pinch controls regressed');
if(!/nearestPointOnRectXZ/.test(app)||!/stageReferencePoints/.test(app)||!/主舞台最近/.test(app)||!/uncertaintyM/.test(app)) fail('stage-edge meter distance model missing');
if(!/stageViewingAngle/.test(app)||!/elevationDeg/.test(app)) fail('view-angle/elevation metrics missing');
if(!/occluderSightlineImpact/.test(app)||!/已避開已知遮擋/.test(app)||!/遮擋：/.test(app)) fail('line-of-sight obstruction model missing');
if(!/async function offlineState\(\)/.test(enh)) fail('offline-state console error guard missing');
if(!/3dprecision/.test(geom)) fail('3D pipeline version was not bumped');

const dome=getVenueSection('taipei-dome','106');
if(dome){
  const a=venueSectionPosition('taipei-dome',dome,18,1), b=venueSectionPosition('taipei-dome',dome,18,30);
  if(Math.hypot(a.x-b.x,a.z-b.z)<0.25) fail('seat number no longer changes lateral camera position',{a,b});
}else fail('Taipei Dome section 106 missing');
const aespa=getVenueLayout('aespa-complexity-taipei-dome-2026');
if(!aespa||aespa.stage?.runway||aespa.stage?.bStage||aespa.stageRig?.verticalSupportTowers!==false) fail('aespa official geometry guard regressed');

if(!ok) process.exit(1);
console.log('NEUL 3D precision/non-regression checks passed · WebGL2 canvases · rotate/zoom/pinch · seat-number parallax · stage-edge distance · view angle/elevation · LOS obstruction');
