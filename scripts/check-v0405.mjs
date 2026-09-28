import fs from 'node:fs';
import { venueModels, kstarExampleForVenue, getVenueLayout } from '../data/multi-venue-geometry.js';
import { venues } from '../data/venues.js';
import { parseTwConcertViewCalendar } from '../lib/twconcertview-discovery.js';
let ok=true; const fail=(m,x='')=>{console.error('FAIL',m,x);ok=false;};
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const news=fs.readFileSync(new URL('../news.js',import.meta.url),'utf8');
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
if(pkg.version!=='0.40.5') fail('package must be 0.40.5',pkg.version);
const ids=Object.keys(venueModels);
if(ids.length!==13) fail('expected 13 calibrated venue models',ids.length);
for(const id of ids){
  const demo=kstarExampleForVenue(id);
  if(!demo) fail(`${id} missing Korean-star reference`);
  else {
    if(!demo.kstarExample) fail(`${id} reference is not flagged kstarExample`,demo.id);
    if(!demo.demoArtist||!demo.demoDate) fail(`${id} reference metadata incomplete`,demo.id);
    if(!demo.sourceUrl||!demo.sourceName) fail(`${id} reference source missing`,demo.id);
    if(!demo.distanceCalibration?.metersPerUnit||!demo.distanceCalibration?.uncertaintyM) fail(`${id} distance calibration missing`,demo.id);
    if(!Array.isArray(demo.notices)||!demo.notices.length) fail(`${id} accuracy notice missing`,demo.id);
  }
}
if(!/kstarExampleForVenue\(model\.id\)/.test(app)) fail('venue switch does not default to venue reference demo');
if(!/韓星範例/.test(app)||!/IVE 範例/.test(app)) fail('reference dropdown labels missing');
if(!/estimateSeatDistances/.test(app)||!/#previewDistance|previewDistance/.test(app)) fail('distance estimator UI missing');
if(!html.includes('id="sourceInfoModal"')||!html.includes('data-source-event') && !app.includes('data-source-event')) fail('source i modal hooks missing');
if(!/event-source-i/.test(css)||!/source-info-modal/.test(css)) fail('source i modal styling missing');
if(!/官方售票／主辦／場館資料優先/.test(app)||!/twconcertview 僅用於補漏/.test(app)) fail('source hierarchy disclosure missing');
if(!html.includes('href="#entertainmentNews"')||!/新聞/.test(html)) fail('mobile News nav missing');
if(!/newsCategorySelect/.test(news+app+html)||!/value="jp"/.test(html)) fail('Japan news selector missing');
if(!/events-calendar-grid\{grid-template-columns:repeat\(7,minmax\(0,1fr\)\)/.test(css)) fail('mobile seven-column calendar containment missing');
const fixture=`Taiwan Concert Calendar 2026 — 315 upcoming shows\n2026-09-25｜SKE48｜Clapper Studio\n2026-09-26｜藤川千愛｜Zepp New Taipei\n2026-09-26｜TREASURE｜高雄巨蛋`;
const parsed=parseTwConcertViewCalendar(fixture);
if(parsed.events.find(x=>x.artist.includes('SKE48'))?.market!=='JP') fail('SKE48 Japan classification failed');
if(parsed.events.find(x=>x.title.includes('藤川千愛'))?.market!=='JP') fail('Kanji-only known Japanese act classification failed');
if(parsed.events.find(x=>x.title.includes('TREASURE'))?.market!=='KR') fail('Korean act classification failed');
if(venues.some(v=>!v.precisionLevel)) fail('venue precision metadata incomplete');
if(!ok) process.exit(1);
console.log(`NEUL v0.40.5 checks passed · ${ids.length}/${ids.length} venues have K-star reference scenes · source ⓘ · distance ranges · Japan news · mobile calendar/list containment`);
