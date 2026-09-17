import * as THREE from 'https://esm.sh/three@0.179.1';
import { OrbitControls } from 'https://esm.sh/three@0.179.1/examples/jsm/controls/OrbitControls.js';
import {analyzeSeatMapPixels,applyVisionToSectionMapping} from './lib/seatmap-vision.mjs';
import {mapOcrLabelsToSections,normalizeOcrBlocks} from './lib/seatmap-labels.mjs';

const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];
const state={events:[],filtered:[],featuredIndex:0,selected:null,section:null,api:null,scene:null,camera:null,renderer:null,controls:null,seatMarker:null,resize:null,resizeObserver:null,venueGeometry:null,theme:localStorage.getItem('neul-theme')||'dark'};
document.documentElement.dataset.theme=state.theme;

function fmtDate(v){if(!v)return'—';return new Intl.DateTimeFormat('zh-TW',{timeZone:'Asia/Taipei',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(v))}
function money(n){return n?`NT$ ${Number(n).toLocaleString('zh-TW')}`:'票價待官方資料'}
function esc(s=''){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function eventStatus(e){const now=Date.now(),start=+new Date(e.dateStart),end=+new Date(e.dateEnd||e.dateStart);if(end<now)return'已結束';if(start<=now&&end>=now)return'進行中';return'即將到來'}
function firstPrice(e){return (e.prices||[])[0]||null}


async function loadVenueGeometry(){
  try{const r=await fetch('/api/venue-geometry');if(r.ok)state.venueGeometry=await r.json()}catch(err){console.warn('Venue Geometry fallback',err)}
}
function venueGeometryFor(e){
  const vs=state.venueGeometry?.venues||{};
  const name=String(e?.venue||'').toLowerCase();
  return Object.values(vs).find(v=>(v.aliases||[]).some(a=>name.includes(String(a).toLowerCase())))||null;
}
function seatCoordinate(e,section,row,seat){
  const vg=venueGeometryFor(e)?.rendering||{},mapping=vg.seatMapping||{};
  const maxRows=Math.max(12,+($('#rowRange')?.max||mapping.rowModel?.defaultRows||30));
  const maxSeats=Math.max(18,+($('#seatRange')?.max||mapping.seatModel?.defaultSeatsPerBlock||40));
  const ang=(section?.angle||0)*Math.PI/180,baseD=section?.distance||42;
  const rowDepth=mapping.rowModel?.rowDepth||.80,seatPitch=mapping.seatModel?.seatPitch||.51;
  const d=baseD+(row-1)*rowDepth,lateral=(seat-(maxSeats+1)/2)*seatPitch;
  const tierIndex=Math.max(0,Math.min((vg.tiers?.length||1)-1,Math.round(baseD/35)-1));
  const tier=vg.tiers?.[tierIndex],baseY=tier?.y??(4.8+tierIndex*6.5),rise=tier?.rowRise??.34;
  return {
    x:Math.sin(ang)*d+Math.cos(ang)*lateral,
    y:baseY+(vg.eyeHeight||1.18)+(row-1)*rise,
    z:Math.cos(ang)*d-Math.sin(ang)*lateral,
    distance:d,tierIndex
  };
}

async function load(){
  await loadVenueGeometry();
  try{const r=await fetch('/api/events',{headers:{accept:'application/json'}});if(!r.ok)throw new Error(`HTTP ${r.status}`);state.api=await r.json();state.events=state.api.events||[];}
  catch(e){console.warn('API fallback',e);const r=await fetch('/data/events.seed.json');state.events=await r.json();state.api={generatedAt:new Date().toISOString(),nextRefreshAt:new Date(Date.now()+21600000).toISOString(),refreshPolicy:'local-seed',sources:[],summary:{events:state.events.length,seatMaps:0,prices:state.events.filter(x=>x.prices?.length).length,sourceErrors:0}};}
  state.filtered=state.events; updateSync(); renderAll(); init3D(); startFeatured();
}
function updateSync(){
  $('#syncState').textContent=state.api?.refreshPolicy==='request-driven-6h-cache'?'6 小時刷新＋每日背景掃描':'離線種子資料';
  $('#lastSync').textContent=fmtDate(state.api?.generatedAt); $('#nextSync').textContent=fmtDate(state.api?.nextRefreshAt);
}
function eventCard(e){
 const sm=e.automation?.seatMapCaptured||e.seatMapImage; const custom=e.verification?.canClaimCustomized; const pc=(e.prices||[]).length>0;
 return `<article class="card event-card" data-id="${esc(e.id)}"><div class="card-cover"></div><div class="card-body"><div class="tags"><span class="tag">${esc(e.artist)}</span><span class="tag ${sm?'good':'warn'}">${sm?'座位圖已抓':'座位圖待抓'}</span><span class="tag ${pc?'good':'warn'}">${pc?'票價已同步':'票價待同步'}</span><span class="tag ${custom?'good':'warn'}">${custom?'3D 可依座位圖重建':'3D 待座位圖校正'}</span></div><div class="event-title">${esc(e.title)}</div><div class="meta">${fmtDate(e.dateStart)} · ${esc(e.venue)}<br>${esc(e.ticketing||'')}</div><div class="price">${firstPrice(e)?`最高 ${money(firstPrice(e))}`:'票價資料持續同步'}</div><div class="card-actions"><button class="btn primary" data-view="${esc(e.id)}">開啟 3D</button><button class="btn" data-info="${esc(e.id)}">資料</button></div></div></article>`;
}
function renderAll(){renderFeatured();renderUpcoming();renderEventSelect();renderSources();bindDynamic()}
function featuredEvents(){const arr=state.filtered.filter(e=>e.featured);return arr.length?arr:state.filtered.slice(0,6)}
function renderFeatured(){const arr=featuredEvents();if(!arr.length){$('#featuredGrid').innerHTML='<div class="meta">沒有符合結果</div>';return}const start=state.featuredIndex%arr.length;const picks=[0,1,2].map(i=>arr[(start+i)%arr.length]).filter(Boolean);$('#featuredGrid').innerHTML=picks.map(eventCard).join('');bindDynamic()}
function renderUpcoming(){const arr=state.filtered.filter(e=>eventStatus(e)!=='已結束').slice(0,5);$('#upcomingGrid').innerHTML=arr.map(eventCard).join('')||'<div class="meta">沒有符合結果</div>';bindDynamic()}
function renderEventSelect(){const prev=state.selected?.id;$('#eventSelect').innerHTML=state.events.map(e=>`<option value="${e.id}">${esc(e.artist)} · ${esc(e.venue)}</option>`).join('');const chosen=state.events.find(e=>e.id===prev)||state.events.find(e=>e.id.includes('bts'))||state.events[0];if(chosen){$('#eventSelect').value=chosen.id;selectEvent(chosen.id)}}
function renderSources(){const sources=state.api?.sources||[];$('#auditSummary').textContent=`${state.api?.summary?.events||state.events.length} 活動 · 自動發現 ${state.api?.summary?.discovered||0} · ${state.api?.summary?.seatMaps||0} 座位圖 · ${state.api?.summary?.prices||0} 有票價`;$('#sourceAudit').innerHTML=sources.map(s=>`<div class="audit-item"><b>${esc(s.name)}</b><small>${esc(s.kind)}<br>${esc(s.url)}</small></div>`).join('')||'<div class="audit-item"><b>正式部署後啟用來源掃描</b><small>本機直接開檔會使用種子資料。</small></div>'}
function bindDynamic(){$$('[data-view]').forEach(b=>b.onclick=()=>{selectEvent(b.dataset.view);closeModal();document.querySelector('#viewer').scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>$('#eventSelect')?.focus({preventScroll:true}),300)});$$('[data-info]').forEach(b=>b.onclick=()=>openInfo(b.dataset.info))}
function filter(q){q=q.trim().toLowerCase();state.filtered=!q?state.events:state.events.filter(e=>`${e.artist} ${e.title} ${e.venue} ${e.city}`.toLowerCase().includes(q));state.featuredIndex=0;renderFeatured();renderUpcoming();const n=state.filtered.length;showToast(n?`找到 ${n} 場活動`:'目前沒有符合的活動，可改用藝人、場館或城市搜尋。');if(n)document.querySelector('#events').scrollIntoView({behavior:'smooth',block:'start'})}

function selectEvent(id){const e=state.events.find(x=>x.id===id);if(!e)return;const previousId=state.selected?.id;state.selected=e;const saved=JSON.parse(localStorage.getItem(`neul-seat-${id}`)||'null');if(previousId!==id){$('#rowRange').value=saved?.row||10;$('#seatRange').value=saved?.seat||12;$('#zoomRange').value=saved?.zoom||0;}$('#eventSelect').value=id;$('#eventStatusLabel').textContent=eventStatus(e);const secs=(e.sections?.length?e.sections:(e.sectionMapping?.sections||[]));$('#sectionSelect').innerHTML=secs.length?secs.map((s,i)=>`<option value="${i}">${esc(s.name)} · ${money(s.price)}</option>`).join(''):'<option value="0">一般視角</option>';$('#sectionCount').textContent=secs.length?`${secs.length} 區`:'未拆票區';state.section=secs[0]||{name:'一般視角',price:firstPrice(e),level:2,angle:0,distance:42};$('#viewEvent').textContent=`${e.artist} · ${e.venue}`;const conf=Math.round((e.sceneTopology?.confidence||0)*100);const sceneLabel=e.verification?.canClaimCustomized?(e.sectionMapping?.status==='ocr-assisted-estimated'?'座位圖 OCR 輔助映射':e.sectionMapping?.status==='vision-assisted-estimated'?'座位圖 Vision 輔助映射':e.sectionMapping?.status==='mapped-estimated'?'座位圖＋票區自動映射':'已依本場座位圖校正'):(e.automation?.seatMapCaptured?'座位圖已取得 · 票區待映射':'3D 待校正');
$('#sceneVersion').textContent=`${sceneLabel} · ${conf}%`; $('#sceneVersion').title=`Scene ${e.sceneVersion||'seed'} / confidence ${conf}%`;detectSeatMapChange(e);updateSeatSummary();rebuildScene();analyzeSeatMapVision(e).then(v=>{if(v&&state.selected?.id===e.id){e.seatMapVision=v;const el=$('#sceneVersion');if(el){el.title+=` / Vision ${Math.round(v.confidence*100)}%`;}}}).catch(()=>{});}
function detectSeatMapChange(e){if(!e.seatMapHash)return;const key=`neul-seatmap-${e.id}`;const old=localStorage.getItem(key);if(old&&old!==e.seatMapHash){showToast('官方座位圖或票價資料有變更，3D 已依新版本重建。')}localStorage.setItem(key,e.seatMapHash)}
function updateSeatSummary(){
  const e=state.selected,s=state.section;if(!e||!s)return;
  const row=+$('#rowRange').value,seat=+$('#seatRange').value;
  localStorage.setItem(`neul-seat-${e.id}`,JSON.stringify({row,seat,zoom:+$('#zoomRange').value,section:$('#sectionSelect').value}));
  const c=seatCoordinate(e,s,row,seat);
  $('#rowVal').textContent=`${row} 排`;$('#seatVal').textContent=`${seat} 號`;
  $('#seatName').textContent=`${s.name} · ${row}排 ${seat}號`;$('#seatPrice').textContent=money(s.price);
  const mapLabel=s.mappingConfidence==='ocr-assisted'?'座位圖文字輔助':s.mappingConfidence==='vision-assisted'?'座位圖視覺輔助':s.mappingConfidence==='calibrated'?'已校正':'推估定位';
  $('#seatMeta').textContent=`舞台：${labelStage(e.stageType)} · 模擬距離約 ${Math.round(c.distance)} m · ${mapLabel}`;
  $('#viewSeat').textContent=`${s.name} ${row}排${seat}號`;$('#viewDistance').textContent=`約 ${Math.round(c.distance)} m`;
  const warn=s.obstructed||e.obstructed;
  $('#seatWarn').innerHTML=warn?`<div class="notice warn">⚠ 此區有官方視線受限／遮蔽提醒。3D 會保留舞台硬體與角度限制，但仍以現場架設為準。</div>`:`<div class="notice good">此區目前沒有抓到官方視線遮蔽警示；仍建議開啟官方座位圖交叉確認。</div>`;
  updateSeatCamera()
}
function labelStage(t){return({'center':'中央舞台','center-extended':'中央＋延伸舞台','end':'端景舞台','end-extended':'端景＋延伸舞台'}[t]||'依官方資訊重建')}

function init3D(){const host=$('#viewerCanvas');if(state.renderer)return;state.scene=new THREE.Scene();state.scene.background=new THREE.Color(0x05070d);state.camera=new THREE.PerspectiveCamera(58,host.clientWidth/host.clientHeight,.1,1000);state.camera.position.set(0,26,68);state.renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});const compact=matchMedia('(max-width:680px),(pointer:coarse)').matches;state.renderer.setPixelRatio(Math.min(devicePixelRatio,compact?1.2:1.75));state.renderer.setSize(host.clientWidth,host.clientHeight);state.renderer.shadowMap.enabled=true;host.appendChild(state.renderer.domElement);state.controls=new OrbitControls(state.camera,state.renderer.domElement);state.controls.enableDamping=true;state.controls.enablePan=false;state.controls.rotateSpeed=.7;state.controls.zoomSpeed=.8;state.controls.target.set(0,8,0);const loop=()=>{requestAnimationFrame(loop);state.controls.update();state.renderer.render(state.scene,state.camera)};loop();state.resize=()=>{const w=host.clientWidth,h=host.clientHeight;state.camera.aspect=w/h;state.camera.updateProjectionMatrix();state.renderer.setSize(w,h)};window.addEventListener('resize',state.resize,{passive:true});state.resizeObserver=new ResizeObserver(()=>state.resize());state.resizeObserver.observe(host);window.addEventListener('orientationchange',()=>setTimeout(state.resize,180),{passive:true});rebuildScene()}
function clearScene(){while(state.scene.children.length){const o=state.scene.children[0];state.scene.remove(o);o.geometry?.dispose?.();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose?.())}}}
function rebuildScene(){if(!state.scene||!state.selected)return;clearScene();const e=state.selected;const ambient=new THREE.HemisphereLight(0x6677aa,0x050508,1.35);state.scene.add(ambient);const key=new THREE.DirectionalLight(0xffffff,1.9);key.position.set(-20,45,20);key.castShadow=true;state.scene.add(key);const floor=new THREE.Mesh(new THREE.PlaneGeometry(180,150),new THREE.MeshStandardMaterial({color:0x0b0d14,roughness:.82,metalness:.1}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;state.scene.add(floor);buildStage(e);buildArena(e);buildTicketZones(e);buildCrowd();buildRig();buildSeatMarker();updateSeatCamera()}
function buildStage(e){const spec=e.sceneSpec?.geometry;const group=new THREE.Group();const mat=new THREE.MeshStandardMaterial({color:0x252a36,metalness:.65,roughness:.28});const glow=new THREE.MeshStandardMaterial({color:0x725dff,emissive:0x4d3bd4,emissiveIntensity:1.45,roughness:.25});const center=(spec?.layout||((e.stageType||'').startsWith('center')?'center':'end'))==='center';const main=spec?.mainStage;if(center){const radius=(main?.width||20)/2;const st=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,1.4,8),mat);st.position.set(0,.7,main?.z||0);group.add(st);const ring=new THREE.Mesh(new THREE.TorusGeometry(radius+5,.35,10,64),glow);ring.rotation.x=Math.PI/2;ring.position.y=1.1;group.add(ring)}else{const st=new THREE.Mesh(new THREE.BoxGeometry(main?.width||34,2,main?.depth||16),mat);st.position.set(0,1,main?.z??-35);group.add(st)}if(spec?.runway?.enabled||(e.stageType||'').includes('extended')){const rw=spec?.runway||{width:7,length:34,z:-13};const r=new THREE.Mesh(new THREE.BoxGeometry(rw.width||7,1,rw.length||34),mat);r.position.set(0,.5,rw.z??-13);group.add(r)}if(spec?.satellite?.enabled){const sat=spec.satellite;const b=new THREE.Mesh(new THREE.CylinderGeometry(sat.radius||8,sat.radius||8,1,32),mat);b.position.set(0,.5,sat.z??5);group.add(b)}if(spec?.screen?.enabled!==false&&!center){const sc=spec?.screen||{width:27,height:12,z:-42.8};const led=new THREE.Mesh(new THREE.PlaneGeometry(sc.width||27,sc.height||12),new THREE.MeshBasicMaterial({color:0x755fff}));led.position.set(0,11,sc.z??-42.8);group.add(led)}state.scene.add(group);buildSectionGeometry(e)}
function buildSectionGeometry(e){
  const sections=(e.sections?.length?e.sections:(e.sectionMapping?.sections?.length?e.sectionMapping.sections:(e.sceneSpec?.geometry?.sections||[])));
  for(const [i,s] of sections.entries()){
    const angle=(s.angle||0)*Math.PI/180,dist=s.distance||42,level=s.level||1;
    const x=Math.sin(angle)*dist,z=Math.cos(angle)*dist,width=Math.max(5,11-level);
    const geo=new THREE.BoxGeometry(width,.35,5.5);
    const color=s.mappingConfidence==='vision-assisted'?0x4a3f72:(s.obstructed?0x6f4455:0x30384b);
    const material=new THREE.MeshStandardMaterial({color,roughness:.72,transparent:true,opacity:.88});
    const m=new THREE.Mesh(geo,material);m.position.set(x,2+level*5,z);m.rotation.y=-angle;m.userData={sectionIndex:i};state.scene.add(m)
  }
}
function buildArena(e){const centerStage=(e.stageType||'').startsWith('center');const colors=[0x262c3b,0x202636,0x1a2130];for(let tier=0;tier<3;tier++){const radius=36+tier*12, y=4+tier*7;const rows=3;for(let r=0;r<rows;r++){const rr=radius+r*2.5;const geo=new THREE.RingGeometry(rr,rr+1.8,96,1,centerStage?0:Math.PI*.15,centerStage?Math.PI*2:Math.PI*1.7);const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:colors[tier],roughness:.75,side:THREE.DoubleSide}));mesh.rotation.x=-Math.PI/2;mesh.position.y=y+r*1.2;mesh.scale.set(1,1,.78);state.scene.add(mesh)}}}
function buildTicketZones(e){const zones=e.sceneTopology?.zones||[];for(const z of zones){const a=(z.angle||0)*Math.PI/180,d=z.distance||42,x=Math.sin(a)*d,zz=Math.cos(a)*d;const geo=new THREE.BoxGeometry(7,0.22,5);const mat=new THREE.MeshStandardMaterial({color:z.obstructed?0x6a394b:0x38305f,transparent:true,opacity:.62});const m=new THREE.Mesh(geo,mat);m.position.set(x,.16,zz);m.rotation.y=a;state.scene.add(m)}}
function buildCrowd(){const count=matchMedia('(max-width:680px),(pointer:coarse)').matches?650:1200;const g=new THREE.BufferGeometry();const pos=new Float32Array(count*3);for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,r=18+Math.random()*52;pos[i*3]=Math.cos(a)*r;pos[i*3+1]=.7+Math.random()*12;pos[i*3+2]=Math.sin(a)*r*.8}g.setAttribute('position',new THREE.BufferAttribute(pos,3));const p=new THREE.Points(g,new THREE.PointsMaterial({color:0xffb9f2,size:.12,transparent:true,opacity:.85}));state.scene.add(p)}
function buildRig(){for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const light=new THREE.SpotLight(i%2?0x7c66ff:0x62dcff,16,95,Math.PI/12,.45,1.8);light.position.set(Math.cos(a)*26,26,Math.sin(a)*24);light.target.position.set(0,0,0);state.scene.add(light,light.target)}}
function buildSeatMarker(){const g=new THREE.SphereGeometry(.7,16,16);const m=new THREE.MeshStandardMaterial({color:0xff6fb2,emissive:0x7f2454,emissiveIntensity:1});state.seatMarker=new THREE.Mesh(g,m);state.scene.add(state.seatMarker)}
function updateSeatCamera(){
  if(!state.camera||!state.section||!state.selected)return;
  const row=+$('#rowRange').value||10,seat=+$('#seatRange').value||12,c=seatCoordinate(state.selected,state.section,row,seat);
  state.seatMarker?.position.set(c.x,c.y-.65,c.z);
  const zooms=[58,48,39,30,22],fov=zooms[+$('#zoomRange').value||0];state.camera.fov=fov;state.camera.updateProjectionMatrix();
  state.camera.position.set(c.x,c.y,c.z);
  const center=(state.selected.stageType||'').startsWith('center');
  state.controls?.target.set(0,center?3.2:6.3,center?0:-34);state.controls?.update();
  $('#zoomVal').textContent=['1.0×','1.5×','2×','3×','5×'][+$('#zoomRange').value||0]
}
function openModal(){document.body.classList.add('modal-lock');$('#modal').classList.add('open')}
function closeModal(){document.body.classList.remove('modal-lock');$('#modal').classList.remove('open')}
function openInfo(id){const e=state.events.find(x=>x.id===id);if(!e)return;$('#modalTitle').textContent=e.title;$('#modalSub').textContent=`${e.venue} · ${e.ticketing||''}`;const checks=e.sourceChecks||[];$('#modalContent').innerHTML=`<div class="notice ${e.automation?.seatMapCaptured?'good':'warn'}">${e.automation?.seatMapCaptured?'已抓到官方活動頁中的座位／票區圖候選，會產生 Scene Hash。':'目前未抓到可辨識的座位圖；不會假裝有官方座位圖，3D 先用場館與已知舞台配置。'}</div><div class="seatmap-wrap ${e.seatMapImage?'':'empty'}">${e.seatMapImage?`<img class="seatmap" src="${esc(e.seatMapImage)}" alt="${esc(e.artist)} 官方座位圖" loading="lazy">`:'尚無可直接顯示的官方座位圖'}</div><div class="source-links"><b>來源</b><a href="${esc(e.sourceUrl)}" target="_blank" rel="noopener">${esc(e.sourceUrl)}</a>${e.secondarySourceUrl?`<a href="${esc(e.secondarySourceUrl)}" target="_blank" rel="noopener">${esc(e.secondarySourceUrl)}</a>`:''}</div><details class="tech-details"><summary>資料與校正資訊</summary><div class="debug">Section mapping: ${esc(JSON.stringify(e.sectionMapping||{},null,2))}</div><div class="debug">SeatMap Vision: ${esc(JSON.stringify(e.seatMapVision||e.seatMapVisualMapping||{},null,2))}</div><div class="debug">SeatMap OCR: ${esc(JSON.stringify(e.seatMapOCR||{},null,2))}</div><div class="debug">Scene topology: ${esc(JSON.stringify(e.sceneTopology||{},null,2))}</div>${checks.length?`<div class="debug">${esc(JSON.stringify(checks,null,2))}</div>`:''}</details>`;openModal()}
function showToast(msg){const t=document.createElement('div');t.className='overlay-pill';t.style.cssText='position:fixed;right:18px;bottom:18px;z-index:120;background:#151827;padding:13px 16px;max-width:360px;box-shadow:0 18px 60px rgba(0,0,0,.35)';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),4600)}
function startFeatured(){setInterval(()=>{const arr=featuredEvents();if(arr.length>1){state.featuredIndex=(state.featuredIndex+1)%arr.length;renderFeatured()}},10000)}

$('#themeBtn').onclick=()=>{state.theme=state.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=state.theme;localStorage.setItem('neul-theme',state.theme)};
$('#settingsBtn').onclick=()=>showToast('設定：黑／白模式已可切換；語言與提醒功能保留為獨立模組。');
$('#searchBtn').onclick=()=>filter($('#heroSearch').value);$('#heroSearch').addEventListener('keydown',e=>{if(e.key==='Enter')filter(e.target.value)});$$('[data-q]').forEach(b=>b.onclick=()=>{ $('#heroSearch').value=b.dataset.q;filter(b.dataset.q)});
$('#prevFeatured').onclick=()=>{const n=featuredEvents().length||1;state.featuredIndex=(state.featuredIndex-1+n)%n;renderFeatured()};$('#nextFeatured').onclick=()=>{const n=featuredEvents().length||1;state.featuredIndex=(state.featuredIndex+1)%n;renderFeatured()};
$('#moreBtn').onclick=()=>{$('#modalTitle').textContent='Upcoming 全部活動';$('#modalSub').textContent='可直接選擇活動開啟 3D';$('#modalContent').innerHTML=`<div class="grid">${state.events.filter(e=>eventStatus(e)!=='已結束').map(eventCard).join('')}</div>`;openModal();bindDynamic()};
$('#eventSelect').onchange=e=>selectEvent(e.target.value);$('#sectionSelect').onchange=e=>{const secs=(state.selected?.sections?.length?state.selected.sections:(state.selected?.sectionMapping?.sections||[]));state.section=secs[+e.target.value]||state.section;updateSeatSummary()};['#rowRange','#seatRange','#zoomRange'].forEach(s=>$(s).oninput=updateSeatSummary);$('#resetCameraBtn').onclick=updateSeatCamera;$('#seatMapBtn').onclick=()=>openInfo(state.selected?.id);
$('#modalClose').onclick=closeModal;$('#modal').addEventListener('click',e=>{if(e.target===$('#modal'))closeModal()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#modal').classList.contains('open'))closeModal()});
load();


let neulTesseractPromise=null;
async function loadTesseractLazy(){
  if(neulTesseractPromise)return neulTesseractPromise;
  neulTesseractPromise=new Promise((resolve,reject)=>{
    const existing=window.Tesseract;if(existing)return resolve(existing);
    const script=document.createElement('script');
    script.src='https://cdn.jsdelivr.net/npm/tesseract.js@6/dist/tesseract.min.js';
    script.async=true;script.onload=()=>resolve(window.Tesseract);script.onerror=()=>reject(new Error('OCR library unavailable'));
    document.head.appendChild(script);
  });
  return neulTesseractPromise;
}
async function detectSeatMapLabels(canvas){
  const width=canvas.width,height=canvas.height;
  // Prefer native Shape Detection API when available.
  if('TextDetector' in window){
    try{
      const detector=new TextDetector();
      const blocks=await detector.detect(canvas);
      return {engine:'TextDetector',labels:normalizeOcrBlocks(blocks,width,height),model:'native'};
    }catch(_){}
  }
  // Fallback is lazy and only invoked after color mapping cannot help.
  const T=await loadTesseractLazy();
  if(!T?.recognize)throw new Error('OCR engine unavailable');
  const out=await T.recognize(canvas,'eng+chi_tra',{logger:()=>{}});
  const words=out?.data?.words||[];
  const labels=normalizeOcrBlocks(words.map(w=>({text:w.text,confidence:(w.confidence??0)/100,bbox:w.bbox})),width,height)
    .filter(x=>x.confidence>=.46&&x.text.length<=18);
  return {engine:'tesseract.js',labels,model:'eng+chi_tra'};
}
async function analyzeSeatMapLabels(e,canvas){
  const base=(e.sections?.length?e.sections:(e.sectionMapping?.sections||[]));
  if(!base.length||e.sections?.length)return null;
  $('#sceneVersion').textContent='座位圖文字辨識中…';
  try{
    const result=await Promise.race([
      detectSeatMapLabels(canvas),
      new Promise((_,reject)=>setTimeout(()=>reject(new Error('OCR timeout')),16000))
    ]);
    const mapped=mapOcrLabelsToSections(result.labels,base,e.stageType);
    e.seatMapOCR={engine:result.engine,model:result.model,labelCount:result.labels.length,labels:result.labels.slice(0,48),mapping:mapped};
    if(mapped.applied){
      e.sectionMapping={...(e.sectionMapping||{}),status:'ocr-assisted-estimated',
        confidence:Math.max(e.sectionMapping?.confidence||0,mapped.confidence),
        source:'seatmap-ocr+ticket-text',sections:mapped.sections,ocrMatches:mapped.matches};
      e.automation={...(e.automation||{}),sectionOCRMapped:true,sectionConfidence:e.sectionMapping.confidence};
      if(e.sceneSpec?.geometry)e.sceneSpec.geometry.sections=mapped.sections.map((x,i)=>({id:`section-${i}`,...x}));
      const current=+($('#sectionSelect')?.value||0);
      $('#sectionSelect').innerHTML=mapped.sections.map((sec,i)=>`<option value="${i}">${esc(sec.name)} · ${money(sec.price)}</option>`).join('');
      $('#sectionSelect').value=String(Math.min(current,mapped.sections.length-1));
      state.section=mapped.sections[+$('#sectionSelect').value]||mapped.sections[0];
      $('#sceneVersion').textContent=`座位圖 OCR 輔助映射 · ${Math.round(mapped.confidence*100)}%`;
      $('#sceneVersion').title=`OCR ${result.engine} / labels ${result.labels.length} / matches ${mapped.matches.length}`;
      updateSeatSummary();rebuildScene();
    }else{
      $('#sceneVersion').textContent=`座位圖已解析 · 標籤待校正`;
      $('#sceneVersion').title=`OCR ${result.engine} / labels ${result.labels.length} / 未達自動套用門檻`;
    }
    return e.seatMapOCR;
  }catch(err){
    e.seatMapOCR={error:String(err?.message||err),mapping:{applied:false}};
    $('#sceneVersion').textContent='座位圖已取得 · 標籤待校正';
    return e.seatMapOCR;
  }
}

// v0.51 SeatMap Vision: color-region analysis + conservative Section Mapping assist.
async function analyzeSeatMapVision(e){
  if(!e?.seatMapImage)return null;
  const cacheKey=`neul-vision-${e.seatMapHash||e.seatMapImage}`;
  try{const cached=JSON.parse(localStorage.getItem(cacheKey)||'null');if(cached?.schema==='neul.seatmap.vision.v2')return applySeatMapVision(e,cached)}catch(_){}
  const img=new Image();img.decoding='async';img.src='/api/seatmap-image?url='+encodeURIComponent(e.seatMapImage);
  await img.decode();
  const max=180,scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
  const w=Math.max(24,Math.round(img.naturalWidth*scale)),h=Math.max(24,Math.round(img.naturalHeight*scale));
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,w,h);
  const im=ctx.getImageData(0,0,w,h),vision=analyzeSeatMapPixels(im.data,w,h);
  e._seatMapCanvas=canvas;
  vision.sourceWidth=img.naturalWidth;vision.sourceHeight=img.naturalHeight;
  try{localStorage.setItem(cacheKey,JSON.stringify(vision))}catch(_){}
  return applySeatMapVision(e,vision);
}
function applySeatMapVision(e,vision){
  e.seatMapVision=vision;
  const original=(e.sections?.length?e.sections:(e.sectionMapping?.sections||[]));
  // Curated geometry remains authoritative. Vision is diagnostic only.
  if(e.sections?.length){
    e.seatMapVisualMapping={applied:false,reason:'curated-sections-authoritative',confidence:vision.confidence,matches:[]};
    return vision;
  }
  const mapped=applyVisionToSectionMapping(original,vision,e.stageType);
  e.seatMapVisualMapping=mapped;
  if(mapped.applied){
    e.sectionMapping={...(e.sectionMapping||{}),status:'vision-assisted-estimated',
      confidence:Math.max(e.sectionMapping?.confidence||0,mapped.confidence),
      source:'seatmap-color+ticket-text',sections:mapped.sections,visualMatches:mapped.matches};
    if(e.sceneSpec?.geometry)e.sceneSpec.geometry.sections=mapped.sections.map((x,i)=>({
      id:`section-${i}`,...x
    }));
    e.automation={...(e.automation||{}),sectionVisionMapped:true,sectionConfidence:e.sectionMapping.confidence};
    const current=+($('#sectionSelect')?.value||0);
    $('#sectionSelect').innerHTML=mapped.sections.map((sec,i)=>`<option value="${i}">${esc(sec.name)} · ${money(sec.price)}</option>`).join('');
    $('#sectionSelect').value=String(Math.min(current,mapped.sections.length-1));
    state.section=mapped.sections[+$('#sectionSelect').value]||mapped.sections[0];
    $('#sceneVersion').textContent=`座位圖 Vision 輔助映射 · ${Math.round(mapped.confidence*100)}%`;
    $('#sceneVersion').title=`Scene ${e.sceneVersion||'seed'} / SeatMap Vision ${Math.round(vision.confidence*100)}% / mapped ${mapped.matches.length}`;
    updateSeatSummary();rebuildScene();
  }else{
    const el=$('#sceneVersion');if(el)el.title+=` / Vision ${Math.round(vision.confidence*100)}% / 未達自動套用門檻`;
    const run=()=>e._seatMapCanvas&&analyzeSeatMapLabels(e,e._seatMapCanvas);
    if('requestIdleCallback' in window)requestIdleCallback(run,{timeout:1800});else setTimeout(run,700);
  }
  return vision;
}
