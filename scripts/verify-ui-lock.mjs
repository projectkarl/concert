import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const root=process.cwd(); const lockPath=path.join(root,'cloudflare','ui-lock.json');
if(!fs.existsSync(lockPath)){console.error('cloudflare/ui-lock.json not found');process.exit(2)}
const lock=JSON.parse(fs.readFileSync(lockPath,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
let bad=0;
for(const [rel,expected] of Object.entries(lock)){
 const p=path.join(root,rel); const actual=fs.existsSync(p)?sha(p):'MISSING'; const ok=actual===expected;
 console.log(`${ok?'PASS':'FAIL'} ${rel}`); if(!ok){console.log(` expected ${expected}\n actual   ${actual}`);bad++;}
}
if(bad) process.exit(1); console.log('UI LOCK PASS — original frontend bytes are unchanged.');
