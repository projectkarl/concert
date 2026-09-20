import {buildEventDetail} from '../lib/pipeline.mjs';
export default async function handler(req,res){
  try{
    const url=String(req.query?.url||''); if(!url)return res.status(400).json({ok:false,error:'missing url'});
    const event=await buildEventDetail(url);
    res.setHeader('Cache-Control','s-maxage=21600, stale-while-revalidate=86400');
    res.status(200).json({ok:true,event});
  }catch(err){res.status(400).json({ok:false,error:String(err?.message||err)})}
}
