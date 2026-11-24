# v2 — 2021 BMW M235i xDrive 그란쿠페(F44) 빠른 비트 편집
# 바뀐 것(2026-11-24 사용자): 손이 닿는 부위·트렁크 외곽선(SAM 2.1 + partfx) · 마력 대사 때 블렌더 금속 말 질주 ·
#   「레드 마그마 시트」 · ADAC 제원(B48 2.0 터보 306마력 450Nm/1,800rpm · 8단 · 0-100 4.9초 · 트렁크 430L · LED 기본 · HUD 옵션 · 라이브 콕핏 프로페셔널 기본)
# 실촬영 영상 그대로(자르기·확대·이동·흐림만). 값은 be_locked_rules.json(g350_v5_lib)에서.
import os, sys, json, math, random, subprocess, glob, wave
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter
REPO = '/home/claude/rr'
sys.path.insert(0, REPO + '/scripts/shortform/video_listing'); sys.path.insert(0, REPO + '/scripts/shortform/video_listing/roma_rave')
sys.path.insert(0, '/home/claude/shorts/m235')
from g350_v5_lib import *
from dealer_card import DealerCard
import partfx as PFX
from shots import read_shot, TOUCH

G = '/home/claude/shorts/m235/'; V = G + 'v3/'
OUT = G + os.environ.get('M235_OUT', 'bobae_beat_m235i_v4.mp4')
MOFF0 = 50.55
RB = [b - MOFF0 for b in json.load(open(G + 'beats.json'))['beats'] if b >= MOFF0 - 0.05]; RB[0] = 0.0
SK = RB[4]; MOFF = MOFF0 + SK; RB = [b - SK for b in RB[4:]]   # 빌드 앞 4비트를 건너뜀(드롭이 3.5초)
CUT_A = 34.133 - SK; CUT_B = CUT_A + 4 * 0.418   # 브레이크 가운데 4비트를 덜어냄 — 60초 안에 넣으려고
CUT_D = CUT_B - CUT_A
BEATS = [b for b in RB if b < CUT_A] + [b - CUT_D for b in RB if b >= CUT_B]
B_DROP1, B_BREAK, B_DROP2 = 5.155 - SK, 32.461 - SK, 39.427 - SK - CUT_D
TDY = int(os.environ.get('M235_TITLE_DY', 160))   # 히어로 영상 만들 때 NAS_TITLE_DY와 같은 값
HERO_V = G + os.environ.get('M235_HERO', 'nas/hero_v3.mp4'); HERO_IN = 0.3
CAPY = R['caption']['center_y_px']; CAPPX = R['caption']['font_px']; CUTGAP = R['caption']['cut_gap_s']
CY0 = (2336 - 1920) // 2
random.seed(7)

# ── 음성: 구절(소리 시작·끝) · 낱말(대본 글자, 시각은 받아쓰기를 소리 시작에 맞춤) ──
WS = json.load(open(V + 'word_starts.json'))
PHR = json.load(open(V + 'phrases.json'))   # [(구간 시작, 소리 시작, 구간 끝)]
vx = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', V + 'voice_a.mp3', '-f', 's16le', '-ac', '1', '-ar', '16000', '-'], capture_output=True).stdout, np.int16).astype(np.float32) / 32768
def sound_end(a, b):   # 구간 안 마지막으로 -40dB 넘는 곳 + 0.08
    e = [20 * np.log10(np.sqrt((vx[int(t * 16000):int(t * 16000) + 160] ** 2).mean()) + 1e-6) for t in np.arange(a, b, 0.01)]
    idx = [i for i, v in enumerate(e) if v > -40]; return round(a + (idx[-1] / 100 if idx else (b - a)) + 0.08, 3)
SCRIPT = [   # v3 대본(화면 자막 글자) — 낱말 시각은 받아쓰기와 글자 비율로 맞춤(align_words)
    'BMW M235i xDrive 그란쿠페',
    'LED 헤드램프가 기본입니다.',
    '18인치 휠, 안쪽은 블루 캘리퍼입니다.',
    'xDrive 사륜구동이 노면에 맞춰 앞뒤 힘을 나눕니다.',
    'B48 2.0 터보 엔진, 306마력.',
    '트렁크 430L, 뒷좌석을 접으면 더 넓어집니다.',
    '문을 열면 바닥에 웰컴 라이트.',
    '실내는 레드 마그마 시트.',
    '앰비언트 라이트가 분위기를 바꿉니다.',
    'M 버튼 한 번이면 스포츠 모드.',
    '라이브 콕핏 프로페셔널, 주행거리 16,665km.',
    '헤드업 디스플레이까지 옵션으로 들어갔습니다.',
    '8단 스텝트로닉, 제로백 4.9초.',
    '최대토크 45.9kg·m, 1,800rpm부터 나옵니다.',
    '서울오토갤러리, 문제현 딜러 매물입니다.',
]
WW = json.load(open(V + 'voice_a_words.json'))
IDX = [   # 대본 낱말 → 받아쓰기 낱말 번호(v3/voice_a_words.json, 1.1배 음성을 다시 받아쓴 것). 첫 낱말은 소리 시작으로 맞춤
    [0, 1, 2, 3], [5, 6, 7], [8, 9, 10, 11, 12], [13, 15, 17, 18, 19, 20, 21], [22, 23, 25, 26, 27],
    [28, 29, 30, 31, 32, 33], [34, 35, 36, 37, 38], [39, 40, 41, 42], [43, 44, 45, 46], [47, 47, 48, 49, 50, 51],
    [52, 53, 54, 55, 56], [58, 59, 60, 61], [62, 63, 64, 66], [68, 70, 72, 74], [75, 78, 79, 80]]
def align_words(i, a, b):
    sw = SCRIPT[i].split(); ix = IDX[i]; assert len(sw) == len(ix), (i, sw, ix)
    return [(w, WS[k]) for w, k in zip(sw, ix)]
TXT = None
PH = {}
for i, (a, s, b) in enumerate(PHR):
    PH[f'P{i}'] = (round(s - 0.03, 3), sound_end(s, b), [(w, max(t, s)) for w, t in align_words(i, a, b)])   # 받아쓰기가 앞 구절 꼬리에 붙인 시각은 구절 소리 시작으로
FULL = '화면 가득 근접 장면(부위가 화면 전체라 화살표 대상 없음)'

# ── 컷 목록: 구절 길이에 맞춰 비트 수를 정하고, 남는 비트는 빠른 컷으로 ──
def B(i): return BEATS[i]
plan = []
MONT = [10.8, 20.0, 26.0, 36.3, 44.8, 52.0, 55.6, 62.6, 67.2, 74.0, 81.6, 93.2, 97.8, 140.0, 147.2, 33.0]
mi = 0
for k in range(8):
    if k < 4: plan.append(('mont', B(k), B(k + 1), MONT[mi], 1.0, {})); mi += 1
    else:
        mid = (B(k) + B(k + 1)) / 2
        plan.append(('mont', B(k), mid, MONT[mi], 1.0, {})); mi += 1
        plan.append(('mont', mid, B(k + 1), MONT[mi], 1.0, {})); mi += 1
bi = 8
LEAD = {'hero': 0.35, 'slow': 0.25, 'feat': 0.12, 'dealer': 0.25}
def need(kind, ph):   # 구절이 컷 안에 들어가는 비트 수
    d = PH[ph][1] - PH[ph][0] + LEAD[kind] + 0.06; n = 1
    while B(bi + n) - B(bi) < d: n += 1
    return n
def add(kind, nb, src, sp=1.0, **o):
    global bi
    plan.append((kind, B(bi), B(bi + nb), src, sp, o)); bi += nb
def zone(feats, end_idx, fills):
    """feats: [(kind, src, sp, opts)] · 남는 비트는 fills 원본 목록으로 1비트 휙 컷(구간 사이에 고르게)"""
    global bi
    nbs = [need(k, o['ph']) if 'ph' in o else o.pop('nb') for k, s, sp, o in feats]
    spare = end_idx - bi - sum(nbs); assert spare >= 0, ('구간 비트 모자람', spare)
    gaps = len(feats); per = [spare // gaps + (1 if g < spare % gaps else 0) for g in range(gaps)]
    fi = 0
    for (k, s, sp, o), nb, gp in zip(feats, nbs, per):
        add(k, nb, s, sp, **o)
        for _ in range(gp): add('fill', 1, fills[fi % len(fills)][0], fills[fi % len(fills)][1], whip=True); fi += 1
BREAK = BEATS.index(min(BEATS, key=lambda b: abs(b - B_BREAK)))
DROP2 = BEATS.index(min(BEATS, key=lambda b: abs(b - B_DROP2)))
zone([('hero', None, 1.0, {'ph': 'P0'}),
      ('feat', *TOUCH['led'], {'ph': 'P1', 'chip': 'LED 헤드램프', 'tr': FULL, 'fx': 'led'}),
      ('feat', 19.3, 0.8, {'ph': 'P2', 'chip': '블루 캘리퍼', 'chipw': 3, 'tr': FULL, 'big': '18인치', 'bigw': 0, 'sub': ('225/40 R18', 1)}),
      ('feat', *TOUCH['xd'], {'ph': 'P3', 'chip': 'xDrive 사륜구동', 'fx': 'xd'}),
      ('feat', 33.0, 0.6, {'ph': 'P4', 'chip': '2.0 터보', 'chipw': 1, 'big': '306마력', 'bigw': 4, 'horse': True}),
      ('feat', *TOUCH['trunk'], {'ph': 'P5', 'chip': '트렁크', 'tr': FULL, 'big': '430L', 'bigw': 1, 'fx': 'trunk', 'sub': ('뒷좌석 폴딩', 2)}),
      ('feat', *TOUCH['wl'], {'ph': 'P6', 'chip': '웰컴 라이트', 'chipw': 3, 'fx': 'wl'})],
     BREAK, [(26.0, 1.6), (32.2, 1.4), (20.4, 1.5), (23.6, 1.2), (31.6, 1.4), (47.2, 1.2), (41.8, 1.3), (49.2, 1.2), (55.6, 1.3), (60.2, 1.0), (66.4, 1.4), (67.6, 1.4)])
nb = DROP2 - bi; n7 = need('slow', 'P7')
add('slow', n7, 71.6, 0.55, ph='P7', chip='레드 마그마 시트', chipw=1, tr=FULL, xfade=True)
add('slow', nb - n7, *TOUCH['amb'], ph='P8', chip='앰비언트 라이트', xfade=True, build=True, fx='amb')
for k, src, sp, o in [('feat', *TOUCH['mb'], {'ph': 'P9', 'chip': 'M 버튼', 'glitch': True, 'fx': 'mb'}),
                      ('feat', 97.2, 0.6, {'ph': 'P10', 'chip': '라이브 콕핏', 'tr': '화면 가득 계기판(부위가 화면 전체라 화살표 대상 없음)', 'big': '16,665km', 'bigw': 4}),
                      ('feat', 105.2, 0.8, {'ph': 'P11', 'chip': '헤드업 디스플레이', 'tr': FULL}),
                      ('feat', *TOUCH['gear'], {'ph': 'P12', 'chip': '8단 스텝트로닉', 'big': '4.9초', 'bigw': 3, 'fx': 'gear'}),
                      ('feat', *TOUCH['eng'], {'ph': 'P13', 'chip': '최대토크', 'big': '45.9kg·m', 'bigw': 1, 'fx': 'eng', 'sub': ('1,800rpm부터', 2)})]:
    add(k, need(k, o['ph']), src, sp, **o)
T_DEAL = B(bi); T_LOGO = round(T_DEAL + PH['P14'][1] - PH['P14'][0] + 0.55, 3); TOTAL = round(T_LOGO + R['end']['tail_s'], 3)
plan.append(('dealer', T_DEAL, T_LOGO, 25.6, 0.5, {'ph': 'P14'}))
plan.append(('logo', T_LOGO, TOTAL, None, 1.0, {}))
CUTS = [p[1] for p in plan[1:]]
print('길이', TOTAL, '컷', len(plan), '드롭1', B(8), '브레이크', B(BREAK), '드롭2', B(DROP2))
assert TOTAL < 60, TOTAL

VOFF = {}
for kind, t0, t1, src, sp, o in plan:
    if 'ph' in o:
        k = o['ph']; lead = max(0.04, min(LEAD[kind], t1 - 0.04 - (PH[k][1] - PH[k][0])))
        VOFF[k] = t0 + lead - PH[k][0]
        assert PH[k][1] + VOFF[k] < t1 + 0.05, (k, PH[k][1] + VOFF[k], t1)

if os.environ.get('DRY'):
    for p in plan: print(p[0], round(p[1], 2), round(p[2], 2), p[3], p[5].get('ph', ''))
    sys.exit()

def read_video(path, start, n):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(start), '-i', path, '-frames:v', str(n), '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, 1920, 1080, 3)
    if len(fr) < n: fr = np.concatenate([fr, np.repeat(fr[-1:], n - len(fr), 0)])
    return fr

def zoom(a, z, dx=0, dy=0):
    if abs(z - 1) < 1e-3 and dx == 0 and dy == 0: return a
    M_ = np.float32([[z, 0, (1 - z) * W / 2 + dx], [0, z, (1 - z) * H / 2 + dy]])
    return cv2.warpAffine(a, M_, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
def mblur(a, k):
    k = int(k) | 1
    return cv2.blur(a, (k, 1)) if k > 1 else a
def flash(a, al, col=(255, 255, 255)):
    if al <= 0: return a
    return (a.astype(np.float32) * (1 - al) + np.array(col, np.float32) * al).astype(np.uint8)
def rgbsplit(a, d):
    d = int(d)
    if d < 1: return a
    o = a.copy(); o[:, d:, 0] = a[:, :-d, 0]; o[:, :-d, 2] = a[:, d:, 2]; return o

# ── 글자 부품 ──
def chunks(words):   # 뜻 단위 자막 덩어리: 쉼표에서 끊고 최대 3낱말
    out, cur = [], []
    for i, (w, _) in enumerate(words):
        cur.append(i)
        if w.endswith(',') or w.endswith('.') or len(cur) == 3: out.append(cur); cur = []
    if cur: out.append(cur)
    return out
def cap_img(words, cur):
    f = XB(CAPPX); sp = int(CAPPX * 0.28)
    sizes = [f.getbbox(w) for w in words]; tw = sum(b[2] - b[0] for b in sizes) + sp * (len(words) - 1)
    im = Image.new('RGBA', (tw + 60, CAPPX * 2 + 40)); sh = Image.new('RGBA', im.size)
    x = 30; base = 20 + CAPPX
    for w, b in zip(words, sizes):
        ImageDraw.Draw(sh).text((x - b[0] + 3, base + 5), w, font=f, fill=(0, 0, 0, 230), anchor='ls', stroke_width=4, stroke_fill=(0, 0, 0, 230)); x += b[2] - b[0] + sp
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(5))); x = 30
    for i, (w, b) in enumerate(zip(words, sizes)):
        ImageDraw.Draw(im).text((x - b[0], base), w, font=f, fill=YEL if i == cur else (255, 255, 255), anchor='ls'); x += b[2] - b[0] + sp
    return im
CHIP_CACHE, BIG_CACHE, CAP_CACHE = {}, {}, {}
def chip_c(s):
    if s not in CHIP_CACHE: CHIP_CACHE[s] = chip(s)
    return CHIP_CACHE[s]
def count_label(lab, k):
    import re
    m = re.match(r'^([\d,]+)(\.\d+)?(.*)$', lab)
    if not m or k >= 1: return lab
    whole = int(m.group(1).replace(',', '')); dec = m.group(2) or ''
    v = whole + (float(dec) if dec else 0); cur = v * (1 - (1 - k) ** 3)
    s = f'{cur:.{len(dec) - 1}f}' if dec else (f'{int(cur):,}' if ',' in m.group(1) else str(int(cur)))
    return s + m.group(3)
def big_c(s):
    if s not in BIG_CACHE: BIG_CACHE[s] = text3d(s, 190)
    return BIG_CACHE[s]

# 블렌더 금속 말(three.js 예제 Horse.glb, MIT) — 24장 달리기 한 바퀴
HORSE = [Image.open(p).convert('RGBA') for p in sorted(glob.glob(G + 'horse/frames/*.png'))]
_hb = None
for im in HORSE:
    b = im.getbbox(); _hb = b if _hb is None else (min(_hb[0], b[0]), min(_hb[1], b[1]), max(_hb[2], b[2]), max(_hb[3], b[3]))
HORSE = [im.crop(_hb) for im in HORSE]; HS_ = 820 / HORSE[0].width
HORSE = [im.resize((int(im.width * HS_), int(im.height * HS_)), Image.LANCZOS) for im in HORSE]
def horse_layer(cv, u):   # u: 말 등장 뒤 초 · 오른쪽 밖에서 왼쪽 밖으로 1.9초 질주 + 금빛 잔상
    if u < 0 or u > 1.9: return
    im = HORSE[int(u * 30) % len(HORSE)]; x = int(W + 60 - (W + im.width + 120) * (u / 1.9)); y = 880 - im.height // 2 + int(14 * math.sin(u * 30 / 24 * 2 * math.pi))
    lay = Image.new('RGBA', (W, H))
    def put(img, xx, yy):
        sx = max(0, -xx); w_ = min(img.width - sx, W - max(0, xx))
        if w_ > 0: lay.alpha_composite(img.crop((sx, 0, sx + w_, img.height)), (max(0, xx), yy))
    for g, al in ((90, 0.16), (45, 0.3)):   # 뒤쪽(오른쪽)으로 옅은 잔상
        gi = im.copy(); gi.putalpha(Image.fromarray((np.array(im.getchannel('A')) * al).astype(np.uint8))); put(gi, x + g, y)
    glow = Image.new('RGBA', im.size, (255, 200, 60, 0)); glow.putalpha(im.getchannel('A').point(lambda v: int(v * 0.45)))
    sh = Image.new('RGBA', im.size); sh.paste((0, 0, 0, 150), (0, 0), im.getchannel('A'))
    put(sh.filter(ImageFilter.GaussianBlur(14)), x + 10, y + 22); put(glow.filter(ImageFilter.GaussianBlur(28)), x, y); put(im, x, y)
    cv.alpha_composite(lay)

DC = DealerCard(REPO + '/public/assets/dealer-profile/seoul-auto-gallery-formal-ai/450395-1.webp', D=420, band_w=720)
DN = white('문제현 대표', 88); DS1 = white('(주)뉴삼일모터스', 50); DS2 = white('서울오토갤러리 301호', 50)
LOGO = Image.open(REPO + '/public/assets/shortform/bobae_logo_600.png').convert('RGBA')

CHIPS, BIGS, FXLOG = [], [], []
TECH = {'beat_cut', 'intro_flash_montage', 'nasser_hero_3d_text', 'title_brand_chip', 'point_chip', 'big_number_3d', 'count_up',
        'zoom_punch', 'whip_pan', 'speed_ramp', 'slow_motion', 'stutter', 'rgb_split', 'camera_shake', 'white_flash', 'caption_chunks',
        'touch_outline_sam', 'blender_horse_3d', 'music_edit_break', 'dealer_profile_card', 'end_logo', 'bgm', 'sfx_rules', 'loudness_rule'}
def chip_xy(img): bb = img.getbbox(); return (W // 2 - (bb[0] + bb[2]) // 2, YB)
TIPS = {'led': (360, 1350), 'xd': (372, 1128), 'trunk': (540, 1500), 'wl': (560, 1300), 'amb': (300, 1120), 'mb': (570, 1350), 'gear': (420, 1250), 'eng': (600, 1380)}

proc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                         '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', G + 'nov2.mp4'], stdin=subprocess.PIPE)
last = None
NEXT_WHIP = {i: plan[i + 1][5].get('whip', False) if i + 1 < len(plan) else False for i in range(len(plan))}
for si, (kind, t0, t1, src, sp, o) in enumerate(plan):
    f0 = round(t0 * FPS); f1 = round(t1 * FPS); n = f1 - f0
    if kind == 'hero': frames = read_video(HERO_V, HERO_IN, n)
    elif kind == 'logo': frames = None
    else: frames = read_shot(src, sp, n)
    ph = o.get('ph'); words = PH[ph][2] if ph else []; CH_ = chunks(words) if words else []
    chip_t0 = big_t0 = sub_t0 = None
    if o.get('chip'):
        cw = words[o.get('chipw', 0)][1] + VOFF[ph]; chip_t0 = max(t0 + 0.05, cw + 0.03)
        ci = chip_c(o['chip']); cx, cy_ = chip_xy(ci); bb = ci.getbbox()
        CHIPS.append({'key': ph, 'label': o['chip'], 'kind': 'point', 't0': round(chip_t0, 3), 't1': round(t1, 3), 't_box': round(chip_t0 + 0.25, 3),
                      'px': R['chip']['font_px'], 'y': YB, 'box': [cx + bb[0], cy_ + bb[1], cx + bb[2], cy_ + bb[3]], **({'no_track_reason': o['tr']} if o.get('tr') else {})})
    if o.get('big'):
        big_t0 = words[o['bigw']][1] + VOFF[ph] + 0.02; BIGS.append({'key': ph, 'label': o['big'], 'kind': 'big', 't0': round(big_t0, 3), 't1': round(t1, 3)})
    if o.get('sub'):
        sub_t0 = words[o['sub'][1]][1] + VOFF[ph]; SUBI = white(o['sub'][0], 64)
    fx_start = None
    if o.get('fx'):
        D_ = np.load(G + f"pseg/{o['fx']}.npz"); fx_start = int(D_['start']); FXLOG.append({'key': o['fx'], 'label': o.get('chip'), 't0': round(t0 + fx_start / FPS, 3)})
    if kind == 'hero':
        HB = chip('BMW', R['chip']['title_font_px'], title=True); bb = HB.getbbox()
        CHIPS.append({'key': 'title', 'label': 'BMW', 'kind': 'title', 't0': round(t0 + 0.45, 3), 't1': round(t1, 3), 't_box': round(t0 + 0.75, 3),
                      'px': R['chip']['title_font_px'], 'y': YB + TDY, 'box': [M - 10 + bb[0], YB + TDY + bb[1], M - 10 + bb[2], YB + TDY + bb[3]], 'note': '첫 컷 제목 묶음만 인스타 위쪽 가림을 피해 아래로'})
    if kind == 'dealer': DEALER = {'label': '문제현 대표', 't0': round(t0 + 0.4, 3), 't1': round(t1, 3), 'photo': '450395-1.webp'}
    shake_t = [x for x in [big_t0] if x is not None] + ([t0] if (kind == 'hero' or o.get('glitch')) else [])
    for j in range(n):
        t = (f0 + j) / FPS; u = t - t0; un = u / max(1e-3, t1 - t0)
        if kind == 'logo':
            a = last.astype(np.float32) * (0.35 if u > 0.4 else 1 - 0.65 * u / 0.4); cv = Image.fromarray(a.astype(np.uint8)).convert('RGBA')
            k = min(1.0, u / 0.5); s = 0.55 + 0.45 * (1 - (1 - k) ** 3) + 0.05 * math.sin(k * math.pi)
            L = LOGO.resize((int(LOGO.width * s), int(LOGO.height * s)), Image.LANCZOS)
            if k < 1: L.putalpha(Image.fromarray((np.array(L.getchannel('A')) * min(1, k * 2)).astype(np.uint8)))
            cv.alpha_composite(L, (W // 2 - L.width // 2, H // 2 - L.height // 2 - 40))
            proc.stdin.write(cv.convert('RGB').tobytes()); continue
        jj = j
        if o.get('stutter'): q = max(2, n // 4); jj = j % q if j < 2 * q else j - q
        a = frames[min(jj, len(frames) - 1)]
        z = 1.0; dx = dy = 0
        if kind == 'mont': z = 1.18 - 0.18 * ease(min(1, u / 0.3))
        elif kind in ('feat', 'fill'): z = (1 + 0.12 * (1 - ease(min(1, u / 0.22)))) * (1 + 0.05 * un)
        elif kind == 'slow': z = 1.0 + 0.08 * un + (0.10 * ease((un - 0.75) / 0.25) if o.get('build') and un > 0.75 else 0)
        elif kind == 'dealer': z = 1.06 + 0.04 * un
        for st in shake_t:
            d = t - st
            if 0 <= d < 0.35: amp = 16 * (1 - d / 0.35); dx += random.uniform(-amp, amp); dy += random.uniform(-amp, amp)
        a = zoom(a, z, dx, dy)
        if NEXT_WHIP.get(si) and j >= n - 3: k = (j - (n - 4)) / 3; a = mblur(np.roll(a, int(-120 * k), axis=1), 18 + 70 * k)
        if o.get('whip') and j < 3: k = 1 - j / 3; a = mblur(np.roll(a, int(120 * k), axis=1), 18 + 70 * k)
        if kind == 'slow' and o.get('xfade') and j < 6 and last is not None:
            al = 1 - j / 6; a = (a.astype(np.float32) * (1 - al) + last.astype(np.float32) * al).astype(np.uint8)
        if kind == 'slow' and o.get('build') and un > 0.8: a = flash(a, (un - 0.8) / 0.2 * 0.35, (0, 0, 0))
        if o.get('glitch') and u < 0.18: a = rgbsplit(a, 18 * (1 - u / 0.18))
        if kind == 'dealer': a = flash(cv2.GaussianBlur(a, (0, 0), 9), 0.55, (0, 0, 0))
        if kind == 'mont': a = flash(a, 0.55 * max(0, 1 - u / 0.09))
        if o.get('glitch') and u < 0.12: a = flash(a, 0.85 * (1 - u / 0.12))
        if kind == 'mont' and si == 0 and u < 0.25: a = flash(a, 1 - u / 0.25, (0, 0, 0))
        last = a
        cv = Image.fromarray(a).convert('RGBA')
        if fx_start is not None and j >= fx_start:   # 손이 닿은 부위·트렁크 외곽선(손은 효과 앞)
            cv, _ = PFX.outline(cv, o['fx'], G, j - fx_start, W / 2 - dx / z, H / 2 - dy / z, z, TIPS[o['fx']])
        if o.get('horse') and big_t0 is not None: horse_layer(cv, t - big_t0 + 0.05)
        if chip_t0 is not None and t >= chip_t0: ci = chip_c(o['chip']); pop(cv, ci, chip_xy(ci), t, chip_t0)
        if big_t0 is not None and t >= big_t0:
            kk = min(1.0, (t - big_t0) / 0.5); lab = count_label(o['big'], kk)
            bimg = big_c(o['big']) if kk >= 1 else text3d(lab, 190); fin = big_c(o['big']); y = YB + 175
            pop(cv, bimg, (W // 2 - bimg.width // 2, y + (fin.height - bimg.height) // 2), t, big_t0, 0.18)
            if sub_t0 is not None and t >= sub_t0: pop(cv, SUBI, (W // 2 - SUBI.width // 2, y + fin.height + 18), t, sub_t0)
        if ph and kind not in ('hero', 'dealer') and (big_t0 is None or t < big_t0):
            vs, ve = PH[ph][0] + VOFF[ph], PH[ph][1] + VOFF[ph] + 0.2
            if max(vs, t0 + CUTGAP) <= t < min(ve, t1 - 0.02):
                cur = max([i for i, (w, wt) in enumerate(words) if wt + VOFF[ph] <= t] or [0])
                grp = next(g for g in CH_ if cur in g); key = (ph, cur)
                if key not in CAP_CACHE: CAP_CACHE[key] = cap_img([words[i][0] for i in grp], grp.index(cur))
                ci = CAP_CACHE[key]; cv.alpha_composite(ci, (W // 2 - ci.width // 2, CAPY - ci.height // 2))
        if kind == 'dealer':
            DC.draw(cv, W // 2, 720, u - 0.15); bx = DC.box(W // 2, 720)
            pop(cv, DN, (W // 2 - DN.width // 2, bx[3] + 30), u, 0.55)
            pop(cv, DS1, (W // 2 - DS1.width // 2, bx[3] + 30 + DN.height + 6), u, 0.75)
            pop(cv, DS2, (W // 2 - DS2.width // 2, bx[3] + 30 + DN.height + DS1.height + 10), u, 0.85)
        proc.stdin.write(cv.convert('RGB').tobytes())
    print(f'{si:02d} {kind:6s} {t0:6.2f}-{t1:6.2f} src {src} x{sp} {o.get("fx", "")}', flush=True)
proc.stdin.close(); proc.wait()

# ── 효과음 ──
SX = R['sfx']; VOL = SX['volume']
hero_i = [p[0] for p in plan].index('hero')
cand = [(0.02, 'whoosh', 'part_change'), (B(8), 'impact', 'emphasis'), (B(8) + 0.45, 'ding', 'title'), (B(DROP2), 'impact', 'emphasis'),
        (plan[hero_i + 1][1], 'whoosh', 'part_change')]
for b in BIGS:
    nm = 'horse_neigh_el' if '마력' in b['label'] else ('stopwatch' if b['key'] == 'P12' else 'ding')
    cand.append((b['t0'] - (0.05 if nm == 'horse_neigh_el' else 0.0), nm, 'metaphor' if nm != 'ding' else 'big_number'))
for c in CHIPS:
    if c['kind'] == 'point' and c['label'] in ('LED 헤드램프', '웰컴 라이트', '앰비언트 라이트', '헤드업 디스플레이'): cand.append((c['t0'], 'ding', 'chip'))
MV = {'horse_neigh_el': 0.5, 'stopwatch': 0.6}
cap_n = int(SX['max_per_30s'] * TOTAL / 30); acc = []
for t, nm, why in sorted(cand, key=lambda x: SX['priority'].index(x[2]) if x[2] in SX['priority'] else 9):
    if t > TOTAL - R['end']['tail_s']: continue
    if any(abs(t - a[0]) < SX['min_gap_s'] for a in acc): continue
    if any(a[1] == nm and abs(t - a[0]) < SX['same_sound_min_gap_s'] for a in acc): continue
    if len(acc) >= cap_n: break
    acc.append((round(t, 3), nm, MV.get(nm, VOL.get(nm, 0.5))))
acc.sort(); print('효과음', len(acc), acc)

# ── 소리 ──
sr = 48000
v = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', V + 'voice_a.mp3', '-f', 's16le', '-ac', '1', '-ar', str(sr), '-'], capture_output=True).stdout, np.int16).astype(np.float32)
vo = np.zeros(int(TOTAL * sr) + sr, np.float32)
for k, (s0, s1, _) in PH.items():
    seg = v[int(s0 * sr):int(s1 * sr)].copy(); fd = int(0.015 * sr); seg[:fd] *= np.linspace(0, 1, fd); seg[-fd:] *= np.linspace(1, 0, fd)
    p = int((s0 + VOFF[k]) * sr); vo[p:p + len(seg)] += seg
with wave.open(G + 'voice_placed_v2.wav', 'wb') as wf:
    wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr); wf.writeframes(np.clip(vo, -32768, 32767).astype(np.int16).tobytes())
WORDS = sorted([[w, round(wt + VOFF[k], 3), round(wt + VOFF[k] + 0.3, 3)] for k, (s0, s1, wl) in PH.items() for w, wt in wl], key=lambda x: x[1])
json.dump(WORDS, open(G + 'voice_placed_v2_words.json', 'w'), ensure_ascii=False)
# 음악: 브레이크 가운데 CUT_A~CUT_B를 덜어내고 0.25초 겹쳐 잇기
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', G + 'music.mp3', '-filter_complex',
                f'[0:a]atrim={MOFF}:{MOFF + CUT_A + 0.25},asetpts=PTS-STARTPTS[a];[0:a]atrim={MOFF + CUT_B}:{MOFF + CUT_B + 40},asetpts=PTS-STARTPTS[b];[a][b]acrossfade=d=0.25:c1=tri:c2=tri[o]',
                '-map', '[o]', G + 'music_v2.wav'], check=True)
inp = ['-i', G + 'nov2.mp4', '-i', G + 'voice_placed_v2.wav', '-i', G + 'music_v2.wav']
fl = [f'[1:a]highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=8:release=120,volume=1.35,apad=whole_dur={TOTAL},asplit=2[v][vk]',
      f'[2:a]atrim=0:{TOTAL},volume=0.55,afade=t=out:st={T_LOGO - 0.2}:d=2.2[bg0]',
      '[bg0][vk]sidechaincompress=threshold=0.05:ratio=4:attack=20:release=300:makeup=1[b]']
mx = ['[v]', '[b]']
for j, (tc, nm, vv) in enumerate(acc):
    inp += ['-i', A + 'sfx/' + nm + '.wav']; fl.append(f'[{3 + j}:a]volume={vv},adelay={int(tc * 1000)}:all=1[s{j}]'); mx.append(f'[s{j}]')
A_ = R['audio']; LN = f"loudnorm=I={A_['loudness_lufs']}:TP={A_['true_peak_db']}:LRA=11"
_m = subprocess.run(['ffmpeg', '-hide_banner', *inp, '-filter_complex', ';'.join(fl + [''.join(mx) + f'amix=inputs={len(mx)}:normalize=0:duration=longest,{LN}:print_format=json[a]']),
                     '-map', '[a]', '-t', str(TOTAL), '-f', 'null', '-'], capture_output=True, text=True).stderr
_j = json.loads(_m[_m.rindex('{'):_m.rindex('}') + 1])
LN2 = LN + f":measured_I={_j['input_i']}:measured_TP={_j['input_tp']}:measured_LRA={_j['input_lra']}:measured_thresh={_j['input_thresh']}:offset={_j['target_offset']}:linear=true"
fl.append(''.join(mx) + f"amix=inputs={len(mx)}:normalize=0:duration=longest,{LN2},aresample=48000[a]")
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *inp, '-filter_complex', ';'.join(fl), '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', str(TOTAL), OUT], check=True)
json.dump({'words': G + 'voice_placed_v2_words.json', 'bigs': BIGS, 'edition': 'feature_video', 'edition_code': 'ED-SIMPLE', 'style': 'beat_edit',
           'renderer': 'm235_beat_v3.py (g350_v5_lib)', 'voice': 'voice_placed_v2.wav', 'frame': [W, H], 'techniques': sorted(TECH), 'music': True,
           'music_credit': 'Hardstyle night (Original mix) — DJane Nickie Anne (Jamendo), CC BY 3.0', 'music_edit': {'cut_s': [CUT_A, CUT_B]},
           'horse_model': 'three.js examples/models/gltf/Horse.glb (MIT), Blender Cycles 금속 재질', 'spec_source': 'ADAC Autokatalog 315767 (M235i Gran Coupé xDrive Steptronic 09/20-03/24)',
           'total': TOTAL, 'cuts': [round(c, 3) for c in CUTS], 'touch_fx': FXLOG, 'dealer_card': DEALER,
           'sfx': [{'t': a[0], 'kind': a[1], 'sound': a[1]} for a in acc], 'chips': CHIPS, 'caption': {'center_y_px': CAPY, 'font_px': CAPPX}},
          open(OUT + '.plan.json', 'w'), ensure_ascii=False, indent=1)
print('완료', OUT, TOTAL)
