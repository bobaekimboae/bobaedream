"""영상 매물 숏폼 단일 렌더러 — 판 ED-SIMPLE(실촬영 · 오토스카우트24 벨기에 심플). 2026-11-22.

G350 v8 렌더러(g350_v8_render.py)의 편집 기법을 차량 값 없이 옮긴 것. 차가 바뀌면 코드가 아니라 차 폴더의 입력 파일만 바뀐다.
- 기법 목록·필수 여부: scripts/shortform/edition_lock.json (판 ED-SIMPLE)
- 색·칩·자막·효과음·음량 숫자: scripts/shortform/be_locked_rules.json
- 옵션별 기법 자동 선택: feature_edit_planner.py + feature_edit_rules.json

차 폴더(인자 1개):
  job.json   매물·장면·대본(job 형식은 place_voice.py 맨 위)
  src.mp4    원본 영상(고치지 않음: 자르기·이동·확대만)
  voice.wav · words.json   place_voice.py 결과(대본 글자 + 시각)
사용: python3 place_voice.py <차 폴더> && python3 listing_video_render.py <차 폴더>
결과: <차 폴더>/<job.out> · <job.out>.plan.json(판·렌더러·쓴 기법 코드·칩·효과음·컷) → edit_gate.py / check_be.py 가 읽음
"""
import json, math, os, re, subprocess, sys
import numpy as np, cv2

# 부위 추적기: 2026-11-22 CSRT(2014) → VitTrack(OpenCV 5.1, opencv_zoo 2023sep, Apache-2.0). cha13 휠 60프레임 같은 경로·5배 빠름.
# 모델 파일(scripts/shortform/models/vittrack_2023sep.onnx)이 없거나 OpenCV가 옛판이면 CSRT로 돌아간다.
_VIT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'models', 'vittrack_2023sep.onnx')
def _tracker():
    if hasattr(cv2, 'TrackerVit_create') and os.path.exists(_VIT):
        p = cv2.TrackerVit_Params(); p.net = _VIT; return cv2.TrackerVit_create(p)
    return cv2.TrackerCSRT_create()
def _track_ok(tr):
    return not hasattr(tr, 'getTrackingScore') or tr.getTrackingScore() >= 0.2  # 자신 없으면 마지막 자리 유지
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from g350_v5_lib import *   # 칩·흰 글자·3D 숫자·흰 정보 알약·등장·화살표(be_locked_rules.json 값)
import feature_edit_planner as FEP

RENDERER = 'listing_video_render.py'
VERSION = '1.0'
D = os.path.abspath(sys.argv[1]) + '/'
JOB = json.load(open(D + 'job.json', encoding='utf-8'))
LOCK = json.load(open(os.path.join(REPO, 'scripts/shortform/edition_lock.json'), encoding='utf-8'))
ED = LOCK['editions'][JOB['edition']]
if ED['renderer'] != 'scripts/shortform/video_listing/' + RENDERER:
    sys.exit(f"판 {JOB['edition']}의 렌더러는 {ED['renderer']} — 이 렌더러로 만들 수 없음(edition_lock.json)")
USED = set()   # 실제로 화면에 쓴 기법 코드(edition_lock.json techniques 키)
CAPY = R['caption']['center_y_px']

# ── 낱말(대본 글자) ──
WD = json.load(open(D + 'words.json', encoding='utf-8'))
WS = [[w, s, e] for w, s, e, *_ in WD]
CH, cur = [], []
for j, w in enumerate(WD):
    if j and w[3]:
        CH.append(cur); cur = []
    cur.append(j)
CH.append(cur)
VOICE = round(WS[-1][2], 2)
CUTS = JOB['cuts']
CUTW = {}
for j, w in enumerate(WD):
    CUTW.setdefault(w[4], []).append(j)
def word(ci, key):
    for j in CUTW[ci]:
        if WS[j][0].replace(' ', '').startswith(key.replace(' ', '')): return j
    raise KeyError(f"{CUTS[ci]['key']}: 낱말 「{key}」 없음")
ENDW = next(j for j, w in enumerate(WS) if w[0].startswith(JOB['end_word']))
ENDT = WS[ENDW][1] - 0.12
TOTAL = VOICE + 1.7   # G350 기준 영상과 같은 끝 길이
SRC = D + JOB['src']
cap = cv2.VideoCapture(SRC); SRC_DUR = cap.get(cv2.CAP_PROP_FRAME_COUNT) / (cap.get(cv2.CAP_PROP_FPS) or 30)

# ── 장면 구간: 원본 순서·원본 길이(edition_lock: order=source) ──
assert JOB.get('order') == ED['order'] == 'source', '영상 매물은 원본 순서·원본 길이 고정(edition_lock.json)'
for k in range(1, len(CUTS)):
    assert abs(CUTS[k]['src'][0] - CUTS[k - 1]['src'][1]) < 1e-6, f"장면이 이어지지 않음: {CUTS[k-1]['key']}→{CUTS[k]['key']}"
SEG = []
for k, c in enumerate(CUTS):
    t0 = c['src'][0]; t1 = CUTS[k + 1]['src'][0] if k + 1 < len(CUTS) else ENDT
    SEG.append((t0, min(t1, ENDT), k))
SEG = [s for s in SEG if s[1] > s[0]]

# ── 기법 자동 계획(feature_edit_planner) ──
json.dump([[w, s, e] for w, s, e in WS], open(D + 'words_plan.json', 'w'), ensure_ascii=False)
PIN = {'words': D + 'words_plan.json', 'src': SRC,
       'cuts': [{'key': c['key'], 'start_word': CUTW[k][0], 'src': c['src'], 'tracked': bool(c.get('part'))} for k, c in enumerate(CUTS)]}
PLAN = FEP.plan(PIN)
json.dump(PLAN, open(D + 'plan_auto.json', 'w'), ensure_ascii=False, indent=1)
PL = {c['key']: {} for c in PLAN['cuts']}
for c in PLAN['cuts']:
    for e in c['techniques']: PL[c['key']].setdefault(e['id'], []).append(e)
COUNT = {e['value'] for c in PLAN['cuts'] for e in c['techniques'] if e['id'] == 'T04'}
TP = {t['id']: t['params'] for t in FEP.RULES['techniques']}

# ── 부위 찾기(OWLv2) + 추적(CSRT): 칩에 부위(part)가 있는 장면만 ──
def grab(t):
    cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000); ok, f = cap.read(); return f if ok else None
TR = {}
need = [(k, c) for k, c in enumerate(CUTS) if c.get('part') and c.get('chip')]
if need:
    sys.path.insert(0, os.path.join(REPO, 'scripts/shortform/photo_listing'))
    import part_anchor as PA
    for k, c in need:
        ti = min(c['src'][1] - 0.1, max(c['src'][0], WS[word(k, c['chip_word'])][1]))
        f = grab(ti)
        if f is None: continue
        img = Image.fromarray(cv2.cvtColor(f, cv2.COLOR_BGR2RGB)); hits = PA.detect(img, [c['part']]).get(c['part'], [])
        if not hits:
            print(f"  부위 못 찾음 {c['key']} {c['part']} → 화살표 없이 위쪽 칩"); continue
        sc_, (x0_, y0_, x1_, y1_) = max(hits)
        fx, fy = (x0_ + x1_) / 2 / img.width, (y0_ + y1_) / 2 / img.height
        s0, s1 = c['src']; SW, SH = 270, 480; fr = []
        cap.set(cv2.CAP_PROP_POS_MSEC, s0 * 1000)
        for _ in range(int(round((s1 - s0) * 30)) + 1):
            ok, g = cap.read()
            if not ok: break
            fr.append(cv2.resize(g, (SW, SH)))
        ii = min(len(fr) - 1, int(round((ti - s0) * 30))); bw, bh = int(SW * .16), int(SH * .09)
        box = (int(fx * SW - bw / 2), int(fy * SH - bh / 2), bw, bh); res = [None] * len(fr); res[ii] = (fx, fy)
        for seq in (range(ii + 1, len(fr)), range(ii - 1, -1, -1)):
            tr = _tracker(); tr.init(fr[ii], box); last = (fx, fy)
            for j in seq:
                ok, b = tr.update(fr[j])
                if ok and _track_ok(tr): last = ((b[0] + b[2] / 2) / SW, (b[1] + b[3] / 2) / SH)
                res[j] = last
        TR[c['key']] = res
        print(f"  부위 {c['key']} {c['part']} ({fx:.2f},{fy:.2f}) 점수 {sc_:.2f}")

# ── 말 자막: 대본의 뜻 단위 덩어리(「/」) · 말하는 낱말 노랑(be_locked caption) ──
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
def draw_sub(c, t):
    for q, ch in enumerate(CH):
        a = WS[ch[0]][1] - 0.05; b = (WS[CH[q + 1][0]][1] - 0.05) if q + 1 < len(CH) else TOTAL
        if a <= t < b and t < WS[ch[-1]][2] + 0.6:
            act = max([j for j in ch if WS[j][1] <= t + 0.02] or [ch[0]])
            im = subimg(ch, act); _x0, _y0 = (W - im.width) // 2, CAPY - im.height // 2; c.alpha_composite(im, (_x0, _y0)); USED.add('caption_chunks')
            _bb = im.getbbox()
            if _bb: CAPBOX[:] = [min(CAPBOX[0], _x0 + _bb[0]), min(CAPBOX[1], _y0 + _bb[1]), max(CAPBOX[2], _x0 + _bb[2]), max(CAPBOX[3], _y0 + _bb[3])]
            return

def smooth(pts, k=21):
    a = np.array(pts); out = a.copy()
    for i in range(len(a)): out[i] = a[max(0, i - k // 2):i + k // 2 + 1].mean(0)
    return out
class _Frames:
    """컷 프레임을 앞에서부터 한 장씩 읽는다(2026-11-22 G350: 30초 컷을 통째로 메모리에 올리면 5.6GB → 렌더가 죽음).
    렌더 루프는 프레임 번호가 줄지 않으므로 지금 장만 들고 있으면 된다."""
    def __init__(self, s0, s1):
        cap.set(cv2.CAP_PROP_POS_MSEC, s0 * 1000); self.n = int(round((s1 - s0) * 30)) + 2; self.i = -1; self.f = None
    def __len__(self): return self.n
    def __getitem__(self, i):
        while self.i < i:
            ok, f = cap.read()
            if not ok: self.n = max(1, self.i + 1); break
            self.i += 1; self.f = cv2.cvtColor(f, cv2.COLOR_BGR2RGB)
        return self.f
def frames(s0, s1):
    return _Frames(s0, s1)
_chips = {}
def gchip(s, size=CHIP_PX):
    if (s, size) not in _chips: _chips[(s, size)] = chip(s, size)
    return _chips[(s, size)]
place_chip_y_cap = H * 0.58
SAFE_X = 40
def place(Cimg, tx, ty, below):
    bx0, by0, bx1, by1 = Cimg.getbbox(); x = int(max(SAFE_X - bx0, min(W - SAFE_X - bx1, tx - (bx0 + bx1) / 2))); L = ALEN   # 좌우 안전영역(edit_gate safe_area와 같은 40px)
    if below:
        y = ty + TG + L + CG - by0
        if y + by1 > place_chip_y_cap: L = max(AMIN, int(L - (y + by1 - place_chip_y_cap))); y = ty + TG + L + CG - by0
    else:
        y = ty - TG - L - CG - by1
        if y + by0 < 150: L = max(AMIN, int(L - (150 - (y + by0)))); y = ty - TG - L - CG - by1
    return x, int(y), L, below
_cn = {}
def cnt(txt, h, t, tb, dur=0.45):
    m = re.match(r'^([\d,]+)(.*)$', txt); k = max(0.0, min(1.0, (t - tb) / dur)) if txt in COUNT else 1.0
    s2 = txt
    if m and k < 1:
        v = int(m.group(1).replace(',', '')); c = round(v * (1 - (1 - k) ** 3)); s2 = (f'{c:,}' if ',' in m.group(1) else str(c)) + m.group(2)
    if (s2, h) not in _cn: _cn[(s2, h)] = text3d(s2, h)
    return _cn[(s2, h)]

def lens(cv, base, tx, ty, cx, cy, t, t_in, D=320, Z=2.2):   # T06 돋보기 원(g350 v8과 같음)
    if t < t_in: return
    g = ease((t - t_in) / 0.25); d = max(20, int(D * (0.6 + 0.4 * g))); r = D / Z / 2
    reg = base.crop((int(tx - r), int(ty - r), int(tx + r), int(ty + r))).resize((d, d), Image.LANCZOS)
    mk = Image.new('L', (d, d), 0); ImageDraw.Draw(mk).ellipse((0, 0, d - 1, d - 1), fill=255); reg.putalpha(mk)
    dr = ImageDraw.Draw(cv); dr.line((cx, cy, tx, ty), fill=(255, 255, 255, int(230 * g)), width=5)
    sh = Image.new('RGBA', (d + 40, d + 40)); ImageDraw.Draw(sh).ellipse((20, 26, d + 20, d + 26), fill=(0, 0, 0, 150)); cv.alpha_composite(sh.filter(ImageFilter.GaussianBlur(8)), (int(cx - d / 2 - 20), int(cy - d / 2 - 20)))
    cv.alpha_composite(reg, (int(cx - d / 2), int(cy - d / 2))); dr.ellipse((cx - d / 2, cy - d / 2, cx + d / 2, cy + d / 2), outline=(255, 255, 255, 255), width=7)
_yy, _xx = np.mgrid[0:2 * H, 0:2 * W]; SPOT = np.clip((np.hypot(_xx - W, _yy - H) - 300) / 200, 0, 1); del _yy, _xx
def spot(cv, tx, ty, a):   # T05 스포트라이트(g350 v8과 같음)
    x0 = int(W - tx); y0 = int(H - ty); m = (SPOT[y0:y0 + H, x0:x0 + W] * a).astype('uint8')
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 255)); ov.putalpha(Image.fromarray(m)); return Image.alpha_composite(cv, ov)
# ── 첫 화면(벨기에식): 노랑 칩 제조사 + 같은 줄 흰 큰 모델명 + 아래 한 줄 ──
TT = JOB['title']
HB = chip(TT['brand'], R['chip']['title_font_px'], title=True); _hs = 104; HM = white(TT['model'], _hs)
_room = W - 24 - (M - 10 + HB.getbbox()[2] + 6)
while HM.getbbox()[2] > _room and _hs > 60: _hs -= 4; HM = white(TT['model'], _hs)
HS = white(TT['sub'], 58)

SFX_EV, ICONT, CHIPS_LOG, BIGS_LOG = [], [], [], []
CAPBOX = [10**9, 10**9, 0, 0]   # 말 자막이 차지한 가장 큰 상자(안전영역 검사용)
MET = json.load(open(os.path.join(REPO, 'scripts/shortform/photo_listing/option_visual_rules.json')))['layout']['metaphor_sfx']; SX = R['sfx']
proc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                         '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', D + '_video.mp4'], stdin=subprocess.PIPE)
nfr = 0; last = None; prevzone = None
for t0, t1, ci in SEG:
    c = CUTS[ci]; key = c['key']; s0, s1 = c['src']; dur = t1 - t0
    fr = frames(s0, min(s1, SRC_DUR))
    pts = smooth(TR[key]) if key in TR else None
    clab = c.get('chip'); Cimg = gchip(clab) if clab else None
    tc = (WS[word(ci, c['chip_word'])][1] - t0 - 0.06) if clab else 0
    BIG = [(b['text'], white(b['label'], 58) if b.get('label') else None, WS[word(ci, b['word'])][1] - t0 - 0.22) for b in c.get('bigs', [])]
    MAT = (text3d(c['material']['text'], h=120), WS[word(ci, c['material']['word'])][1] - t0 - 0.06) if c.get('material') else None
    if clab: SFX_EV.append((t0 + tc - 0.02, 'chip'))
    for _, _, tb in BIG: SFX_EV.append((t0 + tb - 0.02, 'big_number'))
    for e in PL.get(key, {}).get('T05', []) + PL.get(key, {}).get('T06', []): SFX_EV.append((e['at'], 'emphasis'))
    if c.get('zone') != prevzone and prevzone is not None: SFX_EV.append((t0 - 0.08, 'part_change'))
    prevzone = c.get('zone', prevzone)
    BL0 = None
    if pts is not None and Cimg is not None:
        _b = Cimg.getbbox(); _h = _b[3] - _b[1]; _ys = [p[1] * H for p in pts]
        _fb = max(_ys) + TG + AMIN + CG + _h <= place_chip_y_cap; _fa = min(_ys) - TG - AMIN - CG - _h >= 150
        BL0 = True if _fb and (_ys[0] < H * 0.45 or not _fa) else (False if _fa else _ys[0] < H * 0.45)
    if pts is not None and Cimg is not None:   # 부위 칩이 말 자막 띠에 닿거나 부위가 화면 밖으로 나가면 → 이 컷은 위쪽 고정 칩(화살표 없음)
        _bx = Cimg.getbbox(); _i0 = max(0, int(round(tc * 30)))
        for _p in pts[_i0:]:
            _x, _y, _L, _bl = place(Cimg, _p[0] * W, _p[1] * H, BL0)
            if _y + _bx[3] > CAPY - 90 or _y + _bx[1] < 150 or not (0.06 <= _p[0] <= 0.94 and 0.08 <= _p[1] <= 0.92):
                print(f'  {key}: 부위 칩이 자막·화면 끝에 닿음 → 위쪽 고정 칩'); pts = None; break
    while nfr < round(t1 * FPS):
        t = nfr / FPS - t0; st = min(s1, s0 + t); fi = max(0, min(len(fr) - 1, int(round((st - s0) * 30))))
        z = 1.0 + 0.045 * ease(t / dur); USED.add('slow_push')
        for e in PL.get(key, {}).get('T03', []):
            z = 1.0
            for st_ in e['steps']:
                tj = st_['at'] - t0
                if t >= tj: z += TP['T03']['zoom_step'] * min(1.0, (t - tj) / TP['T03']['ramp_s'])
            USED.add('T03')
        ccx, ccy = W / 2, H / 2
        for e in PL.get(key, {}).get('T08', []):
            q = TP['T08']; u = t - (e['at'] - t0)
            if u >= 0 and pts is not None:
                g = ease(min(1.0, u / q['arrive_s'])); z = max(z, 1 + (q['zoom_to'] - 1) * g)
                pj = min(len(pts) - 1, fi); ccx = W / 2 + (pts[pj][0] * W - W / 2) * q['center_bias'] * g; ccy = H / 2 + (pts[pj][1] * H - H / 2) * q['center_bias'] * g
                USED.add('T08')
        im = Image.fromarray(fr[fi]); cw_ = W / z; ch_ = H / z
        ccx = min(W - cw_ / 2, max(cw_ / 2, ccx)); ccy = min(H - ch_ / 2, max(ch_ / 2, ccy))
        cv = im.resize((W, H), box=(ccx - cw_ / 2, ccy - ch_ / 2, ccx + cw_ / 2, ccy + ch_ / 2)).convert('RGBA')
        tomap = lambda fx, fy, _x=ccx, _y=ccy, _z=z: ((fx * W - _x) * _z + W / 2, (fy * H - _y) * _z + H / 2)
        if ci == 0:
            cv = Image.alpha_composite(cv, Image.new('RGBA', (W, H), (0, 0, 0, 90)))
            pop(cv, HB, (M - 10, YB), t, 0.08); USED.add('title_brand_chip')
            if not any(x['kind'] == 'title' for x in CHIPS_LOG) and t >= 0.28:
                _bb = HB.getbbox(); CHIPS_LOG.append({'key': key, 'label': TT['brand'], 'kind': 'title', 't0': round(t0 + 0.08, 3), 't1': round(t1, 3), 't_box': round(nfr / FPS, 3),
                                                     'px': R['chip']['title_font_px'], 'y': YB, 'box': [M - 10 + _bb[0], YB + _bb[1], M - 10 + _bb[2], YB + _bb[3]]})
            _hb = HB.getbbox(); pop(cv, HM, (M - 10 + _hb[2] + 6, YB + (_hb[1] + _hb[3] - HM.height) // 2), t, 0.28); pop(cv, HS, (M - 4, YB + _hb[3] + 16), t, 0.5)
        if Cimg is not None:
            if pts is not None:
                pi = min(len(pts) - 1, fi); tx, ty = tomap(*pts[pi])
            else: tx, ty = W / 2, H * 0.62
            for e in PL.get(key, {}).get('T05', []):
                q = TP['T05']; a0 = e['at'] - t0; fo = (e['fade_out_at'] - t0) if e.get('fade_out_at') else 1e9
                if t >= a0: cv = spot(cv, tx, ty, q['alpha'] * ease((t - a0) / q['fade_in_s']) * (1 - ease((t - fo) / q['fade_in_s']))); USED.add('T05')
            if pts is not None:
                for e in PL.get(key, {}).get('T06', []):
                    q = TP['T06']; lens(cv, cv.copy(), tx, ty, q['pos'][0], q['pos'][1], t, e['at'] - t0, q['diameter_px'], q['zoom'])
                    if t >= e['at'] - t0: USED.add('T06')
            if pts is None:
                cx, cy, L, bl = M - 10, YB, 0, None; kind = 'point'
            else:
                if BL0 is None: BL0 = ty < H * 0.45
                cx, cy, L, bl = place(Cimg, tx, ty, BL0); kind = 'callout'
                if t >= tc + 0.18:
                    g = ease((t - tc - 0.18) / 0.25); Lc = max(20, round(L * (0.55 + 0.45 * g))); bob = round(BOB * abs(math.sin((t - tc - 0.43) * 5))) if t > tc + 0.43 else 0
                    A_, off = arrimg(L, bl); A_ = A_.resize((A_.width, round(A_.height * Lc / L))) if Lc != L else A_; offc = round(off * Lc / L)
                    if bl: tail = ty + TG + L; cv.alpha_composite(A_, (int(tx - A_.width / 2), int(tail - Lc - bob - offc)))
                    else: tail = ty - TG - L; cv.alpha_composite(A_, (int(tx - A_.width / 2), int(tail + bob - offc)))
                    USED.add('callout_arrow')
            pop(cv, Cimg, (cx, cy), t, tc); USED.add('point_chip' if kind == 'point' else 'callout_chip')
            if t >= tc + 0.2 and key not in {x['key'] for x in CHIPS_LOG}:
                _bb = Cimg.getbbox(); CHIPS_LOG.append({'key': key, 'label': clab, 'kind': kind, 't0': round(t0 + tc, 3), 't1': round(t1, 3), 't_box': round(nfr / FPS, 3),
                                                       'px': R['chip']['font_px'], 'y': int(cy), 'box': [int(cx + _bb[0]), int(cy + _bb[1]), int(cx + _bb[2]), int(cy + _bb[3])]})
        for (txt, lab, tb), _bj in zip(BIG, c.get('bigs', [])):
            if t >= tb and not any(x['key'] == key and x['text'] == txt for x in BIGS_LOG):   # 큰 숫자가 뜬 순간 원본 시각(주행거리 = 계기판 검사용)
                BIGS_LOG.append({'key': key, 'text': txt, 'label': _bj.get('label', ''), 't': round(nfr / FPS, 3), 'src_t': round(st, 3), 'src_end': round(s1, 3)})
            y3 = int(H * 0.12)
            if Cimg is not None and pts is None: y3 = max(y3, YB + Cimg.getbbox()[3] + 20)
            B3 = cnt(txt, 180, t, tb + 0.05); pop(cv, B3, ((W - B3.width) // 2, y3), t, tb, 0.3); USED.add('big_number_3d')
            if txt in COUNT and t >= tb: USED.add('T04')
            if lab: pop(cv, lab, ((W - lab.width) // 2, y3 + B3.height + 6), t, tb + 0.12)
        if MAT:
            pop(cv, MAT[0], ((W - MAT[0].width) // 2, int(H * 0.42)), t, MAT[1], 0.3); USED.add('seat_material_3d')
        draw_sub(cv, nfr / FPS)
        proc.stdin.write(cv.convert('RGB').tobytes()); nfr += 1; last = fr[fi]
    del fr
# ── 끝 화면: 마지막 장면 어둡게 + 보배드림 로고 커짐 ──
LG = Image.open(A + 'bobae_logo_600.png').convert('RGBA'); LG.thumbnail((520, 520))
base = Image.fromarray(last).convert('RGBA')
while nfr < round(TOTAL * FPS):
    t = nfr / FPS - ENDT; cv = Image.alpha_composite(base, Image.new('RGBA', (W, H), (0, 0, 0, int(185 * min(1, t / 0.3)))))
    s = 0.7 + 0.3 * ease(t / 0.6); lw = round(LG.width * s); L2 = LG.resize((lw, round(LG.height * s))); cv.alpha_composite(L2, ((W - lw) // 2, 640 - (L2.height - LG.height) // 2))
    if nfr / FPS < VOICE: draw_sub(cv, nfr / FPS)
    USED.add('end_logo')
    proc.stdin.write(cv.convert('RGB').tobytes()); nfr += 1
proc.stdin.close(); proc.wait()

# ── 효과음 · 음량: be_locked_rules.json sfx/audio + 비유 효과음(g350 v8과 같은 규칙) ──
if SX.get('title_ding'): SFX_EV.append((0.06, 'title'))
for ti in ICONT: SFX_EV.append((ti, 'icon'))
_met = []
for it in MET['items']:
    if len(_met) >= MET['max_per_video']: break
    for j, (w, s_, e_) in enumerate(WS):
        k = next((k for k in it['keywords'] if k in w), None)
        if k and os.path.exists(A + 'sfx/' + it['name'] + '.wav'):
            tm = s_ + (e_ - s_) * w.index(k) / max(1, len(w)) - it['lead_s']
            if all(abs(tm - x[0]) >= MET['min_gap_s'] for x in _met): _met.append((tm, it['name'], it['vol']))
            break
def _ratio(evs, r): return [e for n, e in enumerate(evs) if int((n + 1) * r + 1e-9) > int(n * r + 1e-9)]
cand = [(t, k) for t, k in SFX_EV if k not in ('chip', 'big_number')] + _ratio(sorted(x for x in SFX_EV if x[1] == 'chip'), SX['chip_ratio']) + _ratio(sorted(x for x in SFX_EV if x[1] == 'big_number'), SX['big_number_ratio'])
pc = sorted(x for x in cand if x[1] == 'part_change')[:SX['part_change_max']]; cand = [x for x in cand if x[1] != 'part_change'] + pc
PRI = {k: n for n, k in enumerate(SX['priority'])}; SND = {k: SX['kinds'][k] for k in SX['kinds'] if k != 'metaphor'}
allc = [(t, 'metaphor', nm, v) for t, nm, v in _met] + [(t, k, SND[k], SX['volume'][SND[k]]) for t, k in cand]
cap_n = int(SX['max_per_30s'] * TOTAL / 30); acc = []
for t, k, nm, v in sorted(allc, key=lambda x: (PRI[x[1]], x[0])):
    if t < 0 or t > ENDT - 0.2: continue
    if any(abs(t - a[0]) < SX['min_gap_s'] for a in acc): continue
    if any(a[2] == nm and abs(t - a[0]) < SX['same_sound_min_gap_s'] for a in acc): continue
    if len(acc) >= cap_n: break
    acc.append((round(t, 3), k, nm, v))
acc.sort()
if acc: USED.add('sfx_rules')
inp = ['-i', D + '_video.mp4', '-i', D + 'voice.wav', '-i', A + 'bgm/bobae_showroom_v1.mp3']
fl = ['[1:a]highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=8:release=120[v]', f'[2:a]atrim=0:{TOTAL},volume=0.16,afade=t=out:st={TOTAL - 1.5}:d=1.5[b]']; mx = ['[v]', '[b]']
# 2026-11-25 딜러 육성(딜러가 직접 말한 원본 소리): 섞기 직전에만 DeepFilterNet3(deep-filter 0.5.6)로 잡음 제거.
# job "dealer_voice": [{"file": "원본.mp4", "at": 넣을 시각(초), "vol": 1.0, "atten_db": null}] — ElevenLabs 음성(voice.wav)에는 걸지 않는다.
for j, dv in enumerate(JOB.get('dealer_voice', [])):
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
    import dealer_voice
    _dv = dealer_voice.denoise(dv['file'] if os.path.isabs(dv['file']) else D + dv['file'], atten_db=dv.get('atten_db'))
    inp += ['-i', _dv]; fl.append(f"[{len(inp) // 2 - 1}:a]volume={dv.get('vol', 1.0)},adelay={int(dv.get('at', 0) * 1000)}:all=1[dv{j}]"); mx.append(f'[dv{j}]')
for j, (tc_, k, nm, v) in enumerate(acc):
    inp += ['-i', A + 'sfx/' + nm + '.wav']; fl.append(f'[{len(inp) // 2 - 1}:a]volume={v},adelay={int(tc_ * 1000)}:all=1[s{j}]'); mx.append(f'[s{j}]')
A_ = R['audio']; LN = f"loudnorm=I={A_['loudness_lufs']}:TP={A_['true_peak_db']}:LRA=11"
_m = subprocess.run(['ffmpeg', '-hide_banner', *inp, '-filter_complex', ';'.join(fl + [''.join(mx) + f'amix=inputs={len(mx)}:normalize=0:duration=longest,{LN}:print_format=json[a]']),
                     '-map', '[a]', '-t', str(TOTAL), '-f', 'null', '-'], capture_output=True, text=True).stderr
_j = json.loads(_m[_m.rindex('{'):_m.rindex('}') + 1])
LN2 = LN + f":measured_I={_j['input_i']}:measured_TP={_j['input_tp']}:measured_LRA={_j['input_lra']}:measured_thresh={_j['input_thresh']}:offset={_j['target_offset']}:linear=true"
fl.append(''.join(mx) + f"amix=inputs={len(mx)}:normalize=0:duration=longest,{LN2},aresample=48000[a]")
OUT = D + JOB['out']
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *inp, '-filter_complex', ';'.join(fl), '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', str(TOTAL), OUT], check=True)
USED.add('bgm'); USED.add('loudness_rule')
for c in PLAN['cuts']:
    for e in c['techniques']:
        if e['id'] in ('T02', 'T07', 'T01'): print(f"  주의: 계획기 기법 {e['id']}({c['key']})는 이 렌더러 1.0에 아직 없음 — 쓰지 않음")
json.dump({'edition': 'feature_video', 'edition_code': JOB['edition'], 'renderer': RENDERER, 'renderer_version': VERSION, 'order': JOB['order'],
           'music': True, 'total': round(TOTAL, 3), 'cuts': [round(a, 3) for a, b, c in SEG[1:]],
           'techniques': sorted(USED), 'planner': PLAN['summary'],
           'sfx': [{'t': a[0], 'kind': a[1], 'sound': a[2]} for a in acc], 'chips': CHIPS_LOG,
           'bigs': BIGS_LOG, 'src': JOB['src'], 'voice': 'voice.wav', 'frame': [W, H],
           'caption': {'center_y_px': CAPY, 'font_px': R['caption']['font_px'], 'chunks': len(CH), 'box': CAPBOX if CAPBOX[2] else None}},
          open(OUT + '.plan.json', 'w'), ensure_ascii=False, indent=1)
print(OUT, round(TOTAL, 2), sorted(USED))
