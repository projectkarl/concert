# NEUL v0.41 QA

## 靜態檢查
- [x] index.html / CSS / JS 分離，避免補丁疊加
- [x] 手機斷點 680px、平板斷點 1050px
- [x] 3D 使用 Three.js 幾何場景，不是圖片拖曳
- [x] Featured 左右按鈕 + 10 秒輪播
- [x] 黑／白模式
- [x] 設定齒輪有回應
- [x] Upcoming 預設 5 筆 + 看更多 Modal
- [x] 座位選區 / 排 / 號 / 倍率控制
- [x] 官方座位圖按鈕與來源 Modal
- [x] 6 小時快取與下次更新時間
- [x] `/api/health`
- [x] `/api/events`

## 已納入驗證案例
- [x] BTS WORLD TOUR 'ARIRANG' IN KAOHSIUNG：2026/11/19、21、22；高雄國家體育場；VIP 9,380 / 7,980 / 6,980 / 5,980 / 4,980 / 3,980 / 2,980
- [x] T-ARA Fancon 2026 in Taiwan：2026/10/18；高雄流行音樂中心海音館；5,980 / 5,680 / 4,680 / 3,680 / 愛心 2,840；A/E 區視線限制
- [x] IVE 2026 台北小巨蛋保留作已結束校正樣本

## 尚需正式部署後驗證
- [ ] 各售票站是否回應 server-side fetch
- [ ] 各站 `<img>` 標籤是否能直接解析出座位圖 URL
- [ ] 若某站改為前端動態載入，需新增該站專用 adapter（而不是在前台硬補）

## v0.40 Auto3D regression
- UI_LOCK: index.html / styles.css 與原版逐 byte 相同。
- 3D: 原舞台型態與看台環形布局保留；增加細節而不更換設計。
- Floor: venue floor 改為淺色 #e3ded3。
- Automation: discovery -> seat map -> prices -> Section Mapping -> SceneSpec -> sceneReady 整合測試。
- Vision/OCR: color region + label mapping 單元測試。
- Update: Vercel routes + daily automation cron + 6h CDN refresh。


## Archive lifecycle QA
PASS: 未到日期的活動即使來源誤標 ended，仍為 Upcoming。
PASS: 缺 dateEnd 時，不會在 dateStart 開演瞬間直接進 Archive。
PASS: 多日活動不會在第一場結束後提前歸檔。
PASS: Archive 只由 Neul 日期生命週期決定。
