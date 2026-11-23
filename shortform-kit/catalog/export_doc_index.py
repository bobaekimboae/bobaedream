"""클로드가 관리·기재하는 숏폼 깃허브 문서 전체 목록(구글 시트 「문서_목록」 탭 사본).

python3 shortform-kit/catalog/export_doc_index.py > 문서.json
출력: [[머리줄...], [행...], ...] — 구분 / 파일 / 제목 / 무엇에 쓰나 / 줄 수 / 마지막 커밋 / 깃허브 링크 / 배포 링크
"""
import glob, json, os, re, subprocess, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
G = 'https://github.com/bobaekimboae/bobaedream/blob/main/'
P = 'https://bobaekimboae.github.io/bobaedream/'
USE = {
    'shortform-kit/SKILLS-INDEX.md': '영상 만들기 전 먼저 여는 표: 기준 영상·스킬 13개·규칙 파일',
    'shortform-kit/README.md': '숏폼 키트 운영 규칙(버전 번호·폴더 구조)',
    'shortform-kit/CHANGELOG.md': '유일한 버전 기록(규칙·기법·영상 변경)',
    'shortform-kit/LESSONS.md': '실패 교훈(다시 하지 않을 것)',
    'shortform-kit/ROADMAP.md': '앞으로 할 일 순서',
    'shortform-kit/TOOLS.md': '쓰는 도구·라이선스',
    'shortform-kit/catalog/CATALOG.md': '편집 유형·구성·기법·옵션 표시·자산 전체 사전(자동 생성)',
    'shortform-kit/catalog/techniques.json': '카탈로그 원본 데이터 — 여기를 고치면 CATALOG.md·시트·노션 사본이 바뀜',
    'shortform-kit/catalog/build.py': '카탈로그 검사·CATALOG.md 생성',
    'shortform-kit/catalog/export_attr_table.py': '편집 유형·방법·T01~T08·옵션 표시 열 속성 표(시트·노션 공용)',
    'shortform-kit/catalog/export_doc_index.py': '이 문서 목록 만들기',
    'public/shortform-kit/index.html': '숏폼 편집 매뉴얼 화면(깃허브 페이지)',
    'docs/shortform/g350-v1-agent-handoff.md': 'G350 버전 1 — 에이전트 공용 기준 문서',
    'docs/shortform/as24-nl-be-edit-manual-v4.md': 'AS24 네덜란드·벨기에 편집 매뉴얼(최신)',
    'docs/shortform/as24-edit-skeleton-v3.md': '벨기에 편집 뼈대 교본',
    'scripts/shortform/be_locked_rules.json': '벨기에판 화면·소리 값의 단일 기준(사용자 확정)',
    'scripts/shortform/edition_lock.json': '편집 유형별 렌더러·필수/금지 기법',
    'scripts/shortform/video_listing/feature_edit_rules.json': '영상 옵션 기능 편집 T01~T08 값',
    'scripts/shortform/photo_listing/option_visual_rules.json': '옵션 표시(시트 아이콘·휠 인치 등) 규칙',
    'scripts/shortform/photo_listing/part_zoom_rules.json': '사진판 부위 당기기 규칙',
    'scripts/shortform/photo_listing/card_routine_rules.json': '카드 컷 루틴 규칙',
    'scripts/shortform/as24_edit_rules.json': 'AS24 칩 배치 규칙',
    'scripts/shortform/edit_skills/library_v2.json': 'AS24 관찰 스킬 53개(원본 쇼츠 링크 포함)',
    'scripts/shortform/video_listing/g350_v8_render.py': 'ED-SIMPLE 렌더러(G350 버전 1)',
    'scripts/shortform/video_listing/g350_v5_lib.py': '렌더러 공용 부품(붓칠 칩·3D 숫자)',
    'scripts/shortform/video_listing/g350_reproduce.sh': 'G350 재현 절차(단계별 시간 기록)',
    'scripts/shortform/video_listing/g350_track.py': '부위 따라가기(OpenCV CSRT)',
    'scripts/shortform/video_listing/feature_edit_planner.py': '옵션 기법 T01~T08 자동 계획',
    'scripts/shortform/photo_listing/common.py': 'ED-PHOTO 렌더러',
    'scripts/shortform/check_be.py': '렌더 후 벨기에 규칙 검사',
    'scripts/shortform/edit_gate.py': '렌더 전후 관문 검사(판·기법·싱크·안전영역·번호판)',
    'scripts/shortform/sfx_opensource/earshot_check.sh': '효과음 earshot 점검',
    'scripts/shortform/sfx_opensource/fetch_openverse.py': 'Openverse CC0 효과음 후보 받기',
    'public/assets/shortform/sfx/README.md': '효과음 출처·라이선스·earshot 점수',
    'public/assets/shortform/sfx/opensource/manifest.json': '오픈소스 효과음 29개 목록',
}


def last(f):
    return subprocess.run(['git', 'log', '-1', '--format=%h %ad', '--date=short', '--', f], cwd=ROOT,
                          capture_output=True, text=True).stdout.strip()


def title(f):
    s = open(os.path.join(ROOT, f), encoding='utf-8', errors='ignore').read()
    if f.endswith('.html'):
        m = re.search(r'<title>([^<]*)', s); return m.group(1).strip() if m else ''
    if f.endswith('SKILL.md'):
        m = re.search(r'^description:\s*"?(.*?)"?$', s, re.M); return m.group(1)[:140] if m else ''
    if f.endswith('.json'):
        try:
            d = json.loads(s)
            v = d.get('version', '') if isinstance(d, dict) else ''
            return (f'v{v} ' if v and not str(v).startswith('v') else (f'{v} ' if v else '')) + str(d.get('_what') or d.get('_note') or d.get('note') or '')[:100]
        except Exception:
            return ''
    m = re.search(r'"""(.*?)(\n|""")', s, re.S)
    if f.endswith('.py') and m: return m.group(1).strip()[:120]
    for l in s.splitlines():
        l = l.strip().lstrip('#').strip()
        if l and not l.startswith(('---', '!', 'import', 'set ', 'usr/bin')): return l[:120]
    return ''


def main():
    rows = [['구분', '파일', '제목', '무엇에 쓰나', '줄 수', '마지막 커밋', '깃허브 링크', '배포 링크']]

    def add(cat, f, deploy=''):
        fp = os.path.join(ROOT, f)
        if not os.path.exists(fp): return
        n = sum(1 for _ in open(fp, encoding='utf-8', errors='ignore'))
        rows.append([cat, f, title(f), USE.get(f, ''), n, last(f), G + f, deploy])

    g = lambda p: sorted(os.path.relpath(x, ROOT) for x in glob.glob(os.path.join(ROOT, p), recursive=True))
    for f in ['shortform-kit/SKILLS-INDEX.md', 'shortform-kit/README.md', 'shortform-kit/CHANGELOG.md', 'shortform-kit/LESSONS.md',
              'shortform-kit/ROADMAP.md', 'shortform-kit/TOOLS.md']: add('① 운영 문서', f)
    add('① 운영 문서', 'public/shortform-kit/index.html', P + 'shortform-kit/')
    for f in ['shortform-kit/catalog/CATALOG.md', 'shortform-kit/catalog/techniques.json'] + g('shortform-kit/catalog/*.py'): add('② 편집 카탈로그', f)
    for f in g('shortform-kit/skills/*/SKILL.md'): add('③ 스킬(claude.ai 스킬 사본)', f)
    for f in g('docs/shortform/*.md') + g('docs/shortform/*.json') + g('shortform-kit/research/**/*.md'): add('④ 매뉴얼·연구 문서', f)
    for f in ['scripts/shortform/be_locked_rules.json', 'scripts/shortform/edition_lock.json', 'scripts/shortform/video_listing/feature_edit_rules.json',
              'scripts/shortform/photo_listing/option_visual_rules.json', 'scripts/shortform/photo_listing/part_zoom_rules.json',
              'scripts/shortform/photo_listing/card_routine_rules.json', 'scripts/shortform/as24_edit_rules.json',
              'scripts/shortform/edit_skills/library_v2.json']: add('⑤ 규칙 파일(값의 단일 기준)', f)
    for f in ['scripts/shortform/video_listing/g350_v8_render.py', 'scripts/shortform/video_listing/g350_v5_lib.py',
              'scripts/shortform/video_listing/g350_reproduce.sh', 'scripts/shortform/video_listing/g350_track.py',
              'scripts/shortform/video_listing/feature_edit_planner.py', 'scripts/shortform/photo_listing/common.py',
              'scripts/shortform/check_be.py', 'scripts/shortform/edit_gate.py', 'scripts/shortform/sfx_opensource/earshot_check.sh',
              'scripts/shortform/sfx_opensource/fetch_openverse.py']: add('⑥ 렌더·검사 코드', f)
    add('⑦ 자산', 'public/assets/shortform/sfx/README.md')
    add('⑦ 자산', 'public/assets/shortform/sfx/opensource/manifest.json')
    for f in g('public/shortform-samples/*/index.html'):
        add('⑧ 배포 샘플 페이지', f, P + 'shortform-samples/' + f.split('/')[2] + '/')
    json.dump(rows, sys.stdout, ensure_ascii=False)


if __name__ == '__main__':
    main()
