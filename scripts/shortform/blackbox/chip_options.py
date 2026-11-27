#!/usr/bin/env python3
"""기본칩 고르기 시트: 제목 한 줄을 노션 원본 칩 전부로 그려 한 장에 보여준다.
인스타 담당자가 번호를 보고 원장 title.shape 에 이름을 적는다(비우면 자동 선택).
사용: python3 chip_options.py "교차로 신호위반" [--out chip_options.png]
"""
import argparse, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lockup as LK
from PIL import Image, ImageDraw

ap = argparse.ArgumentParser(); ap.add_argument('text'); ap.add_argument('--out', default='chip_options.png'); ap.add_argument('--size', type=int, default=80)
a = ap.parse_args()
f = LK.FN('SemiBold', a.size); b = f.getbbox(a.text); auto = LK.pick_shape(b[2] - b[0], b[3] - b[1])
cells = []
for n in LK.ORIGINALS:
    c, _ = LK.chip(a.text, a.size, shape=n); c.thumbnail((520, 300)); cells.append((n, c))
CW, CH = 560, 340; cols = 2; rows = (len(cells) + 1) // 2
sheet = Image.new('RGB', (CW * cols, CH * rows), (24, 26, 30)); d = ImageDraw.Draw(sheet); lf = LK.FN('Bold', 26)
for i, (n, c) in enumerate(cells):
    x, y = (i % cols) * CW, (i // cols) * CH
    sheet.paste(c, (x + (CW - c.width) // 2, y + 50 + (CH - 60 - c.height) // 2), c)
    d.text((x + 16, y + 12), f"{i + 1}. {n}" + ("  ← 자동 선택" if n == auto else ''), font=lf, fill=(255, 230, 0) if n == auto else (220, 220, 220))
sheet.save(a.out); print(a.out, '자동 선택:', auto)
