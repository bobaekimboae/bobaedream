"""렌더 전 기본 설정 점검표 — edit_defaults.json. 2026-11-24.

사용자: 「우리 편집 매뉴얼 체크리스트 기본 먼저 만들어봐. 자꾸 틀려. 단 고정값이 아닌 기본 설정이라고」.
기본값은 바꿔도 된다. 대신 바꾼 항목은 작업 파일에 이유를 남겨야 하고, 이 점검표가 그것을 드러낸다.

사용:
  python3 scripts/shortform/edit_preflight.py                 # 기본 설정 전체를 점검표로 출력
  python3 scripts/shortform/edit_preflight.py 작업.json        # 작업이 기본값과 다른 곳을 표시
작업.json 모양:
  {"name": "roma-r17", "overrides": {"voice.character": {"value": "...", "reason": "사용자 지시 「…」"}}}
실패(종료 코드 1):
  - 바꾼 항목에 이유(reason)가 없음
  - 없는 항목 id
  - 잠금 항목(locked_ref)을 바꿈 → 그 값은 be_locked_rules.json · edition_lock.json에서만, 사용자가 말할 때 바꾼다
출력: 작업.json.preflight.md (작업 파일이 없으면 화면에만)
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, 'edit_defaults.json')))


def main():
    job = json.load(open(sys.argv[1])) if len(sys.argv) > 1 else {}
    ov = job.get('overrides', {})
    items = {it['id']: it for st in D['stages'] for it in st['items']}
    fails = [f'없는 항목: {k}' for k in ov if k not in items]
    md = [f"# 편집 기본 설정 점검표 — {job.get('name', '기본')}", '',
          f"기준 edit_defaults.json v{D['version']} ({D['updated']}) · 기본값은 바꿀 수 있음, 바꾸면 이유를 남김", '']
    changed = 0
    for st in D['stages']:
        md += [f"## {st['ko']}", '', '| 확인 | 항목 | 이번 값 | 비고 |', '|---|---|---|---|']
        for it in st['items']:
            o = ov.get(it['id'])
            if o is None:
                mark, val, note = '☐', it['default'], ('잠금: ' + it['locked_ref']) if it.get('locked_ref') else ''
            else:
                changed += 1
                val = f"**{o.get('value', '')}** (기본: {it['default']})"
                if it.get('locked_ref'):
                    mark, note = '✗', f"잠금 항목 — {it['locked_ref']}에서만 바꿈"; fails.append(f"잠금 항목 변경: {it['id']}")
                elif not str(o.get('reason', '')).strip():
                    mark, note = '✗', '이유 없음'; fails.append(f"이유 없이 변경: {it['id']}")
                else:
                    mark, note = '☐ 변경', '이유: ' + o['reason']
            md.append(f"| {mark} | {it['item']} | {val.replace('|', '/')} | {note.replace('|', '/')} |")
        md.append('')
    md += [f'기본값에서 바꾼 항목 {changed}개 · 실패 {len(fails)}건'] + [f'- ✗ {f}' for f in fails]
    md += ['', '렌더 뒤에는 `release_checklist.py 영상.mp4` — 종료 코드 0 + v13 시트 확인까지 끝나야 전달']
    text = '\n'.join(md) + '\n'
    if len(sys.argv) > 1: open(sys.argv[1] + '.preflight.md', 'w').write(text)
    print(text)
    sys.exit(1 if fails else 0)


if __name__ == '__main__':
    main()
