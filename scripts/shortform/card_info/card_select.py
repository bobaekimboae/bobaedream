"""매물마다 넣을 카드 고르기 + 차량 이력 타임라인 사건 만들기 — 카드 정보 v0.2 (2026-11-26 클로드 시안)

2차 제안(사용자): 카드는 필수가 아니다. 매물에 따라 1개부터 여러 개까지 차량 편집에 들어간다.
순서는 card_info_rules.json 의 order(엔카 매물정보 기본 순서: 차량 기본정보 → 성능 점검 → 보험 이력 → 차량 이력 타임라인 → 우리 유형).

python3 card_select.py <차 폴더>      → 넣을 카드 / 뺄 카드와 이유, 타임라인 사건을 출력
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
RULES = json.load(open(os.path.join(HERE, 'card_info_rules.json'), encoding='utf-8'))


def ym(s):   # '2021-05-04' → '2021.05'
    return s[:4] + '.' + s[5:7]


def timeline_events(f):
    """사실 원장에서 날짜가 있는 사건만. 날짜 없는 사실(소유자 변경 시기 등)은 사건으로 만들지 않고 note로 돌린다."""
    ev, note = [], []
    ins = f.get('inspection') or {}
    if ins.get('first_reg'):
        ev.append({'date': ym(ins['first_reg']), 'what': '최초 등록', 'src': '성능점검기록부'})
    for d in (f.get('insurance_detail') or {}).get('my_damage', []):
        ev.append({'date': ym(d['date']), 'what': '내 차 피해 보험 처리', 'val': f"수리비 {d['repair_won']:,}원", 'src': '보험이력', 'kind': 'info'})
    if ins.get('inspection_valid'):
        a, b = ins['inspection_valid']
        ev.append({'date': ym(a), 'what': '검사 유효기간 갱신', 'val': f"~{b[:4]}.{b[5:7]}", 'src': '성능점검기록부'})
    if ins.get('date'):
        ev.append({'date': ym(ins['date']), 'what': '성능점검', 'val': f"{ins['km']:,}km", 'src': '성능점검기록부'})
    ev.append({'date': '지금', 'what': '판매 중', 'val': f"{f['km']:,}km", 'src': '매물 정보'})
    oc = (f.get('insurance') or {}).get('ownerChangeCount')
    if oc:
        note.append(f'소유자 변경 {oc}회는 시기 미공개')
    ev.sort(key=lambda e: e['date'] if e['date'][0].isdigit() else '9999')
    return ev, note


def select(f):
    """카드마다 (넣음/뺌, 이유). 원장에 그 카드를 채울 사실이 없으면 뺀다(빈 카드 금지)."""
    ins = f.get('inspection') or {}
    has = {
        'overview': (bool(f.get('reg') and f.get('km')), '등록연월·주행거리'),
        'report': (bool(ins) or bool((f.get('performance') or {}).get('has')), '성능점검기록부'),
        'insurance': (bool(f.get('insurance')), '보험이력 요약'),
        'timeline': (len(timeline_events(f)[0]) >= 3, '날짜 있는 사건 3개 이상'),
        'options': (bool(f.get('option_groups')), '옵션 묶음'),
        'addopt': (bool(f.get('option_groups')), '선택옵션 또는 눈에 띄는 장착 옵션'),
        'features': (bool((f.get('jato') or {}).get('hp')), '공식 제원(JATO)'),
        'seller': ((f.get('seller_text') or {}).get('kind') == 'own', '판매자 고유 설명(틀 글이면 뺌)'),
    }
    out = []
    for k in RULES['order']:
        ok, why = has.get(k, (False, '규칙에 없는 종류'))
        out.append({'kind': k, 'use': ok, 'need': why})
    return out


if __name__ == '__main__':
    f = json.load(open(os.path.join(sys.argv[1], 'facts.json'), encoding='utf-8'))
    print(json.dumps({'cards': select(f), 'timeline': timeline_events(f)}, ensure_ascii=False, indent=1))
