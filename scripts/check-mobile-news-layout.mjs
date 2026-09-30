import fs from 'node:fs';
const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');
let ok=true;
const need=(re,msg)=>{if(!re.test(css)){console.error('FAIL',msg);ok=false;}};
need(/v0\.40\.14\.1 · mobile entertainment-news containment/, 'mobile News fix marker missing');
need(/news-category-select select\{[^}]*font-size:16px/, 'mobile News select must stay >=16px to prevent iOS zoom');
need(/news-search input\{[^}]*font-size:16px/, 'mobile News search input must stay >=16px to prevent iOS zoom');
need(/news-grid\{[^}]*grid-template-columns:minmax\(0,1fr\)/, 'mobile News grid containment missing');
need(/news-card\{[^}]*width:100%[^}]*max-width:100%[^}]*overflow:hidden/, 'mobile News card containment missing');
need(/news-title\{[^}]*overflow-wrap:anywhere[^}]*word-break:break-word/, 'long mobile News headline wrapping missing');
if(!/(?:news-mobile-fix1|v0\.40\.15-auto-coverage-seatmap-recovery|v0\.40\.16-twcv-reference-queue|v0\.40\.17-expanded-auto-coverage)/.test(sw)){console.error('FAIL service-worker cache does not include mobile News fix or newer release');ok=false;}
if(!ok) process.exit(1);
console.log('NEUL mobile News layout checks passed · iOS zoom guard · 320px containment · long-title wrap');
