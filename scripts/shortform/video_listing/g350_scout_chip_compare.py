import os,sys,subprocess
from io import BytesIO
src=open(os.path.dirname(os.path.abspath(__file__))+'/render3.py').read().split('SFXT=[]; NEIGH')[0]
exec(src)
DL=G+'scout_dl/'; BF='/home/claude/bobaedream/public/assets/shortform/brush-fill/'
MINT=(0,255,208); DARK=(51,51,51)
def svgmask(path,w,h):
    png=subprocess.run(['rsvg-convert','-w',str(w*2),'-h',str(h*2),'--keep-aspect-ratio' if False else '-a',path] if False else ['rsvg-convert','-w',str(w),'-h',str(h),path],capture_output=True).stdout
    return Image.open(BytesIO(png)).convert('RGBA').getchannel('A')
def svgimg(path,h):
    png=subprocess.run(['rsvg-convert','-h',str(h),path],capture_output=True).stdout
    return Image.open(BytesIO(png)).convert('RGBA')
def shadowed(im):
    o=Image.new('RGBA',(im.width+30,im.height+30)); s=Image.new('RGBA',o.size); a=im.getchannel('A')
    s.paste((0,0,0,140),(15,19),a); o.alpha_composite(s.filter(ImageFilter.GaussianBlur(7))); o.alpha_composite(im,(15,15)); return o
VAL=[('토크','55kg·m'),('7단 자동','4륜구동'),('제로백','9.1초')]
# B: 임모스카우트 민트 태그(프리미엄 배지 모양: 각진 rx2) 라벨 + 흰 값
def tagrow(lab,val):
    f=BD(48); b=tsize(lab,f); tw,th=b[2]-b[0],b[3]-b[1]; h=round(th*1.9); w=tw+44
    tag=Image.new('RGBA',(w,h)); ImageDraw.Draw(tag).rounded_rectangle((0,0,w-1,h-1),radius=max(3,round(h*2/20)),fill=MINT+(255,))
    ImageDraw.Draw(tag).text((22-b[0],(h-th)//2-b[1]),lab,font=f,fill=DARK)
    v=white(val,64); row=Image.new('RGBA',(w+18+v.width,max(h,v.height)))
    row.alpha_composite(tag,(0,(row.height-h)//2)); row.alpha_composite(v,(w+18,(row.height-v.height)//2)); return shadowed(row)
# C: 임모스카우트 단계 숫자 원(원본 SVG 그대로) + 흰 글자
def steprow(k,lab,val):
    p=DL+'immo_num1_42.svg'
    c=svgimg(p,74) if k==0 else None
    if k>0:  # 2·3은 같은 원 모양에 숫자만 그림(원본 2_42·3_42와 동일 스타일)
        c=Image.new('RGBA',(74,74)); d=ImageDraw.Draw(c); d.ellipse((2,2,71,71),fill=(255,255,255),outline=DARK,width=2); d.text((37,38),str(k+1),font=BD(38),fill=DARK,anchor='mm')
    t=white(f'{lab} {val}',58); row=Image.new('RGBA',(74+20+t.width,max(74,t.height))); row.alpha_composite(c,(0,(row.height-74)//2)); row.alpha_composite(t,(94,(row.height-t.height)//2)); return row
# D: 오토스카우트 형광펜(highlighter.svg 원본 모양) 민트로 칠 + 진한 글자
def hlrow(lab,val):
    f=BD(56); s=f'{lab} {val}'; b=tsize(s,f); tw,th=b[2]-b[0],b[3]-b[1]; w=tw+70; h=round(th*2.0)
    a=svgmask(BF+'as24-original/highlighter.svg',w,h); im=Image.new('RGBA',(w,h),MINT+(255,)); im.putalpha(a)
    ImageDraw.Draw(im).text((35-b[0],(h-th)//2-b[1]),s,font=f,fill=DARK); return shadowed(im)
# E: AS24 테마 붓칠(126_40 원본 모양) 흰색 칠 + 진한 글자 (노랑 칩과 같은 붓 계열, 색만 흰)
def brushrow(lab,val,col=(255,255,255)):
    f=BD(54); s=f'{lab} {val}'; b=tsize(s,f); tw,th=b[2]-b[0],b[3]-b[1]; w=tw+80; h=round(th*2.1)
    a=svgmask(BF+'as24-theme/126_40.svg',w,h); im=Image.new('RGBA',(w,h),col+(255,)); im.putalpha(a)
    ImageDraw.Draw(im).text((40-b[0],(h-th)//2-b[1]),s,font=f,fill=DARK); return shadowed(im)
VARS={'A_now_whitepill':[i for i in EP],
 'B_immo_mint_tag':[tagrow(l,v) for l,v in VAL],
 'C_immo_step_circle':[steprow(k,l,v) for k,(l,v) in enumerate(VAL)],
 'D_as24_highlighter_mint':[hlrow(l,v) for l,v in VAL],
 'E_as24_brush_white':[brushrow(l,v) for l,v in VAL],
 'F_as24_brush_mint':[brushrow(l,v,MINT) for l,v in VAL]}
fr=frames(116.6,116.7)[0]
outs=[]
for name,rows in VARS.items():
    cv=Image.fromarray(fr).resize((W,H)).convert('RGBA'); cv=Image.alpha_composite(cv,Image.new('RGBA',(W,H),(0,0,0,70)))
    C=gchip('3.0 V6 디젤'); cv.alpha_composite(C,(M-10,YB-150))
    B3=text3d('211마력',h=210); y3=int(H*0.24); cv.alpha_composite(B3,((W-B3.width)//2,y3))
    cv.alpha_composite(HORSE if 'HORSE' in dir() else flu('1f40e',180),(min(W-180-24,(W+B3.width)//2-40),y3-180+30))
    y=y3+270
    for k,im in enumerate(rows): cv.alpha_composite(im,((W-im.width)//2,y+k*128))
    draw_sub(cv,115.0)
    p=G+f'sheet/{name}.png'; cv.convert('RGB').save(p); outs.append(p)
ims=[Image.open(p).resize((360,640)) for p in outs]
sh=Image.new('RGB',(360*3+40,(640+50)*2+20),(255,255,255)); d=ImageDraw.Draw(sh)
for i,(im,n) in enumerate(zip(ims,VARS)):
    x=10+(i%3)*(360+10); yy=10+(i//3)*(690+10); sh.paste(im,(x,yy+40)); d.text((x,yy+8),n,font=BD(26),fill=(0,0,0))
sh.save(G+'sheet/scout_spec_compare.png'); print('ok')
