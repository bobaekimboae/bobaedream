"""1번 시험 — 두 도구가 0.10초 넘게 갈리는 낱말의 소리 판정, 도구 쌍 일반판 (2026-11-25, 시안 마스터)
  python3 tiebreak2.py C E   → results/tiebreak_C_E.csv
판정법은 tiebreak.py와 같다(두 후보 ±0.15초 안 스펙트럼 플럭스 최대 = 소리 시작, 0.02초 넘게 가까운 쪽 승).
클립 경계가 말 중간이라는 지적을 받은 s02·s04·s05·s20 낱말은 따로 센다.
"""
import csv, json, os, subprocess, sys
from collections import Counter
import numpy as np
H = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, H)
from compare import map_words
a, b = sys.argv[1], sys.argv[2]
rows = json.load(open(f'{H}/sentences20.json'))
res = {t: json.load(open(f'{H}/results/{t}.json')) for t in (a, b)}
CUT = ('s02_', 's04_', 's05_', 's20_')
def flux_of(p):
    x = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True).stdout, np.float32)
    S = np.log1p(np.abs(np.fft.rfft(np.array([x[i:i + 512] * np.hanning(512) for i in range(0, len(x) - 512, 160)]), axis=1)))
    return np.r_[0, np.maximum(S[1:] - S[:-1], 0).sum(1)]
out = []
for r in rows:
    ma, mb = map_words(r['words'], res[a][r['id']]['tokens']), map_words(r['words'], res[b][r['id']]['tokens'])
    fl = None
    for k, w in enumerate(r['words']):
        if not ma[k] or not mb[k] or abs(ma[k][0] - mb[k][0]) <= 0.10:
            continue
        if fl is None:
            fl = flux_of(f"{H}/{r['clip_file']}")
        x, y = ma[k][0], mb[k][0]
        i0, i1 = max(0, int((min(x, y) - 0.15) / 0.01)), min(len(fl) - 1, int((max(x, y) + 0.15) / 0.01))
        t = (i0 + int(np.argmax(fl[i0:i1 + 1]))) * 0.01 + 0.016
        ea, eb = abs(x - t), abs(y - t)
        win = b if eb < ea - 0.02 else a if ea < eb - 0.02 else '비김'
        out.append([r['id'], k + 1, w, x, y, round(t, 3), round(ea, 3), round(eb, 3), win, 'Y' if r['id'].startswith(CUT) else ''])
with open(f'{H}/results/tiebreak_{a}_{b}.csv', 'w', newline='', encoding='utf-8-sig') as f:
    cw = csv.writer(f); cw.writerow(['sentence_id', 'word_no', 'word', f'{a}_start', f'{b}_start', 'onset_flux', f'{a}_err', f'{b}_err', 'closer', 'cut_clip']); cw.writerows(out)
for name, sub in (('전체', out), ('잘린 클립 제외', [o for o in out if not o[-1]])):
    c = Counter(o[8] for o in sub)
    print(name, len(sub), dict(c), f'{a} 중앙값', round(float(np.median([o[6] for o in sub])), 3) if sub else '-', f'{b} 중앙값', round(float(np.median([o[7] for o in sub])), 3) if sub else '-')
