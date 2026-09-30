import worker from './worker.js';
class KV{constructor(){this.m=new Map()}async get(k,type){const v=this.m.get(k);if(v==null)return null;if(type==='json'){try{return JSON.parse(typeof v==='string'?v:new TextDecoder().decode(v))}catch{return null}}if(type==='arrayBuffer'){if(v instanceof ArrayBuffer)return v.slice(0);if(ArrayBuffer.isView(v))return v.buffer.slice(v.byteOffset,v.byteOffset+v.byteLength);return new TextEncoder().encode(String(v)).buffer}return typeof v==='string'?v:String(v)}async put(k,v){this.m.set(k,v instanceof ArrayBuffer?v.slice(0):ArrayBuffer.isView(v)?v.buffer.slice(v.byteOffset,v.byteOffset+v.byteLength):String(v))}async delete(k){this.m.delete(k)}async list({prefix='',limit=1000}={}){return{keys:[...this.m.keys()].filter(k=>k.startsWith(prefix)).slice(0,limit).map(name=>({name}))}}}
const env={CACHE:new KV(),ASSETS:{fetch:async()=>new Response('asset',{status:200})},ARCHIVE_LIMIT:'20',APP_VERSION:'1.4.2-seatmap-lastgood-autogen',ENABLE_WEB_PUSH:'0'};
async function j(path,opts={}){const r=await worker.fetch(new Request('https://example.test'+path,opts),env,null);let b=null;try{b=await r.json()}catch{}return{r,b}}
let x=await j('/api/events');if(x.r.status!==200||!Array.isArray(x.b?.events)||x.b.events.length<90||!Array.isArray(x.b?.artists))throw new Error('events smoke failed');
x=await j('/api/official');if(x.r.status!==200||!Array.isArray(x.b?.results)||typeof x.b.monitored!=='number')throw new Error('official smoke failed');
x=await j('/api/coverage');if(x.r.status!==200||!x.b?.coverage||!x.b?.coverageAudit)throw new Error('coverage smoke failed');
x=await j('/api/entertainment-news?category=jp&q=test');if(x.r.status!==200||x.b?.category!=='jp'||!Array.isArray(x.b?.results)||x.b?.maxAgeDays!==7)throw new Error('news smoke failed');
x=await j('/api/push-config');if(x.r.status!==200||x.b?.enabled!==false)throw new Error('push config smoke failed');
x=await j('/api/push-subscribe',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({subscription:{endpoint:'https://push.example/x'}})});if(x.r.status!==503)throw new Error('push disabled smoke failed');
x=await j('/api/seat-map-image?url='+encodeURIComponent('https://evil.example/a.jpg'));if(x.r.status!==403)throw new Error('seat map allowlist smoke failed');
x=await j('/api/health');if(x.r.status!==200||x.b?.version!=='1.4.2-seatmap-lastgood-autogen'||x.b?.counts?.events<90)throw new Error('health smoke failed');
console.log(`SMOKE PASS — events=${(await j('/api/events')).b.events.length}, exact API compatibility routes OK`);
