"""library_v2.json 읽기(스킬 설명·통계·패턴 흐름·규칙). 만드는 곳: skill_survey/build_skills.py"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
PATH = os.path.join(HERE, 'library_v2.json')
MODE_NUM = {'① 내레이션형': 1, '② 사람 등장형': 2, '③ 손가락 아이콘형': 3}


def load(path=PATH):
    lib = json.load(open(path, encoding='utf-8'))
    lib['by_id'] = {}
    for s in lib['skills']:
        s['mode_nums'] = [MODE_NUM[m] for m in s['modes']]
        lib['by_id'][s['id']] = s
    return lib


LIB = load() if os.path.exists(PATH) else None
