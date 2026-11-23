"""컷별 부위 자동 찾기(OWLv2) — 눈대중 시작 점·상자 비율을 대신함. 2026-11-24 cha10 v2.
쓰기:  G350_DIR=<작업 폴더>/ python3 car_map.py <map_spec.json> [--out map.json]
map_spec: {"cuts":{"g2":{"scene":[2.8,5.37],"prompt":"a car headlight"}, ...}}  scene = 하드 컷 사이 구간(초, 원본 시각)
결과: 컷마다 0.25초 간격 프레임에서 가장 점수 높은 상자 → best_t, 가운데(0~1), 상자 넓이 비율, 점수 0.6배 이상이 이어지는 구간(src 후보)."""
import os, sys, json, cv2
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'photo_listing'))
import part_anchor as pa
from PIL import Image
G = os.environ['G350_DIR']; spec = json.load(open(sys.argv[1], encoding='utf-8'))
out = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else G + 'map_auto.json'
cap = cv2.VideoCapture(G + 'src.mp4'); fps = cap.get(cv2.CAP_PROP_FPS); res = {}
for key, c in spec['cuts'].items():
    pa.PROMPTS['_q'] = c['prompt']; rows = []; t = c['scene'][0] + 0.1
    while t < c['scene'][1] - 0.05:
        cap.set(cv2.CAP_PROP_POS_FRAMES, round(t * fps)); ok, fr = cap.read()
        if not ok: break
        im = Image.fromarray(cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)).resize((540, 960))
        d = pa.detect(im, ['_q'], thr=0.05)['_q']
        d = [x for x in d if (x[1][2] - x[1][0]) * (x[1][3] - x[1][1]) < 0.6 * 540 * 960]   # 화면 전체 상자는 버림
        if d:
            s, b = max(d); rows.append((round(t, 2), round(s, 3), [round(b[0] / 540, 3), round(b[1] / 960, 3), round(b[2] / 540, 3), round(b[3] / 960, 3)]))
        else: rows.append((round(t, 2), 0.0, None))
        t += 0.25
    best = max(rows, key=lambda r: r[1])
    good = [r[0] for r in rows if r[1] >= 0.6 * best[1] and r[1] > 0]
    b = best[2]
    res[key] = {'prompt': c['prompt'], 'best_t': best[0], 'score': best[1], 'center': [round((b[0] + b[2]) / 2, 3), round((b[1] + b[3]) / 2, 3)] if b else None,
                'frac': round((b[2] - b[0]) * (b[3] - b[1]), 4) if b else None, 'box': b, 'good_range': [good[0], good[-1]] if good else None, 'rows': rows}
    print(key, res[key]['best_t'], res[key]['score'], res[key]['center'], res[key]['frac'], res[key]['good_range'], flush=True)
json.dump(res, open(out, 'w'), ensure_ascii=False, indent=1)
