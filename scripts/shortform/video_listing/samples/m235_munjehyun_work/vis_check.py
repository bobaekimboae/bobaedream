# 말하는 낱말 시각에 그 부위가 화면에 있는지 독립 확인(OWLv2) — 문장 시작 / 칩 낱말 / 문장 끝 3시점
# 사용: python3 vis_check.py <car.json> <out.json>   (작업 폴더에서: words5.json · map_spec.json · src.mp4)
import json, sys, cv2
sys.path.insert(0, '/home/claude/bobaedream/scripts/shortform/photo_listing')
import part_anchor as pa
from PIL import Image
car, out = sys.argv[1], sys.argv[2]
C = json.load(open(car))['cuts']; W = json.load(open('words_clean.json')); SP = json.load(open('map_spec.json'))['cuts']
cap = cv2.VideoCapture('src.mp4'); res = {}
for i, c in enumerate(C):
    k = c['key']
    if k not in SP or 'chip_word' not in c: continue
    t0 = (W[c['start_word']][1] - 0.12) if i else 0.0; t1 = (W[C[i + 1]['start_word']][1] - 0.12) if i + 1 < len(C) else W[-1][2]
    rate = min(2.0, (c['src'][1] - c['src'][0]) / (t1 - t0)); rows = []
    for name, t in (('start', t0 + 0.27), ('word', W[c['chip_word']][1] + 0.1), ('end', t1 - 0.2)):
        st = min(c['src'][1], c['src'][0] + (t - t0) * rate); cap.set(cv2.CAP_PROP_POS_FRAMES, round(st * 30)); ok, fr = cap.read()
        im = Image.fromarray(cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)).resize((540, 960)); pa.PROMPTS['_q'] = SP[k]['prompt']
        d = [x for x in pa.detect(im, ['_q'], thr=0.05)['_q'] if (x[1][2] - x[1][0]) * (x[1][3] - x[1][1]) < 0.6 * 540 * 960]
        s, b = max(d) if d else (0, None)
        rows.append([name, round(st, 2), round(float(s), 3), [round(b[0] / 540, 3), round(b[1] / 960, 3), round(b[2] / 540, 3), round(b[3] / 960, 3)] if b else None])
    res[k] = rows; print(k, rows, flush=True)
json.dump(res, open(out, 'w'), ensure_ascii=False, indent=1)
