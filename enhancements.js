import { idbGet, idbSet, eventChanges, loadOfflineSnapshot, saveSubmissionDraft } from './storage.js';

const $=(q,r=document)=>r.querySelector(q); const $$=(q,r=document)=>[...r.querySelectorAll(q)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let app=null, compareA=null, compareB=null;

function ensureShells(){
  if(!$('#neulDayMode')) document.body.insertAdjacentHTML('beforeend',`
  <div class="neul-modal" id="neulDayMode" hidden><div class="neul-modal-card day-mode-card"><button class="neul-modal-close" data-close="#neulDayMode">×</button><div id="neulDayContent"></div></div></div>
  <div class="neul-modal" id="seatCompareModal" hidden><div class="neul-modal-card compare-modal-card"><button class="neul-modal-close" data-close="#seatCompareModal">×</button><div id="seatCompareContent"></div></div></div>
  <div class="neul-modal" id="submissionModal" hidden><div class="neul-modal-card submission-card"><button class="neul-modal-close" data-close="#submissionModal">×</button><div id="submissionContent"></div></div></div>
  <div class="offline-chip" id="offlineChip" hidden></div>`);
  $$('[data-close]').forEach(b=>b.onclick=()=>closeModal(b.dataset.close));
  $$('.neul-modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)closeModal('#'+m.id);}));
}
function openModal(sel){const m=$(sel);if(!m)return;m.hidden=false;document.body.style.overflow='hidden';}
function closeModal(sel){const m=$(sel);if(!m)return;m.hidden=true;document.body.style.overflow='';}

function addArchive(){
  const tabs=$('.region-tabs'); if(!tabs||tabs.querySelector('[data-city="ARCHIVE"]'))return;
  const b=document.createElement('button');b.className='region';b.dataset.city='ARCHIVE';b.textContent='Archive';tabs.appendChild(b);
  b.addEventListener('click',()=>{ $$('.region',tabs).forEach(x=>x.classList.remove('active'));b.classList.add('active');app.state.city='ARCHIVE';app.state.archiveMode=true;app.state.visibleEventLimit=12;app.renderEvents(); });
}
function addSkeleton(){
  const list=$('#eventList'); if(!list||list.children.length)return;
  list.innerHTML=Array.from({length:4},()=>`<div class="event-skeleton"><span></span><div><i></i><i></i><i></i></div></div>`).join('');
}
function addNotificationButton(){
  const actions=$('.top-actions'); if(!actions||$('#notifyBtn'))return;
  const b=document.createElement('button');b.className='round-icon notify-btn';b.id='notifyBtn';b.setAttribute('aria-label','提醒中心');b.innerHTML='♢<span class="notify-badge" id="notifyBadge" hidden>0</span>';actions.insertBefore(b,$('#installAppBtn'));
  b.addEventListener('click',openNotificationCenter); updateBadge();
}
async function updateBadge(){
  const reminders=await idbGet('prefs','reminders',[]); const now=Date.now();const due=reminders.filter(r=>!r.done&&new Date(r.at).getTime()>now).length;
  const el=$('#notifyBadge');if(el){el.textContent=String(due);el.hidden=!due;}
  if('setAppBadge' in navigator){try{due?await navigator.setAppBadge(due):await navigator.clearAppBadge();}catch{}}
}
function urlBase64ToUint8Array(base64String){const padding='='.repeat((4-base64String.length%4)%4);const base64=(base64String+padding).replace(/-/g,'+').replace(/_/g,'/');const raw=atob(base64);return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)));}
async function enablePush(){
  if(!('Notification'in window)||!('serviceWorker'in navigator)) return {ok:false,message:'此瀏覽器不支援通知。'};
  const permission=await Notification.requestPermission(); if(permission!=='granted')return{ok:false,message:'通知權限尚未開啟。'};
  try{
    const cfg=await fetch('/api/push-config',{cache:'no-store'}).then(r=>r.json());
    if(!cfg.enabled) return {ok:true,local:true,message:'已開啟裝置內提醒。背景 Push 需在 Vercel 設定 VAPID 與 Blob 後啟用。'};
    const reg=await navigator.serviceWorker.ready;
    let sub=await reg.pushManager.getSubscription();
    if(!sub) sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(cfg.publicKey)});
    const res=await fetch('/api/push-subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subscription:sub,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'Asia/Taipei',artists:[...app.state.followed]})});
    if(!res.ok)throw new Error('subscribe failed');
    return {ok:true,message:'背景提醒已啟用。Hobby 版採每日摘要；精準售票時間請搭配行事曆提醒。'};
  }catch{return {ok:true,local:true,message:'已開啟裝置內提醒；背景 Push 尚未完成伺服器設定。'};}
}

async function syncPushPreferences(){
  if(!('serviceWorker' in navigator)||!('PushManager' in window)||!app)return;
  try{
    const reg=await navigator.serviceWorker.ready;const sub=await reg.pushManager.getSubscription();if(!sub)return;
    const cfg=await fetch('/api/push-config',{cache:'no-store'}).then(r=>r.json());if(!cfg.enabled)return;
    await fetch('/api/push-subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subscription:sub,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'Asia/Taipei',artists:[...app.state.followed]})});
  }catch{}
}

async function openNotificationCenter(){
  ensureShells();const reminders=await idbGet('prefs','reminders',[]);const next=reminders.filter(r=>!r.done&&new Date(r.at)>new Date()).sort((a,b)=>new Date(a.at)-new Date(b.at)).slice(0,8);
  $('#submissionContent').innerHTML=`<span class="eyebrow">NEUL ALERTS</span><h2>提醒中心</h2><p class="modal-lead">PWA 背景提醒以重大更新與每日摘要為主；售票分鐘級提醒建議加入手機行事曆。</p><button class="pink-pill modal-primary" id="enablePushBtn">開啟通知</button><div class="modal-status" id="pushStatus"></div><section class="modal-section"><h3>我的提醒</h3>${next.length?next.map(r=>`<div class="reminder-row"><b>${esc(r.title)}</b><span>${new Date(r.at).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'})}</span></div>`).join(''):'<p class="muted">目前沒有待提醒項目。</p>'}</section>`;
  openModal('#submissionModal');$('#enablePushBtn').onclick=async()=>{const s=$('#pushStatus');s.textContent='設定中…';const out=await enablePush();s.textContent=out.message;};
}

function eventTime(event){const sessions=(event.sessions||[]).map(s=>new Date(`${String(s.date).replaceAll('/','-')}T${s.time}:00+08:00`)).filter(d=>!Number.isNaN(d.getTime()));if(sessions.length)return sessions.sort((a,b)=>a-b);const d=new Date(event.start||0);return Number.isNaN(d.getTime())?[]:[d];}
function currentOrNextSession(e){const times=eventTime(e),now=Date.now();return times.find(d=>d.getTime()>now-4*3600000)||times[times.length-1]||null;}
function addCalendar(event,kind='show'){
  const target=currentOrNextSession(event);if(!target)return;
  const end=new Date(target.getTime()+3*3600000);const compact=d=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
  const title=`${event.artist} — ${event.title}`; const details=`${event.venue}\n${event.sourceUrl||''}`;
  const ics=`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//NEUL//TW\r\nBEGIN:VEVENT\r\nUID:${event.id}@neul\r\nDTSTAMP:${compact(new Date())}\r\nDTSTART:${compact(target)}\r\nDTEND:${compact(end)}\r\nSUMMARY:${title.replace(/[,;]/g,' ')}\r\nLOCATION:${String(event.venue||'').replace(/[,;]/g,' ')}\r\nDESCRIPTION:${details.replace(/\n/g,'\\n').replace(/[,;]/g,' ')}\r\nEND:VEVENT\r\nEND:VCALENDAR`;
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([ics],{type:'text/calendar'}));a.download=`NEUL-${event.artist.replace(/\W+/g,'-')}.ics`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function googleCalendar(event){const start=currentOrNextSession(event);if(!start)return '#';const end=new Date(start.getTime()+3*3600000);const fmt=d=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');const p=new URLSearchParams({action:'TEMPLATE',text:`${event.artist} — ${event.title}`,dates:`${fmt(start)}/${fmt(end)}`,location:event.venue||'',details:`NEUL 活動提醒\n${event.sourceUrl||''}`});return `https://calendar.google.com/calendar/render?${p}`;}
async function addReminder(event,minutes=30){
  let target=event.generalSale?new Date(event.generalSale):null;if(!target||Number.isNaN(target.getTime())||target.getTime()<=Date.now())target=currentOrNextSession(event);if(!target||Number.isNaN(target.getTime())||target.getTime()<=Date.now())return false;const at=new Date(target.getTime()-minutes*60000);const reminders=await idbGet('prefs','reminders',[]);reminders.push({id:`${event.id}-${minutes}`,eventId:event.id,title:`${event.artist} · ${event.generalSale?'售票':'演出'}前 ${minutes} 分鐘`,at:at.toISOString(),done:false});await idbSet('prefs','reminders',reminders.slice(-50));updateBadge();return true;
}

async function enhanceDetail(){
  if(!app?.state.detailId)return;const root=$('#detailContent');if(!root||root.dataset.enhancedId===app.state.detailId)return;const e=app.getEvent(app.state.detailId);if(!e)return;root.dataset.enhancedId=e.id;
  const source=$('.detail-source',root);if(source){source.insertAdjacentHTML('beforebegin',`<section class="detail-tools"><button class="outline-mini" id="dayModeBtn">${isTodayEvent(e)?'開啟當日模式':'預覽當日模式'}</button><button class="outline-mini" id="appleCalBtn">加入 Apple 行事曆</button><a class="outline-mini calendar-link" id="googleCalBtn" href="${googleCalendar(e)}" target="_blank" rel="noopener noreferrer">Google Calendar</a><button class="outline-mini" id="remind30Btn">下一節點前30分鐘提醒</button></section><section class="detail-section change-log" id="changeLog"><h3>官方資訊更新</h3><div class="change-log-body">檢查變更紀錄…</div></section>`);}
  $('#dayModeBtn',root)?.addEventListener('click',()=>openDayMode(e));
  $('#appleCalBtn',root)?.addEventListener('click',()=>addCalendar(e));
  $('#remind30Btn',root)?.addEventListener('click',async ev=>{const ok=await addReminder(e,30);ev.currentTarget.textContent=ok?'✓ 已建立提醒':'目前無可提醒時間';});
  const changes=await eventChanges(e.id);const body=$('.change-log-body',root);if(body)body.innerHTML=changes.length?changes.map(c=>`<div class="change-row"><span>${fieldName(c.field)}</span><b>${esc(shortValue(c.from))} → ${esc(shortValue(c.to))}</b><small>${new Date(c.at).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'})}</small></div>`).join(''):`<p class="muted">目前沒有偵測到已核對欄位的變更。</p>`;
}
function fieldName(f){return({start:'演出時間',end:'結束／加場',venue:'場館',ticketStatus:'售票狀態',generalSale:'正式售票',price:'票價'})[f]||f;}
function shortValue(v){if(!v)return'未提供';if(/^20\d\d-/.test(String(v))){try{return new Date(v).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'});}catch{}}return String(v).slice(0,80);}
function isTodayEvent(e){const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei'}).format(new Date());return eventTime(e).some(d=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei'}).format(d)===today);}
function openDayMode(e){
  ensureShells();const next=app.nextAction(e);const sessions=e.sessions||[];const timeline=e.ticketTimeline||[];$('#neulDayContent').innerHTML=`<span class="eyebrow">CONCERT DAY</span><h2>${esc(e.artist)}</h2><p class="day-title">${esc(e.title)}</p><div class="day-next"><span>NEXT</span><b>${esc(next.value)}</b></div><div class="day-grid"><div><span>VENUE</span><b>${esc(e.venue)}</b></div><div><span>TIME</span><b>${esc(app.fmtDate(e.start,e.end))}${e.end?' · 多場次':' · '+esc(app.fmtEventTime(e))}</b></div></div>${sessions.length?`<section class="modal-section"><h3>場次</h3>${sessions.map(s=>`<div class="day-row"><b>${esc(s.date)} ${esc(s.time)}</b><span>${esc(s.note||'')}</span></div>`).join('')}</section>`:''}<section class="modal-section"><h3>今天需要確認</h3>${timeline.slice(-4).map(x=>`<div class="day-row"><b>${esc(x.label)}</b><span>${esc(x.time)}</span></div>`).join('')||'<p class="muted">目前沒有額外時程。</p>'}</section><div class="day-actions"><a href="${app.safeUrl(e.sourceUrl)}" target="_blank" rel="noopener noreferrer" class="pink-pill">查看官方最新公告</a>${e.venueModelId?'<button class="outline-mini" id="dayVenueBtn">打開 3D 場館</button>':''}</div><p class="day-disclaimer">現場 Gate、VIP Check-in、Soundcheck、禁帶物等只在官方已有資料時顯示；未公告項目不自行推測。</p>`;
  openModal('#neulDayMode');$('#dayVenueBtn')?.addEventListener('click',()=>{app.setVenue(e.venueModelId,e.venueLayoutId);closeModal('#neulDayMode');app.closeDetail();$('#venue3d').scrollIntoView({behavior:'smooth'});});
}

function addSeatTools(){
  const controls=$('.venue-controls');if(!controls||$('#seatCompareTools'))return;controls.insertAdjacentHTML('beforeend',`<div class="seat-compare-tools" id="seatCompareTools"><button class="outline-mini" id="setSeatA">設為 A</button><button class="outline-mini" id="setSeatB">設為 B</button><button class="pink-mini" id="compareSeats">比較</button><button class="outline-mini" id="submitViewBtn">投稿視角</button></div>`);
  $('#setSeatA').onclick=()=>{compareA=captureSeat();$('#setSeatA').textContent=`A · ${compareA.section}`;};
  $('#setSeatB').onclick=()=>{compareB=captureSeat();$('#setSeatB').textContent=`B · ${compareB.section}`;};
  $('#compareSeats').onclick=()=>openSeatCompare();$('#submitViewBtn').onclick=openSubmission;
}
function captureSeat(){const s=app.state;return{venueId:s.venueId,layoutId:s.layoutId,floor:s.floor,section:String(s.section),row:String(s.row),seatNumber:String(s.seatNumber||''),viewerHeight:Number(s.viewerHeight||160),posture:s.posture||'seated',lens:s.lens||'eye'};}
function seatMetrics(c){
  const sec=app.getVenueSection(c.venueId,c.section,c.layoutId);const pos=app.venueSectionPosition(c.venueId,sec,Number(c.row),c.seatNumber);const layout=app.getVenueLayout(c.layoutId),venue=app.getVenueModel(c.venueId),stage=layout.stage||venue.stage;const target=[stage.main.x,stage.main.y+8,stage.main.z];const dx=target[0]-pos.x,dy=target[1]-pos.y,dz=target[2]-pos.z;const distance=Math.hypot(dx,dy,dz);const norm=Math.hypot(venue.field.x||150,venue.field.z||120)||1;const distanceIndex=Math.round(distance/norm*100);const side=Math.abs(Math.atan2(dx,dz)*180/Math.PI);const warning=app.venueSectionWarning(c.venueId,c.section,c.row,c.layoutId,{heightCm:c.viewerHeight,posture:c.posture,seatNumber:c.seatNumber,lens:c.lens});const price=app.sectionTicketLabel(c.layoutId,c.section)||'依官方票區';return{sec,pos,target,distance,distanceIndex,side,warning,price,venue,layout};
}
function miniSeatSvg(m){const x=50+Math.max(-42,Math.min(42,m.pos.x/(m.venue.field.x||150)*42)),y=55+Math.max(-40,Math.min(40,m.pos.z/(m.venue.field.z||120)*38));return `<svg viewBox="0 0 100 100" class="seat-mini-map" aria-hidden="true"><rect x="31" y="7" width="38" height="10" rx="2"/><ellipse cx="50" cy="56" rx="43" ry="36"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4"/><path d="M${x.toFixed(1)} ${y.toFixed(1)} L50 12"/></svg>`;}
function seatCard(label,c){const m=seatMetrics(c),seat=c.seatNumber?` · ${esc(c.seatNumber)}號`:'';return `<article class="compare-card"><span class="compare-label">${label}</span><h3>${esc(c.section)}區 · ${esc(c.row)}排${seat}</h3>${miniSeatSvg(m)}<dl><div><dt>相對距離</dt><dd><span class="distance-index">${m.distanceIndex}</span> / 模型指數*</dd></div><div><dt>側向角度</dt><dd>約 ${Math.round(m.side)}°*</dd></div><div><dt>觀看條件</dt><dd>${esc(String(c.viewerHeight))}cm · ${c.posture==='standing'?'站':'坐'} · ${esc(({eye:'肉眼',phone1:'1×',phone2:'2×',phone5:'5×'})[c.lens]||'肉眼')}</dd></div><div><dt>票價</dt><dd>${esc(m.price)}</dd></div><div><dt>可信度</dt><dd>${m.layout.eventId?'本場配置':'場館基準'}</dd></div></dl><p>${esc(m.warning.messages[0]||'目前沒有特別視線警示。')}</p></article>`;}
function openSeatCompare(){ensureShells();if(!compareA)compareA=captureSeat();if(!compareB){$('#seatCompareContent').innerHTML='<span class="eyebrow">SEAT COMPARE</span><h2>還差 B 座位</h2><p class="modal-lead">先選另一個區域／排數，再按「設為 B」。</p>';return openModal('#seatCompareModal');}if(compareA.venueId!==compareB.venueId||compareA.layoutId!==compareB.layoutId){$('#seatCompareContent').innerHTML='<span class="eyebrow">SEAT COMPARE</span><h2>請比較同一場配置</h2><p class="modal-lead">A、B 必須屬於同一場館與活動配置，避免把不同舞台的距離混在一起。</p>';return openModal('#seatCompareModal');}$('#seatCompareContent').innerHTML=`<span class="eyebrow">SEAT COMPARE</span><h2>${esc(app.getVenueLayout(compareA.layoutId).label)}</h2><div class="compare-grid">${seatCard('A',compareA)}${seatCard('B',compareB)}</div><p class="compare-foot">* 相對距離是同一重建模型內的比較指數，不是公尺。待場館尺度完成實測校正後才會提供真實距離；角度與視線限制仍以官方本場公告為準。</p>`;openModal('#seatCompareModal');}

function openSubmission(){ensureShells();const c=captureSeat();$('#submissionContent').innerHTML=`<span class="eyebrow">FAN VIEW</span><h2>投稿座位視角</h2><p class="modal-lead">協助下一位粉絲知道這個位置實際看起來如何。</p><form id="viewSubmitForm" class="view-submit-form"><label>場館<input name="venue" value="${esc(app.getVenueModel(c.venueId).name)}" readonly></label><label>活動配置<input name="layout" value="${esc(app.getVenueLayout(c.layoutId).label)}" readonly></label><div class="form-grid"><label>區域<input name="section" value="${esc(c.section)}" required></label><label>排數<input name="row" value="${esc(c.row)}" required></label></div><div class="form-grid"><label>座號<input name="seatNumber" value="${esc(c.seatNumber||'')}" placeholder="選填"></label><label>拍攝倍率<input name="zoom" value="1" inputmode="decimal" placeholder="例 2"></label></div><label>實拍照片<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required></label><label class="rights-check"><input name="rights" type="checkbox" required> 我確認這是本人拍攝或我擁有公開授權，並同意 NEUL 用於座位視角展示。</label><button class="pink-pill modal-primary" type="submit">送出投稿</button><div class="modal-status" id="submissionStatus"></div></form>`;openModal('#submissionModal');$('#viewSubmitForm').onsubmit=submitView;
}
async function submitView(ev){ev.preventDefault();const form=ev.currentTarget,status=$('#submissionStatus'),fd=new FormData(form),file=fd.get('photo');if(!(file instanceof File)||!file.size)return;if(file.size>8*1024*1024){status.textContent='照片請控制在 8 MB 以內。';return;}status.textContent='正在提交…';fd.set('venueId',app.state.venueId);fd.set('layoutId',app.state.layoutId);try{const res=await fetch('/api/submissions',{method:'POST',body:fd});const out=await res.json();if(res.ok){status.textContent='投稿已送出，待審核後才會公開。';form.querySelector('button').disabled=true;return;}throw new Error(out.error||'upload unavailable');}catch{const draft={venueId:app.state.venueId,layoutId:app.state.layoutId,section:fd.get('section'),row:fd.get('row'),seatNumber:fd.get('seatNumber'),zoom:fd.get('zoom'),rights:true,file,createdAt:new Date().toISOString()};await saveSubmissionDraft(draft);status.textContent='目前未連接 Vercel Blob；投稿已安全保存在此裝置草稿，不會自動公開。';}}

function advancedSearchAssist(){
  const input=$('#searchInput'),meta=$('#eventResultMeta'); if(!input||!meta)return;
  const raw=input.value.trim(), q=raw.replace(/[臺台]/g,'台').toLowerCase();
  const venueDefs=[
    ['taipei-dome',['台北大巨蛋','大巨蛋','taipei dome']],
    ['taipei-arena',['台北小巨蛋','小巨蛋','taipei arena']],
    ['ntsu-arena',['林口體育館','林口','ntsu','國立體育大學']],
    ['kaohsiung-arena',['高雄巨蛋','kaohsiung arena']],
    ['taipei-music-center',['台北流行音樂中心','北流','taipei music center']],
    ['ticc',['ticc','台北國際會議中心']],
    ['kaohsiung-music-center',['高雄流行音樂中心','高流','海音館','kaohsiung music center']],
    ['kaohsiung-stadium',['高雄世運','世運主場館','國家體育場']],
    ['taoyuan-arena',['桃園巨蛋','桃園市立綜合體育館']],
    ['ntu-sports-center',['台大綜合體育館','ntu sports center']],
    ['tianmu-gymnasium',['天母體育館','tianmu gymnasium']]
  ];
  const venueMatch=venueDefs.find(([,terms])=>terms.some(x=>q.includes(x.toLowerCase())));
  if(!venueMatch)return;
  const venueId=venueMatch[0], model=app.getVenueModel(venueId);
  const tokens=raw.split(/\s+/).filter(Boolean);
  let matched=null;
  for(const sec of model.sections){
    const labels=[sec.id,sec.label,...(sec.aliases||[])].filter(Boolean).map(x=>String(x).toLowerCase());
    if(tokens.some(t=>labels.some(x=>x===t.toLowerCase().replace(/區$/,'')))){matched=sec;break;}
    if(labels.some(x=>q.includes(x.toLowerCase()))){matched=sec;break;}
  }
  meta.innerHTML=`<button class="search-seat-assist">◉ 直接查看 ${esc(model.name)}${matched?' · '+esc(matched.label||matched.id):''} 座位視角 →</button>`;
  $('.search-seat-assist',meta).onclick=()=>{
    app.setVenue(venueId);
    if(matched){app.state.floor=matched.tier;app.state.section=matched.id;app.updateSeatLabel();}
    $('#venue3d').scrollIntoView({behavior:'smooth',block:'start'});
  };
}
function qualityLabel(){const mem=navigator.deviceMemory||8,small=matchMedia('(max-width:760px)').matches,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;return reduced||mem<=4||small?'AUTO · EFFICIENT':'AUTO · HIGH';}
function addQuality(){const c=$('#venueConfidence');if(c&&!$('#qualityBadge'))c.insertAdjacentHTML('afterend',`<div class="quality-badge" id="qualityBadge">3D QUALITY · ${qualityLabel()}</div>`);}
function addBrandLoader(){if($('#neulLoader'))return;document.body.insertAdjacentHTML('afterbegin','<div class="neul-loader" id="neulLoader"><span>늘</span><i></i></div>');window.addEventListener('load',()=>setTimeout(()=>$('#neulLoader')?.classList.add('done'),260),{once:true});}


function todayEvents(){return (app?.state.events||[]).filter(e=>isTodayEvent(e));}
function maybeDayModeBanner(){
  const old=$('#concertDayBanner'); const events=todayEvents();
  if(!events.length){old?.remove();return;}
  const e=events[0]; if(old){old.querySelector('b').textContent=`TODAY · ${e.artist}`;old.dataset.event=e.id;return;}
  const banner=document.createElement('button');banner.className='concert-day-banner';banner.id='concertDayBanner';banner.dataset.event=e.id;banner.innerHTML=`<span>NEUL LIVE</span><b>TODAY · ${esc(e.artist)}</b><i>當日模式 →</i>`;document.body.appendChild(banner);banner.onclick=()=>{const ev=app.getEvent(banner.dataset.event);if(ev)openDayMode(ev);};
}
function wireMyListTabs(){
  const tabs=$$('.mini-tabs button'); if(tabs.length<2||tabs[0].dataset.wired)return;tabs.forEach(t=>t.dataset.wired='1');
  tabs[0].addEventListener('click',()=>{tabs.forEach(x=>x.classList.remove('active'));tabs[0].classList.add('active');app.renderFollowing();});
  tabs[1].addEventListener('click',()=>{tabs.forEach(x=>x.classList.remove('active'));tabs[1].classList.add('active');const root=$('#artistBubbles');const list=app.state.events.filter(e=>app.state.followed.has(e.artist)&&new Date(e.end||e.start)>new Date()).sort((a,b)=>new Date(a.start)-new Date(b.start)).slice(0,5);root.innerHTML=list.length?list.map(e=>`<button class="my-event-chip" data-event="${esc(e.id)}"><b>${esc(e.artist)}</b><span>${esc(app.fmtDate(e.start,e.end))} · ${esc(e.venue)}</span></button>`).join(''):'<p class="muted">追蹤藝人目前沒有已收錄的近期台灣活動。</p>';$$('.my-event-chip',root).forEach(b=>b.onclick=()=>app.openDetail(b.dataset.event));});
}

function watchDetail(){const root=$('#detailContent');if(!root)return;new MutationObserver(()=>queueMicrotask(enhanceDetail)).observe(root,{childList:true,subtree:false});}
function init(a){app=a;ensureShells();addArchive();addNotificationButton();addSeatTools();addQuality();wireMyListTabs();watchDetail();offlineState();maybeDayModeBanner();window.addEventListener('neul:dataupdated',()=>{maybeDayModeBanner();advancedSearchAssist();});window.addEventListener('online',offlineState);window.addEventListener('offline',offlineState);window.addEventListener('neul:followschanged',()=>syncPushPreferences());$('#searchInput')?.addEventListener('input',()=>setTimeout(advancedSearchAssist,0));setInterval(checkLocalReminders,30000);checkLocalReminders();}
async function checkLocalReminders(){const reminders=await idbGet('prefs','reminders',[]),now=Date.now();let changed=false;for(const r of reminders){const t=new Date(r.at).getTime();if(!r.done&&t<=now&&t>now-10*60000){r.done=true;changed=true;if('Notification' in window && Notification.permission==='granted'){try{const reg=await navigator.serviceWorker.ready;reg.showNotification('NEUL 提醒',{body:r.title,icon:'/icons/icon-192.png',badge:'/icons/icon-192.png',tag:r.id,data:{url:'/'}});}catch{}}} }if(changed){await idbSet('prefs','reminders',reminders);updateBadge();}}

addBrandLoader();addSkeleton();
if(window.NEUL_APP)init(window.NEUL_APP);else window.addEventListener('neul:ready',e=>init(e.detail),{once:true});
