const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const FALLBACK=[
{id:'izna-2026-taipei',artist:'izna',title:'2026 izna Concert Tour: WHO DAT GIRL? in TAIPEI',date:'2026-10-09',time:'18:00',venue:'Zepp New Taipei',city:'新北',ticketUrl:'https://tixcraft.com/activity/detail/26_izna',prices:[4280,3880,3580,2140],source:'Tixcraft',seatMapMode:'standing+2f',featured:true},
{id:'ive-2026-taipei',artist:'IVE',title:'IVE WORLD TOUR ＜SHOW WHAT I AM＞ IN TAIPEI',date:'2026-09-11',endDate:'2026-09-13',venue:'臺北小巨蛋',city:'台北',ticketUrl:'https://tixcraft.com/activity/detail/26_ive',prices:[],source:'Tixcraft',seatMapMode:'arena-seated',featured:false}
];
let events=[],filter='upcoming',active=null,featureIndex=0,scene,camera,renderer,root,raf,sourceState=[],selectedSeat={section:'',row:1,seat:1};
const hydrated=new Map(),loadingDetail=new Set();
function today(){return new Date().toISOString().slice(0,10)}
function normalize(list){return list.map(e=>({...e,status:(e.endDate||e.date)<today()?'archive':'upcoming'}))}
async function load(){
  try{const r=await fetch('/api/events');if(!r.ok)throw 0;const d=await r.json();events=normalize(d.events||[]);sourceState=d.sources||[]}
  catch{try{events=normalize(await (await fetch('data/events.json')).json())}catch{events=normalize(FALLBACK)}}
  renderAll();init3D();
}
function renderAll(){renderList();renderArchive();renderFeatured();renderUpcoming()}
function filtered(){return events.filter(e=>e.status===filter)}
function renderList(q=''){
  let rows=filtered();if(q){q=q.toLowerCase();rows=rows.filter(e=>JSON.stringify(e).toLowerCase().includes(q))}
  $('#eventList').innerHTML=rows.map(e=>`<div class="eventItem ${active?.id===e.id?'active':''}" data-id="${e.id}"><b>${esc(e.artist||'Live')}</b><span>${esc(e.title)}</span><div class="meta">${e.date}${e.endDate?' – '+e.endDate:''} · ${esc(e.venue||'場館待解析')}</div>${e.liveDiscovered?'<span class="liveDot">LIVE SOURCE</span>':''}</div>`).join('')||'<div class="meta">目前沒有符合資料</div>';
  $$('.eventItem').forEach(x=>x.onclick=()=>selectEvent(x.dataset.id));if(!active&&rows[0])selectEvent(rows[0].id)
}
async function selectEvent(id){
  active=events.find(e=>e.id===id)||active;renderList($('#searchInput').value.trim());renderInfo();if(scene)buildScene(active);
  if(active?.ticketUrl&&!hydrated.has(active.ticketUrl)&&!loadingDetail.has(active.ticketUrl)) hydrate(active);
}
async function hydrate(base){
  loadingDetail.add(base.ticketUrl); renderInfo(true);
  try{
    const r=await fetch('/api/event-detail?url='+encodeURIComponent(base.ticketUrl)); if(!r.ok)throw new Error('detail fetch failed');
    const d=await r.json(); if(!d.ok)throw new Error(d.error||'detail error');
    let e={...base,...d.event,status:base.status,featured:base.featured}; hydrated.set(base.ticketUrl,e); replaceEvent(e);
    if(active?.id===base.id){active=e;renderInfo();buildScene(e)}
    if(e.automation?.ocrEligible && (!e.sections?.length || e.qa?.score<80)) runOcr(e);
  }catch(err){if(active?.id===base.id)renderInfo(false,String(err.message||err))}
  finally{loadingDetail.delete(base.ticketUrl)}
}
async function runOcr(e){
  const img=(e.seatMapCandidates||[]).find(x=>/\.(png|jpe?g|webp)(\?|$)/i.test(x.src||'')); if(!img)return;
  try{
    const r=await fetch('/api/seat-ocr?url='+encodeURIComponent(img.src)); const d=await r.json(); if(!d.ok||!d.sectionTokens?.length)return;
    const merged=[...new Set([...(e.sections||[]),...d.sectionTokens])]; e={...e,sections:merged,ocr:{ok:true,confidence:d.confidence,tokens:d.sectionTokens}}; e.threeD=clientSchema(e); e.qa={...(e.qa||{}),score:Math.min(100,(e.qa?.score||50)+12),level:'high'}; hydrated.set(e.ticketUrl,e);replaceEvent(e);if(active?.id===e.id){active=e;renderInfo();buildScene(e)}
  }catch{}
}
function replaceEvent(e){const i=events.findIndex(x=>x.id===e.id);if(i>=0)events[i]=e;renderFeatured();renderArchive();renderUpcoming()}
function renderInfo(loading=false,error=''){
  if(!active)return;const prices=(active.prices||[]).map(p=>`<span class="price">NT$ ${Number(p).toLocaleString()}</span>`).join('')||'<span class="meta">尚未取得票價</span>';
  const qa=active.qa; const auto=active.automation; const schema=active.threeD; const precision=schema?.precision; const venue=schema?.venue;
  const checks=auto?[
    ['活動',auto.discovered],['詳情',auto.detailParsed],['座位圖',auto.seatMapFound],['Section',auto.sectionMapped],['OCR',active.ocr?.ok||auto.ocrEligible],['3D',auto.generated3D]
  ]:[];
  const sections=schema?.sections||[]; if(sections.length&&!selectedSeat.section)selectedSeat.section=sections[0].label;
  const current=sections.find(x=>x.label===selectedSeat.section)||sections[0];
  const ptxt=v=>v==='source-derived'?'來源辨識':v==='venue-zone'?'場館分區':v==='official-basic-pattern'?'官方基本圖':v==='venue-tier+empirical-risk'?'官方骨架＋實拍風險':v==='estimated'?'推估':v==='event-derived'||v==='event-layout-derived'?'活動資料':'模型';
  const precisionText=precision?`區域 ${ptxt(precision.section)} · 排數 ${ptxt(precision.row)} · 座號 ${ptxt(precision.seat)} · 舞台 ${ptxt(precision.stage)}`:'';
  const calText=venue?.calibrationConfidence?`${venue.calibrationConfidence==='official'?'官方場館校正':venue.calibrationConfidence==='official-skeleton'||venue.calibrationConfidence==='official-skeleton+empirical'?'官方骨架＋活動配置':'場館模型'}`:'';
  const rowMax=current?.lastRow||current?.rowCount||20; const rowLabels=current?.rowLabels||[]; const rowControl=rowLabels.length?`<select id="rowInput">${rowLabels.map((r,i)=>`<option value="${i+1}" ${selectedSeat.row===i+1?'selected':''}>${esc(r)}</option>`).join('')}</select>`:`<input id="rowInput" type="number" min="1" max="${rowMax}" value="${Math.min(selectedSeat.row,rowMax)}">`;
  const seatUI=sections.length?`<div class="seatPick"><label>區域<select id="sectionSelect">${sections.map(x=>`<option value="${esc(x.label)}" ${x.label===current?.label?'selected':''}>${esc(x.label)} · ${esc(x.tierName||'')}</option>`).join('')}</select></label><label>排${rowControl}</label><label>號<input id="seatInput" type="number" min="1" max="${current?.seatEnd||30}" value="${Math.min(selectedSeat.seat,current?.seatEnd||30)}"></label><button class="primary compact" id="seatViewBtn">切到此視角</button></div>`:'';
  const row=current?.rowMetric?.find(x=>x.row===Math.max(1,+selectedSeat.row||1)); const baseSight=current?.sightline; const empirical=row?.risk;
  const sight=baseSight?`<div class="sightGrid"><span>約距舞台<b>${baseSight.distanceM} m</b></span><span>側視角<b>${baseSight.viewAngleDeg}°</b></span><span>遮擋風險<b>${empirical?.risk==='high'?'高':empirical?.risk==='medium'?'中':baseSight.obstructionRisk==='low'?'低':baseSight.obstructionRisk==='medium'?'中':'高'}</b></span></div>${empirical?`<div class="viewRisk"><b>實拍經驗提示：</b>${esc(empirical.note)} <a target="_blank" rel="noopener" href="${safeUrl(empirical.source||venue?.empiricalSource||'')}">來源 ↗</a></div>`:''}`:'';
  const sourceLinks=[venue?.calibrationSource?`<a target="_blank" rel="noopener" href="${safeUrl(venue.calibrationSource)}">官方場館資料 ↗</a>`:'',venue?.empiricalSource?`<a target="_blank" rel="noopener" href="${safeUrl(venue.empiricalSource)}">實際視野資料 ↗</a>`:''].filter(Boolean).join(' · ');
  $('#info').innerHTML=`<span class="badge">${active.status==='archive'?'Archive':'Upcoming'}</span><h3>${esc(active.artist||'Live')}</h3><div class="stat"><span>活動</span><b>${esc(active.title)}</b></div><div class="stat"><span>日期</span><b>${active.date}${active.endDate?' – '+active.endDate:''} ${active.time||''}</b></div><div class="stat"><span>場館</span><b>${esc(active.venue||'解析中')}</b></div><div class="stat"><span>票價</span><div class="priceGrid">${prices}</div></div><div class="stat"><span>來源</span>${active.ticketUrl?`<a class="source" target="_blank" rel="noopener" href="${safeUrl(active.ticketUrl)}">${esc(active.source||'官方來源')} ↗</a>`:`<b>${esc(active.source||'—')}</b>`}</div>${checks.length?`<div class="pipeline">${checks.map(([n,ok])=>`<span class="pipe ${ok?'ok':'wait'}">${ok?'✓':'·'} ${n}</span>`).join('')}</div>`:''}${seatUI}${sight}<div class="quality">${loading?'正在解析官方活動頁與座位圖…':error?'自動詳情解析暫時失敗，保留場館模型。':qa?`QA ${qa.score}/100 · ${qa.level.toUpperCase()} · ${auto?.publishMode==='custom-3d'?'已生成活動客製 3D':'低信心，使用場館基礎模型'}`:'點選活動後會自動抓官方詳情並產生客製 3D。'}${calText?`<br>場館校正：${calText}`:''}${precisionText?`<br>精度：${precisionText}`:''}${schema?.layout?`<br>舞台模式：${schema.layout==='center'?'中央/360°':schema.layout==='thrust'?'延伸舞台':'端舞台'}`:''}${active.sections?.length?`<br>辨識區域：${active.sections.slice(0,12).map(esc).join('、')}${active.sections.length>12?'…':''}`:''}${sourceLinks?`<br>${sourceLinks}`:''}${venue?.calibrationNotes?`<br><span class="modelNote">${esc(venue.calibrationNotes)}</span>`:''}</div>`;
  bindSeatControls(current);
}
function bindSeatControls(current){
  const ss=$('#sectionSelect'),ri=$('#rowInput'),si=$('#seatInput'),btn=$('#seatViewBtn'); if(!ss)return;
  ss.onchange=()=>{selectedSeat.section=ss.value;selectedSeat.row=1;selectedSeat.seat=1;renderInfo()};
  ri.onchange=()=>{selectedSeat.row=Math.max(1,+ri.value||1);renderInfo()}; si.onchange=()=>selectedSeat.seat=Math.max(1,+si.value||1);
  btn.onclick=()=>{selectedSeat={section:ss.value,row:Math.max(1,+ri.value||1),seat:Math.max(1,+si.value||1)};focusSeat(selectedSeat);buildScene(active)};
}
function focusSeat(sel){
  const schema=active?.threeD||clientSchema(active||{}); const s=(schema.sections||[]).find(x=>x.label===sel.section)||schema.sections?.[0]; if(!s||!camera)return;
  const rows=Math.max(1,s.rowCount||10), r=Math.min(rows,Math.max(1,sel.row||1)); const metric=s.rowMetric?.find(x=>x.row===r); const depth=metric?.depth??((r-1)*.19); const rise=metric?.rise??((r-1)*(s.rowRise||.08));
  const radial=Math.hypot(s.x,s.z)||1, ux=s.x/radial, uz=s.z/radial; const vx=s.x+ux*depth*.55, vz=s.z+uz*depth*.55; const vy=(s.y||.4)+rise+1.15;
  camera.position.set(vx,vy,vz); const target=schema.layout==='center'?{x:0,y:(schema.stage?.y||.6)+1.2,z:0}:{x:0,y:(schema.stage?.y||.6)+1.4,z:(schema.stage?.z||-6)};camera.lookAt(target.x,target.y,target.z);
}
function renderArchive(){const a=events.filter(e=>e.status==='archive');$('#archiveGrid').innerHTML=a.map(e=>`<article><b>${esc(e.artist||'Live')}</b><div>${esc(e.title)}</div><div class="meta">${e.date} · ${esc(e.venue||'')}</div></article>`).join('')||'<span class="meta">尚無已結束活動</span>'}
function featuredRows(){return events.filter(e=>e.status==='upcoming'&&e.featured)}
function renderFeatured(){let f=featuredRows();if(!f.length)f=events.filter(e=>e.status==='upcoming').slice(0,8);if(!f.length){$('#featuredCard').innerHTML='<div class="meta">目前沒有 Featured 活動</div>';return}const e=f[featureIndex%f.length];$('#featuredCard').innerHTML=`<span class="badge">${e.date}</span><h2>${esc(e.artist||'Live')}</h2><b>${esc(e.title)}</b><div class="meta">${esc(e.venue||'')}${e.prices?.length?' · NT$ '+Math.min(...e.prices).toLocaleString()+' 起':''}</div><button class="primary" style="margin-top:16px;align-self:flex-start" data-feature="${e.id}">查看 3D</button>`;$('[data-feature]')?.addEventListener('click',()=>{filter='upcoming';setFilterButtons();selectEvent(e.id);$('#viewer').scrollIntoView({behavior:'smooth'})})}
function renderUpcoming(){let rows=events.filter(e=>e.status==='upcoming');const d=$('#dateFilter')?.value;if(d)rows=rows.filter(e=>e.date===d||(e.endDate&&d>=e.date&&d<=e.endDate));$('#upcomingGrid').innerHTML=rows.map(e=>`<div class="eventItem" data-modal-id="${e.id}"><b>${esc(e.artist||'Live')}</b><div>${esc(e.title)}</div><div class="meta">${e.date} · ${esc(e.venue||'')}</div></div>`).join('')||'<span class="meta">此日期沒有活動</span>';$$('[data-modal-id]').forEach(x=>x.onclick=()=>{moreDialog.close();filter='upcoming';setFilterButtons();selectEvent(x.dataset.modalId);$('#viewer').scrollIntoView({behavior:'smooth'})})}
function setFilterButtons(){$$('[data-filter]').forEach(b=>b.classList.toggle('active',b.dataset.filter===filter))}
function init3D(){const el=$('#viewer');scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(48,el.clientWidth/el.clientHeight,.1,1000);renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(el.clientWidth,el.clientHeight);renderer.shadowMap.enabled=true;el.appendChild(renderer.domElement);root=new THREE.Group();scene.add(root);scene.add(new THREE.HemisphereLight(0xffffff,0x35384b,2.1));const d=new THREE.DirectionalLight(0xffffff,2.2);d.position.set(8,14,8);d.castShadow=true;scene.add(d);camera.position.set(0,10,23);camera.lookAt(0,2,0);buildScene(active||filtered()[0]);let drag=false,px=0,py=0;renderer.domElement.onpointerdown=e=>{drag=true;px=e.clientX;py=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)};renderer.domElement.onpointermove=e=>{if(!drag)return;root.rotation.y+=(e.clientX-px)*.008;root.rotation.x=Math.max(-.2,Math.min(.3,root.rotation.x+(e.clientY-py)*.004));px=e.clientX;py=e.clientY};renderer.domElement.onpointerup=()=>drag=false;renderer.domElement.onwheel=e=>{camera.position.z=Math.max(12,Math.min(40,camera.position.z+e.deltaY*.012))};addEventListener('resize',()=>{camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setSize(el.clientWidth,el.clientHeight)});(function tick(){raf=requestAnimationFrame(tick);renderer.render(scene,camera)})()}
function clearGroup(){while(root.children.length){const c=root.children.pop();c.geometry?.dispose();if(c.material){Array.isArray(c.material)?c.material.forEach(m=>m.dispose()):c.material.dispose()}}}
function mat(color,rough=.72){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:.08})}
function box(w,h,d,color){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));m.castShadow=m.receiveShadow=true;return m}
function buildScene(e){
  if(!root)return;clearGroup();const schema=e?.threeD||clientSchema(e||{});const v=schema.venue||{kind:'generic',radius:7,tiers:2};const isLight=document.documentElement.classList.contains('light');
  const floor=box(v.kind==='dome'?24:20,.35,v.kind==='dome'?22:18,isLight?0xf0f2f6:0xd8dbe4);floor.position.y=-.2;root.add(floor);
  const sw=schema.stage?.width||9,sd=schema.stage?.depth||4;let stage;
  if(schema.layout==='center'){stage=new THREE.Mesh(new THREE.CylinderGeometry(sw*.48,sw*.48,.8,48),mat(0x252838));stage.position.set(0,.4,0);root.add(stage)}else{stage=box(sw,.8,sd,0x252838);stage.position.set(0,.4,schema.stage?.z??-6);root.add(stage)}
  if(schema.stage?.type==='thrust'){const thrust=box(2.2,.55,7.5,0x303448);thrust.position.set(0,.35,-1.6);root.add(thrust)}
  if(schema.layout==='center'){for(let a=0;a<4;a++){const screen=box(4.8,3.4,.28,0x3a3f62);const t=a*Math.PI/2;screen.position.set(Math.cos(t)*2.8,3.1,Math.sin(t)*2.8);screen.rotation.y=-t;root.add(screen)}}else{const screen=box(Math.max(7,sw-.8),4.6,.35,0x3a3f62);screen.position.set(0,3,(schema.stage?.z??-6)-1.2);root.add(screen)}
  const glow=new THREE.PointLight(0x765fff,34,22);glow.position.set(0,5,schema.layout==='center'?0:-4);root.add(glow);
  if(schema.mode==='standing+2f'||schema.mode==='arena-hybrid'){const pit=box(12,.12,5.5,0xadb0ba);pit.position.set(0,.04,-1);root.add(pit)}
  const secs=(schema.sections||[]).slice(0,64);secs.forEach((s)=>{const rows=Math.min(20,s.rowCount||7);const tangent=(s.angleRad??Math.atan2(s.z,s.x))+Math.PI/2;const radial=Math.hypot(s.x,s.z)||1,ux=s.x/radial,uz=s.z/radial;for(let r=0;r<rows;r++){const metric=s.rowMetric?.[r];const rowDepth=metric?.depth??r*.19;const rise=metric?.rise??r*(s.rowRise||.08);const span=v.kind==='dome'?4.1:v.kind==='hall'?2.2:3.5;const count=Math.min(12,Math.max(6,Math.round((s.seatsPerRow||18)/2.7)));for(let j=0;j<count;j++){const selectedRow=selectedSeat.section===s.label&&Math.max(1,selectedSeat.row||1)===r+1;const seat=box(.32,.28,.34,selectedRow?0xb4a8ff:0x6f75a6);const offset=(j-(count-1)/2)*(span/count);seat.position.set(s.x+Math.cos(tangent)*offset+ux*rowDepth*.55,(s.y??.25)+rise,s.z+Math.sin(tangent)*offset+uz*rowDepth*.55);seat.rotation.y=schema.layout==='center'?Math.atan2(-seat.position.x,-seat.position.z):Math.atan2(-seat.position.x,(schema.stage?.z??-6)-seat.position.z);root.add(seat)}
      if(s.walkways?.some(w=>w.afterRow===r+1)){const aisle=box(span+.7,.05,.34,isLight?0xc7cad3:0x9fa3af);aisle.position.set(s.x+ux*(rowDepth*.55+.2),(s.y??.25)+rise-.08,s.z+uz*(rowDepth*.55+.2));aisle.rotation.y=-tangent;root.add(aisle)}
    }
    if((s.tier||0)>0){const rail=box(v.kind==='dome'?4.2:3.6,.55,.08,0x818692);rail.position.set(s.x*.96,(s.y||.4)+.25,s.z*.96);rail.rotation.y=-tangent;root.add(rail)}
  });
  root.rotation.set(-.05,0,0);camera.position.set(0,v.kind==='dome'?12:10,v.kind==='dome'?29:23);camera.lookAt(0,2,schema.layout==='center'?0:-1)
}
function clientSchema(e={}){const venueKind=/大巨蛋/.test(e.venue||'')?'dome':/小巨蛋|體育館|高雄巨蛋/.test(e.venue||'')?'arena':/Zepp/.test(e.venue||'')?'club':/音樂廳|歌劇院|衛武營/.test(e.venue||'')?'hall':'generic';const v={kind:venueKind,radius:venueKind==='dome'?9.5:venueKind==='arena'?8.2:venueKind==='club'?6.2:6.8,tiers:venueKind==='dome'||venueKind==='arena'?3:2};const labels=(e.sections?.length?e.sections:Array.from({length:venueKind==='dome'?24:venueKind==='arena'?16:10},(_,i)=>`S${i+1}`));return{venue:v,stage:{type:e.stage||'end',width:venueKind==='dome'?10:8,depth:e.stage==='thrust'?8:4},mode:e.seatMapMode||'end-stage',sections:labels.slice(0,36).map((label,i,a)=>{const t=(i/a.length)*Math.PI*1.78+Math.PI*.12;return{label,x:+(Math.cos(t)*v.radius).toFixed(2),z:+(Math.sin(t)*v.radius-1.2).toFixed(2),tier:i%v.tiers,rowCount:9}})}}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function safeUrl(u=''){try{const x=new URL(u);return x.protocol==='https:'?x.href:'#'}catch{return'#'}}
$('#themeBtn').onclick=()=>{document.documentElement.classList.toggle('light');buildScene(active)};$$('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;active=null;setFilterButtons();renderList()});$('#searchBtn').onclick=()=>renderList($('#searchInput').value.trim());$('#searchInput').addEventListener('keydown',e=>{if(e.key==='Enter')renderList(e.target.value.trim())});$('#moreBtn').onclick=()=>{renderUpcoming();moreDialog.showModal()};$('#closeModal').onclick=()=>moreDialog.close();$('#dateFilter').onchange=renderUpcoming;$('#clearDate').onclick=()=>{$('#dateFilter').value='';renderUpcoming()};$('#settingsBtn').onclick=()=>alert('設定：深淺色切換已保留。活動來源與 3D 會自動更新；低信心座位圖不會冒充精準視角。');$('#menuBtn').onclick=()=>alert('手機導覽：首頁 / 演唱會 / 3D 場館 / 我的清單 / 提醒');$('#viewStage').onclick=()=>{camera.position.set(0,6,14);camera.lookAt(0,2,-5)};$('#viewSeat').onclick=()=>{camera.position.set(6,4,8);camera.lookAt(0,2,-4)};$('#resetView').onclick=()=>{root.rotation.set(-.05,0,0);camera.position.set(0,10,23);camera.lookAt(0,2,-1)};setInterval(()=>{const f=featuredRows();const n=f.length||events.filter(e=>e.status==='upcoming').length;if(n>1){featureIndex++;renderFeatured()}},10000);load();
