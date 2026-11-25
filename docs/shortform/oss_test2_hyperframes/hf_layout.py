"""HyperFrames 시험(교체 시험 2번)용 배치 계산 — 칩·흰 글자·말 자막을 HTML로 그릴 때 필요한 숫자만 낸다.

칠 판 고르기·배율·글자 자리는 g350_v5_lib.brush_box()와 같은 계산을 그대로 따른다(그림은 그리지 않음).
HTML 쪽은 고른 노션 원본 SVG를 같은 배율로 띄우고(mask), 글자는 같은 Pretendard 파일을 Chrome이 그린다.
"""
import os, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.path.insert(0, os.path.join(REPO, 'scripts/shortform/video_listing'))
import g350_v5_lib as L  # noqa: E402
from PIL import Image  # noqa: E402


def _svg_natural(name):
    a = L._shape(name, 1)
    return a.size


def chip_geom(s, size, title=False):
    """brush_box(s, XB(size), YEL, title_plate=title)와 같은 판·배율·글자 자리."""
    R = L.R; FF = R['chip']['fill_fit']; f = L.XB(size)
    b = L.tsize(s, f); tw, th = b[2] - b[0], b[3] - b[1]; cw = tw
    want_h = FF['band_to_ink'] * th; lo, hi = [k * th for k in FF['side_pad_ink']]
    TT = R['chip']['title_plate'] if title else None
    if TT:
        pl, pr = TT['side_pad_ink']; t0, b0, l0, r0 = L._paint_box(L._shape(TT['shape'], 1))
        best = (0, TT['shape'], (cw + (pl + pr) * th) / (r0 - l0))
    else:
        best = None
        for name in FF['shapes']:
            t0, b0, l0, r0 = L._paint_box(L._shape(name, 4)); sc = 4 * want_h / (b0 - t0)
            pad = ((r0 - l0) * sc / 4 - cw) / 2
            score = abs(pad - hi) if pad >= lo else 1e6 + (lo - pad)
            if best is None or score < best[0]: best = (score, name, sc)
    _, name, sc = best; a = L._shape(name, sc); top, bot, x0, x1 = L._paint_box(a)
    if not TT:
        def _band(al):
            t_, b_, l_, r_ = L._paint_box(al); xl = l_ + ((r_ - l_) - cw) // 2
            m_ = np.array(al)[:, max(0, xl):xl + cw] > 128; cols = [np.where(m_[:, i])[0] for i in range(m_.shape[1])]
            cols = [c for c in cols if len(c)]
            return (float(np.median([c.min() for c in cols])), float(np.median([c.max() for c in cols]))) if cols else (t_, b_)
        bt_, bb_ = _band(a); sc = sc * want_h / max(1.0, bb_ - bt_ + 1); a = L._shape(name, sc); top, bot, x0, x1 = L._paint_box(a)
        bt_, bb_ = _band(a)
    m = max(0, top - 20); a2 = a.crop((0, m, a.width, min(a.height, bot + 21))); top, bot = top - m, bot - m
    if not TT: bt_, bb_ = bt_ - m, bb_ - m
    w, h = a2.size; dy = 20 - top
    imw, imh = w + 30, h + 30 + dy
    cx = 15 + x0 + (round(TT['side_pad_ink'][0] * th) if TT else ((x1 - x0) - cw) // 2)
    ty = 15 + dy + top + ((bot - top) - th) // 2 - round(FF['text_lift_ink'] * th)
    if not TT: ty = 15 + dy + round((bt_ + bb_ + 1 - th) / 2 - FF['text_lift_ink'] * th)
    if not TT:
        _m = np.array(a2) > 128; _rows = [np.where(_m[y])[0] for y in range(max(0, ty - 15 - dy), min(_m.shape[0], ty - 15 - dy + th))]
        _rows = [r for r in _rows if len(r)]
        if _rows: _l = max(r.min() for r in _rows); _r = min(r.max() for r in _rows); cx = 15 + _l + ((_r - _l) - cw) // 2
    asc = f.getmetrics()[0]
    nw, nh = _svg_natural(name)
    # 칠 이미지(전체 SVG를 sc배)가 상자 안에서 놓이는 자리: 잘라낸 위 m을 빼고 (15, 15+dy)
    return {'kind': 'chip', 'text': s, 'font': 'ExtraBold', 'px': size, 'w': imw, 'h': imh,
            'svg': name, 'svg_x': 15, 'svg_y': 15 + dy - m, 'svg_w': nw * sc, 'svg_h': nh * sc,
            'clip': [15, 15 + dy, w, h], 'tx': cx - b[0], 'ty': ty - b[1] + asc}


def white_geom(s, size):
    f = L.BK(size); b = L.tsize(s, f); pad = 14; asc = f.getmetrics()[0]
    return {'kind': 'white', 'text': s, 'font': 'Black', 'px': size,
            'w': b[2] - b[0] + pad * 2 + 8, 'h': b[3] - b[1] + pad * 2 + 8,
            'tx': pad - b[0], 'ty': pad - b[1] + asc}


def sub_geom(words, font_px, W):
    """말 자막 덩어리: g350_v8_render.subimg()와 같은 줄 나눔·낱말 자리. 기준선(y)은 가운데 맞춤 'mm'/'lm' 기준."""
    f = L.BK(font_px); text = ' '.join(words); lines = [words]
    if f.getlength(text) > W - 200 and len(words) > 1:
        m = len(words) // 2; lines = [words[:m], words[m:]]
    lh = 80; tw = max(f.getlength(' '.join(l)) for l in lines)
    imw, imh = int(tw + 80), lh * len(lines) + 40
    asc, desc = f.getmetrics()
    out, n = [], 0
    for i, l in enumerate(lines):
        x = (imw - f.getlength(' '.join(l))) / 2; ymid = 20 + lh * i + lh / 2
        # PIL anchor 'lm' = 가로 왼쪽, 세로는 (ascender+descender)/2 가운데 → 기준선 = ymid + (asc - desc)/2
        base = ymid + (asc - desc) / 2
        line = []
        for w in l:
            line.append({'w': w, 'x': round(x, 2), 'i': n}); n += 1; x += f.getlength(w + ' ')
        out.append({'base': round(base, 2), 'mid_x': imw / 2, 'words': line})
    return {'w': imw, 'h': imh, 'lines': out}
