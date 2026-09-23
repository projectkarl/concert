import fs from 'node:fs';
import { parseTwConcertViewCalendar } from '../lib/twconcertview-discovery.js';
import { venues, VENUE_CROSSCHECK_REFERENCES } from '../data/venues.js';

let ok=true; const fail=(m,x='')=>{console.error('FAIL',m,x);ok=false;};
const api=fs.readFileSync(new URL('../api/events.js',import.meta.url),'utf8');
const auditor=fs.readFileSync(new URL('../lib/coverage-auditor.js',import.meta.url),'utf8');
const geometry=fs.readFileSync(new URL('../data/multi-venue-geometry.js',import.meta.url),'utf8');
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
if(!/^0\.40\.(4|5|6|7|8|9|10|11|13|14|15|16)$/.test(pkg.version)) fail('package version',pkg.version);
if(!api.includes('discoverTwConcertViewCalendar()')) fail('twconcertview coverage discovery not integrated into /api/events');
if(!api.includes('twconcertview-crosscheck')) fail('upstream crosscheck marker missing');
if(!api.includes('CALIBRATED_3D_VENUES.has(event.venueModelId)')) fail('3D eligibility is not restricted to calibrated venue models');
if(!auditor.includes("return'coverage-reference'")) fail('coverage reference family missing');
if(!auditor.includes('coverageReferenceUnmatchedEvents')) fail('coverage-only gap output missing');
const fixture=`Taiwan Concert Calendar 2026 — 315 upcoming shows\n2026-09-25｜SKE48｜Clapper Studio\n2026-09-25｜SKE48｜Clapper Studio\n2026-09-26｜藤川千愛｜Zepp New Taipei\n2026-09-26｜TREASURE｜高雄巨蛋`;
const parsed=parseTwConcertViewCalendar(fixture);
if(parsed.referenceCount!==315 || parsed.parsedCount!==3) fail('twconcertview parser/dedupe',parsed);
const ske=parsed.events.find(e=>e.artist.includes('SKE48'));
if(ske?.market!=='TW' && ske?.market!=='JP') fail('market parser returned unexpected class',ske?.market);
const fujii=parsed.events.find(e=>e.title.includes('藤川'));
if(fujii?.market!=='JP') fail('Japanese kana/term market classification failed',fujii?.market);
if(venues.length!==13) fail('calibrated venue metadata must match 13 renderer models',venues.length);
for(const id of ['taipei-dome','taipei-arena','ntsu-arena','kaohsiung-arena','taipei-music-center','ticc','kaohsiung-music-center','kaohsiung-stadium','taoyuan-arena','ntu-sports-center','tianmu-gymnasium','nangang-exhibition-hall1-4f','zepp-new-taipei']){
  const v=venues.find(x=>x.id===id); if(!v) fail(`missing venue metadata ${id}`); else if(!v.precisionLevel) fail(`missing precision level ${id}`);
}
if(Object.keys(VENUE_CROSSCHECK_REFERENCES).length<12) fail('twconcertview venue cross-check refs incomplete');
const ticc=venues.find(v=>v.id==='ticc');
if(!/2MF/.test(ticc?.precisionNote||'')) fail('TICC precision note does not preserve 2MF topology');
if(!/audienceFloor1:false/.test(geometry) || !/allowedTierIds:\['2MF','3F','4F','5F','6F','BOX'\]/.test(geometry)) fail('TICC topology guard lost');
if(!/0\.40\.(4-precision-guard\.1|5-kstar-reference\.1|6-mainstream10-official-preview\.1|7-mainstream12-official-preview\.1|8-mainstream12-aespa-official\.1|9-mainstream12-full-coverage\.1|10-mainstream12-3dprecision\.1)/.test(geometry)) fail('3D pipeline version not bumped');
if(!ok) process.exit(1);
console.log(`NEUL v0.40.4 checks passed · ${parsed.referenceCount} reference shows fixture · ${venues.length} calibrated venue metadata rows · community sightlines are cross-check only`);
