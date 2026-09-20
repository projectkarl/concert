import {getVenueCalibration} from './calibration.mjs';

export function venueTemplate(name=''){
  const c=getVenueCalibration(name); if(c)return structuredClone(c.venue);
  if(/國立體育大學|林口體育館/.test(name))return {kind:'arena',capacity:15000,tiers:3,radius:8.5,rows:16,shape:'rounded-rect'};
  if(/音樂廳|歌劇院|衛武營/.test(name))return {kind:'hall',capacity:2000,tiers:3,radius:6.5,rows:12,shape:'fan'};
  if(/流行音樂中心/.test(name))return {kind:'arena',capacity:5000,tiers:3,radius:7.1,rows:12,shape:'fan'};
  return {kind:'generic',capacity:4000,tiers:2,radius:7,rows:11,shape:'fan'};
}
function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
function inferLayout(event={}){const s=`${event.seatMapMode||''} ${event.title||''}`.toLowerCase();if(/360|center|central|中央舞台|四面台/.test(s))return'center';if(/thrust|延伸|伸展/.test(s))return'thrust';return'end'}
function parseSection(label='',cal){
  const s=String(label).trim().toUpperCase();
  if(cal?.id==='taipei-dome'){
    const m=s.match(/\b([1-4]\d{2})\b/);if(m){const n=+m[1],tier=Math.floor(n/100)-1;return{tier:clamp(tier,0,3),number:n,kind:'numbered'}}
  }
  if(cal?.id==='taipei-arena'){
    const m=s.match(/(?:紅|紫|黃|藍)?[-\s]?([123][A-I])(?:800)?/i);if(m){return{tier:+m[1][0]-1,code:m[1],kind:'arena-code'}}
    const n=s.match(/\b([1-4]\d{2})\b/);if(n){const x=+n[1];return{tier:x>=300?2:x>=200?1:0,number:x,kind:'numbered'}}
    if(/800/.test(s))return{tier:2,code:'800',kind:'upper'};
  }
  return null;
}
function inferTier(label,i,total,tiers,cal){const p=parseSection(label,cal);if(p)return clamp(p.tier,0,tiers-1);const s=String(label||'').toUpperCase();const m=s.match(/(?:^|\D)([1-4])(?:F|樓|層|[A-Z])/);if(m)return clamp(+m[1]-1,0,tiers-1);return clamp(Math.floor((i/Math.max(1,total))*tiers),0,tiers-1)}
function seatRangeFor(kind,tier,rowCount){const perRow=kind==='dome'?(tier?28:24):kind==='arena'?(tier===2?24:tier?22:20):kind==='club'?(tier?38:38):16;return{firstRow:1,lastRow:rowCount,seatsPerRow:perRow,seatStart:1,seatEnd:perRow}}
function sectionAngle(i,n,kind,layout){if(layout==='center')return(i/Math.max(1,n))*Math.PI*2;const coverage=kind==='dome'?Math.PI*1.82:kind==='arena'?Math.PI*1.74:kind==='club'?Math.PI*1.42:Math.PI*1.62;return(i/Math.max(1,n-1))*coverage+(Math.PI-coverage)/2}
function numberedAngle(label,cal,layout){const p=parseSection(label,cal);if(!p?.number)return null;const n=p.number%100;const max=cal?.id==='taipei-dome'?48:24;const frac=(n-1)/Math.max(1,max-1);if(layout==='center')return frac*Math.PI*2;return frac*Math.PI*1.78+Math.PI*.11}
function empiricalRisk(label,row,cal){for(const r of cal?.empiricalRisks||[]){if(!r.match.test(String(label)))continue;if(r.rowMin&&row<r.rowMin)continue;if(r.rowMax&&row>r.rowMax)continue;return{risk:r.risk,type:r.type,note:r.note,source:cal.empiricalSource,estimated:false}}return null}
function estimateSightline(section,stage,cal,row=1,layout='end'){
  const target=layout==='center'?{x:0,z:0,y:stage?.y??.6}:{x:0,z:stage?.z??-6,y:stage?.y??.6};const dx=section.x-target.x,dz=section.z-target.z;const distance=Math.sqrt(dx*dx+dz*dz);const rowRise=section.rowRise||cal?.sightline?.rowRise||.18;const eye=(section.y||0)+Math.max(0,row-1)*rowRise+(cal?.sightline?.eyeHeight||1.18);const pitch=Math.atan2((target.y+1.2)-eye,distance)*180/Math.PI;const side=layout==='center'?0:Math.abs(Math.atan2(dx,Math.abs(dz))*180/Math.PI);let quality='good';if(side>62||distance>22)quality='limited';else if(side>42||distance>15)quality='side';let obstructionRisk=side>68?'high':side>52?'medium':'low';const empirical=empiricalRisk(section.label,row,cal);if(empirical&&({low:1,medium:2,high:3}[empirical.risk]>{low:1,medium:2,high:3}[obstructionRisk]))obstructionRisk=empirical.risk;return{distanceM:+(distance*2.15).toFixed(1),viewAngleDeg:+side.toFixed(1),pitchDeg:+pitch.toFixed(1),quality,obstructionRisk,empirical,estimated:true}}
function walkwayOffset(row,walkways=[],tier=0){let extra=0;for(const w of walkways){if(w.tier===tier&&row>w.afterRow)extra+=w.width||.32}return extra}
function tokenLabels(raw,cal,v){if(cal?.seatPattern&&raw.length&&raw.filter(x=>/^[12][A-W]$/i.test(String(x))).length>=Math.ceil(raw.length*.6))return cal.seatPattern.zones;if(raw.length)return raw;const count=v.kind==='dome'?36:v.kind==='arena'?24:v.kind==='club'?10:v.kind==='hall'?14:10;return Array.from({length:count},(_,i)=>`S${i+1}`)}
export function build3DSchema(event){
  const cal=getVenueCalibration(event.venue);const v=venueTemplate(event.venue);const raw=(event.sections||[]).slice(0,64);const layout=inferLayout(event);const labels=tokenLabels(raw,cal,v);const zeppRows=cal?.seatPattern&&labels.join(',')===cal.seatPattern.zones.join(',');
  const stageBase=layout==='center'?{type:'center',width:7.8,depth:7.8,y:cal?.stage?.y||.6,z:0}:{type:layout==='thrust'?'thrust':event.stage||'end',width:cal?.stage?.width||(v.kind==='dome'?10:8),depth:cal?.stage?.depth||(layout==='thrust'?8:4),y:cal?.stage?.y||.6,z:-6};
  const tierDefs=cal?.tiers||Array.from({length:v.tiers},(_,tier)=>({tier,name:`L${tier+1}`,elevation:.35+tier*1.9,rowCount:Math.max(7,v.rows-tier*2),rowRise:.14+tier*.02}));
  const sectionModels=labels.map((label,i,arr)=>{const tier=inferTier(label,i,arr.length,v.tiers,cal);const td=tierDefs[tier]||tierDefs.at(-1);let t=numberedAngle(label,cal,layout);if(t==null)t=sectionAngle(i,arr.length,v.kind,layout);const r=v.radius+(tier*.85);const x=Math.cos(t)*r;const z=Math.sin(t)*r-(layout==='center'?0:1.1);let rowLabels=null;if(cal?.seatPattern&&label==='1F')rowLabels=cal.seatPattern.zone1Rows;if(cal?.seatPattern&&label==='2F')rowLabels=cal.seatPattern.zone2Rows;const rowCount=rowLabels?.length||Math.max(5,td?.rowCount||Math.round(v.rows-tier*2));const range=seatRangeFor(v.kind,tier,rowCount);if(rowLabels)range.seatEnd=label==='1F'?cal.seatPattern.zone1SeatEnd:cal.seatPattern.zone2SeatEnd;const y=td?.elevation??(.35+tier*1.8);const s={label,x:+x.toFixed(2),y:+y.toFixed(2),z:+z.toFixed(2),angleRad:+t.toFixed(4),tier,tierName:td?.name||`L${tier+1}`,rowCount,rowLabels,rowRise:td?.rowRise||cal?.sightline?.rowRise||.18,walkways:(cal?.walkways||[]).filter(w=>w.tier===tier),...range,price:event.prices?.length?event.prices[i%event.prices.length]:null};s.sightline=estimateSightline(s,stageBase,cal,1,layout);s.rowMetric=Array.from({length:Math.min(rowCount,40)},(_,ix)=>({row:ix+1,depth:+(((ix)*.19)+walkwayOffset(ix+1,cal?.walkways,tier)).toFixed(2),rise:+((ix)*s.rowRise).toFixed(2),risk:empiricalRisk(label,ix+1,cal)}));return s});
  return{venue:{...v,calibrationId:cal?.id||null,calibrationConfidence:cal?.confidence||'model',calibrationSource:cal?.source||null,empiricalSource:cal?.empiricalSource||null,calibrationNotes:cal?.notes||null},stage:stageBase,floor:{light:true},walkways:cal?.walkways||[],sections:sectionModels,sourceSections:raw,mode:event.seatMapMode||`${layout}-stage`,layout,sightlineModel:{eyeHeight:cal?.sightline?.eyeHeight||1.18,rowRise:cal?.sightline?.rowRise||.18,units:'model-space scaled to approximate metres'},precision:{section:zeppRows?'venue-zone':raw.length?'source-derived':'model',row:zeppRows?'official-basic-pattern':cal?.id==='taipei-arena'||cal?.id==='taipei-dome'?'venue-tier+empirical-risk':'estimated',seat:zeppRows?'official-basic-pattern':'estimated',stage:layout==='center'?'event-layout-derived':event.stage?'event-derived':'model'},tokenSemantics:{zeppRowsDetected:!!zeppRows,rawTokens:raw},riskMethod:'geometry estimate + venue empirical hints where cited'}
}
