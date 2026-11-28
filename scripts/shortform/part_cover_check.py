"""칩·큰 숫자가 설명하는 부위를 덮는지 검사(SAM 2 부위 모양 기준).

예전 검사는 칩 상자와 부위 '상자'를 겹쳐 봤다. 상자는 부위 둘레 빈 곳까지 포함해서
칩이 빈 곳에 떠 있어도 '덮음'으로 나오거나, 반대로 부위를 실제로 가려도 놓쳤다.
여기서는 SAM 2(Apache-2.0, facebook/sam2.1-hiera-tiny)로 부위의 실제 모양(마스크)을 따서
칩 상자가 그 모양의 몇 %를 덮는지 잰다.

순서(칩마다):
1. 칩이 다 뜬 순간(t_box) 화면을 뽑는다. 칩이 뜨기 전 화면은 쓰지 않는다 — 칩과 함께 부위 당기기(T08)·
   스포트라이트(T05)가 화면을 확대해서 칩 전후 부위 자리가 다르다(r12 헤드램프 5.8초 → 6.1초 확인).
2. 칩 글자에서 부위 낱말을 찾아(휠·머플러·시트·계기판 …) OWLv2로 부위 상자를 찾는다. 못 찾으면 판정하지 않는다.
3. SAM 2에 상자를 주고 부위 마스크를 받는다. 칩이 가린 부분은 마스크에서 빠지므로 마스크의 볼록 껍질(빈 곳 채움)로 잰다.
4. 덮음 비율 = 칩 상자 안 껍질 넓이 ÷ 껍질 넓이. COVER_MAX(15%)를 넘으면 실패.
큰 숫자(bigs)는 차 전체 장면 위에 뜨는 것이 규칙이라 부위 낱말이 없으면 '참고'로만 보인다.
번호판 덮음은 edit_gate.py --plates가 따로 본다. 원본 화면은 고치지 않는다(읽기만).

사용:
  python3 part_cover_check.py 영상.mp4            → 칩마다 덮음 비율, 실패면 끝 코드 1
  python3 part_cover_check.py 영상.mp4 --sheet    → 영상.mp4.cover.jpg(마스크 초록·칩 빨강) 함께 저장
"""
import json
import os
import sys

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
COVER_MAX = 0.15
SAM = os.environ.get('SAM_MODEL', 'facebook/sam2.1-hiera-tiny')
# 칩 글자 속 부위 낱말 → OWLv2 영어 문장(앞에서부터 먼저 맞는 것)
PARTS = [
    ('헤드램프', 'a car headlight'), ('테일램프', 'a car taillight'), ('머플러', 'a car exhaust tip'),
    ('휠', 'a car wheel rim'), ('타이어', 'a car tire'), ('캘리퍼', 'a car brake caliper'),
    ('계기판', 'a car digital instrument cluster'), ('디스플레이', 'a car dashboard display screen'),
    ('화면', 'a car touchscreen display'), ('패들', 'a paddle shifter behind a steering wheel'),
    ('마네티노', 'a rotary drive mode switch on a steering wheel'), ('스티어링', 'a steering wheel'),
    ('기어', 'a car gear selector'), ('시트', 'a car seat'), ('카펫', 'a car floor carpet'),
    ('콕핏', 'a car dashboard'), ('트렁크', 'an open car trunk cargo space'), ('소프트탑', 'a convertible car soft top roof'),
    ('엔진', 'a car engine'), ('그릴', 'a car front grille'), ('도어', 'a car door'),
]
_SAM = None


def part_query(label):
    for ko, en in PARTS:
        if ko in label:
            return en
    return None


def _sam():
    global _SAM
    if _SAM is None:
        from transformers import Sam2Model, Sam2Processor
        _SAM = (Sam2Processor.from_pretrained(SAM), Sam2Model.from_pretrained(SAM).eval())
    return _SAM


def part_mask(rgb, box=None, point=None):
    """SAM 2 마스크(H×W bool). box=(x0,y0,x1,y1) 또는 point=(x,y)."""
    import torch
    from PIL import Image
    proc, net = _sam()
    img = Image.fromarray(rgb)
    kw = {'input_boxes': [[list(map(float, box))]]} if box else {'input_points': [[[list(map(float, point))]]], 'input_labels': [[[1]]]}
    inp = proc(images=img, return_tensors='pt', **kw)
    with torch.inference_mode():
        out = net(**inp, multimask_output=False)
    m = proc.post_process_masks(out.pred_masks, inp['original_sizes'])[0]
    return np.asarray(m).reshape(-1, rgb.shape[0], rgb.shape[1])[0] > 0


def owl_box(rgb, query, thr=0.15):
    sys.path.insert(0, os.path.join(HERE, 'photo_listing'))
    import part_anchor as PA
    from PIL import Image
    PA.PROMPTS['_q'] = query
    det = PA.detect(Image.fromarray(rgb), ['_q'], thr=thr).get('_q', [])
    H, W = rgb.shape[:2]
    det = [d for d in det if (d[1][2] - d[1][0]) * (d[1][3] - d[1][1]) < 0.9 * W * H]  # 화면 전체 상자는 버림
    return max(det)[1] if det else None


def _iou(a, b):
    iw = min(a[2], b[2]) - max(a[0], b[0]); ih = min(a[3], b[3]) - max(a[1], b[1])
    if iw <= 0 or ih <= 0:
        return 0.0
    i = iw * ih
    return i / ((a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - i)


def hull(mask):
    """마스크 덩어리들의 볼록 껍질(칩이 가려 빠진 구멍을 채움)."""
    pts = cv2.findNonZero(mask.astype(np.uint8))
    if pts is None:
        return mask
    out = np.zeros(mask.shape, np.uint8)
    cv2.fillConvexPoly(out, cv2.convexHull(pts), 1)
    return out > 0


def frame_at(cap, t):
    cap.set(cv2.CAP_PROP_POS_MSEC, max(0.0, t) * 1000)
    ok, f = cap.read()
    return cv2.cvtColor(f, cv2.COLOR_BGR2RGB) if ok else None


def check(video, sheet=False):
    P = json.load(open(video + '.plan.json', encoding='utf-8'))
    items = [c for c in (P.get('chips') or []) if c.get('box') and c.get('kind') != 'title'] + list(P.get('bigs') or [])
    cap = cv2.VideoCapture(video)
    rows, tiles = [], []
    for c in items:
        rgb = frame_at(cap, c['t_box'] + 0.05)
        if rgb is None:
            continue
        H, W = rgb.shape[:2]
        q = part_query(c['label'])
        bx = [max(0, int(v)) for v in c['box']]
        box = owl_box(rgb, q) if q else None
        if box and _iou(box, bx) >= 0.6:  # 노랑 칩 자체를 부위로 잡음
            box = None
        if not box:
            rows.append(dict(label=c['label'], kind=c.get('kind'), t=round(c['t_box'], 2), part=q or '-', found=False,
                             mask_ratio=0, cover=0.0, ok=True))
            continue
        mask = hull(part_mask(rgb, box=box))
        area = int(mask.sum())
        inter = int(mask[bx[1]:bx[3], bx[0]:bx[2]].sum())
        cover = inter / area if area else 0.0
        r = dict(label=c['label'], kind=c.get('kind'), t=round(c['t_box'], 2), part=q, found=True,
                 mask_ratio=round(area / (W * H), 3), cover=round(cover, 3), ok=cover <= COVER_MAX)
        rows.append(r)
        if sheet:
            v = rgb.copy()
            v[mask] = (0.5 * v[mask] + 0.5 * np.array([40, 220, 90])).astype(np.uint8)
            cv2.rectangle(v, (bx[0], bx[1]), (bx[2], bx[3]), (230, 40, 40), 8)
            if box:
                cv2.rectangle(v, tuple(map(int, box[:2])), tuple(map(int, box[2:])), (255, 255, 255), 4)
            tiles.append(cv2.resize(v, (270, int(270 * H / W))))
    cap.release()
    for r in rows:
        mark = '✓' if r['ok'] else '✗'
        if not r['found']:
            print(f"  · {r['label']}({r['t']:.1f}초) 부위 {r['part']} — 못 찾아 판정 안 함")
            continue
        print(f"  {mark} {r['label']}({r['t']:.1f}초) 부위 {r['part']} · 덮음 {r['cover'] * 100:.0f}%")
    if sheet and tiles:
        h = max(t.shape[0] for t in tiles)
        tiles = [np.pad(t, ((0, h - t.shape[0]), (0, 0), (0, 0))) for t in tiles]
        rows_img = [np.hstack(tiles[i:i + 6] + [np.zeros_like(tiles[0])] * (6 - len(tiles[i:i + 6]))) for i in range(0, len(tiles), 6)]
        cv2.imwrite(video + '.cover.jpg', cv2.cvtColor(np.vstack(rows_img), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 80])
    json.dump(rows, open(video + '.cover.json', 'w'), ensure_ascii=False, indent=1)
    return rows


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    res = check(sys.argv[1], '--sheet' in sys.argv)
    bad = [r for r in res if not r['ok']]
    print(f"부위 덮음 검사: {len(res)}개 중 판정 {sum(r['found'] for r in res)}개 · 실패 {len(bad)}개")
    sys.exit(1 if bad else 0)
