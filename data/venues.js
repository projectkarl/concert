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
