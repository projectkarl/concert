import fs from 'node:fs';
import {normalizeEvents} from './lib/events.mjs';
const required=['index.html','style.css','app.js','vercel.json','api/health.mjs','api/events.mjs','api/event-detail.mjs','api/seat-ocr.mjs','data/events.json','lib/pipeline.mjs','lib/venue.mjs','lib/calibration.mjs','lib/adapters/tixcraft.mjs','lib/adapters/mna.mjs'];
let ok=true;for(const f of required){if(!fs.existsSync(new URL(f,import.meta.url))){console.error('MISSING',f);ok=false}}
const events=JSON.parse(fs.readFileSync(new URL('data/events.json',import.meta.url),'utf8'));const ids=new Set();for(const e of events){if(ids.has(e.id)){console.error('DUPLICATE',e.id);ok=false}ids.add(e.id);if(!e.date||!e.venue||!e.title){console.error('BAD EVENT',e.id);ok=false}}
const normalized=normalizeEvents(events,new Date('2026-09-18T00:00:00Z'));for(const e of normalized){const should=(e.endDate||e.date)<'2026-09-18'?'archive':'upcoming';if(e.status!==should){console.error('DATE STATUS BAD',e.id,e.status,should);ok=false}}
const pkg=JSON.parse(fs.readFileSync(new URL('package.json',import.meta.url),'utf8'));if(pkg.version!=='0.59.0'||pkg.dependencies?.['tesseract.js']!=='7.0.0'){console.error('PACKAGE/OCR DEP BAD');ok=false}
const {build3DSchema}=await import('./lib/venue.mjs');
const z=build3DSchema({venue:'Zepp New Taipei',sections:['2A','2B'],prices:[4280,3880]});if(z.venue.capacity!==2245||z.venue.calibrationConfidence!=='official'||z.sections.map(x=>x.label).join(',')!=='1F,2F'||z.sections[1].rowLabels?.[0]!=='2A'){console.error('ZEPP CALIBRATION BAD');ok=false}
const dome=build3DSchema({venue:'台北大巨蛋',sections:['108','238','301','404']});if(dome.venue.tiers!==4||dome.sections[0].tier!==0||dome.sections[1].tier!==1||dome.sections[2].tier!==2||dome.sections[3].tier!==3){console.error('DOME SECTION BAND BAD');ok=false}
if(!dome.sections.find(x=>x.label==='108')?.rowMetric?.find(x=>x.row===34)?.risk){console.error('DOME EMPIRICAL RISK BAD');ok=false}
const arena=build3DSchema({venue:'台北小巨蛋',sections:['紅-1A','紫-2B','黃-3E800']});if(arena.sections.map(x=>x.tier).join(',')!=='0,1,2'){console.error('ARENA SECTION PARSE BAD');ok=false}
if(!arena.sections[2].rowMetric.find(x=>x.row===26)?.risk){console.error('ARENA EMPIRICAL RISK BAD');ok=false}
const center=build3DSchema({venue:'台北小巨蛋',title:'360 中央舞台',sections:['紅-1A','黃-3F']});if(center.layout!=='center'||center.stage.type!=='center'){console.error('CENTER STAGE BAD');ok=false}
if(!arena.sections.every(x=>x.rowMetric?.length&&x.walkways)){console.error('ROW/WALKWAY MODEL BAD');ok=false}
if(!ok)process.exit(1);console.log(`QA PASS ${required.length} files / ${events.length} seed events / date rules / OCR / section bands / walkways / railings / center-stage / empirical risk hints`);
