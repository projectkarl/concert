import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

const argv = process.argv.slice(2);
const arg = name => { const i=argv.indexOf(name); return i>=0 ? argv[i+1] : ''; };
const sourceArg = arg('--source') || argv.find(x=>!x.startsWith('--')) || '';
const outArg = arg('--out') || 'NEUL-cloudflare-exact';
if(!sourceArg){
  console.error('Usage: npm run apply -- --source /path/to/NEUL-v0.40.17-Expanded-AutoCoverage.zip [--out NEUL-cloudflare-exact]');
  process.exit(2);
}
const adapterRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const cwd = process.cwd();
const sourcePath = path.resolve(cwd, sourceArg);
const output = path.resolve(cwd, outArg);
const temp = fs.mkdtempSync(path.join(os.tmpdir(),'neul-cf-'));

function extractZip(zip, dest){
  fs.mkdirSync(dest,{recursive:true});
  if(process.platform==='win32'){
    const ps=spawnSync('powershell',['-NoProfile','-Command',`Expand-Archive -LiteralPath '${zip.replace(/'/g,"''")}' -DestinationPath '${dest.replace(/'/g,"''")}' -Force`],{stdio:'inherit'});
    if(ps.status!==0) throw new Error('Expand-Archive failed');
  } else {
    const r=spawnSync('unzip',['-q',zip,'-d',dest],{stdio:'inherit'});
    if(r.status!==0) throw new Error('unzip failed');
  }
}
function firstProjectRoot(dir){
  const entries=fs.readdirSync(dir,{withFileTypes:true}).filter(x=>x.name!=='.DS_Store');
  if(entries.length===1 && entries[0].isDirectory()){
    const candidate=path.join(dir,entries[0].name);
    if(fs.existsSync(path.join(candidate,'index.html'))) return candidate;
  }
  return dir;
}
let src;
if(fs.statSync(sourcePath).isDirectory()) src=sourcePath;
else { extractZip(sourcePath,temp); src=firstProjectRoot(temp); }
if(!fs.existsSync(path.join(src,'index.html'))) throw new Error('Original NEUL index.html not found. Use the extracted/root v0.40.17 project or ZIP.');

const LOCK_FILES=['index.html','styles.css','app.js','webgl-venue.js','seat-map-intelligence.js','sw.js','data/events.js','data/multi-venue-geometry.js'];
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const before={};
for(const rel of LOCK_FILES){ const p=path.join(src,rel); if(fs.existsSync(p)) before[rel]=sha(p); }

fs.rmSync(output,{recursive:true,force:true});
fs.cpSync(src,output,{recursive:true});
fs.mkdirSync(path.join(output,'cloudflare'),{recursive:true});
fs.copyFileSync(path.join(adapterRoot,'cloudflare-src','connectors.js'),path.join(output,'cloudflare','connectors.js'));

// Copy only client-facing files into the Static Assets directory without changing bytes.
const publicDir=path.join(output,'.cf-public');
fs.rmSync(publicDir,{recursive:true,force:true});
fs.mkdirSync(publicDir,{recursive:true});
const SERVER_DIRS=new Set(['api','lib','scripts','test','tests','node_modules','.git','cloudflare','.cf-public']);
const ROOT_SKIP=new Set(['vercel.json','package.json','package-lock.json','pnpm-lock.yaml','yarn.lock']);
function copyPublic(srcDir,dstDir,rel=''){
  for(const ent of fs.readdirSync(srcDir,{withFileTypes:true})){
    if(SERVER_DIRS.has(ent.name)) continue;
    const r=rel?`${rel}/${ent.name}`:ent.name;
    if(!rel && ROOT_SKIP.has(ent.name)) continue;
    if(/\.(md|csv)$/i.test(ent.name) && !/^(manifest|browserconfig)/i.test(ent.name)) continue;
    const sp=path.join(srcDir,ent.name), dp=path.join(dstDir,ent.name);
    if(ent.isDirectory()){ fs.mkdirSync(dp,{recursive:true}); copyPublic(sp,dp,r); }
    else fs.copyFileSync(sp,dp);
  }
}
copyPublic(output,publicDir);

// Try to extract the original fallback event array at build time so the Worker fallback matches the original catalog.
let seed=[];
try{
  const evPath=path.join(output,'data','events.js');
  if(fs.existsSync(evPath)){
    const mod=await import(pathToFileURL(evPath).href+`?t=${Date.now()}`);
    const arrays=Object.values(mod).filter(v=>Array.isArray(v));
    seed=arrays.sort((a,b)=>b.length-a.length).find(a=>a.length && typeof a[0]==='object' && ('date' in a[0] || 'title' in a[0])) || [];
  }
}catch(e){ console.warn('Seed import skipped:',e.message); }
fs.writeFileSync(path.join(output,'cloudflare','generated-seed.js'),`export const seedEvents = ${JSON.stringify(seed)};\n`);

const worker=fs.readFileSync(path.join(adapterRoot,'cloudflare-src','worker-exact.js'),'utf8');
fs.writeFileSync(path.join(output,'cloudflare','worker.js'),worker);
fs.writeFileSync(path.join(output,'wrangler.jsonc'),JSON.stringify({
  "$schema":"./node_modules/wrangler/config-schema.json",
  name:"neul-cloudflare-exact",
  main:"cloudflare/worker.js",
  compatibility_date:"2026-09-24",
  compatibility_flags:["nodejs_compat"],
  assets:{directory:"./.cf-public",binding:"ASSETS",not_found_handling:"single-page-application",run_worker_first:["/api/*"]},
  kv_namespaces:[{binding:"CACHE",id:"REPLACE_WITH_KV_NAMESPACE_ID"}],
  triggers:{crons:["17 */6 * * *"]},
  vars:{APP_VERSION:"1.1.0-exact-ui",ARCHIVE_LIMIT:"20",SOURCE_TIMEOUT_MS:"6500"}
},null,2));

// Merge package.json only for deploy scripts/dependency; frontend source stays byte-identical.
let pkg={};
try{ pkg=JSON.parse(fs.readFileSync(path.join(output,'package.json'),'utf8')); }catch{}
pkg.private=true; pkg.type=pkg.type||'module'; pkg.scripts={...(pkg.scripts||{}),"cf:dev":"wrangler dev","cf:deploy":"wrangler deploy","cf:verify":"node cloudflare/verify-ui-lock.mjs"};
pkg.devDependencies={...(pkg.devDependencies||{}),wrangler:"^4.40.0"};
fs.writeFileSync(path.join(output,'package.json'),JSON.stringify(pkg,null,2)+'\n');

const after={};
for(const rel of Object.keys(before)){ const p=path.join(output,rel); after[rel]=sha(p); if(before[rel]!==after[rel]) throw new Error(`UI lock violation: ${rel} changed`); }
const integrity={source:path.basename(sourcePath),createdAt:new Date().toISOString(),lockedFiles:before,verified:Object.keys(before).every(k=>before[k]===after[k])};
fs.writeFileSync(path.join(output,'FRONTEND-INTEGRITY.json'),JSON.stringify(integrity,null,2)+'\n');
fs.writeFileSync(path.join(output,'cloudflare','ui-lock.json'),JSON.stringify(before,null,2)+'\n');
fs.copyFileSync(path.join(adapterRoot,'scripts','verify-ui-lock.mjs'),path.join(output,'cloudflare','verify-ui-lock.mjs'));
fs.copyFileSync(path.join(adapterRoot,'DEPLOY.md'),path.join(output,'DEPLOY-CLOUDFLARE.md'));
console.log(`\nPASS: Original NEUL frontend preserved byte-for-byte (${Object.keys(before).length} locked files).`);
console.log(`Output: ${output}`);
