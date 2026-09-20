# NEUL v0.40.14 Test Report

## Result
PASS

## Activity explorer
- 完整活動清單與月曆同時存在。
- 桌機：清單優先顯示；月曆／當日 agenda 位於右側。
- 行動版：完整清單在前，月曆在後。
- 指定移除的「保留原本清單，可直接往下瀏覽全部活動」文字不存在於 UI。
- 搜尋採多 token AND matching。
- 月份、日期區間、地區、30/90 天快速篩選保留。
- HTML duplicate IDs: 0。
- Required explorer/3D IDs missing: 0。

## 3D runtime
- Canvas fallback `isLight` TDZ/runtime crash: fixed。
- Safari stable Canvas 3D path: present。
- WebGL runtime recovery / one-time safe fallback: present。
- 互動 viewer drag / zoom event handling preserved。
- Official seat-map side reference preserved。
- IVE historical example remains in Taipei Arena activity configuration selector only。

## Event/venue audit
- Seed/fallback events: 75
- Event-specific 3D runtime audit: 75 PASS / 0 FAIL
- Unique event-layout audit: 75 PASS / 0 FAIL
- Jason Mraz / 台北南港展覽館一館：venue resolution fixed, event-specific auto 3D generated。
- Future known-venue event auto 3D: PASS
- Future unknown-venue runtime venue + event 3D: PASS

## Existing automation regression
- 14 ticket source families + promoter/artist feeds: PASS
- Coverage Auditor: PASS
- Official seat-map resolver/cache/retry: PASS
- Featured silent 10-second carousel: PASS
- Archive / expired 3D selector cleanup: PASS
- PWA / IndexedDB checks: PASS
