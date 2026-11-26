# G350 v5 공용 부품 — v4가 쓰던 numviz/v60a.py(작업 폴더에만 있다가 지워짐)를 대신한다.
# 값: 벨기에판 고정 규칙(scripts/shortform/be_locked_rules.json) — 노랑 #F5F200 · 글자 #141414 · 칩 70px · 반시계 5.7°
import json, math, os, re, subprocess
from io import BytesIO
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
R = json.load(open(os.path.join(REPO, 'scripts/shortform/be_locked_rules.json')))
W, H, FPS = 1080, 1920, 30
F = os.path.join(REPO, 'scripts/shortform/fonts')
A = os.path.join(REPO, 'public/assets/shortform') + '/'
def _hex(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
YEL = _hex(R['color']['yellow']); INK = _hex(R['color']['ink'])
TILT = R['chip']['tilt_ccw_deg']; CHIP_PX = R['chip']['font_px']
M, YB = 60, R['chip']['y_top_px_feature_video']   # 좌우 여백 · 위쪽 칩 줄(be_locked_rules.json)
ALEN, AMIN, TG, CG, BOB = 170, 70, 24, 6, 10   # 화살표 길이 · 최소 · 부위와 틈 · 칩과 틈 · 흔들림
_fc = {}
def _font(n, s):
    k = (n, s)
    if k not in _fc: _fc[k] = ImageFont.truetype(os.path.join(F, f'Pretendard-{n}.otf'), s)
    return _fc[k]
def BD(s): return _font('Bold', s)
def XB(s): return _font('ExtraBold', s)
def BK(s): return _font('Black', s)
def tsize(s, f): return f.getbbox(s)
def ease(x):
    x = max(0.0, min(1.0, x)); return x * x * (3 - 2 * x)

def _brush_alpha(name, w, h):
    png = subprocess.run(['rsvg-convert', '-w', str(w), '-h', str(h), A + 'brush-fill/as24-theme/' + name], capture_output=True, check=True).stdout
    return Image.open(BytesIO(png)).convert('RGBA').getchannel('A')

_SHAPE_CACHE = {}
def _shape(name, scale):
    """노션 원본 SVG를 가로·세로 같은 배율(scale)로만 그려 칠 알파를 돌려줌. 늘이기·그리기 없음."""
    key = (name, round(scale, 3))
    if key not in _SHAPE_CACHE:
        png = subprocess.run(['rsvg-convert', '-z', str(scale), A + 'brush-fill/as24-theme/' + name + '.svg'], capture_output=True, check=True).stdout
        _SHAPE_CACHE[key] = Image.open(BytesIO(png)).convert('RGBA').getchannel('A')
    return _SHAPE_CACHE[key]

def _paint_box(a):
    """칠 알파에서 가운데 열들 기준 칠 위·아래, 가운데 줄 기준 칠 왼·오른 끝."""
    m = np.array(a) > 128; H, W = m.shape
    rows = np.where(m[:, int(W * 0.3):int(W * 0.7)].mean(1) > 0.5)[0]; top, bot = int(rows.min()), int(rows.max())
    xs = np.where(m[(top + bot) // 2])[0]; return top, bot, int(xs.min()), int(xs.max())

def brush_box(s, f, color, icon=None, icon_left=False, title_plate=False, draw_text=True, **_):
    """칠 규칙(be_locked_rules.json chip.fill_fit): 노션 원본 칠 중 좌우 여백이 맞는 것을 골라 같은 배율로만 키움.
    칠 높이 = 글자 높이 × band_to_ink, 글자는 칠 가운데에서 text_lift_ink만큼 위."""
    FF = R['chip']['fill_fit']
    b = tsize(s, f); tw, th = b[2] - b[0], b[3] - b[1]
    iw = icon.width if icon is not None else 0; gap = 16 if icon is not None else 0; cw = tw + gap + iw
    want_h = FF['band_to_ink'] * th; lo, hi = [k * th for k in FF['side_pad_ink']]
    best = None
    TT = R['chip']['title_plate'] if title_plate else None
    if TT:   # 첫 컷 브랜드 칩: 벨기에 원본 판(노션 테마 바탕색 430_239) 하나. 판 자체가 기울어 있어 돌리지 않음. 칠 폭 = 글자 폭 + 좌우 여백(글자 높이 배수), 같은 배율
        pl, pr = TT['side_pad_ink']; t0, b0, l0, r0 = _paint_box(_shape(TT['shape'], 1))
        best = (0, TT['shape'], (cw + (pl + pr) * th) / (r0 - l0))
    else:
        for name in FF['shapes']:
            t0, b0, l0, r0 = _paint_box(_shape(name, 4)); sc = 4 * want_h / (b0 - t0)
            pad = ((r0 - l0) * sc / 4 - cw) / 2
            score = abs(pad - hi) if pad >= lo else 1e6 + (lo - pad)   # 여백이 모자라면 맨 뒤 후보
            if best is None or score < best[0]: best = (score, name, sc)
    _, name, sc = best; a = _shape(name, sc); top, bot, x0, x1 = _paint_box(a)
    if not TT:   # r06(2026-11-23 「벨기에 매뉴얼대로 붓칠과 글자 위아래 간격」): 칠 높이·글자 자리를 글자가 놓이는 열들의 실제 칠 위·아래로 잰다(가운데 30~70% 열 대신). 기운 판·들쭉날쭉한 끝에서도 칠 높이 = 글자 × 2.0, 글자 = 칠 가운데에서 글자 높이 6% 위
        def _band(al):
            t_, b_, l_, r_ = _paint_box(al); xl = l_ + ((r_ - l_) - cw) // 2
            m_ = np.array(al)[:, max(0, xl):xl + cw] > 128; cols = [np.where(m_[:, i])[0] for i in range(m_.shape[1])]
            cols = [c for c in cols if len(c)]
            return (float(np.median([c.min() for c in cols])), float(np.median([c.max() for c in cols]))) if cols else (t_, b_)
        bt_, bb_ = _band(a); sc = sc * want_h / max(1.0, bb_ - bt_ + 1); a = _shape(name, sc); top, bot, x0, x1 = _paint_box(a)
        bt_, bb_ = _band(a)
    m = max(0, top - 20); a = a.crop((0, m, a.width, min(a.height, bot + 21))); top, bot = top - m, bot - m
    if not TT: bt_, bb_ = bt_ - m, bb_ - m   # 칠 윗선을 늘 같은 높이에(원본 판마다 위 여백이 달라 칩이 위아래로 튀던 것 방지)
    w, h = a.size; dy = 20 - top   # 칠 윗선을 상자 위 35px에 고정
    im = Image.new('RGBA', (w + 30, h + 30 + dy)); fill = Image.new('RGBA', (w, h), color + (255,)); fill.putalpha(a)
    im.alpha_composite(fill, (15, 15 + dy))
    d = ImageDraw.Draw(im); cx = 15 + x0 + (round(TT['side_pad_ink'][0] * th) if TT else ((x1 - x0) - cw) // 2)
    ty = 15 + dy + top + ((bot - top) - th) // 2 - round(FF['text_lift_ink'] * th)
    if not TT: ty = 15 + dy + round((bt_ + bb_ + 1 - th) / 2 - FF['text_lift_ink'] * th)
    if not TT:   # 가로도 글자 줄 높이의 칠 안쪽(줄마다 왼·오른 끝 중 가장 안쪽) 가운데에 둔다(판 끝이 파인 곳에 글자가 걸치지 않게)
        _m = np.array(a) > 128; _rows = [np.where(_m[y])[0] for y in range(max(0, ty - 15 - dy), min(_m.shape[0], ty - 15 - dy + th))]
        _rows = [r for r in _rows if len(r)]
        if _rows: _l = max(r.min() for r in _rows); _r = min(r.max() for r in _rows); cx = 15 + _l + ((_r - _l) - cw) // 2
    tx = cx + (iw + gap if icon_left else 0)
    if not draw_text: return im   # 2026-11-26 사진판 칩 등장(빈 칠 먼저 → 글자)용: 같은 크기·자리의 빈 칠만
    d.text((tx - b[0], ty - b[1]), s, font=f, fill=INK)
    if icon is not None: im.alpha_composite(icon, (cx if icon_left else cx + tw + gap, ty + (th - icon.height) // 2))
    return im

def chip(s, size=CHIP_PX, icon=None, title=False):
    """노랑 칩: 노션 원본 칠 판(fill_fit) + 검정 글자. 기울기는 규칙 값(2026-11-22부터 0).
    title=True(첫 컷 브랜드 칩)만 벨기에 원본 판 chip.title_plate(430_239, 판 자체 기울기)·좌우 여백 좁게, 글자는 수평."""
    im = brush_box(s, XB(size), YEL, icon, title_plate=title)
    return im.rotate(TILT, resample=Image.BICUBIC, expand=True) if TILT else im

def info_pill(s, size, icon=None, icon_left=False):
    """흰 정보 알약: 칩과 같은 fill_fit 칠(노션 원본, 같은 배율) + 그림자, 아이콘은 오른쪽 끝."""
    im = brush_box(s, BD(size), (255, 255, 255), icon, icon_left)
    sh = Image.new('RGBA', im.size); sh.paste((0, 0, 0, 130), (0, 4), im.getchannel('A'))
    out = Image.new('RGBA', im.size); out.alpha_composite(sh.filter(ImageFilter.GaussianBlur(7))); out.alpha_composite(im)
    return out

def white(s, size):
    f = BK(size); b = tsize(s, f); pad = 14
    im = Image.new('RGBA', (b[2] - b[0] + pad * 2 + 8, b[3] - b[1] + pad * 2 + 8)); sh = Image.new('RGBA', im.size)
    ImageDraw.Draw(sh).text((pad + 3 - b[0], pad + 5 - b[1]), s, font=f, fill=(0, 0, 0, 230), stroke_width=4, stroke_fill=(0, 0, 0, 230))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(5)))
    ImageDraw.Draw(im).text((pad - b[0], pad - b[1]), s, font=f, fill=(255, 255, 255))
    return im

def text3d(txt, h=180, face=None, side=(58, 52, 0), split=True):
    """숫자·단위 3D 글자: 노랑 앞면 + 진한 옆면(깊이 h×0.06) + 그림자. 숫자 앞부분만 크게, 단위는 0.62배."""
    face = face or YEL
    m = re.match(r'^([\d.,+~]+)\s*(.*)$', txt) if split else None
    parts = [(m.group(1), 1.0), (m.group(2), 0.62)] if m and m.group(2) else [(txt, 1.0)]
    fs = [BK(int(h * k)) for _, k in parts]; bbs = [f.getbbox(p, anchor='ls') for (p, _), f in zip(parts, fs)]   # 글자 바닥선 기준
    depth = max(4, int(h * 0.06)); gap = int(h * 0.04)
    tw = sum(b[2] - b[0] for b in bbs) + gap * (len(parts) - 1); top = min(b[1] for b in bbs); base = max(b[3] for b in bbs)
    im = Image.new('RGBA', (tw + depth + 40, base - top + depth + 40)); sh = Image.new('RGBA', im.size)
    for layer in ('shadow', 'side', 'face'):
        x = 20
        for (p, _), f, b in zip(parts, fs, bbs):
            ox, oy = x - b[0], 20 - top
            if layer == 'shadow':
                ImageDraw.Draw(sh).text((ox + depth + 4, oy + depth + 8), p, font=f, fill=(0, 0, 0, 170), anchor='ls')
            elif layer == 'side':
                d = ImageDraw.Draw(im)
                for k in range(depth, 0, -1): d.text((ox + k, oy + k), p, font=f, fill=side + (255,), anchor='ls')
            else:
                ImageDraw.Draw(im).text((ox, oy), p, font=f, fill=face + (255,), stroke_width=2, stroke_fill=side + (255,), anchor='ls')
            x += b[2] - b[0] + gap
        if layer == 'shadow':
            im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(8)))
    return im.crop(im.getbbox())

def pop(cv, img, pos, t, t_in, dur=0.2):
    if img is None or t < t_in: return
    k = min(1.0, (t - t_in) / dur)
    s = 0.6 + 0.4 * ease(k) + 0.08 * math.sin(min(1.0, k) * math.pi)
    a = min(1.0, k * 2)
    if s != 1.0:
        im = img.resize((max(1, round(img.width * s)), max(1, round(img.height * s))), Image.LANCZOS)
        x = pos[0] + (img.width - im.width) // 2; y = pos[1] + (img.height - im.height) // 2
    else: im, x, y = img, pos[0], pos[1]
    if a < 1: im = im.copy(); im.putalpha(Image.fromarray((np.array(im.getchannel('A')) * a).astype('uint8')))
    cv.alpha_composite(im, (int(x), int(y)))

_ac = {}
def arrimg(L, below):
    """노랑 화살표(검은 테두리). below=True면 끝이 위(칩이 부위 아래), False면 끝이 아래. (그림, 위 여백)."""
    k = (L, below)
    if k in _ac: return _ac[k]
    p = 10; w = 72; im = Image.new('RGBA', (w + 2 * p, L + 2 * p)); d = ImageDraw.Draw(im)
    hd = 44; sw = 20; cx = p + w // 2
    if below: poly = [(cx, p), (cx + w // 2, p + hd), (cx + sw // 2, p + hd), (cx + sw // 2, p + L), (cx - sw // 2, p + L), (cx - sw // 2, p + hd), (cx - w // 2, p + hd)]
    else: poly = [(cx, p + L), (cx + w // 2, p + L - hd), (cx + sw // 2, p + L - hd), (cx + sw // 2, p), (cx - sw // 2, p), (cx - sw // 2, p + L - hd), (cx - w // 2, p + L - hd)]
    d.polygon(poly, fill=YEL + (255,), outline=INK + (255,), width=4)
    _ac[k] = (im, p); return _ac[k]
