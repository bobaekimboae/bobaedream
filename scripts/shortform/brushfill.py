"""보배드림 숏폼 공용 「칠」(키워드 스티커 바탕) 라이브러리 — 오토스카우트24 벨기에 칠 모양 재현.

오토스카우트24 벨기에·엔드 카드 칠을 확대해 본 모양(노션 「영상 분석 스킬 조합」 스타일 보드, 2026-11-08):
- 위·아래 변은 매끈하고 살짝 휜 곡선(리본처럼). 잔물결·뜯김 없음
- 왼쪽 끝은 깔끔한 직선(살짝 비스듬)
- 오른쪽 끝만 가는 붓털처럼 잘게 갈라짐(마른 붓 자국)
- 안은 단색, 그림자·테두리 없음

쓰는 곳
- 파이썬 렌더러: brush_mask(w, h, variant) → 원하는 크기의 알파 마스크(PIL 'L')를 바로 그림(크기마다 다시 계산하므로 붓털 굵기가 늘어나지 않음)
- 웹(넉스트)·다른 도구: export()가 만든 public/assets/shortform/brush-fill/v1/*.svg · *.png 를 CSS mask-image 로 쓰고 색만 바꿔 칠함

같은 variant 번호는 언제나 같은 모양(재현 가능). variant 를 안 주면 글자로 정함.
"""
from __future__ import annotations

import json
import math
import os
import random
import zlib

from PIL import Image, ImageDraw, ImageFilter

VARIANTS = 8  # 모양 종류 수

# 글자를 놓을 안전 영역(칠 크기에 대한 비율). 오른쪽은 붓털 자국만큼 더 비움.
SAFE = {"left": 0.07, "right": 0.11, "top": 0.16, "bottom": 0.16}


def _params(variant: int) -> dict:
    r = random.Random(1000 + variant)
    return {
        # 위·아래 변: 양 끝·가운데 높이(칠 높이 대비). 오토스카우트 실측: 위는 오른쪽이 살짝 높고, 아래는 가운데가 살짝 처짐
        "top": (r.uniform(0.03, 0.08), r.uniform(0.0, 0.03), r.uniform(-0.06, -0.01)),
        "bot": (r.uniform(0.93, 0.97), r.uniform(1.0, 1.05), r.uniform(0.92, 0.97)),
        "left_slant": r.uniform(-0.035, 0.035),  # 왼쪽 끝 기울기(높이 대비 가로 이동)
        "fringe": r.uniform(0.08, 0.12),        # 오른쪽 붓털 깊이(높이 대비)
        "fringe_slant": r.uniform(-0.08, 0.02),   # 오른쪽 끝 전체 기울기
        "seed": r.randrange(1 << 30),
    }


def _quad(a: float, m: float, b: float, t: float) -> float:
    """세 점(왼·가운데·오른쪽)을 지나는 부드러운 2차 곡선"""
    return a * (1 - t) * (1 - 2 * t) + m * 4 * t * (1 - t) + b * t * (2 * t - 1)


def outline(w: float, h: float, variant: int, ox: float = 0, oy: float = 0, teeth_px: float = 2.2) -> list[tuple[float, float]]:
    """칠 외곽 점 목록(시계 방향). teeth_px = 붓털 한 가닥 굵기(최종 픽셀 기준)."""
    p = _params(variant)
    r = random.Random(p["seed"])
    n = 48
    pts = []
    for i in range(n + 1):  # 윗변 왼→오
        t = i / n
        pts.append((ox + t * w, oy + _quad(*p["top"], t) * h))
    # 오른쪽 끝: 위→아래, 붓털. 가닥 굵기는 고정 픽셀이라 크기가 달라도 같은 질감
    xr_top, xr_bot = ox + w, ox + w + p["fringe_slant"] * h
    y0, y1 = oy + _quad(*p["top"], 1) * h, oy + _quad(*p["bot"], 1) * h
    teeth = max(10, int((y1 - y0) / teeth_px))
    depth = p["fringe"] * h
    prev = 0.0
    for k in range(teeth + 1):
        s = k / teeth
        y = y0 + s * (y1 - y0)
        x = xr_top + s * (xr_bot - xr_top)
        # 긴 털·짧은 털이 섞이게: 대부분 얕고 가끔 깊게 파임. 이웃과 조금 이어지게 섞음
        cut = depth * (r.random() ** 2.2) * (1.0 if r.random() < 0.85 else 1.6)
        cut = 0.55 * cut + 0.45 * prev
        prev = cut
        # 위·아래 모서리 근처는 털이 더 깊이 갈라짐(붓이 끝나는 자리)
        edge = min(s, 1 - s)
        if edge < 0.12:
            cut += depth * (0.12 - edge) / 0.12 * 0.8 * r.random()
        pts.append((x - cut, y))
    for i in range(n + 1):  # 아랫변 오→왼
        t = 1 - i / n
        pts.append((ox + t * w + (p["fringe_slant"] * h if t == 1 else 0), oy + _quad(*p["bot"], t) * h))
    # 왼쪽 끝: 깔끔한 직선(살짝 비스듬), 모서리만 아주 조금 둥글게
    ly0, ly1 = oy + _quad(*p["bot"], 0) * h, oy + _quad(*p["top"], 0) * h
    for k in range(1, 6):
        s = k / 6
        pts.append((ox + p["left_slant"] * h * (1 - 2 * s) * 0.5, ly0 + s * (ly1 - ly0)))
    return pts


def variant_for(text: str) -> int:
    return zlib.crc32(text.encode("utf-8")) % VARIANTS


def brush_mask(w: int, h: int, variant: int | None = None, text: str = "", margin: int = 0, ss: int = 4) -> Image.Image:
    """w×h 칠 알파 마스크(PIL 'L'). margin 만큼 둘레를 비운 캔버스에 그림. ss = 확대 그리기 배율(가장자리 매끄럽게)"""
    v = variant_for(text) if variant is None else variant % VARIANTS
    W2, H2 = (w + margin * 2) * ss, (h + margin * 2) * ss
    m = Image.new("L", (W2, H2), 0)
    pts = outline(w * ss, h * ss, v, margin * ss, margin * ss, teeth_px=2.2 * ss)
    ImageDraw.Draw(m).polygon(pts, fill=255)
    m = m.filter(ImageFilter.GaussianBlur(ss * 0.35))  # 붓털 끝만 살짝 부드럽게
    return m.resize((w + margin * 2, h + margin * 2), Image.LANCZOS)


def safe_box(w: int, h: int) -> tuple[float, float, float, float]:
    """글자를 둘 안전 영역 (x0, y0, x1, y1)"""
    return (w * SAFE["left"], h * SAFE["top"], w * (1 - SAFE["right"]), h * (1 - SAFE["bottom"]))


def svg_path(variant: int, w: float = 1000, h: float = 280) -> str:
    pts = outline(w, h, variant, 0, 0, teeth_px=w / 300)
    d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + " Z"
    return d


def export(out_dir: str, ratios=(3.0, 4.0, 5.5)) -> None:
    """웹·다른 도구용 칠 파일 묶음: SVG(늘려 써도 깨끗) + PNG(비율별) + manifest.json"""
    os.makedirs(out_dir, exist_ok=True)
    items = []
    for v in range(VARIANTS):
        W, H = 1000, 280
        pts = outline(W, H, v, 0, 0, teeth_px=W / 300)
        xs, ys = [p[0] for p in pts], [p[1] for p in pts]
        x0, y0, x1, y1 = min(xs), min(ys), max(xs), max(ys)
        d = "M" + " L".join(f"{x - x0:.1f},{y - y0:.1f}" for x, y in pts) + " Z"
        vw, vh = x1 - x0, y1 - y0
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vw:.1f} {vh:.1f}" preserveAspectRatio="none">'
               f'<path d="{d}" fill="#fff"/></svg>')
        name = f"fill-{v + 1:02d}"
        with open(os.path.join(out_dir, name + ".svg"), "w", encoding="utf-8") as f:
            f.write(svg)
        pngs = []
        for r in ratios:
            ph = 240
            pw = int(ph * r)
            mk = brush_mask(pw, ph, v)
            im = Image.new("RGBA", mk.size, (255, 255, 255, 0))
            im.putalpha(mk)
            fn = f"{name}-{str(r).replace('.', '_')}x1.png"
            im.save(os.path.join(out_dir, fn))
            pngs.append({"file": fn, "ratio": r, "size": [pw, ph]})
        items.append({"variant": v, "svg": name + ".svg", "png": pngs})
    manifest = {
        "name": "보배드림 숏폼 칠 v1 (오토스카우트24 벨기에 칠 모양)",
        "how": "흰색 마스크. CSS mask-image 또는 알파로 쓰고 색은 background-color로 칠한다. SVG는 preserveAspectRatio=none이라 아무 비율로 늘려도 됨(붓털 굵기는 비율에 따라 조금 변함). 파이썬은 scripts/shortform/brushfill.py brush_mask() 사용",
        "safe_area": SAFE,
        "text_height_of_fill": 0.35,
        "default_color": "#306BD9",
        "text_color": "#FFFFFF",
        "tilt_deg": "-1.8 ~ 1.8",
        "variants": items,
    }
    with open(os.path.join(out_dir, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    import sys
    export(sys.argv[1] if len(sys.argv) > 1 else "public/assets/shortform/brush-fill/v1")
