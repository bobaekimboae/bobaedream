"""구글 시트 사본용 표 만들기. 원본은 깃허브(techniques.json 등), 시트는 보기용 사본.

python3 shortform-kit/catalog/export_sheet.py > /tmp/sheet.json
출력: {"탭 이름": [[머리줄...], [행...], ...], ...}
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build

ROOT = build.ROOT
KIT = os.path.join(ROOT, 'shortform-kit')


def eds(i):
    return ' '.join(build.ED_KO[e] for e in build.ED_KO if e in i.get('ed', []))


def tabs():
    C, items, lib, fer = build.load()
    T = {}
    T['편집 유형'] = [['코드', '이름', '소재', '소리', '고정 구성', '상태']] + [
        [e['code'], e['ko'], e['input'], e['sound'], ' / '.join(e['fixed']), e['status']] for e in C['editions']]
    kinds = {'segment': '편집 구성', 'technique': '편집 기법', 'feature': '옵션 표시', 'asset': '자산'}
    T['편집 기법 사전'] = [['코드', '종류', '분류', '이름', '영어', '목적', '영상에서 보이는 모습', '쓰는 유형', '상태', '보배드림 사례', '메모', '코드 위치']] + [
        [i['code'], kinds[i['kind']], i.get('group', ''), i['ko'], i.get('en', ''), i.get('purpose', ''), i.get('look', ''),
         eds(i), i['status'], i.get('example_bobae', ''), i.get('note', ''), i.get('impl') or i.get('file') or ''] for i in items]
    ovr = json.load(open(build.OVR, encoding='utf-8'))
    T['옵션 표시'] = [['id', '이름', '낱말', '부위', '그림', '효과음', '필수', '확정 편집']] + [
        [o['id'], o['name'], ', '.join(o['keywords']), o['part'], json.dumps(o.get('visual', {}), ensure_ascii=False),
         o.get('sfx', ''), 'O' if o.get('required') else '', (o.get('fixed_edit') or {}).get('what', '')] for o in ovr['options']]
    lay = ovr.get('layout', {})
    rows = [['구분', '값', '설명']]
    for k in ('horsepower_sfx', 'metaphor_sfx', 'icon_sfx'):
        if k in lay:
            v = lay[k]
            rows.append([k, json.dumps({x: y for x, y in v.items() if x != 'note'}, ensure_ascii=False), v.get('note', '')])
    be = json.load(open(os.path.join(ROOT, 'scripts/shortform/be_locked_rules.json'), encoding='utf-8'))
    for s in be.get('user_locked', []):
        rows.append(['사용자 확정(벨기에판)', s, ''])
    T['확정 규칙'] = rows
    cl = open(os.path.join(KIT, 'CHANGELOG.md'), encoding='utf-8').read()
    rows, ver = [['버전', '내용']], ''
    for line in cl.splitlines():
        m = re.match(r'## (v[\d.]+ · [\d-]+)', line)
        if m:
            ver = m.group(1)
        elif line.startswith('- ') and ver:
            rows.append([ver, line[2:]])
    T['변경 기록'] = rows
    rm = open(os.path.join(KIT, 'ROADMAP.md'), encoding='utf-8').read()
    rows = [['구역', '상태', '할 일']]
    for blk in rm.split('\n## ')[1:]:
        lines = blk.splitlines()
        sec = lines[0]
        boxes = [re.match(r'- \[( |x|~)\] (.+)', l) for l in lines[1:]]
        boxes = [m for m in boxes if m]
        if sec.startswith('0.'):
            continue
        if not boxes:
            rows.append([sec.split(' — ')[0], '할 일', sec])
        for m in boxes:
            rows.append([sec, {' ': '할 일', 'x': '끝', '~': '하는 중'}[m.group(1)], m.group(2)])
    T['해야 할 일'] = rows
    rows = [['종류', '파일', '출처·라이선스']]
    for kind in ('sfx', 'bgm'):
        p = os.path.join(ROOT, f'public/assets/shortform/{kind}/README.md')
        if os.path.exists(p):
            for line in open(p, encoding='utf-8'):
                if line.startswith('|') and not line.startswith('|---') and '파일' not in line:
                    c = [x.strip() for x in line.strip().strip('|').split('|')]
                    rows.append([kind, c[0], ' · '.join(c[1:])])
                elif line.startswith('- `'):
                    rows.append([kind, line.split('`')[1], line.split(':', 1)[1].strip() if ':' in line else ''])
    T['소리 출처'] = rows
    return T


if __name__ == '__main__':
    print(json.dumps(tabs(), ensure_ascii=False))
