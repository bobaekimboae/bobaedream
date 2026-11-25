"""skia-python으로 그리는 화살표·원 테두리 (오픈소스 교체 시험 3번, 2026-11-25 클로드 마스터1)

PIL ImageDraw의 polygon·ellipse·line은 가장자리를 부드럽게(안티에일리어싱) 그리지 않아 화살표 끝과 원 테두리에
계단이 생긴다. 같은 모양·같은 크기·같은 위치를 skia로 그려 PIL RGBA 이미지로 돌려준다(렌더러는 그대로 alpha_composite).
- arrimg(L, below, fill, ink): g350_v5_lib.arrimg와 같은 꼭짓점·같은 이미지 크기·같은 위 여백 p를 돌려준다.
- ring(cv, box, color, width) / seg(cv, xy0, xy1, color, width): lens()의 원 테두리·연결선.
라이선스: skia-python BSD-3-Clause, Skia BSD-3-Clause.
"""
import numpy as np
import skia
from PIL import Image

_ac = {}


def _paint(rgba, stroke=None, join=skia.Paint.kRound_Join):
    p = skia.Paint(AntiAlias=True, Color=skia.Color(*rgba[:3], rgba[3] if len(rgba) > 3 else 255))
    if stroke:
        p.setStyle(skia.Paint.kStroke_Style); p.setStrokeWidth(stroke); p.setStrokeJoin(join); p.setStrokeCap(skia.Paint.kRound_Cap)
    return p


def _to_pil(surf):
    a = surf.makeImageSnapshot().toarray(colorType=skia.kRGBA_8888_ColorType, alphaType=skia.kUnpremul_AlphaType)
    return Image.fromarray(np.ascontiguousarray(a), 'RGBA')


def arrimg(L, below, fill=(245, 242, 0), ink=(17, 17, 17)):
    """노랑 화살표(검은 테두리). g350_v5_lib.arrimg와 같은 모양·크기·반환값 (그림, 위 여백)."""
    k = (L, below, fill, ink)
    if k in _ac:
        return _ac[k]
    p = 10; w = 72; hd = 44; sw = 20; cx = p + w // 2
    if below:
        poly = [(cx, p), (cx + w // 2, p + hd), (cx + sw // 2, p + hd), (cx + sw // 2, p + L), (cx - sw // 2, p + L), (cx - sw // 2, p + hd), (cx - w // 2, p + hd)]
    else:
        poly = [(cx, p + L), (cx + w // 2, p + L - hd), (cx + sw // 2, p + L - hd), (cx + sw // 2, p), (cx - sw // 2, p), (cx - sw // 2, p + L - hd), (cx - w // 2, p + L - hd)]
    surf = skia.Surface(w + 2 * p, L + 2 * p)
    c = surf.getCanvas()
    path = skia.Path(); path.addPoly([skia.Point(x, y) for x, y in poly], True)
    # PIL polygon(width=4)은 테두리를 안쪽으로 그린다 → 바깥 모양 전체를 검정으로 칠하고, 4px 안쪽 모양만 노랑으로 덮는다.
    # (채움 위에 선을 겹쳐 그리면 바깥 가장자리에 노랑 테가 비친다.)
    c.drawPath(path, _paint(ink))
    edge = skia.Path(); _paint(ink, stroke=8, join=skia.Paint.kMiter_Join).getFillPath(path, edge)
    inner = skia.Op(path, edge, skia.PathOp.kDifference_PathOp)
    c.drawPath(inner, _paint(fill))
    _ac[k] = (_to_pil(surf), p)
    return _ac[k]


def _overlay(cv, draw, bbox):
    """bbox(x0, y0, x1, y1) 크기의 작은 판에만 그려 붙인다(전체 화면 판은 프레임당 14ms라 느림)."""
    x0, y0 = max(0, int(bbox[0]) - 4), max(0, int(bbox[1]) - 4)
    x1, y1 = min(cv.width, int(bbox[2]) + 5), min(cv.height, int(bbox[3]) + 5)
    if x1 <= x0 or y1 <= y0:
        return
    surf = skia.Surface(x1 - x0, y1 - y0)
    c = surf.getCanvas(); c.translate(-x0, -y0); draw(c)
    cv.alpha_composite(_to_pil(surf), (x0, y0))


_rc = {}


def ring(cv, box, color=(255, 255, 255, 255), width=7):
    """PIL ellipse(box, outline=color, width) 대신. 같은 바깥 상자 안쪽으로 굵기만큼.
    같은 크기·색·굵기의 원은 한 번만 그려 두고 다시 붙인다(돋보기는 커지는 0.25초 뒤로 크기가 고정)."""
    x0, y0, x1, y1 = box
    k = (round(x1 - x0), round(y1 - y0), tuple(color), width)
    if k not in _rc:
        w, h = k[0] + 2, k[1] + 2
        surf = skia.Surface(w, h)
        surf.getCanvas().drawOval(skia.Rect(1 + width / 2, 1 + width / 2, w - 1 - width / 2, h - 1 - width / 2), _paint(color, stroke=width))
        if len(_rc) > 256:
            _rc.clear()
        _rc[k] = _to_pil(surf)
    cv.alpha_composite(_rc[k], (int(round(x0)) - 1, int(round(y0)) - 1))


def seg(cv, xy0, xy1, color=(255, 255, 255, 255), width=5):
    """PIL line 대신(끝 둥글게)."""
    _overlay(cv, lambda c: c.drawLine(*xy0, *xy1, _paint(color, stroke=width)),
             (min(xy0[0], xy1[0]) - width, min(xy0[1], xy1[1]) - width, max(xy0[0], xy1[0]) + width, max(xy0[1], xy1[1]) + width))
