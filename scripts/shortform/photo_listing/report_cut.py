"""성능·상태 점검기록부 요약 독립 컷 + 가격 인하 독립 컷 (카탈로그형 단계 공개)

python3 report_cut.py <차 폴더>   # 차 폴더의 cards.json을 읽어 src2/pNN.png를 만든다

cards.json 예:
{
  "bg": 2,                                   # 배경으로 흐리게 깔 매물 사진 번호(src2/pNN.png)
  "report": {
    "first": 20,                             # 단계 이미지 시작 번호 → p20(머리만), p21(1줄), p22(2줄)…
    "doc": "inspect.jpg",                    # 성능지 원본(사고 부위 그림만 잘라 씀, 번호·차대번호 영역은 쓰지 않음)
    "diagram_box": [18, 467, 592, 672],      # 원본에서 차체 그림 자르는 칸
    "car": "포르쉐 카이엔 3.0 V6 · 2022년식",
    "stamp": "표시 없음",                     # 1줄째부터 차체 그림 위에 찍는 도장
    "rows": [["사고 이력 · 단순 수리", "없음"], ...],
    "foot": "중고자동차 성능·상태점검기록부 기준"
  },
  "price": {"first": 30, "old_label": "신차가", "old": "1억 2,720만원",
            "new_label": "할인 판매가", "new": "7,450만원", "note": "매입 1년 가까이 · 가격 인하", "photo": 2}
}

원칙: 칸에 쓰는 말은 점검기록부·딜러 글에 있는 사실만. 차량번호·차대번호·제시번호 칸은 잘라 쓰지 않는다.
단계 이미지는 cfg CUTS에서 넘김 'reveal'(0.18초 겹침)로 이어 붙이면 한 줄씩 켜지는 것처럼 보인다.
"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
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
YEL = (247, 236, 56)
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


CHIP_TITLES = False  # cards.json "chip_titles": true → 머리 제목은 영상의 노랑 구간 제목 칩이 대신함(머리에는 출처만)


def header(d, box, title, sub):
    x0, y0, x1, _ = box
    d.rounded_rectangle((x0, y0, x1, y0 + 128), 28, fill=NAVY)
    d.rectangle((x0, y0 + 90, x1, y0 + 128), fill=NAVY)
    if not CHIP_TITLES:
        d.text((x0 + 44, y0 + 64), title, font=F(R.BLACK, 50), fill=(255, 255, 255), anchor='lm')
    d.text((x1 - 44, y0 + 64), sub, font=F(R.SEMI, 30), fill=(196, 206, 228), anchor='rm')


def check(d, cx, cy, r=27):
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=GREEN)
    d.line([(cx - 12, cy + 1), (cx - 3, cy + 11), (cx + 14, cy - 10)], fill=(255, 255, 255), width=7, joint='curve')


def stamp(text, s=210):
    im = Image.new('RGBA', (s + 40, s + 40), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = (*GREEN, 235)
    d.ellipse((20, 20, 20 + s, 20 + s), outline=c, width=9)
    d.ellipse((38, 38, 2 + s, 2 + s), outline=c, width=3)
    d.text((20 + s / 2, 20 + s / 2 - 22), text, font=F(R.BLACK, 38), fill=c, anchor='mm')
    d.text((20 + s / 2, 20 + s / 2 + 30), '사고 부위', font=F(R.BOLD, 30), fill=c, anchor='mm')
    return im.rotate(-12, resample=Image.BICUBIC, expand=True)


def report_steps(car, spec, bg):
    rp = spec['report']
    doc = Image.open(os.path.join(car, rp['doc'])).convert('RGB')
    dg = doc.crop(tuple(rp['diagram_box']))
    sc_im = None
    if rp.get('scene'):  # 점검 장면 사진(성능지에 붙은 앞·뒤 사진) — 이 차를 실제로 점검했다는 증거
        sd = Image.open(os.path.join(car, rp['scene']['doc'])).convert('RGB').crop(tuple(rp['scene']['box']))
        cp = rp.get('compact')  # 2026-11-17: 카드 아랫선을 플랫폼 아래 가림 구역(1680) 위로 — 사진·그림·줄 간격을 줄임
        sw = 640 if cp else 760; sh_ = int(sd.height * sw / sd.width)
        sc_im = sd.resize((sw, sh_), Image.LANCZOS)
    cp = rp.get('compact')
    dw = (640 if cp else 760) if sc_im else 860; dh = int(dg.height * dw / dg.width)
    dg = dg.resize((dw, dh), Image.LANCZOS)
    rows = rp['rows']
    x0, x1 = 70, 1010
    y0 = 282 if sc_im else 300  # 딜러 칩(왼쪽 위) 아래에서 시작
    ytop_s = y0 + 128 + 88 + (24 if cp else 40)
    ytop_d = (ytop_s + sc_im.height + (56 if cp else 70)) if sc_im else (y0 + 128 + 96 + 44)
    yrows = ytop_d + dh + 30
    rh = (78 if cp else 84) if sc_im else 96
    y1 = yrows + rh * len(rows) + 80
    outs = []
    for k in range(len(rows) + 1):
        im = bg.copy()
        panel(im, (x0, y0, x1, y1))
        d = ImageDraw.Draw(im)
        header(d, (x0, y0, x1, y1), '성능·상태 점검기록부', '핵심 요약')
        d.text((x0 + 44, y0 + 128 + 48), rp['car'], font=F(R.BOLD, 40), fill=INK, anchor='lm')
        if sc_im:
            d.text((x0 + 44, ytop_s - 20), rp['scene'].get('label', '점검 장면 사진'), font=F(R.SEMI, 28), fill=GREY, anchor='lm')
            im.paste(sc_im, ((W - sc_im.width) // 2, ytop_s))
        d.text((x0 + 44, ytop_d - 20), '사고·교환 부위 표시', font=F(R.SEMI, 28), fill=GREY, anchor='lm')
        im.paste(dg, ((W - dw) // 2, ytop_d))
        d.rectangle(((W - dw) // 2 - 1, ytop_d - 1, (W + dw) // 2, ytop_d + dh), outline=LINE, width=2)
        if k >= 1 and rp.get('stamp'):
            st = stamp(rp['stamp'])
            im.alpha_composite(st, (W // 2 - st.width // 2, ytop_d + dh // 2 - st.height // 2))
        for i, (a, b) in enumerate(rows):
            yy = yrows + rh * i
            d.line([(x0 + 40, yy), (x1 - 40, yy)], fill=LINE, width=2)
            on = i < k
            cy = yy + rh / 2
            if on:
                check(d, x0 + 74, cy)
            else:
                d.ellipse((x0 + 47, cy - 27, x0 + 101, cy + 27), outline=(214, 210, 200), width=3)
            d.text((x0 + 124, cy), a, font=F(R.BOLD, 40), fill=INK if on else (190, 186, 178), anchor='lm')
            if on:
                d.text((x1 - 44, cy), b, font=F(R.BLACK, 40), fill=GREEN, anchor='rm')
        d.line([(x0 + 40, yrows + rh * len(rows)), (x1 - 40, yrows + rh * len(rows))], fill=LINE, width=2)
        d.text((W // 2, y1 - 42), rp['foot'], font=F(R.MED, 26), fill=GREY, anchor='mm')
        outs.append(im)
    return outs, y1


def price_steps(car, spec, bg):
    pr = spec['price']
    x0, x1, y0 = 70, 1010, 330
    ph = Image.open(os.path.join(car, 'src2', f"p{pr['photo']:02d}.png")).convert('RGB')
    pw = x1 - x0 - 60; phh = int(pw * 9 / 16)
    sc = max(pw / ph.width, phh / ph.height)
    ph = ph.resize((int(ph.width * sc) + 1, int(ph.height * sc) + 1), Image.LANCZOS)
    ph = ph.crop(((ph.width - pw) // 2, (ph.height - phh) // 2, (ph.width - pw) // 2 + pw, (ph.height - phh) // 2 + phh))
    y1 = y0 + 30 + phh + 560
    outs = []
    for k in range(2):
        im = bg.copy()
        panel(im, (x0, y0, x1, y1))
        d = ImageDraw.Draw(im)
        m = Image.new('L', ph.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, pw, phh), 18, fill=255)
        im.paste(ph, (x0 + 30, y0 + 30), m)
        yy = y0 + 30 + phh + 70
        d.text((W // 2, yy), pr['old_label'], font=F(R.SEMI, 36), fill=GREY, anchor='mm')
        fo = F(R.BLACK, 78)
        d.text((W // 2, yy + 80), pr['old'], font=fo, fill=(150, 150, 150) if k else INK, anchor='mm')
        if k:
            bb = d.textbbox((W // 2, yy + 80), pr['old'], font=fo, anchor='mm')
            d.line([(bb[0] - 14, bb[1] + 44), (bb[2] + 14, bb[3] - 30)], fill=RED, width=10)
            ay = yy + 160
            d.polygon([(W // 2 - 30, ay), (W // 2 + 30, ay), (W // 2, ay + 34)], fill=RED)
            d.text((W // 2, ay + 76), pr['new_label'], font=F(R.BOLD, 38), fill=INK, anchor='mm')
            fn = F(R.HEAVY, 116)
            bb = d.textbbox((W // 2, ay + 176), pr['new'], font=fn, anchor='mm')
            d.rectangle((bb[0] - 22, bb[1] + 30, bb[2] + 22, bb[3] + 14), fill=YEL)
            d.text((W // 2, ay + 176), pr['new'], font=fn, fill=INK, anchor='mm')
        if pr.get('note'):
            d.text((W // 2, y1 - 40), pr['note'], font=F(R.MED, 28), fill=GREY, anchor='mm')
        outs.append(im)
    return outs, y1


def spec_steps(car, spec, bg):
    """카탈로그 제원 카드: 위 매물 사진 · 엔진 한 줄 · 큰 숫자 칸 2×N · 아래 출처.
    2026-11-17 사용자: 말하는 숫자 하나에 칸 하나 — 단계마다 한 칸씩 켜짐(머리 1장 + 칸 수만큼). spec.step='row'면 예전처럼 한 줄씩"""
    sp = spec['spec']
    x0, x1, y0 = 70, 1010, 300
    ph = Image.open(os.path.join(car, 'src2', f"p{sp['photo']:02d}.png")).convert('RGB')
    pw = x1 - x0 - 60; phh = int(pw * 9 / 16)
    sc = max(pw / ph.width, phh / ph.height)
    ph = ph.resize((int(ph.width * sc) + 1, int(ph.height * sc) + 1), Image.LANCZOS)
    ph = ph.crop(((ph.width - pw) // 2, (ph.height - phh) // 2, (ph.width - pw) // 2 + pw, (ph.height - phh) // 2 + phh))
    rows = sp['rows']  # [[[큰 숫자, 단위, 이름], [..]], ...] 한 줄에 칸 2개
    th = 190
    ytile = y0 + 128 + 30 + phh + 30 + 84
    y1 = ytile + th * len(rows) + 20 + 70
    outs = []
    per_cell = sp.get('step', 'cell') == 'cell'
    ncell = sum(len(r) for r in rows)
    for k in range((ncell if per_cell else len(rows)) + 1):
        im = bg.copy()
        panel(im, (x0, y0, x1, y1))
        d = ImageDraw.Draw(im)
        header(d, (x0, y0, x1, y1), sp.get('title', '카탈로그 제원'), sp.get('sub', ''))
        m = Image.new('L', ph.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, pw, phh), 18, fill=255)
        im.paste(ph, (x0 + 30, y0 + 128 + 30), m)
        d.text((W // 2, ytile - 44), sp['line'], font=F(R.BOLD, 38), fill=INK, anchor='mm')
        for r, row in enumerate(rows):
            for c, (big, unit, name) in enumerate(row):
                bx0 = x0 + 30 + c * ((x1 - x0 - 60) // 2) + (10 if c else 0)
                bx1 = bx0 + (x1 - x0 - 60) // 2 - 10
                by0 = ytile + th * r; by1 = by0 + th - 16
                on = (sum(len(rr) for rr in rows[:r]) + c < k) if per_cell else (r < k)
                d.rounded_rectangle((bx0, by0, bx1, by1), 18, fill=(255, 255, 255) if on else (244, 242, 236), outline=LINE, width=2)
                cx = (bx0 + bx1) // 2
                fb = F(R.HEAVY, 76); fu = F(R.BOLD, 34)
                wb = d.textlength(big, font=fb); wu = d.textlength(unit, font=fu)
                xs = cx - (wb + 8 + wu) / 2
                col = INK if on else (205, 201, 192)
                if on:
                    bb = d.textbbox((xs, by0 + 74), big, font=fb, anchor='lm')
                    d.rectangle((bb[0] - 8, bb[3] - 26, bb[2] + 8, bb[3] + 4), fill=YEL)
                d.text((xs, by0 + 74), big, font=fb, fill=col, anchor='lm')
                d.text((xs + wb + 8, by0 + 86), unit, font=fu, fill=col, anchor='lm')
                d.text((cx, by1 - 30), name, font=F(R.SEMI, 30), fill=GREY if on else (205, 201, 192), anchor='mm')
        if sp.get('foot'):
            d.text((W // 2, y1 - 40), sp['foot'], font=F(R.MED, 26), fill=GREY, anchor='mm')
        outs.append(im)
    return outs, y1


def insurance_steps(car, spec, bg):
    """보험 이력(카히스토리) 요약 카드: 위 조회 결과 요약판(차량번호 없는 부분만 잘라 씀) · 아래 줄마다 켜짐 · 맨 아래 '보험 처리 안 한 사고는 안 나옴' 안내.
    rows = [[이름, 값, 'ok'|'info']] — ok=초록 체크, info=회색 점(소유자 변경 2회처럼 좋고 나쁨이 아닌 사실)"""
    ins = spec['insurance']
    top = Image.open(os.path.join(car, ins['doc'])).convert('RGB').crop(tuple(ins['box']))
    tw = 860; th_ = int(top.height * tw / top.width)
    top = top.resize((tw, th_), Image.LANCZOS)
    rows = ins['rows']
    x0, x1, y0 = 70, 1010, 282
    ytop = y0 + 128 + 88 + 30
    yrows = ytop + th_ + 34
    rh = 84
    y1 = yrows + rh * len(rows) + 110
    outs = []
    for k in range(len(rows) + 1):
        im = bg.copy()
        panel(im, (x0, y0, x1, y1))
        d = ImageDraw.Draw(im)
        header(d, (x0, y0, x1, y1), ins.get('title', '보험 이력 조회'), ins.get('sub', '카히스토리 요약'))
        d.text((x0 + 44, y0 + 128 + 48), ins['car'], font=F(R.BOLD, 40), fill=INK, anchor='lm')
        m = Image.new('L', top.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, tw, th_), 14, fill=255)
        im.paste(top, ((W - tw) // 2, ytop), m)
        for i, (a, b, kind) in enumerate(rows):
            yy = yrows + rh * i
            d.line([(x0 + 40, yy), (x1 - 40, yy)], fill=LINE, width=2)
            on = i < k
            cy = yy + rh / 2
            if on and kind == 'ok':
                check(d, x0 + 74, cy)
            elif on:
                d.ellipse((x0 + 47, cy - 27, x0 + 101, cy + 27), fill=(150, 156, 168))
                d.text((x0 + 74, cy), 'i', font=F(R.BLACK, 34), fill=(255, 255, 255), anchor='mm')
            else:
                d.ellipse((x0 + 47, cy - 27, x0 + 101, cy + 27), outline=(214, 210, 200), width=3)
            d.text((x0 + 124, cy), a, font=F(R.BOLD, 38), fill=INK if on else (190, 186, 178), anchor='lm')
            if on:
                d.text((x1 - 44, cy), b, font=F(R.BLACK, 40), fill=GREEN if kind == 'ok' else INK, anchor='rm')
        yl = yrows + rh * len(rows)
        d.line([(x0 + 40, yl), (x1 - 40, yl)], fill=LINE, width=2)
        d.text((W // 2, yl + 40), ins['note'], font=F(R.SEMI, 27), fill=(170, 60, 40), anchor='mm')
        d.text((W // 2, y1 - 30), ins['foot'], font=F(R.MED, 24), fill=GREY, anchor='mm')
        outs.append(im)
    return outs, y1


def overview_steps(car, spec, bg):
    """2026-11-17 차량 정보(오버뷰) 독립 컷: 오토스카우트 아이콘 + 항목명 + 값, 2열 칸. 말하는 항목 하나에 칸 하나씩 켜짐.
    cards.json "overview": {"first": 30, "title": "차량 정보", "sub": "...", "icon_dir": "icons",
                            "rows": [[["year", "최초등록", "26년01월"], ...], ...]}"""
    ov = spec['overview']
    x0, x1, y0 = 70, 1010, ov.get('y0', 300)
    rows = ov['rows']
    th = ov.get('tile_h', 214)
    big = th >= 280  # 사진 없이 칸을 크게 쓰는 판: 아이콘·글자도 키움
    ph = None; phh = 0; pw = x1 - x0 - 60
    if ov.get('photo'):  # 제원 카드처럼 위에 매물 사진(카드 높이·톤을 다른 카드와 맞춤)
        ph = Image.open(os.path.join(car, 'src2', f"p{ov['photo']:02d}.png")).convert('RGB')
        phh = int(pw * 9 / 16)
        sc = max(pw / ph.width, phh / ph.height)
        ph = ph.resize((int(ph.width * sc) + 1, int(ph.height * sc) + 1), Image.LANCZOS)
        ph = ph.crop(((ph.width - pw) // 2, (ph.height - phh) // 2, (ph.width - pw) // 2 + pw, (ph.height - phh) // 2 + phh))
    ytile = y0 + 128 + 30 + (phh + 30 if ph else 10)
    y1 = ytile + th * len(rows) + 30 + (60 if ov.get('foot') else 0)
    icons = {}
    for row in rows:
        for ic, _, _ in row:
            isz = 92 if th >= 280 else 64
            icons[ic] = Image.open(os.path.join(car, ov.get('icon_dir', 'icons'), ic + '.png')).convert('RGBA').resize((isz, isz), Image.LANCZOS)
    ncell = sum(len(r) for r in rows)
    outs = []
    for k in range(ncell + 1):
        im = bg.copy()
        panel(im, (x0, y0, x1, y1))
        d = ImageDraw.Draw(im)
        header(d, (x0, y0, x1, y1), ov.get('title', '차량 정보'), ov.get('sub', ''))
        if ph:
            m = Image.new('L', ph.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, pw, phh), 18, fill=255)
            im.paste(ph, (x0 + 30, y0 + 128 + 30), m)
        for r, row in enumerate(rows):
            for c, (ic, name, val) in enumerate(row):
                bw = (x1 - x0 - 60) // 2
                bx0 = x0 + 30 + c * bw + (10 if c else 0)
                bx1 = bx0 + bw - 10
                by0 = ytile + th * r; by1 = by0 + th - 18
                on = sum(len(rr) for rr in rows[:r]) + c < k
                d.rounded_rectangle((bx0, by0, bx1, by1), 18, fill=(255, 255, 255) if on else (244, 242, 236), outline=LINE, width=2)
                icn = icons[ic]
                if not on:
                    icn = icn.copy(); icn.putalpha(icn.getchannel('A').point(lambda v: v * 30 // 100))
                px = 36 if big else 28
                im.alpha_composite(icn, (bx0 + px, by0 + (40 if big else 30)))
                d = ImageDraw.Draw(im)
                d.text((bx0 + px, by0 + (188 if big else 128)), name, font=F(R.SEMI, 36 if big else 30), fill=GREY if on else (205, 201, 192), anchor='lm')
                fv = F(R.HEAVY, 58 if big else 46)
                if d.textlength(val, font=fv) > bw - 70:
                    fv = F(R.HEAVY, 48 if big else 38)
                col = INK if on else (205, 201, 192)
                if on:
                    bb = d.textbbox((bx0 + px, by1 - (52 if big else 36)), val, font=fv, anchor='lm')
                    d.rectangle((bb[0] - 6, bb[3] - 20, bb[2] + 6, bb[3] + 4), fill=YEL)
                d.text((bx0 + px, by1 - (52 if big else 36)), val, font=fv, fill=col, anchor='lm')
        if ov.get('foot'):
            d.text((W // 2, y1 - 44), ov['foot'], font=F(R.MED, 26), fill=GREY, anchor='mm')
        outs.append(im)
    return outs, y1


def main(car):
    global CHIP_TITLES
    spec = json.load(open(os.path.join(car, 'cards.json')))
    CHIP_TITLES = bool(spec.get('chip_titles'))
    bg = bg_of(car, spec['bg'])
    info = {}
    if 'report' in spec:
        ims, yb = report_steps(car, spec, bg)
        for i, im in enumerate(ims):
            im.convert('RGB').save(os.path.join(car, 'src2', f"p{spec['report']['first'] + i:02d}.png"))
        info['report'] = dict(first=spec['report']['first'], n=len(ims), bottom=yb)
    if 'price' in spec:
        ims, yb = price_steps(car, spec, bg)
        for i, im in enumerate(ims):
            im.convert('RGB').save(os.path.join(car, 'src2', f"p{spec['price']['first'] + i:02d}.png"))
        info['price'] = dict(first=spec['price']['first'], n=len(ims), bottom=yb)
    if 'insurance' in spec:
        ims, yb = insurance_steps(car, spec, bg)
        for i, im in enumerate(ims):
            im.convert('RGB').save(os.path.join(car, 'src2', f"p{spec['insurance']['first'] + i:02d}.png"))
        info['insurance'] = dict(first=spec['insurance']['first'], n=len(ims), bottom=yb)
    if 'overview' in spec:
        ims, yb = overview_steps(car, spec, bg)
        for i, im in enumerate(ims):
            im.convert('RGB').save(os.path.join(car, 'src2', f"p{spec['overview']['first'] + i:02d}.png"))
        info['overview'] = dict(first=spec['overview']['first'], n=len(ims), bottom=yb)
    if 'spec' in spec:
        ims, yb = spec_steps(car, spec, bg)
        for i, im in enumerate(ims):
            im.convert('RGB').save(os.path.join(car, 'src2', f"p{spec['spec']['first'] + i:02d}.png"))
        info['spec'] = dict(first=spec['spec']['first'], n=len(ims), bottom=yb)
    print(json.dumps(info, ensure_ascii=False))


if __name__ == '__main__':
    main(sys.argv[1])
