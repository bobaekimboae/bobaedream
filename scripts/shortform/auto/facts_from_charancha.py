"""차란차 매물 원장(info.json + ledger_page.json) → auto_edit.py 의 facts.json. 원장에 없는 값은 넣지 않는다.

python3 facts_from_charancha.py 작업폴더/차   → 작업폴더/차/facts.json

원장 두 가지(사용자 지시 2026-11-21 「매물정보와 상세설명을 원장으로」):
  info.json        = 매물 페이지 서버 데이터(차명·연식·최초등록·주행·가격·연료·색상·바디). 차량번호·050 번호는 저장 단계에서 뺀다.
  ledger_page.json = 매물 페이지에 보이는 기본옵션·보증·보험 이력·판매자 설명(상세설명).
제원(마력·엔진 형식)은 원장에 없으므로 넣지 않는다(공식 제원으로 채우지 않음).
옵션 이름은 차란차 표기 → 옵션 사전(auto_edit_rules.json option_catalog) 이름. 뜻이 1:1로 같은 것만 잇는다.
"""
import json, os, sys

# 차란차 기본옵션 표기 → 옵션 사전 이름. None = 사전에 뜻이 정확히 같은 항목이 없어 쓰지 않음
CHA_OPTION = {
    '선루프': '선루프',
    'LED헤드램프': 'LED헤드램프',
    '주차감지센서': None,          # 앞·뒤 어느 쪽인지 원장에 없음(사전은 전방센서·후방센서로 나뉨)
    '후방카메라': '후방카메라',
    '가죽시트': '가죽시트',
    '전동시트': None,              # 운전석·동승석 구분이 원장에 없음
    '열선시트': None,              # 앞좌석·뒷좌석 구분이 원장에 없음
    '통풍시트': '통풍시트',
    '스마트키': '스마트키',
    '열선 스티어링 휠': '열선핸들',
    '자동에어컨': '자동에어컨',
    '내비게이션': None,            # 순정 여부가 원장에 없음(사전은 네비게이션(순정))
}


def build(folder):
    I = json.load(open(os.path.join(folder, 'info.json'), encoding='utf-8'))
    L = json.load(open(os.path.join(folder, 'ledger_page.json'), encoding='utf-8'))
    fr = I.get('firstRegisteredAt') or ''
    reg = f"{fr[2:4]}년{fr[4:6]}월" if len(fr) >= 6 else None
    gen = (I.get('modelDetailName') or '').replace(I.get('modelName') or '', '').strip() or None
    opts, skipped = [], []
    for o in L.get('basic_options', []):
        m = CHA_OPTION.get(o)
        (opts.append(m) if m else skipped.append(o))
    F = {
        'id': os.path.basename(os.path.normpath(folder)),
        'make': I['makerName'], 'model': I['modelName'], 'gen': gen, 'trim': I.get('gradeName'),
        'color': I.get('colorName'), 'reg': reg, 'year': I.get('releaseYear'), 'km': I.get('mileage'),
        'fuel': I.get('fuelName'), 'price_manwon': I.get('sellPrice'), 'region': I.get('regionName'),
        'body': I.get('bodyTypeName'), 'displacement_cc': I.get('displacement'),
        'options': opts, 'features': [],
        'warranty': L.get('warranty'), 'insurance': L.get('ins'),
        '_note': '원장: 차란차 매물 페이지(서버 데이터 + 기본옵션·보증·보험 이력·판매자 설명). 제원은 원장에 없어 비움. '
                 '사전과 뜻이 다른 옵션은 뺌: ' + (', '.join(skipped) or '없음'),
    }
    return {k: v for k, v in F.items() if v not in (None, '')}


if __name__ == '__main__':
    F = build(sys.argv[1])
    json.dump(F, open(os.path.join(sys.argv[1], 'facts.json'), 'w'), ensure_ascii=False, indent=1)
    print(json.dumps(F, ensure_ascii=False))
