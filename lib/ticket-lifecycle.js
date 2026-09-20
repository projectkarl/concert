const TAIPEI_TZ = 'Asia/Taipei';

function endOfTaipeiDayTs(iso='') {
  const d=new Date(iso);
  if(!Number.isFinite(d.getTime())) return NaN;
  const key=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:TAIPEI_TZ}).format(d);
  return new Date(`${key}T23:59:59+08:00`).getTime();
}

export function parseSaleTimelineDateTime(item={}, event={}) {
  const text=String(item?.time||'');
  const year=String(event?.start||'').slice(0,4)||String(new Date().getFullYear());
  const full=text.match(/(20\d{2})[\/.](\d{1,2})[\/.](\d{1,2})\s+(\d{1,2}):(\d{2})/);
  const short=text.match(/(^|\s)(\d{1,2})[\/.](\d{1,2})\s+(\d{1,2}):(\d{2})/);
  let parts=null;
  if(full) parts=[full[1],full[2],full[3],full[4],full[5]];
  else if(short) parts=[year,short[2],short[3],short[4],short[5]];
  if(!parts) return null;
  const [y,m,d,h,min]=parts.map((v,i)=>i===0?v:String(v).padStart(2,'0'));
  const dt=new Date(`${y}-${m}-${d}T${h}:${min}:00+08:00`);
  return Number.isFinite(dt.getTime())?dt:null;
}

export function saleTimelineCandidates(event={}) {
  const out=[];
  if(event.generalSale){
    const ts=new Date(event.generalSale).getTime();
    if(Number.isFinite(ts)) out.push({ts,iso:event.generalSale,label:'正式售票',priority:0,source:'generalSale'});
  }
  for(const item of (event.ticketTimeline||[])){
    if(!/(?:一般|正式|全面|公開|general|public|on[- ]?sale|售票|開賣|搶票)/i.test(String(item?.label||''))) continue;
    const d=parseSaleTimelineDateTime(item,event);
    if(d) out.push({ts:d.getTime(),iso:d.toISOString(),label:item.label||'售票',priority:1,source:'timeline',item});
  }
  return out.sort((a,b)=>a.priority-b.priority||a.ts-b.ts);
}

export function ticketSaleLifecycle(event={},now=Date.now()) {
  const candidates=saleTimelineCandidates(event).map(candidate=>({
    ...candidate,
    saleEndTs:endOfTaipeiDayTs(candidate.iso||event.generalSale)
  }));
  if(!candidates.length) return {state:'unknown',saleTs:NaN,saleEndTs:NaN,candidate:null};
  // If multiple official sale windows exist (membership/presale/general sale), surface the next
  // chronological one. Once today's sale window has started, keep "sale-day" through 23:59.
  const today=candidates.filter(x=>x.ts<=now&&Number.isFinite(x.saleEndTs)&&now<=x.saleEndTs).sort((a,b)=>b.ts-a.ts)[0];
  if(today) return {state:'sale-day',saleTs:today.ts,saleEndTs:today.saleEndTs,candidate:today};
  const next=candidates.filter(x=>x.ts>now).sort((a,b)=>a.ts-b.ts||a.priority-b.priority)[0];
  if(next) return {state:'pre-sale',saleTs:next.ts,saleEndTs:next.saleEndTs,candidate:next};
  const last=[...candidates].sort((a,b)=>b.ts-a.ts)[0];
  return {state:'post-sale-day',saleTs:last.ts,saleEndTs:last.saleEndTs,candidate:last};
}
