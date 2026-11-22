"""보배드림 사진 매물 → 벨기에판(bobae_be) 세로 숏폼 렌더러 — 파이프라인 v1.4 (2026-11-17)

v1.4: 렌더 전 매뉴얼 점검(check_cfg.py, 걸리면 멈춤) · 한 덩어리로 들린 말을 나눈 자막은 노랑을 글자 비율로 차례로 · 독립 컷 단계 공개 — 넘김 'reveal'(0.18초, 확대 없음) · 9:16 미리 만든 카드는 상자 맞춤 없이 그대로 · CAP_CY_PHOTOS(카드 컷 자막 위치) · reveal마다 팝 (카드 만들기: report_cut.py)
내레이션 · 사진 켄번스 · 페이드/동적 넘김 · 노랑 붓띠 칩 · 말 자막 · 배경음(덕킹) · 효과음(SFX_RICH) · 딜러 칩 · 끝 로고
v1.3: 딜러 칩 독일식 두 줄 둥근 상자(DEALER_CHIP_STYLE='de') 추가 · 붓칠 칩 벨기에 비율(칠 높이 2.8배·여백 0.2배)과 글자 잘림 방지
v1.2: 낱말 시작 에너지 골짜기 맞춤 · 페이드 창(FW) · 가로 사진 아래 자막 · SFX_RICH · 노션 원본 칠 딜러 칩
"""
PIPELINE_VERSION = '1.5'  # v1.5: 옵션 비주얼 자동(auto_visuals.py · option_visual_rules.json)
import json, os, re, subprocess, sys, wave
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
SPEED = float(os.environ.get('BBM_SPEED') or getattr(C, 'SPEED', 1.1))  # 2026-11-17: 차 설정(SPEED)이 기준 — 기본값 1.1로 렌더해 1.2배 목소리와 싱크가 틀어진 일 방지
END_S = 2.0
TAIL = 0.5
os.chdir(SC)

# ── 1) 목소리 1.1배 + 어절 시각(받아쓰기) → 실제 소리 시작점으로 보정 ──
def _dur(f):
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout or 0)
if os.path.exists('voice.wav') and abs(_dur('voice.wav') - _dur('voice_a.mp3') / SPEED) > 0.3:  # 다른 배속으로 만든 voice.wav면 다시 만듦
    print(f'voice.wav 배속이 SPEED={SPEED}와 달라 다시 만듦')
    os.remove('voice.wav')
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
    _r = subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'check_cfg.py'), SC, '--speed', str(SPEED)])
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
# 2026-11-17 사진–자막 간격 통일: 자막은 윗선 기준(한 줄 자막 가운데 = CAP_CY), 가로 사진 상자는 아랫선을 한 줄로 고정
CAP_TOP = CAP_CY - 60          # 자막 글줄 윗선(이미지 위 여백 20 제외)
CAP_GAP = getattr(C, 'CAP_GAP', 30)
PHOTO_BOTTOM = CAP_TOP - CAP_GAP   # 가로 사진(상자 맞춤) 아랫선 — 모든 컷 같은 높이

# 컷 시작 = 첫 어절 소리 시작 0.12초 전(첫 컷은 0)
starts = [0.0] + [onset(c[2]) - 0.12 for c in CUTS[1:]]
BODY = VOICE_LEN + TAIL
ends = starts[1:] + [BODY]
if getattr(C, 'AUTO_ZOOM', False):   # 매뉴얼 14장 — 부위 당기기(키프레임 자동), 규칙은 part_zoom_rules.json
    import part_zoom
    _zk, _zr = part_zoom.build(C, CUTS, starts, ends, onset, WRD, W, H, os.environ.get('BBM_FADE') == '1')
    CUTS = [tuple(c[:6]) + (_zk[i],) + tuple(c[7:]) if i in _zk else c for i, c in enumerate(CUTS)]
    for _l in _zr:
        print('  [부위 당기기]', _l)
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

def chip_px(txt, num):
    """칩 글자 크기. v1.8.3(2026-11-18 사용자 승인): 마지막 가격 칩은 cfg CHIP_SIZE_OVERRIDE로 크게(예: {'7,450만원': 120})."""
    return getattr(C, 'CHIP_SIZE_OVERRIDE', {}).get(txt, 84 if num else 72)


def is_num_chip(txt):
    """숫자 칩(가격·주행거리·마력 등 값 자체)인가. '360도 카메라'처럼 숫자가 든 기능 이름은 키워드 칩."""
    if not any(ch.isdigit() for ch in txt):
        return False
    rest = re.sub(r'[\d,.\s~/·]', '', txt)
    rest = re.sub(r'(만원|억|원|km/h|km|마력|kg·m|kgm|kg|cc|초|년|월|명|단|%|인승)', '', rest)
    return rest == ''


# 2026-11-17 매뉴얼 v4 9-3(벨기에판): 칩은 그 낱말이 든 구절(자막 덩어리) 시작 +0.05초에 뜸
def chip_start(wi):
    t = onset(wi)
    for cp in CAPS:
        if cp['s'] - 0.02 <= t < cp['e']:
            return cp['s'] + 0.05
    return t + 0.05


CHIPS = []
for ci, c in enumerate(CUTS):
    if c[4]:
        CHIPS.append((c[4][0], max(starts[ci] + 0.05, chip_start(c[4][1])), ends[ci] - 0.08))
for txt, wi in EXTRA_CHIPS:
    t0 = chip_start(wi)
    ci_ = max(i for i in range(len(CUTS)) if starts[i] <= t0)
    CHIPS.append((txt, t0, ends[ci_] - 0.08))
if getattr(C, 'DEALER_FOOTER', False):  # 딜러는 아래 띠가 맡으므로 딜러 이름 칩은 겹치지 않게 뺌
    _dl = getattr(C, 'DEALER_CHIP_LINES', [getattr(C, 'DEALER_CHIP', '')])
    CHIPS = [c for c in CHIPS if c[0] not in _dl]
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
CHIP_MIN = getattr(C, 'CHIP_MIN', 0.9)
_cut_of = lambda t: max(i for i in range(len(CUTS)) if starts[i] <= t)
_ch = []
for txt, st, en in CHIPS:
    ci = _cut_of(st)
    if ci in FW:
        st = max(st, FW[ci][1] + 0.05)
    if ci + 1 in FW:
        en = min(en, FW[ci + 1][0])
    if en - st < CHIP_MIN:  # 2026-11-17 검수: 짧은 컷이라 칩이 잘리거나 빠지지 않게 다음 넘김 위로 이어서 최소 시간 보임
        en = min(st + CHIP_MIN, BODY - 0.1)
    _ch.append((txt, st, en))
for _k in range(len(_ch) - 1):  # 늘린 칩이 다음 칩과 겹치지 않게
    if _ch[_k][2] > _ch[_k + 1][1] - 0.05:
        _ch[_k] = (_ch[_k][0], _ch[_k][1], _ch[_k + 1][1] - 0.05)
CHIPS = _ch
for c in CAPS:  # 문장 마지막 자막도 페이드 시작 전에 내려감
    ci = _cut_of(c['s'])
    if ci + 1 in FW and FW[ci + 1][2] != 'reveal' and c['e'] > FW[ci + 1][0]:  # 같은 카드에서 한 줄 켜질 때는 말이 끝날 때까지 자막 유지
        a, b, _ = FW[ci + 1]
        # 문장 사이 쉼이 없어 말이 페이드 안까지 이어지면(쉼 0.15초 미만) 자막을 페이드 끝까지 남김 — 말하는데 자막이 비지 않게
        tight = b - a <= 0.30
        c['e'] = max(c['s'] + 0.3, min(c['e'], b - 0.03) if tight else a)

# ── 3) 사진 그리기(켄번스) ──
PH = {}


def photo(n):
    if n not in PH:
        PH[n] = cv2.cvtColor(cv2.imread(f'src2/p{n:02d}.png'), cv2.COLOR_BGR2RGB)
    return PH[n]


ease = lambda u: u * u * (3 - 2 * u)
MOTION_GAIN = getattr(C, 'MOTION_GAIN', 1.0)
PUNCH = getattr(C, 'PUNCH', 0.0)  # 칩이 뜰 때 사진을 톡 당기는 세기(0.05 = 5%)


def _kf(kb, u):
    """사진 키프레임: 지금 시점 u를 감싼 두 키 사이를 부드럽게(ease) 이어 (가로, 가로, 확대, 확대, 세로)로 돌려줌"""
    kb = sorted(kb)
    if u <= kb[0][0]:
        a = b = kb[0]; t = 0.0
    elif u >= kb[-1][0]:
        a = b = kb[-1]; t = 0.0
    else:
        j = max(i for i in range(len(kb)) if kb[i][0] <= u)
        a, b = kb[j], kb[j + 1]; t = ease((u - a[0]) / max(1e-3, b[0] - a[0]))
    x = a[1] + (b[1] - a[1]) * t; z = a[2] + (b[2] - a[2]) * t; y = a[3] + (b[3] - a[3]) * t
    return x, x, z, z, y


def punch(ci, T):
    """칩(핵심어) 순간 펀치인: 말 0.1초 전 시작 · 0.4초 감속 · 유지 (2026-11-17 키프레임 글 기준)"""
    if not PUNCH:
        return 1.0
    s0, e0 = starts[ci], ends[ci]
    k = 0.0
    for txt, st, en in CHIPS:
        t0 = st - 0.10  # 말보다 0.1초 먼저 시작해 그 말에 도착(CapCut 키프레임 글: 3~8프레임 전)
        if s0 <= st < e0 and T >= t0:
            d = min(1.0, (T - t0) / .40)  # 0.4초 감속(ease-out)으로 들어가서 컷 끝까지 유지 — 되돌아오는 출렁임 없음
            k = max(k, 1 - (1 - d) ** 3)
    return 1.0 + PUNCH * k


def frame_of(ci, T):
    n = CUTS[ci][0]
    kb = CUTS[ci][6]
    s0, e0 = starts[ci], ends[ci]
    u = min(1, max(0, (T - s0) / max(0.01, e0 - s0)))
    if isinstance(kb, list):  # 키프레임 [(시점 0~1, 가로, 확대, 세로), ...] — 구간마다 부드럽게
        fx0, fx1, z0, z1, fy = _kf(kb, u)
        u = 0.0
    else:
        fx0, fx1, z0, z1, fy = kb
        g = MOTION_GAIN if not (ci == 0 and getattr(C, 'HOOK_ZOOM', None)) else 1.0
        if g != 1.0:  # 움직임 강조: 확대·이동 폭을 늘림(1배 아래로는 안 내려감)
            zm = (z0 + z1) / 2; z0, z1 = max(1.0, zm + (z0 - zm) * g), max(1.0, zm + (z1 - zm) * g)
            xm = (fx0 + fx1) / 2; fx0, fx1 = xm + (fx0 - xm) * g, xm + (fx1 - xm) * g
        u = ease(u) * 0.85 + u * 0.15
    hz = getattr(C, 'HOOK_ZOOM', None)  # 첫 컷 엠블럼 확대 → 뒤로 빠지기 (A안)
    if ci == 0 and hz:
        # 2026-11-17 검수: 확대가 1.6초에 뚝 멈춘 뒤 한 프레임 쉬고 넘김이 시작돼 걸려 보였음 →
        # 첫 컷이 화면에서 사라질 때까지(다음 넘김 끝) 감속(ease-out)으로 이어서 움직임
        dur = max(hz[1], FW[1][1] if 1 in FW else ends[0])
        uu = min(1, max(0, T / dur))
        u = 1 - (1 - uu) ** 3
    img = photo(n)
    h, w = img.shape[:2]
    z = (z0 + (z1 - z0) * u) * punch(ci, T)
    full = (h, w) == (H, W)  # 미리 만든 9:16 독립 컷(성능지·가격·자료 카드)은 상자 맞춤 없이 그대로
    # 2026-11-17 검수: 이동 끝점이 사진 밖이면 중간에 가장자리에 걸려 뚝 멈춤(페이드판 마지막 컷 1.5초 정지) →
    # 시작·끝점을 먼저 사진 안으로 넣고 그 사이를 움직여, 컷 끝까지 같은 곡선으로 부드럽게 멈춤
    if not full and not isinstance(kb, list):
        if FADE:
            spx = lambda zz: 1 / max(1.0, zz)
        else:
            spx = lambda zz: min(1.0, W * h / (H * w * max(zz, 1e-3)))
        cl = lambda f, sp: min(max(f, sp / 2), 1 - sp / 2)
        fx0, fx1 = cl(fx0, spx(z0)), cl(fx1, spx(z1))
        if FADE:
            fya, fyb = cl(fy, 1 / max(1.0, z0)), cl(fy, 1 / max(1.0, z1))
            fy = fya + (fyb - fya) * u
    if FADE and not full:
        return box_frame(n, img, fx0 + (fx1 - fx0) * u, fy, z)
    if n in FIT and not full:
        return fit_frame(n, img, fx0 + (fx1 - fx0) * u, z)
    sc = H / h * z
    vw, vh = W / sc, H / sc
    cx = min(max((fx0 + (fx1 - fx0) * u) * w, vw / 2), w - vw / 2)
    cy = min(max(fy * h, vh / 2), h - vh / 2)
    M = np.float32([[sc, 0, W / 2 - cx * sc], [0, sc, H / 2 - cy * sc]])
    AFF[n] = (sc, sc, W / 2 - cx * sc, H / 2 - cy * sc, w, h)  # 스티커가 사진 부위를 따라가도록 이번 프레임 변환 기록
    return cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


FIT = set(getattr(C, 'FIT', []))
AFF = {}  # 사진 번호 → (가로 배율, 세로 배율, x 이동, y 이동, 사진 폭, 사진 높이) 이번 프레임
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


def _photo_y0(fh):
    """상자 맞춤 사진의 위 y. CAPS_UNDER_PHOTO면 아랫선을 PHOTO_BOTTOM에 맞춰 컷마다 사진–자막 간격이 같다."""
    if getattr(C, 'CAPS_UNDER_PHOTO', False) and fh < H * .70:
        # 2026-11-17: PHOTO_DOWN만큼 사진·자막을 함께 내려 위 흐린 띠를 키움 → 칩이 사진에 걸치지 않고 띠 안에 들어감
        return max(150, PHOTO_BOTTOM - fh + getattr(C, 'PHOTO_DOWN', 0))
    return H * .44 - fh / 2


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
    x0 = int((W - fw) / 2); y0 = int(_photo_y0(fh))
    out[y0:y0 + fg.shape[0], x0:x0 + fg.shape[1]] = fg
    AFF[n] = (fw / sw, fh / sh, x0 - (cx - sw / 2) * fw / sw, y0 - (cy - sh / 2) * fh / sh, w, h)
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
    x0 = int(cx - fw / 2); y0 = int(_photo_y0(fh))
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
def dealer_chip(txt, size=40, tilt=-1.5, font=None, hr=2.8, emo=None, tsc=1.0, fill='430_239', sliced=False,
                txt_col=(0, 0, 0), pad=None, ty=0.0, fit_ink=False, tilt_text=True):
    """딜러 칩 = 노션 「스카우트24 테마별」 원본 로고 칠(테마 바탕색_430_239) 그대로, 가로로만 늘림. 색 #F5F200, 글자 검정.
    벨기에판 실측(tags_zoom: €56.490·€180·Auto): 칠 높이 ≈ 대문자 높이 2.8배, 글자 좌우 여백 ≈ 칠 높이 0.2배, 글자는 칠 세로 가운데.
    칠 가장자리가 들쭉날쭉하므로 글자 칸의 모든 세로줄이 칠 안(불투명)에 들 때까지 칠 폭을 넓힘 → 글자 잘림 없음."""
    import sys as _s
    import numpy as _np
    _s.path.insert(0, REPO)
    from brushfill import theme_mask, theme_mask_sliced
    fnt = ImageFont.truetype(font or R.BOLD, size)
    bb = fnt.getbbox(txt, anchor='ls'); tw = bb[2] - bb[0]; th = bb[3] - bb[1]
    cap = size * 0.74
    h = int(round((max(cap, th) if fit_ink else cap) * hr)); m = 12  # fit_ink: 한글은 받침까지 글자 높이가 커서 실제 글자 높이 기준
    badge = int(cap * 1.42) if emo is not None else 0  # 기존 방식: 칠 안, 글자 뒤 흰 원 + 이모지
    gap = int(cap * 0.38) if badge else 0
    cw = tw + gap + badge
    pl, pr = pad or (0.2, 0.2)  # 글자 좌우 여백(칠 높이 비율). 2026-11-19 AS24 로고 실측: 왼 0.18 · 오른 0.24(붓 끝이 뾰족한 쪽을 더 비움)
    w = int(cw + h * (pl + pr))
    for _ in range(30):
        mask = theme_mask_sliced(w, h, fill, margin=m) if sliced else theme_mask(w, h, fill, margin=m)
        dx = dy = 0
        if tilt and not tilt_text:  # 2026-11-19 벨기에 원본(Alfa·Giulia·Opzoek): 칠만 기울이고 글자는 똑바로
            ow, oh = mask.size
            mask = mask.rotate(-tilt, resample=Image.BICUBIC, expand=True)
            dx, dy = (mask.width - ow) / 2, (mask.height - oh) / 2
        A = _np.asarray(mask)
        x0 = dx + m + h * pl + (w - h * (pl + pr) - cw) / 2; y0 = dy + m + (h - th) / 2 + h * ty
        by = m + h / 2 - badge / 2
        sub = A[int(min(y0, by)) - 3:int(max(y0 + th, by + badge)) + 4, int(x0) - 4:int(x0 + cw) + 5]
        if sub.size and sub.min() > 200:
            break
        if fit_ink:  # 비스듬한 칠(432_227)은 가로만 넓히면 끝없이 길어짐 → 높이·폭을 같이 조금씩
            h = int(h * 1.03) + 1; w = int(w * 1.02) + 1
        else:
            w = int(w * 1.04) + 2
    im = Image.new('RGBA', mask.size, (0xF5, 0xF2, 0x00, 0)); im.putalpha(mask)
    rot = 0 if not tilt_text else tilt  # 칠만 기울인 경우 이미 기울어 있음
    if tsc <= 0:  # 벨기에 원본 등장: 빈 노랑 띠가 먼저(글자 없음)
        return im.rotate(-rot, resample=Image.BICUBIC, expand=True)
    tl = Image.new('RGBA', mask.size, (0, 0, 0, 0))  # 글자(+흰 원 이모지) 층: 원본처럼 띠 안에서 작게→크게
    d = ImageDraw.Draw(tl)
    d.text((x0 - bb[0], y0 - bb[1]), txt, font=fnt, fill=txt_col, anchor='ls')
    if badge:
        bx = x0 + tw + gap
        d.ellipse((bx, by, bx + badge, by + badge), fill=(255, 255, 255, 255))
        eh = int(badge * 0.74)
        e = emo.resize((max(1, int(emo.width * eh / emo.height)), eh), Image.LANCZOS)
        if e.width > badge * 0.8:
            e = e.resize((int(badge * 0.8), max(1, int(e.height * badge * 0.8 / e.width))), Image.LANCZOS)
        tl.alpha_composite(e, (int(bx + (badge - e.width) / 2), int(by + (badge - e.height) / 2)))
    if tsc < 1:
        cx, cy = x0 + cw / 2, m + h / 2
        sw, sh = max(1, int(tl.width * tsc)), max(1, int(tl.height * tsc))
        sm = tl.resize((sw, sh), Image.LANCZOS)
        tl = Image.new('RGBA', mask.size, (0, 0, 0, 0))
        tl.alpha_composite(sm, (int(round(cx - cx * tsc)), int(round(cy - cy * tsc))))
    im.alpha_composite(tl)
    out = im.rotate(-rot, resample=Image.BICUBIC, expand=True)
    if not rot:  # 같은 줄 흰 글자를 붙일 기준: 글자 바닥선 y, 글자 줄 높이에서 칠 오른쪽 끝 x
        row = _np.asarray(mask)[int(y0 + th * 0.5)]
        xs = _np.where(row > 128)[0]
        out.info['baseline'] = y0 - bb[1]
        out.info['right'] = int(xs.max()) if xs.size else out.width - m
    return out


_BEC = {}
try:  # 3D 아이콘판(_sticker_core)의 옵션·기능·숫자 칩도 같은 리싱마크트 칠로(이 렌더 안에서만)
    sys.path.insert(0, REPO)
    import brushfill as _bf
    for _k in _bf.THEME_KINDS:
        _bf.THEME_KINDS[_k]['fills'] = [getattr(C, 'CHIP_FILL', '126_40')]
except Exception:
    pass
CHIP_TXT_DELAY = getattr(C, 'CHIP_TXT_DELAY', 1 / 30)  # 띠 뒤 글자 시작(원본 1프레임)
CHIP_TXT_DUR = getattr(C, 'CHIP_TXT_DUR', 0.20)


FLUENT_DIR = os.path.join(os.path.dirname(os.path.abspath(R.__file__)), 'photo_listing', 'fluent3d')  # 렌더 중 작업 폴더가 바뀌므로 모듈 위치 기준


def fluent_emoji(mark, h=112):
    """이모지 글자(여러 개 가능, 예: '❄️🔥')를 fluent3d/<코드포인트>.png 3D 그림으로. 하나라도 없으면 None"""
    ims = []
    for ch in mark:
        if ord(ch) in (0xFE0F, 0x200D):
            continue
        f = os.path.join(FLUENT_DIR, f'{ord(ch):x}.png')
        if not os.path.exists(f):
            return None
        im = Image.open(f).convert('RGBA')
        im = im.crop(im.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox())
        ims.append(im.resize((max(1, round(im.width * h / im.height)), h), Image.LANCZOS))
    if not ims:
        return None
    gap = 6
    out = Image.new('RGBA', (sum(i.width for i in ims) + gap * (len(ims) - 1), h), (0, 0, 0, 0))
    x = 0
    for i in ims:
        out.alpha_composite(i, (x, 0)); x += i.width + gap
    return out


def be_chip(txt, size, tilt, tsc=1.0):
    """벨기에 원본 키워드 칩: 노션 원본 로고 칠(430_239) + 검정 굵은 글자.
    2026-11-17 사용자 「아이콘이 장난 같다, 기존 이모지 쓰자」: MARKS 이모지는 기존(sticker) 방식 그대로 칠 안·글자 뒤 흰 원 위에 작게"""
    tsc = round(max(0.0, min(1.0, tsc)), 2)
    k = (txt, size, tilt, tsc)
    if k in _BEC:
        return _BEC[k]
    mark = getattr(C, 'MARKS', {}).get(txt)
    emo = None
    if mark and mark != '✓':
        emo = fluent_emoji(mark)  # 2026-11-17 사용자: 마이크로소프트 Fluent 3D 이모지 기본(MIT). 없으면 아래 Noto 글꼴로
    if mark and mark != '✓' and emo is None:  # 2026-11-18 사용자 규정: 이모지는 마이크로소프트 Fluent 3D만. 다른 글꼴로 대신하지 않고 멈춤
        raise SystemExit(f'⛔ Fluent 3D 이모지 파일 없음: {mark!r} ({" ".join(f"{ord(c):x}" for c in mark)}) — fluent3d/에 공식 3D PNG를 받아 넣고 다시 렌더')
    # 2026-11-19 사용자: 첫 컷 브랜드·모델 외 타이틀 칩 = 노션 「리싱마크트 메인 사용 칩」(126_40) 칠
    out = dealer_chip(txt, size, tilt, font=R.HEAVY, hr=getattr(C, 'CHIP_HR', 2.4), emo=emo, tsc=tsc, fill=getattr(C, 'CHIP_FILL', '126_40'))
    _BEC[k] = out
    return out


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


def dealer_chip_row(lines, size=34):
    """2026-11-17 사용자: 딜러 칩을 아래(푸터)에 한 줄로 — 노랑 상자(이름, −2°) + 흰 상자(상사, 0°)를 좌우로 붙임.
    상자 규격은 독일식 두 줄 칩(dealer_chip_de)과 같음."""
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
        return im.rotate(-tilt, resample=Image.BICUBIC, expand=True)
    a = box(lines[0], (0xE4, 0xE2, 0x5C, 255), -2.0)
    if len(lines) < 2:
        return a
    b = box(lines[1], (0xF8, 0xF8, 0xF6, 255), 0.0)
    ov = 30  # 흰 상자가 노랑 상자 끝을 살짝 덮음(그림자 여백 24 포함)
    im = Image.new('RGBA', (a.width + b.width - ov, max(a.height, b.height)), (0, 0, 0, 0))
    im.alpha_composite(b, (a.width - ov, (im.height - b.height) // 2))
    im.alpha_composite(a, (0, (im.height - a.height) // 2))
    return im


FOOTER = None
# 2026-11-19 사용자 「판매자·상사도 한 칩으로」: 이름·상사를 한 줄 한 칩으로 — 노션 「테마 바탕색_265_42」(사용자 선택, 긴 한 줄에 원본 비율이 맞아 양 끝 붓 모양이 살아 있음).
#   타이틀 칩(리싱마크트)·첫 컷(430_239)과 모양을 달리해 화면에 오래 떠 있는 판매자 칩이 정보 칩과 섞여 보이지 않게
_DLINES = getattr(C, 'DEALER_CHIP_LINES', [getattr(C, 'DEALER_CHIP', '')]) if getattr(C, 'DEALER_CHIP', None) else []
if _DLINES and getattr(C, 'DEALER_ONE_CHIP', True):
    _one = dealer_chip(' · '.join(x for x in _DLINES if x), getattr(C, 'DEALER_CHIP_SIZE', 34), getattr(C, 'DEALER_CHIP_TILT', -1.5),
                       font=R.BOLD, hr=2.6, fill=getattr(C, 'DEALER_CHIP_FILL', '265_42'))
    if getattr(C, 'DEALER_FOOTER', False):
        FOOTER = _one; LOGO = Image.new('RGBA', (2, 2), (0, 0, 0, 0))
    else:
        LOGO = _one
elif getattr(C, 'DEALER_FOOTER', False) and getattr(C, 'DEALER_CHIP', None):  # 딜러는 아래 한 줄 띠, 위는 포인트 칩 자리
    FOOTER = dealer_chip_row(getattr(C, 'DEALER_CHIP_LINES', [C.DEALER_CHIP]), getattr(C, 'DEALER_CHIP_SIZE', 34))
    LOGO = Image.new('RGBA', (2, 2), (0, 0, 0, 0))
elif getattr(C, 'DEALER_CHIP', None):  # 딜러 이름 칩: 노션 원본 로고 칠
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



_SH = {}


def shadow_text(txt, size, font=None):
    """흰 글자 + 부드러운 검정 그림자(원본 BE 첫 화면 'Model Y' 방식, 외곽선 없음)"""
    k = (txt, size, font)
    if k in _SH:
        return _SH[k]
    from PIL import ImageFilter, ImageFont, ImageDraw
    fnt = ImageFont.truetype(font or R.HEAVY, size)
    bb = fnt.getbbox(txt)
    pad = 24
    im = Image.new('RGBA', (bb[2] - bb[0] + pad * 2, bb[3] - bb[1] + pad * 2), (0, 0, 0, 0))
    sh = Image.new('RGBA', im.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).text((pad - bb[0] + 3, pad - bb[1] + 5), txt, font=fnt, fill=(0, 0, 0, 200), stroke_width=3, stroke_fill=(0, 0, 0, 200))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(7)))
    ImageDraw.Draw(im).text((pad - bb[0], pad - bb[1]), txt, font=fnt, fill=(255, 255, 255, 255))
    im.info['baseline'] = pad - bb[1] + fnt.getmetrics()[0]  # 글자 바닥선 y
    im.info['ink_left'] = pad
    _SH[k] = im
    return im


def photo_band(T):
    """가로 사진을 상자에 맞춘 컷이면 (사진 위 y, 아래 y). 뉴스 릴스처럼 자막은 사진 밑, 칩은 사진 위 띠에 둔다."""
    if not getattr(C, 'CAPS_UNDER_PHOTO', False) or (T < starts[1] and not (FADE and getattr(C, 'PHOTO_DOWN', 0))):
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
    y0 = int(_photo_y0(fh))
    return y0, y0 + fh


def _cut_at(T):
    return max(i for i in range(len(CUTS)) if starts[i] <= T)


def footer_layer(ov, T):
    """아래 한 줄 딜러 띠: 안전선(아래 240) 바로 위. 카드 구간(사진 번호 20~59)은 카드가 길어 숨김. 마지막 딜러 컷에서 커짐"""
    if FOOTER is None:
        return
    ci = _cut_at(T)
    def card(i):
        return 20 <= CUTS[i][0] < 60
    a = 1.0
    if card(ci):
        a = 0.0
    else:
        k = T - starts[ci]
        if ci and card(ci - 1):
            a = min(1.0, k / .25)          # 카드 구간이 끝나면 다시 나타남
        nx = ci + 1
        if nx < len(CUTS) and card(nx):
            a = min(a, max(0.0, (starts[nx] - T) / .2))
    if a <= 0:
        return
    sc = 1.0
    if ci == len(CUTS) - 1:  # 마지막 딜러 컷: 0.4초 동안 1.3배로 커짐(문의 안내)
        sc = 1 + 0.3 * R.ease((T - starts[ci]) / .4)
    F0 = FOOTER
    if getattr(C, 'DEALER_FOOTER_STYLE', '') == 'text':  # 2026-11-17: 아래 딜러는 상자 없이 흰 글자만(칩은 위쪽 몫)
        F0 = shadow_text('  ·  '.join(getattr(C, 'DEALER_CHIP_LINES', [C.DEALER_CHIP])), getattr(C, 'DEALER_FOOTER_TEXT_SIZE', 38))
    im = F0 if sc == 1.0 else F0.resize((int(F0.width * sc), int(F0.height * sc)), Image.LANCZOS)
    _unused = FOOTER if False else None
    if False: im = FOOTER.resize((int(FOOTER.width * sc), int(FOOTER.height * sc)), Image.LANCZOS)
    yb = getattr(C, 'DEALER_FOOTER_Y', H - 250)  # 띠 아랫선
    R.paste(ov, im, (W - im.width) / 2, yb - im.height, a)


def section_layer(ov, T):
    """구간 제목 칩(제원 · 성능점검 · 보험 이력): 카드 남색 머리 왼쪽에 노랑 붓띠, 구간 동안 유지. 등장은 키워드 칩과 같은 벨기에 모션"""
    secs = getattr(C, 'SECTIONS', [])
    if not secs:
        return
    ci = _cut_at(T)
    p = CUTS[ci][0]
    for ids, title, y0 in secs:
        if p not in ids:
            continue
        first = ci
        while first > 0 and CUTS[first - 1][0] in ids:
            first -= 1
        st = starts[first]
        last = ci
        while last + 1 < len(CUTS) and CUTS[last + 1][0] in ids:
            last += 1
        en = starts[last + 1] if last + 1 < len(CUTS) else BODY
        k = T - st
        tk = (k - CHIP_TXT_DELAY) / CHIP_TXT_DUR
        tsc = 0.0 if tk < 0 else (0.2 + 0.8 * (1 - (1 - min(1.0, tk)) ** 3))
        size = getattr(C, 'SECTION_SIZE', 54)
        stl = getattr(C, 'CHIP_TILT_ALL', None) if getattr(C, 'CHIP_TILT_ALL', None) is not None else getattr(C, 'CHIP_TILT_WORD', TILT)
        im = be_chip(title, size, stl, round(tsc * 20) / 20)
        full = be_chip(title, size, stl)
        out = R.ease((en - T) / .15)
        x = 70 + 10
        y = y0 + 64 - full.height / 2
        if getattr(C, 'SECTION_TOP', False):  # 2026-11-17: 구간 제목 칩을 카드 위(포인트 칩 자리 쪽)로, 카드와 겹치지 않게
            x = (W - full.width) / 2
            y = min(getattr(C, 'CHIP_Y', 285) - full.height / 2, y0 - 20 - full.height)
        R.paste(ov, im, x + (full.width - im.width) / 2, y + (full.height - im.height) / 2, out)


_OFF_TAG = None


def official_layer(ov, T):
    """2026-11-17: 제조사 공식 사진 컷에는 오른쪽 위에 「제조사 공식 이미지」 작은 글자 — 매물 실사진과 구분(구매자 오인 방지)"""
    global _OFF_TAG
    offs = getattr(C, 'OFFICIAL_PHOTOS', ())
    if not offs or T >= BODY:
        return
    ci = _cut_at(T)
    if CUTS[ci][0] not in offs:
        return
    # 2026-11-18: 사진마다 다른 출처 글자(OFFICIAL_TAGS = {사진번호: 글자}) — 예: 트렁크 「오토블로그 실측」
    if _OFF_TAG is None:
        _OFF_TAG = {}
    txt = getattr(C, 'OFFICIAL_TAGS', {}).get(CUTS[ci][0], getattr(C, 'OFFICIAL_TAG', '제조사 공식 이미지'))
    if txt not in _OFF_TAG:
        _t = shadow_text(txt, 30)   # 밝은 배경(흰 벽)에서도 읽히게 반투명 검정 알약 위에
        _pill = Image.new('RGBA', (_t.width + 28, _t.height + 12), (0, 0, 0, 0))
        ImageDraw.Draw(_pill).rounded_rectangle((0, 0, _pill.width - 1, _pill.height - 1), _pill.height // 2, fill=(0, 0, 0, 120))
        _pill.alpha_composite(_t, (14, 6))
        _OFF_TAG[txt] = _pill
    tag = _OFF_TAG[txt]
    k = min(1.0, (T - starts[ci]) / .25)
    if ci + 1 < len(CUTS):
        k = min(k, max(0.0, (starts[ci + 1] - T) / .2))
    R.paste(ov, tag, W - 40 - tag.width, getattr(C, 'OFFICIAL_TAG_Y', 104), k)


_STK = {}


def _auto_visuals():
    """v1.5 매뉴얼 13장: AUTO_VISUALS=True면 옵션 낱말 → 컷 → 부위 → Fluent 3D/3D 글자 자동 추가"""
    if not getattr(C, 'AUTO_VISUALS', False):
        return
    sys.path.insert(0, os.path.dirname(os.path.abspath(R.__file__)) + '/photo_listing')
    import auto_visuals
    stk, rep = auto_visuals.build(C, C.W, CUTS)
    for line in rep:
        print('  [옵션 그림] ' + line)
    if any(l.startswith('⛔') for l in rep) and not getattr(C, 'ALLOW_MISSING_REQUIRED', False):
        raise SystemExit('⛔ 매물 필수 옵션이 대본에 없음(매뉴얼 13-2) — 대본에 넣거나 cfg ALLOW_MISSING_REQUIRED=True')
    C.STICKERS = list(getattr(C, 'STICKERS', [])) + stk


def _resolve_stickers():
    """STICKERS 항목에 'part'(backrest·cushion·headrest·steering·screen·wheel)만 적으면 part_anchor.py가 사진에서 부위를 찾아
    u·v·size·box를 채움. 결과는 src2/pNN.anchors.json에 저장해 다음 렌더부터는 모델을 다시 돌리지 않음"""
    out = []
    for sk in getattr(C, 'STICKERS', []):
        if 'part' in sk and 'u' not in sk:
            n = sk['photo']
            f = f'src2/p{n:02d}.anchors.json'
            data = json.load(open(f)) if os.path.exists(f) else {}
            if sk['part'] not in data:
                sys.path.insert(0, os.path.dirname(os.path.abspath(R.__file__)) + '/photo_listing')
                import part_anchor
                data.update(part_anchor.anchors(f'src2/p{n:02d}.png', tuple(set(list(data) + [sk['part']]))))
                json.dump(data, open(f, 'w'), ensure_ascii=False)
            if sk['part'] not in data:
                print(f'⚠ 스티커 부위를 못 찾음: 사진 {n} {sk["part"]} — 이 스티커는 빼고 렌더')
                continue
            sk = {**sk, **data[sk['part']]}
        out.append(sk)
    return out
STK_MIN, STK_MAX = 150, 280  # 스티커 화면 높이 한계(px): 너무 작으면 안 보이고 너무 크면 부위를 가림


def text3d(txt, h=200):
    """2026-11-18 나세르식 입체 숫자(「396 LITER」처럼): 흰 굵은 숫자 + 아래쪽 두께 + 작은 단위. 이모지로는 L 같은 글자가 없어 직접 그림.
    h = 전체 높이(px). 숫자는 Pretendard Black, 단위는 숫자 크기의 0.5배로 숫자 밑줄에 맞춤."""
    m = re.match(r'^([\d.,+]+)\s*(.*)$', txt)
    num, unit = (m.group(1), m.group(2)) if m else (txt, '')
    if re.fullmatch(r'[\d\s:.,]+', txt):   # 40 : 20 : 40 같은 비율은 전부 숫자 크기
        num, unit = txt, ''
    fs = int(h / 0.78)
    fn = ImageFont.truetype(R.HEAVY, fs)
    fu = ImageFont.truetype(R.HEAVY, int(fs * 0.5))
    d0 = ImageDraw.Draw(Image.new('L', (1, 1)))
    nb = d0.textbbox((0, 0), num, font=fn, anchor='ls')
    ub = d0.textbbox((0, 0), unit, font=fu, anchor='ls') if unit else (0, 0, 0, 0)
    gap = int(fs * 0.06) if unit else 0
    depth = max(3, int(h * 0.07))
    sw = max(2, int(h * 0.015))   # 2026-11-18 크로스체크: 흰 배경(트렁크 벽)에서 흐려 보여 얇은 검은 외곽선
    pad = 4 + sw
    Wt = (nb[2] - nb[0]) + gap + (ub[2] - ub[0]) + depth + pad * 2
    top = min(nb[1], ub[1])
    Ht = -top + depth + pad * 2
    def draw_text(d, dx, dy, fill, stroke=0):
        x = pad + dx - nb[0]; y = pad + dy - top
        kw = dict(stroke_width=stroke, stroke_fill=fill) if stroke else {}
        d.text((x, y), num, font=fn, fill=fill, anchor='ls', **kw)
        if unit:
            d.text((x + nb[2] + gap - ub[0], y), unit, font=fu, fill=fill, anchor='ls', **kw)
    out = Image.new('RGBA', (Wt, Ht), (0, 0, 0, 0))
    d = ImageDraw.Draw(out)
    draw_text(d, depth * 0.5, depth, (25, 27, 30, 230), stroke=sw)   # 외곽선(두께 끝)
    for k in range(depth, 0, -1):   # 두께: 뒤쪽일수록 어두운 회색
        c = int(120 + 60 * (1 - k / depth))
        draw_text(d, k * 0.5, k, (c, c + 4, c + 10, 255))
    draw_text(d, 0, 0, (25, 27, 30, 230), stroke=sw)                 # 외곽선(앞면): 두께 위에
    face = Image.new('L', out.size, 0)
    draw_text(ImageDraw.Draw(face), 0, 0, 255)
    grad = Image.new('RGBA', out.size)
    gd = ImageDraw.Draw(grad)
    for yy in range(out.height):   # 앞면: 위 흰색 → 아래 아주 옅은 회색
        v = int(255 - 22 * yy / max(1, out.height))
        gd.line([(0, yy), (out.width, yy)], fill=(v, v, min(255, v + 3), 255))
    out.paste(grad, (0, 0), face)
    return out


def sticker_img(sk, h):
    if sk.get('text3d'):
        return text3d(sk['text3d'], h)
    im = fluent_emoji(sk['emo'], h)
    if im is None:  # 2026-11-18: Fluent 3D만 허용
        raise SystemExit(f'⛔ Fluent 3D 이모지 파일 없음: {sk["emo"]!r} — fluent3d/에 공식 3D PNG를 받아 넣고 다시 렌더')
    return im


_ASP = {}


def sticker_layer(ov, T):
    """2026-11-17 나세르식: 실제 사진의 해당 부위 옆에 3D 이모지가 말에 맞춰 톡 튀어나와 떠 있음.
    STICKERS = [{'w': 어절 번호, 'emo': '❄️', 'x': 중심x, 'y': 중심y, 'h': 높이, 'tilt': 각도}] — 그 어절이 든 컷이 끝날 때까지 유지"""
    for i, sk in enumerate(STICKERS_R):
        t0 = onset(sk['w']) - 0.05
        ci = _cut_at(max(t0, 0))
        t1 = ends[ci] - 0.12
        if not (t0 <= T < t1):
            continue
        key = (sk.get('text3d') or sk['emo'], sk.get('h', 200), sk.get('tilt', 0))
        if key not in _STK:
            im = sticker_img(sk, sk.get('h', 200))
            if im is None:
                continue
            if sk.get('tilt'):
                im = im.rotate(sk['tilt'], resample=Image.BICUBIC, expand=True)
            sh = Image.new('RGBA', (im.width + 60, im.height + 60), (0, 0, 0, 0))
            a = im.getchannel('A').point(lambda v: int(v * .45))
            sh.paste(Image.new('RGBA', im.size, (0, 0, 0, 255)), (30, 42), a)
            sh = sh.filter(ImageFilter.GaussianBlur(12))
            sh.alpha_composite(im, (30, 30))
            _STK[key] = sh
        im = _STK[key]
        x, y = sk.get('x'), sk.get('y')
        if 'u' in sk:  # 2026-11-18: 사진 안 좌표(part_anchor.py 결과) → 이번 프레임 사진 변환을 그대로 따라감
            n = CUTS[ci][0]
            if n not in AFF:
                continue
            ax, ay, ox, oy, pw, ph = AFF[n]
            x, y = sk['u'] * pw * ax + ox, sk['v'] * ph * ay + oy
            hh = sk['h'] if sk.get('fixed') else min(sk.get('hmax', STK_MAX), max(STK_MIN, sk['size'] * pw * ax))
            if sk.get('fit') and sk.get('box'):   # v1.6: 부위 크기에 맞춤(휠 인치 = 휠 상자 높이의 비율, 사진 확대를 따라감)
                fr, fmin, fmax = sk['fit'][:3]
                ext = (sk['box'][2] - sk['box'][0]) * pw * ax if sk['fit'][3:] == ('w',) else (sk['box'][3] - sk['box'][1]) * ph * ay
                hh = int(min(fmax, max(fmin, fr * ext)) // 4 * 4)
                if sk.get('tire_sub') and sk.get('grp_fit'):   # v1.7.2: 타이어 규격 = 인치 글자의 0.55배(인치보다 커지지 않게, 최소 52px)
                    gr, gmin, gmax = sk['grp_fit'][:3]
                    ih_ = int(min(gmax, max(gmin, gr * (sk['box'][3] - sk['box'][1]) * ph * ay)) // 4 * 4)
                    hh = int(max(52, min(hh, ih_ * .55)) // 4 * 4)
            if sk.get('fit_w') and sk.get('box') and sk.get('text3d'):   # v1.7: 부위에 붙는 숫자는 글자 폭 ≤ 부위 폭 × fit_w(긴 「40 : 20 : 40」이 등받이를 덮지 않게)
                bw = min((sk['box'][2] - sk['box'][0]) * pw * ax, W - 120)
                asp = _ASP.setdefault(sk['text3d'], (lambda t: t.width / max(1, t.height))(text3d(sk['text3d'], 100)))
                hh = int(max(sk.get('min_h', 64), min(hh, sk['fit_w'] * bw / asp)) // 4 * 4)
            if abs(hh - im.height + 60) > 4:
                key2 = key + (int(hh),)
                if key2 not in _STK:
                    base = sticker_img(sk, int(hh))
                    if sk.get('tilt'):
                        base = base.rotate(sk['tilt'], resample=Image.BICUBIC, expand=True)
                    sh = Image.new('RGBA', (base.width + 60, base.height + 60), (0, 0, 0, 0))
                    a = base.getchannel('A').point(lambda v: int(v * .45))
                    sh.paste(Image.new('RGBA', base.size, (0, 0, 0, 255)), (30, 42), a)
                    sh = sh.filter(ImageFilter.GaussianBlur(12)); sh.alpha_composite(base, (30, 30))
                    _STK[key2] = sh
                im = _STK[key2]
            # 화면 밖(세로 자르기로 잘린 쪽)이면 부위 상자의 보이는 부분 안으로 옮김
            half_w = im.width / 2 - 30
            if sk.get('box') and (sk.get('above') or sk.get('place') in ('tire_top', 'inside', 'seat_row')):   # v1.5: 위에 띄우는 그림은 부위 폭에 갇히지 않고 화면 안으로만
                x = min(max(x, half_w + 60), W - 60 - half_w)
            elif sk.get('box'):
                bx0, bx1 = sk['box'][0] * pw * ax + ox, sk['box'][2] * pw * ax + ox
                lo_x, hi_x = max(bx0, 60) + half_w, min(bx1, W - 60) - half_w
                if lo_x <= hi_x:
                    x = min(max(x, lo_x), hi_x)
                else:
                    continue  # 부위가 화면에 거의 안 보이면 스티커를 띄우지 않음
            x += sk.get('dx', 0)
            half = im.height / 2 - 30
            if sk.get('place') == 'tire_top' and sk.get('box'):   # 휠 인치: 타이어 윗부분(휠 상자 위 25%)에 가운데
                bx0, by0, bx1, by1 = (sk['box'][0] * pw * ax + ox, sk['box'][1] * ph * ay + oy, sk['box'][2] * pw * ax + ox, sk['box'][3] * ph * ay + oy)
                x = min(max((bx0 + bx1) / 2, half_w + 60), W - 60 - half_w)
                y = by0 + 0.25 * (by1 - by0)
                if sk.get('grp_sub') or sk.get('tire_sub'):   # v1.7: 휠 인치 + 타이어 규격 한 묶음(인치 바로 아래 6px, 자막 띠와 겹치면 둘 다 위로)
                    _fh = lambda f: int(min(f[2], max(f[1], f[0] * (by1 - by0))) // 4 * 4)
                    ih_, sh_ = (_fh(sk['grp_fit']), hh) if sk.get('tire_sub') else (hh, int(max(52, min(_fh(sk['grp_sub']), hh * .55)) // 4 * 4))
                    nl = sk.get('sub_n', 1)
                    bot = y + ih_ * .6 + 10 + sh_ * (1.2 + 1.12 * (nl - 1))
                    if bot > CAP_TOP - 20 and y - ih_ * .6 < CAP_TOP + 150:
                        y -= bot - (CAP_TOP - 28)
                    if sk.get('tire_sub'):
                        y += ih_ * .6 + 10 + sh_ * (.6 + 1.12 * sk.get('sub_idx', 0))
            elif sk.get('place') == 'inside' and sk.get('box'):   # 트렁크 리터: 적재 공간 안(상자 위에서 45%, 자막과 띄움)
                bx0, by0, bx1, by1 = (sk['box'][0] * pw * ax + ox, sk['box'][1] * ph * ay + oy, sk['box'][2] * pw * ax + ox, sk['box'][3] * ph * ay + oy)
                x = min(max((bx0 + bx1) / 2, half_w + 60), W - 60 - half_w)
                y = by0 + 0.45 * (by1 - by0)
            elif sk.get('place') == 'seat_row' and sk.get('box'):   # v1.6.1: 시트 묶음 — 등받이 상자(OWLv2) 폭에 맞춘 크기·간격, 등받이 윗부분에 한 줄
                bx0, by0, bx1, by1 = (sk['box'][0] * pw * ax + ox, sk['box'][1] * ph * ay + oy, sk['box'][2] * pw * ax + ox, sk['box'][3] * ph * ay + oy)
                fr, fmin, fmax = sk['row_fit']
                ih = int(min(fmax, max(fmin, fr * (bx1 - bx0))) // 4 * 4)   # 아이콘 높이(묶음 공통)
                n_, k_ = sk['seat_n'], sk.get('seat_idx', 0)
                gap = ih * sk.get('row_gap', 1.15)
                rw = n_ * gap / 2
                xc = min(max((bx0 + bx1) / 2, rw + 60), W - 60 - rw)
                vis0, vis1 = max(by0, getattr(C, 'CHIP_Y', 285) + 110), min(by1, H - 400)   # v1.8.3: 아래 딜러 띠와 최소 60px 더 띄움(컷 7 🔥❄️가 딜러 칩에 붙던 일)
                yc = by0 + sk.get('row_v', 0.35) * (by1 - by0)
                yc = min(max(yc, vis0 + ih / 2), vis1 - ih / 2) if vis1 - vis0 > ih else (vis0 + vis1) / 2
                c0, c1 = CAP_TOP - 20, CAP_TOP + 150   # 말 자막 띠를 피함: 위에 자리가 있으면 위, 없으면 아래
                if yc + ih / 2 > c0 and yc - ih / 2 < c1:   # 시트는 화면 아래쪽에 있으므로 자막 아래 칸을 먼저(그 칸이 등받이 안일 때)
                    below, above = c1 + ih / 2 + 8, c0 - ih / 2 - 8
                    yc = above if above - ih / 2 >= vis0 - 4 else (below if below + ih / 2 <= vis1 + 4 else above)   # v1.8.3: 자막 위 칸 먼저(아래 칸은 딜러 띠와 붙음)
                if 'seat_idx' in sk:
                    x, y = xc + (k_ - (n_ - 1) / 2) * gap, yc
                else:   # 재질 3D 글자: 아이콘 줄 바로 위
                    x, y = xc, yc - ih / 2 - half - 10
            elif sk.get('above') and sk.get('box'):   # v1.5: 3D 글자는 부위 바로 위(화면 2% 띄움), 위에 자리가 없으면 부위 가운데
                ya = sk['box'][1] * ph * ay + oy - half - 0.02 * H
                if ya - half > 250:
                    y = ya
                else:   # 위에 자리가 없으면 부위 오른쪽 위 모서리 안쪽(가운데를 가리지 않게)
                    bx1 = sk['box'][2] * pw * ax + ox
                    x = min(bx1, W - 60) - half_w - 20
                    y = max(sk['box'][1] * ph * ay + oy, 250) + half + 20
            # 자막 띠·아래 딜러 띠와 겹치면 부위 상자 안에서 위로 올림(부위 밖으로는 안 나감)
            for lo, hi in ((CAP_TOP - 20, CAP_TOP + 150), (H - 340, H)):
                if y + half > lo and y - half < hi:
                    if sk.get('place') == 'seat_row' or sk.get('grp_sub') or sk.get('tire_sub'):
                        continue   # 시트 줄·휠 인치+타이어 묶음은 위에서 자막·딜러 띠 사이로 이미 맞춤
                    top_box = sk['box'][1] * ph * ay + oy if sk.get('box') and sk.get('place') not in ('tire_top', 'inside') else 0
                    y = max(top_box + half, lo - half - (40 if sk.get('place') == 'inside' else 8))
        if 'u' not in sk:
            x = (x or 0) + sk.get('dx', 0)
            if sk.get('under_chip'):
                y = getattr(C, 'CHIP_Y', 285) + 80 + (im.height / 2 - 30)
        elif sk.get('auto'):   # 자동 그림은 위 칩 띠(칩 아래 끝까지)를 피함 — 770 L이 1,700L 칩에 가리던 일(전수조사)
            top_ok = getattr(C, 'CHIP_Y', 285) + 110 + (im.height / 2 - 30)
            if y < top_ok:
                y = top_ok
        if sk.get('auto') and CUTS[ci][0] in AFF:   # 페이드형(사진 상자 맞춤): 자동 그림이 사진 테두리에 걸치지 않게 사진 안으로
            _ax, _ay, _ox, _oy, _pw, _ph = AFF[CUTS[ci][0]]
            ptop, pbot = _oy, _oy + _ph * _ay
            hh2 = im.height / 2 - 30
            if ptop > 40 and pbot - ptop > 2 * hh2 + 40:
                y = min(max(y, ptop + hh2 + 16), pbot - hh2 - 16)
        k = (T - t0) / .32
        if sk.get('appear') == 'instant':
            k = 1.0
        sc = R.back(min(1.0, k)) if k < 1 else 1.0
        sc = max(0.01, sc)
        fade = min(1.0, max(0.0, (t1 - T) / .15))
        fy = 8 * math.sin((T - t0) * 2.4 + sk.get('phase', i))
        w2 = max(1, int(im.width * sc)); h2 = max(1, int(im.height * sc))
        im2 = im.resize((w2, h2), Image.LANCZOS)
        R.paste(ov, im2, x - w2 / 2, y - h2 / 2 + fy, min(1.0, k * 3) * fade)


_auto_visuals()
STICKERS_R = _resolve_stickers()


_PTR = {}
_TIP = {'👆': (.40, .02, 0, -1), '👇': (.60, .98, 0, 1), '👉': (.98, .55, 1, 0), '👈': (.02, .45, -1, 0)}  # 손끝 위치(그림 비율)·가리키는 방향


def _ptr_target(p, T, ci):
    """손가락이 가리킬 화면 점. 'chip': 칩 글자 → 그 칩의 오른쪽 아래 끝 / 'u','v': 사진 안 좌표(프레임 변환 따라감) / 'x','y': 화면 좌표"""
    if p.get('chip'):
        txt = p['chip']
        for (t, st, en) in CHIPS:
            if t == txt and st <= T < en:
                num = is_num_chip(t)
                full = be_chip(t, chip_px(t, num), getattr(C, 'CHIP_TILT_ALL', TILT) or 0)
                cy = getattr(C, 'CHIP_Y', None) or (H * .28 if num else CAP_CY - 70 - full.height / 2)
                return W / 2 + full.width * p.get('cx', .30), cy + full.height * p.get('cy', .30)
        return None
    if 'u' in p:
        n = CUTS[ci][0]
        if n not in AFF:
            return None
        ax, ay, ox, oy, pw, ph = AFF[n]
        return p['u'] * pw * ax + ox, p['v'] * ph * ay + oy
    return p['x'], p['y']


_MC = ((json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'option_visual_rules.json'))).get('layout') or {}).get('mileage_circle'))


def mileage_circle(ov, cx, cy, rx, ry, k, alpha=1.0):
    """주행거리 원: k = 칩이 뜬 뒤 초. 시계 방향으로 그려지며 끝이 살짝 겹치고, 반지름이 조금씩 흔들려 손 그림처럼."""
    p = (k - _MC['delay']) / _MC['draw']
    if p <= 0:
        return
    p = 1 - (1 - min(1.0, p)) ** 2
    span = (360 + _MC['overshoot_deg']) * p
    a0 = -150
    S = 2
    pad = _MC['width'] * 2 + 12
    lay = Image.new('RGBA', (int((rx * 2 + pad * 2) * S), int((ry * 2 + pad * 2) * S)), (0, 0, 0, 0))
    pts = []
    n = max(2, int(span / 3))
    for j in range(n + 1):
        a = math.radians(a0 + span * j / n)
        wob = 1 + 0.035 * math.sin(3 * a + 0.7) + 0.02 * (j / n)   # 끝으로 갈수록 살짝 바깥(손 그림)
        pts.append(((rx * wob * math.cos(a) + rx + pad) * S, (ry * wob * math.sin(a) + ry + pad) * S))
    col = tuple(_MC['color']) + (int(255 * alpha),)
    ImageDraw.Draw(lay).line(pts, fill=col, width=_MC['width'] * S, joint='curve')
    lay = lay.resize((lay.width // S, lay.height // S), Image.LANCZOS)
    ov.alpha_composite(lay, (int(cx - rx - pad), int(cy - ry - pad)))


_ODO = 'unset'


def _odometer():
    """v1.7.2 사용자 규칙: 원은 칩이 아니라 사진 속 진짜 계기판 주행거리 숫자에. 사진에서 안 읽히면 None(원 없음)."""
    global _ODO
    if _ODO != 'unset':
        return _ODO
    _ODO = None
    if not _MC:
        return None
    import odometer
    km, approx = (getattr(C, 'ODOMETER_KM', None), False)
    wi = None
    if not km:
        for c in CUTS:
            if c[4] and re.match(_MC['chip_re'], c[4][0]):
                (km, approx), wi = odometer.km_value(c[4][0]), c[4][1]
                break
    photos = sorted({c[0] for c in CUTS})
    hit = odometer.find(os.path.join(SC, 'src2'), photos, km, approx) if km else None
    if hit:
        hit['w'] = wi
        print(f"  [주행거리 원] 사진 p{hit['photo']:02d} 계기판 숫자 「{hit['text']}」 → 원", flush=True)
    else:
        print(f"  [주행거리 원] 사진에서 주행거리 숫자({km}) 안 읽힘 → 원 없음", flush=True)
    _ODO = hit
    return hit


def odometer_layer(ov, T):
    hit = _odometer()
    if not hit:
        return
    ci = _cut_at(T)
    n = CUTS[ci][0]
    if n != hit['photo'] or n not in AFF:
        return
    t0 = onset(hit['w']) if hit.get('w') is not None and starts[ci] <= onset(hit['w']) < ends[ci] else starts[ci] + 0.4
    if T < t0:
        return
    ax, ay, ox, oy, pw, ph = AFF[n]
    u0, v0, u1, v1 = hit['box']
    x0, y0, x1, y1 = u0 * pw * ax + ox, v0 * ph * ay + oy, u1 * pw * ax + ox, v1 * ph * ay + oy
    mileage_circle(ov, (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2 + _MC['pad'][0], (y1 - y0) / 2 + _MC['pad'][1], T - t0)


def pointer_layer(ov, T):
    """2026-11-18 사용자 「캡컷 스티커처럼 손가락으로 주행거리 등 애니 효과」:
    Fluent 3D 손가락이 톡 튀어나와 대상을 2~3번 두드리고(누를 때 살짝 눌림), 두드릴 때마다 흰 물결 원이 퍼짐.
    POINTERS = [{'w': 어절 번호, 'emo': '👆', 'chip': '32,770km' | 'u':.., 'v':.. | 'x':.., 'y':.., 'h': 150, 'taps': 3, 'dur': 1.6}]"""
    for i, p in enumerate(getattr(C, 'POINTERS', [])):
        t0 = onset(p['w']) + p.get('delay', 0.0)
        ci = _cut_at(max(t0, 0))
        t1 = min(ends[ci] - 0.12, t0 + p.get('dur', 1.7))
        if not (t0 <= T < t1):
            continue
        tgt = _ptr_target(p, T, ci)
        if tgt is None:
            continue
        emo = p.get('emo', '👆'); h = p.get('h', 150)
        key = (emo, h)
        if key not in _PTR:
            im = fluent_emoji(emo, h)
            if im is None:
                raise SystemExit(f'⛔ Fluent 3D 이모지 파일 없음: {emo!r}')
            sh = Image.new('RGBA', (im.width + 60, im.height + 60), (0, 0, 0, 0))
            a = im.getchannel('A').point(lambda v: int(v * .5))
            sh.paste(Image.new('RGBA', im.size, (0, 0, 0, 255)), (34, 44), a)
            sh = sh.filter(ImageFilter.GaussianBlur(10)); sh.alpha_composite(im, (30, 30))
            _PTR[key] = (sh, im.size)
        sh, (iw, ih) = _PTR[key]
        fx, fy, dx, dy = _TIP.get(emo, _TIP['👆'])
        k = T - t0
        pop = R.back(min(1.0, k / .25)) if k < .25 else 1.0
        taps = p.get('taps', 3); period = .42; tk = k - .28
        push = 0.0; ph_ = -1
        if 0 <= tk < taps * period:
            ph_ = tk % period
            push = math.sin(math.pi * min(1.0, ph_ / (period * .55))) if ph_ < period * .55 else 0.0
        back = 26 - 20 * push  # 손끝과 대상 사이 거리(누르면 가까워짐)
        squash = 1 - .08 * push
        out = min(1.0, (t1 - T) / .15)
        w2 = max(1, int(sh.width * pop * squash)); h2 = max(1, int(sh.height * pop * (2 - squash)))
        im2 = sh.resize((w2, h2), Image.LANCZOS)
        tipx = (30 + fx * iw) * w2 / sh.width; tipy = (30 + fy * ih) * h2 / sh.height
        x = tgt[0] - tipx - dx * back; y = tgt[1] - tipy - dy * back
        # 물결: 두드림마다 대상 점에서 퍼지는 흰 원(캡컷 탭 스티커 느낌)
        if 0 <= tk < taps * period + .35:
            for j in range(taps):
                rk = (tk - j * period - .12) / .38
                if 0 <= rk < 1:
                    r = 14 + 58 * R.ease(rk); al = int(200 * (1 - rk))
                    rg = Image.new('RGBA', (int(r * 2 + 12), int(r * 2 + 12)), (0, 0, 0, 0))
                    ImageDraw.Draw(rg).ellipse((6, 6, 6 + 2 * r, 6 + 2 * r), outline=(255, 255, 255, al), width=6)
                    ov.alpha_composite(rg, (int(tgt[0] - r - 6), int(tgt[1] - r - 6)))
        R.paste(ov, im2, x, y, min(1.0, k * 6) * out)


_TAGIM = {}


def tag_layer(ov, T):
    """2026-11-18 사용자 「휠에 인치 숫자, 스피커에 스피커명 — 오토스카우트 칩」:
    사진 속 부위 점(u, v)에 흰 점 고리 + 짧은 선 + 오토스카우트식 파랑(#306BD9) 둥근 칩·흰 굵은 글자. 사진이 움직이면 따라감.
    TAGS = [{'w': 어절, 'u': .., 'v': .., 'text': '21인치', 'dx': 120, 'dy': -140, 'size': 54}] — 그 어절이 든 컷 끝까지"""
    for i, tg in enumerate(getattr(C, 'TAGS', [])):
        t0 = onset(tg['w']) - 0.06
        ci = _cut_at(max(t0, 0))
        t1 = ends[ci] - 0.1
        if not (t0 <= T < t1):
            continue
        n = CUTS[ci][0]
        if n not in AFF:
            continue
        ax, ay, ox, oy, pw, ph = AFF[n]
        px, py = tg['u'] * pw * ax + ox, tg['v'] * ph * ay + oy
        key = (tg['text'], tg.get('size', 54))
        if key not in _TAGIM:
            f = ImageFont.truetype(R.BLACK, key[1])
            d0 = ImageDraw.Draw(Image.new('RGBA', (8, 8)))
            bb = d0.textbbox((0, 0), tg['text'], font=f)
            tw, th = bb[2] - bb[0], bb[3] - bb[1]
            pad_x, pad_y = int(key[1] * .5), int(key[1] * .34)
            cw, ch = tw + pad_x * 2, th + pad_y * 2
            im = Image.new('RGBA', (cw + 40, ch + 40), (0, 0, 0, 0))
            sh = Image.new('L', im.size, 0)
            ImageDraw.Draw(sh).rounded_rectangle((20, 26, 20 + cw, 26 + ch), ch // 2, fill=130)
            sh = sh.filter(ImageFilter.GaussianBlur(9))
            im.paste(Image.new('RGBA', im.size, (0, 0, 0, 255)), (0, 0), sh)
            d = ImageDraw.Draw(im)
            d.rounded_rectangle((20, 20, 20 + cw, 20 + ch), ch // 2, fill=(48, 107, 217, 255))
            d.text((20 + cw / 2, 20 + ch / 2), tg['text'], font=f, fill=(255, 255, 255), anchor='mm')
            _TAGIM[key] = im
        im = _TAGIM[key]
        k = T - t0
        e = R.ease(min(1.0, k / .28))
        out = min(1.0, (t1 - T) / .15)
        cx, cy = px + tg.get('dx', 120), py + tg.get('dy', -150)
        cx = min(max(cx, im.width / 2 + 20), W - im.width / 2 - 20)
        # 선 + 점 고리
        lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(lay)
        lx, ly = px + (cx - px) * e, py + (cy - py) * e
        al = int(255 * out)
        d.line([(px, py), (lx, ly)], fill=(255, 255, 255, al), width=6)
        r = 16 + 4 * math.sin(k * 5)
        d.ellipse((px - r, py - r, px + r, py + r), outline=(255, 255, 255, al), width=6)
        d.ellipse((px - 7, py - 7, px + 7, py + 7), fill=(48, 107, 217, al))
        ov.alpha_composite(lay)
        sc = max(0.01, R.back(min(1.0, max(0.0, (k - .12) / .3))))
        w2, h2 = max(1, int(im.width * sc)), max(1, int(im.height * sc))
        R.paste(ov, im.resize((w2, h2), Image.LANCZOS), cx - w2 / 2, cy - h2 / 2, out * min(1.0, k * 5))


_DIM = {}


def dim_layer(ov, T):
    """2026-11-18 나세르식 치수선(비교형): 사진 속 두 점(a → b, 사진 비율 좌표)을 잇는 흰 치수선 + b 쪽 끝 'ext' 비율만큼 노란 구간
    (= 비교 대상보다 늘어난 부분) + 3D 숫자 + 작은 비교 대상 글자. 길이는 강조용이며 실제 축척이 아니다.
    DIM_LINES = [{'w': 어절, 'photo': n, 'a': (u, v), 'b': (u, v), 'ext': .35, 'label': '+72mm', 'sub': '…대비', 'side': -1}]
    side = 숫자를 둘 쪽(선의 법선 방향, -1 위 / 1 아래)"""
    for i, dl in enumerate(getattr(C, 'DIM_LINES', [])):
        t0 = onset(dl['w']) - 0.2
        ci = _cut_at(max(t0, 0))
        t1 = ends[ci] - 0.12
        if not (t0 <= T < t1):
            continue
        n = CUTS[ci][0]
        if n != dl['photo'] or n not in AFF:
            continue
        ax, ay, ox, oy, pw, ph = AFF[n]
        A = np.array([dl['a'][0] * pw * ax + ox, dl['a'][1] * ph * ay + oy])
        B = np.array([dl['b'][0] * pw * ax + ox, dl['b'][1] * ph * ay + oy])
        L = float(np.linalg.norm(B - A))
        if L < 40:
            continue
        d = (B - A) / L
        nrm = np.array([-d[1], d[0]])
        if nrm[1] > 0:
            nrm = -nrm          # 기본은 위쪽
        nrm = nrm * dl.get('side', 1)
        fade = min(1.0, max(0.0, (t1 - T) / .15))
        k1 = R.ease(min(1.0, (T - t0) / .30))                      # 흰 선: 가운데에서 양끝으로
        k2 = R.ease(min(1.0, max(0.0, (T - t0 - .30) / .30)))      # 노란 구간: 이어서 늘어남
        P = A + (B - A) * (1 - dl.get('ext', .35))                 # 흰 선과 노란 구간의 경계
        lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        g = ImageDraw.Draw(lay)
        M = (A + P) / 2
        wa, wb = M + (A - M) * k1, M + (P - M) * k1
        tk = 26
        def seg(p, q, col, w):
            g.line([tuple(p), tuple(q)], fill=(18, 20, 24, 210), width=w + 6)
            g.line([tuple(p), tuple(q)], fill=col, width=w)
        def tick(p, col):
            seg(p - nrm * tk, p + nrm * tk, col, 6)
        if dl.get('single'):
            # 2026-11-18 사용자: 「선은 하나만, 나세르처럼」 — 흰 선 하나 + 양끝 화살촉(끝점을 가리킴), 구간 나눔·눈금 없음
            k2 = R.ease(min(1.0, max(0.0, (T - t0 - .25) / .30)))   # 숫자는 선이 다 그려진 뒤
            M = (A + B) / 2
            hl = 26                                    # 화살촉 길이
            pa, pb = M + (A - M) * k1, M + (B - M) * k1
            ia, ib = pa + d * hl * .8, pb - d * hl * .8  # 선은 화살촉 밑에서 멈춤
            seg(ia if k1 >= 1 else pa, ib if k1 >= 1 else pb, (255, 255, 255, 255), 9)
            if k1 >= 1:
                for tip, s_ in ((A, -1), (B, 1)):
                    back = tip - d * s_ * hl
                    pts = [tuple(tip), tuple(back + nrm * 16), tuple(back - nrm * 16)]
                    g.polygon(pts, fill=(255, 255, 255, 255), outline=(18, 20, 24, 210))
            P = A
        else:
            seg(wa, wb, (255, 255, 255, 255), 9)
        if dl.get('single'):
            pass
        elif k1 >= 1:
            tick(A, (255, 255, 255, 255))
        if k2 > 0 and not dl.get('single'):
            Q = P + (B - P) * k2
            seg(P, Q, (238, 239, 5, 255), 11)
            tick(P, (255, 255, 255, 255))
            if k2 >= 1:
                tick(B, (238, 239, 5, 255))
                for e_, s_ in ((B, 1), (A, -1)):           # 양끝 바깥 화살촉
                    tip = e_ + d * s_ * 30
                    col = (238, 239, 5, 255) if s_ == 1 else (255, 255, 255, 255)
                    pts = [tuple(tip), tuple(e_ + nrm * 14 + d * s_ * 6), tuple(e_ - nrm * 14 + d * s_ * 6)]
                    g.polygon(pts, fill=col, outline=(18, 20, 24, 210))
        sh = lay.filter(ImageFilter.GaussianBlur(5))
        sha = sh.getchannel('A').point(lambda v: int(v * .5))
        base = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        base.paste(Image.new('RGBA', (W, H), (0, 0, 0, 255)), (0, 4), sha)
        base.alpha_composite(lay)
        if fade < 1:
            base.putalpha(base.getchannel('A').point(lambda v: int(v * fade)))
        ov.alpha_composite(base)
        if k2 <= 0:
            continue
        key = ('dim', i)
        if key not in _DIM:
            num = text3d(dl['label'], dl.get('h', 120))
            sub = shadow_text(dl['sub'], 30) if dl.get('sub') else None
            pill = None
            if sub:
                pill = Image.new('RGBA', (sub.width + 28, sub.height + 12), (0, 0, 0, 0))
                ImageDraw.Draw(pill).rounded_rectangle((0, 0, pill.width - 1, pill.height - 1), pill.height // 2, fill=(0, 0, 0, 140))
                pill.alpha_composite(sub, (14, 6))
            wv = max(num.width, pill.width if pill else 0)
            hv = num.height + (pill.height + 8 if pill else 0)
            box = Image.new('RGBA', (wv + 60, hv + 60), (0, 0, 0, 0))
            a = num.getchannel('A').point(lambda v: int(v * .45))
            box.paste(Image.new('RGBA', num.size, (0, 0, 0, 255)), (30 + (wv - num.width) // 2, 42), a)
            box = box.filter(ImageFilter.GaussianBlur(12))
            box.alpha_composite(num, (30 + (wv - num.width) // 2, 30))
            if pill:
                box.alpha_composite(pill, (30 + (wv - pill.width) // 2, 30 + num.height + 8))
            _DIM[key] = box
        im = _DIM[key]
        mid = (P + B) / 2 + nrm * (abs(nrm[0]) * (im.width / 2 - 20) + abs(nrm[1]) * (im.height / 2 - 20) + 14)
        x = min(max(mid[0], im.width / 2 + 20), W - im.width / 2 - 20)
        y = min(max(mid[1], im.height / 2 + 200), CAP_TOP - 30 - im.height / 2)
        sc = max(0.01, R.back(min(1.0, k2)))
        w2, h2 = max(1, int(im.width * sc)), max(1, int(im.height * sc))
        R.paste(ov, im.resize((w2, h2), Image.LANCZOS), x - w2 / 2, y - h2 / 2, fade * min(1.0, k2 * 3))


def overlay(T):
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ov.alpha_composite(LOGO, LOGO_XY)
    footer_layer(ov, T)
    official_layer(ov, T)
    sticker_layer(ov, T)
    dim_layer(ov, T)
    section_layer(ov, T)
    HD = getattr(C, 'HOOK_DELAY', 0.0)  # 엠블럼 확대 동안 타이틀을 늦게 올림
    HE = FW[1][0] if 1 in FW else starts[1]  # 첫 페이드가 시작되기 전에 제목을 내림
    if getattr(C, 'HOOK_HOLD', False) and 1 in FW:  # 2026-11-17: 제목을 넘김 끝 직전까지(약 2초) 유지
        HE = FW[1][1] - 0.08
    if HD <= T < HE:  # 첫 화면: 「페라리」 노랑 칩 + 같은 줄 흰 큰 글자 + 아래 한 줄
        T0 = T; T = T - HD
        e = R.back(T / .28)
        # 2026-11-17 원본 BE(Tesla Model Y 첫 화면) 대조: 브랜드 띠 글자 = 모델 흰 글자 같은 크기·같은 줄,
        # 흰 글자는 외곽선 대신 부드러운 그림자, 아래 줄도 크게(띠의 75%) 붙여서. 화면 폭을 넘으면 셋 다 같은 비율로 줄임
        fs = 84
        while True:
            # 2026-11-17 사용자: 「노션에 원본 있다」 — 제목 브랜드 칩도 노션 「스카우트24 테마별」 원본 로고 칠(430_239) 그대로.
            # 원본 BE 'Tesla' 칩 실측: 칠 높이 ≈ 대문자 2.2배, 약 -3° 기울임, #F5F200 + 검정 글자
            # 2026-11-19 사용자 「벨기에는 기울어진다, 노션 원본서 동일한 거」: 첫 컷 브랜드 칩 = 노션 「테마 바탕색_430_239」(벨기에 릴스 Alfa·Giulia·Opzoek 칩과 같은 모양,
            #   오른쪽 붓 끝 들쭉날쭉) 원본 그대로 가로로만 늘림, 칠만 -3° 기울이고 글자는 똑바로
            # 2026-11-19 사용자 「이렇게 텍스트가 나와야지」 = 노션 「AutoScout24 로고_리브랜딩_1017_227」 실측(1017px 원본):
            #   (로고는 칠을 안 돌리지만 벨기에 릴스는 칠만 기울임 → 아래 HOOK_TILT) 글자는 똑바로 · 남색 #1E2832 · 중간 굵기(획 ≈ 대문자 높이 0.13배),
            #   칠 높이 ≈ 대문자 1.9배(벨기에 Alfa 릴스 1.65배 → 기본 1.65), 글자 왼 0.22 · 오른 0.24(칠 높이 비율), 글자는 칠 가운데보다 살짝 위(-0.04),
            #   흰 글자 = 같은 크기·같은 굵기·같은 바닥선, 칠 오른쪽 끝에서 대문자 높이 0.15배 띄움
            b = dealer_chip(C.HOOK[0], fs, getattr(C, 'HOOK_TILT', -3.0), font=getattr(C, 'HOOK_FONT', R.MED), hr=getattr(C, 'HOOK_HR', 1.65),
                            fill=getattr(C, 'HOOK_FILL', '430_239'), sliced=getattr(C, 'HOOK_SLICED', False),
                            txt_col=getattr(C, 'HOOK_TXT_COL', (0x1E, 0x28, 0x32)), pad=getattr(C, 'HOOK_PAD', (0.22, 0.24)), ty=getattr(C, 'HOOK_TY', -0.04),
                            fit_ink=True, tilt_text=False)
            _hangul = re.search('[가-힣]', C.HOOK[1])
            m = shadow_text(C.HOOK[1], int(fs * (1.0 if _hangul else 1.15)), getattr(C, 'HOOK_MODEL_FONT', getattr(C, 'HOOK_FONT', R.MED)))  # 영문 대문자는 한글보다 낮아 1.15배
            _gap = int(fs * 0.74 * 0.15)
            _br = b.info.get('right', b.width - 62)
            if _br + _gap + m.width - 2 * m.info.get('ink_left', 24) <= W - 80 or fs <= 56:
                break
            fs -= 4
        sub = shadow_text(C.HOOK[2], int(fs * .75))
        cy = H * getattr(C, 'HOOK_CY_FADE' if FADE else 'HOOK_CY', getattr(C, 'HOOK_CY', .24))
        rise = 60 * (1 - R.ease(T / .4)) if HD else 0
        if getattr(C, 'HOOK_DROP', False):  # 처음부터 위에 띄움: 위에서 툭 떨어지듯
            rise = -50 * (1 - R.ease(T / .35))
        cy += rise
        a = min(1, T / .15, (HE - T0) / .12)
        il = m.info.get('ink_left', 24)
        wid = _br + _gap + m.width - 2 * il   # 칠 + 간격 + 흰 글자(그림자 여백 뺌)
        x0 = (W - wid) / 2
        R.paste(ov, b, x0 + b.width * (1 - e) / 2, cy - b.height / 2 + b.height * (1 - e) / 2, a, max(.05, e))
        if 'baseline' in b.info and 'baseline' in m.info:  # 같은 바닥선(AS24 로고: Auto · Scout24)
            R.paste(ov, m, x0 + _br + _gap - il, cy - b.height / 2 + b.info['baseline'] - m.info['baseline'], a)
        else:
            R.paste(ov, m, x0 + b.width - 14 - 24, cy - m.height / 2 + 2, a)
        e2 = R.ease((T - .25) / .3)
        R.paste(ov, sub, (W - sub.width) / 2, cy + b.height / 2 - 30 + 20 * (1 - e2), min(a, e2))  # 원본: 둘째 줄이 바로 아래 붙음
        T = T0
    hide = bool(getattr(C, 'HOOK_HIDE_CAPS', False)) and T < HE
    band = photo_band(T)
    cap_top = min(H - 360, band[1] + CAP_GAP) if band else CAP_TOP
    _cp = getattr(C, 'CAP_CY_PHOTOS', {})  # 독립 컷(성능지·가격 카드) 동안 자막을 카드 아래로
    if _cp and T < BODY:
        _n = CUTS[max(i for i in range(len(CUTS)) if starts[i] <= T)][0]
        cap_top = _cp[_n] - 60 if (_n in _cp and not band) else cap_top  # 상자 사진(페이드판)은 기준선 그대로
    for i, (txt, st, en) in enumerate(CHIPS):
        if ICON3D and st <= T < en:
            num = is_num_chip(txt)
            hide = hide or (num and not getattr(C, 'CAPS_ALWAYS', False))
            icon_chip(ov, txt, st, en, T, i, num)
            continue
        if st <= T < en:
            num = is_num_chip(txt)
            hide = hide or (num and not getattr(C, 'CAPS_ALWAYS', False))
            hide = hide or txt in getattr(C, 'HIDE_CAP_CHIPS', ())  # 2026-11-18: 숫자가 든 키워드 칩(11.9인치 등)도 자막과 숫자 겹치면 자막 숨김
            # 2026-11-17 벨기에 원본 실측: 키워드 칩 약 −2°(거의 수평), 숫자 칩 약 −6°
            tilt = (TILT if num else getattr(C, 'CHIP_TILT_WORD', TILT)) + (-0.8, 0.6, 0.0)[i % 3] * (0.5 if not num and hasattr(C, 'CHIP_TILT_WORD') else 1)
            if getattr(C, 'CHIP_TILT_ALL', None) is not None:  # 2026-11-17 일관성: 모든 칩 같은 기울기, 흔들림 없음
                tilt = C.CHIP_TILT_ALL
            k = T - st
            # 2026-11-17 벨기에 원본 칩 모션(dl50/be 실측, 30fps): 빈 노랑 띠가 첫 프레임에 제 크기로 바로 뜨고,
            # 다음 프레임부터 글자가 띠 안에서 약 20% → 100%로 커짐(약 0.2초, 끝으로 갈수록 느려짐). 띠는 움직이지 않음
            tk = (k - CHIP_TXT_DELAY) / CHIP_TXT_DUR
            tsc = 0.0 if tk < 0 else (0.2 + 0.8 * (1 - (1 - min(1.0, tk)) ** 3))
            im = be_chip(txt, chip_px(txt, num), tilt, round(tsc * 20) / 20)  # 2026-11-17: 키워드 칩도 노션 원본 로고 칠 430_239
            full = be_chip(txt, chip_px(txt, num), tilt)
            out = R.ease((en - T) / .12)
            x = (W - full.width) / 2
            y = H * .28 - full.height / 2 if num else CAP_CY - 70 - full.height
            if band:  # 가로 사진: 칩은 사진 위 띠(차를 가리지 않음)
                y = max(170, band[0] - 18 - full.height)
            if getattr(C, 'CHIP_Y', None):  # 2026-11-17: 포인트 칩은 화면 위 한 자리(9:16·페이드 같은 높이). 사진 위 띠에서는 사진과 36px 이상 띄움
                y = C.CHIP_Y - full.height / 2
                if band:
                    y = min(y, band[0] - 36 - full.height)
            R.paste(ov, im, x + (full.width - im.width) / 2, y + (full.height - im.height) / 2, out)
    for o in getattr(C, 'OVERLAYS', []):  # 오버레이(사진 속 자료 카드): 매물 사진은 그대로, 자료를 카드로 겹침
        st = onset(o['w0']) - 0.05
        en = (onset(o['w1']) - 0.08) if o.get('w1') is not None else ends[[c[2] for c in CUTS].index(max(c[2] for c in CUTS if c[2] <= o['w0']))]
        if st <= T < en:
            im = OVIMG[o['img']]
            k = T - st; e = R.back(k / .32); out = R.ease((en - T) / .15)
            x = W * o.get('cx', .5) - im.width / 2; y = H * o.get('cy', .3) - im.height / 2
            sc = max(.05, e)
            R.paste(ov, im, x + im.width * (1 - sc) / 2, y + im.height * (1 - sc) / 2, min(1, k / .1) * out, sc)
    for dl in getattr(C, 'DIM_LINES', []):  # 2026-11-18: 치수선이 자막 띠를 지나면(9:16판) 그동안 말 자막 숨김 — 큰 숫자 규칙과 같음
        if dl.get('hide_caps') and not FADE and T < BODY:
            _t0 = onset(dl['w']) - 0.2
            if _t0 <= T < ends[_cut_at(max(_t0, 0))] - 0.12:
                hide = True
    tag_layer(ov, T)  # 2026-11-18 부위 이름표(오토스카우트식 파랑 칩)
    odometer_layer(ov, T)  # v1.7.2 계기판 주행거리 숫자 원(사진에 보일 때만)
    pointer_layer(ov, T)  # 2026-11-18 손가락 탭 스티커(맨 위)
    if not hide:
        for c in CAPS:
            if c['s'] <= T < c['e']:
                act = max([j for j, w in enumerate(c['ws']) if T + 0.04 >= w] or [0])  # 노랑은 말보다 0.04초 먼저
                im = R.phrase_img_be3(c['t'], act)
                R.paste(ov, im, (W - im.width) / 2, cap_top - 20)  # 윗선 고정: 두 줄 자막은 아래로 늘어남
                break
    return ov


def run(cmd):
    subprocess.run(cmd, check=True)



def sfx_plan():
    """효과음 목록 [(이름, 시각, 크기)]. SFX_RICH면 벨기에 띠 팝 + 큰 숫자 딩 + 큰 전환 휙 + 끝 로고 딩.
    SFX_EXTRA=[(파일 경로, 어절 번호, 그 어절 끝에서 더할 초, 크기)] — 차량 소리(시동음 등)를 그 말 바로 뒤에 넣는다."""
    extra = [(os.path.abspath(f), WRD[i][1] / SPEED + off, v) for f, i, off, v in getattr(C, 'SFX_EXTRA', [])]
    return sorted(_sfx_plan() + extra, key=lambda e: e[1])


def _av_rules():
    try:
        return json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'option_visual_rules.json')))
    except Exception:
        return None


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
    _isfx = (_av_rules() or {}).get('layout', {}).get('icon_sfx')
    if _isfx:                                                     # v1.7: 자동 아이콘(열선·통풍·마사지·메모리·공조 등) 톡 나올 때 작은 팝
        for sk in STICKERS_R:
            if sk.get('auto') and sk.get('emo') and sk.get('appear', 'pop') == 'pop':
                ev.append(('icon', onset(sk['w']) - 0.07, _isfx['vol']))
    for ci, c in enumerate(CUTS):                                 # 단계 공개(체크 한 줄 켜짐)에 팝
        if ci and c[5] == 'reveal':
            ev.append(('pop', FW[ci][1] - 0.04 if ci in FW else starts[ci], .42))
    for ci, c in enumerate(CUTS):                                 # 큰 전환에 부드러운 휙
        if ci and c[5] in ('fade_long', 'dip_black', 'dip_white') and (getattr(C, 'WHOOSH_CUTS', None) is None or ci in C.WHOOSH_CUTS):  # 2026-11-18 휙은 30초당 3~4번(WHOOSH_CUTS로 고른 컷만)
            ev.append(('whoosh', (FW[ci][0] if ci in FW else starts[ci]) - 0.05, .24))
    if END_CARD:
        ev.append(('ding', BODY + 0.15, .40))                     # 끝 로고
    ev.sort(key=lambda e: e[1])
    out = []
    for e in ev:                                                  # 0.45초 안에 겹치면 칩 소리를 남김
        if out and e[1] - out[-1][1] < 0.45:
            if (e[0] != 'whoosh' and out[-1][0] == 'whoosh') or (e[0] not in ('whoosh', 'icon') and out[-1][0] == 'icon'):
                out[-1] = e   # 칩·딩이 휙·아이콘 팝보다 우선
            continue
        out.append(e)
    g = float(os.environ.get('BBM_SFX_GAIN') or getattr(C, 'SFX_GAIN', 1.6))  # 2026-11-17 사용자: 효과음(틱·팝) 더 크게 — 기본 1.6배(약 +4dB)
    return [('pop' if n == 'icon' else n, max(0.0, t), min(1.0, v * g)) for n, t, v in out]


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

