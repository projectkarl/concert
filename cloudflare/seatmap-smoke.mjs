import worker from './worker.js';

class KV {
  constructor(){this.m=new Map()}
  async get(k,type){
    const v=this.m.get(k);if(v==null)return null;
    if(type==='json'){try{return JSON.parse(typeof v==='string'?v:new TextDecoder().decode(v))}catch{return null}}
    if(type==='arrayBuffer'){if(v instanceof ArrayBuffer)return v.slice(0);if(ArrayBuffer.isView(v))return v.buffer.slice(v.byteOffset,v.byteOffset+v.byteLength);return new TextEncoder().encode(String(v)).buffer}
    return typeof v==='string'?v:String(v);
  }
  async put(k,v){this.m.set(k,v instanceof ArrayBuffer?v.slice(0):ArrayBuffer.isView(v)?v.buffer.slice(v.byteOffset,v.byteOffset+v.byteLength):String(v))}
  async delete(k){this.m.delete(k)}
  async list({prefix='',limit=1000}={}){return {keys:[...this.m.keys()].filter(k=>k.startsWith(prefix)).slice(0,limit).map(name=>({name}))}}
}
const env={CACHE:new KV(),ASSETS:{fetch:async()=>new Response('asset')},SEATMAP_REVALIDATE_SECONDS:'21600',SEATMAP_MAX_CACHE_BYTES:'8388608'};
const imageBytes=new Uint8Array([0xff,0xd8,0xff,0xdb,0,1,2,3,0xff,0xd9]);
const calls=[];
const originalFetch=globalThis.fetch;
globalThis.fetch=async (input,init={})=>{
  const url=typeof input==='string'?input:input.url;calls.push({url,headers:init.headers||{}});
  if(url==='https://tixcraft.com/activity/detail/26_fixture')return new Response('<html><img alt="官方座位圖" src="https://static.tixcraft.com/images/activity/field/26_fixture_seatmap.jpg"></html>',{status:200,headers:{'content-type':'text/html'}});
  if(url==='https://static.tixcraft.com/images/activity/field/26_fixture_seatmap.jpg')return new Response(imageBytes,{status:200,headers:{'content-type':'image/jpeg'}});
  if(url==='https://www.livenation.com.tw/event/fixture')return new Response('<script>window.__DATA__={"imageUrl":"https://networksites.livenationinternational.com/networksites/seat-map-fixture.jpg","caption":"場域圖 座位配置"}</script>',{status:200,headers:{'content-type':'text/html'}});
  if(url==='https://networksites.livenationinternational.com/networksites/seat-map-fixture.jpg'){
    const h=new Headers(init.headers||{}),ref=h.get('referer')||'';
    if(!ref.includes('livenation.com.tw'))return new Response('forbidden',{status:403});
    return new Response(imageBytes,{status:200,headers:{'content-type':'image/jpeg'}});
  }
  if(url==='https://static.tixcraft.com/images/activity/field/not-an-image.jpg')return new Response('<html>blocked</html>',{status:200,headers:{'content-type':'text/html; charset=utf-8'}});
  return new Response('not found',{status:404});
};
try{
  const a=await worker.fetch(new Request('https://neul.test/api/seat-map-image?url='+encodeURIComponent('https://tixcraft.com/activity/detail/26_fixture')+'&venue='+encodeURIComponent('臺北小巨蛋')+'&event=fixture&eventId=fixture-tixcraft'),env,{waitUntil(){}});
  if(!a.ok||!a.headers.get('X-NEUL-SeatMap-Hash')||!a.headers.get('X-NEUL-SeatMap-Resolved')?.includes('static.tixcraft.com'))throw new Error('tixCraft recursive seat-map resolution failed');
  const b=await worker.fetch(new Request('https://neul.test/api/seat-map-image?url='+encodeURIComponent('https://www.livenation.com.tw/event/fixture')+'&venue='+encodeURIComponent('臺北大巨蛋')+'&event=fixture&eventId=fixture-livenation'),env,{waitUntil(){}});
  if(!b.ok||!b.headers.get('X-NEUL-SeatMap-Resolved')?.includes('networksites.livenationinternational.com'))throw new Error('Live Nation CDN resolution failed');
  const fake=await worker.fetch(new Request('https://neul.test/api/seat-map-image?url='+encodeURIComponent('https://static.tixcraft.com/images/activity/field/not-an-image.jpg')+'&venue='+encodeURIComponent('臺北小巨蛋')+'&event=fake-html'),env,{waitUntil(){}});
  if(fake.ok)throw new Error('HTML error page with .jpg suffix must not be accepted as a seat-map image');
  const cdn=calls.find(x=>x.url.includes('networksites.livenationinternational.com'));
  if(!cdn||!new Headers(cdn.headers).get('referer')?.includes('livenation.com.tw'))throw new Error('Live Nation CDN referer missing');
  const firstStatus=await worker.fetch(new Request('https://neul.test/api/seat-map-status?url='+encodeURIComponent('https://tixcraft.com/activity/detail/26_fixture')+'&venue='+encodeURIComponent('臺北小巨蛋')+'&event=fixture&eventId=fixture-tixcraft'),env,{waitUntil(){}});
  const firstJson=await firstStatus.json();
  const tixMeta=[...env.CACHE.m.entries()].find(([k])=>k.includes('neul:v142:seatevent:fixture-tixcraft'))?.[1];
  const parsedMeta=typeof tixMeta==='string'?JSON.parse(tixMeta):null;
  if(!parsedMeta?.binKey||!firstJson?.eventLastGood?.cached)throw new Error('expected persisted seat-map binary metadata');
  env.CACHE.m.delete(parsedMeta.binKey);
  const repaired=await worker.fetch(new Request('https://neul.test/api/seat-map-image?url='+encodeURIComponent('https://tixcraft.com/activity/detail/26_fixture')+'&venue='+encodeURIComponent('臺北小巨蛋')+'&event=fixture&eventId=fixture-tixcraft'),env,{waitUntil(){}});
  if(!repaired.ok||!env.CACHE.m.has(parsedMeta.binKey))throw new Error('expired seat-map binary should be restored on successful revalidation');
  const beforeFail=calls.length;
  globalThis.fetch=async()=>new Response('upstream down',{status:503});
  const c=await worker.fetch(new Request('https://neul.test/api/seat-map-image?url='+encodeURIComponent('https://tixcraft.com/activity/detail/26_fixture')+'&venue='+encodeURIComponent('臺北小巨蛋')+'&event=fixture&eventId=fixture-tixcraft'),env,{waitUntil(){}});
  if(!c.ok||c.headers.get('X-NEUL-SeatMap-Resolver')!=='kv-last-good-fresh'||c.headers.get('X-NEUL-SeatMap-Hash')!==a.headers.get('X-NEUL-SeatMap-Hash'))throw new Error('KV last-good seat-map cache failed');
  if(calls.length!==beforeFail)throw new Error('fresh KV seat-map cache should avoid upstream fetch');
  const status=await worker.fetch(new Request('https://neul.test/api/seat-map-status?url='+encodeURIComponent('https://tixcraft.com/activity/detail/26_fixture')+'&venue='+encodeURIComponent('臺北小巨蛋')+'&event=fixture&eventId=fixture-tixcraft'),env,{waitUntil(){}});
  const sj=await status.json();
  if(!sj?.request?.cached||!sj?.eventLastGood?.cached||!(sj.request.binaryBytes>0))throw new Error('seat-map status endpoint missing last-good metadata');
  console.log('SEATMAP SMOKE PASS — recursive official map + CDN referer + strict MIME guard + KV last-good repair');
}finally{globalThis.fetch=originalFetch}
