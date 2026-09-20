const ents={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '};
export function decodeHtml(s=''){return String(s).replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCharCode(parseInt(n,16))).replace(/&([a-z]+);/gi,(m,n)=>ents[n.toLowerCase()]??m)}
export function stripHtml(html=''){return decodeHtml(String(html).replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/(p|div|li|h\d|tr|section|article)>/gi,'\n').replace(/<[^>]+>/g,' ')).replace(/[ \t]+/g,' ').replace(/\n\s+/g,'\n').replace(/\n{3,}/g,'\n\n').trim()}
export function absolute(base,href=''){try{return new URL(decodeHtml(href),base).href}catch{return ''}}
export function anchors(html,base){const out=[];const re=/<a\b([^>]*)href=["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi;let m;while((m=re.exec(html))){out.push({href:absolute(base,m[2]),text:stripHtml(m[4]),raw:m[0],index:m.index})}return out}
export function images(html,base){const out=[];const re=/<img\b([^>]*?)src=["']([^"']+)["']([^>]*)>/gi;let m;while((m=re.exec(html))){const attrs=m[1]+m[3];const alt=(attrs.match(/alt=["']([^"']*)["']/i)||[])[1]||'';out.push({src:absolute(base,m[2]),alt:decodeHtml(alt),raw:m[0],index:m.index})}return out}
export function titleFromHtml(html=''){const og=(html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)||[])[1];const h1=(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)||[])[1];const title=(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1];return stripHtml(og||h1||title||'').replace(/\s*\|\s*tixcraft.*$/i,'').trim()}
export function unique(arr){return [...new Set(arr.filter(Boolean))]}
export function money(text=''){return unique([...String(text).matchAll(/(?:NT\$|NTD\.?|\$)\s*([0-9][0-9,]{2,5})/gi)].map(m=>+m[1].replace(/,/g,''))).filter(n=>n>=300&&n<=30000).sort((a,b)=>a-b)}
export function dateRange(text=''){
  const hits=[...String(text).matchAll(/(20\d{2})[\.\/\-年]\s*(\d{1,2})[\.\/\-月]\s*(\d{1,2})/g)].map(m=>`${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`);
  const uniq=unique(hits); return {date:uniq[0]||'',endDate:uniq[1]&&uniq[1]>=uniq[0]?uniq[1]:undefined};
}
export function sectionTokens(text=''){
  const pats=[/\b(?:ZONE\s*)?[A-Z]{1,2}\s*\d{0,2}(?:-\d+)?\b/gi,/\b[A-Z]\d[A-Z]?(?:-\d+)?區?\b/gi,/[紅黃紫綠藍橘橙] ?\d{1,2}區/g,/\bVIP(?:\s*ZONE)?\b/gi,/\b[123]F(?:樓)?\b/gi,/\b\d樓(?:看台|座位區|站席|站區)?/g];
  return unique(pats.flatMap(r=>[...String(text).matchAll(r)].map(m=>m[0].replace(/\s+/g,' ').trim().toUpperCase()))).slice(0,80)
}
