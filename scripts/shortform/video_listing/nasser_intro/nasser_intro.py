"""나세르식 인트로(사진 매물용) — 플래시 몽타주 → 정면 히어로(차만 또렷, 배경 흐림·어둡게·하늘 그라데이션·브랜드색 후광)
→ 차 지붕 뒤 3D 모델명 솟아오름(차 윤곽 크기·자리에 맞춰 따라감) → 노랑 붓칠 브랜드 + 흰 모델명 + 사실 줄 → 실루엣 흰 빛
사용: python3 nasser_intro.py <키>   (CARS 표 참고)"""
import os, sys, glob, json, math, subprocess
import numpy as np, cv2
from PIL import Image, ImageFilter
REPO = os.environ.get('BOBAE_REPO', os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../../..')))
sys.path.insert(0, REPO + '/scripts/shortform/video_listing'); sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../roma_rave'))   # partfx
from g350_v5_lib import *
import partfx as PFX
from rembg import new_session, remove

J = os.environ.get('NAS_ROOT', '/home/claude/shorts/joy/')   # 매물 사진(<키>/src)·블렌더 글자(bl/hero_<키>) 폴더
# 키: (브랜드, 모델명, 사실 줄, 히어로 사진, 몽타주 사진들, 블렌더 글자 폴더, 후광 색)
CARS = {
    'pista': ('페라리', '488 피스타 스파이더', '2019년 11월 등록 · 가솔린 · 3,500km', 'p01', ['p02', 'p05', 'p03'], 'hero_pista', (230, 30, 30)),
    'sto': ('람보르기니', '우라칸 STO', '2023년 5월 등록 · 가솔린 · 7,000km', 'p01', ['p02', 'p03', 'p09'], 'hero_sto', (40, 200, 80)),
    'g63': ('벤츠', 'G63 AMG', '2022년 9월 등록 · 가솔린 · W463 · 29,900km', 'p01', ['p02', 'p03', 'p07'], 'hero_g63', (120, 150, 255)),
    'p911ts': ('포르쉐', '911 터보 S 카브리올레', '2023년 2월 등록 · 가솔린 · 992 · 3,405km', 'p01', ['p02', 'p04', 'p06'], 'hero_p911ts', (230, 40, 30)),
}
key = sys.argv[1]; BRAND, MODEL, FACT, HERO, MONT, HDIR, GLOW = CARS[key]
SRC = J + key + '/src/'; OUT = J + f'nas_intro/nasser_intro_{key}.mp4'
FPS = 30; MT = 0.3; INTRO = MT * len(MONT); HERO_T = 3.7; TOTAL = INTRO + HERO_T


def ease(x): x = min(1.0, max(0.0, x)); return 1 - (1 - x) ** 3


def load(n): return Image.open(SRC + n + '.webp').convert('RGB')


def cover(im, z=1.0):   # 9:16 꽉 채우기(가운데 자르기) + 확대
    s = max(W / im.width, H / im.height) * z; r = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
    return r.crop(((r.width - W) // 2, (r.height - H) // 2, (r.width - W) // 2 + W, (r.height - H) // 2 + H))


# ── 히어로: 사진 배치(차 폭이 화면 폭에 맞게) + 차 윤곽 ──
hero = load(HERO)
pm = np.array(remove(hero, session=new_session('isnet-general-use'), only_mask=True)).astype(np.float32) / 255   # 사진에서 차 윤곽
n, lab, st, cen = cv2.connectedComponentsWithStats((pm > 0.5).astype(np.uint8), 8)
if n > 1:   # 사진 가운데에 가장 가까운 큰 덩어리 = 이 차
    sc_ = [st[i, 4] / (1 + np.hypot(cen[i, 0] - hero.width / 2, cen[i, 1] - hero.height / 2) / 200) for i in range(1, n)]
    i_ = 1 + int(np.argmax(sc_)); keep = lab == i_; pm = pm * cv2.dilate(keep.astype(np.uint8), np.ones((7, 7), np.uint8))
    bx, by, bw, bh = st[i_, :4]
else: bx, by, bw, bh = 0, 0, hero.width, hero.height
s0 = min(960 / bw, 600 / bh);   # 키 큰 차는 높이 기준으로 줄여 뒤 글자가 보이게
HW, HH = int(hero.width * s0), int(hero.height * s0)
OX = int(W / 2 - (bx + bw / 2) * s0); OY = int(1390 - (by + bh) * s0)   # 차 가운데 = 화면 가운데, 차 바닥 = 1390px
hero_l = hero.resize((HW, HH), Image.LANCZOS)
base = Image.new('RGB', (W, H)); base.paste(cover(hero, 1.0).filter(ImageFilter.GaussianBlur(18)), (0, 0))
base.paste(hero_l, (OX, OY)); base_np = np.array(base)
m = np.zeros((H, W), np.float32); pml = cv2.resize(pm, (HW, HH), interpolation=cv2.INTER_LINEAR)
x0_, y0_ = max(0, OX), max(0, OY); x1_, y1_ = min(W, OX + HW), min(H, OY + HH)
m[y0_:y1_, x0_:x1_] = pml[y0_ - OY:y1_ - OY, x0_ - OX:x1_ - OX]
m = cv2.ximgproc.guidedFilter(guide=cv2.cvtColor(base_np, cv2.COLOR_RGB2BGR), src=m, radius=5, eps=2e-3); m = np.clip((m - 0.5) * 1.8 + 0.5, 0, 1)
MASK = Image.fromarray((m * 255).astype(np.uint8))

# 배경: 흐림 + 어둡게 + 위쪽 밤하늘 + 차 뒤 브랜드색 후광
yy, xx = np.mgrid[0:H, 0:W]
g_ = np.clip(1 - yy / 900.0, 0, 1) ** 1.4; r_ = np.clip(1 - np.hypot((xx - W / 2) / 620, (yy - 780) / 360), 0, 1) ** 1.6
sk = np.zeros((H, W, 4), np.uint8)
for c in range(3): sk[..., c] = np.clip([8, 12, 40][c] * g_ + GLOW[c] * r_, 0, 255)
b_ = np.clip((yy - 1380) / 540.0, 0, 1) ** 1.2   # 아래쪽 바닥 어둡게
sk[..., 3] = np.clip(190 * g_ + 200 * r_ + 200 * b_, 0, 255); SKY = Image.fromarray(sk)
BGI = cover(hero, 1.15).filter(ImageFilter.GaussianBlur(22)).convert('RGBA')   # 사진 테두리가 비치지 않게 꽉 채운 흐림만; BGI = Image.alpha_composite(BGI, Image.new('RGBA', (W, H), (0, 0, 0, 125))); BGI = Image.alpha_composite(BGI, SKY)
SHARP = base.convert('RGBA')

# 3D 글자 프레임
CH = [Image.open(p).convert('RGBA') for p in sorted(glob.glob(J + f'bl/{HDIR}/*.png'))]
if CH:
    bb = None
    for im in CH:
        b = im.getbbox()
        if b: bb = b if bb is None else (min(bb[0], b[0]), min(bb[1], b[1]), max(bb[2], b[2]), max(bb[3], b[3]))
    CH = [im.crop(bb) for im in CH]
    for im in CH: im.putalpha(im.getchannel('A').point(lambda v: 0 if v < 24 else v))   # 옅은 알파 제거(글자 뒤 사각형 방지)

# 제목(로마와 같은 규칙: 노랑 붓칠 브랜드 + 흰 모델명 + 사실 줄)
HB = chip(BRAND, R['chip']['title_font_px'], title=True); hs = 104; HM = white(MODEL, hs)
while HM.getbbox()[2] > W - 24 - (M - 10 + HB.getbbox()[2] + 6) and hs > 60: hs -= 4; HM = white(MODEL, hs)
fs = 58; HS = white(FACT, fs)
while HS.getbbox()[2] > W - 2 * (M - 4) and fs > 36: fs -= 2; HS = white(FACT, fs)


def slam(cv, img, pos, t, t_in, dur=0.22):
    if t < t_in: return
    k = min(1.0, (t - t_in) / dur); s = 1.6 - 0.6 * (1 - (1 - k) ** 3)
    im = img.resize((max(1, int(img.width * s)), max(1, int(img.height * s))), Image.LANCZOS)
    if k < 1: im.putalpha(Image.fromarray((np.array(im.getchannel('A')) * min(1, k * 2.5)).astype('uint8')))
    cv.alpha_composite(im, (int(pos[0] + (img.width - im.width) / 2), int(pos[1] + (img.height - im.height) / 2)))


def acx(dst, src, x, y):
    sx, sy = max(0, -x), max(0, -y); x, y = max(0, x), max(0, y)
    w = min(src.width - sx, dst.width - x); h = min(src.height - sy, dst.height - y)
    if w > 0 and h > 0: dst.alpha_composite(src.crop((sx, sy, sx + w, sy + h)), (x, y))


def zoomed(im, z):   # 가운데 기준 확대
    cw, chh = W / z, H / z; return im.resize((W, H), box=(W / 2 - cw / 2, H / 2 - chh / 2, W / 2 + cw / 2, H / 2 + chh / 2))


proc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '/tmp/ni_v.mp4'], stdin=subprocess.PIPE)
MON = [cover(load(p), 1.0) for p in MONT]
TS = {}
for f in range(int(round(TOTAL * FPS))):
    t = f / FPS
    if t < INTRO:   # 플래시 몽타주
        k = int(t / MT); u = (t - k * MT) / MT; z = 1.15 - 0.15 * ease(u)
        cv = zoomed(MON[k], z).convert('RGBA')
        if u < 0.3: cv = Image.alpha_composite(cv, Image.new('RGBA', (W, H), (255, 255, 255, int(220 * (1 - u / 0.3)))))
    else:
        th = t - INTRO; z = 1.0 + 0.07 * ease(th / HERO_T)
        mz = zoomed(MASK, z); cv = Image.composite(zoomed(SHARP, z), zoomed(BGI, z), mz)
        if CH:   # 차 윤곽에 맞춘 3D 모델명(차가 앞을 가림)
            ma = np.array(mz) > 128; cols = np.nonzero(ma.mean(0) > 0.02)[0]
            x0, x1 = cols.min(), cols.max(); cxm = (x0 + x1) / 2; cwid = x1 - x0
            mid = ma[:, int(x0 + cwid * 0.25):int(x1 - cwid * 0.25)]; rows = np.nonzero(mid.mean(1) > 0.3)[0]; top = rows.min() if len(rows) else 800
            tw = min(1250.0, max(720.0, cwid * 0.98)); bs = top + 0.17 * tw
            if 's' in TS: tw, cxm, bs = [p * 0.75 + q * 0.25 for p, q in zip(TS['s'], (tw, cxm, bs))]
            TS['s'] = (tw, cxm, bs)
            ki = min(len(CH) - 1, int(max(0.0, th - 0.08) * 30)); im = CH[ki]; sc = tw / CH[-1].width
            im = im.resize((max(1, int(im.width * sc)), max(1, int(im.height * sc))), Image.LANCZOS)
            y = max(int(bs - CH[-1].height * sc), 575); x = int(cxm - im.width / 2)   # 제목 줄과 겹치면 아래로
            lay = Image.new('RGBA', (W, H))
            gl = Image.new('RGBA', im.size, GLOW + (0,)); gl.putalpha(im.getchannel('A').point(lambda v: int(v * 0.2))); acx(lay, gl.filter(ImageFilter.GaussianBlur(44)), x, y)
            sh = Image.new('RGBA', im.size); sh.paste((0, 0, 0, 160), (0, 0), im.getchannel('A')); acx(lay, sh.filter(ImageFilter.GaussianBlur(12)), x + 6, y + 16)
            acx(lay, im, x, y)
            a = np.array(lay.getchannel('A')).astype(float) * (1 - np.array(mz).astype(float) / 255); lay.putalpha(Image.fromarray(a.astype(np.uint8)))
            cv = Image.alpha_composite(cv, lay)
        cv = PFX.rim(cv, mz, th)
        if th < 0.12: cv = Image.alpha_composite(cv, Image.new('RGBA', (W, H), (255, 255, 255, int(230 * (1 - th / 0.12)))))
        slam(cv, HB, (M - 10, YB), th, 0.45); hb = HB.getbbox()
        slam(cv, HM, (M - 10 + hb[2] + 6, YB + (hb[1] + hb[3] - HM.height) // 2), th, 0.6); pop(cv, HS, (M - 4, YB + hb[3] + 16), th, 0.85)
    proc.stdin.write(cv.convert('RGB').tobytes())
proc.stdin.close(); proc.wait()

# 소리: 배경음 + 휙(몽타주) + 쿵(히어로) → −14 LUFS
A_ = R['audio']; BG = A + 'bgm/bobae_supercar_v1.mp3'
ev = [(0.0, 'whoosh', 0.45), (INTRO * 0.5, 'whoosh', 0.4), (INTRO + 0.02, 'impact', 0.6)]
inp = ['-i', '/tmp/ni_v.mp4', '-i', BG]; fl = [f'[1:a]atrim=0:{TOTAL},volume=0.7,afade=t=out:st={TOTAL - 0.8}:d=0.8[b]']; mx = ['[b]']
for j, (tc, nm, v) in enumerate(ev):
    inp += ['-i', A + 'sfx/' + nm + '.wav']; fl.append(f'[{j + 2}:a]volume={v},adelay={int(tc * 1000)}:all=1[s{j}]'); mx.append(f'[s{j}]')
fl.append(''.join(mx) + f"amix=inputs={len(mx)}:normalize=0:duration=longest,loudnorm=I={A_['loudness_lufs']}:TP={A_['true_peak_db']}:LRA=11,aresample=48000[a]")
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *inp, '-filter_complex', ';'.join(fl), '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', str(TOTAL), OUT], check=True)
print('완료', OUT, round(TOTAL, 2))
