import fs from 'node:fs/promises';
import path from 'node:path';
export async function readEvents(){
  const p=path.join(process.cwd(),'data','events.json');
  return JSON.parse(await fs.readFile(p,'utf8'));
}
export function normalizeEvents(events, now=new Date()){
  const today=now.toISOString().slice(0,10);
  return events.map(e=>{
    const end=e.endDate||e.date;
    return {...e,status:end<today?'archive':'upcoming'};
  });
}
