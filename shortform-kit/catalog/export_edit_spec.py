"""편집 유형 · 영상 옵션·기능 편집(T01~T08) · 사진판 옵션 표시 · 편집 방법 전체를
한 문서(shortform-kit/EDIT-SPEC.md)로 만든다. 숫자는 손으로 적지 않고 규칙 파일에서 읽는다.

python3 shortform-kit/catalog/export_edit_spec.py   → shortform-kit/EDIT-SPEC.md 다시 씀
규칙 파일을 고치면 이 스크립트를 다시 돌린다(손으로 EDIT-SPEC.md를 고치지 않는다).
"""
import json, os, re, subprocess

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
G = 'https://github.com/bobaekimboae/bobaedream/blob/main/'
V1 = 'https://bobaekimboae.github.io/bobaedream/shortform-samples/g350-v1/g350-v1.mp4'
P = {
    'cat': 'shortform-kit/catalog/techniques.json',
    'lock': 'scripts/shortform/edition_lock.json',
    'be': 'scripts/shortform/be_locked_rules.json',
    'fer': 'scripts/shortform/video_listing/feature_edit_rules.json',
    'ovr': 'scripts/shortform/photo_listing/option_visual_rules.json',
    'pz': 'scripts/shortform/photo_listing/part_zoom_rules.json',
    'planner': 'scripts/shortform/video_listing/feature_edit_planner.py',
    'render': 'scripts/shortform/video_listing/g350_v8_render.py',
}
J = lambda k: json.load(open(os.path.join(ROOT, P[k]), encoding='utf-8'))
ED_KO = {'photo': 'ED-PHOTO', 'simple': 'ED-SIMPLE', '3d': 'ED-3D', 'asmr': 'ED-ASMR'}


def ver(k):
    d = J(k); h = subprocess.run(['git', 'log', '-1', '--format=%h', '--', P[k]], cwd=ROOT, capture_output=True, text=True).stdout.strip()
    return f"{d.get('version', '')} · 커밋 {h}"


def lines(k, pat):
    out = []
    for n, l in enumerate(open(os.path.join(ROOT, P[k]), encoding='utf-8'), 1):
        if re.search(pat, l): out.append(n)
    return out


def link(k, ln=None):
    return f"[`{P[k]}{':' + str(ln) if ln else ''}`]({G}{P[k]}{'#L' + str(ln) if ln else ''})"


def esc(s):
    return str(s).replace('|', '\\|').replace('\n', ' ')


def jv(v):
    if isinstance(v, (dict, list)): return esc(json.dumps(v, ensure_ascii=False))
    return esc(v)


def tsec(ex):
    m = re.findall(r'(\d+(?:\.\d+)?)초', ex or '')
    return [float(x) for x in m]


def main():
    C, L, B, F, O = J('cat'), J('lock'), J('be'), J('fer'), J('ovr')
    items = C['items']; byref = {}
    for i in items:
        for r in i.get('refs', []): byref.setdefault(r, []).append(i['code'])
    alias = {'옵션 체크 목록': '✓ 목록 쌓기'}
    name2code = {i['ko']: i['code'] for i in items}
    for k, v in alias.items():
        if k in name2code: name2code[v] = name2code[k]
    o = []
    w = o.append
    w('# 보배드림 숏폼 편집 명세 — 편집 유형 · 옵션 기능 편집 · 옵션 표시')
    w('')
    w('> 이 문서는 `shortform-kit/catalog/export_edit_spec.py`가 규칙 파일에서 **자동으로 만든다**. 숫자를 여기서 고치지 말고 규칙 파일을 고친 뒤 스크립트를 다시 돌린다.')
    w('')
    w('| 원본(값의 단일 기준) | 버전 |')
    w('|---|---|')
    for k in ['cat', 'lock', 'be', 'fer', 'ovr', 'pz']:
        w(f'| {link(k)} | {ver(k)} |')
    w('')
    w('읽는 순서: ① 편집 유형에서 판을 고른다 → ② 그 판의 필수·금지 기법을 확인한다 → ③ 영상 매물이면 T01~T08, 사진 매물이면 옵션 표시 규칙으로 옵션을 표현한다 → ④ 편집 방법 전체 표에서 코드·구현 위치를 찾는다.')
    w('')
    # 0 용어
    w('## 0. 용어')
    w('')
    w('| 말 | 뜻 |'); w('|---|---|')
    for k, v in C['terms'].items(): w(f'| {k} | {esc(v)} |')
    for k, v in C['status_values'].items(): w(f'| 상태 「{k}」 | {esc(v)} |')
    w('')
    # 1 편집 유형
    w('## 1. 편집 유형(판) 4가지')
    w('')
    w('| 코드 | 이름 | 소재 | 소리 | 상태 | 렌더러 | 고정 구성 |'); w('|---|---|---|---|---|---|---|')
    for e in C['editions']:
        w(f"| {e['code']} | {esc(e['ko'])} | {esc(e['input'])} | {esc(e['sound'])} | {e['status']} | {('`' + e['impl'] + '`') if e['impl'] else '없음'} | {esc(' / '.join(e['fixed']))} |")
    w('')
    for e in C['editions']:
        code = e['code']; lk = L['editions'].get(code, {})
        key = [k for k, v in ED_KO.items() if v == code][0]
        mine = [i for i in items if key in i.get('ed', [])]
        w(f"### {code} · {e['ko']}")
        w('')
        w(f"- **소재**: {esc(e['input'])}")
        w(f"- **소리**: {esc(e['sound'])}")
        w(f"- **상태**: {e['status']}")
        if lk:
            w(f"- **렌더러(하나만 씀)**: `{lk['renderer']}`")
            if lk.get('prep'): w(f"- **준비 스크립트**: " + ' · '.join(f'`{x}`' for x in lk['prep']))
            w(f"- **장면 순서**: {lk.get('order', '')} — {esc(lk.get('_order', ''))}" if lk.get('_order') else f"- **장면 순서**: {lk.get('order', '')}")
            g = lk.get('golden', {})
            if g: w(f"- **기준 영상(골든)**: {g.get('name')} (커밋 {g.get('commit')}, 렌더러 `{g.get('renderer')}`)")
            w(f"- **반드시 들어가는 기법**: " + ', '.join(f'`{x}`' for x in lk.get('required', [])))
            if lk.get('_techniques'):
                for k2, v2 in lk['_techniques'].items(): w(f"  - `{k2}` = {esc(v2)}")
            if lk.get('required_if'):
                w('- **조건부 필수**:')
                for k2, v2 in lk['required_if'].items(): w(f"  - `{k2}` — {esc(v2)}")
            w(f"- **금지**: " + ', '.join(f'`{x}`' for x in lk.get('forbidden', [])))
            if lk.get('voice'): w(f"- **음성**: {jv(lk['voice'])} (생성 1회, 재시도 금지)")
            if lk.get('words'): w(f"- **자막 글자**: {esc(lk['words'])}")
            w('- **검사(하나라도 실패하면 전달 금지)**:')
            for c in lk.get('checks', []): w(f'  - {esc(c)}')
        else:
            w('- **렌더러**: 아직 없음(계획). `edition_lock.json`에 판 항목이 생기면 이 문서에 자동으로 나온다.')
        grp = {}
        for i in mine: grp.setdefault((i['kind'], i.get('group', '')), []).append(i)
        w(f"- **이 판에서 쓸 수 있는 편집 방법**: {len(mine)}개")
        w('')
        w('| 종류 | 분류 | 코드 · 이름(상태) |'); w('|---|---|---|')
        kind_ko = {'segment': '편집 구성', 'technique': '편집 기법', 'asset': '자산'}
        for (k2, g2), lst in sorted(grp.items()):
            w(f"| {kind_ko.get(k2, k2)} | {g2} | " + ' · '.join(f"{i['code']} {esc(i['ko'])}({i['status']})" for i in lst) + ' |')
        w('')
    w('공통 고정 값(색·칩 글자 크기·자막 높이·효과음 개수·음량)은 ' + link('be') + ' 한 곳. 판마다 다르지 않다.')
    w('')
    # 2 T01~T08
    pl = {t: lines('planner', rf'# {t}\b') for t in ['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08']}
    rl = {t: lines('render', rf'{t}\b') for t in pl}
    w('## 2. 영상 옵션·기능 편집 기법 T01~T08 (ED-SIMPLE)')
    w('')
    w(f"대본(낱말 시각)과 컷 목록을 넣으면 계획기({link('planner')})가 컷마다 기법을 고르고, 렌더러({link('render')})가 그린다. 값은 {link('fer')}.")
    w('')
    w('### 2-1. 한눈에')
    w('')
    w('| T | 이름 | 언제 | 영상당 최대 | 카탈로그 코드 | G350 버전 1 예시 |'); w('|---|---|---|---|---|---|')
    for t in F['techniques']:
        secs = tsec(t.get('example'))
        ex = esc(t.get('example', ''))
        if secs: ex += ' · ' + ' '.join(f'[▶{s:g}초]({V1}#t={s:g})' for s in secs[:3])
        w(f"| {t['id']} | {esc(t['name'])} ({t['en']}) | {esc(t['trigger'])} | {t['max_per_video']} | {name2code.get(t['name'], '')} | {ex} |")
    w('')
    w('### 2-2. 옵션 분류 — 계획기가 대본 낱말로 옵션을 찾고, 그 분류로 기법을 고른다')
    w('')
    w('| 분류 | 무엇 | 주로 쓰는 기법 |'); w('|---|---|---|')
    use = {'lighting': 'T05 스포트라이트', 'small_control': 'T06 돋보기 → 없으면 T08 부위 당기기', 'action_result': 'T01 위아래 2분할',
           'group_list': 'T02 ✓ 목록', 'number': 'T04 카운트업 · T07 마력 흔들림', 'spec_burst': 'T03 점프컷'}
    for k, v in F['option_classes'].items(): w(f'| `{k}` | {esc(v)} | {use.get(k, "")} |')
    w('')
    w('| 옵션 키 | 이름 | 알아듣는 낱말 | 분류 | 부위 |'); w('|---|---|---|---|---|')
    for x in F['options']: w(f"| `{x['key']}` | {esc(x['ko'])} | {esc(', '.join(x.get('words', [])))} | `{x.get('class', '')}` | {x.get('part', '')} |")
    w('')
    w(f"- 제원 낱말(T03): {', '.join(F['spec_words'])}")
    w(f"- 카운트업 단위(T04): {', '.join(F['count_up_units'])} · 제외: {', '.join(F['count_up_exclude'])}")
    w(f"- 작은 부위 기준(T06): 부위 상자가 화면의 {F['small_part_frac'] * 100:g}% 미만")
    w(f"- 빛나는 장면 기준(T05): 밝은 쪽 상위 5% − 중앙값 ≥ {F['glow_contrast']}")
    w('')
    w('### 2-3. 기법별 상세')
    w('')
    for t in F['techniques']:
        tid = t['id']
        w(f"#### {tid} {t['name']} ({t['en']})")
        w('')
        w(f"- **언제 쓰나**: {esc(t['trigger'])}")
        w(f"- **영상당 최대**: {t['max_per_video']}번")
        w(f"- **예시**: {esc(t.get('example', ''))}" + (' — ' + ' '.join(f'[▶{s:g}초]({V1}#t={s:g})' for s in tsec(t.get('example'))[:4]) if tsec(t.get('example')) else ''))
        w(f"- **카탈로그**: {name2code.get(t['name'], '없음')}" + (f" · 이 T를 참조하는 항목: {', '.join(byref[tid])}" if byref.get(tid) else ''))
        w(f"- **계획기 코드**: " + (', '.join(link('planner', n) for n in pl[tid]) if pl[tid] else '없음'))
        w(f"- **렌더 코드**: " + (', '.join(link('render', n) for n in rl[tid][:4]) if rl[tid] else '없음'))
        w('')
        w('| 값 이름 | 값 |'); w('|---|---|')
        for k, v in t.get('params', {}).items(): w(f'| `{k}` | {jv(v)} |')
        w('')
    w('### 2-4. 기법끼리의 규칙')
    w('')
    w('- 2분할(T01)·✓ 목록(T02) 컷은 칩이 위 띠 제목이 되고 화살표를 그리지 않는다.')
    w('- 돋보기(T06)·✓ 목록(T02)이 있는 컷에는 부위 당기기(T08)를 걸지 않는다. 컷이 짧으면(1.5초 미만) T08도 없다.')
    w('- 점프컷(T03)은 그 컷의 기본 천천히 다가가기(slow_push)를 대신한다.')
    w('- 큰 숫자가 뜨는 동안 말 자막을 숨긴다. 번호판 위에 큰 숫자가 오면 자막 자리로 내린다(G350 버전 1 견인고리 컷).')
    w('- 칩·큰 숫자·화살표는 번호판을 덮지 않는다(edit_gate plate_check).')
    w('')
    w('### 2-5. 칩 · 화살표 · 큰 숫자 · 움직임 · 검사 값')
    w('')
    w('| 묶음 | 값 이름 | 값 |'); w('|---|---|---|')
    for grp in ['mapping', 'chip', 'caption', 'big_number', 'default_motion', 'qa']:
        for k, v in F[grp].items(): w(f'| {grp} | `{k}` | {jv(v)} |')
    w('')
    # 3 사진판 옵션 표시
    w('## 3. 사진판(ED-PHOTO) 옵션 표시 — 옵션 문장 하나 = 그림 하나')
    w('')
    w(f"값: {link('ovr')}. 나세르(Nasser Hessien) 영상 관찰 비율(`나세르%`)을 기준으로 정했다.")
    w('')
    w('| id | 이름 | 알아듣는 낱말 | 부위 | 그림 | 효과음 | 필수 | 나세르% | 나세르 방식 |'); w('|---|---|---|---|---|---|---|---|---|')
    for x in O['options']:
        w(f"| `{x['id']}` | {esc(x['name'])} | {esc(', '.join(x.get('keywords', [])))} | {x.get('part', '')} | {jv(x.get('visual', {}))} | {x.get('sfx', '')} | {'필수' if x.get('required') else ''} | {x.get('nasser_pct', '')} | {esc(x.get('nasser_method', ''))} |")
    w('')
    w('### 3-1. 배치 규칙(layout)')
    w('')
    w('| 규칙 | 값 |'); w('|---|---|')
    for k, v in O['layout'].items(): w(f'| `{k}` | {jv(v)} |')
    w('')
    for sec in ['rules', 'numbers_on_screen', 'narration_rules']:
        if O.get(sec):
            w(f'### 3-{["rules", "numbers_on_screen", "narration_rules"].index(sec) + 2}. {sec}')
            w('')
            v = O[sec]
            if isinstance(v, dict):
                w('| 규칙 | 값 |'); w('|---|---|')
                for k2, v2 in v.items(): w(f'| `{k2}` | {jv(v2)} |')
            elif isinstance(v, list):
                for x in v: w(f'- {jv(x)}')
            else: w(esc(v))
            w('')
    fm = C.get('feature_map', {})
    if fm:
        w('### 3-5. 옵션 표시 코드(FM-*)')
        w('')
        w(esc(fm.get('_what', '')))
        w('')
        w('| 코드 | 이름 | 모습 | 구현 |'); w('|---|---|---|---|')
        for b in fm.get('bundles', []): w(f"| {b['code']} | {esc(b['ko'])} | {esc(b['look'])} | `{b['impl']}` |")
        w('')
    # 4 전체
    w('## 4. 편집 방법 전체 (구성·기법·자산)')
    w('')
    w('| 코드 | 종류 | 분류 | 이름 | 판 | 상태 | 하는 일 | 보이는 모습 | 구현 · 규칙 | 참고(S=AS24 스킬, T=옵션 기법) |'); w('|---|---|---|---|---|---|---|---|---|---|')
    kind_ko = {'segment': '구성', 'technique': '기법', 'asset': '자산'}
    for i in items:
        eds = ' '.join(ED_KO[e].replace('ED-', '') for e in ['photo', 'simple', '3d', 'asmr'] if e in i.get('ed', []))
        impl = i.get('impl') or i.get('file') or ''
        rules = i.get('rules', '')
        w(f"| {i['code']} | {kind_ko.get(i['kind'], i['kind'])} | {esc(i.get('group', ''))} | {esc(i['ko'])} | {eds} | {i['status']} | {esc(i.get('what', ''))} | {esc(i.get('look', ''))} | {('`' + impl + '`') if impl else ''}{(' · `' + rules + '`') if rules else ''} | {', '.join(i.get('refs', []))} |")
    w('')
    w('## 5. 바꾸는 법')
    w('')
    w('1. 값은 위 원본 파일에서만 고친다. 규칙 값(`be_locked_rules.json` · `edition_lock.json`)은 사용자가 말할 때만 바꾼다.')
    w('2. 새 기법·구성은 `techniques.json`에 항목을 더하고 `python3 shortform-kit/catalog/build.py`로 검사한다.')
    w('3. 이 문서를 다시 만든다: `python3 shortform-kit/catalog/export_edit_spec.py`')
    w('4. 시트 사본을 갱신한다: `export_attr_table.py`(30~33 탭) · `export_rules_sheet.py`(40~46 탭) · `export_doc_index.py`(01 탭)')
    w('5. `shortform-kit/CHANGELOG.md` 맨 위에 한 줄, 버전 번호 규칙은 `shortform-kit/PIPELINE.md` 4장.')
    w('')
    open(os.path.join(ROOT, 'shortform-kit/EDIT-SPEC.md'), 'w', encoding='utf-8').write('\n'.join(o) + '\n')
    print('EDIT-SPEC.md', len(o), '줄')


if __name__ == '__main__':
    main()
