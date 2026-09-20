const normalize=v=>String(v||'').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g,' ').trim();
const day=iso=>{try{return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(iso));}catch{return''}};
const venue=v=>normalize(v).replace(/臺/g,'台').replace(/taipei|new taipei|kaohsiung|arena|center|hall/g,' ').replace(/\s+/g,' ').trim();
const identity=e=>normalize(`${e.artist||''} ${e.title||''}`).replace(/\b(world|asia|tour|concert|live|taipei|taiwan|2026|2027|in|the)\b/g,' ').replace(/\s+/g,' ').trim();
function sourceFamily(ref={}){const s=`${ref.name||''} ${ref.url||''}`.toLowerCase();if(/tixcraft|kktix|ticketplus|kham|ibon|famiticket|udnfunlife|ticket\.mna|ticket\.com\.tw|tixfun|opentix|fansi|indievox|tickets\.books/.test(s))return'ticket';if(/場館|arena|ticc|tmc|zepp|music center|流行音樂中心|海音館|live warehouse|kpmc|calendar|schedule/.test(s))return'venue';if(/livenation|live nation|主辦/.test(s))return'promoter';if(/weverse|ygfamily|jype|smtown|artist|藝人官方/.test(s))return'artist';return'other';}
function refs(e={}){const list=[...(e.sourceRefs||[])];if(e.sourceUrl)list.push({name:e.sourceName,url:e.sourceUrl});return list.filter(x=>x?.url);}
function likelySame(a,b){if(day(a.start)!==day(b.start))return false;if(venue(a.venue)!==venue(b.venue))return false;const ia=identity(a),ib=identity(b);if(!ia||!ib)return false;if(ia.includes(ib)||ib.includes(ia))return true;const A=new Set(ia.split(' ').filter(x=>x.length>1)),B=new Set(ib.split(' ').filter(x=>x.length>1));let n=0;for(const x of A)if(B.has(x))n++;return n/Math.max(1,Math.min(A.size,B.size))>=.45;}
export function auditCoverage({events=[],rawDiscovered=[],sourceHealth=[]}={}){
  const now=Date.now(),future=events.filter(e=>new Date(e.end||e.start||0).getTime()>=now-86400000);
  const rows=future.map(e=>{const families=[...new Set(refs(e).map(sourceFamily))];return{id:e.id,artist:e.artist,title:e.title,start:e.start,venue:e.venue,sourceFamilies:families,sourceCount:refs(e).length,hasTicket:families.includes('ticket'),hasVenue:families.includes('venue'),hasPromoter:families.includes('promoter'),hasArtist:families.includes('artist'),seatMap:Boolean(e.seatLayoutSourceUrl),priceMap:Boolean(e.sectionPriceRules?.length)};});
  const eventFamilies=e=>[...new Set(refs(e).map(sourceFamily).concat(sourceFamily({name:e.sourceName,url:e.sourceUrl})))];
  const venueCandidates=rawDiscovered.filter(e=>eventFamilies(e).includes('venue'));
  const independentCandidates=rawDiscovered.filter(e=>!eventFamilies(e).includes('venue'));
  // A coverage gap means an independent official venue calendar sees the event but ticket/promoter/
  // artist discovery did not. The event is still merged into the public feed as a safe backfill.
  const gaps=venueCandidates.filter(v=>!independentCandidates.some(e=>likelySame(e,v))).map(v=>({artist:v.artist,title:v.title,start:v.start,venue:v.venue,sourceName:v.sourceName,sourceUrl:v.sourceUrl,reason:'venue-calendar-only-backfilled',backfilled:true}));
  const single=rows.filter(r=>r.sourceCount<2);
  const missingTicket=rows.filter(r=>r.hasVenue&&!r.hasTicket);
  const noSeatMap=rows.filter(r=>!r.seatMap);
  const noPriceMap=rows.filter(r=>!r.priceMap);
  const unhealthy=sourceHealth.filter(s=>Number(s.discovered||0)===0||Number(s.errors||0)>0||Number(s.pageErrors||0)>0);
  return {generatedAt:new Date().toISOString(),futureEvents:rows.length,crossVerified:rows.filter(r=>r.sourceFamilies.length>=2).length,singleSource:single.length,venueOnlyNeedsTicketBackfill:missingTicket.length,officialSeatMapMissing:noSeatMap.length,sectionPriceMapMissing:noPriceMap.length,detectedCoverageGaps:gaps.length,sourceHealthWarnings:unhealthy.length,gaps:gaps.slice(0,80),needsTicketBackfill:missingTicket.slice(0,80),unhealthySources:unhealthy.slice(0,80),note:'Coverage auditor uses independent official venue calendars to detect events that ticket-platform discovery may have missed. A zero-gap result improves confidence but is not an absolute guarantee that every Taiwan performance has been announced publicly.'};
}
