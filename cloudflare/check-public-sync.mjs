import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=process.cwd(),pub=path.join(root,'public');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const files=['index.html','styles.css','app.js','webgl-venue.js','seat-map-intelligence.js','news.js','enhancements.js','i18n.js','storage.js','pwa.js','sw.js','manifest.webmanifest','data/events.js','data/venues.js','data/artists.js','data/discovery.js','data/multi-venue-geometry.js','data/taipei-dome-geometry.js','data/reference-bootstrap.js'];
const bad=[];
for(const rel of files){const a=path.join(root,rel),b=path.join(pub,rel);if(!fs.existsSync(a)||!fs.existsSync(b)){bad.push(`${rel}: missing ${!fs.existsSync(a)?'root':'public'}`);continue}const ha=hash(a),hb=hash(b);if(ha!==hb)bad.push(`${rel}: root ${ha} != public ${hb}`)}
if(bad.length){console.error('PUBLIC SYNC FAIL\n'+bad.join('\n'));process.exit(1)}
console.log(`PUBLIC SYNC PASS — ${files.length} runtime files root/public identical`);
