# 줄: (대본(| 읽는 글자, / 자막 묶음 끊기), 원본 구간, 구역, 칩, 칩 낱말(없으면 컷 시작), 큰 숫자(글자,이름,낱말))
# DROP = 음성에서 잘라 낸 문장(전체 대본 줄 번호, 0부터). 장면이 없거나 겹치는 문장.
DROP=[14,18]
L=[
("BMW|비엠더블유 520i|오이공아이 / M|엠 스포츠입니다.",[0.3,3.0],"외관",None,None,None),
("외장 색상은 / 파란색입니다.",[3.3,4.8],"외관","파란색 외장","파란색입니다.",None),
("2리터|이리터 가솔린 터보 엔진으로 / 184마력을|백팔십사마력을 냅니다.",[4.8,7.5],"외관",None,None,("184마력","최고출력","184마력을")),
("최대토크는 / 29.6kg·m입니다.|이십구점육킬로그램미터입니다.",[7.5,9.9],"외관",None,None,("29.6kg·m","최대토크","29.6kg·m입니다.")),
("뒤로 돌아가면 / 테일램프가 / 켜져 있습니다.",[9.9,11.5],"외관","테일램프","테일램프가",None),
("휠 안쪽으로는 / 파란색 캘리퍼가 / 보입니다.",[11.6,14.1],"외관","블루 캘리퍼","파란색",None),
("트렁크 용량은 / 530L입니다.|오백삼십리터입니다.",[14.2,16.9],"트렁크",None,None,("530L","트렁크 용량","530L입니다.")),
("뒷좌석은 / 브라운 가죽으로 / 마감했습니다.",[17.9,20.1],"실내","브라운 가죽","브라운",None),
("앞좌석도 / 같은 브라운 가죽입니다.",[23.7,25.3],"실내","앞좌석 가죽",None,None),
("뒷좌석 가운데에는 / 송풍구가 있습니다.",[25.5,27.2],"실내","뒷좌석 송풍구",None,None),
("실내는 / 블랙과 브라운 / 투톤으로 꾸몄습니다.",[30.2,33.3],"실내","투톤 실내",None,None),
("운전대는 / M|엠 스티어링 휠입니다.",[28.0,30.2],"실내","M 스티어링 휠","M",None),
("계기판은 디지털이고, / 주행거리는 / 58,176km입니다.|오만팔천백칠십육킬로미터입니다.",[35.3,38.3],"실내","디지털 계기판",None,("58,176km","주행거리","58,176km입니다.")),
("가운데에는 / 기어 레버와 / 조작 다이얼이 있습니다.",[20.2,22.8],"실내","기어 레버","기어",None),
("변속기는 / 8단|팔단 자동입니다.",[38.4,40.9],"실내","8단 자동","8단",None),
("센터 화면에는 / 내비게이션이 나옵니다.",[41.2,43.8],"실내","내비게이션","내비게이션이",None),
("후진할 때는 / 후방 카메라 화면이 / 나옵니다.",[45.0,48.8],"실내","후방 카메라","후방",None),
("최초 등록은 / 2020년|이천이십년 9월입니다.|구월입니다.",[50.2,53.4],"외관",None,None,("2020년 9월","최초 등록","2020년")),
("배기량은 / 1,998cc입니다.|천구백구십팔씨씨입니다.",[0.3,2.3],"외관",None,None,("1,998cc","배기량","1,998cc입니다.")),
("가격은 / 2,990만|이천구백구십만 원입니다.",[1.0,3.3],"외관",None,None,("2,990만원","가격","2,990만")),
("자세한 정보는 / 보배드림 앱에서 / 확인해 보세요.",None,None,None,None,None)]
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
