const DB_NAME = 'neul-db';
const DB_VERSION = 2;
const STORES = ['prefs','snapshots','changes','drafts'];

function openDb(){
  return new Promise((resolve,reject)=>{
    if(!('indexedDB' in window)) return reject(new Error('IndexedDB unavailable'));
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{const db=req.result;for(const name of STORES) if(!db.objectStoreNames.contains(name)) db.createObjectStore(name,{keyPath:'key'});};
    req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
  });
}
async function tx(store,mode='readonly'){
  const db=await openDb(); const t=db.transaction(store,mode); return {db,t,s:t.objectStore(store)};
}
export async function idbGet(store,key,fallback=null){
  try{const {db,t,s}=await tx(store);const value=await new Promise((resolve,reject)=>{const r=s.get(key);r.onsuccess=()=>resolve(r.result?.value ?? fallback);r.onerror=()=>reject(r.error);});t.oncomplete=()=>db.close();return value;}catch{return fallback;}
}
export async function idbSet(store,key,value){
  try{const {db,t,s}=await tx(store,'readwrite');s.put({key,value,updatedAt:new Date().toISOString()});await new Promise((resolve,reject)=>{t.oncomplete=resolve;t.onerror=()=>reject(t.error);});db.close();return true;}catch{return false;}
}
export async function idbPush(store,key,item,limit=80){const arr=await idbGet(store,key,[]);arr.unshift(item);await idbSet(store,key,arr.slice(0,limit));return arr.slice(0,limit);}
export async function migrateLegacy(){
  const legacy=localStorage.getItem('neul-followed') || localStorage.getItem('stan-followed');
  const existing=await idbGet('prefs','followed',null);
  if(existing==null && legacy){try{await idbSet('prefs','followed',JSON.parse(legacy));}catch{}}
  const mode=localStorage.getItem('neul-mode') || localStorage.getItem('stan-mode'); if(mode && await idbGet('prefs','mode',null)==null) await idbSet('prefs','mode',mode);
}
export async function loadFollowed(){await migrateLegacy();return await idbGet('prefs','followed',null);}
export async function saveFollowed(names){localStorage.setItem('neul-followed',JSON.stringify(names));localStorage.removeItem('stan-followed');return idbSet('prefs','followed',names);}
export async function saveMode(mode){localStorage.setItem('neul-mode',mode);localStorage.removeItem('stan-mode');return idbSet('prefs','mode',mode);}
export async function recordEventChanges(events){
  const old=await idbGet('snapshots','events',{}); const next={}; const changes=[];
  for(const e of events||[]){
    const snap={title:e.title,start:e.start,end:e.end||null,venue:e.venue,ticketStatus:e.ticketStatus||null,generalSale:e.generalSale||null,price:e.price||null,checkedAt:e.checkedAt||null}; next[e.id]=snap;
    const prev=old[e.id]; if(!prev) continue;
    for(const field of ['start','end','venue','ticketStatus','generalSale','price']) if(JSON.stringify(prev[field])!==JSON.stringify(snap[field])) changes.push({eventId:e.id,artist:e.artist,title:e.title,field,from:prev[field]??null,to:snap[field]??null,at:new Date().toISOString()});
  }
  await idbSet('snapshots','events',next);
  if(changes.length){const history=await idbGet('changes','event-history',[]);await idbSet('changes','event-history',[...changes,...history].slice(0,120));}
  return changes;
}
export async function eventChanges(eventId){const h=await idbGet('changes','event-history',[]);return h.filter(x=>x.eventId===eventId).slice(0,8);}
export async function saveOfflineSnapshot(meta){return idbSet('prefs','last-sync',meta);}
export async function loadOfflineSnapshot(){return idbGet('prefs','last-sync',null);}
