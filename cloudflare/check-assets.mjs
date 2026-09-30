import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const cfgPath=path.join(root,'wrangler.jsonc');
if(!fs.existsSync(cfgPath)){
  console.error('ASSET CHECK FAIL: wrangler.jsonc not found. Run the command from the project folder that contains wrangler.jsonc.');
  process.exit(1);
}
const text=fs.readFileSync(cfgPath,'utf8');
const m=text.match(/"assets"\s*:\s*\{[\s\S]*?"directory"\s*:\s*"([^"]+)"/);
if(!m){console.error('ASSET CHECK FAIL: assets.directory is missing from wrangler.jsonc');process.exit(1)}
const dir=path.resolve(root,m[1]);
if(!fs.existsSync(dir)||!fs.statSync(dir).isDirectory()){
  console.error(`ASSET CHECK FAIL: ${m[1]} does not exist at ${dir}`);
  console.error('Make sure the complete ZIP was extracted and run npm commands from the project root.');
  process.exit(1);
}
const required=['index.html','app.js','styles.css','sw.js'];
const missing=required.filter(f=>!fs.existsSync(path.join(dir,f)));
if(missing.length){console.error(`ASSET CHECK FAIL: missing static assets: ${missing.join(', ')}`);process.exit(1)}
console.log(`ASSET CHECK PASS: ${m[1]} exists with ${required.length} required frontend files.`);
