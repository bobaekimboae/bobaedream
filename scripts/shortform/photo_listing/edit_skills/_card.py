"""편집 스킬 공용 그리기: 카드 배경(흐린 매물 사진)·종이 상자·남색 머리·초록 체크·색·폰트"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # photo_listing
sys.path.insert(0, os.path.dirname(HERE))
os.environ.setdefault('SAG_EDIT', 'bobae_be')
_argv = sys.argv; sys.argv = ['x', '/dev/null', '/tmp/report_cut_tmp']  # sag_reel_v1은 불러올 때 인자를 읽음
import sag_reel_v1 as R  # noqa: E402
sys.argv = _argv

W, H = 1080, 1920
PAPER = (251, 250, 246)
NAVY = (30, 42, 68)
INK = (26, 26, 26)
GREY = (120, 120, 120)
LINE = (230, 227, 218)
GREEN = (22, 150, 92)
YEL = (245, 242, 0)  # AS24 붓칠 노랑 #F5F200 (2026-11-19 전수조사)
RED = (214, 38, 42)


def F(path, s):
    return ImageFont.truetype(path, s)


def bg_of(car, n):
    src = Image.open(os.path.join(car, 'src2', f'p{n:02d}.png')).convert('RGB')
    sc = max(W / src.width, H / src.height)
    im = src.resize((int(src.width * sc) + 1, int(src.height * sc) + 1), Image.LANCZOS)
    x0 = (im.width - W) // 2; y0 = (im.height - H) // 2
    im = im.crop((x0, y0, x0 + W, y0 + H)).filter(ImageFilter.GaussianBlur(28))
    return Image.eval(im, lambda v: int(v * .42)).convert('RGBA')


def panel(base, box, r=28):
    x0, y0, x1, y1 = box
    sh = Image.new('L', base.size, 0)
    ImageDraw.Draw(sh).rounded_rectangle((x0, y0 + 14, x1, y1 + 14), r, fill=150)
    sh = sh.filter(ImageFilter.GaussianBlur(18))
    base.paste(Image.new('RGBA', base.size, (0, 0, 0, 255)), (0, 0), sh)
    ImageDraw.Draw(base).rounded_rectangle(box, r, fill=PAPER)


def header(d, box, title, sub):
    x0, y0, x1, _ = box
    d.rounded_rectangle((x0, y0, x1, y0 + 128), 28, fill=NAVY)
    d.rectangle((x0, y0 + 90, x1, y0 + 128), fill=NAVY)
    d.text((x0 + 44, y0 + 64), title, font=F(R.BLACK, 50), fill=(255, 255, 255), anchor='lm')
    d.text((x1 - 44, y0 + 64), sub, font=F(R.SEMI, 30), fill=(196, 206, 228), anchor='rm')


def check(d, cx, cy, r=27):
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=GREEN)
    d.line([(cx - 12, cy + 1), (cx - 3, cy + 11), (cx + 14, cy - 10)], fill=(255, 255, 255), width=7, joint='curve')


