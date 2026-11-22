"""편집 기법 사전 빌드·검사.

python3 shortform-kit/catalog/build.py          # CATALOG.md 다시 만들고 검사
python3 shortform-kit/catalog/build.py --check  # 검사만(파일 안 씀). 실패하면 종료 코드 1

하는 일
1. techniques.json(손으로 정한 항목) + option_visual_rules.json(옵션 표시) + library_v2.json(AS24 관찰 스킬 53개)
   + feature_edit_rules.json(실촬영 기법 T01~) 를 하나로 합친다.
2. 검사: 코드 중복, impl 파일·함수가 실제로 있는지, refs(S###·T##)가 있는지, asset 코드가 있는지,
   ed(유형) 값이 맞는지, 상태 값이 맞는지.
3. 사람용 CATALOG.md 를 만든다(직접 고치지 않는다).
"""
import json, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'techniques.json')
OVR = os.path.join(ROOT, 'scripts/shortform/photo_listing/option_visual_rules.json')
LIB = os.path.join(ROOT, 'scripts/shortform/edit_skills/library_v2.json')
FER = os.path.join(ROOT, 'scripts/shortform/video_listing/feature_edit_rules.json')
OUT = os.path.join(HERE, 'CATALOG.md')
ED = {'photo': 'ED-PHOTO', 'simple': 'ED-SIMPLE', '3d': 'ED-3D', 'asmr': 'ED-ASMR'}
ED_KO = {'photo': '① 사진', 'simple': '② 심플', '3d': '③ 3D', 'asmr': '④ ASMR'}
# 목적(재미·정보) 기본값 — 항목에 purpose 가 없으면 분류로 정한다
PURPOSE_BY_GROUP = {'첫 화면': '재미', '마무리': '둘 다', '컷 넘김': '재미', '효과음': '재미', '움직임': '재미', '3D': '둘 다',
                    '기호': '둘 다', '음악·음성': '둘 다', '자막': '정보', '칩': '정보', '목록': '정보', '카드 정보': '정보',
                    '카탈로그': '정보', '신뢰': '정보', '딜러': '정보', '소리': '재미', '구성': '정보', '화면 삽입': '정보',
                    '설명': '정보', '옵션 표시': '정보'}
PURPOSES = ('재미', '정보', '둘 다')


def load():
    C = json.load(open(SRC, encoding='utf-8'))
    items = list(C['items'])
    ovr = json.load(open(OVR, encoding='utf-8'))
    for o in ovr['options']:
        v = o.get('visual', {})
        look = ' + '.join(x for x in [v.get('emo', ''), (v.get('text3d') or '') and f"3D 글자 {v['text3d']}", v.get('label', '') and f"「{v['label']}」"] if x)
        items.append({'code': 'FM-' + o['id'].upper().replace('_', '-'), 'kind': 'feature', 'group': '옵션 표시',
                      'ko': o['name'], 'en': o['id'], 'what': f"{'·'.join(o['keywords'][:4])} 말할 때 {o['part']} 부위에 표시",
                      'look': look, 'ed': ['photo', 'simple', '3d'], 'status': '구현',
                      'impl': 'scripts/shortform/photo_listing/auto_visuals.py:build',
                      'rules': f"scripts/shortform/photo_listing/option_visual_rules.json#options.{o['id']}",
                      'sfx': o.get('sfx', ''), 'required': o.get('required'),
                      **({'note': f"확정 편집: {o['fixed_edit']['technique']} — {o['fixed_edit']['what']} ({o['fixed_edit']['decided']})"} if o.get('fixed_edit') else {})})
    for b in C['feature_map']['bundles']:
        items.append({'kind': 'feature', 'group': '옵션 표시', 'en': b['code'].lower(), 'what': '', 'ed': ['photo', 'simple', '3d'],
                      'status': '구현', **b})
    for i in items:
        if i['kind'] != 'asset':
            i.setdefault('purpose', PURPOSE_BY_GROUP.get(i.get('group', ''), '정보'))
    lib = json.load(open(LIB, encoding='utf-8'))['skills']
    fer = json.load(open(FER, encoding='utf-8'))['techniques']
    return C, items, lib, fer


def check(C, items, lib, fer):
    err = []
    codes = [i['code'] for i in items]
    for c in set(codes):
        if codes.count(c) > 1:
            err.append(f'코드 중복: {c}')
    S = {s['id'] for s in lib} | {t['id'] for t in fer}
    for i in items:
        for k in ('code', 'kind', 'ko', 'status'):
            if not i.get(k):
                err.append(f"{i.get('code')}: {k} 없음")
        if i['status'] not in C['status_values']:
            err.append(f"{i['code']}: 상태 값 {i['status']}")
        if i['kind'] != 'asset' and i.get('purpose') not in PURPOSES:
            err.append(f"{i['code']}: 목적 값 {i.get('purpose')}")
        for e in i.get('ed', []):
            if e not in ED:
                err.append(f"{i['code']}: 유형 값 {e}")
        for r in i.get('refs', []):
            if r not in S:
                err.append(f"{i['code']}: 참조 {r} 없음")
        if i.get('asset') and i['asset'] not in codes:
            err.append(f"{i['code']}: 자산 {i['asset']} 없음")
        for key in ('impl', 'rules', 'file'):
            p = i.get(key) or ''
            if not p:
                continue
            path, _, name = p.partition(':') if key == 'impl' else p.partition('#')
            fp = os.path.join(ROOT, path)
            if not os.path.exists(fp):
                err.append(f"{i['code']}: {key} 파일 없음 {path}")
            elif key == 'impl' and name and not re.search(rf'^\s*def {re.escape(name)}\b', open(fp, encoding='utf-8').read(), re.M):
                err.append(f"{i['code']}: 함수 {name} 없음 ({path})")
        if i['status'] in ('구현', '일부') and i['kind'] != 'asset' and not i.get('impl'):
            err.append(f"{i['code']}: 상태 {i['status']}인데 impl 없음")
    return err


def md(C, items, lib, fer):
    L = [f"# 숏폼 편집 기법 사전 v{C['version']}", '',
         f"> 이 파일은 `build.py`가 `techniques.json`으로 자동으로 만듭니다. 직접 고치지 마세요. 갱신: {C['updated']}", '',
         '## 용어', '']
    for k, v in C['terms'].items():
        L.append(f'- **{k}** — {v}')
    L += ['', '## 상태 표시', ''] + [f'- **{k}**: {v}' for k, v in C['status_values'].items()]
    L += ['', '## 편집 유형', '', '| 코드 | 이름 | 소재 | 소리 | 고정 구성 | 상태 |', '|---|---|---|---|---|---|']
    for e in C['editions']:
        L.append(f"| `{e['code']}` | {e['ko']} | {e['input']} | {e['sound']} | {' / '.join(e['fixed'])} | {e['status']} |")
    groups = [('segment', '편집 구성'), ('technique', '편집 기법'), ('feature', '옵션 표시'), ('asset', '자산')]
    for kind, title in groups:
        rows = [i for i in items if i['kind'] == kind]
        L += ['', f'## {title} ({len(rows)}개)', '',
              '| 코드 | 분류 | 이름 | 영어 이름 | 목적 | 영상에서 보이는 모습 | ' + ' | '.join(ED_KO.values()) + ' | 상태 | 코드 위치 |',
              '|---|---|---|---|---|---|' + '---|' * len(ED_KO) + '---|---|']
        for i in rows:
            eds = ' | '.join('○' if e in i.get('ed', []) else '' for e in ED_KO)
            note = f" ⚠ {i['note']}" if i.get('note') else ''
            L.append(f"| `{i['code']}` | {i.get('group', '')} | {i['ko']} | {i.get('en', '')} | {i.get('purpose', '')} | {i.get('look', '')}{note} | {eds} | {i['status']} | `{i.get('impl') or i.get('file') or ''}` |")
    ex = [i for i in items if i.get('example_bobae')]
    L += ['', f'## 사례 예제 — 보배드림에서 이렇게 쓴다 ({len(ex)}개)', '',
          '재미와 정보를 함께 주기 위한 기법들. AS24 예시 링크는 참고용(원본 영상은 저장소에 넣지 않음).', '']
    for i in ex:
        links = ' · '.join(f'[예{n + 1}]({u})' for n, u in enumerate(i.get('example_as24', [])[:3]))
        L += [f"### `{i['code']}` {i['ko']} — {i['purpose']}", '',
              f"- 무엇: {i.get('what', '')}", f"- 영상에서 보이는 모습: {i.get('look', '')}",
              f"- **보배드림 사례:** {i['example_bobae']}"]
        if i.get('timing'):
            L.append(f"- 크기·길이: {i['timing']}")
        if links:
            L.append(f"- AS24 원본 장면: {links}")
        L.append('')
    bal = {p: sum(1 for i in items if i.get('purpose') == p) for p in PURPOSES}
    L += ['## 목적 균형', '', f"재미 {bal['재미']} · 정보 {bal['정보']} · 둘 다 {bal['둘 다']} — 한 영상에 재미 기법과 정보 기법이 둘 다 들어가야 한다.", '']
    todo = [i for i in items if i['status'] in ('일부', '계획')]
    L += ['', f'## 해야 할 일 — 상태가 일부·계획인 항목 ({len(todo)}개)', '']
    for i in todo:
        L.append(f"- `{i['code']}` {i['ko']} — {i['status']}" + (f": {i['note']}" if i.get('note') else ''))
    cover = {}
    for i in items:
        for r in i.get('refs', []):
            cover.setdefault(r, []).append(i['code'])
    L += ['', '## AS24 관찰 스킬 53개 → 우리 코드 대응표', '',
          '`edit_skills/library_v2.json`(AS24 네덜란드·벨기에 397편 조사)의 스킬 번호가 우리 표준 이름 어디에 해당하는지. 빈칸은 아직 표준 이름 없음.', '',
          '| 번호 | 종류 | 관찰 내용 | 우리 코드 |', '|---|---|---|---|']
    for s in lib:
        L.append(f"| {s['id']} | {s['type']} | {s.get('note', '')} | {', '.join(f'`{c}`' for c in cover.get(s['id'], []))} |")
    L += ['', '## 실촬영 기법 T01~ → 우리 코드', '', '| 번호 | 이름 | 우리 코드 |', '|---|---|---|']
    for t in fer:
        L.append(f"| {t['id']} | {t['name']} ({t['en']}) | {', '.join(f'`{c}`' for c in cover.get(t['id'], []))} |")
    return '\n'.join(L) + '\n'


if __name__ == '__main__':
    C, items, lib, fer = load()
    err = check(C, items, lib, fer)
    n = {k: sum(1 for i in items if i['kind'] == k) for k in ('segment', 'technique', 'feature', 'asset')}
    print(f"항목 {len(items)}개 (구성 {n['segment']} · 기법 {n['technique']} · 옵션 표시 {n['feature']} · 자산 {n['asset']})")
    for e in err:
        print('실패:', e)
    if '--check' not in sys.argv:
        open(OUT, 'w', encoding='utf-8').write(md(C, items, lib, fer))
        print('CATALOG.md 만듦')
    sys.exit(1 if err else 0)
