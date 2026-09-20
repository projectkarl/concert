import {
  ensureAutoEventLayout,
  ensureVenueModelForEvent,
  getVenueLayout,
  applyAutoSeatMapAnalysis
} from '../data/multi-venue-geometry.js';

let ok=true;
const assert=(cond,msg,extra=null)=>{if(!cond){console.error(msg,extra||'');ok=false;}};

const futureA={
  id:'future-auto-test-a', artist:'Future Artist A', title:'Future Artist A Taiwan Concert',
  type:'CONCERT', region:'TW', start:'2027-08-01T19:00:00+08:00',
  venue:'臺北小巨蛋 Taipei Arena', city:'Taipei', sourceUrl:'https://example.com/future-a',
  price:'依官方公告', sectionPriceRules:[]
};
const venueA=ensureVenueModelForEvent(futureA);
const layoutAId=ensureAutoEventLayout(futureA);
const layoutA=getVenueLayout(layoutAId);
assert(Boolean(venueA),'known venue should resolve');
assert(/^auto-/.test(layoutAId),'future event must get a unique auto layout',layoutAId);
assert(layoutA?.eventId===futureA.id,'auto layout must belong to future event',layoutA);
assert(layoutA?.generationState==='ticket-source-pending-seat-map','initial future event should enter pending seat-map state',layoutA?.generationState);
assert(layoutA?.qaGate?.requiresReview===true,'draft future event must require QA');
assert(layoutA?.autoPipelineVersion==='0.40.9','future event should use current pipeline version');

const futureB={...futureA,id:'future-auto-test-b',artist:'Future Artist B',title:'Future Artist B Taiwan Concert'};
const layoutBId=ensureAutoEventLayout(futureB);
assert(layoutBId!==layoutAId,'different future events at same venue must not share event layouts',{layoutAId,layoutBId});

const officialUpdate={
  ...futureA,
  seatLayoutSourceUrl:'https://static.tixcraft.com/images/activity/field/future-a-seatmap.jpg',
  price:'VIP NT$6,800 / 一般 NT$5,800',
  sectionPriceRules:[{label:'VIP A',price:'NT$6,800'},{label:'紅2B',price:'NT$5,800'}],
  checkedAt:'2027-01-01T01:00:00.000Z'
};
const updatedId=ensureAutoEventLayout(officialUpdate);
const pending=getVenueLayout(updatedId);
assert(updatedId===layoutAId,'official update must upgrade same event layout rather than create a second layout');
assert(pending?.generationState==='official-map-pending','new official map should queue OCR/Vision QA',pending?.generationState);
assert(pending?.seatMapNeedsRefresh===true,'new official map should require refresh');
assert(pending?.verifiedAgainstCurrentSource===false,'new source must not inherit old verification');
assert((pending?.sectionPriceRules||[]).length===2,'new official price rules should sync into event layout');

const fakeAnalysis={
  hash:'future-map-hash-v1', resolvedUrl:officialUpdate.seatLayoutSourceUrl,
  profile:'end-stage', stage:{main:{x:0,y:-16,z:-90,width:80,depth:25},runway:null,bStage:null},
  extraStageRects:[], stageConfidence:.91, confidence:'ocr-section-mapped', legendConfidence:'ocr-swatch-mapped',
  sections:[
    {id:'紅2B',label:'紅2B',tier:'2F',shape:'block',x:-50,z:0,y:-19,width:30,depth:20,group:'紅2B',ocrDerived:true,autoPrice:'NT$5,800'},
    {id:'紅2C',label:'紅2C',tier:'2F',shape:'block',x:0,z:0,y:-19,width:30,depth:20,group:'紅2C',ocrDerived:true},
    {id:'紅2D',label:'紅2D',tier:'2F',shape:'block',x:50,z:0,y:-19,width:30,depth:20,group:'紅2D',ocrDerived:true}
  ],
  tiers:[{id:'2F',label:'2F',short:'2F',sections:['紅2B','紅2C','紅2D']}],
  legend:[{price:'NT$5,800',rgb:[1,2,3]}],
  ocr:{engine:'tesseract-eng+chi_tra',mappedCount:3,mapped:[{token:'紅2B',section:'紅2B'}],tokens:[]}
};
assert(applyAutoSeatMapAnalysis(layoutAId,fakeAnalysis,{geometry:true,replaceSections:true})===true,'official map analysis should apply');
const verified=getVenueLayout(layoutAId);
assert(verified?.generationState==='official-map-verified','QA-passing official map should promote event 3D',verified?.generationState);
assert(verified?.qaGate?.officialMapVerified===true,'official map verification flag should be true');
assert(verified?.qaGate?.priceMappingVerified===true,'mapped official price should be verified');
assert(verified?.seatMapNeedsRefresh===false && verified?.verifiedAgainstCurrentSource===true,'verified map should clear refresh state');

const changedMap={...officialUpdate,seatLayoutSourceUrl:'https://static.tixcraft.com/images/activity/field/future-a-seatmap-v2.jpg',checkedAt:'2027-01-02T01:00:00.000Z'};
ensureAutoEventLayout(changedMap);
const stale=getVenueLayout(layoutAId);
assert(stale?.generationState==='official-map-pending','changed official map must demote prior verification until re-QA',stale?.generationState);
assert(stale?.qaGate?.officialMapVerified===false && stale?.qaGate?.requiresReview===true,'changed official map must require fresh QA');
assert(stale?.seatMapNeedsRefresh===true && stale?.verifiedAgainstCurrentSource===false,'changed map must be marked stale');

const unknown={id:'future-new-venue-test',artist:'New Venue Artist',title:'First Event at Brand New Hall',type:'CONCERT',region:'TW',start:'2027-09-01T19:30:00+08:00',venue:'Brand New Taiwan Music Hall',city:'Taipei',sourceUrl:'https://example.com/new-hall'};
const unknownVenue=ensureVenueModelForEvent(unknown);
const unknownLayout=ensureAutoEventLayout(unknown);
assert(/^runtime-/.test(unknownVenue),'unknown future venue must get runtime physical venue model',unknownVenue);
assert(/^auto-/.test(unknownLayout),'unknown venue event must still get event-specific 3D layout',unknownLayout);
assert(getVenueLayout(unknownLayout)?.eventId===unknown.id,'unknown venue event-specific layout must belong to event');

if(!ok) process.exit(1);
console.log('Future-event automatic custom 3D pipeline PASS');
console.log(JSON.stringify({knownVenue:venueA,layoutA:layoutAId,layoutB:layoutBId,unknownVenue,unknownLayout,state:getVenueLayout(unknownLayout)?.generationState},null,2));
