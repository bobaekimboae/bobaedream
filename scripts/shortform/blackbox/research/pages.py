# -*- coding: utf-8 -*-
"""영상당 대표 프레임 1장씩(종류별 최대 면적) → 30칸 검수 페이지."""
import cv2, numpy as np, json, os
W = r'C:\Users\Thinkbook\bbx_chip_survey'; OUT = os.path.join(W, 'out'); PG = os.path.join(W, 'pages'); os.makedirs(PG, exist_ok=True)
S = json.load(open(os.path.join(OUT, 'survey.json'), encoding='utf-8'))
COL = {'chip': (0, 0, 255), 'stroke': (255, 0, 0), 'color_stroke': (0, 200, 0)}
idx = []
for kind in ('chip', 'stroke', 'color_stroke'):
    tiles = []
    for cc in ('de', 'nl', 'be'):
        for vid in S[cc]['ids']:
            r = S[cc]['videos'][vid]; best = None
            for f in r['frames']:
                a = sum(i['area'] for i in f['items'] if i['kind'] == kind)
                if a and (best is None or a > best[0]): best = (a, f)
            if not best: continue
            f = best[1]; im = cv2.imread(os.path.join(OUT, cc, vid, f['file']))
            if im is None: continue
            for it in f['items']:
                if it['kind'] != kind: continue
                x, y, w, h = it['box']; cv2.rectangle(im, (x - 2, y - 2), (x + w + 2, y + h + 2), COL[kind], 2)
            im = cv2.resize(im, (216, 384)); lab = f"{len(tiles)} {cc}{r['rank']} {f['t']:.0f}s"
            cv2.rectangle(im, (0, 0), (216, 22), (0, 0, 0), -1); cv2.putText(im, lab, (4, 16), 0, 0.5, (255, 255, 255), 1)
            idx.append({'kind': kind, 'n': len(tiles), 'cc': cc, 'rank': r['rank'], 'vid': vid, 't': f['t'], 'file': f['file']})
            tiles.append(im)
    for p in range(0, len(tiles), 30):
        t = tiles[p:p + 30]
        while len(t) % 6: t.append(np.zeros((384, 216, 3), np.uint8))
        g = np.vstack([np.hstack(t[i:i + 6]) for i in range(0, len(t), 6)])
        cv2.imwrite(os.path.join(PG, f'{kind}_{p // 30:02d}.jpg'), g, [cv2.IMWRITE_JPEG_QUALITY, 72])
json.dump(idx, open(os.path.join(PG, 'index.json'), 'w', encoding='utf-8'))
print(len(idx))
