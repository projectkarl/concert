import { taipeiDomeSections, taipeiDomeTiers, taipeiDomeBase, strayKidsRunItLayout, getTaipeiDomeSection, sectionPosition as domeSectionPosition, sectionWarning as domeSectionWarning } from './taipei-dome-geometry.js';

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
const ntsuMiddle = [
  ...arcGroup(['黃4中','黃2中','黃1中','黃3中'], 'MIDDLE', 170,126,18,-2.48,-.66),
  ...arcGroup(['綠5中','綠4中','綠3中','綠2中','綠1中'], 'MIDDLE', 170,126,18,-.48,.92),
  ...arcGroup(['橙4中','橙2中','橙1中','橙3中'], 'MIDDLE', 170,126,18,1.12,2.10),
  ...arcGroup(['藍1中','藍2中','藍3中','藍4中','藍5中'], 'MIDDLE', 170,126,18,2.32,3.62)
];
const ntsuUpper = [
  ...arcGroup(['黃4上','黃2上','黃1上','黃3上'], 'UPPER', 216,160,57,-2.48,-.66),
  ...arcGroup(['綠5上','綠4上','綠3上','綠2上','綠1上'], 'UPPER', 216,160,57,-.48,.92),
  ...arcGroup(['橙4上','橙2上','橙1上','橙3上'], 'UPPER', 216,160,57,1.12,2.10),
  ...arcGroup(['藍1上','藍2上','藍3上','藍4上','藍5上'], 'UPPER', 216,160,57,2.32,3.62)
];
const ntsuMiddleCal = ntsuMiddle.map(s=>({...s,rowMin:1,rowMax:15,rowDirection:'reverse',depthX:32,depthZ:24,rise:13,rowCurve:1.08}));
const ntsuUpperCal = ntsuUpper.map(s=>({...s,rowMin:0,rowMax:16,depthX:40,depthZ:30,rise:19,rowCurve:1.10}));
// NTSU / Linkou also has configurable 1F activity seating. Older NEUL builds exposed only
// MIDDLE/UPPER fixed bowls, making every concert look as if the lower arena did not exist.
// These LOWER/FLOOR envelopes preserve the physical venue volume without pretending they are
// permanent ticket-zone names. Event-specific official maps may add/override exact blocks.
const ntsuLower = [
  ...arcGroup(['1F黃側A','1F黃側B','1F黃側C'],'LOWER',132,98,-5,-2.40,-.72),
  ...arcGroup(['1F綠側A','1F綠側B','1F綠側C'],'LOWER',132,98,-5,-.48,.88),
  ...arcGroup(['1F橙側A','1F橙側B','1F橙側C'],'LOWER',132,98,-5,1.10,2.08),
  ...arcGroup(['1F藍側A','1F藍側B','1F藍側C'],'LOWER',132,98,-5,2.30,3.58)
].map(s=>({...s,rowMin:1,rowMax:12,depthX:22,depthZ:17,rise:8,rowCurve:1.04,structuralOnly:true,eventFlexible:true,label:`${s.id}（依活動配置）`}));
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
].map(s=>({...s,rowMin:1,rowMax:20}));
const tmc2 = arcGroup(['2A','2B','2C','2D','2E','2F','2G'],'2F',146,106,18,2.82,.32)
  .map(s=>({...s,rowMin:1,rowMax:15,depthX:17,depthZ:13,rise:8}));
const tmc3 = arcGroup(['3A','3B','3C','3D','3E','3F','3G'],'3F',184,136,52,2.82,.32)
  .map(s=>({...s,rowMin:1,rowMax:18,depthX:15,depthZ:12,rise:7}));
const tmcSections=[...tmcFloor,...tmc2,...tmc3];
const tmcTiers=[
  {id:'1F',label:'1F 活動可變平面區',short:'1F',sections:tmcFloor.map(x=>x.id)},
  {id:'2F',label:'2F 固定席',short:'2F',sections:tmc2.map(x=>x.id)},
  {id:'3F',label:'3F 固定席',short:'3F',sections:tmc3.map(x=>x.id)}
];

// TICC: the official seat finder separates every level into five principal blocks.
// Keep the community-facing A–E naming while preserving the official five-block geometry.
function ticcTier(prefix,tier,rx,rz,y,start,end,rowMin,rowMax,officialPrefix=prefix){
  const letters=['A','B','C','D','E'];
  return arcGroup(letters.map(x=>`${prefix}-${x}`),tier,rx,rz,y,start,end)
    .map((s,i)=>({...s,rowMin,rowMax,depthX:12,depthZ:9,rise:6,
      officialId:`${officialPrefix}-${i+1}`,
      label:`${officialPrefix}-${i+1} · ${letters[i]}`,
      aliases:[`${officialPrefix}-${i+1}`,`${prefix}-${letters[i]}`]
    }));
}
const ticc2=ticcTier('2F','2F',104,78,8,2.62,.52,1,16,'2MF');
const ticc3=ticcTier('3F','3F',126,92,30,2.64,.50,17,25,'3F');
const ticc4=ticcTier('4F','4F',148,108,51,2.66,.48,29,41,'4F');
const ticc5=ticcTier('5F','5F',170,124,72,2.68,.46,42,52,'5F');
const ticc6=ticcTier('6F','6F',191,139,91,2.70,.44,1,35,'6F');
const ticcBoxes=[
  block('BOX-L1','BOX',-118,24,16,26,'box'),block('BOX-L2','BOX',-130,48,16,26,'box'),block('BOX-L3','BOX',-139,73,16,26,'box'),
  block('BOX-R1','BOX',118,24,16,26,'box'),block('BOX-R2','BOX',130,48,16,26,'box'),block('BOX-R3','BOX',139,73,16,26,'box')
].map((s,i)=>{const side=i<3?'L':'R',n=(i%3)+1;return {...s,y:58,rowMin:1,rowMax:12,officialId:`${side}-${n}`,label:`${side}-${n} · 包廂`,aliases:[`${side}-${n}`,s.id]};});
const ticcSections=[...ticc2,...ticc3,...ticc4,...ticc5,...ticc6,...ticcBoxes];
const ticcTiers=[
  {id:'2F',label:'2F 大會堂',short:'2F',sections:ticc2.map(x=>x.id)},
  {id:'3F',label:'3F 大會堂',short:'3F',sections:ticc3.map(x=>x.id)},
  {id:'4F',label:'4F 大會堂',short:'4F',sections:ticc4.map(x=>x.id)},
  {id:'5F',label:'5F 大會堂',short:'5F',sections:ticc5.map(x=>x.id)},
  {id:'6F',label:'6F 大會堂',short:'6F',sections:ticc6.map(x=>x.id)},
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

export const venueModels = {
  'taipei-dome': {
    id:'taipei-dome', name:'臺北大巨蛋', en:'TAIPEI DOME', city:'Taipei', sections:taipeiDomeSections, tiers:taipeiDomeTiers,
    baseLayoutId:'taipei-dome-base', defaultTier:'LOWER', defaultSection:'106', defaultRow:18, field:{x:198,z:146}, stage:genericStage(-145,120,38),
    sourceName:'臺北大巨蛋官方座位區平面圖', sourceUrl:'https://www.farglorydome.com.tw/park-detail/map/', confidence:'官方分區校正／區域幾何重建'
  },
  'taipei-arena': {
    id:'taipei-arena', name:'臺北小巨蛋', en:'TAIPEI ARENA', city:'Taipei', sections:taipeiArenaSections, tiers:taipeiArenaTiers,
    baseLayoutId:'taipei-arena-far', defaultTier:'2F', defaultSection:'黃2C', defaultRow:10, field:{x:128,z:102}, stage:genericStage(-110,92,30),
    sourceName:'臺北小巨蛋官方座位視線導覽', sourceUrl:'https://www.arena.taipei/cp.aspx?n=95731497B5FCEDDB', confidence:'官方視線分區校正／區域幾何重建'
  },
  'ntsu-arena': {
    id:'ntsu-arena', name:'國立體育大學綜合體育館', en:'NTSU ARENA / LINKOU ARENA', city:'Taoyuan', sections:ntsuSections, tiers:ntsuTiers,
    baseLayoutId:'ntsu-base', defaultTier:'MIDDLE', defaultSection:'綠3中', defaultRow:10, field:{x:126,z:92}, stage:genericStage(-108,92,28),
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
    sourceName:'北流官方觀眾席配置圖', sourceUrl:'https://www.tmc.taipei/tw/hire/Unit-f8KLs', confidence:'官方固定席＋技術尺寸＋公開實拍交叉校正'
  },
  'ticc': {
    id:'ticc', name:'TICC 台北國際會議中心', en:'TAIPEI INTERNATIONAL CONVENTION CENTER', city:'Taipei', sections:ticcSections, tiers:ticcTiers,
    baseLayoutId:'ticc-base', defaultTier:'2F', defaultSection:'2F-B', defaultRow:10, field:{x:92,z:70}, stage:genericStage(-82,72,20),
    sourceName:'TICC 官方大會堂座位查詢／VR', sourceUrl:'https://www.ticc.com.tw/wSite/sp?BaseDSD=&CtUnit=100&ctNode=323&mp=1&xdUrl=%2FwSite%2Fap%2Flp_PlenaryHall.jsp', confidence:'官方 2MF/3F–6F 五分區＋包廂校正／公開實拍交叉驗證'
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
  }
};

export const venueLayouts = {
  'taipei-dome-base': {...taipeiDomeBase, id:'taipei-dome-base', venueId:'taipei-dome', label:'場館基準', stage:venueModels['taipei-dome'].stage, notices:['固定看台依官方場館圖校正；舞台為通用遠端舞台示意。']},
  [strayKidsRunItLayout.id]: {...strayKidsRunItLayout, venueId:'taipei-dome'},
  'taipei-arena-far': {id:'taipei-arena-far',venueId:'taipei-arena',label:'遠端舞台基準',stage:venueModels['taipei-arena'].stage,sourceName:'臺北小巨蛋官方遠端座位視線導覽',sourceUrl:'https://www.arena.taipei/cp.aspx?n=95731497B5FCEDDB&s=1BE4A9B16EE8F2E8',notices:['官方提供遠端與中央舞台視線導覽；本場舞台尚未公布時僅作場館方向參考。']},
  'taipei-arena-center': {id:'taipei-arena-center',venueId:'taipei-arena',label:'中央舞台基準',stage:{main:{x:0,y:-16,z:0,width:70,depth:56},runway:null,bStage:null},sourceName:'臺北小巨蛋官方中央舞台座位視線導覽',sourceUrl:'https://www.arena.taipei/cp.aspx?n=95731497B5FCEDDB',notices:['中央舞台為場館官方視線導覽類型之一；各活動舞台仍可能不同。']},
  'ntsu-base': {id:'ntsu-base',venueId:'ntsu-arena',label:'林口場館基準',stage:venueModels['ntsu-arena'].stage,sourceName:'國立體育大學綜合體育館平面圖',sourceUrl:'https://phk.ntsu.edu.tw/var/file/8/1008/img/1439/147422320.pdf',notices:['官方圖可確認黃、綠、橙、藍色區與中／上層席位；演唱會舞台方向仍以該場售票圖為準。']},
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
    id:'ive-show-what-i-am-2026', venueId:'taipei-arena', eventId:'ive-show-what-i-am-taipei-2026', label:'IVE 2026 · SHOW WHAT I AM', historical:true,
    stage:{main:{x:0,y:-16,z:-105,width:84,depth:24},runway:{x:0,y:-16,z1:-93,z2:-37,width:18},bStage:null},
    extraStageRects:[{x:0,y:-17,z:-35,width:42,depth:28}],
    foh:{x:0,y:-19,z:70,width:64,depth:18}, sections:ive2026Sections, tiers:ive2026Tiers,
    defaultTier:'VIP', defaultSection:'特5區', defaultRow:8,
    sourceName:'tixCraft 2026 IVE 官方票區圖 / Live Nation Taiwan', sourceUrl:'https://tixcraft.com/activity/detail/26_ive', verifiedAt:'2026-09-16T19:20:00+08:00',
    priceLabels:ive2026PriceLabels, historicalApproximate:true,
    notices:[
      '官方拓元票區圖確認本場於臺北小巨蛋，包含特1–特6區、FOH、2F 固定席、3F 固定席與東／西側 3F 包廂。',
      '本站重新繪製為互動幾何，不直接內嵌官方票區圖；2F 側席與 3F 的票價可能依區域／排數變化，因此不以單一區名過度推定票價。',
      '官方入場公告：本場全座位；110 公分以下兒童不得進入 3F，2F／3F 觀眾不得站立跺腳。'
    ]
  },
  'kaohsiung-base': {id:'kaohsiung-base',venueId:'kaohsiung-arena',label:'高雄巨蛋場館基準',stage:venueModels['kaohsiung-arena'].stage,sourceName:'高雄巨蛋官方座位資訊',sourceUrl:'https://www.kaoarena.com.tw/Home/Seat',notices:['官方場館頁提供座椅配置與樓層分區；演唱會舞台、站區與封閉區需依每場官方配置更新。']},
  'tmc-base': {id:'tmc-base',venueId:'taipei-music-center',label:'北流表演廳基準',stage:venueModels['taipei-music-center'].stage,sourceName:'北流官方觀眾席配置圖',sourceUrl:'https://www.tmc.taipei/tw/hire/Unit-f8KLs',notices:['官方確認表演廳固定席約 3,100 席，1F 無固定座位；2F 實拍可見至 15 排、3F 實拍可見至 17 排附近，本站以此校正排數深度。','舞台官方尺寸約寬 30m、深 20m；本站 3D 僅保留比例關係，不把模型單位直接標成真實公尺。']},
  'ticc-base': {id:'ticc-base',venueId:'ticc',label:'TICC 大會堂基準',stage:venueModels['ticc'].stage,foh:{x:0,y:43,z:88,width:34,depth:15},sourceName:'TICC 官方大會堂座位查詢',sourceUrl:'https://www.ticc.com.tw/wSite/sp?BaseDSD=&CtUnit=100&ctNode=323&mp=1&xdUrl=%2FwSite%2Fap%2Flp_PlenaryHall.jsp',notices:['官方座位查詢以 2MF-1～5、3F-1～5、4F-1～5、5F-1～5、6F-1～5 與 L/R 包廂分區；介面同時保留 A–E 對照，方便和粉絲回報互查。','4F-B 公開實拍回報顯示控台位於區域後半，本版加入控台體積作為場館基準遮擋參考；實際設備仍依活動而異。']},

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
  'tianmu-base': {id:'tianmu-base',venueId:'tianmu-gymnasium',label:'天母體育館場館基準',stage:venueModels['tianmu-gymnasium'].stage,sourceName:'臺北市政府場館建置資料',sourceUrl:'https://english.udd.gov.taipei/News_Content.aspx?n=DD9CEC17A97FBC64&s=5C7961D8F91A70B4&sms=72544237BBE4C5F6',notices:['官方可確認約 4,620 固定席、可擴充至約 6,000 席；細分看台目前為區域級校正。']}
};



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

/**
 * Register an activity-specific 3D draft at runtime.
 * - Existing hand-calibrated layouts always win.
 * - New events at a known venue automatically receive a generated layout.
 * - If an official seating-map/ticket-layout URL is attached to the event, the draft is labelled as map-linked,
 *   but NEUL still treats the geometry as provisional rather than claiming pixel-perfect image extraction.
 */
export function ensureAutoEventLayout(event={}) {
  const venueId=event.venueModelId || venueIdFromName(event.venue || '');
  if (!venueId || !venueModels[venueId]) return null;
  const currentId=event.venueLayoutId;
  const current=currentId ? venueLayouts[currentId] : null;
  if (current?.eventId && !current.autoGenerated) {
    // Preserve hand-calibrated geometry/distances, but continuously sync official ticket metadata.
    if (Array.isArray(event.sectionPriceRules)) current.sectionPriceRules=JSON.parse(JSON.stringify(event.sectionPriceRules));
    if (event.price) current.priceSummary=event.price;
    if (event.seatLayoutSourceUrl) {
      current.latestSeatLayoutSourceUrl=event.seatLayoutSourceUrl;
      current.seatMapDetected=true;
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
      seatMapDetected:linked,
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
    layout.stage=autoStageForEvent(venueId,event);
    layout.sourceName=linked ? '官方座位配置連結＋場館基準自動生成' : '官方活動場館資訊＋場館基準自動生成';
    layout.sourceUrl=event.seatLayoutSourceUrl || event.sourceUrl || model.sourceUrl;
    layout.seatMapDetected=linked;
    layout.generationConfidence=linked ? 'seat-map-linked-draft' : 'venue-only-draft';
    layout.sectionPriceRules=Array.isArray(event.sectionPriceRules) ? JSON.parse(JSON.stringify(event.sectionPriceRules)) : [];
    layout.priceSummary=event.price || layout.priceSummary || null;
    layout.ticketSyncSignature=JSON.stringify({seat:event.seatLayoutSourceUrl||null,price:event.price||null,rules:event.sectionPriceRules||[]});
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


export function applyAutoSeatMapAnalysis(layoutId, analysis={}) {
  const layout=venueLayouts[layoutId];
  if(!layout || !analysis || !analysis.hash) return false;
  if(!layout.autoGenerated && !layout.seatMapAutoRegenerate) return false;
  if(analysis.stage) layout.stage=JSON.parse(JSON.stringify(analysis.stage));
  if(Array.isArray(analysis.extraStageRects)) layout.extraStageRects=JSON.parse(JSON.stringify(analysis.extraStageRects));
  if(Array.isArray(analysis.sections) && analysis.sections.length>=3){
    layout.sections=JSON.parse(JSON.stringify(analysis.sections));
    layout.tiers=JSON.parse(JSON.stringify(analysis.tiers||[]));
    const priceLabels={}; for(const sec of analysis.sections) if(sec.autoPrice) priceLabels[sec.group]=sec.autoPrice;
    layout.priceLabels={...(layout.priceLabels||{}),...priceLabels};
    layout.replaceStructuralTiers=[...new Set([...(layout.replaceStructuralTiers||[]),'FLOOR'])];
  }
  layout.seatMapFingerprint=analysis.hash;
  layout.seatMapDetected=true;
  layout.generationConfidence=analysis.confidence||'map-pixel-derived';
  layout.autoMapProfile=analysis.profile||'unknown';
  layout.autoMapAnalyzedAt=new Date().toISOString();
  return true;
}

export function baseLayoutIdForVenue(venueId) {
  return getVenueModel(venueId).baseLayoutId;
}

export function activityLayoutMeta(event={}) {
  const venueId=event.venueModelId || venueIdFromName(event.venue || '');
  if (!venueId) return null;
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
export function getVenueModel(venueId) { return venueModels[venueId] || venueModels['taipei-dome']; }
export function getVenueLayout(layoutId) { return venueLayouts[layoutId] || venueLayouts['taipei-dome-base']; }
export function effectiveTiers(venueId, layoutId) {
  const model=getVenueModel(venueId), layout=getVenueLayout(layoutId);
  const replace=new Set((layout.replaceStructuralTiers||[]).map(String));
  const base=(model.tiers||[]).filter(t=>!replace.has(String(t.id))).map(t=>({...t,sections:[...(t.sections||[])]}));
  if(layout.venueId!==venueId || !Array.isArray(layout.tiers)) return base;
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
  if(layout.venueId!==venueId || !Array.isArray(layout.sections)) return model.sections;
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
  const layout=getVenueLayout(layoutId); const section=effectiveSections(layout.venueId,layoutId).find(s=>s.id===String(sectionId));
  if (!section) return null;
  if (layout.sectionPriceLabels?.[String(sectionId)]) return layout.sectionPriceLabels[String(sectionId)];
  if (section.group && layout.priceLabels?.[section.group]) return layout.priceLabels[section.group];
  const rule=(layout.sectionPriceRules||[]).find(r=>priceRuleMatch(r.label,section));
  return rule?.price || null;
}
export function venueSectionWarning(venueId, sectionId, row, layoutId, viewer={}) {
  if (venueId==='taipei-dome') return domeSectionWarning(sectionId,row,getVenueLayout(layoutId),viewer);
  const messages=[]; let level='normal'; const layout=getVenueLayout(layoutId); const id=String(sectionId);
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
  return null;
}
