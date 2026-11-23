"""노랑 붓 뒤 인물 컷아웃(Brush Stroke Cutout) — 딜러 상반신 누끼 + 뒤에 노랑 붓 고리. 2026-11-24.

사용자: 「정장 입혀」 「리싱마크트가 더 낫지 않나」(노션 「스카우트24 테마별」 › 노랑 붓 뒤 인물 컷아웃_1000_842, 독일 리싱마크트, BE 사용: 사용).
구성 — 원본을 그대로 쓴다
  - 칠: 노션 원본 PNG(public/assets/shortform/brush-stroke-cutout/, 수정 없음)에서 노랑 칠 픽셀만 떼어 씀(원본 인물은 버림). 색은 #F5F200으로 맞춤(원본도 거의 같은 노랑)
  - 인물: 딜러 상반신 사진을 누끼(rembg u2net_human_seg)해 원본 인물 자리(가운데·머리 위 끝·아래 끝)에 같은 크기로 놓음
  - 끝 화면에서는 인물 아래 끝을 70px 부드럽게 사라지게 함(공중에 잘린 선이 보이지 않게)
출력
  OUT_badge.png  투명 바탕 1000×842(원본 크기)
  OUT_card.png   1080×1920 끝 화면 시안(배경 영상 장면 어둡게 + 배지 + 이름·소속)
  OUT_card.mp4   3초 움직임(인물이 살짝 올라오며 나타남 → 뒤에서 칠이 왼→오로 그어짐 → 이름)
사용:
  python3 brush_stroke_cutout.py 상반신사진 OUT --name "강성경 딜러" --org "서울오토갤러리 레이브" [--bg 원본영상.mp4 --bg-at 초]
"""
import argparse, io, os, subprocess, tempfile

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
ORIG = os.path.join(REPO, 'public', 'assets', 'shortform', 'brush-stroke-cutout', 'as3_26_brush_person_cutout.png')
FONT = os.path.join(HERE, 'fonts')
YEL = (0xF5, 0xF2, 0x00)
W, H, FPS = 1080, 1920, 30
TOP = 220      # 배지 윗선 — 배지 아래 끝(TOP+842)이 로마 원본 번호판(y 1080~1160) 위에 오게
NAME_Y = 1220  # 이름 줄 윗선 — 번호판 아래
CX = 500       # 원본 안 인물 가운데 x(1000 폭 기준)


def stroke_layer():
    a = np.array(Image.open(ORIG).convert('RGBA')).astype(int)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    yel = (r > 170) & (g > 170) & (b < 120) & (r - b > 110)
    out = np.zeros(a.shape, np.uint8); out[..., 0], out[..., 1], out[..., 2] = YEL
    out[..., 3] = np.where(yel, al, 0)
    return Image.fromarray(out, 'RGBA')


def person_cutout(photo):
    from rembg import remove, new_session
    cut = remove(Image.open(photo).convert('RGB'), session=new_session('u2net_human_seg'))
    a = cut.getchannel('A').filter(ImageFilter.MinFilter(3))  # 바깥 1px 회색 테두리 걷어냄(사진은 그대로)
    cut.putalpha(a)
    c = cut.crop(cut.getbbox())
    s = 842 / c.height
    return c.resize((round(c.width * s), 842), Image.LANCZOS)


def badge(stroke, person, reveal=1.0, rise=0.0, appear=1.0, fade_bottom=0):
    out = Image.new('RGBA', stroke.size, (0, 0, 0, 0))
    if reveal > 0:
        m = stroke.getchannel('A')
        if reveal < 1:
            cut = Image.new('L', m.size, 0); ImageDraw.Draw(cut).rectangle((0, 0, round(m.width * reveal), m.height), fill=255)
            m = Image.composite(m, Image.new('L', m.size, 0), cut)
        lay = stroke.copy(); lay.putalpha(m); out.alpha_composite(lay)
    if appear > 0:
        p = person.copy()
        if fade_bottom:
            a = np.array(p.getchannel('A')).astype(float)
            ramp = np.clip((p.height - np.arange(p.height)) / fade_bottom, 0, 1)[:, None]
            p.putalpha(Image.fromarray((a * ramp).astype(np.uint8)))
        dy = round(60 * rise)
        if appear < 1:
            p.putalpha(p.getchannel('A').point(lambda v: round(v * appear)))
        out.alpha_composite(p, (CX - p.width // 2, dy))
    return out


def ease(t): t = max(0.0, min(1.0, t)); return 1 - (1 - t) ** 3


def card(stroke, person, name, org, bg_img, t):
    f = Image.blend(bg_img, Image.new('RGB', bg_img.size, (0, 0, 0)), 0.55).convert('RGBA')
    # 인물이 먼저(0.15초 안에) 나타나고 칠이 뒤에서 그어짐 — 원본 칠은 원본 인물 뒤가 비어 있어, 인물 없이 칠만 보이면 구멍이 드러남
    b = badge(stroke, person, reveal=ease((t - 0.2) / 0.6), rise=1 - ease(t / 0.4), appear=ease(t / 0.15), fade_bottom=70)
    f.alpha_composite(b, ((W - b.width) // 2, TOP))
    k = ease((t - 0.8) / 0.4)
    if k > 0:
        dr = ImageDraw.Draw(f)
        f1 = ImageFont.truetype(os.path.join(FONT, 'Pretendard-ExtraBold.otf'), 84)
        f2 = ImageFont.truetype(os.path.join(FONT, 'Pretendard-SemiBold.otf'), 48)
        y = NAME_Y + round(30 * (1 - k)); al = round(255 * k)
        for txt, fnt, yy in ((name, f1, y), (org, f2, y + 110)):
            tw = dr.textlength(txt, font=fnt)
            dr.text(((W - tw) / 2, yy), txt, font=fnt, fill=(255, 255, 255, al))
    return f.convert('RGB')


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('photo'); ap.add_argument('out')
    ap.add_argument('--name', required=True); ap.add_argument('--org', default=''); ap.add_argument('--bg')
    ap.add_argument('--bg-at', type=float, default=None); ap.add_argument('--sec', type=float, default=3.0)
    a = ap.parse_args()
    stroke, person = stroke_layer(), person_cutout(a.photo)
    badge(stroke, person).save(a.out + '_badge.png')
    if a.bg:
        dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', a.bg], capture_output=True, text=True).stdout)
        png = subprocess.run(['ffmpeg', '-loglevel', 'error', '-ss', f'{a.bg_at if a.bg_at is not None else max(0, dur - 4):.2f}', '-i', a.bg, '-frames:v', '1', '-vf', f'scale={W}:{H}', '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True, check=True).stdout
        bg = Image.open(io.BytesIO(png)).convert('RGB')
    else:
        bg = Image.new('RGB', (W, H), (40, 40, 44))
    card(stroke, person, a.name, a.org, bg, 9).save(a.out + '_card.png')
    with tempfile.TemporaryDirectory() as td:
        for i in range(round(a.sec * FPS)):
            card(stroke, person, a.name, a.org, bg, i / FPS).save(f'{td}/{i:04d}.png')
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-framerate', str(FPS), '-i', f'{td}/%04d.png', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', a.out + '_card.mp4'], check=True)
    print('완료:', a.out + '_badge.png', a.out + '_card.png', a.out + '_card.mp4')


if __name__ == '__main__':
    main()
