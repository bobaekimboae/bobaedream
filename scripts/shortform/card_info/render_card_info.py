"""카드 정보 숏폼(독립 컷 카드 묶음) 렌더러 v0.2 — 2026-11-26 클로드 시안 (2차 제안: 엔카 기본 순서 + 차량 이력 타임라인 + 카드 1개~여러 개)

python3 render_card_info.py <차 폴더> [출력.mp4] [--clips]
  <차 폴더>/facts.json   cards_from_charancha.py 결과(사실 원장)
  <차 폴더>/plan.json    말 덩어리(chunks: 자막 글자·받아쓰기 기준 낱말·카드 시작·공개 단계·효과음) + 카드별 내용
  <차 폴더>/voice/…      내레이션 음성 + 받아쓰기 낱말 시각(whisper_words.json)
  --clips               카드 종류마다 따로 자른 mp4도 만든다(<출력>_<종류>.mp4)

규칙 값은 card_info_rules.json(배치·움직임·카드 종류)과 be_locked_rules.json(노랑·자막 크기·음량)에서만 읽는다.
카드 모양: 종이색 판 + 먹색 글자, 강조는 노랑 한 색(값 밑줄·✓ 원), 확인 필요는 먹색 테두리 원 「!」.
렌더 뒤 <출력>.plan.json 에 카드 시각·효과음·자막을 남긴다(검수용).
"""
import json, math, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
SF = os.path.dirname(HERE)
ROOT = os.path.abspath(os.path.join(SF, '..', '..'))
sys.path.insert(0, SF)
import brushfill  # noqa: E402

RULES = json.load(open(os.path.join(HERE, 'card_info_rules.json'), encoding='utf-8'))
BE = json.load(open(os.path.join(SF, 'be_locked_rules.json'), encoding='utf-8'))
W, H, FPS = RULES['canvas']['w'], RULES['canvas']['h'], RULES['canvas']['fps']
L, M = RULES['layout'], RULES['motion']
FONT = os.path.join(SF, 'fonts')
def F(w, s): return ImageFont.truetype(os.path.join(FONT, f'Pretendard-{w}.otf'), s)
hx = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
YEL = hx(BE['color']['yellow']); INK = hx(BE['color']['ink'])
PAPER = (251, 250, 246); GREY = (118, 118, 118); FAINT = (206, 202, 194); LINE = (230, 227, 218); TILE_OFF = (244, 242, 236)
SFX_DIR = os.path.join(ROOT, 'public', 'assets', 'shortform', 'sfx')
BGM_DIR = os.path.join(ROOT, 'public', 'assets', 'shortform', 'bgm')
X0, X1 = L['card_x_px']; Y0 = L['card_top_px']


# ───────── 공용 그리기 ─────────
def cover(im, w, h):
    sc = max(w / im.width, h / im.height)
    im = im.resize((int(im.width * sc) + 1, int(im.height * sc) + 1), Image.LANCZOS)
    x = (im.width - w) // 2; y = (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))


def bg_of(path):
    im = cover(Image.open(path).convert('RGB'), W, H).filter(ImageFilter.GaussianBlur(L['bg_blur_px']))
    return Image.eval(im, lambda v: int(v * L['bg_dim'])).convert('RGBA')


def panel(layer, box):
    x0, y0, x1, y1 = box
    sh = Image.new('L', (W, H), 0)
    ImageDraw.Draw(sh).rounded_rectangle((x0, y0 + 16, x1, y1 + 16), L['card_radius_px'], fill=140)
    sh = sh.filter(ImageFilter.GaussianBlur(20))
    layer.paste(Image.new('RGBA', (W, H), (0, 0, 0, 255)), (0, 0), sh)
    ImageDraw.Draw(layer).rounded_rectangle(box, L['card_radius_px'], fill=PAPER)


def header(d, car_line, sub):
    d.text((X0 + 44, Y0 + 62), car_line, font=F('Bold', 38), fill=INK, anchor='lm')
    d.text((X1 - 44, Y0 + 62), sub, font=F('SemiBold', 28), fill=GREY, anchor='rm')
    d.line([(X0 + 40, Y0 + 120), (X1 - 40, Y0 + 120)], fill=LINE, width=2)
    return Y0 + 120


def underline(d, xy, text, font, anchor='lm'):
    bb = d.textbbox(xy, text, font=font, anchor=anchor)
    d.rectangle((bb[0] - 8, bb[3] - int((bb[3] - bb[1]) * .34), bb[2] + 8, bb[3] + 4), fill=YEL)


def mark(d, cx, cy, kind, on, r=28):
    if not on:
        d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=FAINT, width=3); return
    if kind == 'ok':
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=YEL)
        d.line([(cx - 13, cy + 1), (cx - 3, cy + 11), (cx + 14, cy - 10)], fill=INK, width=7, joint='curve')
    else:
        d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=INK, width=4)
        d.text((cx, cy + 1), '!' if kind == 'warn' else 'i', font=F('Black', 36), fill=INK, anchor='mm')


def photo_box(layer, path, box, r=20):
    x0, y0, x1, y1 = box
    ph = cover(Image.open(path).convert('RGB'), x1 - x0, y1 - y0)
    m = Image.new('L', ph.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, ph.width, ph.height), r, fill=255)
    layer.paste(ph, (x0, y0), m)


def foot(d, y, text):
    ls = text.split('\n')
    for i, ln in enumerate(ls):
        d.text((W // 2, y + (i - (len(ls) - 1) / 2) * 38), ln, font=F('Medium', 26), fill=GREY, anchor='mm')


# ───────── 카드 종류별 단계 그림 (k = 켜진 칸 수) ─────────
def card_overview(c, k, car):
    rows = [c['tiles'][i:i + 2] for i in range(0, len(c['tiles']), 2)]
    ph_h = 400; th = 176
    yt = Y0 + 120 + 28 + ph_h + 28
    y1 = yt + th * len(rows) + 24
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0)); panel(lay, (X0, Y0, X1, y1))
    d = ImageDraw.Draw(lay); header(d, car, c['sub'])
    photo_box(lay, c['photo'], (X0 + 30, Y0 + 148, X1 - 30, Y0 + 148 + ph_h))
    n = 0
    for r, row in enumerate(rows):
        for ci, (lab, val) in enumerate(row):
            bw = (X1 - X0 - 60) // 2
            bx0 = X0 + 30 + ci * bw + (10 if ci else 0); bx1 = bx0 + bw - 10
            by0 = yt + th * r; by1 = by0 + th - 16
            on = n < k; n += 1
            d.rounded_rectangle((bx0, by0, bx1, by1), 18, fill=(255, 255, 255) if on else TILE_OFF, outline=LINE, width=2)
            d.text((bx0 + 30, by0 + 44), lab, font=F('SemiBold', 30), fill=GREY if on else FAINT, anchor='lm')
            fv = F('Black', 56)
            if on: underline(d, (bx0 + 30, by1 - 50), val, fv)
            d.text((bx0 + 30, by1 - 50), val, font=fv, fill=INK if on else FAINT, anchor='lm')
    return lay, len(c['tiles'])


def card_rows(c, k, car):
    rows = c['rows']; rh = 112
    yr = Y0 + 120 + 24
    y1 = yr + rh * len(rows) + (96 if c.get('foot') else 30)
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0)); panel(lay, (X0, Y0, X1, y1))
    d = ImageDraw.Draw(lay); header(d, car, c['sub'])
    for i, (a, b, kind) in enumerate(rows):
        yy = yr + rh * i; cy = yy + rh / 2; on = i < k
        if i: d.line([(X0 + 40, yy), (X1 - 40, yy)], fill=LINE, width=2)
        mark(d, X0 + 78, cy, kind, on)
        d.text((X0 + 128, cy), a, font=F('Bold', 40), fill=INK if on else FAINT, anchor='lm')
        if on:
            fb = F('Black', 42)
            if kind == 'warn': underline(d, (X1 - 44, cy), b, fb, anchor='rm')
            d.text((X1 - 44, cy), b, font=fb, fill=INK, anchor='rm')
    if c.get('foot'):
        foot(d, y1 - 48, c['foot'])
    return lay, len(rows)


def card_options(c, k, car):
    th = 250; yt = Y0 + 120 + 170
    y1 = yt + th * 2 + 24 + (70 if c.get('foot') else 0)
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0)); panel(lay, (X0, Y0, X1, y1))
    d = ImageDraw.Draw(lay); header(d, car, c['sub'])
    if c.get('foot'): foot(d, y1 - 52, c['foot'])
    fb = F('Black', 96); xy = (W // 2, Y0 + 120 + 86)
    d.text((W // 2 - 150, xy[1]), '총', font=F('Bold', 44), fill=INK if k else FAINT, anchor='rm')
    if k: underline(d, (W // 2 - 120, xy[1]), c['total'], fb)
    d.text((W // 2 - 120, xy[1]), c['total'], font=fb, fill=INK if k else FAINT, anchor='lm')
    for i, (name, cnt, ex) in enumerate(c['tiles']):
        r, ci = divmod(i, 2); bw = (X1 - X0 - 60) // 2
        bx0 = X0 + 30 + ci * bw + (10 if ci else 0); bx1 = bx0 + bw - 10
        by0 = yt + th * r; by1 = by0 + th - 16; on = i + 1 < k
        d.rounded_rectangle((bx0, by0, bx1, by1), 18, fill=(255, 255, 255) if on else TILE_OFF, outline=LINE, width=2)
        d.text((bx0 + 30, by0 + 46), name, font=F('SemiBold', 32), fill=GREY if on else FAINT, anchor='lm')
        fv = F('Black', 84)
        if on: underline(d, (bx0 + 30, by0 + 128), cnt, fv)
        d.text((bx0 + 30, by0 + 128), cnt, font=fv, fill=INK if on else FAINT, anchor='lm')
        wv = d.textlength(cnt, font=fv)
        d.text((bx0 + 40 + wv, by0 + 140), '개', font=F('Bold', 36), fill=INK if on else FAINT, anchor='lm')
        d.text((bx0 + 30, by1 - 36), ex, font=F('Medium', 25), fill=GREY if on else FAINT, anchor='lm')
    return lay, 1 + len(c['tiles'])


def card_features(c, k, car):
    ph_h = 430; th = 210
    yl = Y0 + 148 + ph_h + 54; yt = yl + 46
    y1 = yt + th + 92
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0)); panel(lay, (X0, Y0, X1, y1))
    d = ImageDraw.Draw(lay); header(d, car, c['sub'])
    photo_box(lay, c['photo'], (X0 + 30, Y0 + 148, X1 - 30, Y0 + 148 + ph_h))
    d = ImageDraw.Draw(lay)
    d.text((W // 2, yl), c['line'], font=F('Bold', 34), fill=INK, anchor='mm')
    n = len(c['tiles']); bw = (X1 - X0 - 60 - 20 * (n - 1)) // n
    for i, (big, unit, name) in enumerate(c['tiles']):
        bx0 = X0 + 30 + i * (bw + 20); bx1 = bx0 + bw; by0 = yt; by1 = yt + th; on = i < k
        d.rounded_rectangle((bx0, by0, bx1, by1), 18, fill=(255, 255, 255) if on else TILE_OFF, outline=LINE, width=2)
        cx = (bx0 + bx1) // 2; fb = F('Black', 74); fu = F('Bold', 30)
        wb = d.textlength(big, font=fb); wu = d.textlength(unit, font=fu); xs = cx - (wb + 6 + wu) / 2
        if on: underline(d, (xs, by0 + 86), big, fb)
        d.text((xs, by0 + 86), big, font=fb, fill=INK if on else FAINT, anchor='lm')
        d.text((xs + wb + 6, by0 + 98), unit, font=fu, fill=INK if on else FAINT, anchor='lm')
        d.text((cx, by1 - 40), name, font=F('SemiBold', 28), fill=GREY if on else FAINT, anchor='mm')
    foot(d, y1 - 44, c['foot'])
    return lay, n


def card_seller(c, k, car):
    y1 = Y0 + 120 + 640
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0)); panel(lay, (X0, Y0, X1, y1))
    d = ImageDraw.Draw(lay); header(d, car, c['sub'])
    on1, on2 = k >= 1, k >= 2
    y = Y0 + 120 + 80
    # 프로필 자리(사진 없음): 먹색 원 + 이름 첫 글자
    d.ellipse((X0 + 44, y - 50, X0 + 144, y + 50), fill=INK if on1 else FAINT)
    d.text((X0 + 94, y + 2), c['name'][0], font=F('Black', 48), fill=PAPER, anchor='mm')
    d.text((X0 + 172, y - 20), c['name'], font=F('Black', 50), fill=INK if on1 else FAINT, anchor='lm')
    d.text((X0 + 172, y + 32), c['company'], font=F('SemiBold', 30), fill=GREY if on1 else FAINT, anchor='lm')
    y2 = y + 104
    fe = F('Bold', 34)
    if on1: underline(d, (X0 + 44, y2), c['estate'], fe)
    d.text((X0 + 44, y2), c['estate'], font=fe, fill=INK if on1 else FAINT, anchor='lm')
    yt = y2 + 60; bw = (X1 - X0 - 70) // 2
    for i, (lab, val) in enumerate(c['stats']):
        bx0 = X0 + 30 + i * (bw + 10); bx1 = bx0 + bw; by1 = yt + 170
        d.rounded_rectangle((bx0, yt, bx1, by1), 18, fill=(255, 255, 255) if on2 else TILE_OFF, outline=LINE, width=2)
        d.text((bx0 + 30, yt + 44), lab, font=F('SemiBold', 30), fill=GREY if on2 else FAINT, anchor='lm')
        fv = F('Black', 64)
        if on2 and i == 1: underline(d, (bx0 + 30, by1 - 52), val, fv)
        d.text((bx0 + 30, by1 - 52), val, font=fv, fill=INK if on2 else FAINT, anchor='lm')
    yq = yt + 170 + 40
    d.rounded_rectangle((X0 + 30, yq, X1 - 30, yq + 110), 18, fill=(255, 255, 255) if on2 else TILE_OFF)
    d.text((X0 + 60, yq + 55), f"“{c['quote']}”", font=F('Bold', 36), fill=INK if on2 else FAINT, anchor='lm')
    d.text((X1 - 60, yq + 55), '판매자 소개', font=F('Medium', 26), fill=GREY if on2 else FAINT, anchor='rm')
    return lay, 2


def card_price(c, k, car):
    y1 = Y0 + 120 + 600
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0)); panel(lay, (X0, Y0, X1, y1))
    d = ImageDraw.Draw(lay); header(d, car, c['sub'])
    y = Y0 + 120 + 110
    d.text((X0 + 60, y), c['old_label'], font=F('SemiBold', 34), fill=GREY if k >= 1 else FAINT, anchor='lm')
    fo = F('Bold', 60)
    d.text((X1 - 60, y), c['old'], font=fo, fill=GREY if k >= 1 else FAINT, anchor='rm')
    if k >= 1:
        bb = d.textbbox((X1 - 60, y), c['old'], font=fo, anchor='rm')
        d.line([(bb[0] - 6, (bb[1] + bb[3]) // 2), (bb[2] + 6, (bb[1] + bb[3]) // 2)], fill=GREY, width=5)
    d.text((W // 2, y + 110), '↓', font=F('Black', 64), fill=INK if k >= 2 else FAINT, anchor='mm')
    y2 = y + 230
    d.text((X0 + 60, y2), c['new_label'], font=F('Bold', 36), fill=INK if k >= 2 else FAINT, anchor='lm')
    fn = F('Black', 84)
    if k >= 2: underline(d, (X1 - 60, y2), c['new'], fn, anchor='rm')
    d.text((X1 - 60, y2), c['new'], font=fn, fill=INK if k >= 2 else FAINT, anchor='rm')
    if k >= 2:
        fbd = F('Black', 38); tw = d.textlength(c['badge'], font=fbd)
        d.rounded_rectangle((W // 2 - tw / 2 - 30, y2 + 90, W // 2 + tw / 2 + 30, y2 + 160), 35, fill=INK)
        d.text((W // 2, y2 + 125), c['badge'], font=fbd, fill=YEL, anchor='mm')
    foot(d, y1 - 44, c['foot'])
    return lay, 2


def card_market(c, k, car):
    y1 = Y0 + 120 + 520
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0)); panel(lay, (X0, Y0, X1, y1))
    d = ImageDraw.Draw(lay); header(d, car, c['sub'])
    bx0, bx1 = X0 + 80, X1 - 80; by = Y0 + 120 + 250
    d.rounded_rectangle((bx0, by - 14, bx1, by + 14), 14, fill=TILE_OFF)
    if k >= 1:
        d.rounded_rectangle((bx0, by - 14, bx1 if k >= 2 else (bx0 + bx1) // 2, by + 14), 14, fill=INK)
        d.text((bx0, by + 64), c['low_t'], font=F('Bold', 36), fill=INK, anchor='lm')
        d.text((bx0, by + 110), '낮은 쪽', font=F('Medium', 26), fill=GREY, anchor='lm')
    if k >= 2:
        d.text((bx1, by + 64), c['high_t'], font=F('Bold', 36), fill=INK, anchor='rm')
        d.text((bx1, by + 110), '높은 쪽', font=F('Medium', 26), fill=GREY, anchor='rm')
        px = bx0 + (bx1 - bx0) * (c['price'] - c['low']) / (c['high'] - c['low'])
        d.ellipse((px - 30, by - 30, px + 30, by + 30), fill=YEL, outline=INK, width=5)
        fp = F('Black', 40); tw = d.textlength(c['price_t'], font=fp)
        tx = min(max(px, bx0 + tw / 2 + 10), bx1 - tw / 2 - 10)
        d.rounded_rectangle((tx - tw / 2 - 24, by - 140, tx + tw / 2 + 24, by - 66), 20, fill=INK)
        d.polygon([(px - 14, by - 68), (px + 14, by - 68), (px, by - 44)], fill=INK)
        d.text((tx, by - 103), c['price_t'], font=fp, fill=YEL, anchor='mm')
    foot(d, y1 - 44, c['foot'])
    return lay, 2


def card_timeline(c, k, car):
    """차량 이력 타임라인: 세로 선 위에 날짜 있는 사건을 시간 순서로. 마지막(지금) 값만 노랑 밑줄."""
    ev = c['events']; rh = 132
    yr = Y0 + 120 + 30
    y1 = yr + rh * len(ev) + (40 + 38 * (c.get('foot', '').count('\n') + 1) + 30 if c.get('foot') else 30)
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0)); panel(lay, (X0, Y0, X1, y1))
    d = ImageDraw.Draw(lay); header(d, car, c['sub'])
    lx = X0 + 262
    d.line([(lx, yr + rh / 2), (lx, yr + rh * (len(ev) - .5))], fill=LINE, width=6)
    for i, e in enumerate(ev):
        cy = yr + rh * i + rh / 2; on = i < k; last = i == len(ev) - 1
        if on and i:
            d.line([(lx, yr + rh * (i - .5)), (lx, cy)], fill=INK, width=6)
        r = 20 if last else 15
        if on:
            d.ellipse((lx - r, cy - r, lx + r, cy + r), fill=YEL if last else INK, outline=INK, width=4)
        else:
            d.ellipse((lx - r, cy - r, lx + r, cy + r), fill=PAPER, outline=FAINT, width=4)
        d.text((lx - 44, cy), e['date'], font=F('Black' if last else 'Bold', 40), fill=INK if on else FAINT, anchor='rm')
        tx = lx + 46
        if e.get('val'):
            d.text((tx, cy - 24), e['what'], font=F('Bold', 38), fill=INK if on else FAINT, anchor='lm')
            fv = F('Black', 40)
            if on and last: underline(d, (tx, cy + 26), e['val'], fv)
            d.text((tx, cy + 26), e['val'], font=fv, fill=INK if on else FAINT, anchor='lm')
        else:
            d.text((tx, cy), e['what'], font=F('Bold', 40), fill=INK if on else FAINT, anchor='lm')
    if c.get('foot'):
        foot(d, y1 - 30 - 19 * (c['foot'].count('\n') + 1), c['foot'])
    return lay, len(ev)


DRAW = {'timeline': card_timeline, 'overview': card_overview, 'report': card_rows, 'insurance': card_rows, 'addopt': card_rows,
        'options': card_options, 'features': card_features, 'seller': card_seller, 'price': card_price, 'market': card_market}


# ───────── 칩 · 자막 · 제목 · 끝 ─────────
def chip(text):
    fs = BE['chip']['font_px']; f = F('Black', fs)
    d0 = ImageDraw.Draw(Image.new('L', (1, 1)))
    bb = d0.textbbox((0, 0), text, font=f); tw, th = bb[2] - bb[0], bb[3] - bb[1]
    ff = BE['chip']['fill_fit']
    h = int(th * ff['band_to_ink']); w = int(tw + th * sum(ff['side_pad_ink']))
    m = brushfill.original_mask(w, h)
    im = Image.new('RGBA', (w, h), YEL + (0,)); im.putalpha(m)
    d = ImageDraw.Draw(im)
    d.text((w / 2, h / 2 - th * ff['text_lift_ink']), text, font=f, fill=INK, anchor='mm')
    return im


def wrap(text, font, maxw, d):
    words = text.split(' '); lines = ['']
    for w_ in words:
        t = (lines[-1] + ' ' + w_).strip()
        if d.textlength(t, font=font) <= maxw or not lines[-1]:
            lines[-1] = t
        else:
            lines.append(w_)
    return lines


def caption_layer(text, hi_idx):
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    f = F('Bold', BE['caption']['font_px'])
    lines = wrap(text, f, L['caption_max_w_px'], d)[:L['caption_lines_max']]
    lh = int(BE['caption']['font_px'] * 1.32); cy = L['caption_center_y_px'] - (len(lines) - 1) * lh / 2
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ds = ImageDraw.Draw(sh)
    n = 0; spans = []
    for li, line in enumerate(lines):
        ws = line.split(' '); x = W / 2 - d.textlength(line, font=f) / 2; y = cy + li * lh
        for w_ in ws:
            spans.append((x, y, w_, n == hi_idx)); x += d.textlength(w_ + ' ', font=f); n += 1
    for x, y, w_, _ in spans:
        ds.text((x + 3, y + 4), w_, font=f, fill=(0, 0, 0, 200), anchor='lm')
    sh = sh.filter(ImageFilter.GaussianBlur(4)); lay.alpha_composite(sh)
    for x, y, w_, hi in spans:
        d.text((x, y), w_, font=f, fill=YEL if hi else hx(BE['color']['caption_text']), anchor='lm')
    return lay


# ───────── 시간 맞추기 ─────────
def norm(s):
    import re
    return re.sub(r'[^0-9A-Za-z가-힣]', '', s)


def time_chunks(plan, words):
    out = []; wi = 0
    for c in plan['chunks']:
        a = [norm(x) for x in c['a'].split(' ')]
        j = next(i for i in range(wi, len(words) - len(a) + 1)
                 if all(norm(words[i + q][0]).startswith(a[q]) for q in range(len(a))))
        out.append(j); wi = j + 1
    end_j = next(i for i in range(out[-1], len(words)) if norm(words[i][0]) == norm(plan['end_word']))
    starts = [words[j][1] for j in out]
    T = []
    for i, c in enumerate(plan['chunks']):
        j0 = out[i]; j1 = out[i + 1] if i + 1 < len(out) else end_j + 1
        ws = words[j0:j1]
        T.append({'i': i, 's': starts[i], 'e': (starts[i + 1] if i + 1 < len(out) else words[end_j][2]), 'words': ws})
    return T, words[end_j][2]


def word_at(T, i, t, text):
    """자막 낱말 중 지금 말하는 것(받아쓰기 낱말 시각을 대본 낱말 수에 비례로 맞춤)"""
    ws = T[i]['words']; toks = text.split(' ')
    k = max([q for q, w in enumerate(ws) if w[1] <= t] or [0])
    return min(len(toks) - 1, int(k * len(toks) / max(1, len(ws))))


def lufs(path):
    r = subprocess.run(['ffmpeg', '-v', 'info', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    import re
    return float(re.findall(r'I:\s+(-?[0-9.]+) LUFS', r)[-1])


def fix_loudness(out):
    """한 번 loudnorm은 효과음·덕킹 때문에 목표보다 1dB쯤 낮다 → 두 번째 패스(측정값을 넣은 loudnorm, 꼭짓값 -1.5dBTP)로 맞춘다"""
    A = BE['audio']
    tgt = f"I={A['loudness_lufs']}:TP={A['true_peak_db'] - 1.2}:LRA=11"
    r = subprocess.run(['ffmpeg', '-v', 'info', '-i', out, '-af', f'loudnorm={tgt}:print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
    m = json.loads(r[r.rindex('{'):r.rindex('}') + 1])
    af = (f"loudnorm={tgt}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
          f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', out, '-af', af + ',aresample=192000,alimiter=limit=0.75:level=disabled:attack=1:release=50,aresample=48000', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
                    out + '.tmp.mp4'], check=True)
    os.replace(out + '.tmp.mp4', out)
    return lufs(out)


# ───────── 본체 ─────────
def main(car, out, clips=False):
    P = json.load(open(os.path.join(car, 'plan.json'), encoding='utf-8'))
    words = json.load(open(os.path.join(car, P['words'])))
    T, t_end = time_chunks(P, words)
    tail = M['end_logo_s']; dur = t_end + 0.5 + tail
    pth = lambda p: os.path.join(car, p)
    # 카드 구간
    segs = []
    for c, t in zip(P['chunks'], T):
        if c.get('card'):
            segs.append({'kind': c['card'], 's': t['s'] if segs else 0.0, 'reveal': []})
        if 'reveal' in c:
            segs[-1]['reveal'].append((t['s'] - 0.04, c['reveal']))
    for a, b in zip(segs, segs[1:] + [None]):
        a['e'] = b['s'] if b else t_end + 0.5
    # 미리 그림
    car_line = P['car_line']
    cache = {}
    for sg in segs:
        k = sg['kind']
        if k == 'title':
            continue
        spec = dict(P['cards'][k]); spec = {kk: (pth(v) if kk in ('photo',) else v) for kk, v in spec.items()}
        n = DRAW[k](spec, 0, car_line)[1]
        cache[k] = {'bg': bg_of(pth(spec['bg'])), 'chip': chip(RULES['kinds'][k]['chip']),
                    'states': [DRAW[k](spec, q, car_line)[0] for q in range(n + 1)]}
    title_ph = cover(Image.open(pth(P['title']['photo'])).convert('RGB'), int(W * 1.08), int(H * 1.08))
    title_chip = chip(P['title']['chip'])
    logo = Image.open(os.path.join(ROOT, 'public', 'assets', 'shortform', 'bobae_logo_600.png')).convert('RGBA')
    ease = lambda x: 1 - (1 - min(1, max(0, x))) ** 3
    cap_cache = {}
    ff = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                           '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p', out + '.v.mp4'], stdin=subprocess.PIPE)
    nf = int(dur * FPS)
    for fi in range(nf):
        t = fi / FPS
        si = max(q for q, s in enumerate(segs) if s['s'] <= t)
        sg = segs[si]; k = sg['kind']
        if t >= t_end + 0.5:   # 끝 로고
            fr = Image.new('RGBA', (W, H), INK + (255,))
            x = ease((t - t_end - 0.5) / 0.5); s = 0.8 + 0.2 * x
            lg = logo.resize((int(520 * s), int(520 * s * logo.height / logo.width)), Image.LANCZOS)
            lg.putalpha(lg.getchannel('A').point(lambda v: int(v * min(1, x * 1.3))))
            fr.alpha_composite(lg, ((W - lg.width) // 2, (H - lg.height) // 2))
        elif k == 'title':
            p = t / max(0.1, sg['e']); s = M['title_push_scale'][0] + (M['title_push_scale'][1] - M['title_push_scale'][0]) * p
            iw, ih = int(W * s), int(H * s)
            im = title_ph.resize((iw, ih), Image.BILINEAR) if s != 1.08 else title_ph
            fr = im.crop(((iw - W) // 2, (ih - H) // 2, (iw - W) // 2 + W, (ih - H) // 2 + H)).convert('RGBA')
            g = Image.new('L', (1, H)); [g.putpixel((0, y), int(150 * max(0, (y - H * .55) / (H * .45)))) for y in range(H)]
            fr.paste(Image.new('RGBA', (W, H), (0, 0, 0, 255)), (0, 0), g.resize((W, H)))
            a = ease(t / 0.3)
            ch = title_chip.copy(); ch.putalpha(ch.getchannel('A').point(lambda v: int(v * a)))
            fr.alpha_composite(ch, ((W - ch.width) // 2, BE['chip']['y_top_px']))
            d = ImageDraw.Draw(fr)
            d.text((W // 2, BE['chip']['y_top_px'] + ch.height + 50), P['title']['sub'], font=F('Bold', 44), fill=(255, 255, 255), anchor='mm')
        else:
            C = cache[k]; fr = C['bg'].copy()
            if si > 0 and t - sg['s'] < M['bg_crossfade_s'] and segs[si - 1]['kind'] in cache:
                fr = Image.blend(cache[segs[si - 1]['kind']]['bg'], C['bg'], (t - sg['s']) / M['bg_crossfade_s'])
            q = 0; tq = -9
            for (rt, rv) in sg['reveal']:
                if t >= rt:
                    q, tq = rv, rt
            prev = 0
            for (rt, rv) in sg['reveal']:
                if rt <= tq and rv < q:
                    prev = rv
            st = C['states'][min(q, len(C['states']) - 1)]
            x = (t - tq) / M['row_reveal_s']
            if x < 1 and q:
                st = Image.blend(C['states'][min(prev, len(C['states']) - 1)], st, x)
            e = ease((t - sg['s']) / M['card_enter_s'])
            if e < 1:
                st2 = Image.new('RGBA', (W, H), (0, 0, 0, 0)); st2.alpha_composite(st, (0, int(M['card_enter_rise_px'] * (1 - e))))
                st = st2; st.putalpha(st.getchannel('A').point(lambda v: int(v * e)))
            fr.alpha_composite(st)
            ch = C['chip']; fr.alpha_composite(ch, ((W - ch.width) // 2, int(L['chip_center_y_px'] - ch.height / 2)))
        # 자막
        ci = max([c['i'] for c in T if c['s'] <= t] or [0])
        if t < t_end + 0.1:
            text = P['chunks'][ci]['t']; hi = word_at(T, ci, t, text)
            key = (ci, hi)
            if key not in cap_cache:
                cap_cache.clear(); cap_cache[key] = caption_layer(text, hi)
            fr.alpha_composite(cap_cache[key])
        ff.stdin.write(fr.convert('RGB').tobytes())
    ff.stdin.close(); ff.wait()
    # 소리: 목소리 + 배경음(덕킹) + 효과음
    ev = []
    for sg in segs[1:]:
        ev.append(('whoosh', sg['s'] - 0.02))
    for c, t in zip(P['chunks'], T):
        if c.get('sfx'):
            ev.append((c['sfx'], t['s'] - 0.04))
        if c.get('sfx2'):
            w2 = next((w for w in t['words'] if norm(w[0]).startswith(norm(c['sfx2'][0]))), None)
            if w2: ev.append((c['sfx2'][1], w2[1] - 0.04))
    # 같은 순간(0.3초 안) 겹치면 카드 효과음을 남기고 whoosh를 뺀다
    ev.sort(key=lambda e: e[1]); keep = []
    for e in ev:
        if keep and e[1] - keep[-1][1] < BE['sfx']['min_gap_s']:
            if keep[-1][0] == 'whoosh': keep[-1] = e
            continue
        keep.append(e)
    vol = {'whoosh': BE['sfx']['volume']['whoosh'], 'coin': 0.5}
    inputs = ['-i', pth(P['voice']), '-stream_loop', '-1', '-i', os.path.join(BGM_DIR, P['bgm'])]
    fl = []; mix = ['[v0]']
    fl.append('[1:a]aresample=48000,pan=stereo|c0=c0|c1=c0,asplit=2[v0][sc]')
    fl.append(f"[2:a]aresample=48000,atrim=0:{dur:.2f},volume={BE.get('bgm_volume', 0.34)},afade=t=out:st={dur - 1.5:.2f}:d=1.5[bg0]")
    fl.append('[bg0][sc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=300[bg]'); mix.append('[bg]')
    for n_, (name, at) in enumerate(keep):
        inputs += ['-i', os.path.join(SFX_DIR, name + '.wav')]
        idx = n_ + 3  # 0=화면 1=목소리 2=배경음
        fl.append(f"[{idx}:a]aresample=48000,pan=stereo|c0=c0|c1=c0,atrim=0:1.4,afade=t=out:st=1.25:d=0.15,volume={vol.get(name, 0.45)},adelay={int(max(0, at) * 1000)}:all=1[s{n_}]")
        mix.append(f'[s{n_}]')
    A = BE['audio']
    fl.append(''.join(mix) + f"amix=inputs={len(mix)}:normalize=0:duration=first,apad,atrim=0:{dur:.2f},alimiter=limit=0.5:level=disabled,"
              f"loudnorm=I={A['loudness_lufs']}:TP={A['true_peak_db']}:LRA=11[a]")
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', out + '.v.mp4'] + inputs +
                   ['-filter_complex', ';'.join(fl), '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
                    '-t', f'{dur:.2f}', out], check=True)
    os.remove(out + '.v.mp4')
    fix_loudness(out)
    plan_out = {'renderer': 'card_info/render_card_info.py', 'edition_code': 'CARD-INFO', 'rules': 'card_info/card_info_rules.json',
                'duration_s': round(dur, 2), 'cards': [{'kind': s['kind'], 's': round(s['s'], 2), 'e': round(s['e'], 2),
                                                        'reveal': [[round(a, 2), b] for a, b in s['reveal']]} for s in segs],
                'sfx': [[n, round(a, 2)] for n, a in keep],
                'captions': [{'t': P['chunks'][c['i']]['t'], 's': round(c['s'], 2), 'e': round(c['e'], 2)} for c in T]}
    json.dump(plan_out, open(out + '.plan.json', 'w'), ensure_ascii=False, indent=1)
    if clips:
        base = out[:-4]
        for s in segs:
            if s['kind'] == 'title':
                continue
            # 편집에 끼워 넣는 조각: 카드 시작~다음 카드 시작 직전까지(다음 카드·끝 로고가 섞이지 않게), 앞뒤 0.12초 소리 페이드
            a, b = max(0, s['s'] - 0.05), (s['e'] - 0.02 if s['e'] < t_end else t_end + 0.45)
            dd = b - a
            subprocess.run(['ffmpeg', '-y', '-v', 'error', '-ss', f"{a:.2f}", '-to', f"{b:.2f}", '-i', out,
                            '-af', f"afade=t=in:d=0.08,afade=t=out:st={dd - 0.12:.2f}:d=0.12",
                            '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-c:a', 'aac', '-b:a', '192k',
                            f"{base}_{s['kind']}.mp4"], check=True)
            fix_loudness(f"{base}_{s['kind']}.mp4")   # 조각마다 -14 LUFS(±1)로 다시 맞춤(잘라 내면 덕킹·효과음 비율이 달라짐)
    print(json.dumps({'out': out, 'duration_s': round(dur, 2), 'cards': [s['kind'] for s in segs], 'sfx': len(keep)}, ensure_ascii=False))


if __name__ == '__main__':
    a = [x for x in sys.argv[1:] if not x.startswith('--')]
    main(a[0], a[1] if len(a) > 1 else os.path.join(a[0], 'card_info.mp4'), '--clips' in sys.argv)
