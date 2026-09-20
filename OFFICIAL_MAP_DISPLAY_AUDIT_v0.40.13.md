# NEUL v0.40.13 — 官方位置圖顯示與自動更新稽核

稽核時間基準：2026-09-20 20:04（Asia/Taipei）

## 結論

- fallback 活動：75 筆。
- 依 NEUL 既有 lifecycle 規則，在稽核時間仍為進行中／未來的 fallback：60 筆。
- 這 60 筆 **60/60 都至少有一個可信官方 resolver 入口**，不再因主要 URL 不是售票平台而直接放棄座位圖解析。
- 專案內預先保存的 `seatLayoutSourceUrl`：8 筆；其餘活動由 resolver 在執行時從官方售票／主辦／藝人／場館來源追蹤官方圖。
- 第三方 `seatLayoutDisplayUrl`：0 筆。第三方轉載圖不再當成官方位置圖顯示。
- Featured 可見 `AUTO 10s` 標示：0；10,000 ms 自動輪播仍保留。

## 漏抓修正

### 1. Resolver 入口擴充
舊流程常因活動主要來源是 Live Nation、Weverse、藝人官網或場館官方頁，而沒有直接售票 URL，導致官方圖不被嘗試。

v0.40.13 會綜合：
- `seatLayoutSourceUrl`
- 已解析 `seatMapResolvedUrl`
- `ticketUrl` / `ticketSourceUrl`
- `secondarySourceUrl` / `autoSourceUrl`
- `sourceUrl`
- 全部 `sourceRefs`

再由可信官方入口遞迴追蹤售票 detail page 與官方圖。

### 2. 顯示 race condition
舊流程若 resolver 找到新官方圖，但 OCR/3D 幾何沒有變更，UI 可能不重繪。

v0.40.13 把「resolved official map URL 改變」本身視為資料更新，立即刷新「官方位置／座位配置參考」。

### 3. 快取與換圖
成功解析後保存 resolved URL、來源頁與 image hash。若官方後續換圖，hash 變更會重新跑 OCR/Vision、舞台、Section、價格與 3D QA；不會長期沿用舊圖。

## UI 規則

- event-specific 3D：官方圖區固定存在。
- 已取得官方圖：顯示圖片、來源連結、3D ↔ 官方圖 Section 連動。
- 尚未取得：顯示「系統持續自動回補」而不是隱藏。
- 場館 base layout（非特定活動）：不假裝存在該活動官方座位圖。

## 自動更新

- `/api/events`：1 小時 CDN 更新週期。
- 開啟頁面：每小時自動重新驗證；分頁回前景且資料超過 1 小時會立即更新。
- lifecycle：每 60 秒重新判斷售票／演出／Archive／Featured／3D selector。
- `/api/refresh`：每日保底排程。
- 新活動被 discovery / coverage auditor 發現後，會先建立唯一 event-specific 3D；官方圖與價格後續公布時再自動升級。

## 邊界

無法合理保證所有網站永遠可抓取：CAPTCHA、登入牆、純 Canvas 或網站結構大改仍可能使單次解析失敗。NEUL 的處理方式是保留 pending/retry 狀態並從其他官方來源交叉回補，不把一次失敗誤判成「官方沒有圖」。
