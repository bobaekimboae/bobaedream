#!/usr/bin/env python3
"""커뮤니티 게시판별 배너 이미지 만들기.

- 사진 배너(fit-blur는 키 큰 사진을 통째로 두고 빈 곳만 같은 사진을 흐리게 채운다): 저장소에 이미 있는 차량 사진을 자르고 크기만 바꾼다(차 픽셀은 손대지 않는다).
  fit-right 방식만 사진 왼쪽 빈 곳을 사진 가장자리 색으로 채운다(스튜디오 흰 벽 사진용).
- 그림 배너: 차 사진이 어울리지 않는 게시판(스포츠·시사·유머 등)은 게시판 색과 주제 무늬로 그린다.

결과: public/community/assets/board-banners/<게시판 id>.webp (1200×357, 화면 356×106의 약 3.4배)
실행: python3 scripts/community-board-banners.py
"""
import math
import os
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public/community/assets/board-banners")
W, H = 1200, 357
SS = 2  # 그림 배너는 2배로 그려 줄여서 선을 부드럽게

A = lambda p: os.path.join(ROOT, "public", p)
LUX = lambda n: A(f"assets/cars/luxury-category-v01/lux-{n:02d}.webp")
OLD = lambda n: A(f"community/assets/board-header-{n}.webp")

# 게시판 id → (원본 사진, 세로 중심 비율, 방식)
PHOTO = {
    "home": (OLD("genesis-yeosu"), 0.55, "crop"),
    "all": (OLD("youtube"), 0.55, "crop"),
    "best": (OLD("youtube-v2"), 0.55, "crop"),
    "free": (OLD("mercedes-glb-family"), 0.5, "crop"),
    "car-news": (LUX(25), 0.6, "crop"),
    "foreign-car-news": (OLD("aston-martin-db12"), 0.5, "crop"),
    "brand-car-info": (LUX(11), 0.6, "crop"),
    "vehicle-review": (LUX(10), 0.6, "crop"),
    "tuhu-review": (LUX(31), 0.6, "crop"),
    "fuel-economy": (LUX(20), 0.6, "crop"),
    "test-drive": (LUX(19), 0.6, "crop"),
    "celebrity-car": (LUX(3), 0.6, "crop"),
    "domestic-car": (OLD("genesis-yeosu"), 0.62, "crop"),
    "import-car": (LUX(18), 0.6, "crop"),
    "tesla": (LUX(13), 0.6, "crop"),
    "bmw": (LUX(23), 0.6, "crop"),
    "mercedes-benz": (LUX(6), 0.6, "crop"),
    "my-car-photo": (LUX(29), 0.6, "crop"),
    "scoop": (LUX(21), 0.58, "crop"),
    "car-media": (LUX(2), 0.6, "crop"),
    "installation": (LUX(5), 0.6, "crop"),
    "free-media": (LUX(32), 0.6, "crop"),
    "truck-bus-heavy": (A("assets/truck/listings/v09/truck-v09-03.webp"), 0.5, "fit-blur"),
    "bike-cycle": (A("assets/bike/listings/v08/bike-v08-03.webp"), 0.5, "fit-blur"),
    "oldcar-memory": (OLD("reddit"), 0.55, "crop"),
}

# 게시판 id → (무늬, 바탕 진한 색, 강조 색)
GRAPHIC = {
    "politics": ("bubbles", "#2c1f6b", "#9678e8"),
    "autohome-complaint": ("warning", "#1d2026", "#e0a63a"),
    "chezhiwang-complaint": ("warning", "#1d2026", "#e0a63a"),
    "adult": ("stripes", "#4a1527", "#d36386"),
    "boba-story": ("rings", "#7d1426", "#ef6679"),
    "suggestion": ("bubbles", "#20394f", "#76a5c8"),
    "kbo": ("baseball", "#123f25", "#61bd7e"),
    "mlb": ("baseball", "#0f2f5c", "#5d9eea"),
    "overseas-football": ("pitch", "#14432e", "#62c894"),
    "domestic-football": ("pitch", "#0e4a46", "#58c7bc"),
    "event": ("confetti", "#7a2618", "#ff856b"),
    "new-humor": ("smile", "#5a3410", "#e2a34d"),
    "humor": ("smile", "#4f3a00", "#f2c94c"),
    "accident-blackbox": ("road", "#2a1414", "#ff766e"),
    "caution": ("stripes", "#5e1838", "#eb76ab"),
    "racing-model": ("checker", "#5e1428", "#f06e8e"),
    "military": ("contour", "#2f3a1c", "#95a967"),
    "aviation-rail": ("rail", "#173450", "#6f9bc6"),
    "f1": ("circuit", "#14161b", "#e10600"),
}


def save(img, board_id):
    img.convert("RGB").save(os.path.join(OUT, board_id + ".webp"), "WEBP", quality=80, method=6)


def photo_banner(src, cy, mode):
    im = Image.open(src).convert("RGB")
    if mode == "fit-right":
        # 사진 높이를 배너 높이에 맞춰 오른쪽에 두고, 왼쪽 빈 곳은 사진 왼쪽 가장자리 색으로 채운다.
        s = H / im.height
        ph = im.resize((round(im.width * s), H), Image.LANCZOS)
        edge = ph.crop((0, 0, 4, H)).resize((1, H), Image.LANCZOS).resize((W, H))
        out = edge.copy()
        out.paste(ph, (W - ph.width, 0))
        return out
    if mode == "fit-blur":
        # 키 큰 사진: 사진 전체를 배너 높이에 맞춰 오른쪽에 두고, 남는 곳은 같은 사진을 흐리게 키워 채운다.
        bg = photo_banner(src, cy, "crop").filter(ImageFilter.GaussianBlur(28))
        bg = Image.blend(bg, Image.new("RGB", (W, H), (12, 16, 22)), 0.35)
        s = H / im.height
        ph = im.resize((round(im.width * s), H), Image.LANCZOS)
        mask = Image.new("L", ph.size, 255)
        md = ImageDraw.Draw(mask)
        for x in range(40):  # 왼쪽 가장자리만 부드럽게
            md.line([(x, 0), (x, H)], fill=round(255 * x / 40))
        bg.paste(ph, (W - ph.width, 0), mask)
        return bg
    ratio = W / H
    w, h = im.width, im.width / ratio
    if h > im.height:  # 사진이 배너보다 납작하면 높이에 맞춰 가로를 자른다
        h, w = im.height, im.height * ratio
    top = min(max(0, im.height * cy - h / 2), im.height - h)
    left = (im.width - w) / 2
    return im.crop((round(left), round(top), round(left + w), round(top + h))).resize((W, H), Image.LANCZOS)


def hexrgb(h, a=255):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (a,)


def graphic_banner(kind, dark, accent):
    w, h = W * SS, H * SS
    base = Image.new("RGBA", (w, h))
    d0 = ImageDraw.Draw(base)
    c1, c2 = hexrgb(dark), hexrgb(accent)
    for x in range(w):  # 왼쪽 진한 색 → 오른쪽 강조 색으로 옅게
        t = (x / w) ** 1.6 * 0.55
        d0.line([(x, 0), (x, h)], fill=tuple(round(c1[i] * (1 - t) + c2[i] * t) for i in range(3)) + (255,))
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    white = lambda a: (255, 255, 255, a)
    acc = lambda a: c2[:3] + (a,)
    u = h / 100  # 무늬 단위
    rx = w * 0.70  # 무늬 중심(오른쪽, 제목과 겹치지 않게)

    if kind == "baseball":
        cx, cy, r = rx, h * 0.62, 46 * u
        d.polygon([(cx, cy - r), (cx + r, cy), (cx, cy + r), (cx - r, cy)], outline=white(70), width=int(1.4 * u))
        for px, py in [(cx, cy - r), (cx + r, cy), (cx - r, cy)]:
            d.rectangle([px - 3 * u, py - 3 * u, px + 3 * u, py + 3 * u], fill=white(90))
        bx, by, br = w * 0.9, h * 0.32, 26 * u  # 공
        d.ellipse([bx - br, by - br, bx + br, by + br], fill=white(46), outline=white(120), width=int(u))
        for sgn, a0, a1 in ((-1, -38, 38), (1, 142, 218)):
            ox = bx + sgn * br * 1.38
            d.arc([ox - br, by - br, ox + br, by + br], a0, a1, fill=acc(220), width=int(1.2 * u))
    elif kind == "pitch":
        x0, x1, y0, y1 = w * 0.48, w * 1.05, h * 0.12, h * 0.88
        lw = int(1.2 * u)
        d.rectangle([x0, y0, x1, y1], outline=white(80), width=lw)
        cx = (x0 + x1) / 2
        d.line([(cx, y0), (cx, y1)], fill=white(80), width=lw)
        d.ellipse([cx - 18 * u, h / 2 - 18 * u, cx + 18 * u, h / 2 + 18 * u], outline=white(80), width=lw)
        d.rectangle([x0, h * 0.3, x0 + 18 * u, h * 0.7], outline=white(80), width=lw)
        for i in range(8):  # 잔디 결
            if i % 2:
                d.rectangle([x0 + i * (x1 - x0) / 8, y0, x0 + (i + 1) * (x1 - x0) / 8, y1], fill=white(10))
    elif kind == "bubbles":
        for (bx, by, bw, bh, a) in [(0.55, 0.2, 0.2, 0.42, 60), (0.72, 0.45, 0.22, 0.42, 90), (0.88, 0.12, 0.16, 0.36, 50)]:
            x, y, ww, hh = w * bx, h * by, w * bw, h * bh
            d.rounded_rectangle([x, y, x + ww, y + hh], radius=12 * u, fill=white(a // 3), outline=white(a), width=int(u))
            d.polygon([(x + 12 * u, y + hh), (x + 24 * u, y + hh), (x + 10 * u, y + hh + 10 * u)], fill=white(a // 3))
            for k in range(3):
                d.ellipse([x + ww / 2 + (k - 1) * 10 * u - 2.5 * u, y + hh / 2 - 2.5 * u, x + ww / 2 + (k - 1) * 10 * u + 2.5 * u, y + hh / 2 + 2.5 * u], fill=white(a + 40))
    elif kind == "warning":
        cx, cy, r = rx, h * 0.55, 42 * u
        pts = [(cx, cy - r), (cx + r * 1.1, cy + r * 0.75), (cx - r * 1.1, cy + r * 0.75)]
        d.polygon(pts, outline=acc(220), width=int(2.2 * u))
        d.rounded_rectangle([cx - 3 * u, cy - 18 * u, cx + 3 * u, cy + 12 * u], radius=3 * u, fill=acc(230))
        d.ellipse([cx - 3.5 * u, cy + 18 * u, cx + 3.5 * u, cy + 25 * u], fill=acc(230))
        for i in range(-2, 14):  # 주의 띠
            x = w * 0.5 + i * 18 * u
            d.polygon([(x, h), (x + 9 * u, h), (x + 9 * u + 12 * u, h - 12 * u), (x + 12 * u, h - 12 * u)], fill=acc(70))
    elif kind == "stripes":
        for i in range(-10, 40):
            x = w * 0.45 + i * 14 * u
            d.polygon([(x, h), (x + 5 * u, h), (x + 5 * u + h, 0), (x + h, 0)], fill=white(18))
        d.ellipse([rx - 30 * u, h * 0.5 - 30 * u, rx + 30 * u, h * 0.5 + 30 * u], outline=acc(200), width=int(2 * u))
    elif kind == "rings":
        for k in range(7):
            r = (14 + k * 13) * u
            d.ellipse([rx - r, h * 0.55 - r, rx + r, h * 0.55 + r], outline=white(110 - k * 13), width=int(1.1 * u))
    elif kind == "confetti":
        import random
        rnd = random.Random(7)
        for _ in range(70):
            x, y = w * (0.42 + rnd.random() * 0.6), h * rnd.random()
            s, a = (2 + rnd.random() * 5) * u, rnd.randint(70, 170)
            col = acc(a) if rnd.random() < .5 else white(a)
            if rnd.random() < .5:
                d.ellipse([x - s / 2, y - s / 2, x + s / 2, y + s / 2], fill=col)
            else:
                ang = rnd.random() * math.pi
                dx, dy = math.cos(ang) * s, math.sin(ang) * s
                d.line([(x - dx, y - dy), (x + dx, y + dy)], fill=col, width=int(1.6 * u))
    elif kind == "smile":
        for (sx, sy, sr, a) in [(0.68, 0.55, 34, 120), (0.88, 0.3, 20, 80), (0.92, 0.82, 14, 60)]:
            cx, cy, r = w * sx, h * sy, sr * u
            d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=white(a), width=int(1.6 * u))
            d.ellipse([cx - r * .38 - r * .09, cy - r * .3 - r * .09, cx - r * .38 + r * .09, cy - r * .3 + r * .09], fill=white(a))
            d.ellipse([cx + r * .38 - r * .09, cy - r * .3 - r * .09, cx + r * .38 + r * .09, cy - r * .3 + r * .09], fill=white(a))
            d.arc([cx - r * .6, cy - r * .5, cx + r * .6, cy + r * .6], 20, 160, fill=white(a), width=int(1.6 * u))
    elif kind == "road":
        vx, vy = w * 0.72, h * 0.18
        for sx in (w * 0.42, w * 1.02):
            d.line([(sx, h), (vx, vy)], fill=white(90), width=int(1.4 * u))
        for k in range(6):
            t0, t1 = k / 6, k / 6 + 0.07
            p = lambda t: (vx + (vx - vx) * t, vy + (h - vy) * t)
            d.line([p(t0 ** 0.6), p(t1 ** 0.6)], fill=acc(160), width=int((0.6 + k * .5) * u))
        m, L = 8 * u, 16 * u  # 블랙박스 화면 모서리
        x0, y0, x1, y1 = w * 0.5, h * 0.1, w * 0.97, h * 0.9
        for (cx, cy, sx, sy) in [(x0, y0, 1, 1), (x1, y0, -1, 1), (x0, y1, 1, -1), (x1, y1, -1, -1)]:
            d.line([(cx, cy), (cx + sx * L, cy)], fill=white(150), width=int(1.2 * u))
            d.line([(cx, cy), (cx, cy + sy * L)], fill=white(150), width=int(1.2 * u))
        d.ellipse([x1 - m * 3.2, y0 + m * .7, x1 - m * 2.2, y0 + m * 1.7], fill=acc(230))
    elif kind == "checker":
        s = 14 * u
        for i in range(int(w * 0.5 / s) + 2):
            for j in range(int(h / s) + 1):
                if (i + j) % 2 == 0:
                    a = int(60 * min(1, i / 6))
                    d.rectangle([w * 0.5 + i * s, j * s, w * 0.5 + (i + 1) * s, (j + 1) * s], fill=white(a))
    elif kind == "contour":
        for k in range(9):
            r = (10 + k * 12) * u
            pts = []
            for t in range(0, 361, 6):
                a = math.radians(t)
                rr = r * (1 + 0.12 * math.sin(3 * a + k) + 0.06 * math.cos(5 * a))
                pts.append((rx + rr * math.cos(a) * 1.3, h * 0.55 + rr * math.sin(a)))
            d.line(pts + [pts[0]], fill=white(90 - k * 8), width=int(u))
    elif kind == "rail":
        vx, vy = w * 0.74, h * 0.3
        for sx in (w * 0.56, w * 0.92):
            d.line([(sx, h), (vx, vy)], fill=white(110), width=int(1.4 * u))
        for k in range(9):
            t = (k / 9) ** 1.8
            y = vy + (h - vy) * t
            half = (w * 0.18) * t + 4 * u
            d.line([(vx - half, y), (vx + half, y)], fill=white(60), width=int(max(1, t * 2.2 * u)))
        d.arc([w * 0.5, -h * 0.9, w * 1.2, h * 0.6], 200, 320, fill=acc(150), width=int(1.2 * u))  # 비행 궤적
        px, py = w * 0.93, h * 0.2
        d.polygon([(px - 10 * u, py + 3 * u), (px + 10 * u, py - 3 * u), (px - 4 * u, py + 6 * u)], fill=white(200))
    elif kind == "circuit":
        # 서킷 선 + 연석 + 체크 깃발 띠 (F1 로고·선수 사진은 쓰지 않는다)
        pts = []
        for t in range(0, 361, 3):
            a = math.radians(t)
            rr = 1 + 0.18 * math.sin(2 * a + 0.6) + 0.1 * math.cos(3 * a)
            pts.append((rx + 34 * u * rr * math.cos(a) * 1.9, h * 0.52 + 30 * u * rr * math.sin(a)))
        d.line(pts + [pts[0]], fill=white(150), width=int(3.4 * u), joint="curve")
        d.line(pts[30:62], fill=acc(255), width=int(3.4 * u), joint="curve")
        for i in range(30, 62, 4):  # 연석 흰 줄
            d.line([pts[i], pts[i + 1]], fill=white(230), width=int(3.4 * u))
        sx, s = w * 0.955, 6 * u
        for j in range(int(h / s) + 1):
            for i in range(3):
                if (i + j) % 2 == 0:
                    d.rectangle([sx + i * s, j * s, sx + (i + 1) * s, (j + 1) * s], fill=white(200))
        for k in range(4):  # 속도선
            y = h * (0.2 + k * 0.08)
            d.line([(w * 0.34 + k * 9 * u, y), (w * 0.46 + k * 9 * u, y)], fill=acc(170 - k * 30), width=int(1.2 * u))
    base = Image.alpha_composite(base, layer)
    return base.resize((W, H), Image.LANCZOS)


def main():
    os.makedirs(OUT, exist_ok=True)
    for bid, (src, cy, mode) in PHOTO.items():
        save(photo_banner(src, cy, mode), bid)
    for bid, (kind, dark, accent) in GRAPHIC.items():
        save(graphic_banner(kind, dark, accent), bid)
    print(len(PHOTO) + len(GRAPHIC), "banners")


if __name__ == "__main__":
    main()
