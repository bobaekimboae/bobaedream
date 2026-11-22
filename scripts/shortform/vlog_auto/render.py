# 브이로그 자동 편집 렌더러: python3 render.py 작업폴더 60|90|120
# 작업폴더: edl.json(편집표) · stt.json(받아쓰기) · seg/(장면 조각). 숫자 규칙은 be_locked_rules.json에서만 읽는다.
import os,sys,json,subprocess
import cv2
HERE=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,HERE)
from draw_base import *
SF=os.path.dirname(HERE)
BE=json.load(open(os.path.join(SF,'be_locked_rules.json')))
_hx=lambda h:tuple(int(h[k:k+2],16) for k in (1,3,5))
BE_YEL=_hx(BE['color']['yellow']); CHIP_PX=BE['chip']['font_px']; CHIP_HOLD=BE['chip']['hold_s']
V=os.path.abspath(sys.argv[1])+'/'; VER=sys.argv[2]
EDL=json.load(open(V+'edl.json')); META=EDL['meta']
STT=json.load(open(V+'stt.json'))
VAR={k:(d['clip'],d['s'],d['e'],d['cap'],d.get('grade',1),d.get('chip'),d.get('fx','')) for k,d in EDL['items'].items()}
VERS=EDL['versions']
ICONS=os.path.join(HERE,'assets','f3d')+'/'
ASSET=A
ITEMS=[];prev=None
for k in VERS[VER]:
    c,s,e,t,p,ch,fx=VAR[k]
    show=ch if (ch and ch!=prev) else None
    if ch: prev=ch
    ITEMS.append(dict(k=k,clip=c,s=s,e=e,txt=t,chip=show,fx=fx))
# 길이·시작
t=0
for it in ITEMS:
    cap=cv2.VideoCapture(V+f"seg/{it['k']}.mp4"); n=int(cap.get(cv2.CAP_PROP_FRAME_COUNT)); cap.release()
    it['dur']=n/30; it['t0']=t; t+=it['dur']
ENDD=2.2; TOTAL=t+ENDD
# 자막 씽크: 받아쓰기 낱말 시각(글자 단위)에 자막 글자를 맞춰 어절마다 실제 말 시작 시각을 붙임
import difflib,re
def _norm(c): return c if re.match(r'[0-9A-Za-z가-힣]',c) else ''
for it in ITEMS:
    ws=[(w.strip(),s0,e0) for x in STT[it['clip']] for (w,s0,e0) in x['w'] if s0>=it['s']-0.1 and s0<it['e']]
    src=[];stm=[]
    for w,s0,e0 in ws:
        cs=[c for c in w if _norm(c)]
        for j,c in enumerate(cs): src.append(c); stm.append(s0+(e0-s0)*j/max(1,len(cs)))
    end_speech=(ws[-1][2] if ws else it['e']-0.2)
    parts=it['txt'].split('|'); dw=[]   # (덩어리번호, 어절)
    for pi,pt in enumerate(parts):
        for w in pt.strip(' ,.').split(' '): dw.append((pi,w))
    dst=[];own=[]
    for k,(pi,w) in enumerate(dw):
        for c in w:
            if _norm(c): dst.append(c); own.append(k)
    t=[None]*len(dw)
    sm=difflib.SequenceMatcher(None,src,dst,autojunk=False)
    for blk in sm.get_matching_blocks():
        for j in range(blk.size):
            k=own[blk.b+j]
            if t[k] is None: t[k]=stm[blk.a+j]
    # 못 맞춘 어절은 앞뒤 맞춘 어절 사이로 나눔
    known=[(k,v) for k,v in enumerate(t) if v is not None]
    if not known: known=[(0,(ws[0][1] if ws else it['s']+0.1)),(len(dw)-1,end_speech-0.3)]
    for k in range(len(dw)):
        if t[k] is None:
            pv=[(i,v) for i,v in known if i<k]; nx=[(i,v) for i,v in known if i>k]
            if pv and nx: (i0,v0),(i1,v1)=pv[-1],nx[0]; t[k]=v0+(v1-v0)*(k-i0)/(i1-i0)
            elif pv: t[k]=pv[-1][1]+0.25*(k-pv[-1][0])
            else: t[k]=max(it['s'],nx[0][1]-0.25*(nx[0][0]-k))
    for k in range(1,len(t)): t[k]=max(t[k],t[k-1]+0.05)
    rel=[min(it['dur']-0.05,max(0,x-it['s']))+it['t0'] for x in t]
    ch=[]
    for pi,pt in enumerate(parts):
        ks=[k for k,(q,_) in enumerate(dw) if q==pi]
        st=rel[ks[0]]-0.08
        ch.append([st,None,pt,[rel[k] for k in ks]])
    for i in range(len(ch)):
        ch[i][1]=ch[i+1][0] if i+1<len(ch) else it['t0']+it['dur']-0.02
        if META.get('cap_tail_s') is not None:   # 말이 끊긴 구간은 자막을 내림(마지막 어절 + 꼬리)
            ch[i][1]=min(ch[i][1],ch[i][3][-1]+META['cap_tail_s'])
    ch[0][0]=min(ch[0][0],it['t0']+0.15) if ch[0][0]-it['t0']<0.6 else ch[0][0]
    it['caps']=[tuple(c) for c in ch]
# 2분판 포인트: 이모지 스티커 대신 스카우트 원본 강조 요소(노션 스카우트24 테마별, 모양 그대로·색/크기/뒤집기만)
# burst=주황 강조 획(반응 낱말 양옆), circle=노랑 붓 원(핵심 낱말), arrow=민트 손그림 화살표(가리킬 것), sparkle=반짝임
CAP_TOP=BE['caption']['center_y_px']-40
STK={k:([tuple(x) for x in v] if v and isinstance(v[0],list) else [tuple(v)]) for k,v in EDL.get('points',{}).get(VER,{}).items()}   # 장면키: [낱말, 아이콘, 칩 글자] 하나 또는 그 목록(한 장면 원본은 여러 개, 말한 순서대로)
def wbox(text,idx):   # be3와 같은 배치로 낱말 상자(화면 좌표) 계산
    fnt=BK(60); text=text.strip(' ,.'); lines=[text]
    if fnt.getlength(text)>810-60 and ' ' in text:
        sp=[i for i,c in enumerate(text) if c==' ']; cut=min(sp,key=lambda i:abs(i-len(text)/2)); lines=[text[:cut],text[cut+1:]]
    lh,gap=80,fnt.getlength(' '); tw=max(fnt.getlength(l) for l in lines); iw=int(tw+80); wi=0
    ox=(W-iw)//2; oy=CAP_TOP-20
    for i,l in enumerate(lines):
        x=(iw-fnt.getlength(l))/2; y=20+lh*i+lh/2
        for w in l.split(' '):
            if wi==idx: return (ox+x,oy+y-36,ox+x+fnt.getlength(w),oy+y+36)
            wi+=1; x+=fnt.getlength(w)+gap
    return (W/2-60,CAP_TOP,W/2+60,CAP_TOP+70)
STKEV=[]
# 2분판 포인트(최종): 자막은 그대로 두고, 그 낱말이 들릴 때 자막 바로 위에 작은 노랑 붓칠 칩 + 플루언트 3D 아이콘이 톡
def rchip(label,n):
    c=chip(label,CHIP_PX); ic=Image.open(ICONS+f'{n}.png').convert('RGBA'); h=round(c.height*0.82); ic=ic.resize((h,h),Image.LANCZOS)
    im=Image.new('RGBA',(c.width+round(h*0.92),max(c.height,h)+4)); im.alpha_composite(c,(0,(im.height-c.height)//2))
    im.alpha_composite(ic,(c.width-round(h*0.10),(im.height-h)//2)); return im
for it in ITEMS:
    if it['k'] not in STK: continue
    used=-1
    for pt in STK[it['k']]:
        word,icon,lab=(list(pt)+[None])[:3]; lab=lab or word
        for ci,(a,b,s0,wt) in enumerate(it['caps']):
            if ci<=used: continue
            ws=s0.strip(' ,.').split(' ')
            hit=[j for j,w in enumerate(ws) if word in w]
            if hit:
                st=max(a,wt[hit[0]]-0.06)+BE['chip']['delay_after_phrase_s']   # 그 낱말을 말하는 순간
                if STKEV and st<STKEV[-1][0]+STKEV[-1][2]: st=STKEV[-1][0]+STKEV[-1][2]   # 앞 칩이 끝난 뒤(같은 자리)
                STKEV.append((st,rchip(lab,icon),min(CHIP_HOLD,it['t0']+it['dur']-0.05-st),any(ch.isdigit() for ch in lab))); used=ci; break
CAPS=[c for it in ITEMS for c in it['caps']]
FT=BK(64); YC=(245,242,0); CAPY=int(H*0.70)
_cc={}
def capimg(s):
    if s in _cc: return _cc[s]
    words=s.split(' '); lines=[words]
    if FT.getlength(s)>W-180 and len(words)>1:
        best=min(range(1,len(words)),key=lambda m:abs(FT.getlength(' '.join(words[:m]))-FT.getlength(' '.join(words[m:])))); lines=[words[:best],words[best:]]
    lh=84; tw=max(FT.getlength(' '.join(l)) for l in lines)
    im=Image.new('RGBA',(int(tw+90),lh*len(lines)+50)); sh=Image.new('RGBA',im.size); sd=ImageDraw.Draw(sh)
    for i,l in enumerate(lines): sd.text((im.width/2+3,25+lh*i+lh/2+5),' '.join(l),font=FT,fill=(0,0,0,230),anchor='mm',stroke_width=6,stroke_fill=(0,0,0,230))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(5))); d=ImageDraw.Draw(im)
    for i,l in enumerate(lines):
        x=(im.width-FT.getlength(' '.join(l)))/2; y=25+lh*i+lh/2
        for w in l:
            col=YC if any(k in w for k in KEY) else (255,255,255)
            d.text((x,y),w,font=FT,fill=col,anchor='lm',stroke_width=3,stroke_fill=(15,15,15)); x+=FT.getlength(w+' ')
    _cc[s]=im; return im
# 벨기에판 말 자막(매뉴얼 phrase_img_be3 그대로): 그림자 흰 글자 · 외곽선 없음 · 말하는 어절만 노랑 #EEEF05 · 윗선 화면 67% 고정 · 바로 등장
_be={}
def be3(text,act=-1):
    k=(text,act)
    if k in _be: return _be[k]
    fnt=BK(60); text=text.strip(' ,.'); lines=[text]
    if fnt.getlength(text)>810-60 and ' ' in text:
        sp=[i for i,c in enumerate(text) if c==' ']; cut=min(sp,key=lambda i:abs(i-len(text)/2)); lines=[text[:cut],text[cut+1:]]
    lh,gap=80,fnt.getlength(' '); tw=max(fnt.getlength(l) for l in lines)
    im=Image.new('RGBA',(int(tw+80),lh*len(lines)+40)); sh=Image.new('RGBA',im.size); sd=ImageDraw.Draw(sh)
    for i,l in enumerate(lines): sd.text((im.width/2+3,20+lh*i+lh/2+5),l,font=fnt,fill=(0,0,0,220),anchor='mm',stroke_width=4,stroke_fill=(0,0,0,220))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6))); d=ImageDraw.Draw(im); wi=0
    for i,l in enumerate(lines):
        x=(im.width-fnt.getlength(l))/2; y=20+lh*i+lh/2
        for w in l.split(' '):
            d.text((x,y),w,font=fnt,fill=BE_YEL if wi==act else (255,255,255),anchor='lm'); wi+=1; x+=fnt.getlength(w)+gap
    _be[k]=im; return im
CAP_TOP=BE['caption']['center_y_px']-40
def wtimes(a,b,s):   # 덩어리 안 어절 시각: 말 구간을 글자 수 비율로 나눔
    ws=s.strip(' ,.').split(' '); L=[max(1,len(w)) for w in ws]; tot=sum(L); out=[]; c=0
    for l in L: out.append(a+(b-a)*c/tot); c+=l
    return out
# 칩·첫 화면
ICO=META.get('icons',{})
import numpy as _np
_chip0=chip; _ji=[0]
def chip(label,size,tilt=None):   # 규칙 파일: 붓칠 노랑·반시계 기울기·흔들림
    j=BE['chip']['tilt_jitter_deg']; tl=BE['chip']['tilt_ccw_deg']+j[_ji[0]%len(j)]; _ji[0]+=1
    im=_chip0(label,size,tl); a=_np.array(im).astype(_np.float32); r,g,b=a[...,0],a[...,1],a[...,2]
    k=_np.clip((_np.minimum(r,g)-b)/240.0,0,1)
    for i,c in enumerate(BE_YEL): a[...,i]=a[...,i]*(1-k)+c*k
    return Image.fromarray(a.astype(_np.uint8),'RGBA')
def chipi(label,size):   # 노랑 붓칠 칩 + 오른쪽 끝에 마이크로소프트 플루언트 3D 아이콘(원본 그대로, 크기만)
    c=chip(label,size); n=ICO.get(label)
    if not n: return c
    ic=Image.open(ICONS+f'{n}.png').convert('RGBA'); h=round(c.height*0.82); ic=ic.resize((h,h),Image.LANCZOS)
    im=Image.new('RGBA',(c.width+round(h*0.92),max(c.height,h)+4)); y0=(im.height-c.height)//2
    im.alpha_composite(c,(0,y0)); im.alpha_composite(ic,(c.width-round(h*0.10),(im.height-h)//2)); return im
HB=chipi(META['title_chip'],BE['chip']['title_font_px']); HM=white(META['title'],104); HS=white(META['subtitle'],52)
CH={it['k']:chipi(it['chip'],CHIP_PX) for it in ITEMS if it['chip'] and it['fx']!='title'}
LG=Image.open(ASSET+'bobae_logo_600.png').convert('RGBA'); LG.thumbnail((500,500)); E1=white(META.get('end_text','다음 브이로그도 기대해 주세요!'),56)
# 사진 카드(폴라로이드: 흰 테두리 + 아래 이름) · 낙엽 뿌리기 — 사용자가 요청한 영상에서만(meta.photo_cards / meta.leaves)
import random as _rnd, math as _m
def _polaroid(path,label,w=500):
    ph=Image.open(path).convert('RGB'); r=w/ph.width; ph=ph.resize((w,round(ph.height*r)),Image.LANCZOS)
    if ph.height>620: ph=ph.crop((0,0,w,620))
    pad=18; bot=110; card=Image.new('RGBA',(w+pad*2,ph.height+pad+bot),(255,255,255,255)); card.paste(ph,(pad,pad))
    d=ImageDraw.Draw(card); f=BK(46); d.text((card.width/2,ph.height+pad+bot/2),label,font=f,fill=(20,20,20),anchor='mm')
    m=Image.new('L',card.size,0); ImageDraw.Draw(m).rounded_rectangle((0,0,card.width-1,card.height-1),18,fill=255); card.putalpha(m)
    card=card.rotate(-3,resample=Image.BICUBIC,expand=True)
    sh=Image.new('RGBA',(card.width+60,card.height+60)); sm=Image.new('RGBA',sh.size); sm.paste((0,0,0,110),(30,40),card.getchannel('A'))
    sh.alpha_composite(sm.filter(ImageFilter.GaussianBlur(14))); sh.alpha_composite(card,(30,26)); return sh
PCARDS=[(c['t0'],c['t1'],_polaroid(c['img'],c['label'],c.get('w',500)),c.get('y',560)) for c in META.get('photo_cards',[])]
LEAVES=META.get('leaves',[])
_LIMG=[Image.open(ICONS+f'{n}.png').convert('RGBA') for n in ('maple','leaf') if os.path.exists(ICONS+f'{n}.png')]
_rr=_rnd.Random(7); _LP=[dict(x=_rr.uniform(0,W),sz=_rr.uniform(70,150),sp=_rr.uniform(260,430),ph=_rr.uniform(0,6.28),rot=_rr.uniform(-160,160),off=_rr.uniform(0,3.0),img=_rr.randrange(len(_LIMG) or 1)) for _ in range(18)]
_lc={}
def draw_overlays(cv,T):
    for t0,t1,pc,y in PCARDS:
        if t0<=T<t1:
            k=T-t0; sc=0.55+0.45*ease(min(1,k/.28)); al=1.0 if T<t1-.25 else max(0,(t1-T)/.25)
            w2,h2=round(pc.width*sc),round(pc.height*sc); im2=pc.resize((w2,h2),Image.LANCZOS)
            if al<1: im2.putalpha(im2.getchannel('A').point(lambda v,al=al:int(v*al)))
            cv.alpha_composite(im2,((W-w2)//2,y+(pc.height-h2)//2))
    if not _LIMG: return
    for a,b in LEAVES:
        if not (a<=T<b+2.5): continue
        for p in _LP:
            k=T-a-p['off']
            if k<0: continue
            cyc=H+320; y=-160+p['sp']*k
            if T<b: y=(y+160)%cyc-160   # 끝 시각 전까지 계속 위에서 다시 내려옴
            elif y>H+40: continue
            x=p['x']+60*_m.sin(p['ph']+k*1.7); ang=int((p['rot']*k)%360)//6*6; key=(p['img'],int(p['sz']),ang)
            if key not in _lc: _lc[key]=_LIMG[p['img']].resize((int(p['sz']),int(p['sz'])),Image.LANCZOS).rotate(ang,resample=Image.BICUBIC,expand=True)
            li=_lc[key]
            px,py=int(x-li.width/2),int(y)
            sx,sy=max(0,-px),max(0,-py); ex,ey=min(li.width,W-px),min(li.height,H-py)
            if ex>sx and ey>sy: cv.alpha_composite(li.crop((sx,sy,ex,ey)),(px+sx,py+sy))
def frames(path):
    cap=cv2.VideoCapture(path)
    while True:
        ok,f=cap.read()
        if not ok: break
        yield cv2.cvtColor(f,cv2.COLOR_BGR2RGB)
OUTV=V+f'nov_{VER}.mp4'
proc=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r','30','-i','-','-c:v','libx264','-preset','veryfast','-crf','23','-pix_fmt','yuv420p',OUTV],stdin=subprocess.PIPE)
POP=[];WH=[];last=None
for n_it,it in enumerate(ITEMS):
    if it['k'] in CH: POP.append(it['t0']+0.12)
    if it['fx']=='whoosh' and n_it>0: WH.append(max(0,it['t0']-0.12))
    if it['fx']=='title': POP+= [0.15,0.45]
    for fi,fr in enumerate(frames(V+f"seg/{it['k']}.mp4")):
        t=fi/30; T=it['t0']+t
        im=Image.fromarray(fr)
        z=1.0+0.03*ease(t/max(it['dur'],0.1))
        if it['fx']=='zoom': z=1.0+0.13*ease(min(1,max(0,(t-0.25)/0.35)))   # 웃긴 말에 화면 당기기
        if z>1.0001:
            cw,ch_=W/z,H/z; im=im.resize((W,H),box=((W-cw)/2,(H-ch_)/2*0.8,(W+cw)/2,(H-ch_)/2*0.8+ch_))
        if it['fx']=='whoosh' and n_it>0 and t<0.22:   # 휙 넘김: 옆에서 밀려 들어옴 + 흐림
            u=ease(t/0.22); off=int(W*0.35*(1-u)); im=im.filter(ImageFilter.BoxBlur(int(14*(1-u))+1))
            base=Image.new('RGB',(W,H)); base.paste(im,(off,0)); base.paste(im.transpose(Image.FLIP_LEFT_RIGHT),(off-W,0)); im=base
        cv=im.convert('RGBA')
        if it['fx']=='title' and t<META.get('title_s',1e9):   # title_s: 한 장면 원본일 때 첫 화면 제목을 몇 초만
            cv=Image.alpha_composite(cv,Image.new('RGBA',(W,H),(0,0,0,60)))
            pop(cv,HB,((W-HB.width)//2,YB),t,0.1); pop(cv,HM,((W-HM.width)//2,YB+HB.height+6),t,0.4); pop(cv,HS,((W-HS.width)//2,YB+HB.height+HM.height+20),t,0.7)
        draw_overlays(cv,T)
        _pt=any(t0s<=T<t0s+dd for t0s,_rc,dd,_n in STKEV); _num=any(t0s-0.07<=T<t0s+dd and _n for t0s,_rc,dd,_n in STKEV)   # 포인트 칩이 뜨는 동안은 장소 칩 자리를 비워 같은 자리에
        if it['k'] in CH and t<min(it['dur'],0.1+CHIP_HOLD) and not _pt:
            pop(cv,CH[it['k']],((W-CH[it['k']].width)//2,YB),t,0.1)
        for a,b,s,wt in it['caps']:
            if a<=T<b and not (it['fx']=='title' and t<1.0) and not (t<BE['caption']['cut_gap_s'] or (_num and BE['caption']['hide_while_number_chip'])):
                act=max([j for j,w in enumerate(wt) if T+0.04>=w] or [0])
                ci=be3(s,act); cv.alpha_composite(ci,((W-ci.width)//2,CAP_TOP-20)); break
        for t0s,rc,dd,_n in STKEV:
            if t0s<=T<t0s+dd:
                k2=T-t0s; sc=0.6+0.4*ease(min(1,k2/.18)); al=1.0 if T<t0s+dd-.22 else max(0,(t0s+dd-T)/.22)
                w2,h2=round(rc.width*sc),round(rc.height*sc); im2=rc.resize((w2,h2),Image.LANCZOS)
                if al<1: im2.putalpha(im2.getchannel('A').point(lambda v,al=al:int(v*al)))
                cv.alpha_composite(im2,((W-w2)//2,BE['chip']['y_top_px']+(rc.height-h2)//2))
        proc.stdin.write(cv.convert('RGB').tobytes()); last=fr
# 끝 화면
base=Image.fromarray(last).convert('RGBA'); nE=round(ENDD*30)
for f in range(nE):
    t=f/30; cv=Image.alpha_composite(base,Image.new('RGBA',(W,H),(0,0,0,int(190*min(1,t/0.3)))))
    s=0.7+0.3*ease(t/0.6); lw=round(LG.width*s); L2=LG.resize((lw,round(LG.height*s))); cv.alpha_composite(L2,((W-lw)//2,620-(L2.height-LG.height)//2))
    pop(cv,E1,((W-E1.width)//2,1180),t,0.35)
    draw_overlays(cv,TOTAL-ENDD+t)
    proc.stdin.write(cv.convert('RGB').tobytes())
proc.stdin.close(); proc.wait()
# 소리: 원본 말소리 이어 붙이기(구간마다 짧은 페이드) + 명랑 배경음(말할 때 자동으로 줄임) + 팝·휙
lst=V+f'alist_{VER}.txt'; open(lst,'w').write(''.join(f"file '{V}seg/{it['k']}.mp4'\n" for it in ITEMS))
sp=V+f'speech_{VER}.wav'
fl=[]; inp=[]
for j,it in enumerate(ITEMS):
    inp+=['-i',V+f"seg/{it['k']}.mp4"]; fl.append(f"[{j}:a]atrim=0:{it['dur']:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.04,afade=t=out:st={max(0,it['dur']-0.06):.3f}:d=0.06[a{j}]")
fl.append(''.join(f'[a{j}]' for j in range(len(ITEMS)))+f'concat=n={len(ITEMS)}:v=0:a=1,apad=pad_dur={ENDD}[o]')
subprocess.run(['ffmpeg','-y','-v','error',*inp,'-filter_complex',';'.join(fl),'-map','[o]','-ar','48000','-ac','2',sp],check=True)
OUT=V+META.get('out_prefix','bobae_vlog')+f'_{VER}s.mp4'
inp=['-i',OUTV,'-i',sp,'-i',A+'bgm/'+META.get('bgm','life_of_riley_kevin_macleod_ccby.mp3')]
if META.get('mute_speech'):   # 원본 소리 무음: 배경음만(자막으로 말을 전달)
    f2=[f'[2:a]atrim=0:{TOTAL:.2f},asetpts=PTS-STARTPTS,volume=0.5,afade=t=in:d=0.6,afade=t=out:st={TOTAL-2.0:.2f}:d=2.0[b]']; mx=['[b]']
else:
    f2=[
 '[1:a]highpass=f=80,acompressor=threshold=-22dB:ratio=3:attack=6:release=120,volume=1.6,asplit=2[v][key]',
 f'[2:a]atrim=0:{TOTAL:.2f},asetpts=PTS-STARTPTS,volume=0.22,afade=t=in:d=0.6,afade=t=out:st={TOTAL-2.0:.2f}:d=2.0[b0]',
 '[b0][key]sidechaincompress=threshold=0.02:ratio=10:attack=20:release=350[b]']; mx=['[v]','[b]']
POP+=[max(0,e[0]-0.02) for e in STKEV]
POP=[0.15][:BE['sfx']['with_music_per_video']]; WH=[]
# 검사용 계획 파일(check_be.py가 읽음): 칩 시각·글자 크기·자리, 효과음, 컷
_pl=dict(rules_version=BE['version'],chips=[],sfx=sorted(POP+WH+([TOTAL-ENDD+0.3] if BE['sfx']['end_logo'] else [])),cuts=[it['t0'] for it in ITEMS],music=True)
for it in ITEMS:
    if it['k'] in CH: _pl['chips'].append(dict(t0=it['t0']+0.1,t1=it['t0']+min(it['dur'],0.1+CHIP_HOLD),label=it['chip'],px=CHIP_PX,y=BE['chip']['y_top_px'],kind='place'))
for t0s,_rc,dd,_n in STKEV: _pl['chips'].append(dict(t0=t0s,t1=t0s+dd,label='point',px=CHIP_PX,y=BE['chip']['y_top_px'],kind='number' if _n else 'point'))
json.dump(_pl,open(OUT+'.plan.json','w'),ensure_ascii=False,indent=1)   # 매뉴얼 v4 §9-3: 음악 있는 벨기에판 효과음 1번
for tt in POP: inp+=['-i',ASSET+'sfx/pop.wav']; f2.append(f'[{len(inp)//2-1}:a]volume=0.45,adelay={int(tt*1000)}:all=1[s{len(mx)}]'); mx.append(f'[s{len(mx)}]')
for tt in WH: inp+=['-i',ASSET+'sfx/whoosh.wav']; f2.append(f'[{len(inp)//2-1}:a]volume=0.35,adelay={int(tt*1000)}:all=1[s{len(mx)}]'); mx.append(f'[s{len(mx)}]')
if BE['sfx']['end_logo']: inp+=['-i',ASSET+'sfx/ding.wav']; f2.append(f'[{len(inp)//2-1}:a]volume=0.45,adelay={int((TOTAL-ENDD+0.3)*1000)}:all=1[sd]'); mx.append('[sd]') if BE['sfx']['end_logo'] else None
f2.append(''.join(mx)+f'amix=inputs={len(mx)}:normalize=0:duration=first,loudnorm=I={BE['audio']['loudness_lufs']}:TP={BE['audio']['true_peak_db']}:LRA=11,aresample=48000[a]')
subprocess.run(['ffmpeg','-y','-v','error',*inp,'-filter_complex',';'.join(f2),'-map','0:v','-map','[a]','-c:v','copy','-c:a','aac','-b:a','192k','-t',f'{TOTAL:.2f}',OUT],check=True)
os.remove(OUTV); os.remove(sp)
print(OUT,round(TOTAL,2),'items',len(ITEMS))
