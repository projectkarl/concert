import fs from 'node:fs';
import crypto from 'node:crypto';
import { seedEvents } from '../data/events.js';
import { getVenueLayout } from '../data/multi-venue-geometry.js';

let ok=true; const fail=(m,x)=>{console.error(m,x||'');ok=false;};
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const webgl=fs.readFileSync(new URL('../webgl-venue.js',import.meta.url),'utf8');

for(const id of ['allEventsClose','eventsCalendarGrid','eventsModalList','eventsAgendaList']) if(!html.includes(`id="${id}"`)) fail(`missing UX hook: ${id}`);
if(!html.includes('data-events-view="list"')||!html.includes('data-events-view="calendar"')) fail('list/calendar switch missing');
if(!/for\(let i=0;i<42;i\+\+\)/.test(app)||!/events-calendar-day.*outside/.test(app)) fail('standard 6-week calendar grid missing');
if(!/position:sticky;z-index:30;top:0/.test(css)) fail('modal close is not sticky at top');
if(!/1015 - \(Date\.now\(\) % 1000\)/.test(app)||!/setTimeout\(tick, delay\)/.test(app)) fail('drift-corrected countdown scheduler missing');
if(!/positionSelectedZoneOverlay/.test(app)||!/zone\.style\.left/.test(app)||!/venueSectionPosition/.test(app)) fail('moving selected-zone overlay missing');
if(!/transition:left \.24s ease,top \.24s ease/.test(css)) fail('selected-zone movement styling missing');
if(!/Cross aisle surface/.test(webgl)||!/Selected zone uses a simple chair silhouette/.test(webgl)||!/walkway/.test(webgl)) fail('concrete aisle/chair WebGL pass missing');
if(!/Canvas fallback: keep the selected area readable with chair-like marks and visible aisles/.test(app)) fail('Canvas chair/aisle fallback missing');
if(!/ive-show-what-i-am-2026/.test(app)||!/· 範例/.test(app)) fail('venue reference dropdown example missing');
const ive=getVenueLayout('ive-show-what-i-am-2026');
if(!ive||ive.venueId!=='taipei-arena'||!ive.historical) fail('IVE example layout not preserved as Taipei Arena historical sample',ive);
if(seedEvents.length<101) fail('fallback coverage shrank',seedEvents.length);
if(!/setInterval\(\(\)=>\{ if\(!document\.hidden && featuredEvents\(\)\.length>1\) stepFeatured\(1\); \},10000\)/.test(app)) fail('Featured 10s autoplay regression');
if(/AUTO\s*10s|featured-auto-status|10秒輪播/.test(html)) fail('visible Featured autoplay text returned');

if(!ok) process.exit(1);
console.log(`NEUL UX checks passed · ${seedEvents.length} fallback events · list/calendar switch · standard 42-cell calendar · sticky close · aligned countdown · moving 3D zone label · visible aisles/chairs · IVE dropdown sample`);
