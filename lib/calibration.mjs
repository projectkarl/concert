export const VENUE_CALIBRATIONS = [
  {
    match:/Zepp New Taipei/i,
    id:'zepp-new-taipei', confidence:'official',
    source:'https://www.zepp.co.jp/hall/newtaipei/',
    notes:'Official floor guide: standing 2,245; seated 1,025; 2F fixed seats 291. Event layouts can still differ.',
    venue:{kind:'club',capacity:2245,tiers:2,radius:6.4,rows:10,shape:'rectangular'},
    floor:{standingCapacity:1871,seatedCapacity:734},
    seatPattern:{zones:['1F','2F'],zone1Rows:['1A','1B','1C','1D','1E','1F','1G','1H','1I','1J','1K','1L','1M','1N','1O','1P','1Q','1R','1S','1T','1U','1V','1W'],zone1SeatEnd:38,zone2Rows:['2A','2B','2C','2D','2E','2F','2G','2H','2I'],zone2SeatEnd:38,note:'Official basic seating pattern; event configuration may differ.'},
    tiers:[
      {tier:0,name:'1F',elevation:0.18,depth:6.4,rowCount:23,mode:'flex',rowRise:0.075},
      {tier:1,name:'2F',elevation:3.25,depth:2.9,rowCount:9,mode:'fixed',fixedSeats:291,standingRear:83,rowRise:0.13}
    ],
    sightline:{eyeHeight:1.18,rowRise:0.18,minPitchDeg:4,maxPitchDeg:28},
    stage:{width:7.8,depth:3.8,y:0.55}, walkways:[{tier:0,afterRow:12,width:.34},{tier:1,afterRow:4,width:.3}]
  },
  {
    match:/臺?北大巨蛋|Taipei Dome/i,
    id:'taipei-dome', confidence:'official-skeleton',
    source:'https://www.farglorydome.com.tw/park-detail/map/',
    empiricalSource:'https://twconcertview.com/venue/taipei-dome/',
    notes:'Official map anchors floors and Gate 1–9 / infield-outfield zoning. Concert stage/floor remains event-specific. Community view reports are only used to flag empirical obstruction risks.',
    venue:{kind:'dome',capacity:40000,tiers:4,radius:10.4,rows:24,shape:'oval'},
    tiers:[
      {tier:0,name:'100',elevation:0.45,depth:4.1,rowCount:36,rowRise:0.105,sectionBand:[101,124]},
      {tier:1,name:'200',elevation:2.45,depth:3.6,rowCount:22,rowRise:0.14,sectionBand:[201,248]},
      {tier:2,name:'300',elevation:4.65,depth:3.2,rowCount:18,rowRise:0.155,sectionBand:[301,348]},
      {tier:3,name:'400',elevation:6.8,depth:2.9,rowCount:16,rowRise:0.17,sectionBand:[401,448]}
    ],
    gateBands:[{gate:'1–5',zone:'infield'},{gate:'6–9',zone:'outfield'}],
    empiricalRisks:[
      {match:/^108$/i,rowMin:30,type:'overhang',risk:'medium',note:'Community reports mention roof/overhang awareness in rear rows.'},
      {match:/^301$/i,rowMax:3,type:'rail',risk:'medium',note:'Front rows can intersect safety railing sightlines.'},
      {match:/^404$/i,rowMax:5,type:'distance',risk:'high',note:'Upper-deck distance is substantial for concert close-up views.'},
      {match:/^238$|^240$/i,rowMax:10,type:'rail',risk:'low',note:'Lower 200-level front rows generally retain a steep, clear rake; rail remains a local factor.'}
    ],
    walkways:[{tier:0,afterRow:18,width:.42},{tier:1,afterRow:10,width:.38},{tier:2,afterRow:8,width:.34},{tier:3,afterRow:7,width:.32}],
    sightline:{eyeHeight:1.18,rowRise:0.20,minPitchDeg:3,maxPitchDeg:32}, stage:{width:11.5,depth:5.5,y:0.65}
  },
  {
    match:/臺?北小巨蛋|Taipei Arena/i,
    id:'taipei-arena', confidence:'official-skeleton+empirical',
    source:'https://www.arena.taipei/News.aspx?n=63861D92D18F4E33&sms=E584E129E6660ED9',
    empiricalSource:'https://twconcertview.com/venue/taipei-arena/',
    notes:'Official venue pages anchor arena floors/seat levels. Event maps provide section naming. Community view reports are used only for empirical row/rail/side-view risk hints, not geometry truth.',
    venue:{kind:'arena',capacity:15000,tiers:3,radius:8.6,rows:28,shape:'rounded-rect'},
    tiers:[
      {tier:0,name:'1F',elevation:0.38,depth:3.8,rowCount:12,rowRise:0.11,sectionPrefixes:['1A','1B','1C','1D','1E']},
      {tier:1,name:'2F',elevation:2.35,depth:3.25,rowCount:16,rowRise:0.14,sectionPrefixes:['2A','2B','2C','2D','2E']},
      {tier:2,name:'3F/800',elevation:4.5,depth:3.0,rowCount:28,rowRise:0.155,sectionPrefixes:['3A','3B','3C','3D','3E','3F','3G','3H','3I','800']}
    ],
    colorZones:{red:'紅',purple:'紫',yellow:'黃',blue:'藍'},
    empiricalRisks:[
      {match:/3E|3F|3G|3H|800/i,rowMin:24,type:'distance',risk:'medium',note:'Upper rear rows retain full-stage view but artist detail becomes small.'},
      {match:/3I|308|309/i,rowMax:2,type:'rail',risk:'medium',note:'Front upper-deck rows can intersect safety railing sightlines.'},
      {match:/2E/i,rowMin:10,type:'side',risk:'medium',note:'Some stage layouts create side-angle/pillar sensitivity.'},
      {match:/1A/i,rowMax:8,type:'screen-angle',risk:'low',note:'Very close side sections may require steep upward screen viewing.'}
    ],
    walkways:[{tier:0,afterRow:6,width:.36},{tier:1,afterRow:8,width:.34},{tier:2,afterRow:14,width:.32}],
    sightline:{eyeHeight:1.18,rowRise:0.19,minPitchDeg:4,maxPitchDeg:30}, stage:{width:9.2,depth:4.8,y:0.6}
  },
  {
    match:/高雄巨蛋/i,
    id:'kaohsiung-arena',confidence:'venue-model',source:null,
    venue:{kind:'arena',capacity:15000,tiers:3,radius:8.7,rows:18,shape:'rounded-rect'},
    tiers:[{tier:0,name:'L1',elevation:.4,rowCount:18,rowRise:.11},{tier:1,name:'L2',elevation:2.4,rowCount:16,rowRise:.14},{tier:2,name:'L3',elevation:4.5,rowCount:14,rowRise:.16}],
    walkways:[{tier:0,afterRow:8,width:.34},{tier:1,afterRow:8,width:.32}],
    sightline:{eyeHeight:1.18,rowRise:.19,minPitchDeg:4,maxPitchDeg:30},stage:{width:9.2,depth:4.8,y:.6}
  }
];

export function getVenueCalibration(name=''){
  return VENUE_CALIBRATIONS.find(x=>x.match.test(name))||null;
}
