import webpush from 'web-push';
import { list, get } from '@vercel/blob';
import { seedEvents } from '../data/events.js';
async function streamText(stream){let out='';const dec=new TextDecoder();for await(const chunk of stream)out+=dec.decode(chunk,{stream:true});return out+dec.decode();}
export default async function handler(req,res){
  if(process.env.CRON_SECRET&&req.headers.authorization!==`Bearer ${process.env.CRON_SECRET}`)return res.status(401).json({ok:false});
  if(process.env.ENABLE_WEB_PUSH!=='1')return res.status(200).json({ok:true,enabled:false,sent:0});
  const pub=process.env.VAPID_PUBLIC_KEY,priv=process.env.VAPID_PRIVATE_KEY,subject=process.env.VAPID_SUBJECT;
  if(!pub||!priv||!subject)return res.status(200).json({ok:true,enabled:false,sent:0});
  webpush.setVapidDetails(subject,pub,priv);
  const now=Date.now(),horizon=now+26*3600000;
  let eventPool=seedEvents;
  try{
    const host=req.headers.host,proto=host?.includes('localhost')?'http':'https';
    if(host){const r=await fetch(`${proto}://${host}/api/events`,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(9000)});if(r.ok){const body=await r.json();if(Array.isArray(body.events)&&body.events.length)eventPool=body.events;}}
  }catch{}
  const candidates=eventPool.filter(e=>{const sale=e.generalSale?new Date(e.generalSale).getTime():0,show=e.start?new Date(e.start).getTime():0;return (sale>now&&sale<horizon)||(show>now&&show<horizon);});
  if(!candidates.length)return res.status(200).json({ok:true,enabled:true,sent:0,reason:'nothing due'});
  const {blobs}=await list({prefix:'push-subs/',limit:1000});let sent=0,failed=0;
  for(const blob of blobs){try{const r=await get(blob.pathname,{access:'private',useCache:false});if(!r?.stream)continue;const data=JSON.parse(await streamText(r.stream));const relevant=candidates.find(e=>!data.artists?.length||data.artists.some(a=>String(a).toLowerCase()===String(e.artist).toLowerCase()))||candidates[0];const sale=relevant.generalSale&&new Date(relevant.generalSale).getTime()>now&&new Date(relevant.generalSale).getTime()<horizon;await webpush.sendNotification(data.subscription,JSON.stringify({title:`NEUL · ${relevant.artist}`,body:sale?'售票節點將在 24 小時內到來，請回官方頁面確認。':'演出將在 24 小時內開始，請確認最新入場公告。',url:'/',eventId:relevant.id}));sent++;}catch{failed++;}}
  return res.status(200).json({ok:true,enabled:true,sent,failed});
}
