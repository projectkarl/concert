import {discoverEvents} from '../lib/pipeline.mjs';
export default async function handler(req,res){
  try{const data=await discoverEvents();res.setHeader('Cache-Control','s-maxage=600, stale-while-revalidate=21600');res.status(200).json({ok:true,updatedAt:new Date().toISOString(),...data})}
  catch(err){res.status(500).json({ok:false,error:String(err?.message||err)})}
}
