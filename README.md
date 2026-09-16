# NEUL v0.19 · Korean Editorial Brand Pass

NEUL 是台灣韓星／演唱會追星工具。v0.19 沿用 v0.18 的 11 場館、PWA 與 3D 精度架構，正式把品牌副標定為 **Stay Close to What You Love.**，並重整中／韓／英整站字體與首頁 Hero，讓視覺更接近韓國音樂與時尚數位產品。

## v0.19 重點

- 正式品牌副標：`Stay Close to What You Love.`
- Logo lockup 同時呈現 `NEUL / 늘` 與副標。
- Hero 改為「更近一點，從這裡開始。」避免與副標重複。
- 全站改採韓系 Grotesk 字體系統：Noto Sans KR / TC + Apple SD Gothic Neo / PingFang fallback。
- 拿掉主要頁面大量西式 Georgia 襯線字，統一緊字距、粗細對比與韓系 editorial hierarchy。
- PWA / WebGL / 11 場館 / 活動資料與既有功能完整保留。

## 仍保留
- 11 個場館模型
- IVE / PLAVE / Stray Kids 活動專屬 Layout
- WebGL2 + Canvas fallback
- 身高、坐／站、肉眼 / 1× / 2× / 5×
- 區／排／座號視角
- A/B 座位比較
- Archive、翻頁倒數、當日模式、PWA、IndexedDB
- 台灣活動官方來源更新與失敗回退
- 外部真實實拍連結（不複製第三方照片）

## 精度原則
NEUL 的 3D 會清楚區分「官方資料可確認的固定幾何」與「依公開實拍交叉校正的視角風險」。沒有可靠單席座標時，不宣稱單一座位為真實數位孿生；活動舞台與設備亦以每場主辦公開配置為準。

## 部署
解壓縮後可直接匯入 Vercel。核心功能不需要 Ticketmaster API。
