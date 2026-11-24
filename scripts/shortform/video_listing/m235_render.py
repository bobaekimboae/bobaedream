import os,sys,json,math,subprocess,re
import numpy as np,cv2
from PIL import Image,ImageDraw,ImageFont,ImageFilter
# v11(2026-11-22): 자막 높이·크기는 be_locked_rules.json caption, 뜻 단위 덩어리는 samples/<차>_chunks.json, 칩 기울기 0·흰 알약도 노션 원본 칠, T08 부위 당기기,
#   효과음 = be_locked_rules.json sfx(NL 빈도 + 나세르 종류) + metaphor_sfx, 음량 = audio, 출고 검사용 .plan.json
# BMW M235i 그란쿠페 r01(2026-11-24, 문제현 딜러 · 서울오토갤러리) = roma_render.py(= g350_v8 복사본) 복사, 컷 목록·제목·끝 로고만 바꿈
# 원본은 make_job+place_voice로 이미 목소리 시각에 맞춰 줄인 영상(src.mp4) → 컷 원본 구간 = 목소리 시간축 그대로(속도 1배)
# G350 v8 = 기법을 계획기(feature_edit_planner.py)가 정한 대로만 씀(컷 이름·낱말을 코드에 직접 쓰지 않음)
# G350 v6 = v5 + 기법 4개(숫자 카운트업 · 돋보기 원 c10 · 스포트라이트 c2 · 마력 흔들림 c15) + 말 울음
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from g350_v5_lib import *
LOGON=bool(os.environ.get('LOG')); _LOG=[]; _pop=pop
def pop(cv,img,pos,t,t_in,dur=0.2):   # 검수 기록: 다 나타난 글자·그림의 실제 칠 상자
    _pop(cv,img,pos,t,t_in,dur)
    if LOGON and img is not None and t>=t_in+dur:
        b=img.getbbox(); g=globals(); _LOG.append(['pop',g.get('nfr'),g.get('key'),pos[0]+b[0],pos[1]+b[1],pos[0]+b[2],pos[1]+b[3],round(t_in,3)])
G=os.environ.get('M235_DIR','/dev/shm/m235/job/')
ASSET=A
CAPY=R['caption']['center_y_px']   # 규칙 파일(옛 67% 직접 쓰기 폐지)
WS=json.load(open(os.environ.get('ROMA_WORDS',G+'words_clean.json')))   # 로마: 받아쓰기 시각 + 대본 글자로 정리한 낱말(병합·오인식 교정 끝난 것)
VOICE=round(WS[-1][2],2)
VOICEF=os.environ.get('ROMA_VOICE',G+'voice.wav')
def ws(key):  # 단어 시작
    for j,(w,s,e) in enumerate(WS):
        if w.replace(' ','').startswith(key): return j
    raise KeyError(key)
idx=lambda key,after=0: next(j for j,(w,s,e) in enumerate(WS) if j>=after and w.replace(' ','').startswith(key))
TR=json.load(open(G+'tracks.json')) if os.path.exists(G+'tracks.json') else {}
TRK0=set(TR)
_PLAN=json.load(open(os.environ.get('PLAN',G+'plan_auto.json')))   # v8: 자동 계획
PL={c['key']:{} for c in _PLAN['cuts']}
_EXTRA=os.environ.get('PLAN_EXTRA')   # r08: 자동 계획에 기법을 더함(낱말 번호 → 받아쓰기 시각)
if _EXTRA:
    _TPX={t['id']:t['params'] for t in json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'feature_edit_rules.json')))['techniques']}
    _cs={c['key']:c for c in _PLAN['cuts']}
    for x in json.load(open(_EXTRA))['add']:
        c=_cs[x['key']]; e={'id':x['id'],'extra':True}
        if x['id']=='T05': e['at']=c['t0']+0.06-_TPX['T05']['start_before_chip_s']+0.1; e['fade_out_at']=WS[x['fade_out_word']][1]-0.1
        if x['id']=='T03': e['steps']=[{'word':j,'at':WS[j][1]-_TPX['T03']['before_word_s']} for j in x['step_words']]
        if x['id']=='T08': e['word']=x['word']; e['at']=WS[x['word']][1]-_TPX['T08']['lead_s']
        if x['id']=='T02': e['option']=x['option']; e['rows']=[{'item':it,'word':j,'at':WS[j][1]-_TPX['T02']['appear_before_word_s']} for it,j in x['rows']]   # r12: 같은 그룹 제원을 이어 말하면 ✓ 목록
        c['techniques'].append(e)
for c in _PLAN['cuts']:
    for e in c['techniques']: PL[c['key']].setdefault(e['id'],[]).append(e)
COUNT={e['value'] for c in _PLAN['cuts'] for e in c['techniques'] if e['id']=='T04'}
RULESF=json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'feature_edit_rules.json')))
TP={t['id']:t['params'] for t in RULESF['techniques']}
SUFFIX={o['key']:o.get('item_suffix','') for o in RULESF['options']}
# (키, 원본시작, 원본끝, 첫단어, 칩, 칩단어, 보조, 화살표 유효(원본시각 범위), 큰숫자들)
# r05(2026-11-23 「대사 다시 쓰고」): 낱말 번호를 코드에 직접 쓰지 않고 낱말 글자로 찾는다(대사·목소리가 바뀌어도 그대로 동작)
_i=idx
_cut=lambda k:(_i(k),)
# (키, 원본시작, 원본끝, 첫단어, 칩, 칩단어, 보조, 화살표 유효(원본시각), 큰숫자) — 원본 시간축 = 목소리 시간축
_CT=[('c1',None,None,None,[]),('c2','앞에는','LED 헤드램프','LED',[]),('c3','휠','블루 캘리퍼','블루',[]),('c4','뒤에는','듀얼 머플러','듀얼',[]),
 ('c5','4륜구동','4륜구동 xDrive','4륜구동',[]),('c6','문을','M 퍼포먼스 로고','퍼포먼스',[]),('c7','도어','도어 스텝','도어',[]),('c8','실내는','레드 가죽 시트','레드',[]),
 ('c9','도어엔','앰비언트 라이트','앰비언트',[]),('c10','뒷좌석까지','레드 가죽 뒷좌석','뒷좌석까지',[]),('c11','핸들엔','크루즈 컨트롤','크루즈',[]),
 ('c12','주행거리는',None,None,[('16,665km','주행거리','16,665km')]),('c13','헤드업','헤드업 디스플레이','헤드업',[]),('c14','후방','후방 카메라','후방',[]),
 ('c15','주행','주행 모드','주행',[]),('c16','보닛','M 퍼포먼스 엔진','퍼포먼스',[]),('c17','보배드림',None,None,[])]
_fw=[0]
for x in _CT[1:]: _fw.append(_i(x[1],_fw[-1]))   # 앞 컷 뒤에서 찾음(「주행」이 「주행거리는」에 걸리지 않게)
_st=[0.0]+[WS[j][1]-0.12 for j in _fw[1:]]
C=[]
for k,(key,w0,lab,cw,bg) in enumerate(_CT):
    s0=_st[k]; s1=_st[k+1] if k+1<len(_CT) else VOICE+1.7
    cwi=_i(cw,_fw[k]) if cw else None
    C.append((key,s0,s1,_fw[k],lab,cwi,None,(s0,s1) if key in TRK0 and key not in NOTRACK else None,[(b,l,_i(j,_fw[k])) for b,l,j in bg]))
ENDT=WS[_i('자세한')][1]-0.12; TOTAL=VOICE+1.7
starts=[0.0]+[WS[c[3]][1]-0.12 for c in C[1:]]
SEG=[]
for k,c in enumerate(C):
    t0=starts[k]; t1=starts[k+1] if k+1<len(C) else ENDT; SEG.append((t0,t1,c))
# 말 자막 덩어리: 차마다 입력 파일에 뜻 단위로 지정(기계적 어절 수 분할 금지 — LESSONS L27)
_CK=json.load(open(os.environ.get('EDIT',os.path.join(os.path.dirname(os.path.abspath(__file__)),'samples','m235_edit.json'))))
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
HB=chip('BMW',R['chip']['title_font_px'],title=True); HM=white('M235i 그란쿠페',104)
_room=W-24-(M-10+HB.getbbox()[2]+6); _hs=104
while HM.getbbox()[2]>_room and _hs>60: _hs-=4; HM=white('M235i 그란쿠페',_hs)   # 모델명이 화면 안에 들어오게(짧은 제조사도 칠 판은 같은 배율이라 넓음)
HS=white('2021년식 · 가솔린 · F44',58)
place_chip_y_cap=H*0.58
SAFE_X=40   # r03: 칩 칠 좌우 안전영역 40px(edit_gate 규칙). v13은 24px라 칩 3개가 벗어났음
BIG_LOW=set()   # r03: 번호판이 화면 위쪽을 채우는 컷 — 큰 숫자를 자막 자리로 내리고 그동안 말 자막을 숨김(AS24 큰 숫자 규칙)
HIDE_SUB=[False]
BIGS_LOG=[]; BIGS_SEEN=set(); LABELS_LOG={}
def label_log(lab,kind,anchor,pt,pos,img,t,tin,reason=None):   # r15: 부위에 붙는 글자(숫자·재질·색)의 기준 부위 점과 화면 상자 — check_be §11 검사가 읽음
    if t<tin+0.3 or lab in LABELS_LOG: return   # 다 나타난 뒤 한 번 기록
    b=img.getbbox(); LABELS_LOG[lab]={'label':lab,'kind':kind,'anchor':anchor,'pt':[int(pt[0]),int(pt[1])] if pt else None,
        'box':[int(pos[0]+b[0]),int(pos[1]+b[1]),int(pos[0]+b[2]),int(pos[1]+b[3])],'t_box':round(CUR.get('T',0),3),**({'no_anchor_reason':reason} if reason and not pt else {})}
CHIP_DELAY={}
NOTRACK={k:'fills_frame' for k in ('c5','c10','c14','c15','c16')}; NOTRACK.update({'c11':'not_found','c13':'not_found','c7':'fills_frame'})   # OWLv2가 핸들 버튼 대신 계기판, HUD 대신 빈 유리를 잡음 → 틀린 화살표 대신 위쪽 칩
cxc=lambda img:int(W/2-(img.getbbox()[0]+img.getbbox()[2])/2)   # 칠 기준 가로 가운데   # r03: 카메라가 번호판에서 견인고리로 내려오는 0.75초 동안 칩을 미룸(번호판 덮지 않음)
def place(Cimg,tx,ty,below):
    bx0,by0,bx1,by1=Cimg.getbbox(); x=int(max(SAFE_X-bx0,min(W-SAFE_X-bx1,tx-(bx0+bx1)/2))); L=ALEN   # v7: 칩 칠이 화면 끝 24px 안까지(부위가 끝에 있어도 화살표가 칩 밑에 오게)
    if below:
        y=ty+TG+L+CG-by0
        if y+by1>place_chip_y_cap: L=max(AMIN,int(L-(y+by1-place_chip_y_cap))); y=ty+TG+L+CG-by0
    if not below:
        y=ty-TG-L-CG-by1
        if y+by0<150: L=max(AMIN,int(L-(150-(y+by0)))); y=ty-TG-L-CG-by1
        _cap=CAPY-62-by1   # r01: 부위가 낮으면(머플러) 칩이 말 자막 띠(자막 중심-60)로 내려오지 않게 칩을 올리고 화살표를 늘림
        if y>_cap: y=_cap; L=int(ty-TG-CG-by1-y)
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
W_IN=text3d('20인치',h=170); W_IN_ST={}; _WIN_ONCE=os.environ.get('WIN_ONCE','1')!='0'; W_TY=text3d_all('앞 245 · 뒤 285',h=110)
T1=text3d('255L',h=180); T1L=ipill(as24('trunk-as24.svg',50),'지붕 닫았을 때',58)
S_MAT=gchip('베이지 가죽',R['chip']['font_px']) if os.environ.get('SEAT_3D')!='1' else text3d('베이지 가죽',h=130);   # r19 「시트 쪽에 붓칠 씌워야」: 재질도 노랑 붓칠 칩(노션 원본 칠), SEAT_3D=1이면 이전 3D 글자
S_SUB=white('레드 카펫',58)
EP=[ipill(as24('engine.svg',54),'최대토크 77.5kg·m',58),ipill(as24('gearbox.svg',54),'8단 듀얼클러치',58),ipill(flu('23f1',60),'제로백 3.4초',58)]
# r13 「노션 붓칠 원본 쓰고 예쁘게」: ✓ 글자 대신 노션 「스카우트24 테마별」 노랑 체크 원(checkmark_in_yellow_circle) 원본 그대로, 크기만 rsvg 배율
_CKSVG=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','public','assets','shortform','brush-fill','as24-theme-v2','check_circle_yellow.svg')
# r19 「체크마크 원보다 그냥 체크마크, 손글씨 원본 쓰자」: 노션 「스카우트24 테마별」 손그림 체크(Hand-drawn Checkmark)_민트_51x41 원본 PNG, 모양 그대로 색만 노랑 + 화살표와 같은 진한 테두리. CHECK_STYLE=circle이면 이전 노랑 체크 원
_HCK=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','public','assets','shortform','brush-fill','as24-theme-v2','hand_drawn_checkmark_51_41.png')
if os.path.exists(_HCK) and os.environ.get('CHECK_STYLE','hand')=='hand' and os.environ.get('CHECK_GLYPH')!='1':
    _h=Image.open(_HCK).convert('RGBA'); _hs=46/_h.height; _h=_h.resize((round(_h.width*_hs),46),Image.LANCZOS)
    _ha=_h.getchannel('A'); _ly=Image.new('RGBA',_h.size,YEL+(0,)); _ly.putalpha(_ha)
    _p=4; _ck=Image.new('RGBA',(_h.width+2*_p,_h.height+2*_p),(0,0,0,0)); _ob=Image.new('L',_ck.size,0); _ob.paste(_ha,(_p,_p)); _ob=_ob.filter(ImageFilter.MaxFilter(5))
    _ol=Image.new('RGBA',_ck.size,INK+(0,)); _ol.putalpha(_ob); _ck.alpha_composite(_ol); _ck.alpha_composite(_ly,(_p,_p))
elif os.path.exists(_CKSVG) and os.environ.get('CHECK_GLYPH')!='1':
    from io import BytesIO as _BIO
    _ck=Image.open(_BIO(subprocess.run(['rsvg-convert','-h','56',_CKSVG],capture_output=True).stdout)).convert('RGBA')
else:
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
    dr=ImageDraw.Draw(cv)
    if _LENS_OLD: dr.line((cx,cy,tx,ty),fill=(255,255,255,int(230*g)),width=5)
    sh=Image.new('RGBA',(d+40,d+40)); ImageDraw.Draw(sh).ellipse((20,26,d+20,d+26),fill=(0,0,0,150)); cv.alpha_composite(sh.filter(ImageFilter.GaussianBlur(8)),(int(cx-d/2-20),int(cy-d/2-20)))
    cv.alpha_composite(reg,(int(cx-d/2),int(cy-d/2)))
    if _LENS_OLD: dr.ellipse((cx-d/2,cy-d/2,cx+d/2,cy+d/2),outline=(255,255,255,255),width=7)
    else: hr=hand_ring(d); cv.alpha_composite(hr,(int(cx-hr.width/2),int(cy-hr.height/2)))
# r20 「모든 요소는 손글씨(이모지 제외)」: 돋보기 테두리를 기계 원 대신 손으로 그은 고리(겹쳐 그은 끝·굵기 변화)로, 노랑 + 화살표·체크와 같은 진한 테두리. 노션 DB에 손그림 원 원본이 없어 같은 붓 결로 그림. 이어 긋던 흰 직선은 뺌(화살표가 부위를 가리킴). LENS_STYLE=old면 이전 흰 원+직선
_LENS_OLD=os.environ.get('LENS_STYLE')=='old'; _hrc={}
def hand_ring(d):
    if d in _hrc: return _hrc[d]
    S=3; pad=24; n=d+2*pad; big=Image.new('L',(n*S,n*S),0); dw=ImageDraw.Draw(big); rng=np.random.default_rng(7)
    a0=math.radians(-118); a1=a0+math.radians(400); m=900
    ph=rng.uniform(0,6.3,3)
    for i in range(m+1):
        u=i/m; a=a0+(a1-a0)*u
        rr=d/2*(1.02+0.035*math.sin(2*a+ph[0])+0.02*math.sin(3*a+ph[1])+0.07*u)   # 끝으로 갈수록 살짝 바깥으로 겹쳐 지남
        w=(5+9*math.sin(math.pi*min(1,u*1.1))**0.5)   # 시작·끝 가늘고 가운데 굵게
        x=(n/2+rr*math.cos(a))*S; y=(n/2+rr*math.sin(a))*S; r=w*S/2
        dw.ellipse((x-r,y-r,x+r,y+r),fill=255)
    al=big.resize((n,n),Image.LANCZOS)
    out=Image.new('RGBA',(n,n),INK+(0,)); ob=al.filter(ImageFilter.MaxFilter(5)); out.putalpha(ob)
    ly=Image.new('RGBA',(n,n),YEL+(0,)); ly.putalpha(al); out.alpha_composite(ly)
    _hrc[d]=out; return out
_yy,_xx=np.mgrid[0:2*H,0:2*W]; _rr=np.hypot(_xx-W,_yy-H)
SPOT=np.clip((_rr-300)/200,0,1)   # v6 기법 6: 스포트라이트 — 부위 둘레 반지름 300 밝게, 200px에 걸쳐 어두워짐
del _yy,_xx,_rr
def spot(cv,tx,ty,a):
    x0=int(W-tx); y0=int(H-ty); m=(SPOT[y0:y0+H,x0:x0+W]*a).astype('uint8')
    ov=Image.new('RGBA',(W,H),(0,0,0,255)); ov.putalpha(Image.fromarray(m)); return Image.alpha_composite(cv,ov)
CUR={}
def ring(cv,x,y,t,t_in):   # 부위 표시 고리: 노랑 한 색(사용자 확정), 0.2초에 커지며 나타남
    if t<t_in: return
    g=min(1.0,(t-t_in)/0.2); r=int(46*(0.6+0.4*g)); d=ImageDraw.Draw(cv)
    d.ellipse((x-r,y-r,x+r,y+r),outline=(0,0,0,110),width=12); d.ellipse((x-r,y-r,x+r,y+r),outline=(245,242,0,int(255*g)),width=7)
def special(key,cv,t,t0):
    for e in PL.get(key,{}).get('T02',[]):   # T02 ✓ 목록: 칩 바로 아래, 칩 왼쪽 선에 맞춰 쌓음
        _g=gchip(CHIPLAB[key]); cb=_g.getbbox(); x0=cxc(_g)+cb[0]; yk=YB+cb[3]+14   # r14: 가운데 칩의 칠 왼쪽 끝
        for r in e['rows']:
            im=ckpill(r['item']+SUFFIX.get(e.get('option','diff_lock'),' 잠금')); b=im.getbbox()
            pop(cv,im,(x0-b[0],yk-b[1]),t,r['at']-t0); yk+=b[3]-b[1]+TP['T02']['row_gap_px']
    if key=='__c3':   # 2026-11-23 「타이어도 노출 좌표를 특정」: 휠 가운데(c3)·타이어 옆면(c3t) 좌표 지정 추적을 따라 글자가 붙어 다님(나세르식)
        st,tomap=CUR['st'],CUR['tomap']
        def _at(k):
            if k not in TR: return None
            d=TR[k]
            if not (d['s0']<=st<=d['s1']): return None
            P=d['pts']; i=min(len(P)-1,int(round((st-d['s0'])*30)))
            return tomap(*P[i]) if P[i] else None
        hub=_at('c3'); tire=_at('c3t')
        if tire is None and 'c3t' in TR and st<TR['c3t']['s0']:   # 타이어 추적 시작 전엔 추적 첫 점(같은 화면 변환)
            _p=next((q for q in TR['c3t']['pts'] if q),None); tire=tomap(*_p) if _p else None
        WR=int(W*0.40)   # 이 원본 휠 반지름(화면 폭의 약 40%)
        tb=WS[W_IN_J][1]-t0-0.22; HIDE_SUB[0]=HIDE_SUB[0] or t>=tb   # 숫자가 떠 있는 동안 말 자막 숨김
        y=int(max(150,min(CAPY-120-W_IN.height-10-W_TY.height,hub[1]-WR-60-W_IN.height))) if hub else int(H*0.075)   # r15(§11): 휠 인치는 휠 윗선 바로 위에 붙어 휠을 따라 위아래로도 움직임(r12~r14는 위 띠 고정)
        x0=int(min(W-W_IN.width/2-30,max(W_IN.width/2+30,hub[0]))) if hub else W//2
        # r24 「20인치가 두 번 중복 매핑 어설프다」: 20인치는 휠 전체가 보이는(휠 추적이 잡히는) 동안만. 타이어 근접으로 넘어가 휠을 놓치거나
        # 타이어 규격이 뜨면 그 자리에서 0.2초 사라짐 → 타이어 근접 화면에 위 띠로 떠 있는 두 번째 20인치 없음. WIN_ONCE=0이면 이전처럼 계속 표시
        ty0=WS[W_TY_J][1]-t0-0.22
        _ws=W_IN_ST.setdefault('s',{'off':None,'pos':None})
        if _WIN_ONCE and t>=tb and _ws['off'] is None and (hub is None or t>=ty0): _ws['off']=t
        win_on=(not _WIN_ONCE) or _ws['off'] is None
        if win_on:
            _ws['pos']=(int(x0-W_IN.width/2),y)
            pop(cv,W_IN,_ws['pos'],t,tb,0.3); label_log('20인치','num_part','c3',(hub[0],hub[1]-WR) if hub else None,_ws['pos'],W_IN,t,tb)
        elif _ws['pos'] and t-_ws['off']<0.2:
            _fa=1-(t-_ws['off'])/0.2; _im=W_IN.copy(); _im.putalpha(_im.getchannel('A').point(lambda v:int(v*_fa))); cv.alpha_composite(_im,_ws['pos'])
        # r15(매뉴얼 §11): 타이어 규격은 타이어 옆면 추적(c3t)에 붙임 — r12~r14는 20인치 밑 위 띠에 쌓여 손가락이 가리키는 옆면과 따로 놀았음
        if tire:
            tx_=int(min(W-W_TY.width/2-SAFE_X,max(W_TY.width/2+SAFE_X,tire[0]))); ty_=int(tire[1]-W_TY.height-60)   # 옆면 점 바로 위(점·손가락을 덮지 않음)
            ty_=max((y+W_IN.height+10) if win_on else 150,min(ty_,CAPY-120-W_TY.height))
        else: tx_,ty_=x0,y+W_IN.height+10
        pop(cv,W_TY,(int(tx_-W_TY.width/2),ty_),t,ty0,0.3); label_log('앞 245 · 뒤 285','num_part','c3t',tire,(int(tx_-W_TY.width/2),ty_),W_TY,t,ty0)
    if key=='__c4':
        st,tomap=CUR['st'],CUR['tomap']   # r15(매뉴얼 §11): 시트 재질 = 등받이 위, 카펫 색 = 바닥 카펫 옆(OWLv2 추적 c4s·c4c)
        def _at4(k):
            if k not in TR or not (TR[k]['s0']<=st<=TR[k]['s1']): return None
            P=TR[k]['pts']; q=P[min(len(P)-1,int(round((st-TR[k]['s0'])*30)))]; return tomap(*q) if q else None
        bk=_at4('c4s'); cp=_at4('c4c')
        if bk: mx,my=int(min(W-S_MAT.width/2-SAFE_X,max(S_MAT.width/2+SAFE_X,bk[0]))),int(max(150,min(bk[1]-S_MAT.height/2,CAPY-120-S_MAT.height)))
        else: mx,my=W//2,int(H*0.12)
        pop(cv,S_MAT,(mx-S_MAT.width//2,my),t,WS[MAT_J][1]-t0-0.06,0.3); label_log('베이지 가죽','material','c4s',bk,(mx-S_MAT.width//2,my),S_MAT,t,WS[MAT_J][1]-t0-0.06)
        if cp:   # 매뉴얼 §11: 부위가 화면에 있을 때만 그 옆에 흰 알약. 「레드 카펫」은 말할 때 화면이 등받이로 올라가 카펫이 안 보임 → 띄우지 않음(말 자막이 맡음, r14는 재질 글자 밑에 떠서 카펫과 무관했음)
            sx,sy=int(min(W-S_SUB.width/2-SAFE_X,max(S_SUB.width/2+SAFE_X,cp[0]))),int(cp[1]-S_SUB.height-20)
            if sy+S_SUB.height>CAPY-80 and sy<CAPY+140: sy=CAPY+140
            sy=min(sy,int(H*0.80)-S_SUB.height)
            pop(cv,S_SUB,(sx-S_SUB.width//2,sy),t,WS[SUB_J][1]-t0-0.06); label_log('레드 카펫','color','c4c',cp,(sx-S_SUB.width//2,sy),S_SUB,t,WS[SUB_J][1]-t0-0.06)
    if key=='__c14':
        y=int(H*0.10); tb=WS[L255_J][1]-t0-0.22; HIDE_SUB[0]=HIDE_SUB[0] or t>=tb   # r12: 255L가 뜨면 「255리터」 자막과 겹치지 않게 말 자막 숨김
        pop(cv,T1L,((W-T1L.width)//2,y),t,WS[ROOF_J][1]-t0-0.06); _i=cnt('255L',180,t,tb+0.05); pop(cv,_i,((W-_i.width)//2,y+T1L.height),t,tb,0.3)
SFXT=[]; ICONT=[]; EV=[]; CHIPS_LOG=[]; REMIX=bool(os.environ.get('REMIX'))   # EV = [(시각, 종류)] 효과음 후보
ZONE=_CK.get('zones',{}); _prevzone=None
MET=json.load(open(os.path.join(REPO,'scripts/shortform/photo_listing/option_visual_rules.json')))['layout']['metaphor_sfx']; SX=R['sfx']
# r11 크로스체크: 두 렌더를 동시에 돌리면 같은 중간 파일(nov8.mp4)을 함께 써서 영상이 깨졌다 → 잠금 파일로 동시 실행을 막는다
_LOCK=G+'nov8.lock'
if os.path.exists(_LOCK):
    try: os.kill(int(open(_LOCK).read()),0); sys.exit('⛔ 다른 roma_render가 실행 중(중간 파일 nov8.mp4 공유) — 끝난 뒤 다시 실행하거나 REMIX=1로 소리만 바꾸세요')
    except (ProcessLookupError,ValueError): pass
open(_LOCK,'w').write(str(os.getpid())); import atexit; atexit.register(lambda: os.path.exists(_LOCK) and os.remove(_LOCK))
proc=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p',G+('nov8_dummy.mp4' if REMIX else 'nov8.mp4')],stdin=subprocess.PIPE)
last=None; nfr=0
for t0,t1,c in SEG:
    key,s0,s1,fw,clab,cw,sub,av,bigs=c; dur=t1-t0; rate=min(2.0,(s1-s0)/dur)
    T01=PL.get(key,{}).get('T01',[None])[0]
    if T01 or PL.get(key,{}).get('T02'): av=None   # 2분할·✓ 목록 컷은 칩=위 띠 제목, 화살표 없음
    if T01: rate=min(TP['T01']['max_rate'],rate)
    fr=frames(s0,s1)
    frA=frames(*T01['action_src']) if T01 else None
    pts=VALID=None
    if key in TR:   # 매핑 v2(2026-11-23): 추적기가 이미 평활함 · 잃은 프레임(None)은 가장 가까운 정상 점으로 채우고 화살표는 숨김
        _raw=TR[key]['pts']; VALID=[p is not None for p in _raw]; _ok=[i for i,v in enumerate(VALID) if v]
        if _ok: pts=smooth([_raw[min(_ok,key=lambda j:abs(j-i))] for i in range(len(_raw))],k=3)
    TS0,TS1=(TR[key]['s0'],TR[key]['s1']) if key in TR else (s0,s1)   # r06: 추적은 자기 시작 시각 기준(컷 시작과 다르면 화살표가 늦게 따라가던 문제)
    def tix(st_): return min(len(pts)-1,max(0,int(round((st_-TS0)*30))))
    CHIPLAB[key]=clab; Cimg=gchip(clab) if clab else None; Simg=white(sub[0],58) if sub else None
    BIG=[(text3d(b,h=180 if key!='__pw' else 210),white(l,58) if l else None,WS[j][1]-t0-0.22) for b,l,j in bigs]; BIGS=[b for b,l,j in bigs]
    _metak=[k for it in MET['items'] for k in it['keywords']]
    for (b,l,j),tb in zip(bigs,[x[2] for x in BIG]):
        if not any(k in WS[j][0] for k in _metak): EV.append((t0+tb-0.02,'big_number'))   # 비유 효과음이 있는 숫자(마력 등)는 그 소리가 대신함
    if clab: EV.append((t0+((WS[cw][1]-t0-0.06) if cw is not None else 0)+CHIP_DELAY.get(key,0)-0.02,'chip'))
    for e in PL.get(key,{}).get('T05',[])+PL.get(key,{}).get('T06',[]): EV.append((e['at'],'emphasis'))
    if ZONE.get(key)!=_prevzone and _prevzone is not None: EV.append((t0-0.08,'part_change'))
    _prevzone=ZONE.get(key,_prevzone)
    tc=((WS[cw][1]-t0-0.06) if cw is not None else 0)+CHIP_DELAY.get(key,0)
    BL0=None
    if pts is not None and Cimg is not None and av is not None:   # v7: 칩 위·아래를 컷 전체 추적으로 한 번만 정함(중간 뒤집힘 금지)
        _b=Cimg.getbbox(); _h=_b[3]-_b[1]; _n=int((min(s1,s0+dur*rate)-s0)*30)+1; _ys=[pts[tix(s0+i/30)][1]*H for i in range(_n)]   # 실제로 보이는 구간만
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
                pj=tix(st); ccx=W/2+(pts[pj][0]*W-W/2)*q['center_bias']*g; ccy=H/2+(pts[pj][1]*H-H/2)*q['center_bias']*g
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
        if key=='c1':
            cv=Image.alpha_composite(cv,Image.new('RGBA',(W,H),(0,0,0,90)))
            pop(cv,HB,(M-10,YB),t,0.08)
            if not any(c_['kind']=='title' for c_ in CHIPS_LOG) and t>=0.28: _bb=HB.getbbox(); CHIPS_LOG.append({'key':'c1','label':'BMW','kind':'title','t0':round(t0+0.08,3),'t1':round(t1,3),'t_box':round(nfr/FPS,3),'px':R['chip']['title_font_px'],'y':YB,'box':[M-10+_bb[0],YB+_bb[1],M-10+_bb[2],YB+_bb[3]]})
            _hb=HB.getbbox(); pop(cv,HM,(M-10+_hb[2]+6,YB+(_hb[1]+_hb[3]-HM.height)//2),t,0.28); pop(cv,HS,(M-4,YB+_hb[3]+16),t,0.5)   # 칠이 실제로 끝나는 곳 기준(투명 여백 제외)
        if key in('__',) : cv=Image.alpha_composite(cv,Image.new('RGBA',(W,H),(0,0,0,70)))
        if key in('c3','c6','c9'): cv=Image.alpha_composite(cv,Image.new('RGBA',(W,H),(0,0,0,40)))
        if Cimg is not None:
            if pts is not None:
                pi=tix(st); tx,ty=tomap(*pts[pi])
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
                cx,cy=cxc(Cimg),YB   # r14(매뉴얼 v4.1 §10-5): 포인트 칩은 위쪽 300px 가로 가운데 — 큰 숫자와 같은 축(r13은 왼쪽 M-10에 붙어 어정쩡)
                L=0
            else: cx,cy,L,bl=place(Cimg,tx,ty,bl)
            if av and av[0]<=st<=av[1] and t>=tc+0.18 and TS0<=st<=TS1 and VALID[tix(st)]:
                g=ease((t-tc-0.18)/0.25); Lc=max(20,round(L*(0.55+0.45*g))); bob=round(BOB*abs(math.sin((t-tc-0.43)*5))) if t>tc+0.43 else 0
                A,off=arrimg(L,bl); A=A.resize((A.width,round(A.height*Lc/L))) if Lc!=L else A; offc=round(off*Lc/L)
                if LOGON: _LOG.append(['arr',nfr,key,round(tx),round(ty),bl,L,Lc,bob,cx,cy,Cimg.getbbox()])
                if bl: tail=ty+TG+L; cv.alpha_composite(A,(int(tx-A.width/2),int(tail-Lc-bob-offc)))
                else: tail=ty-TG-L; cv.alpha_composite(A,(int(tx-A.width/2),int(tail+bob-offc)))
            pop(cv,Cimg,(cx,cy),t,tc)
            if t>=tc+0.2 and key not in {c_['key'] for c_ in CHIPS_LOG}:   # 다 나타난 뒤 한 번 기록(검사는 이 순간 상자를 잼)
                _bb=Cimg.getbbox(); CHIPS_LOG.append({'key':key,'label':clab,'kind':'point' if av is None else 'callout',**({'no_track_reason':NOTRACK[key]} if av is None and key in NOTRACK else {}),'t0':round(t0+tc,3),'t1':round(t1,3),'t_box':round(nfr/FPS,3),'px':R['chip']['font_px'],'y':int(cy),'box':[int(cx+_bb[0]),int(cy+_bb[1]),int(cx+_bb[2]),int(cy+_bb[3])]})
            if Simg is not None:
                ts=WS[sub[1]][1]-t0-0.06; pop(cv,Simg,(cx+Cimg.width//2-Simg.width//2,cy+Cimg.height-4) if bl else (cx+Cimg.width//2-Simg.width//2,cy-Simg.height+6),t,ts)
        for k2,(B3,BL,tb) in enumerate(BIG):
            y3=int(H*0.12) if key!='__pw' else int(H*0.24)
            if Cimg is not None and av is None: y3=max(y3,YB+Cimg.getbbox()[3]+20)
            if key in BIG_LOW: y3=CAPY-100
            if key=='__c16': y3=int(H*0.52)   # r12: 칩·✓ 목록(3줄, 아래끝 약 0.49H) 아래 — 겹침 금지
            HIDE_SUB[0]=HIDE_SUB[0] or t>=tb   # r11: 큰 숫자가 떠 있는 동안 말 자막 숨김(매뉴얼 — 모든 큰 숫자)
            B3=cnt(BIGS[k2],180 if key!='__pw' else 210,t,tb+0.05); pop(cv,B3,((W-B3.width)//2,y3),t,tb,0.3)
            if BL: pop(cv,BL,((W-BL.width)//2,y3+B3.height+6),t,tb+0.12)
            if t>=tb+0.4 and (key,k2) not in BIGS_SEEN:   # r03: 큰 숫자 상자 기록(번호판 검사용)
                BIGS_SEEN.add((key,k2)); _b=B3.getbbox() or (0,0,B3.width,B3.height); _x=(W-B3.width)//2; _y1=y3+_b[3]
                if BL: _lb=BL.getbbox() or (0,0,BL.width,BL.height); _y1=max(_y1,y3+B3.height+6+_lb[3])
                BIGS_LOG.append({'key':key,'label':str(BIGS[k2]),'kind':'big','t_box':round(nfr/FPS,3),'box':[_x+_b[0],y3+_b[1],_x+_b[2],int(_y1)]})
        CUR['st']=st; CUR['tomap']=tomap; CUR['T']=nfr/FPS; special(key,cv,t,t0)
        draw_sub(cv,nfr/FPS) if not HIDE_SUB[0] else None
        HIDE_SUB[0]=False
        proc.stdin.write(cv.convert('RGB').tobytes()); nfr+=1; last=fr[fi]
    del fr
# 끝 화면: 마지막 장면 어둡게 + 보배드림 로고 커짐
if REMIX: proc.stdin.close(); proc.wait()
# 끝 화면(G350 v8과 같음): 마지막 장면 어둡게 + 보배드림 로고 커짐
LG=Image.open(ASSET+'bobae_logo_600.png').convert('RGBA'); LG.thumbnail((520,520))
base=Image.fromarray(last).convert('RGBA') if not REMIX else None
while not REMIX and nfr<round(TOTAL*FPS):
    t=nfr/FPS-ENDT; cv=Image.alpha_composite(base,Image.new('RGBA',(W,H),(0,0,0,int(185*min(1,t/0.3)))))
    s_=0.7+0.3*ease(t/0.6); lw=round(LG.width*s_); L2=LG.resize((lw,round(LG.height*s_))); cv.alpha_composite(L2,((W-lw)//2,640-(L2.height-LG.height)//2))
    draw_sub(cv,nfr/FPS) if nfr/FPS<VOICE else None
    proc.stdin.write(cv.convert('RGB').tobytes()); nfr+=1
if not REMIX: proc.stdin.close(); proc.wait()
if LOGON: json.dump(_LOG,open(G+'log8.json','w'),default=lambda o: o.item() if hasattr(o,'item') else list(o))
OUT=G+os.environ.get('M235_OUT','bobae_m235i_feature_short.mp4')
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
BGM=os.environ.get('ROMA_BGM',ASSET+'bgm/bobae_showroom_v1.mp3')  # 2026-11-23 「음악 바꿔」: 웅장한 배경음(일레븐랩스 생성)으로 교체 가능
BGMV=float(os.environ.get('ROMA_BGM_VOL','0.42'))  # r10 「밋밋한 bgm」: 0.30+강한 더킹(6:1)이면 말하는 내내 음악이 거의 안 들림 → 키우고 더킹 완화
inp=['-i',G+'nov8.mp4','-i',VOICEF,'-i',BGM]
fl=['[1:a]highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=8:release=120,asplit=2[v][vk]',f'[2:a]atrim=0:{TOTAL},volume={BGMV},afade=t=in:d=0.4,afade=t=out:st={TOTAL-1.5}:d=1.5[b0]','[b0][vk]sidechaincompress=threshold=0.06:ratio=2.5:attack=30:release=350[b]']; mx=['[v]','[b]']  # 말할 때 배경음 자동으로 줄임(더킹)
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
_TECH={'bgm','caption_chunks','end_logo','loudness_rule','slow_push','title_brand_chip','big_number_3d'}
_TECH|={'point_chip' if c['kind']=='point' else 'callout_chip' for c in CHIPS_LOG if c['kind'] in ('point','callout')}
if any(c['kind']=='callout' for c in CHIPS_LOG): _TECH.add('callout_arrow')
if acc: _TECH.add('sfx_rules')
_TECH|={e['id'] for c in _PLAN['cuts'] for e in c['techniques']}
json.dump({'bigs':BIGS_LOG,'edition':'feature_video','edition_code':'ED-SIMPLE','renderer':'m235_render.py','order':'picked','voice':os.path.basename(VOICEF),
           'frame':[W,H],'words':os.environ.get('ROMA_WORDS',G+'words_clean.json'),'techniques':sorted(_TECH),'music':True,'total':round(TOTAL,3),'cuts':[round(a,3) for a,b,c in SEG[1:]],
           'sfx':[{'t':a[0],'kind':a[1],'sound':a[2]} for a in acc],'chips':CHIPS_LOG,'labels':list(LABELS_LOG.values()),
           'caption':{'center_y_px':CAPY,'font_px':R['caption']['font_px'],'chunks':len(CH)}},open(OUT+'.plan.json','w'),ensure_ascii=False,indent=1)
print(OUT,TOTAL)
