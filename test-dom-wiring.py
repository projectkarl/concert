
from pathlib import Path
import re, json
root=Path(__file__).parent
html=(root/'index.html').read_text()
app=(root/'app.js').read_text()
ids=set(re.findall(r'id="([^"]+)"',html))
selectors=set(re.findall(r"\$\('#([^']+)'\)",app))|set(re.findall(r'\$\("#([^"]+)"\)',app))
missing=sorted(selectors-ids)
if missing: raise SystemExit('missing DOM IDs: '+repr(missing))
v=json.loads((root/'vercel.json').read_text())
routes={x['source'] for x in v.get('rewrites',[])}
need={'/api/events','/api/health','/api/seatmap-image','/api/venue-geometry','/api/automation-scan'}
if not need<=routes: raise SystemExit('missing rewrites '+repr(need-routes))
if not v.get('crons'): raise SystemExit('cron missing')
print({'ids':len(ids),'selectors':len(selectors),'missing':missing,'rewrites':'ok','cron':v['crons']})
