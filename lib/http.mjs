export async function fetchText(url,{timeout=4500}={}){
  const ctl=new AbortController();
  const t=setTimeout(()=>ctl.abort(),timeout);
  try{
    const r=await fetch(url,{signal:ctl.signal,headers:{'user-agent':'Mozilla/5.0 (compatible; NEUL/0.57; +https://vercel.app)','accept-language':'zh-TW,zh;q=0.9,en;q=0.7'}});
    if(!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.text();
  } finally { clearTimeout(t); }
}
export function withTimeout(promise,ms=5000){
  return Promise.race([promise,new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms))]);
}
