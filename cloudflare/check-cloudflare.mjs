import fs from 'node:fs';import path from 'node:path';
const root=process.cwd(),worker=fs.readFileSync(path.join(root,'cloudflare/worker.js'),'utf8'),connectors=fs.readFileSync(path.join(root,'cloudflare/connectors.js'),'utf8');
const wranglerText=fs.readFileSync(path.join(root,'wrangler.jsonc'),'utf8');
const assetsMatch=wranglerText.match(/\"assets\"\s*:\s*\{[\s\S]*?\"directory\"\s*:\s*\"([^\"]+)\"/);
const assetsDirectory=assetsMatch?path.resolve(root,assetsMatch[1]):null;
if(!assetsDirectory||!fs.existsSync(assetsDirectory)||!fs.statSync(assetsDirectory).isDirectory()){
  console.error(`FAIL assets.directory — configured=${assetsMatch?.[1]||'missing'} resolved=${assetsDirectory||'n/a'}`);
  process.exit(1);
}
if(!fs.existsSync(path.join(assetsDirectory,'index.html'))){
  console.error(`FAIL assets.directory — index.html missing in ${assetsDirectory}`);
  process.exit(1);
}
console.log(`PASS assets.directory exists — ${path.relative(root,assetsDirectory)||'.'}`);
const autoKv=/"kv_namespaces"\s*:\s*\[[\s\S]*?"binding"\s*:\s*"CACHE"[\s\S]*?\]/.test(wranglerText)&&!wranglerText.includes('REPLACE_WITH_KV_NAMESPACE_ID');
console.log(`${autoKv?'PASS':'FAIL'} KV automatic provisioning config`);
if(!autoKv) process.exit(1);

const client=['app.js','news.js','enhancements.js','seat-map-intelligence.js','pwa.js','storage.js','i18n.js'];const refs=new Set();for(const f of client){const t=fs.readFileSync(path.join(root,f),'utf8');for(const m of t.matchAll(/\/api\/[a-zA-Z0-9_-]+/g))refs.add(m[0])}
const missing=[...refs].filter(x=>!worker.includes(`'${x}'`)&&!worker.includes(`\"${x}\"`));const checks=[['frontend API contract complete',!missing.length],['events endpoint',worker.includes("p==='/api/events'")],['official endpoint shape',worker.includes('officialPayload')],['entertainment news exact endpoint',worker.includes("p==='/api/entertainment-news'")],['push config+subscribe',worker.includes("/api/push-config")&&worker.includes("/api/push-subscribe")],['push digest cron',worker.includes("30 0 * * *")&&worker.includes('pushDigest')],['seatmap hash headers',worker.includes('X-NEUL-SeatMap-Hash')&&worker.includes('X-NEUL-SeatMap-Resolved')],['seatmap recursive resolver',worker.includes('resolveSeatMap')&&worker.includes('recursive-v3')&&worker.includes('data-lazy-src')&&worker.includes('srcset')],['Live Nation CDN referer',worker.includes('networksites.livenationinternational.com')&&worker.includes('livenation.com.tw')&&worker.includes('referer')],['hourly rotating 6h source cycle',worker.includes("17 * * * *")&&worker.includes('phase=Math.floor')&&worker.includes('%6')],['KV source versioning',worker.includes('neul:v14:source:')],['14+ ticket/promoter sources',(connectors.match(/id:'(?:tixcraft|kktix|ticketplus|kham|famiticket|udn|ibon|mna|era|tixfun|opentix|fansigo|indievox|books|livenation)'/g)||[]).length>=15],['reference dual source',connectors.includes('fetchTwcvReference')&&connectors.includes('fetchArtistsReference')],['news 5 categories',connectors.includes("['kr','jp','tw','west','other']")||worker.includes("['kr','jp','tw','west','other']")],['free-plan external shard guard',worker.includes('externalPerInvocationBelow50:true')]];let bad=0;for(const [n,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${n}`);if(!ok)bad++}if(missing.length)console.error('Missing frontend routes:',missing);if(bad)process.exit(1);console.log(`Cloudflare static contract PASS — frontend routes: ${[...refs].sort().join(', ')}`);
