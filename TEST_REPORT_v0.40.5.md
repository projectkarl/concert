# NEUL v0.40.5 Test Report

日期：2026-09-21

## 結果
`npm run check`：PASS

- 101 seed events fallback：PASS
- Coverage Auditor / twconcertview cross-check：PASS
- 71/71 calibrated current custom 3D eligibility：PASS
- 30/30 uncalibrated/outdoor exclusions：PASS
- 13/13 calibrated venues have Korean-star reference scenes：PASS
- reference source / artist / date / distance calibration / uncertainty：PASS
- TICC continuous-rake topology guard：PASS
- shared ticket-page seat-map disambiguation：PASS
- event source ⓘ on current list / full list / Featured：PASS
- Japan entertainment-news category：PASS
- mobile News navigation：PASS
- mobile list/calendar containment：PASS
- PWA / IndexedDB / baseline hash verification：PASS

## Precision note
距離顯示是「票區／排別級」估算。官方有場館尺度時使用官方尺度；其餘依固定席幾何、活動官方票區圖與可取得實拍視角交叉校正。UI 會顯示估算範圍，不宣稱單一座位的測量級公尺值。
