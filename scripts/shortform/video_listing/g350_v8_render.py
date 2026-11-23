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
G=os.environ.get('G350_DIR','/tmp/claude-0/-home-claude/9795e62c-2b83-5ed5-9b9a-75716025bfc2/scratchpad/g350/')
ASSET=A
# 2026-11-24 다른 차(CAR): 차 값(제목·컷·칩·큰 숫자·정보 알약)은 입력 파일 samples/<차>_car.json에서 읽는다. CAR이 없으면 G350 그대로(그림 변화 없음)
CAR=json.load(open(os.environ['CAR'],encoding='utf-8')) if os.environ.get('CAR') else None
CARX={c['key']:c for c in CAR['cuts']} if CAR else {}
CAPY=R['caption']['center_y_px']   # 규칙 파일(옛 67% 직접 쓰기 폐지)
WD=json.load(open(G+'words5.json'))[:None if CAR else 120]   # 120번 이후는 받아쓰기가 지어낸 낱말
FIX={'라기':'락이','헛더라도':'헛돌아도','나눠줘서':'나눠 줘서','블루텟':'블루텍','주관':'주간등','밝혀져요.':'밝혀 줘요.','위의':'위','썬루프가':'선루프가','3500kg까지':'3,500kg까지','480L,':'480L,','2250L까지':'2,250L까지','넵이':'내비,','공존은':'공조는','디제이,':'디젤,','.1초입니다.':'.1초입니다.','주관등까지':'주간등까지','팬더':'펜더','썰루프도':'선루프도','집':'짐','고급스럽구요,':'고급스럽고요,','네비,':'내비,','자동의':'자동에','55kgm.':'55kg·m.','보베드림':'보배드림','블루텍!':'블루텍','토큰은':'토크는','55kgm,':'55kg·m,','주관등이':'주간등이','헛도라도':'헛돌아도','3,500km까지':'3,500kg까지','2,250리터까지':'2,250L까지','480리터,':'480L,','견인고리,':'견인고리,','디퍼렌셜락이':'디퍼렌셜 락이'}
if CAR: FIX={}   # 다른 차: 낱말은 대본 글자 그대로(받아쓰기 교정표는 G350 전용)
WS=[]
i=0
while i<len(WD):
    w,s,e=WD[i]
    if i+1<len(WD) and (WD[i+1][0].startswith((',500',',250')) or WD[i+1][0]=='.0' or WD[i+1][0].startswith('.1초') or (w=='제' and WD[i+1][0]=='눈') or (w=='주관' and WD[i+1][0]=='등') or (w=='견인' and WD[i+1][0].startswith('고리'))):
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
C=[(c['key'],c['src'][0],c['src'][1],c['start_word'],c.get('chip'),c.get('chip_word'),None,(0,999) if c.get('arrow') else None,[tuple(b) for b in c.get('bigs',[])]) for c in CAR['cuts']] if CAR else [('c1',108.0,113.0,0,None,None,None,None,[]),
 ('c2',100.4,103.2,idx('제논'),'제논 헤드램프',idx('제논'),('LED 주간등',idx('LED')),(0,999),[]),
 ('c3',104.6,107.0,idx('펜더'),'펜더 깜빡이',idx('펜더'),None,(0,999),[]),
 ('c4',10.4,12.2,idx('휠은'),None,None,None,None,[]),
 ('c5',72.3,75.3,idx('천장'),'전동 선루프',idx('선루프가'),None,None,[]),   # v5: 위=천장 버튼(69.6~71.0) · 아래=선루프 열림, 동시에
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
# 말 자막 덩어리: 차마다 입력 파일에 뜻 단위로 지정(기계적 어절 수 분할 금지 — LESSONS L27)
_CK=json.load(open(os.environ.get('EDIT',os.path.join(os.path.dirname(os.path.abspath(__file__)),'samples','g350_edit.json'))))
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
def draw_sub(c,t):
    for q,ch in enumerate(CH):
        a=WS[ch[0]][1]-0.05; b=(WS[CH[q+1][0]][1]-0.05) if q+1<len(CH) else TOTAL
        if a<=t<b:
            act=max([j for j in ch if WS[j][1]<=t+0.02] or [ch[0]])
            im=subimg(ch,act); x=(W-im.width)//2; y=CAPY-im.height//2; c.alpha_composite(im,(x,y))
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
_T=CAR['title'] if CAR else {'brand':'벤츠','model':'G350 블루텍','sub':'2013년식 · 디젤 · W463'}; TITLE_KEY=C[0][0]
HB=chip(_T['brand'],R['chip']['title_font_px'],title=True); HM=white(_T['model'],104)
_room=W-24-(M-10+HB.getbbox()[2]+6); _hs=104
while HM.getbbox()[2]>_room and _hs>60: _hs-=4; HM=white(_T['model'],_hs)   # 모델명이 화면 안에 들어오게(짧은 제조사도 칠 판은 같은 배율이라 넓음)
HS=white(_T['sub'],58)
place_chip_y_cap=H*0.58
SAFE_X=40   # r03: 칩 칠 좌우 안전영역 40px(edit_gate 규칙). v13은 24px라 칩 3개가 벗어났음
BIG_LOW={'c7'}   # r03: 번호판이 화면 위쪽을 채우는 컷 — 큰 숫자를 자막 자리로 내리고 그동안 말 자막을 숨김(AS24 큰 숫자 규칙)
HIDE_SUB=[False]
BIGS_LOG=[]; BIGS_SEEN=set()
CHIP_DELAY={'c7':0.75}   # r03: 카메라가 번호판에서 견인고리로 내려오는 0.75초 동안 칩을 미룸(번호판 덮지 않음)
def place(Cimg,tx,ty,below):
    bx0,by0,bx1,by1=Cimg.getbbox(); x=int(max(SAFE_X-bx0,min(W-SAFE_X-bx1,tx-(bx0+bx1)/2))); L=ALEN   # v7: 칩 칠이 화면 끝 24px 안까지(부위가 끝에 있어도 화살표가 칩 밑에 오게)
    if below:
        y=ty+TG+L+CG-by0
        if y+by1>place_chip_y_cap: L=max(AMIN,int(L-(y+by1-place_chip_y_cap))); y=ty+TG+L+CG-by0
    if not below:
        y=ty-TG-L-CG-by1
        if y+by0<150: L=max(AMIN,int(L-(150-(y+by0)))); y=ty-TG-L-CG-by1
    return x,int(y),L,below

FL='/home/claude/bobaedream/scripts/shortform/photo_listing/fluent3d/'
def flu(cp,h):
    im=Image.open(FL+cp+'.png').convert('RGBA'); im=im.crop(im.getchannel('A').point(lambda v:255 if v>40 else 0).getbbox())
    return im.resize((round(im.width*h/im.height),h),Image.LANCZOS)
def as24(fn,h,col=(20,20,20)):
    png=subprocess.run(['rsvg-convert','-h',str(h*3),'/home/claude/bobaedream/public/assets/bbm/detail-icons/'+fn],capture_output=True).stdout
    from io import BytesIO
    im=Image.open(BytesIO(png)).convert('RGBA'); a=im.getchannel('A'); im=Image.new('RGBA',im.size,col+(255,)); im.putalpha(a); im=im.crop(a.getbbox())
    return im.resize((round(im.width*h/im.height),h),Image.LANCZOS)
def ipill(icon,s,size=50,left=False):   # 흰 정보 알약 = 칩과 같은 노션 원본 칠(fill_fit, 같은 배율), 아이콘 오른쪽 끝(✓ 목록만 왼쪽)
    return info_pill(s,size,icon,left)
# 휠: 인치 3D + 타이어 규격 3D, 화면 고정 자리(휠 상자 높이 약 800px 기준 0.19배 / 0.12배로 키움 — 사용자: 작으니 교정)
text3d_all=lambda txt,h=180: text3d(txt,h,split=False)
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
_ck=Image.new('RGBA',(80,80)); ImageDraw.Draw(_ck).text((40,40),'✓',font=BK(64),fill=INK,anchor='mm'); _ck=_ck.crop(_ck.getbbox())
_ckc={}
def ckpill(s):
    if s not in _ckc: _ckc[s]=ipill(_ck,s,58,left=True)
    return _ckc[s]   # v5 기법 1: ✓ 목록, 말할 때마다 한 줄씩
DW1=ipill(flu('1f6de',60),'바퀴 하나가 헛돌아도',58); DW2=ipill(flu('2744',56),'진흙길 · 눈길 탈출',58)
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
_cpill={}
def special(key,cv,t,t0):
    for it in CARX.get(key,{}).get('pills',[]):   # 다른 차: 흰 정보 알약(오토스카우트24 아이콘 + 글자), 말하는 낱말에 맞춰 나옴
        if it['text'] not in _cpill: _cpill[it['text']]=ipill(as24(it['icon'],54),it['text'],58)
        im=_cpill[it['text']]; b=im.getbbox(); pop(cv,im,((W-im.width)//2,it['y']-b[1]),t,WS[it['word']][1]-t0-0.06)
    for e in PL.get(key,{}).get('T02',[]):   # T02 ✓ 목록: 칩 바로 아래, 칩 왼쪽 선에 맞춰 쌓음
        cb=gchip(CHIPLAB[key]).getbbox(); x0=M-10+cb[0]; yk=YB+cb[3]+14
        for r in e['rows']:
            im=ckpill(r['item']+SUFFIX.get(e.get('option','diff_lock'),' 잠금')); b=im.getbbox()
            pop(cv,im,(x0-b[0],yk-b[1]),t,r['at']-t0); yk+=b[3]-b[1]+TP['T02']['row_gap_px']
    if key=='dx':
        y=int(H*0.12); pop(cv,DW1,((W-DW1.width)//2,y),t,WS[idx('바퀴')][1]-t0-0.06)
        pop(cv,DW2,((W-DW2.width)//2,y+DW1.height+20),t,WS[idx('진흙길')][1]-t0-0.06)
    if key=='c4':
        y=int(H*0.10); pop(cv,W_IN,((W-W_IN.width)//2,y),t,WS[idx('18인치')][1]-t0-0.22,0.3)
        pop(cv,W_TY,((W-W_TY.width)//2,y+W_IN.height+10),t,WS[idx('18인치')][1]-t0+0.15,0.3)
    if key=='c8':
        y=int(H*0.10); tb=WS[idx('480')][1]-t0-0.22
        pop(cv,T1L,((W-T1L.width)//2,y),t,tb); _i=cnt('480L',180,t,tb+0.05); pop(cv,_i,((W-_i.width)//2,y+T1L.height),t,tb,0.3)
        tb2=WS[idx('2,250')][1]-t0-0.22; y2=y+T1L.height+T1.height+40
        pop(cv,T2L,((W-T2L.width)//2,y2),t,tb2); _i=cnt('2,250L',180,t,tb2+0.05); pop(cv,_i,((W-_i.width)//2,y2+T2L.height),t,tb2,0.3)
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
            b=im.getbbox(); pop(cv,im,((W-im.width)//2,y-b[1]),t,WS[idx(w)][1]-t0-0.06); y+=b[3]-b[1]+12   # v7: 칠 높이 + 12px
SFXT=[]; ICONT=[]; EV=[]; CHIPS_LOG=[]; REMIX=bool(os.environ.get('REMIX'))   # EV = [(시각, 종류)] 효과음 후보
ZONE=_CK.get('zones',{}); _prevzone=None
MET=json.load(open(os.path.join(REPO,'scripts/shortform/photo_listing/option_visual_rules.json')))['layout']['metaphor_sfx']; SX=R['sfx']
HORSE=flu('1f40e',180)
proc=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p',G+('nov8_dummy.mp4' if REMIX else 'nov8.mp4')],stdin=subprocess.PIPE)
last=None; nfr=0
for t0,t1,c in SEG:
    key,s0,s1,fw,clab,cw,sub,av,bigs=c; dur=t1-t0; rate=min(2.0,(s1-s0)/dur)
    if key in('c11','c7'): rate=0.55
    T01=PL.get(key,{}).get('T01',[None])[0]
    if T01 or PL.get(key,{}).get('T02'): av=None   # 2분할·✓ 목록 컷은 칩=위 띠 제목, 화살표 없음
    if T01: rate=min(TP['T01']['max_rate'],rate)
    if key=='mem': rate=min(1.0,rate)   # 컨트롤러가 보이는 동안만 재생, 이후 정지+확대
    fr=frames(s0,s1)
    frA=frames(*T01['action_src']) if T01 else None
    pts=smooth(TR[key]['pts'],k=21) if key in TR and key!='c5' else None   # v7: 0.7초 평활로 칩 흔들림 줄임 · 2분할 컷은 추적 안 씀
    CHIPLAB[key]=clab; Cimg=gchip(clab) if clab else None; Simg=white(sub[0],58) if sub else None
    BIG=[(text3d(b,h=180 if key!='c15' else 210),white(l,58) if l else None,WS[j][1]-t0-0.22) for b,l,j in bigs]; BIGS=[b for b,l,j in bigs]
    _metak=[k for it in MET['items'] for k in it['keywords']]
    for (b,l,j),tb in zip(bigs,[x[2] for x in BIG]):
        if not any(k in WS[j][0] for k in _metak): EV.append((t0+tb-0.02,'big_number'))   # 비유 효과음이 있는 숫자(마력 등)는 그 소리가 대신함
    if key=='c8': EV.extend([(WS[idx('480')][1]-0.24,'big_number'),(WS[idx('2,250')][1]-0.24,'big_number')])
    if clab: EV.append((t0+((WS[cw][1]-t0-0.06) if cw is not None else 0)+CHIP_DELAY.get(key,0)-0.02,'chip'))
    for e in PL.get(key,{}).get('T05',[])+PL.get(key,{}).get('T06',[]): EV.append((e['at'],'emphasis'))
    if ZONE.get(key)!=_prevzone and _prevzone is not None: EV.append((t0-0.08,'part_change'))
    _prevzone=ZONE.get(key,_prevzone)
    tc=((WS[cw][1]-t0-0.06) if cw is not None else 0)+CHIP_DELAY.get(key,0)
    BL0=None
    if pts is not None and Cimg is not None and av is not None:   # v7: 칩 위·아래를 컷 전체 추적으로 한 번만 정함(중간 뒤집힘 금지)
        _b=Cimg.getbbox(); _h=_b[3]-_b[1]; _n=int((min(s1,s0+dur*rate)-s0)*30)+1; _ys=[p[1]*H for p in pts[:_n]]   # 실제로 보이는 구간만
        _fb=max(_ys)+TG+AMIN+CG+_h<=place_chip_y_cap; _fa=min(_ys)-TG-AMIN-CG-_h>=150
        BL0=True if _fb and (_ys[0]<H*0.45 or not _fa) else (False if _fa else _ys[0]<H*0.45)
    # 매뉴얼 v1.7 아이콘 효과음: 시트 열선·통풍·메모리 아이콘이 톡 나올 때 작은 팝
    if key=='c9': ICONT.extend([WS[idx('열선')][1]-0.06, WS[idx('통풍')][1]-0.06])
    if key=='mem': ICONT.append(t0+tc+0.08)
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
        if key==TITLE_KEY:
            cv=Image.alpha_composite(cv,Image.new('RGBA',(W,H),(0,0,0,90)))
            pop(cv,HB,(M-10,YB),t,0.08)
            if not any(c_['kind']=='title' for c_ in CHIPS_LOG) and t>=0.28: _bb=HB.getbbox(); CHIPS_LOG.append({'key':TITLE_KEY,'label':_T['brand'],'kind':'title','t0':round(t0+0.08,3),'t1':round(t1,3),'t_box':round(nfr/FPS,3),'px':R['chip']['title_font_px'],'y':YB,'box':[M-10+_bb[0],YB+_bb[1],M-10+_bb[2],YB+_bb[3]]})
            _hb=HB.getbbox(); pop(cv,HM,(M-10+_hb[2]+6,YB+(_hb[1]+_hb[3]-HM.height)//2),t,0.28); pop(cv,HS,(M-4,YB+_hb[3]+16),t,0.5)   # 칠이 실제로 끝나는 곳 기준(투명 여백 제외)
        if key in('c15',) : cv=Image.alpha_composite(cv,Image.new('RGBA',(W,H),(0,0,0,70)))
        if key=='c8': cv=Image.alpha_composite(cv,Image.new('RGBA',(W,H),(0,0,0,40)))
        if CARX.get(key,{}).get('dim'): cv=Image.alpha_composite(cv,Image.new('RGBA',(W,H),(0,0,0,CARX[key]['dim'])))
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
            if av is None or pts is None:   # 화살표 없는 칩(부위 추적이 없는 컷 포함, v7): 위쪽 띠
                av=None
                cx,cy=M-10,YB   # 포인트 칩은 늘 같은 위쪽 자리(사용자 확정 · 위아래로 움직이지 않음), 큰 숫자가 칩 아래로 비켜남
                L=0
            else: cx,cy,L,bl=place(Cimg,tx,ty,bl)
            if av and av[0]<=st<=av[1] and t>=tc+0.18:
                g=ease((t-tc-0.18)/0.25); Lc=max(20,round(L*(0.55+0.45*g))); bob=round(BOB*abs(math.sin((t-tc-0.43)*5))) if t>tc+0.43 else 0
                A,off=arrimg(L,bl); A=A.resize((A.width,round(A.height*Lc/L))) if Lc!=L else A; offc=round(off*Lc/L)
                if LOGON: _LOG.append(['arr',nfr,key,round(tx),round(ty),bl,L,Lc,bob,cx,cy,Cimg.getbbox()])
                if bl: tail=ty+TG+L; cv.alpha_composite(A,(int(tx-A.width/2),int(tail-Lc-bob-offc)))
                else: tail=ty-TG-L; cv.alpha_composite(A,(int(tx-A.width/2),int(tail+bob-offc)))
            pop(cv,Cimg,(cx,cy),t,tc)
            if t>=tc+0.2 and key not in {c_['key'] for c_ in CHIPS_LOG}:   # 다 나타난 뒤 한 번 기록(검사는 이 순간 상자를 잼)
                _bb=Cimg.getbbox(); CHIPS_LOG.append({'key':key,'label':clab,'kind':'point' if av is None else 'callout','t0':round(t0+tc,3),'t1':round(t1,3),'t_box':round(nfr/FPS,3),'px':R['chip']['font_px'],'y':int(cy),'box':[int(cx+_bb[0]),int(cy+_bb[1]),int(cx+_bb[2]),int(cy+_bb[3])]})
            if Simg is not None:
                ts=WS[sub[1]][1]-t0-0.06; pop(cv,Simg,(cx+Cimg.width//2-Simg.width//2,cy+Cimg.height-4) if bl else (cx+Cimg.width//2-Simg.width//2,cy-Simg.height+6),t,ts)
        for k2,(B3,BL,tb) in enumerate(BIG):
            y3=int(H*0.12) if key!='c15' else int(H*0.24)
            if Cimg is not None and av is None: y3=max(y3,YB+Cimg.getbbox()[3]+20)
            if key in BIG_LOW: y3=CAPY-100; HIDE_SUB[0]=HIDE_SUB[0] or t>=tb
            B3=cnt(BIGS[k2],180 if key!='c15' else 210,t,tb+0.05); pop(cv,B3,((W-B3.width)//2,y3),t,tb,0.3)
            if BL: pop(cv,BL,((W-BL.width)//2,y3+B3.height+6),t,tb+0.12)
            if t>=tb+0.4 and (key,k2) not in BIGS_SEEN:   # r03: 큰 숫자 상자 기록(번호판 검사용)
                BIGS_SEEN.add((key,k2)); _b=B3.getbbox() or (0,0,B3.width,B3.height); _x=(W-B3.width)//2; _y1=y3+_b[3]
                if BL: _lb=BL.getbbox() or (0,0,BL.width,BL.height); _y1=max(_y1,y3+B3.height+6+_lb[3])
                BIGS_LOG.append({'key':key,'label':str(BIGS[k2]),'kind':'big','t_box':round(nfr/FPS,3),'box':[_x+_b[0],y3+_b[1],_x+_b[2],int(_y1)]})
            if PL.get(key,{}).get('T07'): _wf=cnt(BIGS[k2],210,99,0).width; pop(cv,HORSE,(min(W-HORSE.width-24,(W+_wf)//2-HORSE.width+20),y3-HORSE.height-6),t,WS[idx('211')][2]-t0-0.1,0.3)   # v7: 숫자 칠 위 오른쪽, 겹침 없음
        special(key,cv,t,t0)
        if key=='mem' and t>=tc: pop(cv,MEMI,(cx+Cimg.width-10,cy-MEMI.height//2+Cimg.height//2-10),t,tc+0.08)
        draw_sub(cv,nfr/FPS) if not HIDE_SUB[0] else None
        HIDE_SUB[0]=False
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
OUT=G+os.environ.get('G350_OUT','bobae_g350_be_v11.mp4')
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
# 2026-11-23 r02: edit_gate.py post가 읽는 판 코드·렌더러·쓴 기법을 기록(그림은 바꾸지 않음). 기법은 이 코드가 실제로 그린 것만.
_TECH={'bgm','caption_chunks','end_logo','loudness_rule','slow_push','title_brand_chip','big_number_3d','seat_material_3d'}
if CAR: _TECH-={'seat_material_3d'}; _TECH-=set() if BIGS_LOG else {'big_number_3d'}   # 다른 차: 실제로 그린 것만 기록
_TECH|={'point_chip' if c['kind']=='point' else 'callout_chip' for c in CHIPS_LOG if c['kind'] in ('point','callout')}
if any(c['kind']=='callout' for c in CHIPS_LOG): _TECH.add('callout_arrow')
if acc: _TECH.add('sfx_rules')
_TECH|={e['id'] for c in _PLAN['cuts'] for e in c['techniques']}
json.dump({'bigs':BIGS_LOG,'edition':'feature_video','edition_code':'ED-SIMPLE','renderer':'g350_v8_render.py','order':'picked','voice':'voice5.wav',
           'frame':[W,H],'techniques':sorted(_TECH),'music':True,'total':round(TOTAL,3),'cuts':[round(a,3) for a,b,c in SEG[1:]],
           'sfx':[{'t':a[0],'kind':a[1],'sound':a[2]} for a in acc],'chips':CHIPS_LOG,
           'caption':{'center_y_px':CAPY,'font_px':R['caption']['font_px'],'chunks':len(CH)}},open(OUT+'.plan.json','w'),ensure_ascii=False,indent=1)
print(OUT,TOTAL)
