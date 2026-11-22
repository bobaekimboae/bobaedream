"""편집 유형 · 편집 방법(구성·기법·자산) · 영상 옵션 기능 편집 T01~T08 · 옵션 표시를
열(속성) 표로 만든다. 구글 시트 탭과 노션 데이터베이스가 같은 표를 쓴다(원본은 깃허브 json).

python3 shortform-kit/catalog/export_attr_table.py > 표.json
출력: {"version": "...", "tabs": {"탭 이름": [[머리줄...], [행...], ...]}}
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build

ROOT = build.ROOT
KIND = {'segment': '편집 구성', 'technique': '편집 기법', 'asset': '자산'}
ED_ORDER = ['photo', 'simple', '3d', 'asmr']
ED_CODE = {'photo': 'ED-PHOTO', 'simple': 'ED-SIMPLE', '3d': 'ED-3D', 'asmr': 'ED-ASMR'}


def j(v):
    if v is None:
        return ''
    if isinstance(v, (list, tuple)):
        return ' / '.join(j(x) for x in v)
    if isinstance(v, dict):
        return json.dumps(v, ensure_ascii=False)
    return str(v)


def main():
    C = json.load(open(build.SRC, encoding='utf-8'))
    FER = json.load(open(os.path.join(ROOT, 'scripts/shortform/video_listing/feature_edit_rules.json'), encoding='utf-8'))
    OVR = json.load(open(os.path.join(ROOT, 'scripts/shortform/photo_listing/option_visual_rules.json'), encoding='utf-8'))
    tcode = {t['name']: t['id'] for t in FER['techniques']}
    ALIAS = {'옵션 체크 목록': '✓ 목록 쌓기'}   # 카탈로그 이름 ↔ T 기법 이름이 다른 것
    tcode.update({k: tcode[v] for k, v in ALIAS.items() if v in tcode})
    tabs = {}

    tabs['편집유형'] = [['코드', '이름', '영어', '소재', '소리', '고정 구성', '상태', '렌더 코드']] + [
        [e['code'], e['ko'], e.get('en', ''), e.get('input', ''), e.get('sound', ''), j(e.get('fixed')), e['status'], e.get('impl', '')]
        for e in C['editions']]

    head = ['코드', '종류', '분류', '이름', '영어', '영상 옵션 기법(T)'] + [ED_CODE[e] for e in ED_ORDER] + \
           ['상태', '하는 일', '영상에서 보이는 모습', '목적', '타이밍', '보배드림 사례', 'AS24 사례', '설정값(cfg)', '규칙 파일', '코드 위치', '메모']
    rows = [head]
    for i in C['items']:
        ed = i.get('ed', [])
        rows.append([i['code'], KIND.get(i['kind'], i['kind']), i.get('group', ''), i['ko'], i.get('en', ''), tcode.get(i['ko'], '')] +
                    ['O' if e in ed else '' for e in ED_ORDER] +
                    [i['status'], i.get('what', ''), i.get('look', ''), i.get('purpose', ''), j(i.get('timing')),
                     j(i.get('example_bobae')), j(i.get('example_as24')), j(i.get('cfg')), j(i.get('rules')),
                     i.get('impl') or i.get('file') or '', j(i.get('note'))])
    tabs['편집방법_전체'] = rows

    by_name = {i['ko']: i['code'] for i in C['items']}
    by_name.update({v: by_name[k] for k, v in ALIAS.items() if k in by_name})
    tabs['영상옵션기능편집_T'] = [['T 코드', '이름', '영어', '언제 쓰나', '값', '영상당 최대', '예시', '카탈로그 코드']] + [
        [t['id'], t['name'], t.get('en', ''), t.get('trigger', ''), j(t.get('params')), j(t.get('max_per_video')), t.get('example', ''),
         by_name.get(t['name'], '')] for t in FER['techniques']]

    tabs['옵션표시'] = [['id', '이름', '낱말', '부위', '그림', '효과음', '필수', '확정 편집']] + [
        [o['id'], o['name'], ', '.join(o.get('keywords', [])), o.get('part', ''), j(o.get('visual', {})),
         o.get('sfx', ''), 'O' if o.get('required') else '', (o.get('fixed_edit') or {}).get('what', '')] for o in OVR['options']]

    json.dump({'version': C['version'], 'updated': C.get('updated'), 'tabs': tabs}, sys.stdout, ensure_ascii=False)


if __name__ == '__main__':
    main()
