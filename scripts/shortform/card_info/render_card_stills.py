#!/usr/bin/env python3
"""카드 정보 기법 — 기준 정지 화면(PNG) 렌더러.

시안 1·2가 영상으로 움직이기 전에 '최종 프레임이 이렇게 생겨야 한다'는 기준을
같은 값으로 뽑는다. 숫자는 card_rules.json · be_locked_rules.json에서만 읽는다.

사용:
  python3 scripts/shortform/card_info/render_card_stills.py \
      scripts/shortform/card_info/samples/g400d_cards_input.json out_dir [배경사진.jpg]
"""
import io, json, os, re, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
RULES = json.load(open(os.path.join(HERE, "card_rules.json"), encoding="utf-8"))
BE = json.load(open(os.path.join(ROOT, "scripts/shortform/be_locked_rules.json"), encoding="utf-8"))
FONT_DIR = os.path.join(ROOT, "scripts/shortform/fonts")
ICON_DIR = os.path.join(ROOT, "scripts/shortform/photo_listing/fluent3d")
BRUSH_DIR = os.path.join(ROOT, "public/assets/shortform/brush-fill/as24-theme")


def color(v):
    if v == "ink" or v == "be_locked.color.ink":
        v = BE["color"]["ink"]
    if v == "be_locked.color.yellow":
        v = BE["color"]["yellow"]
    v = v.lstrip("#")
    return tuple(int(v[i:i + 2], 16) for i in (0, 2, 4))


def font(weight, px):
    return ImageFont.truetype(os.path.join(FONT_DIR, f"Pretendard-{weight}.otf"), px)


def fmt(key, v):
    f = RULES["format"].get(key)
    if f is None or not isinstance(v, (int, float)):
        return str(v)
    return f.format(v=v)


def background(photo):
    W, H = RULES["canvas"]["w"], RULES["canvas"]["h"]
    bg = RULES["background"]
    if photo and os.path.exists(photo):
        im = Image.open(photo).convert("RGB")
        s = max(W / im.width, H / im.height)
        im = im.resize((int(im.width * s), int(im.height * s)))
        l, t = (im.width - W) // 2, (im.height - H) // 2
        im = im.crop((l, t, l + W, t + H)).filter(ImageFilter.GaussianBlur(bg["blur_px"]))
    else:  # fallback: 잉크색 세로 그라데이션
        ink = color("ink")
        im = Image.new("RGB", (W, H))
        d = ImageDraw.Draw(im)
        for y in range(H):
            k = 0.55 + 0.45 * (y / H)
            d.line([(0, y), (W, y)], fill=tuple(int(c * k + 40 * (1 - k)) for c in ink))
    dim = Image.new("RGB", (W, H), (0, 0, 0))
    return Image.blend(im, dim, bg["dim"])


def brush_plate(w, h):
    """노션 원본 칠(as24-theme)을 같은 배율로 키워 노랑으로 칠한다. 가로·세로 비율이 가장 가까운 원본을 고른다."""
    import cairosvg
    want = w / h
    best = None
    for name in BE["chip"]["fill_fit"]["shapes"]:
        a, b = map(int, name.split("_"))
        diff = abs(a / b - want)
        if best is None or diff < best[0]:
            best = (diff, name, a, b)
    _, name, a, b = best
    svg = open(os.path.join(BRUSH_DIR, f"{name}.svg"), encoding="utf-8").read()
    # 원본 칠 색(민트 #00FFD0 등)을 노랑 하나로만 바꾼다. 모양(path)은 손대지 않는다.
    y = BE["color"]["yellow"]
    svg = re.sub(r'(fill\s*[:=]\s*"?)\s*(#[0-9A-Fa-f]{3,6}|rgb\([^)]*\))', lambda m: m.group(1) + y, svg)
    s = h / b
    png = cairosvg.svg2png(bytestring=svg.encode(), output_width=int(a * s), output_height=h)
    return Image.open(io.BytesIO(png)).convert("RGBA")


def title_chip(img, text, icon_code):
    chip = BE["chip"]
    f = font("ExtraBold", chip["title_font_px"])
    d = ImageDraw.Draw(img)
    l, t, r, b = d.textbbox((0, 0), text, font=f)
    ink_h = b - t
    band_h = int(ink_h * chip["fill_fit"]["band_to_ink"])
    pad = int(ink_h * sum(chip["fill_fit"]["side_pad_ink"]) / 2)
    plate = brush_plate((r - l) + pad * 2, band_h)
    W = img.width
    x = (W - plate.width) // 2
    y = chip["y_top_px"]
    img.alpha_composite(plate, (x, y))
    lift = int(ink_h * chip["fill_fit"]["text_lift_ink"])
    tx = x + (plate.width - (r - l)) // 2 - l
    ty = y + (band_h - ink_h) // 2 - t - lift
    d.text((tx, ty), text, font=f, fill=color(chip["text_color"]))
    ip = os.path.join(ICON_DIR, f"{icon_code}.png")
    if os.path.exists(ip):
        ih = int(band_h * BE["icon"]["height_vs_chip"])
        ic = Image.open(ip).convert("RGBA").resize((ih, ih))
        img.alpha_composite(ic, (x + plate.width - ih // 3, y + (band_h - ih) // 2))


def rounded_card(img, x, y, w, h):
    c = RULES["card"]
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((x, y + c["shadow"]["y"], x + w, y + h + c["shadow"]["y"]),
                                         c["radius"], fill=(0, 0, 0, int(255 * c["shadow"]["alpha"])))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(c["shadow"]["blur"] / 2)))
    ImageDraw.Draw(img).rounded_rectangle((x, y, x + w, y + h), c["radius"], fill=color(c["fill"]))


def render_rows(img, rows, hl_key):
    c, r = RULES["card"], RULES["row"]
    h = c["pad"] * 2 + r["h"] * len(rows)
    assert c["y"] + h <= c["max_bottom_px"], "카드가 자막 자리를 침범"
    rounded_card(img, c["x"], c["y"], c["w"], h)
    d = ImageDraw.Draw(img)
    fl, fv = font("Medium", r["label_px"]), font("ExtraBold", r["value_px"])
    for i, (key, label, val) in enumerate(rows):
        top = c["y"] + c["pad"] + i * r["h"]
        mid = top + r["h"] // 2
        d.text((c["x"] + c["pad"], mid), label, font=fl, fill=color(r["label_color"]), anchor="lm")
        right = c["x"] + c["w"] - c["pad"]
        if key == hl_key:
            l, t, rr, b = d.textbbox((right, mid), val, font=fv, anchor="rm")
            d.rectangle((l - 10, mid + 2, rr + 10, b + 6), fill=color(RULES["highlight"]["color"]))
        d.text((right, mid), val, font=fv, fill=color(r["value_color"]), anchor="rm")
        if i < len(rows) - 1:
            d.line((c["x"] + c["pad"], top + r["h"], right, top + r["h"]), fill=color(r["divider"]), width=2)


def render_grid(img, items):
    c, g = RULES["card"], RULES["grid"]
    items = items[: g["max_items"]]
    rows = (len(items) + g["cols"] - 1) // g["cols"]
    h = c["pad"] * 2 + g["cell_h"] * rows
    assert c["y"] + h <= c["max_bottom_px"], "카드가 자막 자리를 침범"
    rounded_card(img, c["x"], c["y"], c["w"], h)
    d = ImageDraw.Draw(img)
    f = font("Bold", g["label_px"])
    cw = (c["w"] - c["pad"] * 2) // g["cols"]
    ok = Image.open(os.path.join(ICON_DIR, "2705.png")).convert("RGBA").resize((g["icon_px"] // 2, g["icon_px"] // 2))
    for i, name in enumerate(items):
        cx = c["x"] + c["pad"] + (i % g["cols"]) * cw + cw // 2
        cy = c["y"] + c["pad"] + (i // g["cols"]) * g["cell_h"]
        img.alpha_composite(ok, (cx - ok.width // 2, cy + 18))
        d.text((cx, cy + 18 + ok.height + 24), name, font=f, fill=color("ink"), anchor="mt")


def render_lines(img, lines):
    rows = [(None, f"{i + 1}", v) for i, v in enumerate(lines[: RULES["row"]["max_rows"]])]
    c, r = RULES["card"], RULES["row"]
    h = c["pad"] * 2 + r["h"] * len(rows)
    rounded_card(img, c["x"], c["y"], c["w"], h)
    d = ImageDraw.Draw(img)
    f = font("Bold", r["value_px"] - 6)
    for i, (_, _, v) in enumerate(rows):
        mid = c["y"] + c["pad"] + i * r["h"] + r["h"] // 2
        d.text((c["x"] + c["pad"], mid), "· " + v, font=f, fill=color("ink"), anchor="lm")


def render_timeline(img, events, footnote):
    c, tl = RULES["card"], RULES["timeline_layout"]
    events = events[: RULES["types"]["timeline"]["max_events"]]
    foot_h = tl["footnote_px"] + 24 if footnote else 0
    h = c["pad"] * 2 + tl["row_h"] * len(events) + foot_h
    assert c["y"] + h <= c["max_bottom_px"], "카드가 자막 자리를 침범"
    rounded_card(img, c["x"], c["y"], c["w"], h)
    d = ImageDraw.Draw(img)
    fd, ft = font("SemiBold", tl["date_px"]), font("Bold", tl["text_px"])
    lx = c["x"] + tl["line_x"] + c["pad"]
    y0 = c["y"] + c["pad"] + tl["row_h"] // 2
    y1 = y0 + tl["row_h"] * (len(events) - 1)
    d.line((lx, y0, lx, y1), fill=color(tl["line_color"]), width=4)
    r = tl["dot_px"] // 2
    for i, ev in enumerate(events):
        y = y0 + i * tl["row_h"]
        last = i == len(events) - 1
        d.ellipse((lx - r, y - r, lx + r, y + r), fill=color("be_locked.color.yellow" if last else "ink"),
                  outline=color("ink"), width=3)
        d.text((lx - r - 20, y), ev["date"], font=fd, fill=color(RULES["row"]["label_color"]), anchor="rm")
        d.text((lx + r + 24, y), ev["text"], font=ft, fill=color("ink"), anchor="lm")
    if footnote:
        d.text((c["x"] + c["pad"], c["y"] + h - c["pad"] // 2 - tl["footnote_px"] // 2), footnote,
               font=font("Medium", tl["footnote_px"]), fill=color(tl["footnote_color"]), anchor="lm")


def card_rows(t, data):
    spec = RULES["types"][t]
    rows = []
    for k in spec["fields"]:
        v = data.get(k)
        if v in (None, "", []):
            continue
        rows.append((k, RULES["labels"].get(k, k), fmt(k, v)))
    return rows


def main():
    src, out = sys.argv[1], sys.argv[2]
    photo = sys.argv[3] if len(sys.argv) > 3 else None
    inp = json.load(open(src, encoding="utf-8"))
    os.makedirs(out, exist_ok=True)
    banned = RULES["banned_words"]
    plan = []
    for t in RULES["order"]:
        spec, data = RULES["types"][t], inp.get(t) or {}
        img = background(photo).convert("RGBA")
        if spec.get("layout") == "timeline":
            evs = data.get("events") or []
            if len(evs) < RULES["row"]["min_rows"]:
                plan.append((t, "생략")); continue
            render_timeline(img, evs, data.get("footnote"))
            n = min(len(evs), spec["max_events"])
        elif spec.get("layout") == "grid":
            items = data.get("options_basic") or []
            if len(items) < RULES["row"]["min_rows"]:
                plan.append((t, "생략")); continue
            render_grid(img, items)
            n = (len(items) + 2) // 3
        elif t in ("features", "seller", "extra_options"):
            lines = data.get(spec["fields"][0])
            if not lines or len(lines) < RULES["row"]["min_rows"]:
                plan.append((t, "생략")); continue
            render_lines(img, lines)
            n = len(lines)
        else:
            rows = card_rows(t, data)
            if len(rows) < RULES["row"]["min_rows"]:
                plan.append((t, "생략")); continue
            render_rows(img, rows, spec.get("highlight"))
            n = len(rows)
        text_all = json.dumps(data, ensure_ascii=False)
        bad = [w for w in banned if w in text_all]
        assert not bad, f"{t}: 금지 낱말 {bad}"
        title_chip(img, spec["title"], spec["icon"])
        tm = RULES["timing"]
        sec = min(max(tm["card_in_s"] + n * tm["row_stagger_s"] + tm["hold_after_last_row_s"] + tm["card_out_s"],
                      tm["min_card_s"]), tm["max_card_s"])
        idx = len([p for p in plan if p[1] != "생략"]) + 1
        name = f"{idx:02d}_{t}.png"
        img.convert("RGB").save(os.path.join(out, name))
        plan.append((t, f"{name} · {sec:.2f}s"))
    total = sum(float(p[1].split("· ")[1][:-1]) for p in plan if p[1] != "생략")
    for p in plan:
        print(f"{p[0]:14s} {p[1]}")
    print(f"합계 {total:.1f}s (허용 {RULES['timing']['total_s']})")


if __name__ == "__main__":
    main()
