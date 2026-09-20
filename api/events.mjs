import {readEvents,normalizeEvents} from '../lib/events.mjs';
export default async function handler(req,res){
  try{const events=normalizeEvents(await readEvents());res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=3600');res.status(200).json({ok:true,updatedAt:new Date().toISOString(),events})}
  catch(err){res.status(500).json({ok:false,error:String(err?.message||err)})}
}
