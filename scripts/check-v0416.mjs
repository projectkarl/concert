import fs from 'node:fs';
import { buildTwConcertViewRollingMonthUrls, parseTwConcertViewCalendar, discoverTwConcertViewCalendar } from '../lib/twconcertview-discovery.js';
import { mergeAndDedupe } from '../api/events.js';

let ok=true; const fail=(m,x='')=>{console.error('FAIL',m,x);ok=false;};
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const api=fs.readFileSync(new URL('../api/events.js',import.meta.url),'utf8');
const refresh=fs.readFileSync(new URL('../api/refresh.js',import.meta.url),'utf8');
if(!['0.40.16','0.40.17'].includes(pkg.version)) fail('package version',pkg.version);

const sample=`2026 台灣演唱會行事曆 近期 317 場演出\n2026-09-26｜TREASURE｜高雄巨蛋\n2026-09-26｜TREASURE｜高雄巨蛋\n2026-09-27｜Ozone｜WESTAR`;
const parsed=parseTwConcertViewCalendar(sample);
if(parsed.referenceCount!==317||parsed.parsedCount!==2||parsed.rawOccurrenceCount!==3) fail('reference queue occurrence semantics broken',parsed);
const treasure=parsed.events.find(x=>x.artist.includes('TREASURE'));
if(!treasure?.referenceOnly||treasure.referenceOccurrenceCount!==2||treasure.statusLabel!=='參考收錄 · 待官方覆核') fail('reference-only event flags broken',treasure);

const rolling=buildTwConcertViewRollingMonthUrls(new Date('2026-09-23T12:00:00+08:00'),'zh',6);
if(rolling.length!==6||rolling.some(x=>x.includes('/en/calendar'))) fail('serverless rolling zh batch broken',rolling);

const promoted=mergeAndDedupe([], [
  treasure,
  {id:'official-treasure',artist:'TREASURE',title:'TREASURE 2026 TOUR',region:'TW',market:'KR',city:'Kaohsiung',venue:'高雄巨蛋',start:'2026-09-26T19:00:00+08:00',sourceName:'tixCraft',sourceUrl:'https://tixcraft.com/activity/detail/example',verified:true,ticketing:'tixCraft'}
]);
if(promoted.length!==1||promoted[0].referenceOnly||!promoted[0].verified) fail('official source did not promote reference queue row',promoted);
if(!(promoted[0].sourceRefs||[]).some(ref=>/twconcertview/i.test(`${ref?.name||''} ${ref?.url||''}`))) fail('reference provenance lost after promotion',promoted[0]);

if(!/參考待核對/.test(app)||!/(?:參考補漏|待官方覆核)/.test(app)||!/coverageReferenceQueuePending/.test(app)) fail('reference queue UI missing');
if(!/coverageReferenceQueuePromoted/.test(api)||!/referenceQueuePromoted/.test(api)||!/liveShowingParsed/.test(api)) fail('reference queue API telemetry / unit fix missing');
if(!/pendingOfficialVerification/.test(refresh)||!/promotedByOfficialMatch/.test(refresh)) fail('refresh telemetry missing');

// A thin root must stay bounded: one zh root + six rolling zh month pages. English monthly pages are
// fallback only if every zh monthly request fails.
const oldFetch=globalThis.fetch; const called=[];
globalThis.fetch=async url=>{called.push(String(url));const u=String(url);let body='';
  if(u==='https://twconcertview.com/calendar') body='近期 20 場演出\n2026-09-24｜A｜Legacy Taipei';
  else if(u.includes('twconcertview.com/calendar?')) { const m=(u.match(/[?&]m=(\d+)/)||[])[1]||'0',y=(u.match(/[?&]y=(\d+)/)||[])[1]||'2026'; body=`近期 20 場演出\n${y}-${String(Number(m)+1).padStart(2,'0')}-01｜ZH${y}${m}｜Legacy Taipei`; }
  else body='20 upcoming shows';
  return {ok:true,url:u,async text(){return body;}};
};
try{
  const d=await discoverTwConcertViewCalendar();
  if(d.zhMonthPages!==6) fail('rolling zh pages must be bounded to six',d);
  if(d.enFallbackPages!==0) fail('english month pages should not run when zh pages respond',d);
  if(called.length>7) fail('reference crawl exceeded serverless request budget',called);
} finally { globalThis.fetch=oldFetch; }

if(!ok)process.exit(1);
console.log('NEUL v0.40.16 checks passed · twconcertview reference queue · occurrence-aware count · bounded rolling crawl · official-source promotion');
