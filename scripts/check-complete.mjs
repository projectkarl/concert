import fs from 'node:fs';
import {seedEvents} from '../data/events.js';
import {venueModels,ensureVenueModelForEvent,ensureAutoEventLayout,getVenueLayout,baseLayoutIdForVenue,applyAutoSeatMapAnalysis,shouldGenerateEvent3D} from '../data/multi-venue-geometry.js';

let ok=true;
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const discovery=fs.readFileSync(new URL('../lib/taiwan-ticket-platform-discovery.js',import.meta.url),'utf8');
const resolver=fs.readFileSync(new URL('../api/seat-map-image.js',import.meta.url),'utf8');
const officialApi=fs.readFileSync(new URL('../api/official.js',import.meta.url),'utf8');
const geometry=fs.readFileSync(new URL('../data/multi-venue-geometry.js',import.meta.url),'utf8');

function fail(msg,extra){console.error(msg,extra||'');ok=false;}

// Featured: silent 10 second rotation, up to ten active items; no visible AUTO timer label.
if(!/setInterval\(\(\)=>\{ if\(!document\.hidden && featuredEvents\(\)\.length>1\) stepFeatured\(1\); \},10000\)/.test(app)) fail('Featured 10-second silent autoplay missing');
if(!/\.slice\(0, 10\)/.test(app)) fail('Featured pool is not capped at 10');
if(/AUTO\s*10s|featured-auto-status|10秒輪播/.test(html)) fail('Visible Featured auto-timer copy leaked into page');

// Daily calendar coexists with the original full list.
for(const id of ['eventsCalendarPrev','eventsCalendarMonthLabel','eventsCalendarNext','eventsCalendarGrid','eventsAgendaDateLabel','eventsAgendaList','eventsModalList']) if(!html.includes(`id="${id}"`)) fail(`calendar/list hook missing: ${id}`);
if(!/occurrenceDateKeys/.test(app)||!/calendarOccurrences/.test(app)||!/sessions/.test(app)) fail('multi-session daily calendar expansion missing');
if(!html.includes('<strong>全部活動</strong>')) fail('original full event list heading missing');
if(/保留原本清單，可直接往下瀏覽全部活動/.test(html)) fail('forbidden explanatory copy returned');

// Official map belongs below sightline preview explanation, not in a competing side-by-side grid.
const previewCanvasPos=html.indexOf('id="seatPreviewCanvas"');
const previewExplainPos=html.indexOf('視角方向依官方場館資料');
const officialMapPos=html.indexOf('id="officialSeatMapPanel"');
const previewToolsPos=html.indexOf('class="preview-tools"');
if(!(previewCanvasPos>=0 && previewExplainPos>previewCanvasPos && officialMapPos>previewExplainPos && previewToolsPos>officialMapPos)) fail('official map is not directly below preview explanation');
if(!/official-seatmap-below/.test(css)||!/renderOfficialSeatMap/.test(app)||!/isOfficialMapUrl/.test(app)) fail('official-map compare UI / official-source guard missing');
if(/neww\.tw/.test(app)) fail('third-party repost hard-coded into official map renderer');

// IVE sample is dropdown-only.
if(html.includes('id="iveTaipeiDemo"')||html.includes('id="iveDemoBtn"')) fail('IVE standalone demo card/button must stay removed');
if(!/ive-show-what-i-am-2026/.test(app)||!/IVE 範例/.test(app)) fail('IVE dropdown sample missing');

// Current fallback was refreshed with recently confirmed official listings.
const requiredIds=['niel-fearless-taipei-2026','82major-out-of-control-taipei-2026','slowdive-live-taipei-2026','domi-jd-beck-who-asked-taipei-2026','shishi-taste-of-taipei-2026','fireball-fest-taoyuan-2026','music-expo-live-taipei-2026','kpop-prime-linkou-2026','shizuka-kudo-dynamic-taipei-2026','jessica-reflections-taipei-2026','ghibli-original-singers-taipei-2026','eunhyuk-beware-rabbit-taipei-2026','n-flying-con5-kaohsiung-2026','fenix-bbm-fan-concert-2026','xiaoyu-imperfect-person-taipei-2026','kuo-fuhua-original-song-taipei-2026','julia-peng-counting-days-taipei-2026','julia-peng-counting-days-kaohsiung-2026','roselyn-20hz-taipei-2026','the-boyz-westart-taipei-2026','vash-hsu-love-volcano-taipei-2026','jeong-eunji-summer-i-taipei-2026'];
for(const id of requiredIds) if(!seedEvents.some(e=>e.id===id)) fail(`refreshed fallback event missing: ${id}`);
if(seedEvents.length<101) fail('fallback event refresh unexpectedly shrank',seedEvents.length);
if(!/CATEGORY=205&TYPE=1/.test(discovery)||!/CATEGORY=100/.test(discovery)||!/maxDetails:96/.test(discovery)) fail('KHAM concert-category full scan missing');
if(!/rotatingKktixIndexes/.test(discovery)||!/page=\$\{i\+1\}/.test(discovery)||!/promoterDiscovery:true/.test(discovery)) fail('rotating KKTIX/promoter discovery missing');
if(!/extractOfficialTicketLinks/.test(resolver)||!/pageQueue/.test(resolver)||!/sourceRefs/.test(officialApi)) fail('multi-source recursive official seat-map resolver missing');
if(!/Date\.now\(\) - last < 3600000/.test(app)||!/setInterval\(\(\)=>\{ if\(!document\.hidden\) loadEvents/.test(app)) fail('hourly foreground official/event refresh missing');

// Eligible recurring concert venues receive unique event-specific 3D. Temporary outdoor plazas/parks stay in the event list without fabricated seat models.
const layoutIds=new Set(); let dynamicVenues=0,excluded3D=0; const layoutFailures=[];
for(const e of seedEvents){
  const eligible=shouldGenerateEvent3D(e); const venueId=ensureVenueModelForEvent(e); const layoutId=ensureAutoEventLayout(e); const layout=layoutId&&getVenueLayout(layoutId);
  if(!eligible){ excluded3D++; if(venueId||layoutId) layoutFailures.push({id:e.id,reason:'outdoor exclusion failed',venueId,layoutId}); continue; }
  if(String(venueId||'').startsWith('runtime-')) dynamicVenues++;
  if(!venueId||!layoutId||!layout?.stage?.main||layout.eventId!==e.id||layoutId===baseLayoutIdForVenue(venueId)) layoutFailures.push({id:e.id,venueId,layoutId,eventId:layout?.eventId});
  layoutIds.add(layoutId);
}
if(layoutFailures.length) fail('current event-specific 3D failures',layoutFailures.slice(0,10));
const eligibleCount=seedEvents.filter(shouldGenerateEvent3D).length;
if(layoutIds.size!==eligibleCount) fail('eligible current events are sharing event-specific layouts',{eligibleEvents:eligibleCount,layouts:layoutIds.size});
for(const id of ['waterbomb-kaohsiung-2026','kyuhyun-penghu-music-festival-2026']){const e=seedEvents.find(x=>x.id===id);if(!e||shouldGenerateEvent3D(e)||ensureVenueModelForEvent(e)||ensureAutoEventLayout(e))fail(`temporary outdoor 3D was not filtered: ${id}`);}

const future={id:'future-unknown-venue-fixture',artist:'FUTURE STAR',title:'FUTURE STAR 2027 TAIWAN',type:'CONCERT',region:'TW',start:'2027-08-01T19:00:00+08:00',venue:'NEUL Future Special Hall',city:'Taipei',sourceUrl:'https://example.com/official'};
const futureVenue=ensureVenueModelForEvent(future),futureLayoutId=ensureAutoEventLayout(future),futureLayout=getVenueLayout(futureLayoutId);
if(!futureVenue?.startsWith('runtime-')||!futureLayout?.autoGenerated||futureLayout.eventId!==future.id||!futureLayout.stage?.main) fail('future unknown venue/event auto custom 3D failed',{futureVenue,futureLayoutId});

// A seat-map URL alone is pending; OCR/Vision may later upgrade a special central-X stage.
const special={id:'future-special-stage-fixture',artist:'SPECIAL',title:'SPECIAL STAGE',type:'CONCERT',region:'TW',start:'2027-09-01T19:00:00+08:00',venue:'臺北小巨蛋 Taipei Arena',city:'Taipei',seatLayoutSourceUrl:'https://static.tixcraft.com/images/activity/field/future.jpg',sourceUrl:'https://tixcraft.com/activity/detail/future'};
const specialId=ensureAutoEventLayout(special),specialLayout=getVenueLayout(specialId);
if(specialLayout.seatMapDetected||specialLayout.qaGate?.officialMapVerified!==false||!specialLayout.seatMapNeedsRefresh) fail('seat-map URL incorrectly treated as already verified',specialLayout);
const analysis={hash:'future-special-hash',resolvedUrl:special.seatLayoutSourceUrl,profile:'central-x',stage:{main:{x:0,y:-16,z:0,width:44,depth:44,radius:22,shape:'circle'},runway:null,bStage:null,centerStage:true},extraStageRects:[{x:-30,y:-15,z:-30,width:10,depth:60,ry:-.785},{x:30,y:-15,z:-30,width:10,depth:60,ry:.785},{x:-30,y:-15,z:30,width:10,depth:60,ry:.785},{x:30,y:-15,z:30,width:10,depth:60,ry:-.785}],stageConfidence:.94,sections:[{id:'A',tier:'FLOOR',group:'A',cx:-20,cy:0,w:18,h:20},{id:'B',tier:'FLOOR',group:'B',cx:0,cy:0,w:18,h:20},{id:'C',tier:'FLOOR',group:'C',cx:20,cy:0,w:18,h:20}],tiers:[{id:'FLOOR',label:'FLOOR',short:'F',sections:['A','B','C']}],ocr:{engine:'fixture',text:'A B C',tokens:[],mapped:[{section:'A',x:.3,y:.6},{section:'B',x:.5,y:.6},{section:'C',x:.7,y:.6}],mappedCount:3},legend:[],confidence:'fixture'};
if(!applyAutoSeatMapAnalysis(specialId,analysis,{geometry:true,replaceSections:true})) fail('special-stage seat-map analysis did not apply');
const upgraded=getVenueLayout(specialId);
if(upgraded.generationState!=='official-map-verified'||upgraded.autoMapProfile!=='central-x'||upgraded.extraStageRects?.length!==4||upgraded.qaGate?.officialMapVerified!==true) fail('special stage did not auto-upgrade after QA',upgraded);

if(!/#b8c0c7|#d9dde1/.test(fs.readFileSync(new URL('../webgl-venue.js',import.meta.url),'utf8'))) fail('light venue floor regression');

if(!ok) process.exit(1);
console.log(`NEUL v0.40.2 complete checks passed · ${seedEvents.length} refreshed fallback events · ${layoutIds.size}/${eligibleCount} eligible custom 3D · ${excluded3D} temporary outdoor exclusions · ${dynamicVenues} runtime venue fallbacks · silent Featured 10s · daily calendar + full list · official map below preview · future special-stage auto-upgrade`);
