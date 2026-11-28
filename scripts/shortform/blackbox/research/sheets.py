# -*- coding: utf-8 -*-
"""영상별 검출 요약 + 접촉 시트(상자 표시) 생성: 눈 검수용."""
import cv2, numpy as np, json, os, glob
W = r'C:\Users\Thinkbook\bbx_chip_survey'; OUT = os.path.join(W, 'out'); SH = os.path.join(W, 'sheets')
os.makedirs(SH, exist_ok=True)
COL = {'chip': (0, 0, 255), 'stroke': (255, 0, 0), 'color_stroke': (0, 200, 0)}
rows = []
for cc in ('de', 'nl', 'be'):
    for dj in glob.glob(os.path.join(OUT, cc, '*', 'res.json')):
        vid = os.path.basename(os.path.dirname(dj)); r = json.load(open(dj, encoding='utf-8'))
        fr = r['frames']; cnt = {'chip': 0, 'stroke': 0, 'color_stroke': 0}; t = {k: [] for k in cnt}
        for f in fr:
            for it in f['items']: cnt[it['kind']] += 1; t[it['kind']].append(f['t'])
        rows.append({'cc': cc, 'vid': vid, 'rank': r['rank'], 'dur': r['dur'], 'n_frames': len(fr), **{'n_' + k: v for k, v in cnt.items()},
                     **{'first_' + k: (min(v) if v else None) for k, v in t.items()}})
        if not fr: continue
        # 최대 12장 고르게
        pick = fr if len(fr) <= 12 else [fr[int(i * (len(fr) - 1) / 11)] for i in range(12)]
        tiles = []
        for f in pick:
            im = cv2.imread(os.path.join(OUT, cc, vid, f['file']))
            if im is None: continue
            for it in f['items']:
                x, y, w, h = it['box']; cv2.rectangle(im, (x, y), (x + w, y + h), COL[it['kind']], 2)
            cv2.putText(im, f"{f['t']:.1f}s", (6, 24), 0, 0.8, (0, 0, 0), 4); cv2.putText(im, f"{f['t']:.1f}s", (6, 24), 0, 0.8, (255, 255, 255), 2)
            tiles.append(cv2.resize(im, (180, 320)))
        while len(tiles) % 6: tiles.append(np.zeros((320, 180, 3), np.uint8))
        grid = np.vstack([np.hstack(tiles[i:i + 6]) for i in range(0, len(tiles), 6)])
        cv2.imwrite(os.path.join(SH, f'{cc}_{r["rank"]:03d}_{vid}.jpg'), grid, [cv2.IMWRITE_JPEG_QUALITY, 70])
json.dump(rows, open(os.path.join(W, 'summary.json'), 'w', encoding='utf-8'), ensure_ascii=False)
print(len(rows))
