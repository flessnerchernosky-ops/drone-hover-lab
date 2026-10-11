"""Independent CSV geometry/metric audit. Python standard library only."""
import csv,json,math
from pathlib import Path
p=Path(__file__).resolve().parent
with (p/'trace.csv').open(encoding='utf-8',newline='') as f:
    metadata=json.loads(f.readline().split(' ',2)[2]); rows=list(csv.DictReader(f))
arm='target_x' in rows[0]
expected=int((12 if arm else 20)/metadata['dt'])
bench=json.loads((p/'benchmarks.json').read_text(encoding='utf-8'))
entry=next(e for e in bench['entries'] if e['settings']==metadata['settings'])
for metric in entry['metrics']:
    group=[r for r in rows if r['kind']==metric['kind']]
    assert len(group)==expected
    errors=[]; late=[]; near=0
    for index,r in enumerate(group,1):
        v={k:float(x) for k,x in r.items() if k!='kind'}
        assert all(math.isfinite(x) for x in v.values())
        assert abs(v['time']-index*metadata['dt'])<1e-9
        if arm:
            x=math.cos(v['q1'])+.8*math.cos(v['q1']+v['q2'])
            y=math.sin(v['q1'])+.8*math.sin(v['q1']+v['q2'])
            assert math.hypot(x-v['x'],y-v['y'])<1e-10
            err=math.hypot(x-v['target_x'],y-v['target_y'])
            assert abs(v['u1'])<=6 and abs(v['u2'])<=6
            near+=int(err<=.06)*metadata['dt']
        else:
            err=math.hypot(v['x'],v['z']-1.5)
            assert 0<=v['applied_left']<=9 and 0<=v['applied_right']<=9
            assert v['z']>=0
            near+=int(not v['crashed'] and err<.1)*metadata['dt']
        assert abs(err-v['error'])<1e-10
        errors.append(err**2)
        if v['time']>(8 if arm else 15)+1e-9:late.append(err**2)
    assert abs(math.sqrt(sum(errors)/len(errors))-metric['rmse'])<1e-10
    assert abs(math.sqrt(sum(late)/len(late))-metric['late_rmse'])<1e-10
    assert abs(near-metric['near_seconds' if arm else 'hover_seconds'])<1e-9
print(f'Independent geometry and metric audit passed: {len(rows)} rows')
