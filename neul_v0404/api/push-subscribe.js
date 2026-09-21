import crypto from 'node:crypto';
import { put } from '@vercel/blob';
export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'method not allowed'});
  if(process.env.ENABLE_WEB_PUSH!=='1')return res.status(503).json({error:'push not enabled'});
  const subscription=req.body?.subscription;
  if(!subscription?.endpoint)return res.status(400).json({error:'invalid subscription'});
  if(!process.env.VAPID_PUBLIC_KEY||!process.env.VAPID_PRIVATE_KEY||!process.env.VAPID_SUBJECT)return res.status(503).json({error:'push not configured'});
  try{
    const id=crypto.createHash('sha256').update(subscription.endpoint).digest('hex').slice(0,32);
    const payload={subscription,timezone:req.body?.timezone||'Asia/Taipei',artists:Array.isArray(req.body?.artists)?req.body.artists.slice(0,30):[],updatedAt:new Date().toISOString()};
    await put(`push-subs/${id}.json`,JSON.stringify(payload),{access:'private',contentType:'application/json',overwrite:true});
    return res.status(200).json({ok:true});
  }catch(e){return res.status(503).json({error:'blob store unavailable',detail:e.message});}
}
