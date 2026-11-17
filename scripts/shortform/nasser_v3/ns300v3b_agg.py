import os, glob, json
import numpy as np
B = r'C:\Users\Thinkbook\Documents\autostudio_analysis'
R = [json.load(open(f)) for f in glob.glob(os.path.join(B, 'ns300v3b', '*.json'))]
def q(a, ps=(25, 50, 75)):
    a = [x for x in a if x is not None]
    return 'n=%d ' % len(a) + ' / '.join('%.2f' % np.percentile(a, p) for p in ps) if a else 'n=0'
O = []; P = O.append; per = {}
for r in R:
    rows = r['rows']
    if not rows: continue
    fs = [[x for x in fa if x[4] >= 0.8] for t, fa, b in rows]
    face = np.mean([len(f) > 0 for f in fs]); big = np.mean([any(x[3] >= 0.12 for x in f) for f in fs]); two = np.mean([len(f) >= 2 for f in fs])
    fy = [x[1] + x[3] / 2 for f in fs for x in f]
    capy = []; low = 0; up = 0
    for t, fa, b in rows:
        k = int(np.argmax(b))
        if b[k] >= 0.025:
            capy.append(k * 0.05 + 0.025)
            if 11 <= k <= 14: low += 1
            elif 3 <= k <= 10: up += 1
    n = len(rows)
    per[r['vid']] = {'face': face, 'big': big, 'two': two, 'face_y': float(np.median(fy)) if fy else None,
                     'cap_any': len(capy) / n, 'cap_low': low / n, 'cap_up': up / n, 'cap_y': float(np.median(capy)) if capy else None,
                     'face_first1s': any(len(f) > 0 for (t, fa, b), f in zip(rows, fs) if t < 1.0)}
V = list(per.values())
P('videos %d' % len(V))
P('presenter face share (score>=0.8, any size) ' + q([v['face'] for v in V], (10, 25, 50, 75, 90)))
P('face share >=50%% of frames: %.0f%% videos · >=30%%: %.0f%%' % (100 * np.mean([v['face'] >= 0.5 for v in V]), 100 * np.mean([v['face'] >= 0.3 for v in V])))
P('close face (h>=12%% of frame) share ' + q([v['big'] for v in V]))
P('2+ faces share (skit/dialogue) ' + q([v['two'] for v in V]) + ' · videos with 2+ faces in >=20%% frames %.0f%%' % (100 * np.mean([v['two'] >= 0.2 for v in V])))
P('face vertical center ' + q([v['face_y'] for v in V]))
P('face in first 1s %.0f%%' % (100 * np.mean([v['face_first1s'] for v in V])))
P('outlined white text present in frames ' + q([v['cap_any'] for v in V]))
P('text in low band 55-75%% ' + q([v['cap_low'] for v in V]) + ' | upper 15-55%% ' + q([v['cap_up'] for v in V]))
P('text y median ' + q([v['cap_y'] for v in V], (10, 25, 50, 75, 90)))
mode_low = [v['cap_low'] >= 0.4 for v in V]; mode_up = [v['cap_up'] > v['cap_low'] and v['cap_up'] >= 0.2 for v in V]
P('format: word-caption low band (>=40%% frames) %.0f%% · upper stickers dominant %.0f%% · little text %.0f%%' % (100 * np.mean(mode_low), 100 * np.mean(mode_up), 100 * np.mean([v['cap_any'] < 0.2 for v in V])))
json.dump(per, open(os.path.join(B, 'ns300v3b_per.json'), 'w'))
open(os.path.join(B, 'ns300v3b_summary.txt'), 'w', encoding='utf-8').write('\n'.join(O)); print('\n'.join(O))
