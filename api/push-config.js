export default function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const publicKey=process.env.VAPID_PUBLIC_KEY||'';
  const enabled=process.env.ENABLE_WEB_PUSH==='1'&&Boolean(publicKey&&process.env.VAPID_PRIVATE_KEY&&process.env.VAPID_SUBJECT);
  res.status(200).json({enabled,publicKey:enabled?publicKey:''});
}
