# 줄: (대본(| 읽는 글자, / 자막 묶음 끊기), 원본 구간, 구역, 칩, 칩 낱말(없으면 컷 시작), 큰 숫자(글자,이름,낱말))
L=[
("BMW|비엠더블유 520i|오이공아이 / M|엠 스포츠입니다.",[0.3,3.3],"외관",None,None,None),
("헤드램프가 / 켜져 있습니다.",[3.4,5.4],"외관","헤드램프","헤드램프가",None),
("외장은 / 파란색입니다.",[5.5,7.0],"외관","파란색 외장","파란색입니다.",None),
("차종은 / 중형 세단입니다.",[7.0,8.6],"외관","중형 세단","중형",None),
("뒤쪽엔 / 테일램프가 켜져 있습니다.",[9.0,10.3],"외관","테일램프","테일램프가",None),
("휠 안쪽엔 / 블루 캘리퍼가 보입니다.",[11.6,14.0],"외관","블루 캘리퍼","블루",None),
("트렁크를 / 열어 보겠습니다.",[14.2,16.9],"트렁크","트렁크 열기",None,None),
("뒷좌석은 / 브라운 가죽입니다.",[17.6,20.0],"실내","브라운 가죽","브라운",None),
("앞좌석도 / 브라운 가죽입니다.",[23.5,26.0],"실내","앞좌석 가죽",None,None),
("뒷좌석에도 / 송풍구가 있습니다.",[26.2,27.4],"실내","뒷좌석 송풍구",None,None),
("실내는 / 블랙과 브라운 / 투톤입니다.",[30.4,33.3],"실내","투톤 실내",None,None),
("핸들은 / M|엠 스티어링 휠입니다.",[28.2,30.3],"실내","M 스티어링 휠","M",None),
("계기판은 / 디지털입니다.",[35.8,37.0],"실내","디지털 계기판",None,None),
("주행거리는 / 58,176km입니다.|오만팔천백칠십육킬로미터입니다.",[37.0,38.3],"실내",None,None,("58,176km","주행거리","58,176km입니다.")),
("가운데엔 / 기어 레버와 / 다이얼이 있습니다.",[20.2,22.3],"실내","기어 레버","기어",None),
("센터 콘솔 / 덮개도 / 브라운 가죽입니다.",[22.3,23.4],"실내","센터 콘솔",None,None),
("변속기는 / 자동입니다.",[38.5,40.6],"실내","자동 변속기",None,None),
("센터 화면엔 / 내비게이션이 나옵니다.",[41.2,43.8],"실내","내비게이션","내비게이션이",None),
("주차할 때는 / 후방 카메라 / 화면을 / 볼 수 있습니다.",[44.5,47.5],"실내","후방 카메라","후방",None),
("지역은 / 경기입니다.",[33.5,35.5],"실내","경기 지역",None,None),
("최초 등록은 / 2020년|이천이십년 9월입니다.|구월입니다.",[10.3,11.6],"외관",None,None,("2020년 9월","최초 등록","2020년")),
("배기량은 / 1,998cc입니다.|천구백구십팔씨씨입니다.",[49.7,51.4],"외관",None,None,("1,998cc","배기량","1,998cc입니다.")),
("가격은 / 2,990만|이천구백구십만 원입니다.",[51.5,53.3],"외관",None,None,("2,990만원","가격","2,990만")),
("자세한 정보는 / 보배드림 앱에서 / 확인하세요.",None,None,None,None,None)]
import json
script=[];cuts=[];chunks=[];w=0
for i,(txt,src,zone,chip,cw,big) in enumerate(L):
    toks=[];grp=[[]]
    for t in txt.split():
        if t=='/': grp.append([]); continue
        grp[-1].append(w+len(toks)); toks.append(t)
    disp=[t.split('|')[0] for t in toks]; script.append(' '.join(toks)); chunks+=[[g[0],g[-1]] for g in grp if g]
    if src:
        c={"key":f"c{i+1}","word":w,"zone":zone,"src":src}
        if chip: c.update(chip=chip,chip_word=w+(disp.index(cw) if cw else 0))
        if big: c["bigs"]=[[big[0],big[1],w+disp.index(big[2])]]
        if big and big[1]=='가격': c["dim"]=40
        cuts.append(c)
    else: end=w
    w+=len(toks)
open('script.txt','w',encoding='utf-8').write('\n'.join(script)+'\n')
json.dump({"title":{"brand":"BMW","model":"520i M 스포츠","sub":"2021년식 · 가솔린 · G30"},"end_word":end,"cuts":cuts},open('car.json','w'),ensure_ascii=False,indent=1)
json.dump({"words":w,"zones":{c['key']:c['zone'] for c in cuts},"chunks":chunks},open('edit.json','w'),ensure_ascii=False)
json.dump({},open('tracks.json','w')); print(w,len(cuts),end)
