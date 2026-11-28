# 손글씨 굵은 화살표(노션 스카우트24 테마별 「손글씨 굵은 화살표 오른쪽_551_332」, 오토스카우트24 smyle 원본 SVG)
# 부위 이름표: 칩은 부위 옆 위(화면 가운데 쪽)에, 화살표는 칩 아래 모서리에서 부위로 비스듬히(50°) 내려꽂힘.
# 색은 be_locked_rules 노랑 한 가지 + 옅은 그림자. 모양은 원본 그대로(회전·좌우 뒤집기만).
import io, math, os
import numpy as np
import cairosvg
from PIL import Image, ImageFilter

REPO = os.environ.get('BOBAE_REPO', os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../../..')))
SVG = REPO + '/public/assets/shortform/arrows/arrow_right_why_smyle_551_332.svg'
if not os.path.exists(SVG): SVG = '/home/claude/bobaekimboae/bobaedream/public/assets/shortform/arrows/arrow_right_why_smyle_551_332.svg'


def _hex(c):
    c = c.lstrip('#'); return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))


class HandArrow:
    def __init__(self, color='#F5F200', length=150, angle=50, gap=12):
        self.L = length; self.ang = angle; self.gap = gap
        png = cairosvg.svg2png(url=SVG, output_width=length * 2)
        a = Image.open(io.BytesIO(png)).convert('RGBA').getchannel('A').resize((length, round(length * 332 / 551)), Image.LANCZOS)
        im = Image.new('RGBA', a.size, _hex(color) + (0,)); im.putalpha(a)
        pad = 24; self.base = Image.new('RGBA', (im.width + pad * 2, im.height + pad * 2))
        sh = Image.new('RGBA', im.size, (0, 0, 0, 0)); sh.putalpha(a.point(lambda v: int(v * 0.45)))
        self.base.alpha_composite(sh.filter(ImageFilter.GaussianBlur(7)), (pad + 4, pad + 6)); self.base.alpha_composite(im, (pad, pad))
        self.pad = pad; self._c = {}

    def img(self, deg, flip):   # deg: 화면에서 화살표가 가리키는 방향(0=오른쪽, 90=아래)
        k = (round(deg), flip)
        if k not in self._c:
            b = self.base.transpose(Image.FLIP_LEFT_RIGHT) if flip else self.base
            r = (deg - 180) if flip else deg
            self._c[k] = b.rotate(-r, resample=Image.BICUBIC, expand=True)
        return self._c[k]

    def layout(self, x, y, cw, ch, W, H, top_limit=330, bottom_limit=None):
        """부위 점(x,y) → (칩 왼위 x, 칩 왼위 y, 화살표 방향°, 꼬리점). 칩은 화면 가운데 쪽, 위가 모자라면 아래로."""
        bottom_limit = bottom_limit or H - 560
        side = 1 if x < W / 2 else -1             # 칩이 놓일 쪽(+1 오른쪽)
        for vert in (1, -1):                      # 1 = 칩이 위, -1 = 칩이 아래
            deg = 180 - self.ang if side > 0 else self.ang   # 화살표가 부위로 향하는 방향(아래로 꽂힘)
            if vert < 0: deg = -deg
            d = (self.gap + self.L * 0.92)
            tx = x - d * math.cos(math.radians(deg)); ty = y - d * math.sin(math.radians(deg))
            cx = tx - (0.22 * cw if side > 0 else 0.78 * cw); cx = min(W - 40 - cw, max(40, cx))
            cy = ty - ch - 4 if vert > 0 else ty + 4
            if (vert > 0 and cy >= top_limit) or (vert < 0 and cy + ch <= bottom_limit): break
        return cx, cy, deg, (tx, ty)

    def draw(self, cv, x, y, deg, u):
        """끝이 (x,y)에서 gap 떨어진 곳을 가리키게. u: 등장 뒤 초. 뒤에서 미끄러져 들어와 살짝 넘침 → 방향 따라 숨쉬기."""
        if u < 0: return
        flip = math.cos(math.radians(deg)) < 0
        A = self.img(deg, flip)
        k = min(1.0, u / 0.22); e = 1 - (1 - k) ** 3 + 0.12 * math.sin(k * math.pi)
        back = 46 * (1 - e) - 5 * math.sin(max(0.0, u - 0.22) * 2 * math.pi * 1.3) * min(1.0, max(0.0, u - 0.22) / 0.3)
        c, s = math.cos(math.radians(deg)), math.sin(math.radians(deg))
        mid = self.gap + self.L * 0.46 + back           # 화살표 가운데가 끝에서 떨어진 거리
        px, py = x - c * mid, y - s * mid
        if k < 1:
            A = A.copy(); A.putalpha(Image.fromarray((np.array(A.getchannel('A')) * min(1.0, k * 2.2)).astype('uint8')))
        cv.alpha_composite(A, (int(px - A.width / 2), int(py - A.height / 2)))
