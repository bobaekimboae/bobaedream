import sys, json, os, copy, importlib.util
spec = importlib.util.spec_from_file_location('A', 'align_script_1237.py'); A = importlib.util.module_from_spec(spec); spec.loader.exec_module(A)
base = 'docs/shortform/oss_test1_aligner'
scripts = json.load(open(f'{base}/scripts.json'))
def first_after(W, a, back=0.15):
    c = [w for w in W if w[0] >= a - back]
    return c[0] if c else W[-1]
out = {}
for name in ['kkc_gwagen', 'taehyung_roma', 'hwan_huracan']:
    au = f'{base}/audio/{name}.mp3'
    sc = ' '.join(scripts[name].split())
    raw = A.regroup(A.align(au, sc), sc)
    segs = A.speech_segments(A.load16k(au))
    snp = A.snap(copy.deepcopy(raw), segs) or None
    snp = snp if snp else None
    snapped = copy.deepcopy(raw); A.snap(snapped, segs)
    r_on = A.gap_check(snapped, segs, f'/tmp/xv_{name}_on.json')
    r_off = A.gap_check(copy.deepcopy(raw), segs, f'/tmp/xv_{name}_off.json')
    # 독립 신호: 쉼 맞춤이 어절을 얼마나 옮겼나
    moved = [(raw[i][2], round(snapped[i][0]-raw[i][0], 3)) for i in range(len(raw)) if abs(snapped[i][0]-raw[i][0]) > 0.001]
    # 가장 가까운 어절 대신 '말소리 시작 뒤 첫 어절'
    fa = [round(first_after(snapped, a)[0]-a, 3) for a, _ in segs[1:]]
    out[name] = dict(words=len(raw), onsets=r_on['onsets'], on_max=r_on['max_abs_diff'], on_warn=len(r_on['warnings']), on_zero=len(r_on['zero_length']),
                     off_max=r_off['max_abs_diff'], off_warn=[(w['word'], w['diff']) for w in r_off['warnings']], off_zero=r_off['zero_length'],
                     snap_moved=moved, snap_moved_gt030=[m for m in moved if abs(m[1]) > 0.30],
                     first_after_max=max(map(abs, fa)) if fa else 0, first_after_gt030=[d for d in fa if abs(d) > 0.30], seg0=round(segs[0][0],3), w0=snapped[0][0])
    # 일부러 문장 첫 어절을 +0.5초 밀고(쉼 맞춤 끈 경우) 가장 가까운 어절 방식이 놓치는지
    bad = copy.deepcopy(raw)
    a = segs[3][0]; k = min(range(len(bad)), key=lambda i: abs(bad[i][0]-a)); bad[k][0] += 0.5; bad[k][1] = max(bad[k][1], bad[k][0]+0.1)
    rb = A.gap_check(bad, segs, '/tmp/xv_bad.json')
    out[name]['inject+0.5_word'] = bad[k][2]; out[name]['inject_caught_nearest'] = any(w['word']==bad[k][2] for w in rb['warnings'])
    out[name]['inject_caught_firstafter'] = abs(first_after(bad, a)[0]-a) > 0.30
json.dump(out, open('xv1237_result.json','w'), ensure_ascii=False, indent=1)
print(json.dumps(out, ensure_ascii=False, indent=1))
