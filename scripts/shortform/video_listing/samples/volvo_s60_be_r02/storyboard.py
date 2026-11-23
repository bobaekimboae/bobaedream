# -*- coding: utf-8 -*-
"""A/B/C 스토리보드 — 폰트·자막·모션·붓칠·칩 위치·효과음을 한 번에 한 가지만 바꾼 짧은 클립.
쓰기: BE_DIR=<재료 폴더> SB_OUT=<출력 폴더> SB_FONTS=<대체 폰트 폴더> SB_SFX=<uisfx sounds 폴더> python3 storyboard.py
A = 지금 규칙(be_locked_rules.json), B·C = 비교안(규칙 밖, 고르기 전에는 본편에 쓰지 않음)."""
import os, sys, json, math, subprocess
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(HERE, '..', '..'))
import g350_v5_lib as L
G = os.environ['BE_DIR'].rstrip('/') + '/'; OUT = os.environ['SB_OUT'].rstrip('/') + '/'; os.makedirs(OUT, exist_ok=True)
FD = os.environ.get('SB_FONTS', '/tmp/fnt'); SX = os.environ.get('SB_SFX', '/tmp/sfxp/u/package/sounds')
W, H, FPS = 1080, 1920, 30; YEL, INK, M, YB = L.YEL, L.INK, L.M, L.YB; CAPY = L.R['caption']['center_y_px']
WS = json.load(open(G + 'words5.json')); TR = json.load(open(G + 'tracks.json'))
cap = cv2.VideoCapture(G + 'src.mp4')
_orig_font = L._font

def set_font(path):
    L._fc.clear(); L._SHAPE_CACHE.clear()
    L._font = _orig_font if path is None else (lambda n, s: ImageFont.truetype(path, s))

def src_frame(t):
    cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000); ok, f = cap.read()
    return Image.fromarray(cv2.cvtColor(f, cv2.COLOR_BGR2RGB)).convert('RGBA')

def clean(w): return w.strip(' ,.?!')

def sub_chunk(ws, act, size=60, mode='A'):
    f = L.BK(size); words = [clean(WS[j][0]) for j in ws]
    lines = [words]
    if f.getlength(' '.join(words)) > W - 200 and len(words) > 1: m = (len(words) + 1) // 2; lines = [words[:m], words[m:]]
    lh = int(size * 1.34); tw = max(f.getlength(' '.join(l)) for l in lines)
    im = Image.new('RGBA', (int(tw + 80), lh * len(lines) + 40)); sh = Image.new('RGBA', im.size); sd = ImageDraw.Draw(sh)
    for i, l in enumerate(lines): sd.text((im.width / 2 + 3, 20 + lh * i + lh / 2 + 5), ' '.join(l), font=f, fill=(0, 0, 0, 220), anchor='mm', stroke_width=4, stroke_fill=(0, 0, 0, 220))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6))); d = ImageDraw.Draw(im); n = 0
    for i, l in enumerate(lines):
        x = (im.width - f.getlength(' '.join(l))) / 2; y = 20 + lh * i + lh / 2
        for w in l:
            d.text((x, y), w, font=f, fill=YEL if (ws[n] == act and mode != 'C') else (255, 255, 255), anchor='lm'); n += 1; x += f.getlength(w + ' ')
    return im

SUB = {}
def _sub(cv, im):
    x, y = (W - im.width) // 2, CAPY - im.height // 2; cv.alpha_composite(im, (x, y)); SUB['box'] = (x, y, im.width, im.height)

def draw_sub(cv, t, chunks, mode):
    """A 뜻 덩어리 + 말하는 낱말 노랑 / B 낱말 하나씩 크게 / C 문장 통째 두 줄, 강조 없음. t = 목소리 시각."""
    allw = [j for ch in chunks for j in ch]
    if mode == 'C':
        if t >= WS[allw[0]][1] - 0.05: im = sub_chunk(allw, None, 56, 'C'); _sub(cv, im)
        return
    if mode == 'B':
        act = [j for j in allw if WS[j][1] - 0.03 <= t]
        if act:
            j = act[-1]; im = sub_chunk([j], j, 88); k = min(1, (t - WS[j][1] + 0.03) / 0.1); s = 0.85 + 0.15 * L.ease(k)
            im = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS); _sub(cv, im)
        return
    for q, ch in enumerate(chunks):
        a = WS[ch[0]][1] - 0.05; b = WS[chunks[q + 1][0]][1] - 0.05 if q + 1 < len(chunks) else 1e9
        if a <= t < b:
            act = max([j for j in ch if WS[j][1] <= t + 0.02] or [ch[0]]); im = sub_chunk(ch, act)
            _sub(cv, im); return

def flat_pill(s, size=70):
    f = L.XB(size); b = f.getbbox(s); tw, th = b[2] - b[0], b[3] - b[1]; px, py = 34, 22
    im = Image.new('RGBA', (tw + px * 2 + 30, th + py * 2 + 30)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((15, 15, 15 + tw + px * 2, 15 + th + py * 2), radius=(th + py * 2) // 2, fill=(0xFA, 0xEB, 0x00, 255))
    d.text((15 + px - b[0], 15 + py - b[1]), s, font=f, fill=INK); return im

def white_brush(s, size=70):
    im = L.brush_box(s, L.XB(size), (255, 255, 255))
    sh = Image.new('RGBA', im.size); sh.paste((0, 0, 0, 120), (0, 4), im.getchannel('A'))
    out = Image.new('RGBA', im.size); out.alpha_composite(sh.filter(ImageFilter.GaussianBlur(7))); out.alpha_composite(im); return out

def make_chip(s, style):
    return {'A': L.chip, 'B': flat_pill, 'C': white_brush}[style](s)

def put(cv, im, x, y, a=1.0):
    if a < 1: im = im.copy(); im.putalpha(Image.fromarray((np.array(im.getchannel('A')) * max(0, a)).astype('uint8')))
    cv.alpha_composite(im, (int(x), int(y)))

def chip_in(cv, im, pos, t, t_in, motion):
    """A 톡 튀어나옴 / B 왼쪽부터 닦아내듯 / C 위에서 떨어져 한 번 튕김."""
    if t < t_in: return
    k = t - t_in
    if motion == 'A': L.pop(cv, im, pos, t, t_in)
    elif motion == 'B':
        q = L.ease(min(1, k / 0.28)); w = max(1, int(im.width * q)); put(cv, im.crop((0, 0, w, im.height)), pos[0], pos[1])
    else:
        q = min(1, k / 0.42); y = pos[1] - 260 * (1 - q) ** 2 * abs(math.cos(q * math.pi * 1.5)) - 260 * max(0, 1 - q * 3); put(cv, im, pos[0], y, min(1, k / 0.08))

_n3 = {}
def num3d(s, h=180):
    if (s, h) not in _n3: _n3[(s, h)] = L.text3d(s, h)
    return _n3[(s, h)]

def number_in(cv, target, unit, label, t, t_in, motion):
    """A 숫자가 올라가며 셈 / B 크게 떴다가 쿵 줄어듦 / C 아래에서 올라오며 나타남."""
    if t < t_in: return
    k = t - t_in; full = num3d(f'{target:,}{unit}'); x0 = (W - full.width) // 2; y0 = 560
    lab = L.white(label, 58)
    if motion == 'A':
        q = min(1, k / 0.6); v = target if q >= 1 else int(target * L.ease(q) / 1000) * 1000 + int(target % 1000 * q)
        im = num3d(f'{v:,}{unit}'); L.pop(cv, im, ((W - im.width) // 2, y0), t, t_in)
    elif motion == 'B':
        q = min(1, k / 0.16); s = 1.7 - 0.7 * q * q + (0.06 * math.sin((k - 0.16) * 40) * math.exp(-(k - 0.16) * 14) if k > 0.16 else 0)
        im = full.resize((int(full.width * s), int(full.height * s)), Image.LANCZOS); put(cv, im, (W - im.width) // 2, y0 + (full.height - im.height) // 2, min(1, k / 0.06))
    else:
        q = L.ease(min(1, k / 0.4)); put(cv, full, x0, y0 + 140 * (1 - q), q)
    if k > 0.25: put(cv, lab, (W - lab.width) // 2, y0 - lab.height - 6, min(1, (k - 0.25) / 0.15))

def ring(cv, cx, cy, r, t):
    k = L.ease(min(1, t / 0.25)); im = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(im); r = r * (1.25 - 0.25 * k)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=INK + (255,), width=16); d.ellipse((cx - r + 4, cy - r + 4, cx + r - 4, cy + r - 4), outline=YEL + (255,), width=8)
    put(cv, im, 0, 0, k)

DOO = os.path.join(L.REPO, 'public/assets/shortform/brush-fill/as24-theme/doodle') + '/'
_doo = {}
def doodle(name, w, rot=0, flip=False):
    """노션 두들 원본(SVG)을 그대로 그려 알파만 읽고 노랑으로 칠한다. 패스는 고치지 않는다(크기·회전만)."""
    k = (name, w, rot, flip)
    if k not in _doo:
        png = subprocess.run(['rsvg-convert', '-w', str(int(w)), DOO + name], capture_output=True, check=True).stdout
        import io
        a = Image.open(io.BytesIO(png)).convert('RGBA').getchannel('A')
        if flip: a = a.transpose(Image.FLIP_LEFT_RIGHT)
        if rot: a = a.rotate(rot, expand=True, resample=Image.BICUBIC)
        sh = Image.new('RGBA', a.size); sh.paste((0, 0, 0, 150), (0, 5), a)
        im = Image.new('RGBA', a.size); im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6))); im.paste(YEL + (255,), (0, 0), a); _doo[k] = im
    return _doo[k]

def draw_on(im, q):
    """붓으로 그리듯 12시 방향부터 시계 방향으로 나타남."""
    if q >= 1: return im
    m = Image.new('L', im.size, 0); ImageDraw.Draw(m).pieslice((-im.width, -im.height, im.width * 2, im.height * 2), -90, -90 + 360 * q, fill=255)
    out = im.copy(); out.putalpha(Image.fromarray(np.minimum(np.array(im.getchannel('A')), np.array(m)))); return out

def brush_ring(cv, cx, cy, w, k):
    im = draw_on(doodle('circle_387_339.svg', w), L.ease(min(1, k / 0.35))); put(cv, im, cx - im.width / 2, cy - im.height / 2)

def arrow_to(cv, name, ax, ay, tx, ty, grow):
    """노션 화살표 원본을 칩(ax, ay)에서 부위(tx, ty) 쪽으로. 길이에 맞춰 같은 비율로만 키우고 돌린다. 꼬리는 칩 밑에 물린다."""
    dx, dy = tx - ax, ty - ay; dist = math.hypot(dx, dy); w = max(60, int(dist * grow / 6) * 6); ang = math.atan2(dy, dx)
    im = doodle(name, w, rot=-round(math.degrees(ang)))
    put(cv, im, ax + math.cos(ang) * w / 2 - im.width / 2, ay + math.sin(ang) * w / 2 - im.height / 2)

_two = {}
def chevron_chip(h, flip=False):
    """노션 「오른쪽 화살표_356x232」 원본: 붓칠은 노랑으로, 안쪽 화살표는 원본 먹색 그대로."""
    if (h, flip) not in _two:
        import io
        png = subprocess.run(['rsvg-convert', '-h', str(h), DOO + 'chevron_arrow_356_232.svg'], capture_output=True, check=True).stdout
        a = np.array(Image.open(io.BytesIO(png)).convert('RGBA')); mint = a[..., 1] > 150
        a[mint, 0], a[mint, 1], a[mint, 2] = YEL; a[~mint, :3] = INK; im = Image.fromarray(a)
        if flip: im = im.transpose(Image.FLIP_LEFT_RIGHT)
        sh = Image.new('RGBA', im.size); sh.paste((0, 0, 0, 130), (0, 5), im.getchannel('A'))
        out = Image.new('RGBA', im.size); out.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6))); out.alpha_composite(im); _two[(h, flip)] = out
    return _two[(h, flip)]

_qm = {}
def quote(name, h):
    """노션 큰따옴표 원본(노랑 PNG). 크기만 바꾸고 그림자를 깐다."""
    if (name, h) not in _qm:
        im = Image.open(DOO + name).convert('RGBA'); im = im.resize((int(im.width * h / im.height), h), Image.LANCZOS)
        sh = Image.new('RGBA', (im.width + 24, im.height + 24)); sh.paste((0, 0, 0, 170), (12, 16), im.getchannel('A')); sh = sh.filter(ImageFilter.GaussianBlur(6)); sh.alpha_composite(im, (12, 12)); _qm[(name, h)] = sh
    return _qm[(name, h)]

def track_at(key, st):
    tr = TR[key]; i = int(round((st - tr['s0']) * 30)); p = tr['pts'][max(0, min(len(tr['pts']) - 1, i))]
    k = 7; lo = max(0, i - k // 2); a = np.array(tr['pts'][lo:lo + k]).mean(0) if lo < len(tr['pts']) else np.array(p)
    return a[0] * W, a[1] * H

SC = {  # 장면: 원본 구간 · 목소리 구간 · 자막 덩어리(낱말 번호) · 칩 글자 · 추적 키
    'wheel': dict(src=(7.0, 9.5), v=(2.95, 5.25), chunks=[[4, 6]], chip='브론즈 휠', track='c2'),
    'logo': dict(src=(19.5, 21.5), v=(5.42, 8.6), chunks=[[7, 9], [10, 12]], chip='볼보 로고 조명', track='c3'),
    'cluster': dict(src=(26.5, 29.0), v=(15.5, 19.8), chunks=[[22, 23], [24, 25]], chip='디지털 계기판', track=None, big=(40208, 'km', '주행거리', 25)),
    'screen': dict(src=(32.0, 34.5), v=(22.0, 24.45), chunks=[[28, 31]], chip='세로형 화면', track='c9'),
}
DEF = dict(font=None, caption='A', motion='A', brush='A', place='A', sfx=None, deco=None, link=None, quote=None)

def render(name, scene, **kw):
    o = dict(DEF); o.update(kw); s = dict(SC[scene]); s['chunks'] = [list(range(a, b + 1)) for a, b in s['chunks']]; set_font(o['font'])
    v0, v1 = s['v']; n = int((v1 - v0) * FPS); s0, s1 = s['src']; tmp = OUT + name + '.v.mp4'
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-vf', 'scale=540:960', '-c:v', 'libx264', '-crf', '24', '-pix_fmt', 'yuv420p', tmp], stdin=subprocess.PIPE)
    ch = make_chip(s['chip'], o['brush']); cb = ch.getbbox(); events = [('cut', 0.0)]
    t_chip = 0.2; events.append(('chip', t_chip))
    for i in range(n):
        t = i / FPS; st = s0 + (s1 - s0 - 0.04) * i / max(1, n - 1); cv = src_frame(st)
        place = ('D' if o['deco'] in ('B', 'C') else o['place']) if s['track'] else 'T'
        if o['link'] and s['track']:   # 잇기 줄: 칩과 부위를 노션 화살표 하나로 묶는다
            px, py = track_at(s['track'], st); k = t - t_chip - 0.12; g = L.ease(min(1, max(0, k) / 0.22)) * 0.6 + 0.4; bob = 6 * math.sin(t * 6)
            cl, cr, cbm = M - 10 + cb[0], M - 10 + cb[2], YB + cb[3]
            if o['link'] in ('A', 'B'):
                ax = min(max(px, cl + 90), cr - 90); ay = cbm - 34; d = math.hypot(px - ax, py - ay); stop = 100 if o['link'] == 'A' else 190
                tx, ty = px - (px - ax) / d * stop, py - (py - ay) / d * stop + bob
                if k >= 0: arrow_to(cv, 'hand_arrow_469_264.svg' if o['link'] == 'A' else 'long_arrow_280_56.svg', ax, ay, tx, ty, g)
                if o['link'] == 'B' and k >= 0.15: brush_ring(cv, px, py, 400, k - 0.15)
                chip_in(cv, ch, (M - 10, YB), t, t_chip, o['motion'])
            else:   # C: 칩이 부위 옆에 붙고, 칩 끝에 붓칠 화살표가 한 줄로 이어짐
                hh = cb[3] - cb[1]; right = px > W * 0.45; av = chevron_chip(int(hh * 0.92), flip=not right); cw = cb[2] - cb[0]
                x = (px - 120 - av.width - cw + 26) if right else (px + 120 + av.width - 26); x = min(max(x, 20), W - 20 - cw); y = max(200, py - hh / 2)
                chip_in(cv, ch, (x - cb[0], y - cb[1]), t, t_chip, o['motion'])
                if k >= 0: axx = (x + cw - 26) if right else (x - av.width + 26); put(cv, av, axx + (bob if right else -bob), y + hh * 0.04, min(1, k / 0.12))
        elif place == 'T': chip_in(cv, ch, (M - 10, YB), t, t_chip, o['motion'])   # 부위 추적이 없는 장면: 위쪽 고정
        else:
            px, py = track_at(s['track'], st)
            if place == 'A':   # 위쪽 고정 + 화살표가 부위를 따라감
                chip_in(cv, ch, (M - 10, YB), t, t_chip, o['motion'])
                if t >= t_chip + 0.1:
                    top = YB + cb[3] + 8; ln = int(max(70, min(py - 40 - top, 420))); ar, pd = L.arrimg(ln, False)
                    put(cv, ar, px - ar.width / 2, py - 40 - ln - pd + 10 * math.sin(t * 6), min(1, (t - t_chip - 0.1) / 0.12))
            elif place == 'B':   # 칩이 부위 바로 위에 붙어서 따라감
                x = min(max(px - (cb[0] + cb[2]) / 2, 20 - cb[0]), W - 20 - cb[2]); y = max(180, py - 150 - cb[3])
                chip_in(cv, ch, (x, y), t, t_chip, o['motion'])
            elif place == 'C':   # 위쪽 고정 칩 + 부위에 노션 붓 원
                chip_in(cv, ch, (M - 10, YB), t, t_chip, o['motion'])
                if t >= t_chip + 0.1: brush_ring(cv, px, py, 400, t - t_chip - 0.1)
            else:   # 꾸밈 줄: 칩은 위쪽 고정, 부위 표시만 노션 두들로
                chip_in(cv, ch, (M - 10, YB), t, t_chip, o['motion']); k = t - t_chip - 0.1
                if k >= 0:
                    brush_ring(cv, px, py, 400, k)
                    if o['deco'] == 'B' and k >= 0.2:   # 붓 화살표: 칩 아래에서 부위 쪽으로
                        ar = doodle('arrow_right_170_100.svg', 180, rot=-62); q = L.ease(min(1, (k - 0.2) / 0.2))
                        put(cv, ar.crop((0, 0, ar.width, max(1, int(ar.height * q)))), px - 90 - ar.width / 2, py - 180 - ar.height + 8 * math.sin(t * 6))
                    if o['deco'] == 'C' and k >= 0.3:   # 강조 선: 원 양쪽 위로 톡
                        for nm, dx, fl in (('accent_125_139.svg', -250, False), ('accent_125_139.svg', 250, True)):
                            ac = doodle(nm, 120, flip=fl); L.pop(cv, ac, (int(px + dx - ac.width / 2), int(py - 230 - ac.height / 2)), t, t_chip + 0.4)
        hide = False
        if s.get('big'):
            tg, un, lb, wj = s['big']; tb = WS[wj][1] - v0 - 0.22
            number_in(cv, tg, un, lb, t, tb, o['motion']); hide = t >= tb
            if i == 0: events.append(('big', tb))
        if o['quote'] == 'A' and t >= t_chip + 0.12:   # 칩 왼쪽 위에 열기 따옴표를 걸친다: 칩 = 방금 말한 낱말
            qo = quote('quote_open_320_260.png', 92); L.pop(cv, qo, (M - 10 + cb[0] - 34, YB + cb[1] - 62), t, t_chip + 0.12)
        if not hide:
            SUB.pop('box', None); draw_sub(cv, v0 + t, s['chunks'], o['caption'])
            if o['quote'] in ('B', 'C') and 'box' in SUB:   # 말 자막을 따옴표로 열고 닫는다
                bx, by, bw, bh = SUB['box']; first = v0 + t < WS[s['chunks'][1][0]][1] - 0.05 if len(s['chunks']) > 1 else True; last = not first or len(s['chunks']) == 1
                big = o['quote'] == 'C'; qh = 120 if big else 64
                if big or first: qo = quote('quote_open_320_260.png', qh); put(cv, qo, bx - (20 if big else qo.width - 30), by - qh + (4 if big else 30))
                if big or last: qc = quote('quote_close_102_83.png', qh); put(cv, qc, bx + bw - (qc.width - 20 if big else 30), (by + bh - 34) if big else (by + 14))
        ff.stdin.write(cv.convert('RGB').tobytes())
    ff.stdin.close(); ff.wait()
    # 소리: 목소리 + (효과음 줄만) 효과음
    ins = ['-ss', str(v0), '-t', str(v1 - v0), '-i', G + 'voice5.wav']; fl = ['[1:a]volume=1.0[v]']; mix = '[v]'
    if o['sfx']:
        A = os.path.join(L.REPO, 'public/assets/shortform/sfx') + '/'
        mp = {'A': {'cut': (A + 'whoosh.wav', .45), 'chip': (A + 'ding.wav', .7), 'big': (A + 'ding.wav', .7)},
              'B': {'cut': (SX + '/minimal/swipe.mp3', .5), 'chip': (SX + '/minimal/select.mp3', .55), 'big': (SX + '/minimal/success.mp3', .5)},
              'C': {'cut': (SX + '/cinematic/swipe.mp3', .5), 'chip': (SX + '/cinematic/select.mp3', .55), 'big': (SX + '/cinematic/success.mp3', .5)}}[o['sfx']]
        for q, (ev, te) in enumerate(events):
            f, vol = mp[ev]; ins += ['-i', f]; fl.append(f'[{q + 2}:a]adelay={int(max(0, te - 0.02) * 1000)}:all=1,volume={vol}[s{q}]'); mix += f'[s{q}]'
        fl.append(f'{mix}amix=inputs={len(events) + 1}:normalize=0:duration=first[a]'); am = '[a]'
    else: am = '[v]'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp] + ins + ['-filter_complex', ';'.join(fl), '-map', '0:v', '-map', am, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', OUT + name + '.mp4'], check=True)
    os.remove(tmp)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str((v1 - v0) * 0.62), '-i', OUT + name + '.mp4', '-frames:v', '1', OUT + name + '.jpg'], check=True)
    print(name, round(v1 - v0, 2), 's')

if __name__ == '__main__':
    only = sys.argv[1:]
    JOBS = [('font_a', 'wheel', {}), ('font_b', 'wheel', {'font': FD + '/BlackHanSans.ttf'}), ('font_c', 'wheel', {'font': FD + '/DoHyeon.ttf'}),
            ('caption_a', 'logo', {'place': 'T'}), ('caption_b', 'logo', {'caption': 'B', 'place': 'T'}), ('caption_c', 'logo', {'caption': 'C', 'place': 'T'}),
            ('motion_a', 'cluster', {}), ('motion_b', 'cluster', {'motion': 'B'}), ('motion_c', 'cluster', {'motion': 'C'}),
            ('brush_a', 'wheel', {}), ('brush_b', 'wheel', {'brush': 'B'}), ('brush_c', 'wheel', {'brush': 'C'}),
            ('place_a', 'screen', {}), ('place_b', 'screen', {'place': 'B'}), ('place_c', 'screen', {'place': 'C'}),
            ('deco_a', 'screen', {}), ('deco_b', 'screen', {'deco': 'B'}), ('deco_c', 'screen', {'deco': 'C'}),
            ('link_a', 'screen', {'link': 'A'}), ('link_b', 'screen', {'link': 'B'}), ('link_c', 'screen', {'link': 'C'}),
            ('quote_a', 'wheel', {'link': 'A', 'quote': 'A'}), ('quote_b', 'logo', {'place': 'T', 'quote': 'B'}), ('quote_c', 'logo', {'place': 'T', 'caption': 'C', 'quote': 'C'}),
            ('sfx_a', 'cluster', {'sfx': 'A'}), ('sfx_b', 'cluster', {'sfx': 'B'}), ('sfx_c', 'cluster', {'sfx': 'C'})]
    for nm, sc, kw in JOBS:
        if not only or any(nm.startswith(x) for x in only): render(nm, sc, **kw)
