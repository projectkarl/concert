import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
export default async function handler(req,res){
  res.setHeader('Cache-Control','public, s-maxage=21600, stale-while-revalidate=86400');
  try{
    const p=fileURLToPath(new URL('../data/venue-geometry.json',import.meta.url));
    const db=JSON.parse(await fs.readFile(p,'utf8'));
    const key=String(req.query?.venue||'').toLowerCase();
    if(!key) return res.status(200).json(db);
    const found=Object.entries(db.venues).find(([id,v])=>id===key||v.aliases.some(a=>a.toLowerCase()===key));
    if(!found) return res.status(404).json({error:'venue geometry not found'});
    return res.status(200).json({schemaVersion:db.schemaVersion,updatedAt:db.updatedAt,id:found[0],...found[1]});
  }catch(e){return res.status(500).json({error:'geometry unavailable',detail:String(e?.message||e)});}
}
