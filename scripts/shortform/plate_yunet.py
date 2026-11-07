"""번호판 찾기(LPD-YuNet int8, OpenCV Zoo, Apache-2.0) — nuxt-review/app/components/video/plate-detect.ts 를 파이썬으로 옮김.
입력: BGR 화면(numpy). 출력: 원본 화소 좌표 네 점 목록. 영상에서는 몇 장면마다 찾고 사이를 이어 붙인다."""
import math, os
import numpy as np
import onnxruntime as ort

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MODEL = os.path.join(ROOT, 'nuxt-review', 'public', 'models', 'lpd-yunet-2023mar-int8.onnx')
IW, IH = 320, 240
MS = [[10, 16, 24], [32, 48], [64, 96], [128, 192, 256]]
ST = [8, 16, 32, 64]
_sess = None


def _priors():
    f2 = [((IH + 1) // 2) // 2, ((IW + 1) // 2) // 2]
    fm = [[f2[0] // 2, f2[1] // 2]]
    for _ in range(3):
        fm.append([fm[-1][0] // 2, fm[-1][1] // 2])
    p = []
    for k, (fh, fw) in enumerate(fm):
        for i in range(fh):
            for j in range(fw):
                for s in MS[k]:
                    p.append(((j + .5) * ST[k] / IW, (i + .5) * ST[k] / IH, s / IW, s / IH))
    return np.array(p, np.float32)


P = _priors()


def _run(img, sx, sy, sw, sh, th):
    global _sess
    if _sess is None:
        _sess = ort.InferenceSession(MODEL, providers=['CPUExecutionProvider'])
    import cv2
    crop = img[int(sy):int(sy + sh), int(sx):int(sx + sw)]
    x = cv2.resize(crop, (IW, IH)).astype(np.float32).transpose(2, 0, 1)[None]
    out = dict(zip([o.name for o in _sess.get_outputs()], _sess.run(None, {_sess.get_inputs()[0].name: x})))
    loc, conf, iou = out['loc'].reshape(-1, 14), out['conf'].reshape(-1, 2), out['iou'].reshape(-1)
    sc = np.sqrt(conf[:, 1] * np.clip(iou, 0, 1))
    res = []
    for k in np.where(sc >= th)[0]:
        q = []
        for a in (4, 6, 10, 12):
            q.append(((P[k, 0] + loc[k, a] * .1 * P[k, 2]) * sw + sx, (P[k, 1] + loc[k, a + 1] * .1 * P[k, 3]) * sh + sy))
        res.append((q, float(sc[k])))
    return res


def _bbox(q):
    xs, ys = [p[0] for p in q], [p[1] for p in q]
    return min(xs), min(ys), max(xs), max(ys)


def _plausible(q, W, H):
    x0, y0, x1, y1 = _bbox(q)
    w, h = x1 - x0, y1 - y0
    if w <= 0 or h <= 0:
        return False
    r = w / h
    return 1.3 < r < 7 and w * h / (W * H) < .06 and x0 > -.02 * W and y0 > -.02 * H and x1 < 1.02 * W and y1 < 1.02 * H


def _iou(a, b):
    A, B = _bbox(a), _bbox(b)
    iw = max(0, min(A[2], B[2]) - max(A[0], B[0])); ih = max(0, min(A[3], B[3]) - max(A[1], B[1]))
    u = (A[2] - A[0]) * (A[3] - A[1]) + (B[2] - B[0]) * (B[3] - B[1]) - iw * ih
    return iw * ih / u if u > 0 else 0


def detect(img, th=.5):
    H, W = img.shape[:2]
    found = []
    # 세로 화면은 위·가운데·아래 4:3 칸으로 나눠 본다(모델 입력이 가로 4:3)
    tile_h = W * 3 / 4
    ys = np.linspace(0, H - tile_h, 4)
    for y in ys:
        found += [r for r in _run(img, 0, y, W, tile_h, th) if _plausible(r[0], W, H)]
    for y in np.linspace(0, H - tile_h * .6, 6):  # 작은 번호판용 확대 칸
        for x in (0, W * .4):
            found += [r for r in _run(img, x, y, W * .6, tile_h * .6, th) if _plausible(r[0], W, H)]
    found.sort(key=lambda r: -r[1])
    keep = []
    for q, s in found:
        if not any(_iou(k, q) > .3 for k, _ in keep):
            keep.append((q, s))
    return [k for k, _ in keep[:3]]
