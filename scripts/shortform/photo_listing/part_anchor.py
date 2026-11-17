"""사진 속 차량 부위(시트 등받이·방석·헤드레스트·스티어링 휠 등)를 찾아 3D 스티커 위치·크기를 자동으로 정함.

2026-11-18 사용자: 「열선 통풍 매핑 어설퍼, 재발 안 되게」 「크기도 시트 크기에 맞춰 조절, 비율 판단」
- 이전: 사람이 눈대중으로 화면 좌표(x, y)와 크기(h)를 적음 → 사진 확대·이동(켄번스) 때 부위에서 미끄러지고, 크기도 부위와 무관
- 지금: 오픈소스 물체 찾기 모델 OWLv2(google/owlv2-base-patch16-ensemble, Apache-2.0)가 부위 상자를 찾고,
  스티커는 「사진 안 좌표(0~1) + 부위 폭 대비 크기」로 저장 → 렌더러가 매 프레임 사진 변환을 그대로 따라감

사용:  python3 part_anchor.py <사진> [--parts backrest,cushion] [--preview out.jpg]
출력:  {"backrest": {"u":..,"v":..,"size":..,"box":[x0,y0,x1,y1],"score":..}, ...}  (u·v·box는 사진 폭·높이 대비 0~1, size는 사진 폭 대비)
"""
import argparse
import json
import sys

PROMPTS = {
    'backrest': 'a seat backrest',
    'headrest': 'a headrest',
    'cushion': 'a seat cushion',
    'steering': 'a steering wheel',
    'screen': 'a touchscreen display',
    'wheel': 'a car wheel rim',
    'trunk': 'an open car trunk cargo space',
}
SIZE_RATIO = 0.32      # 스티커 높이 = 부위 상자 폭의 32% (사람 눈 기준 「부위 위에 얹힌」 크기, 2026-11-18 시트로 맞춤)
_MODEL = {}


def _load():
    if not _MODEL:
        from transformers import Owlv2Processor, Owlv2ForObjectDetection
        _MODEL['p'] = Owlv2Processor.from_pretrained('google/owlv2-base-patch16-ensemble')
        _MODEL['m'] = Owlv2ForObjectDetection.from_pretrained('google/owlv2-base-patch16-ensemble').eval()
    return _MODEL['p'], _MODEL['m']


def detect(img, keys, thr=0.12):
    import torch
    p, m = _load()
    q = [[PROMPTS[k] for k in keys]]
    inp = p(text=q, images=img, return_tensors='pt')
    with torch.no_grad():
        out = m(**inp)
    S = max(img.size)  # OWLv2는 정사각 패딩 기준 좌표
    r = p.post_process_grounded_object_detection(out, threshold=thr, target_sizes=torch.tensor([[S, S]]), text_labels=q)[0]
    W, H = img.size
    res = {k: [] for k in keys}
    for s, l, b in zip(r['scores'], r['labels'], r['boxes']):
        x0, y0, x1, y1 = [float(v) for v in b]
        x0, y0, x1, y1 = max(0, x0), max(0, y0), min(W, x1), min(H, y1)
        if x1 - x0 < 4 or y1 - y0 < 4:
            continue
        res[keys[int(l)]].append((float(s), (x0, y0, x1, y1)))
    return res


def _area(b):
    return (b[2] - b[0]) * (b[3] - b[1])


def _inside(c, b, pad=0.0):
    return b[0] - pad <= c[0] <= b[2] + pad and b[1] - pad <= c[1] <= b[3] + pad


def anchors(path, parts=('backrest', 'cushion')):
    from PIL import Image
    img = Image.open(path).convert('RGB')
    W, H = img.size
    keys = sorted(set(parts) | ({'headrest', 'backrest'} if {'backrest', 'cushion', 'headrest'} & set(parts) else set()))
    det = detect(img, keys)
    out = {}
    big = lambda b: _area(b) > 0.6 * W * H  # 사진 거의 전체를 덮는 상자는 버림(부위가 아님)

    seat = None
    if 'backrest' in det:
        # 가장 가까운(크고 확실한) 좌석 = 점수 × 넓이 최대
        cands = [(s * _area(b) ** .5, s, b) for s, b in det['backrest'] if not big(b)]
        if cands:
            _, sc, seat = max(cands)
    head = None
    if seat and det.get('headrest'):
        hs = [(s, b) for s, b in det['headrest'] if _inside(((b[0] + b[2]) / 2, (b[1] + b[3]) / 2), seat)
              and (b[1] + b[3]) / 2 < seat[1] + 0.45 * (seat[3] - seat[1])]
        if hs:
            head = max(hs)[1]
    if seat:
        top = head[3] if head else seat[1] + 0.25 * (seat[3] - seat[1])  # 헤드레스트 아래부터가 등받이 몸통
        body = (seat[0], top, seat[2], seat[3])
        if 'backrest' in parts:
            out['backrest'] = dict(u=(body[0] + body[2]) / 2 / W, v=(top + 0.42 * (body[3] - top)) / H,
                                   size=SIZE_RATIO * (body[2] - body[0]) / W, box=[body[0] / W, body[1] / H, body[2] / W, body[3] / H], score=round(sc, 2))
        if 'headrest' in parts and head:
            out['headrest'] = dict(u=(head[0] + head[2]) / 2 / W, v=(head[1] + head[3]) / 2 / H,
                                   size=0.5 * (head[2] - head[0]) / W, box=[head[0] / W, head[1] / H, head[2] / W, head[3] / H], score=None)
    if 'cushion' in parts and det.get('cushion'):
        cs = [(s, b) for s, b in det['cushion'] if not big(b)]
        if seat:  # 같은 좌석 방석: 등받이 아래쪽과 이어지는 것
            cs = [(s + (0.2 if b[1] < seat[3] and b[2] > seat[0] else 0), b) for s, b in cs]
        if cs:
            s, b = max(cs)
            out['cushion'] = dict(u=(b[0] + b[2]) / 2 / W, v=(b[1] + 0.45 * (b[3] - b[1])) / H,
                                  size=SIZE_RATIO * min(b[2] - b[0], 1.6 * (b[3] - b[1])) / W, box=[b[0] / W, b[1] / H, b[2] / W, b[3] / H], score=round(s, 2))
    for k in parts:
        if k in out or k not in det or not det[k]:
            continue
        s, b = max((s, b) for s, b in det[k] if not big(b)) if any(not big(b) for _, b in det[k]) else (None, None)
        if b:
            out[k] = dict(u=(b[0] + b[2]) / 2 / W, v=(b[1] + b[3]) / 2 / H, size=SIZE_RATIO * (b[2] - b[0]) / W,
                          box=[b[0] / W, b[1] / H, b[2] / W, b[3] / H], score=round(s, 2))
    for v in out.values():
        for kk in ('u', 'v', 'size'):
            v[kk] = round(v[kk], 4)
        v['box'] = [round(x, 4) for x in v['box']]
    return out


def preview(path, res, dst):
    from PIL import Image, ImageDraw
    img = Image.open(path).convert('RGB')
    W, H = img.size
    d = ImageDraw.Draw(img)
    for k, v in res.items():
        b = [v['box'][0] * W, v['box'][1] * H, v['box'][2] * W, v['box'][3] * H]
        d.rectangle(b, outline='yellow', width=3)
        r = v['size'] * W / 2
        d.ellipse([v['u'] * W - r, v['v'] * H - r, v['u'] * W + r, v['v'] * H + r], outline='red', width=3)
        d.text((b[0] + 4, b[1] + 4), k, fill='yellow')
    img.save(dst)


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('photo')
    ap.add_argument('--parts', default='backrest,cushion')
    ap.add_argument('--preview')
    a = ap.parse_args()
    res = anchors(a.photo, tuple(a.parts.split(',')))
    if a.preview:
        preview(a.photo, res, a.preview)
    json.dump(res, sys.stdout, ensure_ascii=False)
    print()
