"""페라리 로마 스파이더 v2 — 나세르식: 인트로 플래시 몽타주 + 손 닿는 순간 = 대사 낱말 = 블렌더 레이저. 칩·자막·숫자 규칙은 G350 기준(g350_v5_lib + be_locked_rules.json)."""
import os, sys, json, math, subprocess, re, glob
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops, ImageEnhance
REPO = os.environ.get('BOBAE_REPO', os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../../..')))
sys.path.insert(0, REPO + '/scripts/shortform/video_listing')
from g350_v5_lib import *
G = os.path.dirname(os.path.abspath(__file__)) + '/'
SRC = os.environ.get('ROMA_SRC', '/home/claude/shorts/joy/roma/raw/roma.mp4')   # 원본 영상(저장소에 넣지 않음)
BL = os.environ.get('ROMA_BL', '/home/claude/shorts/joy/bl/')   # 블렌더 렌더 결과(blender/*.py로 다시 만듦)
CAPY = R['caption']['center_y_px']; SX = R['sfx']
INTRO = 0.95                                   # 인트로 몽타주 길이(이 뒤에 첫 말)
WS = [[w, s + INTRO, e + INTRO] for w, s, e in json.load(open(G + 'words.json'))]
ST = lambda i: WS[i][1]
VOICE = WS[-1][2]; ENDT = ST(82) - 0.12; TOTAL = VOICE + 1.9
# 인트로 몽타주: (원본 시각, 확대 시작)
MONT = [(1.3, 1.15), (15.5, 1.15), (181.1, 1.15), (201.7, 1.12)]   # 첫 컷 = 정면
# 컷: 키, 첫 낱말, 원본 시작, 원본 끝(None=길이만큼), 구역, 칩[(글자,낱말)], 큰 숫자[(글자,낱말,흔들림)], 알약[(글자,낱말,✓)], 세로 위치, 손 닿음(원본 시각, 손끝 x, 손끝 y, 맞출 낱말)
# 마지막 칸: 손 닿음(원본 시각, 손끝 x, 손끝 y, 맞출 낱말, 금색 라벨 이름 또는 None, 부위 발광 방식 또는 None)
C = [('c1', 0, 0.0, 2.0, '외관', [], [], [], 0.5, None),   # 정면 샷(원본 0~2초, 살짝 느리게)
     ('odo', 4, 74.3, 76.8, '실내', [('주행', 4)], [('765km', 6, False)], [], 0.5, None),
     ('grille', 7, None, None, '외관', [], [], [], 0.5, (8.0, 0.20, 0.53, 9, 'roma_l_grille', None)),
     ('lamp', 13, 10.0, 12.4, '외관', [('풀 LED 헤드램프', 15)], [], [], 0.5, None),
     ('wheel', 18, None, None, '외관', [('노란색 캘리퍼', 20)], [('20인치', 19, False)], [], 0.55, (16.6, 0.16, 0.62, 20, None, None)),
     ('top', 22, None, None, '외관', [('패브릭 탑', 24)], [('13.5초', 26, False)], [('시속 60km까지 작동', 27, False)], 0.5, (169.3, 0.44, 0.45, 24, None, None)),
     ('exh', 28, None, None, '외관', [], [], [], 0.55, (127.5, 0.50, 0.589, 28, 'roma_l_exh', None)),
     ('trunk', 30, 119.6, 123.8, '트렁크', [('트렁크', 30)], [('255L', 31, False)], [], 0.6, None),
     ('sill', 32, None, None, '실내', [], [], [], 0.45, (35.0, 0.32, 0.43, 34, 'roma_l_sill', None)),
     ('seat', 36, 37.8, 42.6, '실내', [('베이지 가죽', 36)], [], [('레드 스티치', 38, True), ('레드 카펫', 40, True)], 0.5, None),
     ('defl', 43, None, None, '실내', [], [], [], 0.5, (43.0, 0.22, 0.46, 45, 'roma_l_defl', None)),
     ('cock', 50, 48.9, 50.8, '실내', [('듀얼 콕핏', 53)], [], [], 0.5, None),
     ('steer', 55, 50.8, 56.4, '실내', [('터치 컨트롤', 57), ('마네티노', 59)], [], [], 0.55, None),
     ('paddle', 60, None, None, '실내', [], [], [], 0.55, (69.6, 0.62, 0.66, 61, 'roma_l_paddle', None)),
     ('pdisp', 63, None, None, '실내', [], [], [], 0.5, (81.0, 0.62, 0.63, 63, 'roma_l_pdisp', None)),
     ('cscr', 66, 85.0, 87.0, '실내', [('세로형 터치스크린', 67)], [], [], 0.42, None),
     ('eng', 69, None, None, '엔진', [('3.9 V8 트윈터보', 69)], [('620마력', 71, True)], [], 0.4, (204.2, 0.42, 0.48, 71, None, None)),
     ('spoil', 72, 172.4, 176.4, '외관', [('리어 스포일러', 72)], [], [('속도 따라 3단계', 76, False)], 0.55, None),
     ('zb', 78, 176.4, 180.0, '외관', [('토크', 78), ('제로백', 80)], [('77.5kg·m', 79, False), ('3.4초', 81, False)], [], 0.55, None)]
starts = [INTRO] + [ST(c[1]) - 0.12 for c in C[1:]]
SEG = []
for k, c in enumerate(C):
    t0 = starts[k]; t1 = starts[k + 1] if k + 1 < len(C) else ENDT; c = list(c)
    if c[9]:   # 손 닿는 순간 = 낱말 시작 0.08초 전(원본 1배속)
        tt, _, _, kw = c[9][:4]; c[2] = tt - (ST(kw) - 0.08 - t0); c[3] = c[2] + (t1 - t0)
    SEG.append((t0, t1, c))
CH = [list(range(a, b + 1)) for a, b in json.load(open(G + 'edit.json'))['chunks']]
assert [j for c in CH for j in c] == list(range(len(WS)))
BLK = ImageFont.truetype(F + '/Pretendard-Black.otf', R['caption']['font_px'])
_sc = {}
def subimg(ch, act):
    k = (tuple(ch), act)
    if k in _sc: return _sc[k]
    words = [WS[j][0].strip(' ,.?!') for j in ch]; text = ' '.join(words); lines = [words]
    if BLK.getlength(text) > W - 200 and len(words) > 1: m = len(words) // 2; lines = [words[:m], words[m:]]
    lh = 80; tw = max(BLK.getlength(' '.join(l)) for l in lines)
    im = Image.new('RGBA', (int(tw + 80), lh * len(lines) + 40)); sh = Image.new('RGBA', im.size); sd = ImageDraw.Draw(sh)
    for i, l in enumerate(lines): sd.text((im.width / 2 + 3, 20 + lh * i + lh / 2 + 5), ' '.join(l), font=BLK, fill=(0, 0, 0, 220), anchor='mm', stroke_width=4, stroke_fill=(0, 0, 0, 220))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6))); d = ImageDraw.Draw(im); n = 0
    for i, l in enumerate(lines):
        x = (im.width - BLK.getlength(' '.join(l))) / 2; y = 20 + lh * i + lh / 2
        for w in l:
            d.text((x, y), w, font=BLK, fill=YEL if ch[n] == act else (255, 255, 255), anchor='lm'); n += 1; x += BLK.getlength(w + ' ')
    _sc[k] = im; return im
CUTS = [a for a, b, c in SEG[1:]]
def draw_sub(c, t):
    if any(0 <= t - a < R['caption']['cut_gap_s'] for a in CUTS): return
    for q, ch in enumerate(CH):
        a = WS[ch[0]][1] - 0.05; b = (WS[CH[q + 1][0]][1] - 0.05) if q + 1 < len(CH) else TOTAL
        if a <= t < b:
            act = max([j for j in ch if WS[j][1] <= t + 0.02] or [ch[0]])
            im = subimg(ch, act); c.alpha_composite(im, ((W - im.width) // 2, CAPY - im.height // 2)); return
cap = cv2.VideoCapture(SRC); SH = int(cap.get(4))
def y0of(yf): return int(min(SH - H, max(0, yf * SH - H / 2)))
def frames(s0, s1, yf):
    cap.set(cv2.CAP_PROP_POS_MSEC, s0 * 1000); fr = []; y0 = y0of(yf)
    for _ in range(int(round((s1 - s0) * 30)) + 2):
        ok, f = cap.read()
        if not ok: break
        fr.append(f[y0:y0 + H])
    return fr
# 손끝 추적(CSRT): 닿는 프레임에서 시작해 앞으로 0.9초
def track(fr, i0, x, y):
    # 손이 아닌 부위에 고정: 화면 전체 움직임(phaseCorrelate)만 따라감 — 손이 떠나도 점은 부위에 남음
    pts = {i0: (x, y)}; px, py = x, y; prev = cv2.cvtColor(cv2.resize(fr[i0], (270, 480)), cv2.COLOR_BGR2GRAY).astype(np.float32)
    win = cv2.createHanningWindow((270, 480), cv2.CV_32F)
    for i in range(i0 + 1, len(fr)):
        cur = cv2.cvtColor(cv2.resize(fr[i], (270, 480)), cv2.COLOR_BGR2GRAY).astype(np.float32)
        (dx, dy), resp = cv2.phaseCorrelate(prev, cur, win)
        if resp > 0.05 and abs(dx) < 30 and abs(dy) < 30: px += dx * 4; py += dy * 4
        pts[i] = (px, py); prev = cur
    return pts
LZ = [Image.open(p).convert('RGBA') for p in sorted(glob.glob(G + 'laser_fx/*.png'))]
TL = json.load(open(G + 'touch_lines.json'))
def _resample(P, step=6):
    out = [P[0]]
    for a, b in zip(P[:-1], P[1:]):
        d = math.hypot(b[0] - a[0], b[1] - a[1]); n = max(1, int(d / step))
        out += [(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n) for k in range(1, n + 1)]
    return out
_yy, _xx = np.mgrid[0:H, 0:W]
def tap_fx(cv, x, y, u):
    if u < 0 or u > 1.0: return cv
    lay = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(lay); g = ease(min(1.0, u / 0.15)); al = 1 - max(0.0, (u - 0.75) / 0.25)
    for rr, a_ in ((62, 255), (84, 120)):
        r = rr * (0.6 + 0.4 * g); d.ellipse((x - r, y - r, x + r, y + r), outline=YEL + (int(a_ * al),), width=6)
    sh = Image.new('RGBA', (W, H)); sh.paste((0, 0, 0, 140), (0, 0), lay.getchannel('A')); cv.alpha_composite(sh.filter(ImageFilter.GaussianBlur(4)), (3, 4)); cv.alpha_composite(lay)
    return cv
PINTXT = {'roma_l_grille': '타공 패널', 'roma_l_exh': '배기구 4개', 'roma_l_sill': '페라리 레터링', 'roma_l_defl': '윈드 디플렉터', 'roma_l_paddle': '카본 패들', 'roma_l_pdisp': '조수석 디스플레이'}
GOLDC = (232, 184, 74)
import partfx as PFX
# 부위 낱말 칩 → 스카우트 화살표 이름표(check_be 칩 매핑 규칙): 키 → {칩 글자: 화면 비율 좌표(칩 뜰 때)}
PARTPIN = {'lamp': {'풀 LED 헤드램프': (0.47, 0.41)}, 'steer': {'마네티노': (0.35, 0.38)}}
# 화살표 대신 다른 방식으로 부위를 보여 주는 칩(사유를 plan.json에 남김)
NOTRACK = {'트렁크': '부위가 화면 가득(트렁크 공간 전체)', '듀얼 콕핏': '부위가 화면 가득(운전석·조수석 전체)',
           '노란색 캘리퍼': '손가락 터치 + 부위 색·외곽선 효과(PFX)로 캘리퍼를 직접 표시'}
def pin_fx(cv, x, y, u, name):
    # 스카우트식: 부위 바로 위에 짧은 노랑 화살표(끝이 부위를 가리킴) + 그 위 붓칠 칩. 흰 선 없음
    if u < 0: return cv
    L = gchip(PINTXT.get(name, name)); bb_ = L.getbbox(); cw = bb_[2] - bb_[0]
    AL = 110; below = False
    if y - 8 - AL - 6 - (bb_[3] - bb_[1]) < 330: AL = 70
    if y - 8 - AL - 6 - (bb_[3] - bb_[1]) < 150: below = True
    A_, p_ = arrimg(AL, below); bob = 6 * math.sin(u * 2 * math.pi * 1.4) * min(1.0, u / 0.3)
    if not below:
        ay = y - 8 - (p_ + AL) + bob; cy = ay + p_ - 6 - bb_[3]
    else:
        ay = y + 8 - p_ + bob; cy = ay + p_ + AL + 6 - bb_[1]
    ax = x - A_.width / 2; cx = min(W - 40 - bb_[2], max(40 - bb_[0], x - (bb_[0] + bb_[2]) / 2))
    pop(cv, A_, (int(ax), int(ay)), u, 0.0, 0.16)
    pop(cv, L, (int(cx), int(cy)), u, 0.1, 0.2)
    PINBOX[name] = [int(cx) + bb_[0], int(cy) + bb_[1], int(cx) + bb_[2], int(cy) + bb_[3]]
    return cv
PINBOX = {}
def part_glow(cv, x, y, u, R=300):
    if u < 0 or u > 0.9: return cv
    a = np.array(cv.convert('RGB')); g = cv2.cvtColor(a, cv2.COLOR_RGB2GRAY); m = cv2.Canny(cv2.GaussianBlur(g, (5, 5), 0), 50, 140)
    yy, xx = np.ogrid[0:H, 0:W]; m[np.hypot(xx - x, yy - y) > R] = 0
    hsv = cv2.cvtColor(a, cv2.COLOR_RGB2HSV); skin = cv2.dilate(cv2.inRange(hsv, (0, 30, 60), (22, 170, 255)), np.ones((21, 21), np.uint8)); m[skin > 0] = 0
    m = cv2.dilate(m, np.ones((3, 3), np.uint8)); al = min(1.0, u / 0.15) * (1 - max(0.0, (u - 0.55) / 0.35))
    halo = np.clip(cv2.GaussianBlur(m, (0, 0), 9).astype(float) / 255 * 2.2, 0, 1); core = np.clip(cv2.GaussianBlur(m, (0, 0), 1.5).astype(float) / 255, 0, 1)
    f = (halo[..., None] * np.array(GOLDC) * 0.9 + core[..., None] * np.array([255, 240, 200])) * al
    return Image.fromarray(np.clip(a.astype(float) + f, 0, 255).astype(np.uint8)).convert('RGBA')
import mediapipe as _mp
from mediapipe.tasks import python as _mpt
from mediapipe.tasks.python import vision as _vis
_HL = _vis.HandLandmarker.create_from_options(_vis.HandLandmarkerOptions(base_options=_mpt.BaseOptions(model_asset_path=G + 'hand_landmarker.task'), running_mode=_vis.RunningMode.IMAGE, num_hands=1, min_hand_detection_confidence=0.2, min_hand_presence_confidence=0.2))
def tip_refine(frame, x, y):
    r = _HL.detect(_mp.Image(image_format=_mp.ImageFormat.SRGB, data=np.ascontiguousarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))))
    if r.hand_landmarks:
        L = r.hand_landmarks[0][8]; nx, ny = L.x * frame.shape[1], L.y * frame.shape[0]
        if math.hypot(nx - x, ny - y) < 450: return nx, ny
    return x, y
def surf_line(cv, poly, tipi, u):
    # u: 닿은 뒤 초. 0~0.35 손끝에서 양쪽으로 뻗음, 0.35~0.75 빛 알갱이가 선을 따라 달림, 0.75~1.0 사라짐
    if u < 0 or u > 1.0: return cv
    n = len(poly); g = ease(min(1.0, u / 0.35)); a = 1.0 if u < 0.75 else max(0.0, 1 - (u - 0.75) / 0.25)
    lo = max(0, int(tipi - g * n)); hi = min(n, int(tipi + g * n) + 1); seg = poly[lo:hi]
    if len(seg) < 2: return cv
    lay = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(lay)
    d.line(seg, fill=YEL + (int(200 * a),), width=26, joint='curve'); lay = lay.filter(ImageFilter.GaussianBlur(12))
    d = ImageDraw.Draw(lay); d.line(seg, fill=YEL + (int(255 * a),), width=9, joint='curve'); d.line(seg, fill=(255, 255, 235, int(255 * a)), width=4, joint='curve')
    if 0.2 < u < 0.9:   # 달리는 빛 알갱이 두 개(양쪽)
        q = (u - 0.2) / 0.7
        for j in (int(tipi + q * (hi - 1 - tipi)), int(tipi - q * (tipi - lo))):
            j = max(0, min(n - 1, j)); x, y = poly[j]; d.ellipse((x - 14, y - 14, x + 14, y + 14), fill=(255, 255, 240, int(255 * a)))
    x, y = poly[tipi]; r = 22 * (1 - 0.5 * min(1, u / 0.3)); d.ellipse((x - r, y - r, x + r, y + r), fill=(255, 255, 240, int(255 * a)))
    rgb = np.array(cv.convert('RGB')).astype(np.int16); ad = np.array(lay).astype(np.int16); al = ad[..., 3:4] / 255.0
    return Image.fromarray(np.clip(rgb + ad[..., :3] * al * 1.15, 0, 255).astype(np.uint8)).convert('RGBA')
def lz_anchor():   # 첫 장 밝은 중심 = 닿는 점
    a = np.array(LZ[0].getchannel('A')).astype(float); ys, xs = np.nonzero(a > 200)
    return (xs.mean(), ys.mean()) if len(xs) else (256, 256)
LA = lz_anchor() if LZ else (256, 256); LZS = 1.0
def laser(cv, k, x, y, scale=0.95):
    if not LZ or k < 0 or k >= len(LZ): return
    im = LZ[k]; s = scale; im = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
    rgb = np.array(cv.convert('RGB')).astype(np.int16); add = np.array(im).astype(np.int16)
    ox, oy = int(x - LA[0] * s), int(y - LA[1] * s); h, w = add.shape[:2]
    x0, y0, x1, y1 = max(0, ox), max(0, oy), min(W, ox + w), min(H, oy + h)
    if x1 <= x0 or y1 <= y0: return cv
    sub = add[y0 - oy:y1 - oy, x0 - ox:x1 - ox]; al = sub[..., 3:4] / 255.0
    rgb[y0:y1, x0:x1] = np.clip(rgb[y0:y1, x0:x1] + sub[..., :3] * al * 1.1, 0, 255)   # 더하기 합성(빛)
    return Image.fromarray(rgb.astype(np.uint8)).convert('RGBA')
CMAP = json.load(open(G + 'chipmap.json'))
_gc = {}
def goldtxt(s, wmax, hmax):
    k = (s, wmax, hmax)
    if k not in _gc:
        d = BL + CMAP.get(s, '')
        if not os.path.isdir(d) or not os.listdir(d): return None
        im = Image.open(d + '/' + sorted(os.listdir(d))[-1]).convert('RGBA'); im = im.crop(im.getbbox())
        rgb = ImageEnhance.Brightness(im.convert('RGB')).enhance(1.5); rgb = ImageEnhance.Contrast(rgb).enhance(1.2); o = rgb.convert('RGBA'); o.putalpha(im.getchannel('A'))
        sc = min(wmax / o.width, hmax / o.height); o = o.resize((int(o.width * sc), int(o.height * sc)), Image.LANCZOS)
        out = Image.new('RGBA', (o.width + 30, o.height + 34)); sh = Image.new('RGBA', o.size); sh.paste((0, 0, 0, 170), (0, 0), o.getchannel('A'))
        out.alpha_composite(sh.filter(ImageFilter.GaussianBlur(8)), (12, 18)); out.alpha_composite(o, (6, 6)); _gc[k] = out
    return _gc[k]
_chips = {}
def gchip(s):
    if s not in _chips: _chips[s] = chip(s)
    return _chips[s]
_ck = Image.new('RGBA', (80, 80)); ImageDraw.Draw(_ck).text((40, 40), '✓', font=BK(64), fill=INK, anchor='mm'); _ck = _ck.crop(_ck.getbbox())
_pc = {}
def gpill(s, ck):
    if (s, ck) not in _pc: _pc[(s, ck)] = info_pill(s, 58, _ck if ck else None, True)
    return _pc[(s, ck)]
GK = {'765km': 'km', '20인치': 'wh', '13.5초': 'top', '255L': 'trunk', '620마력': 'hp', '77.5kg·m': 'tq', '3.4초': 'zb'}
_gd = {}
def goldseq(label, wmax=820, hmax=230):
    if label not in _gd:
        d = BL + 'roma_g_' + GK[label]; ims = [Image.open(f'{d}/{f}').convert('RGBA') for f in sorted(os.listdir(d))]
        bb = None
        for im in ims:
            b = im.getbbox()
            if b: bb = b if bb is None else (min(bb[0], b[0]), min(bb[1], b[1]), max(bb[2], b[2]), max(bb[3], b[3]))
        ims = [im.crop(bb) for im in ims]; k = min(wmax / ims[-1].width, hmax / ims[-1].height)
        _gd[label] = [im.resize((int(im.width * k), int(im.height * k)), Image.LANCZOS) for im in ims]
    return _gd[label]
def gold_at(label, t, tb):
    seq = goldseq(label); i = int((t - tb) * 30)
    return seq[max(0, min(len(seq) - 1, i))]
_cn = {}
def cnt(txt, h, t, tb, dur=0.45):
    m = re.match(r'^([\d.,]+)(.*)$', txt); k = max(0.0, min(1.0, (t - tb) / dur))
    if not m or k >= 1: s2 = txt
    else:
        v = float(m.group(1).replace(',', '')); dec = len(m.group(1).split('.')[1]) if '.' in m.group(1) else 0
        cur = v * (1 - (1 - k) ** 3); s2 = (f'{cur:.{dec}f}' if dec else str(int(round(cur)))) + m.group(2)
    if (s2, h) not in _cn: _cn[(s2, h)] = text3d(s2, h)
    return _cn[(s2, h)]
HB = chip('페라리', R['chip']['title_font_px'], title=True); HM = white('로마 스파이더', 104)
_room = W - 24 - (M - 10 + HB.getbbox()[2] + 6); _hs = 104
while HM.getbbox()[2] > _room and _hs > 60: _hs -= 4; HM = white('로마 스파이더', _hs)
HS = white('2024년식 · 가솔린 · 765km', 58)
def slam(cv, img, pos, t, t_in, dur=0.22):   # 인트로 제목 쾅: 1.6배에서 1배로 떨어지며 들어옴
    if t < t_in: return
    k = min(1.0, (t - t_in) / dur); s = 1.6 - 0.6 * (1 - (1 - k) ** 3)
    im = img.resize((max(1, int(img.width * s)), max(1, int(img.height * s))), Image.LANCZOS)
    if k < 1: im.putalpha(Image.fromarray((np.array(im.getchannel('A')) * min(1, k * 2.5)).astype('uint8')))
    cv.alpha_composite(im, (int(pos[0] + (img.width - im.width) / 2), int(pos[1] + (img.height - im.height) / 2)))
from rembg import new_session, remove
RS = new_session('isnet-general-use')
CHR = [Image.open(p).convert('RGBA') for p in sorted(glob.glob(BL + 'roma_hero/*.png'))]   # bl_hero_text.py: 크롬 앞면·레드 옆면·빛 쓸기
def chromify(im):   # 검게 비친 면을 크롬 그라데이션(위 은빛-가운데 어두운 띠-아래 밝음)으로
    a = np.array(im).astype(float); h = a.shape[0]; yy = np.linspace(0, 1, h)[:, None]
    g = np.interp(yy, [0, 0.42, 0.52, 0.62, 1], [245, 205, 70, 150, 235])
    L = a[..., :3].mean(2, keepdims=True); hi = np.clip((L - 150) / 105, 0, 1)
    tint = np.array([1.0, 1.0, 1.04]); base = g[..., None] * tint
    out = base * (1 - hi) + a[..., :3] * hi; out = np.clip(out * 0.85 + L * 0.25, 0, 255)
    o = np.dstack([out, a[..., 3:]]).astype(np.uint8); return Image.fromarray(o, 'RGBA')
_cb = None
for _im in CHR:
    _b = _im.getbbox(); _cb = _b if _cb is None else (min(_cb[0], _b[0]), min(_cb[1], _b[1]), max(_cb[2], _b[2]), max(_cb[3], _b[3]))
CHR = [im.crop(_cb) for im in CHR] if CHR else CHR
for _im in CHR: _im.putalpha(_im.getchannel('A').point(lambda v: 0 if v < 24 else v))   # 블렌더 빈 배경의 옅은 알파 제거(글자 뒤 사각형 원인)
_mk = {}
def carmask(fi, frame):
    if fi not in _mk:
        sm = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)).resize((720, 1280))
        m = remove(sm, session=RS, only_mask=True).resize((W, H), Image.BILINEAR); a = np.array(m) > 120
        n, lab, st, _ = cv2.connectedComponentsWithStats(a.astype(np.uint8), 8)
        if n > 1: k = 1 + int(np.argmax(st[1:, 4])); a = lab == k
        _mk[fi] = Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))
    return _mk[fi]
CTOP = [None]
_yy, _xx = np.mgrid[0:H, 0:W]
_g = np.clip(1 - _yy / 900.0, 0, 1) ** 1.4; _r = np.clip(1 - np.hypot((_xx - W / 2) / 620, (_yy - 780) / 360), 0, 1) ** 1.6
_sk = np.zeros((H, W, 4), np.uint8); _sk[..., 0] = (8 * _g + 230 * _r).clip(0, 255); _sk[..., 1] = (12 * _g + 18 * _r).clip(0, 255); _sk[..., 2] = (40 * _g + 22 * _r).clip(0, 255); _sk[..., 3] = (190 * _g + 215 * _r).clip(0, 255)
SKYFX = Image.fromarray(_sk)
FER = None
def _acx(dst, src, x, y):   # 화면 밖으로 나가는 부분은 잘라서 합성
    sx, sy = max(0, -x), max(0, -y); x, y = max(0, x), max(0, y)
    w = min(src.width - sx, dst.width - x); h = min(src.height - sy, dst.height - y)
    if w > 0 and h > 0: dst.alpha_composite(src.crop((sx, sy, sx + w, sy + h)), (x, y))
_TXT = {}
def chrome_behind(cv, raw, mask, t, z, ccx, ccy):
    # 나세르식: 차 지붕 뒤 거대한 3D 모델명. 매 프레임 차 윤곽(폭·지붕·가운데)에 맞춰 크기·자리를 따라감 → 카메라가 다가가면 글자도 같이 커짐
    if not CHR: return cv
    m = mask.resize((int(W * z), int(H * z))).crop((int((ccx - W / (2 * z)) * z), int((ccy - H / (2 * z)) * z), int((ccx - W / (2 * z)) * z) + W, int((ccy - H / (2 * z)) * z) + H))
    ma = np.array(m) > 128; cols = np.nonzero(ma.mean(0) > 0.02)[0]
    if len(cols) < 10: return cv
    x0, x1 = cols.min(), cols.max(); cxm = (x0 + x1) / 2; cwid = x1 - x0
    mid = ma[:, int(x0 + cwid * 0.25):int(x1 - cwid * 0.25)]; rows = np.nonzero(mid.mean(1) > 0.3)[0]; top = rows.min() if len(rows) else 700
    tw = min(1300.0, max(760.0, cwid * 1.02)); base = top + 0.16 * tw
    pv = _TXT.get('s')
    if pv is not None: tw, cxm, base = [p * 0.75 + q * 0.25 for p, q in zip(pv, (tw, cxm, base))]   # 부드럽게
    _TXT['s'] = (tw, cxm, base)
    fa = 1.0
    k = min(len(CHR) - 1, int(max(0.0, t - 0.08) * 30)); im = CHR[k]; sc = tw / CHR[-1].width
    im = im.resize((max(1, int(im.width * sc)), max(1, int(im.height * sc))), Image.LANCZOS)
    y = max(int(base - CHR[-1].height * sc), 575); x = int(cxm - im.width / 2)   # 제목 줄과 겹치면 아래로 밀어 차 뒤로 더 숨김
    lay = Image.new('RGBA', (W, H))
    gl = Image.new('RGBA', im.size, (255, 40, 30, 0)); gl.putalpha(im.getchannel('A').point(lambda v: int(v * 0.2)))   # 붉은 후광
    _acx(lay, gl.filter(ImageFilter.GaussianBlur(44)), x, y)
    sh = Image.new('RGBA', im.size); sh.paste((0, 0, 0, 160), (0, 0), im.getchannel('A')); _acx(lay, sh.filter(ImageFilter.GaussianBlur(12)), x + 6, y + 16)
    _acx(lay, im, x, y)
    a = np.array(lay.getchannel('A')).astype(float) * (1 - np.array(m).astype(float) / 255) * fa; lay.putalpha(Image.fromarray(a.astype(np.uint8)))
    return Image.alpha_composite(cv, lay)
FER = goldtxt('FERRARI', 640, 120)
ANC = {}; EVS = []; CHIPS_LOG = []; BIGS_LOG = []; TOUCH_T = {}
proc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p', G + 'nov2.mp4'], stdin=subprocess.PIPE)
nfr = 0
def put(cv):
    global nfr; proc.stdin.write(cv.convert('RGB').tobytes()); nfr += 1
# ── 인트로 몽타주 ──
seg = INTRO / len(MONT)
for k, (st_, z0) in enumerate(MONT):
    fr = frames(st_, st_ + seg + 0.2, 0.5)
    while nfr < round((k + 1) * seg * FPS):
        t = nfr / FPS - k * seg; fi = min(len(fr) - 1, int(t * 30)); z = z0 - (z0 - 1.0) * ease(t / seg)
        im = Image.fromarray(cv2.cvtColor(fr[fi], cv2.COLOR_BGR2RGB)); cw_, ch_ = W / z, H / z
        cv = im.resize((W, H), box=(W / 2 - cw_ / 2, H / 2 - ch_ / 2, W / 2 + cw_ / 2, H / 2 + ch_ / 2)).convert('RGBA')
        fl = max(0.0, 1 - t / 0.09)   # 컷마다 흰 섬광
        if fl > 0: cv = Image.alpha_composite(cv, Image.new('RGBA', (W, H), (255, 255, 255, int(200 * fl))))
        put(cv)
EVS.append((0.0, 'whoosh', 0.45)); EVS.append((INTRO * 0.5, 'whoosh', 0.4))
EVS.append((INTRO + 0.02, 'impact', 0.6))
_prev = None
for t0, t1, c in SEG:
    key, fw, s0, s1, zone, chips, bigs, pills, yf, touch = c; dur = t1 - t0
    rate = 1.0 if touch else min(2.0, (s1 - s0) / dur)
    fr = frames(s0, s1, yf)
    pts = None; ti0 = None
    if touch:
        tt, tx, ty, kw = touch[:4]; ti0 = min(len(fr) - 1, int(round((tt - s0) * 30)))
        _x, _y = tip_refine(fr[ti0], tx * W, ty * SH - y0of(yf)) if key != 'exh' else (tx * W, ty * SH - y0of(yf)); pts = track(fr, ti0, _x, _y); TOUCH_T[key] = t0 + (tt - s0)
        if key not in ('wheel', 'exh'): EVS.append((TOUCH_T[key] - 0.02, 'beep_on', 0.35))
    if key == 'eng': EVS.append((t0 + 0.02, 'engine_start', 0.45))
    for b, w, sh in bigs:
        if '마력' in b: EVS.append((ST(w) - 0.05, 'horse_neigh_el', 0.5))
        elif '초' in b and key == 'zb': EVS.append((ST(80), 'stopwatch', 0.6))
        elif key not in ('zb', 'odo'): EVS.append((ST(w) - 0.24, 'ding', 0.7))
    ppins = [(s_, w_, PARTPIN[key][s_]) for s_, w_ in chips if s_ in PARTPIN.get(key, {})]
    chips = [(s_, w_) for s_, w_ in chips if s_ not in PARTPIN.get(key, {})]
    PP = []
    for s_, w_, (fx_, fy_) in ppins:
        tp_ = ST(w_) - t0 + 0.05; fi_ = min(len(fr) - 1, int(round((min(s1, s0 + tp_ * rate) - s0) * 30)))
        PP.append((s_, tp_, fi_, track(fr, fi_, fx_ * W, fy_ * H)))
    ctimes = [ST(w) - t0 + 0.05 for _, w in chips]; btimes = [ST(w) - t0 - 0.22 for _, w, _ in bigs]
    chip_seen = set(); big_seen = set()
    while nfr < round(t1 * FPS):
        t = nfr / FPS - t0; st = min(s1, s0 + t * rate); fi = min(len(fr) - 1, int(round((st - s0) * 30)))
        z = 1.0 + 0.045 * ease(t / dur); dx = dy = 0; ccx, ccy = W / 2, H / 2
        if touch and pts:   # 닿는 순간 손끝 쪽으로 살짝 당김(T08)
            u = (st - s0) * 30 - ti0
            if u >= -6:
                g = ease(min(1.0, (u + 6) / 12)); z = max(z, 1 + 0.12 * g)
                px, py = pts.get(min(max(pts), max(ti0, fi)), pts[ti0]); ccx = W / 2 + (px - W / 2) * 0.35 * g; ccy = H / 2 + (py - H / 2) * 0.35 * g
        for (b, w, sh), tb in zip(bigs, btimes):
            u = t - (tb + 0.22)
            if sh and 0 <= u < 0.6: z = max(z, 1.06); a = 14 * (1 - u / 0.6); dx = a * math.sin(u * 90); dy = a * math.cos(u * 70)
        if key == 'c1' and t < 0.3: a = 16 * (1 - t / 0.3); dx += a * math.sin(t * 95); dy += a * math.cos(t * 80)   # 제목 쾅 흔들림
        im = Image.fromarray(cv2.cvtColor(fr[fi], cv2.COLOR_BGR2RGB)); cw_, ch_ = W / z, H / z
        ccx = min(W - cw_ / 2, max(cw_ / 2, ccx + dx)); ccy = min(H - ch_ / 2, max(ch_ / 2, ccy + dy))
        cv = im.resize((W, H), box=(ccx - cw_ / 2, ccy - ch_ / 2, ccx + cw_ / 2, ccy + ch_ / 2)).convert('RGBA')
        clean = cv; PIN = []
        if touch and pts:   # 레이저: 닿는 프레임부터 24장, 손끝 추적점
            k = fi - ti0
            if k >= 0:
                px, py = pts.get(fi, pts[max(pts)]); ox, oy = px - pts[ti0][0], py - pts[ti0][1]   # 손끝 따라 같이 움직임
                T = ((pts[ti0][0] + ox - ccx) * z + W / 2, (pts[ti0][1] + oy - ccy) * z + H / 2)
                if touch[4]:
                    cv, an = PFX.fx(cv, key, G, k, ccx, ccy, z, T)
                    if an: ANC[key] = ((an[0] - W / 2) / z + ccx, (an[1] - H / 2) / z + ccy, fi)   # 원본 좌표로 기억
                    if key in ANC:
                        sx_, sy_, f_ = ANC[key]; qx, qy = pts.get(fi, pts[max(pts)]); rx, ry = pts.get(f_, pts[max(pts)])
                        PIN.append(((sx_ + qx - rx - ccx) * z + W / 2, (sy_ + qy - ry - ccy) * z + H / 2, k / 30, touch[4]))
                elif PFX.load(key, G) is not None: cv, _ = PFX.fx(cv, key, G, k, ccx, ccy, z, T)   # 라벨 없는 장면도 부위 색 바꾸기
                else: cv = tap_fx(cv, T[0], T[1], k / 30)
        if key == 'c1':
            _m = PFX.car_matte(G, fi, fr[fi]) or carmask(fi, fr[fi])   # SAM×BiRefNet 윤곽(없으면 옛 rembg)
            if CTOP[0] is None: _a = np.array(_m) > 128; _r = np.nonzero(_a[:, int(W * 0.2):int(W * 0.8)].mean(1) > 0.25)[0]; CTOP[0] = int(_r.min()) if len(_r) else 700
            _mz = _m.resize((int(W * z), int(H * z))).crop((int(ccx * z - W / 2), int(ccy * z - H / 2), int(ccx * z - W / 2) + W, int(ccy * z - H / 2) + H))
            _bg = cv.filter(ImageFilter.GaussianBlur(9)); _bg = Image.alpha_composite(_bg, Image.new('RGBA', (W, H), (0, 0, 0, 120)))
            _bg = Image.alpha_composite(_bg, SKYFX)   # 위쪽 밤하늘 그라데이션 + 차 뒤 붉은 후광(페라리 색)
            cv = Image.composite(cv, _bg, _mz)
            cv = chrome_behind(cv, None, _m, t, z, ccx, ccy)
            cv = PFX.rim(cv, _mz, t)   # 차 실루엣 흰 빛 + 빛 쓸기
            if t < 0.12: cv = Image.alpha_composite(cv, Image.new('RGBA', (W, H), (255, 255, 255, int(230 * (1 - t / 0.12)))))
            slam(cv, HB, (M - 10, YB), t, 0.45); _hb2 = HB.getbbox()
            slam(cv, HM, (M - 10 + _hb2[2] + 6, YB + (_hb2[1] + _hb2[3] - HM.height) // 2), t, 0.6); pop(cv, HS, (M - 4, YB + _hb2[3] + 16), t, 0.85)
            if t >= 0.8 and not CHIPS_LOG: CHIPS_LOG.append({'key': 'c1', 'label': '페라리', 'kind': 'title', 't0': round(t0 + 0.45, 3), 't1': round(t1, 3), 't_box': round(nfr / FPS, 3), 'px': R['chip']['title_font_px'], 'y': YB, 'box': [M - 10 + _hb2[0], YB + _hb2[1], M - 10 + _hb2[2], YB + _hb2[3]]})
            _hb = (0, 0, W, 10)
        if bigs: cv = Image.alpha_composite(cv, Image.new('RGBA', (W, H), (0, 0, 0, 45)))
        yk = YB; cur = None
        for (s, w), tc in zip(chips, ctimes):
            if t >= tc: cur = (s, tc)
        if cur:
            Ci = gchip(cur[0]); bb = Ci.getbbox(); x = (W - (bb[2] - bb[0])) // 2 - bb[0]
            pop(cv, Ci, (x, YB), t, cur[1]); yk = YB + bb[3] + 14
            if t >= cur[1] + 0.2 and cur[0] not in chip_seen:
                chip_seen.add(cur[0]); CHIPS_LOG.append({**({'no_track_reason': NOTRACK[cur[0]]} if cur[0] in NOTRACK else {}), 'key': key, 'label': cur[0], 'kind': 'point', 't0': round(t0 + cur[1], 3), 't1': round(t1, 3), 't_box': round(nfr / FPS, 3), 'px': R['chip']['font_px'], 'y': YB, 'box': [x + bb[0], YB + bb[1], x + bb[2], YB + bb[3]]})
        y3 = max(int(H * 0.12), yk + 10); hide = False
        for k2, ((b, w, sh), tb) in enumerate(zip(bigs, btimes)):
            if t >= tb:
                B3 = gold_at(b, t, tb); sh3 = Image.new('RGBA', B3.size); sh3.paste((0, 0, 0, 150), (0, 0), B3.getchannel('A')); cv.alpha_composite(sh3.filter(ImageFilter.GaussianBlur(9)), ((W - B3.width) // 2 + 6, y3 + 10)); cv.alpha_composite(B3, ((W - B3.width) // 2, y3)); hide = True
                if t >= tb + 0.4 and k2 not in big_seen:
                    big_seen.add(k2); bb = B3.getbbox(); BIGS_LOG.append({'key': key, 'label': b, 'kind': 'big', 't_box': round(nfr / FPS, 3), 'box': [(W - B3.width) // 2 + bb[0], y3 + bb[1], (W - B3.width) // 2 + bb[2], y3 + bb[3]]})
                y3 += goldseq(b)[-1].height + 12
        yp = y3 if bigs else yk
        for s, w, ck in pills:
            P = gpill(s, ck); tp = ST(w) - t0 - 0.06
            if t >= tp: pop(cv, P, ((W - P.width) // 2, yp), t, tp); yp += P.getbbox()[3] - P.getbbox()[1] + 12
        for s_, tp_, fi_, pp_ in PP:
            if t >= tp_:
                qx, qy = pp_.get(fi, pp_[max(pp_)]); X_, Y_ = (qx - ccx) * z + W / 2, (qy - ccy) * z + H / 2
                PIN.append((X_, Y_, t - tp_, s_))
        for (px_, py_, u_, nm_) in PIN: cv = pin_fx(cv, px_, py_, u_, nm_)
        for s_, tp_, fi_, pp_ in PP:
            if t - tp_ >= 0.4 and (key, s_) not in chip_seen and s_ in PINBOX:
                chip_seen.add((key, s_)); CHIPS_LOG.append({'key': key, 'label': s_, 'kind': 'callout', 't0': round(t0 + tp_, 3), 't1': round(t1, 3), 't_box': round(nfr / FPS, 3), 'box': PINBOX[s_], 'px': R['chip']['font_px']})
        if not hide: draw_sub(cv, nfr / FPS)
        put(cv); last = clean
    _prev = zone
    del fr
DC = chip('강성경 딜러', R['chip']['title_font_px']); DS = white('오토갤러리 레이브', 72); DQ = white('문의 환영합니다', 54)
import dealer_card as _DCD   # 임모스카우트식 딜러 프사 카드(둥근 얼굴 + 노랑 붓 띠)
DCARD = _DCD.DealerCard(REPO + '/public/assets/dealer-profile/seoul-auto-gallery-formal-ai/450551-1.webp', R['color']['yellow'])
FCX, FCY = W // 2, 600
base = last
while nfr < round(TOTAL * FPS):
    t = nfr / FPS - ENDT; cv = Image.alpha_composite(base, Image.new('RGBA', (W, H), (0, 0, 0, int(170 * min(1, t / 0.3)))))
    DCARD.draw(cv, FCX, FCY, t)
    db = DC.getbbox(); y0 = DCARD.box(FCX, FCY)[3] + 24 - db[1]
    pop(cv, DC, ((W - (db[2] - db[0])) // 2 - db[0], y0), t, 0.42)
    pop(cv, DS, ((W - DS.width) // 2, y0 + db[3] + 10), t, 0.58); pop(cv, DQ, ((W - DQ.width) // 2, y0 + db[3] + 10 + DS.height + 6), t, 0.72)
    if nfr / FPS < VOICE: draw_sub(cv, nfr / FPS)
    put(cv)
proc.stdin.close(); proc.wait()
# ── 효과음 고르기: 간격·같은 소리 간격·개수 상한(be_locked_rules.json sfx) ──
PRI = ['impact', 'engine_start', 'horse_neigh_el', 'stopwatch', 'whoosh', 'ding', 'beep_on']
cap_n = int(SX['max_per_30s'] * TOTAL / 30); acc = []
for t, nm, v in sorted(EVS, key=lambda x: (PRI.index(x[1]), x[0])):
    if t < 0 or t > TOTAL - 0.5: continue
    if any(abs(t - a[0]) < SX['min_gap_s'] for a in acc): continue
    if any(a[1] == nm and abs(t - a[0]) < SX['same_sound_min_gap_s'] for a in acc): continue
    if len(acc) >= cap_n: break
    acc.append((round(t, 3), nm, v))
acc.sort(); print('효과음', len(acc), [(a[0], a[1]) for a in acc])
# ── 소리: 목소리 + 역동 배경음(이어 붙여 길이 맞춤, 목소리에 맞춰 자동으로 줄임) + 효과음 ──
OUT = G + 'ferrari_roma_spider_rave_v2.mp4'
BG = A + 'bgm/bobae_supercar_v1.mp3'
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', G + 'voice.wav', '-af', f'adelay={int(INTRO*1000)}:all=1', G + 'voice_intro.wav'], check=True)   # 검사용: 화면 시간축(인트로 뒤)에 맞춘 음성
inp = ['-i', G + 'nov2.mp4', '-i', G + 'voice.wav', '-i', BG, '-i', BG]
fl = [f'[1:a]adelay={int(INTRO*1000)}:all=1,highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=8:release=120,apad=whole_dur={TOTAL},asplit=2[v][vk]',
      f'[2:a][3:a]acrossfade=d=2:c1=tri:c2=tri,atrim=0:{TOTAL},volume=0.62,afade=t=out:st={TOTAL-1.6}:d=1.6[bg0]',
      '[bg0][vk]sidechaincompress=threshold=0.04:ratio=5:attack=25:release=350:makeup=1[b]']
mx = ['[v]', '[b]']
for j, (tc, nm, v) in enumerate(acc):
    inp += ['-i', A + 'sfx/' + nm + '.wav']; fl.append(f'[{len(inp)//2-1}:a]volume={v},adelay={int(tc*1000)}:all=1[s{j}]'); mx.append(f'[s{j}]')
A_ = R['audio']; LN = f"loudnorm=I={A_['loudness_lufs']}:TP={A_['true_peak_db']}:LRA=11"
_m = subprocess.run(['ffmpeg', '-hide_banner', *inp, '-filter_complex', ';'.join(fl + [''.join(mx) + f'amix=inputs={len(mx)}:normalize=0:duration=longest,{LN}:print_format=json[a]']), '-map', '[a]', '-t', str(TOTAL), '-f', 'null', '-'], capture_output=True, text=True).stderr
_j = json.loads(_m[_m.rindex('{'):_m.rindex('}') + 1])
LN2 = LN + f":measured_I={_j['input_i']}:measured_TP={_j['input_tp']}:measured_LRA={_j['input_lra']}:measured_thresh={_j['input_thresh']}:offset={_j['target_offset']}:linear=true"
fl.append(''.join(mx) + f"amix=inputs={len(mx)}:normalize=0:duration=longest,{LN2},aresample=48000[a]")
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *inp, '-filter_complex', ';'.join(fl), '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', str(TOTAL), OUT], check=True)
TECH = {'bgm', 'caption_chunks', 'end_logo', 'loudness_rule', 'slow_push', 'title_brand_chip', 'dealer_profile_card', 'callout_chip', 'callout_arrow', 'big_number_3d', 'point_chip', 'sfx_rules', 'T02', 'T04', 'T07', 'T08', 'intro_flash_montage', 'touch_laser_3d'}
json.dump([[w[0], round(w[1], 3), round(w[2], 3)] for w in WS], open(G + 'voice_intro_words.json', 'w'), ensure_ascii=False)   # 화면 시간축(인트로 뒤) 낱말 시각
json.dump({'words': G + 'voice_intro_words.json', 'bigs': BIGS_LOG, 'edition': 'feature_video', 'edition_code': 'ED-SIMPLE', 'renderer': 'roma_render2.py (g350_v5_lib)', 'order': 'picked', 'voice': 'voice_intro.wav', 'voice_offset_s': INTRO,
           'frame': [W, H], 'techniques': sorted(TECH), 'music': True, 'total': round(TOTAL, 3), 'cuts': [round(a, 3) for a in [INTRO] + CUTS],
           'sfx': [{'t': a[0], 'kind': a[1], 'sound': a[1]} for a in acc], 'chips': CHIPS_LOG, 'touch': TOUCH_T,
           'caption': {'center_y_px': CAPY, 'font_px': R['caption']['font_px'], 'chunks': len(CH)}}, open(OUT + '.plan.json', 'w'), ensure_ascii=False, indent=1)
print(OUT, TOTAL)
