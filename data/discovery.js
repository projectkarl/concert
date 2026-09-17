export const liveNationDiscovery = {
  indexUrls: [
    "https://www.livenation.com.tw/en",
    "https://www.livenation.com.tw/en/%E5%8F%B0%E5%8C%97%E5%B0%8F%E5%B7%A8%E8%9B%8B-tickets-vdp665099",
    "https://www.livenation.com.tw/en/%E5%8F%B0%E5%8C%97%E5%9C%8B%E9%9A%9B%E6%9C%83%E8%AD%B0%E4%B8%AD%E5%BF%83-ticc--tickets-vdp804395",
    "https://www.livenation.com.tw/en/%E8%87%BA%E5%8C%97%E6%B5%81%E8%A1%8C%E9%9F%B3%E6%A8%82%E4%B8%AD%E5%BF%83-tickets-vdp1315066",
    "https://www.livenation.com.tw/%25e9%25ab%2598%25e9%259b%2584%25e5%259c%258b%25e5%25ae%25b6%25e9%25ab%2594%25e8%2582%25b2%25e5%25a0%25b4-%25e4%25b8%2596%25e9%2581%258b%25e4%25b8%25bb%25e5%25a0%25b4%25e9%25a4%25a8-kaohsiung-world-games-stadium-kaohsiung-national-stadium--tickets-vdp1214311"
  ],
  pinnedEventUrls: [
    "https://www.livenation.com.tw/en/event/2026-lee-youngji-world-tour-2-0--taipei-tickets-edp1669737",
    "https://www.livenation.com.tw/en/event/2026-so-ji-sub-asia-fanmeeting-tour-soulmate-the-timeless--taipei-tickets-edp1696972",
    "https://www.livenation.com.tw/en/event/wave-to-earth-the-pieces-tour-taipei-tickets-edp1674746",
    "https://www.livenation.com.tw/en/event/young-k-solo-tour-youngest-in-taipei-taipei-tickets-edp1690424",
    "https://www.livenation.com.tw/en/event/stray-kids-world-tour-run-it-taipei--taipei-tickets-edp1695879",
    "https://www.livenation.com.tw/en/event/lany-soft-world-tour-taipei-tickets-edp1660106",
    "https://www.livenation.com.tw/en/event/charlie-puth-whatever-s-clever-world-tour-taipei-tickets-edp1681124",
    "https://www.livenation.com.tw/en/event/5-seconds-of-summer-everyone-s-a-star-world-tour-taipei-tickets-edp1690391",
    "https://www.livenation.com.tw/en/event/malcolm-todd-do-that-again-tour-taipei-tickets-edp1697051",
    "https://www.livenation.com.tw/en/event/henry-moodie-mood-swings-world-tour-taipei-tickets-edp1694176",
    "https://www.livenation.com.tw/en/event/be-first-world-showcase-2026-watch-me--taipei-tickets-edp1674414",
    "https://www.livenation.com.tw/event/fkj-tyber-tour-taipei-tickets-edp1685113",
    "https://www.livenation.com.tw/event/post-malone-presents-the-big-ass-stadium-world-tour-kaohsiung-tickets-edp1664488",
    "https://www.livenation.com.tw/event/joji-solaris-kaohsiung-tickets-edp1668603",
    "https://www.livenation.com.tw/event/against-the-current-till-death-and-back-tour-taipei-tickets-edp1685117",
    "https://www.livenation.com.tw/event/maroon-5-asia-2027-in-kaohsiung-kaohsiung-tickets-edp1689725",
    "https://www.livenation.com.tw/event/westlife-25-the-anniversary-world-tour-kaohsiung-tickets-edp1686626",
    "https://www.livenation.com.tw/event/bruno-mars-the-romantic-tour-kaohsiung-tickets-edp1692984",
    "https://www.livenation.com.tw/event/bts-world-tour-arirang-in-kaohsiung-kaohsiung-tickets-edp1675887"
  ],
  pinnedArtistUrls: [
    "https://www.livenation.com.tw/bruno-mars-tickets-adp147754",
    "https://www.livenation.com.tw/post-malone-tickets-adp727892",
    "https://www.livenation.com.tw/against-the-current-tickets-adp671869",
    "https://www.livenation.com.tw/bts-tickets-adp830746"
  ],
  maxDiscoveredPagesPerRefresh: 70,
  maxArtistPagesPerRefresh: 28
};

export const artistMarketMarkers = {
  KR: ["k-pop","kpop","south korean","korean","韓國","韓星","韓團","stray kids","lee youngji","so ji sub","wave to earth","young k","day6","ive","itzy","aespa","plave","yesung","super junior","nct","seventeen","enhypen","le sserafim","nmixx","babymonster","blackpink","bts","twice","gidle","ateez","riize","treasure"],
  JP: ["j-pop","jpop","japanese","日本","be:first","yuuri","vaundy","xg","lisa live is smile always","king gnu","official髭男dism","back number"],
  US: ["california","texas","american","usa","u.s.","charlie puth","malcolm todd","khalid","lany","bruno mars","post malone","maroon 5"],
  UK: ["british","united kingdom","uk","henry moodie"],
  AU: ["australia","australian","5 seconds of summer","5sos"],
  FR: ["french","france","fkj"]
};


export const artistOfficialDiscovery = [
  {
    id: "babymonster-choom",
    artist: "BABYMONSTER",
    market: "KR",
    sourceName: "YG Entertainment Official",
    sourceUrl: "https://artist.ygfamily.co.kr/ARTISTS/BABYMONSTER/concert/worldtourchoom/index.html",
    parser: "yg-babymonster-choom",
    venueModelId: "taipei-arena",
    venueLayoutId: "taipei-arena-far"
  },
  {
    id: "bigbang-cosmos",
    artist: "BIGBANG",
    market: "KR",
    sourceName: "YG Entertainment Official",
    sourceUrl: "https://artist.ygfamily.com/ARTISTS/BIGBANG/concert/worldtour/index.html",
    parser: "yg-bigbang-cosmos"
  }
];
