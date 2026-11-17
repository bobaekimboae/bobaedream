"""컷마다 사진 아랫선 ↔ 자막 글자 윗선 간격 크로스체크 (python3 xcheck_caps.py <차 폴더>, BBM_FADE=1이면 페이드판)
각 컷 가운데 시각의 화면을 그려 자막 흰/노랑 글자 윗줄을 찾고, 상자 사진이면 사진 아랫선과의 간격을 잰다. 시트 jpg도 만든다."""
import sys, runpy, os
import numpy as np
from PIL import Image, ImageDraw
k = sys.argv[1]
sys.argv = ['c', k, '--plan']
try: g = runpy.run_path('common.py', run_name='notmain')
except SystemExit: pass
starts, ends, CUTS, CAPS = g['starts'], g['ends'], g['CUTS'], g['CAPS']
rows, ims = [], []
for ci, c in enumerate(CUTS):
    # 그 컷에서 자막이 나오는 시각(칩 숫자 숨김 피해서 컷 70% 지점부터 찾음)
    cand = [cp for cp in CAPS if starts[ci] <= cp['s'] < ends[ci]]
    T = (cand[-1]['s'] + cand[-1]['e']) / 2 if cand else (starts[ci] + ends[ci]) / 2
    base = Image.fromarray(g['base_frame'](T)).convert('RGBA')
    ov = g['overlay'](T)
    a = np.asarray(ov).astype(int)
    m = (a[..., 3] > 200) & (a[..., 0] > 235) & (a[..., 1] > 235) & (a[..., 2] > 235)   # 자막 흰 글자(노랑 칩 제외)
    m[:1000] = False
    ys = np.where(m.sum(1) > 6)[0]
    top = int(ys[0]) if len(ys) else None
    band = g['photo_band'](T)
    bb = int(band[1]) if band else None
    gap = (top - bb) if (top is not None and bb is not None) else None
    rows.append((ci, c[0], c[1], round(T, 2), bb, top, gap))
    base.alpha_composite(ov)
    im = base.convert('RGB')
    d = ImageDraw.Draw(im)
    if bb: d.line([(0, bb), (W := im.width, bb)], fill=(255, 0, 0), width=4)
    if top: d.line([(0, top), (im.width, top)], fill=(0, 255, 0), width=4)
    ims.append(im.resize((216, 384)))
for r in rows:
    print('컷%2d p%02d %-10s %5.2f초  사진아랫선 %-5s 자막윗선 %-5s 간격 %s' % r)
gaps = [r[6] for r in rows if r[6] is not None]
tops = [r[5] for r in rows if r[5] is not None and r[1] not in getattr(g['C'], 'CAP_CY_PHOTOS', {})]
print('간격 종류', sorted(set(gaps)), '| 일반 컷 자막 윗선 종류', sorted(set(tops)))
cols = 8
sh = Image.new('RGB', (216 * cols, 384 * ((len(ims) + cols - 1) // cols)), 'white')
for i, im in enumerate(ims): sh.paste(im, (216 * (i % cols), 384 * (i // cols)))
sh.save(f"{k}_xcheck{'_fade' if os.environ.get('BBM_FADE') == '1' else ''}.jpg", quality=82)
