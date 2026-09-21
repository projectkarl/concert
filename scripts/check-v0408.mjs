import fs from 'node:fs';
import { MAINSTREAM_3D_VENUE_IDS } from '../data/venues.js';
import { venueModels, kstarExampleForVenue, shouldGenerateEvent3D, ensureVenueModelForEvent, getVenueLayout } from '../data/multi-venue-geometry.js';
import { seedEvents } from '../data/events.js';

let ok=true;
const fail=(m,x='')=>{console.error('FAIL',m,x);ok=false;};
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const api=fs.readFileSync(new URL('../api/events.js',import.meta.url),'utf8');
const resolver=fs.readFileSync(new URL('../api/seat-map-image.js',import.meta.url),'utf8');
const webgl=fs.readFileSync(new URL('../webgl-venue.js',import.meta.url),'utf8');
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));

if(!/^0\.40\.(?:8|9|10)$/.test(pkg.version)) fail('package must retain v0.40.8+ aespa fixes',pkg.version);
if(MAINSTREAM_3D_VENUE_IDS.length!==12) fail('mainstream 3D venue list must be exactly 12',MAINSTREAM_3D_VENUE_IDS.length);
if(new Set(MAINSTREAM_3D_VENUE_IDS).size!==12) fail('mainstream 3D venue ids contain duplicates');
for(const id of MAINSTREAM_3D_VENUE_IDS){
  if(!venueModels[id]) fail(`missing mainstream venue model ${id}`);
  const demo=kstarExampleForVenue(id);
  if(!demo?.kstarExample) fail(`mainstream venue missing Korean-star sample ${id}`,demo?.id);
  if(!demo?.distanceCalibration?.metersPerUnit || !demo?.distanceCalibration?.uncertaintyM) fail(`sample distance calibration missing ${id}`);
}
for(const id of ['tianmu-gymnasium']){
  const e={id:`excluded-${id}`,region:'TW',type:'CONCERT',venueModelId:id,venue:venueModels[id]?.name||id,seatLayoutSourceUrl:'https://static.tixcraft.com/images/activity/field/test.jpg',allowProvisional3D:true};
  if(shouldGenerateEvent3D(e)||ensureVenueModelForEvent(e)) fail(`lower-priority venue still consumes 3D resources: ${id}`);
}
if(!html.includes('<a href="#entertainmentNews">News</a>')) fail('desktop Planner was not replaced by News');
const newsPos=html.indexOf('id="entertainmentNews"'),venuePos=html.indexOf('id="venue3d"'),footerPos=html.indexOf('class="footer"');
if(!(newsPos>venuePos && footerPos>newsPos)) fail('news section must be the last content section before footer',{newsPos,venuePos,footerPos});
if(!/MAINSTREAM_3D_VENUES\.has\(v\.id\)/.test(app)) fail('venue dropdown is not restricted to retained mainstream 12');
if(!/`\$\{x\.label\} · 範例`/.test(app)) fail('sample layouts are not uniformly labeled 範例');
if(!/trustedArchive/.test(app)) fail('trusted archived official-map display path missing');
if(!resolver.includes('news-images.tvbs.com.tw')) fail('archived official seating-image host missing from resolver allowlist');
if(!/verticalSupportTowers!==false/.test(webgl)||!/sideSpeakerArrays!==false/.test(webgl)) fail('event-specific stage rig suppression missing');

const aespa=getVenueLayout('aespa-complexity-taipei-dome-2026');
if(!aespa) fail('aespa Taipei Dome reference missing');
else {
  const ids=(aespa.sections||[]).map(x=>String(x.id));
  const expected=Array.from({length:14},(_,i)=>String(i+1).padStart(3,'0'));
  if(JSON.stringify(ids)!==JSON.stringify(expected)) fail('aespa floor must follow official 001-014 blocks',ids);
  if(aespa.stage?.runway||aespa.stage?.bStage) fail('aespa official map does not support long runway/B-stage',aespa.stage);
  if(aespa.stageRig?.verticalSupportTowers!==false||aespa.stageRig?.sideSpeakerArrays!==false) fail('aespa generic blocking towers/speakers must be disabled',aespa.stageRig);
  if(!aespa.seatMapDisplayUrl?.includes('20260505080706-0466e602.jpeg')) fail('aespa official map display archive missing',aespa.seatMapDisplayUrl);
  if(!aespa.seatMapDisplayTrustedArchive) fail('aespa official map archive not marked trusted');
  if(!aespa.sourceUrl?.includes('livenation.com.tw/aespa-tpe')) fail('aespa official source page missing',aespa.sourceUrl);
  if(aespa.foh?.z>45) fail('aespa FOH remains too far back for official map',aespa.foh);
}
if(!/CALIBRATED_3D_VENUES = new Set\(calibratedVenues\.filter/.test(api)) fail('API 3D readiness is not restricted to mainstream venues');
const excludedSeed=seedEvents.filter(e=>['tianmu-gymnasium'].includes(e.venueModelId));
if(excludedSeed.some(shouldGenerateEvent3D)) fail('excluded seed events still generate 3D',excludedSeed.filter(shouldGenerateEvent3D).map(e=>e.id));

if(!ok) process.exit(1);
console.log('NEUL v0.40.8 checks passed · aespa official 001-014 floor · no invented runway/B-stage · no generic blocking towers · official map preview restored');
