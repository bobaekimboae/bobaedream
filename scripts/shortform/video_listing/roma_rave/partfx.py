"""손이 닿은 부위 외곽선 효과 (SAM 2.1 마스크 + skia 안티에일리어싱).
- 부위 외곽선이 손끝 쪽에서부터 그려지고(0~0.35초), 빛 알갱이가 외곽선을 따라 한 바퀴 돎(0.2~0.9초)
- 부위 안쪽은 노랑 얇게 채웠다가 빠짐, 손은 늘 효과 앞(손 마스크로 가림)
- 콜아웃 선은 외곽선 위 고정점에서 출발(마스크가 끝나면 화면 전체 움직임만 따라감)
"""
import numpy as np, cv2, skia
from PIL import Image

W, H = 1080, 1920
YEL = (245, 242, 0)
_cache = {}
MAXK = {'paddle': 25}   # 마스크가 옆 부위로 번지기 전에 끊을 프레임


def load(key, G):
    if key not in _cache:
        try:
            d = np.load(G + f'pseg/{key}.npz'); part = d['part'].astype(np.float32); hand = d['hand']
            sm = [];
            prev = None
            for m in part:   # 시간 방향 부드럽게(외곽선 떨림 줄임)
                prev = m if prev is None else prev * 0.45 + m * 0.55; sm.append(prev.copy())
            _cache[key] = (np.stack(sm), hand)
        except FileNotFoundError:
            _cache[key] = None
    return _cache[key]


def _xform(m, ccx, ccy, z):
    A = np.float32([[2 * z, 0, W / 2 - ccx * z], [0, 2 * z, H / 2 - ccy * z]])   # 540x960 마스크 → 화면
    return cv2.warpAffine(m, A, (W, H), flags=cv2.INTER_LINEAR)


def _contours(mf):
    b = (cv2.GaussianBlur(mf, (0, 0), 4) > 0.5).astype(np.uint8)
    cs, _ = cv2.findContours(b, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    out = []
    for c in cs:
        if cv2.contourArea(c) < 2500: continue
        p = c[:, 0, :].astype(np.float32); n = len(p)
        if n < 20: continue
        k = 9; pad = np.concatenate([p[-k:], p, p[:k]]); ker = np.ones(2 * k + 1) / (2 * k + 1)
        p = np.stack([np.convolve(pad[:, 0], ker, 'valid'), np.convolve(pad[:, 1], ker, 'valid')], 1)[::3]
        out.append(p)
    return out


def _path(p, tip, skip=None):
    # 손끝에 가장 가까운 점부터 시작 · 화면 테두리에 붙은 구간은 그리지 않음(가짜 직선 방지)
    s = int(np.argmin(((p - np.array(tip)) ** 2).sum(1))); p = np.roll(p, -s, 0)
    edge = (p[:, 0] < 6) | (p[:, 0] > W - 7) | (p[:, 1] < 6) | (p[:, 1] > H - 7)
    if skip is not None:   # 손 가장자리 위 구간은 그리지 않음(손가락 따라 그려지는 선 방지)
        xi = np.clip(p[:, 0].astype(int), 0, W - 1); yi = np.clip(p[:, 1].astype(int), 0, H - 1); edge = edge | (skip[yi, xi] > 0)
    pa = skia.Path(); pen = False; closed = not edge.any()
    for i, q in enumerate(p):
        if edge[i]: pen = False; continue
        if not pen: pa.moveTo(float(q[0]), float(q[1])); pen = True
        else: pa.lineTo(float(q[0]), float(q[1]))
    if closed: pa.close()
    return pa


def _paint(color, a, width=None, blur=None, fill=False):
    pt = skia.Paint(AntiAlias=True, Color=skia.Color(color[0], color[1], color[2], int(max(0, min(255, a)))))
    if fill: pt.setStyle(skia.Paint.kFill_Style)
    else:
        pt.setStyle(skia.Paint.kStroke_Style); pt.setStrokeWidth(width); pt.setStrokeJoin(skia.Paint.kRound_Join); pt.setStrokeCap(skia.Paint.kRound_Cap)
    if blur: pt.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, blur))
    return pt


def ease(x): x = min(1.0, max(0.0, x)); return 1 - (1 - x) ** 3


def outline(cv, key, G, k, ccx, ccy, z, tip):
    """k: 닿은 프레임부터 몇 번째 프레임. 반환 (cv, 고정점 or None)"""
    D = load(key, G)
    if D is None or k < 0: return cv, None
    part, hand = D; n = min(len(part), MAXK.get(key, 999)); j = min(k, n - 1); u = k / 30
    end = n / 30; fade = 1.0 - ease((u - (end - 0.45)) / 0.45) if u > end - 0.45 else 1.0
    if k >= n: fade = 0.0
    mf = _xform(part[j], ccx, ccy, z); hm = _xform(hand[j].astype(np.float32), ccx, ccy, z)
    SK = cv2.dilate((hm > 0.5).astype(np.uint8), np.ones((15, 15), np.uint8))
    cs = _contours(np.maximum(mf, (hm > 0.5).astype(np.float32) * (cv2.dilate((mf > 0.5).astype(np.uint8), np.ones((41, 41), np.uint8)) > 0)))
    if not cs: return cv, None
    big = max(cs, key=lambda c: cv2.contourArea(c.astype(np.int32)))
    ok_ = (big[:, 0] > 40) & (big[:, 0] < W - 40) & (big[:, 1] > 330) & (big[:, 1] < H - 40)
    if ok_.sum() > 5:
        cand = big[ok_]; top = cand[int(np.argmin(cand[:, 1] + 0.15 * np.abs(cand[:, 0] - cand[:, 0].mean())))]
    else:
        top = big[int(np.argmin(((big - np.array(tip)) ** 2).sum(1)))]
    anchor = (float(top[0]), float(top[1]))
    if fade <= 0: return cv, anchor
    arr = np.zeros((H, W, 4), np.uint8); surf = skia.Surface(arr); c = surf.getCanvas()
    g = ease(u / 0.35)
    # 안쪽 채움(노랑 얇게) — 0.1~0.6초
    fa = 70 * ease(u / 0.12) * (1 - ease((u - 0.35) / 0.4)) * fade
    for p in cs:
        pa = _path(p, tip, SK); pf = _path(p, tip)
        if fa > 1: c.drawPath(pf, _paint(YEL, fa, fill=True))
        tr = skia.Path(pa)
        if g < 1:
            eff = skia.TrimPathEffect.Make(0, g * 0.5); eff2 = skia.TrimPathEffect.Make(1 - g * 0.5, 1)
            for e in (eff, eff2):
                for args in ((YEL, 200 * fade, 22, 10), (YEL, 255 * fade, 7, None), ((255, 255, 235), 255 * fade, 2.5, None)):
                    pt = _paint(args[0], args[1], args[2], args[3]); pt.setPathEffect(e); c.drawPath(pa, pt)
        else:
            c.drawPath(pa, _paint(YEL, 170 * fade, 22, 10)); c.drawPath(pa, _paint(YEL, 255 * fade, 7)); c.drawPath(pa, _paint((255, 255, 235), 255 * fade, 2.5))
        if 0.2 < u < 1.0:   # 외곽선 따라 도는 빛 알갱이
            q = ease((u - 0.2) / 0.8)
            for s0 in (0.0, 0.5):
                a0 = (s0 + q * 0.5) % 1.0
                pt = _paint((255, 255, 255), 255 * fade * (1 - max(0, (u - 0.85) / 0.15)), 9, 3); pt.setPathEffect(skia.TrimPathEffect.Make(a0, min(1.0, a0 + 0.045))); c.drawPath(pa, pt)
    lay = surf.makeImageSnapshot().toarray(colorType=skia.kRGBA_8888_ColorType, alphaType=skia.kUnpremul_AlphaType)
    hm = cv2.GaussianBlur(hm, (0, 0), 2)
    lay[..., 3] = (lay[..., 3].astype(np.float32) * (1 - np.clip(hm, 0, 1))).astype(np.uint8)   # 손이 앞
    cv.alpha_composite(Image.fromarray(lay, 'RGBA'))
    return cv, anchor


def callout(cv, ax, ay, ex, ey, u, dot=True):
    """고정점(ax,ay) → 꺾인 흰 선 → (ex,ey). skia 안티에일리어싱 + 그림자"""
    if u < 0: return cv
    k1 = ease(u / 0.18); k2 = ease((u - 0.18) / 0.12)
    mx = ax + (ex - ax) * 0.0; p1 = (ex - (ex - ax) * 0.0, ey)   # 대각 끝(ex 쪽 30% 전)
    p1 = (ax + (ex - ax) * 0.55, ey)
    arr = np.zeros((H, W, 4), np.uint8); surf = skia.Surface(arr); c = surf.getCanvas()
    pa = skia.Path(); pa.moveTo(ax, ay); pa.lineTo(ax + (p1[0] - ax) * k1, ay + (p1[1] - ay) * k1)
    if k2 > 0: pa.lineTo(p1[0] + (ex - p1[0]) * k2, ey)
    sh = _paint((0, 0, 0), 150, 6, 4); c.save(); c.translate(2, 3); c.drawPath(pa, sh)
    if dot: c.drawCircle(ax, ay, 8, _paint((0, 0, 0), 140, fill=True, blur=3))
    c.restore()
    c.drawPath(pa, _paint((255, 255, 255), 255, 5))
    if dot:
        c.drawCircle(ax, ay, 7, _paint((255, 255, 255), 255, fill=True))   # 작은 흰 점(노랑 원은 손가락과 겹쳐 어색)
    lay = surf.makeImageSnapshot().toarray(colorType=skia.kRGBA_8888_ColorType, alphaType=skia.kUnpremul_AlphaType)
    cv.alpha_composite(Image.fromarray(lay, 'RGBA'))
    return cv


def holes(cv, key, G, k, ccx, ccy, z, tip):
    """타공 패널: 손끝에서 퍼지는 파동처럼 구멍 하나하나에 외곽선이 켜짐"""
    D = load(key, G)
    if D is None or k < 0: return cv, None
    part, hand = D; n = len(part); j = min(k, n - 1); u = k / 30
    fade = 1.0 - ease((u - 0.9) / 0.4)
    mf = _xform(part[j], ccx, ccy, z) > 0.5; hm = _xform(hand[j].astype(np.float32), ccx, ccy, z)
    g = cv2.cvtColor(np.array(cv.convert('RGB')), cv2.COLOR_RGB2GRAY)
    reg = mf & (hm < 0.3)
    if reg.sum() < 1000: return cv, None
    th = np.percentile(g[reg], 30); b = ((g < th) & reg).astype(np.uint8) * 255
    b = cv2.morphologyEx(b, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
    cs, _ = cv2.findContours(b, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    cs = [c for c in cs if 1200 < cv2.contourArea(c) < 60000]
    if not cs: return cv, None
    cen = [c[:, 0, :].mean(0) for c in cs]; dist = [float(np.hypot(*(q - np.array(tip)))) for q in cen]
    near = cs[int(np.argmin(dist))][:, 0, :]; top = near[int(np.argmin(near[:, 1]))]; anchor = (float(top[0]), float(top[1])) if k < 2 else None   # 고정점은 처음에 한 번만
    if fade <= 0: return cv, anchor
    arr = np.zeros((H, W, 4), np.uint8); surf = skia.Surface(arr); c = surf.getCanvas()
    for cc, dd in zip(cs, dist):
        v = u - dd / 1800.0   # 파동 속도 1800px/초
        if v < 0: continue
        a = ease(v / 0.12) * (1 - 0.55 * ease((v - 0.25) / 0.35)) * fade
        p = cv2.convexHull(cc)[:, 0, :].astype(np.float32)   # 둥근 사각 구멍 → 볼록 껍질로 매끈하게
        p = np.concatenate([np.linspace(p[i], p[(i + 1) % len(p)], max(2, int(np.hypot(*(p[(i + 1) % len(p)] - p[i])) / 6)), endpoint=False) for i in range(len(p))])
        kk = 4; pad = np.concatenate([p[-kk:], p, p[:kk]]); ker = np.ones(2 * kk + 1) / (2 * kk + 1)
        p = np.stack([np.convolve(pad[:, 0], ker, 'valid'), np.convolve(pad[:, 1], ker, 'valid')], 1)[::2]
        pa = skia.Path(); pa.moveTo(*p[0]); [pa.lineTo(float(q[0]), float(q[1])) for q in p[1:]]; pa.close()
        c.drawPath(pa, _paint(YEL, 60 * a, fill=True)); c.drawPath(pa, _paint(YEL, 180 * a, 16, 8))
        c.drawPath(pa, _paint(YEL, 255 * a, 5)); c.drawPath(pa, _paint((255, 255, 235), 230 * a, 2))
    lay = surf.makeImageSnapshot().toarray(colorType=skia.kRGBA_8888_ColorType, alphaType=skia.kUnpremul_AlphaType)
    lay[..., 3] = (lay[..., 3].astype(np.float32) * (1 - np.clip(cv2.GaussianBlur(hm, (0, 0), 2), 0, 1))).astype(np.uint8)
    cv.alpha_composite(Image.fromarray(lay, 'RGBA'))
    return cv, anchor


# ── 나세르식 부위 색 바꾸기: 질감(밝기)은 두고 색만 흰색/부위색으로 + 얇은 테두리 + 빛 쓸기 ──
STR = {'defl': 0.45, 'top': 0.6}
NOBORDER = {'wheel'}   # 캘리퍼는 바퀴살 사이로 보여 테두리가 복잡 → 색만   # 넓은 부위는 색을 옅게
TINT = {'exh': 'white', 'sill': 'white', 'grille': 'white', 'paddle': (225, 30, 45), 'defl': (225, 30, 45), 'pdisp': (40, 200, 255), 'wheel': (255, 214, 0), 'top': 'white', 'eng': (225, 30, 45)}


def _env(u, n):
    end = n / 30
    return ease(u / 0.15) * (1 - ease((u - (end - 0.35)) / 0.35))


def recolor(cv, key, G, k, ccx, ccy, z, tip):
    D = load(key, G)
    if D is None or k < 0: return cv, None
    part, hand = D; n = min(len(part), MAXK.get(key, 999)); j = min(k, n - 1); u = k / 30
    mf = _xform(part[j], ccx, ccy, z); hm = cv2.GaussianBlur(_xform(hand[j].astype(np.float32), ccx, ccy, z), (0, 0), 2)
    cs = _contours(mf)
    if not cs: return cv, None
    big = max(cs, key=lambda c: cv2.contourArea(c.astype(np.int32)))
    ok_ = (big[:, 0] > 40) & (big[:, 0] < W - 40) & (big[:, 1] > 330) & (big[:, 1] < H - 40)
    cand = big[ok_] if ok_.sum() > 5 else big
    top = cand[int(np.argmin(cand[:, 1] + 0.15 * np.abs(cand[:, 0] - cand[:, 0].mean())))]; anchor = (float(top[0]), float(top[1]))
    e = _env(u, n) if k < n else 0.0
    if e <= 0.01: return cv, anchor
    m = np.clip(cv2.GaussianBlur(mf, (0, 0), 1.5), 0, 1) * (1 - np.clip(hm, 0, 1))
    ys, xs = np.nonzero(m > 0.5)
    if len(xs) == 0: return cv, anchor
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    rgb = np.array(cv.convert('RGB')); roi = rgb[y0:y1, x0:x1].astype(np.float32); mm = m[y0:y1, x0:x1][..., None] * e * STR.get(key, 1.0)
    lum = cv2.cvtColor(roi.astype(np.uint8), cv2.COLOR_RGB2GRAY).astype(np.float32)[..., None]
    c = TINT.get(key, 'white')
    if c == 'white':
        out = 255 - (255 - lum) * 0.42; out = np.concatenate([out * 0.98, out * 0.99, out], 2)   # 살짝 차가운 흰색
    else:
        lab = cv2.cvtColor(roi.astype(np.uint8), cv2.COLOR_RGB2LAB).astype(np.float32)
        tl = cv2.cvtColor(np.uint8([[c]]), cv2.COLOR_RGB2LAB)[0, 0].astype(np.float32)
        lab[..., 0] = np.clip(lab[..., 0] * 0.75 + 55, 0, 255); lab[..., 1] = tl[1]; lab[..., 2] = tl[2]
        out = cv2.cvtColor(lab.astype(np.uint8), cv2.COLOR_LAB2RGB).astype(np.float32)
    if 0.12 < u < 0.75:   # 빛 쓸기(왼→오)
        sx = x0 + (x1 - x0 + 240) * ease((u - 0.12) / 0.63) - 120; xx = np.arange(x0, x1)[None, :, None]
        out = out + 90 * np.exp(-((xx - sx) / 55.0) ** 2)
    roi = roi * (1 - mm * 0.9) + np.clip(out, 0, 255) * (mm * 0.9); rgb[y0:y1, x0:x1] = np.clip(roi, 0, 255).astype(np.uint8)
    base = Image.fromarray(rgb).convert('RGBA')
    # 얇은 테두리(흰색 + 부위색 번짐)
    arr = np.zeros((H, W, 4), np.uint8); surf = skia.Surface(arr); cvs = surf.getCanvas()
    gc = (255, 255, 255) if c == 'white' else c
    SK = cv2.dilate((hm > 0.5).astype(np.uint8), np.ones((15, 15), np.uint8))
    for p in ([] if key in NOBORDER else _contours(np.maximum(mf, (hm > 0.5).astype(np.float32) * (cv2.dilate((mf > 0.5).astype(np.uint8), np.ones((41, 41), np.uint8)) > 0)))):
        pa = _path(p, tip, SK); cvs.drawPath(pa, _paint(gc, 150 * e, 14, 9)); cvs.drawPath(pa, _paint((255, 255, 255), 235 * e, 2.5))
    lay = surf.makeImageSnapshot().toarray(colorType=skia.kRGBA_8888_ColorType, alphaType=skia.kUnpremul_AlphaType)
    lay[..., 3] = (lay[..., 3].astype(np.float32) * (1 - np.clip(hm, 0, 1))).astype(np.uint8)
    base.alpha_composite(Image.fromarray(lay, 'RGBA'))
    cv.paste(base); return cv, anchor


import os as _os
STYLE = _os.environ.get('PART_STYLE', 'recolor')


def fx(cv, key, G, k, ccx, ccy, z, tip):
    if key == 'grille': return holes(cv, key, G, k, ccx, ccy, z, tip)
    if key == 'wheel':   # 타이어 터치: 캘리퍼 색 + 휠·타이어 외곽선
        cv, an = recolor(cv, key, G, k, ccx, ccy, z, tip); cv, _ = outline(cv, 'wheelfull', G, k, ccx, ccy, z, tip); return cv, an
    return (recolor if STYLE == 'recolor' else outline)(cv, key, G, k, ccx, ccy, z, tip)


# ── 인트로 차 윤곽: SAM(이 차만) × BiRefNet(선명한 가장자리) ──
_IM = {}


def car_matte(G, fi, frame=None):
    if 'd' not in _IM:
        try: _IM['d'] = (np.load(G + 'pseg/intro_sam.npz')['m'], np.load(G + 'pseg/intro_bir.npz')['a'])
        except FileNotFoundError: _IM['d'] = None
    if _IM['d'] is None: return None
    sm, ba = _IM['d']; i = min(fi, len(sm) - 1, len(ba) - 1)
    s = cv2.dilate(cv2.resize(sm[i], (W, H), interpolation=cv2.INTER_NEAREST), np.ones((35, 35), np.uint8)).astype(np.float32)
    s = cv2.GaussianBlur(s, (0, 0), 6)
    a = cv2.resize(ba[i], (W, H), interpolation=cv2.INTER_CUBIC).astype(np.float32) / 255
    m = np.clip(a * s, 0, 1)
    n, lab, st, _ = cv2.connectedComponentsWithStats((m > 0.5).astype(np.uint8), 8)
    if n > 1: keep = lab == (1 + int(np.argmax(st[1:, 4]))); m = m * cv2.dilate(keep.astype(np.uint8), np.ones((9, 9), np.uint8))
    hole = (m < 0.5).astype(np.uint8); nh, lh, sh, _ = cv2.connectedComponentsWithStats(hole, 4)   # 차 안쪽 구멍(유리 등) 메우기
    for j in range(1, nh):
        x_, y_, w_, h_, ar = sh[j]
        if x_ > 0 and y_ > 0 and x_ + w_ < W and y_ + h_ < H and ar < 60000: m[lh == j] = 1.0
    if frame is not None:   # 가이드 필터: 원본 프레임 가장자리에 윤곽을 붙임(선명·정확)
        m = cv2.ximgproc.guidedFilter(guide=frame, src=m.astype(np.float32), radius=5, eps=2e-3)
        m = np.clip((m - 0.5) * 1.8 + 0.5, 0, 1)
    pv = _IM.get('prev')
    if pv is not None and pv[0] == fi - 1: m = m * 0.7 + pv[1] * 0.3   # 프레임 간 떨림 줄이기
    _IM['prev'] = (fi, m)
    return Image.fromarray((m * 255).astype(np.uint8))


def rim(cv, mz, t):
    """차 실루엣 가장자리에 얇은 흰 빛 + 0.25~1.1초 왼→오 빛 쓸기"""
    a = np.array(mz).astype(np.float32) / 255
    edge = np.clip(a - cv2.erode(a, np.ones((5, 5), np.uint8)), 0, 1)
    glow = cv2.GaussianBlur(edge, (0, 0), 6) * 1.6
    base = 0.35 * ease(t / 0.3)
    xx = np.arange(W)[None, :]; sx = -200 + (W + 400) * ease((t - 0.25) / 0.85)
    sweep = np.exp(-((xx - sx) / 140.0) ** 2) if 0.25 < t < 1.2 else 0
    k = np.clip((edge * 1.0 + glow * 0.6) * (base + 1.4 * sweep), 0, 1)
    rgb = np.array(cv.convert('RGB')).astype(np.float32)
    rgb = rgb + (255 - rgb) * k[..., None]
    return Image.fromarray(rgb.astype(np.uint8)).convert('RGBA')
