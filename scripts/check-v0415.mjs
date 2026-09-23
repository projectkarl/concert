import fs from 'node:fs';
import { buildTwConcertViewCalendarUrls, parseTwConcertViewCalendar, discoverTwConcertViewCalendar } from '../lib/twconcertview-discovery.js';
let ok=true; const fail=(m,x='')=>{console.error('FAIL',m,x);ok=false;};
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const api=fs.readFileSync(new URL('../api/events.js',import.meta.url),'utf8');
const seatApi=fs.readFileSync(new URL('../api/seat-map-image.js',import.meta.url),'utf8');
if(!['0.40.15','0.40.16','0.40.17'].includes(pkg.version)) fail('package version must preserve v0.40.15+',pkg.version);
const zh=buildTwConcertViewCalendarUrls(new Date('2026-09-23T12:00:00+08:00'),0,2,'zh');
const en=buildTwConcertViewCalendarUrls(new Date('2026-09-23T12:00:00+08:00'),0,2,'en');
if(!zh.every(x=>x.includes('twconcertview.com/calendar'))||zh.some(x=>x.includes('/en/calendar'))) fail('zh month sweep path wrong',zh);
if(!en.every(x=>x.includes('/en/calendar'))) fail('en fallback month path wrong',en);
const sample=`2026 台灣演唱會行事曆 近期 317 場演出\n2026-09-26｜TREASURE｜高雄巨蛋\n2026-09-26｜TREASURE｜高雄巨蛋\n2026-09-27｜Ozone｜WESTAR`;
const parsed=parseTwConcertViewCalendar(sample);
if(parsed.referenceCount!==317||parsed.parsedCount!==2) fail('reference/showing vs unique-event semantics broken',parsed);
if(!/(繁中主來源|Traditional-Chinese root|rolling reconciliation)/.test(fs.readFileSync(new URL('../lib/twconcertview-discovery.js',import.meta.url),'utf8'))) fail('zh-first reference recovery wording missing');
if(!/台灣活動 \$\{list\.length\} 筆/.test(app)||!/場次參考/.test(app)) fail('UI count units not separated');
if(!/opportunisticOfficialBackfill/.test(api)||!/slice\(0,8\)/.test(api)) fail('dynamic official backfill missing');
if(!/req\.query\?\.fallback/.test(seatApi)||!/for\(const candidate of/.test(seatApi)) fail('seat-map multi-source fallback missing');

// Mock the upstream calendar: a thin root must trigger zh month pages first; once zh reaches 90%,
// English month pages must not be fetched.
const oldFetch=globalThis.fetch; const called=[];
globalThis.fetch=async url=>{called.push(String(url)); const u=String(url); let body='';
  if(u==='https://twconcertview.com/calendar') body='近期 10 場演出\\n2026-09-24｜A｜Legacy Taipei';
  else if(u==='https://twconcertview.com/en/calendar') body='10 upcoming shows\\n2026-09-25｜B｜Clapper Studio';
  else if(u.includes('twconcertview.com/calendar?')) { const m=(u.match(/[?&]m=(\\d+)/)||[])[1]||'0', y=(u.match(/[?&]y=(\\d+)/)||[])[1]||'2026'; body=`近期 10 場演出\\n${y}-${String(Number(m)+1).padStart(2,'0')}-01｜ZH${y}${m}｜Legacy Taipei`; }
  else body='10 upcoming shows';
  return {ok:true,url:u,async text(){return body;}};
};
try{const d=await discoverTwConcertViewCalendar(); if(!d.zhMonthPages) fail('zh month fallback did not run',d); if(d.enFallbackPages!==0) fail('english fallback ran despite complete zh sweep',d); if(called.some(x=>x.includes('/en/calendar?'))) fail('english month request should be skipped',called);}finally{globalThis.fetch=oldFetch;}
if(!ok)process.exit(1);
console.log('NEUL v0.40.15 compatibility checks passed · zh-first coverage recovery · count-unit split · dynamic official backfill · multi-source seat-map fallback');
