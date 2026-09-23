import { taipeiDomeSections, taipeiDomeTiers, taipeiDomeBase, strayKidsRunItLayout, getTaipeiDomeSection, sectionPosition as domeSectionPosition, sectionWarning as domeSectionWarning } from './taipei-dome-geometry.js';
import { MAINSTREAM_3D_VENUE_IDS } from './venues.js';

const TAU = Math.PI * 2;
const pad = (n, width=3) => String(n).padStart(width, '0');

function arcGroup(ids, tier, rx, rz, y, startAngle, endAngle) {
  const count = ids.length;
  const span = count > 1 ? Math.abs(endAngle - startAngle) / (count - 1) : .24;
  return ids.map((id, i) => {
    const t = count <= 1 ? .5 : i / (count - 1);
    return { id: String(id), tier, angle: startAngle + (endAngle - startAngle) * t, radiusX: rx, radiusZ: rz, y, span: Math.min(.32, span * .82) };
  });
}

function ring(ids, tier, rx, rz, y, offset=-Math.PI/2) {
  const step = TAU / ids.length;
  return ids.map((id, i) => ({ id:String(id), tier, angle:offset + i*step, radiusX:rx, radiusZ:rz, y, span:step*.76 }));
}

function arenaColorSections(prefix, tier, rx, rz, y, angles, letters=['A','B','C','D','E']) {
  return arcGroup(letters.map(x => `${prefix}${tier}${x}`), `${tier}F`, rx, rz, y, angles[0], angles[1]);
}

function structuralBlock(id,tier,x,z,width=30,depth=24,group='structural'){ return {id,tier,x,z,y:-19,width,depth,shape:'block',group}; }

// Taipei Arena: official sightline guide exposes Red/Purple/Yellow/Blue 2F zones and Yellow 3F A-J.
const taipeiArena2 = [
  ...arenaColorSections('紅',2,174,126,18,[-.92,.22]),
  ...arenaColorSections('黃',2,174,126,18,[.45,2.69]),
  ...arenaColorSections('紫',2,174,126,18,[2.92,4.06]),
  ...arenaColorSections('藍',2,174,126,18,[4.32,5.10])
].map(s=>({...s,rowMin:1,rowMax:15,seatEstimateMax:28,depthX:24,depthZ:18,rise:12,rowCurve:1.04,rowRangeConfidence:'public-seat-records',seatRangeConfidence:'row-dependent'}));
// Complete 3F bowl. Earlier builds only drew the yellow/rear arc, which made
// auto-generated Taipei Arena events look like a partial venue. Keep all four
// colour families in the structural model; event layouts may mark only the sold
// ticket areas, but the physical bowl remains visible in True3D.
const taipeiArena3 = [
  ...arcGroup(['紅3A','紅3B','紅3C','紅3D','紅3E','紅3F','紅3G','紅3H','紅3I','紅3J'], '3F', 210,154,54,-1.10,.18),
  ...arcGroup(['黃3A','黃3B','黃3C','黃3D','黃3E','黃3F','黃3G','黃3H','黃3I','黃3J'], '3F', 210,154,54,.22,2.92),
  ...arcGroup(['紫3A','紫3B','紫3C','紫3D','紫3E','紫3F','紫3G','紫3H','紫3I','紫3J'], '3F', 210,154,54,2.96,4.24),
  ...arcGroup(['藍3A','藍3B','藍3C','藍3D','藍3E','藍3F','藍3G','藍3H','藍3I','藍3J'], '3F', 210,154,54,4.28,5.58)
].map(s=>({...s,rowMin:1,rowMax:30,seatEstimateMax:30,depthX:32,depthZ:25,rise:17,rowCurve:1.08,rowRangeConfidence:'venue-structural-model'}));
// B1 is not a fixed-seat tier. Taipei Arena's official venue information states that
// the basement main floor is configurable by the promoter and that the venue also has
// 2,486 retractable seats. Earlier NEUL builds only rendered the 2F/3F fixed bowl, so
// auto-generated shows looked physically incomplete. The blocks below are a neutral
// structural visualization of the retractable/configurable B1 seating envelope — NOT
// event ticket zones. Event-specific official floor maps can override/add their own blocks.
const structuralArenaBlock=(id,x,z,width,depth)=>({id,tier:'B1',x,z,y:-19,width,depth,shape:'block',group:'structural-b1'});
const taipeiArenaB1 = [
  structuralArenaBlock('B1西伸縮A',-92,-30,28,58),
  structuralArenaBlock('B1西伸縮B',-92,35,28,54),
  structuralArenaBlock('B1東伸縮A',92,-30,28,58),
  structuralArenaBlock('B1東伸縮B',92,35,28,54),
  structuralArenaBlock('B1南伸縮',0,77,82,22)
].map(s=>({...s,label:`${s.id}（依活動配置）`,rowMin:1,rowMax:18,seatEstimateMax:24,rise:5,structuralOnly:true,eventFlexible:true,rowRangeConfidence:'venue-capacity-envelope',seatRangeConfidence:'not-a-ticket-zone'}));
const taipeiArenaSections = [...taipeiArenaB1, ...taipeiArena2, ...taipeiArena3];
const taipeiArenaTiers = [
  {id:'B1', label:'B1 伸縮／活動席（依場次配置）', short:'B1', sections:taipeiArenaB1.map(x=>x.id)},
  {id:'2F', label:'二樓固定席', short:'2F', sections:taipeiArena2.map(x=>x.id)},
  {id:'3F', label:'三樓固定席', short:'3F', sections:taipeiArena3.map(x=>x.id)}
];

// NTSU Arena base geometry: official floor plan uses Yellow/Green/Orange/Blue quadrants and middle/upper fixed seating.
// NTSU / Linkou fixed bowl. The official venue map splits each colour family into named
// sub-sections. The base 3D keeps one geometry segment per physical family for performance,
// but retains the official sub-section names/capacities as metadata so event seat-map mapping
// can resolve the real ticket labels instead of inventing generic ones.
const ntsuMiddleMeta = {
  '黃4中':{officialSubsections:['黃4中-2','黃4中-1'],officialSeatCapacity:262},
  '黃2中':{officialSubsections:['黃2中-1','黃2中-2'],officialSeatCapacity:450},
  '黃1中':{officialSubsections:['黃1中-1','黃1中-2'],officialSeatCapacity:450},
  '黃3中':{officialSubsections:['黃3中-1','黃3中-2'],officialSeatCapacity:262},
  '綠5中':{officialSubsections:['綠5中'],officialSeatCapacity:120},
  '綠4中':{officialSubsections:['綠4中-1','綠4中-2'],officialSeatCapacity:236},
  '綠3中':{officialSubsections:['綠3中-1','綠3中-2'],officialSeatCapacity:250},
  '綠2中':{officialSubsections:['綠2中-1','綠2中-2'],officialSeatCapacity:229},
  '綠1中':{officialSubsections:['綠1中-1','綠1中-2'],officialSeatCapacity:240},
  '藍5中':{officialSubsections:['藍5中-2','藍5中-1'],officialSeatCapacity:240},
  '藍4中':{officialSubsections:['藍4中-2','藍4中-1'],officialSeatCapacity:204},
  '藍3中':{officialSubsections:['藍3中-2','藍3中-1'],officialSeatCapacity:318},
  '藍2中':{officialSubsections:['藍2中-2','藍2中-1'],officialSeatCapacity:235},
  '藍1中':{officialSubsections:['藍1中-2','藍1中-1'],officialSeatCapacity:240}
};
const ntsuUpperMeta = {
  '黃4上':{officialSubsections:['黃4上-1','黃4上-2'],officialSeatCapacity:509},
  '黃2上':{officialSubsections:['黃2上-1','黃2上-2'],officialSeatCapacity:591},
  '黃1上':{officialSubsections:['黃1上-1','黃1上-2'],officialSeatCapacity:602},
  '黃3上':{officialSubsections:['黃3上-1','黃3上-2'],officialSeatCapacity:394},
  '綠5上':{officialSubsections:['綠5上-1','綠5上-2'],officialSeatCapacity:186},
  '綠4上':{officialSubsections:['綠4上-1','綠4上-2'],officialSeatCapacity:101},
  '綠3上':{officialSubsections:['綠3上-2','綠3上-1'],officialSeatCapacity:195},
  '綠2上':{officialSubsections:['綠2上-2','綠2上-1'],officialSeatCapacity:101},
  '綠1上':{officialSubsections:['綠1上-2','綠1上-1'],officialSeatCapacity:186},
  '藍5上':{officialSubsections:['藍5上-3','藍5上-2','藍5上-1'],officialSeatCapacity:376},
  '藍4上':{officialSubsections:['藍4上-2','藍4上-1'],officialSeatCapacity:99},
  '藍3上':{officialSubsections:['藍3上-2','藍3上-1'],officialSeatCapacity:99},
  '藍2上':{officialSubsections:['藍2上-2','藍2上-1'],officialSeatCapacity:126},
  '藍1上':{officialSubsections:['藍1上-2','藍1上-1'],officialSeatCapacity:281}
};
const ntsuMiddle = [
  ...arcGroup(['黃4中','黃2中','黃1中','黃3中'], 'MIDDLE', 170,126,18,-2.48,-.66),
  ...arcGroup(['綠5中','綠4中','綠3中','綠2中','綠1中'], 'MIDDLE', 170,126,18,-.48,.92),
  ...arcGroup(['橙4中','橙2中','橙1中','橙3中'], 'MIDDLE', 170,126,18,1.12,2.10),
  ...arcGroup(['藍1中','藍2中','藍3中','藍4中','藍5中'], 'MIDDLE', 170,126,18,2.32,3.62)
].map(s=>({...s,...(ntsuMiddleMeta[s.id]||{}),officialAggregate:true}));
const ntsuUpper = [
  ...arcGroup(['黃4上','黃2上','黃1上','黃3上'], 'UPPER', 216,160,57,-2.48,-.66),
  ...arcGroup(['綠5上','綠4上','綠3上','綠2上','綠1上'], 'UPPER', 216,160,57,-.48,.92),
  ...arcGroup(['橙4上','橙2上','橙1上','橙3上'], 'UPPER', 216,160,57,1.12,2.10),
  ...arcGroup(['藍1上','藍2上','藍3上','藍4上','藍5上'], 'UPPER', 216,160,57,2.32,3.62)
].map(s=>({...s,...(ntsuUpperMeta[s.id]||{}),officialAggregate:true}));
const ntsuMiddleCal = ntsuMiddle.map(s=>({...s,rowMin:1,rowMax:15,rowDirection:'reverse',depthX:32,depthZ:24,rise:13,rowCurve:1.08,rowRangeConfidence:'official-bowl-band'}));
const ntsuUpperCal = ntsuUpper.map(s=>({...s,rowMin:0,rowMax:16,depthX:40,depthZ:30,rise:19,rowCurve:1.10,rowRangeConfidence:'official-bowl-band'}));
// Official venue documentation marks the inner red areas as activity seating rather than
// permanent fixed ticket sections. Keep the physical lower-bowl volume but use explicit
// STRUCT ids so the UI never presents fabricated permanent ticket-zone labels.
const ntsuLowerFamilies = [
  ...arcGroup(['STRUCT-LOWER-Y1','STRUCT-LOWER-Y2','STRUCT-LOWER-Y3'],'LOWER',132,98,-5,-2.40,-.72).map(s=>({...s,sideLabel:'黃色側'})),
  ...arcGroup(['STRUCT-LOWER-G1','STRUCT-LOWER-G2','STRUCT-LOWER-G3'],'LOWER',132,98,-5,-.48,.88).map(s=>({...s,sideLabel:'綠色側'})),
  ...arcGroup(['STRUCT-LOWER-O1','STRUCT-LOWER-O2','STRUCT-LOWER-O3'],'LOWER',132,98,-5,1.10,2.08).map(s=>({...s,sideLabel:'橙色側'})),
  ...arcGroup(['STRUCT-LOWER-B1','STRUCT-LOWER-B2','STRUCT-LOWER-B3'],'LOWER',132,98,-5,2.30,3.58).map(s=>({...s,sideLabel:'藍色側'}))
];
const ntsuLower = ntsuLowerFamilies.map((s,i)=>({...s,rowMin:1,rowMax:12,depthX:22,depthZ:17,rise:8,rowCurve:1.04,structuralOnly:true,eventFlexible:true,nonTicketZone:true,rowRangeConfidence:'activity-seat-envelope',label:`${s.sideLabel}下層活動席結構 ${i%3+1}（依活動配置）`}));
const ntsuFloor = [
  structuralBlock('1F平面A','FLOOR',-50,8,31,70,'floor'), structuralBlock('1F平面B','FLOOR',-17,8,31,70,'floor'),
  structuralBlock('1F平面C','FLOOR',17,8,31,70,'floor'), structuralBlock('1F平面D','FLOOR',50,8,31,70,'floor')
].map(s=>({...s,rowMin:1,rowMax:36,depthZ:34,rise:2,rowCurve:1.02,structuralOnly:true,eventFlexible:true,label:`${s.id}（依活動排椅）`}));
const ntsuSections = [...ntsuFloor,...ntsuLower,...ntsuMiddleCal,...ntsuUpperCal];
const ntsuTiers = [
  {id:'FLOOR',label:'1F 活動平面席（依場次配置）',short:'1F平面',sections:ntsuFloor.map(x=>x.id)},
  {id:'LOWER',label:'1F 階梯／活動席（依場次配置）',short:'1F下層',sections:ntsuLower.map(x=>x.id)},
  {id:'MIDDLE',label:'中層固定席',short:'中層',sections:ntsuMiddleCal.map(x=>x.id)},
  {id:'UPPER',label:'上層固定席',short:'上層',sections:ntsuUpperCal.map(x=>x.id)}
];

// PLAVE official tixCraft map: event-specific ticket blocks reconstructed from the published seating chart.
const block = (id, tier, x, z, width=30, depth=24, group='standard') => ({ id, tier, x, z, y:-19, width, depth, shape:'block', group });
const plaveVip = [
  block('VIP A','VIP',-54,-58,48,48,'vip6300'), block('VIP B','VIP',0,-58,48,48,'vip6300'), block('VIP C','VIP',54,-58,48,48,'vip6300'),
  block('VIP D','VIP',-54,-5,48,48,'vip6300'), block('VIP E','VIP',0,-5,48,48,'vip6300'), block('VIP F','VIP',54,-5,48,48,'vip6300')
];
const plaveLeft = arcGroup(['Y1B-1','Y2B-2','Y2B-1','Y4B-2','Y4B-1','B5B-3','B5B-2','B5B-1','B4B-2'], 'BOWL', 154,116,18,3.86,2.34).map(s=>({...s,group:'5300'}));
const plaveLeftOuter = arcGroup(['Y2A-2','Y2A-1','Y4A-2','Y4A-1','B5A-3','B5A-2','B5A-1','B4A-2','B4A-1'], 'BOWL', 194,148,43,3.88,2.28).map(s=>({...s,group:'3800'}));
const plaveRight = arcGroup(['O1B-2','O2B-1','O2B-2','O4B-1','O4B-2','B1B-1','B1B-2','B2B-1'], 'BOWL', 154,116,18,-.72,.84).map(s=>({...s,group:'5300'}));
const plaveRightOuter = arcGroup(['O2A-1','O2A-2','O4A-2','O4A-1','B1A-1','B1A-2','B2A-1','B2A-2'], 'BOWL', 194,148,43,-.74,.88).map(s=>({...s,group:'3800'}));
const plaveRear = arcGroup(['B3A-1','B3B-1','B3B-2','B3A-2','B4A-2R','B4B-2R'], 'REAR', 174,130,28,.98,2.16).map((s,i)=>({...s,group:i<4?'vip6300':'3800'}));
const plaveSections = [...plaveVip,...plaveLeft,...plaveLeftOuter,...plaveRight,...plaveRightOuter,...plaveRear];
const plaveTiers = [
  {id:'VIP',label:'1F / VIP 劃位席',short:'VIP',sections:plaveVip.map(x=>x.id)},
  {id:'BOWL',label:'看台票區',short:'看台',sections:[...plaveLeft,...plaveLeftOuter,...plaveRight,...plaveRightOuter].map(x=>x.id)},
  {id:'REAR',label:'FOH 後方票區',short:'後方',sections:plaveRear.map(x=>x.id)}
];
const plavePriceLabels = {
  vip6300:'NT$6,300', '5300':'NT$5,300', '3800':'NT$3,800', '2900':'NT$2,900'
};

// LE SSERAFIM 2026 PUREFLOW — official tixCraft seating-map reconstruction.
// The official map clearly separates 1F VIP A/B/C standing zones, a long center runway,
// a polygonal center performance platform, FOH, inner 2F B blocks and outer 3F A blocks.
// Do not substitute the generic NTSU floor blocks for this event.
const lsfVip = [
  {...block('VIP A','VIP',-50,-55,38,70,'6980'),standingOnly:true,rowMin:1,rowMax:1,label:'VIP A · 1F站席'},
  {...block('VIP B','VIP', 50,-55,38,70,'6980'),standingOnly:true,rowMin:1,rowMax:1,label:'VIP B · 1F站席'},
  {...block('VIP C','VIP',  0, 22,108,28,'6980'),standingOnly:true,rowMin:1,rowMax:1,label:'VIP C · 1F站席'}
];
const lsfInnerLeftIds=['黃1B-2','黃1B-1','黃2B-2','黃2B-1','黃4B-2','黃4B-1','藍5B-2','藍5B-1','藍4B-2','藍4B-1','藍3B-2'];
const lsfInnerRightIds=['橙1B-1','橙1B-2','橙2B-1','橙2B-2','橙4B-1','橙4B-2','藍1B-1','藍1B-2','藍2B-1','藍2B-2','藍3B-1'];
const lsf6380=new Set(['橙1B-1','橙1B-2','橙2B-1','橙2B-2','橙4B-1','藍2B-1','藍2B-2','藍3B-1','藍3B-2','藍4B-1','藍4B-2','黃4B-2','黃2B-1','黃2B-2','黃1B-1','黃1B-2']);
const lsf5880=new Set(['橙4B-2','藍1B-1','藍1B-2','藍5B-1','藍5B-2','黃4B-1']);
const lsfInner=[
  ...arcGroup(lsfInnerLeftIds,'2F',154,116,18,3.86,1.68),
  ...arcGroup(lsfInnerRightIds,'2F',154,116,18,-.72,1.46)
].map(s=>({...s,group:lsf5880.has(s.id)?'5880':'6380',rowMin:1,rowMax:15,rowDirection:lsf6380.has(s.id)?'reverse':undefined,depthX:22,depthZ:17,rise:10,rowCurve:1.04}));
const lsfOuterLeftIds=['黃2A-2','黃2A-1','黃4A-2','黃4A-1','藍5A-3','藍5A-2','藍5A-1','藍4A-2','藍4A-1','藍3A-1'];
const lsfOuterRightIds=['橙2A-1','橙2A-2','橙4A-2','橙4A-1','藍1A-1','藍1A-2','藍2A-1','藍2A-2','藍3A-1'];
const lsfSplit3680=new Set(['橙2A-1','橙2A-2','橙4A-2','橙4A-1','黃4A-1','黃4A-2','黃2A-1','黃2A-2']);
const lsfOuter=[
  ...arcGroup(lsfOuterLeftIds,'3F',194,148,43,3.90,1.70),
  ...arcGroup(lsfOuterRightIds,'3F',194,148,43,-.76,1.44)
].map(s=>({...s,group:lsfSplit3680.has(s.id)?'3680-4680':'4680',rowMin:0,rowMax:16,depthX:28,depthZ:22,rise:15,rowCurve:1.06}));
const lsfSections=[...lsfVip,...lsfInner,...lsfOuter];
const lsfTiers=[
  {id:'VIP',label:'1F VIP 站席',short:'VIP',sections:lsfVip.map(x=>x.id)},
  {id:'2F',label:'2F 看台',short:'2F',sections:lsfInner.map(x=>x.id)},
  {id:'3F',label:'3F 看台',short:'3F',sections:lsfOuter.map(x=>x.id)}
];
const lsfPriceLabels={
  '6980':'VIP NT$6,980 · 站席','6380':'NT$6,380','5880':'NT$5,880','4680':'NT$4,680','3680-4680':'NT$3,680–4,680（依官方圖位置）'
};



// BTS 2026 ARIRANG — Kaohsiung National Stadium official tixCraft map reconstruction.
// The published map is a 360-degree central stage with four diagonal arms and four families
// of floor blocks. Fixed stadium grandstands remain visible underneath as the physical venue.
const btsVip=[
  block('A1','VIP',22,-27,20,22,'9380'),block('A2','VIP',0,-31,20,22,'9380'),block('A3','VIP',-22,-27,20,22,'9380'),
  block('M1','VIP',22,27,20,22,'9380'),block('M2','VIP',0,31,20,22,'9380'),block('M3','VIP',-22,27,20,22,'9380')
];
const btsYellow=[];for(let i=0;i<7;i++){btsYellow.push(block(`Y${i+1}`,'FLOOR',-70,-50+i*17,24,14,'7980'));btsYellow.push(block(`R${i+1}`,'FLOOR',70,-50+i*17,24,14,'7980'));}
const btsGreen=[];for(let i=0;i<5;i++){btsGreen.push(block(`A${i+9}`,'FLOOR',-48+i*24,-72,21,18,'6980'));btsGreen.push(block(`M${i+9}`,'FLOOR',-48+i*24,72,21,18,'6980'));}
const btsFloor=[...btsVip,...btsYellow,...btsGreen].map(s=>({...s,rowMin:1,rowMax:28,seatEstimateMax:24,rise:2}));
const btsTiers=[
  {id:'VIP',label:'VIP PACKAGE 平面席',short:'VIP',sections:btsVip.map(x=>x.id)},
  {id:'FLOOR',label:'官方平面票區',short:'平面',sections:[...btsYellow,...btsGreen].map(x=>x.id)}
];
const btsPriceLabels={'9380':'VIP NT$9,380','7980':'NT$7,980','6980':'NT$6,980','5980':'NT$5,980','4980':'NT$4,980','3980':'NT$3,980','2980':'NT$2,980'};

// T-ARA Fancon 2026 — KKTIX official seat map reconstruction for Kaohsiung Music Center.
const taraFloor=[
  block('1F-L','EVENT1F',-35,-52,28,40,'5980'),block('1F-C','EVENT1F',0,-50,34,42,'5980'),block('1F-R','EVENT1F',35,-52,28,40,'5980')
];
const taraBowl=[
  block('2F-E','EVENT2F',-64,-13,30,30,'5680'),block('2F-A','EVENT2F',64,-13,30,30,'5680'),
  block('2F-D-IN','EVENT2F',-45,22,34,22,'5680'),block('2F-C-MID','EVENT2F',0,25,44,24,'5680'),block('2F-B-IN','EVENT2F',45,22,34,22,'5680'),
  block('2F-D','EVENT2F',-48,56,34,24,'4680'),block('2F-C','EVENT2F',0,60,44,24,'4680'),block('2F-B','EVENT2F',48,56,34,24,'4680'),
  block('2F-D-REAR','EVENT2F',-65,83,28,20,'3680'),block('2F-B-REAR','EVENT2F',65,83,28,20,'3680')
].map(s=>({...s,y:-7,rowMin:1,rowMax:18,seatEstimateMax:24,rise:8}));
const taraSections=[...taraFloor,...taraBowl].map(s=>({...s,rowMin:s.rowMin||1,rowMax:s.rowMax||22,seatEstimateMax:s.seatEstimateMax||24}));
const taraTiers=[
  {id:'EVENT1F',label:'1F 官方票區',short:'1F',sections:taraFloor.map(x=>x.id)},
  {id:'EVENT2F',label:'2F 官方票區',short:'2F',sections:taraBowl.map(x=>x.id)}
];
const taraPriceLabels={'5980':'NT$5,980','5680':'NT$5,680','4680':'NT$4,680','3680':'NT$3,680'};

// IVE 2026 SHOW WHAT I AM — Taipei Arena event-specific reconstruction.
// Official tixCraft map confirms six VIP floor zones, FOH, selected 2F/3F fixed seating and 3F box seats.
const ive2026Vip = [
  block('特1區','VIP',-46,-45,34,76,'vip7800'),
  block('特2區','VIP',0,-6,34,30,'vip7800'),
  block('特3區','VIP',46,-45,34,76,'vip7800'),
  block('特4區','VIP',-42,31,34,28,'vip7800'),
  block('特5區','VIP',0,31,34,28,'vip7800'),
  block('特6區','VIP',42,31,34,28,'vip7800')
];
const cloneArenaSection = (id, group) => {
  const base=taipeiArenaSections.find(s=>s.id===id);
  return base ? {...base,group} : null;
};
const ive2026Side2F = [
  ...['紫2A','紫2B','紫2C','紫2D','紫2E'].map(id=>cloneArenaSection(id,'side2f')),
  ...['紅2A','紅2B','紅2C','紅2D','紅2E'].map(id=>cloneArenaSection(id,'side2f')),
  cloneArenaSection('黃2E','3800'), cloneArenaSection('黃2D','4800'), cloneArenaSection('黃2C','5800'), cloneArenaSection('黃2B','4800'), cloneArenaSection('黃2A','3800')
].filter(Boolean);
const ive2026Rear3F = ['黃3J','黃3I','黃3H','黃3G','黃3F','黃3E','黃3D','黃3C','黃3B','黃3A']
  .map(id=>cloneArenaSection(id,'3fRange')).filter(Boolean);
const ive2026Boxes = [
  ...Array.from({length:10},(_,i)=>block(`東${310-i}`,'BOX',-108,-58+i*12,18,10,'box4800')),
  ...Array.from({length:10},(_,i)=>block(`西${310-i}`,'BOX',108,-58+i*12,18,10,'box4800'))
];
const ive2026Sections = [...ive2026Vip,...ive2026Side2F,...ive2026Rear3F,...ive2026Boxes];
const ive2026Tiers = [
  {id:'VIP',label:'1F VIP 特區',short:'VIP',sections:ive2026Vip.map(x=>x.id)},
  {id:'2F',label:'2F 固定席',short:'2F',sections:ive2026Side2F.map(x=>x.id)},
  {id:'3F',label:'3F 固定席',short:'3F',sections:ive2026Rear3F.map(x=>x.id)},
  {id:'BOX',label:'3F 東／西側包廂',short:'包廂',sections:ive2026Boxes.map(x=>x.id)}
];
const ive2026PriceLabels = {
  vip7800:'VIP NT$7,800', '5800':'NT$5,800', '4800':'NT$4,800', '3800':'NT$3,800',
  side2f:'NT$3,800–5,800（依區／排）', '3fRange':'NT$800–2,800（依排數）', box4800:'NT$4,800／人'
};

// Kaohsiung Arena official seat information: 2F 201-222, box level 401-410, upper 501-518.
const kh2 = ring(Array.from({length:22},(_,i)=>pad(201+i)), '2F', 186,142,18,-Math.PI/2+.08).map(s=>{
  const deepRear = String(s.id)==='219';
  return {...s,rowMin:1,rowMax:deepRear?41:32,depthX:deepRear?39:30,depthZ:deepRear?30:23,rise:deepRear?19:15,rowCurve:1.06};
});
const kh4 = ring(Array.from({length:10},(_,i)=>pad(401+i)), '4F', 220,168,53,-Math.PI/2+.14).map(s=>({...s,rowMin:1,rowMax:2,depthX:6,depthZ:5,rise:3,rowCurve:1}));
const kh5 = ring(Array.from({length:18},(_,i)=>pad(501+i)), '5F', 252,194,83,-Math.PI/2+.10).map(s=>({...s,rowMin:1,rowMax:20,depthX:26,depthZ:20,rise:15,rowCurve:1.05}));
const khFloor = [
  structuralBlock('1F平面A','FLOOR',-50,8,30,78,'floor'),structuralBlock('1F平面B','FLOOR',-17,8,30,78,'floor'),
  structuralBlock('1F平面C','FLOOR',17,8,30,78,'floor'),structuralBlock('1F平面D','FLOOR',50,8,30,78,'floor')
].map(s=>({...s,rowMin:1,rowMax:40,depthZ:38,rise:2,rowCurve:1.02,structuralOnly:true,eventFlexible:true,label:`${s.id}（依活動配置）`}));
const kaohsiungSections = [...khFloor,...kh2,...kh4,...kh5];
const kaohsiungTiers = [
  {id:'FLOOR',label:'1F 活動平面／排椅區',short:'1F',sections:khFloor.map(x=>x.id)},
  {id:'2F',label:'二樓看台',short:'2F',sections:kh2.map(x=>x.id)},
  {id:'4F',label:'四樓包廂／看台',short:'4F',sections:kh4.map(x=>x.id)},
  {id:'5F',label:'五／六樓看台',short:'5F+',sections:kh5.map(x=>x.id)}
];


// v0.17 priority venue expansion -------------------------------------------------
// Taipei Music Center: official fixed seating is on 2F / 3F; 1F is configurable.
const tmcFloor = [
  block('1F 左','1F',-46,24,42,76,'floor'), block('1F 中','1F',0,24,42,76,'floor'), block('1F 右','1F',46,24,42,76,'floor')
].map(s=>({...s,rowMin:1,rowMax:20,structuralOnly:true,eventFlexible:true,nonTicketZone:true,label:`${s.id}活動配置範圍（非固定席）`,rowRangeConfidence:'event-configurable'}));
const tmc2Capacity={'2A':156,'2B':204,'2C':225,'2D':293,'2E':225,'2F':204,'2G':156};
const tmc3Capacity={'3A':181,'3B':236,'3C':234,'3D':369,'3E':234,'3F':236,'3G':181};
const tmc2 = arcGroup(['2A','2B','2C','2D','2E','2F','2G'],'2F',146,106,18,2.82,.32)
  .map(s=>({...s,rowMin:1,rowMax:15,depthX:17,depthZ:13,rise:8,officialSeatCapacity:tmc2Capacity[s.id],rowRangeConfidence:'official-fixed-seat-plan'}));
const tmc3 = arcGroup(['3A','3B','3C','3D','3E','3F','3G'],'3F',184,136,52,2.82,.32)
  .map(s=>({...s,rowMin:1,rowMax:18,depthX:15,depthZ:12,rise:7,officialSeatCapacity:tmc3Capacity[s.id],rowRangeConfidence:'official-fixed-seat-plan'}));
const tmcSections=[...tmcFloor,...tmc2,...tmc3];
const tmcTiers=[
  {id:'1F',label:'1F 活動可變平面區',short:'1F',sections:tmcFloor.map(x=>x.id)},
  {id:'2F',label:'2F 固定席',short:'2F',sections:tmc2.map(x=>x.id)},
  {id:'3F',label:'3F 固定席',short:'3F',sections:tmc3.map(x=>x.id)}
];

// TICC Plenary Hall is one continuous raked auditorium, not an arena with five
// independent stacked balcony rings. The official finder uses 2MF / 3F / 4F / 5F / 6F
// as entrance / seating-zone bands inside that continuous rake. There is NO general
// "1F audience tier" in the official Plenary Hall seat finder.
//
// Preserve the existing community-facing ids (2F-A ... 6F-E) so saved links keep
// working, but place the bands on one rising audience plane instead of concentric arcs.
function ticcRakeBand(prefix,tier,z,y,rowMin,rowMax,officialPrefix=prefix,depth=24,rise=8){
  const letters=['A','B','C','D','E'];
  const xs=[-56,-28,0,28,56];
  const widths=[24,25,26,25,24];
  return letters.map((letter,i)=>({
    ...block(`${prefix}-${letter}`,tier,xs[i],z,widths[i],depth,'ticc-rake'),
    y, rowMin,rowMax,depthZ:Math.max(10,depth*.78),rise,rowCurve:1.02,
    officialId:`${officialPrefix}-${i+1}`,
    label:`${officialPrefix}-${i+1} · ${letter}`,
    aliases:[`${officialPrefix}-${i+1}`,`${prefix}-${letter}`],
    continuousRake:true,
    audienceZoneBand:true
  }));
}
const ticc2=ticcRakeBand('2F','2MF',-53,-16,1,12,'2MF',22,7);
const ticc3=ticcRakeBand('3F','3F',-27,-9,13,27,'3F',28,9);
const ticc4=ticcRakeBand('4F','4F',5,0,28,41,'4F',29,10);
const ticc5=ticcRakeBand('5F','5F',38,11,42,55,'5F',28,11);
// 6F labels use a local rear-zone row system on the official finder, so do not pretend
// they are a continuation of the 1–55 main-floor row numbering.
const ticc6=ticcRakeBand('6F','6F',69,24,1,35,'6F',20,12).map(s=>({...s,rowSystem:'local-zone'}));
const ticcBoxes=[
  block('BOX-L1','BOX',-76,-7,14,22,'box'),block('BOX-L2','BOX',-80,28,14,22,'box'),block('BOX-L3','BOX',-82,59,14,22,'box'),
  block('BOX-R1','BOX',76,-7,14,22,'box'),block('BOX-R2','BOX',80,28,14,22,'box'),block('BOX-R3','BOX',82,59,14,22,'box')
].map((s,i)=>{const side=i<3?'L':'R',n=(i%3)+1;return {...s,y:10+n*10,rowMin:1,rowMax:12,officialId:`${side}-${n}`,label:`${side}-${n} · 包廂`,aliases:[`${side}-${n}`,s.id]};});
const ticcSections=[...ticc2,...ticc3,...ticc4,...ticc5,...ticc6,...ticcBoxes];
const ticcTiers=[
  {id:'2MF',label:'2MF 大會堂前段',short:'2MF',sections:ticc2.map(x=>x.id)},
  {id:'3F',label:'3F 大會堂前中段',short:'3F',sections:ticc3.map(x=>x.id)},
  {id:'4F',label:'4F 大會堂中段',short:'4F',sections:ticc4.map(x=>x.id)},
  {id:'5F',label:'5F 大會堂後段',short:'5F',sections:ticc5.map(x=>x.id)},
  {id:'6F',label:'6F 大會堂後上段',short:'6F',sections:ticc6.map(x=>x.id)},
  {id:'BOX',label:'側邊包廂',short:'BOX',sections:ticcBoxes.map(x=>x.id)}
];

// Kaohsiung Music Center Hi-Ing Music Hall.
// Official technical drawings define the major bowl. Public seat-view reports expose useful
// 2F sub-zones (2B1–2B5, 2C*, 2D*, 2E*) that materially change rail / aisle behavior.
// These are calibration sub-zones, not a claim that every event will use the same ticket labels.
const kmc1=arcGroup(['A','B','C','D','E'],'1F',112,82,0,2.68,.47).map(s=>({...s,rowMin:1,rowMax:7}));
function kmcRadial(id,tier,angle,rx,rz,y,rowMin,rowMax,offset=0){
  return {id,tier,angle:angle+offset,radiusX:rx,radiusZ:rz,y,rowMin,rowMax,span:.18,depthX:7,depthZ:6,rise:4};
}
const kmc2=[
  kmcRadial('2A1','2F',2.52,143,105,24,1,10,-.04), kmcRadial('2A2','2F',2.52,158,116,29,11,18,.04),
  kmcRadial('2B1','2F',2.04,139,102,22,1,4), kmcRadial('2B2','2F',2.04,148,109,25,5,9),
  kmcRadial('2B3','2F',2.04,158,116,29,10,20), kmcRadial('2B4','2F',1.92,170,125,34,18,19),
  kmcRadial('2B5','2F',2.04,181,133,39,24,29),
  kmcRadial('2C1-1','2F',1.57,140,103,22,1,5,-.05), kmcRadial('2C2','2F',1.57,151,111,26,6,11),
  kmcRadial('2C3','2F',1.57,162,119,31,12,17), kmcRadial('2C4','2F',1.57,174,128,36,18,23),
  kmcRadial('2D1','2F',1.10,143,105,23,1,5), kmcRadial('2D2','2F',1.10,154,113,28,6,11),
  kmcRadial('2D3','2F',1.10,166,122,33,12,17),
  kmcRadial('2E1','2F',.62,151,111,27,1,10,-.06), kmcRadial('2E2','2F',.62,151,111,27,1,10,.06)
];
const kmc3=arcGroup(['3B','3C-1','3C-2','3D'],'3F',190,141,60,2.42,.72)
  .map(s=>({...s,rowMin:1,rowMax:20,depthX:12,depthZ:10,rise:7}));

const sj83zVip=[
  {...block('VIP A1','VIP',-48,-42,28,42,'floor'),rowMin:1,rowMax:24,depthZ:34,rise:2,aliases:['VIP A1']},
  {...block('VIP A2','VIP',-16,-42,28,42,'floor'),rowMin:1,rowMax:24,depthZ:34,rise:2,aliases:['VIP A2']},
  {...block('VIP A3','VIP',16,-42,28,42,'floor'),rowMin:1,rowMax:24,depthZ:34,rise:2,aliases:['VIP A3']},
  {...block('VIP A4','VIP',48,-42,28,42,'floor'),rowMin:1,rowMax:24,depthZ:34,rise:2,aliases:['VIP A4']}
];
const kmcSections=[...kmc1,...kmc2,...kmc3];
const kmcTiers=[
  {id:'1F',label:'1F 伸縮座席／活動平面',short:'1F',sections:kmc1.map(x=>x.id)},
  {id:'2F',label:'2F 固定席／實拍校正分區',short:'2F',sections:kmc2.map(x=>x.id)},
  {id:'3F',label:'3F 固定席',short:'3F',sections:kmc3.map(x=>x.id)}
];

// Kaohsiung National Stadium: region-level geometry only; exact ticket sections vary greatly.
const ksEast=arcGroup(Array.from({length:8},(_,i)=>`東${i+1}`),'LOWER',226,157,12,-.10,1.18).map(s=>({...s,rowMin:1,rowMax:24,depthX:42,depthZ:30,rise:15,rowCurve:1.04}));
const ksNorth=arcGroup(Array.from({length:8},(_,i)=>`北${i+1}`),'LOWER',232,161,12,1.30,2.62).map(s=>({...s,rowMin:1,rowMax:24,depthX:42,depthZ:30,rise:15,rowCurve:1.04}));
const ksWest=arcGroup(Array.from({length:8},(_,i)=>`西${i+1}`),'LOWER',226,157,12,2.76,4.03).map(s=>({...s,rowMin:1,rowMax:24,depthX:42,depthZ:30,rise:15,rowCurve:1.04}));
const ksUpper=arcGroup(Array.from({length:18},(_,i)=>`上${i+1}`),'UPPER',274,190,54,-.12,4.08).map(s=>({...s,rowMin:1,rowMax:30,depthX:50,depthZ:36,rise:20,rowCurve:1.05}));
const ksField=[...Array.from({length:6},(_,i)=>block(`平面A${i+1}`,'FLOOR',-82+i*33,-2,28,92,'floor')),...Array.from({length:6},(_,i)=>block(`平面B${i+1}`,'FLOOR',-82+i*33,78,28,52,'floor'))].map(s=>({...s,rowMin:1,rowMax:80,depthZ:54,rise:2,rowCurve:1.02}));
const ksSections=[...ksField,...ksEast,...ksNorth,...ksWest,...ksUpper];
const ksTiers=[
  {id:'FLOOR',label:'平面活動區',short:'平面',sections:ksField.map(x=>x.id)},
  {id:'LOWER',label:'下層固定看台',short:'下層',sections:[...ksEast,...ksNorth,...ksWest].map(x=>x.id)},
  {id:'UPPER',label:'上層固定看台',short:'上層',sections:ksUpper.map(x=>x.id)}
];

// Taoyuan Arena: official circular fixed bowl + movable floor seating.
const taoBowl=ring(Array.from({length:16},(_,i)=>`B${i+1}`),'BOWL',150,118,22,-Math.PI/2+.05).map(s=>({...s,rowMin:1,rowMax:16,depthX:22,depthZ:17,rise:11,rowCurve:1.04}));
const taoFloor=[...Array.from({length:5},(_,i)=>block(`平面${String.fromCharCode(65+i)}`,'FLOOR',-64+i*32,16,28,76,'floor'))].map(s=>({...s,rowMin:1,rowMax:30,depthZ:28,rise:2,rowCurve:1.02}));
const taoyuanSections=[...taoFloor,...taoBowl];
const taoyuanTiers=[
  {id:'FLOOR',label:'活動座椅／平面區',short:'平面',sections:taoFloor.map(x=>x.id)},
  {id:'BOWL',label:'固定環形看台',short:'看台',sections:taoBowl.map(x=>x.id)}
];

// NTU Sports Center: official building data confirms 3F–5F fixed seating and movable stands.
const ntu3a=arcGroup(Array.from({length:6},(_,i)=>`3A${i+1}`),'3F',125,91,16,2.75,2.02).map(s=>({...s,rowMin:1,rowMax:18,depthX:24,depthZ:18,rise:12,rowCurve:1.05}));
const ntu3b=arcGroup(Array.from({length:6},(_,i)=>`3B${i+1}`),'3F',125,91,16,1.88,1.15).map(s=>({...s,rowMin:1,rowMax:22,depthX:28,depthZ:21,rise:14,rowCurve:1.05}));
const ntu3c=arcGroup(Array.from({length:6},(_,i)=>`3C${i+1}`),'3F',125,91,16,1.02,.29).map(s=>({...s,rowMin:1,rowMax:33,depthX:34,depthZ:25,rise:18,rowCurve:1.06}));
const ntu4a=arcGroup(Array.from({length:8},(_,i)=>`4A${i+1}`),'4F+',160,118,49,2.76,1.53).map(s=>({...s,rowMin:1,rowMax:18,depthX:28,depthZ:22,rise:15,rowCurve:1.05}));
const ntu4b=arcGroup(Array.from({length:8},(_,i)=>`4B${i+1}`),'4F+',160,118,49,1.38,.15).map(s=>({...s,rowMin:1,rowMax:18,depthX:28,depthZ:22,rise:15,rowCurve:1.05}));
const ntuFloor=[block('平面A','FLOOR',-44,16,38,76,'floor'),block('平面B','FLOOR',0,16,38,76,'floor'),block('平面C','FLOOR',44,16,38,76,'floor')].map(s=>({...s,rowMin:1,rowMax:33,depthZ:32,rise:2,rowCurve:1.02}));
const ntuSections=[...ntuFloor,...ntu3a,...ntu3b,...ntu3c,...ntu4a,...ntu4b];
const ntuTiers=[
  {id:'FLOOR',label:'活動伸縮／平面區',short:'平面',sections:ntuFloor.map(x=>x.id)},
  {id:'3F',label:'3F 主球場固定席',short:'3F',sections:[...ntu3a,...ntu3b,...ntu3c].map(x=>x.id)},
  {id:'4F+',label:'4F–5F 上層固定席',short:'4F+',sections:[...ntu4a,...ntu4b].map(x=>x.id)}
];

// Tianmu Gymnasium: fixed bowl + event-dependent floor. Detailed zone geometry is calibration-grade, not official single-seat data.
const tianmuStands=arcGroup(['L3','L2','L1','M1','M2','R1','R2','R3'],'BOWL',136,99,23,2.74,.40).map(s=>({...s,rowMin:1,rowMax:12,depthX:22,depthZ:17,rise:11,rowCurve:1.04}));
const tianmuFloor=[block('平面A1','FLOOR',-46,18,38,82,'floor'),block('平面A2','FLOOR',0,18,38,82,'floor'),block('平面A3','FLOOR',46,18,38,82,'floor')].map(s=>({...s,rowMin:1,rowMax:30,depthZ:30,rise:2,rowCurve:1.02}));
const tianmuSections=[...tianmuFloor,...tianmuStands];
const tianmuTiers=[
  {id:'FLOOR',label:'活動平面區',short:'平面',sections:tianmuFloor.map(x=>x.id)},
  {id:'BOWL',label:'固定看台',short:'看台',sections:tianmuStands.map(x=>x.id)}
];

const genericStage = (z=-128,width=112,depth=34) => ({ main:{x:0,y:-16,z,width,depth}, runway:null, bStage:null });

const zeppFloor = [
  {...block('1F-L','FLOOR',-28,8,24,74,'standing'),standingOnly:true,rowMin:1,rowMax:1,label:'1F 左側站區（依活動票區圖更新）'},
  {...block('1F-C','FLOOR',0,8,26,74,'standing'),standingOnly:true,rowMin:1,rowMax:1,label:'1F 中央站區（依活動票區圖更新）'},
  {...block('1F-R','FLOOR',28,8,24,74,'standing'),standingOnly:true,rowMin:1,rowMax:1,label:'1F 右側站區（依活動票區圖更新）'}
];
const zepp2F = [
  {...block('2F-L','2F',-31,37,27,28,'balcony'),y:10,rowMin:1,rowMax:10,seatEstimateMax:20,rise:9,label:'2F 左側'},
  {...block('2F-C','2F',0,37,30,28,'balcony'),y:10,rowMin:1,rowMax:10,seatEstimateMax:22,rise:9,label:'2F 中央'},
  {...block('2F-R','2F',31,37,27,28,'balcony'),y:10,rowMin:1,rowMax:10,seatEstimateMax:20,rise:9,label:'2F 右側'}
];
const zeppSections=[...zeppFloor,...zepp2F];
const zeppTiers=[
  {id:'FLOOR',label:'1F 活動站區',short:'1F',sections:zeppFloor.map(x=>x.id)},
  {id:'2F',label:'2F 看台／活動站席',short:'2F',sections:zepp2F.map(x=>x.id)}
];

// Nangang Exhibition Center Hall 1 4F: a large flat exhibition/concert hall, not an arena bowl.
// Keep the base deliberately flat and conservative; event-specific official maps may replace these blocks after OCR/Vision.
const nangangHall1Floor = Array.from({length:12},(_,i)=>{
  const col=i%4,row=Math.floor(i/4);
  return {...block(`H1-4F-${row+1}${String.fromCharCode(65+col)}`,'FLOOR',-69+col*46,-34+row*48,38,39,'structural-floor'),rowMin:1,rowMax:28,seatEstimateMax:34,depthZ:30,rise:1,structuralOnly:true,eventFlexible:true,label:`四樓平面活動區 ${row+1}${String.fromCharCode(65+col)}（依活動配置）`};
});
const nangangHall1Tiers=[{id:'FLOOR',label:'四樓平面活動席（依場次配置）',short:'4F 平面',sections:nangangHall1Floor.map(x=>x.id)}];

export const venueModels = {
  'taipei-dome': {
    id:'taipei-dome', name:'臺北大巨蛋', en:'TAIPEI DOME', city:'Taipei', sections:taipeiDomeSections, tiers:taipeiDomeTiers,
    baseLayoutId:'taipei-dome-base', defaultTier:'LOWER', defaultSection:'106', defaultRow:18, field:{x:206,z:190}, stage:genericStage(-158,120,38),
    sourceName:'臺北大巨蛋官方座位區平面圖', sourceUrl:'https://www.farglorydome.com.tw/park-detail/map/', confidence:'官方固定分區＋棒球場非對稱碗體校正／區域幾何重建'
  },
  'taipei-arena': {
    id:'taipei-arena', name:'臺北小巨蛋', en:'TAIPEI ARENA', city:'Taipei', sections:taipeiArenaSections, tiers:taipeiArenaTiers,
    baseLayoutId:'taipei-arena-far', defaultTier:'2F', defaultSection:'黃2C', defaultRow:10, field:{x:128,z:102}, stage:genericStage(-110,92,30),
    sourceName:'臺北小巨蛋官方座位視線導覽', sourceUrl:'https://www.arena.taipei/cp.aspx?n=95731497B5FCEDDB', confidence:'官方視線分區校正／區域幾何重建'
  },
  'ntsu-arena': {
    id:'ntsu-arena', name:'國立體育大學綜合體育館', en:'NTSU ARENA / LINKOU ARENA', city:'Taoyuan', sections:ntsuSections, tiers:ntsuTiers,
    baseLayoutId:'ntsu-base', defaultTier:'MIDDLE', defaultSection:'綠3中', defaultRow:10, field:{x:132,z:98}, stage:genericStage(-111,94,28),
    sourceName:'國立體育大學綜合體育館官方平面圖', sourceUrl:'https://phk.ntsu.edu.tw/var/file/8/1008/img/1439/147422320.pdf', confidence:'官方色區／席位圖校正／區域幾何重建'
  },
  'kaohsiung-arena': {
    id:'kaohsiung-arena', name:'高雄巨蛋', en:'KAOHSIUNG ARENA', city:'Kaohsiung', sections:kaohsiungSections, tiers:kaohsiungTiers,
    baseLayoutId:'kaohsiung-base', defaultTier:'2F', defaultSection:'213', defaultRow:10, field:{x:140,z:108}, stage:genericStage(-116,98,30),
    sourceName:'高雄巨蛋官方座位資訊', sourceUrl:'https://www.kaoarena.com.tw/Home/Seat', confidence:'官方樓層／分區校正／區域幾何重建'
  },
  'taipei-music-center': {
    id:'taipei-music-center', name:'臺北流行音樂中心', en:'TAIPEI MUSIC CENTER', city:'Taipei', sections:tmcSections, tiers:tmcTiers,
    baseLayoutId:'tmc-base', defaultTier:'2F', defaultSection:'2D', defaultRow:6, field:{x:105,z:84}, stage:genericStage(-92,82,24),
    officialTierSeatCount:{'2F':1463,'3F':1675}, mappedTierSeatCount:{'2F':1463,'3F':1671}, officialCountDelta:{'2F':0,'3F':4},
    sourceName:'北流官方表演廳座席配置圖', sourceUrl:'https://www.tmc.taipei/files/20260120172250954.pdf', confidence:'官方 2F／3F 固定席席數＋1F 可變配置＋技術尺寸校正'
  },
  'ticc': {
    id:'ticc', name:'TICC 台北國際會議中心', en:'TAIPEI INTERNATIONAL CONVENTION CENTER', city:'Taipei', sections:ticcSections, tiers:ticcTiers,
    baseLayoutId:'ticc-base', defaultTier:'2MF', defaultSection:'2F-B', defaultRow:10, field:{x:92,z:82}, stage:genericStage(-82,72,20),
    sourceName:'TICC 官方大會堂座位查詢／VR', sourceUrl:'https://www.ticc.com.tw/wSite/sp?BaseDSD=&CtUnit=100&ctNode=323&mp=1&xdUrl=%2FwSite%2Fap%2Flp_PlenaryHall.jsp', confidence:'官方 2MF/3F–6F 分區＋連續斜坡觀眾席拓樸／包廂校正'
  },
  'kaohsiung-music-center': {
    id:'kaohsiung-music-center', name:'高雄流行音樂中心 海音館', en:'KAOHSIUNG MUSIC CENTER · HI-ING MUSIC HALL', city:'Kaohsiung', sections:kmcSections, tiers:kmcTiers,
    baseLayoutId:'kmc-base', defaultTier:'2F', defaultSection:'2C3', defaultRow:12, field:{x:108,z:84}, stage:genericStage(-94,82,24),
    sourceName:'海音館官方全區觀眾席平面圖', sourceUrl:'https://www.kph.tw/venues-resources/1', confidence:'官方平面／剖面圖＋2F 分段／排數實拍校正'
  },
  'kaohsiung-stadium': {
    id:'kaohsiung-stadium', name:'高雄國家體育場（世運主場館）', en:'KAOHSIUNG NATIONAL STADIUM', city:'Kaohsiung', sections:ksSections, tiers:ksTiers,
    baseLayoutId:'ks-standard', defaultTier:'LOWER', defaultSection:'北4', defaultRow:10, field:{x:205,z:138}, stage:genericStage(-150,132,38),
    sourceName:'高雄市政府運動發展局場館資訊', sourceUrl:'https://busker.kcg.gov.tw/space/Details?Parser=99%2C7%2C28%2C%2C%2C%2C29', confidence:'官方場館輪廓／區域級重建'
  },
  'taoyuan-arena': {
    id:'taoyuan-arena', name:'桃園巨蛋', en:'TAOYUAN ARENA', city:'Taoyuan', sections:taoyuanSections, tiers:taoyuanTiers,
    baseLayoutId:'taoyuan-base', defaultTier:'BOWL', defaultSection:'B11', defaultRow:8, field:{x:118,z:92}, stage:genericStage(-105,88,26),
    sourceName:'桃園市政府體育局官方座位平面圖', sourceUrl:'https://www.dst.tycg.gov.tw/cp.aspx?n=11715', confidence:'官方圓形座位圖／容量校正'
  },
  'ntu-sports-center': {
    id:'ntu-sports-center', name:'臺大綜合體育館', en:'NTU SPORTS CENTER', city:'Taipei', sections:ntuSections, tiers:ntuTiers,
    baseLayoutId:'ntu-base', defaultTier:'3F', defaultSection:'3B3', defaultRow:10, field:{x:100,z:76}, stage:genericStage(-90,78,24),
    sourceName:'臺大體育室場地地圖／主球場資料', sourceUrl:'https://rent.pe.ntu.edu.tw/map/', confidence:'官方樓層／固定席容量校正'
  },
  'tianmu-gymnasium': {
    id:'tianmu-gymnasium', name:'天母體育館', en:'TIANMU GYMNASIUM', city:'Taipei', sections:tianmuSections, tiers:tianmuTiers,
    baseLayoutId:'tianmu-base', defaultTier:'BOWL', defaultSection:'M1', defaultRow:6, field:{x:100,z:78}, stage:genericStage(-94,78,24),
    sourceName:'臺北市政府場館建置資料', sourceUrl:'https://english.udd.gov.taipei/News_Content.aspx?n=DD9CEC17A97FBC64&s=5C7961D8F91A70B4&sms=72544237BBE4C5F6', confidence:'官方容量／場館級幾何＋實景校正'
  },
  'nangang-exhibition-hall1-4f': {
    id:'nangang-exhibition-hall1-4f', name:'台北南港展覽館一館四樓', en:'TWTC NANGANG EXHIBITION HALL 1 · 4F', city:'Taipei', sections:nangangHall1Floor, tiers:nangangHall1Tiers,
    baseLayoutId:'nangang-hall1-4f-base', defaultTier:'FLOOR', defaultSection:'H1-4F-2B', defaultRow:12, field:{x:165,z:118}, stage:genericStage(-105,104,28),
    sourceName:'台北南港展覽館一館四樓／活動官方場地示意圖動態校正', sourceUrl:'https://ticket.com.tw/Application/UTK02/UTK0201_.aspx?PRODUCT_ID=P1AT93WA', confidence:'平面展演廳保守基準；本場官方示意圖取得後以 OCR/Vision 覆寫票區'
  },
  'zepp-new-taipei': {
    id:'zepp-new-taipei', name:'Zepp New Taipei', en:'ZEPP NEW TAIPEI', city:'New Taipei', sections:zeppSections, tiers:zeppTiers,
    baseLayoutId:'zepp-new-taipei-base', defaultTier:'2F', defaultSection:'2F-C', defaultRow:5, field:{x:62,z:68}, stage:genericStage(-66,54,18),
    sourceName:'Zepp New Taipei 公開場館資訊／官方售票票區圖交叉校正', sourceUrl:'https://tixcraft.com/activity/detail/26_izna', confidence:'場館比例＋活動票區圖動態校正'
  }
};

// Venue topology is an invariant. Vision/OCR can customize only the parts that are
// physically reconfigurable for that venue; it must never invent a new fixed balcony,
// delete fixed tiers, or turn building floor labels into audience tiers.
export const VENUE_GEOMETRY_POLICIES = {
  'taipei-dome': {topology:'stadium-bowl',fixedSectionsAuthoritative:true,flexibleTierIds:['FLOOR'],allowSyntheticSections:true,allowFullSectionReplacement:false,allowSeatMapStageOverride:true,minStageOverrideConfidence:.82},
  'taipei-arena': {topology:'arena-bowl',fixedSectionsAuthoritative:true,flexibleTierIds:['B1'],allowSyntheticSections:true,allowFullSectionReplacement:false,allowSeatMapStageOverride:true,minStageOverrideConfidence:.82},
  'ntsu-arena': {topology:'arena-bowl',fixedSectionsAuthoritative:true,flexibleTierIds:['FLOOR','LOWER'],allowSyntheticSections:true,allowFullSectionReplacement:false,allowSeatMapStageOverride:true,minStageOverrideConfidence:.82},
  'kaohsiung-arena': {topology:'arena-bowl',fixedSectionsAuthoritative:true,flexibleTierIds:['FLOOR'],allowSyntheticSections:true,allowFullSectionReplacement:false,allowSeatMapStageOverride:true,minStageOverrideConfidence:.82},
  'taipei-music-center': {topology:'concert-hall',fixedSectionsAuthoritative:true,flexibleTierIds:['1F'],allowSyntheticSections:true,allowFullSectionReplacement:false,allowSeatMapStageOverride:true,minStageOverrideConfidence:.82},
  'ticc': {topology:'continuous-raked-auditorium',fixedSectionsAuthoritative:true,flexibleTierIds:[],allowedTierIds:['2MF','3F','4F','5F','6F','BOX'],allowSyntheticSections:false,allowFullSectionReplacement:false,allowSeatMapStageOverride:false,audienceFloor1:false},
  'kaohsiung-music-center': {topology:'concert-hall',fixedSectionsAuthoritative:true,flexibleTierIds:['1F'],allowSyntheticSections:true,allowFullSectionReplacement:false,allowSeatMapStageOverride:true,minStageOverrideConfidence:.82},
  'kaohsiung-stadium': {topology:'stadium-bowl',fixedSectionsAuthoritative:true,flexibleTierIds:['FLOOR'],allowSyntheticSections:true,allowFullSectionReplacement:false,allowSeatMapStageOverride:true,minStageOverrideConfidence:.86},
  'taoyuan-arena': {topology:'arena-bowl',fixedSectionsAuthoritative:true,flexibleTierIds:['FLOOR'],allowSyntheticSections:true,allowFullSectionReplacement:false,allowSeatMapStageOverride:true,minStageOverrideConfidence:.82},
  'ntu-sports-center': {topology:'arena-bowl',fixedSectionsAuthoritative:true,flexibleTierIds:['FLOOR'],allowSyntheticSections:true,allowFullSectionReplacement:false,allowSeatMapStageOverride:true,minStageOverrideConfidence:.82},
  'tianmu-gymnasium': {topology:'arena-bowl',fixedSectionsAuthoritative:true,flexibleTierIds:['FLOOR'],allowSyntheticSections:true,allowFullSectionReplacement:false,allowSeatMapStageOverride:true,minStageOverrideConfidence:.82},
  'nangang-exhibition-hall1-4f': {topology:'flat-exhibition-hall',fixedSectionsAuthoritative:false,flexibleTierIds:['FLOOR'],allowSyntheticSections:true,allowFullSectionReplacement:true,allowSeatMapStageOverride:true,minStageOverrideConfidence:.76},
  'zepp-new-taipei': {topology:'live-house',fixedSectionsAuthoritative:true,flexibleTierIds:['FLOOR'],allowSyntheticSections:true,allowFullSectionReplacement:false,allowSeatMapStageOverride:true,minStageOverrideConfidence:.82}
};
for (const [venueId,policy] of Object.entries(VENUE_GEOMETRY_POLICIES)) {
  if (venueModels[venueId]) venueModels[venueId].geometryPolicy={...policy};
}


// v0.40.5 — one hand-calibrated Korean-star reference show per calibrated venue.
// These demos intentionally keep the physical venue topology authoritative while replacing only
// activity-flexible floors / stage elements. twconcertview is used as a real-world sightline cross-check,
// never as the sole geometry source.
const kstarDemoLayouts = {
  'aespa-complexity-taipei-dome-2026': {
    id:'aespa-complexity-taipei-dome-2026', venueId:'taipei-dome', label:'aespa · SYNK : COMPLæXITY', historical:true, kstarExample:true,
    demoArtist:'aespa', demoDate:'2026-08-11', customizationLevel:'official-seatmap-calibrated-kstar-demo',
    // 2026 Taipei official seating graphic shows an end-stage with no long runway / B-stage.
    // Keep only the shallow stage apron visible in the official plan; do not invent view-blocking towers.
    stage:{main:{x:0,y:-16,z:-158,width:110,depth:31},runway:null,bStage:null},
    extraStageRects:[{x:0,y:-15,z:-137,width:34,depth:16}],
    stageRig:{verticalSupportTowers:false,sideSpeakerArrays:false},
    foh:{x:0,y:-19,z:31,width:45,depth:24},
    sections:[
      {...block('001','FLOOR',-76,-116,31,42,'vip'),rowMin:1,rowMax:24,officialId:'001'},
      {...block('002','FLOOR',-39,-118,31,43,'vip'),rowMin:1,rowMax:24,officialId:'002'},
      {...block('003','FLOOR',-7,-122,25,34,'vip'),rowMin:1,rowMax:20,officialId:'003'},
      {...block('004','FLOOR',25,-122,25,34,'vip'),rowMin:1,rowMax:20,officialId:'004'},
      {...block('005','FLOOR',56,-118,30,43,'vip'),rowMin:1,rowMax:24,officialId:'005'},
      {...block('006','FLOOR',88,-112,28,43,'vip'),rowMin:1,rowMax:24,officialId:'006'},
      {...block('007','FLOOR',-62,-70,31,35,'vip'),rowMin:1,rowMax:20,officialId:'007'},
      {...block('008','FLOOR',-28,-69,27,35,'vip'),rowMin:1,rowMax:20,officialId:'008'},
      {...block('009','FLOOR',-7,-68,16,20,'vip'),rowMin:1,rowMax:14,officialId:'009'},
      {...block('010','FLOOR',12,-68,16,20,'vip'),rowMin:1,rowMax:14,officialId:'010'},
      {...block('011','FLOOR',34,-69,27,35,'vip'),rowMin:1,rowMax:20,officialId:'011'},
      {...block('012','FLOOR',67,-70,31,35,'vip'),rowMin:1,rowMax:20,officialId:'012'},
      {...block('013','FLOOR',-45,-27,35,30,'6880'),rowMin:1,rowMax:18,officialId:'013'},
      {...block('014','FLOOR',45,-27,35,30,'6880'),rowMin:1,rowMax:18,officialId:'014'}
    ],
    tiers:[{id:'FLOOR',label:'B2 活動平面席',short:'B2',sections:['001','002','003','004','005','006','007','008','009','010','011','012','013','014']}],
    replaceStructuralTiers:['FLOOR'], defaultTier:'FLOOR', defaultSection:'003', defaultRow:12,
    sourceName:'Live Nation Taiwan／拓元 · aespa 2026 臺北大巨蛋官方座位配置', sourceUrl:'https://www.livenation.com.tw/aespa-tpe',
    seatLayoutSourceUrl:'https://news-images.tvbs.com.tw/legacy/img/upload/2026/05/05/20260505080706-0466e602.jpeg',
    seatMapDisplayUrl:'https://networksites.livenationinternational.com/networksites/ho2pada2/site-map.jpg?height=572&rmode=max&width=1000',
    seatMapDisplaySource:'Live Nation Taiwan 官方場域圖', seatMapDisplayTrustedArchive:false,
    seatMapOriginalSourceUrl:'https://www.livenation.com.tw/aespa-tpe',
    sectionPriceLabels:{'001':'VIP NT$7,880','002':'VIP NT$7,880','003':'VIP NT$7,880','004':'VIP NT$7,880','005':'VIP NT$7,880','006':'VIP NT$7,880','007':'VIP NT$7,880','008':'VIP NT$7,880','009':'VIP NT$7,880','010':'VIP NT$7,880','011':'VIP NT$7,880','012':'VIP NT$7,880','013':'NT$6,880','014':'NT$6,880'},
    sightlineSourceUrl:'https://twconcertview.com/venue/taipei-dome/', sightlineSourceName:'twconcertview 臺北大巨蛋實拍視角',
    distanceCalibration:{metersPerUnit:.47,uncertaintyM:6,basis:'大巨蛋固定看台比例＋aespa 官方座位圖 001–014／FOH 相對位置＋實拍視角交叉校正'},
    verifiedAt:'2026-09-21T17:05:00+08:00',
    notices:['本範例依 aespa 2026 官方座位圖重建 B2 001–014 平面區與 FOH；官方圖未標示長花道或 B-stage，因此 3D 不再自行生成。','官方座位圖沒有標示三根舞台遮擋柱；本場關閉通用垂直支撐塔與側掛喇叭陣列，避免把示意舞台設備誤當成真實遮擋。','固定 B1／L2–L5 看台保持大巨蛋場館基準；前排仍依主辦提醒保留固定欄杆／防護牆視線風險。','距離顯示為票區／排別級估算，不宣稱單一椅面的測量級精度。']
  },
  'nct-wish-anniversary-ntsu-2026': {
    id:'nct-wish-anniversary-ntsu-2026', venueId:'ntsu-arena', eventId:'nct-wish-2nd-anniversary-taipei-2026', label:'NCT WISH · 2ND ANNIVERSARY', historical:true, kstarExample:true,
    demoArtist:'NCT WISH', demoDate:'2026-09-05', customizationLevel:'hand-calibrated-kstar-demo',
    stage:{main:{x:0,y:-16,z:-112,width:86,depth:25},runway:{x:0,y:-15,z1:-100,z2:-61,width:15},bStage:{x:0,y:-14,z:-52,radius:18,shape:'hexagon'}},
    extraStageRects:[{x:-24,y:-14,z:-45,width:12,depth:42,ry:-.72},{x:24,y:-14,z:-45,width:12,depth:42,ry:.72}],
    foh:{x:0,y:-19,z:48,width:58,depth:18},
    sections:[
      {...block('W','FLOOR',-46,-40,39,62,'6200'),rowMin:1,rowMax:30},{...block('I','FLOOR',46,-40,39,62,'6200'),rowMin:1,rowMax:30},
      {...block('S','FLOOR',-46,28,42,54,'6200'),rowMin:1,rowMax:28},{...block('H','FLOOR',46,28,42,54,'6200'),rowMin:1,rowMax:28}
    ],
    tiers:[{id:'FLOOR',label:'W / I / S / H 本場平面區',short:'1F',sections:['W','I','S','H']}], replaceStructuralTiers:['FLOOR','LOWER'],
    defaultTier:'FLOOR',defaultSection:'W',defaultRow:8,
    sourceName:'Weverse / Ticket Plus · NCT WISH 2026 台北場',sourceUrl:'https://weverse.io/nctwish/notice/37945',
    sightlineSourceUrl:'https://twconcertview.com/en/venue/ntsu-arena-linkou/',sightlineSourceName:'twconcertview 林口體育館實拍視角',
    distanceCalibration:{metersPerUnit:.34,uncertaintyM:4,basis:'官方 W/I/S/H 票區圖＋林口固定看台排數規則＋同場實拍視角'},
    verifiedAt:'2026-09-21T16:10:00+08:00', restrictedViewSections:['黃1B-1','黃2A-2','橙1B-2','橙2A-1'],
    notices:['本場官方圖確認 W／I／S／H 四個平面區，以及主舞台至中央節點的延伸結構；平面票區以本場重建，不沿用通用四方格。','固定看台排數方向依售票說明校正：部分 B 層以 15 排最靠近舞台、A 層由 0 排起算。','twconcertview 同場回報用來核對欄杆、側舞台與實際體感距離，不作為固定幾何唯一來源。']
  },
  'exo-exhorizon-kaohsiung-arena-2026': {
    id:'exo-exhorizon-kaohsiung-arena-2026',venueId:'kaohsiung-arena',label:'EXO · EXhOrizon KAOHSIUNG',historical:true,kstarExample:true,demoArtist:'EXO',demoDate:'2026-07-18',customizationLevel:'hand-calibrated-kstar-demo',
    stage:{main:{x:0,y:-16,z:-104,width:84,depth:26},runway:{x:0,y:-15,z1:-91,z2:-42,width:16},bStage:{x:0,y:-14,z:-32,radius:22,shape:'hexagon'}},foh:{x:0,y:-19,z:58,width:54,depth:16},
    sections:[...[-54,-18,18,54].map((x,i)=>({...block(`VIP-${String.fromCharCode(65+i)}`,'FLOOR',x,-61,30,46,'vip'),rowMin:1,rowMax:20})),...[-54,-18,18,54].map((x,i)=>({...block(`F-${String.fromCharCode(65+i)}`,'FLOOR',x,-7,30,43,'floor'),rowMin:1,rowMax:20}))],
    tiers:[{id:'FLOOR',label:'本場 1F 平面區',short:'1F',sections:['VIP-A','VIP-B','VIP-C','VIP-D','F-A','F-B','F-C','F-D']}],replaceStructuralTiers:['FLOOR'],defaultTier:'FLOOR',defaultSection:'VIP-B',defaultRow:10,
    sourceName:'EXO PLANET #6 EXhOrizon 高雄場公開售票座位配置',sourceUrl:'https://www.kaoarena.com.tw/Home/Seat',sightlineSourceUrl:'https://twconcertview.com/en/venue/kaohsiung-arena/',sightlineSourceName:'twconcertview 高雄巨蛋實拍視角',
    distanceCalibration:{metersPerUnit:.34,uncertaintyM:5,basis:'高雄巨蛋固定樓層＋EXO 本場舞台／平面票區圖比例'},verifiedAt:'2026-09-21T16:10:00+08:00',
    notices:['依 EXO 2026 高雄場座位圖建立中央多邊形副舞台、延伸台、平面 VIP／一般區與後方 FOH。','2F／4F／5F 固定看台沿用場館結構，不以演唱會平面圖改寫樓層。']
  },
  'jaehyun-mono-tmc-2026': {
    id:'jaehyun-mono-tmc-2026',venueId:'taipei-music-center',label:'JAEHYUN · Mono',historical:true,kstarExample:true,demoArtist:'JAEHYUN',demoDate:'2026-07-04',customizationLevel:'hand-calibrated-kstar-demo',
    stage:{main:{x:0,y:-16,z:-78,width:69,depth:22},runway:{x:0,y:-15,z1:-67,z2:-39,width:14},bStage:{x:0,y:-14,z:-35,radius:13,shape:'rounded'}},foh:{x:0,y:-18,z:39,width:34,depth:13},
    sections:[{...block('VIP A','1F',-26,-11,45,60,'vip'),standingOnly:true,rowMin:1,rowMax:1},{...block('VIP B','1F',26,-11,45,60,'vip'),standingOnly:true,rowMin:1,rowMax:1}],tiers:[{id:'1F',label:'1F VIP 活動區',short:'1F',sections:['VIP A','VIP B']}],replaceStructuralTiers:['1F'],defaultTier:'1F',defaultSection:'VIP A',defaultRow:1,
    sourceName:'臺北流行音樂中心 · JAEHYUN 2026 活動回顧 / tixCraft',sourceUrl:'https://www.tmc.taipei/tw/blog/show/Jaehyun2026',sightlineSourceUrl:'https://twconcertview.com/en/venue/taipei-music-center/',sightlineSourceName:'twconcertview 北流實拍視角',
    distanceCalibration:{metersPerUnit:.27,uncertaintyM:3,basis:'北流官方舞台尺寸＋本場 VIP A/B 圖＋固定席結構'},verifiedAt:'2026-09-21T16:10:00+08:00',
    notices:['北流 1F 無固定座椅，本範例依 JAEHYUN 2026 本場配置建立 VIP A／B、中央延伸台與 FOH；2F／3F 固定席保留。','官方場館舞台尺寸用於比例校正；距離仍以區域級範圍呈現。']
  },
  'hyeri-hyeride-ticc-2026': {
    id:'hyeri-hyeride-ticc-2026',venueId:'ticc',eventId:'hyeri-hyeride-taipei-2026',label:'HYERI · HYERIDE',historical:true,kstarExample:true,demoArtist:'HYERI',demoDate:'2026-09-05',customizationLevel:'hand-calibrated-kstar-demo',
    stage:{main:{x:0,y:-12,z:-74,width:58,depth:17},runway:null,bStage:null},foh:{x:0,y:20,z:42,width:32,depth:12},defaultTier:'2MF',defaultSection:'2MF-3',defaultRow:10,
    sourceName:'TICC 活動行事曆 / Weverse · HYERI 2026',sourceUrl:'https://www.ticc.com.tw/wSite/sp?bId=6992&ctNode=318&mp=1&xdUrl=%2FwSite%2Fap%2Fcp_Activity.jsp',sightlineSourceUrl:'https://twconcertview.com/en/venue/ticc-taipei/',sightlineSourceName:'twconcertview TICC 實拍視角',
    distanceCalibration:{metersPerUnit:.22,uncertaintyM:3,basis:'TICC 官方大會堂固定座席拓樸＋近期 HYERI 場次方位'},verifiedAt:'2026-09-21T16:10:00+08:00',
    notices:['TICC 本場館沒有一般「1F 觀眾席」；HYERI 範例只套用舞台方位，不創造不存在的平面票區。','2MF→3F→4F→5F→6F 維持連續向後、向上升高的大會堂斜坡座席；左右包廂獨立處理。']
  },
  'ftisland-fate-kmc-2026': {
    id:'ftisland-fate-kmc-2026',venueId:'kaohsiung-music-center',eventId:'ftisland-fate-kaohsiung-2026',label:'FTISLAND · FaTe',historical:true,kstarExample:true,demoArtist:'FTISLAND',demoDate:'2026-09-12',customizationLevel:'hand-calibrated-kstar-demo',
    stage:{main:{x:0,y:-16,z:-88,width:66,depth:22},runway:{x:0,y:-15,z1:-76,z2:-25,width:13},bStage:{x:0,y:-14,z:-20,radius:13,shape:'square'}},foh:{x:0,y:-18,z:32,width:38,depth:12},
    sections:[{...block('VIP A','1F',-27,-34,45,65,'vip'),rowMin:1,rowMax:28},{...block('VIP B','1F',27,-34,45,65,'vip'),rowMin:1,rowMax:28}],tiers:[{id:'1F',label:'1F VIP A/B',short:'1F',sections:['VIP A','VIP B']}],replaceStructuralTiers:['1F'],defaultTier:'1F',defaultSection:'VIP A',defaultRow:10,
    sourceName:'高雄流行音樂中心 · FTISLAND 2026 官方節目資料',sourceUrl:'https://kpmc.com.tw/program/2026%E5%B9%B4%E4%B9%9D%E6%9C%88%E4%BB%BD%E7%AF%80%E7%9B%AE%E7%B8%BD%E8%A1%A8/',sightlineSourceUrl:'https://twconcertview.com/en/venue/kaohsiung-music-center/',sightlineSourceName:'twconcertview 海音館實拍視角',
    distanceCalibration:{metersPerUnit:.26,uncertaintyM:3,basis:'海音館固定席＋FTISLAND 本場長延伸台／方形副舞台票區圖'},verifiedAt:'2026-09-21T16:10:00+08:00',
    notices:['本場依 FTISLAND 高雄場圖重建 VIP A／B、長中央花道、方形副舞台與 FOH。','2F／3F 固定席沿用海音館結構與公開實拍校正。']
  },
  'kspark-kaohsiung-stadium-2026': {
    id:'kspark-kaohsiung-stadium-2026',venueId:'kaohsiung-stadium',label:'K-SPARK · K-POP FESTIVAL',historical:true,kstarExample:true,demoArtist:'K-SPARK',demoDate:'2026-05-30',customizationLevel:'hand-calibrated-kstar-demo',
    stage:{main:{x:0,y:-16,z:-152,width:104,depth:31},runway:{x:0,y:-15,z1:-136,z2:-30,width:17},bStage:{x:0,y:-14,z:-21,radius:24,shape:'rect'}},extraStageRects:[{x:0,y:-14,z:-7,width:76,depth:15}],foh:{x:0,y:-18,z:78,width:76,depth:20},
    sections:[...[-78,-39,0,39,78].flatMap((x,ix)=>[-82,-23,36].map((z,iz)=>({...block(`G${ix+1}-${iz+1}`,'FLOOR',x,z,34,48,iz===0?'vip':'floor'),rowMin:1,rowMax:24})))],
    tiers:[{id:'FLOOR',label:'K-SPARK 平面活動區',short:'平面',sections:Array.from({length:15},(_,i)=>`G${Math.floor(i/3)+1}-${(i%3)+1}`)}],replaceStructuralTiers:['FLOOR'],defaultTier:'FLOOR',defaultSection:'G3-1',defaultRow:10,
    sourceName:'高雄市政府 / K-SPARK 2026 活動資訊',sourceUrl:'https://www.kcg.gov.tw/',sightlineSourceUrl:'https://twconcertview.com/en/venue/kaohsiung-national-stadium/',sightlineSourceName:'twconcertview 世運主場館 K-SPARK 實拍',
    distanceCalibration:{metersPerUnit:.52,uncertaintyM:8,basis:'世運主場館尺度＋K-SPARK 本場大型 T 型延伸台＋實拍座位交叉校正'},verifiedAt:'2026-09-21T16:10:00+08:00',
    notices:['依 K-SPARK 2026 實際活動建立大型端景主舞台、超長中央花道、橫向副舞台與平面分區；大型戶外場館距離誤差帶較室內館寬。','twconcertview K-SPARK 實拍回報顯示平面區可能受前排人頭遮擋，本範例在視線警示保留此風險。']
  },
  'kwonder-taoyuan-2024': {
    id:'kwonder-taoyuan-2024',venueId:'taoyuan-arena',label:'K-WONDER CONCERT',historical:true,kstarExample:true,demoArtist:'aespa / NMIXX / AKMU',demoDate:'2024-10-19',customizationLevel:'hand-calibrated-kstar-demo',
    stage:{main:{x:0,y:-16,z:-91,width:74,depth:23},runway:{x:0,y:-15,z1:-79,z2:-48,width:13},bStage:{x:0,y:-14,z:-43,radius:13,shape:'square'}},foh:{x:0,y:-18,z:52,width:46,depth:14},
    sections:[...[-45,-15,15,45].map((x,i)=>({...block(`VIP ${String.fromCharCode(65+i)}`,'FLOOR',x,-46,26,50,'vip'),standingOnly:true,rowMin:1,rowMax:1})),...[-54,-18,18,54].map((x,i)=>({...block(`SPECIAL ${String.fromCharCode(65+i)}`,'FLOOR',x,10,30,42,'special'),rowMin:1,rowMax:20}))],
    tiers:[{id:'FLOOR',label:'K-WONDER 本場平面區',short:'平面',sections:['VIP A','VIP B','VIP C','VIP D','SPECIAL A','SPECIAL B','SPECIAL C','SPECIAL D']}],replaceStructuralTiers:['FLOOR'],defaultTier:'FLOOR',defaultSection:'VIP B',defaultRow:1,
    sourceName:'SHOW Office · K-WONDER 2024 官方售票公告',sourceUrl:'https://www.showoffice.com.tw/',sightlineSourceUrl:'https://twconcertview.com/en/venue/taoyuan-arena/',sightlineSourceName:'twconcertview 桃園巨蛋 K-WONDER 實拍',
    distanceCalibration:{metersPerUnit:.64,uncertaintyM:5,basis:'桃園巨蛋官方主場地直徑約 82m＋K-WONDER 本場票區比例'},verifiedAt:'2026-09-21T16:10:00+08:00',
    notices:['桃園巨蛋以 K-WONDER 2024 作為近期高品質韓星參考場，重建 VIP A–D、後方特區、FOH 與中央小舞台。','場館固定看台仍以桃園市政府場館資料為準。']
  },
  'hwang-in-youp-ntu-2026': {
    id:'hwang-in-youp-ntu-2026',venueId:'ntu-sports-center',eventId:'hwang-in-youp-to-you-taipei-2026',label:'HWANG IN YOUP · To you',historical:true,kstarExample:true,demoArtist:'HWANG IN YOUP',demoDate:'2026-09-12',customizationLevel:'hand-calibrated-kstar-demo',
    stage:{main:{x:0,y:-16,z:-79,width:66,depth:21},runway:null,bStage:null},foh:{x:0,y:-18,z:45,width:34,depth:11},
    sections:[...[-42,0,42].map((x,i)=>({...block(`VIP${i+1}`,'FLOOR',x,-36,36,49,'vip'),rowMin:1,rowMax:18})),...[-42,0,42].map((x,i)=>({...block(`A${i+1}`,'FLOOR',x,18,36,45,'a'),rowMin:1,rowMax:20}))],
    tiers:[{id:'FLOOR',label:'1F 本場座席',short:'1F',sections:['VIP1','VIP2','VIP3','A1','A2','A3']}],replaceStructuralTiers:['FLOOR'],defaultTier:'FLOOR',defaultSection:'VIP2',defaultRow:8,
    sourceName:'tixCraft · HWANG IN YOUP 2026 台北場官方票區圖',sourceUrl:'https://tixcraft.com/activity/detail/26_hiy',sightlineSourceUrl:'https://twconcertview.com/en/venue/ntu-sports-center/',sightlineSourceName:'twconcertview 臺大體育館實拍視角',
    distanceCalibration:{metersPerUnit:.28,uncertaintyM:3,basis:'臺大主球場場地資料＋本場 1F VIP/A 六區官方圖'},verifiedAt:'2026-09-21T16:10:00+08:00',
    notices:['本範例只把本場實際售出的 1F VIP1–3／A1–3 套到可變平面層；3–5F 固定看台仍保留場館結構，但不誤標為本場售票區。']
  },
  'kyuhyun-hotel203-tianmu-2026': {
    id:'kyuhyun-hotel203-tianmu-2026',venueId:'tianmu-gymnasium',label:'KYUHYUN · HOTEL 203',historical:true,kstarExample:true,demoArtist:'KYUHYUN',demoDate:'2026-06-27',customizationLevel:'hand-calibrated-kstar-demo',
    stage:{main:{x:0,y:-16,z:-79,width:66,depth:22},runway:null,bStage:null},foh:{x:0,y:-18,z:32,width:32,depth:12},
    sections:[...[-40,0,40].map((x,i)=>({...block(`A${i+1}`,'FLOOR',x,-31,36,60,'floor'),rowMin:1,rowMax:26}))],tiers:[{id:'FLOOR',label:'A1 / A2 / A3 平面席',short:'1F',sections:['A1','A2','A3']}],replaceStructuralTiers:['FLOOR'],defaultTier:'FLOOR',defaultSection:'A2',defaultRow:12,
    sourceName:'tixCraft · KYUHYUN HOTEL 203 官方座位圖',sourceUrl:'https://static.tixcraft.com/images/activity/field/26_kyuhyun_7096c49d9e0016932460769494b2e1ff.jpg',sightlineSourceUrl:'https://twconcertview.com/en/venue/tianmu-gymnasium/',sightlineSourceName:'twconcertview 天母體育館實拍視角',
    distanceCalibration:{metersPerUnit:.30,uncertaintyM:4,basis:'天母體育館固定席尺度＋KYUHYUN A1/A2/A3 官方圖'},verifiedAt:'2026-09-21T16:10:00+08:00',restrictedViewSections:['D1','D2'],
    notices:['依 KYUHYUN 2026 官方圖建立 A1／A2／A3 平面席與後方 FOH；側邊 D 區視線限制另以警示標示。','固定看台不以票區圖片任意旋轉或重建。']
  },
  'hwasa-twits-nangang-2024': {
    id:'hwasa-twits-nangang-2024',venueId:'nangang-exhibition-hall1-4f',label:'HWASA · Twits FANCON',historical:true,kstarExample:true,demoArtist:'HWASA',demoDate:'2024-06-16',customizationLevel:'hand-calibrated-kstar-demo',
    stage:{main:{x:0,y:-16,z:-100,width:102,depth:27},runway:null,bStage:null},foh:{x:0,y:-18,z:57,width:38,depth:14},
    sections:[
      ...[-52,0,52].map((x,i)=>({...block(['VIP3','VIP1','VIP2'][i],'FLOOR',x,-52,42,38,'vip'),rowMin:1,rowMax:18})),
      ...[-52,0,52].map((x,i)=>({...block(['A3','A1','A2'][i],'FLOOR',x,-9,42,38,'a'),rowMin:1,rowMax:18})),
      ...[-52,0,52].map((x,i)=>({...block(['B3','B1','B2'][i],'FLOOR',x,34,42,38,'b'),rowMin:1,rowMax:18})),
      {...block('C3','FLOOR',-52,77,42,34,'c'),rowMin:1,rowMax:16},{...block('C2','FLOOR',52,77,42,34,'c'),rowMin:1,rowMax:16}
    ],
    tiers:[{id:'FLOOR',label:'HWASA 本場全平面座席',short:'4F',sections:['VIP3','VIP1','VIP2','A3','A1','A2','B3','B1','B2','C3','C2']}],replaceStructuralTiers:['FLOOR'],defaultTier:'FLOOR',defaultSection:'VIP1',defaultRow:8,
    sourceName:'HWASA Twits 台北場公開官方票區圖 / 南港展覽館場地資料',sourceUrl:'https://www.tainex.com.tw/',sightlineSourceName:'南港展覽館一館 4F 場地尺度',
    distanceCalibration:{metersPerUnit:1.07,uncertaintyM:3,basis:'南港展覽館官方 Hall 1 4F 約 180m × 126m 尺度＋本場 3×4 票區圖'},verifiedAt:'2026-09-21T16:10:00+08:00',
    notices:['南港一館 4F 是無環形固定看台的大型平面展演空間；HWASA 範例依本場 VIP／A／B／C 區矩陣與 FOH 重建，不套用體育館 bowl。','本場距離比例可用官方展館尺寸較可靠地換算，但座椅擺放仍可能因主辦微調。']
  },
  'woodz-archive1-zepp-2026': {
    id:'woodz-archive1-zepp-2026',venueId:'zepp-new-taipei',label:'WOODZ · Archive. 1',historical:true,kstarExample:true,demoArtist:'WOODZ',demoDate:'2026-05-23',customizationLevel:'hand-calibrated-kstar-demo',
    stage:{main:{x:0,y:-12,z:-60,width:58,depth:18},runway:null,bStage:null},foh:{x:0,y:-10,z:24,width:24,depth:10},
    sections:[{...block('VIP','FLOOR',0,-22,66,52,'vip'),standingOnly:true,rowMin:1,rowMax:1},{...block('W','FLOOR',0,31,66,43,'standing'),standingOnly:true,rowMin:1,rowMax:1},{...block('2F O','EVENT2F',-24,45,24,18,'seat'),y:10,rowMin:1,rowMax:8},{...block('2F D','EVENT2F',24,45,24,18,'seat'),y:10,rowMin:1,rowMax:8},{...block('2F Z','EVENT2F',0,66,30,17,'standing'),y:11,standingOnly:true,rowMin:1,rowMax:1}],
    tiers:[{id:'FLOOR',label:'1F VIP / W 站區',short:'1F',sections:['VIP','W']},{id:'EVENT2F',label:'2F O / D / Z',short:'2F',sections:['2F O','2F D','2F Z']}],replaceStructuralTiers:['FLOOR'],defaultTier:'FLOOR',defaultSection:'VIP',defaultRow:1,
    sourceName:'WOODZ 2026 Zepp New Taipei 場次座位配置 / Zepp 場館資料',sourceUrl:'https://www.zepp.co.jp/hall/newtaipei/',sightlineSourceUrl:'https://twconcertview.com/en/venue/zepp-new-taipei/',sightlineSourceName:'twconcertview Zepp New Taipei 實拍視角',
    distanceCalibration:{metersPerUnit:.20,uncertaintyM:2,basis:'Zepp 1F/2F 固定空間＋WOODZ VIP/W/O/D/Z 本場圖'},verifiedAt:'2026-09-21T16:10:00+08:00',
    notices:['依 WOODZ 2026 場次區分 1F VIP、W 站區，以及 2F O／D 座席與 Z 站區；站席不生成虛假椅排。','Zepp 為 live-house，站席實際視線受身高與入場序號影響，距離與遮擋以範圍表示。']
  }
};

export const venueLayouts = {
  ...kstarDemoLayouts,
  'taipei-dome-base': {...taipeiDomeBase, id:'taipei-dome-base', venueId:'taipei-dome', label:'場館基準', stage:venueModels['taipei-dome'].stage, notices:['固定看台依官方場館圖校正；舞台為通用遠端舞台示意。']},
  [strayKidsRunItLayout.id]: {...strayKidsRunItLayout, venueId:'taipei-dome'},
  'taipei-arena-far': {id:'taipei-arena-far',venueId:'taipei-arena',label:'遠端舞台基準',stage:venueModels['taipei-arena'].stage,sourceName:'臺北小巨蛋官方遠端座位視線導覽',sourceUrl:'https://www.arena.taipei/cp.aspx?n=95731497B5FCEDDB&s=1BE4A9B16EE8F2E8',notices:['官方提供遠端與中央舞台視線導覽；本場舞台尚未公布時僅作場館方向參考。']},
  'taipei-arena-center': {id:'taipei-arena-center',venueId:'taipei-arena',label:'中央舞台基準',stage:{main:{x:0,y:-16,z:0,width:70,depth:56},runway:null,bStage:null},sourceName:'臺北小巨蛋官方中央舞台座位視線導覽',sourceUrl:'https://www.arena.taipei/cp.aspx?n=95731497B5FCEDDB',notices:['中央舞台為場館官方視線導覽類型之一；各活動舞台仍可能不同。']},
  'ntsu-base': {id:'ntsu-base',venueId:'ntsu-arena',label:'林口場館基準',stage:venueModels['ntsu-arena'].stage,sourceName:'國立體育大學綜合體育館平面圖',sourceUrl:'https://phk.ntsu.edu.tw/var/file/8/1008/img/1439/147422320.pdf',notices:['官方圖確認黃、綠、橙、藍四側固定看台與上／中／下層結構；基準模型保留官方子區 metadata，不再把下層活動席偽裝成固定票區。','演唱會平面席、活動席與舞台方向仍以該場官方售票圖覆蓋。']},
  'plave-keep-it-manic-2026': {
    id:'plave-keep-it-manic-2026', venueId:'ntsu-arena', eventId:'plave-keep-it-manic-taipei-2026', label:'PLAVE · KEEP IT MANIC',
    stage:{main:{x:0,y:-16,z:-112,width:92,depth:28},runway:null,bStage:null}, foh:{x:0,y:-19,z:55,width:72,depth:18}, sections:plaveSections, tiers:plaveTiers,
    defaultTier:'VIP', defaultSection:'VIP B', defaultRow:8,
    sourceName:'tixCraft 官方售票頁／本場票區圖', sourceUrl:'https://tixcraft.com/activity/detail/26_plavetp', verifiedAt:'2026-09-16T19:20:00+08:00',
    restrictedViewSections:['Y2A-2','O4A-2'], frontRowRailCaution:true, priceLabels:plavePriceLabels,
    notices:[
      '本場官方票區圖確認 VIP A–F、FOH 與黃／藍／橙票區的相對位置；本站重新繪製為互動幾何，不直接複製官方圖片。',
      '官方售票頁明列 Y2A-2、O4A-2 部分座位可能受演出設備、舞台角度或場館結構影響視線。',
      '2F／3F 看台前方數排可能受固定安全欄杆影響；實際遮擋程度依座位而異。'
    ]
  },
  'le-sserafim-pureflow-2026': {
    id:'le-sserafim-pureflow-2026', venueId:'ntsu-arena', eventId:'le-sserafim-pureflow-taipei-2026', label:'LE SSERAFIM · PUREFLOW',
    stage:{main:{x:0,y:-16,z:-112,width:92,depth:28},runway:{x:0,y:-15,z1:-100,z2:-34,width:18},bStage:{x:0,y:-14,z:-28,radius:24,shape:'octagon'}},
    foh:{x:0,y:-19,z:69,width:54,depth:18}, sections:lsfSections, tiers:lsfTiers,
    replaceStructuralTiers:['FLOOR','LOWER','MIDDLE','UPPER'],
    defaultTier:'VIP', defaultSection:'VIP C', defaultRow:1,
    sourceName:'tixCraft 2026 LE SSERAFIM 官方票區圖',
    sourceUrl:'https://tixcraft.com/activity/detail/26_lsf',
    latestSeatLayoutSourceUrl:'https://static.tixcraft.com/images/activity/field/26_lsf_2346a9e447c58490112b8fda1aacef0c.jpg',
    verifiedAt:'2026-09-17T16:25:00+08:00', seatMapDetected:true,
    restrictedViewSections:['黃1B-1','黃2A-2','橙1B-2','橙2A-1'], frontRowRailCaution:true,
    priceLabels:lsfPriceLabels,
    notices:[
      '拓元官方票區圖確認 1F VIP A／B／C 為站席；NEUL 不在站席內生成椅子，並保留中央延伸舞台與 FOH。',
      '官方提醒橙、藍、黃看台前方數排可能受安全欄杆影響；黃1B-1、黃2A-2、橙1B-2、橙2A-1另有部分視線限制。',
      '3F 部分橙／黃 A 區在官方圖中跨 NT$3,680 與 NT$4,680 價位，因此不強行把整個區簡化成單一價格。'
    ]
  },
  'ive-show-what-i-am-2026': {
    id:'ive-show-what-i-am-2026', venueId:'taipei-arena', eventId:'ive-show-what-i-am-taipei-2026', label:'IVE 2026 · SHOW WHAT I AM', historical:true, kstarExample:true, demoArtist:'IVE', demoDate:'2026-09-11', customizationLevel:'hand-calibrated-kstar-demo',
    stage:{main:{x:0,y:-16,z:-105,width:84,depth:24},runway:{x:0,y:-16,z1:-93,z2:-37,width:18},bStage:null},
    extraStageRects:[{x:0,y:-17,z:-35,width:42,depth:28}],
    foh:{x:0,y:-19,z:70,width:64,depth:18}, sections:ive2026Sections, tiers:ive2026Tiers,
    defaultTier:'VIP', defaultSection:'特5區', defaultRow:8,
    sourceName:'tixCraft 2026 IVE 官方票區圖 / Live Nation Taiwan', sourceUrl:'https://tixcraft.com/activity/detail/26_ive', sightlineSourceUrl:'https://twconcertview.com/en/venue/taipei-arena/', sightlineSourceName:'twconcertview 臺北小巨蛋 IVE／韓星實拍視角', distanceCalibration:{metersPerUnit:.31,uncertaintyM:3,basis:'臺北小巨蛋固定席＋IVE 官方票區圖＋實拍視角交叉校正'}, verifiedAt:'2026-09-21T16:10:00+08:00',
    priceLabels:ive2026PriceLabels, historicalApproximate:true,
    notices:[
      '官方拓元票區圖確認本場於臺北小巨蛋，包含特1–特6區、FOH、2F 固定席、3F 固定席與東／西側 3F 包廂。',
      '本站重新繪製為互動幾何，不直接內嵌官方票區圖；2F 側席與 3F 的票價可能依區域／排數變化，因此不以單一區名過度推定票價。',
      '官方入場公告：本場全座位；110 公分以下兒童不得進入 3F，2F／3F 觀眾不得站立跺腳。'
    ]
  },
  'kaohsiung-base': {id:'kaohsiung-base',venueId:'kaohsiung-arena',label:'高雄巨蛋場館基準',stage:venueModels['kaohsiung-arena'].stage,sourceName:'高雄巨蛋官方座位資訊',sourceUrl:'https://www.kaoarena.com.tw/Home/Seat',notices:['官方場館頁提供座椅配置與樓層分區；演唱會舞台、站區與封閉區需依每場官方配置更新。']},
  'tmc-base': {id:'tmc-base',venueId:'taipei-music-center',label:'北流表演廳基準',stage:venueModels['taipei-music-center'].stage,sourceName:'北流官方觀眾席配置圖',sourceUrl:'https://www.tmc.taipei/tw/hire/Unit-f8KLs',notices:['官方確認表演廳固定席約 3,100 席，1F 無固定座位；2F 實拍可見至 15 排、3F 實拍可見至 17 排附近，本站以此校正排數深度。','舞台官方尺寸約寬 30m、深 20m；本站 3D 僅保留比例關係，不把模型單位直接標成真實公尺。']},
  'ticc-base': {id:'ticc-base',venueId:'ticc',label:'TICC 大會堂基準',stage:venueModels['ticc'].stage,foh:{x:0,y:20,z:42,width:32,depth:12},sourceName:'TICC 官方大會堂座位查詢',sourceUrl:'https://www.ticc.com.tw/wSite/sp?BaseDSD=&CtUnit=100&ctNode=323&mp=1&xdUrl=%2FwSite%2Fap%2Flp_PlenaryHall.jsp',notices:['官方座位查詢以 2MF-1～5、3F-1～5、4F-1～5、5F-1～5、6F-1～5 與 L/R 包廂分區；大會堂觀眾席沒有一般「1F」席層。','2MF／3F／4F／5F／6F 在 3D 中按連續斜坡觀眾席的前後高度帶呈現，不再錯畫成五圈彼此分離的體育館式看台。','4F-B 公開實拍回報顯示控台位於區域後半，本版加入控台體積作為場館基準遮擋參考；實際設備仍依活動而異。']},

  'nangang-hall1-4f-base': {id:'nangang-hall1-4f-base',venueId:'nangang-exhibition-hall1-4f',label:'南港展覽館一館四樓基準',stage:venueModels['nangang-exhibition-hall1-4f'].stage,sourceName:'活動官方場地示意圖／南港展覽館平面展演廳基準',sourceUrl:'https://ticket.com.tw/Application/UTK02/UTK0201_.aspx?PRODUCT_ID=P1AT93WA',notices:['南港展覽館一館四樓為大型平面展演空間，不套用環形體育館看台。','每場舞台、FOH、座位與票區依主辦配置不同；取得官方場地示意圖後由 OCR/Vision 自動更新本場 event-specific 3D。']},

  'sj83z-1983-kaohsiung-2026': {
    id:'sj83z-1983-kaohsiung-2026',venueId:'kaohsiung-music-center',eventId:'super-junior-83z-1983-kaohsiung-2026',label:'SUPER JUNIOR-83z [1983] 官方票區',
    stage:{main:{x:0,y:-16,z:-91,width:78,depth:24},runway:{x:0,y:-15,z1:-78,z2:-28,width:18},bStage:{x:0,y:-14,z:-24,radius:15}},
    foh:[{x:0,y:-16,z:16,width:30,depth:10}],defaultTier:'VIP',defaultSection:'VIP A2',defaultRow:8,
    tiers:[{id:'VIP',label:'VIP A1–A4',short:'VIP',sections:sj83zVip.map(x=>x.id)}],sections:sj83zVip,
    sourceName:'KKTIX 官方座位圖',sourceUrl:'https://assets.kktix.io/organization_resource_files/59413/79383/SJ83z_%E5%BA%A7%E4%BD%8D%E5%9C%96%E8%A6%96%E7%B7%9A%E9%81%AE%E6%93%8B_0729_%E9%AB%98%E9%9B%84.jpg',
    seatMapDetected:true,sectionPriceRules:[{label:'VIP A1',price:'NT$6,480'},{label:'VIP A2',price:'NT$6,480'},{label:'VIP A3',price:'NT$6,480'},{label:'VIP A4',price:'NT$6,480'}],
    notices:['依 KKTIX 官方座位圖建立 VIP A1–A4、主舞台、延伸台與 FOH 相對位置。','2F／3F 固定席仍保留海音館完整場館結構，票價依官方區帶顯示；視線不良區以 KKTIX 最新公告為準。']
  },
  'kmc-base': {id:'kmc-base',venueId:'kaohsiung-music-center',label:'海音館場館基準',stage:venueModels['kaohsiung-music-center'].stage,sourceName:'海音館官方全區觀眾席平面圖',sourceUrl:'https://www.kph.tw/venues-resources/1',notices:['官方技術圖可確認主要固定席與剖面；本版再依公開實拍把 2F 拆成 2B1–2B5、2C1–2C4 等視角差異較大的校正分段。','這些 2F 細分名稱用於視角校正，不保證每場售票系統皆採完全相同命名。']},
  'bts-arirang-kaohsiung-2026': {
    id:'bts-arirang-kaohsiung-2026',venueId:'kaohsiung-stadium',eventId:'bts-arirang-kaohsiung-2026',label:"BTS · ARIRANG 官方座位圖",
    stage:{main:{x:0,y:-16,z:0,width:46,depth:42},runway:null,bStage:null,centerStage:true},
    extraStageRects:[
      {x:-37,y:-15,z:-37,width:13,depth:78,ry:-.785},{x:37,y:-15,z:-37,width:13,depth:78,ry:.785},
      {x:-37,y:-15,z:37,width:13,depth:78,ry:.785},{x:37,y:-15,z:37,width:13,depth:78,ry:-.785}
    ],
    foh:[{x:0,y:-18,z:-92,width:50,depth:14},{x:0,y:-18,z:92,width:50,depth:14}],
    sections:btsFloor,tiers:btsTiers,replaceStructuralTiers:['FLOOR'],defaultTier:'VIP',defaultSection:'A2',defaultRow:8,
    sourceName:'tixCraft BTS WORLD TOUR ARIRANG 官方座位圖',sourceUrl:'https://tixcraft.com/activity/detail/26_btskns',
    latestSeatLayoutSourceUrl:'https://static.tixcraft.com/images/activity/field/26_btskns_299447f2cd153382c7af192304de21d1.jpg',seatMapDetected:true,seatMapAutoRegenerate:true,
    priceLabels:btsPriceLabels,notices:['依拓元官方圖重建中央圓形舞台、四向斜向延伸舞台與主要平面票區。','固定看台仍保留世運主場館完整結構；票價依官方色帶與票區資料同步。','官方座位圖若內容雜湊改變，NEUL 會在下次前台同步時重新分析座位圖並更新自動草稿。']
  },
  'tara-fancon-kaohsiung-2026': {
    id:'tara-fancon-kaohsiung-2026',venueId:'kaohsiung-music-center',eventId:'tara-fancon-kaohsiung-2026',label:'T-ARA Fancon 2026 官方座位圖',
    stage:{main:{x:0,y:-16,z:-88,width:62,depth:22},runway:null,bStage:null},foh:[{x:0,y:-18,z:4,width:38,depth:10},{x:0,y:-18,z:24,width:34,depth:9}],
    sections:taraSections,tiers:taraTiers,defaultTier:'EVENT1F',defaultSection:'1F-C',defaultRow:8,
    sourceName:'KKTIX T-ARA Fancon 官方座位圖',sourceUrl:'https://wve.kktix.cc/events/2026tara-kh',latestSeatLayoutSourceUrl:'https://assets.kktix.io/organization_resource_files/43521/79950/81268528ae0b885c.jpg',seatMapDetected:true,seatMapAutoRegenerate:true,
    priceLabels:taraPriceLabels,notices:['依 KKTIX 官方圖重建 1F 三區、2F A–E 方向、FOH 與主舞台相對位置。','A、E 區靠近主舞台兩側，官方已提醒可能有部分視線遮蔽。','座位圖若更新，NEUL 會以影像雜湊偵測變更並重新分析活動專屬草稿。']
  },
  'ks-standard': {id:'ks-standard',venueId:'kaohsiung-stadium',label:'世運 · 端景舞台基準',stage:venueModels['kaohsiung-stadium'].stage,sourceName:'高雄市政府運動發展局場館資訊',sourceUrl:'https://busker.kcg.gov.tw/space/Details?Parser=99%2C7%2C28%2C%2C%2C%2C29',notices:['大型戶外場館目前為區域級重建；舞台高度、延伸台與平面區必須依每場活動再校正。']},
  'ks-center': {id:'ks-center',venueId:'kaohsiung-stadium',label:'世運 · 中央舞台基準',stage:{main:{x:0,y:-16,z:8,width:76,depth:64},runway:null,bStage:null},sourceName:'場館級中央舞台示意',sourceUrl:'https://busker.kcg.gov.tw/space/Details?Parser=99%2C7%2C28%2C%2C%2C%2C29',notices:['中央舞台僅為場館級基準，實際 360° 舞台與燈塔位置以主辦售票圖為準。']},
  'ks-horizontal': {id:'ks-horizontal',venueId:'kaohsiung-stadium',label:'世運 · 橫開舞台基準',stage:{main:{x:-122,y:-16,z:0,width:42,depth:170},runway:null,bStage:null},sourceName:'場館級橫開舞台示意',sourceUrl:'https://busker.kcg.gov.tw/space/Details?Parser=99%2C7%2C28%2C%2C%2C%2C29',notices:['橫開舞台會大幅改變側邊看台與延伸台方向；本配置只做場館方位參考。']},
  'taoyuan-base': {id:'taoyuan-base',venueId:'taoyuan-arena',label:'桃園巨蛋場館基準',stage:venueModels['taoyuan-arena'].stage,sourceName:'桃園市政府體育局官方座位平面圖',sourceUrl:'https://www.dst.tycg.gov.tw/cp.aspx?n=11715',notices:['官方資料可確認主場地直徑約 82 公尺、固定座椅與活動座椅；演唱會平面票區依每場配置。']},
  'ntu-base': {id:'ntu-base',venueId:'ntu-sports-center',label:'臺大主球場基準',stage:venueModels['ntu-sports-center'].stage,sourceName:'臺大體育室場地地圖／主球場資料',sourceUrl:'https://rent.pe.ntu.edu.tw/map/',notices:['官方可確認 3–5F 固定席 3,221 張與活動伸縮座椅 1,022 張；平面票區依活動重排。']},
  'tianmu-base': {id:'tianmu-base',venueId:'tianmu-gymnasium',label:'天母體育館場館基準',stage:venueModels['tianmu-gymnasium'].stage,sourceName:'臺北市政府場館建置資料',sourceUrl:'https://english.udd.gov.taipei/News_Content.aspx?n=DD9CEC17A97FBC64&s=5C7961D8F91A70B4&sms=72544237BBE4C5F6',notices:['官方可確認約 4,620 固定席、可擴充至約 6,000 席；細分看台目前為區域級校正。']},
  'zepp-new-taipei-base': {id:'zepp-new-taipei-base',venueId:'zepp-new-taipei',label:'Zepp New Taipei 場館基準',stage:venueModels['zepp-new-taipei'].stage,sourceName:'官方售票活動頁／公開場館配置交叉校正',sourceUrl:'https://tixcraft.com/activity/detail/26_izna',notices:['1F 為活動可變站區，2F 為看台／活動站席；精確票區邊界以每場官方座位圖 OCR/Vision 自動覆寫。','未取得該場官方座位圖前，不把基準分區宣稱為售票區號。']}
};



// Curated venue-reference productions. These are intentionally separate from auto-generated
// event drafts: they are stable calibration scenes used to compare stage direction, floor depth,
// fixed tiers and relative sightline distance at each venue.
const venueReferenceSpecs = {
  'ref-aespa-taipei-dome-2026': {venueId:'taipei-dome',label:'aespa 2026 · 場館範例',stage:{main:{x:0,y:-16,z:-158,width:110,depth:31},runway:null,bStage:null},extraStageRects:[{x:0,y:-15,z:-137,width:34,depth:16}],stageRig:{verticalSupportTowers:false,sideSpeakerArrays:false},foh:{x:0,y:-19,z:31,width:45,depth:24},sourceName:'aespa 2026 官方座位圖＋臺北大巨蛋固定看台',sourceUrl:'https://www.livenation.com.tw/aespa-tpe',seatLayoutSourceUrl:'https://news-images.tvbs.com.tw/legacy/img/upload/2026/05/05/20260505080706-0466e602.jpeg',seatMapDisplayUrl:'https://networksites.livenationinternational.com/networksites/ho2pada2/site-map.jpg?height=572&rmode=max&width=1000',seatMapDisplayTrustedArchive:false,referenceExample:true,precisionGrade:'official-seatmap-calibrated',notices:['官方圖未標示長花道或 B-stage，本範例不自行生成。','官方圖未標示三根舞台遮擋柱，通用垂直支撐塔在本場關閉。']},
  'ref-nct-wish-ntsu-2026': {venueId:'ntsu-arena',label:'NCT WISH 2026 · 場館範例',stage:{main:{x:0,y:-16,z:-112,width:92,depth:27},runway:{x:0,y:-15,z1:-98,z2:-34,width:17},bStage:{x:0,y:-14,z:-27,radius:20}},foh:{x:0,y:-18,z:56,width:52,depth:16},sourceName:'林口官方場館圖＋NCT WISH 2026 reference',sourceUrl:'https://phk.ntsu.edu.tw/var/file/8/1008/img/1439/147422320.pdf',referenceExample:true,precisionGrade:'reference-calibrated',notices:['固定色區與排深沿用林口場館幾何；平面區以近期 K-pop 演唱會比例重建。']},
  'ref-nmixx-kaohsiung-arena-2026': {venueId:'kaohsiung-arena',label:'NMIXX 2026 · 場館範例',stage:{main:{x:0,y:-16,z:-111,width:94,depth:28},runway:{x:0,y:-15,z1:-96,z2:-31,width:18},bStage:{x:0,y:-14,z:-24,radius:19}},foh:{x:0,y:-18,z:54,width:58,depth:17},sourceName:'Live Nation NMIXX 場域圖／高雄巨蛋官方席位',sourceUrl:'https://www.livenation.com.tw/nmixx-khh',referenceExample:true,precisionGrade:'reference-calibrated',notices:['高雄巨蛋固定 2F/4F/5F 看台不由活動圖改寫；平面 VIP 與舞台方向依 NMIXX 場域圖做 reference。']},
  'ref-youngji-tmc-2026': {venueId:'taipei-music-center',label:'李泳知 2026 · 場館範例',stage:{main:{x:0,y:-15,z:-77,width:70,depth:22},runway:{x:0,y:-14,z1:-65,z2:-23,width:13},bStage:null},foh:{x:0,y:-17,z:24,width:30,depth:10},sourceName:'Live Nation / 北流固定觀眾席資料',sourceUrl:'https://www.livenation.com.tw/event/2026-lee-youngji-world-tour-2-0--taipei-tickets-edp1669737',referenceExample:true,precisionGrade:'reference-calibrated',notices:['1F 以站區配置呈現；2F/3F 固定席保持北流官方樓層幾何。','北流 2F 後排存在天花／結構視線風險，視角警示不因活動配置取消。']},
  'ref-hyeri-ticc-2026': {venueId:'ticc',label:'HYERI 2026 · 場館範例',stage:{main:{x:0,y:-14,z:-62,width:62,depth:19},runway:{x:0,y:-13,z1:-53,z2:-30,width:12},bStage:null},foh:{x:0,y:20,z:42,width:32,depth:12},sourceName:'TICC 官方大會堂 topology＋HYERI reference',sourceUrl:'https://www.ticc.com.tw/',referenceExample:true,precisionGrade:'reference-calibrated',notices:['大會堂無一般 1F 觀眾席；2MF、3F、4F、5F、6F 是連續後退上升的觀眾席帶。','活動只調整舞台前緣與演出設備，不改寫固定斜坡與包廂。']},
  'ref-tws-kmc-2026': {venueId:'kaohsiung-music-center',label:'TWS 2026 · 場館範例',stage:{main:{x:0,y:-15,z:-91,width:76,depth:23},runway:{x:0,y:-14,z1:-79,z2:-30,width:15},bStage:null},foh:{x:0,y:-17,z:21,width:31,depth:10},sourceName:'高流官方場館技術資料＋TWS reference',sourceUrl:'https://kpmc.com.tw/',referenceExample:true,precisionGrade:'reference-calibrated',notices:['1F 活動區依演唱會配置可變；2F 固定看台分段與高度不因活動變動。']},
  'ref-blackpink-kaohsiung-stadium-2023': {venueId:'kaohsiung-stadium',label:'BLACKPINK 2023 · 場館範例',stage:{main:{x:0,y:-17,z:-151,width:132,depth:38},runway:{x:0,y:-16,z1:-130,z2:-38,width:24},bStage:{x:0,y:-15,z:-22,radius:26}},foh:{x:0,y:-19,z:55,width:82,depth:20},sourceName:'YG Entertainment / 高雄官方活動資料',sourceUrl:'https://ygfamily.com/cn/news/notice/5483',referenceExample:true,precisionGrade:'zone-reference-calibrated',notices:['世運屬大型戶外場館，本範例用 BLACKPINK 已實際舉辦場次校正端景方向與長距離尺度。','固定看台只提供區域級視距，不宣稱每一席精準。']},
  'ref-fnc-taoyuan-arena-2025': {venueId:'taoyuan-arena',label:'FNC BAND KINGDOM 2025 · 場館範例',stage:{main:{x:0,y:-15,z:-84,width:72,depth:22},runway:null,bStage:null},foh:{x:0,y:-17,z:24,width:34,depth:11},sourceName:'桃園巨蛋官方場館圖＋FNC BAND KINGDOM reference',sourceUrl:'https://www.dst.tycg.gov.tw/cp.aspx?n=11715',referenceExample:true,precisionGrade:'zone-reference-calibrated',notices:['環形固定看台沿用官方場館輪廓；樂團型主舞台不額外虛構大型花道。']},
  'ref-lovelyz-ntu-2024': {venueId:'ntu-sports-center',label:'LOVELYZ 2024 · 場館範例',stage:{main:{x:0,y:-15,z:-72,width:62,depth:20},runway:null,bStage:null},foh:{x:0,y:-17,z:18,width:28,depth:9},sourceName:'臺大官方場館資料＋LOVELYZ reference',sourceUrl:'https://rent.pe.ntu.edu.tw/map/',referenceExample:true,precisionGrade:'zone-reference-calibrated',notices:['臺大一樓活動區與 3–5F 固定席分離；全座席端景型演出以保守舞台深度重建。']},
  'ref-kyuhyun-tianmu-2026': {venueId:'tianmu-gymnasium',label:'KYUHYUN 2026 · 場館範例',stage:{main:{x:0,y:-15,z:-72,width:62,depth:20},runway:{x:0,y:-14,z1:-62,z2:-32,width:12},bStage:null},foh:{x:0,y:-17,z:20,width:28,depth:9},sourceName:'D-SHOW / tixCraft 公告＋天母場館資料',sourceUrl:'https://tixcraft.com/',referenceExample:true,precisionGrade:'zone-reference-calibrated',notices:['全場座位席 reference；看台最前方固定欄杆列為視線風險。','不把第一排未販售座位生成為可選座位。']},
  'ref-hwasa-nangang-2024': {venueId:'nangang-exhibition-hall1-4f',label:'HWASA 2024 · 場館範例',stage:{main:{x:0,y:-14,z:-101,width:88,depth:25},runway:{x:0,y:-13,z1:-88,z2:-31,width:17},bStage:{x:0,y:-12,z:-23,radius:16}},foh:{x:0,y:-16,z:29,width:48,depth:13},sourceName:'南港展覽館官方年報＋HWASA 活動 reference',sourceUrl:'https://www.tainex.com.tw/',referenceExample:true,precisionGrade:'event-layout-reference',notices:['南港一館 4F 是平面展演空間：本範例只生成臨時活動票區、舞台與 FOH，不生成固定 arena 看台。']},
  'ref-woodz-zepp-2026': {venueId:'zepp-new-taipei',label:'WOODZ 2026 · 場館範例',stage:{main:{x:0,y:-13,z:-52,width:49,depth:15},runway:null,bStage:null},foh:{x:0,y:-15,z:9,width:17,depth:6},sourceName:'Zepp 官方樓層結構＋WOODZ 2026 activity cross-check',sourceUrl:'https://www.zepp.co.jp/hall/newtaipei/',referenceExample:true,precisionGrade:'reference-calibrated',notices:['1F 以活動站席／座席可變區處理；2F 291 固定座席保留。','小型 live house 模型以近距離視角為主，不放大成 arena 比例。']}
};
for (const [id,spec] of Object.entries(venueReferenceSpecs)) {
  const model=venueModels[spec.venueId];
  if(!model || venueLayouts[id]) continue;
  venueLayouts[id]={id,...spec,defaultTier:model.defaultTier,defaultSection:model.defaultSection,defaultRow:model.defaultRow,historical:true};
}


function autoLayoutSlug(value='') {
  return String(value || 'event').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g,'-').replace(/^-|-$/g,'').slice(0,72) || 'event';
}

function copyStage(stage) {
  if (!stage) return null;
  return JSON.parse(JSON.stringify(stage));
}

function autoStageForEvent(venueId, event={}) {
  const model=getVenueModel(venueId);
  const field=model.field || {x:120,z:90};
  const base=copyStage(model.stage) || genericStage(-Math.round(field.z*.92),Math.round(field.x*.7),28);
  const eventText=`${event.type||''} ${event.title||''} ${event.artist||''} ${(event.tags||[]).join(' ')}`;
  const isCenterStage=/\bawards?\b|asia\s*artist\s*awards|\baaa\b|360(?:°|\s*degree)?|四面台|中央舞台/i.test(eventText);
  const stadium=['taipei-dome','kaohsiung-stadium'].includes(venueId);
  if (isCenterStage && stadium) {
    const w=Math.max(54,Math.round(field.x*.30)), d=Math.max(48,Math.round(field.z*.34));
    return {main:{x:0,y:-16,z:4,width:w,depth:d},runway:null,bStage:null,centerStage:true};
  }
  // Automatic generation must be conservative. A runway/B-stage is added only when the
  // event data explicitly says one exists; otherwise keep the venue's neutral end-stage.
  const hasRunway=/runway|catwalk|b[- ]?stage|延伸台|花道|副舞台/i.test(eventText);
  if (!hasRunway) return base;
  const main=base.main || {x:0,y:-16,z:-Math.round(field.z*.92),width:Math.round(field.x*.68),depth:28};
  const runwayEnd=stadium ? Math.round(field.z*.12) : Math.round(field.z*.02);
  const runway={x:0,y:(main.y||-16)+1,z1:(main.z||-field.z*.9)+Math.max(16,(main.depth||28)*.55),z2:runwayEnd,width:Math.max(12,Math.round(field.x*.10))};
  const bStage=/b[- ]?stage|副舞台/i.test(eventText) ? {x:0,y:(main.y||-16)+2,z:Math.round(field.z*.10),radius:Math.max(16,Math.round(field.x*.11))} : null;
  return {...base,main,runway,bStage};
}

function compactHallGeometry(kind='club') {
  if(kind==='exhibition'){
    const floor=[...Array.from({length:8},(_,i)=>({...block(`F${i+1}`,'FLOOR',-70+(i%4)*46,-12+Math.floor(i/4)*58,38,48,'floor'),rowMin:1,rowMax:32,depthZ:34,rise:2}))];
    const rear=[...arcGroup(['L1','L2','C1','C2','R1','R2'],'BOWL',132,98,18,2.72,.42)].map(s=>({...s,rowMin:1,rowMax:16,depthX:26,depthZ:19,rise:12}));
    return {sections:[...floor,...rear],tiers:[{id:'FLOOR',label:'活動平面區',short:'平面',sections:floor.map(x=>x.id)},{id:'BOWL',label:'活動看台／臨時席',short:'看台',sections:rear.map(x=>x.id)}],field:{x:150,z:108},defaultTier:'FLOOR',defaultSection:'F4',defaultRow:12,stage:genericStage(-96,94,26)};
  }
  if(kind==='outdoor'){
    const floor=[...Array.from({length:10},(_,i)=>({...block(`FIELD-${i+1}`,'FLOOR',-88+(i%5)*44,-8+Math.floor(i/5)*68,36,58,'standing'),standingOnly:true,rowMin:1,rowMax:1}))];
    return {sections:floor,tiers:[{id:'FLOOR',label:'戶外活動區',short:'場地',sections:floor.map(x=>x.id)}],field:{x:190,z:138},defaultTier:'FLOOR',defaultSection:'FIELD-3',defaultRow:1,stage:genericStage(-116,110,30)};
  }
  const standing=kind==='club';
  const floor=[
    {...block('1F-L','FLOOR',-30,8,26,68,standing?'standing':'floor'),standingOnly:standing,rowMin:1,rowMax:standing?1:24,depthZ:32,rise:2},
    {...block('1F-C','FLOOR',0,8,28,68,standing?'standing':'floor'),standingOnly:standing,rowMin:1,rowMax:standing?1:24,depthZ:32,rise:2},
    {...block('1F-R','FLOOR',30,8,26,68,standing?'standing':'floor'),standingOnly:standing,rowMin:1,rowMax:standing?1:24,depthZ:32,rise:2}
  ];
  const balcony=kind==='theater' ? [
    {...block('2F-L','2F',-30,42,28,24,'balcony'),y:11,rowMin:1,rowMax:10,seatEstimateMax:20,rise:9},
    {...block('2F-C','2F',0,42,30,24,'balcony'),y:11,rowMin:1,rowMax:10,seatEstimateMax:22,rise:9},
    {...block('2F-R','2F',30,42,28,24,'balcony'),y:11,rowMin:1,rowMax:10,seatEstimateMax:20,rise:9}
  ] : [];
  return {sections:[...floor,...balcony],tiers:[{id:'FLOOR',label:standing?'1F 活動站區':'1F 活動座席',short:'1F',sections:floor.map(x=>x.id)},...(balcony.length?[{id:'2F',label:'2F 看台',short:'2F',sections:balcony.map(x=>x.id)}]:[])],field:{x:70,z:72},defaultTier:'FLOOR',defaultSection:'1F-C',defaultRow:standing?1:10,stage:genericStage(-62,58,18)};
}

const AUTO_EVENT_3D_PIPELINE_VERSION='0.40.10-mainstream12-3dprecision.1';
function autoEvent3DSignature(event={},venueId=''){
  const compactRules=(event.sectionPriceRules||[]).map(r=>[r?.label||'',r?.price||'']);
  return JSON.stringify({
    v:AUTO_EVENT_3D_PIPELINE_VERSION,
    venueId,
    eventId:event.id||'',
    artist:event.artist||'',
    title:event.title||'',
    start:event.start||'',
    end:event.end||'',
    seat:event.seatLayoutSourceUrl||'',
    ticket:event.ticketUrl||event.ticketSourceUrl||event.secondarySourceUrl||'',
    price:event.price||'',
    rules:compactRules
  });
}
function autoEvent3DState(event={},linked=false){
  if(linked) return 'official-map-pending';
  if(event.ticketUrl||event.ticketSourceUrl||event.secondarySourceUrl||event.sourceUrl) return 'ticket-source-pending-seat-map';
  return 'venue-derived-draft';
}

function runtimeVenueKind(event={}){
  const text=`${event.venue||''} ${event.type||''}`.toLowerCase();
  if(/outdoor|戶外|廣場|公園|園區|festival|waterbomb|stadium|主場館|體育場/.test(text)) return 'outdoor';
  if(/展覽|exhibition|arena|巨蛋|體育館|gymnasium/.test(text)) return 'exhibition';
  if(/legacy|live house|warehouse|westar|space|club|音樂空間/.test(text)) return 'club';
  return 'theater';
}
const MAINSTREAM_3D_SET = new Set(MAINSTREAM_3D_VENUE_IDS);
export function shouldGenerateEvent3D(event={}){
  const explicit=event.venueModelId;
  if(explicit && venueModels[explicit]) return MAINSTREAM_3D_SET.has(explicit);
  const known=venueIdFromName(event.venue||'');
  if(known && venueModels[known]) return MAINSTREAM_3D_SET.has(known);
  const venueText=String(event.venue||'').toLowerCase();
  // Never fabricate rows/seats for ad-hoc outdoor grounds.
  if(/廣場|公園|休閒園區|海灘|沙灘|草地|碼頭|河濱|戶外廣場|festival ground|open field/.test(venueText)) return false;
  // v0.40.7 resource policy: only the twelve retained calibrated venues receive 3D work.
  // Unknown / lower-priority halls stay in the activity list even when a seat-map URL exists.
  return false;
}

export function ensureVenueModelForEvent(event={}){
  if(!shouldGenerateEvent3D(event)) return null;
  const explicit=event.venueModelId;
  if(explicit && venueModels[explicit]) return explicit;
  const known=venueIdFromName(event.venue||'');
  if(known && venueModels[known]) return known;
  const venueName=String(event.venue||'').trim();
  if(!venueName || event.allowProvisional3D!==true || !event.seatLayoutSourceUrl) return null;
  const id=`runtime-${autoLayoutSlug(venueName)}`;
  if(!venueModels[id]){
    const geom=compactHallGeometry(runtimeVenueKind(event));
    venueModels[id]={id,name:venueName,en:venueName.toUpperCase(),city:event.city||'Taiwan',...geom,baseLayoutId:`${id}-base`,sourceName:'官方活動座位圖驅動的暫定場館模型',sourceUrl:event.seatLayoutSourceUrl,confidence:'暫定；僅在有官方座位圖且明確 opt-in 時建立',dynamicFallback:true,geometryPolicy:{topology:'provisional-official-map',fixedSectionsAuthoritative:false,flexibleTierIds:['FLOOR'],allowSyntheticSections:true,allowFullSectionReplacement:true,allowSeatMapStageOverride:true,minStageOverrideConfidence:.86}};
    venueLayouts[`${id}-base`]={id:`${id}-base`,venueId:id,label:'官方座位圖暫定場館基準',stage:geom.stage,dynamicFallback:true,notices:['此場館尚未完成固定幾何校正；只有在已連結官方座位圖時才顯示暫定 3D，未驗證前不提供固定樓層／排號宣稱。']};
  }
  return id;
}

/**
 * Register an activity-specific 3D draft at runtime.
 * - Existing hand-calibrated layouts always win.
 * - New events at a known venue automatically receive a generated layout.
 * - If an official seating-map/ticket-layout URL is attached to the event, the draft is labelled as map-linked,
 *   but NEUL still treats the geometry as provisional rather than claiming pixel-perfect image extraction.
 */
export function ensureAutoEventLayout(event={}) {
  const venueId=ensureVenueModelForEvent(event);
  if (!venueId || !venueModels[venueId]) return null;
  const currentId=event.venueLayoutId;
  const current=currentId ? venueLayouts[currentId] : null;
  if (current?.eventId && !current.autoGenerated) {
    // Preserve hand-calibrated geometry/distances, but continuously sync official ticket metadata.
    current.eventSpecific3D=true;
    current.autoPipelineVersion=AUTO_EVENT_3D_PIPELINE_VERSION;
    current.autoGenerationSignature=autoEvent3DSignature(event,venueId);
    const officialMapLinked=Boolean(event.seatLayoutSourceUrl||current.latestSeatLayoutSourceUrl);
    const officialMapVerified=Boolean(current.seatMapDetected && (current.verifiedAt||current.autoMapAnalyzedAt||current.seatMapFingerprint));
    current.generationState=officialMapVerified ? 'hand-calibrated-official-map' : (officialMapLinked ? 'official-map-pending' : 'hand-calibrated');
    current.customizationLevel=officialMapVerified ? 'hand-calibrated-official-map' : (officialMapLinked ? 'official-map-linked' : 'hand-calibrated');
    current.qaGate={eventSpecific:true,stagePresent:Boolean(current.stage?.main),officialMapLinked,officialMapVerified,priceMappingVerified:Boolean((current.sectionPriceRules||[]).length||Object.keys(current.sectionPriceLabels||{}).length||Object.keys(current.priceLabels||{}).length),requiresReview:Boolean(officialMapLinked&&!officialMapVerified)};
    if (Array.isArray(event.sectionPriceRules)) current.sectionPriceRules=JSON.parse(JSON.stringify(event.sectionPriceRules));
    if (event.price) current.priceSummary=event.price;
    if (event.seatLayoutSourceUrl) {
      current.latestSeatLayoutSourceUrl=event.seatLayoutSourceUrl;
      current.seatMapNeedsRefresh=true;
    }
    current.ticketSyncSignature=JSON.stringify({seat:event.seatLayoutSourceUrl||null,price:event.price||null,rules:event.sectionPriceRules||[]});
    current.lastEventSyncAt=event.checkedAt || new Date().toISOString();
    return current.id;
  }

  const id=`auto-${autoLayoutSlug(event.id || `${event.artist}-${event.start}`)}`;
  const model=getVenueModel(venueId);
  const base=getVenueLayout(model.baseLayoutId);
  const linked=Boolean(event.seatLayoutSourceUrl);
  if (!venueLayouts[id]) {
    venueLayouts[id]={
      id,
      venueId,
      eventId:event.id || null,
      label:`${event.artist || '本場活動'} · 自動本場 3D`,
      stage:autoStageForEvent(venueId,event),
      foh: base?.foh ? JSON.parse(JSON.stringify(base.foh)) : null,
      defaultTier:model.defaultTier,
      defaultSection:model.defaultSection,
      defaultRow:model.defaultRow,
      sourceName: linked ? '官方座位配置連結＋場館基準自動生成' : '官方活動場館資訊＋場館基準自動生成',
      sourceUrl:event.seatLayoutSourceUrl || event.sourceUrl || model.sourceUrl,
      autoGenerated:true,
      eventSpecific3D:true,
      autoPipelineVersion:AUTO_EVENT_3D_PIPELINE_VERSION,
      autoGenerationSignature:autoEvent3DSignature(event,venueId),
      generationState:autoEvent3DState(event,linked),
      seatMapNeedsRefresh:linked,
      verifiedAgainstCurrentSource:false,
      customizationLevel:linked ? 'official-map-linked' : 'venue-derived',
      qaGate:{eventSpecific:true,stagePresent:true,officialMapLinked:linked,officialMapVerified:false,priceMappingVerified:false,requiresReview:true},
      seatMapDetected:false,
      generationConfidence: linked ? 'seat-map-linked-draft' : 'venue-only-draft',
      sectionPriceRules:Array.isArray(event.sectionPriceRules) ? JSON.parse(JSON.stringify(event.sectionPriceRules)) : [],
      priceSummary:event.price || null,
      ticketSyncSignature:JSON.stringify({seat:event.seatLayoutSourceUrl||null,price:event.price||null,rules:event.sectionPriceRules||[]}),
      generatedAt:new Date().toISOString(),
      notices:[
        linked
          ? '系統已偵測本場官方座位配置來源，並以場館固定幾何自動建立本場 3D 草稿；票區輪廓仍以官方售票頁為最終依據。'
          : '本場尚未偵測到可解析的官方座位配置；目前以活動場館與一般舞台規則自動建立本場 3D 草稿。',
        '自動生成不會取代一般場館 3D；使用者可隨時切回固定場館位置查看。',
        '舞台、FOH、封閉區與視線限制若官方後續更新，下一次活動資料同步後會重新建立對應草稿。',
        ...(Array.isArray(event.sectionPriceRules)&&event.sectionPriceRules.length ? ['官方頁若提供可辨識的票區名稱＋價位，NEUL 會自動對應到同名票區；區名無法可靠對上時只保留價位資料，不會硬套。'] : [])
      ]
    };
  } else if (venueLayouts[id].autoGenerated) {
    const layout=venueLayouts[id];
    const nextSignature=autoEvent3DSignature(event,venueId);
    const previousSignature=layout.autoGenerationSignature||'';
    const sourceChanged=Boolean(previousSignature && previousSignature!==nextSignature);
    const nextSeatSource=event.seatLayoutSourceUrl||null;
    const seatSourceChanged=Boolean(layout.latestSeatLayoutSourceUrl && nextSeatSource && layout.latestSeatLayoutSourceUrl!==nextSeatSource);
    layout.stage=autoStageForEvent(venueId,event);
    layout.eventSpecific3D=true;
    layout.autoPipelineVersion=AUTO_EVENT_3D_PIPELINE_VERSION;
    layout.autoGenerationSignature=nextSignature;
    layout.customizationLevel=linked ? 'official-map-linked' : 'venue-derived';
    layout.sourceName=linked ? '官方座位配置連結＋場館基準自動生成' : '官方活動場館資訊＋場館基準自動生成';
    layout.sourceUrl=event.seatLayoutSourceUrl || event.sourceUrl || model.sourceUrl;
    layout.latestSeatLayoutSourceUrl=nextSeatSource || layout.latestSeatLayoutSourceUrl || null;
    if(!linked) layout.seatMapDetected=false;
    else if(sourceChanged || seatSourceChanged) layout.seatMapDetected=false;
    else layout.seatMapDetected=Boolean(layout.seatMapDetected && layout.verifiedAgainstCurrentSource);
    layout.generationConfidence=linked ? 'seat-map-linked-draft' : 'venue-only-draft';
    layout.sectionPriceRules=Array.isArray(event.sectionPriceRules) ? JSON.parse(JSON.stringify(event.sectionPriceRules)) : [];
    layout.priceSummary=event.price || layout.priceSummary || null;
    layout.ticketSyncSignature=JSON.stringify({seat:event.seatLayoutSourceUrl||null,price:event.price||null,rules:event.sectionPriceRules||[]});
    if(sourceChanged){
      layout.lastSourceChangeAt=new Date().toISOString();
      layout.seatMapNeedsRefresh=linked;
      layout.verifiedAgainstCurrentSource=false;
      layout.generationState=autoEvent3DState(event,linked);
      layout.qaGate={eventSpecific:true,stagePresent:Boolean(layout.stage?.main),officialMapLinked:linked,officialMapVerified:false,priceMappingVerified:false,requiresReview:true,sourceChanged:true};
      if(seatSourceChanged){
        layout.previousSeatLayoutSourceUrl=layout.seatMapResolvedUrl||layout.previousSeatLayoutSourceUrl||null;
        layout.autoMapAnalyzedAt=null;
        layout.autoStageConfidence=0;
        layout.sectionMapping=null;
      }
    } else {
      layout.generationState=layout.generationState||autoEvent3DState(event,linked);
      layout.qaGate={...(layout.qaGate||{}),eventSpecific:true,stagePresent:Boolean(layout.stage?.main),officialMapLinked:linked,requiresReview:Boolean(layout.qaGate?.requiresReview ?? true)};
    }
    layout.generatedAt=new Date().toISOString();
    layout.notices=[
      linked
        ? '系統已偵測本場官方座位配置來源，並以場館固定幾何自動建立本場 3D 草稿；票區輪廓仍以官方售票頁為最終依據。'
        : '本場尚未偵測到可解析的官方座位配置；目前以活動場館與一般舞台規則自動建立本場 3D 草稿。',
      '自動生成不會取代一般場館 3D；使用者可隨時切回固定場館位置查看。',
      '舞台、FOH、封閉區與視線限制若官方後續更新，下一次活動資料同步後會重新建立對應草稿。',
      ...(Array.isArray(event.sectionPriceRules)&&event.sectionPriceRules.length ? ['官方頁若提供可辨識的票區名稱＋價位，NEUL 會自動對應到同名票區；區名無法可靠對上時只保留價位資料，不會硬套。'] : [])
    ];
  }
  return id;
}


export function applyAutoSeatMapAnalysis(layoutId, analysis={}, options={}) {
  const layout=venueLayouts[layoutId];
  if(!layout || !analysis || !analysis.hash) return false;
  if(!layout.autoGenerated && !layout.seatMapAutoRegenerate && !layout.seatMapDetected) return false;

  const model=venueModels[layout.venueId];
  if(!model) return false;
  const policy=model.geometryPolicy||{};
  const applyGeometry=options.geometry !== false;
  const fixedAuthoritative=policy.fixedSectionsAuthoritative!==false;
  const flexibleTierIds=new Set((policy.flexibleTierIds||[]).map(String));
  const minStageConfidence=Number(policy.minStageOverrideConfidence ?? .82);
  const allowStageOverride=applyGeometry && policy.allowSeatMapStageOverride!==false && Number(analysis.stageConfidence||0)>=minStageConfidence;
  const forceReplace=options.replaceSections===true;
  const allowFullReplacement=Boolean(policy.allowFullSectionReplacement && (forceReplace || options.replaceSections!==false));

  if(allowStageOverride && analysis.stage){
    layout.stage=JSON.parse(JSON.stringify(analysis.stage));
    if(Array.isArray(analysis.extraStageRects)) layout.extraStageRects=JSON.parse(JSON.stringify(analysis.extraStageRects));
  } else if(policy.allowSeatMapStageOverride===false || fixedAuthoritative) {
    // Fixed theatre / auditorium geometry stays physically anchored to the venue.
    // A pixel detector is evidence for ticket zones, not permission to move a built-in stage.
    layout.extraStageRects=Array.isArray(layout.extraStageRects)?layout.extraStageRects:[];
  }

  const baseById=new Map((model.sections||[]).map(sec=>[String(sec.id),sec]));
  const exactPriceLabels={...(layout.sectionPriceLabels||{})};
  const eventSections=[];
  const syntheticSections=[];
  const analyzedSections=Array.isArray(analysis.sections)?analysis.sections:[];

  for(const sec of analyzedSections){
    const id=String(sec?.id||'');
    const base=baseById.get(id);
    if(base){
      // OCR can activate/enrich a known venue section, but cannot move fixed venue geometry.
      const merged=fixedAuthoritative
        ? {...base,eventActive:true,autoDerived:Boolean(sec.autoDerived),ocrDerived:Boolean(sec.ocrDerived),autoPrice:sec.autoPrice||undefined}
        : {...base,...sec,eventActive:true};
      eventSections.push(merged);
      if(sec.autoPrice) exactPriceLabels[id]=sec.autoPrice;
      continue;
    }
    if(sec?.autoPrice && id) exactPriceLabels[id]=sec.autoPrice;
    if(!applyGeometry || !policy.allowSyntheticSections || !flexibleTierIds.size) continue;

    // Unmatched Vision components may exist only inside a physically reconfigurable tier
    // (arena floor / live-house floor / exhibition floor). Never create a new 1F/2F/etc.
    // fixed balcony from image pixels.
    const targetTier=[...flexibleTierIds][0];
    const reference=(model.sections||[]).filter(x=>String(x.tier)===targetTier);
    const y=reference.length ? reference.reduce((sum,x)=>sum+Number(x.y??-19),0)/reference.length : -19;
    syntheticSections.push({
      ...sec,
      id:id||`AUTO-${syntheticSections.length+1}`,
      tier:targetTier,
      y,
      shape:'block',
      structuralOnly:false,
      eventFlexible:true,
      syntheticOfficialMap:true,
      eventActive:true
    });
  }

  if(analyzedSections.length>=3){
    if(allowFullReplacement){
      // Only flat / explicitly replaceable venues may use full pixel-derived geometry.
      layout.sections=JSON.parse(JSON.stringify(analyzedSections));
      layout.tiers=JSON.parse(JSON.stringify(analysis.tiers||[]));
      layout.replaceStructuralTiers=[...new Set([...(layout.replaceStructuralTiers||[]),...(policy.flexibleTierIds||['FLOOR'])])];
    } else if(layout.autoGenerated){
      layout.sections=[...eventSections,...syntheticSections];
      const grouped=new Map();
      for(const sec of syntheticSections){
        const tier=String(sec.tier);
        if(!grouped.has(tier)) grouped.set(tier,[]);
        grouped.get(tier).push(String(sec.id));
      }
      layout.tiers=[...grouped].map(([id,sections])=>({id,label:model.tiers?.find(t=>String(t.id)===id)?.label||id,short:model.tiers?.find(t=>String(t.id)===id)?.short||id,sections}));
      // Structural fixed tiers are never replaced by an automatically detected map.
      layout.replaceStructuralTiers=(layout.replaceStructuralTiers||[]).filter(t=>flexibleTierIds.has(String(t)) && policy.allowFullSectionReplacement);
    }
    layout.sectionPriceLabels=exactPriceLabels;
    const priceLabels={...(layout.priceLabels||{})};
    for(const sec of [...eventSections,...syntheticSections]) if(sec.autoPrice && sec.group) priceLabels[sec.group]=sec.autoPrice;
    layout.priceLabels=priceLabels;
  }

  layout.seatMapFingerprint=analysis.hash;
  layout.seatMapDetected=true;
  layout.generationConfidence=analysis.confidence||'map-pixel-derived';
  layout.seatMapResolvedUrl=analysis.resolvedUrl||layout.sourceUrl||null;
  layout.seatMapHintScore=Number(analysis.seatMapHintScore||0);
  layout.sectionMapping=analysis.ocr?JSON.parse(JSON.stringify(analysis.ocr)):null;
  layout.autoMapProfile=analysis.profile||'unknown';
  layout.autoStageConfidence=Number(analysis.stageConfidence||0);
  layout.autoLegendConfidence=analysis.legendConfidence||'unverified-no-price-guess';
  layout.autoGeometryApplied=Boolean((allowStageOverride && analysis.stage) || syntheticSections.length || allowFullReplacement);
  layout.autoMapAnalyzedAt=new Date().toISOString();
  layout.eventSpecific3D=true;
  layout.autoPipelineVersion=AUTO_EVENT_3D_PIPELINE_VERSION;
  layout.seatMapNeedsRefresh=false;
  layout.verifiedAgainstCurrentSource=true;

  const mappedCount=Number(layout.sectionMapping?.mappedCount||0);
  const stageEvidenceOk=policy.allowSeatMapStageOverride===false ? true : Number(layout.autoStageConfidence||0)>=minStageConfidence;
  const officialMapVerified=mappedCount>=2 && stageEvidenceOk;
  const mappedPriceCount=analyzedSections.filter(sec=>sec?.autoPrice).length+Object.keys(layout.sectionPriceLabels||{}).length+Object.keys(layout.priceLabels||{}).length;
  const priceMappingVerified=mappedPriceCount>0 && Boolean((layout.sectionPriceRules||[]).length || (analysis.legend||[]).length);
  layout.generationState=officialMapVerified ? 'official-map-verified-topology-guarded' : 'official-map-partial-topology-guarded';
  layout.priceMappingState=priceMappingVerified ? 'verified' : ((layout.sectionPriceRules||[]).length ? 'pending-section-match' : 'no-section-price-evidence');
  layout.customizationLevel=mappedCount>=2 ? 'official-map-ocr-mapped-topology-guarded' : 'official-map-vision-topology-guarded';
  layout.topologyGuard={
    topology:policy.topology||'unknown',
    fixedSectionsAuthoritative:fixedAuthoritative,
    flexibleTierIds:[...flexibleTierIds],
    syntheticSectionsAdded:syntheticSections.length,
    stageOverrideApplied:Boolean(allowStageOverride&&analysis.stage),
    forbiddenAudienceFloor1:policy.audienceFloor1===false
  };
  layout.qaGate={eventSpecific:true,stagePresent:Boolean(layout.stage?.main),officialMapLinked:true,officialMapVerified,priceMappingVerified,requiresReview:!officialMapVerified,topologyGuarded:true};

  if(layout.autoGenerated){
    const guardNote=policy.audienceFloor1===false
      ? 'TICC 大會堂觀眾席固定為 2MF／3F／4F／5F／6F 與 L/R 包廂；自動辨識不得生成一般 1F 觀眾席。'
      : '自動辨識只可改動該場館的活動可變區，固定看台／樓層拓樸保持場館校正模型。';
    layout.sourceName='官方座位圖＋Venue Topology Guard＋OCR/Vision';
    layout.notices=[
      mappedCount>=2 ? `已從官方座位圖辨識並對回 ${mappedCount} 個既有票區標籤。` : '官方座位圖已解析，但尚未有足夠票區標籤可安全對回固定場館幾何。',
      guardNote,
      syntheticSections.length ? `僅在活動可變層新增 ${syntheticSections.length} 個 Vision 票區草稿；固定樓層不會被像素區塊取代。` : '未新增任何不屬於場館固定拓樸的樓層／看台。',
      '官方座位圖內容若更新，圖片 hash 改變後會重新分析；若場館提示與圖片無法消歧義，系統會拒絕自動套圖而不是猜測。'
    ];
  }
  return true;
}

export function baseLayoutIdForVenue(venueId) {
  return getVenueModel(venueId)?.baseLayoutId || null;
}

export function activityLayoutMeta(event={}) {
  const venueId=ensureVenueModelForEvent(event);
  if (!venueId || !venueModels[venueId]) return null;
  const specificId=ensureAutoEventLayout({...event,venueModelId:venueId});
  const specific=getVenueLayout(specificId);
  return {
    venueId,
    activityLayoutId:specificId,
    baseLayoutId:getVenueModel(venueId).baseLayoutId,
    autoGenerated:Boolean(specific?.autoGenerated),
    seatMapDetected:Boolean(specific?.seatMapDetected)
  };
}

export function layoutsForVenue(venueId) { return Object.values(venueLayouts).filter(x=>x.venueId===venueId); }
export function kstarExampleForVenue(venueId) { return layoutsForVenue(venueId).find(x=>x.kstarExample) || null; }
export function getVenueModel(venueId) { return venueModels[venueId] || null; }
export function getVenueLayout(layoutId) { return layoutId ? (venueLayouts[layoutId] || null) : null; }
export function effectiveTiers(venueId, layoutId) {
  const model=getVenueModel(venueId), layout=getVenueLayout(layoutId);
  if(!model) return [];
  const replace=new Set(((layout?.replaceStructuralTiers)||[]).map(String));
  const base=(model.tiers||[]).filter(t=>!replace.has(String(t.id))).map(t=>({...t,sections:[...(t.sections||[])]}));
  if(!layout || layout.venueId!==venueId || !Array.isArray(layout.tiers)) return base;
  const merged=new Map(base.map(t=>[String(t.id),t]));
  for(const eventTier of layout.tiers){
    const id=String(eventTier.id);
    const existing=merged.get(id);
    if(existing) merged.set(id,{...existing,...eventTier,sections:[...new Set([...(existing.sections||[]),...(eventTier.sections||[])])]});
    else merged.set(id,{...eventTier,sections:[...(eventTier.sections||[])]});
  }
  return [...merged.values()];
}
export function effectiveSections(venueId, layoutId) {
  const model=getVenueModel(venueId), layout=getVenueLayout(layoutId);
  if(!model) return [];
  if(!layout || layout.venueId!==venueId || !Array.isArray(layout.sections)) return model.sections;
  // Event-specific ticket maps often expose only sold/open blocks. For 3D we still
  // render the complete physical venue bowl and let event sections override the
  // corresponding structural sections. This prevents auto-generated events from
  // looking like an incomplete arena.
  const eventById=new Map(layout.sections.map(s=>[String(s.id),{...s,eventActive:true}]));
  const replace=new Set((layout.replaceStructuralTiers||[]).map(String));
  const eligibleBase=model.sections.filter(s=>!replace.has(String(s.tier)));
  const structural=eligibleBase.map(s=>eventById.get(String(s.id)) || {...s,eventActive:false});
  const extras=layout.sections.filter(s=>!eligibleBase.some(m=>String(m.id)===String(s.id))).map(s=>({...s,eventActive:true}));
  return [...structural,...extras];
}
export function getVenueTier(venueId,tierId,layoutId=null) { const tiers=effectiveTiers(venueId,layoutId); return tiers.find(t=>t.id===tierId)||tiers[0]; }
export function getVenueSection(venueId,id,layoutId=null) {
  if (venueId==='taipei-dome' && (!layoutId || !getVenueLayout(layoutId).sections)) return getTaipeiDomeSection(id);
  return effectiveSections(venueId,layoutId).find(s=>s.id===String(id))||null;
}
export function venueSectionPosition(venueId, section, row=10, seatNumber=null) {
  if (venueId==='taipei-dome' && section && section.shape!=='block') return domeSectionPosition(section,row,seatNumber);
  if (!section) return {x:0,y:0,z:0};
  const rowMin=Number(section.rowMin ?? 1), rowMax=Math.max(rowMin+1,Number(section.rowMax ?? 30));
  const rowValue=Math.max(rowMin,Math.min(rowMax,Number(row ?? rowMin)));
  let raw=(rowValue-rowMin)/(rowMax-rowMin);
  if(section.rowDirection==='reverse') raw=1-raw;
  const depth=Math.pow(Math.min(1,Math.max(0,raw)),Number(section.rowCurve||1));
  if (section.shape==='block' || Number.isFinite(section.x)) {
    const seatN=Number(seatNumber); const seatMax=Number(section.seatEstimateMax); const lateral=Number.isFinite(seatN)?(Number.isFinite(seatMax)&&seatMax>1?Math.max(-.46,Math.min(.46,((seatN-(seatMax+1)/2)/(seatMax-1))*.92)):Math.max(-.46,Math.min(.46,(seatN-20)/42))):0;
    const blockDepth=Number(section.depthZ ?? Math.max(10,(section.depth||24)*.72));
    const rise=Number(section.rise ?? 5);
    return {x:section.x+lateral*(section.width||38),y:(section.y ?? -18)+depth*rise,z:section.z+depth*blockDepth};
  }
  const rx=section.radiusX+depth*Number(section.depthX ?? 26), rz=section.radiusZ+depth*Number(section.depthZ ?? 20);
  const seatN=Number(seatNumber); const seatMax=Number(section.seatEstimateMax); const lateral=Number.isFinite(seatN)?(Number.isFinite(seatMax)&&seatMax>1?Math.max(-.42,Math.min(.42,((seatN-(seatMax+1)/2)/(seatMax-1))*.84)):Math.max(-.42,Math.min(.42,(seatN-25)/60))):0;
  const a=section.angle+lateral*(section.span||.10);
  return {x:Math.cos(a)*rx,y:section.y+depth*Number(section.rise ?? 12),z:Math.sin(a)*rz};
}
function priceRuleMatch(ruleLabel='', section={}) {
  const norm=v=>String(v||'').toLowerCase().replace(/[（(][^）)]*[）)]/g,'').replace(/\s+/g,'').replace(/[區席票]/g,'').replace(/[臺台]/g,'台');
  const raw=String(ruleLabel||'');
  const r=norm(raw);
  if(!r) return false;
  const candidates=[section.id,section.label,section.officialId,section.group,...(Array.isArray(section.aliases)?section.aliases:[])].map(norm).filter(Boolean);
  for(const c of candidates){
    if(r===c || r.includes(c) || c.includes(r)) return true;
  }
  const parts=raw.split(/[、,，/／+＋&＆]/).map(norm).filter(Boolean);
  for(const part of parts){
    if(candidates.some(c=>part===c || part.includes(c) || c.includes(part))) return true;
  }
  // Expand common letter ranges such as VIP A~E only when the section carries the same prefix.
  const range=raw.match(/([A-Za-z0-9一-龥]+)\s*([A-Z])\s*[~～-]\s*([A-Z])/i);
  if(range){
    const prefix=norm(range[1]); const from=range[2].toUpperCase().charCodeAt(0), to=range[3].toUpperCase().charCodeAt(0);
    for(const c of candidates){
      const m=c.match(/^(.+?)([a-z])$/i);
      if(m && (!prefix || m[1].includes(prefix) || prefix.includes(m[1]))){
        const code=m[2].toUpperCase().charCodeAt(0); if(code>=Math.min(from,to)&&code<=Math.max(from,to)) return true;
      }
    }
  }
  // Generic tier labels are accepted only when the rule itself is exactly a tier label.
  const tier=norm(section.tier);
  if(tier && r===tier) return true;
  if(r.startsWith('vip') && (tier==='vip' || candidates.some(c=>c.startsWith('vip')))) return true;
  return false;
}
export function sectionTicketLabel(layoutId, sectionId) {
  const layout=getVenueLayout(layoutId); if(!layout) return null; const section=effectiveSections(layout.venueId,layoutId).find(s=>s.id===String(sectionId));
  if (!section) return null;
  if (layout.sectionPriceLabels?.[String(sectionId)]) return layout.sectionPriceLabels[String(sectionId)];
  if (section.group && layout.priceLabels?.[section.group]) return layout.priceLabels[section.group];
  const rule=(layout.sectionPriceRules||[]).find(r=>priceRuleMatch(r.label,section));
  return rule?.price || null;
}
export function venueSectionWarning(venueId, sectionId, row, layoutId, viewer={}) {
  if (venueId==='taipei-dome') return domeSectionWarning(sectionId,row,getVenueLayout(layoutId),viewer);
  const messages=[]; let level='normal'; const layout=getVenueLayout(layoutId) || {id:layoutId||'',venueId}; const id=String(sectionId);
  const structuralSection=getVenueSection(venueId,id,layoutId);
  if (structuralSection?.structuralOnly) {
    messages.push(`${structuralSection.tier==='B1'?'B1':'此層'}為可變動活動座席／結構示意，不代表本場實際售票區；實際排椅、站區與封閉範圍以該場官方座位圖為準。`);
    level='info';
  }
  if (layout.id==='plave-keep-it-manic-2026') {
    const price=sectionTicketLabel(layoutId,id); if (price) messages.push(`本場官方票區圖對應票價：${price}。`);
    if (layout.restrictedViewSections?.includes(id)) { messages.push('拓元官方售票頁將本票區列為部分座位可能視線受阻的區域。'); level='caution'; }
    if (layout.frontRowRailCaution && Number(row)<=3 && !id.startsWith('VIP')) { messages.push('官方提醒 2F／3F 看台前方數排可能受到場館固定安全欄杆影響。'); if(level==='normal') level='notice'; }
    messages.push('本場為官方票區圖重建；目前精準到票區相對位置，不宣稱單一座椅視角。');
    return {level,messages};
  }
  if (layout.id==='ive-show-what-i-am-2026') {
    const price=sectionTicketLabel(layoutId,id); if (price) messages.push(`本場官方票區圖對應：${price}。`);
    if (/^(紅2|紫2)/.test(id)) messages.push('官方 IVE 2026 票區圖顯示此區位於舞台側邊，不在主螢幕背面；3D 已改以側向觀看主舞台／延伸台交界校正。');
    if (id.startsWith('東') || id.startsWith('西')) messages.push('此區為官方後續開放的 3F 東／西側包廂席；官方票區圖標示 NT$4,800／人。');
    if (id.startsWith('黃3')) messages.push('3F 同一大區內可能依排數落在不同票價帶；本站不把整區簡化成單一票價。');
    messages.push('IVE 2026 台北場為官方票區圖重建；目前校正到舞台與票區相對位置，不宣稱單席精準視角。');
    return {level:'notice',messages};
  }
  if (layout.id==='le-sserafim-pureflow-2026') {
    const price=sectionTicketLabel(layoutId,id); if(price) messages.push(`本場官方票區圖對應：${price}。`);
    if(/^VIP [ABC]$/.test(id)){messages.push('拓元官方公告：1F VIP 為站席，依票面序號排隊入場；3D 不顯示固定椅。');level='notice';}
    if(layout.restrictedViewSections?.includes(id)){messages.push('官方將此區列為部分座位可能無法完整觀看主舞台 LED／中後端演出的視線限制區。');level='caution';}
    else if(layout.frontRowRailCaution && !/^VIP/.test(id)){messages.push('官方提醒橙、藍、黃看台前方數排可能受固定安全欄杆影響。');if(level==='normal')level='notice';}
    messages.push('本場 3D 依拓元官方票區圖重建到舞台／VIP／FOH／票區相對位置；實際現場設備仍以主辦公告為準。');
    return {level,messages};
  }
  if (venueId==='ntsu-arena') {
    const sec=getVenueSection(venueId,id,layoutId);
    if(sec?.rowDirection==='reverse') { messages.push('林口部分固定看台採倒序排號校正：較大的排號可能反而更靠前；本版已讓排數實際改變鏡頭前後距離。'); level='notice'; }
    if(Number(row)===0 || Number(row)>=14) { messages.push('公開實拍顯示林口部分看台的 0 排／14–15 排常位於走道、欄杆或實際前排附近；實際開放方式依活動而異。'); if(level==='normal') level='notice'; }
  }
  if (venueId==='taipei-arena') {
    if(/^(紅2|紫2|黃2|藍2)/.test(id)) messages.push('小巨蛋 2F 公開座位紀錄可驗證到第 15 排；紅2A亦有 15排28號紀錄。未找到可靠資料支持固定席紅2存在第16排以上，因此本版不會為了視覺感硬加不存在的排數。');
    if(/^黃3/.test(id) && Number(row)>=26){ messages.push('小巨蛋 3F 高排公開實拍顯示可能受到燈架、牆面或上方結構影響；本版已加大高排後退距離。'); level='notice'; }
    if(/^(紅2|紫2)/.test(id)){ messages.push('側席鏡頭改以主舞台前緣／延伸台交界為觀看目標，不再對準 LED 背面。'); if(level==='normal') level='notice'; }
  }
  if (venueId==='taipei-music-center') {
    if (id.startsWith('1F')) { messages.push('北流 1F 沒有固定座位；此位置是平面區域示意，實際排／序號依主辦配置。'); level='notice'; }
    if (id.startsWith('3') && Number(row)<=3) { messages.push('3F 前排公開實拍可見玻璃／欄杆介入視線，尤其手機放低拍攝時更明顯；肉眼通常比鏡頭受影響小。'); level='notice'; }
    if (id==='3D' && Number(row)>=17) { messages.push('公開實拍顯示 3D 17 排已接近最後排中央，適合看整體燈光與舞台圖形，人物細節則更仰賴螢幕／倍率。'); level='notice'; }
    if (id==='2C' && Number(row)>=15) { messages.push('2C 15 排已有公開實拍案例，屬該區很後方的位置；本版已將 2F 排深校正到 15 排。'); level='notice'; }
  }
  if (venueId==='ticc') {
    if (/BOX/.test(id)) { messages.push('側邊包廂觀看角度較斜，前方欄杆及鄰座物件可能影響視野；公開實拍亦有包廂前方欄杆遮擋案例。'); level='notice'; }
    if (id==='2F-A' && Number(row)<=1) { messages.push('2F-A 前排高度較低，公開實拍曾出現人頭或舞台設備遮到下半部的情況。'); level='notice'; }
    if (id==='4F-B' && Number(row)>=35) { messages.push('4F-B 後半接近控台區；本版加入控台體積作為基準遮擋參考，實際位置仍以當場設備為準。'); level='notice'; }
    if (id==='4F-C' && Number(row)>=36) { messages.push('4F-C 36 排公開實拍顯示人物肉眼已偏小，通常會更多依賴大螢幕。'); level='notice'; }
    if (id.startsWith('5F') || id.startsWith('6F')) { messages.push('高樓層人物肉眼比例較小，較適合觀看整體舞台；6F 31 排已有公開實拍顯示臉部細節難辨識。'); level='notice'; }
  }
  if (venueId==='kaohsiung-arena') {
    if(/^4/.test(id) && Number(row)<=1){ messages.push('高雄巨蛋 4F 前排公開實拍常見欄杆介入視線；本版以欄杆遮擋模型校正。'); level='notice'; }
    if((id==='208' && Number(row)<=2) || id==='220'){ messages.push('公開實拍顯示此區可能受平面觀眾／喇叭塔或側屏影響；舞台延伸位置會顯著改變體感。'); level='notice'; }
    if(id==='219' && Number(row)>=33){ messages.push('219 系列公開實拍可見到 41 排；本版已把後段排數深度延伸，不再把 33–41 排壓在同一距離。'); level='notice'; }
  }
  if (venueId==='kaohsiung-music-center') {
    if (id==='2A2') { messages.push('公開實拍回報此區曾被票務標示為視線不良；上方設備可能遮到部分大螢幕，但若有延伸舞台，肉眼看人物仍可能很近。'); level='caution'; }
    if (id==='2B1' && Number(row)<=1) { messages.push('2B1 第 1 排有多筆公開實拍提到固定欄杆／桿件；肉眼可透過空隙觀看，但手機錄影更容易被切到。'); level='caution'; }
    if (id==='2B4' && Number(row)<=18) { messages.push('2B4 18 排有公開實拍顯示它是此分段的前排，前方有寬走道；本版已把 18 排視為 2B4 的起始深度。'); level='notice'; }
    if (id==='2B5') { messages.push('2B5 為更高、更後方的分段；公開實拍 24 排已明顯接近上層前緣，人物與部分舞台會受前方頭部／設計遮擋。'); level='notice'; }
    if (id==='2C3') { messages.push('2C3 公開實拍顯示中央視角佳，但前方走道、欄杆與平面觀眾可能一起影響延伸台視線。'); level='notice'; }
    if (id==='2E1' || id==='2E2' || id.startsWith('2D')) { messages.push('此側邊區域角度較斜；公開實拍常見欄杆、曲面螢幕或側邊設備造成局部遮擋。'); level='notice'; }
  }
  if (venueId==='kaohsiung-stadium') {
    if (id.startsWith('平面')) { messages.push('世運平面區為大面積平地，身高、人頭與手機舉高會顯著影響視線；目前不宣稱單席精準。'); level='notice'; }
    else messages.push('世運目前為區域級模型；不同端景／中央／橫開舞台的距離與方向差異很大。');
  }
  if (venueId==='taoyuan-arena' && id.startsWith('平面')) { messages.push('桃園巨蛋活動座椅可依活動重新配置；此平面位置只做區域示意。'); level='notice'; }
  if (venueId==='ntu-sports-center' && id.startsWith('平面')) { messages.push('臺大主球場平面區容易受到前方人頭影響；活動座椅排法依主辦售票圖變動。'); level='notice'; }
  if (venueId==='tianmu-gymnasium') {
    if (id.startsWith('平面')) { messages.push('天母平面區公開回報常見人頭遮擋，身高與坐姿對視線影響很大。'); level='notice'; }
    if (/^[LR]/.test(id) && Number(row)<=3) { messages.push('側邊前排部分座位可能受到欄杆影響；實際遮擋依座號與舞台高度。'); level='notice'; }
  }
  if (Number(row)<=2) { messages.push('前排視線可能受到場館固定欄杆、扶手或活動設備影響；實際狀況依現場配置。'); if(level==='normal') level='notice'; }
  // Generic-stage sanity check: a full venue baseline can contain fixed seats that would sit
  // behind an end-stage configuration. Flag them instead of presenting that reference view as
  // a normal sellable concert seat.
  const secForRear=getVenueSection(venueId,id,layoutId);
  const mainStage=(layout.stage||getVenueModel(venueId).stage)?.main;
  if(secForRear && mainStage && Math.abs(mainStage.z)>20 && !String(layoutId).includes('center')) {
    const pos=venueSectionPosition(venueId,secForRear,Number(row)||Number(secForRear.rowMin||1));
    if(pos.z < mainStage.z-Math.max(8,(mainStage.depth||24)*.28)) {
      messages.push('此位置落在目前端景舞台的後方基準區；正式演唱會通常會封閉或改變配置，請以本場官方票區圖為準。');
      level='caution';
    }
  }
  if (layout.autoGenerated) {
    messages.push(layout.seatMapDetected
      ? '本場 3D 為系統依官方座位配置來源與場館基準自動生成的草稿；票區細節與遮擋仍以官方圖為準。'
      : '本場 3D 為系統依活動場館自動生成的草稿；尚未偵測到可解析的官方座位配置。');
    if(level==='normal') level='notice';
  } else if (layoutId===getVenueModel(venueId).baseLayoutId || !layout.eventId) messages.push('目前為場館區域級模擬；本場專屬舞台圖公布後會再校正。');
  return {level,messages};
}
export function venueIdFromName(name='') {
  const v=String(name).toLowerCase();
  if (/台北大巨蛋|臺北大巨蛋|taipei dome/.test(v)) return 'taipei-dome';
  if (/台北小巨蛋|臺北小巨蛋|taipei arena/.test(v)) return 'taipei-arena';
  if (/ntsu|linkou|林口|國立體育大學/.test(v)) return 'ntsu-arena';
  if (/高雄巨蛋|kaohsiung arena/.test(v)) return 'kaohsiung-arena';
  if (/台北流行音樂中心|臺北流行音樂中心|北流|taipei music center/.test(v)) return 'taipei-music-center';
  if (/ticc|台北國際會議中心|臺北國際會議中心/.test(v)) return 'ticc';
  if (/高雄流行音樂中心|海音館|kaohsiung music center|hi-ing/.test(v)) return 'kaohsiung-music-center';
  if (/高雄世運|世運主場館|國家體育場|kaohsiung national stadium/.test(v)) return 'kaohsiung-stadium';
  if (/桃園巨蛋|桃園市立綜合體育館|taoyuan arena/.test(v)) return 'taoyuan-arena';
  if (/台大綜合體育館|臺大綜合體育館|ntu sports center/.test(v)) return 'ntu-sports-center';
  if (/天母體育館|tianmu gymnasium/.test(v)) return 'tianmu-gymnasium';
  if (/南港展覽館(?:一館)?(?:四樓|4f)?|nangang exhibition hall(?: 1)?|twtc nangang exhibition hall/.test(v)) return 'nangang-exhibition-hall1-4f';
  if (/zepp new taipei|zepp新北|zepp 新北/.test(v)) return 'zepp-new-taipei';
  return null;
}
