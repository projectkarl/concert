import fs from 'node:fs';
import { MAINSTREAM_3D_VENUE_IDS } from '../data/venues.js';
import { venueModels, kstarExampleForVenue, shouldGenerateEvent3D, ensureVenueModelForEvent } from '../data/multi-venue-geometry.js';
import { seedEvents } from '../data/events.js';

let ok=true;
const fail=(m,x='')=>{console.error('FAIL',m,x);ok=false;};
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const api=fs.readFileSync(new URL('../api/events.js',import.meta.url),'utf8');
const resolver=fs.readFileSync(new URL('../api/seat-map-image.js',import.meta.url),'utf8');
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));

if(pkg.version!=='0.40.7') fail('package must be 0.40.7',pkg.version);
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
if(html.includes('href="#planner">Planner</a>')||html.includes('id="planner"')) fail('legacy Planner anchor still present');
const newsPos=html.indexOf('id="entertainmentNews"');
const venuePos=html.indexOf('id="venue3d"');
const footerPos=html.indexOf('class="footer"');
if(!(newsPos>venuePos && footerPos>newsPos)) fail('news section must be the last content section before footer',{newsPos,venuePos,footerPos});
if(!/MAINSTREAM_3D_VENUES\.has\(v\.id\)/.test(app)) fail('venue dropdown is not restricted to retained mainstream 12');
if(!/`\$\{x\.label\} · 範例`/.test(app)) fail('sample layouts are not uniformly labeled 範例');
if(!/reference:\$\{layout\.id\}/.test(app) || !/layout\.kstarExample/.test(app)) fail('reference layout official-map fallback missing');
if(!/venueId:layout\.venueId/.test(app) || !/event:event\.title/.test(app)) fail('official map resolver hints missing from frontend');
for(const host of ['farglorydome.com.tw','ntsu.edu.tw','ticc.com.tw','tainex.com.tw','zepp.co.jp','kcg.gov.tw','kph.tw','tycg.gov.tw','ntu.edu.tw']) if(!resolver.includes(host)) fail(`official seat-map allowlist missing ${host}`);
if(!/CALIBRATED_3D_VENUES = new Set\(calibratedVenues\.filter/.test(api)) fail('API 3D readiness is not restricted to mainstream venues');
if(!/const renderable3D = Boolean\(event\.venueModelId && CALIBRATED_3D_VENUES\.has\(event\.venueModelId\)\)/.test(api)) fail('API still marks excluded hardcoded layouts as 3D-ready');
const excludedSeed=seedEvents.filter(e=>['tianmu-gymnasium'].includes(e.venueModelId));
if(excludedSeed.some(shouldGenerateEvent3D)) fail('excluded seed events still generate 3D',excludedSeed.filter(shouldGenerateEvent3D).map(e=>e.id));

if(!ok) process.exit(1);
console.log(`NEUL v0.40.7 checks passed · 12 retained 3D venues · News bottom nav/section · uniform 範例 labels · reference official-map preview · lower-priority 3D disabled`);
