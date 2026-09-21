import fs from 'node:fs';
import { extractOfficialSeatLayoutCandidates } from '../lib/official-monitor.js';
import { resolveOfficialSeatMap } from '../api/seat-map-image.js';
import { getVenueLayout } from '../data/multi-venue-geometry.js';

let ok=true;const fail=(m,x='')=>{console.error('FAIL',m,x);ok=false;};
const officialCdn='https://networksites.livenationinternational.com/networksites/ho2pada2/site-map.jpg?height=572&rmode=max&width=1000';
const html=`<!doctype html><html><body><h2>◎ 場域圖</h2><img alt="Site Map.jpg" src="${officialCdn}"></body></html>`;
const ranked=extractOfficialSeatLayoutCandidates(html,'https://www.livenation.com.tw/aespa-tpe');
if(!ranked.some(x=>x.url===officialCdn)) fail('Live Nation official CDN image was not discovered',ranked);

const calls=[];
const fetchImpl=async (url,opts={})=>{
  calls.push({url:String(url),referer:opts?.headers?.referer||''});
  if(String(url)==='https://www.livenation.com.tw/aespa-tpe') return new Response(html,{status:200,headers:{'content-type':'text/html; charset=utf-8'}});
  if(String(url)===officialCdn) return new Response(new Uint8Array([0xff,0xd8,0xff,0xdb,1,2,3,4]),{status:200,headers:{'content-type':'image/jpeg'}});
  return new Response('not found',{status:404,headers:{'content-type':'text/plain'}});
};
const found=await resolveOfficialSeatMap('https://www.livenation.com.tw/aespa-tpe',{fetchImpl,hints:['臺北大巨蛋','taipei-dome','aespa']});
if(found.resolved!==officialCdn || found.type!=='image/jpeg' || found.buf.length<4) fail('resolver did not return official CDN image bytes',found);
const cdnCall=calls.find(x=>x.url===officialCdn);
if(!cdnCall?.referer?.includes('livenation.com.tw')) fail('official CDN fetch did not use Live Nation referer',cdnCall);

const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
if(!app.includes('const displayProbe=displayRaw||machineRaw')) fail('display proxy still ignores explicit official display image');
if(!app.includes('livenationinternational\\.com')) fail('browser official-map trust list missing Live Nation CDN');
const resolver=fs.readFileSync(new URL('../api/seat-map-image.js',import.meta.url),'utf8');
if(!resolver.includes('livenationinternational.com')) fail('server resolver allowlist missing Live Nation CDN');
const layout=getVenueLayout('aespa-complexity-taipei-dome-2026');
if(!layout?.seatMapDisplayUrl?.startsWith('https://networksites.livenationinternational.com/')) fail('aespa preview does not point to official Live Nation image',layout?.seatMapDisplayUrl);
if(layout?.seatMapDisplayTrustedArchive) fail('official Live Nation image incorrectly treated as third-party archive');

if(!ok)process.exit(1);
console.log('NEUL v0.40.11 official-map checks passed · Live Nation CDN discovery · same-origin proxy bytes · official referer · aespa official field map preview');
