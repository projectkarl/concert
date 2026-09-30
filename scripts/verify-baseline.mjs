import fs from 'node:fs';
import crypto from 'node:crypto';
const root=new URL('../',import.meta.url);
const manifest=JSON.parse(fs.readFileSync(new URL('../NEUL_BASELINE_MANIFEST.json',import.meta.url),'utf8'));
let ok=true;
for(const [file,expected] of Object.entries(manifest.coreFileSha256)){
  const url=new URL(file,root);
  if(!fs.existsSync(url)){console.error('baseline file missing',file);ok=false;continue;}
  const actual=crypto.createHash('sha256').update(fs.readFileSync(url)).digest('hex');
  if(actual!==expected){console.error('baseline hash mismatch',file,{expected,actual});ok=false;}
}
if(!ok)process.exit(1);
console.log(`NEUL baseline verified · ${Object.keys(manifest.coreFileSha256).length} core files · ${manifest.requiredFeatures.length} required features`);
