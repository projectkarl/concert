import fs from 'node:fs';
import path from 'node:path';
import { seedEvents } from '../data/events.js';
import { venueModels } from '../data/multi-venue-geometry.js';

const root=process.cwd();
let ok=true;
const pass=m=>console.log('PASS',m);
const fail=(m,v)=>{console.error('FAIL',m,v??'');ok=false};

const requiredEvents=[
  'f-forever-stellar-city-taipei-dome-2026',
  'hwang-min-hyun-peach-blossom-taipei-2026',
  'diana-krall-taipei-2026',
  'k21-kao-inc-21st-taipei-2026',
  'maggie-chiang-zepp-2-taipei-2026',
  'misogi-zepp-new-taipei-2026',
  'persona-live-tour-resonance-taipei-2026',
  'open-dream-world-music-festival-kaohsiung-2026'
];
const ids=new Set(seedEvents.map(e=>e.id));
const missing=requiredEvents.filter(id=>!ids.has(id));
missing.length?fail('2026-09-30 official event refresh',missing):pass('2026-09-30 official event refresh');

const open=seedEvents.find(e=>e.id==='open-dream-world-music-festival-kaohsiung-2026');
(open && !open.venueModelId)?pass('outdoor Dream World fixed-venue 3D blocked'):fail('outdoor Dream World must not use fixed venue 3D',open);

const kmc=venueModels['kaohsiung-music-center'];
const kmcNamed=(kmc?.sections||[]).filter(s=>['3B','3C-1','3C-2','3D'].includes(String(s.id)));
(kmcNamed.length===4 && kmcNamed.every(s=>s.tier==='2F' && s.officialFloor==='2F'))
  ? pass('KMC 3B/3C/3D physical 2F mapping')
  : fail('KMC 3B/3C/3D mapping',kmcNamed);

const zepp=venueModels['zepp-new-taipei'];
(/zepp\.co\.jp/.test(String(zepp?.sourceUrl||'')))?pass('Zepp official floor-guide metadata'):fail('Zepp official source missing',zepp?.sourceUrl);

const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
(/cf-v1\.4\.2-seatmap-lastgood/.test(sw))?pass('service worker cache version bumped'):fail('service worker cache version');
const worker=fs.readFileSync(path.join(root,'cloudflare/worker.js'),'utf8');
(/1\.4\.2-seatmap-lastgood-autogen/.test(worker))?pass('Cloudflare worker v1.4.2 runtime'):fail('worker release version');
const seat=fs.readFileSync(path.join(root,'seat-map-intelligence.js'),'utf8');
(seat.includes('livenationinternational\\.com') && seat.includes('weverse\\.io') && seat.includes('ticc\\.com\\.tw'))
  ? pass('browser official-map host expansion')
  : fail('official-map browser allowlist');


const worker142=fs.readFileSync(path.join(root,'cloudflare/worker.js'),'utf8');
(worker142.includes('SEAT_BIN') && worker142.includes('kv-last-good-stale') && worker142.includes("/api/seat-map-status") && worker142.includes('SEATMAP_REVALIDATE_SECONDS'))
  ? pass('seat-map persistent last-good binary cache + status endpoint')
  : fail('seat-map last-good cache/status missing');
const seat142=fs.readFileSync(path.join(root,'seat-map-intelligence.js'),'utf8');
(seat142.includes("eventId:String(event.id||'')") && seat142.includes("X-NEUL-SeatMap-Stale") && seat142.includes("X-NEUL-SeatMap-Fetched-At"))
  ? pass('browser seat-map event cache identity + stale metadata')
  : fail('browser seat-map v1.4.2 metadata wiring');
const geom142=fs.readFileSync(path.join(root,'data/multi-venue-geometry.js'),'utf8');
(geom142.includes('cf-v1.4.2-seatmap-lastgood') && geom142.includes('seatHash:event.seatMapHash') && geom142.includes('seatHashChanged'))
  ? pass('3D generation signature tracks official-map hash changes')
  : fail('3D seat-map hash invalidation wiring');

if(!ok) process.exit(1);
console.log(`NEUL Cloudflare v1.4.2 release gate PASS · events=${seedEvents.length}`);
