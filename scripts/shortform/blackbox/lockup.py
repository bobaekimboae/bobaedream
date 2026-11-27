"""블랙박스 릴스 제목 묶음(벨기에 한 칩): 노션 원본 붓칠 430_239, 같은 배율만."""
import os, sys
HERE=os.path.dirname(os.path.abspath(__file__)); SF=os.path.dirname(HERE)
sys.path.insert(0, os.path.join(SF,'video_listing'))
import g350_v5_lib as L
from PIL import Image, ImageDraw, ImageFont, ImageFilter
FN=lambda n,s: ImageFont.truetype(os.path.join(SF,'fonts',f'Pretendard-{n}.otf'),s)
INK=(43,43,43)
def lockup(chip_word, rest1, line2, size=92, weight='SemiBold'):
    """벨기에 원본(Raad het / Merk, Auto / Scout24) 재현: 노션 430_239(원본 판, 기울기·곡선 그대로), 같은 배율,
    글자 보통 굵기·진회색, 왼쪽 여백 0.35 · 오른쪽 0.5(글자 높이 배수), 흰 글자도 같은 크기·굵기, 줄 간격 촘촘"""
    f=FN(weight,size); b=f.getbbox(chip_word); tw,th=b[2]-b[0],b[3]-b[1]
    pl,pr=0.20,0.30; a1=L._shape('430_239',1); t0,b0,l0,r0=L._paint_box(a1)   # 벨기에 원본 실측 Auto 0.22·0.41 · Raad 0.24·0.27 (2026-11-28)
    sc=(tw+(pl+pr)*th)/(r0-l0)
    sc=max(sc, 1.65*th/(b0-t0))   # 짧은 낱말(2글자)도 칠 높이 ≥ 글자 1.65배(벨기에 Auto 1.63 · Raad 1.76), 남는 폭은 좌우 비율대로
    a=L._shape('430_239',sc); top,bot,x0,x1=L._paint_box(a)
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
    d.text(((Wd-w2)//2-l2b[0], y2-l2b[1]),line2,font=f,fill='white')
    sh=Image.new('RGBA',(Wd,H)); sh.paste((0,0,0,120),(0,0),txt.getchannel('A')); sh=sh.filter(ImageFilter.GaussianBlur(4))
    im.alpha_composite(sh,(0,3)); im.alpha_composite(chip,(x0c,y0)); im.alpha_composite(txt)
    return im.crop(im.getchannel('A').getbbox())
if __name__=='__main__':
    im=lockup('스텔스','차량','교차로 신호위반'); print(im.size)
