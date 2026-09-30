import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(), pub=path.join(root,'public');
const files=['index.html','styles.css','app.js','webgl-venue.js','seat-map-intelligence.js','news.js','enhancements.js','i18n.js','storage.js','pwa.js','sw.js','manifest.webmanifest'];
const dirs=['data','assets','icons','vendor'];
fs.mkdirSync(pub,{recursive:true});
for(const rel of files){const src=path.join(root,rel),dst=path.join(pub,rel);if(!fs.existsSync(src))throw new Error(`prepare-public missing source: ${rel}`);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(src,dst)}
for(const rel of dirs){const src=path.join(root,rel),dst=path.join(pub,rel);if(!fs.existsSync(src))throw new Error(`prepare-public missing source dir: ${rel}`);fs.rmSync(dst,{recursive:true,force:true});fs.cpSync(src,dst,{recursive:true})}
console.log(`PREPARE PUBLIC PASS — ${files.length} files + ${dirs.length} directories synced to public/`);
