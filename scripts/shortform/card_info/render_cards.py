"""보배드림 숏폼 「카드 정보」 독립 컷 렌더러 v1 (시안: Python + Pillow + FFmpeg).

한 매물의 성능점검·보험이력·차량정보·옵션 등을 오토스카우트24 웹/릴스식 흰 카드로 한 장씩 보여 주는 6~7초 컷을 만든다.
엔카처럼 여러 번 눌러야 보는 정보를 영상 한 컷으로 요약하는 것이 목적이다.

쓰는 법
  python3 scripts/shortform/card_info/render_cards.py samples/g400d_cards.json --photos <사진폴더> --out <출력폴더> [--only insurance,options] [--reel]

규칙(값은 cards_spec.json 한 파일에서만 읽는다)
- 사실은 입력 JSON에 있는 값만 쓴다. 입력에 없는 숫자·평가(무사고 등)를 만들지 않는다.
- 차 사진은 자르기·확대·이동·흐림만(반사기 원칙). 번호판은 가리지 않는다. 전화번호·차량번호는 넣지 않는다.
- 강조색은 be_locked_rules.json 의 노랑 하나. 아이콘은 Fluent 3D(icons3d)만.
"""
from __future__ import annotations

import argparse
import json
import math
import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
SF = os.path.abspath(os.path.join(HERE, ".."))
sys.path.insert(0, SF)
import brushfill  # noqa: E402

SPEC = json.load(open(os.path.join(HERE, "cards_spec.json"), encoding="utf-8"))
RULES = json.load(open(os.path.join(SF, "be_locked_rules.json"), encoding="utf-8"))
YEL = RULES["color"]["yellow"]
INK = RULES["color"]["ink"]
W, H, FPS = SPEC["canvas"]["w"], SPEC["canvas"]["h"], SPEC["canvas"]["fps"]
FONT_DIR = os.path.join(SF, "fonts")
ICON_DIR = os.path.join(SF, "photo_listing", "icons3d")


def font(weight: str, px: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(os.path.join(FONT_DIR, f"Pretendard-{weight}.otf"), px)


def hexrgb(h: str, a: int = 255):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


def ease_out(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3


def text_w(f, s):
    return f.getbbox(s)[2] - f.getbbox(s)[0]


def fit_cover(im: Image.Image, w: int, h: int, box=None) -> Image.Image:
    """사진을 w×h 칸에 꽉 채움(가운데 자름). box=(x0,y0,x1,y1) 비율이면 그 부분만 먼저 자름."""
    if box:
        iw, ih = im.size
        im = im.crop((int(box[0] * iw), int(box[1] * ih), int(box[2] * iw), int(box[3] * ih)))
    iw, ih = im.size
    s = max(w / iw, h / ih)
    im = im.resize((max(w, round(iw * s)), max(h, round(ih * s))), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))


def rounded(im: Image.Image, r: int) -> Image.Image:
    m = Image.new("L", im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, im.width - 1, im.height - 1), r, fill=255)
    out = im.convert("RGBA")
    out.putalpha(Image.composite(out.getchannel("A"), m, m))
    return out


def icon(name: str, px: int) -> Image.Image:
    p = os.path.join(ICON_DIR, name)
    im = Image.open(p).convert("RGBA")
    return im.resize((px, px), Image.LANCZOS)


def yellow_chip(text: str, px: int) -> Image.Image:
    """be_locked_rules 의 fill_fit 방식: 노션 원본 칠(가로 늘이기는 3분할), 칠 높이 = 글자 높이 × band_to_ink."""
    f = font("ExtraBold", px)
    bb = f.getbbox(text)
    ink_h = bb[3] - bb[1]
    tw = bb[2] - bb[0]
    band_h = round(ink_h * RULES["chip"]["fill_fit"]["band_to_ink"])
    pad = round(ink_h * 0.65)
    w = tw + pad * 2
    mask = brushfill.theme_mask_sliced(w, band_h, SPEC["chip"]["fill"])
    chip = Image.new("RGBA", mask.size, hexrgb(YEL))
    chip.putalpha(mask)
    d = ImageDraw.Draw(chip)
    lift = round(ink_h * RULES["chip"]["fill_fit"]["text_lift_ink"])
    d.text((pad - bb[0], (band_h - ink_h) // 2 - bb[1] - lift), text, font=f, fill=hexrgb(INK))
    return chip


# ---------------------------------------------------------------- 카드 그리기
class Layer:
    """카드 위에 나중에 나타나는 한 조각(행·칸). appear 초에 0.25초 동안 위로 20px 떠오르며 나타남."""

    def __init__(self, im: Image.Image, xy, appear: float, sfx: str | None = None):
        self.im, self.xy, self.appear, self.sfx = im, xy, appear, sfx


def card_frame(card: dict, car: dict, photos: str):
    """카드 바탕(머리글)과 뒤에 나타날 조각들을 만든다. 돌려주는 값: (바탕 RGBA, [Layer], 카드 높이)."""
    S = SPEC["card"]
    cw = S["w"]
    pad = S["pad"]
    inner = cw - pad * 2
    layers: list[Layer] = []
    t0, step = SPEC["timing"]["first_row"], SPEC["timing"]["row_step"]
    y = pad
    head = Image.new("RGBA", (cw, 2000), (0, 0, 0, 0))
    d = ImageDraw.Draw(head)
    # 머리글: 아이콘 + 종류 이름(회색 작게) + 노랑 칩 제목
    ic = icon(card["icon"], S["icon_px"])
    head.alpha_composite(ic, (pad, y))
    d.text((pad + S["icon_px"] + 18, y + 6), card["label"], font=font("SemiBold", S["label_px"]), fill=hexrgb(S["label_color"]))
    d.text((pad + S["icon_px"] + 18, y + 6 + S["label_px"] + 6), car["short"], font=font("Medium", S["sub_px"]), fill=hexrgb(S["muted"]))
    y += S["icon_px"] + 28
    chip = yellow_chip(card["title"], S["title_px"])
    head.alpha_composite(chip, (pad - 10, y))
    y += chip.height + 22
    d.line((pad, y, cw - pad, y), fill=hexrgb(S["divider"]), width=2)
    y += 22

    T = card["type"]
    rf_l, rf_v = font("Medium", S["row_label_px"]), font("Bold", S["row_value_px"])
    rh = S["row_h"]
    i = 0

    def row_img(label, value, state=None):
        im = Image.new("RGBA", (inner, rh), (0, 0, 0, 0))
        dd = ImageDraw.Draw(im)
        cy = rh // 2
        x = 0
        if state:
            mk = icon("fl_check_mark_button.png", 44) if state == "ok" else None
            if mk:
                im.alpha_composite(mk, (0, cy - 22))
            else:
                dd.ellipse((6, cy - 16, 38, cy + 16), outline=hexrgb(S["muted"]), width=4)
                dd.text((16, cy - 17), "!", font=font("Bold", 28), fill=hexrgb(S["muted"]))
            x = 62
        dd.text((x, cy), label, font=rf_l, fill=hexrgb(S["row_label_color"]), anchor="lm")
        dd.text((inner, cy), value, font=rf_v, fill=hexrgb(INK), anchor="rm")
        dd.line((0, rh - 1, inner, rh - 1), fill=hexrgb(S["divider"]), width=2)
        return im

    if T in ("rows", "status"):
        for r in card["rows"]:
            state = r[2] if T == "status" else None
            layers.append(Layer(row_img(r[0], r[1], state), (pad, y), t0 + i * step, "tick" if i < 3 else None))
            y += rh
            i += 1
    elif T == "grid":
        cols, gw = 3, inner // 3
        gh = S["grid_h"]
        for k, (name, on) in enumerate(card["items"]):
            im = Image.new("RGBA", (gw - 12, gh - 12), (0, 0, 0, 0))
            dd = ImageDraw.Draw(im)
            dd.rounded_rectangle((0, 0, im.width - 1, im.height - 1), 20, fill=hexrgb(S["tile_bg"] if on else S["tile_off"]))
            if on:
                im.alpha_composite(icon("fl_check_mark_button.png", 40), (18, (im.height - 40) // 2))
            dd.text((70, im.height // 2), name, font=font("SemiBold" if on else "Medium", S["grid_px"]),
                    fill=hexrgb(INK if on else S["off_text"]), anchor="lm")
            if not on:
                dd.text((im.width - 18, im.height // 2), "없음", font=font("Medium", S["grid_px"] - 6), fill=hexrgb(S["off_text"]), anchor="rm")
            layers.append(Layer(im, (pad + (k % cols) * gw, y + (k // cols) * gh), t0 + k * step * 0.45, "tick" if k in (0, 4, 8) else None))
        y += math.ceil(len(card["items"]) / cols) * gh
    elif T == "bars":
        mx = max(v for _, v in card["bars"])
        bh = S["bar_row_h"]
        for k, (name, v) in enumerate(card["bars"]):
            im = Image.new("RGBA", (inner, bh), (0, 0, 0, 0))
            layers.append(Layer(("bar", name, v, mx), (pad, y), t0 + k * step, "tick" if k == 0 else None))
            y += bh
    elif T == "inspection":
        # 차 윤곽(위에서 본 단순 그림)과 행 2개. 부위 칠은 데이터 연결 전이라 비움
        im = Image.new("RGBA", (inner, 360), (0, 0, 0, 0))
        dd = ImageDraw.Draw(im)
        cx = inner // 2
        dd.rounded_rectangle((cx - 120, 20, cx + 120, 340), 70, outline=hexrgb(S["muted"]), width=5)
        dd.rounded_rectangle((cx - 90, 80, cx + 90, 150), 20, outline=hexrgb(S["muted"]), width=4)
        dd.rounded_rectangle((cx - 90, 230, cx + 90, 290), 20, outline=hexrgb(S["muted"]), width=4)
        for sx in (-1, 1):
            for yy in (70, 290):
                dd.rounded_rectangle((cx + sx * 120 - 18, yy - 30, cx + sx * 120 + 18, yy + 30), 8, fill=hexrgb(S["muted"]))
        dd.text((cx, 185), "부위 표시 영역", font=font("Medium", 30), fill=hexrgb(S["muted"]), anchor="mm")
        layers.append(Layer(im, (pad, y), t0, "tick"))
        y += 380
        for k, r in enumerate(card["rows"]):
            layers.append(Layer(row_img(r[0], r[1]), (pad, y), t0 + (k + 1) * step, None))
            y += rh
    elif T == "tiles":
        tw_, th_ = (inner - 20) // 2, S["tile_h"]
        for k, (fn, name, box) in enumerate(card["tiles"]):
            ph = Image.open(os.path.join(photos, fn)).convert("RGB")
            im = rounded(fit_cover(ph, tw_, th_, box), 22)
            dd = ImageDraw.Draw(im)
            g = Image.new("RGBA", (tw_, 90), (0, 0, 0, 0))
            for yy in range(90):
                ImageDraw.Draw(g).line((0, yy, tw_, yy), fill=(0, 0, 0, int(170 * yy / 90)))
            im.alpha_composite(rounded(g.crop((0, 0, tw_, 90)), 0), (0, th_ - 90))
            ImageDraw.Draw(im).text((20, th_ - 22), name, font=font("Bold", S["tile_px"]), fill=(255, 255, 255, 255), anchor="ls")
            layers.append(Layer(im, (pad + (k % 2) * (tw_ + 20), y + (k // 2) * (th_ + 20)), t0 + k * step, "tick" if k < 3 else None))
        y += 2 * (th_ + 20)
    elif T == "seller":
        im = Image.new("RGBA", (inner, 120), (0, 0, 0, 0))
        dd = ImageDraw.Draw(im)
        dd.text((0, 30), card["sub"], font=font("Medium", S["row_label_px"]), fill=hexrgb(S["row_label_color"]), anchor="lm")
        x = 0
        for k, (lab, val) in enumerate(card["stats"]):
            bw = (inner - 20) // 2
            dd.rounded_rectangle((k * (bw + 20), 60, k * (bw + 20) + bw, 118), 16, fill=hexrgb(S["tile_bg"]))
            dd.text((k * (bw + 20) + 22, 89), lab, font=font("Medium", 32), fill=hexrgb(S["row_label_color"]), anchor="lm")
            dd.text((k * (bw + 20) + bw - 22, 89), val, font=font("ExtraBold", 40), fill=hexrgb(INK), anchor="rm")
        layers.append(Layer(im, (pad, y), t0, "tick"))
        y += 140
        for k, r in enumerate(card["rows"]):
            layers.append(Layer(row_img(r[0], r[1]), (pad, y), t0 + (k + 1) * step, None))
            y += rh
        q = Image.new("RGBA", (inner, 110), (0, 0, 0, 0))
        dq = ImageDraw.Draw(q)
        dq.rounded_rectangle((0, 14, inner, 106), 18, fill=hexrgb(S["tile_bg"]))
        dq.text((28, 60), "“" + card["quote"] + "”", font=font("Medium", 30), fill=hexrgb(S["row_label_color"]), anchor="lm")
        layers.append(Layer(q, (pad, y), t0 + 3 * step, None))
        y += 120
    elif T == "warranty":
        for k, (name, st, total) in enumerate(card["items"]):
            im = Image.new("RGBA", (inner, 150), (0, 0, 0, 0))
            dd = ImageDraw.Draw(im)
            dd.text((0, 34), name, font=font("Bold", 38), fill=hexrgb(INK), anchor="lm")
            dd.text((inner, 34), st, font=font("ExtraBold", 38), fill=hexrgb(S["muted"]), anchor="rm")
            dd.rounded_rectangle((0, 74, inner, 98), 12, fill=hexrgb(S["tile_off"]))
            dd.text((0, 128), total, font=font("Medium", 30), fill=hexrgb(S["row_label_color"]), anchor="lm")
            layers.append(Layer(im, (pad, y), t0 + k * step, "tick"))
            y += 160
    elif T == "price":
        im = Image.new("RGBA", (inner, 300), (0, 0, 0, 0))
        dd = ImageDraw.Draw(im)
        v = card["price_manwon"]
        big = f"{v:,}"
        fb = font("Black", 132)
        dd.text((0, 110), big, font=fb, fill=hexrgb(INK), anchor="lm")
        dd.text((text_w(fb, big) + 16, 132), "만원", font=font("Bold", 52), fill=hexrgb(INK), anchor="lm")
        dd.rounded_rectangle((0, 210, inner, 290), 20, fill=hexrgb(S["tile_bg"]))
        dd.text((28, 250), card["save_label"], font=font("SemiBold", 36), fill=hexrgb(S["row_label_color"]), anchor="lm")
        layers.append(Layer(im, (pad, y), t0, "tick"))
        layers.append(Layer(yellow_chip(f"{card['save_pct']}%", 50), (pad + inner - 170, y + 214), t0 + step * 1.5, "tick"))
        y += 310
    elif T == "views3":
        vw, vh = (inner - 24) // 3, 420
        for k, (fn, name) in enumerate(card["views"]):
            ph = Image.open(os.path.join(photos, fn)).convert("RGB")
            im = rounded(fit_cover(ph, vw, vh, (0.12, 0.05, 0.88, 0.95)), 20)
            dd = ImageDraw.Draw(im)
            pw = text_w(font("Bold", 34), name) + 36
            dd.rounded_rectangle((14, vh - 70, 14 + pw, vh - 16), 27, fill=(255, 255, 255, 235))
            dd.text((14 + pw // 2, vh - 43), name, font=font("Bold", 34), fill=hexrgb(INK), anchor="mm")
            layers.append(Layer(im, (pad + k * (vw + 12), y), t0 + k * step, "tick"))
        y += vh + 10

    if card.get("note"):
        nf = font("Medium", S["note_px"])
        im = Image.new("RGBA", (inner, 70), (0, 0, 0, 0))
        ImageDraw.Draw(im).text((0, 40), card["note"], font=nf, fill=hexrgb(S["muted"]), anchor="lm")
        layers.append(Layer(im, (pad, y), t0 + max(1, len(layers)) * step * 0.6, None))
        y += 70
    ch = y + pad
    base = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    bd = ImageDraw.Draw(base)
    bd.rounded_rectangle((0, 0, cw - 1, ch - 1), S["radius"], fill=hexrgb(S["bg"]))
    base.alpha_composite(head.crop((0, 0, cw, ch)))
    return base, layers, ch


def draw_bar(name, v, mx, inner, frac):
    S = SPEC["card"]
    bh = S["bar_row_h"]
    im = Image.new("RGBA", (inner, bh), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.text((0, 34), name, font=font("SemiBold", 36), fill=hexrgb(INK), anchor="lm")
    n = round(v * frac)
    d.text((inner, 34), f"{n}개", font=font("ExtraBold", 40), fill=hexrgb(INK), anchor="rm")
    d.rounded_rectangle((0, 70, inner, 94), 12, fill=hexrgb(S["tile_off"]))
    bw = int(inner * (v / mx) * frac)
    if bw > 24:
        d.rounded_rectangle((0, 70, bw, 94), 12, fill=hexrgb(YEL))
    return im


def caption_img(words, hl):
    """화면 아래 요약 자막: 흰 글자 + 그림자(be3_shadow), 강조 낱말만 노랑. 자막에 칠 없음."""
    C = SPEC["caption"]
    f = font("ExtraBold", C["px"])
    gap = C["gap"]
    widths = [text_w(f, w) for w in words]
    tw = sum(widths) + gap * (len(words) - 1)
    im = Image.new("RGBA", (tw + 80, C["px"] + 80), (0, 0, 0, 0))
    sh = Image.new("RGBA", im.size, (0, 0, 0, 0))
    ds, d = ImageDraw.Draw(sh), ImageDraw.Draw(im)
    x = 40
    for k, w in enumerate(words):
        ds.text((x + 3, 43), w, font=f, fill=(0, 0, 0, 200))
        d.text((x, 40), w, font=f, fill=hexrgb(YEL) if k in hl else (255, 255, 255, 255))
        x += widths[k] + gap
    sh = sh.filter(ImageFilter.GaussianBlur(C["shadow_blur"]))
    sh.alpha_composite(im)
    return sh


def top_title(car):
    f1, f2 = font("ExtraBold", SPEC["top"]["title_px"]), font("Medium", SPEC["top"]["meta_px"])
    im = Image.new("RGBA", (W, 200), (0, 0, 0, 0))
    sh = Image.new("RGBA", im.size, (0, 0, 0, 0))
    for layer, col, off in ((sh, (0, 0, 0, 170), 3), (im, None, 0)):
        d = ImageDraw.Draw(layer)
        d.text((W // 2 + off, 60 + off), f"{car['maker']} {car['model']}", font=f1, fill=col or (255, 255, 255, 255), anchor="mm")
        d.text((W // 2 + off, 130 + off), car["meta"], font=f2, fill=col or (255, 255, 255, 230), anchor="mm")
    sh = sh.filter(ImageFilter.GaussianBlur(6))
    sh.alpha_composite(im)
    return sh


def render_card(card, car, photos, out_mp4, sfx_dir, bgm):
    T = SPEC["timing"]
    base, layers, ch = card_frame(card, car, photos)
    n_layers = len(layers)
    last_appear = max([l.appear for l in layers] + [0.6])
    dur = round(max(T["min_dur"], last_appear + T["hold"]), 2)
    nfr = int(dur * FPS)
    bg_src = Image.open(os.path.join(photos, card["bg"])).convert("RGB")
    # 배경: 사진을 세로 화면에 꽉 채우고 흐리게·어둡게, 천천히 확대(1.00→1.06)
    big = fit_cover(bg_src, int(W * 1.08), int(H * 1.08))
    big = big.filter(ImageFilter.GaussianBlur(SPEC["bg"]["blur"]))
    dark = Image.new("RGB", big.size, (0, 0, 0))
    big = Image.blend(big, dark, SPEC["bg"]["darken"])
    # 위쪽에는 흐리지 않은 사진 띠(차가 보이게)
    # 세로 배치: 사진 띠 → 차명 2줄(170) → 카드 → 요약 자막. 카드가 길면 사진 띠를 줄인다(최소 photo_band_min)
    cw = SPEC["card"]["w"]
    cx = (W - cw) // 2
    by0 = SPEC["bg"]["photo_band_y"]
    cy = min(SPEC["card"]["y"], SPEC["caption"]["y"] - 80 - ch)
    band_h = max(SPEC["bg"]["photo_band_min"], min(SPEC["bg"]["photo_band_h"], cy - by0 - 190))
    cy = max(cy, by0 + band_h + 190)
    band = rounded(fit_cover(bg_src, W - 120, band_h), 28)
    title = top_title(car)
    cap = caption_img(card["caption"], card.get("hl", []))
    shadow = Image.new("RGBA", (cw + 120, ch + 120), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((60, 70, cw + 60, ch + 70), SPEC["card"]["radius"], fill=(0, 0, 0, 120))
    shadow = shadow.filter(ImageFilter.GaussianBlur(28))
    inner = cw - SPEC["card"]["pad"] * 2

    ff = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                           "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", out_mp4 + ".v.mp4"],
                          stdin=subprocess.PIPE)
    sfx_events = [(0.0, "whoosh")]
    for l in layers:
        if l.sfx:
            sfx_events.append((l.appear, "tick"))
    for fi in range(nfr):
        t = fi / FPS
        z = 1.0 + 0.06 * (t / dur)
        bw_, bh_ = int(W * z), int(H * z)
        bgf = big.resize((bw_, bh_), Image.BILINEAR) if fi % 2 == 0 or fi == 0 else bgf_prev
        bgf_prev = bgf
        fr = bgf.crop(((bw_ - W) // 2, (bh_ - H) // 2, (bw_ - W) // 2 + W, (bh_ - H) // 2 + H)).convert("RGBA")
        # 위 사진 띠(살짝 위로 흐름)
        by = SPEC["bg"]["photo_band_y"] - int(10 * t / dur)
        fr.alpha_composite(band, (60, by))
        fr.alpha_composite(title, (0, by + band_h + 10))
        # 카드 등장(0~0.45초, 아래에서 80px 떠오름)과 퇴장(끝 0.3초 페이드)
        ein = ease_out(t / T["card_in"])
        eout = 1.0 - max(0.0, (t - (dur - T["card_out"])) / T["card_out"])
        a = ein * eout
        dy = int((1 - ein) * 80)
        cardim = base.copy()
        for l in layers:
            lt = (t - l.appear) / T["row_in"]
            if lt <= 0:
                continue
            e = ease_out(lt)
            if isinstance(l.im, tuple):
                _, name, v, mx = l.im
                piece = draw_bar(name, v, mx, inner, ease_out((t - l.appear) / T["bar_grow"]))
            else:
                piece = l.im
            if e < 1:
                piece = piece.copy()
                piece.putalpha(piece.getchannel("A").point(lambda p, e=e: int(p * e)))
            cardim.alpha_composite(piece, (l.xy[0], l.xy[1] + int((1 - e) * 20)))
        if a < 1:
            cardim.putalpha(cardim.getchannel("A").point(lambda p, a=a: int(p * a)))
            sh = shadow.copy()
            sh.putalpha(sh.getchannel("A").point(lambda p, a=a: int(p * a)))
        else:
            sh = shadow
        fr.alpha_composite(sh, (cx - 60, cy + dy - 60))
        fr.alpha_composite(cardim, (cx, cy + dy))
        if t >= T["caption_in"] and t < dur - T["card_out"]:
            fr.alpha_composite(cap, ((W - cap.width) // 2, SPEC["caption"]["y"] - cap.height // 2))
        ff.stdin.write(fr.convert("RGB").tobytes())
    ff.stdin.close()
    ff.wait()
    mix_audio(out_mp4, dur, sfx_events, sfx_dir, bgm)
    return dur


def mix_audio(out_mp4, dur, events, sfx_dir, bgm):
    A = SPEC["audio"]
    inputs = ["-i", out_mp4 + ".v.mp4"]
    filt = []
    n = 1
    labels = []
    if bgm and os.path.exists(bgm):
        inputs += ["-i", bgm]
        filt.append(f"[{n}:a]atrim=0:{dur},afade=t=in:d=0.3,afade=t=out:st={dur-0.5}:d=0.5,volume={A['bgm_gain']}[bg]")
        labels.append("[bg]")
        n += 1
    for k, (t, kind) in enumerate(events):
        p = os.path.join(sfx_dir, A["sfx"][kind])
        if not os.path.exists(p):
            continue
        inputs += ["-i", p]
        ms = int(t * 1000)
        filt.append(f"[{n}:a]volume={A['gain'][kind]},adelay={ms}|{ms}[s{k}]")
        labels.append(f"[s{k}]")
        n += 1
    if not labels:
        os.replace(out_mp4 + ".v.mp4", out_mp4)
        return
    filt.append(f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0,apad,atrim=0:{dur},"
                f"loudnorm=I={RULES['audio']['loudness_lufs']}:TP={RULES['audio'].get('true_peak_db', -1.5)}:LRA=11[a]")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *inputs, "-filter_complex", ";".join(filt), "-map", "0:v", "-map", "[a]",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest", out_mp4], check=True)
    os.remove(out_mp4 + ".v.mp4")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("data")
    ap.add_argument("--photos", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--only", default="")
    ap.add_argument("--assets", default=os.environ.get("BBM_SHORTFORM_ASSETS", os.path.join(SF, "..", "..", "public", "assets", "shortform")))
    ap.add_argument("--reel", action="store_true", help="모든 카드를 이어 붙인 한 편도 만든다")
    a = ap.parse_args()
    data = json.load(open(a.data if os.path.isabs(a.data) else os.path.join(HERE, a.data), encoding="utf-8"))
    os.makedirs(a.out, exist_ok=True)
    only = set(filter(None, a.only.split(",")))
    sfx_dir = os.path.join(a.assets, "sfx")
    bgm = os.path.join(a.assets, "bgm", SPEC["audio"]["bgm"])
    made = []
    for c in data["cards"]:
        if only and c["id"] not in only:
            continue
        out = os.path.join(a.out, f"card_{c['id']}.mp4")
        d = render_card(c, data["car"], a.photos, out, sfx_dir, bgm)
        made.append(out)
        print(f"{c['id']:<14} {d:5.2f}s  {out}")
    if a.reel and len(made) > 1:
        lst = os.path.join(a.out, "reel_list.txt")
        open(lst, "w").write("".join(f"file '{os.path.abspath(p)}'\n" for p in made))
        reel = os.path.join(a.out, "card_reel_all.mp4")
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c:v", "copy",
                        "-af", f"loudnorm=I={RULES['audio']['loudness_lufs']}:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", reel], check=True)
        print("reel", reel)


if __name__ == "__main__":
    main()
