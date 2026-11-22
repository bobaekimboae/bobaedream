import os,sys,json,math,subprocess,re
import numpy as np,cv2
from PIL import Image,ImageDraw,ImageFont,ImageFilter
NV='/tmp/claude-0/-home-claude/9795e62c-2b83-5ed5-9b9a-75716025bfc2/scratchpad/numviz/'
G='/tmp/claude-0/-home-claude/9795e62c-2b83-5ed5-9b9a-75716025bfc2/scratchpad/g350/'
src=open(NV+'v60a.py').read().split('SFX=[]; CUTS=[]')[0].replace("D=os.path.dirname(os.path.abspath(__file__))",f"D='{NV[:-1]}'")
exec(src); ASSET=A   # 칩·화살표·3D 숫자·알약 등 앞서 정한 부품 그대로 재사용
CAPY=int(H*0.67)
WD=json.load(open(G+'words5.json'))
FIX={'라기':'락이','헛더라도':'헛돌아도','나눠줘서':'나눠 줘서','블루텟':'블루텍','주관':'주간등','밝혀져요.':'밝혀 줘요.','위의':'위','썬루프가':'선루프가','3500kg까지':'3,500kg까지','480L,':'480L,','2250L까지':'2,250L까지','넵이':'내비,','공존은':'공조는','디제이,':'디젤,','.1초입니다.':'.1초입니다.','주관등까지':'주간등까지','팬더':'펜더','썰루프도':'선루프도','집':'짐','고급스럽구요,':'고급스럽고요,','네비,':'내비,','자동의':'자동에','55kgm.':'55kg·m.','보베드림':'보배드림','디퍼렌셜락이':'디퍼렌셜 락이'}
WS=[]
i=0
while i<len(WD):
    w,s,e=WD[i]
    if i+1<len(WD) and (WD[i+1][0].startswith(',500') or WD[i+1][0]=='.0' or WD[i+1][0].startswith('.1초') or (w=='제' and WD[i+1][0]=='눈') or (w=='주관' and WD[i+1][0]=='등')):
        w={'제':'제논','주관':'주간등'}.get(w,w+WD[i+1][0]); e=WD[i+1][2]; i+=1
    WS.append([FIX.get(w,w),s,e]); i+=1
# 소리 시작 보정(-32dB)
aud=np.fromfile(G+'v5.raw',dtype=np.float32)
def onset(t):
    a=int(max(0,t-0.15)*16000)
    for k in range(a,min(len(aud),a+16000),160):
        seg=aud[k:k+320]
        if len(seg) and 20*math.log10(np.sqrt((seg**2).mean())+1e-9)>-32: return k/16000
    return t
for w in WS: w[1]=round(onset(w[1]),3) if w[1]>0 else 0
VOICE=67.42
def ws(key):  # 단어 시작
    for j,(w,s,e) in enumerate(WS):
        if w.replace(' ','').startswith(key): return j
    raise KeyError(key)
idx=lambda key,after=0: next(j for j,(w,s,e) in enumerate(WS) if j>=after and w.replace(' ','').startswith(key))
TR=json.load(open(G+'tracks.json'))
# (키, 원본시작, 원본끝, 첫단어, 칩, 칩단어, 보조, 화살표 유효(원본시각 범위), 큰숫자들)
C=[('c1',108.0,113.0,0,None,None,None,None,[]),
 ('c2',100.4,103.2,idx('제논'),'제논 헤드램프',idx('제논'),('LED 주간등',idx('LED')),(0,999),[]),
 ('c3',104.6,107.0,idx('펜더'),'펜더 깜빡이',idx('펜더'),None,(0,999),[]),
 ('c4',10.4,12.2,idx('휠은'),None,None,None,None,[]),
 ('c5a',69.6,71.0,idx('버튼'),None,None,None,None,[]),
 ('c5b',72.3,75.3,idx('선루프가'),'전동 선루프',idx('선루프가'),None,None,[]),
 ('c6',14.8,17.2,idx('뒷문엔'),'스페어타이어',idx('스페어'),None,(0,999),[]),
 ('c7',21.6,22.8,idx('견인고리'),'견인고리',idx('견인고리'),None,(21.9,999),[('3,500kg','최대 견인',idx('3,500'))]),
 ('c8',26.4,30.4,idx('트렁크는'),None,None,None,None,[]),
 ('c9',39.0,40.6,idx('시트는'),None,None,None,None,[]),
 ('c10',50.5,51.3,idx('도어'),'전동 시트 조절',idx('도어'),None,(0,999),[]),
 ('mem',51.3,52.3,idx('메모리도'),'메모리 시트 3개',idx('메모리도'),None,(0,999),[]),
 ('c11',56.0,56.9,idx('커맨드'),'커맨드 컨트롤러',idx('커맨드'),None,(0,999),[]),
 ('c12',59.8,62.6,idx('공조는'),'공조 다이얼',idx('다이얼'),None,(0,999),[]),
 ('c13',64.8,66.4,idx('그리고'),'디퍼렌셜 락 3개',idx('디퍼렌셜'),None,(0,999),[]),
 ('dx',96.0,100.2,idx('바퀴'),None,None,None,None,[]),
 ('c14',124.0,126.0,idx('문'),'조명 도어 스텝',idx('조명'),None,(0,999),[]),
 ('c15',112.6,117.4,idx('3.0'),'3.0 V6 디젤',idx('3.0'),None,None,[('211마력',None,idx('211'))]),
]
ENDT=WS[idx('자세한')][1]-0.12; TOTAL=VOICE+1.7
starts=[0.0]+[WS[c[3]][1]-0.12 for c in C[1:]]
SEG=[]
for k,c in enumerate(C):
    t0=starts[k]; t1=starts[k+1] if k+1<len(C) else ENDT; SEG.append((t0,t1,c))
# 말 자막 덩어리: 문장부호·최대 3어절
CH=[];cur=[]
for j,(w,s,e) in enumerate(WS):
    cur.append(j)
    if w[-1] in ',.?!' or len(cur)>=3: CH.append(cur); cur=[]
if cur: CH.append(cur)
BLK=ImageFont.truetype(F+'/Pretendard-Black.otf',60); YC=(245,242,0)
_sc={}
def subimg(ch,act):
    k=(tuple(ch),act)
    if k in _sc: return _sc[k]
    words=[WS[j][0].strip(' ,.?!') for j in ch]; text=' '.join(words); lines=[words]
    if BLK.getlength(text)>W-200 and len(words)>1: m=len(words)//2; lines=[words[:m],words[m:]]
    lh=80; tw=max(BLK.getlength(' '.join(l)) for l in lines)
    im=Image.new('RGBA',(int(tw+80),lh*len(lines)+40)); sh=Image.new('RGBA',im.size); sd=ImageDraw.Draw(sh)
    for i,l in enumerate(lines): sd.text((im.width/2+3,20+lh*i+lh/2+5),' '.join(l),font=BLK,fill=(0,0,0,220),anchor='mm',stroke_width=4,stroke_fill=(0,0,0,220))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6))); d=ImageDraw.Draw(im); n=0
    for i,l in enumerate(lines):
        x=(im.width-BLK.getlength(' '.join(l)))/2; y=20+lh*i+lh/2
        for w in l:
            d.text((x,y),w,font=BLK,fill=YC if ch[n]==act else (255,255,255),anchor='lm'); n+=1; x+=BLK.getlength(w+' ')
    _sc[k]=im; return im
def draw_sub(c,t):
    for q,ch in enumerate(CH):
        a=WS[ch[0]][1]-0.05; b=(WS[CH[q+1][0]][1]-0.05) if q+1<len(CH) else TOTAL
        if a<=t<b:
            act=max([j for j in ch if WS[j][1]<=t+0.02] or [ch[0]])
            im=subimg(ch,act); c.alpha_composite(im,((W-im.width)//2,CAPY-im.height//2)); return
def smooth(pts,k=7):
    a=np.array(pts); out=a.copy()
    for i in range(len(a)): out[i]=a[max(0,i-k//2):i+k//2+1].mean(0)
    return out
cap=cv2.VideoCapture(G+'src.mp4')
def frames(s0,s1):
    cap.set(cv2.CAP_PROP_POS_MSEC,s0*1000); fr=[]
    for _ in range(int(round((s1-s0)*30))+2):
        ok,f=cap.read()
        if not ok: break
        fr.append(cv2.cvtColor(f,cv2.COLOR_BGR2RGB))
    return fr
_chips={}
def gchip(s,size=70):
    if (s,size) not in _chips: _chips[(s,size)]=chip(s,size)
    return _chips[(s,size)]
H3={}
# 첫 화면(벨기에식): 노랑 붓띠 제조사 + 같은 줄 흰 큰 모델명 + 아래 한 줄
HB=chip('벤츠',76); HM=white('G350 블루텍',104); HS=white('2013년식 · 디젤 · W463',58)
place_chip_y_cap=H*0.58
def place(Cimg,tx,ty,below):
    bx0,by0,bx1,by1=Cimg.getbbox(); x=int(max(M-10,min(W-M-Cimg.width+10,tx-(bx0+bx1)/2))); L=ALEN
    if below:
        y=ty+TG+L+CG-by0
        if y+by1>place_chip_y_cap: L=max(AMIN,int(L-(y+by1-place_chip_y_cap))); y=ty+TG+L+CG-by0
    else:
        y=ty-TG-L-CG-by1
        if y+by0<150: L=max(AMIN,int(L-(150-(y+by0)))); y=ty-TG-L-CG-by1
    return x,int(y),L

FL='/home/claude/bobaedream/scripts/shortform/photo_listing/fluent3d/'
def flu(cp,h):
    im=Image.open(FL+cp+'.png').convert('RGBA'); im=im.crop(im.getchannel('A').point(lambda v:255 if v>40 else 0).getbbox())
    return im.resize((round(im.width*h/im.height),h),Image.LANCZOS)
def as24(fn,h,col=(20,20,20)):
    png=subprocess.run(['rsvg-convert','-h',str(h*3),'/home/claude/bobaedream/public/assets/bbm/detail-icons/'+fn],capture_output=True).stdout
    from io import BytesIO
    im=Image.open(BytesIO(png)).convert('RGBA'); a=im.getchannel('A'); im=Image.new('RGBA',im.size,col+(255,)); im.putalpha(a); im=im.crop(a.getbbox())
    return im.resize((round(im.width*h/im.height),h),Image.LANCZOS)
def ipill(icon,s,size=50):   # 오토스카우트24 테마 붓칠(노션 원본 126_40 / 긴 글 265_42) 흰색 + 아이콘 + 진한 글자
    # 여백 규칙을 위 노랑 칩과 같게: 높이 = 글자 높이 × 1.9, 좌우 여백 = 높이 × 0.31(칠이 실제로 칠해진 가로 구간 기준, 붓 끝 들쭉날쭉 보정)
    from io import BytesIO
    import numpy as _np
    f=BD(size); b=tsize(s,f); tw,th=b[2]-b[0],b[3]-b[1]; iw=icon.width; gap=16; cw=iw+gap+tw
    h=round(th*1.9); pad=round(h*0.31)
    w=cw+2*pad
    for _ in range(3):   # 칠해진 구간 폭이 cw+2*pad가 되도록 가로 크기를 맞춤
        svg='/home/claude/bobaedream/public/assets/shortform/brush-fill/as24-theme/'+('265_42.svg' if w>520 else '126_40.svg')
        a=Image.open(BytesIO(subprocess.run(['rsvg-convert','-w',str(w),'-h',str(h),svg],capture_output=True).stdout)).convert('RGBA').getchannel('A')
        A=_np.array(a); row=_np.where(A[h//2]>128)[0]; x0,x1=int(row[0]),int(row[-1]); span=x1-x0
        if abs(span-(cw+2*pad))<=2: break
        w+= (cw+2*pad)-span
    br=Image.new('RGBA',(w,h),(255,255,255,255)); br.putalpha(a)
    im=Image.new('RGBA',(w+30,h+30)); sh=Image.new('RGBA',im.size); sh.paste((0,0,0,130),(15,19),a)
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(7))); im.alpha_composite(br,(15,15)); d=ImageDraw.Draw(im)
    cx=15+x0+(span-cw)//2
    im.alpha_composite(icon,(cx,15+(h-icon.height)//2)); d.text((cx+iw+gap-b[0],15+(h-th)//2-b[1]),s,font=f,fill=INK); return im
# 휠: 인치 3D + 타이어 규격 3D, 화면 고정 자리(휠 상자 높이 약 800px 기준 0.19배 / 0.12배로 키움 — 사용자: 작으니 교정)
_t3=open(NV+'v60a.py').read(); _a=_t3.index('def text3d'); _b=_t3.index('def ease')
exec(_t3[_a:_b].replace('def text3d','def text3d_all').replace("m = re.match(r'^([\\d.,+]+)\\s*(.*)$', txt)","m = None"))
W_IN=text3d('18인치',h=170); W_TY=text3d_all('265/60 R18',h=110)   # 타이어 규격은 한 크기로(앞 숫자만 커지던 것 교정)
# 트렁크: 기본 → 접으면
T1=text3d('480L',h=180); T1L=ipill(as24('trunk-as24.svg',50),'기본',58); T2=text3d('2,250L',h=180); T2L=ipill(as24('trunk-as24.svg',50),'뒷좌석 접으면',58)
# 시트: 재질 3D + Fluent 3D 열선·통풍(등받이 폭 1080 × 0.16 → 170px)
S_MAT=text3d('브라운 가죽',h=120); S_HEAT=flu('1f525',200); S_VENT=flu('2744',200); S_HL=white('열선',58); S_VL=white('통풍',58)
_seat=flu('1f4ba',170); MEMI=Image.new('RGBA',(_seat.width+90,_seat.height+26)); MEMI.alpha_composite(_seat,(0,0))
_fb=BK(36)
for _k,_n in enumerate('123'):
    _cx=_seat.width-34+_k*42; _cy=_seat.height-6; _d=ImageDraw.Draw(MEMI); _d.ellipse((_cx-23,_cy-23,_cx+23,_cy+23),fill=(245,242,0),outline=(20,20,20),width=3); _d.text((_cx,_cy+1),_n,font=_fb,fill=INK,anchor='mm')
# 엔진: 오토스카우트24 아이콘(엔진·변속기) + Fluent 3D 스톱워치
EP=[ipill(as24('engine.svg',54),'토크 55kg·m',58),ipill(as24('gearbox.svg',54),'7단 자동 · 4륜구동',58),ipill(flu('23f1',60),'제로백 9.1초',58)]
DPL=ipill(flu('1f512',54) if os.path.exists(FL+'1f512.png') else as24('gearbox.svg',54),'앞 · 가운데 · 뒤 잠금',58)
DW1=ipill(flu('1f6de',60),'바퀴 하나가 헛돌아도',58); DW2=ipill(flu('2744',56),'진흙길 · 눈길 탈출',58)
def special(key,cv,t,t0):
    if key=='c13':
        pop(cv,DPL,((W-DPL.width)//2,int(H*0.10)),t,WS[idx('앞')][1]-t0-0.06)
    if key=='dx':
        y=int(H*0.12); pop(cv,DW1,((W-DW1.width)//2,y),t,WS[idx('바퀴')][1]-t0-0.06)
        pop(cv,DW2,((W-DW2.width)//2,y+DW1.height+20),t,WS[idx('진흙길')][1]-t0-0.06)
    if key=='c4':
        y=int(H*0.10); pop(cv,W_IN,((W-W_IN.width)//2,y),t,WS[idx('18인치')][1]-t0-0.22,0.3)
        pop(cv,W_TY,((W-W_TY.width)//2,y+W_IN.height+10),t,WS[idx('18인치')][1]-t0+0.15,0.3)
    if key=='c8':
        y=int(H*0.10); tb=WS[idx('480')][1]-t0-0.22
        pop(cv,T1L,((W-T1L.width)//2,y),t,tb); pop(cv,T1,((W-T1.width)//2,y+T1L.height),t,tb,0.3)
        tb2=WS[idx('2,250')][1]-t0-0.22; y2=y+T1L.height+T1.height+40
        pop(cv,T2L,((W-T2L.width)//2,y2),t,tb2); pop(cv,T2,((W-T2.width)//2,y2+T2L.height),t,tb2,0.3)
    if key=='c9':
        ym=int(H*0.50); gap=int(S_HEAT.height*0.15); tot=S_HEAT.width+S_VENT.width+gap*3
        x0=(W-tot)//2
        pop(cv,S_MAT,((W-S_MAT.width)//2,ym-S_HEAT.height//2-S_MAT.height-30),t,WS[idx('브라운')][1]-t0-0.06,0.3)
        th=WS[idx('열선')][1]-t0-0.06; tv=WS[idx('통풍')][1]-t0-0.06
        pop(cv,S_HEAT,(x0,ym-S_HEAT.height//2),t,th,0.3); pop(cv,S_HL,(x0+S_HEAT.width//2-S_HL.width//2,ym+S_HEAT.height//2+4),t,th+0.1)
        x1=x0+S_HEAT.width+gap*3
        pop(cv,S_VENT,(x1,ym-S_VENT.height//2),t,tv,0.3); pop(cv,S_VL,(x1+S_VENT.width//2-S_VL.width//2,ym+S_VENT.height//2+4),t,tv+0.1)
    if key=='c15':
        y=int(H*0.24)+270
        for k,(im,w) in enumerate(zip(EP,['토크는','7단','제로백은'])):
            pop(cv,im,((W-im.width)//2,y+k*128),t,WS[idx(w)][1]-t0-0.06)
SFXT=[]; NEIGH=[]; ICONT=[]; REMIX=bool(os.environ.get('REMIX'))
HORSE=flu('1f40e',180)
proc=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p',G+('nov3_dummy.mp4' if REMIX else 'nov3.mp4')],stdin=subprocess.PIPE)
last=None; nfr=0
for t0,t1,c in SEG:
    key,s0,s1,fw,clab,cw,sub,av,bigs=c; dur=t1-t0; rate=min(2.0,(s1-s0)/dur)
    if key in('c11','c7'): rate=0.55
    if key=='mem': rate=min(1.0,rate)   # 컨트롤러가 보이는 동안만 재생, 이후 정지+확대
    fr=frames(s0,s1)
    pts=smooth(TR[key]['pts']) if key in TR else None
    Cimg=gchip(clab) if clab else None; Simg=white(sub[0],58) if sub else None
    BIG=[(text3d(b,h=180 if key!='c15' else 210),white(l,58) if l else None,WS[j][1]-t0-0.22) for b,l,j in bigs]
    for tb in [x[2] for x in BIG]:
        if key!='c15': SFXT.append(t0+tb-0.02)
    if key=='c15': NEIGH.append(WS[idx('211')][2]-0.05)   # 마력 뒤 말 울음(사용자 지시)
    if key=='c8': SFXT.append(t0+WS[idx('480')][1]-t0-0.24)
    tc=(WS[cw][1]-t0-0.06) if cw is not None else 0
    BL0=None
    # 매뉴얼 v1.7 아이콘 효과음: 시트 열선·통풍·메모리 아이콘이 톡 나올 때 작은 팝
    if key=='c9': ICONT.extend([WS[idx('열선')][1]-0.06, WS[idx('통풍')][1]-0.06])
    if key=='mem': ICONT.append(t0+tc+0.08)
    if REMIX: nfr=round(t1*FPS); continue
    while nfr<round(t1*FPS):
        t=nfr/FPS-t0; st=min(s1,s0+t*rate); fi=min(len(fr)-1,int(round((st-s0)*30)))
        z=1.0+0.045*ease(t/dur); im=Image.fromarray(fr[fi]); cw_=W/z; ch_=H/z
        cv=im.resize((W,H),box=((W-cw_)/2,(H-ch_)/2,(W+cw_)/2,(H+ch_)/2)).convert('RGBA')
        tomap=lambda fx,fy:((fx*W-W/2)*z+W/2,(fy*H-H/2)*z+H/2)
        if key=='c1':
            cv=Image.alpha_composite(cv,Image.new('RGBA',(W,H),(0,0,0,90)))
            pop(cv,HB,(M-10,YB),t,0.08); pop(cv,HM,(M-10+HB.width+6,YB+(HB.height-HM.height)//2),t,0.28); pop(cv,HS,(M-4,YB+HB.height+16),t,0.5)
        if key in('c15',) : cv=Image.alpha_composite(cv,Image.new('RGBA',(W,H),(0,0,0,70)))
        if key=='c8': cv=Image.alpha_composite(cv,Image.new('RGBA',(W,H),(0,0,0,40)))
        if Cimg is not None:
            if pts is not None:
                pi=min(len(pts)-1,int(round((st-s0)*30))); tx,ty=tomap(*pts[pi])
            else: tx,ty=W/2,H*0.62
            if BL0 is None: BL0=ty<H*0.45   # 칩 위·아래는 컷 안에서 고정(뒤집힘 방지)
            bl=BL0
            if av is None:   # 화살표 없는 칩: 위쪽 띠
                cx,cy=M-10,YB if not BIG else YB-120
                if key=='c15': cx,cy=M-10,YB-150
                L=0
            else: cx,cy,L=place(Cimg,tx,ty,bl)
            if av and av[0]<=st<=av[1] and t>=tc+0.18:
                g=ease((t-tc-0.18)/0.25); Lc=max(20,round(L*(0.55+0.45*g))); bob=round(BOB*abs(math.sin((t-tc-0.43)*5))) if t>tc+0.43 else 0
                A,off=arrimg(L,bl); A=A.resize((A.width,round(A.height*Lc/L))) if Lc!=L else A; offc=round(off*Lc/L)
                if bl: tail=ty+TG+L; cv.alpha_composite(A,(int(tx-A.width/2),int(tail-Lc-bob-offc)))
                else: tail=ty-TG-L; cv.alpha_composite(A,(int(tx-A.width/2),int(tail+bob-offc)))
            pop(cv,Cimg,(cx,cy),t,tc)
            if Simg is not None:
                ts=WS[sub[1]][1]-t0-0.06; pop(cv,Simg,(cx+Cimg.width//2-Simg.width//2,cy+Cimg.height-4) if bl else (cx+Cimg.width//2-Simg.width//2,cy-Simg.height+6),t,ts)
        for k2,(B3,BL,tb) in enumerate(BIG):
            y3=int(H*0.12) if key!='c15' else int(H*0.24)
            pop(cv,B3,((W-B3.width)//2,y3),t,tb,0.3)
            if BL: pop(cv,BL,((W-BL.width)//2,y3+B3.height+6),t,tb+0.12)
            if key=='c15': pop(cv,HORSE,(min(W-HORSE.width-24,(W+B3.width)//2-40),y3-HORSE.height+30),t,WS[idx('211')][2]-t0-0.1,0.3)
        special(key,cv,t,t0)
        if key=='mem' and t>=tc: pop(cv,MEMI,(cx+Cimg.width-10,cy-MEMI.height//2+Cimg.height//2-10),t,tc+0.08)
        draw_sub(cv,nfr/FPS)
        proc.stdin.write(cv.convert('RGB').tobytes()); nfr+=1; last=fr[fi]
    del fr
# 끝 화면: 마지막 장면 어둡게 + 보배드림 로고 커짐
if REMIX: proc.stdin.close(); proc.wait()
LG=Image.open(ASSET+'bobae_logo_600.png').convert('RGBA'); LG.thumbnail((520,520)); E1=white('자세한 정보는 보배드림 앱에서',56)
base=Image.fromarray(last).convert('RGBA') if not REMIX else None
while not REMIX and nfr<round(TOTAL*FPS):
    t=nfr/FPS-ENDT; cv=Image.alpha_composite(base,Image.new('RGBA',(W,H),(0,0,0,int(185*min(1,t/0.3)))))
    s=0.7+0.3*ease(t/0.6); lw=round(LG.width*s); L2=LG.resize((lw,round(LG.height*s))); cv.alpha_composite(L2,((W-lw)//2,640-(L2.height-LG.height)//2))
    draw_sub(cv,nfr/FPS) if nfr/FPS<VOICE else None
    proc.stdin.write(cv.convert('RGB').tobytes()); nfr+=1
if not REMIX: proc.stdin.close(); proc.wait()
json.dump({'seg':[(round(a,2),round(b,2),c[0]) for a,b,c in SEG],'sfx':SFXT,'total':TOTAL},open(G+'plan3.json','w'),ensure_ascii=False)
OUT=G+'bobae_g350_be_v4.mp4'
inp=['-i',G+'nov3.mp4','-i',G+'voice5.wav','-i',ASSET+'bgm/bobae_showroom_v1.mp3']
fl=['[1:a]highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=8:release=120[v]',f'[2:a]atrim=0:{TOTAL},volume=0.16,afade=t=out:st={TOTAL-1.5}:d=1.5[b]']; mx=['[v]','[b]']
for tn in NEIGH:
    inp+=['-i',G+'neigh.wav']; fl.append(f'[{len(mx)+1}:a]volume=0.55,adelay={int(tn*1000)}:all=1[n0]'); mx.append('[n0]')
for j,tc in enumerate(SFXT):
    inp+=['-i',ASSET+'sfx/ding.wav']; fl.append(f'[{j+3+len(NEIGH)}:a]volume=0.7,adelay={int(tc*1000)}:all=1[s{j}]'); mx.append(f'[s{j}]')
# 아이콘 팝 0.30: 0.45초 안에 딩·말소리가 있으면 생략, 아이콘끼리 0.45초 안이면 앞의 것만
IP=[]
for ti in sorted(ICONT):
    if any(abs(ti-x)<0.45 for x in SFXT+NEIGH): continue
    if IP and ti-IP[-1]<0.45: continue
    IP.append(ti)
for j,tc in enumerate(IP):
    inp+=['-i',ASSET+'sfx/pop.wav']; fl.append(f'[{len(inp)//2-1}:a]volume=0.30,adelay={int(tc*1000)}:all=1[p{j}]'); mx.append(f'[p{j}]')
print('icon pops',[round(x,2) for x in IP],'from',[round(x,2) for x in ICONT])
fl.append(''.join(mx)+f'amix=inputs={len(mx)}:normalize=0:duration=longest,loudnorm=I=-10:TP=-1.0,aresample=192000,alimiter=limit=0.76:attack=3:release=60:level=0,aresample=48000[a]')
subprocess.run(['ffmpeg','-y','-loglevel','error',*inp,'-filter_complex',';'.join(fl),'-map','0:v','-map','[a]','-c:v','copy','-c:a','aac','-b:a','192k','-t',str(TOTAL),OUT],check=True)
print(OUT,TOTAL,SFXT)
