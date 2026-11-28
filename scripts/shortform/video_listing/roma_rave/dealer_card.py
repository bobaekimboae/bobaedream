# 딜러 프사 카드 — 임모스카우트24 「브러시 프레임 프로필」(노션 스카우트24 테마별, 민트 158x142) 구조를
# 보배드림 벨기에판 노랑으로 옮김: 둥근 얼굴 사진 + 뒤에 붓 띠(노션 원본 446_76 모양, 색만 노랑).
# 사진: 서울오토갤러리 딜러 명단 프로필(저장소 public/assets/dealer-profile/…/450551-1.webp). 연락처 없음.
import io, math, os
import numpy as np
import cairosvg
from PIL import Image, ImageDraw, ImageFilter

REPO = os.environ.get('BOBAE_REPO', os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../../..')))
BAND_SVG = REPO + '/public/assets/shortform/brush-fill/as24-theme/446_76.svg'


def _hex(c):
    c = c.lstrip('#'); return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))


def face_circle(photo, D, crop=(14, 0, 498, 484)):
    # 원본 512 사진 아래 4% 칸은 다음 사람 사진이 묻어 있어 잘라 냄. 머리 위는 원본에서 잘려 있어 늘리지 않음.
    im = Image.open(photo).convert('RGB').crop(crop).resize((D * 2, D * 2), Image.LANCZOS)
    m = Image.new('L', (D * 2, D * 2), 0); ImageDraw.Draw(m).ellipse((0, 0, D * 2 - 1, D * 2 - 1), 255)
    out = im.convert('RGBA'); out.putalpha(m)
    return out.resize((D, D), Image.LANCZOS)            # 2배로 그려 줄여 가장자리 부드럽게


def band(width, color):
    png = cairosvg.svg2png(url=BAND_SVG, output_width=width)
    a = Image.open(io.BytesIO(png)).convert('RGBA').getchannel('A')
    out = Image.new('RGBA', a.size, _hex(color) + (0,)); out.putalpha(a)
    return out


class DealerCard:
    """얼굴(D) + 띠. draw(cv, cx, cy, t): t는 카드 시작부터 초."""
    def __init__(self, photo, color='#F5F200', D=460, band_w=780):
        self.D = D; self.face = face_circle(photo, D); self.band = band(band_w, color)
        sh = Image.new('RGBA', (D + 120, D + 120), (0, 0, 0, 0))
        ImageDraw.Draw(sh).ellipse((60, 70, 60 + D, 70 + D), (0, 0, 0, 150))
        self.shadow = sh.filter(ImageFilter.GaussianBlur(22))

    def box(self, cx, cy):          # 카드 전체가 차지하는 칸(아래 글자 자리 계산용)
        by = cy + int(self.D * 0.12)
        return (cx - self.band.width // 2, cy - self.D // 2, cx + self.band.width // 2, max(cy + self.D // 2, by + self.band.height))

    def draw(self, cv, cx, cy, t, t_band=0.05, t_face=0.12):
        D = self.D
        # 1) 띠: 왼쪽에서 오른쪽으로 칠해지듯 0.28초
        if t >= t_band:
            k = min(1.0, (t - t_band) / 0.28); k = 1 - (1 - k) ** 3
            w = max(1, int(self.band.width * k))
            B = self.band.crop((0, 0, w, self.band.height))
            cv.alpha_composite(B, (cx - self.band.width // 2, cy + int(D * 0.12)))
        # 2) 얼굴: 0.7배에서 살짝 넘쳐 1배로(0.32초)
        if t >= t_face:
            k = min(1.0, (t - t_face) / 0.32)
            s = 0.7 + 0.3 * (1 - (1 - k) ** 3) + 0.06 * math.sin(k * math.pi)
            a = min(1.0, k * 2.5)
            F = self.face if abs(s - 1) < 1e-3 else self.face.resize((round(D * s), round(D * s)), Image.LANCZOS)
            S = self.shadow if abs(s - 1) < 1e-3 else self.shadow.resize((round(self.shadow.width * s), round(self.shadow.height * s)), Image.LANCZOS)
            if a < 1:
                F = F.copy(); F.putalpha(Image.fromarray((np.array(F.getchannel('A')) * a).astype('uint8')))
                S = S.copy(); S.putalpha(Image.fromarray((np.array(S.getchannel('A')) * a).astype('uint8')))
            cv.alpha_composite(S, (cx - S.width // 2, cy - S.height // 2 + 6))
            cv.alpha_composite(F, (cx - F.width // 2, cy - F.height // 2))


if __name__ == '__main__':
    import sys
    p = REPO + '/public/assets/dealer-profile/seoul-auto-gallery-formal-ai/450551-1.webp'
    dc = DealerCard(p)
    cv = Image.new('RGBA', (1080, 1080), (30, 30, 34, 255)); dc.draw(cv, 540, 500, 2.0)
    cv.convert('RGB').save(sys.argv[1] if len(sys.argv) > 1 else '/tmp/bf/card.png')
