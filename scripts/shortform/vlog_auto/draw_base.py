# 브이로그 자동 편집 공용 그리기(글꼴·노랑 붓띠 칩·흰 글자·톡 등장). numviz/v60a.py 앞부분에서 가져옴.
import os,subprocess,re
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
D=os.path.join(os.path.dirname(os.path.abspath(__file__)),'assets'); R=''
_SF=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); F=os.path.join(_SF,'fonts'); A=os.path.join(os.path.dirname(os.path.dirname(_SF)),'public','assets','shortform')+'/'
BK=lambda s:ImageFont.truetype(F+'/Pretendard-Black.otf',s); BD=lambda s:ImageFont.truetype(F+'/Pretendard-Bold.otf',s)
W,H,FPS=1080,1920,30; M=72; YB=400   # 왼쪽 여백, 위 띠 시작(22%)
INK=(20,20,20)
def el(n,w=None,h=None):
    im=Image.open(f'{D}/{n}_b3.png'); im=im.crop(im.getbbox())
    if w and h: return im.resize((round(w),round(h)))
    if w: return im.resize((round(w),round(im.height*w/im.width)))
    return im.resize((round(im.width*h/im.height),round(h)))
def tsize(s,f):
    b=ImageDraw.Draw(Image.new('L',(1,1))).textbbox((0,0),s,font=f); return b
def chip(s,size,tilt=2.7):   # 벨기에식 노랑 붓띠 + 검정 글자, 반시계 2.7도
    f=BK(size); b=tsize(s,f); tw,th=b[2]-b[0],b[3]-b[1]; h=round(th*1.9); w=round(tw+h*0.62)
    m=subprocess.run(['rsvg-convert','-w',str(w*2),'-h',str(h*2),'--keep-aspect-ratio=false' if False else '-a', f'{D}/chip_y3.svg'],capture_output=True).stdout
    from io import BytesIO
    br=Image.open(BytesIO(m)).convert('RGBA'); br=br.crop(br.getbbox()).resize((w,h))
    im=Image.new('RGBA',(w+20,h+20)); im.alpha_composite(br,(10,10))
    ImageDraw.Draw(im).text((10+(w-tw)//2-b[0],10+(h-th)//2-b[1]),s,font=f,fill=INK)
    return im.rotate(tilt,resample=Image.BICUBIC,expand=True)
def pill(s,size):   # 흰 알약 + 검정 글자 (끝 화면 딜러)
    f=BD(size); b=tsize(s,f); tw,th=b[2]-b[0],b[3]-b[1]; h=round(th*2.1); w=tw+h
    im=Image.new('RGBA',(w+20,h+20)); sh=Image.new('RGBA',im.size); ImageDraw.Draw(sh).rounded_rectangle((10,14,10+w,14+h),radius=h//2,fill=(0,0,0,120))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6))); d=ImageDraw.Draw(im); d.rounded_rectangle((10,10,10+w,10+h),radius=h//2,fill=(255,255,255))
    d.text((10+(w-tw)//2-b[0],10+(h-th)//2-b[1]),s,font=f,fill=INK); return im
def white(s,size,st=0):
    f=BD(size); b=tsize(s,f); im=Image.new('RGBA',(b[2]-b[0]+30,b[3]-b[1]+30))
    d=ImageDraw.Draw(im); sh=Image.new('RGBA',im.size); ImageDraw.Draw(sh).text((15-b[0],18-b[1]),s,font=f,fill=(0,0,0,170))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(5))); d.text((15-b[0],15-b[1]),s,font=f,fill=(255,255,255))
    return im
def text3d(txt, h=200):
    """2026-11-18 나세르식 입체 숫자(「396 LITER」처럼): 흰 굵은 숫자 + 아래쪽 두께 + 작은 단위. 이모지로는 L 같은 글자가 없어 직접 그림.
    h = 전체 높이(px). 숫자는 Pretendard Black, 단위는 숫자 크기의 0.5배로 숫자 밑줄에 맞춤."""
    m = re.match(r'^([\d.,+]+)\s*(.*)$', txt)
    num, unit = (m.group(1), m.group(2)) if m else (txt, '')
    if re.fullmatch(r'[\d\s:.,]+', txt):   # 40 : 20 : 40 같은 비율은 전부 숫자 크기
        num, unit = txt, ''
    fs = int(h / 0.78)
    fn = ImageFont.truetype(F+'/Pretendard-Black.otf', fs)
    fu = ImageFont.truetype(F+'/Pretendard-Black.otf', int(fs * 0.5))
    d0 = ImageDraw.Draw(Image.new('L', (1, 1)))
    nb = d0.textbbox((0, 0), num, font=fn, anchor='ls')
    ub = d0.textbbox((0, 0), unit, font=fu, anchor='ls') if unit else (0, 0, 0, 0)
    gap = int(fs * 0.06) if unit else 0
    depth = max(3, int(h * 0.07))
    sw = max(2, int(h * 0.015))   # 2026-11-18 크로스체크: 흰 배경(트렁크 벽)에서 흐려 보여 얇은 검은 외곽선
    pad = 4 + sw
    Wt = (nb[2] - nb[0]) + gap + (ub[2] - ub[0]) + depth + pad * 2
    top = min(nb[1], ub[1])
    Ht = -top + depth + pad * 2
    def draw_text(d, dx, dy, fill, stroke=0):
        x = pad + dx - nb[0]; y = pad + dy - top
        kw = dict(stroke_width=stroke, stroke_fill=fill) if stroke else {}
        d.text((x, y), num, font=fn, fill=fill, anchor='ls', **kw)
        if unit:
            d.text((x + nb[2] + gap - ub[0], y), unit, font=fu, fill=fill, anchor='ls', **kw)
    out = Image.new('RGBA', (Wt, Ht), (0, 0, 0, 0))
    d = ImageDraw.Draw(out)
    draw_text(d, depth * 0.5, depth, (25, 27, 30, 230), stroke=sw)   # 외곽선(두께 끝)
    for k in range(depth, 0, -1):   # 두께: 뒤쪽일수록 어두운 회색
        c = int(120 + 60 * (1 - k / depth))
        draw_text(d, k * 0.5, k, (c, c + 4, c + 10, 255))
    draw_text(d, 0, 0, (25, 27, 30, 230), stroke=sw)                 # 외곽선(앞면): 두께 위에
    face = Image.new('L', out.size, 0)
    draw_text(ImageDraw.Draw(face), 0, 0, 255)
    grad = Image.new('RGBA', out.size)
    gd = ImageDraw.Draw(grad)
    for yy in range(out.height):   # 앞면: 위 흰색 → 아래 아주 옅은 회색
        v = int(255 - 22 * yy / max(1, out.height))
        gd.line([(0, yy), (out.width, yy)], fill=(v, v, min(255, v + 3), 255))
    out.paste(grad, (0, 0), face)
    return out



def ease(u): u=max(0,min(1,u)); return 1-(1-u)**3
def eback(u): u=max(0,min(1,u)); c=1.6; return 1+(c+1)*(u-1)**3+c*(u-1)**2
def pop(c,im,xy,t,t0,d=0.26,anchor='la'):
    if t<t0: return
    s=0.5+0.5*eback((t-t0)/d); a=min(1,(t-t0)/0.1); w,h=max(1,round(im.width*s)),max(1,round(im.height*s))
    x,y=xy
    if anchor=='la': x+=(im.width-w)//2; y+=(im.height-h)//2
    r=im.resize((w,h)); r.putalpha(r.getchannel('A').point(lambda v:int(v*a))); c.alpha_composite(r,(x,y))
def wipe(c,im,xy,t,t0,d=0.35):
    if t<t0: return
    w=max(1,round(im.width*ease((t-t0)/d))); c.alpha_composite(im.crop((0,0,w,im.height)),xy)
def sweep(c,im,xy,t,t0,d=0.45):
    if t<t0: return
    u=ease((t-t0)/d)
    if u<1:
        m=Image.new('L',im.size,0); cx,cy=im.width/2,im.height/2; r=max(im.size)
        ImageDraw.Draw(m).pieslice((cx-r,cy-r,cx+r,cy+r),-200,-200+360*u,fill=255); im=im.copy(); im.putalpha(ImageChops.multiply(im.getchannel('A'),m))
    c.alpha_composite(im,xy)
PH={}
def ph(p):
    if p not in PH: PH[p]=Image.open(R+p).convert('RGB')
    return PH[p]
def cover(p,cx,t,dur):     # 화면 꽉 채움 + 천천히 확대
    im=ph(p); z=1+0.06*ease(t/dur); ch=im.height/z; cw=ch*W/H
    x=max(0,min(im.width-cw,im.width*cx-cw/2)); y=(im.height-ch)/2
    global CMAP; CMAP=lambda fx,fy:((fx*im.width-x)*W/cw,(fy*im.height-y)*H/ch)
    return im.resize((W,H),box=(x,y,x+cw,y+ch)).convert('RGBA')
FY=560   # 맞춤 사진 위쪽(위 띠 아래)
def fit(p,t,dur):          # 사진 전체 + 같은 사진 흐린 채움, 요소 좌표 함수 반환
    im=ph(p); z=1.22+0.04*ease(t/dur)
    bgc=im.resize((round(H*im.width/im.height),H)); x=(bgc.width-W)//2
    c=bgc.crop((x,0,x+W,H)).filter(ImageFilter.GaussianBlur(28)).convert('RGBA')
    c=Image.alpha_composite(c,Image.new('RGBA',(W,H),(0,0,0,110)))
    pw=round(W*z); phh=round(pw*im.height/im.width); px=(W-pw)//2; py=FY+(round(W*1.22*im.height/im.width)-phh)//2
    c.paste(im.resize((pw,phh)),(px,py))
    return c,(lambda fx,fy:(px+fx*pw,py+fy*phh)),pw/im.width
def numcut(p,cx,big,label,circ=None):
    B=chip(big,108); L=white(label,52); BU=el('burst',h=150)
    def f(t):
        c=cover(p,cx,t,2.6); c=Image.alpha_composite(c,Image.new('RGBA',(W,H),(0,0,0,70)))
        pop(c,L,(M,YB-70),t,0.15); pop(c,B,(M-10,YB+10),t,0.25); pop(c,BU,(M+B.width-40,YB-90),t,0.45)
        if circ:
            x0,y0=CMAP(*circ[0]); x1,y1=CMAP(*circ[1]); sweep(c,el('circle',w=x1-x0,h=y1-y0),(round(x0),round(y0)),t,0.6)
        return c
    return f
