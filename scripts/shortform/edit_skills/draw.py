"""편집 스킬 그리기 함수 모음 (AS24 NL·BE 400개 조사 → 보배드림용으로 다시 그림)

규칙
- 남의 그래픽·로고는 복사하지 않는다. 모양은 원본에서 '쓰는 방식'만 배우고, 칠은 노션 원본 칠(brushfill), 글꼴은 Pretendard(OFL),
  이모지는 구글 Noto Color Emoji(OFL), 로고는 보배드림 로고만 쓴다.
- 모든 함수는 RGBA 이미지 한 장을 돌려준다. 위치·움직임은 planner/motion 이 정한다.
- 크기 기준 화면은 1080×1920. 글자 크기는 화면 높이 비율(h_ratio)로 받는다(원본 실측값이 비율이라서).
"""
import math, os, re
from functools import lru_cache
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FONTS = os.path.join(ROOT, 'fonts')
F = {k: os.path.join(FONTS, f'Pretendard-{v}.otf') for k, v in
     dict(black='Black', xbold='ExtraBold', bold='Bold', semi='SemiBold', med='Medium').items()}
EMOJI_FONT = '/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf'
W, H = 1080, 1920
YELLOW = (255, 214, 10)
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
RED = (230, 30, 40)
GREEN = (40, 180, 90)
BRAND = (48, 107, 217)  # 보배드림 파랑


def font(kind, px):
    return _font(kind, int(px))


@lru_cache(maxsize=256)
def _font(kind, px):
    return ImageFont.truetype(F[kind], px)


def px(h_ratio):
    """화면 높이 비율 → 픽셀"""
    return max(8, int(H * h_ratio))


def text_size(t, fnt):
    b = fnt.getbbox(t)
    return b[2] - b[0], b[3] - b[1], b


def _canvas(w, h):
    return Image.new('RGBA', (max(1, int(w)), max(1, int(h))), (0, 0, 0, 0))


def outlined_text(t, size, fill=WHITE, stroke=BLACK, stroke_ratio=0.11, kind='black', shadow=False):
    """검정 테두리 글자(말 자막·큰 숫자 공통)"""
    fnt = font(kind, size)
    sw = max(2, int(size * stroke_ratio))
    tw, th, b = text_size(t, fnt)
    pad = sw * 2 + 6
    im = _canvas(tw + pad * 2, size * 1.35 + pad * 2)
    d = ImageDraw.Draw(im)
    xy = (pad - b[0], pad + (size * 1.35 - size) / 2 - b[1] + size * 0.12)
    if shadow:
        d.text((xy[0] + sw * .6, xy[1] + sw * .8), t, font=fnt, fill=(0, 0, 0, 120), stroke_width=sw, stroke_fill=(0, 0, 0, 120))
    d.text(xy, t, font=fnt, fill=fill, stroke_width=sw, stroke_fill=stroke)
    return im.crop(im.getbbox())


@lru_cache(maxsize=128)
def emoji(ch, size):
    """Noto 색 이모지 한 글자 → size px 높이"""
    try:
        ef = ImageFont.truetype(EMOJI_FONT, 109)
    except OSError:
        return outlined_text(ch, size)
    im = _canvas(160, 160)
    ImageDraw.Draw(im).text((80, 80), ch, font=ef, embedded_color=True, anchor='mm')
    bb = im.getbbox()
    if not bb:
        return _canvas(size, size)
    im = im.crop(bb)
    return im.resize((max(1, int(im.width * size / im.height)), size), Image.LANCZOS)


def hstack(ims, gap=0, valign='center'):
    ims = [i for i in ims if i is not None]
    w = sum(i.width for i in ims) + gap * (len(ims) - 1)
    h = max(i.height for i in ims)
    out = _canvas(w, h)
    x = 0
    for i in ims:
        y = (h - i.height) // 2 if valign == 'center' else h - i.height
        out.alpha_composite(i, (x, y))
        x += i.width + gap
    return out


def vstack(ims, gap=0, align='center'):
    ims = [i for i in ims if i is not None]
    w = max(i.width for i in ims)
    h = sum(i.height for i in ims) + gap * (len(ims) - 1)
    out = _canvas(w, h)
    y = 0
    for i in ims:
        x = (w - i.width) // 2 if align == 'center' else 0
        out.alpha_composite(i, (x, y))
        y += i.height + gap
    return out


# ───────────────────────── 기본 부품 ─────────────────────────

def box_label(t, h_ratio=0.03, bg=BLACK, fg=YELLOW, radius=0.22, pad_x=0.55, pad_y=0.42, kind='black', alpha=235):
    """S001 검정 상자 노랑 이름표 — 원본: 글자 높이 ≈ 화면 3%, 상자는 글자에 딱 붙는 둥근 사각"""
    size = px(h_ratio) / 0.74
    fnt = font(kind, size)
    tw, th, b = text_size(t, fnt)
    cap = size * 0.74
    w, h = tw + cap * pad_x * 2, cap * (1 + pad_y * 2)
    im = _canvas(w, h)
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, w - 1, h - 1), int(h * radius), fill=bg + (alpha,))
    d.text((w / 2, h / 2), t, font=fnt, fill=fg, anchor='mm')
    return im


def tape(t, h_ratio=0.028, color=YELLOW, fg=BLACK, tilt=-3.0, kind='xbold', mark=None):
    """S008 노랑 띠 칩 — 노션 원본 칠 모양(brushfill.original_mask)에 검정 글자, 2~4도 기울임"""
    import sys
    sys.path.insert(0, ROOT)
    from brushfill import original_mask
    size = px(h_ratio) / 0.74
    fnt = font(kind, size)
    tw, th, b = text_size(t, fnt)
    cap = size * 0.74
    extra = 0
    mk = None
    if mark == '✓':
        extra = cap * 1.25
    elif mark:
        mk = emoji(mark, int(cap * 1.15))
        extra = mk.width + cap * 0.35
    w, h = int(tw + extra + cap * 1.6), int(cap * 1.9)
    m = 24
    mask = original_mask(w, h, margin=m)
    im = Image.new('RGBA', mask.size, color + (0,))
    im.putalpha(mask)
    d = ImageDraw.Draw(im)
    cx = m + w / 2 - extra / 2
    d.text((cx, m + h / 2), t, font=fnt, fill=fg, anchor='mm')
    if mark == '✓':
        _check(d, cx + tw / 2 + cap * 0.35, m + h / 2, cap * 0.9, fg, max(3, int(size * .12)))
    elif mk is not None:
        im.alpha_composite(mk, (int(cx + tw / 2 + cap * 0.35), int(m + h / 2 - mk.height / 2)))
    return im.rotate(-tilt, resample=Image.BICUBIC, expand=True)


def _check(d, x0, cy, s, fill, lw):
    p1, p2, p3 = (x0, cy + s * .02), (x0 + s * .36, cy + s * .34), (x0 + s, cy - s * .40)
    d.line([p1, p2, p3], fill=fill, width=lw, joint='curve')
    for q in (p1, p3):
        d.ellipse((q[0] - lw / 2, q[1] - lw / 2, q[0] + lw / 2, q[1] + lw / 2), fill=fill)


def check_icon(size, fill=WHITE):
    im = _canvas(size * 1.2, size * 1.2)
    _check(ImageDraw.Draw(im), size * .1, size * .6, size, fill, max(3, int(size * .16)))
    return im


def option_check(t, h_ratio=0.02, kind='black'):
    """S002 옵션 체크 이름표 — 작은 흰 대문자 + 흰 체크, 검정 테두리(바탕 없음)"""
    size = px(h_ratio) / 0.74
    a = outlined_text(t, int(size), kind=kind, stroke_ratio=0.1)
    c = check_icon(int(size * 0.8))
    c2 = outlined_text('✓', int(size)) if c is None else c
    return hstack([a, c2], gap=int(size * 0.25))


def big_number(t, h_ratio=0.075, fill=YELLOW):
    """S004 바탕 없는 큰 노랑 숫자(가격·km·마력·연식) — 검정 두꺼운 테두리"""
    return outlined_text(t, px(h_ratio) / 0.74, fill=fill, stroke_ratio=0.12, shadow=True)


def center_number_box(t, h_ratio=0.06):
    """S006 가운데 큰 숫자 검정 둥근 상자(10.9%·4/10)"""
    return box_label(t, h_ratio=h_ratio, fg=WHITE, radius=0.28, pad_x=0.5, pad_y=0.35)


def stat_chip(t, up=True, h_ratio=0.022):
    """S014 통계 화살표 칩(⬆ 36%) — 작은 노랑 띠"""
    return tape(('▲ ' if up else '▼ ') + t, h_ratio=h_ratio, tilt=-2)


def red_x(size=420, lw_ratio=0.12):
    """S010 빨강 X(아니다·하지 마) — 손으로 그은 듯 끝이 둥근 두 획"""
    im = _canvas(size, size)
    d = ImageDraw.Draw(im)
    lw = int(size * lw_ratio)
    for a, b in (((.12, .1), (.88, .9)), ((.88, .12), (.14, .88))):
        d.line([(a[0] * size, a[1] * size), (b[0] * size, b[1] * size)], fill=RED, width=lw)
        for q in (a, b):
            d.ellipse((q[0] * size - lw / 2, q[1] * size - lw / 2, q[0] * size + lw / 2, q[1] * size + lw / 2), fill=RED)
    return im


def price_fix(old, new, h_ratio=0.05):
    """S011 가격 정정 — 옛 가격 위 빨강 X선, 아래 새 가격"""
    a = big_number(old, h_ratio * .7, fill=WHITE)
    d = ImageDraw.Draw(a)
    d.line([(4, a.height * .55), (a.width - 4, a.height * .45)], fill=RED, width=max(6, a.height // 7))
    return vstack([a, big_number(new, h_ratio)], gap=int(px(h_ratio) * .2))


def speaker(n=3, size=110):
    """S012 소리 스피커 — 🔊 n개(배기음·경고음 들릴 때, 차 아래 가운데)"""
    return hstack([emoji('🔊', size) for _ in range(n)], gap=int(size * .12))


def emoji_tag(t, ch, h_ratio=0.03):
    """S013 이모지 붙임 — 이름표 오른쪽에 이모지"""
    lab = box_label(t, h_ratio)
    return hstack([lab, emoji(ch, int(lab.height * 1.05))], gap=int(lab.height * .15))


def dim_arrow(label, length=700, h_ratio=0.03):
    """S015 길이 화살표 <---> 3M"""
    th = px(h_ratio)
    im = _canvas(length, th * 3.2)
    d = ImageDraw.Draw(im)
    y = im.height * .72
    lw = max(5, th // 5)
    d.line([(th, y), (length - th, y)], fill=WHITE, width=lw)
    for x, s in ((th * .2, 1), (length - th * .2, -1)):
        d.polygon([(x, y), (x + s * th * .9, y - th * .5), (x + s * th * .9, y + th * .5)], fill=WHITE)
    lab = box_label(label, h_ratio)
    im.alpha_composite(lab, (int((length - lab.width) / 2), 0))
    return im


def arc_text(t, h_ratio=0.05, radius=520, fill=YELLOW):
    """S016 호 글자 — 차명이 둥글게 튐"""
    size = int(px(h_ratio) / 0.74)
    letters = [outlined_text(c, size, fill=fill) if c.strip() else _canvas(size * .35, size) for c in t]
    total = sum(l.width for l in letters)
    span = total / radius
    out = _canvas(radius * 2 + size * 2, radius * (1 - math.cos(span / 2)) + size * 2.2)
    cx, cy = out.width / 2, radius + size
    a = -span / 2
    for l in letters:
        aa = a + l.width / 2 / radius
        r = l.rotate(-math.degrees(aa), resample=Image.BICUBIC, expand=True)
        x = cx + math.sin(aa) * radius - r.width / 2
        y = cy - math.cos(aa) * radius - r.height / 2
        out.alpha_composite(r, (int(x), int(y)))
        a += l.width / radius
    return out.crop(out.getbbox())


def typewriter(t, progress, h_ratio=0.045, cursor=True):
    """S017 타자 효과 — progress 0~1만큼 글자 + 깜빡 커서"""
    n = max(0, min(len(t), int(round(len(t) * progress))))
    s = t[:n] + ('|' if cursor else '')
    return outlined_text(s or '|', px(h_ratio) / 0.74, fill=WHITE)


def polaroid(photo, caption, width=420, tilt=-4, tape_on=True):
    """S018 비교 차 카드 — 흰 폴라로이드(사진 + 차명), 위에 노랑 테이프"""
    ph = photo.convert('RGB')
    iw = int(width * .88)
    ih = int(iw * .75)
    ph = _cover(ph, iw, ih)
    cap_h = int(width * .22)
    card = Image.new('RGBA', (width, ih + cap_h + int(width * .06)), WHITE + (255,))
    card.paste(ph, (int((width - iw) / 2), int(width * .06)))
    d = ImageDraw.Draw(card)
    fnt = font('xbold', int(cap_h * .42))
    d.text((width / 2, int(width * .06) + ih + cap_h / 2), caption, font=fnt, fill=BLACK, anchor='mm')
    sh = _shadow(card, 18)
    if tape_on:
        tp = Image.new('RGBA', (int(width * .34), int(width * .09)), YELLOW + (230,))
        tp = tp.rotate(8, expand=True, resample=Image.BICUBIC)
        sh.alpha_composite(tp, (int(sh.width / 2 - tp.width / 2), 4))
    return sh.rotate(-tilt, expand=True, resample=Image.BICUBIC)


def _cover(im, w, h):
    r = max(w / im.width, h / im.height)
    im = im.resize((int(im.width * r + .5), int(im.height * r + .5)), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))


def _shadow(card, blur=16, off=(0, 10), alpha=110):
    pad = blur * 2
    out = _canvas(card.width + pad * 2, card.height + pad * 2)
    sh = Image.new('RGBA', card.size, (0, 0, 0, alpha))
    sh.putalpha(card.getchannel('A').point(lambda v: v * alpha // 255))
    out.alpha_composite(sh, (pad + off[0], pad + off[1]))
    out = out.filter(ImageFilter.GaussianBlur(blur))
    out.alpha_composite(card, (pad, pad))
    return out


def phone(screen, width=520):
    """S019 폰 앱 화면 — 둥근 검정 테두리 폰 안에 화면(보배드림 앱 캡처)"""
    sw = int(width * .9)
    sh_ = int(sw * 2.05)
    sc = _cover(screen.convert('RGB'), sw, sh_)
    body = _canvas(width, sh_ + (width - sw))
    d = ImageDraw.Draw(body)
    d.rounded_rectangle((0, 0, body.width - 1, body.height - 1), int(width * .13), fill=(18, 18, 20, 255))
    m = Image.new('L', sc.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, sw - 1, sh_ - 1), int(width * .1), fill=255)
    body.paste(sc, ((width - sw) // 2, (width - sw) // 2), m)
    d.rounded_rectangle((width * .38, width * .06, width * .62, width * .1), int(width * .02), fill=(18, 18, 20, 255))
    return _shadow(body, 22)


def ring(size=260, color=YELLOW, lw_ratio=0.07):
    """S020 동그라미 강조 — 손그림 느낌 노랑 원(시작·끝이 살짝 겹침)"""
    im = _canvas(size, size)
    d = ImageDraw.Draw(im)
    lw = int(size * lw_ratio)
    d.arc((lw, lw, size - lw, size - lw), -100, 280, fill=color, width=lw)
    return im


def listing_card(photo, title, price, meta, width=760):
    """S021 매물 카드 — 보배드림 매물 카드(사진·차명·가격·사양). 값은 매물 정보에서만"""
    iw = width
    ih = int(width * .62)
    card = Image.new('RGBA', (width, ih + int(width * .38)), WHITE + (255,))
    card.paste(_cover(photo.convert('RGB'), iw, ih), (0, 0))
    d = ImageDraw.Draw(card)
    x = int(width * .05)
    d.text((x, ih + width * .04), title, font=font('bold', int(width * .055)), fill=BLACK)
    d.text((x, ih + width * .13), meta, font=font('med', int(width * .04)), fill=(89, 89, 89))
    d.text((x, ih + width * .22), price, font=font('black', int(width * .07)), fill=BLACK)
    m = Image.new('L', card.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, card.width - 1, card.height - 1), int(width * .04), fill=255)
    card.putalpha(m)
    return _shadow(card, 20)


def web_window(screen, title='bobaedream.co.kr', width=900):
    """S022 웹 창 — 브라우저 창 테두리 + 주소줄"""
    bar = int(width * .07)
    sc = _cover(screen.convert('RGB'), width, int(width * .62))
    card = Image.new('RGBA', (width, sc.height + bar), (236, 238, 241, 255))
    d = ImageDraw.Draw(card)
    for i, c in enumerate(((255, 95, 86), (255, 189, 46), (39, 201, 63))):
        r = bar * .18
        d.ellipse((bar * .4 + i * bar * .55 - r, bar / 2 - r, bar * .4 + i * bar * .55 + r, bar / 2 + r), fill=c)
    d.rounded_rectangle((bar * 2.2, bar * .2, width - bar * .4, bar * .8), int(bar * .3), fill=WHITE)
    d.text((bar * 2.5, bar / 2), title, font=font('med', int(bar * .38)), fill=(80, 80, 80), anchor='lm')
    card.paste(sc, (0, bar))
    return _shadow(card, 20)


def two_choice(a, b, chosen=None, h_ratio=0.035):
    """S027 둘 중 하나 — 위아래 두 선택지, 고른 쪽 노랑"""
    def one(t, on):
        return box_label(t, h_ratio, bg=YELLOW if on else BLACK, fg=BLACK if on else WHITE)
    vs = outlined_text('VS', int(px(h_ratio) * .9), fill=YELLOW)
    return vstack([one(a, chosen == 0), vs, one(b, chosen == 1)], gap=int(px(h_ratio) * .35))


def quiz_title(line1, line2='', h_ratio=0.045):
    """S025 퀴즈 첫 화면 — 큰 흰 글자 + 둘째 줄 노랑"""
    rows = [outlined_text(line1, px(h_ratio) / 0.74, fill=WHITE)]
    if line2:
        rows.append(outlined_text(line2, px(h_ratio) / 0.74, fill=YELLOW))
    return vstack(rows, gap=int(px(h_ratio) * .15))


def info_list(rows, h_ratio=0.02, reveal=None):
    """S026 판매 중 정보 목록 — 왼쪽 아래 「주행거리 ____」 빈칸 줄, reveal 개수만큼 값 채움"""
    out = []
    for i, (k, v) in enumerate(rows):
        val = v if (reveal is None or i < reveal) else '______'
        a = box_label(k, h_ratio, bg=BLACK, fg=WHITE, pad_x=.4)
        b = box_label(val, h_ratio, bg=YELLOW, fg=BLACK, pad_x=.4)
        out.append(hstack([a, b], gap=0))
    return vstack(out, gap=int(px(h_ratio) * .35), align='left')


def name_tag(name, role='', h_ratio=0.026):
    """S033 사람 이름표 — 가슴 높이, 노랑 이름 + 흰 작은 역할"""
    rows = [outlined_text(name, px(h_ratio) / 0.74, fill=YELLOW)]
    if role:
        rows.append(outlined_text(role, px(h_ratio * .62) / 0.74, fill=WHITE))
    return vstack(rows, gap=4, align='left')


def surprise_lines(size=220):
    """S034 놀람 선 — 머리 위 빨강 손그림 짧은 선 3개"""
    im = _canvas(size, size * .7)
    d = ImageDraw.Draw(im)
    lw = int(size * .07)
    for a in (-35, 0, 35):
        r = math.radians(a - 90)
        x0, y0 = size / 2 + math.cos(r) * size * .2, size * .68 + math.sin(r) * size * .2
        x1, y1 = size / 2 + math.cos(r) * size * .45, size * .68 + math.sin(r) * size * .45
        d.line([(x0, y0), (x1, y1)], fill=RED, width=lw)
    return im


def finger(direction='left', size=180):
    """S035 가리키기 손가락(③ 손가락 아이콘형) — Noto 이모지 👈👉👆👇"""
    ch = dict(left='👈', right='👉', up='👆', down='👇')[direction]
    return emoji(ch, size)


def arrow_curve(size=260, direction='down', color=YELLOW):
    """손그림 곡선 화살표(아래를 가리킴) — S035 보조"""
    im = _canvas(size, size)
    d = ImageDraw.Draw(im)
    lw = int(size * .06)
    pts = [(size * .2 + math.sin(t / 10 * math.pi) * size * .18, size * .1 + t / 10 * size * .65) for t in range(11)]
    d.line(pts, fill=color, width=lw, joint='curve')
    tx, ty = pts[-1]
    d.polygon([(tx - size * .14, ty - size * .06), (tx + size * .14, ty - size * .06), (tx, ty + size * .16)], fill=color)
    if direction == 'up':
        im = im.rotate(180)
    elif direction == 'left':
        im = im.rotate(-90)
    elif direction == 'right':
        im = im.rotate(90)
    return im


def official_title(prefix, name, h_ratio=0.04):
    """S041 공식 차명 타이틀 — 노랑 앞말 + 흰 차명(가는 굵기)"""
    a = outlined_text(prefix, px(h_ratio * .7) / 0.74, fill=YELLOW, kind='bold', stroke_ratio=.06)
    b = outlined_text(name, px(h_ratio) / 0.74, fill=WHITE, kind='semi', stroke_ratio=.06)
    return vstack([a, b], gap=6)


def logo_band(h_ratio=0.055, text='보배드림', sub='중고차는 보배드림', color=BRAND):
    """S030 끝 로고 — 보배드림 파랑 띠 + 흰 글자(원본은 노랑 띠 AutoScout24 → 우리 로고·색으로)"""
    size = px(h_ratio) / 0.74
    fnt = font('black', size)
    tw, th, b = text_size(text, fnt)
    w, h = tw + size * 1.2, size * 1.45
    im = _canvas(w, h)
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, w - 1, h - 1), int(h * .18), fill=color + (255,))
    d.text((w / 2, h / 2), text, font=fnt, fill=WHITE, anchor='mm')
    if sub:
        s = outlined_text(sub, int(size * .38), fill=WHITE, stroke_ratio=.08)
        return vstack([im, s], gap=int(size * .25))
    return im


def wipe_frame(progress, color=YELLOW):
    """S044 흰 화면 + 노랑 붓 원 와이프 전환 — progress 0~1(화면 전체 크기)"""
    im = Image.new('RGBA', (W, H), (255, 255, 255, int(255 * min(1, progress * 2))))
    d = ImageDraw.Draw(im)
    r = int(max(W, H) * .75 * progress)
    lw = int(W * .09)
    if r > lw:
        d.ellipse((W / 2 - r, H / 2 - r, W / 2 + r, H / 2 + r), outline=color, width=lw)
    return im


def green_check_label(t, h_ratio=0.026):
    """S045 초록 체크 칩 — ✅ + 검정 상자 기능명"""
    lab = box_label(t, h_ratio, fg=WHITE)
    return hstack([emoji('✅', int(lab.height * .95)), lab], gap=int(lab.height * .18))


def sparkle(size=120):
    """S031 반짝이 ✨"""
    return emoji('✨', size)


def flag(code, size=90):
    """S040 국기 — 'kr','de','jp','it','fr','us','gb','se','es','cn' → 지역 표시 문자"""
    ch = ''.join(chr(0x1F1E6 + ord(c) - 97) for c in code.lower())
    return emoji(ch, size)


def caption_upper(words, active=0, h_ratio=0.028):
    """S038 말 자막(대문자형) — 1~3낱말, 말하는 낱말만 노랑, 흰 글자 검정 테두리"""
    size = px(h_ratio) / 0.74
    ims = [outlined_text(w.upper(), size, fill=YELLOW if i == active else WHITE) for i, w in enumerate(words)]
    return hstack(ims, gap=int(size * .25), valign='bottom')


def caption_sentence(text, keyword='', h_ratio=0.024, box_kw=False):
    """S039 말 자막(문장형) — 흰 문장, 핵심 낱말만 노랑(또는 노랑 상자)"""
    size = px(h_ratio) / 0.74
    parts = []
    for w in text.split():
        if keyword and keyword in w:
            parts.append(box_label(w, h_ratio, bg=YELLOW, fg=BLACK, pad_x=.2, pad_y=.15) if box_kw else outlined_text(w, size, fill=YELLOW))
        else:
            parts.append(outlined_text(w, size, fill=WHITE))
    return hstack(parts, gap=int(size * .22), valign='bottom')


def split3(photos, w=W, h=H, gap=12):
    """S023 세로 3분할 — 외관·실내·뒤 사진을 위아래로 쌓은 바탕 화면"""
    out = Image.new('RGBA', (w, h), (0, 0, 0, 255))
    ch = (h - gap * 2) // 3
    for i, p in enumerate(photos[:3]):
        out.paste(_cover(p.convert('RGB'), w, ch), (0, i * (ch + gap)))
    return out


def rank_number(n, h_ratio=0.12):
    """S043 순번 큰 숫자"""
    return big_number(str(n), h_ratio)


def currency_tease(sym='₩', h_ratio=0.13):
    """S042 가격 예고 — 통화 기호만 크게"""
    return big_number(sym, h_ratio)


def asmr_label(name, h_ratio=0.032):
    """S032 ASMR 표기 — 차명 + ASMR + 🔊"""
    lab = box_label(f'{name} ASMR', h_ratio)
    return hstack([lab, emoji('🔊', int(lab.height))], gap=int(lab.height * .15))


def exclaim(word, h_ratio=0.09, fill=YELLOW, tilt=-6):
    """S009 감탄 큰 낱말(대박!·와!) — 아주 큰 노랑 글자, 살짝 기울임"""
    return big_number(word, h_ratio, fill=fill).rotate(-tilt, expand=True, resample=Image.BICUBIC)


def count_frame(start, end, progress, fmt='{:,.0f}', unit='', h_ratio=0.075):
    """S005 숫자 세기 — 같은 자리에서 start→end (가속 시간 3.5초 등)"""
    p = 1 - (1 - min(1, max(0, progress))) ** 3
    v = start + (end - start) * p
    return big_number(fmt.format(v) + unit, h_ratio)


def place_chip(name, h_ratio=0.026):
    """S046 판매점 표시 — 📍 + 상사명(매물 상사 정보에서만)"""
    lab = box_label(name, h_ratio, fg=WHITE)
    return hstack([emoji('📍', int(lab.height * 1.0)), lab], gap=int(lab.height * .12))


def split2(photos, w=W, h=H, gap=12):
    """S047 화면 2분할 — 위아래 두 장면"""
    out = Image.new('RGBA', (w, h), (0, 0, 0, 255))
    ch = (h - gap) // 2
    for i, p in enumerate(photos[:2]):
        out.paste(_cover(p.convert('RGB'), w, ch), (0, i * (ch + gap)))
    return out


def explain_card(icon, text, progress=1.0, width=720):
    """S048 설명용 그림 컷 — 흰 둥근 카드(큰 이모지 그림 + 한 줄) + 초록 체크가 그려지며 나타남"""
    card = Image.new('RGBA', (width, int(width * .78)), WHITE + (255,))
    m = Image.new('L', card.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, card.width - 1, card.height - 1), int(width * .06), fill=255)
    card.putalpha(m)
    ic = emoji(icon, int(width * .32))
    card.alpha_composite(ic, (int(width * .5 - ic.width / 2), int(width * .08)))
    d = ImageDraw.Draw(card)
    d.text((width / 2, width * .55), text, font=font('xbold', int(width * .065)), fill=BLACK, anchor='mm')
    if progress > .4:   # 체크 획을 진행률만큼
        k = min(1, (progress - .4) / .4)
        s = width * .14
        x0, cy = width * .78, width * .2
        p1, p2, p3 = (x0, cy), (x0 + s * .36, cy + s * .34), (x0 + s, cy - s * .40)
        lw = int(width * .03)
        if k < .4:
            d.line([p1, (p1[0] + (p2[0] - p1[0]) * k / .4, p1[1] + (p2[1] - p1[1]) * k / .4)], fill=GREEN, width=lw)
        else:
            kk = (k - .4) / .6
            d.line([p1, p2, (p2[0] + (p3[0] - p2[0]) * kk, p2[1] + (p3[1] - p2[1]) * kk)], fill=GREEN, width=lw, joint='curve')
    return _shadow(card, 20)


def brand_badge(logo_path, h_ratio=0.06):
    """S049 차 브랜드 로고 배지 — 보배드림 브랜드 로고 파일(public/assets/brand)을 흰 원 위에"""
    size = px(h_ratio) * 2
    im = _canvas(size, size)
    ImageDraw.Draw(im).ellipse((0, 0, size - 1, size - 1), fill=WHITE + (255,))
    try:
        lg = Image.open(logo_path).convert('RGBA')
        r = size * .62 / max(lg.width, lg.height)
        lg = lg.resize((max(1, int(lg.width * r)), max(1, int(lg.height * r))), Image.LANCZOS)
        im.alpha_composite(lg, ((size - lg.width) // 2, (size - lg.height) // 2))
    except Exception:
        pass
    return _shadow(im, 12)


def slogan_card(line, h_ratio=0.04):
    """S050 캠페인 끝 문구 카드 — 흰 큰 문구, 핵심 낱말 노랑 상자"""
    return caption_sentence(line, keyword=line.split()[-1], h_ratio=h_ratio, box_kw=True)
