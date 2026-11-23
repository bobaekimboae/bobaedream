# 차란차 10번 GLE450 — 대본(script.json) + 낱말 시각(scribe_words.json) → 렌더 입력(car/edit/input/words_clean)
import json,os
S=os.path.dirname(os.path.abspath(__file__))+'/'
VL='/home/claude/bobaedream/scripts/shortform/video_listing/samples/'
SRC={'g1':[0.0,2.75],'g2':[2.85,4.6],'g3':[5.4,7.0],'g4':[8.2,10.65],'g5':[10.75,13.5],'g6':[15.2,17.4],'g7':[17.5,18.6],'g8':[26.85,29.5],
     'g9':[23.6,25.4],'g10':[20.5,21.8],'g11':[41.7,42.7],'g12':[34.85,35.5],'g13':[35.5,36.15],'g14':[25.5,26.75],'g15':[37.6,40.0],
     'g16':[43.7,48.1],'g17':[53.0,55.3],'g18':[55.3,57.2]}
TRACK={'g2':[3.4,.56,.51],'g4':[9.0,.44,.48],'g7':[17.8,.50,.40],'g9':[24.0,.48,.28],'g10':[21.2,.52,.24],'g12':[35.4,.22,.31],'g13':[35.8,.085,.27],'g16':[45.0,.48,.46]}
CHUNK={'g1':[3,1],'g2':[1,2,2],'g3':[2,1,3,2],'g4':[1,3,2],'g5':[1,2,1],'g6':[1,2,1],'g7':[1,3,2],'g8':[2,3,1,2],'g9':[2,2],'g10':[1,2,1],
       'g11':[2,3,1],'g12':[1,3,2],'g13':[1,2],'g14':[1,2,1],'g15':[1,1],'g16':[2,2,2,2],'g17':[2,2,1],'g18':[1,2,2,2,1]}
PILLS={'g3':[{'icon':'gearbox.svg','text':'자동 변속기','word':'변속기는','y':560}],'g4':[{'icon':'tyre-as24.svg','text':'콘티넨탈 타이어','word':'타이어는','y':300}]}
FRAC={'g7':0.06,'g10':0.08,'g12':0.04,'g9':0.05,'g16':0.07,'g4':0.2,'g2':0.05}   # 부위 상자가 화면에서 차지하는 비율(눈으로 잰 값) — 3% 미만만 돋보기 대상
DIM={'g3':60,'g15':50,'g18':60}
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
    if c['key'] in PILLS: d['pills']=[dict(p,word=find(p['word'])) for p in PILLS[c['key']]]
    if c['key'] in DIM: d['dim']=DIM[c['key']]
    car.append(d); zones[c['key']]=c['zone']; assert sum(CHUNK[c['key']])==len(show),c['key']
    j=st
    for n in CHUNK[c['key']]: chunks.append([j,j+n-1]); j+=n
    inp.append({'key':c['key'],'start_word':st,'src':SRC[c['key']],'tracked':c['key'] in TRACK,'part_box_frac':FRAC.get(c['key'],0.0144)})
assert k==len(sw)
json.dump(WS,open(S+'words5.json','w'),ensure_ascii=False)
json.dump({'_what':'차란차 10번 벤츠 GLE450 4MATIC(W167) — g350_v8_render.py CAR 입력. 사실 = 드라이브 10_차란차_매물정보.txt + 원본 영상에 보이는 것. 차량번호·연락처 없음',
  'id':'cha10','out':'bobae_cha10_gle450_be_v1.mp4','title':{'brand':'벤츠','model':'GLE450 4MATIC','sub':'2024년식 · 가솔린+전기 · W167'},'cuts':car},open(VL+'cha10_gle450_car.json','w'),ensure_ascii=False,indent=1)
json.dump({'_what':'차란차 10번 GLE450 말 자막 뜻 단위 덩어리 + 컷별 부위 구역(g350_edit.json과 같은 형식)','words':len(WS),'zones':zones,'chunks':chunks},open(VL+'cha10_gle450_edit.json','w'),ensure_ascii=False,indent=1)
json.dump({'words':S+'words_clean.json','src':S+'src.mp4','cuts':inp},open(S+'plan_input.json','w'),ensure_ascii=False,indent=1)
print(len(WS),'낱말',len(chunks),'덩어리'); print(' '.join(w[0] for w in WS))
