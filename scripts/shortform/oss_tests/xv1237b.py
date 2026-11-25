import json, copy, importlib.util
spec = importlib.util.spec_from_file_location('A', 'align_script_1237.py'); A = importlib.util.module_from_spec(spec); spec.loader.exec_module(A)
base = 'docs/shortform/oss_test1_aligner'; scripts = json.load(open(f'{base}/scripts.json'))
res = {}
for name in ['kkc_gwagen', 'taehyung_roma', 'hwan_huracan']:
    au = f'{base}/audio/{name}.mp3'; sc = ' '.join(scripts[name].split())
    raw = A.regroup(A.align(au, sc), sc); segs = A.speech_segments(A.load16k(au))
    json.dump({'raw': raw, 'segs': segs}, open(f'raw_{name}.json', 'w'), ensure_ascii=False)
    rows = []
    for si in range(1, len(segs)):  # 모든 쉼 뒤 시작에 차례로 +0.5초 주입(쉼 맞춤 켠 운영 경로)
        a = segs[si][0]
        snapped = copy.deepcopy(raw); A.snap(snapped, segs)
        k = min((i for i in range(len(snapped)) if snapped[i][0] >= a - 0.15), default=None)
        if k is None: continue
        bad = copy.deepcopy(snapped); bad[k][0] = round(bad[k][0] + 0.5, 3); bad[k][1] = max(bad[k][1], bad[k][0] + 0.1)
        if k + 1 < len(bad) and bad[k][0] >= bad[k+1][0]: continue  # 순서가 뒤집히는 경우 제외
        rb = A.gap_check(bad, segs, '/tmp/xv_bad.json')
        near = len(rb['warnings']) > 0
        fa = [w for w in bad if w[0] >= a - 0.15][0]
        rows.append({'word': bad[k][2], 'nearest_caught': near, 'first_after_caught': abs(fa[0] - a) > 0.30})
    res[name] = {'injected': len(rows), 'nearest_caught': sum(r['nearest_caught'] for r in rows), 'first_after_caught': sum(r['first_after_caught'] for r in rows), 'missed_by_nearest': [r['word'] for r in rows if not r['nearest_caught']]}
json.dump(res, open('xv1237_inject.json', 'w'), ensure_ascii=False, indent=1); print(json.dumps(res, ensure_ascii=False, indent=1))
