import fs from 'node:fs';
const required=['index.html','style.css','app.js','vercel.json','api/health.mjs','api/events.mjs','data/events.json'];
let ok=true;
for(const f of required){if(!fs.existsSync(new URL(f,import.meta.url))){console.error('MISSING',f);ok=false}}
const events=JSON.parse(fs.readFileSync(new URL('data/events.json',import.meta.url),'utf8'));
const ids=new Set();for(const e of events){if(ids.has(e.id)){console.error('DUPLICATE',e.id);ok=false}ids.add(e.id);if(!e.date||!e.venue||!e.title){console.error('BAD EVENT',e.id);ok=false}}
if(!ok)process.exit(1);console.log(`PASS ${required.length} files / ${events.length} events`);
