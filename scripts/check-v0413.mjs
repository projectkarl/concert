import fs from 'node:fs';
const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
let ok=true;
const newsApi=read('api/entertainment-news.js');
const news=read('news.js');
const html=read('index.html');
const events=read('api/events.js');
const twcv=read('lib/twconcertview-discovery.js');
for(const [cond,msg] of [
  [/when:\$\{maxAgeDays\}d/.test(newsApi)&&/const maxAgeDays = 7/.test(newsApi),'news is not capped to recent 7 days'],
  [/sort\(\(a, b\) => Date\.parse\(b\.publishedAt/.test(newsApi),'news API is not newest-first'],
  [/slice\(0, 24\)/.test(newsApi),'news API result cap missing'],
  [/id="newsMoreBtn"/.test(html)&&/visible: 8/.test(news)&&/state\.visible\+state\.step/.test(news),'news progressive More flow missing'],
  [/DISCOVERY_SNAPSHOT_PATH/.test(events)&&/upcoming-only; no archived events/.test(events),'upcoming-only discovery snapshot policy missing'],
  [/liveUpcoming\.length < 120/.test(events)&&/readDiscoverySnapshot/.test(events),'thin-discovery recovery guard missing'],
  [/rootFastPathComplete/.test(twcv)&&/Math\.ceil\(merged\.referenceCount\*0\.9\)/.test(twcv),'316 coverage fast-path reconciliation missing'],
  [/if\(!rootComplete\)/.test(twcv)&&/buildTwConcertViewCalendarUrls/.test(twcv),'month fallback scan missing'],
  [/const ARCHIVE_LIMIT = 20/.test(events),'Archive 20 regression']
]){ if(!cond){ console.error(msg); ok=false; } }
if(!ok)process.exit(1);
console.log('v0.40.13 verified · recent-first news + progressive More + upcoming-only discovery snapshot + fast 316 coverage reconciliation');
