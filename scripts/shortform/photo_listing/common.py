"""보배드림 사진 매물 → 벨기에판(bobae_be) 세로 숏폼 렌더러 — 파이프라인 v1.4 (2026-11-17)

v1.4: 렌더 전 매뉴얼 점검(check_cfg.py, 걸리면 멈춤) · 한 덩어리로 들린 말을 나눈 자막은 노랑을 글자 비율로 차례로 · 독립 컷 단계 공개 — 넘김 'reveal'(0.18초, 확대 없음) · 9:16 미리 만든 카드는 상자 맞춤 없이 그대로 · CAP_CY_PHOTOS(카드 컷 자막 위치) · reveal마다 팝 (카드 만들기: report_cut.py)
내레이션 · 사진 켄번스 · 페이드/동적 넘김 · 노랑 붓띠 칩 · 말 자막 · 배경음(덕킹) · 효과음(SFX_RICH) · 딜러 칩 · 끝 로고
v1.3: 딜러 칩 독일식 두 줄 둥근 상자(DEALER_CHIP_STYLE='de') 추가 · 붓칠 칩 벨기에 비율(칠 높이 2.8배·여백 0.2배)과 글자 잘림 방지
v1.2: 낱말 시작 에너지 골짜기 맞춤 · 페이드 창(FW) · 가로 사진 아래 자막 · SFX_RICH · 노션 원본 칠 딜러 칩
"""
PIPELINE_VERSION = '1.4'
import json, os, subprocess, sys, wave
import numpy as np
import cv2
from PIL import Image, ImageFilter, ImageDraw, ImageFont
import math

SC = os.path.abspath(sys.argv[1])
import importlib.util as _iu
_sp=_iu.spec_from_file_location('cfg', os.path.join(SC,'cfg.py')); C=_iu.module_from_spec(_sp); _sp.loader.exec_module(C)
PLAN=('--plan' in sys.argv)
REMIX=(sys.argv[sys.argv.index('--remix')+1] if '--remix' in sys.argv else None)
if REMIX: REMIX=os.path.abspath(REMIX)
REPO = '/home/claude/bobaedream/scripts/shortform'
ASSET = '/home/claude/bobaedream/public/assets/shortform'
os.environ['SAG_EDIT'] = 'bobae_be'
sys.argv = ['x', '/dev/null', os.path.join(SC, 'sagtmp')]
sys.path.insert(0, REPO)
import sag_reel_v1 as R

W, H, FPS = 1080, 1920, 30
SPEED = float(os.environ.get('BBM_SPEED', '1.1'))
END_S = 2.0
TAIL = 0.5
os.chdir(SC)

# ── 1) 목소리 1.1배 + 어절 시각(받아쓰기) → 실제 소리 시작점으로 보정 ──
if not os.path.exists('voice.wav'):
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', 'voice_a.mp3', '-af', f'atempo={SPEED}', '-ar', '48000', '-ac', '1', 'voice.wav'], check=True)
wv = wave.open('voice.wav'); sr = wv.getframerate()
x = np.frombuffer(wv.readframes(wv.getnframes()), np.int16) / 32768
VOICE_LEN = len(x) / sr
hop = int(sr * 0.01)
env = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) + 1e-9 for i in range(0, len(x) - hop, hop)])
db = 20 * np.log10(env)
WRD = json.load(open('voice_a_words.json'))
if not PLAN and not REMIX and os.environ.get('BBM_SKIP_CHECK') != '1':  # 렌더 전 매뉴얼 점검(check_cfg.py) — 걸리면 멈춤
    _r = subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'check_cfg.py'), SC, '--speed', os.environ.get('BBM_SPEED', '1.1')])
    if _r.returncode:
        raise SystemExit('매뉴얼 점검에서 걸림 → cfg를 고친 뒤 다시 렌더(그래도 렌더하려면 BBM_SKIP_CHECK=1)')


def _onset_raw(i):
    """받아쓰기 시작은 앞 쉼을 포함하므로 소리가 커지는 첫 지점으로 당김(옛 방식)"""
    s, e = WRD[i][0] / SPEED, WRD[i][1] / SPEED
    a, b = int(s * 100), max(int(s * 100) + 1, int(e * 100))
    seg = db[a:b]
    k = np.argmax(seg > -32) if np.any(seg > -32) else 0
    return (a + k) / 100


DBS = np.convolve(db, np.ones(3) / 3, mode='same')  # 30ms 평활


def _onset_snap(i):
    """받아쓰기(위스퍼) 어절 시각은 한국어에서 0.1~0.4초씩 어긋남 → 앞뒤 0.2초 안의 실제 소리 골짜기(어절 사이 숨)에 맞춤.
    골짜기가 얕으면(연음) 옛 방식 그대로."""
    base = _onset_raw(i)
    if i == 0:
        return base
    a, b = max(0, int((base - 0.18) * 100)), min(len(DBS) - 1, int((base + 0.22) * 100))
    if b - a < 4:
        return base
    seg = DBS[a:b]
    m = int(np.argmin(seg)); vmin = seg[m]
    left = DBS[max(0, a + m - 15):a + m].max() if a + m > 0 else vmin
    right = DBS[a + m:min(len(DBS), a + m + 15)].max()
    if min(left, right) - vmin < 6:  # 얕은 골짜기 = 이어 읽음 → 믿지 않음
        return base
    k = m
    while k < len(seg) - 1 and seg[k] < vmin + 6:
        k += 1
    return (a + k) / 100


_ON = []
for _i in range(len(WRD)):
    o = _onset_snap(_i)
    if _ON and o < _ON[-1] + 0.08:  # 순서 보장
        o = _ON[-1] + 0.08
    _ON.append(o)


def onset(i):
    return _ON[i]


# ── 2) 컷 목록: (사진, 부위, 첫 어절 번호, 자막 어절[(글자, 어절번호)], 칩, 넘김, 켄번스) ──
# 켄번스: (가로 중심 시작, 끝, 확대 시작, 끝, 세로 중심)
CUTS = C.CUTS
EXTRA_CHIPS = getattr(C,'EXTRA_CHIPS',[])
WHOOSH_AT = set() if os.environ.get('BBM_FADE') == '1' else set(C.WHOOSH_AT)
R.MARKS = getattr(C,'MARKS',{})
TILT = R.STYLE['tilt_fixed']
CAP_CY = R.STYLE['cap_cy']

# 컷 시작 = 첫 어절 소리 시작 0.12초 전(첫 컷은 0)
starts = [0.0] + [onset(c[2]) - 0.12 for c in CUTS[1:]]
BODY = VOICE_LEN + TAIL
ends = starts[1:] + [BODY]
END_CARD = getattr(C, 'END_CARD', True)  # False = 끝 보배드림 화면 없이 마지막 장면을 0.8초 어둡게 닫음
if not END_CARD:
    END_S = 0.8
TOTAL = BODY + END_S

# 자막 덩어리(벨기에판 2~5어절): 긴 문장은 나눔
CAPS = []
for ci, c in enumerate(CUTS):
    raw = list(c[3]); groups, cur = [], []
    # 받아쓰기가 한 덩어리로 들은 말(화이트바디에 · 주요장치 · 문의주세요)을 자막에서 두 낱말로 나눴으면,
    # 노랑이 두 낱말에 한꺼번에 켜지지 않게 그 말의 길이를 글자 수 비율로 나눠 차례로 켠다(v1.4)
    _seq = [it for it in raw if it != '|']
    _tm = {}
    _k = 0
    while _k < len(_seq):
        _j = _k
        while _j + 1 < len(_seq) and _seq[_j + 1][1] == _seq[_k][1]:
            _j += 1
        _i = _seq[_k][1]; _t0 = onset(_i)
        _t1 = max(_t0 + 0.05, WRD[_i][1] / SPEED) if _i < len(WRD) else _t0 + 0.3
        _ln = [max(1, len(x[0])) for x in _seq[_k:_j + 1]]; _acc = 0
        for _m in range(_k, _j + 1):
            _tm[_m] = _t0 + (_t1 - _t0) * _acc / sum(_ln); _acc += _ln[_m - _k]
        _k = _j + 1
    _n = 0
    for it in raw:
        if it == '|':
            if cur: groups.append(cur); cur = []
            continue
        cur.append((it[0], _tm[_n])); _n += 1
    if cur: groups.append(cur)
    g2 = []
    for g in groups:
        g2 += [g] if len(g) <= 5 else [g[:5], g[5:]]
    groups = g2
    for gi, g in enumerate(groups):
        s = g[0][1]
        e = (groups[gi + 1][0][1] if gi + 1 < len(groups) else (onset(CUTS[ci + 1][2]) - 0.05 if ci + 1 < len(CUTS) else VOICE_LEN + 0.3))
        CAPS.append(dict(s=s, e=e, t=' '.join(t for t, _ in g), ws=[w for _, w in g]))

CHIPS = []
for ci, c in enumerate(CUTS):
    if c[4]:
        CHIPS.append((c[4][0], onset(c[4][1]) + 0.05, ends[ci] - 0.08))
for txt, wi in EXTRA_CHIPS:
    t0 = onset(wi) + 0.05
    ci_ = max(i for i in range(len(CUTS)) if starts[i] <= t0)
    CHIPS.append((txt, t0, ends[ci_] - 0.08))
# 같은 컷 두 칩: 앞 칩은 두 번째 칩이 뜨면 내려감
CHIPS = sorted(CHIPS, key=lambda c: c[1])
for k in range(len(CHIPS) - 1):
    if CHIPS[k][2] > CHIPS[k + 1][1]:
        CHIPS[k] = (CHIPS[k][0], CHIPS[k][1], CHIPS[k + 1][1])

# ── 넘김 구간(페이드 개선 2026-11-17): 페이드는 다음 말 소리 0.05초 전에 끝나고, 숨 쉬는 틈이 짧으면 짧게 ──
FADES = {'fade': .30, 'fade_long': .80, 'dip_black': .80, 'dip_white': .60, 'reveal': .18}  # reveal = 독립 컷 단계 공개(같은 카드에 한 줄씩 켜짐, 확대 없이 짧게 겹침)  # 같은 묶음 안은 짧게, 장이 바뀔 때만 길게
_FADEMODE = os.environ.get('BBM_FADE') == '1'
FW = {}
for _j in range(1, len(CUTS)):
    _tr = CUTS[_j][5]
    if _FADEMODE and _tr and _tr not in FADES:
        _tr = 'fade'
    if _tr not in FADES:
        continue
    _end = onset(CUTS[_j][2]) - 0.05
    _prev = WRD[CUTS[_j][2] - 1][1] / SPEED if CUTS[_j][2] > 0 else 0  # 앞 문장 마지막 어절 끝
    _d = min(FADES[_tr], max(0.25, _end - _prev + 0.10))
    FW[_j] = (_end - _d, _end, _tr)
# 칩: 새 컷 칩은 페이드가 끝난 뒤, 앞 컷 칩은 페이드 시작 전에 내려감
_cut_of = lambda t: max(i for i in range(len(CUTS)) if starts[i] <= t)
_ch = []
for txt, st, en in CHIPS:
    ci = _cut_of(st)
    if ci in FW:
        st = max(st, FW[ci][1] + 0.05)
    if ci + 1 in FW:
        en = min(en, FW[ci + 1][0])
    if en - st > 0.3:
        _ch.append((txt, st, en))
CHIPS = _ch
for c in CAPS:  # 문장 마지막 자막도 페이드 시작 전에 내려감
    ci = _cut_of(c['s'])
    if ci + 1 in FW and FW[ci + 1][2] != 'reveal' and c['e'] > FW[ci + 1][0]:  # 같은 카드에서 한 줄 켜질 때는 말이 끝날 때까지 자막 유지
        c['e'] = max(c['s'] + 0.3, FW[ci + 1][0])

# ── 3) 사진 그리기(켄번스) ──
PH = {}


def photo(n):
    if n not in PH:
        PH[n] = cv2.cvtColor(cv2.imread(f'src2/p{n:02d}.png'), cv2.COLOR_BGR2RGB)
    return PH[n]


ease = lambda u: u * u * (3 - 2 * u)


def frame_of(ci, T):
    n = CUTS[ci][0]
    fx0, fx1, z0, z1, fy = CUTS[ci][6]
    s0, e0 = starts[ci], ends[ci]
    u = min(1, max(0, (T - s0) / max(0.01, e0 - s0)))
    u = ease(u) * 0.85 + u * 0.15
    hz = getattr(C, 'HOOK_ZOOM', None)  # 첫 컷 엠블럼 확대 → 뒤로 빠지기 (A안)
    if ci == 0 and hz:
        uu = min(1, max(0, T / hz[1]))
        u = ease(uu)
    img = photo(n)
    h, w = img.shape[:2]
    z = z0 + (z1 - z0) * u
    full = (h, w) == (H, W)  # 미리 만든 9:16 독립 컷(성능지·가격·자료 카드)은 상자 맞춤 없이 그대로
    if FADE and not full:
        return box_frame(n, img, fx0 + (fx1 - fx0) * u, fy, z)
    if n in FIT and not full:
        return fit_frame(n, img, fx0 + (fx1 - fx0) * u, z)
    sc = H / h * z
    vw, vh = W / sc, H / sc
    cx = min(max((fx0 + (fx1 - fx0) * u) * w, vw / 2), w - vw / 2)
    cy = min(max(fy * h, vh / 2), h - vh / 2)
    M = np.float32([[sc, 0, W / 2 - cx * sc], [0, sc, H / 2 - cy * sc]])
    return cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


FIT = set(getattr(C, 'FIT', []))
BG = {}
FADE = os.environ.get('BBM_FADE') == '1'


def blur_bg(n, img):
    h, w = img.shape[:2]
    if n not in BG:
        sc = max(W / w, H / h)
        bg = cv2.resize(img, (int(w * sc) + 1, int(h * sc) + 1))
        y0 = (bg.shape[0] - H) // 2; x0 = (bg.shape[1] - W) // 2
        bg = cv2.GaussianBlur(bg[y0:y0 + H, x0:x0 + W], (0, 0), 40)
        BG[n] = (bg * 0.55).astype(np.uint8)
    return BG[n].copy()


def box_frame(n, img, fx, fy, z):
    """사진 원래 비율 그대로(9:16로 자르지 않음): 가로 꽉 찬 상자 + 위아래 흐린 채움, 켄번스는 상자 안에서만"""
    h, w = img.shape[:2]
    out = blur_bg(n, img)
    fw = W; fh = fw * h / w
    if fh > H * .78:
        fh = H * .78; fw = fh * w / h
    z = max(1.0, z)
    sw, sh = w / z, h / z
    cx = min(max(fx * w, sw / 2), w - sw / 2); cy = min(max(fy * h, sh / 2), h - sh / 2)
    M = np.float32([[fw / sw, 0, -(cx - sw / 2) * fw / sw], [0, fh / sh, -(cy - sh / 2) * fh / sh]])
    fg = cv2.warpAffine(img, M, (int(fw), int(fh)), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    x0 = int((W - fw) / 2); y0 = int(H * .44 - fh / 2)
    out[y0:y0 + fg.shape[0], x0:x0 + fg.shape[1]] = fg
    return out


def fit_frame(n, img, fx, z):
    h, w = img.shape[:2]
    if n not in BG:
        sc = max(W / w, H / h)
        bg = cv2.resize(img, (int(w * sc) + 1, int(h * sc) + 1))
        y0 = (bg.shape[0] - H) // 2; x0 = (bg.shape[1] - W) // 2
        bg = cv2.GaussianBlur(bg[y0:y0 + H, x0:x0 + W], (0, 0), 40)
        BG[n] = (bg * 0.55).astype(np.uint8)
    out = BG[n].copy()
    fw = W * z * 1.0
    fh = fw * h / w
    if fh > H * .78:
        fh = H * .78; fw = fh * w / h
    fg = cv2.resize(img, (int(fw), int(fh)), interpolation=cv2.INTER_CUBIC)
    cx = W / 2 + (0.5 - fx) * (fw - W) if fw > W else W / 2
    x0 = int(cx - fw / 2); y0 = int(H * .44 - fh / 2)
    sx0, sy0 = max(0, -x0), max(0, -y0)
    dx0, dy0 = max(0, x0), max(0, y0)
    ww = min(fg.shape[1] - sx0, W - dx0); hh = min(fg.shape[0] - sy0, H - dy0)
    out[dy0:dy0 + hh, dx0:dx0 + ww] = fg[sy0:sy0 + hh, sx0:sx0 + ww]
    return out


def scaled(img, z):
    M = cv2.getRotationMatrix2D((W / 2, H / 2), 0, z)
    return cv2.warpAffine(img, M, (W, H), borderMode=cv2.BORDER_REFLECT)


def mblur(img, k, vertical=False):
    k = int(k) | 1
    if k < 3:
        return img
    ker = np.zeros((k, k), np.float32)
    if vertical:
        ker[:, k // 2] = 1.0 / k
    else:
        ker[k // 2, :] = 1.0 / k
    return cv2.filter2D(img, -1, ker)


DUR = {'whip_l': .30, 'whip_r': .30, 'push_up': .30, 'zoom': .40, 'flash': .30, 'blur': .45}


def base_frame(T):
    f = _base_frame(T)
    fi = getattr(C, 'FADE_IN', 0)  # 시작 검정에서 밝아짐
    if fi and T < fi:
        f = (f * ease(T / fi)).astype(np.uint8)
    return f


def _base_frame(T):
    ci = max(i for i in range(len(CUTS)) if starts[i] <= T) if T < BODY else len(CUTS) - 1
    # 지금 넘김 구간인가(컷 경계 앞뒤 절반씩)
    for j in range(1, len(CUTS)):
        if j in FW:  # 페이드·검정/흰 경유
            a, b, tr = FW[j]
            if not (a <= T < b):
                continue
            u = (T - a) / (b - a)
            A, B = frame_of(j - 1, T), frame_of(j, T)
            if tr == 'reveal':
                return cv2.addWeighted(A, 1 - ease(u), B, ease(u), 0)
            if tr in ('fade', 'fade_long'):
                k = ease(ease(u))  # 가운데(두 사진이 반반 겹치는 시간)를 짧게 → 이중상 줄임
                B = scaled(B, 1.04 - 0.04 * ease(u))  # 들어오는 사진은 살짝 줄어들며 자리 잡음
                return cv2.addWeighted(A, 1 - k, B, k, 0)
            col = 0 if tr == 'dip_black' else 255  # 검정·흰색을 거쳐 넘어감(장 바뀜 표시)
            k = ease(min(1, u / .5)) if u < .5 else ease(min(1, (1 - u) / .5))
            src = A if u < .5 else B
            return (src * (1 - k * .92) + col * k * .92).astype(np.uint8)
        tr = CUTS[j][5]
        if FADE or tr in FADES:
            continue
        d = DUR.get(tr, 0)
        b = starts[j]
        if tr and b - d / 2 <= T < b + d / 2:
            u = (T - (b - d / 2)) / d
            A, B = frame_of(j - 1, T), frame_of(j, T)
            if tr in ('whip_l', 'whip_r', 'push_up'):
                e = ease(u)
                vel = 6 * u * (1 - u)  # 0~1.5, 가운데에서 가장 빠름
                if tr == 'push_up':
                    off = int(e * H)
                    out = np.vstack([A[off:], B[:off]]) if off > 0 else A
                    return mblur(out, vel * 90, vertical=True)
                sgn = 1 if tr == 'whip_l' else -1
                off = int(e * W)
                out = np.hstack([A[:, off:], B[:, :off]]) if sgn > 0 else np.hstack([B[:, W - off:], A[:, :W - off]])
                return mblur(out, vel * 110)
            if tr == 'zoom':
                if u < .5:
                    k = u / .5
                    out = scaled(A, 1 + .32 * k * k)
                    out = cv2.GaussianBlur(out, (0, 0), 0.1 + 9 * k * k)
                else:
                    k = (1 - u) / .5
                    out = scaled(B, 1 + .32 * k * k)
                    out = cv2.GaussianBlur(out, (0, 0), 0.1 + 9 * k * k)
                fl = max(0, 1 - abs(u - .5) * 6) * .35
                return (out * (1 - fl) + 255 * fl).astype(np.uint8)
            if tr == 'flash':
                out = A if u < .5 else B
                fl = max(0, 1 - abs(u - .5) * 2) ** 1.5 * .9
                return (out * (1 - fl) + 255 * fl).astype(np.uint8)
            if tr == 'blur':
                g = 1 - abs(u - .5) * 2
                a = cv2.GaussianBlur(A, (0, 0), 0.1 + 14 * g)
                bb = cv2.GaussianBlur(B, (0, 0), 0.1 + 14 * g)
                return cv2.addWeighted(a, 1 - ease(u), bb, ease(u), 0)
    return frame_of(ci, T)


# ── 4) 그림 얹기 ──
from PIL import ImageDraw as _D
_lgp = getattr(C, 'DEALER_LOGO', os.path.join(os.path.dirname(SC), 'joylogo.png'))
if _lgp and os.path.exists(_lgp):
    _lg = Image.open(_lgp).convert('RGBA')
    _lh = getattr(C, 'DEALER_LOGO_H', 60); _lg = _lg.resize((int(_lg.width * _lh / _lg.height), _lh), Image.LANCZOS)
    LOGO = Image.new('RGBA', (_lg.width + 44, _lh + 26), (0, 0, 0, 0))
    _D.Draw(LOGO).rounded_rectangle((0, 0, LOGO.width - 1, LOGO.height - 1), radius=LOGO.height // 2, fill=(255, 255, 255, 235))
    LOGO.alpha_composite(_lg, (22, 13))
else:  # 딜러 로고 없음
    LOGO = Image.new('RGBA', (2, 2), (0, 0, 0, 0))
LOGO_XY = (40, 96)
def dealer_chip(txt, size=40, tilt=-1.5):
    """딜러 칩 = 노션 「스카우트24 테마별」 원본 로고 칠(테마 바탕색_430_239) 그대로, 가로로만 늘림. 색 #F5F200, 글자 검정.
    벨기에판 실측(tags_zoom: €56.490·€180·Auto): 칠 높이 ≈ 대문자 높이 2.8배, 글자 좌우 여백 ≈ 칠 높이 0.2배, 글자는 칠 세로 가운데.
    칠 가장자리가 들쭉날쭉하므로 글자 칸의 모든 세로줄이 칠 안(불투명)에 들 때까지 칠 폭을 넓힘 → 글자 잘림 없음."""
    import sys as _s
    import numpy as _np
    _s.path.insert(0, REPO)
    from brushfill import theme_mask
    fnt = ImageFont.truetype(R.BOLD, size)
    bb = fnt.getbbox(txt, anchor='ls'); tw = bb[2] - bb[0]; th = bb[3] - bb[1]
    cap = size * 0.74
    h = int(round(cap * 2.8)); m = 12
    w = int(tw + h * 0.2 * 2)
    for _ in range(30):
        mask = theme_mask(w, h, '430_239', margin=m)
        A = _np.asarray(mask)
        x0 = m + (w - tw) / 2; y0 = m + (h - th) / 2
        sub = A[int(y0) - 3:int(y0 + th) + 4, int(x0) - 4:int(x0 + tw) + 5]
        if sub.size and sub.min() > 200:
            break
        w = int(w * 1.04) + 2
    im = Image.new('RGBA', mask.size, (0xF5, 0xF2, 0x00, 0)); im.putalpha(mask)
    ImageDraw.Draw(im).text((x0 - bb[0], y0 - bb[1]), txt, font=fnt, fill=(0, 0, 0), anchor='ls')
    return im.rotate(-tilt, resample=Image.BICUBIC, expand=True)


def dealer_chip_de(lines, size=34):
    """독일판(AutoScout24 DE 'Supercar / Quiztime!') 두 줄 겹친 둥근 상자 칩.
    실측(1080폭): 상자 높이 ≈130, 글자 높이 ≈ 상자 0.4배, 좌우 여백 ≈ 상자 높이 0.24배, 모서리 ≈ 0.17배,
    아래 상자가 위 상자를 0.14배 덮음, 위(노랑 #DDDA50) −2° · 아래(흰 #F8F8F6) 0°, 옅은 그림자. 글자 칸 기준이라 잘림 없음."""
    fnt = ImageFont.truetype(R.BOLD, size)
    def box(txt, fill, tilt):
        bb = fnt.getbbox(txt, anchor='ls'); tw, th = bb[2] - bb[0], bb[3] - bb[1]
        h = int(round(size * 1.85)); pad = int(h * 0.24); w = tw + pad * 2; r = int(h * 0.17)
        im = Image.new('RGBA', (w + 24, h + 24), (0, 0, 0, 0))
        sh = Image.new('L', im.size, 0); ImageDraw.Draw(sh).rounded_rectangle((12, 16, 12 + w, 16 + h), r, fill=70)
        im.putalpha(sh.filter(ImageFilter.GaussianBlur(5)))
        im = Image.composite(Image.new('RGBA', im.size, (0, 0, 0, 255)), im, sh.point(lambda v: 0))
        d = ImageDraw.Draw(im); d.rounded_rectangle((12, 12, 12 + w, 12 + h), r, fill=fill)
        d.text((12 + (w - tw) / 2 - bb[0], 12 + (h - th) / 2 - bb[1]), txt, font=fnt, fill=(20, 20, 20), anchor='ls')
        return im.rotate(-tilt, resample=Image.BICUBIC, expand=True), h
    top, h1 = box(lines[0], (0xE4, 0xE2, 0x5C, 255), -2.0)
    out = [top]
    if len(lines) > 1:
        bot, h2 = box(lines[1], (0xF8, 0xF8, 0xF6, 255), 0.0)
        ov = int(h1 * 0.14)
        W = max(top.width + 14, bot.width); H = top.height + bot.height - ov - 24
        im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        im.alpha_composite(top, (14, 0)); im.alpha_composite(bot, (0, top.height - ov - 24))
        return im
    return top


if getattr(C, 'DEALER_CHIP', None):  # 딜러 이름 칩: 노션 원본 로고 칠
    if getattr(C, 'DEALER_CHIP_STYLE', '') == 'de':
        LOGO = dealer_chip_de(getattr(C, 'DEALER_CHIP_LINES', [C.DEALER_CHIP]), getattr(C, 'DEALER_CHIP_SIZE', 34))
    else:
        LOGO = dealer_chip(C.DEALER_CHIP, getattr(C, 'DEALER_CHIP_SIZE', 40))
    LOGO_XY = (36, 96)


def _ov_card(path, wd, tilt=0.0, label=None):
    """자료 카드: 흰 테두리(오려 붙인 신문 조각) + 옅은 그림자 + 기울기 + 위 출처 띠"""
    src = Image.open(path).convert('RGB')
    h = int(src.height * wd / src.width); src = src.resize((wd, h), Image.LANCZOS)
    b = 14; top = 0
    lab = None
    if label:
        f = ImageFont.truetype(R.BOLD, 30); lb = f.getbbox(label, anchor='ls')
        lab = (f, lb); top = (lb[3] - lb[1]) + 26
    cw, ch = wd + b * 2, h + b * 2 + top
    im = Image.new('RGBA', (cw + 40, ch + 40), (0, 0, 0, 0))
    sh = Image.new('L', im.size, 0); ImageDraw.Draw(sh).rectangle((20, 26, 20 + cw, 26 + ch), fill=110)
    im.putalpha(sh.filter(ImageFilter.GaussianBlur(9)))
    d = ImageDraw.Draw(im); d.rectangle((20, 20, 20 + cw, 20 + ch), fill=(250, 247, 238, 255))
    if lab:
        f, lb = lab
        d.rectangle((20, 20, 20 + cw, 20 + top), fill=(196, 32, 38, 255))
        d.text((20 + b - lb[0], 20 + (top - (lb[3] - lb[1])) / 2 - lb[1]), label, font=f, fill=(255, 255, 255), anchor='ls')
    im.paste(src, (20 + b, 20 + b + top))
    return im.rotate(-tilt, resample=Image.BICUBIC, expand=True)


OVIMG = {o['img']: _ov_card(os.path.join(SC, o['img']), o.get('wd', 700), o.get('tilt', 0.0), o.get('label')) for o in getattr(C, 'OVERLAYS', [])}


# ── 3D 아이콘 칩(나세르식): 칩 오른쪽 끝에 큰 3D 아이콘이 튀어나와 살짝 떠 있음 ──
ICON3D = os.environ.get('BBM_ICON3D') == '1'
OUT_FILE = C.OUT.replace('.mp4', ('_fade' if FADE else '') + ('_3d' if ICON3D else '') + '.mp4')
ICDIR = os.path.join(os.path.dirname(SC), 'icons3d')
ICMAP = {'마력': 'ns_peak_power', '카메라': 'ns_camera', '어라운드뷰': 'ns_camera', '드라이브 모드': 'ns_race_mode',
         '제로백': 'fl_stopwatch', 'km/h': 'fl_racing_car', 'EV ': 'fl_battery', 'km': 'fl_motorway',
         '옵션': 'fl_money_bag', '디스플레이': 'fl_desktop_computer', '터치스크린': 'fl_desktop_computer',
         '시트': 'fl_seat', '퀼팅': 'fl_seat', '가죽': 'fl_seat', 'L': 'fl_luggage', '프렁크': 'fl_luggage',
         '무사고': 'fl_check_mark_button', '정식 출고': 'fl_check_mark_button', '보험': 'fl_shield', '보증': 'fl_wrench',
         '등록': 'fl_spiral_calendar', '컬러': 'fl_orange_heart', '로우 레인지': 'fl_mountain', '선루프': 'fl_sun', '오픈': 'fl_sun',
         '리스': 'fl_page_facing_up', 'Q by': 'fl_bookmark', '베버리힐즈': 'fl_globe_showing_americas', '기어': 'fl_radio_button',
         '페인트': 'fl_artist_palette', '레드 ×': 'fl_artist_palette', '에디션': 'fl_crown', 'M1': 'fl_red_circle',
         '스티어링': 'fl_index_up', '셀렉터': 'fl_joystick'}
ICORDER = ['마력', '카메라', '어라운드뷰', '드라이브 모드', '제로백', 'EV ', 'km/h', '시트', '퀼팅', '가죽', '옵션', '디스플레이', '터치스크린',
           '프렁크', '무사고', '정식 출고', '보험', '보증', '등록', '컬러', '로우 레인지', '선루프', '오픈', '리스', 'Q by', '베버리힐즈',
           '기어', '페인트', '레드 ×', '에디션', 'M1', '스티어링', '셀렉터', 'km', 'L']
_IC = {}


def icon_for(txt):
    for key in ICORDER:
        if key in txt:
            n = ICMAP[key]
            if n not in _IC:
                im = Image.open(os.path.join(ICDIR, n + '.png')).convert('RGBA')
                a = im.getchannel('A').point(lambda v: 255 if v > 60 else 0)
                im = im.crop(a.getbbox())
                _IC[n] = im
            return _IC[n]
    return None


def icon_chip(ov, txt, st, en, T, i, num):
    tilt = TILT + (-0.8, 0.6, 0.0)[i % 3]
    ic = icon_for(txt)
    fs = 76 if num else 70
    for _ in range(6):  # 칩 + 아이콘이 화면 안(좌우 40px)에 들어오게 글자 크기 줄임
        chip = R._sticker_core(txt, fs, tilt, False, no_mark=True)
        ih0 = int(chip.height * 1.45)
        if ic and ic.width / ic.height > 1.15:  # 가로로 긴 아이콘(체커기 등)은 폭 기준으로
            ih0 = int(chip.height * 1.45 * 1.15 * ic.height / ic.width)
        icw0 = int(ic.width * ih0 / ic.height) if ic else 0
        if chip.width + icw0 * .80 <= W - 80:
            break
        fs = int(fs * (W - 80) / (chip.width + icw0 * .80))
    k = T - st
    e = R.back(k / .28)
    out = R.ease((en - T) / .12)
    a = min(1, k / .1) * out
    ih, icw = ih0, icw0
    tot = chip.width + int(icw * .80)
    x = (W - tot) / 2
    y = H * .28 - chip.height / 2 if num else CAP_CY - 70 - chip.height
    sc = max(.05, e)
    R.paste(ov, chip, x + chip.width * (1 - sc) / 2, y + chip.height * (1 - e) / 2, a, sc)
    if ic is None:
        return
    k2 = k - .10  # 칩보다 0.1초 늦게 튀어나옴
    if k2 <= 0:
        return
    e2 = R.back(k2 / .34)
    bob = math.sin(k2 * 2 * math.pi * .7) * 7  # 살짝 떠서 위아래로
    rot = math.sin(k2 * 2 * math.pi * .5) * 4 + (1 - min(1, k2 / .34)) * -18
    im = ic.resize((icw, ih), Image.LANCZOS).rotate(rot, resample=Image.BICUBIC, expand=True)
    sh = Image.new('RGBA', im.size, (0, 0, 0, 0))
    sh.putalpha(im.getchannel('A').point(lambda v: int(v * .35)))
    sh = sh.filter(ImageFilter.GaussianBlur(10))
    s2 = max(.05, e2)
    cx = x + chip.width - 30 - icw * .10 + im.width / 2
    cy = y + chip.height / 2 + bob
    w2, h2 = im.width * s2, im.height * s2
    R.paste(ov, sh, cx - w2 / 2 + 6, cy - h2 / 2 + 14, a * min(1, k2 / .1), s2)
    R.paste(ov, im, cx - w2 / 2, cy - h2 / 2, a * min(1, k2 / .1), s2)



def photo_band(T):
    """가로 사진을 상자에 맞춘 컷이면 (사진 위 y, 아래 y). 뉴스 릴스처럼 자막은 사진 밑, 칩은 사진 위 띠에 둔다."""
    if not getattr(C, 'CAPS_UNDER_PHOTO', False) or T < starts[1]:
        return None
    ci = max(i for i in range(len(CUTS)) if starts[i] <= T) if T < BODY else len(CUTS) - 1
    n = CUTS[ci][0]
    if not (FADE or n in FIT):
        return None
    h, w = photo(n).shape[:2]
    if w <= h:
        return None
    fh = W * h / w
    if fh > H * .78:
        fh = H * .78
    y0 = int(H * .44 - fh / 2)
    return y0, y0 + fh


def overlay(T):
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ov.alpha_composite(LOGO, LOGO_XY)
    HD = getattr(C, 'HOOK_DELAY', 0.0)  # 엠블럼 확대 동안 타이틀을 늦게 올림
    HE = FW[1][0] if 1 in FW else starts[1]  # 첫 페이드가 시작되기 전에 제목을 내림
    if HD <= T < HE:  # 첫 화면: 「페라리」 노랑 칩 + 같은 줄 흰 큰 글자 + 아래 한 줄
        T0 = T; T = T - HD
        e = R.back(T / .28)
        b = R.sticker(C.HOOK[0], 84, TILT, True)
        m = R.text_img(C.HOOK[1], 84 if len(C.HOOK[1])<=9 else 70, R.HEAVY, stroke=4)
        sub = R.text_img(C.HOOK[2], 50, R.BLACK, stroke=4)
        cy = H * getattr(C, 'HOOK_CY', .24)
        rise = 60 * (1 - R.ease(T / .4)) if HD else 0
        cy += rise
        a = min(1, T / .15, (HE - T0) / .12)
        wid = b.width + m.width - 10
        x0 = (W - wid) / 2
        R.paste(ov, b, x0 + b.width * (1 - e) / 2, cy - b.height / 2 + b.height * (1 - e) / 2, a, max(.05, e))
        R.paste(ov, m, x0 + b.width - 10, cy - m.height / 2, a)
        e2 = R.ease((T - .25) / .3)
        R.paste(ov, sub, (W - sub.width) / 2, cy + b.height / 2 + 4 + 20 * (1 - e2), min(a, e2))
        T = T0
    hide = bool(getattr(C, 'HOOK_HIDE_CAPS', False)) and T < HE
    band = photo_band(T)
    cap_cy = min(H - 300, band[1] + 30 + 60) if band else CAP_CY
    _cp = getattr(C, 'CAP_CY_PHOTOS', {})  # 독립 컷(성능지·가격 카드) 동안 자막을 카드 아래로
    if _cp and T < BODY:
        _n = CUTS[max(i for i in range(len(CUTS)) if starts[i] <= T)][0]
        cap_cy = _cp.get(_n, cap_cy)
    for i, (txt, st, en) in enumerate(CHIPS):
        if ICON3D and st <= T < en:
            num = any(ch.isdigit() for ch in txt)
            hide = hide or (num and not getattr(C, 'CAPS_ALWAYS', False))
            icon_chip(ov, txt, st, en, T, i, num)
            continue
        if st <= T < en:
            num = any(ch.isdigit() for ch in txt)
            hide = hide or (num and not getattr(C, 'CAPS_ALWAYS', False))
            tilt = TILT + (-0.8, 0.6, 0.0)[i % 3]
            im = R.sticker(txt, 76 if num else 70, tilt, False)
            k = T - st
            e = R.back(k / .28)
            out = R.ease((en - T) / .12)
            x = (W - im.width) / 2
            y = H * .28 - im.height / 2 if num else CAP_CY - 70 - im.height
            if band:  # 가로 사진: 칩은 사진 위 띠(차를 가리지 않음)
                y = max(170, band[0] - 18 - im.height)
            sc = max(.05, e)
            R.paste(ov, im, x + im.width * (1 - sc) / 2, y + im.height * (1 - e) / 2, min(1, k / .1) * out, sc)
    for o in getattr(C, 'OVERLAYS', []):  # 오버레이(사진 속 자료 카드): 매물 사진은 그대로, 자료를 카드로 겹침
        st = onset(o['w0']) - 0.05
        en = (onset(o['w1']) - 0.08) if o.get('w1') is not None else ends[[c[2] for c in CUTS].index(max(c[2] for c in CUTS if c[2] <= o['w0']))]
        if st <= T < en:
            im = OVIMG[o['img']]
            k = T - st; e = R.back(k / .32); out = R.ease((en - T) / .15)
            x = W * o.get('cx', .5) - im.width / 2; y = H * o.get('cy', .3) - im.height / 2
            sc = max(.05, e)
            R.paste(ov, im, x + im.width * (1 - sc) / 2, y + im.height * (1 - sc) / 2, min(1, k / .1) * out, sc)
    if not hide:
        for c in CAPS:
            if c['s'] <= T < c['e']:
                act = max([j for j, w in enumerate(c['ws']) if T + 0.04 >= w] or [0])  # 노랑은 말보다 0.04초 먼저
                im = R.phrase_img_be3(c['t'], act)
                R.paste(ov, im, (W - im.width) / 2, cap_cy - im.height / 2)
                break
    return ov


def run(cmd):
    subprocess.run(cmd, check=True)



def sfx_plan():
    """효과음 목록 [(이름, 시각, 크기)]. SFX_RICH면 벨기에 띠 팝 + 큰 숫자 딩 + 큰 전환 휙 + 끝 로고 딩.
    SFX_EXTRA=[(파일 경로, 어절 번호, 그 어절 끝에서 더할 초, 크기)] — 차량 소리(시동음 등)를 그 말 바로 뒤에 넣는다."""
    extra = [(os.path.abspath(f), WRD[i][1] / SPEED + off, v) for f, i, off, v in getattr(C, 'SFX_EXTRA', [])]
    return sorted(_sfx_plan() + extra, key=lambda e: e[1])


def _sfx_plan():
    if not getattr(C, 'SFX_RICH', False):
        return ([('ding', 0.05, .45)] + [('ding', st, .45) for (txt, st, en) in CHIPS if txt in getattr(C, 'SFX_CHIPS', [])]
                + [('whoosh', starts[j] - 0.16, .38) for j in sorted(WHOOSH_AT)])
    big = set(getattr(C, 'SFX_CHIPS', []))
    ev = [('whoosh', 0.0, .30)]                                   # 엠블럼 확대 시작
    hz = getattr(C, 'HOOK_DELAY', 0.0)
    ev.append(('pop', max(0.05, hz - 0.02), .42))                 # 타이틀 올라옴
    for (txt, st, en) in CHIPS:                                   # 칩: 큰 숫자 딩, 나머지 팝(벨기에 띠)
        ev.append(('ding' if txt in big else 'pop', st - 0.02, .45 if txt in big else .40))
    for ci, c in enumerate(CUTS):                                 # 단계 공개(체크 한 줄 켜짐)에 팝
        if ci and c[5] == 'reveal':
            ev.append(('pop', FW[ci][1] - 0.04 if ci in FW else starts[ci], .42))
    for ci, c in enumerate(CUTS):                                 # 큰 전환에 부드러운 휙
        if ci and c[5] in ('fade_long', 'dip_black', 'dip_white'):
            ev.append(('whoosh', (FW[ci][0] if ci in FW else starts[ci]) - 0.05, .24))
    if END_CARD:
        ev.append(('ding', BODY + 0.15, .40))                     # 끝 로고
    ev.sort(key=lambda e: e[1])
    out = []
    for e in ev:                                                  # 0.45초 안에 겹치면 칩 소리를 남김
        if out and e[1] - out[-1][1] < 0.45:
            if e[0] != 'whoosh' and out[-1][0] == 'whoosh':
                out[-1] = e
            continue
        out.append(e)
    return [(n, max(0.0, t), v) for n, t, v in out]


def mix_audio():
    # ── 5) 소리: 목소리 + 배경음(살짝, 목소리 나오면 줄임) + 효과음 → -14 LUFS ──
    SFX = sfx_plan()
    print('sfx', [(n, round(t, 2)) for n, t, v in SFX])
    ins = ['-i', 'voice.wav', '-i', f'{ASSET}/bgm/bobae_showroom_v1.mp3']
    ALT = getattr(C, 'BGM_ALT', None)  # 자료(카탈로그) 컷 동안 다른 배경음으로 바꿈: (파일, [(첫 어절, 끝 어절), ...])
    segs = [(max(0, onset(a) - 0.35), onset(b) - 0.1) for a, b in ALT[1]] if ALT else []
    g = '+'.join(f'clip(min((t-{a:.2f})/0.45,({b:.2f}-t)/0.45),0,1)' for a, b in segs) or '0'

    sf = ''
    k0 = 3 if ALT else 2
    if ALT:
        ins += ['-stream_loop', '-1', '-i', os.path.join(SC, ALT[0])]
    for j, (nm, t, vol) in enumerate(SFX):
        ins += ['-i', nm if os.path.isabs(nm) else f'{ASSET}/sfx/{nm}.wav']
        sf += f'[{j + k0}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume={vol},adelay={int(t * 1000)}|{int(t * 1000)}[s{j}];'
    sf += ''.join(f'[s{j}]' for j in range(len(SFX))) + f'amix=inputs={len(SFX)}:normalize=0[fx];'
    af = (f'[0:a]aformat=sample_rates=48000:channel_layouts=stereo,highpass=f=70,acompressor=threshold=-18dB:ratio=2.5:attack=5:release=120,apad=whole_dur={TOTAL}[vo];'
          f"[1:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:{TOTAL},volume={R.STYLE['bgm_vol']},volume='1-({g})':eval=frame,afade=t=in:d=0.4,afade=t=out:st={TOTAL - 1.4}:d=1.4[m0];"
          + (f"[2:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:{TOTAL},volume={ALT[2] if len(ALT) > 2 else R.STYLE['bgm_vol']},volume='{g}':eval=frame[m1];[m0][m1]amix=inputs=2:normalize=0[m];" if ALT else '[m0]anull[m];')
          + sf + '[vo]asplit=2[v1][v2];[m][v1]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=350[md];'
          f'[v2][md][fx]amix=inputs=3:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=9,aresample=192000,alimiter=limit=0.8:level=false,aresample=48000,atrim=0:{TOTAL}[a]')
    run(['ffmpeg', '-y', '-v', 'error', *ins, '-i', 'video_only.mp4', '-filter_complex', af, '-map', f'{len(SFX) + k0}:v', '-map', '[a]',
         '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-movflags', '+faststart', '-shortest', OUT_FILE])
    os.remove('video_only.mp4')
    # 렌더 후 점검(⑥): 말하는 동안 자막이 보이는가 — 걸려도 영상은 남기고 고칠 곳만 알린다
    subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'check_render.py'), SC, OUT_FILE])

if __name__ == '__main__':
    print('voice', round(VOICE_LEN, 2), 'total', round(TOTAL, 2))
    rows = []
    for ci, c in enumerate(CUTS):
        rows.append(dict(cut=ci + 1, photo=c[0], part=c[1], start=round(starts[ci], 2), end=round(ends[ci], 2),
                         line=' '.join(x[0] for x in c[3] if x != '|'), chip=c[4][0] if c[4] else '', trans=c[5] or ''))
    json.dump(dict(cuts=rows, chips=[(a, round(b, 2), round(e, 2)) for a, b, e in CHIPS], total=TOTAL), open('plan.json', 'w'), ensure_ascii=False, indent=1)
    for r_ in rows:
        print(r_)
    if PLAN:
        sys.exit(0)
    if REMIX:  # 영상은 그대로, 소리만 다시 섞기
        run(['ffmpeg', '-y', '-v', 'error', '-i', REMIX, '-an', '-c:v', 'copy', 'video_only.mp4'])
        mix_audio(); sys.exit(0)
    enc = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                            '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', 'video_only.mp4'], stdin=subprocess.PIPE)
    endc = R.end_card()
    nb = int(round(BODY * FPS))
    last = None
    for fi in range(nb):
        T = fi / FPS
        base = Image.fromarray(base_frame(T)).convert('RGBA')
        last = base.copy()
        base.alpha_composite(overlay(T))
        enc.stdin.write(base.convert('RGB').tobytes())
    lastfull = None
    if not END_CARD:  # 마지막 장면(자막·딜러 칩 포함)을 그대로 두고 검게 닫음
        lastfull = last.copy(); lastfull.alpha_composite(overlay((nb - 1) / FPS))
    for k in range(int(END_S * FPS)):
        if not END_CARD:
            fr = lastfull.copy()
            fr.alpha_composite(Image.new('RGBA', (W, H), (0, 0, 0, int(255 * R.ease(k / (END_S * FPS))))))
            enc.stdin.write(fr.convert('RGB').tobytes())
            continue
        e = R.ease(k / (0.45 * FPS))
        fr = last.copy()
        sc = 0.8 + 0.2 * e
        lg = endc.resize((int(W * sc), int(H * sc)), Image.LANCZOS) if sc < 1 else endc
        fr.alpha_composite(Image.new('RGBA', (W, H), (8, 10, 14, int(120 * e))))
        lgo = lg.copy()
        lgo.putalpha(lgo.getchannel('A').point(lambda v: int(v * min(1, e * 1.4))))
        fr.alpha_composite(lgo, ((W - lg.width) // 2, (H - lg.height) // 2))
        fr.alpha_composite(LOGO, ((W - LOGO.width) // 2, int(H * .70)))
        enc.stdin.write(fr.convert('RGB').tobytes())
    enc.stdin.close(); enc.wait()
    mix_audio()

