import numpy as np, cv2, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
LOGO=os.path.join(os.path.dirname(__file__),'../../../public/assets/brand/rail-v01/mercedes-benz.png')
T_IN,T_NAME,T_OUT,T_END=0.10,0.75,4.55,4.90
import json as _js, os as _os
_c=_js.load(open('car.json'))['intro'] if _os.path.exists('car.json') else {}
LOGO=_c.get('logo',LOGO); T_IN,T_NAME,T_OUT,T_END=_c.get('times',[T_IN,T_NAME,T_OUT,T_END]); MODE=_c.get('mode','mask')
EY,NY=640,900
BIG=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc',104,index=1)
SM=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc',52,index=1)
L1,L2=_c.get('l1','Mercedes-AMG'),_c.get('l2','GT 63 4도어 쿠페')
def _emblem(S=380):
    src=Image.open(LOGO).convert('RGBA'); k=S/max(src.size); src=src.resize((max(1,int(src.size[0]*k)),max(1,int(src.size[1]*k))),Image.LANCZOS)
    m=Image.new('RGBA',(S,S),(0,0,0,0)); m.paste(src,((S-src.size[0])//2,(S-src.size[1])//2),src)
    arr=np.array(m).astype(np.float32); a=arr[...,3]/255
    y=np.linspace(0,1,S)[:,None]; base=np.clip(0.55+0.45*np.cos((y-0.28)*5.0),0,1)*np.ones((1,S))
    rgb=np.stack([200+55*base]*3,-1); rgb=np.clip(rgb,0,255)
    if MODE=='rgb':
        lum=(arr[...,:3].mean(-1)/255.0)[...,None]; rgb=np.clip(rgb*(0.08+0.92*lum),0,255)
    pad=40; C=S+2*pad; out=np.zeros((C,C,4),np.float32)
    # glow outline + shadow
    ga=cv2.GaussianBlur(np.pad(a,pad),(0,0),10)
    sh=cv2.GaussianBlur(np.pad(a,pad),(0,0),8); sh=np.roll(sh,10,0)
    out[...,3]=np.clip(sh*0.7,0,1)
    gl=np.clip(ga*1.2,0,1); out[...,:3]=out[...,:3]*(1-gl[...,None])+np.array([255,230,120])*gl[...,None]*0  # keep neutral
    out[...,:3]=np.where(gl[...,None]>0,np.array([240,170,80]),0); out[...,3]=np.maximum(out[...,3],gl*0.55)
    ap=np.pad(a,pad); rp=np.zeros((C,C,3)); rp[pad:pad+S,pad:pad+S]=rgb
    out[...,:3]=out[...,:3]*(1-ap[...,None])+rp*ap[...,None]; out[...,3]=np.maximum(out[...,3],ap)
    return out, ap
EMB,EMA=_emblem()
def _text():
    im=Image.new('RGBA',(1080,300),(0,0,0,0)); sh=Image.new('RGBA',(1080,300),(0,0,0,0))
    for d,f,t,y,col in ((ImageDraw.Draw(im),SM,L1,60,(205,215,230,255)),(ImageDraw.Draw(im),BIG,L2,190,(255,255,255,255))):
        d.text((540,y),t,font=f,fill=col,anchor='mm',stroke_width=2,stroke_fill=(15,15,15,255))
        ImageDraw.Draw(sh).text((544,y+7),t,font=f,fill=(0,0,0,220),anchor='mm',stroke_width=4,stroke_fill=(0,0,0,220))
    o=Image.alpha_composite(sh.filter(ImageFilter.GaussianBlur(7)),im); return np.array(o).astype(np.float32)
TXT=_text()
def _ease_back(u,s=1.9): u=min(max(u,0),1); u-=1; return u*u*((s+1)*u+s)+1
def _blend(fr,img,x0,y0,al=1.0):
    h,w=img.shape[:2]; X0,Y0=max(0,x0),max(0,y0); X1,Y1=min(fr.shape[1],x0+w),min(fr.shape[0],y0+h)
    if X1<=X0 or Y1<=Y0: return
    s=img[Y0-y0:Y1-y0,X0-x0:X1-x0]; a=s[...,3:]/255*al if s[...,3].max()>1.5 else s[...,3:]*al
    fr[Y0:Y1,X0:X1]=fr[Y0:Y1,X0:X1]*(1-a)+s[...,:3][...,::-1]*a if False else fr[Y0:Y1,X0:X1]*(1-a)+s[...,2::-1]*a
def draw(fr,n,fps=30):
    t=n/fps
    if not(T_IN<=t<=T_END): return
    out=1.0 if t<T_OUT else max(0,1-(t-T_OUT)/(T_END-T_OUT))
    # dim vignette
    d=0.32*min(1,(t-T_IN)/0.3)*out
    yy,xx=np.ogrid[:fr.shape[0],:fr.shape[1]]
    if not hasattr(draw,'v'): draw.v=np.clip(1-np.exp(-(((xx-540)/700.)**2+((yy-760)/520.)**2)),0,1)[...,None]*0+np.exp(-(((xx-540)/620.)**2+((yy-760)/460.)**2))[...,None]
    fr*= (1-d*draw.v*0.9)
    # emblem: coin flip + overshoot
    u=(t-T_IN)/0.55; sc=0.35+0.65*_ease_back(u); sx=abs(math.cos((1-min(u,1))*math.pi*1.5)) if u<1 else 1.0
    sc*= (1+0.03*math.sin((t-T_IN)*2.4)) if u>=1 else 1
    if out<1: sc*=0.85+0.15*out
    e=EMB.copy()
    # light sweep
    ts=t-0.75
    if 0<=ts<=0.5:
        C=e.shape[0]; xg=np.arange(C)[None,:]; yg=np.arange(C)[:,None]; c=-C*0.4+ts/0.5*C*1.8
        band=np.exp(-((xg+yg*0.6-c)/26.)**2)*EMA
        e[...,:3]=np.clip(e[...,:3]+band[...,None]*180,0,255)
    C=e.shape[0]; w=max(2,int(C*sc*sx)); h=max(2,int(C*sc))
    img=cv2.resize(e,(w,h),interpolation=cv2.INTER_AREA)
    img[...,3]*=255
    _blend(fr,img,540-w//2,EY-h//2-int(30*(1-out)),out)
    # model name type-on
    if t>=T_NAME:
        p=min(1,(t-T_NAME)/0.9); W=TXT.shape[1]; tx=TXT.copy()
        # reveal L1 by x (0-0.4), L2 by x (0.25-1)
        r1=min(1,p/0.4); r2=min(1,max(0,(p-0.25)/0.75))
        def cut(y0,y1,r,a0=140,a1=1080):
            xr=int(a0+(a1-a0)*r); tx[y0:y1,xr:,3]=0
            edge=slice(max(0,xr-24),xr); tx[y0:y1,edge,3]*=np.linspace(1,0.2,xr-max(0,xr-24))[None,:]
        cut(0,120,r1,330,760); cut(120,300,r2)
        yo=int(18*(1-min(1,(t-T_NAME)/0.35)))
        _blend(fr,tx,0,NY-150+yo,out)
