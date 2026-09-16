import crypto from 'node:crypto';
import { put } from '@vercel/blob';
export const config={api:{bodyParser:false}};
async function readForm(req){
  const chunks=[];for await(const chunk of req)chunks.push(chunk);return Buffer.concat(chunks);
}
export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'method not allowed'});
  if(process.env.ENABLE_FAN_SUBMISSIONS!=='1')return res.status(503).json({error:'fan submissions not enabled'});
  try{
    const contentType=req.headers['content-type']||'';
    if(!contentType.includes('multipart/form-data'))return res.status(400).json({error:'multipart required'});
    // Raw multipart is forwarded as a private review package. This keeps the zero-framework Function small and preserves the original upload for moderation.
    const body=await readForm(req);if(body.length>10*1024*1024)return res.status(413).json({error:'upload too large'});
    const id=`${Date.now()}-${crypto.randomBytes(5).toString('hex')}`;
    const blob=await put(`fan-view-submissions/${id}.multipart`,body,{access:'private',contentType,addRandomSuffix:false});
    await put(`fan-view-submissions/${id}.json`,JSON.stringify({id,contentType,size:body.length,status:'pending-review',createdAt:new Date().toISOString(),blobPathname:blob.pathname}),{access:'private',contentType:'application/json',addRandomSuffix:false});
    return res.status(200).json({ok:true,id,status:'pending-review'});
  }catch(e){return res.status(503).json({error:'submission storage unavailable',detail:e.message});}
}
