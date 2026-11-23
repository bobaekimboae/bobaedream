"""브러시 프레임 프로필(Brush Frame Portrait) — 딜러 얼굴 원형 사진 + 뒤 노랑 붓칠. 2026-11-24.

사용자: 「스카우트 아이콘에 딜러 얼굴 기교 부린거 … 만들어봐」.
근거: 노션 「스카우트24 테마별」 › 브러시 프레임 프로필(Brush Frame Portrait)_민트_150x150 · _158x142
(임모스카우트24). 그 DB의 「BE 사용」이 「노랑이면 사용」이라 칠은 붓칠 노랑 #F5F200만 쓴다.

구성(원본 실측 비율, 158×142 기준)
  - 연회색 원판 위에 인물 사진을 원형으로 자름(원 지름 = 그림 폭의 약 72%)
  - 원 뒤 아래쪽에 붓칠 띠: 폭 = 원 지름 × 1.25, 원 아래 1/3 높이에 걸치고 원 밖으로 좌우 삐져나옴, 반시계 약 6°
  - 칠 모양은 노션 원본 SVG(brush-fill/as24-theme) 그대로, 가로·세로 같은 배율로만 키움
사진은 자르기·원형 틀만(보정 없음).

출력
  OUT_badge.png   투명 바탕 배지(원 + 칠)
  OUT_card.png    1080×1920 끝 화면 시안(배경 영상 마지막 장면 어둡게 + 배지 + 이름·소속)
  OUT_card.mp4    3초 움직임(원 톡 커짐 → 칠이 왼→오로 그어짐 → 이름 올라옴)
사용:
  python3 brush_frame_portrait.py 사진 OUT --name "강성경 딜러" --org "서울오토갤러리 레이브" [--bg 원본영상.mp4 --bg-at 초] [--shape 325_76]
"""
import argparse, io, math, os, subprocess, tempfile

from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
THEME = os.path.join(REPO, 'public', 'assets', 'shortform', 'brush-fill', 'as24-theme')
FONT = os.path.join(HERE, 'fonts')
YEL, DISC, INK = (0xF5, 0xF2, 0x00), (0xED, 0xEF, 0xF2), (0x22, 0x22, 0x22)
W, H, FPS = 1080, 1920, 30
TOP = 300  # 배지 윗선. 원본 영상 번호판(로마 y 1080~1160)을 칠이 덮지 않는 자리 — 차가 바뀌면 번호판 위치를 보고 정함
NAME_Y = 1220  # 이름 줄 윗선 — 번호판 아래(이름·소속도 번호판을 덮지 않음)


def brush(shape, width):
    """원본 SVG를 같은 배율로 폭 width에 맞춘 알파(투명 여백 제거)"""
    png = subprocess.run(['rsvg-convert', '-w', str(width * 2), os.path.join(THEME, shape + '.svg')], check=True, capture_output=True).stdout
    a = Image.open(io.BytesIO(png)).convert('RGBA').getchannel('A')
    a = a.crop(a.point(lambda v: 255 if v > 8 else 0).getbbox())
    return a.resize((width, max(1, round(a.height * width / a.width))), Image.LANCZOS)


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


def badge(photo, D=520, shape='325_76', tilt=-6.0, reveal=1.0, scale=1.0):
    """투명 배지. reveal = 칠이 왼→오로 그어진 비율, scale = 원 크기(움직임용)"""
    bw = round(D * 1.25)
    a = brush(shape, bw).rotate(-tilt, resample=Image.BICUBIC, expand=True)  # tilt -6 = 반시계 6°(오른쪽이 올라감)
    cw, ch = round(D * 1.5), round(D * 1.35)
    out = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    cx, cy = cw // 2, round(ch * 0.46)
    # 칠: 원 아래 1/3에 걸치고 왼쪽으로 조금 치우침(원본과 같은 자리)
    if reveal > 0:
        m = a.copy()
        if reveal < 1:
            cut = Image.new('L', m.size, 0); ImageDraw.Draw(cut).rectangle((0, 0, round(m.width * reveal), m.height), fill=255)
            m = Image.composite(m, Image.new('L', m.size, 0), cut)
        lay = Image.new('RGBA', m.size, YEL + (0,)); lay.putalpha(m)
        out.alpha_composite(lay, (cx - round(m.width * 0.52), cy + round(D * 0.18)))
    d = max(2, round(D * scale))
    disc = Image.new('RGBA', (d, d), DISC + (255,))
    ph = face_square(photo).resize((d, d), Image.LANCZOS).convert('RGBA')
    mask = Image.new('L', (d * 4, d * 4), 0); ImageDraw.Draw(mask).ellipse((0, 0, d * 4 - 1, d * 4 - 1), fill=255)
    mask = mask.resize((d, d), Image.LANCZOS)
    disc.alpha_composite(ph); disc.putalpha(mask)
    out.alpha_composite(disc, (cx - d // 2, cy - d // 2))
    return out


def ease(t): t = max(0.0, min(1.0, t)); return 1 - (1 - t) ** 3


def pop(t):  # 0→1.08→1
    t = max(0.0, min(1.0, t))
    return 1.08 * ease(t / 0.7) if t < 0.7 else 1.08 - 0.08 * ease((t - 0.7) / 0.3)


def card(photo, name, org, bg_img, t, shape):
    f = bg_img.copy()
    f = Image.blend(f, Image.new('RGB', f.size, (0, 0, 0)), 0.55).convert('RGBA')
    b = badge(photo, shape=shape, scale=pop(t / 0.45) if t < 0.45 else 1.0, reveal=ease((t - 0.3) / 0.5))
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
    ap.add_argument('--bg-at', type=float, default=None, help='배경 장면 시각(초). 없으면 끝 4초 전 — 렌더본 말고 원본 촬영 영상을 쓰면 칩·자막이 비치지 않음'); ap.add_argument('--shape', default='325_76'); ap.add_argument('--sec', type=float, default=3.0)
    a = ap.parse_args()
    badge(a.photo, shape=a.shape).save(a.out + '_badge.png')
    if a.bg:
        dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', a.bg], capture_output=True, text=True).stdout)
        png = subprocess.run(['ffmpeg', '-loglevel', 'error', '-ss', f'{a.bg_at if a.bg_at is not None else max(0, dur - 4):.2f}', '-i', a.bg, '-frames:v', '1', '-vf', f'scale={W}:{H}', '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True, check=True).stdout
        bg = Image.open(io.BytesIO(png)).convert('RGB')
    else:
        bg = Image.new('RGB', (W, H), (40, 40, 44))
    card(a.photo, a.name, a.org, bg, 9, a.shape).save(a.out + '_card.png')
    with tempfile.TemporaryDirectory() as td:
        n = round(a.sec * FPS)
        for i in range(n): card(a.photo, a.name, a.org, bg, i / FPS, a.shape).save(f'{td}/{i:04d}.png')
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-framerate', str(FPS), '-i', f'{td}/%04d.png', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', a.out + '_card.mp4'], check=True)
    print('완료:', a.out + '_badge.png', a.out + '_card.png', a.out + '_card.mp4')


if __name__ == '__main__':
    main()
