
const roots=new Set([
'https://tixcraft.com/activity','https://kktix.com/events','https://www.livenation.com.tw/event/allevents',
'https://www.famiticket.com.tw/Home','https://ticketplus.com.tw/','https://ticket.ibon.com.tw/',
'https://tickets.udnfunlife.com/','https://www.ticket.com.tw/','https://www.cityline.com/'
]);
const detail=`<html><body>
<h1>NEUL TEST CONCERT 台北小巨蛋 2026/10/18 演唱會</h1>
<div>紅2區 NT$5800 黃2區 NT$4800 紫2區 NT$3800 延伸舞台</div>
<img alt="官方座位圖 seating plan" src="https://tixcraft.com/images/neul-seatmap.png">
</body></html>`;
globalThis.fetch=async (input)=>{
  const u=String(input?.url||input);
  if(roots.has(u)){
    return new Response(`<a href="https://tixcraft.com/activity/detail/neul_test">NEUL TEST CONCERT 台北小巨蛋 2026/10/18 演唱會</a>`,{status:200,headers:{'content-type':'text/html'}});
  }
  if(u.includes('neul_test')||u.includes('activity/detail/26_btskns')||u.endsWith('/activity')){
    return new Response(detail,{status:200,headers:{'content-type':'text/html'}});
  }
  if(u.includes('2026tara-kh')) return new Response(detail,{status:200,headers:{'content-type':'text/html'}});
  if(u.includes('neul-seatmap.png')){
    return new Response(new Uint8Array([137,80,78,71,13,10,26,10]),{status:200,headers:{'content-type':'image/png'}});
  }
  return new Response(detail,{status:200,headers:{'content-type':'text/html'}});
};
function mockRes(){
  return {
    statusCode:200,headers:{},body:null,
    setHeader(k,v){this.headers[k.toLowerCase()]=v},
    end(v=''){this.body=v},
    status(n){this.statusCode=n;return this},
    json(v){this.body=JSON.stringify(v);return this},
    send(v){this.body=v;return this}
  };
}
const {default:events}=await import('./api/events.mjs');
const er=mockRes();await events({method:'GET',query:{}},er);
if(er.statusCode!==200)throw new Error('events API '+er.statusCode+' '+er.body);
const body=JSON.parse(er.body);
if(!body.ok||!body.events.length)throw new Error('events API returned no events');
if(body.summary.discovered<1)throw new Error('auto discovery failed');
if(body.summary.seatMaps<1)throw new Error('seat map capture failed');
if(body.summary.sectionMapped<1)throw new Error('section mapping failed');
const auto=body.events.find(x=>x.sourceType==='auto-discovered');
if(!auto?.sceneSpec?.geometry)throw new Error('auto SceneSpec missing');
if(!auto?.automation?.sceneRebuildKey)throw new Error('scene rebuild key missing');
if(!auto?.automation?.sceneReady)throw new Error('auto-discovered event did not reach sceneReady');
if(auto.sceneSpec?.status!=='ready')throw new Error('auto SceneSpec not ready');

const {default:geo}=await import('./api/venue-geometry.mjs');
const gr=mockRes();await geo({query:{}},gr);
if(gr.statusCode!==200||!JSON.parse(gr.body).venues)throw new Error('venue geometry route failed');

const {default:proxy}=await import('./api/seatmap-image.mjs');
const pr=mockRes();await proxy({query:{url:'https://tixcraft.com/images/neul-seatmap.png'}},pr);
if(pr.statusCode!==200)throw new Error('seatmap image proxy failed '+pr.statusCode);

const bad=mockRes();await proxy({query:{url:'https://evil.example/a.png'}},bad);
if(bad.statusCode!==403)throw new Error('seatmap proxy allowlist guard failed');

const {default:health}=await import('./api/health.mjs');
const hr=mockRes();health({},hr);
const hb=JSON.parse(hr.body);if(hb.build!=='0.54')throw new Error('health build stale');

const {default:scan}=await import('./api/automation-scan.mjs');
const sr=mockRes();await scan({method:'GET'},sr);
if(sr.statusCode!==200||!JSON.parse(sr.body).ok)throw new Error('daily automation scan failed');

console.log(JSON.stringify({
  events:body.summary,
  autoEvent:{id:auto.id,seatMap:auto.automation.seatMapCaptured,sectionMapped:auto.automation.sectionMapped,sceneReady:auto.automation.sceneReady,sceneVersion:auto.sceneVersion},
  venueRoute:'ok',seatMapProxy:'ok',allowlistGuard:'ok',health:hb.build,dailyScan:JSON.parse(sr.body).summary
},null,2));
