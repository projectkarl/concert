import fs from 'node:fs';
import handler from '../api/entertainment-news.js';

let ok=true; const fail=(m,x='')=>{console.error('FAIL',m,x);ok=false;};
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const news=fs.readFileSync(new URL('../news.js',import.meta.url),'utf8');
const sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');
const api=fs.readFileSync(new URL('../api/entertainment-news.js',import.meta.url),'utf8');
for(const id of ['entertainmentNews','newsGrid','newsStatus','newsSearchForm','newsSearchInput','newsRefreshBtn']) if(!html.includes(`id="${id}"`)) fail(`missing news UI: ${id}`);
for(const c of ['kr','tw','west','other']) if(!html.includes(`data-news-category="${c}"`)) fail(`missing news category: ${c}`);
if(!/data-news-category="kr"[^>]*aria-selected="true"/.test(html)) fail('Korean news is not default');
if(!/mobile-bottom a\[href="#planner"\]\{display:none\}/.test(css)) fail('mobile planner button not hidden');
if(!/grid-template-columns:repeat\(4,1fr\)/.test(css)) fail('mobile bottom nav not reflowed to 4 columns');
if(!/@media\(max-width:720px\)\{\.events-modal-close\{position:fixed;top:calc\(env\(safe-area-inset-top\) \+ 12px\);right:12px/.test(css)) fail('mobile event modal close not fixed in safe top area');
if(!/allEventsClose/.test(html)) fail('events close button missing');
if(!/news\.google\.com\/rss\/search/.test(api)) fail('free public news feed missing');
if(!/category: "kr"/.test(news) || !/loadNews\(\);/.test(news)) fail('news default load missing');
if(!sw.includes('"/news.js"')) fail('news.js not cached by PWA');

const fixture=`<?xml version="1.0"?><rss><channel><item><title><![CDATA[IVE 回歸新消息 - Test Media]]></title><link>https://example.com/a</link><pubDate>Sun, 20 Sep 2026 10:00:00 GMT</pubDate><description><![CDATA[<p>summary</p>]]></description><source url="https://example.com">Test Media</source></item><item><title>第二則 - Media B</title><link>https://example.com/b</link><pubDate>Sun, 20 Sep 2026 09:00:00 GMT</pubDate><source url="https://example.com">Media B</source></item></channel></rss>`;
const realFetch=global.fetch;
global.fetch=async (url)=>({ok:true,status:200,text:async()=>fixture});
let status=0, body=null, headers={};
const req={method:'GET',query:{category:'kr',q:'IVE'}};
const res={setHeader:(k,v)=>headers[k]=v,status(n){status=n;return this;},json(v){body=v;return this;}};
await handler(req,res);
global.fetch=realFetch;
if(status!==200) fail('news API mock status',status);
if(body?.category!=='kr'||body?.results?.length!==2) fail('news API parse',body);
if(body?.results?.[0]?.title!=='IVE 回歸新消息'||body?.results?.[0]?.source!=='Test Media') fail('news API title/source normalization',body?.results?.[0]);
if(!headers['Cache-Control']?.includes('s-maxage=900')) fail('news API cache header missing',headers);

if(!ok) process.exit(1);
console.log('NEUL news/mobile checks passed · mobile planner hidden · safe-area modal close · KR default · 4 news categories · RSS parser/cache');
