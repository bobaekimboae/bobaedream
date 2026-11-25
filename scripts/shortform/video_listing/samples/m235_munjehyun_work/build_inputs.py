# 문제현 딜러 BMW M235i xDrive 그란쿠페(F44) — 대본(script.json) + 낱말 시각(scribe_words.json) + 부위 자동 찾기(map_auto.json) → 렌더 입력
import json,os
S=os.path.dirname(os.path.abspath(__file__))+'/'
VL='/home/claude/bobaedream/scripts/shortform/video_listing/samples/'
SRC={'g1':[0.2,4.6],'g2':[4.6,7.7],'g3':[8.6,11.2],'g4':[15.7,17.3],'g5':[19.4,22.0],'g6':[31.6,34.7],'g7':[35.0,38.3],'g8':[50.4,53.4],
 'g9':[55.2,58.0],'g10':[61.9,65.2],'g11':[66.3,69.4],'g12':[70.4,73.0],'g13':[78.8,81.6],'g14':[84.0,86.6],'g15':[88.0,90.5],'g16':[97.2,100.8],
 'g17':[103.6,106.4],'g18':[113.6,116.0],'g19':[121.6,125.2],'g20':[137.6,140.2],'g21':[144.4,148.0],'g22':[27.0,33.0]}
CHUNK={'g1':[2,2,1],'g2':[1,3,1],'g3':[1,2,1],'g4':[2],'g5':[2,2,1],'g6':[1,2,1,2],'g7':[1,2,1],'g8':[2,1],'g9':[1,2,1],'g10':[2,1,3,1],
 'g11':[2,1,2],'g12':[1,3],'g13':[1,2,1],'g14':[1,2,1],'g15':[1,3,1],'g16':[1,1],'g17':[2,2,1],'g18':[2,1,1],'g19':[2,2,2,2],'g20':[2,3,1],
 'g21':[2,3,1,1],'g22':[1,2,1,2,2,1]}
DIM={'g2':60,'g8':50,'g16':50}
M=json.load(open(S+'map_auto.json')) if os.path.exists(S+'map_auto.json') else {}
PK=json.load(open(S+'picks_v2.json')) if os.path.exists(S+'picks_v2.json') else None
OVR=json.load(open(S+'map_pick.json')) if os.path.exists(S+'map_pick.json') else {}   # 자동 결과가 틀린 컷만 눈으로 본 값(이유 적음) · null = 추적 안 함
TRACK={};FRAC={};MAPSRC={}
for k,m in M.items():
    if k in OVR:
        if OVR[k] is None or OVR[k].get('track') is None: MAPSRC[k]='추적 없음('+((OVR[k] or {}).get('why','')) +')'; continue
        TRACK[k]=OVR[k]['track']; FRAC[k]=OVR[k].get('frac',0.05); MAPSRC[k]='eye('+OVR[k].get('why','')+')'; continue
    if not m.get('box'): continue
    b=m['box']; t=min(max(m['best_t'],SRC[k][0]+0.1),SRC[k][1]-0.1)
    TRACK[k]=[round(t,2),m['center'][0],m['center'][1],round(b[2]-b[0],3),round(b[3]-b[1],3)]; FRAC[k]=m['frac']; MAPSRC[k]='auto(OWLv2 %.2f)'%m['score']
if PK is not None:
    TRACK={k:v['track'] for k,v in PK.items() if v.get('track')}; FRAC={k:v.get('frac',0.05) for k,v in PK.items()}; MAPSRC={k:v.get('how','') for k,v in PK.items()}
cuts=json.load(open(S+'script.json',encoding='utf-8'))['cuts']
sw=[w for w in json.load(open(S+'scribe_words.json'))['words'] if w['type']=='word']
WS=[];k=0;car=[];chunks=[];zones={};inp=[]
for c in cuts:
    show=c['show'].split(); say=c['say'].split(); assert len(show)==len(say); st=len(WS)
    for a,b in zip(show,say):
        n=len(b.split('_')); seg=sw[k:k+n]; assert ''.join(x['text'] for x in seg).strip(',.')==b.replace('_','').strip(',.'),(b,[x['text'] for x in seg])
        WS.append([a,seg[0]['start'],seg[-1]['end']]); k+=n
    find=lambda key: next(j for j in range(st,len(WS)) if WS[j][0].startswith(key))
    d={'key':c['key'],'src':SRC[c['key']],'start_word':st}
    if c.get('chip'): d.update(chip=c['chip'],chip_word=find(c['chip_word']),arrow=c['key'] in TRACK)
    if c['key'] in TRACK: d['track']=TRACK[c['key']]
    if c.get('bigs'): d['bigs']=[[b[0],b[1],find(b[2])] for b in c['bigs']]
    if c['key'] in DIM: d['dim']=DIM[c['key']]; d['no_emphasis']=True
    car.append(d); zones[c['key']]=c['zone']; assert sum(CHUNK[c['key']])==len(show),(c['key'],len(show))
    j=st
    for n in CHUNK[c['key']]: chunks.append([j,j+n-1]); j+=n
    inp.append({'key':c['key'],'start_word':st,'src':SRC[c['key']],'tracked':c['key'] in TRACK,'part_box_frac':FRAC.get(c['key'],0.0144)})
assert k==len(sw)
json.dump(WS,open(S+'words5.json','w'),ensure_ascii=False)
OUT=os.environ.get('OUTNAME','bobae_m235_munjehyun_be_v1.mp4')
json.dump({'_what':'문제현 딜러(뉴삼일모터스) BMW M235i xDrive 그란쿠페(F44) — g350_v8_render.py CAR 입력. 사실 = 원본 파일 이름 + 원본 영상에 보이는 것 + BMW 공식 제원(306마력·430L). 차량번호·연락처·가격 없음',
  'id':'m235','out':OUT,'chip_layout':'slots','slot_b_y':1030,'deco':{'emphasis':True,'arrow':'hand_yellow','arrow_len':180},'map_source':MAPSRC,
  'title':{'brand':'BMW','model':'M235i 그란쿠페','sub':'2021년식 · 가솔린 · F44'},'cuts':car,'caption_hl':{'min_hold':0.26,'fade':0.1,'number_yellow':True},'track_smooth':9,'onset':'pause_only'},open(VL+'m235_munjehyun_car.json','w'),ensure_ascii=False,indent=1)
json.dump({'_what':'M235i 말 자막 뜻 단위 덩어리 + 컷별 부위 구역','words':len(WS),'zones':zones,'chunks':chunks},open(VL+'m235_munjehyun_edit.json','w'),ensure_ascii=False,indent=1)
json.dump({'words':S+'words_clean.json','src':S+'src.mp4','cuts':inp},open(S+'plan_input.json','w'),ensure_ascii=False,indent=1)
print(len(WS),'낱말',len(chunks),'덩어리','추적',sorted(TRACK))
