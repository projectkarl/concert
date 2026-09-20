# NEUL v0.40.2 全檢驗（2026-09-20）

## 本輪修正
- 補入 izna 2026/10/09 Zepp New Taipei 官方活動 fallback。
- 拓元 discovery detail 上限由 40 提升為 96，並增加多個列表入口。
- 新增 iNDIEVOX；FANSI GO 同時支援 `/events/` 與 `/tickets/show/`。
- 台灣售票來源現為 14 類：tixCraft、KKTIX、Ticket Plus、寬宏、FamiTicket、udn、ibon、MNA、年代、TixFun、OPENTIX、FANSI GO、iNDIEVOX、博客來；另有 Live Nation、藝人官方、臺北小巨蛋與高雄巨蛋官方來源。
- 新增 sourceHealth 回傳，可檢查每個來源索引數、候選 detail 數與上限，避免「API 有列來源但實際 0 筆」被忽略。
- 修正 shared index URL 去重：不同活動共用 `tixcraft.com/activity` 不再被誤當同一場。
- 增加近期官方列表 fallback：Do As Infinity、PLAVE 高雄、QWER、派偉俊、Henry Moodie 高雄、BOYNEXTDOOR 等。

## 活動狀態
舊版多處直接以 `event.end || event.start` 判斷是否結束，若日期為 `00:00` 會在演出當天過早標示「演出已結束」。

v0.40.2 改為：
1. 有 sessions：最後一場 session + 6 小時才視為結束。
2. end 為午夜日期：保留至該日 23:59:59。
3. end 有明確時間：end + 6 小時作為活動結束保護。
4. 只有 start 且時間未確認：保留至 start 當日結束。
5. 只有 start 且時間確認：start + 6 小時。
6. 活動已開始但尚在有效期間，標示「演出進行中」，不進 Archive。

同一套判斷用於 Upcoming、Featured、Archive、查看更多活動、3D layout 下拉與座位圖背景分析。

## 3D
- 新增 Zepp New Taipei 場館基準模型。
- WebGL 高品質座椅上限 3,200 → 5,200。
- 高品質 DPR 1.9 → 2.05。
- 增加淺色地面深度網格，提升舞台、FOH、票區前後位置辨識。
- WebGL 深色/淺色主題都使用淺色場館地面；Canvas fallback 同步。
- 官方座位圖仍優先：OCR/Vision + Section Mapping 會建立活動專屬 layout，不以場館基準取代正式票區。

## QA 結果
- 66 筆 curated fallback，無 holes。
- 12 個 3D 場館模型。
- 14 類售票來源 + 官方藝人／場館 feed。
- izna parser、New Taipei 城市辨識、Zepp 3D mapping 通過。
- BTS、T-ARA、LE SSERAFIM 等既有專屬 3D regression 通過。
- WebGL + Canvas fallback、PWA、IndexedDB、來源去重與 exact-section price mapping 通過。
