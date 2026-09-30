import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=process.cwd(),pub=path.join(root,'public');
const original=JSON.parse(fs.readFileSync(path.join(root,'cloudflare/original-ui-lock.json'),'utf8'));
const overrides=JSON.parse(fs.readFileSync(path.join(root,'cloudflare/functional-overrides-lock.json'),'utf8'));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const overrideSet=new Set(Object.keys(overrides.hashes));
const bad=[];
let originalCount=0,overrideCount=0;
for(const [rel,expected] of Object.entries(original.hashes)){
  const functional=overrideSet.has(rel), wanted=functional?overrides.hashes[rel]:expected;
  for(const [label,base] of [['root',root],['public',pub]]){
    const p=path.join(base,rel);
    if(!fs.existsSync(p)){bad.push(`${rel}: missing in ${label}`);continue;}
    const got=hash(p);if(got!==wanted)bad.push(`${rel}: ${label} ${got} != expected ${wanted}`);
  }
  if(functional)overrideCount++;else originalCount++;
}
if(bad.length){console.error('FRONTEND INTEGRITY FAIL\n'+bad.join('\n'));process.exit(1)}
const report={version:overrides.version,source:original.source,sourceArchiveSha256:original.sourceArchiveSha256,verifiedAt:new Date().toISOString(),originalVisualLockedAssets:originalCount,intentionalFunctionalOverrides:overrideCount,overrideFiles:[...overrideSet],originalHashes:original.hashes,functionalOverrideHashes:overrides.hashes};
fs.writeFileSync(path.join(root,'FRONTEND-INTEGRITY.json'),JSON.stringify(report,null,2)+'\n');
console.log(`FRONTEND INTEGRITY PASS — ${originalCount} original UI/assets locked + ${overrideCount} intentional functional modules locked`);
