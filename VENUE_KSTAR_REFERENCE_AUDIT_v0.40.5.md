# NEUL v0.40.5｜韓星場館 3D Reference 稽核

更新：2026-09-21

原則：每個已校正 3D 場館都有一個實際韓星演出 reference。官方場館拓樸與官方票區／活動圖為主要幾何來源；twconcertview 僅作觀眾實拍視角交叉比對。距離為票區／排別級估算，使用明確誤差範圍，不宣稱單席測量精度。

| 場館 | Reference | 日期 | 距離校正 | 誤差 |
|---|---|---:|---|---:|
| 臺北大巨蛋 | aespa · SYNK : COMPLæXITY | 2026-08-11 | 大巨蛋固定看台比例＋本場 B2 場域圖＋實拍視角交叉校正 | ±6m |
| 臺北小巨蛋 | IVE 2026 · SHOW WHAT I AM | 2026-09-11 | 臺北小巨蛋固定席＋IVE 官方票區圖＋實拍視角交叉校正 | ±3m |
| 國立體育大學綜合體育館（林口） | NCT WISH · 2ND ANNIVERSARY | 2026-09-05 | 官方 W/I/S/H 票區圖＋林口固定看台排數規則＋同場實拍視角 | ±4m |
| 高雄巨蛋 | EXO · EXhOrizon KAOHSIUNG | 2026-07-18 | 高雄巨蛋固定樓層＋EXO 本場舞台／平面票區圖比例 | ±5m |
| 臺北流行音樂中心 | JAEHYUN · Mono | 2026-07-04 | 北流官方舞台尺寸＋本場 VIP A/B 圖＋固定席結構 | ±3m |
| 臺北國際會議中心 TICC | HYERI · HYERIDE | 2026-09-05 | TICC 官方大會堂固定座席拓樸＋近期 HYERI 場次方位 | ±3m |
| 高雄流行音樂中心 海音館 | FTISLAND · FaTe | 2026-09-12 | 海音館固定席＋FTISLAND 本場長延伸台／方形副舞台票區圖 | ±3m |
| 高雄國家體育場／世運主場館 | K-SPARK · K-POP FESTIVAL | 2026-05-30 | 世運主場館尺度＋K-SPARK 本場大型 T 型延伸台＋實拍座位交叉校正 | ±8m |
| 桃園巨蛋 | K-WONDER CONCERT | 2024-10-19 | 桃園巨蛋官方主場地直徑約 82m＋K-WONDER 本場票區比例 | ±5m |
| 臺大綜合體育館 | HWANG IN YOUP · To you | 2026-09-12 | 臺大主球場場地資料＋本場 1F VIP/A 六區官方圖 | ±3m |
| 天母體育館 | KYUHYUN · HOTEL 203 | 2026-06-27 | 天母體育館固定席尺度＋KYUHYUN A1/A2/A3 官方圖 | ±4m |
| 南港展覽館一館 4F | HWASA · Twits FANCON | 2024-06-16 | 南港展覽館官方 Hall 1 4F 約 180m × 126m 尺度＋本場 3×4 票區圖 | ±3m |
| Zepp New Taipei | WOODZ · Archive. 1 | 2026-05-23 | Zepp 1F/2F 固定空間＋WOODZ VIP/W/O/D/Z 本場圖 | ±2m |

## 驗收規則

- 13/13 場館必須存在 `kstarExample`。
- 每個 reference 必須有藝人、日期、來源、距離比例與誤差。
- 切換場館時預設載入該場館 reference，而不是通用場館模型。
- 固定看台不可被 OCR/Vision 任意改樓層；僅活動可變區可以重建。
- TICC 維持 2MF→3F→4F→5F→6F 連續斜坡、無一般 1F 觀眾席。
- 未校正場館不允許偷偷 fallback 到大巨蛋或其他 arena。

## 資料來源 UI

近期活動主清單、完整活動清單與 Featured 均提供 `ⓘ 資料來源`。彈窗列出主辦／售票／場館／座位圖／交叉核對來源與最後核對時間，並說明 twconcertview 的角色。
