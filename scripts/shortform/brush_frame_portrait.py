"""브러시 프레임 프로필(Brush Frame Portrait) — 딜러 얼굴 원형 사진 + 뒤 노랑 붓칠. 2026-11-24.

사용자: 「스카우트 아이콘에 딜러 얼굴 기교 부린거 … 만들어봐」.
근거: 노션 「스카우트24 테마별」 › 브러시 프레임 프로필(Brush Frame Portrait)_민트_150x150 · _158x142
(임모스카우트24). 그 DB의 「BE 사용」이 「노랑이면 사용」이라 칠은 붓칠 노랑 #F5F200만 쓴다.

구성 — 원본을 그대로 쓴다(2026-11-24 사용자 「항상 이야기하잖아 원본 써라고. 색만 바꿔봐」)
  - 칠: 노션 원본 PNG(public/assets/shortform/brush-frame-portrait/)의 민트 칠을 떼어 색만 노랑. 모양·자리·기울기 원본 그대로
  - 원: 원본 원 자리(중심 81·64.5, 지름 117)에 딜러 사진. 얼굴은 원 지름의 86% 크기로 줄여 아래 맞춤(「얼굴 좀 더 작게 밸런스」)
사진은 자르기·원형 틀만(보정 없음).

출력
  OUT_badge.png   투명 바탕 배지(원 + 칠)
  OUT_card.png    1080×1920 끝 화면 시안(배경 영상 마지막 장면 어둡게 + 배지 + 이름·소속)
  OUT_card.mp4    3초 움직임(원 톡 커짐 → 칠이 왼→오로 그어짐 → 이름 올라옴)
사용:
  python3 brush_frame_portrait.py 사진 OUT --name "강성경 딜러" --org "서울오토갤러리 레이브" [--bg 원본영상.mp4 --bg-at 초]
"""
import argparse, functools, io, math, os, subprocess, tempfile

from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
THEME = os.path.join(REPO, 'public', 'assets', 'shortform', 'brush-fill', 'as24-theme')
FONT = os.path.join(HERE, 'fonts')
YEL, DISC, INK = (0xF5, 0xF2, 0x00), (0xED, 0xEF, 0xF2), (0x22, 0x22, 0x22)
W, H, FPS = 1080, 1920, 30
TOP = 300  # 배지 윗선. 원본 영상 번호판(로마 y 1080~1160)을 칠이 덮지 않는 자리 — 차가 바뀌면 번호판 위치를 보고 정함
NAME_Y = 1220  # 이름 줄 윗선 — 번호판 아래(이름·소속도 번호판을 덮지 않음)


ORIG = os.path.join(REPO, 'public', 'assets', 'shortform', 'brush-frame-portrait', 'as24_0701_brush_frame_portrait.png')
O_CX, O_CY, O_D = 81.0, 64.5, 117.0   # 원본 안 원 중심·지름(158×142 실측)
MINT = (59, 212, 192)                 # 원본 칠 색 — 이 칠만 떼어 색을 노랑으로 바꿈


@functools.lru_cache(maxsize=4)
def stroke_mask(k):
    """원본 PNG의 민트 칠을 그대로 떼어 k배로 키운 알파(모양·자리·기울기 원본 그대로, 색만 버림).
    원 안쪽 픽셀은 원이 덮으므로 뺌. 원본이 작아 키운 뒤 가장자리만 다시 날카롭게 함(모양은 그대로)."""
    im = Image.open(ORIG).convert('RGBA'); w, h = im.size
    m = Image.new('L', (w, h), 0); mp, px = m.load(), im.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0 or (x - O_CX) ** 2 + (y - O_CY) ** 2 < (O_D / 2 - 0.5) ** 2: continue
            d = math.dist((r, g, b), MINT)
            if d < 90 or (g - r > 60): mp[x, y] = a
    # 원 테두리 안쪽 4px은 바로 바깥 칠 값을 이어 받음 — 원과 칠 사이에 틈(톱니 자국)이 보이지 않게. 원이 덮으므로 모양은 그대로
    R = O_D / 2
    for y in range(h):
        for x in range(w):
            dist = math.hypot(x - O_CX, y - O_CY)
            if R - 4 < dist < R - 0.5:
                sx, sy = O_CX + (x - O_CX) * (R + 1.5) / dist, O_CY + (y - O_CY) * (R + 1.5) / dist
                sx, sy = min(w - 1, max(0, round(sx))), min(h - 1, max(0, round(sy)))
                mp[x, y] = mp[sx, sy]
    big = m.resize((round(w * k), round(h * k)), Image.LANCZOS).filter(ImageFilter.GaussianBlur(k * 0.25))
    return big.point(lambda v: max(0, min(255, round((v - 128) * 3 + 128))))


def face_square(path):
    im = Image.open(path).convert('RGB')
    # 아래쪽에 다른 사진 띠가 붙은 원본(512×512, 아래 약 20px)은 그 줄을 뺌: 행 평균이 갑자기 하얘지는 곳에서 자름
    g = im.convert('L'); w, h = im.size
    cut = h
    for y in range(int(h * 0.8), h):
        if sum(g.getpixel((x, y)) for x in range(0, w, 8)) / len(range(0, w, 8)) > 245: cut = y; break
    s = min(w, cut)
    x0 = (w - s) // 2
    return im.crop((x0, 0, x0 + s, s))


def portrait_disc(photo, d, face=0.86):
    """원 안 인물: 사진(정사각)을 원 지름의 face배로 줄여 아래 맞춤 — 원본처럼 얼굴이 원의 절반쯤, 어깨가 원 아래로 잘림.
    빈 곳은 사진 바탕색으로 채우고 사진 위·옆 가장자리만 부드럽게 이음(보정 없음)."""
    sq = face_square(photo)
    bgc = tuple(int(v) for v in Image.open(photo).convert('RGB').crop((4, 4, 40, 40)).resize((1, 1), Image.BOX).getpixel((0, 0)))
    disc = Image.new('RGB', (d, d), bgc)
    s = round(d * face); ph = sq.resize((s, s), Image.LANCZOS)
    # 옆은 넓게(10%), 위는 좁게(3%) 이음 — 위를 넓게 흐리면 머리카락이 뿌옇게 번짐(사진 위가 머리에서 바로 잘린 프로필이라)
    fe = Image.new('L', (s, s), 255); px = fe.load(); fs, ft = max(1, round(s * 0.10)), max(1, round(s * 0.03))
    for y in range(s):
        for x in range(s):
            v = min(1.0, x / fs, (s - 1 - x) / fs, y / ft)
            if v < 1: px[x, y] = round(255 * v)
    disc.paste(ph, ((d - s) // 2, d - s + round(d * 0.02)), fe)
    mask = Image.new('L', (d * 4, d * 4), 0); ImageDraw.Draw(mask).ellipse((0, 0, d * 4 - 1, d * 4 - 1), fill=255)
    out = disc.convert('RGBA'); out.putalpha(mask.resize((d, d), Image.LANCZOS))
    return out


def badge(photo, D=440, reveal=1.0, scale=1.0, face=0.86):
    """투명 배지 = 원본 구도 그대로(칠 색만 노랑) + 원 자리에 딜러 사진. reveal = 칠이 왼→오로 그어진 비율, scale = 원 크기(움직임용)"""
    k = D / O_D
    sm = stroke_mask(k)
    out = Image.new('RGBA', sm.size, (0, 0, 0, 0))
    if reveal > 0:
        m = sm
        if reveal < 1:
            cut = Image.new('L', m.size, 0); ImageDraw.Draw(cut).rectangle((0, 0, round(m.width * reveal), m.height), fill=255)
            m = Image.composite(m, Image.new('L', m.size, 0), cut)
        lay = Image.new('RGBA', m.size, YEL + (0,)); lay.putalpha(m); out.alpha_composite(lay)
    d = max(2, round(D * scale)); cx, cy = round(O_CX * k), round(O_CY * k)
    out.alpha_composite(portrait_disc(photo, d, face), (cx - d // 2, cy - d // 2))
    return out


def ease(t): t = max(0.0, min(1.0, t)); return 1 - (1 - t) ** 3


def pop(t):  # 0→1.08→1
    t = max(0.0, min(1.0, t))
    return 1.08 * ease(t / 0.7) if t < 0.7 else 1.08 - 0.08 * ease((t - 0.7) / 0.3)


def card(photo, name, org, bg_img, t):
    f = bg_img.copy()
    f = Image.blend(f, Image.new('RGB', f.size, (0, 0, 0)), 0.55).convert('RGBA')
    b = badge(photo, scale=pop(t / 0.45) if t < 0.45 else 1.0, reveal=ease((t - 0.3) / 0.5))
    f.alpha_composite(b, ((W - b.width) // 2, TOP))
    k = ease((t - 0.6) / 0.4)
    if k > 0:
        dr = ImageDraw.Draw(f)
        f1 = ImageFont.truetype(os.path.join(FONT, 'Pretendard-ExtraBold.otf'), 84)
        f2 = ImageFont.truetype(os.path.join(FONT, 'Pretendard-SemiBold.otf'), 48)
        y = max(TOP + b.height + 10, NAME_Y) + round(30 * (1 - k)); al = round(255 * k)
        for txt, fnt, yy in ((name, f1, y), (org, f2, y + 110)):
            tw = dr.textlength(txt, font=fnt)
            dr.text(((W - tw) / 2, yy), txt, font=fnt, fill=(255, 255, 255, al))
    return f.convert('RGB')


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('photo'); ap.add_argument('out')
    ap.add_argument('--name', required=True); ap.add_argument('--org', default=''); ap.add_argument('--bg')
    ap.add_argument('--bg-at', type=float, default=None, help='배경 장면 시각(초). 없으면 끝 4초 전 — 렌더본 말고 원본 촬영 영상을 쓰면 칩·자막이 비치지 않음'); ap.add_argument('--sec', type=float, default=3.0)
    a = ap.parse_args()
    badge(a.photo).save(a.out + '_badge.png')
    if a.bg:
        dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', a.bg], capture_output=True, text=True).stdout)
        png = subprocess.run(['ffmpeg', '-loglevel', 'error', '-ss', f'{a.bg_at if a.bg_at is not None else max(0, dur - 4):.2f}', '-i', a.bg, '-frames:v', '1', '-vf', f'scale={W}:{H}', '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True, check=True).stdout
        bg = Image.open(io.BytesIO(png)).convert('RGB')
    else:
        bg = Image.new('RGB', (W, H), (40, 40, 44))
    card(a.photo, a.name, a.org, bg, 9).save(a.out + '_card.png')
    with tempfile.TemporaryDirectory() as td:
        n = round(a.sec * FPS)
        for i in range(n): card(a.photo, a.name, a.org, bg, i / FPS).save(f'{td}/{i:04d}.png')
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-framerate', str(FPS), '-i', f'{td}/%04d.png', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', a.out + '_card.mp4'], check=True)
    print('완료:', a.out + '_badge.png', a.out + '_card.png', a.out + '_card.mp4')


if __name__ == '__main__':
    main()
