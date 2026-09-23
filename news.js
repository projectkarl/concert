const $ = (s, root=document) => root.querySelector(s);
const state = { category: "kr", query: "", loading: false, controller: null, items: [], visible: 8, step: 8, maxAgeDays: 7 };
const labels = { kr: "韓星", jp: "日本", tw: "台灣", west: "歐美", other: "其他" };
const COPY = {
  'zh-Hant': { empty:'目前沒有取得符合條件的近期新聞，稍後會自動再試。', updating:c=>`正在更新${c}新聞…`, fail:'新聞來源暫時無法更新，稍後會自動再試。', source:'新聞來源', media:'原始媒體', more:'看更多新聞', count:(c,n,q,t,d)=>`${c} · 近 ${d} 天 · ${n} 則${q?` · ${q}`:''}${t?` · ${t} 更新`:''}` },
  en: { empty:'No recent matching news is available right now. NEUL will retry automatically.', updating:c=>`Updating ${c} entertainment news…`, fail:'The news source is temporarily unavailable. NEUL will retry automatically.', source:'News source', media:'Original publisher', more:'More news', count:(c,n,q,t,d)=>`${c} · last ${d} days · ${n} stories${q?` · ${q}`:''}${t?` · updated ${t}`:''}` },
  ja: { empty:'条件に合う最近のニュースを取得できませんでした。後ほど自動で再試行します。', updating:c=>`${c}エンタメニュースを更新中…`, fail:'ニュースソースを一時的に取得できません。後ほど自動で再試行します。', source:'ニュースソース', media:'元媒体', more:'ニュースをもっと見る', count:(c,n,q,t,d)=>`${c} · 直近${d}日 · ${n}件${q?` · ${q}`:''}${t?` · ${t} 更新`:''}` },
  ko: { empty:'조건에 맞는 최신 뉴스를 가져오지 못했습니다. 잠시 후 자동으로 다시 시도합니다.', updating:c=>`${c} 연예 뉴스 업데이트 중…`, fail:'뉴스 소스를 일시적으로 불러올 수 없습니다. 자동으로 다시 시도합니다.', source:'뉴스 출처', media:'원문 매체', more:'뉴스 더 보기', count:(c,n,q,t,d)=>`${c} · 최근 ${d}일 · ${n}건${q?` · ${q}`:''}${t?` · ${t} 업데이트`:''}` }
};

function esc(value="") { return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])); }
function safeUrl(value="") { try { const u=new URL(value); return /^https?:$/.test(u.protocol) ? u.href : "#"; } catch { return "#"; } }
function locale(){ return window.NEUL_I18N?.locale?.() || "zh-TW"; }
function lang(){ return window.NEUL_I18N?.getLanguage?.() || 'zh-Hant'; }
function t(value){ return window.NEUL_I18N?.t?.(value) || value; }
function copy(){ return COPY[lang()] || COPY['zh-Hant']; }
function categoryLabel(){ return t(labels[state.category] || '韓星'); }
function relativeTime(value){
  const ts=Date.parse(value); if(!Number.isFinite(ts)) return "";
  const diff=ts-Date.now(); const abs=Math.abs(diff);
  const unit=abs<3600000?"minute":abs<86400000?"hour":"day";
  const div=unit==="minute"?60000:unit==="hour"?3600000:86400000;
  const n=Math.round(diff/div);
  try { return new Intl.RelativeTimeFormat(locale(),{numeric:"auto"}).format(n,unit); } catch { return new Date(ts).toLocaleDateString(locale()); }
}
function renderSkeleton(){ const grid=$("#newsGrid"); if(grid) grid.innerHTML='<div class="news-skeleton"></div>'.repeat(4); const more=$("#newsMoreBtn"); if(more) more.hidden=true; }
function sortedRecent(items=[]){
  const now=Date.now(), max=(state.maxAgeDays+1)*86400000;
  return [...items].filter(item=>{ const ts=Date.parse(item.publishedAt||""); return Number.isFinite(ts)&&ts<=now+3600000&&now-ts<=max; }).sort((a,b)=>Date.parse(b.publishedAt||0)-Date.parse(a.publishedAt||0));
}
function render(){
  const grid=$("#newsGrid"), more=$("#newsMoreBtn"); if(!grid) return;
  const items=state.items.slice(0,state.visible);
  if(!items.length){ grid.innerHTML=`<div class="news-empty">${esc(copy().empty)}</div>`; if(more) more.hidden=true; return; }
  grid.innerHTML=items.map(item=>`<a class="news-card" href="${esc(safeUrl(item.url))}" target="_blank" rel="noopener noreferrer"><span class="news-source">${esc(item.source||copy().source)}</span><time class="news-time" datetime="${esc(item.publishedAt||"")}">${esc(relativeTime(item.publishedAt))}</time><strong class="news-title">${esc(item.title)}</strong><span class="news-meta">${esc(categoryLabel())} · ${esc(copy().media)}</span><span class="news-arrow">↗</span></a>`).join("");
  if(more){ more.hidden=state.visible>=state.items.length; more.textContent=copy().more; }
}
async function loadNews({force=false}={}){
  if(state.loading && !force) return;
  state.controller?.abort(); state.controller=new AbortController(); state.loading=true; state.visible=8;
  const status=$("#newsStatus"), refresh=$("#newsRefreshBtn"); if(refresh) refresh.disabled=true;
  if(status) status.textContent=copy().updating(categoryLabel()); renderSkeleton();
  try{
    const qs=new URLSearchParams({category:state.category}); if(state.query) qs.set("q",state.query);
    const r=await fetch(`/api/entertainment-news?${qs}`,{signal:state.controller.signal,headers:{Accept:"application/json"}});
    if(!r.ok) throw new Error(`HTTP_${r.status}`);
    const data=await r.json(); state.maxAgeDays=Number(data.maxAgeDays||7); state.items=sortedRecent(data.results||[]); render();
    const time=data.fetchedAt ? new Intl.DateTimeFormat(locale(),{hour:"2-digit",minute:"2-digit",hour12:false,timeZone:"Asia/Taipei"}).format(new Date(data.fetchedAt)) : "";
    if(status) status.textContent=copy().count(categoryLabel(),state.items.length,state.query,time,state.maxAgeDays);
  }catch(err){
    if(err.name!=="AbortError"){ state.items=[]; render(); if(status) status.textContent=copy().fail; }
  }finally{ state.loading=false; if(refresh) refresh.disabled=false; }
}
function setCategory(category){
  if(!labels[category]) return;
  state.category=category; state.visible=8;
  const select=$("#newsCategorySelect");
  if(select && select.value!==category) select.value=category;
  loadNews({force:true});
}
function init(){
  if(!$("#entertainmentNews")) return;
  const select=$("#newsCategorySelect");
  if(select){ select.value=state.category; select.addEventListener("change",()=>setCategory(select.value)); }
  $("#newsSearchForm")?.addEventListener("submit",e=>{ e.preventDefault(); state.query=$("#newsSearchInput")?.value.trim().slice(0,80)||""; state.visible=8; loadNews({force:true}); });
  $("#newsRefreshBtn")?.addEventListener("click",()=>loadNews({force:true}));
  $("#newsMoreBtn")?.addEventListener("click",()=>{ state.visible=Math.min(state.items.length,state.visible+state.step); render(); });
  window.addEventListener("neul:languagechange",()=>loadNews({force:true}));
  loadNews();
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init,{once:true}); else init();
