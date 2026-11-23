# be_skeleton_render.py — G350 v13 렌더러(g350_v8_render.py)를 차 입력 파일(car.json)로 일반화한 판. 그리기 코드는 그대로, 차별 값만 입력에서 읽음.
# 사용: BE_DIR=<차 폴더>/ python3 be_skeleton_render.py  (폴더: src.mp4 30fps · words5.json · v5.raw · voice5.wav · tracks.json · plan_auto.json · edit.json · car.json)
import os,sys,json,math,subprocess,re
import numpy as np,cv2
from PIL import Image,ImageDraw,ImageFont,ImageFilter
# v11(2026-11-22): 자막 높이·크기는 be_locked_rules.json caption, 뜻 단위 덩어리는 samples/<차>_chunks.json, 칩 기울기 0·흰 알약도 노션 원본 칠, T08 부위 당기기,
#   효과음 = be_locked_rules.json sfx(NL 빈도 + 나세르 종류) + metaphor_sfx, 음량 = audio, 출고 검사용 .plan.json
# G350 v8 = 기법을 계획기(feature_edit_planner.py)가 정한 대로만 씀(컷 이름·낱말을 코드에 직접 쓰지 않음)
# G350 v6 = v5 + 기법 4개(숫자 카운트업 · 돋보기 원 c10 · 스포트라이트 c2 · 마력 흔들림 c15) + 말 울음
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from g350_v5_lib import *
LOGON=bool(os.environ.get('LOG')); _LOG=[]; _pop=pop
def pop(cv,img,pos,t,t_in,dur=0.2):   # 검수 기록: 다 나타난 글자·그림의 실제 칠 상자
    _pop(cv,img,pos,t,t_in,dur)
    if LOGON and img is not None and t>=t_in+dur:
        b=img.getbbox(); g=globals(); _LOG.append(['pop',g.get('nfr'),g.get('key'),pos[0]+b[0],pos[1]+b[1],pos[0]+b[2],pos[1]+b[3],round(t_in,3)])
LINK=os.environ.get('BE_LINK')   # 시안: 칩과 부위를 노션 손그림 화살표 하나로 잇는다(값 없으면 기존 규칙 그대로)
_DOO=os.path.join(REPO,'public/assets/shortform/brush-fill/as24-theme/doodle')+'/'; _dc={}
def _doodle(name,w,rot):   # 노션 원본을 그대로 그려 알파만 읽고 노랑으로 칠함(크기·회전만)
    if (name,w,rot) not in _dc:
        import io
        a_=Image.open(io.BytesIO(subprocess.run(['rsvg-convert','-w',str(w),_DOO+name],capture_output=True,check=True).stdout)).convert('RGBA').getchannel('A')
        if rot: a_=a_.rotate(rot,expand=True,resample=Image.BICUBIC)
        sh=Image.new('RGBA',a_.size); sh.paste((0,0,0,150),(0,5),a_); im=Image.new('RGBA',a_.size); im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6))); im.paste(tuple(YEL)+(255,),(0,0),a_); _dc[(name,w,rot)]=im
    return _dc[(name,w,rot)]
def _quote(h):
    if ('q',h) not in _dc:
        im=Image.open(_DOO+'quote_open_320_260.png').convert('RGBA'); im=im.resize((int(im.width*h/im.height),h),Image.LANCZOS)
        sh=Image.new('RGBA',(im.width+24,im.height+24)); sh.paste((0,0,0,170),(12,16),im.getchannel('A')); sh=sh.filter(ImageFilter.GaussianBlur(6)); sh.alpha_composite(im,(12,12)); _dc[('q',h)]=sh
    return _dc[('q',h)]
G=os.environ['BE_DIR']; CAR=json.load(open(G+'car.json',encoding='utf-8'))
ASSET=A
CAPY=R['caption']['center_y_px']   # 규칙 파일(옛 67% 직접 쓰기 폐지)
WS=[list(w) for w in json.load(open(G+'words5.json'))]   # 자막 글자 = 대본 글자(받아쓰기는 시각만) → 오타 고침 목록 없음
# 소리 시작 보정(-32dB)
aud=np.fromfile(G+'v5.raw',dtype=np.float32)
def onset(t):
    a=int(max(0,t-0.15)*16000)
    for k in range(a,min(len(aud),a+16000),160):
        seg=aud[k:k+320]
        if len(seg) and 20*math.log10(np.sqrt((seg**2).mean())+1e-9)>-32: return k/16000
    return t
for w in WS: w[1]=round(onset(w[1]),3) if w[1]>0 else 0
VOICE=round(WS[-1][2],2)
if os.environ.get('DUMPWS'): json.dump(WS,open(G+'words_clean.json','w'),ensure_ascii=False); sys.exit(0)   # 계획기(feature_edit_planner) 입력용 정리된 낱말
def ws(key):  # 단어 시작
    for j,(w,s,e) in enumerate(WS):
        if w.replace(' ','').startswith(key): return j
    raise KeyError(key)
idx=lambda key,after=0: next(j for j,(w,s,e) in enumerate(WS) if j>=after and w.replace(' ','').startswith(key))
TR=json.load(open(G+'tracks.json'))
_PLAN=json.load(open(os.environ.get('PLAN',G+'plan_auto.json')))   # v8: 자동 계획
PL={c['key']:{} for c in _PLAN['cuts']}
for c in _PLAN['cuts']:
    for e in c['techniques']: PL[c['key']].setdefault(e['id'],[]).append(e)
COUNT={e['value'] for c in _PLAN['cuts'] for e in c['techniques'] if e['id']=='T04'}
RULESF=json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'feature_edit_rules.json')))
TP={t['id']:t['params'] for t in RULESF['techniques']}
SUFFIX={o['key']:o.get('item_suffix','') for o in RULESF['options']}
# (키, 원본시작, 원본끝, 첫단어, 칩, 칩단어, 보조, 화살표 유효(원본시각 범위), 큰숫자들)
C=[(c['key'],c['src'][0],c['src'][1],c['word'],c.get('chip'),c.get('chip_word'),None,(0,999) if c.get('arrow') else None,[tuple(b) for b in c.get('bigs',[])]) for c in CAR['cuts']]
CUTD={c['key']:c for c in CAR['cuts']}; K1=C[0][0]
ENDT=WS[CAR['end_word']][1]-0.12; TOTAL=VOICE+1.7
starts=[0.0]+[WS[c[3]][1]-0.12 for c in C[1:]]
SEG=[]
for k,c in enumerate(C):
    t0=starts[k]; t1=starts[k+1] if k+1<len(C) else ENDT; SEG.append((t0,t1,c))
# 말 자막 덩어리: 차마다 입력 파일에 뜻 단위로 지정(기계적 어절 수 분할 금지 — LESSONS L27)
_CK=json.load(open(G+'edit.json'))
assert _CK['words']==len(WS), f"덩어리 파일 낱말 수 {_CK['words']} ≠ 받아쓰기 {len(WS)}"
CH=[list(range(a,b+1)) for a,b in _CK['chunks']]
assert [j for c in CH for j in c]==list(range(len(WS))), '덩어리가 낱말을 빠짐없이 차례로 덮지 않음'
BLK=ImageFont.truetype(F+'/Pretendard-Black.otf',R['caption']['font_px']); YC=YEL
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
CAPBOX=[10**9,10**9,0,0]; BIGS_LOG=[]; USED={'title_brand_chip','caption_chunks','slow_push','end_logo','bgm','loudness_rule'}
def draw_sub(c,t):
    for q,ch in enumerate(CH):
        a=WS[ch[0]][1]-0.05; b=(WS[CH[q+1][0]][1]-0.05) if q+1<len(CH) else TOTAL
        if a<=t<b:
            act=max([j for j in ch if WS[j][1]<=t+0.02] or [ch[0]])
            im=subimg(ch,act); x=(W-im.width)//2; y=CAPY-im.height//2; c.alpha_composite(im,(x,y))
            _b2=im.getbbox(); CAPBOX[:]=[min(CAPBOX[0],x+_b2[0]),min(CAPBOX[1],y+_b2[1]),max(CAPBOX[2],x+_b2[2]),max(CAPBOX[3],y+_b2[3])]
            if LOGON: b=im.getbbox(); _LOG.append(['sub',globals().get('nfr'),globals().get('key'),x+b[0],y+b[1],x+b[2],y+b[3],a])
            return
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
_chips={}; CHIPLAB={}
def gchip(s,size=70):
    if (s,size) not in _chips: _chips[(s,size)]=chip(s,size)
    return _chips[(s,size)]
H3={}
# 첫 화면(벨기에식): 노랑 붓띠 제조사 + 같은 줄 흰 큰 모델명 + 아래 한 줄
_T=CAR['title']; HB=chip(_T['brand'],R['chip']['title_font_px'],title=True); HM=white(_T['model'],104)
_room=W-24-(M-10+HB.getbbox()[2]+6); _hs=104
while HM.getbbox()[2]>_room and _hs>60: _hs-=4; HM=white(_T['model'],_hs)   # 모델명이 화면 안에 들어오게(짧은 제조사도 칠 판은 같은 배율이라 넓음)
HS=white(_T['sub'],58)
_ss=58
while HS.getbbox()[2]>W-M-24 and _ss>40: _ss-=4; HS=white(_T['sub'],_ss)
place_chip_y_cap=H*0.58
def place(Cimg,tx,ty,below):
    bx0,by0,bx1,by1=Cimg.getbbox(); x=int(max(24-bx0,min(W-24-bx1,tx-(bx0+bx1)/2))); L=ALEN   # v7: 칩 칠이 화면 끝 24px 안까지(부위가 끝에 있어도 화살표가 칩 밑에 오게)
    if below:
        y=ty+TG+L+CG-by0
        if y+by1>place_chip_y_cap: L=max(AMIN,int(L-(y+by1-place_chip_y_cap))); y=ty+TG+L+CG-by0
    if not below:
        y=ty-TG-L-CG-by1
        if y+by0<150: L=max(AMIN,int(L-(150-(y+by0)))); y=ty-TG-L-CG-by1
    return x,int(y),L,below

FL=os.path.join(REPO,'scripts/shortform/photo_listing/fluent3d/')
def flu(cp,h):
    im=Image.open(FL+cp+'.png').convert('RGBA'); im=im.crop(im.getchannel('A').point(lambda v:255 if v>40 else 0).getbbox())
    return im.resize((round(im.width*h/im.height),h),Image.LANCZOS)
def as24(fn,h,col=(20,20,20)):
    png=subprocess.run(['rsvg-convert','-h',str(h*3),os.path.join(REPO,'public/assets/bbm/detail-icons/')+fn],capture_output=True).stdout
    from io import BytesIO
    im=Image.open(BytesIO(png)).convert('RGBA'); a=im.getchannel('A'); im=Image.new('RGBA',im.size,col+(255,)); im.putalpha(a); im=im.crop(a.getbbox())
    return im.resize((round(im.width*h/im.height),h),Image.LANCZOS)
def ipill(icon,s,size=50,left=False):   # 흰 정보 알약 = 칩과 같은 노션 원본 칠(fill_fit, 같은 배율), 아이콘 오른쪽 끝(✓ 목록만 왼쪽)
    return info_pill(s,size,icon,left)
# 휠: 인치 3D + 타이어 규격 3D, 화면 고정 자리(휠 상자 높이 약 800px 기준 0.19배 / 0.12배로 키움 — 사용자: 작으니 교정)
text3d_all=lambda txt,h=180: text3d(txt,h,split=False)
_ck=Image.new('RGBA',(80,80)); ImageDraw.Draw(_ck).text((40,40),'✓',font=BK(64),fill=INK,anchor='mm'); _ck=_ck.crop(_ck.getbbox())
_ckc={}
def ckpill(s):
    if s not in _ckc: _ckc[s]=ipill(_ck,s,58,left=True)
    return _ckc[s]   # v5 기법 1: ✓ 목록, 말할 때마다 한 줄씩
_cn={}
def cnt(txt,h,t,tb,dur=0.45,split=True):   # v6 기법 4: 숫자 카운트업 — 0에서 실제 값까지 0.45초에 올라감
    m=re.match(r'^([\d,]+)(.*)$',txt); k=max(0.0,min(1.0,(t-tb)/dur)) if txt in COUNT else 1.0   # v8: 계획에 있는 값만 올라감
    if not m or k>=1: s2=txt
    else:
        v=int(m.group(1).replace(',','')); cur=round(v*(1-(1-k)**3)); s2=(f'{cur:,}' if ',' in m.group(1) else str(cur))+m.group(2)
    if (s2,h) not in _cn: _cn[(s2,h)]=text3d(s2,h,split=split)
    return _cn[(s2,h)]
def lens(cv,base,tx,ty,cx,cy,t,t_in,D=320,Z=2.2):   # v6 기법 5: 돋보기 원 — 부위를 2.2배로 크게 원 안에
    if t<t_in: return
    g=ease((t-t_in)/0.25); d=max(20,int(D*(0.6+0.4*g))); r=D/Z/2
    reg=base.crop((int(tx-r),int(ty-r),int(tx+r),int(ty+r))).resize((d,d),Image.LANCZOS)
    mk=Image.new('L',(d,d),0); ImageDraw.Draw(mk).ellipse((0,0,d-1,d-1),fill=255); reg.putalpha(mk)
    dr=ImageDraw.Draw(cv); dr.line((cx,cy,tx,ty),fill=(255,255,255,int(230*g)),width=5)
    sh=Image.new('RGBA',(d+40,d+40)); ImageDraw.Draw(sh).ellipse((20,26,d+20,d+26),fill=(0,0,0,150)); cv.alpha_composite(sh.filter(ImageFilter.GaussianBlur(8)),(int(cx-d/2-20),int(cy-d/2-20)))
    cv.alpha_composite(reg,(int(cx-d/2),int(cy-d/2))); dr.ellipse((cx-d/2,cy-d/2,cx+d/2,cy+d/2),outline=(255,255,255,255),width=7)
_yy,_xx=np.mgrid[0:2*H,0:2*W]; _rr=np.hypot(_xx-W,_yy-H)
SPOT=np.clip((_rr-300)/200,0,1)   # v6 기법 6: 스포트라이트 — 부위 둘레 반지름 300 밝게, 200px에 걸쳐 어두워짐
del _yy,_xx,_rr
def spot(cv,tx,ty,a):
    x0=int(W-tx); y0=int(H-ty); m=(SPOT[y0:y0+H,x0:x0+W]*a).astype('uint8')
    ov=Image.new('RGBA',(W,H),(0,0,0,255)); ov.putalpha(Image.fromarray(m)); return Image.alpha_composite(cv,ov)
def special(key,cv,t,t0):
    for e in PL.get(key,{}).get('T02',[]):   # T02 ✓ 목록: 칩 바로 아래, 칩 왼쪽 선에 맞춰 쌓음
        cb=gchip(CHIPLAB[key]).getbbox(); x0=M-10+cb[0]; yk=YB+cb[3]+14
        for r in e['rows']:
            im=ckpill(r['item']+SUFFIX.get(e.get('option','diff_lock'),' 잠금')); b=im.getbbox()
            pop(cv,im,(x0-b[0],yk-b[1]),t,r['at']-t0); yk+=b[3]-b[1]+TP['T02']['row_gap_px']
    cd=CUTD[key]
    if cd.get('mat'):
        USED.add('seat_material_3d')   # 시트 재질 3D 글자(option_visual_rules: 시트 묶음)
        im=_mat(cd['mat'][0]); pop(cv,im,((W-im.width)//2,int(H*0.50)-im.height-30),t,WS[cd['mat'][1]][1]-t0-0.06,0.3)
    y=int(H*0.12)
    for txt,j in cd.get('pills',[]):
        im=white(txt,58); pop(cv,im,((W-im.width)//2,y),t,WS[j][1]-t0-0.06); y+=im.height+16
_mc={}
def _mat(s):
    if s not in _mc: _mc[s]=text3d(s,h=120)
    return _mc[s]
SFXT=[]; ICONT=[]; EV=[]; CHIPS_LOG=[]; REMIX=bool(os.environ.get('REMIX'))   # EV = [(시각, 종류)] 효과음 후보
ZONE=_CK.get('zones',{}); _prevzone=None
MET=json.load(open(os.path.join(REPO,'scripts/shortform/photo_listing/option_visual_rules.json')))['layout']['metaphor_sfx']; SX=R['sfx']
proc=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p',G+('nov8_dummy.mp4' if REMIX else 'nov8.mp4')],stdin=subprocess.PIPE)
last=None; nfr=0
for t0,t1,c in SEG:
    key,s0,s1,fw,clab,cw,sub,av,bigs=c; dur=t1-t0; rate=min(2.0,(s1-s0)/dur)
    rate=max(0.5,rate)
    T01=PL.get(key,{}).get('T01',[None])[0]
    if T01 or PL.get(key,{}).get('T02'): av=None   # 2분할·✓ 목록 컷은 칩=위 띠 제목, 화살표 없음
    if T01: rate=min(TP['T01']['max_rate'],rate)
    fr=frames(s0,s1)
    frA=frames(*T01['action_src']) if T01 else None
    pts=smooth(TR[key]['pts'],k=21) if key in TR else None   # v7: 0.7초 평활로 칩 흔들림 줄임 · 2분할 컷은 추적 안 씀
    CHIPLAB[key]=clab; Cimg=gchip(clab) if clab else None; Simg=white(sub[0],58) if sub else None
    BIG=[(text3d(b,h=180),white(l,58) if l else None,WS[j][1]-t0-0.22) for b,l,j in bigs]; BIGS=[b for b,l,j in bigs]
    _metak=[k for it in MET['items'] for k in it['keywords']]
    for (b,l,j),tb in zip(bigs,[x[2] for x in BIG]):
        if not any(k in WS[j][0] for k in _metak): EV.append((t0+tb-0.02,'big_number'))   # 비유 효과음이 있는 숫자(마력 등)는 그 소리가 대신함
    if clab: EV.append((t0+((WS[cw][1]-t0-0.06) if cw is not None else 0)-0.02,'chip'))
    for e in PL.get(key,{}).get('T05',[])+PL.get(key,{}).get('T06',[]): EV.append((e['at'],'emphasis'))
    if ZONE.get(key)!=_prevzone and _prevzone is not None: EV.append((t0-0.08,'part_change'))
    _prevzone=ZONE.get(key,_prevzone)
    tc=(WS[cw][1]-t0-0.06) if cw is not None else 0
    BL0=None
    if pts is not None and Cimg is not None and av is not None:   # v7: 칩 위·아래를 컷 전체 추적으로 한 번만 정함(중간 뒤집힘 금지)
        _b=Cimg.getbbox(); _h=_b[3]-_b[1]; _n=int((min(s1,s0+dur*rate)-s0)*30)+1; _ys=[p[1]*H for p in pts[:_n]]   # 실제로 보이는 구간만
        _fb=max(_ys)+TG+AMIN+CG+_h<=place_chip_y_cap; _fa=min(_ys)-TG-AMIN-CG-_h>=150
        BL0=True if _fb and (_ys[0]<H*0.45 or not _fa) else (False if _fa else _ys[0]<H*0.45)
    # 매뉴얼 v1.7 아이콘 효과음: 시트 열선·통풍·메모리 아이콘이 톡 나올 때 작은 팝
    if REMIX: nfr=round(t1*FPS); continue
    while nfr<round(t1*FPS):
        t=nfr/FPS-t0; st=min(s1,s0+t*rate); fi=min(len(fr)-1,int(round((st-s0)*30)))
        z=1.0+0.045*ease(t/dur)
        for e in PL.get(key,{}).get('T03',[]):   # T03 점프컷: 제원 낱말마다 확대 단계가 툭 바뀜
            z=1.0
            for st_ in e['steps']:
                tj=st_['at']-t0
                if t>=tj: z+=TP['T03']['zoom_step']*min(1.0,(t-tj)/TP['T03']['ramp_s'])
        dx=dy=0
        for e in PL.get(key,{}).get('T07',[]):   # T07 마력 흔들림
            q=TP['T07']; u=t-(e['at']-t0)
            if 0<=u<q['dur_s']: z=max(z,q['min_zoom']); a=q['amp_px']*(1-u/q['dur_s']); dx=a*math.sin(u*90); dy=a*math.cos(u*70)
        ccx,ccy=W/2,H/2
        for e in PL.get(key,{}).get('T08',[]):   # T08 부위 당기기: 말하는 순간 그 부위 쪽으로 다가감(추적 점 기준)
            q=TP['T08']; u=t-(e['at']-t0)
            if u>=0 and pts is not None:
                g=ease(min(1.0,u/q['arrive_s'])); z=max(z,1+(q['zoom_to']-1)*g+q['hold_drift']*max(0.0,u-q['arrive_s'])/max(0.1,dur))
                pj=min(len(pts)-1,int(round((st-s0)*30))); ccx=W/2+(pts[pj][0]*W-W/2)*q['center_bias']*g; ccy=H/2+(pts[pj][1]*H-H/2)*q['center_bias']*g
        im=Image.fromarray(fr[fi]); cw_=W/z; ch_=H/z
        ccx=min(W-cw_/2,max(cw_/2,ccx+dx)); ccy=min(H-ch_/2,max(ch_/2,ccy+dy))
        cv=im.resize((W,H),box=(ccx-cw_/2,ccy-ch_/2,ccx+cw_/2,ccy+ch_/2)).convert('RGBA')
        if T01:    # T01 위아래 2분할
            ra=min(1.0,(T01['action_src'][1]-T01['action_src'][0])/dur); fa=min(len(frA)-1,int(round(t*ra*30)))
            top=Image.fromarray(frA[fa]).crop((0,int(H*0.45)-480,W,int(H*0.45)+480))
            bot=Image.fromarray(fr[fi]).crop((0,int(H*0.36)-480,W,int(H*0.36)+480))
            cv=Image.new('RGBA',(W,H)); cv.paste(top,(0,0)); cv.paste(bot,(0,H//2))
            ImageDraw.Draw(cv).rectangle((0,H//2-4,W,H//2+3),fill=(255,255,255,255))
        tomap=lambda fx,fy,_x=ccx,_y=ccy,_z=z:((fx*W-_x)*_z+W/2,(fy*H-_y)*_z+H/2)
        if key==K1:
            cv=Image.alpha_composite(cv,Image.new('RGBA',(W,H),(0,0,0,90)))
            pop(cv,HB,(M-10,YB),t,0.08)
            if not any(c_['kind']=='title' for c_ in CHIPS_LOG) and t>=0.28: _bb=HB.getbbox(); CHIPS_LOG.append({'key':K1,'label':_T['brand'],'kind':'title','t0':round(t0+0.08,3),'t1':round(t1,3),'t_box':round(nfr/FPS,3),'px':R['chip']['title_font_px'],'y':YB,'box':[M-10+_bb[0],YB+_bb[1],M-10+_bb[2],YB+_bb[3]]})
            _hb=HB.getbbox(); pop(cv,HM,(M-10+_hb[2]+6,YB+(_hb[1]+_hb[3]-HM.height)//2),t,0.28); pop(cv,HS,(M-4,YB+_hb[3]+16),t,0.5)   # 칠이 실제로 끝나는 곳 기준(투명 여백 제외)
        if CUTD[key].get('dim'): cv=Image.alpha_composite(cv,Image.new('RGBA',(W,H),(0,0,0,CUTD[key]['dim'])))
        if Cimg is not None:
            if pts is not None:
                pi=min(len(pts)-1,int(round((st-s0)*30))); tx,ty=tomap(*pts[pi])
            else: tx,ty=W/2,H*0.62
            for e in PL.get(key,{}).get('T05',[]):   # T05 스포트라이트(다음 부위 낱말에서 다시 밝게)
                q=TP['T05']; a0=e['at']-t0; fo=(e['fade_out_at']-t0) if e.get('fade_out_at') else 1e9
                if t>=a0: cv=spot(cv,tx,ty,q['alpha']*ease((t-a0)/q['fade_in_s'])*(1-ease((t-fo)/q['fade_in_s'])))
            for e in PL.get(key,{}).get('T06',[]):   # T06 돋보기 원
                q=TP['T06']; lens(cv,cv.copy(),tx,ty,q['pos'][0],q['pos'][1],t,e['at']-t0,q['diameter_px'],q['zoom'])
            if BL0 is None: BL0=ty<H*0.45   # 칩 위·아래는 컷 안에서 고정(뒤집힘 방지)
            bl=BL0
            if LINK and pts is not None:
                cx,cy,L=M-10,YB,0; _b=Cimg.getbbox(); _ax=min(max(tx,cx+_b[0]+90),cx+_b[2]-90); _ay=cy+_b[3]-34; _d=math.hypot(tx-_ax,ty-_ay)
                if _d>260 and t>=tc+0.12:
                    _g=0.4+0.6*ease((t-tc-0.12)/0.22); _bob=6*math.sin(t*6); _ex,_ey=tx-(tx-_ax)/_d*100,ty-(ty-_ay)/_d*100+_bob
                    _w=max(60,int(min(400,math.hypot(_ex-_ax,_ey-_ay))*_g/6)*6); _an=math.atan2(_ey-_ay,_ex-_ax); _A=_doodle('hand_arrow_469_264.svg',_w,-round(math.degrees(_an)))
                    cv.alpha_composite(_A,(int(_ax+math.cos(_an)*_w/2-_A.width/2),int(_ay+math.sin(_an)*_w/2-_A.height/2)))
            elif av is None or pts is None:   # 화살표 없는 칩(부위 추적이 없는 컷 포함, v7): 위쪽 띠
                av=None
                cx,cy=M-10,YB   # 포인트 칩은 늘 같은 위쪽 자리(사용자 확정 · 위아래로 움직이지 않음), 큰 숫자가 칩 아래로 비켜남
                L=0
            else: cx,cy,L,bl=place(Cimg,tx,ty,bl)
            if av and not (LINK and pts is not None) and av[0]<=st<=av[1] and t>=tc+0.18:
                g=ease((t-tc-0.18)/0.25); Lc=max(20,round(L*(0.55+0.45*g))); bob=round(BOB*abs(math.sin((t-tc-0.43)*5))) if t>tc+0.43 else 0
                A,off=arrimg(L,bl); A=A.resize((A.width,round(A.height*Lc/L))) if Lc!=L else A; offc=round(off*Lc/L)
                if LOGON: _LOG.append(['arr',nfr,key,round(tx),round(ty),bl,L,Lc,bob,cx,cy,Cimg.getbbox()])
                if bl: tail=ty+TG+L; cv.alpha_composite(A,(int(tx-A.width/2),int(tail-Lc-bob-offc)))
                else: tail=ty-TG-L; cv.alpha_composite(A,(int(tx-A.width/2),int(tail+bob-offc)))
            pop(cv,Cimg,(cx,cy),t,tc)
            if LINK and t>=tc+0.12: _q=_quote(92); _b=Cimg.getbbox(); pop(cv,_q,(cx+_b[0]-34,cy+_b[1]-62),t,tc+0.12)   # 칩 = 방금 말한 낱말
            if t>=tc+0.2 and key not in {c_['key'] for c_ in CHIPS_LOG}:   # 다 나타난 뒤 한 번 기록(검사는 이 순간 상자를 잼)
                _bb=Cimg.getbbox(); CHIPS_LOG.append({'key':key,'label':clab,'kind':'point' if av is None else 'callout','t0':round(t0+tc,3),'t1':round(t1,3),'t_box':round(nfr/FPS,3),'px':R['chip']['font_px'],'y':int(cy),'box':[int(cx+_bb[0]),int(cy+_bb[1]),int(cx+_bb[2]),int(cy+_bb[3])]})
            if Simg is not None:
                ts=WS[sub[1]][1]-t0-0.06; pop(cv,Simg,(cx+Cimg.width//2-Simg.width//2,cy+Cimg.height-4) if bl else (cx+Cimg.width//2-Simg.width//2,cy-Simg.height+6),t,ts)
        for k2,(B3,BL,tb) in enumerate(BIG):
            y3=int(H*0.12)
            if Cimg is not None and (av is None or LINK): y3=max(y3,YB+Cimg.getbbox()[3]+20)
            if t>=tb and not any(x['key']==key and x['text']==BIGS[k2] for x in BIGS_LOG): BIGS_LOG.append({'key':key,'text':BIGS[k2],'label':bigs[k2][1] or '','t':round(nfr/FPS,3),'src_t':round(st,3),'src_end':round(s1,3)}); USED.add('big_number_3d')
            B3=cnt(BIGS[k2],180,t,tb+0.05); pop(cv,B3,((W-B3.width)//2,y3),t,tb,0.3)
            if BL: pop(cv,BL,((W-BL.width)//2,y3+B3.height+6),t,tb+0.12)
        special(key,cv,t,t0)
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
if LOGON: json.dump(_LOG,open(G+'log8.json','w'),default=lambda o: o.item() if hasattr(o,'item') else list(o))
OUT=G+os.environ.get('BE_OUT','out.mp4')
# ── 효과음: be_locked_rules.json sfx(NL 빈도 + 나세르 종류) + option_visual_rules.json metaphor_sfx ──
EV.append((0.08-0.02,'title')) if SX.get('title_ding') else None
for ti in ICONT: EV.append((ti,'icon'))
_met=[]   # 비유 효과음: 낱말 안에서 키워드가 나오는 순간, 목록 순서 = 우선순위, 영상당 max_per_video
for it in MET['items']:
    if len(_met)>=MET['max_per_video']: break
    for j,(w,s_,e_) in enumerate(WS):
        k=next((k for k in it['keywords'] if k in w),None)
        if k and os.path.exists(ASSET+'sfx/'+it['name']+'.wav'):
            tm=s_+(e_-s_)*w.index(k)/max(1,len(w))-it['lead_s']
            if all(abs(tm-x[0])>=MET['min_gap_s'] for x in _met): _met.append((tm,it['name'],it['vol']))
            break
def _ratio(evs,r):   # 비율 r만큼 고르게(앞에서부터 누적 비율이 정수를 넘을 때 하나씩)
    return [e for n,e in enumerate(evs) if int((n+1)*r+1e-9)>int(n*r+1e-9)]
cand=[(t,k) for t,k in EV if k not in ('chip','big_number')]+_ratio(sorted(x for x in EV if x[1]=='chip'),SX['chip_ratio'])+_ratio(sorted(x for x in EV if x[1]=='big_number'),SX['big_number_ratio'])
pc=sorted(x for x in cand if x[1]=='part_change')[:SX['part_change_max']]; cand=[x for x in cand if x[1]!='part_change']+pc
PRI={k:n for n,k in enumerate(SX['priority'])}; SND={k:SX['kinds'][k] for k in SX['kinds'] if k!='metaphor'}
allc=[(t,'metaphor',nm,v) for t,nm,v in _met]+[(t,k,SND[k],SX['volume'][SND[k]]) for t,k in cand]
cap_n=int(SX['max_per_30s']*TOTAL/30); acc=[]
for t,k,nm,v in sorted(allc,key=lambda x:(PRI[x[1]],x[0])):
    if t<0 or t>ENDT-0.2: continue   # 끝 로고 구간에는 넣지 않음
    if any(abs(t-a[0])<SX['min_gap_s'] for a in acc): continue
    if any(a[2]==nm and abs(t-a[0])<SX['same_sound_min_gap_s'] for a in acc): continue
    if len(acc)>=cap_n: break
    acc.append((round(t,3),k,nm,v))
acc.sort()
print('효과음',[(a[0],a[2]) for a in acc])
inp=['-i',G+'nov8.mp4','-i',G+'voice5.wav','-i',ASSET+'bgm/bobae_showroom_v1.mp3']
fl=['[1:a]highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=8:release=120[v]',f'[2:a]atrim=0:{TOTAL},volume=0.16,afade=t=out:st={TOTAL-1.5}:d=1.5[b]']; mx=['[v]','[b]']
for j,(tc,k,nm,v) in enumerate(acc):
    inp+=['-i',ASSET+'sfx/'+nm+'.wav']; fl.append(f'[{len(inp)//2-1}:a]volume={v},adelay={int(tc*1000)}:all=1[s{j}]'); mx.append(f'[s{j}]')
A_=R['audio']; LN=f"loudnorm=I={A_['loudness_lufs']}:TP={A_['true_peak_db']}:LRA=11"
# 음량 2단계: 1차로 재고 2차에 그 값으로 고르게(linear) 맞춤 — 1단계만 쓰면 목표에서 1dB 넘게 빗나감
_m=subprocess.run(['ffmpeg','-hide_banner',*inp,'-filter_complex',';'.join(fl+[''.join(mx)+f'amix=inputs={len(mx)}:normalize=0:duration=longest,{LN}:print_format=json[a]']),'-map','[a]','-t',str(TOTAL),'-f','null','-'],capture_output=True,text=True).stderr
_j=json.loads(_m[_m.rindex('{'):_m.rindex('}')+1])
LN2=LN+f":measured_I={_j['input_i']}:measured_TP={_j['input_tp']}:measured_LRA={_j['input_lra']}:measured_thresh={_j['input_thresh']}:offset={_j['target_offset']}:linear=true"
fl.append(''.join(mx)+f"amix=inputs={len(mx)}:normalize=0:duration=longest,{LN2},aresample=48000[a]")
subprocess.run(['ffmpeg','-y','-loglevel','error',*inp,'-filter_complex',';'.join(fl),'-map','0:v','-map','[a]','-c:v','copy','-c:a','aac','-b:a','192k','-t',str(TOTAL),OUT],check=True)
# 출고 검사용 계획(check_be.py 영상 검사가 읽음)
for _c in CHIPS_LOG:
    if _c['kind']=='point': USED.add('point_chip')
    if _c['kind']=='callout': USED.update({'callout_chip','callout_arrow'})
if acc: USED.add('sfx_rules')
USED.update(e['id'] for c in _PLAN['cuts'] for e in c['techniques'] if e['id'] in ('T03','T04','T05','T06','T08'))
json.dump({'edition':'feature_video','edition_code':'ED-FEATURE','renderer':'be_skeleton_render.py','renderer_version':'1.0','order':'edit','techniques':sorted(USED),'bigs':BIGS_LOG,'src':'src.mp4','voice':'voice5.wav','frame':[W,H],'music':True,'total':round(TOTAL,3),'cuts':[round(a,3) for a,b,c in SEG[1:]],
           'sfx':[{'t':a[0],'kind':a[1],'sound':a[2]} for a in acc],'chips':CHIPS_LOG,
           'caption':{'center_y_px':CAPY,'font_px':R['caption']['font_px'],'chunks':len(CH),'box':CAPBOX if CAPBOX[2] else None}},open(OUT+'.plan.json','w'),ensure_ascii=False,indent=1)
print(OUT,TOTAL)
