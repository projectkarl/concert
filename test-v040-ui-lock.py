from pathlib import Path
import hashlib,re,json
base=Path('/mnt/data/NEUL-v0.41-SourceVision')
out=Path('/mnt/data/neul_v040_auto3d')
for f in ['index.html','styles.css']:
    a=(base/f).read_bytes(); b=(out/f).read_bytes()
    assert a==b, f'{f} changed'
    print(f, hashlib.sha256(a).hexdigest())
app=(out/'app.js').read_text()
assert 'color:0xe3ded3' in app, 'light venue floor missing'
for token in ['analyzeSeatMapVision','analyzeSeatMapLabels','sectionMapping','buildStage(e)','buildArena(e)','buildRig()']:
    assert token in app, token
v=json.loads((out/'vercel.json').read_text())
assert any(c['path']=='/api/automation-scan' for c in v.get('crons',[]))
print('UI_LOCK PASS; 3D/AUTOMATION tokens PASS')
