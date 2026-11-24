# 2021 BMW M235i xDrive 그란쿠페(F44) — 문제현 대표(서울오토갤러리 301호, (주)뉴삼일모터스) 매물 영상
# 빠른 비트 편집: 하드스타일 빌드(플래시 몽타주) → 드롭(나세르 히어로 + 3D M235i) → 비트 컷 + 칩·3D 숫자 → 브레이크(슬로) → 드롭2 → 딜러 카드 → 끝 로고
# 실촬영 영상 그대로(자르기·확대·이동·흐림만). 값은 be_locked_rules.json(g350_v5_lib)에서.
import os, sys, json, math, random, subprocess
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter
REPO = '/home/claude/rr'
sys.path.insert(0, REPO + '/scripts/shortform/video_listing'); sys.path.insert(0, REPO + '/scripts/shortform/video_listing/roma_rave')
from g350_v5_lib import *
from dealer_card import DealerCard

G = '/home/claude/shorts/m235/'; SRC = G + 'src.mp4'
OUT = G + 'bobae_beat_m235i.mp4'
MOFF = 50.55                                   # 음악 시작점(드롭이 영상 5.155초)
BEATS = [b - MOFF for b in json.load(open(G + 'beats.json'))['beats'] if b >= MOFF - 0.05]
BEATS[0] = 0.0
HERO_V = G + 'nas/hero_v.mp4'; HERO_IN = 0.3   # nasser 인트로(몽타주 0.3초 뒤가 히어로)
CAPY = R['caption']['center_y_px']; CAPPX = R['caption']['font_px']; CUTGAP = R['caption']['cut_gap_s']
CY0 = (2336 - 1920) // 2
random.seed(7)

# ── 음성: 구절(목소리 파일 시각) · 칩 · 큰 숫자 · 자막 낱말(받아쓰기 시각, 글자는 대본) ──
VW = json.load(open(G + 'voice_a_words.json'))
ws = lambda i: VW[i][0]
PH = {   # 키: (시작, 끝, [(대본 낱말, 시각)])
    'P0': (0.0, 2.36, [('BMW', ws(0)), ('M235i', ws(1)), ('그란쿠페', ws(2))]),
    'P1': (2.40, 3.95, [('LED', ws(3)), ('헤드램프', ws(4))]),
    'P2': (4.12, 5.10, [('블루', ws(5)), ('캘리퍼', ws(6))]),
    'P3': (5.42, 7.25, [('xDrive', ws(7)), ('사륜구동', ws(8))]),
    'P4': (7.55, 9.62, [('306마력,', ws(9)), ('2.0', ws(10)), ('터보', ws(11))]),
    'P5': (9.95, 11.42, [('트렁크', ws(12)), ('430L', ws(13))]),
    'P6': (11.75, 12.75, [('웰컴', ws(14)), ('라이트', ws(15))]),
    'P7': (13.20, 13.92, [('레드', ws(16)), ('시트', ws(16) + 0.24)]),
    'P8': (14.22, 15.22, [('앰비언트', ws(17)), ('라이트', ws(18))]),
    'P9': (15.74, 16.46, [('M', ws(19)), ('버튼', ws(19) + 0.18)]),
    'P10': (16.70, 19.22, [('주행거리', ws(20)), ('16,665km', ws(21))]),
    'P11': (19.74, 21.05, [('헤드업', ws(23)), ('디스플레이', ws(24))]),
    'P12': (21.05, 22.52, [('제로백', 21.10), ('4.9초', ws(26))]),
    'P13': (22.82, 25.06, [('최대토크', ws(27)), ('45.9kg·m', ws(29))]),
    'P14': (25.76, 28.62, [('서울오토갤러리,', ws(31)), ('문제현', ws(34)), ('대표', ws(35)), ('매물입니다.', ws(36))]),
}
FULL = '화면 가득 근접 장면(부위가 화면 전체라 화살표 대상 없음)'

# ── 컷 목록: (종류, 비트 수, 원본 초, 속도, 옵션) ──
#   종류: mont(몽타주) · hero · feat(칩+음성) · fill(빠른 컷) · slow(브레이크) · dealer · logo
def B(i): return BEATS[i]
plan = []
# 빌드 0~드롭: 비트마다 한 컷, 마지막 4비트는 반 비트 컷
MONT = [10.8, 20.0, 26.0, 36.3, 44.8, 52.0, 55.6, 62.6, 67.2, 74.0, 81.6, 93.2, 97.8, 140.0, 147.2, 33.0]
mi = 0
for k in range(12):
    if k < 8:
        plan.append(('mont', B(k), B(k + 1), MONT[mi], 1.0, {})); mi += 1
    else:
        mid = (B(k) + B(k + 1)) / 2
        plan.append(('mont', B(k), mid, MONT[mi], 1.0, {})); mi += 1
        plan.append(('mont', mid, B(k + 1), MONT[mi], 1.0, {})); mi += 1
bi = 12   # 드롭1
def add(kind, nb, src, sp=1.0, **o):
    global bi
    plan.append((kind, B(bi), B(bi + nb), src, sp, o)); bi += nb
def fill(*items):   # (비트 수, 원본 초, 속도)
    for nb, src, sp in items: add('fill', nb, src, sp, whip=True)
add('hero', 8, None, 1.0, ph='P0')
fill((1, 26.0, 1.6), (1, 32.2, 1.4), (2, 34.2, 1.0))
add('feat', 6, 12.4, 0.8, ph='P1', chip='LED 헤드램프', tr=FULL)
fill((1, 20.4, 1.5), (1, 23.6, 1.2))
add('feat', 6, 19.3, 0.8, ph='P2', chip='블루 캘리퍼', tr=FULL)
fill((1, 31.6, 1.4), (1, 47.2, 1.2))
add('feat', 6, 36.1, 0.7, ph='P3', chip='xDrive 사륜구동')
fill((1, 41.8, 1.3), (1, 44.6, 1.0))
add('feat', 8, 34.0, 0.6, ph='P4', chip='2.0 터보', chipw=1, big='306마력', bigw=0)
fill((1, 49.2, 1.2), (1, 52.6, 1.0))
add('feat', 6, 50.6, 0.8, ph='P5', chip='트렁크', tr=FULL, big='430L', bigw=1)
fill((1, 55.6, 1.3), (1, 60.2, 1.0))
add('feat', 6, 62.2, 0.8, ph='P6', chip='웰컴 라이트')
BREAK = BEATS.index(min(BEATS, key=lambda b: abs(b - 32.461)))
rest = BREAK - bi
for j in range(rest):   # 남은 비트: 스터터 컷으로 브레이크까지 몰아감
    add('fill', 1, [66.4, 67.6, 70.6][j % 3], 1.4, whip=False, stutter=True)
DROP2 = BEATS.index(min(BEATS, key=lambda b: abs(b - 39.427)))
nb_b = DROP2 - bi; half = nb_b // 2
add('slow', half, 71.6, 0.55, ph='P7', chip='레드 시트', tr=FULL, xfade=True)
add('slow', nb_b - half, 80.8, 0.55, ph='P8', chip='앰비언트 라이트', xfade=True, build=True)
add('feat', 4, 92.4, 0.8, ph='P9', chip='M 버튼', glitch=True)
add('feat', 7, 97.2, 0.6, ph='P10', chip='주행거리', big='16,665km', bigw=1)
add('feat', 4, 105.2, 0.8, ph='P11', chip='헤드업 디스플레이', tr=FULL)
fill((1, 114.6, 1.3), (1, 141.6, 1.0))
add('feat', 6, 139.2, 0.7, ph='P12', chip='제로백', big='4.9초', bigw=1)
add('feat', 6, 146.4, 0.7, ph='P13', chip='최대토크', big='45.9kg·m', bigw=1)
add('fill', 3, 13.0, 0.6, whip=False, outro=True)
T_DEAL = B(bi); T_LOGO = T_DEAL + 3.5; TOTAL = round(T_LOGO + R['end']['tail_s'], 3)
plan.append(('dealer', T_DEAL, T_LOGO, 25.6, 0.5, {'ph': 'P14'}))
plan.append(('logo', T_LOGO, TOTAL, None, 1.0, {}))
CUTS = [p[1] for p in plan[1:]]
print('길이', TOTAL, '컷', len(plan), '드롭1', B(12), '브레이크', B(BREAK), '드롭2', B(DROP2))

# 음성 구절 배치(화면 시각): 컷 시작 + 0.15(히어로는 +0.35, 딜러 +0.25)
VOFF = {}
for kind, t0, t1, src, sp, o in plan:
    if 'ph' in o:
        k = o['ph']; lead = {'hero': 0.35, 'dealer': 0.25, 'slow': 0.3}.get(kind, 0.15)
        lead = max(0.04, min(lead, t1 - 0.04 - (PH[k][1] - PH[k][0])))
        VOFF[k] = t0 + lead - PH[k][0]
        assert PH[k][1] + VOFF[k] < t1 + 0.05, (k, PH[k][1] + VOFF[k], t1)

# ── 원본 영상 읽기 ──
def read_shot(src, sp, n, cy=CY0):
    vf = f'setpts=(PTS-STARTPTS)/{sp}'
    if sp < 0.95: vf += ',minterpolate=fps=30:mi_mode=blend'
    vf += f',fps=30,crop=1080:1920:0:{cy}'
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(src), '-i', SRC, '-vf', vf, '-frames:v', str(n), '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, 1920, 1080, 3)
    if len(fr) < n: fr = np.concatenate([fr, np.repeat(fr[-1:], n - len(fr), 0)])
    return fr

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
def cap_img(words, cur):
    f = XB(CAPPX); sp = int(CAPPX * 0.28)
    sizes = [f.getbbox(w) for w in words]; tw = sum(b[2] - b[0] for b in sizes) + sp * (len(words) - 1)
    im = Image.new('RGBA', (tw + 60, CAPPX * 2 + 40)); sh = Image.new('RGBA', im.size)
    x = 30; base = 20 + CAPPX
    for i, (w, b) in enumerate(zip(words, sizes)):
        ImageDraw.Draw(sh).text((x - b[0] + 3, base + 5), w, font=f, fill=(0, 0, 0, 230), anchor='ls', stroke_width=4, stroke_fill=(0, 0, 0, 230))
        x += b[2] - b[0] + sp
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(5))); x = 30
    for i, (w, b) in enumerate(zip(words, sizes)):
        ImageDraw.Draw(im).text((x - b[0], base), w, font=f, fill=YEL if i == cur else (255, 255, 255), anchor='ls')
        x += b[2] - b[0] + sp
    return im

CHIP_CACHE, BIG_CACHE, CAP_CACHE = {}, {}, {}
def chip_c(s):
    if s not in CHIP_CACHE: CHIP_CACHE[s] = chip(s)
    return CHIP_CACHE[s]

def count_label(lab, k):   # 숫자 카운트업(마지막은 원래 글자)
    import re
    m = re.match(r'^([\d,]+)(\.\d+)?(.*)$', lab)
    if not m or k >= 1: return lab
    whole = int(m.group(1).replace(',', '')); dec = m.group(2) or ''
    v = whole + (float(dec) if dec else 0)
    cur = v * (1 - (1 - k) ** 3)
    if dec: s = f'{cur:.{len(dec) - 1}f}'
    else: s = f'{int(cur):,}' if ',' in m.group(1) else str(int(cur))
    return s + m.group(3)

def big_c(s):
    if s not in BIG_CACHE: BIG_CACHE[s] = text3d(s, 190)
    return BIG_CACHE[s]

# ── 딜러 카드 · 끝 로고 ──
DC = DealerCard(REPO + '/public/assets/dealer-profile/seoul-auto-gallery-formal-ai/450395-1.webp', D=420, band_w=720)
DN = white('문제현 대표', 88); DS1 = white('(주)뉴삼일모터스', 50); DS2 = white('서울오토갤러리 301호', 50)
LOGO = Image.open(REPO + '/public/assets/shortform/bobae_logo_600.png').convert('RGBA')

# ── 기록(plan.json) ──
CHIPS, BIGS, SFX = [], [], []
TECH = {'beat_cut', 'intro_flash_montage', 'nasser_hero_3d_text', 'title_brand_chip', 'point_chip', 'big_number_3d', 'count_up',
        'zoom_punch', 'whip_pan', 'speed_ramp', 'slow_motion', 'stutter', 'rgb_split', 'camera_shake', 'white_flash', 'caption_chunks',
        'dealer_profile_card', 'end_logo', 'bgm', 'sfx_rules', 'loudness_rule'}

def chip_xy(img): bb = img.getbbox(); return (W // 2 - (bb[0] + bb[2]) // 2, YB)

# ── 렌더 ──
proc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                         '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', G + 'nov.mp4'], stdin=subprocess.PIPE)
fidx = 0; last = None
NEXT_WHIP = {i: plan[i + 1][5].get('whip', False) if i + 1 < len(plan) else False for i in range(len(plan))}
for si, (kind, t0, t1, src, sp, o) in enumerate(plan):
    f0 = round(t0 * FPS); f1 = round(t1 * FPS); n = f1 - f0
    if kind == 'hero': frames = read_video(HERO_V, HERO_IN, n)
    elif kind == 'logo': frames = None
    else: frames = read_shot(src, sp, n, CY0 - o.get('cy', 0) if o.get('cy') else CY0)
    ph = o.get('ph'); words = PH[ph][2] if ph else []
    # 칩·숫자 시각
    chip_t0 = big_t0 = None
    if o.get('chip'):
        cw = words[o.get('chipw', 0)][1] + VOFF[ph]; chip_t0 = max(t0 + 0.05, cw + 0.03)
        ci = chip_c(o['chip']); cx, cy_ = chip_xy(ci); bb = ci.getbbox()
        CHIPS.append({'key': ph, 'label': o['chip'], 'kind': 'point', 't0': round(chip_t0, 3), 't1': round(t1, 3), 't_box': round(chip_t0 + 0.25, 3),
                      'px': R['chip']['font_px'], 'y': YB, 'box': [cx + bb[0], cy_ + bb[1], cx + bb[2], cy_ + bb[3]], **({'no_track_reason': o['tr']} if o.get('tr') else {})})
    if o.get('big'):
        big_t0 = words[o['bigw']][1] + VOFF[ph] + 0.02
        bimg = big_c(o['big']); BIGS.append({'key': ph, 'label': o['big'], 'kind': 'big', 't0': round(big_t0, 3), 't1': round(t1, 3)})
    if kind == 'hero':
        HB = chip(BRAND := 'BMW', R['chip']['title_font_px'], title=True); bb = HB.getbbox()
        CHIPS.append({'key': 'title', 'label': 'BMW', 'kind': 'title', 't0': round(t0 + 0.45, 3), 't1': round(t1, 3), 't_box': round(t0 + 0.75, 3),
                      'px': R['chip']['title_font_px'], 'y': YB, 'box': [M - 10 + bb[0], YB + bb[1], M - 10 + bb[2], YB + bb[3]]})
    if kind == 'dealer':
        DEALER = {'label': '문제현 대표', 't0': round(t0 + 0.4, 3), 't1': round(t1, 3), 'photo': '450395-1.webp'}   # 칩이 아니라 딜러 카드(위쪽 칩 줄 검사 대상 아님)
    shake_t = [x for x in [big_t0] if x is not None] + ([t0] if (kind == 'hero' or o.get('glitch')) else [])
    for j in range(n):
        t = (f0 + j) / FPS; u = (t - t0); un = u / max(1e-3, t1 - t0)
        if kind == 'logo':
            a = last.astype(np.float32) * (0.35 if u > 0.4 else 1 - 0.65 * u / 0.4); cv = Image.fromarray(a.astype(np.uint8)).convert('RGBA')
            k = min(1.0, u / 0.5); s = 0.55 + 0.45 * (1 - (1 - k) ** 3) + 0.05 * math.sin(k * math.pi)
            L = LOGO.resize((int(LOGO.width * s), int(LOGO.height * s)), Image.LANCZOS)
            if k < 1: L.putalpha(Image.fromarray((np.array(L.getchannel('A')) * min(1, k * 2)).astype(np.uint8)))
            cv.alpha_composite(L, (W // 2 - L.width // 2, H // 2 - L.height // 2 - 40))
            proc.stdin.write(cv.convert('RGB').tobytes()); fidx += 1; continue
        jj = j
        if o.get('stutter'):   # 반 비트 조각을 한 번 되풀이
            q = max(2, n // 4); jj = j % q if j < 2 * q else j - q
        a = frames[min(jj, len(frames) - 1)]
        # 확대: 시작 펀치 + 천천히 밀기
        z = 1.0; dx = dy = 0
        if kind == 'mont': z = 1.18 - 0.18 * ease(min(1, u / 0.3))
        elif kind in ('feat', 'fill'): z = (1 + 0.12 * (1 - ease(min(1, u / 0.22)))) * (1 + 0.05 * un)
        elif kind == 'slow': z = 1.0 + 0.08 * un + (0.10 * ease((un - 0.75) / 0.25) if o.get('build') and un > 0.75 else 0)
        elif kind == 'dealer': z = 1.06 + 0.04 * un
        for st in shake_t:
            d = t - st
            if 0 <= d < 0.35: amp = 16 * (1 - d / 0.35); dx += random.uniform(-amp, amp); dy += random.uniform(-amp, amp)
        a = zoom(a, z, dx, dy)
        # 휙(다음 컷과 이어지는 휙 전환): 컷 끝 3프레임 · 시작 3프레임 가로 흐림 + 밀기
        if NEXT_WHIP.get(si) and j >= n - 3:
            k = (j - (n - 4)) / 3; a = mblur(np.roll(a, int(-120 * k), axis=1), 18 + 70 * k)
        if o.get('whip') and j < 3:
            k = 1 - j / 3; a = mblur(np.roll(a, int(120 * k), axis=1), 18 + 70 * k)
        if kind == 'slow' and o.get('xfade') and j < 6 and last is not None:   # 브레이크는 부드럽게 겹침
            al = 1 - j / 6; a = (a.astype(np.float32) * (1 - al) + last.astype(np.float32) * al).astype(np.uint8)
        if kind == 'slow' and o.get('build') and un > 0.8: a = flash(a, (un - 0.8) / 0.2 * 0.35, (0, 0, 0))
        if o.get('glitch') and u < 0.18: a = rgbsplit(a, 18 * (1 - u / 0.18))
        if kind == 'dealer':
            a = cv2.GaussianBlur(a, (0, 0), 9); a = flash(a, 0.55, (0, 0, 0))
        # 섬광: 몽타주 컷마다 · 드롭 · 드롭2
        if kind == 'mont': a = flash(a, 0.55 * max(0, 1 - u / 0.09))
        if (kind == 'hero' and False) or (o.get('glitch') and u < 0.12): a = flash(a, 0.85 * (1 - u / 0.12))
        if kind == 'mont' and si == 0 and u < 0.25: a = flash(a, 1 - u / 0.25, (0, 0, 0))
        last = a
        cv = Image.fromarray(a).convert('RGBA')
        # 칩
        if chip_t0 is not None and t >= chip_t0:
            ci = chip_c(o['chip']); pop(cv, ci, chip_xy(ci), t, chip_t0)
        # 큰 숫자(카운트업 0.5초)
        if big_t0 is not None and t >= big_t0:
            kk = min(1.0, (t - big_t0) / 0.5); lab = count_label(o['big'], kk)
            bimg = big_c(o['big']) if kk >= 1 else text3d(lab, 190)
            fin = big_c(o['big']); y = YB + 175
            pop(cv, bimg, (W // 2 - bimg.width // 2, y + (fin.height - bimg.height) // 2), t, big_t0, 0.18)
        # 말 자막(숫자 동안 숨김 · 컷 뒤 0.3초 비움)
        if ph and kind not in ('hero', 'dealer') and (big_t0 is None or t < big_t0):
            vs, ve = PH[ph][0] + VOFF[ph], PH[ph][1] + VOFF[ph] + 0.2
            if max(vs, t0 + CUTGAP) <= t < min(ve, t1 - 0.02):
                cur = max([i for i, (w, wt) in enumerate(words) if wt + VOFF[ph] <= t] or [0])
                key = (ph, cur)
                if key not in CAP_CACHE: CAP_CACHE[key] = cap_img([w for w, _ in words], cur)
                ci = CAP_CACHE[key]; cv.alpha_composite(ci, (W // 2 - ci.width // 2, CAPY - ci.height // 2))
        if kind == 'dealer':
            DC.draw(cv, W // 2, 720, u - 0.15)
            bx = DC.box(W // 2, 720)
            pop(cv, DN, (W // 2 - DN.width // 2, bx[3] + 30), u, 0.55)
            pop(cv, DS1, (W // 2 - DS1.width // 2, bx[3] + 30 + DN.height + 6), u, 0.75)
            pop(cv, DS2, (W // 2 - DS2.width // 2, bx[3] + 30 + DN.height + DS1.height + 10), u, 0.85)
        proc.stdin.write(cv.convert('RGB').tobytes()); fidx += 1
    print(f'{si:02d} {kind:6s} {t0:6.2f}-{t1:6.2f} src {src} x{sp}', flush=True)
proc.stdin.close(); proc.wait()

# ── 효과음(be_locked_rules.json sfx) ──
SX = R['sfx']; VOL = SX['volume']
cand = [(0.02, 'whoosh', 'part_change'), (B(12), 'impact', 'emphasis'), (B(12) + 0.45, 'ding', 'title'), (B(DROP2), 'impact', 'emphasis')]
cand.append((plan[[p[0] for p in plan].index('hero') + 1][1], 'whoosh', 'part_change'))
for b in BIGS:
    nm = 'horse_neigh_el' if '마력' in b['label'] else ('stopwatch' if '초' in b['label'] and b['key'] == 'P12' else 'ding')
    cand.append((b['t0'] - (0.05 if nm == 'horse_neigh_el' else 0.0), nm, 'big_number'))
for c in CHIPS:
    if c['kind'] == 'point' and c['label'] in ('LED 헤드램프', '웰컴 라이트', '앰비언트 라이트', '헤드업 디스플레이'):
        cand.append((c['t0'], 'ding', 'chip'))
MV = {'horse_neigh_el': 0.5, 'stopwatch': 0.6}
cap_n = int(SX['max_per_30s'] * TOTAL / 30); acc = []
for t, nm, why in sorted(cand, key=lambda x: SX['priority'].index(x[2]) if x[2] in SX['priority'] else 9):
    if t > TOTAL - R['end']['tail_s']: continue
    if any(abs(t - a[0]) < SX['min_gap_s'] for a in acc): continue
    if any(a[1] == nm and abs(t - a[0]) < SX['same_sound_min_gap_s'] for a in acc): continue
    if len(acc) >= cap_n: break
    acc.append((round(t, 3), nm, MV.get(nm, VOL.get(nm, 0.5))))
acc.sort(); print('효과음', len(acc), acc)

# ── 소리: 배치한 목소리 + 하드스타일 + 효과음 → −14 LUFS 2단 ──
sr = 48000
v = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', G + 'voice_a.mp3', '-f', 's16le', '-ac', '1', '-ar', str(sr), '-'], capture_output=True).stdout, np.int16).astype(np.float32)
vo = np.zeros(int(TOTAL * sr) + sr, np.float32)
for k, (s0, s1, _) in PH.items():
    seg = v[int(s0 * sr):int(s1 * sr)].copy(); fd = int(0.012 * sr); seg[:fd] *= np.linspace(0, 1, fd); seg[-fd:] *= np.linspace(1, 0, fd)
    p = int((s0 + VOFF[k]) * sr); vo[p:p + len(seg)] += seg
import wave
with wave.open(G + 'voice_placed.wav', 'wb') as wf:
    wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr); wf.writeframes(np.clip(vo, -32768, 32767).astype(np.int16).tobytes())
WORDS = []
for k, (s0, s1, wl) in PH.items():
    for w, wt in wl: WORDS.append([w, round(wt + VOFF[k], 3), round(wt + VOFF[k] + 0.3, 3)])
json.dump(sorted(WORDS, key=lambda x: x[1]), open(G + 'voice_placed_words.json', 'w'), ensure_ascii=False)
inp = ['-i', G + 'nov.mp4', '-i', G + 'voice_placed.wav', '-ss', str(MOFF), '-i', G + 'music.mp3']
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
json.dump({'words': G + 'voice_placed_words.json', 'bigs': BIGS, 'edition': 'feature_video', 'edition_code': 'ED-SIMPLE', 'style': 'beat_edit',
           'renderer': 'm235_beat.py (g350_v5_lib)', 'voice': 'voice_placed.wav', 'frame': [W, H], 'techniques': sorted(TECH), 'music': True,
           'music_credit': 'Hardstyle night (Original mix) — DJane Nickie Anne (Jamendo), CC BY 3.0', 'total': TOTAL, 'cuts': [round(c, 3) for c in CUTS],
           'dealer_card': DEALER, 'sfx': [{'t': a[0], 'kind': a[1], 'sound': a[1]} for a in acc], 'chips': CHIPS,
           'caption': {'center_y_px': CAPY, 'font_px': CAPPX}}, open(OUT + '.plan.json', 'w'), ensure_ascii=False, indent=1)
print('완료', OUT, TOTAL)
