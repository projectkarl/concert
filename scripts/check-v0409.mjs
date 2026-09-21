import fs from 'node:fs';
import { buildTwConcertViewCalendarUrls, parseTwConcertViewCalendar } from '../lib/twconcertview-discovery.js';
import { mergeAndDedupe } from '../api/events.js';
import { getVenueLayout } from '../data/multi-venue-geometry.js';

let ok=true;
const fail=(m,x='')=>{console.error('FAIL',m,x);ok=false;};
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const api=fs.readFileSync(new URL('../api/events.js',import.meta.url),'utf8');
const twcv=fs.readFileSync(new URL('../lib/twconcertview-discovery.js',import.meta.url),'utf8');

if(!['0.40.9','0.40.10','0.40.11'].includes(pkg.version)) fail('package must preserve v0.40.9+ coverage behavior',pkg.version);
const urls=buildTwConcertViewCalendarUrls(new Date('2026-09-21T12:00:00+08:00'),1,18);
if(urls.length<20) fail('twconcertview month scan too shallow',urls.length);
if(!urls.some(x=>/m=8&y=2026/.test(x))||!urls.some(x=>/m=9&y=2026/.test(x))) fail('month scan does not include Sep/Oct 2026',urls);

const sep=`Taiwan Concert Calendar 2026 — 315 upcoming shows\n2026-09-22｜BEAST IN BLACK｜MOONDOG\n2026-09-25｜SKE48｜Clapper Studio\n2026-09-26｜TREASURE｜高雄巨蛋`;
const oct=`Taiwan Concert Calendar 2026 — 315 upcoming shows\n2026-10-03｜2026 PLAVE World Tour｜高雄巨蛋\n2026-10-09｜2026 izna Concert Tour｜Zepp New Taipei\n2026-10-10｜QWER 2nd TOUR｜國立體育大學綜合體育館`;
const p1=parseTwConcertViewCalendar(sep,{sourceUrl:'https://twconcertview.com/en/calendar?m=8&y=2026'});
const p2=parseTwConcertViewCalendar(oct,{sourceUrl:'https://twconcertview.com/en/calendar?m=9&y=2026'});
if(p1.referenceCount!==315||p1.parsedCount!==3) fail('September parser coverage mismatch',p1);
if(p2.referenceCount!==315||p2.parsedCount!==3) fail('October parser coverage mismatch',p2);
if(!p2.events.some(e=>e.artist.includes('izna')&&e.venueModelId==='zepp-new-taipei')) fail('October new event parse missing',p2.events);

const merged=mergeAndDedupe([], [
  {id:'show',artist:'LANY',title:'LANY soft world tour',region:'TW',city:'Taipei',venue:'台北小巨蛋',start:'2026-09-26T19:00:00+08:00',sourceName:'tixCraft',sourceUrl:'https://tixcraft.com/activity/detail/26_lany'},
  {id:'bus',artist:'Post Malone',title:'歌迷返鄉專車 x Post Malone',region:'TW',city:'Kaohsiung',venue:'指定搭車點',start:'2026-09-19T12:00:00+08:00',sourceName:'tixCraft',sourceUrl:'https://tixcraft.com/activity/detail/bus'}
]);
if(merged.length!==1||merged[0].id!=='show') fail('non-performance ticket product filter failed',merged);

if(!/coverageReferenceCount/.test(app)||!/coverageReferenceParsedCount/.test(app)||!/補漏對帳/.test(app)) fail('event list coverage status missing');
if(!/coverageReferenceMonthsScanned/.test(api)||!/coverageReferenceSuccessfulPages/.test(api)) fail('API month-scan health fields missing');
if(!/buildTwConcertViewCalendarUrls/.test(twcv)||!/completeAgainstReference/.test(twcv)) fail('twconcertview full coverage scan logic missing');

const aespa=getVenueLayout('aespa-complexity-taipei-dome-2026');
if(!aespa) fail('aespa layout missing');
else {
  if(aespa.stage?.runway||aespa.stage?.bStage) fail('aespa still has unverified runway/B-stage');
  if(aespa.stageRig?.verticalSupportTowers!==false||aespa.stageRig?.sideSpeakerArrays!==false) fail('aespa unverified obstruction towers still enabled');
  if((aespa.sections||[]).length!==14) fail('aespa official 001-014 floor blocks incomplete',aespa.sections?.length);
}

if(!ok) process.exit(1);
console.log('NEUL v0.40.9 checks passed · multi-month concert coverage scan · coverage reconciliation · non-show filtering · aespa official geometry guard');
