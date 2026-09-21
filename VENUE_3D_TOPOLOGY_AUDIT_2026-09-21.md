# NEUL v0.40.3 場館／活動 3D 拓樸稽核

日期：2026-09-21

## 稽核結論

- 活動總數：101
- 使用已校正場館模型並可生成 3D：71
- 停止生成 3D（戶外、臨時場地或尚未建立可靠場館模型）：30
- 目前資料中 runtime generic 場館：0（已改成預設禁止）
- 共用售票來源頁活動：10
- 彭佳慧台北／高雄：同一 KHAM PRODUCT_ID，已加入「台北／臺北小巨蛋」與「高雄／高雄巨蛋」variant hint，解析器會依場館重排候選圖；無法消歧義時拒絕套圖。
- TICC：大會堂觀眾席不建立一般 1F tier；2MF／3F／4F／5F／6F 改為同一連續斜坡觀眾席的前後高度帶，不再畫成五層 arena ring。

> 「通過」代表活動不會再被錯誤場館拓樸／錯城市座位圖污染；不等同宣稱每張票的單椅座標已量測到公分級。若官方只提供票區圖，系統維持票區級相對位置與場館固定幾何。

## 場館拓樸策略

| Model | 場館 | 目前活動數 | 拓樸 | 允許活動圖改動的層 | 固定結構策略 |
|---|---|---:|---|---|---|
| taipei-dome | 臺北大巨蛋 | 4 | stadium-bowl | FLOOR | 固定結構優先 |
| taipei-arena | 臺北小巨蛋 | 16 | arena-bowl | B1 | 固定結構優先 |
| ntsu-arena | 國立體育大學綜合體育館 | 7 | arena-bowl | FLOOR, LOWER | 固定結構優先 |
| kaohsiung-arena | 高雄巨蛋 | 7 | arena-bowl | FLOOR | 固定結構優先 |
| taipei-music-center | 臺北流行音樂中心 | 4 | concert-hall | 1F | 固定結構優先 |
| ticc | TICC 台北國際會議中心 | 13 | continuous-raked-auditorium | 無 | 固定結構優先 |
| kaohsiung-music-center | 高雄流行音樂中心 海音館 | 4 | concert-hall | 1F | 固定結構優先 |
| kaohsiung-stadium | 高雄國家體育場（世運主場館） | 7 | stadium-bowl | FLOOR | 固定結構優先 |
| taoyuan-arena | 桃園巨蛋 | 0 | arena-bowl | FLOOR | 固定結構優先 |
| ntu-sports-center | 臺大綜合體育館 | 2 | arena-bowl | FLOOR | 固定結構優先 |
| tianmu-gymnasium | 天母體育館 | 0 | arena-bowl | FLOOR | 固定結構優先 |
| nangang-exhibition-hall1-4f | 台北南港展覽館一館四樓 | 1 | flat-exhibition-hall | FLOOR | 活動圖可主導 |
| zepp-new-taipei | Zepp New Taipei | 6 | live-house | FLOOR | 固定結構優先 |

## 101 場逐筆檢查

| Event ID | 藝人 | 場館 | 實際 3D model | 3D 狀態 | 座位圖策略 |
|---|---|---|---|---|---|
| super-junior-83z-1983-kaohsiung-2026 | SUPER JUNIOR-83z | 高雄流行音樂中心 海音館 | kaohsiung-music-center | 手動校正活動 3D | 有直接官方座位圖 |
| le-sserafim-pureflow-taipei-2026 | LE SSERAFIM | 國立體育大學綜合體育館 NTSU ARENA | ntsu-arena | 手動校正活動 3D | 有直接官方座位圖 |
| kim-ji-won-wonederland-taipei-2026 | KIM JI WON | LEGACY TERA | — | 不生成 3D：場館尚未校正，禁止 generic 猜測 | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| treasure-new-wav-kaohsiung-2026 | TREASURE | 高雄巨蛋 Kaohsiung Arena | kaohsiung-arena | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| skz-run-it-taipei-2026 | Stray Kids | 臺北大巨蛋 Taipei Dome | taipei-dome | 手動校正活動 3D | 有直接官方座位圖 |
| aaa-2026-kaohsiung | Asia Artist Awards | 高雄國家體育場（世運主場館） | kaohsiung-stadium | 場館拓樸鎖＋活動專屬 3D | 有直接官方座位圖 |
| plave-keep-it-manic-taipei-2026 | PLAVE | NTSU ARENA (LINKOU ARENA) | ntsu-arena | 手動校正活動 3D | 有直接官方座位圖 |
| yesung-ordinary-taipei-2026 | YESUNG | NTSU ARENA | ntsu-arena | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| nct127-redline-taipei-2027 | NCT 127 | 臺北小巨蛋 Taipei Arena | taipei-arena | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| kang-min-hyuk-if-i-were-taipei-2026 | KANG MIN HYUK | NEXT TV No.1 Studio | — | 不生成 3D：場館尚未校正，禁止 generic 猜測 | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| lee-youngji-2-taipei-2026 | Lee Youngji | 臺北流行音樂中心 Taipei Music Center | taipei-music-center | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| so-ji-sub-soulmate-taipei-2026 | So Ji Sub | 台北國際會議中心 TICC | ticc | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| wave-to-earth-pieces-taipei-2026 | wave to earth | 台北國際會議中心 TICC | ticc | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| young-k-youngest-taipei-2026 | Young K | 台北國際會議中心 TICC | ticc | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| ive-show-what-i-am-taipei-2026 | IVE | 臺北小巨蛋 Taipei Arena | taipei-arena | 手動校正活動 3D | 有直接官方座位圖 |
| itzy-tunnel-vision-taipei-2026 | ITZY | 臺北小巨蛋 Taipei Arena | taipei-arena | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| uknow-scene1-taipei-2026 | U-KNOW | 新北市工商展覽中心 New Taipei City Exhibition Hall | — | 不生成 3D：場館尚未校正，禁止 generic 猜測 | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| nct-wish-2nd-anniversary-taipei-2026 | NCT WISH | NTSU ARENA (LINKOU ARENA) | ntsu-arena | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| hyeri-hyeride-taipei-2026 | HYERI | 台北國際會議中心 TICC | ticc | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| kim-moo-yul-maju-taipei-2026 | KIM MOO YUL | 台北國際會議中心 TICC | ticc | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| kim-sihun-dizzy-state-taipei-2026 | KIM SIHUN | 凝聚力音樂娛樂 Cohesion Space | — | 不生成 3D：場館尚未校正，禁止 generic 猜測 | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| epex-echo-taipei-2026 | EPEX | WESTAR Taipei | — | 不生成 3D：場館尚未校正，禁止 generic 猜測 | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| ftisland-fate-kaohsiung-2026 | FTISLAND | 高雄流行音樂中心 海音館 | kaohsiung-music-center | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| hwang-in-youp-to-you-taipei-2026 | HWANG IN YOUP | 臺大綜合體育館 1F | ntu-sports-center | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| waterbomb-kaohsiung-2026 | WATERBOMB | 高雄夢時代正對面廣場 | — | 不生成 3D：戶外／臨時場地 | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| kyuhyun-penghu-music-festival-2026 | KYUHYUN | 澎湖觀音亭休閒園區 | — | 不生成 3D：戶外／臨時場地 | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| park-eunbin-euniverse-taipei-2026 | PARK EUNBIN | Legacy TERA | — | 不生成 3D：場館尚未校正，禁止 generic 猜測 | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| onf-door-to-taipei-2026 | ONF | HANA SPACE | — | 不生成 3D：場館尚未校正，禁止 generic 猜測 | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| hans-zimmer-next-level-taipei-2026 | Hans Zimmer | 臺北小巨蛋 Taipei Arena | taipei-arena | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| lany-soft-world-tour-taipei-2026 | LANY | 臺北小巨蛋 Taipei Arena | taipei-arena | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| befirst-watch-me-taipei-2026 | BE:FIRST | Legacy TERA | — | 不生成 3D：場館尚未校正，禁止 generic 猜測 | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| henry-moodie-mood-swings-taipei-2026 | Henry Moodie | Legacy Taipei | — | 不生成 3D：場館尚未校正，禁止 generic 猜測 | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| yuuri-asia-tour-taipei-2026 | Yuuri | 臺北小巨蛋 Taipei Arena | taipei-arena | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| xg-the-core-taipei-2026 | XG | 臺北小巨蛋 Taipei Arena | taipei-arena | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| charlie-puth-clever-taipei-2026 | Charlie Puth | 臺北小巨蛋 Taipei Arena | taipei-arena | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| vaundy-horo-taipei-2026 | Vaundy | 臺北小巨蛋 Taipei Arena | taipei-arena | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| babymonster-choom-taipei-2026 | BABYMONSTER | 臺北小巨蛋 Taipei Arena | taipei-arena | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| malcolm-todd-do-that-again-taipei-2026 | Malcolm Todd | 台北國際會議中心 TICC | ticc | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| 5sos-everyones-a-star-taipei-2026 | 5 Seconds of Summer | 臺北流行音樂中心 Taipei Music Center | taipei-music-center | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| khalid-summer-somewhere-taipei-2026 | Khalid | 台北國際會議中心 TICC | ticc | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| fkj-tyber-tour-taipei-2026 | FKJ | Zepp New Taipei | zepp-new-taipei | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| post-malone-big-ass-kaohsiung-2026 | Post Malone | 高雄國家體育場（世運主場館） Kaohsiung National Stadium | kaohsiung-stadium | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| joji-solaris-kaohsiung-2026 | JOJI | 高雄巨蛋 Kaohsiung Arena | kaohsiung-arena | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| against-the-current-till-death-taipei-2027 | Against The Current | 台北國際會議中心 TICC | ticc | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| maroon5-asia-kaohsiung-2027 | Maroon 5 | 高雄國家體育場（世運主場館） Kaohsiung National Stadium | kaohsiung-stadium | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| westlife-25-kaohsiung-2027 | Westlife | 高雄巨蛋 Kaohsiung Arena | kaohsiung-arena | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| bruno-mars-romantic-kaohsiung-2027 | Bruno Mars | 高雄國家體育場（世運主場館） Kaohsiung National Stadium | kaohsiung-stadium | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| bts-arirang-kaohsiung-2026 | BTS | 高雄國家體育場（世運主場館） Kaohsiung National Stadium | kaohsiung-stadium | 手動校正活動 3D | 有直接官方座位圖 |
| tara-fancon-kaohsiung-2026 | T-ARA | 高雄流行音樂中心 海音館 | kaohsiung-music-center | 手動校正活動 3D | 有直接官方座位圖 |
| bigbang-cosmos-taipei-2026 | BIGBANG | 臺北大巨蛋 Taipei Dome | taipei-dome | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| bigbang-cosmos-kaohsiung-2027 | BIGBANG | 高雄國家體育場（世運主場館） Kaohsiung National Stadium | kaohsiung-stadium | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| fire-ex-on-fire-day-kaohsiung-2026 | 滅火器 Fire EX. | 高雄巨蛋 Kaohsiung Arena | kaohsiung-arena | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| accusefive-century-taipei-2026 | 告五人 Accusefive | 臺北小巨蛋 Taipei Arena | taipei-arena | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| rene-final-call-taipei-2026 | 劉若英 René Liu | 臺北小巨蛋 Taipei Arena | taipei-arena | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| tws-247-kaohsiung-2026 | TWS | 高雄巨蛋 Kaohsiung Arena | kaohsiung-arena | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| aov-10th-anniversary-taipei-dome-2026 | 傳說對決 | 臺北大巨蛋 Taipei Dome | taipei-dome | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| silica-gel-asia-tour-taipei-2026 | Silica Gel | Legacy Taipei | — | 不生成 3D：場館尚未校正，禁止 generic 猜測 | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| mamamoo-4ward-taipei-2026 | MAMAMOO | 臺北小巨蛋 Taipei Arena | taipei-arena | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| yoasobi-super-planet-taipei-2027 | YOASOBI | 臺北大巨蛋 Taipei Dome | taipei-dome | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| izna-who-dat-girl-taipei-2026 | izna | Zepp New Taipei | zepp-new-taipei | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| do-as-infinity-27th-taipei-2026 | Do As Infinity | Zepp New Taipei | zepp-new-taipei | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| henry-moodie-kaohsiung-2026 | Henry Moodie | LIVE WAREHOUSE | — | 不生成 3D：場館尚未校正，禁止 generic 猜測 | 共享售票頁；強制以場館／活動提示消歧義 |
| plave-keep-it-manic-kaohsiung-2026 | PLAVE | 高雄巨蛋 Kaohsiung Arena | kaohsiung-arena | 場館拓樸鎖＋活動專屬 3D | 共享售票頁；強制以場館／活動提示消歧義 |
| patrick-brasca-bad-idea-taipei-2026 | 派偉俊 Patrick Brasca | 臺北流行音樂中心表演廳 | taipei-music-center | 場館拓樸鎖＋活動專屬 3D | 共享售票頁；強制以場館／活動提示消歧義 |
| qwer-rockation-taipei-2026 | QWER | 國立體育大學綜合體育館 NTSU ARENA | ntsu-arena | 場館拓樸鎖＋活動專屬 3D | 共享售票頁；強制以場館／活動提示消歧義 |
| boynextdoor-knock-on-vol2-taipei-2027 | BOYNEXTDOOR | 國立體育大學綜合體育館 NTSU ARENA | ntsu-arena | 場館拓樸鎖＋活動專屬 3D | 共享售票頁；強制以場館／活動提示消歧義 |
| engelbert-legacy-of-love-taipei-2026 | Engelbert Humperdinck | TICC 臺北國際會議中心 | ticc | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| stayc-stay-closer-taipei-2026 | STAYC | TICC 臺北國際會議中心 | ticc | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| novelbright-pyramid-taipei-2026 | Novelbright | 新北市工商展覽中心 New Taipei City Exhibition Hall | — | 不生成 3D：場館尚未校正，禁止 generic 猜測 | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| hitsujibungaku-su-ha-kaohsiung-2026 | 羊文学 Hitsujibungaku | LIVE WAREHOUSE 大庫 | — | 不生成 3D：場館尚未校正，禁止 generic 猜測 | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| fujii-kaze-prema-kaohsiung-2026 | Fujii Kaze 藤井風 | 高雄國家體育場（世運主場館） | kaohsiung-stadium | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| jason-mraz-asia-tour-taipei-2026 | Jason Mraz | 台北南港展覽館一館四樓 | nangang-exhibition-hall1-4f | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| yung-kai-ocean-taipei-2026 | yung kai | Zepp New Taipei | zepp-new-taipei | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| bini-signals-taipei-2026 | BINI | 新北市工商展覽中心 New Taipei Exhibition Hall | — | 不生成 3D：場館尚未校正，禁止 generic 猜測 | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| gareth-gates-25th-taipei-2027 | Gareth Gates | Zepp New Taipei | zepp-new-taipei | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| niel-fearless-taipei-2026 | NIEL | Clapper Studio | — | 不生成 3D：場館尚未校正，禁止 generic 猜測 | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| tamaki-nami-asia-tour-taipei-2026 | 玉置成實 Tamaki Nami | Clapper Studio | — | 不生成 3D：場館尚未校正，禁止 generic 猜測 | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| fear-and-loathing-las-vegas-taipei-2026 | Fear, and Loathing in Las Vegas | Clapper Studio | — | 不生成 3D：場館尚未校正，禁止 generic 猜測 | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| music-expo-live-taipei-2026 | MUSIC EXPO LIVE | 臺北小巨蛋 Taipei Arena | taipei-arena | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| shizuka-kudo-dynamic-taipei-2026 | 工藤靜香 Shizuka Kudo | TICC 臺北國際會議中心 | ticc | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| mono-snowdrop-taipei-2026 | MONO | SUB LIVE | — | 不生成 3D：場館尚未校正，禁止 generic 猜測 | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| shishi-taste-of-taipei-2026 | 孫盛希 Shi Shi | Legacy TERA | — | 不生成 3D：場館尚未校正，禁止 generic 猜測 | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| 82major-out-of-control-taipei-2026 | 82MAJOR | Clapper Studio | — | 不生成 3D：場館尚未校正，禁止 generic 猜測 | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| fireball-fest-taoyuan-2026 | FIREBALL Fest. | 樂天桃園棒球場 Rakuten Taoyuan Baseball Stadium | — | 不生成 3D：場館尚未校正，禁止 generic 猜測 | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| domi-jd-beck-who-asked-taipei-2026 | DOMi & JD BECK | Clapper Studio | — | 不生成 3D：場館尚未校正，禁止 generic 猜測 | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| slowdive-live-taipei-2026 | Slowdive | Zepp New Taipei | zepp-new-taipei | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| kpop-prime-linkou-2026 | KPOP PRIME | 國立體育大學綜合體育館 NTSU Arena | ntsu-arena | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| age-factory-error-taipei-2026 | Age Factory | SUB LIVE | — | 不生成 3D：場館尚未校正，禁止 generic 猜測 | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| jessica-reflections-taipei-2026 | JESSICA | 臺大綜合體育館 NTU Sports Center 1F | ntu-sports-center | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| ghibli-original-singers-taipei-2026 | 吉卜力動畫音樂原唱歌手 | 臺北小巨蛋 Taipei Arena | taipei-arena | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| eunhyuk-beware-rabbit-taipei-2026 | EUNHYUK | 台北國際會議中心 TICC | ticc | 場館拓樸鎖＋活動專屬 3D | 共享售票頁；強制以場館／活動提示消歧義 |
| n-flying-con5-kaohsiung-2026 | N.Flying | 高雄流行音樂中心 海音館 | kaohsiung-music-center | 場館拓樸鎖＋活動專屬 3D | 共享售票頁；強制以場館／活動提示消歧義 |
| fenix-bbm-fan-concert-2026 | FEniX | Legacy TERA | — | 不生成 3D：場館尚未校正，禁止 generic 猜測 | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| xiaoyu-imperfect-person-taipei-2026 | 小宇 宋念宇 | 臺北流行音樂中心表演廳 | taipei-music-center | 場館拓樸鎖＋活動專屬 3D | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| kuo-fuhua-original-song-taipei-2026 | 郭子&浮花樂隊 | Legacy Taipei | — | 不生成 3D：場館尚未校正，禁止 generic 猜測 | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| julia-peng-counting-days-taipei-2026 | 彭佳慧 | 臺北小巨蛋 Taipei Arena | taipei-arena | 場館拓樸鎖＋活動專屬 3D | 共享售票頁；已加 台北／臺北小巨蛋 消歧義 |
| julia-peng-counting-days-kaohsiung-2026 | 彭佳慧 | 高雄巨蛋 Kaohsiung Arena | kaohsiung-arena | 場館拓樸鎖＋活動專屬 3D | 共享售票頁；已加 高雄／高雄巨蛋 消歧義 |
| roselyn-20hz-taipei-2026 | 劉芯妤 Roselyn | Clapper Studio | — | 不生成 3D：場館尚未校正，禁止 generic 猜測 | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| the-boyz-westart-taipei-2026 | 潤少╳徐晧程╳c8ight陳全 | WESTAR Taipei | — | 不生成 3D：場館尚未校正，禁止 generic 猜測 | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| vash-hsu-love-volcano-taipei-2026 | 徐暐翔 | Legacy Taipei | — | 不生成 3D：場館尚未校正，禁止 generic 猜測 | 官方售票頁解析；找不到可靠圖時保留場館幾何 |
| jeong-eunji-summer-i-taipei-2026 | JEONG EUNJI | 台北國際會議中心 TICC | ticc | 場館拓樸鎖＋活動專屬 3D | 共享售票頁；強制以場館／活動提示消歧義 |

## 自動生成防錯規則

1. 先解析「場館身份」再處理活動座位圖；不存在的 venueModelId 不再回退成臺北大巨蛋。
2. 已校正場館的固定看台／樓層為 authoritative；Vision/OCR 只能對回已存在票區。
3. 新增像素推測區塊，只能落在該場館明確可變的區域（例如小巨蛋 B1、北流 1F、Zepp 1F、展覽館平面）。
4. 固定劇院／會議廳（TICC）禁止自動創造 1F／2F balcony，亦禁止低信心圖片覆寫固定舞台。
5. 共用售票頁必須帶 venue / venueModelId / event variant hint；多張圖仍無法判斷時不套用。
6. 未校正 indoor venue 預設不生成 generic 3D；只有明確提供官方座位圖並 opt-in provisional 3D 才可建立暫定模型。
7. 官方座位圖 hash 變更才重新分析；固定場館拓樸仍不因圖片更新而被刪除。
