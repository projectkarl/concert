export const venues = [
  {
    id: "taipei-dome", name: "臺北大巨蛋", en: "TAIPEI DOME", city: "Taipei", address: "台北市信義區忠孝東路四段515號",
    sourceName: "臺北大巨蛋官方座位區平面圖", sourceUrl: "https://www.farglorydome.com.tw/park-detail/map/",
    confidence: "官方分區校正／區域幾何重建", disclaimer: "固定看台依官方座位圖校正；演唱會舞台、控台、平面座席與封閉區域依每場活動切換。"
  },
  {
    id: "taipei-arena", name: "臺北小巨蛋", en: "TAIPEI ARENA", city: "Taipei", address: "台北市松山區南京東路四段2號",
    sourceName: "臺北小巨蛋官方座位視線導覽", sourceUrl: "https://www.arena.taipei/cp.aspx?n=95731497B5FCEDDB",
    confidence: "官方視線分區可校正", disclaimer: "官方提供中央舞台與遠端舞台視線導覽；本場實際舞台仍以主辦配置為準。"
  },
  {
    id: "ntsu-arena", name: "國立體育大學綜合體育館", en: "NTSU ARENA / LINKOU ARENA", city: "Taoyuan", address: "桃園市龜山區文化一路250號",
    sourceName: "國立體育大學綜合體育館平面圖", sourceUrl: "https://phk.ntsu.edu.tw/var/file/8/1008/img/1439/147422320.pdf",
    confidence: "官方色區與席位圖可建模", disclaimer: "官方平面圖提供黃、綠、橙、藍色區與席位資料；演唱會舞台方向依該場售票配置。"
  },
  {
    id: "kaohsiung-arena", name: "高雄巨蛋", en: "KAOHSIUNG ARENA", city: "Kaohsiung", address: "高雄市左營區博愛二路757號",
    sourceName: "高雄巨蛋官方座位資訊", sourceUrl: "https://www.kaoarena.com.tw/Home/Seat",
    confidence: "官方樓層／分區校正", disclaimer: "官方提供場館座椅配置及編號圖；演唱會舞台、站區與封閉區依活動售票配置更新。"
  },
  {
    id: "taipei-music-center", name: "臺北流行音樂中心", en: "TAIPEI MUSIC CENTER", city: "Taipei", address: "台北市南港區市民大道八段99號",
    sourceName: "臺北流行音樂中心官方觀眾席配置圖", sourceUrl: "https://www.tmc.taipei/tw/hire/Unit-f8KLs",
    confidence: "官方固定席／樓層／場館尺寸校正", disclaimer: "2F、3F 固定席依官方圖重建；1F 無固定座位，僅以活動可變平面區域示意。"
  },
  {
    id: "ticc", name: "TICC 台北國際會議中心", en: "TAIPEI INTERNATIONAL CONVENTION CENTER", city: "Taipei", address: "台北市信義區信義路五段1號",
    sourceName: "TICC 官方大會堂座位查詢／VR", sourceUrl: "https://www.ticc.com.tw/wSite/sp?BaseDSD=&CtUnit=100&ctNode=323&mp=1&xdUrl=%2FwSite%2Fap%2Flp_PlenaryHall.jsp",
    confidence: "官方座位查詢可校正／樓層精準骨架", disclaimer: "依官方大會堂座位查詢建立多樓層骨架；實際排號與活動設備仍以票面及主辦配置為準。"
  },
  {
    id: "kaohsiung-music-center", name: "高雄流行音樂中心 海音館", en: "KAOHSIUNG MUSIC CENTER · HI-ING MUSIC HALL", city: "Kaohsiung", address: "高雄市鹽埕區真愛路1號",
    sourceName: "海音館官方全區觀眾席平面圖", sourceUrl: "https://www.kph.tw/venues-resources/1",
    confidence: "官方全區席位圖／剖面資料校正", disclaimer: "固定看台及伸縮座椅依官方技術資料重建；1F 是否採固定座椅或平面特區依每場活動切換。"
  },
  {
    id: "kaohsiung-stadium", name: "高雄國家體育場（世運主場館）", en: "KAOHSIUNG NATIONAL STADIUM", city: "Kaohsiung", address: "高雄市左營區世運大道100號",
    sourceName: "高雄市政府運動發展局場館資訊", sourceUrl: "https://busker.kcg.gov.tw/space/Details?Parser=99%2C7%2C28%2C%2C%2C%2C29",
    confidence: "官方場館輪廓／區域級重建", disclaimer: "戶外大型場館以官方場館輪廓建立區域級模型；中央舞台、橫開舞台與平面區依活動切換，不宣稱單席精準。"
  },
  {
    id: "taoyuan-arena", name: "桃園巨蛋", en: "TAOYUAN ARENA", city: "Taoyuan", address: "桃園市桃園區三民路一段1號",
    sourceName: "桃園市政府體育局官方座位平面圖", sourceUrl: "https://www.dst.tycg.gov.tw/cp.aspx?n=11715",
    confidence: "官方圓形座位圖／容量校正", disclaimer: "固定看台依官方平面圖建立環形區域模型；活動座椅與舞台方向依每場售票圖調整。"
  },
  {
    id: "ntu-sports-center", name: "臺大綜合體育館", en: "NTU SPORTS CENTER", city: "Taipei", address: "台北市大安區羅斯福路四段1號",
    sourceName: "國立臺灣大學體育室場地地圖／主球場資料", sourceUrl: "https://rent.pe.ntu.edu.tw/map/",
    confidence: "官方樓層／固定席容量校正", disclaimer: "3–5F 固定席與活動伸縮看台依官方資料建立；演唱會平面票區與舞台依主辦配置更新。"
  },
  {
    id: "tianmu-gymnasium", name: "天母體育館", en: "TIANMU GYMNASIUM", city: "Taipei", address: "台北市士林區忠誠路二段101號",
    sourceName: "臺北市政府場館建置資料", sourceUrl: "https://english.udd.gov.taipei/News_Content.aspx?n=DD9CEC17A97FBC64&s=5C7961D8F91A70B4&sms=72544237BBE4C5F6",
    confidence: "官方容量／場館級幾何＋實景校正", disclaimer: "官方可確認固定席容量；細分區域採區域級重建，平面區人頭與欄杆遮擋以公開實景回報校正。"
  }
];

// v0.40.4 — community sightline cross-check metadata.
// These links are NOT geometry authorities. Official venue/ticket maps remain the topology source;
// twconcertview is used only to compare section naming and real-world sightline anecdotes.
export const VENUE_CROSSCHECK_REFERENCES = {
  'taipei-dome': 'https://twconcertview.com/en/venue/taipei-dome/',
  'taipei-arena': 'https://twconcertview.com/en/venue/taipei-arena/',
  'ntsu-arena': 'https://twconcertview.com/en/venue/ntsu-arena-linkou/',
  'kaohsiung-arena': 'https://twconcertview.com/en/venue/kaohsiung-arena/',
  'taipei-music-center': 'https://twconcertview.com/en/venue/taipei-music-center/',
  'ticc': 'https://twconcertview.com/en/venue/ticc-taipei/',
  'kaohsiung-music-center': 'https://twconcertview.com/en/venue/kaohsiung-music-center/',
  'kaohsiung-stadium': 'https://twconcertview.com/en/venue/kaohsiung-national-stadium/',
  'taoyuan-arena': 'https://twconcertview.com/en/venue/taoyuan-arena/',
  'ntu-sports-center': 'https://twconcertview.com/en/venue/ntu-sports-center/',
  'tianmu-gymnasium': 'https://twconcertview.com/en/venue/tianmu-gymnasium/',
  'zepp-new-taipei': 'https://twconcertview.com/en/venue/zepp-new-taipei/'
};

// Two calibrated models were historically missing from the venue metadata list even though the
// renderer supports them. Keep metadata and renderer eligibility in sync so unknown halls can
// never be silently treated as a calibrated venue.
if (!venues.some(v=>v.id==='nangang-exhibition-hall1-4f')) venues.push({
  id:'nangang-exhibition-hall1-4f', name:'南港展覽館一館 4F', en:'NANGANG EXHIBITION HALL 1 · 4F', city:'Taipei', address:'台北市南港區經貿二路1號',
  sourceName:'南港展覽館官方場地資料', sourceUrl:'https://www.tainex.com.tw/',
  confidence:'官方空間尺寸／活動平面配置級', disclaimer:'展覽館 4F 為大面積可變平面空間；3D 只在取得該場官方座位圖後生成票區，不宣稱固定座席。'
});
if (!venues.some(v=>v.id==='zepp-new-taipei')) venues.push({
  id:'zepp-new-taipei', name:'Zepp New Taipei', en:'ZEPP NEW TAIPEI', city:'New Taipei', address:'新北市新莊區新北大道四段3號8樓',
  sourceName:'Zepp New Taipei 官方場館資訊', sourceUrl:'https://www.zepp.co.jp/hall/newtaipei/',
  confidence:'官方樓層結構／固定席與可變站席分離', disclaimer:'1F 可依活動採站席或座席配置；2F 固定席依場館結構保留，實際開放區以主辦售票圖為準。'
});

const PRECISION = {
  'taipei-dome':['section-calibrated','固定看台分區級；活動平面與舞台需逐場校正'],
  'taipei-arena':['section-calibrated','固定 2F/3F 看台分區級；B1 為活動可變配置'],
  'ntsu-arena':['section-calibrated','固定看台色區／排深級；1F 活動區逐場校正'],
  'kaohsiung-arena':['section-calibrated','固定看台樓層／區域級；舞台與平面區逐場校正'],
  'taipei-music-center':['section-calibrated','2F/3F 固定席分區級；1F 為可變平面'],
  'ticc':['section-calibrated','大會堂 2MF、3F–6F 與側包廂拓樸級；非單席攝影測量'],
  'kaohsiung-music-center':['section-calibrated','固定看台與伸縮席分區級；1F 活動配置可變'],
  'kaohsiung-stadium':['zone-calibrated','戶外看台區域級；不同舞台方向差異大'],
  'taoyuan-arena':['zone-calibrated','固定環形看台區域級；平面活動席可變'],
  'ntu-sports-center':['zone-calibrated','固定樓層／容量級；平面與伸縮席逐場變動'],
  'tianmu-gymnasium':['zone-calibrated','場館／側看台區域級；非單席幾何'],
  'nangang-exhibition-hall1-4f':['event-layout-dependent','大型平面空間；沒有官方活動座位圖就不產生精準票區'],
  'zepp-new-taipei':['zone-calibrated','1F 可變站/座席＋2F 固定席結構級']
};
for (const venue of venues) {
  const [precisionLevel, precisionNote] = PRECISION[venue.id] || ['uncalibrated','尚未建立可靠場館幾何'];
  venue.precisionLevel = precisionLevel;
  venue.precisionNote = precisionNote;
  venue.twConcertViewUrl = VENUE_CROSSCHECK_REFERENCES[venue.id] || null;
  venue.crossCheckRole = venue.twConcertViewUrl ? 'community-sightline-crosscheck-only' : 'official-only';
  venue.singleSeatPhotogrammetry = false;
}
