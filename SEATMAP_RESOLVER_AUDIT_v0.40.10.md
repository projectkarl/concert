# NEUL v0.40.10 — 官方座位圖漏抓修正稽核

日期：2026-09-20

## 修正目標
避免把「NEUL 沒抓到官方座位圖」誤判成「官方尚未公布」，並讓後續新活動可持續自動回補。

## v0.40.10 自動化流程

1. 活動由 14 類台灣售票來源＋主辦／藝人／場館官方來源自動發現。
2. 每場活動建立唯一 event-specific 3D。
3. 座位圖解析不再只看 primary URL，會同時檢查：
   - `seatLayoutSourceUrl`
   - `ticketUrl` / `ticketSourceUrl`
   - `secondarySourceUrl`
   - `autoSourceUrl`
   - `sourceUrl`
   - 合併後全部 `sourceRefs`
4. `/api/seat-map-image` 採 recursive-v2 resolver：
   - 可直接讀圖片 URL。
   - 若是 HTML / JSON 頁面，會找 lazy image、srcset、CSS url、JSON/script 內的 seat-map 路徑。
   - 若目前頁面只是索引／主辦入口，會繼續追蹤官方售票 detail page，再找官方座位圖。
   - 不會只試第一張圖片；候選會依「座位圖／票區／場地圖／field」語意排序後逐張驗證 Content-Type。
5. 解析成功後保存官方圖 resolved URL、SHA-256 hash 與分析快取。API 每小時更新活動資料時，不會把已成功解析的官方圖狀態洗掉。
6. 官方圖 hash 改變時重新進 OCR/Vision → Stage → Section → Price QA；未改變則直接使用快取。
7. 暫時找不到圖時記錄 resolver failure，但不永久標記為「官方未公布」；下一次自動同步會再嘗試。
8. 官方監控採「缺座位圖優先＋每小時輪替批次」，即使未來活動數超過監控上限，也會跨週期覆蓋後面的活動；已經有圖的活動保留複查名額，用來偵測換圖／改價。

## false-negative 防護

- 支援 `\/images\/activity\/field\/...` 這類 script/JSON escaped URL。
- 支援 `seatMap`, `seat_map`, `seatingMap`, `floorMap`, `venueMap`, `fieldMap`, `layoutImage`, `imageUrl`, `fileUrl`, `assetUrl` 等常見 JSON 欄位。
- 支援 relative asset path。
- 支援 `sourceRefs` 中的售票平台 URL。
- 多來源逐一嘗試，第一個來源失敗不會直接結束。
- HTML 找不到直接圖片時，可追蹤官方 detail link。

## QA 結果

- `npm run check`: PASS
- Future-event automatic custom 3D pipeline: PASS
- 現有 75/75 event-specific 3D: PASS
- 未知新場館自動建立 runtime venue model: PASS
- escaped JSON seat-map fixture: PASS
- recursive official ticket-page resolver fixture: PASS
- sourceRefs fallback fixture: PASS
- 全部 JS/MJS `node --check`: PASS
- v0.40.9 → v0.40.10 `index.html`: SHA-256 完全一致
- v0.40.9 → v0.40.10 `styles.css`: SHA-256 完全一致

## 正確性原則

「目前沒有抓到官方圖」只代表 resolver 尚未取得有效圖，不再等同於「官方尚未公布」。只有官方來源重新驗證仍無可用座位圖時，前端才維持待取得／待校正狀態；一旦官方圖後續公布，下一輪自動同步會再次解析並升級該場 3D。

## 仍需承認的限制

售票網站可能使用登入牆、CAPTCHA、canvas-only 選位器或臨時反爬機制。這些情況無法保證每次 HTTP 請求都能取得圖，但 v0.40.10 不會因一次失敗永久判定「沒有官方圖」，而會保留自動重試與其他官方來源 fallback。
