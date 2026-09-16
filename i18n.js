(() => {
  const CONFIG = {
    'zh-Hant': { htmlLang: 'zh-Hant', locale: 'zh-TW', label: '繁中' },
    en: { htmlLang: 'en', locale: 'en-US', label: 'EN' },
    ja: { htmlLang: 'ja', locale: 'ja-JP', label: '日本語' },
    ko: { htmlLang: 'ko', locale: 'ko-KR', label: '한국어' }
  };

  const D = {
    en: {
      '首頁':'Home','活動':'Events','視野':'View','作戰':'Plan','我的':'My','設定':'Settings','提醒中心':'Alerts','搜尋':'Search','關閉':'Close','關閉設定':'Close settings','關閉安裝說明':'Close install guide',
      '全部活動':'All events','演唱會':'Concerts','見面會':'Fan meetings','音樂節':'Festivals','展覽':'Exhibitions','其他':'Other',
      '全台':'Taiwan','台北':'Taipei','桃園':'Taoyuan','高雄':'Kaohsiung','查看更多活動 →':'View more events →','收起活動 ↑':'Collapse events ↑',
      '不能錯過的重點活動':'Highlights you should not miss','看更多 →':'View details →','加入追蹤':'Follow','✓ 已追蹤':'✓ Following','+ 加入追蹤':'+ Follow','官方網站 →':'Official site →',
      '藝人資料 →':'Artist directory →','追蹤的藝人':'Following','我的活動':'My events','可加入主畫面':'Add to Home Screen',
      '更近一點，':'A little closer,','從這裡開始。':'starts here.','選場館・選座位・看視角・更安心':'Choose a venue · Pick a seat · Preview the view · Go with confidence','NEUL 讓每一場心動，都值得被好好準備。':'NEUL helps you prepare for every moment you look forward to.',
      'NEUL 取自韓文「늘」，意思是「總是、一直」。追星不只是一場演出的那一天，而是從等待公告、準備搶票、選擇座位，到真正走進場館的每一個時刻。':'NEUL comes from the Korean word “늘”, meaning “always”. Following an artist is more than the day of the show — it is every moment from waiting for announcements and preparing for ticketing to choosing a seat and finally entering the venue.',
      'NEUL 想做的，是把這些零散的時刻整理得更清楚，讓你一直離喜歡的人、音樂與現場更近一點。':'NEUL brings those scattered moments together so you can stay closer to the people, music and live experiences you love.',
      '這是一個由喜歡追星的人，為同樣喜歡現場、搶票與選位的人慢慢做起來的獨立專案。NEUL 與藝人、經紀公司、主辦單位及售票平台沒有隸屬關係，只希望讓每一次出發前的準備更清楚一點。':'An independent project made by someone who loves following artists, for people who love live shows, ticketing and choosing seats. NEUL is not affiliated with artists, agencies, promoters or ticketing platforms; it simply aims to make every trip to a show easier to prepare for.',
      '探索場館 · 選擇座位 · 預覽視角':'Explore venues · Choose seats · Preview your view','進入3D場館 →':'Enter 3D venue →','場館':'Venue','活動配置':'Event layout','座位層級':'Seating level','區域':'Section','排數／深度':'Row / depth','座號':'Seat no.','左右位置估算':'Estimated lateral position','身高':'Height','觀看狀態':'Viewing posture','坐著':'Seated','站著':'Standing','視野模式':'View mode','肉眼':'Naked eye','查看視角 →':'Preview view →',
      '座位視角預覽':'Seat view preview','放大預覽':'Expand preview','↔ 左右觀看':'↔ Look left/right','⊕ 放大縮小':'⊕ Zoom','↻ 拖曳旋轉':'↻ Drag to rotate',
      '視角方向依官方場館資料與可取得的活動配置重建；未有本場專屬舞台圖時採場館基準，非實際拍攝畫面。':'View direction is reconstructed from official venue information and available event layouts. When no event-specific stage plan is available, the venue baseline is used. This is a simulation, not a real photo.',
      '場館分區依官方資料重建；有本場售票配置時再疊加舞台方向。實際視野仍受舞台、欄杆、控台與設備影響。':'Venue sections are reconstructed from official data; event-specific stage direction is added when available. Actual views may still be affected by staging, rails, control booths and equipment.',
      '活動、售票、入場及視野資訊僅供參考，請以藝人、主辦單位、場館與官方售票平台最新公告為準。':'Event, ticketing, entry and seat-view information is for reference only. Please follow the latest announcements from artists, promoters, venues and official ticketing platforms.',
      '資料約每 6 小時檢查可用官方來源 · 每日另做一次排程同步':'Available official sources are checked about every 6 hours · One additional scheduled sync runs daily',
      '拖曳觀看 · 滾輪／雙指縮放 · 官方配置校正／模擬視角':'Drag to look around · Scroll/pinch to zoom · Official-layout calibration / simulated view',
      '外觀':'Appearance','圖片與 3D 維持原始色彩':'Images and 3D keep their original colors','深色':'Dark','亮色':'Light','加入主畫面':'Add to Home Screen','以 PWA 方式開啟 NEUL':'Open NEUL as a PWA','安裝 / 加入主畫面':'Install / Add to Home Screen','提醒功能維持獨立入口，可從頁面右上方的提醒按鈕開啟。':'Alerts remain a separate feature and can be opened from the alert button at the top right.',
      '語言':'Language','切換介面顯示語言':'Change the interface language','追星作戰室':'Concert companion','正在確認最新活動…':'Checking the latest events…','目前顯示已核對活動':'Showing verified events',
      '沒有符合條件的活動。':'No matching events.','切回「台灣／全部活動」可查看已核對資料。':'Switch back to Taiwan / All events to view verified listings.','日期待公布':'Date TBA','時間待公告':'Time TBA','歷史場次':'Past event','本週登場':'This week','已開賣':'On sale','活動狀態':'Event status','請回官方來源確認最新公告':'Check the official source for the latest update',
      '歷史案例':'Archive case','活動已結束 · 保留作為座位配置與視角重建案例':'Event ended · Kept as a seating-layout and view-reconstruction reference','下一步：準備正式售票':'Next: Prepare for general sale','下一步：確認演出資訊':'Next: Check show details',
      '場次':'Sessions','售票時間軸':'Ticketing timeline','粉絲福利':'Fan benefits','需要注意':'Things to note','官方來源 ↗':'Official source ↗','補充公告 ↗':'Additional notice ↗','官方座位配置 ↗':'Official seating layout ↗','查看本場 3D →':'View event 3D →','一般場館 3D →':'Venue baseline 3D →',
      '官方活動來源':'Official event source','近期活動':'Upcoming events','目前沒有已收錄場次':'No listed events yet','目前沒有已收錄的近期活動。':'No upcoming listed events.','官方頁面 ↗':'Official page ↗','已收錄與官方活動來源帶入的藝人，會依近期活動持續更新。':'Artists already listed or discovered from official event sources are updated as new events are added.','追蹤中的藝人頁會依目前已收錄的官方活動資料，自動更新下一場活動與活動數量。':'Followed artist pages update their next event and event count from the currently listed official event data.',
      '演出已結束':'Event ended','此場次保留活動資訊、座位配置與 3D 視角作為歷史案例。':'This event remains available as an archive of event details, seating layouts and 3D views.','日':'DAYS','時':'HRS','分':'MIN','秒':'SEC',
      '官方頁面已連線 · ':'Official page connected · ','官方公告可能有變更 · ':'Official notice may have changed · ','本站最後核對 · ':'Last checked by NEUL · ','詳細規則與臨時變更請回官方來源確認。':'For detailed rules and last-minute changes, please confirm with the official source.',
      '約每 6 小時檢查可用官方來源 · 每日排程同步':'Available official sources checked about every 6 hours · Daily scheduled sync','目前收錄':'Coverage','更早場次持續補齊。':'Earlier events are being added gradually.','搜尋會同時查近期與已收錄 Archive。':'Search includes both upcoming events and the archive.',
      '歷史官方票區圖重建 · 區域位置校正 · 單席視角未宣稱精準':'Historical official seating map reconstruction · Section placement calibrated · Individual-seat precision not claimed','官方本場配置已核對 · 區域位置重建 · 排數／座號仍為校正估算 · 現場燈光為模擬':'Official event layout checked · Section positions reconstructed · Row/seat positions are calibrated estimates · Concert lighting is simulated','舞台依目前公開資料呈現 · 現場燈光為模擬':'Stage based on currently available public information · Concert lighting is simulated',
      '設定中…':'Setting up…','此瀏覽器不支援通知。':'This browser does not support notifications.','通知權限尚未開啟。':'Notification permission is not enabled.','開啟通知':'Enable notifications','背景提醒已啟用。Hobby 版採每日摘要；精準售票時間請搭配行事曆提醒。':'Background alerts are enabled. On Hobby, they use a daily digest; use calendar reminders for exact ticket-sale times.','提醒功能':'Alerts',
      '加入行事曆':'Add to calendar','Apple 行事曆':'Apple Calendar','Google 行事曆':'Google Calendar','30 分鐘前提醒':'Remind me 30 min before','開啟當日模式':'Open concert-day mode','預覽當日模式':'Preview concert-day mode','官方資訊變更':'Official info changes','尚無已記錄變更':'No recorded changes yet',
      '設為 A':'Set A','設為 B':'Set B','比較':'Compare','還差 B 座位':'Seat B is still needed','先選另一個區域／排數，再按「設為 B」。':'Choose another section/row, then tap “Set B”.','請比較同一場配置':'Compare seats in the same layout','A、B 必須屬於同一場館與活動配置，避免把不同舞台的距離混在一起。':'A and B must belong to the same venue and event layout so different stage setups are not mixed.','相對距離':'Relative distance','側向角度':'Side angle','觀看條件':'Viewing setup','票價':'Price','可信度':'Confidence','本場配置':'Event layout','場館基準':'Venue baseline','目前沒有特別視線警示。':'No special view warning at this time.',
      '當日模式 →':'Concert-day mode →','追蹤藝人目前沒有已收錄的近期台灣活動。':'No upcoming Taiwan events are currently listed for followed artists.','NEUL 提醒':'NEUL alert','活動資訊有更新':'Event information has been updated','搜尋藝人、場館或活動（目前收錄 2026/09 起）':'Search artists, venues or events (coverage from Sep 2026)','目前已收錄資料自 2026/09 起；更早場次持續補齊。':'Coverage starts Sep 2026; earlier events are being added.','Upcoming':'Upcoming','Featured':'Featured','Concert':'Concert','My List':'My List','Home':'Home','Concerts':'Concerts','Artists':'Artists','Venues':'Venues','Planner':'Planner','About':'About','SETTINGS':'SETTINGS','WHY NEUL':'WHY NEUL','VENUE 3D':'VENUE 3D'
    },
    ja: {
      '首頁':'ホーム','活動':'イベント','視野':'ビュー','作戰':'プラン','我的':'マイ','設定':'設定','提醒中心':'通知センター','搜尋':'検索','關閉':'閉じる','關閉設定':'設定を閉じる','關閉安裝說明':'インストール案内を閉じる',
      '全部活動':'すべて','演唱會':'コンサート','見面會':'ファンミーティング','音樂節':'フェス','展覽':'展示','其他':'その他','全台':'台湾全域','台北':'台北','桃園':'桃園','高雄':'高雄','查看更多活動 →':'もっと見る →','收起活動 ↑':'閉じる ↑',
      '不能錯過的重點活動':'注目のイベント','看更多 →':'詳細を見る →','加入追蹤':'フォロー','✓ 已追蹤':'✓ フォロー中','+ 加入追蹤':'+ フォロー','官方網站 →':'公式サイト →','藝人資料 →':'アーティスト一覧 →','追蹤的藝人':'フォロー中','我的活動':'マイイベント','可加入主畫面':'ホーム画面に追加できます',
      '更近一點，':'もう少し近くへ、','從這裡開始。':'ここから。','選場館・選座位・看視角・更安心':'会場を選ぶ・席を選ぶ・視界を確認・もっと安心','NEUL 讓每一場心動，都值得被好好準備。':'NEUL は、楽しみにしているすべての瞬間を丁寧に準備するための場所です。',
      'NEUL 取自韓文「늘」，意思是「總是、一直」。追星不只是一場演出的那一天，而是從等待公告、準備搶票、選擇座位，到真正走進場館的每一個時刻。':'NEUL は韓国語の「늘（いつも）」から生まれた名前です。推し活は公演当日だけではなく、告知を待つ時間、チケットの準備、座席選び、そして会場に入るまでのすべての瞬間を含みます。','NEUL 想做的，是把這些零散的時刻整理得更清楚，讓你一直離喜歡的人、音樂與現場更近一點。':'NEUL は、その散らばった瞬間をわかりやすく整理し、好きな人・音楽・ライブにいつも少し近づけることを目指しています。',
      '這是一個由喜歡追星的人，為同樣喜歡現場、搶票與選位的人慢慢做起來的獨立專案。NEUL 與藝人、經紀公司、主辦單位及售票平台沒有隸屬關係，只希望讓每一次出發前的準備更清楚一點。':'ライブやチケット、座席選びが好きな一人のファンが、同じように推し活を楽しむ人のために少しずつ作っている個人プロジェクトです。NEUL はアーティスト、事務所、主催者、チケット販売会社とは無関係です。',
      '探索場館 · 選擇座位 · 預覽視角':'会場を探索 · 座席を選択 · 視界をプレビュー','進入3D場館 →':'3D会場を見る →','場館':'会場','活動配置':'イベント配置','座位層級':'座席レベル','區域':'エリア','排數／深度':'列／奥行き','座號':'座席番号','左右位置估算':'左右位置の推定','身高':'身長','觀看狀態':'観覧姿勢','坐著':'着席','站著':'立ち','視野模式':'視界モード','肉眼':'肉眼','查看視角 →':'視界を見る →','座位視角預覽':'座席からの視界','放大預覽':'拡大','↔ 左右觀看':'↔ 左右を見る','⊕ 放大縮小':'⊕ ズーム','↻ 拖曳旋轉':'↻ ドラッグで回転',
      '視角方向依官方場館資料與可取得的活動配置重建；未有本場專屬舞台圖時採場館基準，非實際拍攝畫面。':'視界方向は公式会場情報と取得可能なイベント配置から再構築しています。公演専用の舞台図がない場合は会場基準を使用します。実写ではありません。','場館分區依官方資料重建；有本場售票配置時再疊加舞台方向。實際視野仍受舞台、欄杆、控台與設備影響。':'会場区分は公式情報をもとに再構築し、公演別の座席配置がある場合は舞台方向を反映します。実際の視界は舞台、柵、PA席、機材などの影響を受けます。',
      '活動、售票、入場及視野資訊僅供參考，請以藝人、主辦單位、場館與官方售票平台最新公告為準。':'イベント、チケット、入場、視界情報は参考用です。最新情報はアーティスト、主催者、会場、公式チケットサイトの案内をご確認ください。','資料約每 6 小時檢查可用官方來源 · 每日另做一次排程同步':'利用可能な公式情報を約6時間ごとに確認 · 1日1回の定期同期も実施',
      '拖曳觀看 · 滾輪／雙指縮放 · 官方配置校正／模擬視角':'ドラッグで視点移動 · ホイール／ピンチでズーム · 公式配置校正／シミュレーション','外觀':'外観','圖片與 3D 維持原始色彩':'画像と3Dは元の色を維持','深色':'ダーク','亮色':'ライト','加入主畫面':'ホーム画面に追加','以 PWA 方式開啟 NEUL':'PWAとしてNEULを開く','安裝 / 加入主畫面':'インストール / ホーム画面に追加','提醒功能維持獨立入口，可從頁面右上方的提醒按鈕開啟。':'通知機能は独立した入口のままです。右上の通知ボタンから開けます。','語言':'言語','切換介面顯示語言':'表示言語を切り替える','追星作戰室':'推し活コンパニオン','正在確認最新活動…':'最新イベントを確認中…','目前顯示已核對活動':'確認済みイベントを表示中',
      '沒有符合條件的活動。':'条件に合うイベントはありません。','切回「台灣／全部活動」可查看已核對資料。':'「台湾全域／すべて」に戻ると確認済みイベントを表示できます。','日期待公布':'日程未定','時間待公告':'時間未定','歷史場次':'過去公演','本週登場':'今週開催','已開賣':'発売中','活動狀態':'イベント状況','請回官方來源確認最新公告':'最新情報は公式情報をご確認ください','歷史案例':'アーカイブ','活動已結束 · 保留作為座位配置與視角重建案例':'終了済み · 座席配置と視界再構築の参考として保存','下一步：準備正式售票':'次：一般発売の準備','下一步：確認演出資訊':'次：公演情報を確認',
      '場次':'公演回','售票時間軸':'チケット日程','粉絲福利':'特典','需要注意':'注意事項','官方來源 ↗':'公式情報 ↗','補充公告 ↗':'追加案内 ↗','官方座位配置 ↗':'公式座席図 ↗','查看本場 3D →':'この公演の3D →','一般場館 3D →':'会場基準3D →','官方活動來源':'公式イベント情報','近期活動':'近日のイベント','目前沒有已收錄場次':'登録済み公演はありません','目前沒有已收錄的近期活動。':'登録済みの近日イベントはありません。','官方頁面 ↗':'公式ページ ↗','已收錄與官方活動來源帶入的藝人，會依近期活動持續更新。':'登録済み、または公式イベント情報から追加されたアーティストは、今後のイベントに応じて更新されます。','追蹤中的藝人頁會依目前已收錄的官方活動資料，自動更新下一場活動與活動數量。':'フォロー中のアーティストページは、登録済み公式イベント情報から次回公演と件数を自動更新します。',
      '演出已結束':'公演終了','此場次保留活動資訊、座位配置與 3D 視角作為歷史案例。':'イベント情報、座席配置、3D視界をアーカイブとして保存しています。','日':'日','時':'時間','分':'分','秒':'秒','官方頁面已連線 · ':'公式ページ接続済み · ','官方公告可能有變更 · ':'公式案内に変更の可能性 · ','本站最後核對 · ':'NEUL最終確認 · ','詳細規則與臨時變更請回官方來源確認。':'詳細ルールや直前の変更は公式情報をご確認ください。',
      '約每 6 小時檢查可用官方來源 · 每日排程同步':'利用可能な公式情報を約6時間ごとに確認 · 毎日定期同期','更早場次持續補齊。':'過去のイベントも順次追加中。','搜尋會同時查近期與已收錄 Archive。':'検索対象は近日イベントとアーカイブの両方です。','歷史官方票區圖重建 · 區域位置校正 · 單席視角未宣稱精準':'過去の公式座席図を再構築 · エリア位置を校正 · 1席単位の精度は保証していません','官方本場配置已核對 · 區域位置重建 · 排數／座號仍為校正估算 · 現場燈光為模擬':'公式公演配置を確認済み · エリア位置を再構築 · 列／座席位置は校正推定 · 照明はシミュレーション','舞台依目前公開資料呈現 · 現場燈光為模擬':'現在公開されている情報をもとに舞台を表示 · 照明はシミュレーション',
      '開啟通知':'通知をオン','設定中…':'設定中…','此瀏覽器不支援通知。':'このブラウザは通知に対応していません。','通知權限尚未開啟。':'通知権限が有効になっていません。','加入行事曆':'カレンダーに追加','Apple 行事曆':'Appleカレンダー','Google 行事曆':'Googleカレンダー','30 分鐘前提醒':'30分前に通知','開啟當日模式':'当日モードを開く','預覽當日模式':'当日モードをプレビュー','官方資訊變更':'公式情報の変更','尚無已記錄變更':'記録された変更はありません',
      '設為 A':'Aに設定','設為 B':'Bに設定','比較':'比較','還差 B 座位':'B席を設定してください','先選另一個區域／排數，再按「設為 B」。':'別のエリア／列を選び、「Bに設定」を押してください。','請比較同一場配置':'同じ公演配置で比較してください','相對距離':'相対距離','側向角度':'横方向角度','觀看條件':'観覧条件','票價':'価格','可信度':'信頼度','本場配置':'公演配置','場館基準':'会場基準','目前沒有特別視線警示。':'現在、特別な視界注意情報はありません。','當日模式 →':'当日モード →','追蹤藝人目前沒有已收錄的近期台灣活動。':'フォロー中のアーティストに登録済みの台湾公演はありません。','NEUL 提醒':'NEUL 通知','活動資訊有更新':'イベント情報が更新されました','搜尋藝人、場館或活動（目前收錄 2026/09 起）':'アーティスト・会場・イベントを検索（2026年9月以降を収録）','目前已收錄資料自 2026/09 起；更早場次持續補齊。':'現在は2026年9月以降を収録。過去公演も順次追加中です。','Upcoming':'近日開催','Featured':'注目','Concert':'コンサート','My List':'マイリスト','Home':'ホーム','Concerts':'コンサート','Artists':'アーティスト','Venues':'会場','Planner':'プラン','About':'NEULについて','SETTINGS':'設定','WHY NEUL':'NEULについて','VENUE 3D':'会場 3D'
    },
    ko: {
      '首頁':'홈','活動':'공연','視野':'시야','作戰':'플랜','我的':'MY','設定':'설정','提醒中心':'알림 센터','搜尋':'검색','關閉':'닫기','關閉設定':'설정 닫기','關閉安裝說明':'설치 안내 닫기',
      '全部活動':'전체','演唱會':'콘서트','見面會':'팬미팅','音樂節':'페스티벌','展覽':'전시','其他':'기타','全台':'대만 전체','台北':'타이베이','桃園':'타오위안','高雄':'가오슝','查看更多活動 →':'더 보기 →','收起活動 ↑':'접기 ↑','不能錯過的重點活動':'놓치면 아쉬운 주요 공연','看更多 →':'자세히 보기 →','加入追蹤':'팔로우','✓ 已追蹤':'✓ 팔로우 중','+ 加入追蹤':'+ 팔로우','官方網站 →':'공식 사이트 →','藝人資料 →':'아티스트 목록 →','追蹤的藝人':'팔로우 아티스트','我的活動':'내 공연','可加入主畫面':'홈 화면에 추가 가능',
      '更近一點，':'조금 더 가까이,','從這裡開始。':'여기서 시작해요.','選場館・選座位・看視角・更安心':'공연장 선택 · 좌석 선택 · 시야 확인 · 더 안심하게','NEUL 讓每一場心動，都值得被好好準備。':'NEUL은 기다려 온 모든 순간을 더 잘 준비할 수 있게 도와줍니다.','NEUL 取自韓文「늘」，意思是「總是、一直」。追星不只是一場演出的那一天，而是從等待公告、準備搶票、選擇座位，到真正走進場館的每一個時刻。':'NEUL은 한국어 “늘”, 즉 “언제나”에서 온 이름입니다. 덕질은 공연 당일만이 아니라 공지를 기다리고, 티켓팅을 준비하고, 좌석을 고르고, 공연장에 들어가는 모든 순간을 포함합니다.','NEUL 想做的，是把這些零散的時刻整理得更清楚，讓你一直離喜歡的人、音樂與現場更近一點。':'NEUL은 흩어진 순간들을 더 명확하게 정리해 좋아하는 사람, 음악, 그리고 현장에 늘 조금 더 가까이 갈 수 있게 하고 싶습니다.','這是一個由喜歡追星的人，為同樣喜歡現場、搶票與選位的人慢慢做起來的獨立專案。NEUL 與藝人、經紀公司、主辦單位及售票平台沒有隸屬關係，只希望讓每一次出發前的準備更清楚一點。':'현장, 티켓팅, 좌석 선택을 좋아하는 팬이 같은 마음의 팬들을 위해 천천히 만들어 가는 독립 프로젝트입니다. NEUL은 아티스트, 소속사, 주최사, 티켓 플랫폼과 제휴 관계가 없습니다.',
      '探索場館 · 選擇座位 · 預覽視角':'공연장 탐색 · 좌석 선택 · 시야 미리보기','進入3D場館 →':'3D 공연장 보기 →','場館':'공연장','活動配置':'공연 배치','座位層級':'좌석 층','區域':'구역','排數／深度':'열 / 깊이','座號':'좌석 번호','左右位置估算':'좌우 위치 추정','身高':'키','觀看狀態':'관람 상태','坐著':'착석','站著':'스탠딩','視野模式':'시야 모드','肉眼':'육안','查看視角 →':'시야 보기 →','座位視角預覽':'좌석 시야 미리보기','放大預覽':'크게 보기','↔ 左右觀看':'↔ 좌우 보기','⊕ 放大縮小':'⊕ 확대/축소','↻ 拖曳旋轉':'↻ 드래그 회전',
      '視角方向依官方場館資料與可取得的活動配置重建；未有本場專屬舞台圖時採場館基準，非實際拍攝畫面。':'시야 방향은 공식 공연장 정보와 확보 가능한 공연 배치를 바탕으로 재구성합니다. 공연 전용 무대도가 없으면 공연장 기준 배치를 사용하며 실제 촬영 사진이 아닙니다.','場館分區依官方資料重建；有本場售票配置時再疊加舞台方向。實際視野仍受舞台、欄杆、控台與設備影響。':'공연장 구역은 공식 자료를 바탕으로 재구성하며, 공연별 좌석 배치가 있으면 무대 방향을 추가 반영합니다. 실제 시야는 무대, 난간, 콘솔, 장비에 따라 달라질 수 있습니다.','活動、售票、入場及視野資訊僅供參考，請以藝人、主辦單位、場館與官方售票平台最新公告為準。':'공연, 티켓, 입장, 시야 정보는 참고용입니다. 최신 내용은 아티스트, 주최사, 공연장, 공식 예매처 공지를 확인해 주세요.','資料約每 6 小時檢查可用官方來源 · 每日另做一次排程同步':'사용 가능한 공식 정보를 약 6시간마다 확인 · 하루 1회 추가 예약 동기화',
      '拖曳觀看 · 滾輪／雙指縮放 · 官方配置校正／模擬視角':'드래그로 보기 · 휠/핀치 확대 · 공식 배치 보정/시뮬레이션','外觀':'화면','圖片與 3D 維持原始色彩':'이미지와 3D는 원래 색상 유지','深色':'다크','亮色':'라이트','加入主畫面':'홈 화면에 추가','以 PWA 方式開啟 NEUL':'PWA로 NEUL 열기','安裝 / 加入主畫面':'설치 / 홈 화면 추가','提醒功能維持獨立入口，可從頁面右上方的提醒按鈕開啟。':'알림 기능은 별도 메뉴로 유지되며 오른쪽 상단 알림 버튼에서 열 수 있습니다.','語言':'언어','切換介面顯示語言':'인터페이스 언어 변경','追星作戰室':'덕질 콘서트 컴패니언','正在確認最新活動…':'최신 공연 확인 중…','目前顯示已核對活動':'확인된 공연을 표시 중',
      '沒有符合條件的活動。':'조건에 맞는 공연이 없습니다.','切回「台灣／全部活動」可查看已核對資料。':'대만 전체 / 전체 공연으로 돌아가 확인된 데이터를 볼 수 있습니다.','日期待公布':'날짜 미정','時間待公告':'시간 미정','歷史場次':'지난 공연','本週登場':'이번 주','已開賣':'예매 중','活動狀態':'공연 상태','請回官方來源確認最新公告':'최신 공지는 공식 출처를 확인해 주세요','歷史案例':'아카이브','活動已結束 · 保留作為座位配置與視角重建案例':'종료된 공연 · 좌석 배치와 시야 재구성 참고용으로 보관','下一步：準備正式售票':'다음: 일반 예매 준비','下一步：確認演出資訊':'다음: 공연 정보 확인',
      '場次':'회차','售票時間軸':'예매 일정','粉絲福利':'팬 혜택','需要注意':'주의사항','官方來源 ↗':'공식 출처 ↗','補充公告 ↗':'추가 공지 ↗','官方座位配置 ↗':'공식 좌석 배치 ↗','查看本場 3D →':'이 공연 3D →','一般場館 3D →':'공연장 기준 3D →','官方活動來源':'공식 공연 출처','近期活動':'다가오는 공연','目前沒有已收錄場次':'등록된 공연 없음','目前沒有已收錄的近期活動。':'등록된 예정 공연이 없습니다.','官方頁面 ↗':'공식 페이지 ↗','已收錄與官方活動來源帶入的藝人，會依近期活動持續更新。':'등록된 아티스트와 공식 공연 출처에서 추가된 아티스트는 신규 공연에 따라 계속 업데이트됩니다.','追蹤中的藝人頁會依目前已收錄的官方活動資料，自動更新下一場活動與活動數量。':'팔로우 아티스트 페이지는 등록된 공식 공연 정보를 바탕으로 다음 공연과 공연 수를 자동 업데이트합니다.',
      '演出已結束':'공연 종료','此場次保留活動資訊、座位配置與 3D 視角作為歷史案例。':'공연 정보, 좌석 배치, 3D 시야를 아카이브로 보관합니다.','日':'일','時':'시간','分':'분','秒':'초','官方頁面已連線 · ':'공식 페이지 연결 · ','官方公告可能有變更 · ':'공식 공지 변경 가능 · ','本站最後核對 · ':'NEUL 최종 확인 · ','詳細規則與臨時變更請回官方來源確認。':'세부 규정과 당일 변경 사항은 공식 출처를 확인해 주세요.','約每 6 小時檢查可用官方來源 · 每日排程同步':'사용 가능한 공식 정보를 약 6시간마다 확인 · 매일 예약 동기화','更早場次持續補齊。':'더 이전 공연도 계속 추가 중입니다.','搜尋會同時查近期與已收錄 Archive。':'검색은 예정 공연과 아카이브를 함께 조회합니다.','歷史官方票區圖重建 · 區域位置校正 · 單席視角未宣稱精準':'과거 공식 좌석도 재구성 · 구역 위치 보정 · 개별 좌석 정밀도는 보장하지 않음','官方本場配置已核對 · 區域位置重建 · 排數／座號仍為校正估算 · 現場燈光為模擬':'공식 공연 배치 확인 · 구역 위치 재구성 · 열/좌석 위치는 보정 추정 · 조명은 시뮬레이션','舞台依目前公開資料呈現 · 現場燈光為模擬':'현재 공개 자료를 바탕으로 무대 표시 · 조명은 시뮬레이션',
      '開啟通知':'알림 켜기','設定中…':'설정 중…','此瀏覽器不支援通知。':'이 브라우저는 알림을 지원하지 않습니다.','通知權限尚未開啟。':'알림 권한이 허용되지 않았습니다.','加入行事曆':'캘린더에 추가','Apple 行事曆':'Apple 캘린더','Google 行事曆':'Google 캘린더','30 分鐘前提醒':'30분 전 알림','開啟當日模式':'공연 당일 모드','預覽當日模式':'당일 모드 미리보기','官方資訊變更':'공식 정보 변경','尚無已記錄變更':'기록된 변경 없음','設為 A':'A로 설정','設為 B':'B로 설정','比較':'비교','還差 B 座位':'B 좌석이 필요합니다','先選另一個區域／排數，再按「設為 B」。':'다른 구역/열을 선택한 뒤 “B로 설정”을 누르세요.','請比較同一場配置':'같은 공연 배치에서 비교해 주세요','相對距離':'상대 거리','側向角度':'측면 각도','觀看條件':'관람 조건','票價':'가격','可信度':'신뢰도','本場配置':'공연 배치','場館基準':'공연장 기준','目前沒有特別視線警示。':'현재 별도의 시야 경고가 없습니다.','當日模式 →':'당일 모드 →','追蹤藝人目前沒有已收錄的近期台灣活動。':'팔로우 아티스트의 등록된 대만 예정 공연이 없습니다.','NEUL 提醒':'NEUL 알림','活動資訊有更新':'공연 정보가 업데이트되었습니다','搜尋藝人、場館或活動（目前收錄 2026/09 起）':'아티스트·공연장·공연 검색 (2026년 9월부터 수록)','目前已收錄資料自 2026/09 起；更早場次持續補齊。':'현재 2026년 9월부터 수록 중이며 이전 공연도 계속 추가합니다.','Upcoming':'다가오는 공연','Featured':'추천','Concert':'콘서트','My List':'마이 리스트','Home':'홈','Concerts':'콘서트','Artists':'아티스트','Venues':'공연장','Planner':'플랜','About':'소개','SETTINGS':'설정','WHY NEUL':'WHY NEUL','VENUE 3D':'공연장 3D'
    }
  };

  const textSource = new WeakMap();
  const textApplied = new WeakMap();
  const attrSource = new WeakMap();
  let current = localStorage.getItem('neul-language') || (() => {
    const l = (navigator.language || 'zh-TW').toLowerCase();
    if (l.startsWith('ja')) return 'ja';
    if (l.startsWith('ko')) return 'ko';
    if (l.startsWith('en')) return 'en';
    return 'zh-Hant';
  })();
  if (!CONFIG[current]) current = 'zh-Hant';

  function preserveWhitespace(source, translated) {
    const m = source.match(/^(\s*)([\s\S]*?)(\s*)$/);
    return `${m?.[1] || ''}${translated}${m?.[3] || ''}`;
  }
  function dict(lang) { return D[lang] || {}; }
  function patternTranslate(s, lang) {
    if (lang === 'zh-Hant') return s;
    const T = lang === 'en' ? {
      eventCount:n=>`${n} Taiwan events`, more:n=>`View more events (${n}) →`, minutes:(n,f)=>`${n} min ${f?'from now':'ago'}`, hours:(n,f)=>`${n} hr ${f?'from now':'ago'}`, days:(n,f)=>`${n} day${n==='1'?'':'s'} ${f?'from now':'ago'}`,
      coverage:x=>`Coverage starts ${x}; earlier events are being added. Search includes upcoming events and the archive.`, checked:x=>`Official info updated ${x}`, sync:x=>`Taiwan events synced ${x}`, verified:x=>`Verified data · ${x}`,
      seat:(tier,sec,row,no)=>`${tier} · ${sec} · Row ${row}${no?` · Seat ${no}`:''}`, view:(h,p)=>`${h}cm · ${p==='站著'?'Standing':'Seated'}`, row:n=>`Row ${n}`, seatNo:n=>`Seat ${n}`
    } : lang === 'ja' ? {
      eventCount:n=>`台湾イベント ${n}件`, more:n=>`もっと見る（${n}件）→`, minutes:(n,f)=>`${n}分${f?'後':'前'}`, hours:(n,f)=>`${n}時間${f?'後':'前'}`, days:(n,f)=>`${n}日${f?'後':'前'}`,
      coverage:x=>`${x}以降のデータを収録中。過去公演も順次追加しています。検索は近日イベントとアーカイブの両方が対象です。`, checked:x=>`公式情報更新 ${x}`, sync:x=>`台湾イベント同期 ${x}`, verified:x=>`確認済みデータ · ${x}`,
      seat:(tier,sec,row,no)=>`${tier} · ${sec} · ${row}列${no?` · ${no}番`:''}`, view:(h,p)=>`${h}cm · ${p==='站著'?'立ち':'着席'}`, row:n=>`${n}列`, seatNo:n=>`${n}番`
    } : {
      eventCount:n=>`대만 공연 ${n}개`, more:n=>`더 보기 (${n}) →`, minutes:(n,f)=>`${n}분 ${f?'후':'전'}`, hours:(n,f)=>`${n}시간 ${f?'후':'전'}`, days:(n,f)=>`${n}일 ${f?'후':'전'}`,
      coverage:x=>`${x}부터 데이터를 수록 중이며 이전 공연도 계속 추가합니다. 검색은 예정 공연과 아카이브를 함께 조회합니다.`, checked:x=>`공식 정보 업데이트 ${x}`, sync:x=>`대만 공연 동기화 ${x}`, verified:x=>`확인된 데이터 · ${x}`,
      seat:(tier,sec,row,no)=>`${tier} · ${sec} · ${row}열${no?` · ${no}번`:''}`, view:(h,p)=>`${h}cm · ${p==='站著'?'스탠딩':'착석'}`, row:n=>`${n}열`, seatNo:n=>`${n}번`
    };
    let m;
    if ((m=s.match(/^(\d+) 場台灣活動$/))) return T.eventCount(m[1]);
    if ((m=s.match(/^查看更多活動（(\d+)） →$/))) return T.more(m[1]);
    if ((m=s.match(/^(\d+) 分鐘(後|前)$/))) return T.minutes(m[1],m[2]==='後');
    if ((m=s.match(/^(\d+) 小時(後|前)$/))) return T.hours(m[1],m[2]==='後');
    if ((m=s.match(/^(\d+) 天(後|前)$/))) return T.days(m[1],m[2]==='後');
    if ((m=s.match(/^目前已收錄資料自 (.+) 起；更早場次持續補齊。搜尋會同時查近期與已收錄 Archive。$/))) return T.coverage(m[1]);
    if ((m=s.match(/^官方資訊更新 (.+)$/))) return T.checked(m[1]);
    if ((m=s.match(/^台灣活動同步 (.+)$/))) return T.sync(m[1]);
    if ((m=s.match(/^已核對資料 · (.+)$/))) return T.verified(m[1]);
    if ((m=s.match(/^(.+) · (.+) (\d+)排(?: (\d+)號)?$/))) return T.seat(m[1],m[2],m[3],m[4]);
    if ((m=s.match(/^(\d+)cm · (站著|坐著)$/))) return T.view(m[1],m[2]);
    if ((m=s.match(/^(\d+)排$/))) return T.row(m[1]);
    if ((m=s.match(/^(\d+)號$/))) return T.seatNo(m[1]);
    return s;
  }

  function translateString(source, lang=current) {
    if (!source || lang === 'zh-Hant') return source;
    const trimmed = source.trim();
    const exact = dict(lang)[trimmed];
    if (exact != null) return preserveWhitespace(source, exact);
    const p = patternTranslate(trimmed, lang);
    if (p !== trimmed) return preserveWhitespace(source, p);
    return source;
  }

  function shouldSkipText(node) {
    const p = node.parentElement;
    return !p || ['SCRIPT','STYLE','NOSCRIPT','TEXTAREA','OPTION'].includes(p.tagName) || p.closest('[data-i18n-skip]');
  }
  function applyTextNode(node) {
    if (shouldSkipText(node) || !node.nodeValue?.trim()) return;
    const last = textApplied.get(node);
    if (!textSource.has(node) || (last != null && node.nodeValue !== last)) textSource.set(node, node.nodeValue);
    const src = textSource.get(node);
    const out = translateString(src);
    textApplied.set(node, out);
    if (node.nodeValue !== out) node.nodeValue = out;
  }
  function applyAttrs(el) {
    if (!(el instanceof Element) || el.closest('[data-i18n-skip]')) return;
    const attrs = ['placeholder','aria-label','title'];
    let store = attrSource.get(el); if (!store) { store={}; attrSource.set(el,store); }
    for (const a of attrs) {
      if (!el.hasAttribute(a)) continue;
      const now = el.getAttribute(a) || '';
      if (!(a in store) || (store[`last_${a}`] != null && now !== store[`last_${a}`])) store[a] = now;
      const out = translateString(store[a]); store[`last_${a}`]=out;
      if (now !== out) el.setAttribute(a,out);
    }
  }
  function applyTree(root=document) {
    if (root.nodeType === Node.TEXT_NODE) { applyTextNode(root); return; }
    if (root.nodeType === Node.ELEMENT_NODE) applyAttrs(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
    let n; while((n=walker.nextNode())) { if(n.nodeType===Node.TEXT_NODE) applyTextNode(n); else applyAttrs(n); }
  }
  function updateLanguageButtons() {
    document.querySelectorAll('[data-lang]').forEach(b => b.classList.toggle('active', b.dataset.lang===current));
  }
  function applyDocumentMeta() {
    document.documentElement.lang = CONFIG[current].htmlLang;
    document.documentElement.dataset.lang = current;
    const desc = document.querySelector('meta[name="description"]');
    const descriptions = {
      'zh-Hant':'NEUL｜韓星活動、售票提醒、場館 3D 視野與追星行程。',
      en:'NEUL | K-pop events in Taiwan, ticket reminders, 3D venue views and concert planning.',
      ja:'NEUL｜台湾のK-POPイベント、チケット通知、3D会場ビュー、推し活プランニング。',
      ko:'NEUL｜대만 K-POP 공연, 티켓 알림, 3D 공연장 시야와 콘서트 플래닝.'
    };
    if(desc) desc.content=descriptions[current];
  }
  function setLanguage(lang, persist=true) {
    if (!CONFIG[lang]) return;
    current=lang;
    if(persist) localStorage.setItem('neul-language',lang);
    applyDocumentMeta();
    applyTree(document.body);
    updateLanguageButtons();
    window.dispatchEvent(new CustomEvent('neul:languagechange',{detail:{language:lang,locale:CONFIG[lang].locale}}));
  }
  function getLanguage(){ return current; }
  function locale(){ return CONFIG[current].locale; }

  window.NEUL_I18N = { t:(source)=>translateString(source), translateUIString:translateString, setLanguage, getLanguage, locale, config:CONFIG, apply:()=>applyTree(document.body) };

  const start = () => {
    applyDocumentMeta(); applyTree(document.body); updateLanguageButtons();
    document.querySelectorAll('[data-lang]').forEach(btn => btn.addEventListener('click', () => setLanguage(btn.dataset.lang)));
    const observer = new MutationObserver(mutations => {
      for(const m of mutations){
        if(m.type==='characterData') applyTextNode(m.target);
        else for(const n of m.addedNodes) applyTree(n);
        if(m.type==='attributes' && m.target) applyAttrs(m.target);
      }
    });
    observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title']});
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();
