"""편집 스킬 고르기: 장면 종류(intro·option·sound·price·spec·compare·app·ending·point_m3)와 쓰는 방식(1·2·3)을 주면
edit_skills_v1.json 에서 쓸 스킬을 순서대로 돌려준다. auto_edit / sag_reel 이 읽는다.
python3 edit_skill_picker.py option 3
"""
import json, os, sys
LIB = json.load(open(os.path.join(os.path.dirname(__file__), 'edit_skills_v1.json'), encoding='utf-8'))
MODE = {1: '① 내레이션형', 2: '② 사람 등장형', 3: '③ 손가락 아이콘형'}
BY_ID = {s['id']: s for s in LIB['skills']}

def pick(scene, mode):
    m = MODE[int(mode)]
    ids = list(LIB['recipes'].get(scene, []))
    if scene == 'option' and int(mode) == 3:
        ids += LIB['recipes']['point_m3']
    return [BY_ID[i] for i in ids if m in BY_ID[i]['modes']]

if __name__ == '__main__':
    for s in pick(sys.argv[1], sys.argv[2]):
        print(s['id'], s['note'], '|', s['when'])
