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
M, YB = 60, 300                      # 좌우 여백 · 위쪽 칩 줄
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

def brush_box(s, f, color, icon=None, svg_short='168_76.svg', svg_long='446_76.svg'):
    """칠 여백 공식(15-6): 높이 = 글자 높이 × 1.9, 좌우 여백 = 높이 × 0.31, 칠해진 가로 구간 기준."""
    b = tsize(s, f); tw, th = b[2] - b[0], b[3] - b[1]
    iw = icon.width if icon is not None else 0; gap = 16 if icon is not None else 0; cw = tw + gap + iw
    h = round(th * 1.9); pad = round(h * 0.31); w = cw + 2 * pad
    for _ in range(4):
        a = _brush_alpha(svg_long if w > 640 else svg_short, w, h)
        row = np.where(np.array(a)[h // 2] > 128)[0]; x0, x1 = int(row[0]), int(row[-1]); span = x1 - x0
        if abs(span - (cw + 2 * pad)) <= 2: break
        w += (cw + 2 * pad) - span
    im = Image.new('RGBA', (w + 30, h + 30)); fill = Image.new('RGBA', (w, h), color + (255,)); fill.putalpha(a)
    im.alpha_composite(fill, (15, 15)); d = ImageDraw.Draw(im); cx = 15 + x0 + (span - cw) // 2
    d.text((cx - b[0], 15 + (h - th) // 2 - b[1]), s, font=f, fill=INK)
    if icon is not None: im.alpha_composite(icon, (cx + tw + gap, 15 + (h - icon.height) // 2))
    return im

def chip(s, size=CHIP_PX, icon=None):
    """노랑 붓칠 칩(AS24 원본 모양, 색만 칠함) + 벨기에 기울기."""
    return brush_box(s, XB(size), YEL, icon).rotate(TILT, resample=Image.BICUBIC, expand=True)

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
