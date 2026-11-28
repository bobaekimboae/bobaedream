"""블랙박스 릴스 제목 묶음(벨기에 한 칩): 노션 원본 붓칠 430_239, 같은 배율만."""
import os, sys
HERE=os.path.dirname(os.path.abspath(__file__)); SF=os.path.dirname(HERE)
sys.path.insert(0, os.path.join(SF,'video_listing'))
import g350_v5_lib as L
from PIL import Image, ImageDraw, ImageFont, ImageFilter
FN=lambda n,s: ImageFont.truetype(os.path.join(SF,'fonts',f'Pretendard-{n}.otf'),s)
INK=(43,43,43)
def lockup(chip_word, rest1, line2, size=92, weight='SemiBold', shape='430_239'):
    """벨기에 원본(Raad het / Merk, Auto / Scout24) 재현: 노션 430_239(원본 판, 기울기·곡선 그대로), 같은 배율,
    글자 보통 굵기·진회색, 왼쪽 여백 0.35 · 오른쪽 0.5(글자 높이 배수), 흰 글자도 같은 크기·굵기, 줄 간격 촘촘"""
    f=FN(weight,size); b=f.getbbox(chip_word); tw,th=b[2]-b[0],b[3]-b[1]
    if shape=='auto': shape=pick_shape(tw,th)
    pl,pr=0.20,0.30; a1=L._shape(shape,1); t0,b0,l0,r0=L._paint_box(a1)   # 벨기에 원본 실측 Auto 0.22·0.41 · Raad 0.24·0.27 (2026-11-28)
    sc=(tw+(pl+pr)*th)/(r0-l0)
    sc=max(sc, 1.65*th/(b0-t0))   # 짧은 낱말(2글자)도 칠 높이 ≥ 글자 1.65배(벨기에 Auto 1.63 · Raad 1.76), 남는 폭은 좌우 비율대로
    a=L._shape(shape,sc); top,bot,x0,x1=L._paint_box(a)
    chip=Image.new('RGBA',a.size); fill=Image.new('RGBA',a.size,L.YEL+(255,)); fill.putalpha(a); chip.alpha_composite(fill)
    cx=x0+round(((x1-x0)-tw)*pl/(pl+pr)); cy=top+((bot-top)-th)//2-round(0.04*th)
    ImageDraw.Draw(chip).text((cx-b[0],cy-b[1]),chip_word,font=f,fill=INK)
    chip=chip.crop(chip.getchannel('A').getbbox())
    base_y=cy-b[1]+(0)  # 칩 안 글자 기준점(위쪽) — 같은 줄 흰 글자 맞춤용
    off=a.getbbox()
    ty_in_chip=cy-off[1]  # 크롭 후 칩 안 글자 잉크 윗선
    gap=int(size*0.12); w1=chip.width+gap+int(f.getlength(rest1)); w2=int(f.getlength(line2))
    Wd=max(w1,w2)+60; lh=int(size*1.12)
    H=chip.height+lh+60; im=Image.new('RGBA',(Wd,H)); x0c=(Wd-w1)//2; y0=20
    txt=Image.new('RGBA',(Wd,H)); d=ImageDraw.Draw(txt)
    # 같은 줄 흰 글자: 칩 글자와 잉크 윗선을 맞춤
    rb=f.getbbox(rest1); d.text((x0c+chip.width+gap-rb[0], y0+ty_in_chip-b[1]+ (b[1]-rb[1]) + rb[1]-b[1]),rest1,font=f,fill='white')
    # 둘째 줄: 칩 아랫선 바로 아래(원본처럼 거의 붙음)
    l2b=f.getbbox(line2); y2=y0+ty_in_chip+th+int(size*0.42)
    y2=max(y2, y0+chip.height+int(size*0.10))   # 칩 칠이 둘째 줄 글자를 덮지 않게(2026-11-28 「야구중계」 겹침)
    d.text(((Wd-w2)//2-l2b[0], y2-l2b[1]),line2,font=f,fill='white')
    sh=Image.new('RGBA',(Wd,H)); sh.paste((0,0,0,120),(0,0),txt.getchannel('A')); sh=sh.filter(ImageFilter.GaussianBlur(4))
    im.alpha_composite(sh,(0,3)); im.alpha_composite(chip,(x0c,y0)); im.alpha_composite(txt)
    return im.crop(im.getchannel('A').getbbox())
if __name__=='__main__':
    im=lockup('스텔스','차량','교차로 신호위반'); print(im.size)



# ---- 노션 원본 칩만 쓴다(as24-theme 폴더, 파일 수정 없음 · 같은 배율만) ----
ORIGINALS = ['430_239', '126_40', '103_33', '168_76', '201_43', '325_76', '265_42', '446_76', '321_28', '760_62']
BASIC = '126_40'   # 보배드림 기본칩(노션 「리싱마크트 메인 사용 칩」, 타이틀·옵션·숫자 칩 기본, brush-fill README 2026-11-19)
AUTO_CHOICES = ['430_239', '126_40', '103_33', '168_76', '201_43', '265_42']  # 자동 선택 후보: 모서리 깨끗한 원본만(325_76·446_76 긁힘, 321_28·760_62 너무 얇음 제외)
PAD = (0.20, 0.30)   # 글자 높이 배수(왼쪽 · 오른쪽), 벨기에 원본 실측
BAND = 1.65          # 칠 높이 ≥ 글자 높이 1.65배


def _aspect(name):
    t, b, l, r = L._paint_box(L._shape(name, 1)); return (r - l) / (b - t), (r - l), (b - t)


def pick_shape(tw, th, choices=None):
    """기본칩 자동 선택: 글자 상자 비율(폭 / 칠 높이)에 가장 가까운 원본 칠을 고른다."""
    import math
    need = (tw + sum(PAD) * th) / (BAND * th)
    return min(choices or AUTO_CHOICES, key=lambda n: abs(math.log(_aspect(n)[0] / need)))


def chip(text, size=88, weight='SemiBold', shape='auto', ink=INK, fill_rgb=None):
    """원본 칠 한 장 위에 글자. shape='auto'면 pick_shape. 돌려줌: (칩 이미지, 고른 원본 이름)"""
    f = FN(weight, size); b = f.getbbox(text); tw, th = b[2] - b[0], b[3] - b[1]
    name = pick_shape(tw, th) if shape == 'auto' else shape
    _, pw, ph = _aspect(name); pl, pr = PAD
    sc = max((tw + (pl + pr) * th) / pw, BAND * th / ph)
    a = L._shape(name, sc); top, bot, x0, x1 = L._paint_box(a)
    c = Image.new('RGBA', a.size); fill = Image.new('RGBA', a.size, tuple(fill_rgb or L.YEL) + (255,)); fill.putalpha(a); c.alpha_composite(fill)
    cx = x0 + round(((x1 - x0) - tw) * pl / (pl + pr)); cy = top + ((bot - top) - th) // 2 - round(0.04 * th)
    ImageDraw.Draw(c).text((cx - b[0], cy - b[1]), text, font=f, fill=ink)
    bb = a.getbbox(); return c.crop(bb), name


def lockup_allchip(lines, size=80, weight='SemiBold', shape='auto'):
    """모든 줄에 원본 칩(줄마다 비율 맞는 원본 자동 선택 또는 지정), 줄끼리 촘촘히 겹쳐 쌓기."""
    made = [chip(s, size, weight, shape) for s in lines]
    chips = [m[0] for m in made]; gap = -round(size * 0.12)
    Wd = max(c.width for c in chips); Hd = sum(c.height for c in chips) + gap * (len(chips) - 1)
    im = Image.new('RGBA', (Wd, Hd)); y = 0
    for c in chips: im.alpha_composite(c, ((Wd - c.width) // 2, y)); y += c.height + gap
    im.info['shapes'] = [m[1] for m in made]
    return im
